from sqlalchemy.orm import Session
from sqlalchemy import func, String, cast
from fastapi import HTTPException, status, UploadFile
from typing import List, Dict, Optional
import os
import shutil
import logging
from sqlalchemy import desc, asc, and_
from datetime import datetime

from ..models.document import Document
from ..models.user import User
from ..schemas.document import DocumentResponse, DocumentStats
from ..utils.helpers import (
    validate_file_type, 
    validate_file_size, 
    generate_unique_filename,
    ensure_upload_dir,
    calculate_file_hash
)

logger = logging.getLogger(__name__)

class DocumentService:
    @staticmethod
    async def upload_document(
        db: Session,
        file: UploadFile,
        user: User,
        title: Optional[str] = None
    ) -> Document:
        """Upload and save document"""
        
        # Validate file type
        file_ext = validate_file_type(file.filename)
        
        # Read file to get size
        content = await file.read()
        file_size = len(content)
        
        # Validate file size
        validate_file_size(file_size)
        
        # Generate unique filename
        unique_filename = generate_unique_filename(user.id, file.filename)
        
        # Ensure upload directory exists
        upload_dir = ensure_upload_dir()
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # Calculate file hash
        file_hash = calculate_file_hash(file_path)
        
        # Check for duplicate uploads - handle NULL metadata safely
        try:
            # Query all user documents and check in Python (safer than JSON query)
            existing_docs = db.query(Document).filter(
                Document.user_id == user.id
            ).all()
            
            for doc in existing_docs:
                if doc.metadata_ and doc.metadata_.get("file_hash") == file_hash:
                    # Remove duplicate file
                    os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This file has already been uploaded"
                    )
        except HTTPException:
            # Re-raise HTTPException (duplicate file)
            raise
        except Exception as e:
            # Log error but don't block upload if duplicate check fails
            logger.warning(f"Could not check for duplicate files: {str(e)}")
        
        # Create Document record
        document = Document(
            user_id=user.id,
            title=title or file.filename,
            file_path=file_path,
            file_type=file_ext[1:],
            file_size=file_size,
            metadata_={  
                "original_filename": file.filename,
                "file_hash": file_hash,
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
        """Delete document"""
        document = DocumentService.get_document_by_id(db, document_id, user)
        
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
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