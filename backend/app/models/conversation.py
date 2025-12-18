# backend/app/models/conversation.py
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

# ==========================================================
# MANY-TO-MANY: Conversation ↔ Documents ONLY
# ==========================================================
conversation_documents = Table(
    'conversation_documents',
    Base.metadata,
    Column('conversation_id', Integer, ForeignKey('conversations.id', ondelete='CASCADE'), primary_key=True),
    Column('document_id', Integer, ForeignKey('documents.id', ondelete='CASCADE'), primary_key=True),
    Column('added_at', DateTime, default=datetime.utcnow)
)

# ==========================================================
# CONVERSATION MODEL
# ==========================================================
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_pinned = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="conversations")
    
    # ✅ ONE-TO-MANY: 1 Conversation → nhiều Queries (qua FK)
    queries = relationship(
        "Query",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Query.created_at"
    )
    
    # ✅ MANY-TO-MANY: Conversation ↔ Documents
    documents = relationship(
        "Document",
        secondary=conversation_documents,
        back_populates="conversations"
    )

    def __repr__(self):
        return f"<Conversation(id={self.id}, title={self.title}, user_id={self.user_id})>"
