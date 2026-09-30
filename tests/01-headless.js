// 无头跑 N 局(四种机器人轮流),零报错是硬门槛;顺带统计 L1 升职窗口
const {load, runner, pct} = require("./lib");
const N = +process.argv[2] || 200;
const {G, store} = load();
const T = runner("01-headless");
const modes = ["balanced","clean","greedy","random"];
let errors = 0, firstErr = null, stuck = 0;
const stat = {}; modes.forEach(m=>stat[m]={n:0,l2:0,l3:0,l4:0,l5:0,lock:0,caught:0,side:0,end5:0,win24:0,turns:0});
for(let i=0;i<N;i++){
  const m = modes[i % modes.length];
  try{
    const r = G.simGame(m, 20000+i);
    const s = stat[m]; s.n++;
    const top = Math.max(r.lv, r.overLv||0);
    if(top>=2) s.l2++; if(top>=3) s.l3++; if(top>=4) s.l4++; if(top>=5) s.l5++;
    if(r.overLv===5) s.end5++; else if(r.over==="lock" || r.over==="lock2") s.lock++; else if(r.over==="caught") s.caught++; else if(r.over==="side") s.side++; else stuck++;
    if(r.windowSeen!=null && r.windowSeen<=24) s.win24++;
  }catch(e){ errors++; if(!firstErr) firstErr = e.stack; }
}
if(firstErr) console.log(firstErr);
T.ok(`${N} 局零报错`, errors===0, errors);
T.ok("每局都走到结局", stuck===0, stuck);
console.log("  · 最高到达比例(目标 balanced:L2 90 · L3 60 · L4 28 · L5 9)");
modes.forEach(m=>{ const s=stat[m]; console.log(`  · ${m.padEnd(8)} L2 ${pct(s.l2,s.n)}% · L3 ${pct(s.l3,s.n)}% · L4 ${pct(s.l4,s.n)}% · L5 ${pct(s.l5,s.n)}% · 卡住 ${pct(s.lock,s.n)}% · 回机关 ${pct(s.side,s.n)}% · 出事 ${pct(s.caught,s.n)}% · 总行任满 ${pct(s.end5,s.n)}%`); });
T.ok("balanced 24 回合内看到升职窗口 ≥90%", pct(stat.balanced.win24, stat.balanced.n) >= 90, pct(stat.balanced.win24, stat.balanced.n)+"%");
T.ok("存档写进 thsz_save 且可解析", (()=>{ try{ return JSON.parse(store.thsz_save).ver===4; }catch(e){ return false; } })());
// 存档读回
G.newGame({seed:5}); G.setBot("balanced");
for(let k=0;k<7;k++){ G.BOTS.balanced.play(); G.endTurn(); G.runJobs(); }
const snap = JSON.stringify(G.S);
G.S = null;
const back = G.load();
T.ok("读档后状态一致", back && JSON.stringify(back)===snap);
T.done();
