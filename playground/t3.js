import ai from "../utils/google_ai.js"
import qdrant from "../utils/qdrant.js"

const COLLECTION_NAME = "bank_faq"

async function multiQuerySearch(query) {
  // 1. 展開查詢
  const { text } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `生成 3 個這問題的不同說法，每行一個：\n\n${query}`
  })
  const queries = [query, ...text.split("\n").filter((q) => q.trim())]

  // 2. 搜尋並合併
  const seen = new Map()
  for (const q of queries) {
    const { embeddings } = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: q,
      config: { taskType: "RETRIEVAL_QUERY" }
    })
    const results = await qdrant.search(COLLECTION_NAME, {
      vector: embeddings[0].values,
      limit: 3,
      with_payload: true
    })
    for (const r of results) {
      if (!seen.has(r.id) || seen.get(r.id).score < r.score) seen.set(r.id, r)
    }
  }

  return [...seen.values()]
    .filter((r) => r.score >= 0.7)
    .sort((a, b) => b.score - a.score)
}

// 測試
const results = await multiQuerySearch("袋款利率") // typo
console.log(
  results.map((r) => ({ score: r.score.toFixed(2), q: r.payload.question }))
)
