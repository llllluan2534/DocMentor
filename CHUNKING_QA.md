# Danh Sách Câu Hỏi Về Chunking (Cơ Bản → Nâng Cao)

## Phần I: CƠ BẢN

### Câu 1: Chunking là gì và mục đích chính khi áp dụng vào pipeline RAG?

**Đáp án mẫu:**

Chunking là quá trình chia một tài liệu lớn thành những đoạn nhỏ hơn (chunks) có kích thước quản lý được.

**Mục đích chính:**
- **Giới hạn token input:** Embedding models và LLMs có giới hạn số lượng tokens xử lý (8k, 128k, ...). Chunking đảm bảo mỗi chunk nằm trong giới hạn này.
- **Tăng độ liên quan:** Chunks nhỏ có độ semantics cao hơn, tăng khả năng retrieval trả về đoạn đúng thay vì tài liệu toàn bộ.
- **Cải thiện embedding quality:** Embedding model hoạt động tốt hơn trên text có độ dài vừa phải (~500–1500 chars) so với cả tài liệu.
- **Tối ưu latency & chi phí:** Giảm số lượng tokens cần embedding, tăng tốc độ truy vấn.
- **Hỗ trợ indexing:** Vector DB như Pinecone cần một entry per chunk, giúp dễ quản lý metadata.

---

### Câu 2: Nên chunk theo văn bản (characters), tokens hay sentences — lợi/hại của mỗi cách?

**Đáp án mẫu:**

| Phương pháp | Lợi | Hại |
|-------------|-----|-----|
| **Character-based** | Đơn giản, không cần tokenizer, tính toán nhanh | Chunk có thể cắt giữa từ; không account cho độ dài semantic |
| **Token-based** | Chính xác với LLM token limit; phản ánh tài nguyên tính toán | Cần tokenizer (phụ thuộc model); có overhead (tokenization time) |
| **Sentence-based** | Giữ nguyên vẹn ý nghĩa; dễ đọc | Sentences dài khác nhau; không guarantee token limit; không phù hợp loại tài liệu không có sentence rõ ràng (code, bảng biểu) |
| **Paragraph-based** | Giữ ngữ cảnh tốt nhất | Paragraphs có thể rất dài (không cắt được) hoặc quá ngắn |

**Khuyến nghị:** Sử dụng **RecursiveCharacterTextSplitter** (như trong code hiện tại) — nó thử splits theo hierarchy: `["\n\n", "\n", ". ", " ", ""]` để cân bằng giữa semantic coherence và token count.

---

### Câu 3: Chunk size thường được biểu diễn bằng ký tự hay token — đơn vị nào bạn ưu tiên và vì sao?

**Đáp án mẫu:**

- **Ký tự (characters):** Dùng khi chưa biết embedding/LLM nào; dễ tính; ~4–5 chars = 1 token (English rule-of-thumb).
- **Tokens:** Chính xác; phản ánh giới hạn LLM thực tế; cần tokenizer để mapping.

**Ưu tiên:** **Tokens** nếu biết model; nếu generic thì dùng **characters** rồi test empirically. 

Ví dụ dự án bạn:
```python
chunk_size=1000  # characters
# Với English, ~1000 chars ≈ 200–250 tokens
# Với tiếng Việt (no spaces), có thể kém hơn do tokenizer
```

Khuyến cáo: thêm `count_tokens=True` khi test để đo chính xác.

---

### Câu 4: Chunk overlap là gì và tại sao cần dùng overlap?

**Đáp án mẫu:**

**Chunk overlap:** Phần tử tố từ cuối chunk N được lặp lại ở đầu chunk N+1.

**Tại sao cần:**
- **Tránh mất ngữ cảnh:** Khi tách tại biên, có thể cắt giữa câu / ý tưởng. Overlap giữ lại context.
- **Tăng recall:** Một query có thể khớp với phần "overlap" giúp tìm thấy chunk liên quan.
- **Chứng minh liên kết:** Cho phép LLM thấy transition giữa chunks khi cần.

**Trade-off:**
- **Overlap quá nhỏ** (0–5%): Tốn lưu trữ ít hơn, risk mất context.
- **Overlap lớn** (30–50%): Dự phòng tốt nhưng đôi khi nhiều thừa (duplicate indexing).

**Khuyến cáo:** `overlap ≈ 10–20%` hoặc `50–200 chars`.

Dự án hiện tại:
```python
chunk_overlap=100  # characters, ~10% nếu chunk_size=1000
```

---

### Câu 5: Nêu các vấn đề có thể gặp khi không dùng chunking (đối với PDF/DOCX lớn).

**Đáp án mẫu:**

1. **Vượt token limit:** Embedding / LLM reject input quá dài → error.
2. **Embedding chất lượng kém:** Models có bias giảm khi text quá dài.
3. **Retrieval không chính xác:** Tìm cả tài liệu thay vì đoạn cụ thể → context noise.
4. **Chi phí cao:** Embedding toàn bộ doc (có thể 10k+ tokens) mỗi lần.
5. **Latency:** LLM generate response từ context quá lớn → slow.
6. **Metadata mất:** Không biết page, section cụ thể → provenance yếu.

---

### Câu 6: Khi nào không cần chunk (ví dụ tài liệu nhỏ)?

**Đáp án mẫu:**

- Tài liệu < 500 words (~2k characters, ~500 tokens).
- Không cần QA chi tiết (chỉ cần tóm tắt toàn bộ).
- Metadata không quan trọng.

Ví dụ: email ngắn, summary một trang.

**Lưu ý:** Ngay cả khi nhỏ, tạo ít nhất 1 chunk để có metadata consistent.

---

## Phần II: TRUNG CẤP

### Câu 7: Cách chọn chunk_size và overlap cho LLM có giới hạn token cụ thể (ví dụ 8k tokens)?

**Đáp án mẫu:**

**Heuristic:**
```
Token budget cho context: ~3000 tokens (để dành cho query, system prompt, response)
Chunk size (tokens): 200–500 tokens per chunk
Chunks to include: 5–10 chunks (~1000–5000 tokens)
→ chunk_size_chars ≈ (200 tokens) × 4 chars/token = 800 chars
```

**Công thức cụ thể:**
```
Total token budget = LLM max tokens (8192)
Reserved tokens = system_prompt + query + generation_margin = ~2000
Context tokens = Total - Reserved = 6192
Avg tokens per chunk = 300 (tuned)
Max chunks = Context tokens / Avg = 6192 / 300 ≈ 20
Chunk size (chars) = 300 tokens × 4 chars/token = 1200 chars
Overlap (chars) = 10% × 1200 = 120 chars
```

**Dự án bạn:**
```python
chunk_size = 1000      # ~250 tokens
chunk_overlap = 100    # ~25 tokens
top_k = 5              # Lấy top 5, tổng ~1250 tokens → hợp lý
```

**Kinh nghiệm:** Bắt đầu với 1000 chars / 100 overlap, test với query thực → adjust nếu missing context hoặc token exceeded.

---

### Câu 8: So sánh chunking theo sliding-window vs paragraph-boundary split — ưu & nhược.

**Đáp án mẫu:**

| Thuộc tính | Sliding-window | Paragraph-boundary |
|-----------|-----------------|-------------------|
| **Độ chính xác** | Cao, overlap đủ | Tùy độ dài paragraph |
| **Semantic coherence** | Trung bình (có thể cắt giữa câu) | Cao (toàn paragraph) |
| **Số lượng chunks** | Nhiều (overlap dẫn deduplicate) | Ít hơn |
| **Metadata clarity** | Mơ hồ (chunk nào từ đâu?) | Rõ ràng (paragraph ID) |
| **Phù hợp với** | Continuous text (articles, stories) | Structured doc (reports, code) |

**Khuyến cáo:** Dùng **RecursiveCharacterTextSplitter** (hybrid) — thử splits theo boundaries (paragraph, sentence) trước, nếu quá dài mới dùng character-level.

---

### Câu 9: Làm sao gán metadata (title, page, chunk_index) cho từng chunk; những metadata nào hữu ích cho retrieval?

**Đáp án mẫu:**

**Gán metadata (code example):**
```python
chunk_with_metadata = {
    'text': chunk_text,
    'chunk_index': idx,
    'page_number': extract_page(chunk_text),  # From "[Page N]" marker or heuristic
    'metadata': {
        'title': document.title,
        'file_type': document.file_type,
        'section': extract_heading(chunk_text),  # Optional
        'created_at': document.created_at,
    }
}
```

**Metadata hữu ích cho retrieval:**
- `title`: Hiển thị source khi trả kết quả.
- `page_number`: Cho user click vào doc cụ thể.
- `chunk_index`: Mapping sequence, re-rank based on position.
- `section`: Semantic filtering (ví dụ: retrieve từ section "Introduction" + "Methodology").
- `created_at` / `version`: Filter by date range.
- `document_id`: Linking, consistency check.

**Lưu vào vector DB:**
```python
vectors.append({
    'id': f'doc_{document_id}_chunk_{idx}',
    'values': embedding,
    'metadata': {
        'document_id': document_id,
        'chunk_index': idx,
        'title': document.title,
        'page_number': page_num,
        'text': chunk_text[:1000]  # Pinecone metadata size limit ~100KB
    }
})
```

---

### Câu 10: Khi lưu vào vector DB, nên lưu `text` đầy đủ hay chỉ excerpt? Lý do?

**Đáp án mẫu:**

**Option 1: Lưu text đầy đủ**
- Lợi: Dễ re-rank, summarize mà không cần DB tài liệu thứ cấp.
- Hại: Metadata có size limit (~100KB/vector ở Pinecone); chunk lớn vượt limit.

**Option 2: Lưu excerpt (~500 chars) + link**
- Lợi: Tiết kiệm storage; metadata nhỏ.
- Hại: Cần query DB riêng để lấy full text khi build context.

**Khuyến cáo:** Lưu **excerpt ~500–1000 chars** trong metadata + full text vào tabel `documents.processed_text` hoặc cache Redis.

Dự án bạn hiện tại:
```python
'text': chunk['text'][:1000]  # Excerpt, good
```

---

### Câu 11: Nêu cách xử lý các mục lục, header/footer, hoặc số trang khi chunking?

**Đáp án mẫu:**

**Mục lục (TOC):**
- Trích xuất header/section title từ mục lục → link tới chunks.
- Khi build context, include section name để LLM hiểu ngữ cảnh tốt hơn.

**Header / Footer:**
- Lọc bỏ tự động: regex `^Page \d+|^Footer:.*` trước chunking.
- Hoặc dùng OCR + heuristic để đánh dấu regions là "header/footer" → skip.

**Số trang:**
- Dùng PyMuPDF (fitz) khi extract PDF: `page.get_text()` lại page số.
- Thêm marker `[Page N]` vào chunks hoặc lưu `page_number` metadata.
- Khi retrieve, giữ số trang để UI hiển thị link tới PDF viewer.

**Code dự án bạn:**
```python
def _extract_page_number_from_text(self, chunk_text: str) -> int:
    match = re.search(r'\[Page (\d+)\]', chunk_text)
    if match:
        return int(match.group(1))
    return 0
```

---

### Câu 12: Chiến lược trích dẫn provenance: mapping chunk → document → page (thiết kế id và metadata như thế nào)?

**Đáp án mẫu:**

**ID Convention (Idempotent):**
```
vector_id = f"doc_{document_id}_chunk_{chunk_index}"
# Example: "doc_54_chunk_0", "doc_54_chunk_1", ...
```

**Metadata Schema:**
```json
{
  "document_id": 54,
  "document_title": "Report Q1 2024",
  "chunk_index": 5,
  "page_number": 3,
  "section_name": "Budget Analysis",
  "text_excerpt": "...",
  "created_at": "2024-12-19T01:05:54Z"
}
```

**Provenance Retrieval Pipeline:**
1. Query → top-k chunks
2. Extract metadata: document_id, chunk_index, page_number
3. Build sources list: `{document_id, title, page, chunk_idx}`
4. Frontend: show "[Source: Report Q1, Page 3]" + clickable link

**Benefit:**
- **Idempotent upsert:** Re-index same doc → same IDs → overwrite safely.
- **Traceability:** User dapat biết thông tin từ đâu.
- **Debug:** Kiểm tra consistency ("là vector ID trong index không?").

---

### Câu 13: Ảnh hưởng của ngôn ngữ (CJK vs Latin) lên cách chia chunk và tokenization?

**Đáp án mẫu:**

**CJK (Chinese, Japanese, Korean):**
- **Không có space:** "我爱自然语言处理" → không thể split by " ".
- **Tokenizer khác nhau:** Cần jieba (Chinese), MeCab (Japanese), Kiwi (Korean).
- **Character ≈ token:** 1 CJK char ≈ 1 token (so với English 1 word ≈ 1 token).
- **Chunking strategy:** RecursiveCharacterTextSplitter không hiệu quả → dùng language-specific splitter hoặc character-count chính xác.

**Latin (English, Vietnamese, French):**
- **Có space:** Dễ split by space / sentence.
- **Tokenizer GenericTokenizer:** Chia theo word boundaries.
- **Char-to-token:** ~4–5 chars = 1 token.

**Tiếng Việt (hybrid):**
- Có space, nhưng syllable ≠ word ("Việt Nam" = 2 words nhưng 3 syllables).
- Cần Vietnamese tokenizer (underthesea, vncorenlp) để accurate.
- `chunk_size=1000 chars` với Tiếng Việt có thể ≈ 150–200 tokens (thấp hơn English do syllable).

**Khuyến cáo dự án:**
```python
# Thêm language detection + conditional chunking
from langdetect import detect
lang = detect(text)
if lang in ['zh', 'ja', 'ko']:
    # Use CJK-aware splitter
    splitter = CJKSplitter(chunk_size=500)  # Adjust downward
else:
    # Current RecursiveCharacterTextSplitter OK
    splitter = RecursiveCharacterTextSplitter(...)
```

---

### Câu 14: Kiểm thử chunker: các test case cần có để đảm bảo chunking đúng? (edge cases)

**Đáp án mẫu:**

**Test cases bắt buộc:**

1. **Basic split:**
   ```python
   text = "A. " * 100  # 300 chars
   chunks = splitter.split_text(text)
   assert len(chunks) > 1
   assert all(len(c) <= chunk_size + overlap for c in chunks)
   ```

2. **Overlap integrity:**
   ```python
   for i in range(len(chunks) - 1):
       # Last 100 chars of chunks[i] should overlap with first 100 of chunks[i+1]
       assert chunks[i][-overlap:] in chunks[i+1][:overlap*2]
   ```

3. **No loss of content:**
   ```python
   rejoined = "".join(chunks)
   # After removing duplicates, should equal original
   assert len(rejoined) >= len(text)  # Allowing for minimal char loss
   ```

4. **Edge cases:**
   - Empty text: `splitter.split_text("") → []`
   - Very small text (< chunk_size): `→ [text]`
   - Unicode/Emoji: "🎉 Hello 世界" → OK
   - Multiple separators: "A\n\nB. C.\n\nD" → correct splits
   - Page markers: "[Page 1]...[Page 2]" → page_number extracted correctly

5. **Metadata preservation:**
   ```python
   chunks_meta = [
       {'text': c, 'page': extract_page(c), 'idx': i}
       for i, c in enumerate(chunks)
   ]
   assert all(c['page'] is not None for c in chunks_meta)
   ```

---

## Phần III: NÂNG CAO

### Câu 15: Khi chunk chứa nhiều chủ đề, làm sao giảm "topical drift" trong retrieval?

**Đáp án mẫu:**

**Topical drift:** Chunk chứa mix các chủ đề → embedding "blurred" → retrieval kém accuracy.

**Chiến lược:**
1. **Semantic segmentation:** Phát hiện topic boundary dùng:
   - Coherence score (giữa đoạn liên tiếp).
   - BERTScore / embedding similarity (nếu 2 câu liên tiếp similarity thấp → boundary).
   
2. **Force split at topic boundary:**
   ```python
   # Pseudocode
   segments = detect_topic_boundaries(text)
   chunks = []
   for segment in segments:
       sub_chunks = recursive_splitter.split_text(segment)
       chunks.extend(sub_chunks)
   ```

3. **Metadata: add topic label:**
   ```python
   chunk['metadata']['topic'] = infer_topic(chunk_text)
   # Filter by topic during retrieval: metadata filter {"topic": "Finance"}
   ```

4. **Hierarchical chunks:**
   - Level 1: paragraph-sized (broad context)
   - Level 2: sentence-sized (specific)
   - Retrieval: 1 broad + N specific.

---

### Câu 16: Làm sao kết hợp semantic segmentation (topic-aware splitting) để chunk có tính chủ đề cao hơn?

**Đáp án mẫu:**

**Implementation:**
```python
from sklearn.cluster import KMeans
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

def semantic_split(text, max_chunk_size=1000):
    sentences = sent_tokenize(text)
    embeddings = model.encode(sentences)
    
    # Find breakpoints where semantic distance is high
    distances = []
    for i in range(len(embeddings) - 1):
        dist = cosine(embeddings[i], embeddings[i+1])
        distances.append(dist)
    
    # Threshold: if dist > 0.3, likely topic change
    breakpoints = [i for i, d in enumerate(distances) if d > 0.3]
    
    # Split at breakpoints, then apply size constraint
    chunks = []
    current = ""
    for i, sent in enumerate(sentences):
        current += " " + sent
        if i in breakpoints or len(current) > max_chunk_size:
            chunks.append(current.strip())
            current = ""
    if current:
        chunks.append(current.strip())
    
    return chunks
```

**Lợi ích:**
- Chunks semantically cohesive → better embedding.
- Reduce topical drift.
- More natural boundaries.

**Trade-off:**
- Thêm embedding computation overhead.
- Cần sentence tokenizer chính xác.

---

### Câu 17: Nêu cách tối ưu chunk selection khi building context (ranking + diversity selection).

**Đáp án mẫu:**

**Naive approach:** Lấy top-k chunks theo similarity score.

**Issue:** Có thể toàn bộ chunks từ 1 topic → redundant.

**Better approach: Diversity-aware selection**

```python
def diverse_chunk_selection(matches, top_k=5, diversity_weight=0.3):
    """
    Select chunks với balance similarity + diversity.
    """
    selected = []
    selected_embeddings = []
    
    # Sort by similarity
    matches_sorted = sorted(matches, key=lambda x: x['score'], reverse=True)
    
    for match in matches_sorted:
        if len(selected) >= top_k:
            break
        
        # Score 1: Similarity to query
        sim_score = match['score']
        
        # Score 2: Diversity to already selected
        diversity_score = 1.0
        if selected_embeddings:
            min_sim_to_selected = min(
                cosine_similarity(match['embedding'], sel_emb)
                for sel_emb in selected_embeddings
            )
            diversity_score = 1 - min_sim_to_selected  # High = diverse
        
        # Combined score
        final_score = (1 - diversity_weight) * sim_score + diversity_weight * diversity_score
        
        if final_score > threshold:
            selected.append(match)
            selected_embeddings.append(match['embedding'])
    
    return selected
```

**Variant: Maximal Marginal Relevance (MMR)**
```
MMR = λ * Similarity(chunk, query) - (1-λ) * max(Similarity(chunk, selected_chunks))
λ ∈ [0, 1], thường 0.6–0.7
```

---

### Câu 18: Khi muốn tối ưu tốc độ và cost, làm sao cân bằng số chunk vs quality (embedding calls, index size)?

**Đáp án mẫu:**

**Factors:**
- Embedding API cost: ~$0.02 per 1M input tokens (Gemini).
- Index size: proportional to chunk count × vector dimensions.
- Latency: More chunks → search slower.

**Strategies:**

1. **Reduce chunk count:** Increase chunk_size (risk: lower precision).
   ```
   chunk_size_current = 1000
   chunk_size_optimized = 1500  # -33% chunk count, -33% cost
   Trade-off: lose granularity
   ```

2. **Reduce dimensions:** Vector dimension 768 → 256 (quantization).
   ```
   Benefit: -66% storage, -66% search latency
   Risk: slight accuracy drop
   ```

3. **Cache embeddings:** Don't re-embed same query.
   ```python
   @cache(ttl=3600)
   def get_embedding(text):
       return embedding_service.embed(text)
   ```

4. **Batch embedding:** Embed multiple docs together (if using Gemini batch API).
   ```
   Before: embed doc1 (500 chunks) = 500 API calls
   After: embed all at once = 1 API call (if batch API available)
   ```

5. **Lazy indexing:** Index on-demand (index only when user searches).
   ```
   Upload → store in DB
   Index → only after first query (or schedule nightly)
   ```

6. **Budget-aware top_k:**
   ```python
   if monthly_cost > budget:
       top_k = 3  # Reduce from 5
       chunk_size = 1500  # Increase
   else:
       top_k = 5
       chunk_size = 1000
   ```

**Metrics to track:**
```
Monthly cost = (num_docs × avg_chunks × avg_embedding_cost)
Index size (MB) = num_vectors × dimension × 4 bytes
Search latency (ms) = retrieval + rerank + LLM
```

---

### Câu 19: Làm thế nào detect & deduplicate overlapping or near-duplicate chunks trước khi indexing?

**Đáp án mẫu:**

**Exact duplicates:**
```python
seen_hashes = set()
unique_chunks = []
for chunk in chunks:
    h = hashlib.md5(chunk['text'].encode()).hexdigest()
    if h not in seen_hashes:
        seen_hashes.add(h)
        unique_chunks.append(chunk)
```

**Near-duplicates (fuzzy matching):**
```python
from difflib import SequenceMatcher

def has_duplicate(new_chunk, existing_chunks, threshold=0.9):
    for existing in existing_chunks:
        ratio = SequenceMatcher(None, new_chunk, existing).ratio()
        if ratio > threshold:
            return True
    return False

unique_chunks = []
for chunk in chunks:
    if not has_duplicate(chunk['text'], [c['text'] for c in unique_chunks]):
        unique_chunks.append(chunk)
```

**Advanced: embedding-based dedup**
```python
from sklearn.metrics.pairwise import cosine_similarity

embeddings = model.encode([c['text'] for c in chunks])
seen_indices = set()
unique_chunks = []

for i, emb in enumerate(embeddings):
    if i in seen_indices:
        continue
    # Compare with all following embeddings
    for j in range(i+1, len(embeddings)):
        if cosine_similarity([emb], [embeddings[j]])[0][0] > 0.95:
            seen_indices.add(j)
    unique_chunks.append(chunks[i])
```

---

### Câu 20: Khi dùng hierarchical retrieval (document-level → chunk-level), thiết kế pipeline như thế nào?

**Đáp án mẫu:**

**2-level hierarchy:**

```
Level 1: Document retrieval
  - Embed document summary (first N chunks or abstract).
  - Retrieve top-K documents.

Level 2: Chunk retrieval
  - For each top-K document, retrieve top-M chunks within it.
  - Final context = concatenate chunks.
```

**Example code:**
```python
async def hierarchical_retrieval(query, user_documents, top_docs=3, chunks_per_doc=2):
    # Level 1: Document similarity
    query_embedding = embedding_service.embed(query)
    doc_scores = []
    for doc in user_documents:
        doc_summary = doc.metadata_.get('summary') or doc.title
        doc_emb = cached_embed(doc_summary)
        score = cosine(query_embedding, doc_emb)
        doc_scores.append((doc, score))
    
    top_documents = sorted(doc_scores, key=lambda x: x[1], reverse=True)[:top_docs]
    
    # Level 2: Chunk retrieval within top docs
    all_chunks = []
    for doc, _ in top_documents:
        chunks = await embedding_service.search_similar_chunks(
            query=query,
            document_ids=[doc.id],
            top_k=chunks_per_doc
        )
        all_chunks.extend(chunks)
    
    # Merge and sort
    all_chunks.sort(key=lambda x: x['score'], reverse=True)
    return all_chunks[:top_docs * chunks_per_doc]
```

**Benefit:**
- Faster: limit chunk search to relevant docs.
- Better recall: avoid missing a doc early.

---

### Câu 21: Cách xây dựng chunk-id idempotent để re-ingest an toàn (format ví dụ và lý do).

**Đáp án mẫu:**

**Idempotent ID format:**
```
vector_id = f"doc_{document_id}_chunk_{chunk_index}"
```

**Example:**
```
doc_54_chunk_0
doc_54_chunk_1
doc_54_chunk_5
```

**Why idempotent:**
- If document 54 re-indexed, chunks 0, 1, 5 get overwritten (upsert).
- No duplicate IDs if accidental re-ingest.
- Easy to delete: filter by `doc_{document_id}_*`.

**Alternative: content-hash based**
```
vector_id = f"doc_{document_id}_chunk_hash_{hashlib.md5(chunk_text).hexdigest()[:8]}"
# Example: doc_54_chunk_hash_a3f5c21b
```

**Advantage:** Detect changed chunks (different hash → new ID).

**Implementation (safe re-ingest):**
```python
async def safe_reingest_document(document_id, chunks):
    """
    Delete old vectors for this doc, then upsert new ones.
    """
    # Step 1: Mark old chunks for deletion
    old_chunk_ids = [f"doc_{document_id}_chunk_{i}" 
                     for i in range(expected_old_count)]
    
    # Step 2: Upsert new chunks (overwrites old IDs)
    new_vectors = []
    for i, chunk in enumerate(chunks):
        vector_id = f"doc_{document_id}_chunk_{i}"
        embedding = await embedding_service.embed(chunk['text'])
        new_vectors.append({
            'id': vector_id,
            'values': embedding,
            'metadata': chunk['metadata']
        })
    
    # Step 3: Upsert
    pinecone_index.upsert(vectors=new_vectors)
    
    # Step 4: Verify
    count = pinecone_index.describe_index_stats()['namespaces']['']['vector_count']
    logger.info(f"Reingested {len(new_vectors)} vectors")
```

---

### Câu 22: Ảnh hưởng của chunk size đến chất lượng embedding (semantics preservation) — làm sao đo?

**Đáp án mẫu:**

**Hypothesis:**
- Quá nhỏ: mất ngữ cảnh → embedding "blurred".
- Quá lớn: mix chủ đề → embedding confuse.
- Optimal: ngữ cảnh đủ + nhất quán topic.

**Đo lường:**

1. **Intrinsic: Self-similarity**
   ```python
   chunks_same_doc = [...]  # Chunks từ cùng doc
   embeddings = model.encode([c['text'] for c in chunks_same_doc])
   
   # Within-doc similarity (should be high ~0.7+)
   within_sim = mean([cosine(embeddings[i], embeddings[i+1]) 
                      for i in range(len(embeddings)-1)])
   
   # Between-doc similarity (should be low ~0.2)
   between_sim = mean([cosine(embeddings[i], embeddings[j])
                       for different docs i, j])
   
   # Quality metric: within_sim / between_sim (higher is better)
   ```

2. **Extrinsic: Retrieval quality**
   - Create ground-truth (query, relevant chunk pairs).
   - Vary chunk_size, measure Recall@k, MRR.
   - Plot: chunk_size vs metric.

3. **Manual inspection:**
   - Sample chunks from each size.
   - Rate semantic coherence 1–5.
   - Average rating by size.

**Example experiment:**
```python
chunk_sizes = [500, 1000, 1500, 2000]
results = {}

for size in chunk_sizes:
    splitter = RecursiveCharacterTextSplitter(chunk_size=size)
    chunks = splitter.split_text(text)
    embeddings = model.encode([c for c in chunks])
    
    within_sim = mean_consecutive_sim(embeddings)
    recall = evaluate_retrieval(queries, chunks, embeddings)
    
    results[size] = {'within_sim': within_sim, 'recall': recall}

# Find optimal size
optimal_size = max(results, key=lambda s: results[s]['recall'])
```

---

### Câu 23: Kết hợp OCR output (noisy text): chiến lược chunking & cleaning trước khi embedding?

**Đáp án mẫu:**

**OCR challenges:**
- Garbled text, missing spaces, extra newlines.
- Layout info lost (tables, columns).
- Character recognition errors ("1" vs "l").

**Cleaning strategy:**

```python
def clean_ocr_text(text):
    """
    Heuristic cleaning for OCR output.
    """
    # Remove excessive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Fix common OCR errors (maintain dict)
    replacements = {
        r'\b1st\b': '1st',  # "lst" → "1st"
        r'([a-z])\s+([a-z])': r'\1\2',  # Extra spaces in middle of words
    }
    for pattern, repl in replacements.items():
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
    
    # Remove header/footer junk
    lines = text.split('\n')
    content_lines = [
        line for line in lines
        if line.strip() and not is_junk(line)
    ]
    
    return '\n'.join(content_lines)

def is_junk(line):
    """Detect junk lines (page number, artifacts)."""
    return (
        re.match(r'^Page \d+', line) or
        re.match(r'^[©®™]', line) or
        len(line.strip()) < 3
    )
```

**Pre-processing before chunking:**
```python
# 1. Clean OCR
raw_ocr = extract_text_from_scanned_pdf(pdf_path)
cleaned_text = clean_ocr_text(raw_ocr)

# 2. Detect and preserve tables (if using Tabula or similar)
# tables = extract_tables(pdf_path)
# → store separately with metadata table_id

# 3. Add structure markers (if layout known)
# Insert section headers as [SECTION: ...] if detected

# 4. Chunk
chunks = splitter.split_text(cleaned_text)
```

**QA step:**
```python
# Sample chunks and manual review
sample_chunks = random.sample(chunks, k=5)
for chunk in sample_chunks:
    print(f"Quality: {rate_text_quality(chunk)} / 5")
    # Adjust clean_ocr_text() rules if score < 3
```

---

### Câu 24: Nếu muốn giảm hallucination, có thể xử lý chunk như thế nào để tăng provenance fidelity?

**Đáp án mẫu:**

**Strategy: Enforce strict context grounding**

1. **Annotate chunks with uncertainty markers:**
   ```python
   chunk_with_confidence = {
       'text': chunk_text,
       'confidence': 'high' if authoritative_source else 'medium' / 'low',
       'source_type': 'direct_quote' / 'paraphrase' / 'inferred'
   }
   # Pass metadata to prompt → LLM avoid hallucinating on low-confidence chunks
   ```

2. **Enforce citation in prompt:**
   ```
   System: "You must cite every fact. Use format [i] for chunk i. Never claim information outside provided context."
   
   Context:
   [1] The Earth orbits the Sun. (Page 5)
   [2] Distance is approximately 150 million km. (Page 6)
   
   Question: How far is the Earth from the Sun?
   
   Expected: The Earth is approximately 150 million km from the Sun [2].
   ```

3. **Verify post-generation:**
   ```python
   def verify_citations(response, chunks):
       """Check if all citations point to valid chunks."""
       citation_pattern = r'\[(\d+)\]'
       citations = re.findall(citation_pattern, response)
       
       for cite_num in citations:
           idx = int(cite_num) - 1
           if idx >= len(chunks):
               # Invalid citation → possible hallucination
               logger.warning(f"Citation [{cite_num}] out of range")
               return False
       return True
   ```

4. **Chunk-level fact verification (optional):**
   ```python
   # Use smaller fact-check model
   def verify_chunk_consistency(chunk, related_chunks):
       # Use entailment model to check if chunk contradicts others
       consistency_score = compute_entailment(chunk, related_chunks)
       if consistency_score < 0.5:
           flag_as_potentially_unreliable(chunk)
   ```

---

### Câu 25: Sử dụng learned chunking (ML-based segmentation): lợi ích, dữ liệu cần và rủi ro?

**Đáp án mẫu:**

**Lợi ích:**
- Tối ưu hoá theo downstream task (QA, summarization).
- Tự động học topic boundaries từ dữ liệu.
- Adapt to doc type (news, academic, legal).

**Dữ liệu cần:**
- Training data: pairs (document, ground-truth chunks).
- Labels: where should chunks split?
- Ideally 1000+ documents with consistent chunking.

**Model architecture example:**
```python
# BiLSTM sequence tagger → predict "B" (begin chunk), "I" (inside)
class LearnedChunker(nn.Module):
    def __init__(self, vocab_size, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, 100)
        self.lstm = nn.LSTM(100, hidden_dim, bidirectional=True)
        self.linear = nn.Linear(hidden_dim*2, 2)  # 2 classes: B or I
    
    def forward(self, tokens):
        embedded = self.embed(tokens)
        lstm_out, _ = self.lstm(embedded)
        logits = self.linear(lstm_out)
        return logits
```

**Rủi ro:**
- Model overfits to training domain → fail on new doc types.
- Requires labeled training data (expensive).
- Inference latency (LSTM slower than rule-based).
- Reproducibility issues (ML artifacts).

**When to use:**
- Large corpus (1M+ docs).
- Consistent format (same doc type).
- High ROI on quality improvement.

**Not worth for:**
- Small corpus, diverse doc types.
- Cost-sensitive systems.

---

### Câu 26: Thiết kế A/B test cho chunking parameters (metrics, traffic splitting, success criteria).

**Đáp án mẫu:**

**Parameters to test:**
```
chunk_size: 800, 1000, 1200, 1500
overlap: 50, 100, 150
strategy: fixed-size, sliding-window, semantic
```

**Traffic split:**
```
Control: 50% users → current params (chunk_size=1000, overlap=100)
Variant A: 25% → (chunk_size=1200, overlap=120)
Variant B: 25% → (chunk_size=800, overlap=80)
Duration: 2 weeks
```

**Metrics:**
- **Retrieval quality:** Recall@5, MRR, mean similarity of top-k.
- **LLM output quality:** Human rating 1–5, fact-checked answer accuracy.
- **Cost:** Total embedding API cost.
- **Latency:** Query response time (ms).
- **User satisfaction:** Click feedback ("Helpful" / "Not helpful").

**Statistical test:**
```python
# Assume normal distribution, one-sided test
from scipy import stats

control_recall = [...]  # Array of recall@5 for control group
variant_recall = [...]  # Array for variant

t_stat, p_value = stats.ttest_ind(control_recall, variant_recall)
# p_value < 0.05 → statistically significant difference
```

**Success criteria:**
```
Win conditions (any one):
1. +5% Recall@5 AND same cost
2. Same Recall@5 AND -10% cost
3. +3 points human rating

Stop criteria:
- p_value > 0.1 for 2 weeks → no significance
- Cost increased > 15% → not worth
```

**Example result:**
```
Control (chunk_size=1000):
  - Recall@5: 72% ± 3%
  - Latency: 450ms ± 50ms
  - Cost: $1.50 / 1000 queries

Variant A (chunk_size=1200):
  - Recall@5: 75% ± 3% → +3% (p=0.02, significant!)
  - Latency: 480ms ± 60ms → +30ms acceptable
  - Cost: $1.35 / 1000 queries → -10% ✓

→ Declare Variant A winner, ship to 100% users
```

---

### Câu 27: Khi làm multilingual corpus, chiến lược chunking, embedding model selection và per-language tuning ra sao?

**Đáp án mẫu:**

**Language detection + conditional chunking:**
```python
from langdetect import detect

def multilingual_chunk(text, language=None):
    if not language:
        language = detect(text)
    
    if language in ['zh', 'ja', 'ko']:
        # CJK: character-level, smaller chunks
        splitter = CJKCharacterTextSplitter(chunk_size=500, overlap=50)
    elif language == 'vi':
        # Vietnamese: sentence + character fallback
        splitter = VietnameseTextSplitter(chunk_size=1000, overlap=100)
    else:
        # Default (English, Romance languages)
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, overlap=100)
    
    return splitter.split_text(text)
```

**Embedding model choice:**
- **Multilingual models:** `sentence-transformers/multilingual-e5-base` (covers 100+ languages, 768-dim).
- **Language-specific:** `sentence-transformers/distiluse-base-multilingual-cased-v2` (smaller, faster).
- **Single-language:** `paraphrase-multilingual-MiniLM-L12-v2` (lightweight).

**Test multilingual quality:**
```python
queries_by_lang = {
    'en': ['What is machine learning?', ...],
    'zh': ['什么是机器学习?', ...],
    'vi': ['Học máy là gì?', ...],
}

for lang, queries in queries_by_lang.items():
    recall = evaluate_retrieval(queries, chunks, embeddings, lang=lang)
    print(f"{lang}: Recall@5 = {recall}")
    # Expect similar recall across languages
```

**Per-language tuning:**
```
English:
  chunk_size=1000, overlap=100, top_k=5

Chinese:
  chunk_size=600, overlap=50, top_k=5
  (smaller chunks due to CJK char density)

Vietnamese:
  chunk_size=1000, overlap=100, top_k=5
  (similar to English)
```

**Cross-lingual gotchas:**
- Embeddings not aligned → can't mix queries + chunks in different languages.
- Use multilingual model to embed everything in same space.

---

### Câu 28: Cách gắn thời gian/phiên bản (versioning) cho chunks để track updates và invalidate stale vectors.

**Đáp án mẫu:**

**Versioning strategy:**

```python
chunk_with_version = {
    'text': chunk_text,
    'chunk_index': idx,
    'document_id': doc_id,
    'document_version': 1,  # Increment when doc updated
    'chunk_hash': hashlib.sha256(chunk_text.encode()).hexdigest(),
    'indexed_at': datetime.now().isoformat(),
    'expires_at': datetime.now() + timedelta(days=30),  # 30-day TTL
}
```

**Store in vector metadata:**
```python
vector = {
    'id': f"doc_{doc_id}_chunk_{idx}",
    'values': embedding,
    'metadata': {
        'document_id': doc_id,
        'document_version': 1,
        'chunk_hash': '...',
        'indexed_at': '2024-12-19T01:05:54Z',
        'expires_at': '2025-01-18T01:05:54Z',
    }
}
```

**Detect stale chunks:**
```python
def cleanup_stale_vectors(pinecone_index, stale_days=30):
    """Delete vectors older than stale_days."""
    cutoff = datetime.now() - timedelta(days=stale_days)
    
    # Query: metadata.indexed_at < cutoff
    # Pinecone doesn't support time-range directly, so:
    # 1. Scan all vectors (or use namespace)
    # 2. Client-side filter
    
    stale_ids = []
    for vector in pinecone_index.fetch(ids=[...]):
        indexed_at = datetime.fromisoformat(vector['metadata']['indexed_at'])
        if indexed_at < cutoff:
            stale_ids.append(vector['id'])
    
    if stale_ids:
        pinecone_index.delete(ids=stale_ids)
        logger.info(f"Deleted {len(stale_ids)} stale vectors")
```

**On document update:**
```python
async def update_document(document_id, new_content):
    # 1. Increment version
    doc = db.query(Document).get(document_id)
    doc.version += 1
    
    # 2. Re-chunk and embed
    new_chunks = chunk(new_content)
    new_embeddings = [await embed_service.embed(c) for c in new_chunks]
    
    # 3. Delete old vectors for this doc
    pinecone_index.delete(filter={'document_id': document_id})
    
    # 4. Upsert new vectors with incremented version
    for i, (chunk, emb) in enumerate(zip(new_chunks, new_embeddings)):
        vector_id = f"doc_{document_id}_chunk_{i}"
        pinecone_index.upsert(vectors=[{
            'id': vector_id,
            'values': emb,
            'metadata': {
                'document_id': document_id,
                'document_version': doc.version,
                'indexed_at': datetime.now().isoformat(),
                ...
            }
        }])
    
    db.commit()
```

**Query-time version check:**
```python
async def query_with_version_check(query, document_ids):
    # Retrieve with version filter
    matches = await embedding_service.search_similar_chunks(
        query=query,
        document_ids=document_ids,
        metadata_filter={
            'document_version': {'$gte': 1},  # Skip version 0 (deprecated)
            'expires_at': {'$gte': datetime.now().isoformat()}
        }
    )
    return matches
```

---

## Phần IV: TÓNG KẾT VÀ ĐỀ XUẤT

### Bảng tham chiếu nhanh (Quick Reference)

| Khía cạnh | Khuyến cáo | Ghi chú |
|-----------|-----------|--------|
| **Chunk size** | 1000 chars (200–250 tokens) | Thử 800–1500, test |
| **Overlap** | 100 chars (10–15% size) | 50–200 chars |
| **Top-k retrieval** | 5–10 | Phụ thuộc precision requirement |
| **Similarity threshold** | 0.25–0.3 (cosine) | Reject low-quality results |
| **Tokenization** | Embedding model's native | Đồng nhất với model |
| **Metadata** | title, page, section, chunk_idx | Minimal để tracking |
| **Deduplication** | Embedding-based (~0.95 sim) | Before indexing |
| **Reindexing** | Idempotent IDs: `doc_{id}_chunk_{idx}` | Safe upsert |
| **Testing** | Unit + integration + end-to-end | Edge cases: empty, unicode, multipage |
| **Optimization** | Balance cost vs quality via A/B | Track Recall@k, latency, cost |

### Các câu hỏi ôn tập cuối cùng (để sinh viên tự đánh giá)

1. Tại sao `overlap` cần ~10% chunk_size thay vì 0%?
2. Nêu 3 trade-off của việc tăng `chunk_size`.
3. Làm sao phân biệt giữa "semantic coherence" và "topic drift" trong chunks?
4. Thiết kế một A/B test cho chunking parameters; metrics nào cần track?
5. Khi làm multilingual system, chunk_size tiếng Việt vs English có khác không? Vì sao?

---

**Kết thúc danh sách câu hỏi & đáp án về Chunking**
