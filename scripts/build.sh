#!/bin/bash
# linli 构建校验 — 检查所有 HTML/JS/SQL 文件完整性
set -e
echo "=== linli build check ==="

# 1. Check required shared files exist
for f in shared/js/config.template.js shared/js/api.js shared/js/sanitize.js shared/css/theme.css; do
  [ -f "$f" ] || { echo "MISSING: $f"; exit 1; }
done
echo "[OK] shared files"

# 2. Check main pages parseable HTML
for f in linli/index.html linli-admin/index.html; do
  grep -q '</html>' "$f" || { echo "INVALID HTML: $f"; exit 1; }
done
echo "[OK] HTML pages"

# 3. SQL — check config.js not committed
if [ -f shared/js/config.js ]; then
  echo "[WARN] shared/js/config.js exists (should be in .gitignore)"
fi

echo "=== build OK ==="
