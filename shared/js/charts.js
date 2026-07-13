// ============================================================
// linli 图表抽象 — drawBarChart / drawLineChart / drawPieChart
// 基于 Canvas 2D，无外部依赖
// ============================================================
(function () {
  'use strict'

  function canvasCtx(canvas, w, h) {
    canvas.width = w; canvas.height = h
    return canvas.getContext('2d')
  }

  window.drawBarChart = function (canvas, data, opts = {}) {
    const { width = 400, height = 200, barColor = '#6366f1', labelColor = '#94a3b8' } = opts
    const ctx = canvasCtx(canvas, width, height)
    const max = Math.max(...data.map(d => d.value), 1)
    const barW = (width - 40) / data.length - 8
    data.forEach((d, i) => {
      const x = 20 + i * ((width - 40) / data.length) + 4
      const h = (d.value / max) * (height - 40)
      ctx.fillStyle = barColor; ctx.fillRect(x, height - 20 - h, barW, h)
      ctx.fillStyle = labelColor; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(d.label, x + barW / 2, height - 4)
    })
  }

  window.drawLineChart = function (canvas, data, opts = {}) {
    const { width = 400, height = 200, lineColor = '#6366f1' } = opts
    const ctx = canvasCtx(canvas, width, height)
    const max = Math.max(...data.map(d => d.value), 1)
    ctx.beginPath(); ctx.strokeStyle = lineColor; ctx.lineWidth = 2
    data.forEach((d, i) => {
      const x = 20 + (i / (data.length - 1)) * (width - 40)
      const y = height - 20 - (d.value / max) * (height - 40)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  window.drawPieChart = function (canvas, data, opts = {}) {
    const { size = 200, colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'] } = opts
    const ctx = canvasCtx(canvas, size, size)
    const total = data.reduce((s, d) => s + d.value, 0) || 1
    let angle = -Math.PI / 2
    data.forEach((d, i) => {
      const slice = (d.value / total) * 2 * Math.PI
      ctx.beginPath(); ctx.fillStyle = colors[i % colors.length]
      ctx.moveTo(size / 2, size / 2)
      ctx.arc(size / 2, size / 2, size / 2 - 10, angle, angle + slice)
      ctx.fill(); angle += slice
    })
  }
})()
