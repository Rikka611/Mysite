// ============================================================
// linli 图表 — drawBarChart / drawLineChart / drawPieChart
// Canvas 2D，无外部依赖
// ============================================================
(function () {
  'use strict'

  function canvasCtx(canvas, w, h) {
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr; canvas.height = h * dpr
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr)
    return ctx
  }

  window.drawBarChart = function (canvas, data, opts = {}) {
    const { width = 400, height = 260, title = '', barColor = '#38bdf8', labelColor = '#94a3b8' } = opts
    const ctx = canvasCtx(canvas, width, height)
    if (!data.length) return
    const pad = { top: title ? 30 : 10, right: 16, bottom: 28, left: 36 }
    const pw = width - pad.left - pad.right, ph = height - pad.top - pad.bottom
    const max = Math.max(...data.map(d => d.value), 1)
    const barW = Math.min(32, (pw / data.length) - 6)
    const bars = [] // store for hover detection
    // Y axis
    ctx.fillStyle = '#889'; ctx.font = '9px system-ui'; ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const v = Math.round(max * i / 4), y = pad.top + ph - (v / max) * ph
      ctx.fillText(v, pad.left - 4, y + 3)
      if (i > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke() }
    }
    // Title
    if (title) { ctx.fillStyle = '#ccc'; ctx.font = '12px system-ui'; ctx.textAlign = 'left'; ctx.fillText(title, pad.left, 18) }
    // Bars
    data.forEach((d, i) => {
      const x = pad.left + i * (pw / data.length) + (pw / data.length - barW) / 2
      const h = d.value > 0 ? Math.max(2, (d.value / max) * ph) : 0
      const y = height - pad.bottom - h
      const grad = ctx.createLinearGradient(x, y, x, height - pad.bottom)
      grad.addColorStop(0, barColor); grad.addColorStop(1, barColor + '60')
      ctx.fillStyle = grad
      ctx.beginPath(); roundRect(ctx, x, y, barW, h, 3); ctx.fill()
      const step = data.length > 12 ? Math.ceil(data.length / 8) : 1
      if (i % step === 0 || i === data.length - 1) {
        ctx.fillStyle = labelColor; ctx.font = '9px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(d.label, x + barW / 2, height - 4)
      }
      if (d.value > 0 && barW > 20) { ctx.fillStyle = '#ddd'; ctx.font = '8px system-ui'; ctx.fillText(d.value, x + barW / 2, y - 4) }
      bars.push({ x, y, w: barW, h, label: d.label, value: d.value })
    })
    // Hover tooltip
    const tip = document.createElement('div'); tip.style.cssText = 'position:absolute;display:none;background:rgba(0,0,0,0.9);color:#fff;padding:4px 8px;border-radius:6px;font-size:11px;pointer-events:none;white-space:nowrap;z-index:999'
    canvas.parentElement.style.position = 'relative'; canvas.parentElement.appendChild(tip)
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect(); const scaleX = r.width / width, scaleY = r.height / height
      const mx = (e.clientX - r.left) / scaleX, my = (e.clientY - r.top) / scaleY
      const hit = bars.find(b => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h)
      if (hit) { const l = hit.x * scaleX + hit.w * scaleX / 2; const t = hit.y * scaleY;
        tip.style.display = 'block'; tip.style.left = l + 'px'; tip.style.top = (t - 26) + 'px';
        tip.style.transform = 'translateX(-50%)'; tip.textContent = hit.label + '  ' + hit.value + '条' }
      else tip.style.display = 'none'
    })
    canvas.addEventListener('mouseleave', () => tip.style.display = 'none')
  }

  window.drawLineChart = function (canvas, data, opts = {}) {
    const { width = 400, height = 260, title = '', lineColor = '#38bdf8' } = opts
    const ctx = canvasCtx(canvas, width, height)
    if (data.length < 1) return
    const pad = { top: title ? 30 : 10, right: 20, bottom: 24, left: 20 }
    const pw = width - pad.left - pad.right, ph = height - pad.top - pad.bottom
    if (title) { ctx.fillStyle = '#ccc'; ctx.font = '12px system-ui'; ctx.textAlign = 'left'; ctx.fillText(title, pad.left, 18) }
    const max = Math.max(...data.map(d => d.value), 1)
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
    for (let i = 0; i <= 3; i++) { const y = pad.top + (ph / 3) * i; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke() }
    // Line
    const stepX = data.length > 1 ? pw / (data.length - 1) : pw / 2
    ctx.beginPath(); ctx.strokeStyle = lineColor; ctx.lineWidth = 2; ctx.lineJoin = 'round'
    data.forEach((d, i) => {
      const x = pad.left + stepX * i, y = pad.top + ph - (d.value / max) * ph
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    // Fill
    const lastX = pad.left + stepX * (data.length - 1)
    ctx.lineTo(lastX, pad.top + ph); ctx.lineTo(pad.left, pad.top + ph); ctx.closePath()
    ctx.fillStyle = lineColor + '15'; ctx.fill()
    // Dots + labels
    data.forEach((d, i) => {
      const x = pad.left + stepX * i, y = pad.top + ph - (d.value / max) * ph
      ctx.fillStyle = lineColor; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
      if (i % Math.max(1, Math.floor(data.length / 6)) === 0 || i === data.length - 1) {
        ctx.fillStyle = '#889'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'; ctx.fillText(d.label, x, pad.top + ph + 16)
      }
    })
  }

  window.drawPieChart = function (canvas, data, opts = {}) {
    const { size = 220, title = '', colors = ['#38bdf8', '#34d399', '#fbbf24', '#ef4444', '#a78bfa'] } = opts
    const totalH = title ? 280 : 220
    const ctx = canvasCtx(canvas, size + 120, totalH)
    if (title) { ctx.fillStyle = '#ccc'; ctx.font = '12px system-ui'; ctx.textAlign = 'left'; ctx.fillText(title, 10, 18) }
    const cx = 100, cy = title ? 130 : 110, r = 80, ir = 40
    const total = data.reduce((s, d) => s + d.value, 0) || 1
    let angle = -Math.PI / 2
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0a1a'
    data.forEach((d, i) => {
      const slice = (d.value / total) * 2 * Math.PI
      ctx.beginPath(); ctx.fillStyle = colors[i % colors.length]
      ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + slice); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = bg; ctx.lineWidth = 2; ctx.stroke()
      angle += slice
    })
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, ir, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ddd'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText(total, cx, cy + 5)
    // Legend
    data.forEach((d, i) => {
      const lx = 200, ly = (title ? 30 : 20) + i * 22
      ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(lx, ly, 10, 10)
      ctx.fillStyle = '#ccc'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'
      ctx.fillText(d.label + ' ' + d.value + ' (' + Math.round(d.value / total * 100) + '%)', lx + 16, ly + 10)
    })
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y)
  }
})()
