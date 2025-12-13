from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
from typing import List, Dict, Any
from ..database import get_db
from ..utils.security import get_current_user
from ..models.user import User
from ..models.document import Document, Query as QueryModel
from ..models.conversation import Conversation
from ..models.feedback import Feedback

router = APIRouter(prefix="/user/dashboard", tags=["User Dashboard"])


# ============================================================================
# USER DASHBOARD STATS
# ============================================================================

@router.get("/stats")
def get_user_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get comprehensive dashboard stats for current user
    Includes: documents, queries, conversations, feedback ratings
    """
    
    # 1. Document statistics
    total_documents = db.query(func.count(Document.id)).filter(
        Document.user_id == current_user.id
    ).scalar() or 0
    
    total_processed = db.query(func.count(Document.id)).filter(
        Document.user_id == current_user.id,
        Document.processed == True
    ).scalar() or 0
    
    total_doc_size = db.query(func.sum(Document.file_size)).filter(
        Document.user_id == current_user.id
    ).scalar() or 0
    
    # 2. Query statistics
    total_queries = db.query(func.count(QueryModel.id)).filter(
        QueryModel.user_id == current_user.id
    ).scalar() or 0
    
    total_execution_time = db.query(func.sum(QueryModel.execution_time)).filter(
        QueryModel.user_id == current_user.id,
        QueryModel.execution_time.isnot(None)
    ).scalar() or 0
    
    avg_execution_time = 0
    if total_queries > 0:
        avg_execution_time = int(total_execution_time / total_queries) if total_queries > 0 else 0
    
    # 3. Conversation statistics
    total_conversations = db.query(func.count(Conversation.id)).filter(
        Conversation.user_id == current_user.id
    ).scalar() or 0
    
    # 4. Feedback ratings
    avg_rating = db.query(func.avg(Feedback.rating)).filter(
        Feedback.user_id == current_user.id
    ).scalar() or 0
    
    total_feedbacks = db.query(func.count(Feedback.id)).filter(
        Feedback.user_id == current_user.id
    ).scalar() or 0
    
    positive_feedbacks = db.query(func.count(Feedback.id)).filter(
        Feedback.user_id == current_user.id,
        Feedback.rating >= 4
    ).scalar() or 0
    
    # 5. Documents by status
    docs_by_type = db.query(
        Document.file_type,
        func.count(Document.id).label("count")
    ).filter(
        Document.user_id == current_user.id
    ).group_by(Document.file_type).all()
    
    file_type_stats = {
        doc_type: count 
        for doc_type, count in docs_by_type
    }
    
    return {
        "documents": {
            "total": total_documents,
            "processed": total_processed,
            "unprocessed": total_documents - total_processed,
            "total_size_bytes": total_doc_size,
            "by_type": file_type_stats
        },
        "queries": {
            "total": total_queries,
            "avg_execution_time_ms": avg_execution_time,
            "total_execution_time_ms": total_execution_time
        },
        "conversations": {
            "total": total_conversations
        },
        "feedback": {
            "total": total_feedbacks,
            "average_rating": round(float(avg_rating), 2) if avg_rating else 0,
            "positive_feedbacks": positive_feedbacks,
            "positive_percentage": round((positive_feedbacks / total_feedbacks * 100), 1) if total_feedbacks > 0 else 0
        }
    }


@router.get("/recent-documents")
def get_recent_documents(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get recent documents for current user"""
    
    documents = db.query(
        Document.id,
        Document.title,
        Document.file_type,
        Document.file_size,
        Document.processed,
        Document.created_at
    ).filter(
        Document.user_id == current_user.id
    ).order_by(
        desc(Document.created_at)
    ).limit(limit).all()
    
    return [
        {
            "id": doc.id,
            "title": doc.title,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "processed": doc.processed,
            "created_at": doc.created_at
        }
        for doc in documents
    ]


@router.get("/recent-queries")
def get_recent_queries(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get recent queries for current user"""
    
    queries = db.query(
        QueryModel.id,
        QueryModel.query_text,
        QueryModel.response_text,
        QueryModel.execution_time,
        QueryModel.rating,
        QueryModel.created_at
    ).filter(
        QueryModel.user_id == current_user.id
    ).order_by(
        desc(QueryModel.created_at)
    ).limit(limit).all()
    
    return [
        {
            "id": q.id,
            "query_text": q.query_text,
            "response_text": q.response_text[:200] if q.response_text else None,  # Preview
            "execution_time_ms": q.execution_time,
            "rating": q.rating,
            "created_at": q.created_at
        }
        for q in queries
    ]


@router.get("/popular-queries")
def get_popular_queries(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get most popular/frequently asked questions"""
    
    popular = db.query(
        QueryModel.query_text,
        func.count(QueryModel.id).label("count"),
        func.avg(Feedback.rating).label("avg_rating")
    ).filter(
        QueryModel.user_id == current_user.id
    ).outerjoin(
        Feedback,
        QueryModel.id == Feedback.query_id
    ).group_by(
        QueryModel.query_text
    ).order_by(
        desc("count")
    ).limit(limit).all()
    
    return [
        {
            "query_text": q.query_text,
            "count": int(q.count),
            "average_rating": round(float(q.avg_rating), 2) if q.avg_rating else None
        }
        for q in popular
    ]


@router.get("/weekly-activity")
def get_weekly_activity(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get query activity for the last N days"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    activity = db.query(
        func.date(QueryModel.created_at).label("date"),
        func.count(QueryModel.id).label("query_count"),
        func.avg(QueryModel.execution_time).label("avg_time")
    ).filter(
        QueryModel.user_id == current_user.id,
        QueryModel.created_at >= start_date
    ).group_by(
        func.date(QueryModel.created_at)
    ).order_by(
        func.date(QueryModel.created_at)
    ).all()
    
    return [
        {
            "date": str(a.date),
            "query_count": int(a.query_count),
            "avg_execution_time_ms": int(a.avg_time) if a.avg_time else 0
        }
        for a in activity
    ]


@router.get("/document-distribution")
def get_document_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get documents by file type distribution"""
    
    distribution = db.query(
        Document.file_type,
        func.count(Document.id).label("count"),
        func.sum(Document.file_size).label("total_size"),
        func.sum(func.cast(Document.processed == True, db.Integer)).label("processed_count")
    ).filter(
        Document.user_id == current_user.id
    ).group_by(
        Document.file_type
    ).all()
    
    return [
        {
            "file_type": d.file_type,
            "count": int(d.count),
            "total_size_bytes": d.total_size or 0,
            "processed_count": d.processed_count or 0
        }
        for d in distribution
    ]


@router.get("/processing-status")
def get_processing_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get documents currently being processed or failed
    Useful for monitoring long-running operations
    """
    
    processing = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.processed == False
    ).all()
    
    failed = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.metadata_['processing_status'].astext == 'failed'
    ).all()
    
    return {
        "processing": [
            {
                "id": doc.id,
                "title": doc.title,
                "file_type": doc.file_type,
                "created_at": doc.created_at
            }
            for doc in processing
        ],
        "failed": [
            {
                "id": doc.id,
                "title": doc.title,
                "file_type": doc.file_type,
                "error": doc.metadata_.get('error', 'Unknown error') if doc.metadata_ else None,
                "created_at": doc.created_at
            }
            for doc in failed
        ]
    }
