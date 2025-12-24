from sqlalchemy.orm import Session
from typing import List, Dict, Any, Tuple
import time
import logging
import re
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
    """RAG Service using optimized prompts with source extraction"""

    def __init__(self):
        self.embedding_service = EmbeddingServiceGemini()
        self.gemini_service = GeminiService()

    # ============================================================================
    # 1. EXTRACT SOURCES (Helper Function)
    # ============================================================================
    def extract_sources_from_response(
        self,
        answer_text: str,
        retrieved_chunks: List[Dict],
        doc_map: Dict[int, Document]
    ) -> Tuple[str, List[Dict]]:
        """
        Extract source citations from AI response and map to actual documents
        """
        sources = []
        citation_map = {}
        
        # 1. Build map: Index (1, 2, 3...) -> Document Info
        # retrieved_chunks đã được sort theo thứ tự đưa vào context cho AI
        for idx, chunk in enumerate(retrieved_chunks, 1):
            raw_doc_id = chunk.get('document_id')
            
            # Ép kiểu ID về int
            try:
                doc_id = int(raw_doc_id)
            except (ValueError, TypeError):
                doc_id = raw_doc_id

            doc = doc_map.get(doc_id)
            
            # Fallback title
            doc_title = "Tài liệu không tên"
            if doc:
                doc_title = doc.title
            elif chunk.get('metadata') and 'title' in chunk['metadata']:
                doc_title = chunk['metadata']['title']

            citation_map[idx] = {
                'document_id': doc_id,
                'document_title': doc_title, # ✅ Quan trọng: Phải có Title cho Frontend
                'page_number': chunk.get('page_number'),
                'similarity_score': chunk.get('score', 0.0),
                'text': chunk.get('text', '')[:200] + "..." # Snippet cho tooltip
            }
        
        # 2. Regex tìm tất cả citation trong text: [1], [2], [1, 5]
        citation_pattern = r'\[(\d+(?:,\s*\d+)*)\]'
        citations = re.findall(citation_pattern, answer_text)
        
        # Collect unique cited sources
        cited_indices = set()
        for citation in citations:
            # Tách [1, 2] thành 1 và 2
            nums = [int(n.strip()) for n in citation.split(',') if n.strip().isdigit()]
            cited_indices.update(nums)
        
        # 3. Build sources list (chỉ lấy những nguồn AI thực sự dùng)
        for idx in sorted(cited_indices):
            if idx in citation_map:
                sources.append(citation_map[idx])
        
        # 4. Clean text
        # Loại bỏ pattern [Nguồn X: ...] nếu có
        cleaned_text = re.sub(r'\[(?:Nguồn|Source)\s*\d+:\s*[^\]]+\]', '', answer_text).strip()
        
        # Loại bỏ section "NGUỒN THAM KHẢO" ở cuối (AI hay tự thêm)
        cleaned_text = re.sub(
            r'(?i)\n+━+\s*📚?\s*NGUỒN THAM KHẢO.*$', 
            '', 
            cleaned_text, 
            flags=re.DOTALL
        ).strip()
        
        # 5. Fallback: Nếu AI trả lời nhưng quên trích dẫn [x], lấy top 3 chunks làm nguồn
        if not sources and retrieved_chunks:
            logger.warning("⚠️ AI forgot sources citation - adding top 3 automatically")
            for idx in range(1, min(4, len(retrieved_chunks) + 1)):
                if idx in citation_map:
                    sources.append(citation_map[idx])

        return cleaned_text, sources

    # ============================================================================
    # 2. MAIN QUERY FUNCTION
    # ============================================================================
    async def query_documents(
        self,
        db: Session,
        user: User,
        query_text: str,
        document_ids: List[int],
        max_results: int = 10 
    ) -> Dict[str, Any]:
        """Main RAG pipeline with source extraction"""
        start_time = time.time()

        try:
            logger.info(f"🔍 Processing query from user {user.id}: '{query_text}'")

            # --- Step 1: Validate Documents ---
            documents = db.query(Document).filter(
                Document.id.in_(document_ids),
                Document.user_id == user.id,
                Document.processed == True
            ).all()
            
            if not documents:
                return {
                    'query_id': None,
                    'answer': "Không tìm thấy tài liệu phù hợp hoặc tài liệu chưa được xử lý.",
                    'sources': [],
                    'confidence_score': 0.0,
                    'processing_time_ms': int((time.time() - start_time) * 1000)
                }
            
            valid_doc_ids = [doc.id for doc in documents]
            doc_map = {doc.id: doc for doc in documents}
            
            # --- Step 2: Semantic Search (Embeddings) ---
            logger.info(f"🔎 Searching chunks for docs: {valid_doc_ids}")
            matches = []
            
            # Chiến lược tìm kiếm:
            # Nếu user chọn > 1 file, ta tìm kiếm riêng lẻ từng file rồi gộp lại
            # Để tránh việc 1 file dài chiếm hết kết quả tìm kiếm
            if len(valid_doc_ids) > 1:
                # Chia quota: Ví dụ max 15 results, 3 file -> mỗi file lấy 5 chunk
                chunks_per_doc = max(3, int(max_results / len(valid_doc_ids)) + 2)
                
                for doc_id in valid_doc_ids:
                    doc_matches = await self.embedding_service.search_similar_chunks(
                        query=query_text,
                        document_ids=[doc_id], 
                        top_k=chunks_per_doc
                    )
                    matches.extend(doc_matches)
                
                # Sort lại theo độ tương đồng và cắt đúng số lượng cần thiết
                matches.sort(key=lambda x: x['score'], reverse=True)
                matches = matches[:max_results + 5] # Lấy dư một chút
            else:
                # Nếu chỉ 1 file thì search bình thường
                matches = await self.embedding_service.search_similar_chunks(
                    query=query_text,
                    document_ids=valid_doc_ids,
                    top_k=max_results
                )
            
            # Check if relevant content found
            if not matches or matches[0]['score'] < 0.25:
                return {
                    'query_id': None,
                    'answer': NO_RESULT_RESPONSE.format(query=query_text),
                    'sources': [],
                    'confidence_score': 0.0,
                    'processing_time_ms': int((time.time() - start_time) * 1000)
                }
            
            # --- Step 3: Build Context ---
            logger.info(f"📝 Building context from {len(matches)} chunks...")
            # format_context sẽ đánh số [1], [2]... tương ứng thứ tự matches
            context = format_context(matches, doc_map)
            
            # --- Step 4: Call Gemini ---
            logger.info(f"🤖 Generating answer with optimized prompt...")
            raw_answer = await self.gemini_service.generate_answer(
                query=query_text,
                context=context,
                system_instruction=SYSTEM_INSTRUCTION
            )
            
            # --- Step 5: Extract & Clean Sources ---
            logger.info(f"🔍 Extracting sources from AI response...")
            cleaned_answer, sources = self.extract_sources_from_response(
                raw_answer,
                matches,
                doc_map
            )
            
            # --- Step 6: Save to DB (History) ---
            # Tính điểm tin cậy trung bình
            avg_similarity = sum(m['score'] for m in matches) / len(matches)
            confidence_score = min(avg_similarity * 1.5, 1.0)
            
            query_record = QueryModel(
                user_id=user.id,
                query_text=query_text,
                response_text=cleaned_answer, # Lưu text sạch
                sources=sources,              # ✅ Lưu JSON sources đầy đủ (có title)
                execution_time=int((time.time() - start_time) * 1000),
                rating=None
            )
            
            # Link query với documents (Bảng trung gian)
            query_record.documents = documents
            
            db.add(query_record)
            db.commit()
            db.refresh(query_record)
            
            processing_time = int((time.time() - start_time) * 1000)
            logger.info(f"✅ Query completed in {processing_time}ms with {len(sources)} sources")
            
            return {
                'query_id': query_record.id,
                'answer': cleaned_answer,
                'sources': sources,
                'confidence_score': round(confidence_score, 2),
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            logger.error(f"❌ Error in RAG pipeline: {str(e)}")
            # Không raise lỗi để tránh crash UI, trả về thông báo lỗi nhẹ
            return {
                'query_id': None,
                'answer': "Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu này. Vui lòng thử lại.",
                'sources': [],
                'confidence_score': 0.0,
                'processing_time_ms': 0
            }

    # ==============================================================
    # 🔧 Private helper methods
    # ==============================================================

    def _format_sources(self, matches: List[Dict], doc_map: Dict[int, Document]) -> List[Dict]:
        """
        Format metadata for sources (legacy format - use extract_sources_from_response instead)
        """
        sources = []

        for match in matches:
            doc_id = match['document_id']
            doc = doc_map.get(doc_id)

            sources.append({
                'document_id': str(doc_id),
                'document_title': doc.title if doc else "Unknown Document",
                'page_number': match.get('page_number'),
                'similarity_score': round(match['score'], 3),
                'text': match['text'][:300] + "..." if len(match['text']) > 300 else match['text']
            })

        return sources

    def get_user_query_history(
        self,
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 50
    ) -> List[QueryModel]:
        """Get user's query history"""
        return (
            db.query(QueryModel)
            .filter(QueryModel.user_id == user.id)
            .order_by(QueryModel.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )