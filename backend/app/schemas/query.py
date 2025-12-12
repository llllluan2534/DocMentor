from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import List, Dict, Any, Optional
import re

# ============================================================
# REQUEST SCHEMAS
# ============================================================

class QueryRequest(BaseModel):
    query_text: str = Field(..., min_length=1, max_length=500)
    document_ids: List[int] = Field(default=[])
    max_results: int = Field(default=5, ge=1, le=10)
    conversation_id: Optional[int] = None

    @field_validator("document_ids")
    @classmethod
    def validate_document_ids(cls, v):
        if v is None:
            return []
        return [doc_id for doc_id in v if isinstance(doc_id, int) and doc_id > 0]
    
    @field_validator("query_text")
    @classmethod
    def clean_query_text(cls, v):
        if v:
            v = re.sub(r"<[^>]*>", "", v)
            v = v.strip()
        return v


# ============================================================
# FEEDBACK SCHEMAS
# ============================================================

class QueryFeedbackBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating từ 1-5 sao")
    feedback_text: Optional[str] = Field(None, max_length=500)

    @field_validator("feedback_text")
    @classmethod
    def clean_feedback(cls, v):
        if v:
            v = re.sub(r"<[^>]*>", "", v)
            v = v.strip()
        return v


class QueryFeedbackCreate(BaseModel):
    query_id: int
    rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None


class QueryFeedback(QueryFeedbackBase):
    id: int
    query_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# RESPONSE SCHEMAS
# ============================================================

# ✅ MỚI: Định nghĩa thông tin file gọn nhẹ để trả về kèm tin nhắn
class DocumentTiny(BaseModel):
    id: int
    title: str
    file_path: Optional[str] = None

    class Config:
        from_attributes = True

class SourceSchema(BaseModel):
    document_id: int
    document_title: Optional[str] = None
    page_number: Optional[int] = None
    similarity_score: Optional[float] = None
    text: Optional[str] = None


class QueryResponse(BaseModel):
    query_id: Optional[int] = None 
    query_text: str
    answer: str
    sources: List[SourceSchema] = [] # Mặc định là list rỗng tránh null
    
    # ✅ MỚI: Thêm trường này để Backend trả về file đính kèm
    documents: List[DocumentTiny] = [] 
    
    processing_time_ms: int
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class QueryHistory(BaseModel):
    queries: List[QueryResponse]
    total: int