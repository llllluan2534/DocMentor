# 📊 DocMentor User Dashboard

## Tổng quan

Dashboard người dùng cung cấp cái nhìn toàn diện về hoạt động của bạn trong hệ thống DocMentor, bao gồm:

- 📈 **Thống kê chính**: Tài liệu, câu hỏi, cuộc hội thoại, đánh giá
- 📊 **Biểu đồ phân tích**: Phân bố tài liệu, hoạt động hàng tuần
- 🔥 **Câu hỏi phổ biến**: Những câu hỏi bạn hỏi thường xuyên nhất
- 📝 **Tài liệu/Câu hỏi gần đây**: Danh sách các mục gần đây
- ⚠️ **Trạng thái xử lý**: Theo dõi tài liệu đang xử lý hoặc bị lỗi

## Kiến trúc

### Backend (FastAPI)

#### Route chính: `/user/dashboard`

**Các endpoints:**

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/stats` | GET | Lấy toàn bộ thống kê dashboard |
| `/recent-documents?limit=5` | GET | Tài liệu được upload gần đây |
| `/recent-queries?limit=10` | GET | Câu hỏi hỏi gần đây |
| `/popular-queries?limit=10` | GET | Câu hỏi phổ biến nhất |
| `/weekly-activity?days=7` | GET | Hoạt động trong N ngày |
| `/document-distribution` | GET | Phân bố tài liệu theo loại |
| `/processing-status` | GET | Tài liệu đang xử lý/bị lỗi |

**File**: [`backend/app/routers/user_dashboard.py`](../backend/app/routers/user_dashboard.py)

### Frontend (React + TypeScript)

#### Thư mục: `src/components/dashboard`

**Components:**

```
src/components/dashboard/
├── StatBox.tsx              # Hộp thống kê cơ bản
├── DocumentDistribution.tsx # Biểu đồ pie - phân bố tài liệu
├── WeeklyActivity.tsx       # Biểu đồ line - hoạt động hàng tuần
├── RecentQueries.tsx        # Danh sách câu hỏi gần đây
├── RecentDocuments.tsx      # Danh sách tài liệu gần đây
├── PopularQueries.tsx       # Biểu đồ bar - câu hỏi phổ biến
├── ProcessingStatus.tsx     # Trạng thái xử lý tài liệu
└── index.ts                 # Export tất cả components
```

#### Trang chính: `src/pages/user/UserDashboardPage.tsx`

Trang chính tổ hợp tất cả các components lại.

## Dữ liệu được hiển thị

### 1. Thống kê chính (StatBox)

```typescript
{
  documents: {
    total: 10,           // Tổng số tài liệu
    processed: 8,        // Số tài liệu đã xử lý
    unprocessed: 2,      // Số tài liệu chưa xử lý
    total_size_bytes: 5242880,  // Dung lượng (bytes)
    by_type: {
      ".pdf": 5,
      ".docx": 3,
      ".txt": 2
    }
  },
  queries: {
    total: 50,           // Tổng số câu hỏi
    avg_execution_time_ms: 1250,  // Thời gian xử lý TB
    total_execution_time_ms: 62500
  },
  conversations: {
    total: 3             // Tổng cuộc hội thoại
  },
  feedback: {
    total: 30,           // Tổng phản hồi
    average_rating: 4.5, // Đánh giá TB (0-5)
    positive_feedbacks: 28,  // Phản hồi tích cực (4-5 sao)
    positive_percentage: 93.3 // % phản hồi tích cực
  }
}
```

### 2. Tài liệu gần đây (RecentDocuments)

```typescript
[
  {
    id: 1,
    title: "Python Fundamentals",
    file_type: ".pdf",
    file_size: 1048576,  // 1MB
    processed: true,
    created_at: "2025-12-13T10:30:00"
  },
  // ...
]
```

### 3. Câu hỏi gần đây (RecentQueries)

```typescript
[
  {
    id: 1,
    query_text: "What is machine learning?",
    response_text: "Machine learning is...",  // Preview 200 ký tự
    execution_time_ms: 1245,
    rating: 5,
    created_at: "2025-12-13T10:30:00"
  },
  // ...
]
```

### 4. Câu hỏi phổ biến (PopularQueries)

```typescript
[
  {
    query_text: "How to learn React?",
    count: 5,          // Số lần hỏi
    average_rating: 4.5 // Đánh giá TB
  },
  // ...
]
```

### 5. Hoạt động hàng tuần (WeeklyActivity)

```typescript
[
  {
    date: "2025-12-06",
    query_count: 5,
    avg_execution_time_ms: 1200
  },
  // ...
]
```

### 6. Phân bố tài liệu (DocumentDistribution)

```typescript
[
  {
    file_type: ".pdf",
    count: 5,
    total_size_bytes: 5242880,
    processed_count: 5
  },
  // ...
]
```

### 7. Trạng thái xử lý (ProcessingStatus)

```typescript
{
  processing: [
    {
      id: 2,
      title: "New Document",
      file_type: ".docx",
      created_at: "2025-12-13T10:30:00"
    }
  ],
  failed: [
    {
      id: 3,
      title: "Corrupted File",
      file_type: ".pdf",
      error: "File is corrupted",
      created_at: "2025-12-13T09:30:00"
    }
  ]
}
```

## Cách sử dụng

### Truy cập Dashboard

```
http://localhost:3000/user/dashboard
```

### Tuyến đường Router

```typescript
// src/routes/index.tsx
{
  path: "/user",
  element: <UserLayout />,
  children: [
    { path: "dashboard", element: <DashboardPage /> },
    // ...
  ]
}
```

## Styling

Dashboard sử dụng:
- **Tailwind CSS**: Styling utility-first
- **Recharts**: Thư viện biểu đồ
- **lucide-react**: Icon library
- **Dark Mode**: Hỗ trợ theme tối/sáng

## Hiệu suất

### Caching

Các API endpoints đã được tối ưu:

```python
# Backend caching được implement trong analytics routes
cache.set(cache_key, result, ttl_seconds=600)
```

### Lazy Loading

Components sử dụng `useQuery` hook để lazy load dữ liệu từ API.

## Mở rộng trong tương lai

### Tính năng có thể thêm:

1. **Export Dashboard** - Xuất báo cáo PDF/Excel
2. **Dashboard Comparison** - So sánh hoạt động qua các giai đoạn
3. **Predictions** - Dự báo xu hướng sử dụng
4. **Alerts** - Thông báo khi có tài liệu bị lỗi
5. **Custom Date Range** - Chọn khoảng thời gian tùy chỉnh
6. **API Usage Analytics** - Thống kê sử dụng API chi tiết
7. **Performance Metrics** - Metrics về hiệu suất truy vấn

## Troubleshooting

### Dashboard không tải dữ liệu

1. Kiểm tra API endpoints hoạt động:
   ```bash
   curl http://localhost:8000/user/dashboard/stats
   ```

2. Kiểm tra token authentication
3. Xem console browser cho lỗi

### Biểu đồ không hiển thị

1. Kiểm tra dữ liệu có đúng format không
2. Kiểm tra Recharts được cài đặt:
   ```bash
   npm list recharts
   ```

## Tài liệu liên quan

- [API Documentation](/docs)
- [Frontend Setup](../../frontend/docmentor-fe/README.md)
- [Backend Setup](../../backend/README.md)
