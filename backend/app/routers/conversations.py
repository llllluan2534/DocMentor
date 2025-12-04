# backend/app/routers/conversations.py
from fastapi import APIRouter, Depends, HTTPException, status, Query as QueryParam
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Optional

from ..database import get_db
from ..models.user import User
from ..models.conversation import Conversation, conversation_queries, conversation_documents
from ..models.document import Query as QueryModel, Document
from ..utils.security import get_current_user

router = APIRouter(prefix="/conversations", tags=["Conversations"])


# ============================================================
# SCHEMAS (Inline để đơn giản)
# ============================================================
from pydantic import BaseModel

class ConversationCreate(BaseModel):
    title: str
    document_ids: Optional[List[int]] = None
    initial_query: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: str

class QuerySummary(BaseModel):
    id: int
    query_text: str
    response_text: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationDetail(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    queries: List[QuerySummary] = []
    document_ids: List[int] = []
    
    class Config:
        from_attributes = True

class ConversationSummary(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    query_count: int = 0
    document_count: int = 0
    
    class Config:
        from_attributes = True


# ============================================================
# CREATE CONVERSATION
# ============================================================
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo conversation mới với initial query (nếu có).
    
    Luồng:
    1. Tạo conversation
    2. Gắn documents (nếu có)
    3. Gửi initial_query qua RAG service (nếu có)
    4. Gắn query vào conversation
    """
    # 1. Create conversation
    conversation = Conversation(
        user_id=current_user.id,
        title=data.title
    )
    db.add(conversation)
    db.flush()  # Get ID

    # 2. Attach documents
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

    # 3. Send initial query if provided
    query_result = None
    if data.initial_query:
        from ..services.rag_service_gemini import RAGServiceGemini
        
        rag_service = RAGServiceGemini()
        
        try:
            result = await rag_service.query_documents(
                db=db,
                user=current_user,
                query_text=data.initial_query,
                document_ids=data.document_ids or [],
                max_results=5
            )
            
            # Query was saved by RAG service, get it
            if result.get("query_id"):
                query = db.query(QueryModel).filter(
                    QueryModel.id == result["query_id"]
                ).first()
                
                if query:
                    conversation.queries.append(query)
                    query_result = {
                        "id": query.id,
                        "query_text": query.query_text,
                        "response_text": query.response_text,
                        "created_at": query.created_at
                    }
        except Exception as e:
            print(f"⚠️ Failed to send initial query: {e}")
            # Continue anyway, conversation still created

    db.commit()
    db.refresh(conversation)

    return {
        "id": conversation.id,
        "user_id": conversation.user_id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "queries": [query_result] if query_result else [],
        "document_ids": [d.id for d in conversation.documents]
    }


# ============================================================
# GET ALL CONVERSATIONS
# ============================================================
@router.get("/")
def get_conversations(
    skip: int = QueryParam(0, ge=0),
    limit: int = QueryParam(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách conversations với số lượng queries và documents"""
    
    conversations = (
        db.query(
            Conversation,
            func.count(func.distinct(conversation_queries.c.query_id)).label("query_count"),
            func.count(func.distinct(conversation_documents.c.document_id)).label("document_count")
        )
        .outerjoin(conversation_queries)
        .outerjoin(conversation_documents)
        .filter(Conversation.user_id == current_user.id)
        .group_by(Conversation.id)
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    total = db.query(Conversation).filter(Conversation.user_id == current_user.id).count()

    result = []
    for conv, query_count, doc_count in conversations:
        result.append({
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "query_count": query_count or 0,
            "document_count": doc_count or 0
        })

    return {
        "conversations": result,
        "total": total,
        "skip": skip,
        "limit": limit
    }


# ============================================================
# GET CONVERSATION DETAIL
# ============================================================
@router.get("/{conversation_id}")
def get_conversation_detail(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy chi tiết conversation với tất cả queries"""
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    queries = [
        {
            "id": q.id,
            "query_text": q.query_text,
            "response_text": q.response_text or "",
            "created_at": q.created_at
        }
        for q in conversation.queries
    ]

    return {
        "id": conversation.id,
        "user_id": conversation.user_id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "queries": queries,
        "document_ids": [d.id for d in conversation.documents]
    }


# ============================================================
# UPDATE CONVERSATION
# ============================================================
@router.put("/{conversation_id}")
def update_conversation(
    conversation_id: int,
    data: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Đổi tên conversation"""
    
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
# DELETE CONVERSATION
# ============================================================
@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xóa conversation (CASCADE delete links, không xóa queries/documents)"""
    
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