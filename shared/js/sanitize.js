// ============================================================
// linli XSS 防护 — escapeHtml
// 所有用户输入在插入 DOM 前必须转义
// ============================================================
(function () {
  'use strict'

  const ENTITY_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  }

  window.escapeHtml = function (str) {
    if (!str && str !== 0) return ''
    return String(str).replace(/[&<>"'/]/g, function (c) {
      return ENTITY_MAP[c]
    })
  }
})()
