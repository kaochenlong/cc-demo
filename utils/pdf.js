import fs from "fs/promises"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

/**
 * 處理 PDF 文件
 *
 * @param {string} filepath - PDF 檔案路徑
 * @returns {Object} 處理後的文件物件
 */
async function processPDF(filepath) {
  const buffer = await fs.readFile(filepath)
  const uint8Array = new Uint8Array(buffer)
  const pdf = await getDocument({ data: uint8Array }).promise

  // 取得所有頁面的文字
  const texts = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const text = textContent.items.map((item) => item.str).join("")
    texts.push(text)
  }

  return {
    content: texts.join("\n"),
    metadata: {
      source: filepath,
      source_type: "pdf",
      page_count: pdf.numPages
    }
  }
}

/**
 * 分頁處理 PDF（保留頁碼資訊）
 */
async function processPDFByPage(filepath) {
  const buffer = await fs.readFile(filepath)
  const uint8Array = new Uint8Array(buffer)
  const pdf = await getDocument({ data: uint8Array }).promise

  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const text = textContent.items.map((item) => item.str).join("")

    pages.push({
      content: text,
      metadata: {
        source: filepath,
        source_type: "pdf",
        page: i
      }
    })
  }

  return pages
}

export { processPDF, processPDFByPage }

// 測試
// const result = await processPDF("./docs/labor-law.pdf")
// console.log("總頁數:", result.metadata.page_count)
// console.log("內容預覽（前 300 字）:")
// console.log(result.content.slice(0, 300))
