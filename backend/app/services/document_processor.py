from sqlalchemy.orm import Session
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict, Any
import fitz  # PyMuPDF
import logging
import requests
import os
import io
from ..models.document import Document
from .embedding_service_gemini import EmbeddingServiceGemini
# ✅ Setup logging properly
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        self.embedding_service = EmbeddingServiceGemini()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
    # ✅ Helper to get content from URL or Local
    def _get_file_content(self, file_path: str) -> bytes:
        """Download file content from URL or read local file"""
        if file_path.startswith("http"):
            logger.info(f"🌐 Downloading file from URL: {file_path}")
            try:
                # Set a timeout to prevent hanging
                response = requests.get(file_path, timeout=30) 
                response.raise_for_status()
                return response.content
            except Exception as e:
                raise Exception(f"Failed to download file from Cloud: {str(e)}")
        else:
            # Fallback for old local files
            if not os.path.exists(file_path):
                raise Exception(f"File not found on server (Local): {file_path}")
            with open(file_path, "rb") as f:
                return f.read()
    
    async def process_document(self, db: Session, document_id: int, file_path: str):
        try:
            logger.info(f"🔄 START Processing document {document_id}")
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document: 
                raise Exception(f"Document {document_id} not found")

            # Step 1: Extract text
            logger.info("📄 Step 1: Extracting text...")
            
            # Logic to determine file extension
            file_ext = ""
            if "." in file_path:
                # Handle URLs with query params
                clean_path = file_path.split("?")[0]
                file_ext = clean_path.split(".")[-1].lower()
            elif document.file_type:
                file_ext = document.file_type.lower()

            if file_ext == 'pdf' or document.file_type == 'pdf':
                text = self.extract_pdf(file_path)
            elif file_ext == 'docx' or document.file_type == 'docx':
                text = self.extract_docx(file_path)
            elif file_ext == 'txt' or document.file_type == 'txt':
                text = self.extract_txt(file_path)
            else:
                raise Exception(f"Unsupported file type: {file_ext}")
            
            if not text or len(text.strip()) < 100:
                raise Exception(f"Document is empty or too short: {len(text) if text else 0} chars")
            
            logger.info(f"✅ Extracted {len(text)} characters")
            
            # Step 2: Split into chunks
            logger.info("✂️ Step 2: Splitting into chunks...")
            text_chunks = self.text_splitter.split_text(text)
            
            # Step 3: Prepare metadata
            chunks_with_metadata = []
            for idx, chunk_text in enumerate(text_chunks):
                chunks_with_metadata.append({
                    'text': chunk_text,
                    'chunk_index': idx,
                    'page_number': self._extract_page_number_from_text(chunk_text),
                    'metadata': {
                        'file_type': document.file_type,
                        'title': document.title
                    }
                })
            
            # Step 4: Embed & Store
            logger.info("🔮 Step 4: Creating embeddings...")
            await self.embedding_service.store_chunks(
                document_id=document_id,
                chunks=chunks_with_metadata
            )
            
            # Step 5: Update DB
            existing_metadata = document.metadata_ or {}
            document.metadata_ = {
                **existing_metadata,
                'total_chunks': len(text_chunks),
                'total_characters': len(text),
                'processing_status': 'completed'
            }
            document.processed = True
            db.commit()
            logger.info(f"✅ Successfully processed document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error processing document {document_id}: {str(e)}")
            try:
                # Update status to failed
                document = db.query(Document).filter(Document.id == document_id).first()
                if document:
                    meta = document.metadata_ or {}
                    document.metadata_ = {**meta, 'processing_status': 'failed', 'error': str(e)}
                    db.commit()
            except:
                pass
            raise
    
    # ✅ Updated Extract Methods using _get_file_content
    def extract_pdf(self, file_path: str) -> str:
        text = ""
        try:
            file_bytes = self._get_file_content(file_path)
            with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                for i, page in enumerate(doc):
                    page_text = page.get_text("text")
                    if page_text:
                        text += f"\n[Page {i + 1}]\n{page_text}"
            return text.strip()
        except Exception as e:
            logger.error(f"❌ Error extracting PDF: {str(e)}")
            raise

    def extract_docx(self, file_path: str) -> str:
        try:
            file_bytes = self._get_file_content(file_path)
            file_stream = io.BytesIO(file_bytes)
            doc = DocxDocument(file_stream)
            text = "\n".join([p.text for p in doc.paragraphs if p.text])
            return text.strip()
        except Exception as e:
            logger.error(f"❌ Error extracting DOCX: {str(e)}")
            raise

    def extract_txt(self, file_path: str) -> str:
        try:
            file_bytes = self._get_file_content(file_path)
            try:
                return file_bytes.decode('utf-8').strip()
            except:
                return file_bytes.decode('latin-1').strip()
        except Exception as e:
            logger.error(f"❌ Error extracting TXT: {str(e)}")
            raise
        
    def _extract_page_number_from_text(self, chunk_text: str) -> int:
        import re
        match = re.search(r'\[Page (\d+)\]', chunk_text)
        if match: return int(match.group(1))
        return 0