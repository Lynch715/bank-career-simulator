// 公共加载器:把 index.html 里的 <script> 抠出来,在 Node 里当普通脚本跑
const fs = require("fs"), path = require("path");
const GAME = path.join(__dirname, "..", "index.html");

function readCode(file){
  const html = fs.readFileSync(file || GAME, "utf8");
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if(!m) throw new Error("没找到 <script> 块:" + (file||GAME));
  return m[1].replace('"use strict";', "");
}
function fakeStorage(){
  const store = {};
  return {store, api:{getItem:k=>k in store?store[k]:null, setItem:(k,v)=>{store[k]=String(v)}, removeItem:k=>{delete store[k]}}};
}
// 在当前进程里加载一份游戏,返回 THSZ API
function load(opts){
  opts = opts || {};
  const st = fakeStorage();
  global.localStorage = st.api;
  let code = readCode(opts.file);
  if(opts.patch) code = opts.patch(code);
  (0, eval)(code);
  return {G: globalThis.THSZ, store: st.store};
}
function runner(name){
  let fail = 0, n = 0;
  const ok = (label, cond, extra) => { n++; console.log((cond?"  ✓ ":"  ✗ ") + label + (extra!=null?`  (${extra})`:"")); if(!cond) fail++; };
  const done = () => {
    console.log(fail ? `\n❌ ${name}:${fail}/${n} 项未通过` : `\n✅ ${name}:${n} 项全部通过`);
    process.exitCode = fail ? 1 : 0;
    return fail;
  };
  return {ok, done};
}
function has(mod){ try{ require.resolve(mod); return true; }catch(e){ return false; } }
function skip(name, why){ console.log(`⏭  跳过 ${name}:${why}`); process.exitCode = 0; }
const pct = (a,b)=> b ? Math.round(a/b*1000)/10 : 0;
module.exports = {GAME, readCode, load, runner, has, skip, pct};
