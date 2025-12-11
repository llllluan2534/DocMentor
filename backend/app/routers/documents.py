from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from ..database import get_db, SessionLocal
from ..schemas.document import (
    DocumentResponse, 
    DocumentList, 
    DocumentUploadResponse,
    DocumentUpdate,
    DocumentStats
)
from ..services.document_service import DocumentService
from ..services.document_processor import DocumentProcessor
from ..utils.security import get_current_user
from ..models.user import User
from ..models.document import Document
from ..utils.cache import cache

router = APIRouter(prefix="/documents", tags=["Documents"])
logger = logging.getLogger(__name__)

async def process_document_background(document_id: int, file_path: str):
    """
    Background task to process document
    IMPORTANT: Create new DB session for background task
    """
    logger.info(f"🚀 Background task STARTED for document {document_id}")
    db = SessionLocal()
    try:
        processor = DocumentProcessor()
        logger.info(f"📝 Calling processor.process_document for doc {document_id}")
        
        await processor.process_document(db, document_id, file_path)
        
        logger.info(f"✅ Background task COMPLETED for document {document_id}")
    except Exception as e:
        logger.error(f"❌ Background task FAILED for doc {document_id}: {str(e)}", exc_info=True)
        
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                if not doc.metadata_:
                    doc.metadata_ = {}
                doc.metadata_['processing_status'] = 'failed'
                doc.metadata_['error'] = str(e)
                db.commit()
        except Exception as db_err:
            logger.error(f"❌ Failed to update error status: {str(db_err)}")
    finally:
        db.close()
        logger.info(f"🔒 DB session closed for document {document_id}")

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload document and process in background"""
    
    logger.info(f"📤 Upload request from user {current_user.id}: {file.filename}")
    
    # Upload document
    document = await DocumentService.upload_document(db, file, current_user, title)
    
    logger.info(f"✅ Document saved to DB: ID={document.id}, Path={document.file_path}")
    
    logger.info(f"⏰ Adding background task for document {document.id}")
    background_tasks.add_task(
        process_document_background,
        document.id,
        document.file_path
    )
    # Invalidate document list cache for this user
    try:
        cache_key = f"user_{current_user.id}_documents"
        cache.delete(cache_key)
    except Exception:
        logger.debug("Failed to delete documents cache", exc_info=True)
    
    return DocumentUploadResponse(
        message="Document uploaded successfully. Processing in background...",
        document=document
    )

@router.get("/", response_model=DocumentList)
def get_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Fulltext-like search on title"),
    file_type: Optional[List[str]] = Query(None, description="Filter by file types, repeatable"),
    processed: Optional[bool] = Query(None, description="Filter by processed status (true/false)"),
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="YYYY-MM-DD"),
    size_min: Optional[int] = Query(None, ge=0, description="Minimum file size in bytes"),
    size_max: Optional[int] = Query(None, ge=0, description="Maximum file size in bytes"),
    sort_by: Optional[str] = Query("created_at", regex="^(created_at|updated_at|file_size|title)$"),
    order: Optional[str] = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get documents for current user with filters, sorting and pagination.

    Filters:
      - file_type (repeatable): pdf, docx, txt, ...
      - processed: true/false
      - date_from/date_to: YYYY-MM-DD (inclusive)
      - size_min/size_max: bytes
    """
    # Normalize/validate dates
    from datetime import datetime, time
    start_dt = None
    end_dt = None
    if date_from:
        try:
            d = datetime.strptime(date_from, "%Y-%m-%d")
            start_dt = datetime.combine(d.date(), time.min)
        except ValueError:
            raise HTTPException(status_code=400, detail="date_from must be YYYY-MM-DD")
    if date_to:
        try:
            d = datetime.strptime(date_to, "%Y-%m-%d")
            end_dt = datetime.combine(d.date(), time.max)
        except ValueError:
            raise HTTPException(status_code=400, detail="date_to must be YYYY-MM-DD")

    # Build deterministic cache key from params
    # Order of keys must be stable so same query maps to same cache entry
    cache_key = (
        f"user:{current_user.id}:docs:"
        f"skip={skip}:limit={limit}:search={search or ''}:"
        f"ft={'|'.join(file_type) if file_type else ''}:proc={processed}:"
        f"df={date_from or ''}:dt={date_to or ''}:smin={size_min or ''}:smax={size_max or ''}:"
        f"sort={sort_by}:{order}"
    )

    # Try cache first
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Delegate to service which builds SQLAlchemy query
    documents = DocumentService.get_user_documents(
        db=db,
        user=current_user,
        skip=skip,
        limit=limit,
        search=search,
        file_types=file_type,
        processed=processed,
        date_from=start_dt,
        date_to=end_dt,
        size_min=size_min,
        size_max=size_max,
        sort_by=sort_by,
        order=order
    )

    # Get total count with same filters (fast COUNT)
    total = DocumentService.count_user_documents(
        db=db,
        user=current_user,
        search=search,
        file_types=file_type,
        processed=processed,
        date_from=start_dt,
        date_to=end_dt,
        size_min=size_min,
        size_max=size_max
    )

    result = DocumentList(total=total, documents=documents)

    # Cache result (short TTL)
    try:
        cache.set(cache_key, result, ttl_seconds=120)
    except Exception:
        logger.debug("Failed to set documents cache", exc_info=True)

    return result

@router.get("/stats", response_model=DocumentStats)
def get_document_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document statistics for current user"""
    return DocumentService.get_user_stats(db, current_user)

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single document by ID"""
    return DocumentService.get_document_by_id(db, document_id, current_user)

@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update document metadata"""
    updated = DocumentService.update_document(
        db, 
        document_id, 
        current_user,
        title=document_update.title,
        metadata=document_update.metadata
    )

    # Invalidate cache for this user's documents (best-effort)
    try:
        cache.delete(f"user_{current_user.id}_documents")
    except Exception:
        logger.debug("Failed to delete documents cache on update", exc_info=True)

    return updated

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete document"""
    DocumentService.delete_document(db, document_id, current_user)
    # Invalidate document list cache for this user
    try:
        cache.delete(f"user_{current_user.id}_documents")
    except Exception:
        logger.debug("Failed to delete documents cache on delete", exc_info=True)
    return None