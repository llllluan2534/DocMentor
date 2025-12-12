from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import mimetypes
import os

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


# -----------------------------------------------------------
# BACKGROUND PROCESSOR
# -----------------------------------------------------------
async def process_document_background(document_id: int, file_path: str):
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


# -----------------------------------------------------------
# UPLOAD DOCUMENT
# -----------------------------------------------------------
@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"📤 Upload request from user {current_user.id}: {file.filename}")
    
    document = await DocumentService.upload_document(db, file, current_user, title)

    logger.info(f"⏰ Adding background task for document {document.id}")
    background_tasks.add_task(
        process_document_background,
        document.id,
        document.file_path
    )

    try:
        cache_key = f"user_{current_user.id}_documents"
        cache.delete(cache_key)
    except Exception:
        logger.debug("Failed to delete documents cache", exc_info=True)

    return DocumentUploadResponse(
        message="Document uploaded successfully. Processing in background...",
        document=document
    )


# -----------------------------------------------------------
# GET DOCUMENT LIST
# -----------------------------------------------------------
@router.get("/", response_model=DocumentList)
def get_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    file_type: Optional[List[str]] = Query(None),
    processed: Optional[bool] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    size_min: Optional[int] = Query(None, ge=0),
    size_max: Optional[int] = Query(None, ge=0),
    sort_by: Optional[str] = Query("created_at", regex="^(created_at|updated_at|file_size|title)$"),
    order: Optional[str] = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime, time

    start_dt = None
    end_dt = None

    if date_from:
        d = datetime.strptime(date_from, "%Y-%m-%d")
        start_dt = datetime.combine(d.date(), time.min)

    if date_to:
        d = datetime.strptime(date_to, "%Y-%m-%d")
        end_dt = datetime.combine(d.date(), time.max)

    cache_key = (
        f"user:{current_user.id}:docs:"
        f"skip={skip}:limit={limit}:search={search or ''}:"
        f"ft={'|'.join(file_type) if file_type else ''}:proc={processed}:"
        f"df={date_from or ''}:dt={date_to or ''}:"
        f"smin={size_min or ''}:smax={size_max or ''}:"
        f"sort={sort_by}:order={order}"
    )

    cached = cache.get(cache_key)
    if cached:
        return cached

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

    try:
        cache.set(cache_key, result, ttl_seconds=120)
    except Exception:
        pass

    return result


# -----------------------------------------------------------
# GET SINGLE DOCUMENT
# -----------------------------------------------------------
@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DocumentService.get_document_by_id(db, document_id, current_user)


# -----------------------------------------------------------
# UPDATE DOCUMENT
# -----------------------------------------------------------
@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = DocumentService.update_document(
        db,
        document_id,
        current_user,
        title=document_update.title,
        metadata=document_update.metadata
    )

    try:
        cache.delete(f"user_{current_user.id}_documents")
    except Exception:
        pass

    return updated


# -----------------------------------------------------------
# DOWNLOAD DOCUMENT (CHƯA CÓ PREVIEW)
# -----------------------------------------------------------
@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = DocumentService.get_document_by_id(db, document_id, current_user)

    file_path = document.file_path

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=file_path,
        media_type=mime_type,
        filename=document.title
    )


# -----------------------------------------------------------
# DELETE DOCUMENT
# -----------------------------------------------------------
@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    DocumentService.delete_document(db, document_id, current_user)

    try:
        cache.delete(f"user_{current_user.id}_documents")
    except Exception:
        pass

    return None
