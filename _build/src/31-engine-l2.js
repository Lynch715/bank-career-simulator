/* =====================================================================
   L2 南岸支行:引擎
   ===================================================================== */
const B2 = ()=> BALANCE.L2;

function depTotalL2(){ return S.biz.outlets.reduce((a,o)=>a+o.dep,0) + S.biz.corp.dep; }
function nplRatio(){ return S.biz.loans > 0 ? S.biz.npl / S.biz.loans * 100 : 0; }
function outlet(id){ return S.biz.outlets.find(o=>o.id===id); }
function project(id){ return S.biz.projects.find(p=>p.id===id); }
function subsL2(){
  const ids = S.biz.outlets.map(o=>o.mgr).concat([S.biz.corp.lead]).filter(Boolean);
  return ids.map(person).filter(Boolean);
}
function skillOf(id){ const p = person(id); return p && p.skill != null ? p.skill : 45; }
function delegK(id){ const d = B2().deleg; return d.base + skillOf(id)/100 * d.k; }
function moraleK(o){ const m = B2().morale; return m.base + o.morale/100 * m.k; }

/* L1 员工 → 人脉簿里的能力值 */
function staffSkill(s){
  const k = B2().skillFromAttr;
  return Math.round(c100(k.base + ((s.mk + s.op + s.cp) - k.off) / k.span * k.k + (s.fav - 55) * k.favK));
}

/* ---------- 进入 L2 ---------- */
function initL2(succId){
  const b = B2();
  const l1 = S.track.l1End || {dep: B1().depStart, core: S.core};
  // L1 员工写进人脉簿的能力值
  (S.staff||[]).forEach(s => { const p = person(s.id); if(p){ p.skill = staffSkill(s); p.sex = s.sex; p.l1role = s.role; } });
  PEOPLE_L2.forEach(d => { if(!person(d.id)) S.people.push(Object.assign({lvMet:2, pos:d.role, met:true, recent:"", kind:"npc", alive:true}, d)); });
  ["dengyu","xulp","lizheng"].forEach(id => { const p = person(id); p.lvMet = 1; p.kind = "sub"; p.recent = "现在归你管"; });
  // 对公团队:罗建够格就上来带队
  let lead = null;
  const luo = person("luojian");
  if(luo && luo.pos.indexOf("离职")<0 && luo.skill >= 50){ lead = "luojian"; luo.pos = "南岸支行对公团队负责人"; luo.recent = "跟着你上了支行，带对公团队"; }
  else { S.people.push(Object.assign({lvMet:2, pos:"南岸支行对公团队负责人", role:"对公客户经理", group:"部下", met:true, recent:"", kind:"sub", alive:true}, CORP_LEAD_DEFAULT)); lead = CORP_LEAD_DEFAULT.id; }
  const outlets = OUTLETS_L2.map(o => {
    const x = Object.assign({}, o);
    if(o.id === "dzs"){ x.dep = Math.round(l1.dep * b.carryDep); x.mgr = succId; }
    x.morale = b.morale.start + (o.id==="dzs" && succId ? Math.round((person(succId).fav-55)/2) : 0);
    x.target = 0; x.y0 = x.dep; x.lastInc = 0; x.supervised = false; x.mult = 1; x.hit = null;
    return x;
  });
  if(succId){ const sp = person(succId); sp.kind = "sub"; sp.trait = "新手"; }
  const loans = b.loansStart;
  S.biz = {
    outlets, corp: {dep: b.corpDep, lead},
    loans, npl: Math.round(loans * b.nplStartRatio),
    budget: b.budgetMonthly,
    csat: c100(Math.round(((S.track.l1Csat||80) + b.csatHome)/2)),
    queue: [], projects: [], projQueue: PROJ_L2.map(p=>p.id).slice(2), nextProjAt: b.project.spawnEvery,
    campaignDone: false, reported: false,
    ytd: {fee:0, profit:0}, lastProfit:0,
    decompDone: false, allHit: false, rankStreak:0,
  };
  PROJ_L2.slice(0,2).forEach(p => spawnProject(p.id));
  if(!S.loanBook) S.loanBook = [];
  // 上级:L1 收尾状态影响周启明的初始看法
  fav("zhouqm", Math.round(((l1.core ? l1.core.trust : 45) - 45) / 2));
  S.rivals = RIVALS_L2.map(r => Object.assign({}, r, {shift:0, score:r.base, bonus:0}));
  S.kpi = {card:[], score:0, rank:0, history:[], ytd:{}, comp:100, dep0:0, loan0:0};
  S.chal = []; S.sched = S.sched.filter(x=>x.lv===2); S.pendingEv = [];
  S.promo = { windowAt: BALANCE.tenure[2], rumored:false, bt:false, stage:null, tries:0, last:null };
  S.track.scoreHistory = []; S.track.rankHistory = [];
  S.turn = 1; S.m = 1; S.year = 1;
  issueKpi();
  computeAll();
  monthStart(true);
}

function spawnProject(id){
  const d = PROJ_L2.find(p=>p.id===id); if(!d) return;
  S.biz.projects.push({id:d.id, stage:0, prog:0, visits:0, gift:0, lost:false, bornAt:S.turn, landedAt:null});
  if(d.who) meet(d.who);
}

/* ---------- 考核卡 ---------- */
function issueKpiL2(){
  const b = B2();
  const g = Math.pow(b.kpiGrowth, Math.min(S.year-1, b.kpiGrowthYears));
  S.kpi.card = KPI_DEF[2].map(d => {
    const base = b.kpiTarget[d.k];
    const target = d.kind==="flow" ? Math.round(base*g) : base;
    return Object.assign({}, d, {target, actual:0, done:0, pace:0});
  });
  S.kpi.dep0 = depTotal(); S.kpi.loan0 = S.biz.loans;
  S.biz.ytd = {fee:0, profit:0};
  S.kpi.comp = 100;
  S.biz.decompDone = false;
  S.biz.outlets.forEach(o => { o.y0 = o.dep; o.target = 0; o.hit = null; o.mult = 1; });
}
function kpiActualL2(k){
  switch(k){
    case "dep":    return depTotal() - S.kpi.dep0;
    case "loan":   return S.biz.loans - S.kpi.loan0;
    case "profit": return S.biz.ytd.profit;
    case "fee":    return S.biz.ytd.fee;
    case "npl":    return r2(nplRatio());
    case "comp":   return S.kpi.comp;
  }
  return 0;
}

/* ---------- 指标分解 ---------- */
function outletPot(o){ return o.dep * B2().growth * delegK(o.mgr) * moraleK(o); }
function decompFair(){
  const tgt = S.kpi.card.find(x=>x.k==="dep").target - B2().corpShare;
  const pots = S.biz.outlets.map(outletPot), sum = pots.reduce((a,b)=>a+b,0);
  const step = B2().decomp.step;
  return {total: tgt, fair: pots.map(p => p/sum*tgt), step};
}
function decompProportional(){
  const f = decompFair();
  const arr = f.fair.map(x => Math.round(x/f.step)*f.step);
  arr[0] += f.total - arr.reduce((a,b)=>a+b,0);
  return arr;
}
function applyDecomp(alloc){
  const d = B2().decomp, f = decompFair();
  const res = [];
  S.biz.outlets.forEach((o,i) => {
    o.target = alloc[i];
    const r = f.fair[i] > 0 ? alloc[i] / f.fair[i] : 1;
    o.ratio = r2(r);
    let mor = d.moraleFit, mult = 1;
    if(r > d.over){ mor = d.moraleOver; o.overload = true; }
    else if(r > d.high){ mor = d.moraleHigh; mult = 1 + d.stretch; }
    else if(r >= 1){ mult = 1 + d.stretch; }
    else if(r < d.low){ mor = d.moraleLow; mult = 1 + d.slack; }
    o.morale = c100(o.morale + mor); o.mult = mult;
    res.push({o, r});
  });
  S.biz.decompDone = true;
  const over = res.filter(x=>x.o.overload).map(x=>x.o.name);
  log(over.length?"warn":"", `今年的存款任务拆下去了。${over.length?over.join("、")+"的负责人拿到数，没当场说话。":"四个负责人各自把数抄在本子上。"}`);
  return res;
}

/* ---------- 贷款审批队列 ---------- */
function genLoan(){
  const q = B2().queue, ts = B2().tierScore;
  const type = R() < q.microShare ? "micro" : "corp";
  const amt = Math.round(rr(q[type]) / 10) * 10;
  const coll = pick(Object.keys(ts.coll)), flow = pick(Object.keys(ts.flow)), tax = pick(Object.keys(ts.tax));
  const score = ts.coll[coll] + ts.flow[flow] + ts.tax[tax] + gauss()*ts.noise;
  let tier = score < ts.low ? "low" : (score > ts.high ? "high" : "mid");
  const it = {id:"ln"+S.monthAbs+"_"+Math.floor(R()*1e4), type, name:pick(LOAN_NAMES[type]), ind:pick(LOAN_IND[type]), amt, coll, flow, tax, tier};
  if(R() < q.relP){
    const rel = pick(LOAN_RELS);
    if(person(rel.who) && (rel.who==="zhouqm" || S.biz.outlets.some(o=>o.mgr===rel.who))){ it.rel = rel.who; it.relLine = rel.line; if(tier==="low") it.tier = "mid"; else it.tier = "high"; }
  }
  return it;
}
function fillQueue(){
  const q = B2().queue;
  const n = rint(q.min, q.max);
  S.biz.queue = [];
  for(let i=0;i<n;i++) S.biz.queue.push(genLoan());
}
function bookLoan(name, amt, tier, src){
  const b = B2();
  const def = R() < b.tierDefault[tier];
  S.loanBook.push({id:"b"+S.loanBook.length, name, amt, tier, src, lv:S.lv, at:S.monthAbs, defAt:S.monthAbs + ri(b.defaultDelay), def, done:false});
  S.biz.loans += amt;
}
function decideLoan(id, ok){
  const i = S.biz.queue.findIndex(x=>x.id===id); if(i<0) return null;
  const it = S.biz.queue[i];
  S.biz.queue.splice(i,1);
  if(ok){
    bookLoan(it.name, it.amt, it.tier, "queue");
    const fee = r1(it.amt * B2().loanFee);
    S.biz.ytd.fee += fee; S.month.fee += fee;
    if(it.rel) fav(it.rel, 3);
    log("", `批了<b>${it.name}</b>的贷款。<span class="num">贷款+${fmtWan(it.amt)}</span>`);
  } else {
    if(it.rel){ fav(it.rel, -4); log("", `退了<b>${it.name}</b>的材料。${person(it.rel).name}那边没再提这事。`); }
    else log("", `退了<b>${it.name}</b>的材料。`);
  }
  return it;
}

/* ---------- 回合开始 ---------- */
function monthStartL2(first){
  const b = B2();
  S.ap = S.apMax = BALANCE.ap[2];
  if(S.flags.apDebt){ S.ap = Math.max(0, S.ap - S.flags.apDebt); S.flags.apDebt = 0; }
  S.month = {dep0: depTotal(), loan0: S.biz.loans, npl0: S.biz.npl, fee:0, profit:0, compHit:0, newNpl:0, landed:[], defaults:[], expired:0};
  S.biz.outlets.forEach(o => { o.supervised = false; o.supFlop = false; o.dep0 = o.dep; });
  S.biz.campaignDone = false; S.biz.reported = false;
  if(!first) S.biz.budget = r1(S.biz.budget + b.budgetMonthly);
  fillQueue();
  // 新项目
  if(!S.biz.projQueue.length){
    const old = S.biz.projects.filter(p=>p.stage===3 || p.lost).map(p=>p.id);
    old.forEach(id => { const d = PROJ_L2.find(x=>x.id===id); const nid = id+"_"+S.turn; if(!PROJ_L2.find(x=>x.id===nid)){ PROJ_L2.push(Object.assign({}, d, {id:nid, name:d.name.replace(/(二期)*$/,"")+"二期", dep:Math.round(d.dep*0.7), loan:Math.round(d.loan*0.7), who:null})); S.biz.projQueue.push(nid); } });
  }
  if(!first && S.turn >= S.biz.nextProjAt && S.biz.projQueue.length && S.biz.projects.filter(p=>p.stage<3 && !p.lost).length < b.project.max){
    spawnProject(S.biz.projQueue.shift());
    S.biz.nextProjAt = S.turn + b.project.spawnEvery;
    const p = S.biz.projects[S.biz.projects.length-1], d = PROJ_L2.find(x=>x.id===p.id);
    log("", `对公看板上多了一张卡：<b>${d.name}</b>，${d.what}。`);
  }
}

/* ---------- 月末结算 ---------- */
function settleL2(){
  const b = B2(), M = S.month;
  const kmh = S.m <= 3 ? (B1().kmhMult||1) : 1;
  // 1 网点(委托:负责人去做)
  let retail = 0;
  S.biz.outlets.forEach(o => {
    const dk = delegK(o.mgr), mk = moraleK(o);
    let inc = o.dep * b.growth * dk * mk * (o.mult||1) * kmh;
    if(o.supervised && !o.supFlop) inc *= b.supervise.mult;
    inc += gauss() * o.dep * b.noise;
    if(!o.mgr) inc *= 0.5;
    o.dep = Math.round(o.dep + inc);
    o.lastInc = o.dep - o.dep0;
    const fee = o.dep * b.feeRate * dk;
    S.biz.ytd.fee += fee; M.fee += fee;
    retail += o.dep * b.retailK * dk;
    o.morale = c100(o.morale + (b.morale.home - o.morale) * b.morale.revert);
  });
  // 2 对公
  const ck = delegK(S.biz.corp.lead);
  S.biz.corp.dep = Math.round(S.biz.corp.dep * (1 + b.corpGrowth * ck));
  S.biz.projects.forEach(p => {
    if(p.lost || p.stage >= 2) return;
    if(R() < skillOf(S.biz.corp.lead) * b.project.autoK){ projAdvance(p, true); }
  });
  // 3 贷款
  S.biz.loans = Math.round(S.biz.loans * (1 - b.amort) + retail);
  const baseNew = S.biz.loans * b.nplBase.rate / 12;
  let newNpl = baseNew;
  S.loanBook.forEach(l => {
    if(l.def && !l.done && S.monthAbs >= l.defAt){
      l.done = true; newNpl += l.amt; M.defaults.push(l);
      log("bad", `<b>${l.name}</b>逾期了，进了不良。${l.lv < S.lv ? "这笔是前任手上批的。" : ""}<span class="num">不良+${fmtWan(l.amt)}</span>`);
    }
  });
  S.biz.npl = Math.max(0, Math.round(S.biz.npl * (1 - b.nplBase.resolve) + newNpl));
  M.newNpl = newNpl;
  // 4 过期的审批件
  M.expired = S.biz.queue.length; S.biz.queue = [];
  settleChalL2();
  // 5 利润
  const r = b.spread;
  const profit = depTotal() * r.dep / 12 + S.biz.loans * r.loan / 12 + M.fee - b.expense - newNpl * b.provision - (M.spent||0);
  S.biz.ytd.profit += profit; M.profit = profit; S.biz.lastProfit = profit;
  // 6 回归
  S.biz.csat = c100(S.biz.csat + (b.csatHome - S.biz.csat) * b.csatRevert);
  subsL2().forEach(p => { p.fav = c100(p.fav + (b.favHome - p.fav) * b.favRevert); });
  // 7 考核
  computeKpi(S.m);
  stepRivals(false);
  computeRank();
  computeCore();
  S.track.rankHistory.push(S.kpi.rank);
  S.track.scoreHistory.push(S.kpi.score);
  S.track.depHistory.push(Math.round(depTotal()));
  S.biz.rankStreak = (S.kpi.rank === 1) ? (S.biz.rankStreak||0)+1 : 0; rivalReact();
  S.report = {
    turn:S.turn, m:S.m, year:S.year,
    dep: depTotal(), dDep: depTotal() - M.dep0, loans:S.biz.loans, dLoan:S.biz.loans - M.loan0,
    profit, npl: nplRatio(), fee:M.fee, rank:S.kpi.rank, prevRank:S.kpi.prevRank, score:S.kpi.score,
    expired: M.expired, defaults: M.defaults.length, landed: M.landed.slice(),
    outlets: S.biz.outlets.map(o=>({name:o.name, inc:o.lastInc})),
  };
  return S.report;
}

/* 项目推进 */
function projAdvance(p, auto){
  const b = B2().project, d = PROJ_L2.find(x=>x.id===p.id);
  if(p.lost || p.stage >= 3) return null;
  if(p.stage < 2){
    p.prog++;
    if(p.prog >= b.need[p.stage]){ p.stage++; p.prog = 0; if(!auto) log("good", `<b>${d.name}</b>推到了「${PROJ_STAGES[p.stage]}」。`); else log("", `${person(S.biz.corp.lead).name}把<b>${d.name}</b>推到了「${PROJ_STAGES[p.stage]}」。`); }
    else if(!auto) log("", `<b>${d.name}</b>又往前走了一步。`);
    return {stage:p.stage};
  }
  // 审批
  const pr = Math.min(b.cap, b.approveBase - b.risk[d.tier] + p.visits*b.visit + p.gift*b.gift + (S.flags.projBonus && S.flags.projBonus[p.id] || 0));
  if(R() < pr){
    p.stage = 3; p.landedAt = S.turn;
    S.biz.corp.dep += d.dep;
    if(d.loan) bookLoan(d.name, d.loan, d.tier, "project");
    if(S.month) S.month.landed.push(d.name);
    keyEvent(`${d.name}项目落地`);
    log("gold", `<b>${d.name}</b>落地了。${d.what}，合同签在周五下午。<span class="num">存款+${fmtWan(d.dep)}${d.loan?" · 贷款+"+fmtWan(d.loan):""}</span>`);
    if(d.who) fav(d.who, 8);
    return {landed:true};
  }
  p.lost = true;
  log("bad", `<b>${d.name}</b>在分行贷审会上没过。${d.tier==="high"?"风险部的意见写了两页。":"意见只有一行：再看看。"}`);
  return {lost:true};
}

/* 年终:网点任务完成情况 */
function yearEndL2(){
  const y = B2().yearEnd;
  let all = true;
  S.biz.outlets.forEach(o => {
    const got = o.dep - o.y0;
    o.hit = o.target ? got >= o.target : true;
    if(!o.hit) all = false;
    o.morale = c100(o.morale + (o.hit ? y.hit : y.miss));
    if(o.mgr) fav(o.mgr, o.hit ? 3 : -2);
    o.lastYear = {got, target:o.target};
  });
  S.biz.allHit = all;
  S.biz.outlets.forEach(o => o.overload = false);
}
