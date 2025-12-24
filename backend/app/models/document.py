# backend/app/models/document.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Text, Float, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base
from .folder import Folder

# ==========================================================
# BẢNG TRUNG GIAN (QUERY <-> DOCUMENT)
# Bắt buộc phải có bảng này để lưu mối quan hệ nhiều-nhiều
# ==========================================================
query_document_association = Table(
    'query_document_association',
    Base.metadata,
    Column('query_id', Integer, ForeignKey('queries.id', ondelete='CASCADE'), primary_key=True),
    Column('document_id', Integer, ForeignKey('documents.id', ondelete='CASCADE'), primary_key=True)
)

# ==========================================================
# DOCUMENT MODEL
# ==========================================================
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

    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="documents")
    folder = relationship("Folder", back_populates="documents")
    
    # Quan hệ với Conversation 
    conversations = relationship(
        "Conversation",
        secondary="conversation_documents",
        back_populates="documents"
    )

    # Quan hệ ngược lại với Query (để biết document này thuộc query nào)
    queries = relationship(
        "Query",
        secondary=query_document_association,
        back_populates="documents"
    )

    def __repr__(self):
        return f"<Document(id={self.id}, title={self.title}, processed={self.processed})>"


# ==========================================================
# QUERY MODEL
# ==========================================================
class Query(Base):
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
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
    conversation = relationship("Conversation", back_populates="queries")
    feedback = relationship("Feedback", uselist=False, back_populates="query", cascade="all, delete-orphan")

    documents = relationship(
        "Document",
        secondary=query_document_association,
        back_populates="queries"
    )

    def __repr__(self):
        return f"<Query(id={self.id}, user_id={self.user_id}, conversation_id={self.conversation_id})>"