## 1. Just Vector Search

**Flow**  
1. **Query the Vector DB** with an embedding of the user query.  
2. **Retrieve Document IDs and/or minimal metadata** from the Vector DB’s result.  
   - If the Vector DB stores more extensive metadata (title, authors, snippet), can immediately present it.  
   - Otherwise, fetch full document data from the traditional DB (SQL/Elasticsearch/etc.) using those IDs.  
3. **Display** results to the user.

**Why It Makes Sense**  
- For purely semantic/embedding-based use cases, only need the vector DB to find the nearest neighbors.  
- Can keep the “source of truth” documents in a separate store (traditional DB) or replicate minimal metadata in the vector DB to reduce round trips.

---

## 2. Just Text Search

**Flow**  
1. **Query the Traditional DB** (Elasticsearch, SQL, etc.) using standard full-text or fielded queries (e.g., title, abstract).  
2. **Retrieve** document records directly from the DB.  
3. **Display** results to the user.

**Why It Makes Sense**  
- Classic scenario for exact text matches, boolean logic, and field-based filters (e.g., author, year).  
- No embeddings needed if the user only wants keyword-based or boolean queries.

---

## 3. Combination (Hybrid)

First narrow down a subset using text search, then rank or refine using the vector DB. For example:

1. **Text Filtering/Initial Retrieval**  
   - Query the traditional DB (Elasticsearch/SQL) to get a subset of docs matching exact or keyword criteria (e.g., “must have ‘superconductivity’ in title,” “must have abstract containing ‘quantum,’” etc.).  
   - This step might yield, say, 2,000 candidate documents out of millions.

2. **Vector Ranking**  
   - Take those document IDs and query the Vector DB for only that subset (i.e., filter the vector search to those IDs, or pass that list of IDs so the vector DB only searches among them).  
   - Retrieve a *ranked* list of the top matches from the vector DB.  

3. **Display**  
   - Final results are those documents that *passed the text filter* and are now *best ranked* by semantic relevance.

**Why It Makes Sense**  
- Text filters can drastically reduce the search space before applying a more expensive ANN (Approximate Nearest Neighbor) search. This two-phase approach is often more efficient at large scale.  
- Combines the *precision* of keyword/boolean filtering (for must-have fields) with the *recall and semantic understanding* of embeddings (for deeper relevance).

---

## Additional Notes

- **Alternate Hybrid Flow**: Could do the *vector search first* to get top-k documents, then filter them via a text/metadata query.
  1. If text filters are very restrictive, it can make sense to filter in the text DB first (our scenario).  
  2. If semantic query is the main driver, it might make sense to do the vector query first and then apply text-based filters (not applicable).

- **Metadata in the Vector DB**: Some vector databases (Qdrant, Weaviate, etc.) support storing metadata and performing basic filters (e.g., “author = X,” “year >= 2020”). This can eliminate or reduce the need for a secondary DB for certain queries. But for more advanced text-based queries (boolean logic, phrase queries, etc.), a traditional search engine or relational DB is still common.  