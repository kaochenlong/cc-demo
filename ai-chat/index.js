import inquirer from "inquirer"
import { chat } from "./engine.js"

const sessionId = `user_${Date.now()}`

console.log("銀行智能客服 (輸入 exit 離開)\n")

while (true) {
  const { message } = await inquirer.prompt([
    { type: "input", name: "message", message: "→ " }
  ])

  if (message === "exit") break
  if (!message.trim()) continue

  const { response, intent } = await chat(sessionId, message)
  console.log(`[${intent}] ${response}\n`)
}
