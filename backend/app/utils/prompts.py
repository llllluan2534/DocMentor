"""
Enhanced Prompt templates for Gemini AI
Optimized for Vietnamese language with flexible formatting and smart citations
"""

# ============================================================================
# SYSTEM INSTRUCTION - Enhanced Version
# ============================================================================
SYSTEM_INSTRUCTION = """Bạn là trợ lý AI thông minh của DocMentor, chuyên hỗ trợ sinh viên và giảng viên.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NHIỆM VỤ CHÍNH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Trả lời câu hỏi dựa HOÀN TOÀN trên ngữ cảnh được cung cấp
2. Sử dụng tiếng Việt rõ ràng, dễ hiểu
3. Format câu trả lời phù hợp với loại câu hỏi
4. Trích dẫn nguồn chính xác và logic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 NGUYÊN TẮC TRẢ LỜI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CHO PHÉP:
- Sử dụng thông tin CHÍNH XÁC từ context
- Tổng hợp nhiều nguồn nếu chúng nói về cùng vấn đề
- Giải thích rõ ràng bằng ngôn ngữ đơn giản
- Tổ chức thông tin theo cách dễ đọc

❌ KHÔNG ĐƯỢC:
- Bịa đặt thông tin không có trong tài liệu
- Thêm kiến thức bên ngoài
- Suy đoán hoặc đưa ra ý kiến cá nhân
- Trích dẫn sai nguồn

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 QUY TẮC TRÍCH DẪN THÔNG MINH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ TRÍCH DẪN THEO ĐOẠN (cho thông tin chung):
   "Machine learning là một nhánh của AI cho phép máy học từ dữ liệu. Có 3 loại 
   chính: supervised, unsupervised và reinforcement learning. [1]"

2️⃣ TRÍCH DẪN THEO CÂU (cho thông tin cụ thể):
   "Linear regression có độ phức tạp O(n²) [1], trong khi decision tree là O(n log n) [2]"

3️⃣ TRÍCH DẪN GHÉP (khi tổng hợp nhiều nguồn):
   "Python được ưa chuộng vì cú pháp đơn giản [1] và có nhiều thư viện ML [2, 3]"

4️⃣ KHÔNG TRÍCH DẪN:
   - Câu mở đầu hoặc chuyển tiếp
   - Giải thích cách hiểu (nếu dựa trên logic của context)
   - Ví dụ tự tạo để minh họa (phải nói rõ "Ví dụ minh họa:")


FORMAT TRÍCH DẪN:
[1] = Nguồn 1
[2] = Nguồn 2
[1, 2] = Cả hai nguồn đều đề cập

⚠️ **BẮT BUỘC**: Mỗi câu trả lời PHẢI kết thúc bằng section này:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 NGUỒN THAM KHẢO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1  **Tên tài liệu**, Page số_trang
2  **Tên tài liệu**, Page số_trang
3  **Tên tài liệu**, Page số_trang

(Dùng đúng số tương ứng với [1], [2], [3] trong nội dung)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 HƯỚNG DẪN FORMAT CÂU TRẢ LỜI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phân tích câu hỏi và chọn format phù hợp:

📝 ĐỊNH NGHĨA / GIẢI THÍCH:
- Câu mở đầu ngắn gọn
- 2-3 đoạn văn giải thích chi tiết
- Ví dụ minh họa nếu có trong tài liệu

📊 SO SÁNH (dùng bảng):
```
| Tiêu chí       | Phương pháp A | Phương pháp B |
|----------------|---------------|---------------|
| Độ phức tạp    | O(n)         | O(n²)         |
| Ưu điểm        | Nhanh        | Chính xác     |
```

📋 LIỆT KÊ (dùng bullet points):
Các loại machine learning:
• **Supervised Learning** [1]: Học từ dữ liệu có nhãn
• **Unsupervised Learning** [1]: Tìm patterns trong dữ liệu
• **Reinforcement Learning** [2]: Học qua tương tác

🔢 QUY TRÌNH (dùng numbered list):
Quy trình training model:

1. **Chuẩn bị dữ liệu** [1]
   - Làm sạch dữ liệu
   - Chia train/test set

2. **Chọn mô hình** [1]
   - Đánh giá yêu cầu
   - So sánh các thuật toán

3. **Training** [2]
   - Điều chỉnh hyperparameters
   - Đánh giá kết quả

💻 CODE (nếu có trong tài liệu):
```python
# Ví dụ Linear Regression [1]
from sklearn.linear_model import LinearRegression
model = LinearRegression()
model.fit(X_train, y_train)
```

🔍 PHÂN TÍCH CHI TIẾT (dùng sections):
## Định nghĩa
[Nội dung...]

## Cách hoạt động
[Nội dung...]

## Ưu nhược điểm
[Nội dung...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ XỬ LÝ TRƯỜNG HỢP ĐẶC BIỆT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚫 KHÔNG TÌM THẤY THÔNG TIN:
"Tôi không tìm thấy thông tin về [vấn đề] trong các tài liệu đã chọn.

💡 Gợi ý:
• Thử diễn đạt câu hỏi khác: [gợi ý cách hỏi khác]
• Kiểm tra xem đã chọn đúng tài liệu chưa
• Có thể cần upload thêm tài liệu về chủ đề này"

⚠️ THÔNG TIN KHÔNG ĐẦY ĐỦ:
"Dựa trên tài liệu hiện có [1], [thông tin tìm được]. 

⚠️ Lưu ý: Thông tin này chưa đầy đủ. Để biết chi tiết hơn về [phần còn thiếu], 
bạn có thể cần thêm tài liệu hoặc hỏi cụ thể hơn."

🔄 THÔNG TIN MÂU THUẪN:
"Có sự khác biệt giữa các nguồn:
• Nguồn [1] cho rằng: [quan điểm A]
• Nguồn [2] lại nói: [quan điểm B]

[Phân tích ngắn gọn nếu có thể]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ PHONG CÁCH VIẾT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Câu văn ngắn gọn, rõ ràng
• Thuật ngữ tiếng Anh giữ nguyên, có giải thích tiếng Việt nếu cần
• Sử dụng emoji phù hợp (📊, 🔍, ⚠️, ✅, ❌) để dễ đọc
• Ưu tiên bố cục dễ scan (headings, bullets, tables)
• Độ dài: 2-5 đoạn văn (trừ khi câu hỏi yêu cầu ngắn gọn)
"""


# ============================================================================
# MAIN RAG QUERY TEMPLATE - Enhanced Version
# ============================================================================
RAG_QUERY_TEMPLATE = """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 NGỮ CẢNH TỪ TÀI LIỆU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ CÂU HỎI CỦA SINH VIÊN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{question}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 HƯỚNG DẪN TRẢ LỜI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PHÂN TÍCH CÂU HỎI:
1. Xác định loại câu hỏi (định nghĩa / so sánh / liệt kê / giải thích / hướng dẫn)
2. Chọn format phù hợp (văn xuôi / bảng / bullet points / code / sections)
3. Xác định mức độ chi tiết cần thiết

📊 CHỌN FORMAT:
• Định nghĩa/Giải thích → 2-3 đoạn văn với headings
• "So sánh X và Y" → Bảng markdown
• "Liệt kê / Kể tên" → Bullet points với mô tả ngắn
• "Các bước / Quy trình" → Numbered list
• "Code / Cú pháp" → Code block với comment
• "Phân tích toàn diện" → Sections với headings

🔗 TRÍCH DẪN:
• Đặt [số] ở cuối đoạn văn nếu cả đoạn dựa trên một nguồn
• Đặt [số] ở cuối câu nếu chỉ câu đó dựa trên nguồn
• Dùng [1, 2] nếu nhiều nguồn cùng đề cập
• Không cần trích dẫn cho câu chuyển tiếp hoặc tổng kết

⚠️ LƯU Ý:
• CHỈ sử dụng thông tin từ context
• Nếu không đủ thông tin → Nói rõ "Không tìm thấy..."
• Nếu thông tin mâu thuẫn → Chỉ ra sự khác biệt
• Thuật ngữ tiếng Anh giữ nguyên, thêm giải thích tiếng Việt nếu cần
• **BẮT BUỘC**: Kết thúc câu trả lời bằng section "NGUỒN THAM KHẢO"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 NGUỒN THAM KHẢO (BẮT BUỘC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1  **[Tên file]**, Page [số]
2  **[Tên file]**, Page [số]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 TRẢ LỜI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


# ============================================================================
# SHORT ANSWER TEMPLATE (for quick questions)
# ============================================================================
SHORT_ANSWER_TEMPLATE = """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{question}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 HƯỚNG DẪN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trả lời NGẮN GỌN trong 1-2 câu. Trích dẫn nguồn [số].

💬 TRẢ LỜI:
"""


# ============================================================================
# DETAILED EXPLANATION TEMPLATE
# ============================================================================
DETAILED_EXPLANATION_TEMPLATE = """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 NGỮ CẢNH TỪ TÀI LIỆU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ CÂU HỎI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{question}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 YÊU CẦU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Giải thích CHI TIẾT và CÓ CẤU TRÚC, bao gồm:

## 1. Định nghĩa
[Định nghĩa rõ ràng, dễ hiểu]

## 2. Giải thích chi tiết
[Cách hoạt động, cơ chế, nguyên lý]

## 3. Ví dụ minh họa
[Ví dụ cụ thể từ tài liệu hoặc ví dụ tự tạo để minh họa]

## 4. So sánh (nếu có)
[So sánh với các khái niệm tương tự]

## 5. Ứng dụng thực tế (nếu có)
[Các trường hợp sử dụng, ý nghĩa]

🔗 Nhớ trích dẫn nguồn: [số]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 TRẢ LỜI CHI TIẾT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


# ============================================================================
# COMPARISON TEMPLATE (for "so sánh A và B")
# ============================================================================
COMPARISON_TEMPLATE = """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 NGỮ CẢNH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ YÊU CẦU SO SÁNH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{question}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HƯỚNG DẪN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Tạo bảng so sánh markdown với các tiêu chí chính
2. Thêm giải thích ngắn dưới bảng nếu cần
3. Trích dẫn [số] cho mỗi thông tin

Format bảng:
```
| Tiêu chí | [Đối tượng A] | [Đối tượng B] |
|----------|---------------|---------------|
| ...      | ...           | ...           |
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 SO SÁNH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


# ============================================================================
# LIST TEMPLATE (for "liệt kê / kể tên")
# ============================================================================
LIST_TEMPLATE = """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 NGỮ CẢNH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ YÊU CẦU LIỆT KÊ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{question}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HƯỚNG DẪN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Format câu trả lời:

[Câu mở đầu ngắn gọn]

• **[Tên 1]** [số]: [Mô tả ngắn 1-2 câu]
• **[Tên 2]** [số]: [Mô tả ngắn 1-2 câu]
• **[Tên 3]** [số]: [Mô tả ngắn 1-2 câu]

[Tổng kết nếu cần]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 DANH SÁCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


# ============================================================================
# NO RESULT RESPONSE - Complete Version
# ============================================================================
NO_RESULT_RESPONSE = """Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi "{query}" trong các tài liệu đã chọn.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 GỢI Ý CẢI THIỆN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 **Thử diễn đạt khác**:
• Thay vì hỏi chung chung, hãy hỏi cụ thể hơn
• Sử dụng từ khóa chính xác có trong tài liệu
• Chia nhỏ câu hỏi phức tạp thành nhiều câu đơn giản

📚 **Kiểm tra tài liệu**:
• Đảm bảo đã chọn đúng tài liệu liên quan
• Tài liệu có thể chưa được xử lý hoàn chỉnh
• Nội dung bạn cần có thể nằm ở tài liệu khác

➕ **Upload thêm**:
• Có thể cần thêm tài liệu về chủ đề này
• Tìm tài liệu chi tiết hơn hoặc cập nhật hơn
"""


# ============================================================================
# SUMMARY TEMPLATE - Enhanced
# ============================================================================
SUMMARY_TEMPLATE = """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 NỘI DUNG TÀI LIỆU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 YÊU CẦU TÓM TẮT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Độ dài**: {length}

📏 **Hướng dẫn theo độ dài**:
• **short**: 5 câu ngắn gọn, chỉ nêu ý chính cốt lõi
• **medium**: 1-2 đoạn văn (~150 từ), tổng quan nội dung chính
• **long**: 3-4 đoạn văn (~300 từ), chi tiết các phần quan trọng

✅ **QUY TẮC**:
1. Giữ nguyên các thuật ngữ chuyên môn (không dịch)
2. Không thêm thông tin không có trong tài liệu
3. Sử dụng ngôn ngữ rõ ràng, dễ hiểu
4. Nêu các điểm chính theo thứ tự logic
5. Không cần trích dẫn nguồn (vì tóm tắt toàn bộ tài liệu)

🎯 **CẤU TRÚC** (cho medium và long):
• Câu mở đầu: Giới thiệu chủ đề chính
• Phần giữa: Các ý chính, luận điểm
• Kết luận: Tổng kết hoặc ý nghĩa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 TÓM TẮT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


# ============================================================================
# CONCEPTS EXTRACTION TEMPLATE - Enhanced
# ============================================================================
CONCEPTS_TEMPLATE = """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 VĂN BẢN CẦN PHÂN TÍCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YÊU CẦU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Trích xuất **{max_concepts}** khái niệm/thuật ngữ QUAN TRỌNG NHẤT từ văn bản.

📊 **TIÊU CHÍ ƯU TIÊN**:
1. Thuật ngữ chuyên môn cốt lõi
2. Khái niệm được nhắc đến nhiều lần
3. Khái niệm trung tâm của nội dung
4. Tên riêng quan trọng (người, công nghệ, phương pháp)

⚠️ **KHÔNG CHỌN**:
• Từ thông dụng, chung chung
• Động từ, tính từ đơn lẻ
• Cụm từ quá dài (>8 từ)

📝 **FORMAT OUTPUT**:
Chỉ liệt kê tên khái niệm, mỗi dòng một khái niệm.
KHÔNG đánh số, KHÔNG dấu gạch đầu dòng, KHÔNG giải thích.

Ví dụ output đúng:
Machine Learning
Neural Network
Supervised Learning

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 DANH SÁCH KHÁI NIỆM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


# ============================================================================
# QUIZ GENERATION TEMPLATE - Enhanced
# ============================================================================
QUIZ_TEMPLATE = """━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 NỘI DUNG TÀI LIỆU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YÊU CẦU TẠO QUIZ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Thông số**:
• Số câu hỏi: **{num_questions}** câu
• Độ khó: **{difficulty}**

📋 **Định nghĩa độ khó**:

🟢 **EASY** (Nhận biết - Nhớ):
• Hỏi định nghĩa, khái niệm cơ bản
• Nhận diện thuật ngữ
• Ví dụ: "Machine Learning là gì?"

🟡 **MEDIUM** (Hiểu - Áp dụng):
• Hỏi cách hoạt động, so sánh
• Phân biệt các khái niệm
• Ví dụ: "Supervised Learning khác Unsupervised Learning như thế nào?"

🔴 **HARD** (Phân tích - Tổng hợp):
• Câu hỏi tình huống, giải quyết vấn đề
• Đánh giá, lựa chọn phương pháp
• Ví dụ: "Trong tình huống X, nên sử dụng thuật toán nào?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ QUY TẮC TẠO CÂU HỎI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 **Câu hỏi**:
• Rõ ràng, không gây nhầm lẫn
• Dựa HOÀN TOÀN trên nội dung tài liệu
• Độ dài phù hợp (15-30 từ)

🎯 **Đáp án**:
• Mỗi câu có 4 đáp án (A, B, C, D)
• CHỈ MỘT đáp án đúng
• 3 đáp án sai phải:
  - Hợp lý, không vô lý
  - Không quá dễ loại trừ
  - Liên quan đến chủ đề

💡 **Giải thích**:
• Giải thích TẠI SAO đáp án đúng
• Ngắn gọn (1-2 câu)
• Có thể nêu tại sao các đáp án khác sai

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 FORMAT JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ QUAN TRỌNG: CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT HOẶC GIẢI THÍCH THÊM.

```json
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
    "explanation": "Giải thích ngắn gọn tại sao A đúng"
  }},
  {{
    "question": "Câu hỏi tiếp theo?",
    "options": [
      "A. Đáp án 1",
      "B. Đáp án 2",
      "C. Đáp án 3",
      "D. Đáp án 4"
    ],
    "correct": "B",
    "explanation": "Giải thích ngắn gọn"
  }}
]
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 JSON OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


# ============================================================================
# CONTEXT FORMATTING FUNCTION - Enhanced Version
# ============================================================================
def format_context(chunks, doc_map):
    """
    Format retrieved chunks into structured context string
    
    Args:
        chunks: List of matched chunks with metadata
        doc_map: Dictionary mapping document IDs to document objects
        
    Returns:
        Formatted context string with source markers
    """
    context_parts = []
    
    for idx, chunk in enumerate(chunks, 1):
        doc_id = chunk['document_id']
        doc = doc_map.get(doc_id)
        doc_title = doc.title if doc else "Unknown Document"
        text = chunk['text']
        score = chunk.get('score', 0)
        page = chunk.get('page_number', 0)
        
        # Format source marker
        source_marker = f"[Nguồn {idx}: {doc_title}"
        if page and page > 0:
            source_marker += f", Trang {page}"
        source_marker += f" | Độ liên quan: {score:.1%}]"
        
        # Format chunk with clear structure
        context_parts.append(
            f"{source_marker}\n\n{text}\n"
        )
    
    # Join with separator
    separator = "\n" + "─" * 80 + "\n\n"
    return separator.join(context_parts)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def detect_query_type(query_text: str) -> str:
    """
    Detect query type to choose appropriate template
    
    Returns: 'comparison', 'list', 'definition', 'howto', 'general'
    """
    query_lower = query_text.lower()
    
    # Comparison patterns
    comparison_keywords = [
        'so sánh', 'khác nhau', 'giống nhau', 'phân biệt',
        'compare', 'difference', 'versus', 'vs'
    ]
    if any(kw in query_lower for kw in comparison_keywords):
        return 'comparison'
    
    # List patterns
    list_keywords = [
        'liệt kê', 'kể tên', 'có những', 'có các', 'gồm những',
        'list', 'enumerate', 'what are', 'name'
    ]
    if any(kw in query_lower for kw in list_keywords):
        return 'list'
    
    # Definition patterns
    definition_keywords = [
        'là gì', 'định nghĩa', 'khái niệm',
        'what is', 'define', 'definition'
    ]
    if any(kw in query_lower for kw in definition_keywords):
        return 'definition'
    
    # How-to patterns
    howto_keywords = [
        'cách', 'làm thế nào', 'quy trình', 'các bước',
        'how to', 'how do', 'steps', 'process'
    ]
    if any(kw in query_lower for kw in howto_keywords):
        return 'howto'
    
    return 'general'


def get_template_for_query(query_text: str) -> str:
    """
    Get appropriate template based on query type
    """
    query_type = detect_query_type(query_text)
    
    templates = {
        'comparison': COMPARISON_TEMPLATE,
        'list': LIST_TEMPLATE,
        'definition': RAG_QUERY_TEMPLATE,
        'howto': DETAILED_EXPLANATION_TEMPLATE,
        'general': RAG_QUERY_TEMPLATE
    }
    
    return templates.get(query_type, RAG_QUERY_TEMPLATE)


def format_sources_with_numbers(sources):
    """
    Format sources list with reference numbers for citations
    
    Args:
        sources: List of source dictionaries
        
    Returns:
        Formatted string with numbered sources
    """
    if not sources:
        return ""
    
    source_lines = ["\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"]
    source_lines.append("📚 NGUỒN THAM KHẢO")
    source_lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    for idx, source in enumerate(sources, 1):
        title = source.get('document_title', 'Unknown')
        page = source.get('page_number')
        score = source.get('similarity_score', 0)
        
        source_line = f"[{idx}] **{title}**"
        if page and page > 0:
            source_line += f" - Trang {page}"
        source_line += f" (Độ liên quan: {score:.1%})"
        
        source_lines.append(source_line)
    
    return "\n".join(source_lines)

def ensure_sources_section(response_text: str, chunks: list) -> str:
    """
    Safety net: Tự động thêm section nguồn nếu AI quên
    
    Args:
        response_text: Câu trả lời từ AI
        chunks: List các chunk nguồn đã dùng
        
    Returns:
        Response có đảm bảo section nguồn
    """
    # Kiểm tra xem đã có section nguồn chưa
    if "📚 NGUỒN THAM KHẢO" in response_text or "NGUỒN THAM KHẢO" in response_text:
        return response_text
    
    # Nếu chưa có → Tự động thêm vào
    sources_section = "\n\n" + "━" * 80 + "\n"
    sources_section += "📚 NGUỒN THAM KHẢO\n"
    sources_section += "━" * 80 + "\n\n"
    
    # Build danh sách nguồn từ chunks
    seen_docs = {}
    for idx, chunk in enumerate(chunks, 1):
        doc_title = chunk.get('document', {}).get('title') or chunk.get('document_title', 'Unknown')
        page = chunk.get('page_number', 0)
        
        # Tránh trùng lặp
        key = f"{doc_title}_{page}"
        if key not in seen_docs:
            seen_docs[key] = True
            sources_section += f"{idx}  **{doc_title}**"
            if page and page > 0:
                sources_section += f", Page {page}"
            sources_section += "\n"
    
    return response_text + sources_section