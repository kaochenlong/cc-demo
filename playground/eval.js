import ai from "../utils/google_ai.js"
import qdrant from "../utils/qdrant.js"

const COLLECTION_NAME = "bank_faq"

// 搜尋
async function search(question) {
  const { embeddings } = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: question,
    config: { taskType: "RETRIEVAL_QUERY" }
  })
  return qdrant.search(COLLECTION_NAME, {
    vector: embeddings[0].values,
    limit: 3,
    with_payload: true
  })
}

// 生成答案
async function answer(question, docs) {
  const context = docs
    .map((d) => `Q: ${d.payload.question}\nA: ${d.payload.answer}`)
    .join("\n\n")
  const { text } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `根據 FAQ 回答：\n\n${context}\n\n問題：${question}`
  })
  return text
}

// 評估：答案是否忠於來源
async function evalFaithfulness(answer, docs) {
  const context = docs.map((d) => d.payload.answer).join("\n")
  const { text } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `來源：${context}\n\n答案：${answer}\n\n答案是否忠於來源？評分 0-10，只輸出數字：`,
    config: { temperature: 0 }
  })
  return (parseInt(text) || 0) / 10
}

// 評估整個流程
async function evaluate(testCases) {
  const results = []

  for (const { question, expectedId } of testCases) {
    const docs = await search(question)
    const ans = await answer(question, docs)
    const faithfulness = await evalFaithfulness(ans, docs)

    const foundAt = docs.findIndex((d) => d.id === expectedId)
    const mrr = foundAt >= 0 ? 1 / (foundAt + 1) : 0

    results.push({ question, mrr, faithfulness, answer: ans.slice(0, 50) })
  }

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length
  console.log("平均 MRR:", avg(results.map((r) => r.mrr)).toFixed(2))
  console.log("平均忠實度:", avg(results.map((r) => r.faithfulness)).toFixed(2))

  return results
}

// 測試
const testCases = [
  { question: "信用卡年費多少？", expectedId: 1 },
  { question: "怎麼辦卡？", expectedId: 2 },
  { question: "定存利率？", expectedId: 3 }
]

console.log(await evaluate(testCases))
