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
    # ✅ NEW: Extract sources from AI response
    # ============================================================================
    def extract_sources_from_response(
        self,
        answer_text: str,
        retrieved_chunks: List[Dict],
        doc_map: Dict[int, Document]
    ) -> Tuple[str, List[Dict]]:
        """
        Extract source citations from AI response and map to actual documents
        
        Args:
            answer_text: Raw AI response with citations [1], [2], etc.
            retrieved_chunks: Original chunks used for context
            doc_map: Mapping of document IDs to Document objects
            
        Returns:
            Tuple of (cleaned_text, sources_list)
        """
        sources = []
        citation_map = {}
        
        # Build map: citation number -> document info
        for idx, chunk in enumerate(retrieved_chunks, 1):
            raw_doc_id = chunk.get('document_id')
            
            # ⚡ FIX: Ép kiểu ID về int để tìm trong doc_map (DB dùng int)
            try:
                doc_id = int(raw_doc_id)
            except (ValueError, TypeError):
                doc_id = raw_doc_id

            doc = doc_map.get(doc_id)
            
            # ⚡ FIX: Fallback lấy title từ metadata nếu không tìm thấy trong DB
            doc_title = "Tài liệu không tên"
            if doc:
                doc_title = doc.title
            elif chunk.get('metadata') and 'title' in chunk['metadata']:
                doc_title = chunk['metadata']['title']

            citation_map[idx] = {
                'document_id': str(doc_id),
                'document_title': doc_title, # Luôn có giá trị
                'page_number': chunk.get('page_number'),
                'similarity_score': chunk.get('score', 0.0)
            }
        
        # Find all citations in text: [1], [2], [1, 2]
        citation_pattern = r'\[(\d+(?:,\s*\d+)*)\]'
        citations = re.findall(citation_pattern, answer_text)
        
        # Collect unique cited sources
        cited_indices = set()
        for citation in citations:
            nums = [int(n.strip()) for n in citation.split(',')]
            cited_indices.update(nums)
        
        # Build sources list from actual citations
        for idx in sorted(cited_indices):
            if idx in citation_map:
                sources.append(citation_map[idx])
        
        # Clean text: Remove [Nguồn X: ...] patterns but keep [1], [2]
        cleaned_text = re.sub(
            r'\[(?:Nguồn|Source)\s*\d+:\s*[^\]]+\]',
            '',
            answer_text
        ).strip()
        
        # ✅ Remove "NGUỒN THAM KHẢO" section if exists (AI sometimes adds it)
        cleaned_text = re.sub(
            r'━+\s*📚\s*NGUỒN THAM KHẢO\s*━+.*$',
            '',
            cleaned_text,
            flags=re.DOTALL | re.MULTILINE
        ).strip()
        
        # If no explicit citations found, use top 3 chunks as sources
        if not sources and retrieved_chunks:
            for idx in range(min(3, len(retrieved_chunks))):
                if idx + 1 in citation_map:
                    sources.append(citation_map[idx + 1])

        return cleaned_text, sources

    # ============================================================================
    # Main RAG Pipeline
    # ============================================================================
    async def query_documents(
        self,
        db: Session,
        user: User,
        query_text: str,
        document_ids: List[int],
        max_results: int = 5
    ) -> Dict[str, Any]:
        """Main RAG pipeline with source extraction"""
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
            logger.info(f"🔎 Searching chunks for docs: {valid_doc_ids}")
            matches = []
            
            # Nếu user chọn nhiều file (ví dụ so sánh), ta chia đều quota cho mỗi file
            # Ví dụ: max_results=15, chọn 2 file -> mỗi file lấy 8 chunks (làm tròn lên)
            if len(valid_doc_ids) > 1:
                chunks_per_doc = max(5, int(max_results / len(valid_doc_ids)) + 2) # +2 để dư ra chút
                
                for doc_id in valid_doc_ids:
                    doc_matches = await self.embedding_service.search_similar_chunks(
                        query=query_text,
                        document_ids=[doc_id], # Search riêng từng file
                        top_k=chunks_per_doc
                    )
                    matches.extend(doc_matches)
                
                # Sort lại theo score để chunks tốt nhất lên đầu
                matches.sort(key=lambda x: x['score'], reverse=True)
                # Cắt bớt nếu quá nhiều (giới hạn context window)
                matches = matches[:max_results * 2] 
            else:
                # Nếu chỉ 1 file thì search bình thường
                matches = await self.embedding_service.search_similar_chunks(
                    query=query_text,
                    document_ids=valid_doc_ids,
                    top_k=max_results
                )
            
            if not matches or matches[0]['score'] < 0.25:
                return {
                    'answer': NO_RESULT_RESPONSE.format(query=query_text),
                    'sources': [],
                    'confidence_score': 0.0,
                    'processing_time_ms': int((time.time() - start_time) * 1000)
                }
            
            # Step 3: Build context with new format
            logger.info(f"📝 Building context from {len(matches)} chunks...")
            context = format_context(matches, doc_map)
            
            # Step 4: Generate answer with prompt template
            logger.info(f"🤖 Generating answer with optimized prompt...")
            raw_answer = await self.gemini_service.generate_answer(
                query=query_text,
                context=context,
                system_instruction=SYSTEM_INSTRUCTION
            )
            
            # ✅ Step 5: Extract sources from response
            logger.info(f"🔍 Extracting sources from AI response...")
            cleaned_answer, sources = self.extract_sources_from_response(
                raw_answer,
                matches,
                doc_map
            )
            
            # Step 6: Calculate confidence
            avg_similarity = sum(m['score'] for m in matches) / len(matches)
            confidence_score = min(avg_similarity * 1.5, 1.0)
            
            # Step 7: Save query with document associations
            query_record = QueryModel(
                user_id=user.id,
                query_text=query_text,
                response_text=cleaned_answer,  # ✅ Save cleaned version
                sources=[{
                    'document_id': m['document_id'],
                    'chunk_index': m['chunk_index'],  
                    'score': m['score']
                } for m in matches], 
                execution_time=int((time.time() - start_time) * 1000)
            )
            
            # ✅ Associate documents with query for relationship tracking
            query_record.documents = documents
            
            db.add(query_record)
            db.commit()
            db.refresh(query_record)
            
            processing_time = int((time.time() - start_time) * 1000)
            logger.info(f"✅ Query completed in {processing_time}ms with {len(sources)} sources")
            
            return {
                'query_id': query_record.id,
                'answer': cleaned_answer,  # ✅ Return cleaned answer
                'sources': sources,  # ✅ Return extracted sources
                'confidence_score': round(confidence_score, 2),
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            logger.error(f"❌ Error in RAG pipeline: {str(e)}")
            raise

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