# backend/app/routers/folders.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.folder import Folder
from ..models.user import User
from ..models.document import Document
from ..schemas.folder import FolderCreate, FolderUpdate, FolderResponse, FolderList
from ..utils.security import get_current_user

router = APIRouter(prefix="/folders", tags=["Folders"])

# 1. Lấy danh sách thư mục
@router.get("/", response_model=FolderList)
def get_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folders = db.query(Folder).filter(Folder.user_id == current_user.id).all()
    return {"folders": folders}

# 2. Tạo thư mục mới
@router.post("/", response_model=dict) # Trả về dict để khớp với frontend expect {folder: ...}
def create_folder(
    folder_data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Kiểm tra trùng tên (Optional)
    existing = db.query(Folder).filter(
        Folder.user_id == current_user.id, 
        Folder.name == folder_data.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Thư mục đã tồn tại")

    new_folder = Folder(
        user_id=current_user.id,
        name=folder_data.name,
        description=folder_data.description
    )
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    
    return {"folder": new_folder}

# 3. Đổi tên thư mục
@router.put("/{folder_id}", response_model=dict)
def update_folder(
    folder_id: int,
    folder_update: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    folder.name = folder_update.name
    if folder_update.description is not None:
        folder.description = folder_update.description
        
    db.commit()
    db.refresh(folder)
    return {"folder": folder}

# 4. Xóa thư mục
@router.delete("/{folder_id}", status_code=204)
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Logic: Khi xóa folder, các file bên trong sẽ ra ngoài (folder_id = NULL)
    # DB đã config ondelete="SET NULL" ở model Document nên tự động xử lý, hoặc làm thủ công:
    documents = db.query(Document).filter(Document.folder_id == folder_id).all()
    for doc in documents:
        doc.folder_id = None
        
    db.delete(folder)
    db.commit()
    return None