// ============================================================
// linli 分页控件
// ============================================================
(function () {
  'use strict'

  window.createPaginator = function (container, totalItems, pageSize, onChange) {
    const totalPages = Math.ceil(totalItems / pageSize)
    if (totalPages <= 1) { container.innerHTML = ''; return }

    let current = 1
    function render() {
      let html = '<div class="paginator" style="display:flex;gap:4px;align-items:center;justify-content:center;padding:12px 0">'
      html += `<button ${current===1?'disabled':''} data-p="1">«</button>`
      html += `<button ${current===1?'disabled':''} data-p="${current-1}">‹</button>`
      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || (p >= current - 1 && p <= current + 1)) {
          html += `<button class="${p===current?'active':''}" data-p="${p}" style="${p===current?'background:var(--brand);color:#fff':''}">${p}</button>`
        } else if (p === current - 2 || p === current + 2) {
          html += '<span>…</span>'
        }
      }
      html += `<button ${current===totalPages?'disabled':''} data-p="${current+1}">›</button>`
      html += `<button ${current===totalPages?'disabled':''} data-p="${totalPages}">»</button>`
      html += `<span style="margin-left:8px;font-size:0.8rem;color:var(--text-secondary)">${current}/${totalPages}</span></div>`
      container.innerHTML = html
      container.querySelectorAll('button[data-p]').forEach(btn => {
        btn.onclick = () => { current = parseInt(btn.dataset.p); render(); onChange(current) }
      })
    }
    render()
  }
})()
