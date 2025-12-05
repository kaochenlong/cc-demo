import path from "path"
import fs from "fs/promises"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"

/**
 * 統一文件處理器
 */
async function loadDocument(source) {
  // URL
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source)
    const html = await response.text()
    const dom = new JSDOM(html, { url: source })
    const article = new Readability(dom.window.document).parse()
    return {
      content: article?.textContent || "",
      metadata: { source, type: "url", title: article?.title }
    }
  }

  const ext = path.extname(source).toLowerCase()

  // PDF
  if (ext === ".pdf") {
    const buffer = await fs.readFile(source)
    const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise
    const texts = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      texts.push(content.items.map((item) => item.str).join(""))
    }
    return {
      content: texts.join("\n"),
      metadata: { source, type: "pdf", pages: pdf.numPages }
    }
  }

  // Text / Markdown
  if ([".txt", ".md", ".html"].includes(ext)) {
    const content = await fs.readFile(source, "utf-8")
    return {
      content,
      metadata: { source, type: ext.slice(1) }
    }
  }

  throw new Error(`不支援的格式: ${ext}`)
}

/**
 * 切分文字
 */
function splitText(text, { chunkSize = 500, overlap = 50 } = {}) {
  const chunks = []
  const sentences = text.split(/(?<=[。！？\n])/)
  let current = ""

  for (const s of sentences) {
    if ((current + s).length <= chunkSize) {
      current += s
    } else {
      if (current) chunks.push(current.trim())
      current = s
    }
  }
  if (current.trim()) chunks.push(current.trim())

  return chunks
}

// 測試：同時處理 PDF 和網頁
const sources = ["./docs/labor-law.pdf", "https://kaochenlong.com/about.html"]

const allChunks = []

for (const source of sources) {
  const doc = await loadDocument(source)
  const chunks = splitText(doc.content, { chunkSize: 300 })

  // 每個 chunk 加上來源 metadata
  for (const chunk of chunks) {
    allChunks.push({ content: chunk, metadata: doc.metadata })
  }

  console.log(`${doc.metadata.type}: ${source} → ${chunks.length} chunks`)
}

console.log(`---\n總共 ${allChunks.length} 個 chunks`)
