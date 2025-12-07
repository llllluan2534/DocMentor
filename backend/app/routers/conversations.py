# backend/app/routers/conversations.py - FIXED
from fastapi import APIRouter, Depends, HTTPException, status, Query as QueryParam
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional

from ..database import get_db
from ..models.user import User
from ..models.conversation import Conversation
from ..models.document import Query as QueryModel, Document
from ..utils.security import get_current_user

router = APIRouter(prefix="/conversations", tags=["Conversations"])

# ============================================================
# SCHEMAS (Inline)
# ============================================================
from pydantic import BaseModel
from typing import List

class ConversationCreate(BaseModel):
    title: str
    document_ids: Optional[List[int]] = None

class ConversationUpdate(BaseModel):
    title: str

class QuerySummary(BaseModel):
    id: int
    query_text: str
    response_text: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================
# 1) CREATE CONVERSATION (No initial query)
# ============================================================
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create empty conversation (frontend will send first query separately)"""
    
    # Create conversation
    conversation = Conversation(
        user_id=current_user.id,
        title=data.title
    )
    db.add(conversation)
    db.flush()

    # Attach documents
    if data.document_ids:
        docs = db.query(Document).filter(
            Document.id.in_(data.document_ids),
            Document.user_id == current_user.id
        ).all()
        
        if len(docs) != len(data.document_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Some documents not found"
            )
        
        conversation.documents = docs

    db.commit()
    db.refresh(conversation)

    return {
        "id": conversation.id,
        "user_id": conversation.user_id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "queries": [],
        "document_ids": [d.id for d in conversation.documents]
    }


# ============================================================
# 2) GET ALL CONVERSATIONS
# ============================================================
@router.get("/")
def get_conversations(
    skip: int = QueryParam(0, ge=0),
    limit: int = QueryParam(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversations with query/document counts"""
    
    # ✅ FIX: Count queries using FK
    conversations = (
        db.query(
            Conversation,
            func.count(QueryModel.id).label("query_count")
        )
        .outerjoin(QueryModel, Conversation.id == QueryModel.conversation_id)  # ✅ JOIN by FK
        .filter(Conversation.user_id == current_user.id)
        .group_by(Conversation.id)
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    total = db.query(Conversation).filter(Conversation.user_id == current_user.id).count()

    result = []
    for conv, query_count in conversations:
        # Count documents separately (more reliable)
        doc_count = len(conv.documents)
        
        result.append({
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "query_count": query_count or 0,
            "document_count": doc_count
        })

    return {
        "conversations": result,
        "total": total,
        "skip": skip,
        "limit": limit
    }


# ============================================================
# 3) GET CONVERSATION DETAIL
# ============================================================
@router.get("/{conversation_id}")
def get_conversation_detail(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversation with all queries"""
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # ✅ FIX: Get queries using FK
    queries = db.query(QueryModel).filter(
        QueryModel.conversation_id == conversation_id
    ).order_by(QueryModel.created_at.asc()).all()

    return {
        "id": conversation.id,
        "user_id": conversation.user_id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "queries": [
            {
                "id": q.id,
                "query_text": q.query_text,
                "response_text": q.response_text or "",
                "created_at": q.created_at
            }
            for q in queries
        ],
        "document_ids": [d.id for d in conversation.documents]
    }


# ============================================================
# 4) UPDATE CONVERSATION
# ============================================================
@router.put("/{conversation_id}")
def update_conversation(
    conversation_id: int,
    data: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rename conversation"""
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    conversation.title = data.title
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(conversation)

    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at
    }


# ============================================================
# 5) DELETE CONVERSATION
# ============================================================
@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete conversation (CASCADE deletes queries via FK)"""
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    db.delete(conversation)
    db.commit()

    return {
        "message": "Conversation deleted successfully",
        "deleted_id": conversation_id
    }