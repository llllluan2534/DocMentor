from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import FileResponse  # <--- Quan trọng để trả về file
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import os # <--- Cần thiết để kiểm tra file path

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

# --- Background Task (Giữ nguyên) ---
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
                if not doc.metadata_: doc.metadata_ = {}
                doc.metadata_['processing_status'] = 'failed'
                doc.metadata_['error'] = str(e)
                db.commit()
        except Exception as db_err:
            logger.error(f"❌ Failed to update error status: {str(db_err)}")
    finally:
        db.close()
        logger.info(f"🔒 DB session closed for document {document_id}")

# --- Upload Endpoint (Giữ nguyên) ---
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
    
    logger.info(f"✅ Document saved to DB: ID={document.id}, Path={document.file_path}")
    
    logger.info(f"⏰ Adding background task for document {document.id}")
    background_tasks.add_task(process_document_background, document.id, document.file_path)
    
    try:
        cache_key = f"user_{current_user.id}_documents"
        cache.delete(cache_key)
    except Exception:
        logger.debug("Failed to delete documents cache", exc_info=True)
    
    return DocumentUploadResponse(
        message="Document uploaded successfully. Processing in background...",
        document=document
    )

# --- 🔥 [QUAN TRỌNG] ENDPOINT DOWNLOAD/VIEW ĐÃ SỬA ĐỔI 🔥 ---
@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download hoặc Xem tài liệu.
    Chế độ: INLINE (Xem trên trình duyệt) thay vì ATTACHMENT (Tải về).
    """
    # 1. Lấy thông tin document từ DB
    doc = DocumentService.get_document_by_id(db, document_id, current_user)
    
    # 2. Kiểm tra file vật lý
    if not doc.file_path or not os.path.exists(doc.file_path):
        logger.error(f"File not found on disk: {doc.file_path}")
        raise HTTPException(status_code=404, detail="File content not found on server")

    # 3. Xác định MIME Type chuẩn để trình duyệt hiểu cách hiển thị
    media_type = "application/octet-stream" # Mặc định (sẽ tải về)
    
    if doc.file_type:
        ftype = doc.file_type.lower().replace(".", "")
        if ftype == "pdf":
            media_type = "application/pdf"
        elif ftype in ["png", "jpg", "jpeg", "webp", "gif"]:
            media_type = f"image/{ftype}"
        elif ftype in ["txt", "log", "md"]:
            media_type = "text/plain"

    # 4. Trả về FileResponse với disposition='inline'
    return FileResponse(
        path=doc.file_path,
        filename=doc.title,
        media_type=media_type,
        content_disposition_type="inline" # <--- CHÌA KHÓA: inline để xem, attachment để tải
    )
# -------------------------------------------------------------

# --- List Documents (Giữ nguyên) ---
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
    start_dt = None; end_dt = None
    if date_from:
        try:
            d = datetime.strptime(date_from, "%Y-%m-%d")
            start_dt = datetime.combine(d.date(), time.min)
        except ValueError: raise HTTPException(status_code=400, detail="date_from invalid")
    if date_to:
        try:
            d = datetime.strptime(date_to, "%Y-%m-%d")
            end_dt = datetime.combine(d.date(), time.max)
        except ValueError: raise HTTPException(status_code=400, detail="date_to invalid")

    cache_key = (
        f"user:{current_user.id}:docs:s={skip}:l={limit}:q={search or ''}:"
        f"ft={'|'.join(file_type) if file_type else ''}:p={processed}:"
        f"df={date_from}:dt={date_to}:sm={size_min}:sx={size_max}:so={sort_by}:o={order}"
    )

    cached = cache.get(cache_key)
    if cached: return cached

    documents = DocumentService.get_user_documents(
        db, current_user, skip, limit, search, file_type, processed, 
        start_dt, end_dt, size_min, size_max, sort_by, order
    )
    total = DocumentService.count_user_documents(
        db, current_user, search, file_type, processed, start_dt, end_dt, size_min, size_max
    )
    
    result = DocumentList(total=total, documents=documents)
    try: cache.set(cache_key, result, ttl_seconds=120)
    except Exception: pass
    
    return result

# --- Other CRUD Endpoints (Giữ nguyên) ---
@router.get("/stats", response_model=DocumentStats)
def get_document_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return DocumentService.get_user_stats(db, current_user)

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return DocumentService.get_document_by_id(db, document_id, current_user)

@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int, document_update: DocumentUpdate, 
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    updated = DocumentService.update_document(
        db, document_id, current_user, title=document_update.title, metadata=document_update.metadata
    )
    try: cache.delete(f"user_{current_user.id}_documents")
    except Exception: pass
    return updated

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    DocumentService.delete_document(db, document_id, current_user)
    try: cache.delete(f"user_{current_user.id}_documents")
    except Exception: pass
    return None