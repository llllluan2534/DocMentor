# backend/app/services/document_service.py

from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from fastapi import HTTPException, status, UploadFile
from typing import List, Dict, Optional
import logging
import time
from datetime import datetime

from ..models.document import Document
from ..models.user import User
from ..schemas.document import DocumentResponse, DocumentStats
from ..utils.helpers import validate_file_type, validate_file_size, generate_unique_filename

# ✅ Import Supabase
from supabase import create_client, Client
from ..config import settings

logger = logging.getLogger(__name__)

# ✅ Khởi tạo Client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class DocumentService:
    @staticmethod
    async def upload_document(
        db: Session,
        file: UploadFile,
        user: User,
        title: Optional[str] = None
    ) -> Document:
        """Upload document to Supabase Storage"""
        
        # 1. Validate
        file_ext = validate_file_type(file.filename)
        content = await file.read()
        file_size = len(content)
        validate_file_size(file_size)
        
        # 2. Tạo tên file duy nhất (user_id/filename_timestamp)
        unique_filename = f"user_{user.id}/{generate_unique_filename(user.id, file.filename)}"
        
        try:
            logger.info(f"⬆️ Uploading to Supabase: {unique_filename}")
            
            # 3. Upload lên Bucket
            supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
                path=unique_filename,
                file=content,
                file_options={"content-type": file.content_type, "x-upsert": "true"}
            )
            
            # 4. Lấy Public URL
            # Kết quả trả về là URL string trực tiếp
            public_url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(unique_filename)
            
            logger.info(f"✅ Upload success: {public_url}")

        except Exception as e:
            logger.error(f"❌ Supabase Upload Error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Lỗi tải file lên Cloud Storage. Vui lòng thử lại."
            )
        
        # 5. Lưu vào DB (Lưu URL vào file_path)
        document = Document(
            user_id=user.id,
            title=title or file.filename,
            file_path=public_url, # ⚡ Quan trọng: Lưu URL thay vì đường dẫn cục bộ
            file_type=file_ext[1:], 
            file_size=file_size,
            metadata_={  
                "original_filename": file.filename,
                "storage_provider": "supabase",
                "storage_path": unique_filename, # Lưu path để sau này xóa
                "mime_type": file.content_type
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
        """Get documents for a user applying filters, sorting and pagination."""
        query = db.query(Document).filter(Document.user_id == user.id)

        # Filters
        if file_types:
            # normalize lower-case to avoid mismatch
            lower_types = [t.lower() for t in file_types]
            query = query.filter(Document.file_type.in_(lower_types))

        if processed is True:
            query = query.filter(Document.processed.is_(True))
        elif processed is False:
            query = query.filter(Document.processed.is_(False))

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

        # Sorting - safe mapping to columns
        sort_col = Document.created_at
        if sort_by == "updated_at":
            sort_col = Document.updated_at
        elif sort_by == "file_size":
            sort_col = Document.file_size
        elif sort_by == "title":
            sort_col = Document.title

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
        """Update document metadata"""
        document = DocumentService.get_document_by_id(db, document_id, user)
        
        if title:
            document.title = title
        
        if metadata:
            if not document.metadata_:
                document.metadata_ = {}
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
        """Return count matching same filters (used for pagination total)."""
        q = db.query(Document).filter(Document.user_id == user.id)

        if file_types:
            lower_types = [t.lower() for t in file_types]
            q = q.filter(Document.file_type.in_(lower_types))

        if processed is True:
            q = q.filter(Document.processed.is_(True))
        elif processed is False:
            q = q.filter(Document.processed.is_(False))

        if date_from:
            q = q.filter(Document.created_at >= date_from)
        if date_to:
            q = q.filter(Document.created_at <= date_to)

        if size_min is not None:
            q = q.filter(Document.file_size >= size_min)
        if size_max is not None:
            q = q.filter(Document.file_size <= size_max)

        if search:
            safe = search.strip()
            if safe:
                q = q.filter(Document.title.ilike(f"%{safe}%"))

        return q.count()
    
    @staticmethod
    def delete_document(db: Session, document_id: int, user: User) -> bool:
        """Delete document from DB and Supabase"""
        document = DocumentService.get_document_by_id(db, document_id, user)
        
        # 1. Xóa trên Supabase (nếu có metadata storage_path)
        try:
            storage_path = document.metadata_.get("storage_path") if document.metadata_ else None
            
            # Fallback: Nếu không có storage_path (file cũ), thử đoán từ URL hoặc bỏ qua
            if storage_path:
                logger.info(f"🗑️ Deleting from Supabase: {storage_path}")
                supabase.storage.from_(settings.SUPABASE_BUCKET).remove([storage_path])
        except Exception as e:
            logger.error(f"⚠️ Failed to delete from Supabase (ignoring): {e}")
        
        # 2. Xóa DB
        db.delete(document)
        db.commit()
        return True
    
    @staticmethod
    def get_user_stats(db: Session, user: User) -> DocumentStats:
        """Get document statistics for user"""
        documents = db.query(Document).filter(Document.user_id == user.id).all()
        
        total_size = sum(doc.file_size for doc in documents)
        by_type = {}
        processed_count = 0
        
        for doc in documents:
            by_type[doc.file_type] = by_type.get(doc.file_type, 0) + 1
            
            if doc.processed:
                processed_count += 1
        
        return DocumentStats(
            total_documents=len(documents),
            total_size=total_size,
            by_type=by_type,
            processed_count=processed_count,
            unprocessed_count=len(documents) - processed_count
        )