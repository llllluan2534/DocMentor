# 📊 Dashboard Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           React Dashboard (UserDashboardPage)             │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  7 Components (Charts, Stats, Lists, Status)         │ │  │
│  │  │  - StatBox (4x Main, 3x Detail)                     │ │  │
│  │  │  - DocumentDistribution (Pie)                        │ │  │
│  │  │  - WeeklyActivity (Line)                             │ │  │
│  │  │  - PopularQueries (Bar)                              │ │  │
│  │  │  - RecentDocuments (List)                            │ │  │
│  │  │  - RecentQueries (List)                              │ │  │
│  │  │  - ProcessingStatus (Cards)                          │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └──────────────┬────────────────────────────────────────────┘  │
│                 │ useQuery Hook                                  │
│                 ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │       API Requests (JSON over HTTP)                         │ │
│  │  GET /user/dashboard/stats                                  │ │
│  │  GET /user/dashboard/recent-documents                       │ │
│  │  GET /user/dashboard/recent-queries                         │ │
│  │  GET /user/dashboard/popular-queries                        │ │
│  │  GET /user/dashboard/weekly-activity                        │ │
│  │  GET /user/dashboard/document-distribution                  │ │
│  │  GET /user/dashboard/processing-status                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                    Network │ HTTPS
                            │
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Router: /user/dashboard (7 endpoints)             │  │
│  │                                                            │  │
│  │  @router.get("/stats")                                    │  │
│  │  async def get_user_dashboard_stats():                    │  │
│  │    ├─ Count documents                                     │  │
│  │    ├─ Count queries & calculate avg time                  │  │
│  │    ├─ Count conversations                                 │  │
│  │    ├─ Calculate feedback ratings                          │  │
│  │    └─ Return aggregated stats                             │  │
│  │                                                            │  │
│  │  @router.get("/recent-documents")                         │  │
│  │  async def get_recent_documents():                        │  │
│  │    ├─ Query last 5 documents                              │  │
│  │    └─ Return with metadata                                │  │
│  │                                                            │  │
│  │  @router.get("/recent-queries")                           │  │
│  │  async def get_recent_queries():                          │  │
│  │    ├─ Query last 10 queries                               │  │
│  │    └─ Return with execution time & rating                 │  │
│  │                                                            │  │
│  │  ... 4 more endpoints (similar structure)                 │  │
│  │                                                            │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │ SQLAlchemy ORM                      │
│                            │ Caching (10 min TTL)                │
│                            ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │            PostgreSQL Database                             │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐     │  │
│  │  │  documents  │  │  queries     │  │  feedback   │     │  │
│  │  │  ─────────  │  │  ────────    │  │  ────────   │     │  │
│  │  │ id          │  │ id           │  │ id          │     │  │
│  │  │ title       │  │ query_text   │  │ rating      │     │  │
│  │  │ file_type   │  │ response     │  │ feedback    │     │  │
│  │  │ file_size   │  │ execute_time │  │ created_at  │     │  │
│  │  │ processed   │  │ rating       │  │             │     │  │
│  │  │ created_at  │  │ created_at   │  │             │     │  │
│  │  │ user_id     │  │ user_id      │  │ user_id     │     │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘     │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐             │  │
│  │  │  conversations   │  │  users           │             │  │
│  │  │  ──────────────  │  │  ─────           │             │  │
│  │  │ id               │  │ id               │             │  │
│  │  │ title            │  │ email            │             │  │
│  │  │ created_at       │  │ role             │             │  │
│  │  │ user_id          │  │ created_at       │             │  │
│  │  └──────────────────┘  └──────────────────┘             │  │
│  │                                                            │  │
│  │  Index Statistics:                                         │  │
│  │  ✅ documents(user_id)                                     │  │
│  │  ✅ documents(created_at)                                  │  │
│  │  ✅ queries(user_id)                                       │  │
│  │  ✅ queries(created_at)                                    │  │
│  │  ✅ feedback(user_id)                                      │  │
│  │  ✅ conversations(user_id)                                 │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
1. USER LOADS DASHBOARD
   └─> Browser: GET /user/dashboard
   └─> React: <UserDashboardPage />

2. COMPONENT MOUNT
   └─> useQuery() hooks fire 7 API calls
   └─> Loading state set to true

3. API REQUESTS TO BACKEND
   User Browser
        │
        ├─→ GET /user/dashboard/stats
        ├─→ GET /user/dashboard/recent-documents
        ├─→ GET /user/dashboard/recent-queries
        ├─→ GET /user/dashboard/popular-queries
        ├─→ GET /user/dashboard/weekly-activity
        ├─→ GET /user/dashboard/document-distribution
        └─→ GET /user/dashboard/processing-status
        │
        └─→ FastAPI Backend

4. BACKEND PROCESSING
   FastAPI (user_dashboard.py)
        │
        ├─→ [Endpoint 1] stats
        │   ├─ Check cache (hit/miss)
        │   ├─ If miss: Query database
        │   │   ├─ SELECT COUNT(*) FROM documents...
        │   │   ├─ SELECT AVG(execution_time) FROM queries...
        │   │   ├─ SELECT COUNT(*) FROM conversations...
        │   │   └─ SELECT AVG(rating) FROM feedback...
        │   ├─ Aggregate results
        │   ├─ Cache for 10 minutes
        │   └─ Return JSON
        │
        ├─→ [Endpoint 2] recent-documents
        │   ├─ Query: SELECT * FROM documents ORDER BY created_at DESC LIMIT 5
        │   └─ Return JSON
        │
        ├─→ [Endpoint 3] recent-queries
        │   ├─ Query: SELECT * FROM queries ORDER BY created_at DESC LIMIT 10
        │   └─ Return JSON
        │
        ├─→ [Endpoint 4] popular-queries
        │   ├─ Query: SELECT query_text, COUNT(*), AVG(rating) GROUP BY query_text
        │   └─ Return JSON
        │
        ├─→ [Endpoint 5] weekly-activity
        │   ├─ Query: SELECT DATE(created_at), COUNT(*), AVG(execution_time) GROUP BY DATE
        │   └─ Return JSON
        │
        ├─→ [Endpoint 6] document-distribution
        │   ├─ Query: SELECT file_type, COUNT(*), SUM(file_size) GROUP BY file_type
        │   └─ Return JSON
        │
        └─→ [Endpoint 7] processing-status
            ├─ Query: SELECT * FROM documents WHERE processed = FALSE
            ├─ Query: SELECT * FROM documents WHERE metadata.processing_status = 'failed'
            └─ Return JSON

5. RESPONSE TO FRONTEND
   JSON Response
        ├─→ {documents: {...}, queries: {...}, ...}
        └─→ User Browser (React)

6. FRONTEND RENDERING
   React Components
        │
        ├─→ StatBox component renders 7 stat boxes
        ├─→ DocumentDistribution renders Pie chart
        ├─→ WeeklyActivity renders Line chart
        ├─→ PopularQueries renders Bar chart
        ├─→ RecentDocuments renders list
        ├─→ RecentQueries renders list
        └─→ ProcessingStatus renders cards

7. USER SEES COMPLETE DASHBOARD
   ✅ Total time: < 3 seconds
```

---

## Component Hierarchy

```
UserDashboardPage (Main Container)
│
├─ Header
│  └─ Title: "Dashboard"
│
├─ Main Stats Row (Grid 1-4 cols)
│  ├─ StatBox (Documents)
│  ├─ StatBox (Queries)
│  ├─ StatBox (Conversations)
│  └─ StatBox (Ratings)
│
├─ Detail Stats Row (Grid 1-3 cols)
│  ├─ StatBox (Processed Docs)
│  ├─ StatBox (Storage)
│  └─ StatBox (Positive Feedback)
│
├─ Charts Row (Grid 1-2 cols)
│  ├─ DocumentDistribution (Pie Chart)
│  │  └─ Recharts.PieChart
│  │     └─ Pie + Cell + Legend + Tooltip
│  └─ WeeklyActivity (Line Chart)
│     └─ Recharts.LineChart
│        └─ Line x2 + Grid + Tooltip
│
├─ Popular Queries (Full Width)
│  └─ PopularQueries (Bar Chart)
│     └─ Recharts.BarChart
│        └─ Bar x2 + Grid + Tooltip
│
├─ Processing Status (Full Width)
│  └─ ProcessingStatus
│     ├─ Processing Cards
│     └─ Failed Cards
│
└─ Recent Items Row (Grid 1-2 cols)
   ├─ RecentDocuments (List)
   │  └─ Document Cards
   │     ├─ Title
   │     ├─ Type + Size + Status
   │     └─ "View All" link
   │
   └─ RecentQueries (List)
      └─ Query Cards
         ├─ Question
         ├─ Answer Preview
         ├─ Execution Time
         ├─ Rating
         └─ "View All" link
```

---

## API Response Structure

```
GET /user/dashboard/stats
├─ documents
│  ├─ total: 10
│  ├─ processed: 8
│  ├─ unprocessed: 2
│  ├─ total_size_bytes: 5242880
│  └─ by_type: {".pdf": 5, ".docx": 3, ".txt": 2}
├─ queries
│  ├─ total: 50
│  ├─ avg_execution_time_ms: 1250
│  └─ total_execution_time_ms: 62500
├─ conversations
│  └─ total: 3
└─ feedback
   ├─ total: 30
   ├─ average_rating: 4.5
   ├─ positive_feedbacks: 28
   └─ positive_percentage: 93.3

GET /user/dashboard/recent-documents
├─ [0]
│  ├─ id: 1
│  ├─ title: "Python Fundamentals"
│  ├─ file_type: ".pdf"
│  ├─ file_size: 1048576
│  ├─ processed: true
│  └─ created_at: "2025-12-13T10:30:00"
├─ [1]
│  └─ ...
└─ [4]

GET /user/dashboard/recent-queries
├─ [0]
│  ├─ id: 1
│  ├─ query_text: "What is machine learning?"
│  ├─ response_text: "Machine learning is..."
│  ├─ execution_time_ms: 1245
│  ├─ rating: 5
│  └─ created_at: "2025-12-13T10:30:00"
└─ ... (10 items)

GET /user/dashboard/popular-queries
├─ [0]
│  ├─ query_text: "How to learn React?"
│  ├─ count: 5
│  └─ average_rating: 4.5
└─ ... (10 items)

GET /user/dashboard/weekly-activity
├─ [0]
│  ├─ date: "2025-12-06"
│  ├─ query_count: 5
│  └─ avg_execution_time_ms: 1200
└─ [6]
   ├─ date: "2025-12-12"
   └─ ...

GET /user/dashboard/document-distribution
├─ [0]
│  ├─ file_type: ".pdf"
│  ├─ count: 5
│  ├─ total_size_bytes: 5242880
│  └─ processed_count: 5
├─ [1]
│  ├─ file_type: ".docx"
│  └─ ...
└─ [2]

GET /user/dashboard/processing-status
├─ processing
│  ├─ [0]
│  │  ├─ id: 2
│  │  ├─ title: "New Document"
│  │  ├─ file_type: ".docx"
│  │  └─ created_at: "2025-12-13T10:30:00"
│  └─ [1]
└─ failed
   ├─ [0]
   │  ├─ id: 3
   │  ├─ title: "Corrupted File"
   │  ├─ error: "File is corrupted"
   │  └─ created_at: "2025-12-13T09:30:00"
   └─ []
```

---

## Database Query Optimization

```
Endpoint: /stats
├─ Query 1: SELECT COUNT(*) FROM documents WHERE user_id = ?
│  └─ Index: documents(user_id) ✅
├─ Query 2: SELECT SUM(file_size) FROM documents WHERE user_id = ?
│  └─ Index: documents(user_id) ✅
├─ Query 3: SELECT COUNT(*) FROM queries WHERE user_id = ?
│  └─ Index: queries(user_id) ✅
├─ Query 4: SELECT AVG(execution_time) FROM queries WHERE user_id = ?
│  └─ Index: queries(user_id) ✅
├─ Query 5: SELECT COUNT(*) FROM conversations WHERE user_id = ?
│  └─ Index: conversations(user_id) ✅
├─ Query 6: SELECT AVG(rating) FROM feedback WHERE user_id = ?
│  └─ Index: feedback(user_id) ✅
└─ Query 7: SELECT file_type, COUNT(*) GROUP BY file_type

Caching Strategy:
├─ Cache Key: f"user_{user_id}_dashboard_stats"
├─ TTL: 600 seconds (10 minutes)
└─ Result: Complete aggregated response cached

Expected Performance:
├─ Cache Hit: ~50ms
├─ Cache Miss: ~500ms
└─ Average: ~250ms (50% hit rate)
```

---

## Deployment Architecture

```
Production Environment
┌─────────────────────────────────────────────────────────┐
│                   CDN (Static Files)                      │
│                      (Images, JS, CSS)                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Vercel / Netlify (Frontend)                 │
│  ├─ React Dashboard (Minified + Optimized)              │
│  ├─ Responsive Design                                    │
│  └─ Dark Mode Support                                    │
└────────────────┬────────────────────────────────────────┘
                 │ HTTPS
                 │
┌─────────────────────────────────────────────────────────┐
│              Render / Railway (Backend)                   │
│  ├─ FastAPI Application (Gunicorn)                       │
│  ├─ 4 Workers (4 CPU cores)                              │
│  ├─ Environment Variables (API keys, DB URL)             │
│  └─ Health Check Endpoint                                │
└────────────────┬────────────────────────────────────────┘
                 │ TCP Connection
                 │
┌─────────────────────────────────────────────────────────┐
│            RDS / Supabase (PostgreSQL)                    │
│  ├─ Database with Automated Backups                       │
│  ├─ Read Replicas (Optional)                              │
│  └─ Connection Pooling                                    │
└─────────────────────────────────────────────────────────┘
```

---

**Last Updated**: December 14, 2025
