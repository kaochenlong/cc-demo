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

console.log(`已索引 ${points.length} 筆 FAQ`)
