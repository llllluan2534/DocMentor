# 🚀 Dashboard Implementation Guide

## Các bước cài đặt Dashboard

### 1️⃣ Backend Setup

#### Step 1: Thêm Dashboard Routes
```python
# backend/app/main.py
from .routers import user_dashboard

# Include router
app.include_router(user_dashboard.router)
```

#### Step 2: Xác minh Database Tables
Dashboard cần các bảng sau đã tồn tại:
```
✅ users
✅ documents
✅ queries
✅ conversations
✅ feedback
```

#### Step 3: Chạy migrations (nếu cần)
```bash
cd backend
alembic upgrade head
```

#### Step 4: Kiểm tra API endpoints
```bash
# Test stats endpoint
curl http://localhost:8000/user/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Kiểm tra HTTP 200 response
```

---

### 2️⃣ Frontend Setup

#### Step 1: Copy Dashboard Components
```bash
# Các file đã được tạo:
src/components/dashboard/
  ├── StatBox.tsx
  ├── DocumentDistribution.tsx
  ├── WeeklyActivity.tsx
  ├── RecentQueries.tsx
  ├── RecentDocuments.tsx
  ├── PopularQueries.tsx
  ├── ProcessingStatus.tsx
  └── index.ts
```

#### Step 2: Tạo Dashboard Page
```bash
# File:
src/pages/user/UserDashboardPage.tsx
src/pages/user/DashboardPage.tsx  # wrapper
```

#### Step 3: Thêm File Formatter Utility
```bash
# File:
src/utils/formatters/file.ts
```

#### Step 4: Cài đặt Dependencies (nếu chưa có)
```bash
npm install recharts
npm install lucide-react
# Những thư viện này phải đã có sẵn
```

#### Step 5: Kiểm tra Router
```typescript
// src/routes/index.tsx
{
  path: "dashboard",
  element: <DashboardPage />
}
```

---

### 3️⃣ Cấu hình API Endpoints

#### Backend Configuration
```python
# backend/app/routers/user_dashboard.py
# Các endpoints:
GET /user/dashboard/stats
GET /user/dashboard/recent-documents
GET /user/dashboard/recent-queries
GET /user/dashboard/popular-queries
GET /user/dashboard/weekly-activity
GET /user/dashboard/document-distribution
GET /user/dashboard/processing-status
```

#### Frontend Configuration
```typescript
// src/hooks/api/useQuery.ts
// Sử dụng useQuery hook để fetch dữ liệu
const { data, loading, error } = useQuery({
  url: '/user/dashboard/stats',
  enabled: true
});
```

---

### 4️⃣ Kiểm tra Functionality

#### Checklist
```
Backend:
[ ] ✅ Routers imported in main.py
[ ] ✅ Endpoints return correct data
[ ] ✅ Authentication working
[ ] ✅ Database queries optimized
[ ] ✅ Caching enabled

Frontend:
[ ] ✅ Components render without errors
[ ] ✅ Charts display correctly
[ ] ✅ Data fetched from API
[ ] ✅ Loading states working
[ ] ✅ Error handling implemented
[ ] ✅ Responsive design working
[ ] ✅ Dark mode supported
```

---

### 5️⃣ Testing

#### Unit Tests (Optional)
```typescript
// src/components/dashboard/__tests__/StatBox.test.tsx
import { render } from '@testing-library/react';
import { StatBox } from '../StatBox';

describe('StatBox', () => {
  it('renders correctly', () => {
    const { container } = render(
      <StatBox 
        title="Test"
        value={100}
        color="blue"
      />
    );
    expect(container).toBeTruthy();
  });
});
```

#### Manual Testing
```bash
# 1. Start backend
cd backend
python run.py

# 2. Start frontend
cd frontend/docmentor-fe
npm run dev

# 3. Navigate to dashboard
http://localhost:5173/user/dashboard

# 4. Check console for errors
# 5. Verify all charts render
# 6. Test responsive design
```

---

### 6️⃣ Production Deployment

#### Backend
```bash
# Build
pip install -r requirements.txt

# Run
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app

# Or deploy to Render/Heroku
git push heroku main
```

#### Frontend
```bash
# Build
npm run build

# Output: dist/

# Deploy to Vercel/Netlify
vercel deploy
```

---

## 📋 File Checklist

### Backend Files Created
```
✅ backend/app/routers/user_dashboard.py       (250 lines)
✅ backend/app/main.py                         (Updated - added import)
```

### Frontend Files Created
```
✅ src/components/dashboard/StatBox.tsx
✅ src/components/dashboard/DocumentDistribution.tsx
✅ src/components/dashboard/WeeklyActivity.tsx
✅ src/components/dashboard/RecentQueries.tsx
✅ src/components/dashboard/RecentDocuments.tsx
✅ src/components/dashboard/PopularQueries.tsx
✅ src/components/dashboard/ProcessingStatus.tsx
✅ src/components/dashboard/index.ts
✅ src/pages/user/UserDashboardPage.tsx
✅ src/pages/user/DashboardPage.tsx            (Updated)
✅ src/utils/formatters/file.ts
```

### Documentation Files
```
✅ docs/DASHBOARD.md                   (Complete guide)
✅ docs/DASHBOARD_SUMMARY.md           (Visual summary)
✅ docs/DASHBOARD_UI.md                (UI/UX details)
✅ docs/IMPLEMENTATION.md              (This file)
```

---

## 🔧 Troubleshooting

### Backend Issues

#### 1. 404 Error on Dashboard Endpoint
```
Problem: GET /user/dashboard/stats returns 404
Solution: 
- Check if user_dashboard router is imported in main.py
- Verify router prefix is correct: /user/dashboard
```

#### 2. 401 Unauthorized
```
Problem: API returns 401 even with valid token
Solution:
- Ensure get_current_user dependency is set up
- Check token expiration
- Verify Authorization header format: "Bearer TOKEN"
```

#### 3. Database Query Too Slow
```
Problem: Dashboard loads slowly
Solution:
- Add database indexes on frequently queried columns
- Check if caching is working (TTL: 600 seconds)
- Monitor slow query logs
```

### Frontend Issues

#### 1. Charts Not Rendering
```
Problem: Blank space where charts should be
Solution:
- Check if Recharts is installed: npm list recharts
- Verify data format matches chart requirements
- Open browser DevTools → Console for errors
```

#### 2. API Returns Data But Components Don't Update
```
Problem: Loading spinner persists
Solution:
- Check useQuery hook implementation
- Verify error handling in catch block
- Check if API response matches expected data shape
```

#### 3. Dark Mode Not Working
```
Problem: Dark classes not applied
Solution:
- Check if dark mode provider is set up
- Verify Tailwind dark mode is enabled in tailwind.config.js
- Check className has 'dark:' prefix
```

#### 4. Responsive Design Issues
```
Problem: Layout breaks on mobile
Solution:
- Test with browser DevTools responsive mode
- Verify grid-cols classes: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Check padding/margins don't exceed viewport
```

---

## 📊 Database Optimization

### Index Recommendations
```sql
-- Documents
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_processed ON documents(processed);

-- Queries
CREATE INDEX idx_queries_user_id ON queries(user_id);
CREATE INDEX idx_queries_created_at ON queries(created_at);
CREATE INDEX idx_queries_execution_time ON queries(execution_time);

-- Feedback
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);
```

### Query Performance
```python
# Good: Uses indexes
db.query(Document).filter(
    Document.user_id == user.id,
    Document.created_at > start_date
).all()

# Avoid: Full table scans
db.query(Document).filter(
    Document.metadata_['custom_field'] == 'value'
).all()
```

---

## 🔒 Security Considerations

### Authentication
```python
# All dashboard endpoints require authentication
@router.get("/stats")
def get_user_dashboard_stats(
    current_user: User = Depends(get_current_user),
):
    # Only return stats for current user
    # Prevent data leakage to other users
```

### Data Validation
```python
# Validate request parameters
@router.get("/weekly-activity")
def get_weekly_activity(
    days: int = 7,  # Default to 7, max 365
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if days < 1 or days > 365:
        raise HTTPException(status_code=400)
```

### CORS Configuration
```python
# Ensure CORS is properly configured
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📈 Performance Metrics

### Target Load Times
```
API Response Time: < 500ms
Page Load Time: < 2 seconds
Chart Render Time: < 1 second
Total Dashboard Load: < 3 seconds
```

### Optimization Techniques
```
✅ Caching (10 min TTL)
✅ Database indexes
✅ Lazy loading components
✅ Code splitting
✅ Image optimization
✅ Minification
```

---

## 🎯 Next Steps

### Phase 1 (Complete)
- ✅ Design dashboard layout
- ✅ Create API endpoints
- ✅ Build React components
- ✅ Integrate with database

### Phase 2 (Future)
- ⏳ Add export functionality (PDF/Excel)
- ⏳ Implement custom date range picker
- ⏳ Add real-time updates (WebSocket)
- ⏳ Create admin dashboard

### Phase 3 (Advanced)
- ⏳ Machine learning predictions
- ⏳ Anomaly detection (unusual patterns)
- ⏳ Performance benchmarking
- ⏳ Custom metrics/KPIs

---

## 📞 Support & Resources

### Documentation
- [DASHBOARD.md](DASHBOARD.md) - Full documentation
- [DASHBOARD_SUMMARY.md](DASHBOARD_SUMMARY.md) - Quick reference
- [DASHBOARD_UI.md](DASHBOARD_UI.md) - UI/UX guide

### External Resources
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://react-query.tanstack.com/)
- [FastAPI](https://fastapi.tiangolo.com/)

### Useful Commands
```bash
# Development
npm run dev                    # Frontend
python run.py                  # Backend

# Testing
npm test                       # Frontend tests
pytest backend/                # Backend tests

# Production
npm run build                  # Frontend build
gunicorn -w 4 app.main:app    # Backend production
```

---

**Last Updated**: December 14, 2025
**Version**: 1.0.0
