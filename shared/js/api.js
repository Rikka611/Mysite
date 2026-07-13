// ============================================================
// linli 统一 API 层
// 读取 window.__LINLI_CONFIG__ 获取 Supabase 配置
// 用法: <script src="../shared/js/config.js"></script>
//       <script src="../shared/js/api.js"></script>
// ============================================================
(function () {
  'use strict'

  const cfg = window.__LINLI_CONFIG__ || {}
  const SB_URL = cfg.SB_URL || ''
  const SB_KEY = cfg.SB_KEY || ''

  window.sbApi = async function (path, options = {}) {
    const url = `${SB_URL}/rest/v1/${path}`
    const headers = {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
      ...(options.headers || {}),
    }
    const res = await fetch(url, { headers, ...options })
    if (!res.ok) throw new Error(await res.text())
    const t = await res.text()
    return t ? JSON.parse(t) : []
  }
})()
