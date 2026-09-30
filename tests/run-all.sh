#!/usr/bin/env bash
# 一键回归。用法:bash run-all.sh [无头局数,默认200]
set -u
cd "$(dirname "$0")"
N="${1:-200}"
PASS=0; FAIL=0
if [ ! -d node_modules ]; then
  echo "首次运行,装一下测试依赖(游戏本体不需要任何依赖)…"
  npm install --no-audit --no-fund --silent || echo "  装不上也没关系,05-ui 会自动跳过"
fi
echo "语法自检"
node -e '
const fs=require("fs");
const h=fs.readFileSync("../index.html","utf8");
const m=h.match(/<script>([\s\S]*)<\/script>/);
new Function(m[1]);
console.log("  ✓ index.html 语法通过");
let b=""; try{ b=fs.readFileSync("../银行升职记.html","utf8"); }catch(e){}
console.log(h===b ? "  ✓ 银行升职记.html 与 index.html 一致" : "  ✗ 银行升职记.html 与 index.html 不一致,记得 cp index.html 银行升职记.html");
process.exit(h===b?0:1);
' || FAIL=$((FAIL+1))
echo
for f in "01-headless.js $N" 02-promo.js 03-economy.js 04-l34.js 05-ui.js 06-l5.js 07-ui-l5.js "08-balance.js 300" 09-odds.js; do
  echo "── $f ────────────────────────────────"
  out="$(node $f 2>&1)"; code=$?; echo "$out"
  if [ $code -ne 0 ] || echo "$out" | grep -q "❌"; then FAIL=$((FAIL+1)); else PASS=$((PASS+1)); fi
  echo
done
echo "════════════════════════════════════════"
echo "通过 $PASS 组 · 失败 $FAIL 组"
[ "$FAIL" -eq 0 ] && echo "全绿。" || echo "有红,上面翻一下。"
exit "$FAIL"
