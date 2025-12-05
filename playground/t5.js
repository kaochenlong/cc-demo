import ai from "../utils/google_ai.js"

async function rerank(question, docs) {
  if (!docs.length) return []

  const list = docs.map((d, i) => `[${i + 1}] ${d.payload.question}`).join("\n")

  const { text } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `針對問題「${question}」，為以下內容評分（0-10），格式：1:分數\n\n${list}`,
    config: { temperature: 0 }
  })

  // 解析分數
  const scores = Object.fromEntries(
    text.match(/(\d+)\s*:\s*(\d+)/g)?.map((m) => {
      const [i, s] = m.split(/\s*:\s*/)
      return [i - 1, +s]
    }) || []
  )

  return docs
    .map((doc, i) => ({ ...doc, rerankScore: scores[i] || 0 }))
    .sort((a, b) => b.rerankScore - a.rerankScore)
}

// 測試用假資料
const mockDocs = [
  { payload: { question: "如何申請信用卡？" } },
  { payload: { question: "信用卡年費是多少？" } },
  { payload: { question: "定期存款利率是多少？" } }
]

const results = await rerank("卡片要錢嗎", mockDocs)
console.log(
  results.map((r) => ({ score: r.rerankScore, q: r.payload.question }))
)
