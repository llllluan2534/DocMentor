# backend/app/services/document_service.py

import mimetypes
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from fastapi import HTTPException, status, UploadFile
from typing import List, Dict, Optional
import logging
from datetime import datetime

from ..models.document import Document
from ..models.user import User
from ..schemas.document import DocumentResponse, DocumentList, DocumentStats
from ..utils.helpers import validate_file_type, validate_file_size, generate_unique_filename

from supabase import create_client, Client
from ..config import settings

logger = logging.getLogger(__name__)

try:
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    supabase = None

class DocumentService:
    @staticmethod
    async def upload_document(
        db: Session,
        file: UploadFile,
        user: User,
        title: Optional[str] = None
    ) -> Document:
        """Upload and save document to Supabase Storage"""
        
        if not supabase:
            raise HTTPException(status_code=503, detail="Storage service unavailable")

        # 1. Validate file
        file_ext = validate_file_type(file.filename)
        # Đọc file vào bộ nhớ (lưu ý: serverless function thường giới hạn RAM, file < 50MB thì ổn)
        content = await file.read() 
        file_size = len(content)
        validate_file_size(file_size)
        
        # 2. Generate unique path
        unique_filename = f"user_{user.id}/{generate_unique_filename(user.id, file.filename)}"
        
        # 3. Detect MIME type chính xác
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"

        try:
            logger.info(f"⬆️ Uploading to Supabase: {unique_filename} ({file_size} bytes)")
            
            # ✅ Upload to Bucket
            # upsert=True giúp ghi đè nếu file tên trùng (dù đã có timestamp để tránh)
            res = supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
                path=unique_filename,
                file=content,
                file_options={"content-type": mime_type, "upsert": "true"}
            )
            
            # ✅ Get Public URL
            public_url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(unique_filename)
            
            logger.info(f"✅ Upload success: {public_url}")

        except Exception as e:
            logger.error(f"❌ Supabase Upload Error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Upload failed: {str(e)}"
            )
        
        # 4. Save to DB
        document = Document(
            user_id=user.id,
            title=title or file.filename,
            file_path=public_url, # Lưu URL công khai
            file_type=file_ext[1:], # bỏ dấu chấm (.pdf -> pdf)
            file_size=file_size,
            metadata_={  
                "original_filename": file.filename,
                "storage_provider": "supabase",
                "storage_path": unique_filename, # Lưu path để sau này xóa file
                "mime_type": mime_type
            },
            processed=False
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return document

    @staticmethod
    def get_user_documents(
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        file_types: Optional[List[str]] = None,
        processed: Optional[bool] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        size_min: Optional[int] = None,
        size_max: Optional[int] = None,
        sort_by: str = "created_at",
        order: str = "desc"
    ) -> List[Document]:
        """Get documents for a user applying filters."""
        query = db.query(Document).filter(Document.user_id == user.id)

        if file_types:
            lower_types = [t.lower() for t in file_types]
            query = query.filter(Document.file_type.in_(lower_types))

        if processed is not None:
            query = query.filter(Document.processed.is_(processed))

        if date_from:
            query = query.filter(Document.created_at >= date_from)
        if date_to:
            query = query.filter(Document.created_at <= date_to)

        if size_min is not None:
            query = query.filter(Document.file_size >= size_min)
        if size_max is not None:
            query = query.filter(Document.file_size <= size_max)

        if search:
            safe = search.strip()
            if safe:
                query = query.filter(Document.title.ilike(f"%{safe}%"))

        sort_col = Document.created_at
        if sort_by == "updated_at": sort_col = Document.updated_at
        elif sort_by == "file_size": sort_col = Document.file_size
        elif sort_by == "title": sort_col = Document.title

        if order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_document_by_id(db: Session, document_id: int, user: User) -> Document:
        """Get single document by ID"""
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user.id
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        return document

    @staticmethod
    def update_document(
        db: Session,
        document_id: int,
        user: User,
        title: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Document:
        document = DocumentService.get_document_by_id(db, document_id, user)
        if title: document.title = title
        if metadata:
            if not document.metadata_: document.metadata_ = {}
            document.metadata_.update(metadata)
        db.commit()
        db.refresh(document)
        return document

    @staticmethod
    def count_user_documents(
        db: Session,
        user: User,
        search: Optional[str] = None,
        file_types: Optional[List[str]] = None,
        processed: Optional[bool] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        size_min: Optional[int] = None,
        size_max: Optional[int] = None
    ) -> int:
        q = db.query(Document).filter(Document.user_id == user.id)
        if file_types: q = q.filter(Document.file_type.in_([t.lower() for t in file_types]))
        if processed is not None: q = q.filter(Document.processed.is_(processed))
        if date_from: q = q.filter(Document.created_at >= date_from)
        if date_to: q = q.filter(Document.created_at <= date_to)
        if size_min is not None: q = q.filter(Document.file_size >= size_min)
        if size_max is not None: q = q.filter(Document.file_size <= size_max)
        if search and search.strip(): q = q.filter(Document.title.ilike(f"%{search.strip()}%"))
        return q.count()

    @staticmethod
    def delete_document(db: Session, document_id: int, user: User) -> bool:
        """Delete document from DB and Supabase"""
        document = DocumentService.get_document_by_id(db, document_id, user)
        
        # 1. Delete from Supabase
        try:
            storage_path = document.metadata_.get("storage_path") if document.metadata_ else None
            
            if storage_path and supabase:
                # Supabase remove takes a list of paths
                supabase.storage.from_(settings.SUPABASE_BUCKET).remove([storage_path])
                logger.info(f"🗑️ Deleted from Supabase: {storage_path}")
        except Exception as e:
            logger.error(f"⚠️ Failed to delete from Supabase: {e}")
            # Vẫn tiếp tục xóa trong DB để tránh rác data
        
        # 2. Delete from DB
        db.delete(document)
        db.commit()
        return True

    @staticmethod
    def get_user_stats(db: Session, user: User) -> DocumentStats:
        documents = db.query(Document).filter(Document.user_id == user.id).all()
        total_size = sum(doc.file_size for doc in documents)
        by_type = {}
        processed_count = 0
        for doc in documents:
            by_type[doc.file_type] = by_type.get(doc.file_type, 0) + 1
            if doc.processed: processed_count += 1
        
        return DocumentStats(
            total_documents=len(documents),
            total_size=total_size,
            by_type=by_type,
            processed_count=processed_count,
            unprocessed_count=len(documents) - processed_count
        )