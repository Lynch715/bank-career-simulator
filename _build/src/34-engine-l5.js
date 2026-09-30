/* =====================================================================
   L5 总行(按半年,8 回合):数据 + 引擎
   ===================================================================== */
const B5 = ()=> BALANCE.L5;
KPI_DEF[5] = [
  {k:"profit", name:"净利润",     w:20, unit:"万", kind:"flow"},
  {k:"roe",    name:"ROE",        w:20, unit:"%",  kind:"ratio"},
  {k:"npl",    name:"不良率",     w:15, unit:"%",  kind:"lower"},
  {k:"car",    name:"资本充足率", w:15, unit:"%",  kind:"floor"},
  {k:"rank",   name:"规模排名",   w:15, unit:"名", kind:"lower"},
  {k:"rating", name:"监管评级",   w:15, unit:"级", kind:"lower"},
];
/* 八个片区,画成一张方块地图 */
const REGIONS_L5 = [
  {id:"db", name:"东北", x:5, y:0, w:2, h:1, share:0.07, g:0.8},
  {id:"hb", name:"华北", x:3, y:1, w:2, h:1, share:0.16, g:1.0},
  {id:"xb", name:"西北", x:0, y:1, w:3, h:1, share:0.08, g:0.9},
  {id:"hd", name:"华东", x:5, y:1, w:2, h:2, share:0.25, g:1.1},
  {id:"hz", name:"华中", x:3, y:2, w:2, h:1, share:0.14, g:1.0},
  {id:"xn", name:"西南", x:0, y:2, w:3, h:2, share:0.12, g:1.05, cq:true},
  {id:"hn", name:"华南", x:3, y:3, w:4, h:1, share:0.18, g:1.1},
];
const L5_ACTIONS = [
  {id:"survey",  name:"下去调研",   desc:"选一个片区，那边两个半年长得快一截"},
  {id:"reg5",    name:"监管沟通",   desc:"去监管总局汇报，评级好说一点"},
  {id:"reform",  name:"机构改革",   desc:"压一层管理层级，省费用，下面不高兴（只能做一次）"},
  {id:"visit5",  name:"看看老同事", desc:"给以前的人打个电话，口碑回来一点"},
];
const STRAT_OPTS = [
  {id:"scale",  name:"规模优先", desc:"增速上去，不良也跟着上去"},
  {id:"profit", name:"效益优先", desc:"息差守住一点，增速慢一点"},
  {id:"risk",   name:"风控优先", desc:"不良少一截，增速慢一点"},
];
const DIAL_DEF = [
  {k:"price",   name:"存款定价", lo:"压价", hi:"抬价",  tip:"抬价存款长得快，付息成本上去"},
  {k:"credit",  name:"信贷增速", lo:"收紧", hi:"放开",  tip:"放开贷款长得快，一年后不良跟着来"},
  {k:"digital", name:"数字化投入", lo:"少投", hi:"多投", tip:"眼下吃利润，一年后省费用、长存款"},
  {k:"branch",  name:"网点总数", lo:"撤并", hi:"扩张",  tip:"撤并省费用，口碑掉"},
];

function loansL5(){ return S.biz.loans; }
function depTotalL5(){ return S.biz.dep; }
function rwaL5(){ return S.biz.loans * B5().rwaK; }
function carL5(){ return S.biz.capital / rwaL5() * 100; }
function ratingL5(){ const r = B5().rating; const npl = S.biz.npl/S.biz.loans*100;
  return clamp(r1(r.base + (npl-1.3)*r.nplK - (S.kpi.comp-90)*r.compK - (S.biz.regScore||0)*0.1 - ((person("gu")?person("gu").fav:50)-50)/100), 1, 5); }
function rankL5(){ const me = S.biz.dep; return 1 + S.biz.peers.filter(p=>p.dep > me).length; }
function subsL5(){ return ["zhouqm","duheng","shenlan","jianggd"].map(person).filter(Boolean).slice(0,3).concat(S.people.filter(p=>p.kind==="sub" && p.lvMet<=2).slice(0,3)); }

function initL5(){
  const b = B5();
  const peers = b.peers.map(p => Object.assign({}, p));
  S.biz = {
    dep: b.dep, loans: Math.round(b.dep*b.ldr), npl: Math.round(b.dep*b.ldr*b.nplStart),
    capital: Math.round(b.dep*b.ldr*b.rwaK*b.capRatio),
    dials: {price:3, credit:3, digital:3, branch:3},
    digitalStock: b.dial.digital.stock0, digitalQ: [], creditQ: [], stratLog: [],
    outlets: b.outlets, expenseH: b.dep*b.expenseRate/2, expenseK: 1,
    cutLevel: 0, strategy: null, reformDone: false, regScore: 0, capIssued: 0,
    regions: REGIONS_L5.map(r => Object.assign({boost:0}, r)),
    peers, ytd: {profit:0}, csat: 60, rankStreak: 0, scoreLog: [],
  };
  const sw = person("songwy"); if(sw){ sw.pos = "退休"; sw.recent = "把位子交给了你"; }
  const lu = person("lu"); if(lu){ lu.recent = "后年到龄"; }
  const gu = person("gu"); if(gu){ gu.pos = "金融监管总局"; gu.recent = "调到北京，还是管银行"; }
  S.rivals = [];
  S.kpi = {card:[], score:0, rank:0, history:[], ytd:{}, comp:100};
  S.chal = []; S.sched = S.sched.filter(x=>x.lv===5); S.pendingEv = [];
  S.promo = { windowAt: 999, rumored:false, bt:false, stage:null, tries:0, last:null };
  S.track.scoreHistory = []; S.track.rankHistory = [];
  S.turn = 1; S.m = 6; S.year = 1;
  issueKpi();
  computeAll();
  monthStart(true);
}
function issueKpiL5(){
  S.kpi.card = KPI_DEF[5].map(d => Object.assign({}, d, {target:B5().kpiTarget[d.k], actual:0, done:0, pace:0}));
  S.biz.ytd = {profit:0}; S.kpi.comp = 100;
}
function kpiActualL5(k){
  switch(k){
    case "profit": return S.biz.ytd.profit;
    case "roe":    return r1(S.biz.ytd.profit * (12/Math.max(6,S.m)) / S.biz.capital * 100);
    case "npl":    return r2(S.biz.npl / S.biz.loans * 100);
    case "car":    return r1(carL5());
    case "rank":   return rankL5();
    case "rating": return ratingL5();
  }
  return 0;
}
function monthStartL5(first){
  S.ap = S.apMax = BALANCE.ap[5];
  S.month = {dep0: S.biz.dep, loan0: S.biz.loans, profit:0, spent:0, once:0};
}
function settleL5(){
  const b = B5(), d = b.dial, D = S.biz.dials, M = S.month, st = b.strategy[S.biz.strategy] || {};
  // 降息:第 2 回合起每半年压一次
  if(S.turn >= b.cut.from) S.biz.cutLevel++;
  const lSpread = Math.max(0.004, b.spreadLoan - S.biz.cutLevel*b.cut.loan) * (st.spread||1);
  const dSpread = Math.max(0.012, b.spreadDep - S.biz.cutLevel*b.cut.dep - (D.price-3)*d.price.spread);
  // 数字化:投入进队列,两回合后见效
  const dSpend = D.digital * d.digital.costPer;
  S.biz.digitalQ.push(dSpend);
  S.biz.digitalStock *= (1 - d.digital.dep);
  if(S.biz.digitalQ.length > d.digital.lag) S.biz.digitalStock += S.biz.digitalQ.shift();
  const digiK = Math.min(d.digital.maxCut, S.biz.digitalStock / d.digital.per * 0.02);
  // 网点
  S.biz.outlets = Math.max(15000, S.biz.outlets + (D.branch-3)*d.branch.outletsPer);
  S.biz.csat = c100(S.biz.csat + (D.branch-3)*Math.abs(d.branch.rep) + (60 - S.biz.csat)*0.1);
  // 存款
  const reg = S.biz.regions.reduce((a,r)=>a + r.share * r.g * (r.boost>0 ? b.survey.g : 1), 0);
  const depG = (b.baseDepG + (S.biz.csat-60)*0.0003 + (D.price-3)*d.price.depG + (digiK-0.1)*d.digital.depG*10 + (D.branch-3)*d.branch.depG) * reg * (st.g||1);
  S.biz.dep = Math.round(S.biz.dep * (1 + depG + gauss()*0.002));
  S.biz.regions.forEach(r => { if(r.boost>0) r.boost--; });
  // 贷款(资本够才放)
  const carOk = carL5() > 10.5;
  const loanG = carOk ? (b.baseLoanG + (D.credit-3)*d.credit.loanG) * (st.g||1) : 0.005;
  S.biz.loans = Math.round(S.biz.loans * (1 + loanG));
  S.biz.creditQ.push((D.credit-3)*d.credit.npl);
  const lagNpl = S.biz.creditQ.length > d.credit.lag ? S.biz.creditQ.shift() : 0;
  const newNpl = S.biz.loans * (b.nplRate/2 + lagNpl/2) * (st.npl||1);
  S.biz.npl = Math.round(S.biz.npl * (1 - b.nplResolveH) + newNpl);
  // 利润
  const expense = S.biz.dep * b.expenseRate / 2 * S.biz.expenseK * (1 - digiK) * (1 + (S.biz.outlets - b.outlets)/b.outlets * 0.8);
  const pre = S.biz.dep*dSpread/2 + S.biz.loans*lSpread/2 + S.biz.dep*b.feeRate/2 - expense - newNpl*b.provision - dSpend - (M.spent||0) + (M.once||0);
  const profit = pre * (1 - b.tax);
  S.biz.ytd.profit += profit; M.profit = profit;
  if(profit > 0) S.biz.capital += Math.round(profit * b.retain);
  // 同业
  S.biz.peers.forEach(p => { p.dep = Math.round(p.dep * (1 + p.g/1 * 1 + gauss()*0.004)); });
  S.biz.lastSpread = {l:lSpread, d:dSpread};
  computeKpi(S.m);
  computeRankL5();
  computeCore();
  S.track.scoreHistory.push(S.kpi.score);
  S.track.rankHistory.push(rankL5());
  S.report = {turn:S.turn, dep:S.biz.dep, dDep:S.biz.dep-M.dep0, loans:S.biz.loans, dLoan:S.biz.loans-M.loan0, profit, npl:S.biz.npl/S.biz.loans*100,
    car:carL5(), rating:ratingL5(), rank:rankL5(), spread:lSpread, outlets:S.biz.outlets, digi:digiK};
  return S.report;
}
function computeRankL5(){
  const list = S.biz.peers.map(p => ({id:p.id, name:p.name, boss:"", score:p.dep, me:false}));
  list.push({id:"me", name:"泰和银行", boss:S.player.sur+S.player.given, score:S.biz.dep, me:true});
  list.sort((a,b)=>b.score-a.score);
  S.kpi.prevRank = S.kpi.rank || rankL5();
  S.kpi.rank = list.findIndex(x=>x.me)+1;
  S.kpi.table = list;
}
function yearEndL5(){ S.biz.scoreLog.push(S.kpi.score); }

/* 行动 */
function canActL5(id){
  if(S.phase!=="play") return {ok:false, why:"现在不能操作"};
  if(S.ap < 1) return {ok:false, why:"这半年的行动点用完了"};
  if(id==="reform" && S.biz.reformDone) return {ok:false, why:"机构改革已经做过了"};
  return {ok:true};
}
function doSurvey(rid){
  const ck = canActL5("survey"); if(!ck.ok) return null;
  const r = S.biz.regions.find(x=>x.id===rid); if(!r) return null;
  apUse(1); r.boost = B5().survey.turns; S.biz.csat = c100(S.biz.csat + B5().survey.rep);
  const lines = {
    xn: "你去了重庆。车过南滨路，你让司机开慢一点。弹子石那一带新修了一排楼，叫号机的事，没人记得了。",
    hd: "你在长三角跑了六个城市，一天一个。回北京的高铁上，你把笔记本翻到第一页，上面写着：客户在哪里。",
    hb: "你去了雄安。工地上的塔吊比楼多，一级分行的行长陪你站在风里，讲了一个小时。",
    hn: "你在深圳一家网点坐了一上午，看柜员怎么接待外国客户。中午在食堂吃了份烧鹅饭。",
    db: "你去了东北。零下二十度，网点门口的老人排队交暖气费，有人认出了行服上的标，冲你点头。",
    xb: "你去了兰州。一级分行的行长带你去看了一个县里的网点，一天只有十几个客户，柜员都是本地人。",
    hz: "你在武汉看了三个科技企业。园区的负责人说，贷款批得太慢。你让人把这句话记下来。",
  };
  keyEvent(`总行行长任上去${r.name}调研`);
  log("good", (lines[rid] || `你去${r.name}调研了一周。`) + ` <span class="num">${r.name}两个半年长得快</span>`);
  return true;
}
function doReg5(){
  const ck = canActL5("reg5"); if(!ck.ok) return null;
  apUse(1); fav("gu", B5().regTalk.fav); S.biz.regScore = Math.min(10, (S.biz.regScore||0) + B5().regTalk.score*0.5);
  log("", `你去金融监管总局汇报。顾清越坐在长桌对面，头发白了一半，面前还是一个笔记本、一支笔、一杯自己带的水。<span class="num">顾清越好感+${B5().regTalk.fav}</span>`);
  return true;
}
function doReform(){
  const ck = canActL5("reform"); if(!ck.ok) return null;
  const r = B5().reform;
  apUse(1); S.biz.reformDone = true; S.biz.expenseK *= r.expense; S.biz.csat = c100(S.biz.csat + r.rep);
  keyEvent("推动总行机构改革，压减一个管理层级");
  log("warn", "机构改革的文件发下去了。全国二级分行的管理层级压掉一层，四千多个岗位要重新竞聘。那一周，你的手机响了两百多次。");
  return true;
}
function doVisit5(){
  const ck = canActL5("visit5"); if(!ck.ok) return null;
  apUse(1); S.biz.csat = c100(S.biz.csat + 3);
  const old = S.people.filter(p=>p.lvMet<=2 && p.alive && p.pos.indexOf("离职")<0 && p.fav>=50);
  const p = old.length ? pick(old) : null;
  if(p){ fav(p.id, 5); log("good", `你给${p.name}打了个电话。${p.name}现在是${p.pos}。电话那头愣了几秒：「${S.player.sur}……行长？」`); }
  else log("", "你翻了翻通讯录，打了两个电话，都没人接。");
  return true;
}
function issueCapital(){
  const c = B5().dial.capital;
  if(S.biz.capIssued >= 2) return {ok:false, why:"这一任已经发过两次了"};
  if(S.core.trust < c.needTrust) return {ok:false, why:"上面没批"};
  S.biz.capital += c.add; S.biz.capIssued++;
  log("good", `二级资本债发出去了，一千亿，认购倍数二点一。<span class="num">资本+${fmtWy(c.add)}</span>`);
  return {ok:true};
}
function setDial(k, v){ if(S.lv!==5 || !S.biz.dials || !(k in S.biz.dials)) return false; S.biz.dials[k] = clamp(Math.round(v),1,5); return true; }
function setStrategy(id){ S.biz.strategy = id; (S.biz.stratLog = S.biz.stratLog || []).push({year:S.year, id}); const o = STRAT_OPTS.find(x=>x.id===id); keyEvent(`年度战略会定调：${o.name}`); log("", `年度战略会定了调子：${o.name}。`); }
function fmtWy(v){ return (v/100000000).toFixed(2) + "万亿"; }
