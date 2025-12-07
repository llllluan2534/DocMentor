from sqlalchemy.orm import Session
from typing import List, Dict, Any
import time
import logging
from ..config import settings
from ..models.document import Document, Query as QueryModel
from ..models.user import User
from .embedding_service_gemini import EmbeddingServiceGemini
from .gemini_service import GeminiService
from ..utils.text_normalizer import normalize_text
from ..utils.prompts import (
    SYSTEM_INSTRUCTION,
    RAG_QUERY_TEMPLATE,
    format_context,
    NO_RESULT_RESPONSE
)

logger = logging.getLogger(__name__)

class RAGServiceGemini:
    """RAG Service using optimized prompts"""

    def __init__(self):
        self.embedding_service = EmbeddingServiceGemini()
        self.gemini_service = GeminiService()

    async def query_documents(
        self,
        db: Session,
        user: User,
        query_text: str,
        document_ids: List[int],
        max_results: int = 5
    ) -> Dict[str, Any]:
        """Main RAG pipeline with optimized prompts"""
        start_time = time.time()

        try:
            logger.info(f"🔍 Processing query from user {user.id}: '{query_text}'")

            # Step 1: Validate documents
            documents = db.query(Document).filter(
                Document.id.in_(document_ids),
                Document.user_id == user.id,
                Document.processed == True
            ).all()
            
            if not documents:
                return {
                    'answer': "Không tìm thấy tài liệu phù hợp hoặc tài liệu chưa được xử lý.",
                    'sources': [],
                    'confidence_score': 0.0,
                    'processing_time_ms': int((time.time() - start_time) * 1000)
                }
            
            valid_doc_ids = [doc.id for doc in documents]
            doc_map = {doc.id: doc for doc in documents}
            
            # Step 2: Search similar chunks
            logger.info(f"🔎 Searching in vector database...")
            matches = await self.embedding_service.search_similar_chunks(
                query=query_text,
                document_ids=valid_doc_ids,
                top_k=max_results
            )
            
            if not matches or matches[0]['score'] < 0.3:
                return {
                    'answer': NO_RESULT_RESPONSE.format(query=query_text),
                    'sources': [],
                    'confidence_score': 0.0,
                    'processing_time_ms': int((time.time() - start_time) * 1000)
                }
            
            # Step 3: Build context với format mới ✅
            logger.info(f"📝 Building context from {len(matches)} chunks...")
            context = format_context(matches, doc_map)
            
            # Step 4: Generate answer với prompt template mới ✅
            logger.info(f"🤖 Generating answer with optimized prompt...")
            prompt = RAG_QUERY_TEMPLATE.format(
                context=context,
                question=query_text
            )
            
            # Call Gemini với system instruction
            answer = await self.gemini_service.generate_answer(
                query=query_text,
                context=context,
                system_instruction=SYSTEM_INSTRUCTION
            )
            
            # Step 5: Prepare sources
            sources = self._format_sources(matches, doc_map)
            
            # Step 6: Calculate confidence
            avg_similarity = sum(m['score'] for m in matches) / len(matches)
            confidence_score = min(avg_similarity * 1.5, 1.0)
            
            # Step 7: Save query
            query_record = QueryModel(
                user_id=user.id,
                query_text=query_text,
                response_text=answer,
                sources=[{
                    'document_id': m['document_id'],
                    'chunk_index': m['chunk_index'],  
                    'score': m['score']
                } for m in matches], 
                execution_time=int((time.time() - start_time) * 1000)
            )
            db.add(query_record)
            db.commit()
            db.refresh(query_record)
            
            processing_time = int((time.time() - start_time) * 1000)
            logger.info(f"✅ Query completed in {processing_time}ms")
            
            return {
                'query_id': query_record.id,
                'answer': answer,
                'sources': sources,
                'confidence_score': round(confidence_score, 2),
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            logger.error(f"❌ Error in RAG pipeline: {str(e)}")
            raise

    # ==============================================================
    # 🔧 Private helper methods
    # ==============================================================

    def _build_context(self, matches: List[Dict], doc_map: Dict[int, Document]) -> str:
        """Build context string from matched chunks."""
        context_parts = []

        for idx, match in enumerate(matches[:3]):  # Top 3 chunks only
            doc_id = match['document_id']
            doc_title = doc_map.get(doc_id).title if doc_id in doc_map else "Unknown"
            text = match['text']

            context_parts.append(
                f"[Nguồn {idx+1}: {doc_title}]\n{text}\n"
            )

        return "\n".join(context_parts)

    def _format_sources(self, matches: List[Dict], doc_map: Dict[int, Document]) -> List[Dict]:
        """
        ✅ Format metadata theo đúng SourceSchema
        
        Required fields:
        - document_id: int
        - document_title: Optional[str]
        - page_number: Optional[int]
        - similarity_score: Optional[float]
        - text: Optional[str]
        """
        sources = []

        for match in matches:
            doc_id = match['document_id']
            doc = doc_map.get(doc_id)

            sources.append({
                'document_id': doc_id,
                'document_title': doc.title if doc else "Unknown Document",
                'page_number': match.get('page_number'),  # Có thể None
                'similarity_score': round(match['score'], 3),
                'text': match['text'][:300] + "..." if len(match['text']) > 300 else match['text']
            })

        return sources

    def _generate_no_result_response(self, query: str) -> str:
        """Generate helpful fallback message."""
        return (
            f"Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi \"{query}\" trong các tài liệu đã chọn.\n\n"
            "Gợi ý:\n"
            "- Thử diễn đạt câu hỏi theo cách khác\n"
            "- Kiểm tra xem đã chọn đúng tài liệu chưa\n"
            "- Upload thêm tài liệu có nội dung liên quan"
        )

    def get_user_query_history(
        self,
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 50
    ) -> List[QueryModel]:

        return (
            db.query(QueryModel)
            .filter(QueryModel.user_id == user.id)
            .order_by(QueryModel.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )