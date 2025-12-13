# 📊 Dashboard System Documentation

## 🎯 Mục tiêu Dashboard

Cung cấp cho người dùng một cái nhìn toàn diện về hoạt động của họ trong hệ thống DocMentor, giúp:

✅ Theo dõi tiến độ học tập  
✅ Phân tích cách sử dụng tài liệu  
✅ Đánh giá chất lượng câu trả lời  
✅ Quản lý tài liệu đang xử lý  
✅ Tìm kiếm lịch sử câu hỏi  

---

## 📚 Tài liệu

| Tài liệu | Nội dung |
|----------|---------|
| **[DASHBOARD.md](DASHBOARD.md)** | 📖 Hướng dẫn hoàn chỉnh - Kiến trúc, API endpoints, dữ liệu |
| **[DASHBOARD_SUMMARY.md](DASHBOARD_SUMMARY.md)** | 📋 Tóm tắt hình ảnh - Các phần tử dashboard, layout, data flow |
| **[DASHBOARD_UI.md](DASHBOARD_UI.md)** | 🎨 Thiết kế UI/UX - Wireframe, color scheme, responsive design |
| **[IMPLEMENTATION.md](IMPLEMENTATION.md)** | 🚀 Hướng dẫn triển khai - Setup, testing, troubleshooting |

---

## 🏗️ Kiến Trúc Dashboard

### Backend API Endpoints (7 endpoints)

```
GET /user/dashboard/stats                    # Thống kê tổng hợp
GET /user/dashboard/recent-documents         # 5 tài liệu gần đây
GET /user/dashboard/recent-queries           # 10 câu hỏi gần đây
GET /user/dashboard/popular-queries          # Top 10 câu hỏi phổ biến
GET /user/dashboard/weekly-activity          # Hoạt động 7 ngày
GET /user/dashboard/document-distribution    # Phân bố file types
GET /user/dashboard/processing-status        # Tài liệu xử lý/lỗi
```

### Frontend Components (7 components)

```
StatBox                 # Hộp thống kê
DocumentDistribution    # Biểu đồ pie - loại file
WeeklyActivity         # Biểu đồ line - hoạt động
RecentQueries          # Danh sách câu hỏi gần đây
RecentDocuments        # Danh sách tài liệu gần đây
PopularQueries         # Biểu đồ bar - câu hỏi phổ biến
ProcessingStatus       # Trạng thái xử lý tài liệu
```

---

## 📊 Nội dung Dashboard

### 1. Thống kê chính (4 stat boxes)
- 📄 Tài liệu: Tổng số tài liệu
- 💬 Câu hỏi: Tổng số câu hỏi
- 🗨️ Cuộc hội thoại: Tổng số chat
- ⭐ Đánh giá: Trung bình rating (0-5)

### 2. Chi tiết thêm (3 stat boxes)
- ✅ Tài liệu đã xử lý: X/Y (%)
- 💾 Dung lượng: Tổng dung lượng đang dùng
- 😊 Phản hồi tích cực: X% (Y feedback)

### 3. Biểu đồ phân tích (2 charts)
- **Pie Chart**: Phân bố tài liệu theo loại (.pdf, .docx, .txt)
- **Line Chart**: Hoạt động hàng tuần (số câu hỏi + thời gian TB)

### 4. Câu hỏi phổ biến (Bar Chart)
- Top 8 câu hỏi được hỏi nhiều nhất
- Hiển thị số lần + đánh giá trung bình

### 5. Trạng thái xử lý (Status Cards)
- 🟠 **Đang xử lý**: Danh sách tài liệu đang upload/processing
- 🔴 **Lỗi**: Danh sách tài liệu bị lỗi + lý do

### 6. Tài liệu gần đây (Recent Documents)
- 5 tài liệu upload gần đây nhất
- Hiển thị: Tiêu đề, loại file, dung lượng, trạng thái

### 7. Câu hỏi gần đây (Recent Queries)
- 10 câu hỏi được hỏi gần đây nhất
- Hiển thị: Câu hỏi, preview câu trả lời, thời gian xử lý, rating

---

## 🔧 Công nghệ Stack

### Backend
- **FastAPI** - Framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **Caching** - 10 min TTL

### Frontend
- **React** - UI Library
- **TypeScript** - Type Safety
- **Recharts** - Biểu đồ
- **Tailwind CSS** - Styling
- **lucide-react** - Icons

---

## 🎨 Giao diện

### Layout
```
┌─ Header ─────────────────────────────┐
│          Dashboard                   │
├─────────────────────────────────────┤
│  Top 4 Stats (Responsive Grid)      │
├─────────────────────────────────────┤
│  Detail Stats (3 columns)            │
├─────────────────────────────────────┤
│  Charts (2 columns)                  │
├─────────────────────────────────────┤
│  Popular Queries (Full Width)        │
├─────────────────────────────────────┤
│  Processing Status (Full Width)      │
├─────────────────────────────────────┤
│  Recent Docs (Left) | Recent Q (Right)
└─────────────────────────────────────┘
```

### Responsive
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: Full grid layout

### Dark Mode
✅ Hỗ trợ đầy đủ với Tailwind dark: prefix

---

## 📈 Dữ liệu & API

### Response Format
```typescript
// GET /user/dashboard/stats
{
  documents: {
    total: 10,
    processed: 8,
    unprocessed: 2,
    total_size_bytes: 5242880,
    by_type: { ".pdf": 5, ".docx": 3, ".txt": 2 }
  },
  queries: {
    total: 50,
    avg_execution_time_ms: 1250,
    total_execution_time_ms: 62500
  },
  conversations: { total: 3 },
  feedback: {
    total: 30,
    average_rating: 4.5,
    positive_feedbacks: 28,
    positive_percentage: 93.3
  }
}
```

---

## ⚡ Hiệu suất

- **API Response**: < 500ms
- **Page Load**: < 2 seconds
- **Chart Render**: < 1 second
- **Caching TTL**: 10 minutes
- **Total Load Time**: < 3 seconds

---

## 🚀 Quick Start

### 1. Backend
```bash
# Routers đã được thêm vào app/main.py
# Chỉ cần chạy server
python run.py
```

### 2. Frontend
```bash
# Components đã được tạo
# Chỉ cần chạy dev server
npm run dev
```

### 3. Truy cập Dashboard
```
http://localhost:5173/user/dashboard
```

---

## 📋 Checklist Implementation

### Backend
- ✅ Create routers file: `user_dashboard.py`
- ✅ Import in `main.py`
- ✅ 7 endpoints implemented
- ✅ Database queries optimized
- ✅ Caching configured

### Frontend
- ✅ 7 React components created
- ✅ UserDashboardPage created
- ✅ Integration with useQuery hook
- ✅ Recharts configured
- ✅ Tailwind styling applied
- ✅ Dark mode supported
- ✅ Responsive design implemented

### Documentation
- ✅ DASHBOARD.md (Complete guide)
- ✅ DASHBOARD_SUMMARY.md (Visual summary)
- ✅ DASHBOARD_UI.md (UI/UX details)
- ✅ IMPLEMENTATION.md (Setup guide)
- ✅ README.md (This file)

---

## 🔐 Security

✅ **Authentication**: Tất cả endpoints yêu cầu token  
✅ **Authorization**: Chỉ xem dữ liệu của chính mình  
✅ **CORS**: Configured correctly  
✅ **Input Validation**: Checked on all params  

---

## 🐛 Troubleshooting

| Vấn đề | Giải pháp |
|--------|---------|
| 404 on `/user/dashboard/*` | Check router import in main.py |
| 401 Unauthorized | Verify token in Authorization header |
| Charts not rendering | Ensure Recharts installed & data format correct |
| Slow load | Check database indexes & caching |
| Dark mode not working | Verify Tailwind config has dark mode enabled |

👉 **Chi tiết**: Xem [IMPLEMENTATION.md](IMPLEMENTATION.md#-troubleshooting)

---

## 🎯 Features

### Current (Implemented)
✅ Thống kê tổng hợp  
✅ Biểu đồ phân tích  
✅ Lịch sử câu hỏi & tài liệu  
✅ Trạng thái xử lý tài liệu  
✅ Responsive design  
✅ Dark mode  

### Future Roadmap
⏳ Export PDF/Excel  
⏳ Custom date range  
⏳ Real-time updates  
⏳ Advanced filtering  
⏳ Predictive analytics  

---

## 📞 Liên hệ & Support

Nếu có câu hỏi hay vấn đề:

1. 📖 **Đọc documentation**: Xem các file `.md` trong thư mục `docs/`
2. 🔍 **Check implementation**: Xem code comments
3. 🐛 **Debug**: Xem DevTools console
4. 📊 **Verify data**: Check API response format

---

## 📄 File Structure

```
DocMentor/
├── backend/
│   └── app/
│       ├── routers/
│       │   └── user_dashboard.py      (NEW - 250 lines)
│       └── main.py                    (UPDATED)
│
├── frontend/
│   └── docmentor-fe/src/
│       ├── components/
│       │   └── dashboard/             (NEW - 7 components)
│       │       ├── StatBox.tsx
│       │       ├── DocumentDistribution.tsx
│       │       ├── WeeklyActivity.tsx
│       │       ├── RecentQueries.tsx
│       │       ├── RecentDocuments.tsx
│       │       ├── PopularQueries.tsx
│       │       ├── ProcessingStatus.tsx
│       │       └── index.ts
│       ├── pages/
│       │   └── user/
│       │       ├── UserDashboardPage.tsx (NEW)
│       │       └── DashboardPage.tsx     (UPDATED)
│       └── utils/
│           └── formatters/
│               └── file.ts             (NEW)
│
└── docs/
    ├── DASHBOARD.md                   (NEW - 250 lines)
    ├── DASHBOARD_SUMMARY.md           (NEW - 200 lines)
    ├── DASHBOARD_UI.md                (NEW - 300 lines)
    ├── IMPLEMENTATION.md              (NEW - 400 lines)
    └── README.md                      (This file)
```

---

## 🎓 Learning Resources

- [Recharts Docs](https://recharts.org/)
- [React Query](https://react-query.tanstack.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy](https://docs.sqlalchemy.org/)

---

## 📊 Stats

- **Total Files Created**: 16
- **Total Lines of Code**: ~2,500
- **Components**: 7
- **API Endpoints**: 7
- **Documentation Pages**: 5

---

**Version**: 1.0.0  
**Last Updated**: December 14, 2025  
**Status**: ✅ Hoàn thành & Sẵn dùng
