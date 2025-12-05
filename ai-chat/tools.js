import { Type } from "@google/genai"

// Function Calling 工具定義
const tools = [
  {
    functionDeclarations: [
      {
        name: "get_account_balance",
        description: "查詢客戶帳戶餘額",
        parameters: {
          type: Type.OBJECT,
          properties: {
            account_type: {
              type: Type.STRING,
              enum: ["savings", "checking", "credit_card"],
              description: "帳戶類型"
            }
          },
          required: ["account_type"]
        }
      },
      {
        name: "get_transactions",
        description: "查詢最近交易紀錄",
        parameters: {
          type: Type.OBJECT,
          properties: {
            account_type: { type: Type.STRING },
            days: { type: Type.INTEGER }
          },
          required: ["account_type"]
        }
      },
      {
        name: "search_faq",
        description: "搜尋 FAQ 知識庫",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING }
          },
          required: ["query"]
        }
      }
    ]
  }
]

// 模擬執行函式
function executeFunction(name, args) {
  const mockData = {
    accounts: {
      savings: { balance: 150000, currency: "TWD" },
      checking: { balance: 50000, currency: "TWD" },
      credit_card: { balance: -12500, limit: 100000, currency: "TWD" }
    },
    transactions: [
      { date: "2024-01-15", description: "薪資轉入", amount: 85000 },
      { date: "2024-01-14", description: "超商消費", amount: -150 },
      { date: "2024-01-13", description: "網購", amount: -2500 },
      { date: "2024-01-12", description: "餐廳消費", amount: -800 }
    ]
  }

  switch (name) {
    case "get_account_balance":
      return mockData.accounts[args.account_type] || { error: "找不到該帳戶" }
    case "get_transactions":
      return mockData.transactions.slice(0, args.days || 7)
    default:
      return { error: "未知的功能" }
  }
}

export { tools, executeFunction }
