# Danh Sách Câu Hỏi Về Similarity Metrics & Confidence Score (Cơ Bản → Nâng Cao)

## Phần I: CƠ BẢN

### Câu 1: Similarity metrics là gì? Nêu các loại chính và ứng dụng của chúng.

**Đáp án mẫu:**

Similarity metrics là hàm toán học đo độ gần gũi giữa hai vectors (hoặc hai điểm trong không gian).

**Các loại chính:**

| Metric | Công thức | Phạm vi | Ứng dụng |
|--------|-----------|---------|---------|
| **Cosine Similarity** | $\cos(\theta) = \frac{u \cdot v}{\|u\| \|v\|}$ | [−1, 1] hoặc [0, 1] | Embedding similarity (default) |
| **Dot Product** | $u \cdot v = \sum u_i v_i$ | (−∞, +∞) | Fast similarity, biased metric learning |
| **Euclidean Distance** | $\|u - v\| = \sqrt{\sum (u_i - v_i)^2}$ | [0, ∞) | Spatial distance (rarely used for ANN) |
| **Manhattan Distance** | $\sum \|u_i - v_i\|$ | [0, ∞) | Sparse vectors, L1 norm |
| **Jaccard Similarity** | $\frac{\|A \cap B\|}{\|A \cup B\|}$ | [0, 1] | Set similarity, token-level matching |
| **BM25 Score** | TF-IDF variant | [0, ∞) | Keyword-based retrieval |

**Khi dùng cái nào:**
- **Cosine:** Normalized embeddings → **thường xuyên nhất** cho neural retrieval.
- **Dot product:** Khi vectors **không normalize**, hoặc scale là factor (magnitude matters).
- **Euclidean:** Hiếm dùng (slow cho ANN), trừ khi cần actual distance (e.g., clustering).
- **Jaccard:** Bag-of-words, exact matching.
- **BM25:** Keyword search (hybrid retrieval + neural).

---

### Câu 2: Cosine similarity là gì? Tại sao nó phổ biến trong embedding retrieval?

**Đáp án mẫu:**

**Định nghĩa:**
$$\cos(\theta) = \frac{u \cdot v}{\|u\| \|v\|} = \frac{\sum u_i v_i}{\sqrt{\sum u_i^2} \sqrt{\sum v_i^2}}$$

**Ý nghĩa:** Đo góc giữa hai vectors (không quan tâm độ dài).

**Tại sao phổ biến:**

1. **Invariant to magnitude:** Hai vectors có hướng giống nhưng độ dài khác vẫn similarity = 1.
   - Query & document có độ dài khác → cosine không bị ảnh hưởng.

2. **Normalized embeddings:** Embedding models (BERT, Sentence-Transformers) output **normalize vectors** (L2 norm = 1).
   - Cosine simplify thành: $\cos(\theta) = u \cdot v$ (vì $\|u\| = \|v\| = 1$).
   - Fast computation: chỉ cần dot product.

3. **Geometric intuition:** Cosine ∈ [−1, 1] (or [0, 1] after mapping) → easy interpret.
   - 1 = perfectly similar.
   - 0 = orthogonal (no relation).
   - −1 = opposite (rare in positive embeddings).

4. **ANN optimization:** Vector DB engines (Pinecone, Weaviate) optimize cho cosine.

**Trade-off:** Ignores magnitude → not suitable khi scale matters (e.g., importance-weighted embeddings).

---

### Câu 3: Dot product vs Cosine — Khi nào dùng cái nào?

**Đáp án mẫu:**

**Dot product:**
$$u \cdot v = \sum u_i v_i$$

**Comparison:**

| Aspect | Dot Product | Cosine |
|--------|-------------|--------|
| **Công thức** | $u \cdot v$ | $\frac{u \cdot v}{\|u\| \|v\|}$ |
| **Phụ thuộc magnitude** | Có (nếu vectors khác dài) | Không (normalized) |
| **Tốc độ** | Nhanh (chỉ dot) | Slightlyslower (cần normalize) |
| **Khi normalized inputs** | Giống cosine (vì normalize) | Same |
| **Khi non-normalized inputs** | Bias to longer vectors | Fair regardless length |
| **Use case** | Learned metrics (contrastive loss) | General-purpose embedding similarity |

**Chọn cái nào:**

- **Cosine:** Default cho embedding retrieval (vectors normalized).
  - Sentence-Transformers, OpenAI embeddings, etc. → use cosine.

- **Dot product:** Khi:
  - Training siamese networks (triplet loss, contrastive loss) → dot product loss.
  - Vectors deliberately scaled (e.g., uncertainty per dimension).
  - Want to bias toward higher-magnitude vectors.

**Example (dự án bạn):**
```python
# Pinecone config
"metric": "cosine"  # ← Default, OK vì embedding_service embed theo L2 norm
# Could also: "metric": "dotproduct" (if model trained with dot product loss)
```

---

### Câu 4: Euclidean distance vs Cosine — Khi nào Euclidean tốt hơn?

**Đáp án mẫu:**

**Euclidean distance:**
$$d(u, v) = \sqrt{\sum (u_i - v_i)^2}$$

**Comparison:**

| Aspect | Euclidean | Cosine |
|--------|-----------|--------|
| **Measure** | Spatial distance | Angular distance |
| **Sensitive to magnitude** | Rất | Không |
| **Speed (ANN)** | Slower | Faster (cosine optimized) |
| **Dimensionality curse** | High dimensions: distances flatten | More stable |
| **When magnitude matters** | Yes | No |
| **Geometry** | Straight-line distance | Angle between vectors |

**Khi Euclidean tốt hơn:**

1. **Clustering:** K-means, GMM dùng Euclidean.
2. **Geometric spaces:** Khi embedding space có ý nghĩa geometric thực (e.g., word2vec "king" − "man" + "woman" ≈ "queen").
3. **Non-normalized vectors:** Khi magnitude carry information (e.g., confidence scores embedded).
4. **Low-dimensional spaces:** < 50 dimensions, Euclidean OK.

**Khi cosine tốt hơn:**
1. **High-dimensional embeddings:** > 100 dimensions.
2. **Normalized vectors:** Khi vectors đã L2-normalize.
3. **Text retrieval:** BERT, sentence embeddings.
4. **ANN efficiency:** Cosine heavily optimized.

**Khuyến cáo:** Stick với **cosine** cho modern embedding-based retrieval.

---

### Câu 5: Confidence score là gì? Tại sao cần nó?

**Đáp án mẫu:**

**Định nghĩa:** Confidence score là một giá trị scalar ∈ [0, 1] biểu thị độ tin cậy của retrieval result (có liên quan hay không).

**Tại sao cần:**

1. **Threshold decision:** Nếu confidence < 0.3 → có thể trả "Không đủ thông tin" thay vì hallucinate.
2. **Ranking tuỳ bộ:** Display results có confidence cao lên trước.
3. **Feedback loop:** Log low-confidence queries → improve model.
4. **Cost optimization:** Skip low-confidence → reduce LLM calls.
5. **User transparency:** Show user độ chắc chắn của answer.

**Phân biệt:**
- **Similarity score** (0.5): cặp vector gần gũi bao nhiêu → local signal.
- **Confidence score** (0.7): độ tin cậy của retrieval result toàn thể → global signal, combine multiple factors.

---

### Câu 6: Similarity score vs Confidence score — Khác nhau gì?

**Đáp án mẫu:**

| Aspect | Similarity Score | Confidence Score |
|--------|------------------|------------------|
| **Định nghĩa** | Độ gần của query với 1 chunk | Độ tin cậy của retrieval result toàn bộ |
| **Input** | 2 vectors | Matches + query context + metadata |
| **Phạm vi** | [0, 1] (cosine) | [0, 1] |
| **Computation** | cosine(query_emb, chunk_emb) | mean(similarities) × reweighting |
| **Mục đích** | Ranking chunks | Threshold decision ("valid result?") |
| **Example** | query_sim = 0.75 | confidence = 0.68 (after 0.75 matched × calibration) |

**Relationship:** Similarity → input để tính confidence.

---

## Phần II: TRUNG CẤP

### Câu 7: Công thức tính Cosine Similarity — derivation và properties.

**Đáp án mẫu:**

**Derivation:**
Cho hai vectors $u, v \in \mathbb{R}^d$.

Law of cosines: $\|u - v\|^2 = \|u\|^2 + \|v\|^2 - 2\|u\|\|v\|\cos(\theta)$

Rearrange:
$$\cos(\theta) = \frac{\|u\|^2 + \|v\|^2 - \|u - v\|^2}{2\|u\|\|v\|}$$

Simplify to:
$$\cos(\theta) = \frac{u \cdot v}{\|u\| \|v\|}$$

**Properties:**

1. **Symmetric:** $\text{cos}(u, v) = \text{cos}(v, u)$.
2. **Bounded:** $\cos(\theta) \in [-1, 1]$.
   - 1 = parallel (same direction).
   - 0 = orthogonal.
   - −1 = anti-parallel.
3. **Scale-invariant:** $\cos(\alpha u, \beta v) = \cos(u, v)$ for $\alpha, \beta > 0$.
4. **Transitive approximation:** Not transitive; $\text{cos}(u, v)$ high + $\text{cos}(v, w)$ high ≠ $\text{cos}(u, w)$ necessarily high.

**Fast computation (normalized vectors):**
If $\|u\| = \|v\| = 1$ (pre-normalized):
$$\cos(\theta) = u \cdot v$$
No need to normalize again.

---

### Câu 8: Thresholding similarity — Cách chọn threshold và ảnh hưởng?

**Đáp án mẫu:**

**Threshold:** Cutoff score, reject results dưới ngưỡng.

**Cách chọn:**

1. **Domain-driven:** 
   - Strict retrieval (legal, medical): threshold = 0.4–0.5.
   - Loose retrieval (general QA): threshold = 0.2–0.3.

2. **Data-driven:** Calibrate trên validation set.
   ```python
   # Pseudocode
   precisions = []
   for threshold in [0.1, 0.2, 0.3, ..., 0.8]:
       precision = evaluate_precision_at_threshold(threshold)
       precisions.append(precision)
   
   optimal_threshold = thresholds[np.argmax(precisions)]
   ```

3. **Cost-sensitive:** Nếu false positive (hallucination) costly → high threshold; false negative (missing results) costly → low threshold.

**Ảnh hưởng:**

| Threshold | Precision ↑ | Recall ↓ | Use case |
|-----------|----------|---------|----------|
| **High (0.6)** | High (few false positives) | Low (miss some) | Conservative (avoid hallucination) |
| **Medium (0.3)** | Medium | Medium | Balanced |
| **Low (0.1)** | Low (many noise) | High (catch most) | Permissive (want coverage) |

**Dự án bạn:**
```python
if not matches or matches[0]['score'] < 0.25:
    # Threshold = 0.25 (cosine)
    return NO_RESULT_RESPONSE
```

---

### Câu 9: Cách tính Confidence Score từ similarity scores — công thức đơn giản.

**Đáp án mẫu:**

**Phương pháp 1: Mean similarity**
$$\text{confidence} = \min(1, 1.5 \times \text{mean}(scores))$$

Lý do: Assume nhiều chunks similar → high confidence.
Hệ số 1.5 để scale up (adjust per data).

**Phương pháp 2: Max similarity**
$$\text{confidence} = \text{max}(scores)$$

Tự nhiên: best match score → confidence.

**Phương pháp 3: Weighted average (position-aware)**
$$\text{confidence} = \frac{\sum_i w_i \times s_i}{\sum_i w_i}$$

where $w_i = \frac{1}{i}$ (rank weight), $s_i$ = i-th match score.

Example: top-3 scores = [0.8, 0.6, 0.4]
- Weights: [1, 0.5, 0.33]
- Confidence = (1×0.8 + 0.5×0.6 + 0.33×0.4) / (1 + 0.5 + 0.33) = 0.67

**Phương pháp 4: Sigmoid scaling (calibrated)**
$$\text{confidence} = \sigma(a \times \text{mean}(scores) + b)$$

where $\sigma(x) = \frac{1}{1 + e^{-x}}$.

Learn $a, b$ từ validation set có ground truth labels (correct/incorrect).

**Khuyến cáo dự án bạn:** Hiện tại dùng phương pháp 1 (mean).
```python
avg_similarity = sum(m['score'] for m in matches) / len(matches)
confidence_score = min(avg_similarity * 1.5, 1.0)
```

---

### Câu 10: Calibration confidence score — Tại sao cần và cách làm?

**Đáp án mẫu:**

**Calibration:** Đảm bảo predicted confidence phản ánh thực tế probability đúng.

**Tại sao cần:**

Nếu model nói "80% confident" nhưng thực tế chỉ đúng 60% → miscalibrated.

**Hiệu ứng:**
- Misaligned thresholds → tăng false positive/negative.
- User không tin → UX tệ.

**Cách làm:**

1. **Post-hoc scaling (Temperature scaling):**
   ```python
   # Sigmoid mapping
   def calibrate(raw_score, temperature=1.5):
       return 1 / (1 + np.exp(-(raw_score - 0.5) / temperature))
   ```
   Learn temperature from validation set.

2. **Isotonic regression:**
   ```python
   from sklearn.isotonic import IsotonicRegression
   
   ir = IsotonicRegression(out_of_bounds='clip')
   ir.fit(raw_scores_validation, labels_validation)  # labels: 0/1
   calibrated_scores = ir.transform(raw_scores_test)
   ```

3. **Platt scaling:**
   ```python
   # Logistic regression
   clf = LogisticRegression()
   clf.fit(raw_scores_validation.reshape(-1, 1), labels_validation)
   calibrated = clf.predict_proba(raw_scores_test.reshape(-1, 1))[:, 1]
   ```

**Evaluation:**
```python
# Calibration metrics
from sklearn.metrics import brier_score_loss

brier = brier_score_loss(labels, confidences)  # Lower is better
# Expected Calibration Error (ECE)
```

---

### Câu 11: Similarity distribution — Làm sao kiểm tra embedding quality qua similarity histogram?

**Đáp án mẫu:**

**Ý tưởng:** Plot histogram similarity scores → observe distribution.

**Code:**
```python
import matplotlib.pyplot as plt

# Compute pairwise similarities trong collection
embeddings = model.encode(corpus)
similarities = cosine_similarity(embeddings, embeddings)

# Flatten (exclude diagonal)
flat_sims = similarities[np.triu_indices_from(similarities, k=1)]

plt.hist(flat_sims, bins=50)
plt.xlabel("Cosine Similarity")
plt.ylabel("Frequency")
plt.title("Similarity Distribution")
plt.show()
```

**Healthy distribution:**
- Spike near 0 (most pairs dissimilar).
- Tail toward 1 (few highly similar pairs).
- Mean ~0.2–0.4 (typical).

**Bad signs:**
- Bimodal (clustered into 2 groups) → embedding collapse.
- All near 1 → no discrimination.
- Uniform → no structure.

**Interpretation:**
```
Good: 
  ███
  ███ ███
  ███ ███ ███
  ─────────────
  0   0.5  1
  (sparse, varied)

Bad:
  ███████████████████████████
  ───────────────────────────
  0   0.5  1
  (all similar, collapse)
```

---

### Câu 12: Ranking algorithms trong retrieval — So sánh BM25, TF-IDF, neural ranking.

**Đáp án mẫu:**

| Algorithm | Công thức | Ưu điểm | Nhược điểm |
|-----------|-----------|---------|-----------|
| **BM25** | TF-IDF variant với saturation | Keyword-robust, saturation avoids long-doc bias | Không capture semantic |
| **TF-IDF** | $\log(1 + \frac{N}{n_t}) \times tf(t, d)$ | Simple, interpretable | Ignore word order, semantics |
| **Neural (Cosine)** | $\cos(\text{embed}(q), \text{embed}(d))$ | Semantic, robust to paraphrase | Require embedding model, slower |
| **Hybrid (BM25 + Neural)** | Combine scores | Best of both (keyword + semantic) | Complexity, tuning 2 scores |

**BM25 formula (simplified):**
$$\text{BM25}(d, q) = \sum_{t \in q} \text{IDF}(t) \times \frac{(k_1 + 1) \times tf(t, d)}{tf(t, d) + k_1 \times (1 - b + b \times \frac{|d|}{L})}$$

where:
- $k_1, b$ = tuning params (typical: $k_1 = 1.5, b = 0.75$).
- Saturation: tf saturate (diminishing returns per extra occurrence).
- Length normalization: account doc length.

**Khi dùng cái nào:**
- **BM25:** Keyword-heavy queries (e.g., "Python programming").
- **Neural:** Semantic queries (e.g., "How to learn Python?").
- **Hybrid:** Production (recall + precision balance).

---

### Câu 13: Reranking — Tại sao cần và các chiến lược?

**Đáp án mẫu:**

**Reranking:** Sau retrieval top-k (fast, approximate), apply second-stage ranker (slow, accurate) để refine order.

**Tại sao cần:**

Retrieval (ANN) ∼85% recall @ top-100 → OK nhưng top-5 có noise.
Reranker improve precision @ top-5.

**Chiến lược:**

1. **Cross-encoder reranking:**
   ```python
   from sentence_transformers import CrossEncoder
   
   model = CrossEncoder('cross-encoder/qnli-distilroberta-base')
   
   # Retrieve top-100 fast
   candidates = retriever.search(query, top_k=100)
   
   # Rerank top-100 → top-5
   rerank_scores = []
   for cand in candidates:
       score = model.predict([query, cand['text']])[0]
       rerank_scores.append((cand, score))
   
   top_5 = sorted(rerank_scores, key=lambda x: x[1], reverse=True)[:5]
   ```

2. **BM25 filtering (hybrid):**
   ```python
   # First: BM25 to ~50 candidates (keyword match)
   bm25_results = bm25_search(query, top_k=50)
   
   # Second: neural rerank to ~5
   neural_scores = neural_search(query, docs=[r['text'] for r in bm25_results])
   top_5 = sorted(zip(bm25_results, neural_scores), key=lambda x: x[1])[:5]
   ```

3. **Diversity reranking (MMR):**
   ```
   Maximal Marginal Relevance:
   MMR = λ * relevance - (1-λ) * max_similarity_to_selected
   ```

**Trade-off:**
- Cost: Reranker adds latency (but on small set).
- Accuracy: Usually +5–10% precision @ top-k.

---

## Phần III: NÂNG CAO

### Câu 14: Cosine similarity khi vectors không normalized — Ảnh hưởng?

**Đáp án mẫu:**

**Setup:** Vectors chưa L2-normalize.

**Công thức đầy đủ:**
$$\cos(\theta) = \frac{u \cdot v}{\|u\| \|v\|}$$

**Ảnh hưởng:**

Một vector có magnitude lớn → cosine không bị ảnh hưởng (vì normalize bằng norm).

**Example:**
```
u = [3, 4]  → norm = 5
v = [1, 2]  → norm = sqrt(5)

u·v = 3 + 8 = 11
cos = 11 / (5 × sqrt(5)) = 11 / 11.18 ≈ 0.98

u' = 2×u = [6, 8]  → norm = 10
cos = 22 / (10 × sqrt(5)) ≈ 0.98  (same!)
```

**Khác với dot product:**
```
u·v = 11
u'·v = 22  (doubled!)
```

**Recommendation:** Luôn normalize vectors trước embeddings để avoid confusion.
```python
from sklearn.preprocessing import normalize
embeddings_normalized = normalize(embeddings, norm='l2')
```

---

### Câu 15: Metric learning — Cách train embedding model để tối ưu similarity?

**Đáp án mẫu:**

**Goal:** Learn embeddings sao cho similar pairs → high score, dissimilar → low score.

**Loss functions:**

1. **Contrastive loss:**
   ```
   L = (1 - y) × d²/2 + y × max(0, m - d)²/2
   ```
   where y ∈ {0, 1} (similar or not), d = distance, m = margin.

2. **Triplet loss:**
   ```
   L = max(0, d(a, p) - d(a, n) + m)
   ```
   where a = anchor, p = positive, n = negative, m = margin.
   
   Objective: $d(a, p) < d(a, n) - m$.

3. **Siamese networks:**
   ```
   L = ||emb(x1) - emb(x2)||² - y × ||emb(x1) - emb(x2)||²
   ```

4. **InfoNCE (Contrastive learning):**
   ```
   L = -log(exp(sim(q, p+)/τ) / Σ_i exp(sim(q, p_i)/τ))
   ```
   τ = temperature.

**Training pipeline:**
```python
# Sentence-Transformers (production-ready)
from sentence_transformers import SentenceTransformer, InputExample, losses

model = SentenceTransformer('all-MiniLM-L6-v2')

train_examples = [
    InputExample(texts=['This is a positive pair', 'This is a positive pair'], label=1),
    InputExample(texts=['This is a positive pair', 'This is a negative pair'], label=0),
]

train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
train_loss = losses.CosineSimilarityLoss(model)

model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=1,
    warmup_steps=100,
)
```

---

### Câu 16: Negative sampling — Tại sao cần và cách chọn negatives?

**Đáp án mẫu:**

**Negative sampling:** Chọn hard negatives (phức tạp) thay vì random negatives.

**Tại sao cần:**

Random negatives dễ phân biệt → model không học cách phân biệt fine-grained.
Hard negatives force model to learn nuanced differences.

**Chiến lược:**

1. **Random (baseline):**
   ```python
   negatives = random.sample(corpus, k)  # Simple
   ```

2. **Hard negatives (BM25 or previous model):**
   ```python
   # For each (query, positive), find hard negatives
   negatives = bm25_search(query, top_k=100)  # Remove positives
   # Take top-10 that are NOT positive (hardest wrong answers)
   ```

3. **In-batch negatives:**
   ```
   # Batch of B samples → B² negative pairs (all others in batch)
   # Efficient: leverage batching
   ```

4. **Adversarial negatives:**
   ```
   # Use previous model to find negatives model is confused about
   hard_negatives = model.retrieve(query, top_k=100)
   # Filter out true positives → these are model's mistakes
   ```

**Example code:**
```python
def mine_hard_negatives(query, corpus, bm25_index, k=10):
    # BM25 retrieve
    candidates = bm25_index.search(query, top_k=200)
    
    # Filter out known positives
    negatives = [c for c in candidates if c['id'] not in positives_ids]
    
    return negatives[:k]
```

---

### Câu 17: Temperature scaling trong similarity — Ảnh hưởng đến distribution?

**Đáp án mẫu:**

**Temperature scaling:**
$$\text{softmax}_\tau(s_i) = \frac{\exp(s_i / \tau)}{\sum_j \exp(s_j / \tau)}$$

**Ảnh hưởng:**

| Temperature (τ) | Hiệu ứng | Phù hợp |
|-----------------|---------|--------|
| **τ → 0** | Sharp (winner-take-all) | Hard selection |
| **τ = 1** | Normal softmax | Baseline |
| **τ → ∞** | Flat (uniform) | Uncertainty |

**Example:**
```
Scores: [0.8, 0.6, 0.4]

τ = 0.1: softmax ≈ [0.999, 0.001, 0.0]  (very sharp)
τ = 1.0: softmax ≈ [0.665, 0.245, 0.090]  (normal)
τ = 10.0: softmax ≈ [0.341, 0.336, 0.323]  (flat, nearly uniform)
```

**Use case:**
- **Lower τ:** Want hard decision (e.g., top-1 selection).
- **Higher τ:** Want soft labels (e.g., mix multiple candidates).

---

### Câu 18: Measuring retrieval quality — Recall@k, MRR, nDCG formulas.

**Đáp án mẫu:**

**Recall@k:**
$$\text{Recall@k} = \frac{|\text{relevant retrieved}|}{|\text{all relevant}|}$$

Example: 2 relevant docs, retrieve 1 within top-5 → Recall@5 = 0.5.

**Precision@k:**
$$\text{Precision@k} = \frac{|\text{relevant retrieved @ k}|}{k}$$

Example: retrieve top-5, 3 relevant → Precision@5 = 0.6.

**MRR (Mean Reciprocal Rank):**
$$\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$$

where $\text{rank}_i$ = position of first relevant result for query i.

Example: relevant at position 3 → MRR contribution = 1/3 ≈ 0.33.

**nDCG (normalized Discounted Cumulative Gain):**
$$\text{DCG@k} = \sum_{i=1}^{k} \frac{2^{\text{rel}_i} - 1}{\log_2(i + 1)}$$
$$\text{nDCG@k} = \frac{\text{DCG@k}}{\text{ideal DCG@k}}$$

where $\text{rel}_i$ = relevance grade (0, 1, 2, ...).

Account for position: higher rank → higher discount.

**Comparison:**

| Metric | Sensitivity | Grade? | Use |
|--------|-------------|--------|-----|
| **Recall** | High (all relevant) | No (binary) | Comprehensive retrieval |
| **Precision** | High (correct retrieved) | No | Accuracy |
| **MRR** | Rank of first | No | First result matters (search engine) |
| **nDCG** | Ranking order, grades | Yes | Ranking quality (graded relevance) |

**Recommendation:** Track Recall@5, Precision@5, MRR cho production.

---

### Câu 19: Cosine similarity edge cases — Zeros, NaN, dimension mismatch?

**Đáp án mẫu:**

**Edge cases:**

1. **Zero vector:**
   ```
   u = [0, 0, 0], v = [1, 2, 3]
   cos = 0 / (0 × √14) = 0/0 = NaN
   ```
   Handle: Return 0 (no similarity) hoặc exception.

2. **Identical vectors:**
   ```
   u = v = [1, 2, 3]
   cos = (1+4+9) / (√14 × √14) = 14/14 = 1
   ✓ Expected
   ```

3. **Opposite vectors:**
   ```
   u = [1, 2], v = [-1, -2]
   cos = -5 / (√5 × √5) = -5/5 = -1
   ✓ Expected (rarely happens in embeddings)
   ```

4. **Dimension mismatch:**
   ```python
   u = [1, 2, 3]      # 3D
   v = [1, 2, 3, 4]   # 4D
   # Error: dimension mismatch
   ```
   Handle: Pad or throw exception.

5. **NaN / Inf in embedding:**
   ```python
   u = [1, np.nan, 3]
   cos(u, v) = NaN
   ```
   Handle: Clean embeddings, check for NaN.

**Production code:**
```python
def safe_cosine(u, v):
    """Compute cosine with edge case handling."""
    u, v = np.array(u), np.array(v)
    
    # Check dimensions
    if u.shape != v.shape:
        raise ValueError("Dimension mismatch")
    
    # Check NaN/Inf
    if np.any(~np.isfinite(u)) or np.any(~np.isfinite(v)):
        return 0.0
    
    # Check zero
    norm_u, norm_v = np.linalg.norm(u), np.linalg.norm(v)
    if norm_u == 0 or norm_v == 0:
        return 0.0
    
    return np.dot(u, v) / (norm_u * norm_v)
```

---

### Câu 20: Annoy, FAISS, Pinecone — So sánh ANN algorithms cho similarity search.

**Đáp án mẫu:**

| Framework | Algorithm | Scale | Speed | Cost | Use |
|-----------|-----------|-------|-------|------|-----|
| **Annoy** | LSH, tree | Small (< 1M) | Fast | Free | Local/dev |
| **FAISS** | IVF, HNSW | Large (1B+) | Very fast | Free | Batch search |
| **Milvus** | Quantization | Large (1B+) | Very fast | Free | Self-hosted |
| **Pinecone** | HNSW (managed) | Very large | Ultra-fast | Paid | Production |
| **Weaviate** | HNSW | Large (100M+) | Fast | Free/paid | Graph queries |

**Deep dive Pinecone (dự án bạn):**

```python
from pinecone import Pinecone

pc = Pinecone(api_key=api_key)
index = pc.Index("my-index")

# Query
results = index.query(
    vector=query_embedding,
    top_k=5,
    include_metadata=True,
    filter={'document_id': 54}  # Metadata filter
)

# Upsert
index.upsert(vectors=[
    ('vec1', [0.1, 0.2, ...], {'text': '...'})
])
```

**HNSW (Hierarchical Navigable Small World):**
- Pinecone uses HNSW for fast, approximate nearest neighbor.
- Trade-off: ~1–2% accuracy loss for 100x speed gain.

---

### Câu 21: Embedding collapse — Symptoms, nguyên nhân, cách phát hiện & fix.

**Đáp án mẫu:**

**Embedding collapse:** Tất cả vectors point cùng hướng → similarity scores ≈ 1 cho mọi pair.

**Symptoms:**
- Similarity distribution = spike near 1.
- Retrieval không discriminative (any query returns similar results).
- Calibration error cao.

**Nguyên nhân:**
- Bad training objective (e.g., ngoại lệ loss).
- Insufficient negative sampling (model never learns to discriminate).
- Learning rate quá cao (exploding gradients).
- Dimension quá thấp (capacity insufficient).

**Phát hiện:**
```python
# Method 1: Check mean pairwise similarity
sims = cosine_similarity(embeddings)
mean_sim = np.mean(sims[np.triu_indices_from(sims, k=1)])
if mean_sim > 0.8:
    print("WARNING: Possible collapse, mean_sim =", mean_sim)

# Method 2: Histogram inspection (xem Câu 11)
```

**Fix:**
1. Increase negatives per batch.
2. Reduce learning rate.
3. Increase embedding dimension.
4. Check loss for NaN/Inf.
5. Verify training data (positives/negatives correctly labeled).

```python
# Debugging code
for epoch in range(num_epochs):
    loss = train_step(batch)
    
    # Monitor
    if np.isnan(loss):
        print("Loss NaN at epoch", epoch)
        break
    
    if epoch % 10 == 0:
        # Sample embeddings
        sample_sims = cosine_similarity(sample_embeddings)
        mean_sim = np.mean(sample_sims[np.triu_indices(len(sample_sims), k=1)])
        print(f"Epoch {epoch}: loss={loss:.4f}, mean_sim={mean_sim:.4f}")
```

---

### Câu 22: Calibration curve — Plot & interpret.

**Đáp án mẫu:**

**Calibration curve:** Predicted confidence (x-axis) vs actual accuracy (y-axis).

**Code:**
```python
from sklearn.calibration import calibration_curve

prob_true, prob_pred = calibration_curve(y_test, confidences, n_bins=10)

plt.plot([0, 1], [0, 1], 'k--', label='Perfectly calibrated')
plt.plot(prob_pred, prob_true, 's-', label='Model')
plt.xlabel('Mean predicted confidence')
plt.ylabel('Fraction of positives')
plt.title('Calibration curve')
plt.legend()
plt.show()
```

**Interpretation:**

- **Perfect calibration:** Points on diagonal.
  - Model says 60% → 60% actually correct.

- **Under-confident:** Points above diagonal.
  - Model says 40% → 60% actually correct.
  - → Can be more aggressive.

- **Over-confident:** Points below diagonal.
  - Model says 80% → 60% actually correct.
  - → Should be more conservative.

**Example:**
```
Over-confident model:
        (1, 1) *
              /
             /
            /
(0.5, 0.3) * ← Says 50% confident, but only 30% correct
           / 
          /
(0, 0) *
```

---

### Câu 23: Multi-vector retrieval — Khi nào dùng và cách implement?

**Đáp án mẫu:**

**Multi-vector:** Mỗi chunk có multiple embeddings (e.g., dense + sparse + semantic).

**Khi nào dùng:**

- Hybrid retrieval (keyword + semantic).
- Colbert-style (token-level + aggregate).
- Different modalities (text + image).

**Implementation (Pinecone + hybrid):**
```python
# Step 1: Create 2 indexes
pc.create_index("dense-index", dimension=768, metric="cosine")
pc.create_index("sparse-index", dimension=50000)  # vocab size

# Step 2: Embed query both ways
query_dense = embed_model.encode(query)  # Dense vector
query_sparse = create_sparse_vector(query, vocab)  # Sparse (BM25-like)

# Step 3: Search both
dense_results = pc.Index("dense-index").query(query_dense, top_k=10)
sparse_results = pc.Index("sparse-index").query(query_sparse, top_k=10)

# Step 4: Fuse scores (RRF - Reciprocal Rank Fusion)
def rrf(rank_lists, k=60):
    scores = {}
    for rank_list in rank_lists:
        for rank, (doc_id, score) in enumerate(rank_list, 1):
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)

final_results = rrf([dense_results, sparse_results])
```

---

### Câu 24: Approximate Nearest Neighbor (ANN) — Accuracy vs speed trade-off.

**Đáp án mẫu:**

**Exact (linear scan):**
```
Time: O(n × d) where n = corpus size, d = dimension
Recall: 100%
```

**Approximate (ANN):**
```
Time: O(log n) to O(sqrt(n))
Recall: ~95–99%
```

**Common ANN structures:**

1. **LSH (Locality Sensitive Hashing):**
   - Hash vectors into buckets.
   - Complexity: O(1) query, O(n log n) index.
   - Recall: ~80–90%.

2. **IVF (Inverted File):**
   - Cluster vectors, search relevant clusters.
   - Complexity: O(k × n/k) = O(n) worst-case, O(log n) avg.
   - Recall: ~90–95%.

3. **HNSW (Hierarchical Navigable Small World):**
   - Navigable graph structure.
   - Complexity: O(log n) with good constants.
   - Recall: ~95–99% (Pinecone uses this).

**Trade-off curve:**
```
Recall (%)
  100 |
      | * Exact
   95 | * HNSW
      |   * IVF
   90 |     * LSH
      |
  ────┴──────────────────────── Query Time (ms)
      0    1    10    100
```

**Recommendation:** Pinecone HNSW good for most cases (high recall + fast).

---

### Câu 25: Context window aware similarity — Adjust scores dựa vào surrounding context?

**Đáp án mẫu:**

**Idea:** Không chỉ look at 1 chunk similarity, mà xem nó fit như thế nào với context.

**Methods:**

1. **Redundancy penalty:**
   ```
   adjusted_score = base_score - redundancy_weight × overlap_with_selected
   ```
   Prioritize diverse chunks.

2. **Position boost:**
   ```
   if chunk_index < 3:
       adjusted_score *= 1.1  # Boost earlier chunks (often more important)
   ```

3. **Semantic coherence:**
   ```
   coherence = mean_similarity(chunk, neighboring_chunks)
   adjusted_score = 0.7 × base_score + 0.3 × coherence
   ```

4. **Passage ranking (learned):**
   ```
   Train ranker on (query, chunk_before, chunk, chunk_after)
   score = ranker(query, context_window)
   ```

**Implementation:**
```python
def adjust_with_context(matches, context_window_size=3):
    """Adjust scores considering neighboring chunks."""
    adjusted = []
    
    for i, match in enumerate(matches):
        base_score = match['score']
        
        # Get neighbors
        neighbors = matches[max(0, i-context_window_size):i] + \
                   matches[i+1:min(len(matches), i+context_window_size+1)]
        
        # Compute coherence
        coherence = mean([cosine(match['emb'], n['emb']) for n in neighbors])
        
        adjusted_score = 0.7 * base_score + 0.3 * coherence
        adjusted.append((match, adjusted_score))
    
    return sorted(adjusted, key=lambda x: x[1], reverse=True)
```

---

## Phần IV: TÓNG KẾT VÀ ĐỀ XUẤT

### Bảng tham chiếu nhanh

| Khía cạnh | Khuyến cáo | Ghi chú |
|-----------|-----------|---------|
| **Similarity metric** | Cosine (normalized embeddings) | Default; use dot product nếu model trained with dot loss |
| **Threshold** | 0.25–0.3 (cosine) | Domain-dependent; validate on dev set |
| **Top-k retrieval** | 5–10 | Adjust dựa trên context window |
| **Confidence formula** | mean(similarities) × 1.5 capped at 1 | Simple; consider calibration nếu cần |
| **Reranking** | Cross-encoder on top-100 → top-5 | +5–10% precision, small latency cost |
| **ANN algorithm** | HNSW (Pinecone) | ~95–99% recall, O(log n) query |
| **Calibration** | Isotonic regression or Platt scaling | Post-hoc on validation set |
| **Metrics to track** | Recall@5, Precision@5, MRR, nDCG | Comprehensive evaluation |

### Các câu hỏi ôn tập cuối cùng

1. Cosine similarity và dot product: khi nào dùng cái nào? Giải thích bằng ví dụ.
2. Confidence score khác với similarity score như thế nào?
3. Hãy mô tả quá trình calibrate confidence scores từ validation data.
4. Embedding collapse là gì, symptoms là gì, cách fix ra sao?
5. So sánh MRR và nDCG: khi nào dùng cái nào? Formula tóm tắt.
6. HNSW vs IVF vs LSH: trade-off giữa recall, speed, memory.
7. Reranking cost và benefit? Nên rerank như thế nào?
8. Negative sampling khó — giải thích hard negatives và ưu điểm so với random.
9. Calibration curve over-confident vs under-confident: interpret và fix.
10. Multi-vector retrieval (hybrid): implement và fuse scores như thế nào?

---

**Kết thúc danh sách câu hỏi & đáp án về Similarity & Confidence Score**
