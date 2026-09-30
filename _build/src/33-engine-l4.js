/* =====================================================================
   L4 重庆分行:引擎(按季)
   ===================================================================== */
const B4 = ()=> BALANCE.L4;
function inst(id){ return S.biz.inst.find(x=>x.id===id); }
function depTotalL4(){ return S.biz.inst.reduce((a,x)=>a+x.dep,0); }
function loansL4(){ return S.biz.inst.reduce((a,x)=>a+x.loans,0); }
function nplL4(){ return S.biz.inst.reduce((a,x)=>a+x.npl,0); }
function rwaL4(){ return loansL4() * B4().rwaK + S.biz.projects.filter(p=>!p.done).reduce((a,p)=>a+STRAT_L4.find(s=>s.id===p.id).rwa,0); }
function capRoom(){ return S.biz.capital / B4().minCar - rwaL4(); }
function deputy(line){ return S.biz.deputies.find(d=>d.line===line); }
function lineK(line){ const d = deputy(line); const L = B4().lineK; const fit = d ? d.fit[line] : 50; return (L.base + fit/100*L.k) * (0.9 + S.biz.unity/100*0.2); }
function subsL4(){ return S.biz.deputies.map(d=>person(d.id)).filter(Boolean); }
function ratingNow(){
  const r = B4().rating;
  const npl = nplL4()/loansL4()*100;
  const v = r.base + (npl - 1.3)*r.nplK - (S.kpi.comp - 90)*r.compK + (S.biz.crisisAdj||0) - (S.biz.regScore||0)*0.1 - (person("gu").fav - 50)/100;
  return clamp(r1(v), 1, 5);
}

/* ---------- 进入 L4 ---------- */
function initL4(){
  const b = B4();
  PEOPLE_L4.forEach(d => { if(!person(d.id)) S.people.push(Object.assign({lvMet:4, pos:d.role, met:true, recent:"", kind:"npc", alive:true}, d)); });
  // 班子:周启明成了你的副手
  const lines = ["corp","retail","risk","ops"];
  const deputies = DEPUTIES_L4.map((d,i) => {
    let p = person(d.id);
    if(!p){ p = Object.assign({lvMet:4, met:true, recent:"", kind:"sub", alive:true, group:"班子", fav:d.fav||50, sex:d.sex||"m", note:d.note, trait:d.trait, role:"重庆分行副行长"}, {id:d.id, name:d.name}); S.people.push(p); }
    p.pos = "重庆分行副行长"; p.kind = "sub"; p.skill = Math.round(Object.values(d.fit).reduce((a,x)=>a+x,0)/4);
    if(d.id==="zhouqm"){ p.recent = "原来是你的上级，现在是你的副手"; p.note = d.note; }
    return {id:d.id, name:d.name, line:lines[(i+1)%4], fit:d.fit};   // 起手分工不是最优,留给玩家调
  });
  const c2 = S.carry.l2 || {dep:450000, npl:0}, c3 = S.carry.l3 || {dep:4300000, npl:60000, loans:3000000, mgr:null};
  const rows = INST_L4.map(r => {
    const x = Object.assign({}, r);
    if(r.id === "na"){ x.dep = Math.round(c2.dep * 1.1); x.headName = c2.mgrName || "——"; x.skill = c2.mgrSkill || 60; x.baseNpl = c2.npl || 0; }
    else if(r.id === "wz"){ x.dep = Math.round(c3.dep * 1.05); x.headName = c3.mgrName || "——"; x.skill = c3.mgrSkill || 60; x.baseNpl = c3.npl || 0; }
    else { const h = INST_HEADS[r.head]; x.headName = h.name; x.skill = h.skill; x.baseNpl = 0; }
    x.loans = Math.round(x.dep * x.ldr);
    x.npl = Math.round(x.loans * 0.012) + (x.baseNpl||0);
    x.focus = false; x.y0 = x.dep; x.dep0 = x.dep; x.lastInc = 0;
    return x;
  });
  const loans = rows.reduce((a,x)=>a+x.loans,0);
  S.biz = {
    inst: rows, deputies, unity: b.unity.start,
    projects: [], projQueue: STRAT_L4.map(s=>s.id).filter(id => id!=="yujiang2" || (person("weilc") && person("weilc").fav >= 55)),
    capital: Math.round(loans * b.rwaK * b.capRatio),
    regScore: 0, crisisAdj: 0, crisis: {stage:0, kind:null, good:0, at: rint(b.crisisAt[0], b.crisisAt[1])},
    ytd: {profit:0, proj:0}, focusId: null, reported: false, rankStreak: 0, csat: 60,
  };
  // 陆明远去了总行
  const lu = person("lu"); if(lu){ lu.pos = "总行副行长"; lu.recent = "去了总行，位子留给你"; }
  const gu = person("gu"); if(gu){ gu.pos = "重庆监管局"; gu.recent = "调去了监管口"; meet("gu"); }
  S.rivals = RIVALS_L4.map(r => Object.assign({}, r, {shift:0, score:r.base, bonus:0}));
  S.kpi = {card:[], score:0, rank:0, history:[], ytd:{}, comp:100, dep0:0, loan0:0};
  S.chal = []; S.sched = S.sched.filter(x=>x.lv===4); S.pendingEv = [];
  S.promo = { windowAt: BALANCE.tenure[4], rumored:false, bt:false, stage:null, tries:0, last:null };
  S.track.scoreHistory = []; S.track.rankHistory = [];
  S.flags.grayAtL4 = S.flags.grayCount || 0;
  S.turn = 1; S.m = 3; S.year = 1;
  issueKpi();
  computeAll();
  monthStart(true);
}

function issueKpiL4(){
  const b = B4();
  const g = Math.pow(b.kpiGrowth, Math.min(S.year-1, b.kpiGrowthYears));
  S.kpi.card = KPI_DEF[4].map(d => {
    let target = b.kpiTarget[d.k];
    if(d.kind==="flow") target = Math.round(target*g);
    return Object.assign({}, d, {target, actual:0, done:0, pace:0});
  });
  S.kpi.scale0 = depTotalL4() + loansL4();
  S.biz.ytd = {profit:0, proj:0};
  S.kpi.comp = 100;
  S.biz.inst.forEach(x => { x.y0 = x.dep; });
  S.biz.expenseQ = depTotalL4() * b.expenseRate / 4;
}
function kpiActualL4(k){
  switch(k){
    case "profit": return S.biz.ytd.profit;
    case "scale":  return depTotalL4() + loansL4() - S.kpi.scale0;
    case "npl":    return r2(nplL4()/loansL4()*100);
    case "roe":    return r1(S.biz.ytd.profit * (12/Math.max(3,S.m)) / S.biz.capital * 100);
    case "rating": return ratingNow();
    case "proj":   return S.biz.ytd.proj;
    case "comp":   return S.kpi.comp;
  }
  return 0;
}

function monthStartL4(first){
  S.ap = S.apMax = BALANCE.ap[4];
  if(S.flags.apDebt){ S.ap = Math.max(0, S.ap - S.flags.apDebt); S.flags.apDebt = 0; }
  S.month = {dep0: depTotalL4(), loan0: loansL4(), profit:0, spent:0, newNpl:0, defaults:[]};
  S.biz.inst.forEach(x => x.dep0 = x.dep);
  S.biz.reported = false;
}

function settleL4(){
  const b = B4(), M = S.month;
  const kR = lineK("retail"), kC = lineK("corp"), kRisk = lineK("risk"), kOps = lineK("ops");
  const room = capRoom();
  let newNpl = 0;
  S.biz.inst.forEach(x => {
    const dk = 0.6 + x.skill/100*0.6;
    let inc = x.dep * b.growthQ * x.g * dk * kR * (x.focus ? b.focus : 1) + gauss()*x.dep*0.002;
    x.dep = Math.round(x.dep + inc); x.lastInc = x.dep - x.dep0;
    const want = Math.max(0, x.dep * x.ldr - x.loans) + x.loans * b.growthQ * 0.5 * kC;
    x.loans = Math.round(x.loans + (room > 0 ? want * 0.5 : 0));
    const nn = x.loans * b.nplRate / 4 / kRisk;
    x.npl = Math.round(x.npl * (1 - b.nplResolveQ) + nn); newNpl += nn;
  });
  // 跨关旧账:南岸(L2)和万州(L3)批的贷款
  (S.loanBook||[]).forEach(l => {
    if(!l.def || l.done || S.monthAbs < l.defAt) return;
    l.done = true;
    const row = l.lv === 2 ? inst("na") : (l.lv === 3 ? inst("wz") : null);
    if(!row) return;
    row.npl += l.amt; newNpl += l.amt; M.defaults.push(l);
    log("bad", `${row.name}报上来一笔不良：<b>${l.name}</b>，${fmtWan(l.amt)}。${l.lv===2?"批的时候，南岸的行长是你。":"这笔是你在万州签的。"}`);
  });
  // 战略项目
  S.biz.projects.forEach(p => {
    if(p.done) return;
    if(R() < skillOfDeputy("corp") * b.proj.autoK) p.prog++;
    if(p.prog >= STRAT_L4.find(s=>s.id===p.id).q) finishProject(p);
  });
  // 利润(税后)
  const dep = depTotalL4(), loans = loansL4();
  const pre = dep*b.spreadDep/4 + loans*b.spreadLoan/4 + dep*b.feeRate/4 - S.biz.expenseQ - newNpl*b.provision - (M.spent||0) + (M.once||0);
  const profit = pre * (1 - b.tax);
  S.biz.ytd.profit += profit; M.profit = profit; M.newNpl = newNpl;
  settleChalGeneric();
  S.kpi.comp = c100(S.kpi.comp + (kOps - 1) * 10);
  S.biz.unity = c100(S.biz.unity + (60 - S.biz.unity)*0.05);
  S.biz.csat = c100(S.biz.csat + (60 - S.biz.csat)*0.1 - (S.biz.crisisAdj||0)*2);
  subsL4().forEach(p => { p.fav = c100(p.fav + (55 - p.fav)*0.03); });
  computeKpi(S.m);
  stepRivals(false);
  computeRank();
  computeCore();
  S.track.rankHistory.push(S.kpi.rank);
  S.track.scoreHistory.push(S.kpi.score);
  S.track.depHistory.push(Math.round(dep));
  S.biz.rankStreak = (S.kpi.rank === 1) ? (S.biz.rankStreak||0)+1 : 0;
  S.report = {turn:S.turn, q:qName(), dep, dDep:dep-M.dep0, loans, dLoan:loans-M.loan0, profit, npl:nplL4()/loans*100,
    rating:ratingNow(), rank:S.kpi.rank, prevRank:S.kpi.prevRank, score:S.kpi.score, capRoom:capRoom(), defaults:M.defaults.map(l=>l.name)};
  return S.report;
}
function skillOfDeputy(line){ const d = deputy(line); return d ? d.fit[line] : 50; }
function finishProject(p){
  const s = STRAT_L4.find(x=>x.id===p.id);
  p.done = true; S.biz.ytd.proj++;
  const yy = inst("yyb"); yy.dep += Math.round(s.scale*0.6); yy.loans += Math.round(s.scale*0.4);
  if(S.month) S.month.once = (S.month.once||0) + s.profitOnce;
  S.flags.projDone = (S.flags.projDone||0) + 1;
  if(s.who) fav(s.who, 10);
  keyEvent(`${s.name}落地`);
  log("gold", `<b>${s.name}</b>落地了。签约仪式在分行十九楼，总行来了一位部门总经理。<span class="num">规模+${fmtYi(s.scale)}</span>`);
}
function yearEndL4(){
  S.biz.ratingY = Math.round(ratingNow());
  S.flags.rating1 = S.flags.rating1 || S.biz.ratingY === 1;
}
