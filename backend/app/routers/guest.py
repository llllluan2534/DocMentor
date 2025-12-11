# backend/app/routers/guest.py
"""
Guest access router - allows public to try limited features
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import time

from ..database import get_db
from ..models.document import Document
from ..schemas.query import QueryRequest, QueryResponse
from ..services.rag_service_gemini import RAGServiceGemini
from datetime import datetime

router = APIRouter(prefix="/guest", tags=["Guest Access"])

# In-memory rate limiting (simple implementation)
guest_requests = {}  # IP -> (count, timestamp)
MAX_GUEST_REQUESTS = 5  # 5 requests per hour
RATE_LIMIT_WINDOW = 3600  # 1 hour in seconds


def check_rate_limit(client_ip: str) -> bool:
    """Simple rate limiting for guest users"""
    current_time = time.time()
    
    if client_ip in guest_requests:
        count, timestamp = guest_requests[client_ip]
        
        # Reset if window expired
        if current_time - timestamp > RATE_LIMIT_WINDOW:
            guest_requests[client_ip] = (1, current_time)
            return True
        
        # Check limit
        if count >= MAX_GUEST_REQUESTS:
            return False
        
        # Increment
        guest_requests[client_ip] = (count + 1, timestamp)
        return True
    else:
        guest_requests[client_ip] = (1, current_time)
        return True


@router.get("/demo-documents")
async def get_demo_documents(db: Session = Depends(get_db)):
    """
    Get list of public demo documents for guest users
    
    Returns documents marked as 'demo' in metadata
    """
    # Get documents from a demo user (create one if needed)
    demo_docs = db.query(Document).filter(
        Document.processed == True,
        Document.metadata_['is_demo'].astext == 'true'  # PostgreSQL JSON query
    ).limit(5).all()
    
    if not demo_docs:
        return {
            "message": "No demo documents available",
            "documents": []
        }
    
    return {
        "documents": [
            {
                "id": doc.id,
                "title": doc.title,
                "file_type": doc.file_type,
                "created_at": doc.created_at
            }
            for doc in demo_docs
        ]
    }


@router.post("/query", response_model=QueryResponse)
async def guest_query(
    request: QueryRequest,
    client_ip: str = "0.0.0.0",  # In production, get from request.client.host
    db: Session = Depends(get_db)
):
    """
    Guest query endpoint with rate limiting
    
    Limitations:
    - Max 5 queries per hour per IP
    - Can only query demo documents
    - No query history saved
    """
    # Rate limiting
    if not check_rate_limit(client_ip):
        remaining_time = RATE_LIMIT_WINDOW - (time.time() - guest_requests[client_ip][1])
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {int(remaining_time/60)} minutes."
        )
    
    # Validate documents are demo documents
    demo_docs = db.query(Document).filter(
        Document.id.in_(request.document_ids),
        Document.processed == True,
        Document.metadata_['is_demo'].astext == 'true'
    ).all()
    
    if not demo_docs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guests can only query demo documents. Please register for full access."
        )
    
    valid_doc_ids = [doc.id for doc in demo_docs]
    
    # Process query (without saving to database)
    rag_service = RAGServiceGemini()
    
    try:
        # Create a mock user object for guest
        from ..models.user import User, UserRole
        guest_user = User(
            id=0,
            email="guest@docmentor.com",
            hashed_password="",
            role=UserRole.STUDENT
        )
        
        # Get answer but don't save query
        from ..services.embedding_service_gemini import EmbeddingServiceGemini
        from ..services.gemini_service import GeminiService
        from ..utils.prompts import format_context, RAG_QUERY_TEMPLATE, SYSTEM_INSTRUCTION
        
        embedding_service = EmbeddingServiceGemini()
        gemini_service = GeminiService()
        
        # Search
        matches = await embedding_service.search_similar_chunks(
            query=request.query_text,
            document_ids=valid_doc_ids,
            top_k=request.max_results
        )
        
        if not matches or matches[0]['score'] < 0.3:
            return {
                "query_id": None,
                "query_text": request.query_text,
                "answer": "Xin lỗi, tôi không tìm thấy thông tin liên quan trong tài liệu demo.",
                "sources": [],
                "confidence_score": 0.0,
                "processing_time_ms": 0,
                "created_at": datetime.utcnow()
            }
        
        # Build context
        doc_map = {doc.id: doc for doc in demo_docs}
        context = format_context(matches, doc_map)
        
        # Generate answer
        answer = await gemini_service.generate_answer(
            query=request.query_text,
            context=context,
            system_instruction=SYSTEM_INSTRUCTION
        )
        
        # Format sources
        sources = [
            {
                "document_id": m['document_id'],
                "document_title": doc_map[m['document_id']].title,
                "page_number": m.get('page_number'),
                "similarity_score": round(m['score'], 3),
                "text": m['text'][:200]
            }
            for m in matches
        ]
        
        return {
            "query_id": None,  # Not saved
            "query_text": request.query_text,
            "answer": answer + "\n\n💡 Đăng ký tài khoản để truy vấn không giới hạn!",
            "sources": sources,
            "confidence_score": sum(m['score'] for m in matches) / len(matches),
            "processing_time_ms": 0,
            "created_at": datetime.utcnow()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/limits")
async def get_guest_limits(client_ip: str = "0.0.0.0"):
    """Check remaining guest queries"""
    if client_ip in guest_requests:
        count, timestamp = guest_requests[client_ip]
        remaining = MAX_GUEST_REQUESTS - count
        
        if time.time() - timestamp > RATE_LIMIT_WINDOW:
            remaining = MAX_GUEST_REQUESTS
    else:
        remaining = MAX_GUEST_REQUESTS
    
    return {
        "remaining_queries": max(0, remaining),
        "max_queries_per_hour": MAX_GUEST_REQUESTS,
        "message": "Register for unlimited queries!"
    }