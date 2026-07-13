// ============================================================
// linli 数据缓存 — Map + 30s TTL
// ============================================================
(function () {
  'use strict'

  const store = new Map()
  const TTL = 30000

  window.cacheGet = function (key) {
    const entry = store.get(key)
    if (!entry) return null
    if (Date.now() - entry.ts > TTL) { store.delete(key); return null }
    return entry.data
  }

  window.cacheSet = function (key, data) {
    store.set(key, { data, ts: Date.now() })
  }

  window.cacheClear = function () {
    store.clear()
  }
})()
