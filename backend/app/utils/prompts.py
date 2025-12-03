"""
Prompt templates for Gemini AI
Optimized for Vietnamese language and citation accuracy
"""

# System instruction for all Gemini calls
SYSTEM_INSTRUCTION = """Bạn là trợ lý AI thông minh của DocMentor, được thiết kế để hỗ trợ sinh viên và giảng viên trong việc học tập.

NHIỆM VỤ CHÍNH:
- Trả lời câu hỏi dựa HOÀN TOÀN trên ngữ cảnh (context) được cung cấp
- Sử dụng ngôn ngữ tiếng Việt rõ ràng, dễ hiểu
- Trích dẫn nguồn chính xác cho mọi thông tin
- Giải thích khái niệm phức tạp một cách đơn giản

NGUYÊN TẮC TRẢ LỜI:
1. Đọc kỹ toàn bộ context trước khi trả lời
2. Chỉ sử dụng thông tin có trong context
3. Không bịa đặt hoặc thêm thông tin không có trong tài liệu
4. Nếu không tìm thấy thông tin, hãy nói thẳng "Tôi không tìm thấy thông tin về vấn đề này trong tài liệu"

QUY TẮC TRÍCH DẪN:
- Format bắt buộc: [Nguồn: Tên tài liệu, Phần X]
- Đặt trích dẫn ngay sau câu hoặc đoạn văn liên quan
- Mỗi thông tin cụ thể cần có trích dẫn riêng
- Ví dụ: "Machine learning là một nhánh của AI [Nguồn: ML Basics.pdf, Chương 1]"

PHONG CÁCH VIẾT:
- Câu văn ngắn gọn, súc tích
- Giải thích rõ ràng, dễ hiểu
- Sử dụng ví dụ khi có thể
- Tránh ngôn ngữ học thuật phức tạp không cần thiết"""


# Main RAG query template
RAG_QUERY_TEMPLATE = """NGỮ CẢNH TỪ TÀI LIỆU:
{context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CÂU HỎI CỦA SINH VIÊN:
{question}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HƯỚNG DẪN TRẢ LỜI:
1. Đọc kỹ ngữ cảnh bên trên
2. Trả lời câu hỏi dựa trên ngữ cảnh
3. Trích dẫn nguồn với format: [Nguồn: Tên tài liệu]
4. Nếu không có thông tin, nói rõ "Không tìm thấy thông tin"
5. Trả lời bằng tiếng Việt, rõ ràng và chi tiết (2-4 đoạn văn)

TRẢ LỜI:"""


# Short answer template (for quick queries)
SHORT_ANSWER_TEMPLATE = """NGỮ CẢNH:
{context}

CÂU HỎI:
{question}

TRẢ LỜI NGẮN GỌN (1-2 câu):"""


# Detailed explanation template
DETAILED_EXPLANATION_TEMPLATE = """NGỮ CẢNH TỪ TÀI LIỆU:
{context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CÂU HỎI:
{question}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YÊU CẦU:
Hãy giải thích CHI TIẾT và ĐẦY ĐỦ về vấn đề này, bao gồm:
1. Định nghĩa rõ ràng
2. Giải thích cách hoạt động
3. Ví dụ minh họa (nếu có trong tài liệu)
4. So sánh với các khái niệm liên quan (nếu có)
5. Ứng dụng thực tế (nếu được đề cập)

Nhớ trích dẫn nguồn: [Nguồn: Tên tài liệu, Phần X]

TRẢ LỜI CHI TIẾT:"""


# Summary template
SUMMARY_TEMPLATE = """NỘI DUNG TÀI LIỆU:
{text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YÊU CẦU TÓM TẮT:
Độ dài: {length}
- short: 5 câu ngắn gọn, nêu ý chính
- medium: 1-2 đoạn văn, tổng quan nội dung
- long: Chi tiết theo từng phần chính

QUY TẮC:
1. Giữ nguyên các thuật ngữ chuyên môn
2. Không thêm thông tin không có trong tài liệu
3. Sử dụng ngôn ngữ rõ ràng, dễ hiểu
4. Nêu các điểm chính theo thứ tự logic

TÓM TẮT:"""


# Concept extraction template
CONCEPTS_TEMPLATE = """VĂN BẢN:
{text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YÊU CẦU:
Trích xuất {max_concepts} khái niệm/thuật ngữ QUAN TRỌNG NHẤT từ văn bản trên.

TIÊU CHÍ:
- Ưu tiên thuật ngữ chuyên môn
- Khái niệm được nhắc đến nhiều lần
- Khái niệm cốt lõi của nội dung
- Không giải thích, chỉ liệt kê tên

FORMAT:
Mỗi khái niệm trên một dòng, không đánh số, không dấu đầu dòng.

DANH SÁCH KHÁI NIỆM:"""


# Quiz generation template
QUIZ_TEMPLATE = """NỘI DUNG TÀI LIỆU:
{text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YÊU CẦU:
Tạo {num_questions} câu hỏi trắc nghiệm từ nội dung trên.

ĐỘ KHÓ: {difficulty}
- easy: Nhận biết, nhớ (câu hỏi đơn giản, định nghĩa)
- medium: Hiểu, áp dụng (câu hỏi về cách hoạt động, so sánh)
- hard: Phân tích, tổng hợp (câu hỏi phức tạp, tình huống)

QUY TẮC:
1. Mỗi câu có 4 đáp án (A, B, C, D)
2. Chỉ 1 đáp án đúng
3. 3 đáp án sai phải hợp lý, không quá dễ loại trừ
4. Câu hỏi phải dựa trên nội dung tài liệu
5. Có giải thích ngắn gọn cho đáp án đúng

FORMAT JSON (CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC):
[
  {{
    "question": "Câu hỏi ở đây?",
    "options": [
      "A. Đáp án 1",
      "B. Đáp án 2",
      "C. Đáp án 3",
      "D. Đáp án 4"
    ],
    "correct": "A",
    "explanation": "Giải thích tại sao A đúng (1 câu ngắn)"
  }}
]

JSON OUTPUT:"""


# Context formatting function
def format_context(chunks, doc_map):
    """
    Format retrieved chunks into context string
    
    Args:
        chunks: List of matched chunks with metadata
        doc_map: Dictionary mapping document IDs to document objects
        
    Returns:
        Formatted context string
    """
    context_parts = []
    
    for idx, chunk in enumerate(chunks, 1):
        doc_id = chunk['document_id']
        doc = doc_map.get(doc_id)
        doc_title = doc.title if doc else "Unknown"
        text = chunk['text']
        score = chunk.get('score', 0)
        
        context_parts.append(
            f"[Nguồn {idx}: {doc_title} - Độ liên quan: {score:.1%}]\n{text}\n"
        )
    
    return "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n".join(context_parts)


# No result response
NO_RESULT_RESPONSE = """Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi "{query}" trong các tài liệu đã chọn.

💡 GỢI Ý:
- Thử diễn đạt câu hỏi theo cách khác
- Kiểm tra xem đã chọn đúng tài liệu chưa
- Các từ khóa liên quan: [thêm từ khóa nếu có]
- Có thể upload thêm tài liệu về chủ đề này"""