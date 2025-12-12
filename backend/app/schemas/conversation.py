from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

# ✅ MỚI: Import QueryResponse từ file query.py để lấy cấu trúc đầy đủ (có documents)
from .query import QueryResponse

# ============================================================
# REQUEST SCHEMAS
# ============================================================

class ConversationCreate(BaseModel):
    """Create new conversation with optional initial query"""
    title: str = Field(..., min_length=1, max_length=255)
    document_ids: Optional[List[int]] = Field(default=None, description="Documents to attach")
    initial_query: Optional[str] = Field(default=None, description="First query in conversation")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Discuss AI concepts",
                "document_ids": [1, 2, 3],
                "initial_query": "Tóm tắt các tài liệu này"
            }
        }


class ConversationUpdate(BaseModel):
    """Update conversation title"""
    title: str = Field(..., min_length=1, max_length=255)


class AddQueryToConversation(BaseModel):
    """Add existing query to conversation"""
    query_id: int


# ============================================================
# RESPONSE SCHEMAS
# ============================================================

class ConversationBase(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationWithCounts(ConversationBase):
    """Conversation with query and document counts"""
    query_count: int = 0
    document_count: int = 0


# (Class QuerySummary cũ đã bị loại bỏ vì thiếu thông tin documents/answer)


class ConversationDetail(ConversationBase):
    """Full conversation with queries and documents"""
    
    # ✅ ĐÃ SỬA: Dùng QueryResponse thay vì QuerySummary
    # Giúp frontend nhận được đầy đủ: query_text, answer, DOCUMENTS, sources...
    queries: List[QueryResponse] = []
    
    document_ids: List[int] = []


class ConversationList(BaseModel):
    """Paginated list of conversations"""
    conversations: List[ConversationWithCounts]
    total: int
    skip: int
    limit: int