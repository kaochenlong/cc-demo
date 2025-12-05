import { SessionManager } from "./session.js"
import { tools, executeFunction } from "./tools.js"
import ai from "../utils/google_ai.js"
import qdrant from "../utils/qdrant.js"

const COLLECTION_NAME = "bank_faq"

const INTENTS = [
  "ACCOUNT_QUERY",
  "FAQ_SEARCH",
  "GENERAL_CHAT",
  "TRANSFER_TO_HUMAN"
]

const SYSTEM_PROMPT = `你是銀行 AI 客服助理小樹。使用台灣繁體中文，語氣親切專業，回答簡潔明瞭。`

// 意圖分類
async function classifyIntent(message) {
  const { text } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `分類意圖，只回答代碼：${INTENTS.join("/")}\n\n${message}`,
    config: { temperature: 0 }
  })
  return INTENTS.find((i) => text.includes(i)) || "GENERAL_CHAT"
}

// 帳戶查詢（用 Function Calling）
async function handleAccount(message, history) {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: { systemInstruction: SYSTEM_PROMPT, tools },
    history: history
      .slice(-10)
      .map((h) => ({ role: h.role, parts: [{ text: h.content }] }))
  })

  const res = await chat.sendMessage({ message })

  if (res.functionCalls?.length) {
    const results = res.functionCalls.map((fc) => ({
      functionResponse: {
        name: fc.name,
        response: executeFunction(fc.name, fc.args)
      }
    }))
    return (await chat.sendMessage({ message: results })).text
  }

  return res.text
}

// FAQ 搜尋（用 RAG）
async function handleFAQ(message) {
  const { embeddings } = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: message,
    config: { taskType: "RETRIEVAL_QUERY" }
  })

  const results = await qdrant.search(COLLECTION_NAME, {
    vector: embeddings[0].values,
    limit: 3,
    with_payload: true
  })

  const docs = results.filter((r) => r.score > 0.6)
  if (!docs.length) return "抱歉，我找不到相關資訊。"

  const context = docs
    .map((d) => `Q: ${d.payload.question}\nA: ${d.payload.answer}`)
    .join("\n\n")
  const { text } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `根據 FAQ 回答：\n\n${context}\n\n問題：${message}`
  })

  return text
}

// 一般對話
async function handleChat(message) {
  const { text } = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: message,
    config: { systemInstruction: SYSTEM_PROMPT }
  })
  return text
}

// 主函式
const sessions = new SessionManager()

async function chat(sessionId, message) {
  sessions.add(sessionId, "user", message)
  const intent = await classifyIntent(message)
  const history = sessions.get(sessionId).history

  const handlers = {
    TRANSFER_TO_HUMAN: () =>
      "好的，我為您轉接人工客服。\n客服專線：0800-666-888",
    ACCOUNT_QUERY: () => handleAccount(message, history),
    FAQ_SEARCH: () => handleFAQ(message),
    GENERAL_CHAT: () => handleChat(message)
  }

  const response = await handlers[intent]()
  sessions.add(sessionId, "model", response)

  return { response, intent }
}

export { chat, classifyIntent }

// 測試
// console.log(await classifyIntent("我想查餘額"))
// console.log(await classifyIntent("年費多少"))
// console.log(await classifyIntent("你好"))
// console.log(await classifyIntent("我要找真人"))
// console.log(await classifyIntent("教練，我想打球"))
