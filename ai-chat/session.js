// 檔名：session.js
/**
 * Session 管理器
 * 用於多使用者聊天 API，追蹤每個使用者的對話歷史
 */
class SessionManager {
  constructor(maxAge = 30 * 60 * 1000) {
    this.sessions = new Map() // sessionId -> { history, lastActive }
    this.maxAge = maxAge // 預設 30 分鐘過期
  }

  // 取得 session，不存在則建立
  get(id) {
    if (!this.sessions.has(id)) {
      this.sessions.set(id, { history: [], lastActive: Date.now() })
    }
    const s = this.sessions.get(id)
    s.lastActive = Date.now()
    return s
  }

  // 新增對話記錄，超過 50 則保留最新 40 則
  add(id, role, content) {
    const s = this.get(id)
    s.history.push({ role, content })
    if (s.history.length > 50) s.history = s.history.slice(-40)
  }

  // 清除指定 session
  clear(id) {
    this.sessions.delete(id)
  }

  // 清除所有過期 session（定期呼叫）
  cleanup() {
    const now = Date.now()
    for (const [id, s] of this.sessions) {
      if (now - s.lastActive > this.maxAge) this.sessions.delete(id)
    }
  }
}

export { SessionManager }

// 測試
// const sm = new SessionManager()
// sm.add("user1", "user", "你好")
// sm.add("user1", "assistant", "您好！有什麼可以幫您？")
// sm.add("user2", "user", "信用卡年費？")

// console.log("user1:", sm.get("user1").history)
// console.log("user2:", sm.get("user2").history)
