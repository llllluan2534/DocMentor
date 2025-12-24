from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging
import httpx # ✅ Cần import thư viện này
import io
from fastapi import HTTPException, status

from ..models.document import Document
from ..models.user import User
from ..services.gemini_service import GeminiService
from ..services.document_processor import DocumentProcessor

logger = logging.getLogger(__name__)

class AnalysisService:
    """Service for document analysis features"""
    
    def __init__(self):
        self.gemini_service = GeminiService()
        self.doc_processor = DocumentProcessor()
    
    # ✅ Helper function để tải file từ URL
    async def _download_file(self, file_path: str) -> bytes:
        if file_path.startswith("http"):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(file_path, timeout=30.0)
                    response.raise_for_status()
                    return response.content
            except Exception as e:
                logger.error(f"❌ Failed to download file for analysis: {e}")
                raise HTTPException(status_code=400, detail="Could not download file content")
        else:
            # Fallback cho file local cũ (nếu có)
            with open(file_path, "rb") as f:
                return f.read()

    async def generate_summary(
        self,
        db: Session,
        user: User,
        document_id: int,
        length: str = "medium"
    ) -> Dict[str, Any]:
        """Generate document summary"""
        try:
            # Get document
            document = db.query(Document).filter(
                Document.id == document_id,
                Document.user_id == user.id
            ).first()
            
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
            
            # ✅ Bước 1: Tải file bytes về
            logger.info(f"⬇️ Downloading content for analysis: {document.title}")
            file_bytes = await self._download_file(document.file_path)
            
            # ✅ Bước 2: Extract text từ bytes (Thay vì truyền path)
            logger.info(f"📄 Extracting text...")
            text = ""
            file_ext = document.file_type.lower()

            if 'pdf' in file_ext:
                text = self.doc_processor.extract_pdf(file_bytes)
            elif 'docx' in file_ext or 'doc' in file_ext:
                text = self.doc_processor.extract_docx(file_bytes)
            elif 'txt' in file_ext:
                text = self.doc_processor.extract_txt(file_bytes)
            else:
                # Thử fallback PDF nếu không nhận diện được
                try:
                    text = self.doc_processor.extract_pdf(file_bytes)
                except:
                    raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")
            
            if len(text) < 50:
                raise HTTPException(status_code=400, detail="Document content is too short/empty")
            
            # ✅ Bước 3: Gọi Gemini
            logger.info(f"🤖 Generating {length} summary...")
            summary = await self.gemini_service.generate_summary(text[:30000], length) # Giới hạn 30k ký tự để tránh lỗi token
            
            return {
                'document_id': document.id,
                'document_title': document.title,
                'summary': summary,
                'length': length,
                'word_count': len(summary.split())
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error generating summary: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    async def generate_quiz(
        self,
        db: Session,
        user: User,
        document_id: int,
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> Dict[str, Any]:
        """Generate quiz from document"""
        try:
            document = db.query(Document).filter(
                Document.id == document_id,
                Document.user_id == user.id
            ).first()
            
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
            
            # ✅ Bước 1: Tải file
            file_bytes = await self._download_file(document.file_path)
            
            # ✅ Bước 2: Extract
            text = ""
            file_ext = document.file_type.lower()
            
            if 'pdf' in file_ext:
                text = self.doc_processor.extract_pdf(file_bytes)
            elif 'docx' in file_ext:
                text = self.doc_processor.extract_docx(file_bytes)
            elif 'txt' in file_ext:
                text = self.doc_processor.extract_txt(file_bytes)
            else:
                 try: text = self.doc_processor.extract_pdf(file_bytes)
                 except: raise HTTPException(status_code=400, detail="Unsupported file type")
            
            # ✅ Bước 3: Generate Quiz
            logger.info(f"📝 Generating quiz...")
            # Giới hạn context window cho Quiz
            questions = await self.gemini_service.generate_quiz(
                text[:25000], 
                num_questions, 
                difficulty
            )
            
            return questions # Gemini Service trả về list dict rồi
            
        except Exception as e:
            logger.error(f"❌ Error generating quiz: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")