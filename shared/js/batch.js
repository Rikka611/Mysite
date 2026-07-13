// ============================================================
// linli 批量操作进度
// ============================================================
(function () {
  'use strict'

  window.createBatchProgress = function (container) {
    const bar = document.createElement('div')
    bar.style.cssText = 'height:4px;background:var(--brand);border-radius:2px;transition:width 0.3s;width:0%'
    const label = document.createElement('span')
    label.style.cssText = 'font-size:0.75rem;color:var(--text-secondary);margin-top:4px;display:block'
    container.appendChild(bar)
    container.appendChild(label)

    return {
      set: function (current, total) {
        const pct = Math.round((current / total) * 100)
        bar.style.width = pct + '%'
        label.textContent = `${current}/${total} (${pct}%)`
      },
      done: function () {
        bar.style.width = '100%'
        bar.style.background = '#22c55e'
        label.textContent = '完成 ✅'
      },
      error: function () {
        bar.style.background = '#ef4444'
        label.textContent = '操作失败'
      },
    }
  }
})()
