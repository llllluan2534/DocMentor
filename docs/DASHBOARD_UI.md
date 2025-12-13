# 🖼️ DocMentor Dashboard - Visual Preview

## Dashboard Wireframe

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                            DocMentor Dashboard                             ║
║                         Tổng quan hoạt động của bạn                        ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│                         MAIN STATS ROW (4 COLUMNS)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │                  │  │                  │  │                  │       │
│  │   📄 DOCUMENTS   │  │   💬 QUESTIONS   │  │   🗨️ CHATS       │       │
│  │       10         │  │       50         │  │       3          │       │
│  │    documents     │  │    questions     │  │    conversations │       │
│  │                  │  │                  │  │                  │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                                                                           │
│  ┌──────────────────┐                                                     │
│  │                  │                                                     │
│  │    ⭐ RATING     │                                                     │
│  │     4.5/5        │                                                     │
│  │   avg feedback   │                                                     │
│  │                  │                                                     │
│  └──────────────────┘                                                     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      DETAIL STATS ROW (3 COLUMNS)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────┐ │
│  │ ✅ Processed Docs    │  │ 💾 Storage Usage     │  │ 😊 Positive    │ │
│  │ 8/10 (80%)          │  │ 5.2 MB               │  │ 93.3% (28 fb)  │ │
│  └──────────────────────┘  └──────────────────────┘  └────────────────┘ │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┬──────────────────────────────────┐
│                                      │                                  │
│      📊 DOCUMENT DISTRIBUTION        │     📈 WEEKLY ACTIVITY           │
│         (Pie Chart)                  │      (Line Chart)                │
│                                      │                                  │
│        ╭─────────╮                   │      │       ●                   │
│      ╭─│  PDF    │─╮                 │      │     ●   ●                 │
│     ╱  │   50%   │  ╲                │    ●─┼───●       ●               │
│   ╱    ╰─────────╰    ╲              │                                  │
│  │  DOCX 30%           │             │  Mon Tue Wed Thu Fri Sat Sun    │
│  │                     │             │                                  │
│  │     TXT 20%        │             │                                  │
│   ╲                   ╱              │                                  │
│     ╲_  ___________  _╱              │                                  │
│        ╰─────────╯                   │                                  │
│                                      │                                  │
└──────────────────────────────────────┴──────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│           🔥 POPULAR QUESTIONS (Bar Chart - Full Width)                   │
│                                                                            │
│    Q1: "How to learn React?"            ▓▓▓▓▓ (5x, ⭐4.5)               │
│    Q2: "Python best practices?"         ▓▓▓▓  (4x, ⭐4.0)               │
│    Q3: "Database design tips?"          ▓▓▓   (3x, ⭐4.8)               │
│    Q4: "Cloud deployment guide?"        ▓▓    (2x, ⭐3.9)               │
│    Q5: "API design patterns?"           ▓▓    (2x, ⭐4.2)               │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                        ⚠️ PROCESSING STATUS                               │
├──────────────────────────────────────┬──────────────────────────────────┤
│                                      │                                  │
│  ⏳ PROCESSING (2)                    │  ❌ FAILED (1)                   │
│                                      │                                  │
│  📄 New Document.docx                │  📄 Corrupted File.pdf          │
│     Created 10:30 AM                 │     Error: File is corrupted    │
│                                      │     Created 9:30 AM             │
│  📄 Report 2025.pdf                  │                                 │
│     Created 9:15 AM                  │                                 │
│                                      │                                  │
└──────────────────────────────────────┴──────────────────────────────────┘

┌──────────────────────────────────────┬──────────────────────────────────┐
│                                      │                                  │
│      📑 RECENT DOCUMENTS              │      🕐 RECENT QUESTIONS         │
│                                      │                                  │
│  1. 📄 Python Fundamentals            │  1. "What is ML?"               │
│     PDF · 1.2MB · ✅ Done            │     Answer: ML is a subset...  │
│                                      │     ⏱️ 1,245ms · ⭐ 5/5         │
│  2. 📄 React Advanced                 │                                  │
│     DOCX · 2.5MB · ⏳ Processing      │  2. "Explain neural networks"   │
│                                      │     Answer: Networks are...    │
│  3. 📄 Data Science Guide             │     ⏱️ 980ms · ⭐ 4/5           │
│     PDF · 3.1MB · ✅ Done            │                                  │
│                                      │  3. "Best Java practices?"      │
│  4. 📄 System Design                  │     Answer: Java practices...  │
│     TXT · 890KB · ✅ Done            │     ⏱️ 1,120ms · ⭐ 3/5         │
│                                      │                                  │
│  5. 📄 Web Development                │  4. "SQL query optimization"    │
│     PDF · 2.2MB · ✅ Done            │     Answer: Optimization...    │
│                                      │     ⏱️ 856ms · (No rating yet) │
│                                      │                                  │
│                    [View All →]      │                 [View All →]    │
│                                      │                                  │
└──────────────────────────────────────┴──────────────────────────────────┘
```

---

## Component Breakdown

### 1. StatBox (Top Row - 4 Items)
```
┌──────────────────────┐
│                      │
│    [📄 ICON]         │
│                      │
│  Tài liệu            │
│  10 tài liệu         │
│                      │
│ ↑ 5% (Trending)      │
│                      │
└──────────────────────┘
```
- Màu: Blue, Green, Purple, Orange
- Icon: Từ lucide-react
- Trend indicator (optional)

### 2. DocumentDistribution (Pie Chart)
```
        ┌─────┐
      ╱─│ PDF │─╲
    ╱   │50%  │   ╲
   │  DOCX 30%    │
   │  TXT 20%     │
    ╲            ╱
      ╲────────╱
      
Legend:
□ PDF
□ DOCX
□ TXT
```

### 3. WeeklyActivity (Line Chart)
```
Query Count (Axis Y)
│     ●
│   ●   ●
│ ●       ●
└───────────────── Days (Axis X)
Mon Tue Wed Thu Fri Sat Sun

Dual Y-axis:
- Left: Query Count
- Right: Avg Execution Time
```

### 4. PopularQueries (Bar Chart)
```
Q1 ▓▓▓▓▓ 5x (Rating: 4.5)
Q2 ▓▓▓▓  4x (Rating: 4.0)
Q3 ▓▓▓   3x (Rating: 4.8)

Bars:
- Query Count (Blue)
- Average Rating (Green)
```

### 5. ProcessingStatus (Cards)
```
⏳ Processing (2)    │  ❌ Failed (1)
─────────────────────┼─────────────
┌─────────────────┐  │  ┌─────────────────┐
│ File 1          │  │  │ File (Error)    │
│ Created 10:30   │  │  │ Error msg...    │
└─────────────────┘  │  └─────────────────┘
```

### 6. RecentDocuments & RecentQueries (List Cards)
```
┌────────────────────────────────────┐
│ 📄 Document Title                  │
│ PDF · 1.2MB · ✅ Done             │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ "Question text..."                 │
│ Answer preview...                  │
│ ⏱️ 1,245ms · ⭐ 5/5               │
└────────────────────────────────────┘
```

---

## Color Scheme

| Component | Primary | Secondary | Text |
|-----------|---------|-----------|------|
| Documents | Blue (#3b82f6) | Blue-50 | Gray-900 |
| Queries | Green (#10b981) | Green-50 | Gray-900 |
| Conversations | Purple (#8b5cf6) | Purple-50 | Gray-900 |
| Ratings | Orange (#f59e0b) | Orange-50 | Gray-900 |
| Processing | Orange (#f59e0b) | Orange-50 | Orange-900 |
| Failed | Red (#ef4444) | Red-50 | Red-900 |

**Dark Mode:** `dark:bg-gray-800`, `dark:text-white`

---

## Responsive Design

### Mobile (< 768px)
```
Single Column Layout:
┌─────────────────────┐
│ Stat Box 1          │
├─────────────────────┤
│ Stat Box 2          │
├─────────────────────┤
│ Stat Box 3          │
├─────────────────────┤
│ Stat Box 4          │
├─────────────────────┤
│ Pie Chart           │
├─────────────────────┤
│ Line Chart          │
├─────────────────────┤
│ Recent Docs         │
├─────────────────────┤
│ Recent Queries      │
└─────────────────────┘
```

### Tablet (768px - 1024px)
```
2 Column Layout:
┌──────────────┬──────────────┐
│ Pie Chart    │ Line Chart   │
├──────────────┼──────────────┤
│ Recent Docs  │ Recent Qs    │
└──────────────┴──────────────┘
```

### Desktop (> 1024px)
```
Full Layout:
┌──────────────────────────────────────┐
│ 4 Stats + Detail Stats               │
├──────────────────────────────────────┤
│ Pie Chart (left)  │  Line Chart      │
├──────────────────────────────────────┤
│ Popular Queries (Full Width)         │
├──────────────────────────────────────┤
│ Processing Status (Full Width)       │
├──────────┬──────────────────────────┤
│ Recent   │ Recent                   │
│ Docs     │ Queries                  │
└──────────┴──────────────────────────┘
```

---

## Interactions

### Hover Effects
- StatBox: Subtle shadow increase
- Charts: Tooltip on hover
- List items: Background color change + pointer

### Click Actions
- "View All" buttons: Navigate to full page
- Document/Query items: Navigate to detail page
- Failed items: Show error details

### Loading States
- Skeleton loaders for cards
- Chart loading animation
- "Đang tải..." message

---

## Performance Metrics

- **Load Time**: < 2 seconds
- **Re-render**: Only on data change (React Query)
- **API Caching**: 10 minutes TTL
- **Bundle Size**: ~150KB (with Recharts)

---

## Dark Mode Preview

```
Dark Background: #111827 (gray-900)
Card Background: #1f2937 (gray-800)
Text Color: #f3f4f6 (gray-100)
Border Color: #374151 (gray-700)

Charts adapt automatically with Recharts theming.
Icons adjust color to white.
```

---

## Accessibility Features

✅ Semantic HTML structure
✅ ARIA labels on interactive elements
✅ Keyboard navigation support
✅ Color contrast ratio > 4.5:1
✅ Alt text for icons
✅ Screen reader friendly

---

## Future Enhancements

🎯 Export dashboard as PDF
🎯 Custom date range selector
🎯 Advanced filtering options
🎯 Real-time notifications
🎯 Dashboard customization (drag & drop widgets)
🎯 Comparison view (before/after)
🎯 Predictive analytics
🎯 API usage analytics
