# ==========================================================
# backend/app/models/user.py
# ==========================================================
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    LECTURER = "lecturer"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # ✨ Nullable for OAuth users
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)  # ✨ NEW: Profile picture
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    auth_provider = Column(String, default="email", server_default="email", nullable=False)
    google_id = Column(String, unique=True, nullable=True)  # ✨ NEW: Google user ID
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    queries = relationship("Query", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, provider={self.auth_provider})>"