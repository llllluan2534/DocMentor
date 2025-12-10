import google.generativeai as genai
from typing import List, Dict, Any
import logging
import json
import re
from ..config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    """Service for Google Gemini AI - using Gemini 2.0 Flash (Free)"""
    
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.chat_model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Configure safety settings (less strict for education)
        self.safety_settings = {
            'HARM_CATEGORY_HARASSMENT': 'BLOCK_NONE',
            'HARM_CATEGORY_HATE_SPEECH': 'BLOCK_NONE',
            'HARM_CATEGORY_SEXUALLY_EXPLICIT': 'BLOCK_NONE',
            'HARM_CATEGORY_DANGEROUS_CONTENT': 'BLOCK_NONE',
        }
        
        logger.info("✅ Gemini 2.0 Flash initialized")
    
    def _safe_get_text(self, response) -> str:
        """Safely extract text from Gemini response"""
        try:
            if hasattr(response, 'text') and response.text:
                return response.text.strip()
            
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                
                if hasattr(candidate, 'finish_reason'):
                    finish_reason = candidate.finish_reason
                    if finish_reason == 3:  # SAFETY
                        logger.warning("⚠️ Response blocked by safety filter")
                        return ""
                    elif finish_reason == 2:  # MAX_TOKENS
                        if hasattr(candidate.content, 'parts') and candidate.content.parts:
                            return candidate.content.parts[0].text
                
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    if candidate.content.parts:
                        return candidate.content.parts[0].text
            
            return ""
            
        except Exception as e:
            logger.error(f"❌ Error extracting text: {str(e)}")
            return ""
    
    # ============================================================================
    # 🔧 NEW: Helper function - Ensure sources section exists
    # ============================================================================
    def _ensure_sources_section(self, response_text: str, context: str) -> str:
        """
        Safety net: Tự động thêm section nguồn nếu AI quên
        
        Args:
            response_text: Câu trả lời từ AI
            context: Context string chứa thông tin nguồn
            
        Returns:
            Response có đảm bảo section nguồn
        """
        # Kiểm tra xem đã có section nguồn chưa
        if "📚 NGUỒN THAM KHẢO" in response_text or "NGUỒN THAM KHẢO" in response_text:
            return response_text
        
        logger.warning("⚠️ AI forgot sources section - adding automatically")
        
        # Nếu chưa có → Tự động thêm vào
        sources_section = "\n\n" + "━" * 80 + "\n"
        sources_section += "📚 NGUỒN THAM KHẢO\n"
        sources_section += "━" * 80 + "\n\n"
        
        # Format: [Nguồn 1: Tên file, Page X]
        source_pattern = r'\[Nguồn (\d+): ([^\]]+?)(, Page (\d+))?\]'
        matches = re.findall(source_pattern, context)
        
        if matches:
            seen = set()  # Tránh trùng lặp
            for idx, title, _, page in matches:
                key = f"{idx}_{title}"
                if key not in seen:
                    seen.add(key)
                    sources_section += f"{idx}  **{title.strip()}**"
                    if page:
                        sources_section += f", Page {page}"
                    sources_section += "\n"
        else:
            # Fallback nếu không parse được
            sources_section += "1  **Tài liệu đã chọn**\n"
        
        return response_text + sources_section
    
    # ============================================================================
    # 🔧 MODIFIED: generate_answer - Added safety net
    # ============================================================================
    async def generate_answer(
        self, 
        query: str, 
        context: str,
        system_instruction: str = None
    ) -> str:
        """Generate answer using Gemini with system instruction"""
        try:
            # Use system instruction nếu được cung cấp
            if system_instruction:
                # Tạo model với system instruction
                model = genai.GenerativeModel(
                    'gemini-2.0-flash',
                    system_instruction=system_instruction
                )
            else:
                model = self.chat_model
            
            # Build prompt từ template
            from ..utils.prompts import RAG_QUERY_TEMPLATE
            prompt = RAG_QUERY_TEMPLATE.format(
                context=context,
                question=query
            )
            
            logger.info("🤖 Generating answer with Gemini 1.5 Flash...")
            
            response = model.generate_content(
                prompt,
                generation_config={
                    'temperature': 0.3,
                    'top_p': 0.8,
                    'top_k': 40,
                    'max_output_tokens': 4096,
                }
            )
            
            if response.candidates:
                candidate = response.candidates[0]
                finish_reason = candidate.finish_reason
                
                if finish_reason == 2:  # MAX_TOKENS
                    logger.warning("⚠️ Response truncated (MAX_TOKENS)")
                    # Try to get partial response
                    if candidate.content and candidate.content.parts:
                        partial = candidate.content.parts[0].text.strip()
                        if partial:
                            # ✅ Apply safety net to partial response
                            partial = self._ensure_sources_section(partial, context)
                            return partial + "\n\n[Câu trả lời bị cắt ngắn do quá dài]"
                    return "Câu trả lời quá dài. Vui lòng đặt câu hỏi cụ thể hơn."
                
                elif finish_reason == 3:  # SAFETY
                    logger.warning("⚠️ Blocked by safety filter")
                    return "Tôi không thể trả lời câu hỏi này."
                
                elif finish_reason == 1:  # STOP (success)
                    answer = response.text.strip()
                    
                    # ✅ SAFETY NET: Ensure sources section exists
                    answer = self._ensure_sources_section(answer, context)
                    
                    logger.info(f"✅ Answer generated: {len(answer)} chars")
                    return answer
                
                else:
                    logger.error(f"❌ Unknown finish_reason: {finish_reason}")
                    return "Đã xảy ra lỗi khi tạo câu trả lời."
            
            # Fallback
            return "Không thể tạo câu trả lời."
            
        except Exception as e:
            logger.error(f"❌ Error generating answer: {str(e)}")
            raise

    
    async def generate_summary(self, text: str, length: str = "medium") -> str:
        """Generate summary of document"""
        try:
            length_map = {
                "short": "5 câu ngắn gọn",
                "medium": "1-2 đoạn văn (~150 từ)",
                "long": "3-4 đoạn văn (~300 từ)"
            }
            
            text_limits = {
                "short": 8000,
                "medium": 10000,
                "long": 12000
            }
            
            text_limit = text_limits.get(length, 10000)
            
            prompt = f"""Tóm tắt nội dung sau ({length_map.get(length, "1-2 đoạn văn")}):

NỘI DUNG:
{text[:text_limit]}

TÓM TẮT (chỉ tóm tắt, không thêm nhận xét):"""

            response = self.chat_model.generate_content(
                prompt,
                safety_settings=self.safety_settings,
                generation_config={
                    'temperature': 0.4,
                    'max_output_tokens': 2048,
                }
            )
            
            summary = self._safe_get_text(response)
            return summary if summary else "Không thể tạo tóm tắt. Vui lòng thử lại."
            
        except Exception as e:
            logger.error(f"❌ Error: {str(e)}")
            return "Không thể tạo tóm tắt. Vui lòng thử lại."
    
    async def extract_key_concepts(self, text: str, max_concepts: int = 10) -> List[str]:
        """Extract key concepts from text"""
        try:
            prompt = f"""Liệt kê {max_concepts} khái niệm quan trọng từ văn bản.

Yêu cầu:
- Mỗi dòng 1 khái niệm
- Chỉ tên khái niệm, không giải thích
- Không đánh số, không dấu gạch đầu dòng

VĂN BẢN:
{text[:8000]}

DANH SÁCH:"""

            response = self.chat_model.generate_content(
                prompt,
                safety_settings=self.safety_settings,
                generation_config={
                    'temperature': 0.2,
                    'max_output_tokens': 512,
                }
            )
            
            result_text = self._safe_get_text(response)
            
            if not result_text:
                logger.warning("⚠️ No concepts extracted")
                return []
            
            # Parse concepts
            concepts = []
            for line in result_text.split('\n'):
                clean = line.strip()
                clean = clean.lstrip('•-*0123456789. ')
                clean = clean.strip('"\'')
                
                if clean and len(clean) > 2 and len(clean) < 100:
                    concepts.append(clean)
            
            logger.info(f"✅ Extracted {len(concepts)} concepts")
            return concepts[:max_concepts]
            
        except Exception as e:
            logger.error(f"❌ Error: {str(e)}")
            return []
    
    async def generate_quiz(
        self, 
        text: str, 
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict[str, Any]]:
        """Generate quiz questions from text"""
        try:
            prompt = f"""Tạo CHÍNH XÁC {num_questions} câu hỏi trắc nghiệm.

YÊU CẦU:
- Tạo đúng {num_questions} câu
- Mỗi câu có 4 đáp án (A, B, C, D)
- Chỉ 1 đáp án đúng
- Format JSON

NỘI DUNG:
{text[:7000]}

JSON (chỉ JSON, không text khác):
[
  {{
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": "A",
    "explanation": "..."
  }}
]"""

            response = self.chat_model.generate_content(
                prompt,
                safety_settings=self.safety_settings,
                generation_config={
                    'temperature': 0.5,
                    'max_output_tokens': 2048,
                }
            )
            
            result_text = self._safe_get_text(response)
            
            if not result_text:
                logger.warning("⚠️ No quiz generated")
                return []
            
            # Parse JSON
            json_text = result_text
            if "```json" in json_text:
                match = re.search(r'```json\s*(.*?)\s*```', json_text, re.DOTALL)
                if match:
                    json_text = match.group(1)
            elif "```" in json_text:
                match = re.search(r'```\s*(.*?)\s*```', json_text, re.DOTALL)
                if match:
                    json_text = match.group(1)
            
            if not json_text.strip().startswith('['):
                match = re.search(r'(\[.*\])', json_text, re.DOTALL)
                if match:
                    json_text = match.group(1)
            
            questions = json.loads(json_text)
            
            # Validate questions
            valid_questions = []
            for q in questions:
                if all(key in q for key in ['question', 'options', 'correct', 'explanation']):
                    valid_questions.append(q)
            
            logger.info(f"✅ Generated {len(valid_questions)} valid questions")
            return valid_questions[:num_questions]
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"❌ Error: {str(e)}")
            return []