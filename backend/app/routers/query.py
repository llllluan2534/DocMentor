# backend/app/routers/query.py - FIXED LOGIC
from fastapi import APIRouter, Depends, HTTPException, status, Query as QueryParam
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, desc, asc
from datetime import datetime, timedelta, time
from typing import Optional

from ..database import get_db
from ..models.feedback import Feedback
from ..models.conversation import Conversation
from ..schemas.query import QueryRequest, QueryResponse, QueryHistory, QueryFeedbackCreate
from ..services.rag_service_gemini import RAGServiceGemini
from ..utils.security import get_current_user
from ..models.user import User
from ..models.document import Query as QueryModel

router = APIRouter(prefix="/query", tags=["Query & RAG"])


# ==========================================================
# 1) SEND QUERY - MAIN ENDPOINT
# ==========================================================
@router.post("/", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    conversation_id: Optional[int] = QueryParam(None),  # ✅ Query param
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send query to RAG service.
    
    ✅ If conversation_id provided:
       - Validate conversation belongs to user
       - Link query to conversation via FK
    """
    rag_service = RAGServiceGemini()

    # ✅ Validate conversation if provided
    conversation = None
    if conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or not owned by you"
            )

    # ✅ Execute RAG query
    result = await rag_service.query_documents(
        db=db,
        user=current_user,
        query_text=request.query_text,
        document_ids=request.document_ids,
        max_results=request.max_results
    )

    # ✅ No documents found case
    if "query_id" not in result:
        return {
            "query_id": None,
            "query_text": request.query_text,
            "answer": result["answer"],
            "sources": result["sources"],
            "confidence_score": result["confidence_score"],
            "processing_time_ms": result["processing_time_ms"],
            "created_at": datetime.utcnow()
        }

    # ✅ Link query to conversation if provided
    if conversation and result.get("query_id"):
        try:
            query = db.query(QueryModel).filter(QueryModel.id == result["query_id"]).first()
            
            if query:
                # ✅ Set FK directly
                query.conversation_id = conversation.id
                
                # Update conversation timestamp
                conversation.updated_at = datetime.utcnow()
                
                db.commit()
                print(f"✅ Linked query {query.id} to conversation {conversation.id}")
        except Exception as e:
            print(f"⚠️ Failed to link query to conversation: {e}")
            db.rollback()

    return {
        "query_id": result["query_id"],
        "query_text": request.query_text,
        "answer": result["answer"],
        "sources": result["sources"],
        "confidence_score": result["confidence_score"],
        "processing_time_ms": result["processing_time_ms"],
        "created_at": datetime.utcnow()
    }


# ==========================================================
# 2) GET QUERY HISTORY
# ==========================================================
@router.get("/history", response_model=QueryHistory)
def get_query_history(
    skip: int = QueryParam(0, ge=0),
    limit: int = QueryParam(20, ge=1, le=100),
    date_from: Optional[str] = QueryParam(None),
    date_to: Optional[str] = QueryParam(None),
    search: Optional[str] = QueryParam(None),
    sort_by: Optional[str] = QueryParam("date", regex="^(date|rating|relevance)$"),
    order: Optional[str] = QueryParam("desc", regex="^(asc|desc)$"),
    conversation_id: Optional[int] = QueryParam(None),  # ✅ Filter by conversation
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get query history with optional conversation filter"""
    
    q = db.query(QueryModel).filter(QueryModel.user_id == current_user.id)
    
    # ✅ Filter by conversation if provided
    if conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        q = q.filter(QueryModel.conversation_id == conversation_id)

    # Date filters
    try:
        if date_from:
            start_date = datetime.strptime(date_from, "%Y-%m-%d")
            q = q.filter(QueryModel.created_at >= datetime.combine(start_date.date(), time.min))
        if date_to:
            end_date = datetime.strptime(date_to, "%Y-%m-%d")
            q = q.filter(QueryModel.created_at <= datetime.combine(end_date.date(), time.max))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")

    # Search
    if search:
        safe = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        q = q.filter(QueryModel.query_text.ilike(f"%{safe}%", escape="\\"))

    # Sort
    sort_col = QueryModel.created_at if sort_by != "rating" else QueryModel.rating
    q = q.order_by(desc(sort_col) if order == "desc" else asc(sort_col))

    total = q.count()
    items = q.offset(skip).limit(limit).all()

    # Format response
    formatted = []
    for row in items:
        sources = row.sources or []
        if isinstance(sources, dict) and "sources" in sources:
            sources = sources["sources"]
        elif not isinstance(sources, list):
            sources = []

        normalized_sources = [
            {
                "document_id": s.get("document_id"),
                "document_title": s.get("document_title"),
                "page_number": s.get("page_number"),
                "similarity_score": s.get("similarity_score"),
                "text": s.get("text"),
            }
            for s in sources if isinstance(s, dict)
        ]

        formatted.append({
            "query_id": row.id,
            "query_text": row.query_text,
            "answer": row.response_text or "",
            "sources": normalized_sources,
            "processing_time_ms": row.execution_time or 0,
            "confidence_score": 0.0,
            "created_at": row.created_at,
        })

    return {"queries": formatted, "total": total}


# ==========================================================
# 3) GET QUERY DETAIL
# ==========================================================
@router.get("/{query_id}", response_model=QueryResponse)
def get_query_detail(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single query detail"""
    
    query = db.query(QueryModel).filter(
        QueryModel.id == query_id,
        QueryModel.user_id == current_user.id
    ).first()
    
    if not query:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Query not found")

    # Normalize sources
    sources = query.sources or []
    if isinstance(sources, dict) and "sources" in sources:
        sources = sources["sources"]
    elif not isinstance(sources, list):
        sources = []

    normalized_sources = [
        {
            "document_id": s.get("document_id"),
            "document_title": s.get("document_title"),
            "page_number": s.get("page_number"),
            "similarity_score": s.get("similarity_score"),
            "text": s.get("text"),
        }
        for s in sources if isinstance(s, dict)
    ]

    return {
        "query_id": query.id,
        "query_text": query.query_text,
        "answer": query.response_text or "",
        "sources": normalized_sources,
        "processing_time_ms": query.execution_time or 0,
        "confidence_score": 0.0,
        "created_at": query.created_at,
    }
    
# -------------------------------
# 4) Submit feedback (UNCHANGED)
# -------------------------------
@router.post("/feedback", status_code=status.HTTP_200_OK)
def submit_feedback(
    feedback: QueryFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit rating/feedback for a query"""
    query = (
        db.query(QueryModel)
        .filter(QueryModel.id == feedback.query_id)
        .first()
    )
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")

    if query.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: not your query")

    existing_feedback = (
        db.query(Feedback)
        .filter(Feedback.query_id == feedback.query_id)
        .first()
    )
    if existing_feedback:
        raise HTTPException(status_code=400, detail="Already submitted feedback")

    if not (1 <= feedback.rating <= 5):
        raise HTTPException(status_code=422, detail="Rating must be from 1 to 5")

    new_feedback = Feedback(
        query_id=feedback.query_id,
        user_id=current_user.id,
        rating=feedback.rating,
        feedback_text=feedback.feedback_text.strip() if feedback.feedback_text else None
    )

    db.add(new_feedback)
    
    if hasattr(query, "rating"):
        query.rating = feedback.rating

    db.commit()
    db.refresh(new_feedback)

    return {
        "query_id": query.id,
        "feedback": {
            "rating": new_feedback.rating,
            "text": new_feedback.feedback_text,
            "created_at": new_feedback.created_at.isoformat(),
            "user_id": new_feedback.user_id
        }
    }


# -------------------------------
# 5) Get feedback (UNCHANGED)
# -------------------------------
@router.get("/{query_id}/feedback", status_code=200)
def get_feedback(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get feedback for a query"""
    query = (
        db.query(QueryModel)
        .filter(QueryModel.id == query_id)
        .first()
    )
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")

    if query.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: not your query")

    feedback = (
        db.query(Feedback)
        .filter(Feedback.query_id == query_id)
        .first()
    )

    if not feedback:
        return None

    return {
        "rating": feedback.rating,
        "text": feedback.feedback_text,
        "created_at": feedback.created_at.isoformat(),
        "user_id": feedback.user_id
    }


# -------------------------------
# 6) Delete query (UNCHANGED)
# -------------------------------
@router.delete("/{query_id}", status_code=status.HTTP_200_OK)
def delete_query(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a query belonging to current user"""
    query = (
        db.query(QueryModel)
        .filter(QueryModel.id == query_id, QueryModel.user_id == current_user.id)
        .first()
    )
    if not query:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Query not found")

    db.delete(query)
    db.commit()

    return {"message": "Query deleted successfully", "deleted_id": query_id}


# -------------------------------
# 7) Statistics (UNCHANGED)
# -------------------------------
@router.get("/stats")
def get_query_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return query statistics"""
    total_q = db.query(func.count(QueryModel.id)).filter(QueryModel.user_id == current_user.id).scalar() or 0

    avg_rating = 0.0
    try:
        avg = db.query(func.avg(Feedback.rating)).filter(
            Feedback.user_id == current_user.id
        ).scalar()
        avg_rating = round(float(avg), 2) if avg is not None else 0.0
    except Exception:
        avg_rating = 0.0

    now = datetime.utcnow()
    start_dt = datetime.combine((now.date() - timedelta(days=6)), time.min)

    try:
        daily_counts = (
            db.query(cast(QueryModel.created_at, Date).label("d"), func.count(QueryModel.id).label("cnt"))
            .filter(QueryModel.user_id == current_user.id)
            .filter(QueryModel.created_at >= start_dt)
            .group_by(cast(QueryModel.created_at, Date))
            .order_by(cast(QueryModel.created_at, Date))
            .all()
        )
        daily_map = {row.d: int(row.cnt) for row in daily_counts}
    except Exception:
        daily_map = {}

    activity = []
    for i in range(7):
        t = (now.date() - timedelta(days=6 - i))
        activity.append({"date": t.isoformat(), "count": int(daily_map.get(t, 0))})

    return {"total_queries": int(total_q), "avg_rating": float(avg_rating), "activity_last_7_days": activity}