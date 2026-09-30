// L1 经营模型:行动效果、适当性红线、代发沉淀、时点存款回吐、KPI 折算
const {load, runner} = require("./lib");
const {G} = load();
// 机制测试:行动一律成功,关掉对手追赶、出头鸟和升职变数(这些在 09-odds 单独测)
const SURE_ODDS = () => { Object.assign(G.BALANCE.odds, {min:1, max:1}); Object.assign(G.BALANCE.chase, {after:99, spotP:0, whip:1}); Object.assign(G.BALANCE.promo, {selfNoise:0, backP:0}); };
SURE_ODDS();
const I = G.internals, A = G.act;
const T = runner("03-economy(L1)");
G.setBot(null);

G.newGame({seed:11});
const S = ()=>G.S;
T.ok("开局存款 3 亿", Math.round(I.depTotal())===30000, I.depTotal());
T.ok("开局 40 张客户卡、5 名员工", S().biz.cards.length===40 && S().staff.length===5);
T.ok("L1 行动点 3", S().ap===3);

// 维护:挖他行资产
let c = S().biz.cards.find(x=>x.other>200 && x.risk<=2);
let own0 = c.own, oth0 = c.other;
let r = A.maintain(c.id, "deposit");
T.ok("维护客户把他行资产挪过来", c.own>own0 && c.own+c.other===own0+oth0, r.pull);
T.ok("维护耗 1 AP", S().ap===2);
// 适当性红线
const clean0 = S().core.clean;
let c2 = S().biz.cards.find(x=>x.risk<=2 && x.id!==c.id);
r = A.maintain(c2.id, "fund");
T.ok("给 R1/R2 推 R4 基金:违规,clean 下降", r.viol && S().core.clean < clean0);
T.ok("R4 基金中收高于稳健理财", (()=>{ const P=G.BALANCE.L1.product; return P.fund.fee > P.stable.fee; })());
// 营销费用
S().biz.budget = 0.5;
T.ok("营销费用不足时不能办厅堂活动", A.hall()===null);
S().biz.budget = 5; S().ap = 3;
r = A.hall();
T.ok("厅堂活动出新客户和存款", r && r.cu>0 && r.dp>0);
T.ok("营销费用扣了", S().biz.budget < 5);
// 晨会一月一次
T.ok("晨会第一次可以开", A.rally()===true);
S().ap = 3;
T.ok("晨会一月只能开一次", A.rally()===null);
// 带教
const e = S().staff[0]; const mk0 = e.mk; S().ap=3;
A.train(e.id, "mk");
T.ok("带教能力+1或+2", e.mk>mk0 && e.mk<=mk0+2);
// 代发
S().ap = 3; S().biz.budget = 5;
const pp = S().biz.prospects[0]; pp.tries = 10; // 必中
r = A.out("payroll", pp.id);
T.ok("代发成功", r.won && pp.won);
T.ok("代发带来每月沉淀", S().biz.payrollInflow>0);
// 月结
const dep0 = I.depTotal();
G.endTurn(); G.runJobs();
T.ok("月结后回合推进", S().turn===2);
T.ok("月报记录排名", S().track.rankHistory.length===1);
T.ok("月初营销费用补 2 万", S().biz.budget >= 2);
T.ok("AP 重置", S().ap===3 || S().ap===2);

// KPI 折算:flow 按时序,封顶 120%
G.newGame({seed:12});
S().kpi.ytd.fee = 1000;
I.computeKpi(6);
const fee = S().kpi.card.find(x=>x.k==="fee");
T.ok("完成率封顶 120%", fee.pace===1.2);
T.ok("综合得分 = Σ完成率×权重", Math.abs(S().kpi.score - S().kpi.card.reduce((a,x)=>a+x.pace*x.w,0)) < 0.11);

// 时点存款:九月进、十月回吐
G.newGame({seed:13});
while(S().turn < 9){ G.BOTS.clean.play(); G.setBot("clean"); G.endTurn(); G.runJobs(); }
G.setBot(null);
S().biz.timepoint = 3000;
const d9 = I.depTotal();
G.endTurn(); G.runJobs();
T.ok("时点存款下月回吐", S().biz.timepoint===0 && I.depTotal() < d9 - 2000, `${Math.round(d9)}→${Math.round(I.depTotal())}`);

// 年终与第二年考核卡
G.newGame({seed:14}); G.setBot("balanced");
while(S().turn < 13){ G.BOTS.balanced.play(); G.endTurn(); G.runJobs(); }
T.ok("第一年年考入档", S().kpi.history.length===1);
T.ok("第二年考核卡上浮 15%", S().kpi.card.find(x=>x.k==="dep").target === Math.round(G.BALANCE.L1.kpiTarget.dep*G.BALANCE.L1.kpiGrowth));
T.ok("第二年年龄 +1", S().age===31);

// 事件:15 个都能出正文和选项,选项都能执行
let evOk = 0, evErr = [];
I.EVENTS.forEach(ev=>{
  try{
    G.newGame({seed:99}); S().turn = 16; S().m = 7;
    const d = ev.pick ? (()=>{ S().staff[0].fatigue=90; return ev.pick(S()); })() : null;
    const spec = I.eventSpec({id:ev.id, data:d});
    if(!spec.body || !spec.opts.length) throw new Error("空");
    spec.opts.forEach((o,k)=>{ G.newGame({seed:99}); S().turn=16; S().m=7; S().staff[0].fatigue=90; const sp=I.eventSpec({id:ev.id,data:ev.pick?ev.pick(S()):null}); if(sp.opts[k].fn) sp.opts[k].fn(); });
    evOk++;
  }catch(err){ evErr.push(ev.id+":"+err.message); }
});
T.ok(`L1 事件共 15 个`, I.EVENTS.length===15, I.EVENTS.length);
T.ok("每个事件每个选项都能执行", evErr.length===0, evErr.join(" "));
Object.keys(I.EVENTS_LATER).forEach(id=>{
  G.newGame({seed:98});
  const sp = I.eventSpec({id, later:true, data:{cardId:"zhangxf"}});
  let ok = true; try{ sp.opts.forEach(o=>o.fn&&o.fn()); }catch(e){ ok=false; }
  T.ok(`延迟后果「${sp.title}」可执行`, ok);
});
T.done();

/* ================= L2 南岸支行 ================= */
const T2 = runner("03-economy(L2)");
function toL2(mode, seed){
  let st = null;
  G.simGame(mode, seed, 400, {until:"l2"});
  return G.S;
}
toL2("balanced", 31);
let s2 = G.S;
T2.ok("进入 L2:四个网点 + 对公团队", s2.lv===2 && s2.biz.outlets.length===4 && !!s2.biz.corp.lead);
T2.ok("L2 行动点 4", s2.ap===4 || s2.ap===3);
T2.ok("支行存款约 40 亿起步", Math.abs(I.depTotal()/10000 - 40) < 4, (I.depTotal()/10000).toFixed(1)+"亿");
T2.ok("弹子石交给了 L1 的旧部", !!G.S.biz.outlets[0].mgr && I.person(G.S.biz.outlets[0].mgr).kind==="sub");
T2.ok("弹子石负责人的能力来自 L1 的属性", I.skillOf(G.S.biz.outlets[0].mgr) === I.person(G.S.biz.outlets[0].mgr).skill);
T2.ok("开局已有两个对公项目", G.S.biz.projects.length===2);
T2.ok("开局有考核卡(6项)", G.S.kpi.card.length===6 && G.S.kpi.card.some(x=>x.k==="npl"));
T2.ok("年初指标已分解", G.S.biz.decompDone && G.S.biz.outlets.every(o=>o.target>0));
const allocSum = G.S.biz.outlets.reduce((a,o)=>a+o.target,0);
T2.ok("分解总和 = 存款任务 - 对公份额", allocSum === G.S.kpi.card.find(x=>x.k==="dep").target - G.BALANCE.L2.corpShare);
// 委托公式
const o0 = G.S.biz.outlets[1];
T2.ok("委托系数 = 0.6 + skill/100×0.6", Math.abs(I.delegK(o0.mgr) - (0.6 + I.skillOf(o0.mgr)/100*0.6)) < 1e-9);
// 贷款审批与不良滞后
G.S.ap = 4;
const loans0 = G.S.biz.loans, it = G.S.biz.queue[0];
if(it){ G.act.decideLoan(it.id, true); }
T2.ok("批贷款:贷款余额增加,进台账", !it || (G.S.biz.loans === loans0 + it.amt && G.S.loanBook.some(l=>l.name===it.name)));
T2.ok("台账里的贷款带 6~18 个月的违约时间", G.S.loanBook.filter(l=>l.lv===2 && l.src==="queue").every(l=> l.defAt - l.at >= 6 && l.defAt - l.at <= 18));
I.bookLoan("测试高风险", 5000, "high", "test");
const tl = G.S.loanBook[G.S.loanBook.length-1]; tl.def = true; tl.defAt = G.S.monthAbs; 
const npl0 = G.S.biz.npl;
G.setBot("balanced"); G.BOTS.balanced.play(); G.endTurn(); G.runJobs();
T2.ok("到期违约的贷款进不良", tl.done && G.S.biz.npl > npl0 - 1000);
// 项目推进
G.S.ap = 4;
const pj = G.S.biz.projects.find(p=>!p.lost && p.stage<3);
if(pj){ const st0 = pj.stage, pr0 = pj.prog; G.act.push(pj.id); T2.ok("推进项目有进度", pj.stage>st0 || pj.prog>pr0 || pj.lost || pj.stage===3); }
// 督导
G.S.ap = 4;
const ot = G.S.biz.outlets.find(o=>!o.supervised); const m0 = ot.morale;
G.act.supervise(ot.id);
T2.ok("督导:士气上升,本月标记", ot.supervised && ot.morale >= m0);
// 任免
G.S.ap = 4;
const cands = I.appointCands("nanping");
if(cands.length){ const old = G.S.biz.outlets[1].mgr; G.act.appoint("nanping", cands[0].id); T2.ok("任免:换上人脉簿里的旧部,原负责人不高兴", G.S.biz.outlets[1].mgr===cands[0].id && I.person(old).pos==="南岸支行后台"); }
// 指标分解压太重:士气掉
G.newGame({seed:40}); G.simGame("balanced", 40, 400, {until:"l2"});
const f = I.decompFair(); const al = I.decompProportional(); const mv = Math.round(f.fair[1]*0.5/1000)*1000; al[1]+=mv; al[2]-=mv;
G.S.biz.outlets.forEach(o=>o.morale=60);
I.applyDecomp(al);
T2.ok("分解压得太重,那个网点士气掉", G.S.biz.outlets[1].morale < 60 && G.S.biz.outlets[1].overload);
// L2 事件
let e2 = [];
I.EVENTS_L2.forEach(ev=>{
  try{
    G.simGame("balanced", 41, 400, {until:"l2"}); G.S.turn = 18;
    G.S.biz.outlets[2].overload = true;
    const d = ev.pick ? ev.pick(G.S) : null;
    const spec = I.eventSpec({id:ev.id, data:d});
    spec.opts.forEach((o,k)=>{ G.simGame("balanced", 41, 400, {until:"l2"}); G.S.turn=18; G.S.biz.outlets[2].overload = true; const sp=I.eventSpec({id:ev.id,data:ev.pick?ev.pick(G.S):null}); if(sp.opts[k].fn) sp.opts[k].fn(); });
  }catch(err){ e2.push(ev.id+":"+err.message); }
});
T2.ok("L2 事件共 15 个", I.EVENTS_L2.length===15, I.EVENTS_L2.length);
T2.ok("L2 每个事件每个选项都能执行", e2.length===0, e2.join(" "));

// 验收:同种子两种 L1 打法,L2 首年弹子石那一行差 ≥15%
function firstYear(mode, seed){
  let row = null;
  G.simGame(mode, seed, 400, {mode2:"steady", onTurn:(S)=>{ if(S.lv===2 && S.turn===13 && !row){ const o=S.biz.outlets[0]; row={got:o.lastYear.got, base:o.lastYear.got? o.y0 - o.lastYear.got : 0, dep:o.dep, skill:I.skillOf(o.mgr)}; } }});
  return row;
}
let diffs = [];
for(let sd=1; sd<=30 && diffs.length<10; sd++){
  const a = firstYear("mentor", sd), b = firstYear("grind", sd);
  if(!a || !b) continue;
  const ga = a.got/(a.dep-a.got), gb = b.got/(b.dep-b.got);
  diffs.push(Math.abs(ga-gb)/Math.max(ga,gb));
}
const avgDiff = diffs.reduce((x,y)=>x+y,0)/Math.max(1,diffs.length);
T2.ok("L1 带人 vs 不带人:L2 首年弹子石增速平均差 ≥15%(L2 打法相同,不督导不换人)", avgDiff >= 0.15, (avgDiff*100).toFixed(1)+"% · "+diffs.length+"组");
T2.done();
