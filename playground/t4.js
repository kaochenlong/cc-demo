import ai from "../utils/google_ai.js"
import qdrant from "../utils/qdrant.js"

const COLLECTION_NAME = "bank_faq"

async function hydeSearch(question) {
  // 1. 生成假想答案
  const { text: hydeText } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `假設你是銀行知識庫，針對這個問題寫一段簡短回答：\n\n${question}`
  })

  // 2. 用假想答案搜尋
  const { embeddings } = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: hydeText,
    config: { taskType: "RETRIEVAL_QUERY" }
  })

  const results = await qdrant.search(COLLECTION_NAME, {
    vector: embeddings[0].values,
    limit: 3,
    with_payload: true
  })

  return results.filter((r) => r.score >= 0.7)
}

// 測試
const results = await hydeSearch("卡片要錢嗎")
console.log(
  results.map((r) => ({ score: r.score.toFixed(2), q: r.payload.question }))
)
