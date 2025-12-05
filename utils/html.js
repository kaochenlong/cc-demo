import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"

/**
 * 處理 HTML 內容
 */
function processHTML(html, url) {
  const dom = new JSDOM(html, { url })
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  return {
    content: article?.textContent || "",
    metadata: {
      source: url,
      source_type: "html",
      title: article?.title,
      excerpt: article?.excerpt,
      byline: article?.byline,
      extracted_at: new Date().toISOString()
    }
  }
}

/**
 * 爬取並處理網頁
 */
async function fetchAndProcess(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const html = await response.text()
  return processHTML(html, url)
}

export { fetchAndProcess, processHTML }

// 測試
// const result = await fetchAndProcess("https://kaochenlong.com/about.html")
// console.log("標題:", result.metadata.title)
// console.log("作者:", result.metadata.byline)
// console.log("摘要:", result.metadata.excerpt)
// console.log("---")
// console.log("內容預覽（前 300 字）:")
// console.log(result.content.slice(0, 300))
