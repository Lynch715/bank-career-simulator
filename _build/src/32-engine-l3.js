/* =====================================================================
   L3 万州分行:引擎(按季)
   ===================================================================== */
const B3 = ()=> BALANCE.L3;
const LOAN_TYPES = ["corp","micro","retail"];
const LOAN_TYPE_NAME = {corp:"对公", micro:"小微", retail:"个贷", platform:"平台"};

function area(id){ return S.biz.areas.find(a=>a.id===id); }
function branch(id){ return S.biz.branches.find(b=>b.id===id); }
function loansTotalL3(){ const l = S.biz.loans; return l.corp + l.micro + l.retail + l.platform; }
function nplL3(){ return S.biz.npa.reduce((a,x)=>a+x.amt,0); }
function depTotalL3(){ return S.biz.branches.reduce((a,b)=>a+b.dep,0) + S.biz.newOutlets.reduce((a,o)=>a+o.dep,0); }
function outletCount(){ return S.biz.branches.reduce((a,b)=>a+b.outlets,0) + S.biz.newOutlets.length; }
function effL3(){ return depTotalL3() / 10000 / Math.max(1, outletCount()); }
function subsL3(){ return S.biz.branches.map(b=>b.mgr).concat(Object.values(S.biz.lineHeads)).filter((v,i,a)=>v && a.indexOf(v)===i).map(person).filter(Boolean); }
function areaGrowth(a){ const g = B3().area; return g.g0 + a.heat/100*g.heatK - a.comp/100*g.compK; }
function delegK3(id){ const d = B3().deleg; return d.base + skillOf(id)/100 * d.k; }
function qName(){ return ["一","二","三","四"][Math.max(0, Math.round(S.m/3)-1)] + "季度"; }

/* ---------- 进入 L3 ---------- */
function initL3(){
  const b = B3();
  PEOPLE_L3.concat(RESERVES_L3).forEach(d => { if(!person(d.id)) S.people.push(Object.assign({lvMet:3, pos:d.role, met:true, recent:"", kind:"sub", alive:true, group:"部下"}, d)); });
  RESERVES_L3.forEach(d => { const p = person(d.id); p.kind = "reserve"; });
  const branches = BRANCHES_L3.map(x => Object.assign({}, x, {renov:0, y0:x.dep, dep0:x.dep, lastInc:0}));
  const depT = branches.reduce((a,x)=>a+x.dep,0);
  const loansT = Math.round(depT * b.ldr);
  const loans = {corp:Math.round(loansT*b.loanMix.corp), micro:Math.round(loansT*b.loanMix.micro), retail:Math.round(loansT*b.loanMix.retail), platform:0};
  // 公司部:罗建够格就是他
  const luo = person("luojian");
  const corpHead = (luo && luo.skill >= 60 && luo.pos.indexOf("离职")<0) ? "luojian" : "duanbin";
  if(corpHead === "luojian"){ luo.pos = "万州分行公司部总经理"; luo.recent = "调到万州，管公司部"; luo.kind = "sub"; }
  else { person("duanbin").kind = "sub"; person("duanbin").pos = "万州分行公司部总经理"; }
  S.biz = {
    areas: AREAS_L3.map(a => Object.assign({}, a)),
    branches, newOutlets: [], outletSeq: 0,
    loans, mixTarget: Object.assign({}, b.loanMix),
    npa: [], npaSeq: 0, restr: [], writeoffUsed: 0,
    budget: b.budgetQ, tilt: null,
    lineHeads: {corp:corpHead, retail:"liujia", risk:"wangming", ops:"xiongw", hr:"tanmin"},
    csat: 55, ytd: {profit:0, fee:0}, disposedQ: 0, platformDone: [], platformOffer: null,
    rankStreak: 0, reported: false, opened: 0, closed: 0,
  };
  person("liujia").kind = "sub"; person("liujia").pos = "万州分行零售部总经理";
  // 起始不良,拆成若干户
  let npl0 = Math.round(loansT * b.nplStart);
  while(npl0 > 0){ const amt = Math.min(npl0, Math.round(rr([4000, 9000]))); addNpa(amt, pick(LOAN_TYPES), "前任留下"); npl0 -= amt; }
  S.rivals = RIVALS_L3.map(r => Object.assign({}, r, {shift:0, score:r.base, bonus:0}));
  S.kpi = {card:[], score:0, rank:0, history:[], ytd:{}, comp:100, dep0:0, loan0:0};
  S.chal = []; S.sched = S.sched.filter(x=>x.lv===3); S.pendingEv = [];
  S.promo = { windowAt: BALANCE.tenure[3], rumored:false, bt:false, stage:null, tries:0, last:null };
  S.track.scoreHistory = []; S.track.rankHistory = [];
  S.flags.grayAtL3 = S.flags.grayCount || 0;
  S.turn = 1; S.m = 3; S.year = 1;
  issueKpi();
  computeAll();
  monthStart(true);
}

function addNpa(amt, type, origin, name){
  S.biz.npaSeq++;
  S.biz.npa.push({id:"npa"+S.biz.npaSeq, name: name || pick(NPA_NAMES), amt:Math.round(amt), type, stage:null, until:0, origin: origin||"", orig:Math.round(amt)});
}

/* ---------- 考核卡 ---------- */
function issueKpiL3(){
  const b = B3();
  const g = Math.pow(b.kpiGrowth, Math.min(S.year-1, b.kpiGrowthYears));
  S.kpi.card = KPI_DEF[3].map(d => {
    let target = b.kpiTarget[d.k];
    if(d.k==="eff") target = r1(effL3() * b.effTargetK);
    else if(d.kind==="flow") target = Math.round(target*g);
    return Object.assign({}, d, {target, actual:0, done:0, pace:0});
  });
  S.kpi.dep0 = depTotal(); S.kpi.loan0 = loansTotalL3();
  S.biz.ytd = {profit:0, fee:0};
  S.kpi.comp = 100;
  S.biz.writeoffUsed = 0;
  S.biz.branches.forEach(x => { x.y0 = x.dep; });
  S.biz.expenseQ = depTotal() * b.expenseRate / 4;
  S.biz.quota = Math.round((loansTotalL3() - S.biz.loans.platform) * (1 + b.quotaYear));
}
function kpiActualL3(k){
  switch(k){
    case "profit": return S.biz.ytd.profit;
    case "dep":    return depTotal() - S.kpi.dep0;
    case "loan":   return loansTotalL3() - S.kpi.loan0;
    case "npl":    return r2(nplL3() / loansTotalL3() * 100);
    case "eff":    return r1(effL3());
    case "comp":   return S.kpi.comp;
  }
  return 0;
}

/* ---------- 回合开始 ---------- */
function monthStartL3(first){
  const b = B3();
  S.ap = S.apMax = BALANCE.ap[3];
  if(S.flags.apDebt){ S.ap = Math.max(0, S.ap - S.flags.apDebt); S.flags.apDebt = 0; }
  S.month = {dep0: depTotal(), loan0: loansTotalL3(), npl0: nplL3(), profit:0, fee:0, spent:0, newNpl:0, recovered:0, defaults:[], nanan:[]};
  S.biz.branches.forEach(x => x.dep0 = x.dep);
  S.biz.disposedQ = 0; S.biz.reported = false;
  if(!first) S.biz.budget = Math.round(S.biz.budget + b.budgetQ);
}

/* ---------- 季末结算 ---------- */
function settleL3(){
  const b = B3(), M = S.month, tilt = S.biz.tilt, t = b.tilt;
  // 1 片区热度
  S.biz.areas.forEach(a => { const d = b.area.heatDrift[a.id]; if(d) a.heat = c100(a.heat + d/4); a.rep = c100(a.rep + (55 - a.rep)*0.05); });
  // 2 支行存款(委托给支行行长)
  S.biz.branches.forEach(x => {
    const a = area(x.area);
    let inc = x.dep * areaGrowth(a) * delegK3(x.mgr) * (1 + x.renov) * (tilt==="retail" ? t.retailDep : 1);
    inc += gauss() * x.dep * 0.003;
    x.dep = Math.round(x.dep + inc); x.lastInc = x.dep - x.dep0;
  });
  // 3 新网点爬坡
  S.biz.newOutlets.forEach(o => {
    o.age++;
    if(o.dep < o.cap) o.dep = Math.min(o.cap, o.dep + o.ramp);
    o.earned += o.dep * b.spread.dep / 4 - b.outlet.costY / 4;
    if(!o.paid && o.earned >= b.outlet.build){ o.paid = true; S.flags.wzNewPaid = true; log("good", `${area(o.area).name}的新网点把投进去的钱赚回来了。`); }
  });
  // 4 贷款增长与结构
  const L = S.biz.loans;
  const base = loansTotalL3() - L.platform;
  let room = Math.max(0, S.biz.quota - base);
  const gk = {corp: tilt==="corp" ? t.corpLoan : 1, micro: tilt==="retail" ? t.retailLoan : 1, retail: tilt==="retail" ? t.retailLoan : 1};
  let want = {}; let sumW = 0;
  LOAN_TYPES.forEach(k => { want[k] = L[k] * b.loanGrowthQ * gk[k] * (0.9 + gauss()*0.05); sumW += want[k]; });
  const scale = sumW > room ? room / sumW : 1;
  LOAN_TYPES.forEach(k => { L[k] = Math.round(L[k] + want[k]*scale); });
  // 结构往目标挪
  const tot = L.corp + L.micro + L.retail;
  let moved = 0;
  LOAN_TYPES.forEach(k => { const cur = L[k]/tot, tgt = S.biz.mixTarget[k]; const d = clamp(tgt - cur, -b.mixStep, b.mixStep); moved += Math.abs(d); L[k] = Math.round(L[k] + d*tot); });
  // 5 新增不良
  let newNpl = 0;
  LOAN_TYPES.forEach(k => { newNpl += L[k] * b.nplRate[k] / 4 * (tilt==="risk" ? t.riskNpl : 1); });
  const parts = rint(b.npaSplit[0], b.npaSplit[1]);
  for(let i=0;i<parts;i++) addNpa(newNpl/parts, pick(LOAN_TYPES), "本季新增");
  (S.loanBook||[]).forEach(l => {
    if(!l.def || l.done || S.monthAbs < l.defAt) return;
    l.done = true;
    if(l.lv === 3){ addNpa(l.amt, l.src==="platform"?"platform":"corp", "你批的", l.name); newNpl += l.amt; M.defaults.push(l);
      log("bad", `<b>${l.name}</b>逾期，进了不良。这笔是你在万州批的。<span class="num">不良+${fmtWan(l.amt)}</span>`); }
    else if(l.lv === 2){ if(S.carry.l2) S.carry.l2.npl = (S.carry.l2.npl||0) + l.amt; M.nanan.push(l); S.flags.nananDefault = (S.flags.nananDefault||[]).concat([l.name]);
      log("bad", `南岸支行那边传来消息：<b>${l.name}</b>逾期了。批贷款的时候，南岸的行长是你。`); }
  });
  M.newNpl = newNpl;
  // 6 处置中的不良
  const dp = b.dispose;
  let recovered = 0;
  S.biz.npa.forEach(x => {
    if(x.stage && S.turn >= x.until){
      const rec = Math.round(x.amt * dp[x.stage].rec * (tilt==="risk" ? t.riskRecover : 1));
      recovered += rec; x.amt -= rec;
      log("good", `${x.name}${x.stage==="collect"?"催收":"诉讼"}有了结果，收回${fmtWan(rec)}。`);
      x.stage = null;
    } else if(!x.stage){ x.amt = Math.round(x.amt * (1 - b.naturalResolve)); }
  });
  S.biz.npa = S.biz.npa.filter(x => x.amt > 50);
  S.biz.restr = S.biz.restr.filter(r => {
    if(S.turn < r.at) return true;
    if(r.redef){ addNpa(r.amt, r.type, "重组后又逾期", r.name); newNpl += r.amt; log("bad", `${r.name}重组以后又还不上了，回到不良。`); }
    return false;
  });
  M.recovered = recovered;
  // 7 利润
  const dep = depTotal();
  let income = dep * b.spread.dep / 4;
  LOAN_TYPES.concat(["platform"]).forEach(k => income += L[k] * b.spread[k] / 4);
  const fee = dep * b.feeRate / 4;
  const outletCost = S.biz.newOutlets.length * b.outlet.costY / 4;
  const expense = S.biz.expenseQ * (tilt==="ops" ? t.opsExpense : 1) + outletCost;
  const profit = income + fee - expense - newNpl * b.provision + recovered * b.provision - (M.spent||0);
  S.biz.ytd.profit += profit; S.biz.ytd.fee += fee; M.profit = profit;
  // 8 条线倾斜的持续效果
  if(tilt === "ops") S.kpi.comp = c100(S.kpi.comp + t.opsComp);
  if(tilt === "hr") S.biz.branches.forEach(x => { const p = person(x.mgr); if(p) p.skill = Math.min(90, (p.skill||50) + t.hrSkill); });
  subsL3().forEach(p => { p.fav = c100(p.fav + (55 - p.fav) * 0.03); });
  S.biz.csat = Math.round(S.biz.areas.reduce((a,x)=>a+x.rep,0) / S.biz.areas.length);
  settleChalGeneric();
  // 9 考核
  computeKpi(S.m);
  stepRivals(false);
  computeRank();
  computeCore();
  S.track.rankHistory.push(S.kpi.rank);
  S.track.scoreHistory.push(S.kpi.score);
  S.track.depHistory.push(Math.round(dep));
  S.biz.rankStreak = (S.kpi.rank === 1) ? (S.biz.rankStreak||0)+1 : 0;
  S.report = {
    turn:S.turn, q:qName(), dep, dDep: dep - M.dep0, loans: loansTotalL3(), dLoan: loansTotalL3() - M.loan0,
    profit, npl: nplL3()/loansTotalL3()*100, newNpl, recovered, rank:S.kpi.rank, prevRank:S.kpi.prevRank, score:S.kpi.score,
    defaults: M.defaults.length, nanan: M.nanan.map(l=>l.name), quotaFull: room <= 0,
  };
  return S.report;
}

function yearEndL3(){
  S.biz.allGrow = S.biz.branches.every(x => x.dep > x.y0);
}
