// 校准:多策略机器人各跑 N 局(默认 300),对照施工规范第 10 节的目标
const {load, runner, pct} = require("./lib");
const N = +process.argv[2] || 300;
const {G} = load(); G.setHeadless(true);
const T = runner("08-balance");
function batch(mode, seed0){
  const s = {n:0,l2:0,l3:0,l4:0,l5:0,caught:0};
  for(let i=0;i<N;i++){ const r = G.simGame(mode, seed0+i, 800); s.n++; const top = Math.max(r.lv, r.overLv||0);
    if(top>=2)s.l2++; if(top>=3)s.l3++; if(top>=4)s.l4++; if(top>=5)s.l5++; if(r.over==="caught")s.caught++; }
  return s;
}
const t0 = Date.now();
const b = batch("balanced", 50000), c = batch("clean", 50000), g = batch("greedy", 50000);
const show = (m,s)=>console.log(`  · ${m.padEnd(8)} L2 ${pct(s.l2,s.n)}% · L3 ${pct(s.l3,s.n)}% · L4 ${pct(s.l4,s.n)}% · L5 ${pct(s.l5,s.n)}% · 出事 ${pct(s.caught,s.n)}%`);
show("balanced", b); show("clean", c); show("greedy", g);
console.log(`  · ${N*3} 局用时 ${((Date.now()-t0)/1000).toFixed(0)} 秒`);
const inTol = (v, t, tol) => Math.abs(v - t) <= tol;
T.ok("balanced 到支行 90% ±4", inTol(pct(b.l2,b.n), 90, 4), pct(b.l2,b.n)+"%");
T.ok("balanced 到二级分行 60% ±5", inTol(pct(b.l3,b.n), 60, 5), pct(b.l3,b.n)+"%");
T.ok("balanced 到一级分行 28% ±5", inTol(pct(b.l4,b.n), 28, 5), pct(b.l4,b.n)+"%");
T.ok("balanced 到总行 9% ±4", inTol(pct(b.l5,b.n), 9, 4), pct(b.l5,b.n)+"%");
T.ok("greedy 出事 ≥40%", pct(g.caught,g.n) >= 40, pct(g.caught,g.n)+"%");
T.ok("clean 到一级分行 ≥ balanced 的 80%", c.l4 >= b.l4*0.8, pct(c.l4,c.n)+"% vs "+pct(b.l4,b.n)+"%");
T.done();
