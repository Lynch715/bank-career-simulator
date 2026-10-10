// L5 总行:拨盘、降息、资本、同业排名、战略会、送别;全部结局都能触发;图鉴与履历
const {load, runner} = require("./lib");
const {G, store} = load();
// 机制测试:行动一律成功,关掉对手追赶、出头鸟和升职变数(这些在 09-odds 单独测)
const SURE_ODDS = () => { Object.assign(G.BALANCE.odds, {min:1, max:1}); Object.assign(G.BALANCE.chase, {after:99, spotP:0, whip:1}); Object.assign(G.BALANCE.promo, {selfNoise:0, backP:0}); };
SURE_ODDS();
G.setHeadless(true);
const I = G.internals, A = G.act;
const T = runner("06-l5");
const S = () => G.S;
const B = G.BALANCE.L5;

// 打到 L4,存一个快照,之后每个场景都从这里直接升到总行
let sd = 100;
for(; sd < 260; sd++){ G.simGame("balanced", sd, 600, {until:"l4"}); if(S().lv===4 && S().phase==="play") break; }
T.ok("打到 L4", S().lv===4, "seed "+sd);
const SNAP = JSON.stringify(S());
function toL5(){ G.S = JSON.parse(SNAP); I.applyTransition(); G.setBot(null); S().justEntered = false; I.levelStartJobs(); G.runJobs(); return S(); }
function half(){ S().ap = 0; G.endTurn(); G.runJobs(); }
function playOut(mode, dials, hook){
  let g = 0;
  while(S().phase==="play" && g++ < 20){
    if(hook) hook(S());
    if(mode) G.BOTS[mode].play();
    if(dials) Object.keys(dials).forEach(k => A.setDial(k, dials[k]));
    S().ap = 0; G.endTurn(); G.runJobs();
  }
  return S().over;
}

/* ---------- 进入 ---------- */
toL5();
T.ok("升到总行:lv5、按半年、开局在六月", S().lv===5 && S().m===6 && G.BALANCE.turnMonths[5]===6);
T.ok("存款 12 万亿,存贷比 0.75", S().biz.dep===B.dep && Math.abs(S().biz.loans/S().biz.dep-0.75)<0.001);
T.ok("资本充足率开局 13.5%", Math.abs(I.carL5()-13.5) < 0.05, I.carL5().toFixed(2));
T.ok("考核卡 6 项,含资本充足率和同业排名", S().kpi.card.length===6 && S().kpi.card.some(x=>x.k==="car") && S().kpi.card.some(x=>x.k==="rank"));
T.ok("宋文远退休,顾清越去了金融监管总局", I.person("songwy").pos==="退休" && /监管总局/.test(I.person("gu").pos));
T.ok("同业五家,排名算得出来", S().biz.peers.length===5 && I.rankL5()>=1 && I.rankL5()<=6, I.rankL5());

/* ---------- 降息 ---------- */
half();
T.ok("一回合走半年", S().m===12 && S().turn===2);
const sp1 = S().biz.lastSpread.l;
half();
T.ok("第 2 回合起降息:贷款息差变薄", S().biz.cutLevel>=1 && S().biz.lastSpread.l < sp1, (sp1*100).toFixed(3)+"→"+(S().biz.lastSpread.l*100).toFixed(3));

/* ---------- 拨盘 ---------- */
function growthWith(k, v){ toL5(); A.setDial(k, v); const d0 = S().biz.dep, l0 = S().biz.loans; half(); return {dep:S().biz.dep/d0-1, loan:S().biz.loans/l0-1, profit:S().report.profit, S:S()}; }
const p1 = growthWith("price",1), p5 = growthWith("price",5);
T.ok("存款定价抬高:存款长得快,当期利润薄", p5.dep > p1.dep + 0.015 && p5.profit < p1.profit, (p1.dep*100).toFixed(2)+"% vs "+(p5.dep*100).toFixed(2)+"%");
const c1 = growthWith("credit",1), c5 = growthWith("credit",5);
T.ok("信贷放开:贷款长得快", c5.loan > c1.loan + 0.04, (c1.loan*100).toFixed(1)+"% vs "+(c5.loan*100).toFixed(1)+"%");
toL5(); A.setDial("credit",5); half(); half();
const q = S().biz.creditQ.slice();
T.ok("信贷放开的不良要隔一年才进来(排队)", q.length === B.dial.credit.lag && q.every(x=>x>0));
toL5(); A.setDial("digital",5); half();
const st0 = S().biz.digitalStock;
T.ok("数字化投入头两个半年不见效(存量只折旧)", st0 < B.dial.digital.stock0);
half(); half();
T.ok("两个半年后开始见效", S().biz.digitalStock > st0);
const d1 = growthWith("digital",1).profit, d5 = growthWith("digital",5).profit;
T.ok("数字化多投,眼下吃利润", d5 < d1);
toL5(); const o0 = S().biz.outlets; A.setDial("branch",1); half();
T.ok("撤并网点:网点少了", S().biz.outlets < o0);
T.ok("拨盘限在 1~5", (A.setDial("price", 9), S().biz.dials.price===5) && (A.setDial("price", -3), S().biz.dials.price===1));

/* ---------- 资本 ---------- */
toL5(); S().core.trust = 80;
const car0 = I.carL5();
T.ok("发二级资本债:资本充足率上去", A.issueCapital().ok && I.carL5() > car0 + 0.5, car0.toFixed(1)+"→"+I.carL5().toFixed(1));
A.issueCapital();
T.ok("一任最多发两次", !A.issueCapital().ok && S().biz.capIssued===2);
toL5(); S().core.trust = 30;
T.ok("上级信任不够,资本债批不下来", !A.issueCapital().ok);
toL5(); S().biz.capital = Math.round(I.carL5 ? S().biz.loans*B.rwaK*0.10 : 0);
const lo = S().biz.loans; A.setDial("credit",5); half();
T.ok("资本充足率低于 10.5%,贷款放不出去", S().biz.loans/lo - 1 < 0.01);
toL5(); const cap0 = S().biz.capital; half();
T.ok("利润留存补资本", S().biz.capital > cap0);

/* ---------- 行动 ---------- */
toL5(); S().ap = 6;
A.survey("xn");
T.ok("调研:片区两个半年长得快", S().biz.regions.find(r=>r.id==="xn").boost===B.survey.turns);
A.reform();
T.ok("机构改革:费用系数下降,一任一次", S().biz.expenseK < 1 && S().biz.reformDone && !A.reform());
const gf = I.person("gu").fav, rs0 = S().biz.regScore||0; A.reg5();
T.ok("监管沟通:顾清越好感和监管分上去", I.person("gu").fav >= Math.min(100, gf+1) && (S().biz.regScore||0) > rs0, gf+"→"+I.person("gu").fav);

/* ---------- 事件 ---------- */
toL5();
const evIds = I.EVENTS_L5.map(e=>e.id);
T.ok("L5 事件 8 个(交接、战略会、顾清越、资本窗口、送别、周启明、弹子石、年轻人)", ["song5","strat","gu5","capwin","lu5","zhou5","dzs5","young5"].every(x=>evIds.includes(x)), evIds.length);
let evErr = 0, evN = 0;
I.EVENTS_L5.forEach(e => {
  const o = e.opts(S());
  [1,0].forEach(mode => o.forEach((x, i) => { toL5(); S().core.trust = 70; try{ const oo = I.eventSpec({id:e.id}).opts[i]; G.BALANCE.odds.min = G.BALANCE.odds.max = mode; if(oo.fn) oo.fn(); evN++; }catch(err){ evErr++; console.log("   ", e.id, i, err.message); } finally { G.BALANCE.odds.min = G.BALANCE.odds.max = 1; } }));
});
T.ok("全部事件、全部选项可执行", evErr===0, evN+" 个选项");
toL5(); const seen = new Set();
playOut("balanced", null, s => { (s.track.keyEvents||[]).forEach(k=>seen.add(k.txt)); });
(S().track.keyEvents||[]).forEach(k=>seen.add(k.txt));
T.ok("年度战略会每年开一次(四年四次定调)", S().biz.stratLog.length === 4 && new Set(S().biz.stratLog.map(x=>x.year)).size === 4, S().biz.stratLog.map(x=>x.year+x.id).join(","));
T.ok("陆明远退休送别出现过", I.person("lu").pos==="退休");
T.ok("交接、周启明的信、弹子石、年轻人的信都出现过", ["song5","zhou5","dzs5","young5","gu5"].every(id=>S().evDone[id]), Object.keys(S().evDone).filter(k=>/5$/.test(k)).join(","));
T.ok("任期八个半年届满,出结局", S().phase==="over" && S().over.lv===5 && S().turn>=G.BALANCE.tenure[5], S().over && S().over.id);

/* ---------- 全部 L5 结局 ---------- */
const got5 = {};
function end5(name, setup, mode, dials){ toL5(); setup(S()); const o = playOut(mode, dials, name==="caught" ? s => { s.core.clean = Math.min(s.core.clean, 30); } : null); got5[o.id] = true; return o.id; }
T.ok("结局 · 出事(干净度太低)", end5("caught", s=>{ s.core.clean = 30; }, "balanced")==="caught");
T.ok("结局 · 干干净净(一路干净度 ≥90)", end5("clean", s=>{ s.core.clean = 96; s.track.minClean = 96; }, "clean")==="clean");
T.ok("结局 · 三次破格", end5("bt3", s=>{ s.core.clean = 80; s.track.minClean = 70; s.track.btLv = [1,2,3]; }, "balanced")==="bt3");
T.ok("结局 · 做到同业前二", end5("top", s=>{ s.core.clean = 80; s.track.minClean = 70; s.track.btLv = []; }, "balanced")==="top");
T.ok("结局 · 平稳交班", end5("mid", s=>{ s.core.clean = 80; s.track.minClean = 70; s.track.btLv = []; }, "clean")==="mid");
T.ok("结局 · 做得不好", end5("low", s=>{ s.core.clean = 80; s.track.minClean = 70; s.track.btLv = []; }, null, {price:1,credit:1,digital:1,branch:1})==="low");

/* ---------- L1~L4 结局:各种打法跑出来 ---------- */
const got = {};
Object.keys(got5).forEach(k => got["5:"+k] = true);
// 卡在网点、口碑和干净度都好的那一种:年龄线直接触发
G.newGame({seed:3}); G.setBot(null); S().core.rep = 70; S().core.clean = 90; S().age = G.BALANCE.ageLine[2] - 1; S().phase = "promo";
I.promoLose("lose"); if(S().over) got[S().over.lv+":"+S().over.id] = true;
const plans = [];
for(let i=0;i<80;i++){
  ["balanced","random","greedy","clean","steady"].forEach(m => plans.push({m, seed:30000+i*7+m.length}));
  [2,3,4].forEach(lv => ["greedy","random"].forEach(m2 => plans.push({m:"balanced", seed:31000+i*13+lv*3+m2.length, sw:{lv, m2}})));
}
for(const p of plans){
  const r = G.simGame(p.m, p.seed, 700, {onTurn: s => { if(p.sw && s.lv>=p.sw.lv) G.setBot(p.sw.m2); }});
  if(r.over) got[r.overLv+":"+r.over] = true;
  if(I.ENDING_LIST.every(e => got[e.lv+":"+e.k])) break;
}
const miss = I.ENDING_LIST.filter(e => !got[e.lv+":"+e.k]).map(e => e.lv+":"+e.k);
T.ok(`全部 ${I.ENDING_LIST.length} 个结局在无头测试里都触发过`, miss.length===0, miss.length ? "缺 "+miss.join(" ") : "");

/* ---------- 图鉴、履历 ---------- */
const meta = JSON.parse(store[G.BALANCE.metaKey] || "{}");
T.ok("图鉴:跨局记下结局和人", meta.endings && Object.keys(meta.endings).length >= 20 && Object.keys(meta.people||{}).length >= 20, Object.keys(meta.endings||{}).length+" 个结局 · "+Object.keys(meta.people||{}).length+" 人");
const bio = I.bioData();
T.ok("履历数据:有阶段、有关键事件、有结论", bio && bio.rows.length>=1 && bio.rows.every(r=>r.best) && typeof bio.verdict==="string" && bio.verdict.length>4, bio && bio.rows.length+" 段");
// 假 canvas,检查画图不抛错、高度随内容变化
function fakeCanvas(){ const calls = {n:0}; const ctx = new Proxy({}, {get:(t,k)=> k==="measureText" ? (s=>({width:String(s).length*14})) : (k in t ? t[k] : (()=>{ calls.n++; })), set:(t,k,v)=>{ t[k]=v; return true; }});
  return {width:0, height:0, style:{}, getContext:()=>ctx, calls}; }
const cv = fakeCanvas(); let bioErr = null;
try{ I.drawBio(cv); }catch(e){ bioErr = e.message; }
T.ok("履历长图能画出来", !bioErr && cv.height > 1000 && cv.calls.n > 50, bioErr || (cv.width+"×"+cv.height));
T.done();
