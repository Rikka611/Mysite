// ============================================================
// linli 图表 — drawBarChart / drawPieChart
// Canvas 2D，无外部依赖，统一配色，暗色模式适配
// ============================================================
(function () {
  'use strict'

  const PALETTE = ['#38bdf8','#818cf8','#34d399','#fbbf24','#ef4444','#f472b6','#fb923c','#2dd4bf']
  const DARK_TOOLTIP_BG = 'rgba(15,23,42,0.95)'
  const LIGHT_TOOLTIP_BG = 'rgba(255,255,255,0.95)'

  function isDark(){
    var h=document.documentElement
    if(h.classList.contains('light'))return false
    if(h.classList.contains('dark'))return true
    return matchMedia('(prefers-color-scheme:dark)').matches
  }

  function dprCtx(canvas, w, h) {
    var dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr; canvas.height = h * dpr
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
    var ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr)
    return ctx
  }

  // Observe container resize → auto redraw
  var _observers = new WeakMap()
  function observe(canvas, redraw) {
    var parent = canvas.parentElement
    if (!parent) return
    if (_observers.has(parent)) _observers.get(parent).disconnect()
    var ro = new ResizeObserver(function () { redraw() })
    ro.observe(parent)
    _observers.set(parent, ro)
  }

  // ---- Bar Chart ----
  window.drawBarChart = function (canvas, data, opts) {
    opts = opts || {}
    var w = opts.width || 400, h = opts.height || 260
    var title = opts.title || '', barColor = opts.barColor || PALETTE[0]
    var labelColor = opts.labelColor || '#94a3b8', onClick = opts.onClick
    var barMaxW = opts.barMaxWidth || 32

    function draw() {
      var rect = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : null
      var cw = rect ? Math.min(rect.width - 32, w) : w
      var ctx = dprCtx(canvas, cw, h)
      if (!data.length) { ctx.clearRect(0, 0, cw, h); return }
      var pad = { top: title ? 30 : 10, right: 16, bottom: 28, left: 40 }
      var pw = cw - pad.left - pad.right, ph = h - pad.top - pad.bottom
      var max = Math.max.apply(null, data.map(function (d) { return d.value })) || 1
      var barW = Math.min(barMaxW, pw / data.length - 6)
      var bars = []

      // Y axis
      ctx.fillStyle = '#889'; ctx.font = '9px system-ui'; ctx.textAlign = 'right'
      for (var i = 0; i <= 4; i++) {
        var v = Math.round(max * i / 4), y = pad.top + ph - (v / max) * ph
        ctx.fillText(v, pad.left - 4, y + 3)
        if (i > 0) { ctx.strokeStyle = 'rgba(128,128,128,0.1)'; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(cw - pad.right, y); ctx.stroke() }
      }
      if (title) { ctx.fillStyle = '#ccc'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left'; ctx.fillText(title, pad.left, 18) }

      data.forEach(function (d, i) {
        var x = pad.left + i * (pw / data.length) + (pw / data.length - barW) / 2
        var bh = d.value > 0 ? Math.max(2, d.value / max * ph) : 0
        var by = h - pad.bottom - bh
        var color = d.color || barColor
        var grad = ctx.createLinearGradient(x, by, x, h - pad.bottom)
        grad.addColorStop(0, color); grad.addColorStop(1, color + '60')
        ctx.fillStyle = grad
        ctx.beginPath(); roundRect(ctx, x, by, barW, bh, 3); ctx.fill()
        var step = data.length > 12 ? Math.ceil(data.length / 8) : 1
        if (i % step === 0 || i === data.length - 1) {
          ctx.fillStyle = labelColor; ctx.font = '9px system-ui'; ctx.textAlign = 'center'
          ctx.fillText(d.label, x + barW / 2, h - 4)
        }
        if (d.value > 0 && barW > 12) { ctx.fillStyle = '#ddd'; ctx.font = '8px system-ui'; ctx.textAlign = 'center'; ctx.fillText(d.value, x + barW / 2, by - 3) }
        bars.push({ x: x, y: by, w: barW, h: bh, label: d.label, value: d.value, _raw: d })
      })

      // Tooltip
      setupTooltip(canvas, bars, cw, w, h, onClick)
    }

    draw()
    observe(canvas, draw)
  }

  // ---- Pie Chart ----
  window.drawPieChart = function (canvas, data, opts) {
    opts = opts || {}
    var size = opts.size || 220, title = opts.title || ''
    var colors = opts.colors || PALETTE
    var onClick = opts.onClick
    var totalH = title ? 280 : 240
    var legendW = 120

    function draw() {
      var ctx = dprCtx(canvas, size + legendW, totalH)
      var cx = 90, cy = title ? 130 : 110, r = 80, ir = 36
      var total = data.reduce(function (s, d) { return s + d.value }, 0) || 1
      var slices = []
      var bg = isDark() ? '#0a0a1a' : '#f8fafc'

      if (title) { ctx.fillStyle = '#ccc'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left'; ctx.fillText(title, 10, 18) }

      var angle = -Math.PI / 2
      data.forEach(function (d, i) {
        var slice = d.value / total * 2 * Math.PI
        if (slice <= 0) return
        ctx.beginPath(); ctx.fillStyle = d.color || colors[i % colors.length]
        ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + slice); ctx.closePath(); ctx.fill()
        ctx.strokeStyle = bg; ctx.lineWidth = 2; ctx.stroke()
        slices.push({ startAngle: angle, endAngle: angle + slice, cx: cx, cy: cy, r: r, label: d.label, value: d.value, _raw: d })
        angle += slice
      })

      // Center hole
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, ir, 0, Math.PI * 2); ctx.fill()
      // Center big number
      ctx.fillStyle = isDark() ? '#e2e8f0' : '#1e293b'
      ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(total, cx, cy - 4)
      // Subtitle
      ctx.fillStyle = '#889'; ctx.font = '9px system-ui'
      ctx.fillText('总计', cx, cy + 14)

      // Legend
      data.forEach(function (d, i) {
        var lx = 190, ly = (title ? 30 : 22) + i * 20
        ctx.fillStyle = d.color || colors[i % colors.length]
        ctx.fillRect(lx, ly, 8, 8)
        ctx.fillStyle = isDark() ? '#ccc' : '#555'
        ctx.font = '10px system-ui'; ctx.textAlign = 'left'
        var pct = Math.round(d.value / total * 100)
        ctx.fillText(d.label + '  ' + d.value + ' (' + pct + '%)', lx + 14, ly + 8)
      })

      // Click handler
      if (onClick) {
        canvas.onclick = function (e) {
          var rect = canvas.getBoundingClientRect()
          var mx = e.clientX - rect.left, my = e.clientY - rect.top
          // Scale coords based on canvas CSS size vs drawing size
          var scaleX = (size + legendW) / rect.width
          var scaleY = totalH / rect.height
          mx *= scaleX; my *= scaleY
          for (var i = 0; i < slices.length; i++) {
            var s = slices[i]
            var dx = mx - s.cx, dy = my - s.cy
            var dist = Math.sqrt(dx * dx + dy * dy)
            if (dist <= s.r && dist >= ir) {
              var a = Math.atan2(dy, dx)
              // Normalize angles
              var na = a < -Math.PI/2 ? a + 2*Math.PI : a
              var ns = s.startAngle < -Math.PI/2 ? s.startAngle + 2*Math.PI : s.startAngle
              var ne = s.endAngle < -Math.PI/2 ? s.endAngle + 2*Math.PI : s.endAngle
              if (na >= ns && na <= ne) { onClick(s._raw); return }
            }
          }
        }
        canvas.style.cursor = 'pointer'
      }
    }

    draw()
    observe(canvas, draw)
  }

  function setupTooltip(canvas, bars, cw, origW, origH, onClick) {
    // Remove old tooltip
    var existing = canvas.parentElement.querySelector('.chart-tooltip')
    if (existing) existing.remove()

    var tip = document.createElement('div')
    tip.className = 'chart-tooltip'
    var dark = isDark()
    tip.style.cssText = 'position:absolute;display:none;background:' + (dark ? DARK_TOOLTIP_BG : LIGHT_TOOLTIP_BG) +
      ';color:' + (dark ? '#e2e8f0' : '#1e293b') +
      ';padding:6px 10px;border-radius:8px;font-size:11px;pointer-events:none;white-space:nowrap;z-index:999;' +
      'box-shadow:0 2px 12px rgba(0,0,0,0.2);border:1px solid ' + (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')
    canvas.parentElement.style.position = 'relative'
    canvas.parentElement.appendChild(tip)

    canvas.onmousemove = function (e) {
      var rect = canvas.getBoundingClientRect()
      var scaleX = rect.width / cw, scaleY = rect.height / origH
      var mx = (e.clientX - rect.left) / scaleX, my = (e.clientY - rect.top) / scaleY
      var hit = null
      for (var i = 0; i < bars.length; i++) {
        var b = bars[i]
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) { hit = b; break }
      }
      if (hit) {
        tip.style.display = 'block'
        tip.style.left = (hit.x * scaleX + hit.w * scaleX / 2) + 'px'
        tip.style.top = (hit.y * scaleY - 28) + 'px'
        tip.style.transform = 'translateX(-50%)'
        tip.textContent = hit.label + '  ' + hit.value + '条'
        canvas.style.cursor = onClick ? 'pointer' : 'default'
      } else { tip.style.display = 'none'; canvas.style.cursor = 'default' }
    }
    canvas.onmouseleave = function () { tip.style.display = 'none' }
    if (onClick) {
      canvas.onclick = function (e) {
        var rect = canvas.getBoundingClientRect()
        var scaleX = rect.width / cw, scaleY = rect.height / origH
        var mx = (e.clientX - rect.left) / scaleX, my = (e.clientY - rect.top) / scaleY
        for (var i = 0; i < bars.length; i++) {
          var b = bars[i]
          if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) { onClick(b._raw); return }
        }
      }
    }
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
