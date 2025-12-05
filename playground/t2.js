import ai from "../utils/google_ai.js"

async function expandQuery(query) {
  const { text } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `根據這個問題，生成 3 個不同角度的搜尋查詢，每行一個，不要編號：\n\n${query}`,
    config: { temperature: 0.5 }
  })

  return text.split("\n").filter((q) => q.trim())
}

// 測試
console.log(await expandQuery("信用卡年費"))
