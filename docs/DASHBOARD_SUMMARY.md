# 🎯 DocMentor Dashboard Summary

## 📋 Danh sách những thông tin hiển thị trên Dashboard

### 1️⃣ **Thống kê tổng quan (Top Stats)**
```
┌─────────────────────────────────────────────────────────────┐
│  📄 Tài liệu    📨 Câu hỏi    💬 Cuộc hội thoại    ⭐ Đánh giá │
│     10             50              3                4.5/5   │
└─────────────────────────────────────────────────────────────┘
```
- **Tài liệu**: Tổng số tài liệu đã upload
- **Câu hỏi**: Tổng số câu hỏi đã hỏi
- **Cuộc hội thoại**: Tổng số cuộc chat
- **Đánh giá**: Trung bình sao từ phản hồi

### 2️⃣ **Chi tiết thêm (Detail Stats)**
```
┌──────────────────┬──────────────────┬──────────────────┐
│ Tài liệu xong    │ Dung lượng SD     │ Phản hồi tích cực │
│ 8/10 (80%)       │ 5.2 MB           │ 93.3%             │
└──────────────────┴──────────────────┴──────────────────┘
```
- **Tài liệu xong**: Số tài liệu đã được xử lý/tính phần trăm
- **Dung lượng**: Tổng dung lượng tài liệu đang dùng
- **Phản hồi tích cực**: % câu trả lời được đánh giá 4-5 sao

### 3️⃣ **Phân bố tài liệu (Pie Chart)**
```
      PDF 50%
     ╭─────────╮
   ╭─│    ● ○   │─╮
  ╭──╯         ╰──╮
  │   DOCX 30%    │  TXT 20%
  │ ○ ● ○         │
  ╰────────────────╯
```
- Hiển thị tỷ lệ phần trăm mỗi loại file (PDF, DOCX, TXT, ...)
- Hover để xem chi tiết

### 4️⃣ **Hoạt động hàng tuần (Line Chart)**
```
Thứ  Thứ  Thứ  Thứ  Thứ  Thứ  Chủ
Hai  Ba   Tư   Năm  Sáu  Bảy  Nhật

      │      ●─────
      │    ●       ●
    ●─●
  ●
─────────────────────────────────
  5 câu      1250ms TB
```
- **X-axis**: Ngày trong tuần
- **Y-axis**: Số câu hỏi + Thời gian xử lý trung bình

### 5️⃣ **Câu hỏi phổ biến (Bar Chart)**
```
Số lần hỏi | Rating
───────────────────
"How to..."  ▓▓▓▓▓  (5 lần, 4.5★)
"What is..." ▓▓▓▓   (4 lần, 4.0★)
"Best way..."▓▓▓    (3 lần, 4.8★)
```
- Top 8 câu hỏi thường xuyên nhất
- Hiển thị số lần hỏi + đánh giá trung bình

### 6️⃣ **Trạng thái xử lý (Status Cards)**
```
⏳ ĐANG XỬ LÝ (2)         ⚠️ LỖI XỬ LÝ (1)
├─ New Document.docx     ├─ Corrupted.pdf
└─ Report.pdf            └─ Error: File damaged
```
- Danh sách tài liệu đang xử lý
- Danh sách tài liệu bị lỗi + lý do

### 7️⃣ **Tài liệu gần đây (Recent Documents)**
```
┌─────────────────────────────────┐
│ 📄 Python Fundamentals          │
│    PDF · 1.2 MB · ✅ Xong       │
├─────────────────────────────────┤
│ 📄 React Advanced Topics         │
│    DOCX · 2.5 MB · ⏳ Đang xử lý  │
└─────────────────────────────────┘
```
- 5 tài liệu upload gần đây nhất
- Thể loại, dung lượng, trạng thái xử lý

### 8️⃣ **Câu hỏi gần đây (Recent Queries)**
```
┌─────────────────────────────────────┐
│ "What is machine learning?"         │
│ Machine learning is a subset of... │
│ ⏱️ 1245ms  ⭐ 5/5                    │
├─────────────────────────────────────┤
│ "Explain deep neural networks"      │
│ Neural networks are computing...   │
│ ⏱️ 980ms  ⭐ 4/5                     │
└─────────────────────────────────────┘
```
- 10 câu hỏi hỏi gần đây nhất
- Câu hỏi + preview câu trả lời
- Thời gian xử lý + rating

---

## 🎨 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                      HEADER                             │
│                    Dashboard                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Top 4 Stats  │  Top 4 Stats  │  Top 4 Stats  │ Stats 4 │
├─────────────────────────────────────────────────────────┤
│           Detail Stat 1        │       Detail Stat 2   │
├─────────────────────────────────────────────────────────┤
│  Pie Chart (Document Types)  │  Line Chart (Weekly)  │
├─────────────────────────────────────────────────────────┤
│           Bar Chart (Popular Queries) [Full Width]      │
├─────────────────────────────────────────────────────────┤
│  Processing Status Cards (Full Width - 2 cols)         │
├─────────────────────────────────────────────────────────┤
│  Recent Documents (Left)    │  Recent Queries (Right) │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
┌──────────────────┐
│   User Action    │
│  (Visit /user/   │
│   dashboard)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│   Frontend (React + useQuery)     │
│   ├─ /user/dashboard/stats       │
│   ├─ /user/dashboard/recent-docs │
│   ├─ /user/dashboard/recent-q    │
│   ├─ /user/dashboard/popular-q   │
│   └─ ... (7 endpoints total)     │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│   Backend (FastAPI)              │
│   ├─ Query Database              │
│   ├─ Aggregate Statistics        │
│   ├─ Apply Caching (10 min TTL)  │
│   └─ Return JSON                 │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│   Database (PostgreSQL)          │
│   ├─ documents table             │
│   ├─ queries table               │
│   ├─ conversations table         │
│   ├─ feedback table              │
│   └─ users table                 │
└──────────────────────────────────┘
```

---

## 📊 API Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /user/dashboard/stats` | Thống kê tổng hợp | Documents, Queries, Conversations, Feedback stats |
| `GET /user/dashboard/recent-documents` | 5 tài liệu gần đây | Array of documents |
| `GET /user/dashboard/recent-queries` | 10 câu hỏi gần đây | Array of queries |
| `GET /user/dashboard/popular-queries` | Top 10 câu hỏi | Array of {query_text, count, avg_rating} |
| `GET /user/dashboard/weekly-activity` | Hoạt động 7 ngày | Array of {date, query_count, avg_time} |
| `GET /user/dashboard/document-distribution` | Phân bố file types | Array of {file_type, count, size} |
| `GET /user/dashboard/processing-status` | Tài liệu xử lý/lỗi | {processing: [], failed: []} |

---

## 🎯 Chức năng Dashboard

| # | Chức năng | Mục đích |
|---|----------|---------|
| 1 | Thống kê tổng hợp | Cái nhìn nhanh về hoạt động |
| 2 | Phân bố tài liệu | Biết bạn sử dụng loại file nào nhiều |
| 3 | Hoạt động hàng tuần | Theo dõi xu hướng sử dụng |
| 4 | Câu hỏi phổ biến | Biết mình thường hỏi gì |
| 5 | Đánh giá phản hồi | Biết câu trả lời có hữu ích không |
| 6 | Tài liệu gần đây | Quay lại tài liệu vừa mở |
| 7 | Câu hỏi gần đây | Xem lại các câu hỏi vừa hỏi |
| 8 | Trạng thái xử lý | Kiểm soát tiến độ upload tài liệu |

---

## 💡 Gợi ý sử dụng

✅ **Nên làm:**
- Kiểm tra dashboard hàng ngày để theo dõi tiến độ
- Xem tài liệu bị lỗi để sửa chúng
- Tham khảo câu hỏi phổ biến để học tập hiệu quả

❌ **Không nên làm:**
- Quá chú ý vào con số thay vì chất lượng học tập
- Bỏ qua các tài liệu bị lỗi

---

## 🔧 Công nghệ sử dụng

**Backend:**
- FastAPI (Framework)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- Caching (10 min TTL)

**Frontend:**
- React (UI Library)
- TypeScript (Type Safety)
- Recharts (Charts)
- Tailwind CSS (Styling)
- lucide-react (Icons)

---

Tài liệu chi tiết: [DASHBOARD.md](DASHBOARD.md)
