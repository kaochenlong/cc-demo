import ai from "../utils/google_ai.js"

async function rewriteQuery(query) {
  const { text } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `把這個口語問題改寫成一句精確的銀行相關搜尋查詢，請一律使用台灣繁體中文及用語。只輸出一句話，不要列表或解釋：\n\n${query}`,
    config: { temperature: 0 }
  })

  return text.trim()
}

console.log(await rewriteQuery("那個卡要錢嗎"))
console.log(await rewriteQuery("利率"))
