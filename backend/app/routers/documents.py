import mimetypes
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
from app.database import SessionLocal

router = APIRouter(prefix="/documents", tags=["Documents"])
logger = logging.getLogger(__name__)

# --- Background Task ---
async def process_document_background(doc_id: int, file_path: str):
    db = SessionLocal() # ⚠️ Phải tạo DB Session mới
    try:
        processor = DocumentProcessor()
        await processor.process_document(db, doc_id, file_path)
    except Exception as e:
        logger.error(f"❌ Background processing failed for doc {doc_id}: {e}")
    finally:
        db.close()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks, # ✨ Inject BackgroundTasks
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Lưu file vật lý & tạo DB record (rất nhanh)
    new_doc = await DocumentService.upload_document(
        db=db, 
        file=file, 
        user=current_user
    )

    # 2. Đẩy việc xử lý nặng (Embed) ra sau khi response
    # Render sẽ không tính thời gian này vào timeout request
    background_tasks.add_task(
        process_document_background, 
        new_doc.id, 
        new_doc.file_path
    )

    return new_doc

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
@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quick Preview / Download document.
    FE dùng endpoint này để tải file gốc về render preview.
    """

    # 1. Lấy document & bảo mật
    document = DocumentService.get_document_by_id(db, document_id, current_user)

    file_path = document.file_path

    # 2. Kiểm tra file tồn tại
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found on server"
        )

    # 3. Detect MIME type (PDF, DOCX, TXT,…)
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = "application/octet-stream"

    # 4. Trả file về FE
    return FileResponse(
        path=file_path,
        media_type=mime_type,
        filename=document.title  # FE sẽ nhận đúng tên file
    )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    DocumentService.delete_document(db, document_id, current_user)
    try: cache.delete(f"user_{current_user.id}_documents")
    except Exception: pass
    return None