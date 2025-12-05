/**
 * 標準化 metadata
 */
function normalizeMetadata(raw = {}) {
  return {
    id: raw.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source: raw.source || "unknown",
    type: raw.type || "unknown",
    title: raw.title || raw.source?.split("/").pop() || "Untitled",
    chunk_index: raw.chunk_index ?? 0,
    total_chunks: raw.total_chunks ?? 1,
    indexed_at: new Date().toISOString()
  }
}

export { normalizeMetadata }
