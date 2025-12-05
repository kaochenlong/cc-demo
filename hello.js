import qdrant from "./utils/qdrant.js"
import ai from "./utils/google_ai.js"
import { readFileSync } from "fs"

const COLLECTION_NAME = "bank_faq"

try {
  await qdrant.createCollection(COLLECTION_NAME, {
    vectors: {
      size: 3072,
      distance: "Cosine"
    }
  })
} catch (e) {}

const faqData = JSON.parse(readFileSync("./data/faq.json", "utf-8"))

const texts = faqData.map((faq) => `${faq.question} ${faq.answer}`)

const points = []
for (let i = 0; i < faqData.length; i++) {
  const embeddingResponse = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: texts[i],
    config: {
      taskType: "RETRIEVAL_DOCUMENT"
    }
  })

  points.push({
    id: faqData[i].id,
    vector: embeddingResponse.embeddings[0].values,
    payload: {
      question: faqData[i].question,
      answer: faqData[i].answer,
      category: faqData[i].category
    }
  })
}

await qdrant.upsert(COLLECTION_NAME, { points })

async function searchFAQ(query, options = {}) {
  const { limit = 3, category = null } = options

  // 取得查詢的 embedding
  const queryEmbedding = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: query,
    config: {
      taskType: "RETRIEVAL_QUERY"
    }
  })

  // 搜尋相似內容
  const searchParams = {
    vector: queryEmbedding.embeddings[0].values,
    limit: limit,
    with_payload: true
  }

  // 如果有類別過濾
  if (category) {
    searchParams.filter = {
      must: [{ key: "category", match: { value: category } }]
    }
  }

  const results = await qdrant.search(COLLECTION_NAME, searchParams)

  return results.map((r) => ({
    score: r.score,
    question: r.payload.question,
    answer: r.payload.answer,
    category: r.payload.category
  }))
}

console.log(await searchFAQ("年費"))
