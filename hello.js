import qdrant from "./utils/qdrant.js"
import ai from "./utils/google_ai.js"
import { readFileSync } from "fs"
import inquirer from "inquirer"

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

// ---------------

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

async function chatWithFAQ(userMessage) {
  // 搜尋相關 FAQ
  const relevantFAQs = await searchFAQ(userMessage, { limit: 3 })

  // 只取高相關度的結果
  const goodResults = relevantFAQs.filter((r) => r.score > 0.7)

  if (goodResults.length === 0) {
    return "抱歉，我找不到相關的資訊。請問您可以換個方式描述問題嗎？"
  }

  // 建立 prompt
  const context = goodResults
    .map((r) => `Q: ${r.question}\nA: ${r.answer}`)
    .join("\n\n")

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userMessage,
    config: {
      systemInstruction: `你是一位專業的銀行櫃員。根據以下 FAQ 資料回答客戶問題。
如果 FAQ 中沒有相關資訊，請誠實說不知道。

FAQ 資料：
${context}`
    }
  })

  return response.text
}

console.log("銀行客服助理已啟動\n")

while (true) {
  const { userInput } = await inquirer.prompt([
    {
      type: "input",
      name: "userInput",
      message: "您:"
    }
  ])

  if (userInput.toLowerCase() === "exit") {
    console.log("感謝您的使用，再見！")
    break
  }

  const answer = await chatWithFAQ(userInput)
  console.log(`助理: ${answer}\n`)
}
