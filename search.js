import ai from "./utils/google_ai.js"
import qdrant from "./utils/qdrant.js"

async function search(collection, query, { limit = 5, minScore = 0.7 } = {}) {
  const { embeddings } = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: query,
    config: { taskType: "RETRIEVAL_QUERY" }
  })

  const results = await qdrant.search(collection, {
    vector: embeddings[0].values,
    limit,
    with_payload: true
  })

  return results.filter((r) => r.score >= minScore)
}

// 測試
const results = await search("bank_faq", "定存利率多少？")
console.log(results)
