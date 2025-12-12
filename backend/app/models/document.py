# ==========================================================
# backend/app/models/document.py - UPDATED Query Model
# ==========================================================
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False, index=True)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    metadata_ = Column("doc_metadata", JSON, nullable=True)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="documents")
    conversations = relationship(
        "Conversation",
        secondary="conversation_documents",
        back_populates="documents"
    )

    def __repr__(self):
        return f"<Document(id={self.id}, title={self.title}, processed={self.processed})>"


# ==========================================================
# QUERY MODEL - FIXED
# ==========================================================
class Query(Base):
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # ✅ DIRECT FK to conversation (nullable - query có thể không thuộc conversation nào)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True)
    
    query_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=True)
    normalized_query = Column(String, index=True) 
    sources = Column(JSON, default=None)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    execution_time = Column(Integer, nullable=True)
    rating = Column(Float, nullable=True)

    # Relationships
    user = relationship("User", back_populates="queries")
    
    # ✅ MANY-TO-ONE: nhiều Queries → 1 Conversation
    conversation = relationship("Conversation", back_populates="queries")
    
    feedback = relationship("Feedback", uselist=False, back_populates="query", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Query(id={self.id}, user_id={self.user_id}, conversation_id={self.conversation_id})>"