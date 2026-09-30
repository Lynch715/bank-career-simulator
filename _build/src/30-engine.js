/* =====================================================================
   引擎:随机数、状态、工具函数
   ===================================================================== */
const HEADLESS = (typeof document === "undefined");
let FORCE_HL = false;
const isHL = () => HEADLESS || FORCE_HL;
let S = null;
let R = Math.random;

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function seedRng(seed){ R = mulberry32(seed>>>0); }
const rint = (a,b)=> a + Math.floor(R()*(b-a+1));
const rr = (arr)=> arr[0] + R()*(arr[1]-arr[0]);
const ri = (arr)=> rint(arr[0], arr[1]);
const pick = (arr)=> arr[Math.floor(R()*arr.length)];
const clamp = (v,a,b)=> Math.max(a, Math.min(b, v));
const c100 = v => clamp(v, 0, 100);
const gauss = ()=>{ let u=0,v=0; while(!u) u=R(); while(!v) v=R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const r1 = v => Math.round(v*10)/10;
const r2 = v => Math.round(v*100)/100;
const B1 = ()=> BALANCE.L1;

/* ---------- 数字格式 ---------- */
function fmtWan(v){ // 万元 → 合适单位
  const a = Math.abs(v);
  if(a >= 10000) return (v/10000).toFixed(2) + "亿";
  if(a >= 100) return Math.round(v) + "万";
  return r1(v) + "万";
}
function fmtYi(v){ return (v/10000).toFixed(2) + "亿"; }
function sgn(v, f){ return (v>=0?"+":"") + (f?f(v):v); }

/* ---------- 新局 ---------- */
function newGame(opts){
  opts = opts || {};
  const seed = opts.seed != null ? opts.seed : Math.floor(Math.random()*1e9);
  seedRng(seed);
  const b = B1();
  S = {
    ver: BALANCE.ver, seed,
    player: { sur: opts.sur || "李", given: opts.given || "然" },
    lv: 1, phase: "play",
    turn: 1, monthAbs: 0, m: 1, year: 1,
    age: BALANCE.start.age, careerYear: BALANCE.start.careerYear,
    ap: BALANCE.ap[1], apMax: BALANCE.ap[1],
    core: { perf: 50, rep: 60, trust: 45, clean: 100 },
    kpi: { card: [], score: 0, rank: 0, history: [], depStart: 0, ytd: {fee:0, cust:0, card:0}, comp: b.compStart },
    biz: {},
    people: [],
    staff: [],
    rivals: [],
    flags: {}, log: [], milestones: {},
    promo: { windowAt: BALANCE.tenure[1], rumored:false, bt:false, stage:null, tries:0, last:null },
    track: { keyEvents: [], depHistory: [], rankHistory: [], scoreHistory: [] },
    sched: [], pendingEv: [], evDone: {}, evLast: {},
    chal: [],
    month: null,       // 本月流量
    report: null,
    over: null,
    carry: null,
  };
  initL1();
  issueKpi();
  computeAll();
  S.track.depHistory.push(Math.round(depTotal()));
  log("", `入行第${S.careerYear}年，你${S.age}岁，到弹子石网点当负责人。第一天，何静把钥匙交给你：「小${S.player.sur}，尾箱在左边第二个柜子。」`);
  monthStart(true);
  return S;
}

function initL1(){
  const b = B1();
  // 员工
  S.staff = STAFF_L1.map(s => Object.assign({}, s, {off:0, trained:0}));
  // 客户卡
  const cards = [];
  CUST_FIXED.forEach(c => cards.push(Object.assign({maint:false, complain:0, fixed:true}, c)));
  let ni = 0;
  while(cards.length < 40){
    const type = CUST_TYPE_SEQ[cards.length % CUST_TYPE_SEQ.length];
    const T = CUST_TYPES[type];
    cards.push({
      id: "c"+cards.length, name: CUST_NAMES[ni++ % CUST_NAMES.length], type,
      risk: ri(T.risk), own: Math.round(rr(T.own)), other: Math.round(rr(T.other)),
      due: rint(1,12), rel: ri(T.rel), maint:false, complain:0,
    });
  }
  const cardSum = cards.reduce((a,c)=>a+c.own, 0);
  S.biz = {
    base: b.depStart - cardSum,
    cards,
    budget: b.budgetMonthly,
    csat: b.csatStart,
    prospects: PAYROLL_PROSPECTS.map(p => Object.assign({tries:0, won:false}, p)),
    payrollInflow: 0,
    task: null, taskDone: false,
    rallied: false, bossDone: false,
    noErrStreak: 0,
    timepoint: 0,
  };
  // 对手
  S.rivals = RIVALS_L1.map(r => Object.assign({}, r, {shift:0, score:r.base, bonus:0}));
  // 人脉
  S.people = [];
  PEOPLE_DEF.forEach(p => S.people.push(Object.assign({lvMet:1, pos:p.role, met:!p.hidden, recent:"", arc:0, alive:true, kind:"npc"}, p)));
  S.staff.forEach(s => S.people.push({id:s.id, name:s.name, role:ROLE_NAME[s.role], group:"部下", lvMet:1, pos:"弹子石网点"+ROLE_NAME[s.role],
    fav:s.fav, note:s.note, met:true, recent:"", kind:"staff", alive:true}));
  ["zhangxf","ranguoq"].forEach(id => {
    const c = cards.find(x=>x.id===id);
    S.people.push({id, name:c.name, role:"客户", group:"客户", lvMet:1, pos:c.id==="ranguoq"?"冉记老灶老板":"退休", fav:c.rel, note:c.note, met:true, recent:"", kind:"cust", alive:true});
  });
}

/* ---------- 取值 ---------- */
function depTotal(){ return [null,depTotalL1,depTotalL2,depTotalL3,depTotalL4,depTotalL5][S.lv](); }
function depTotalL1(){ return S.biz.base + S.biz.cards.reduce((a,c)=>a+c.own, 0) + S.biz.timepoint; }
function person(id){ return S.people.find(p=>p.id===id); }
function staff(id){ return S.staff.find(s=>s.id===id); }
function staffByRole(role){ return S.staff.filter(s=>s.role===role && s.off!==S.turn); }
function card(id){ return S.biz.cards ? S.biz.cards.find(c=>c.id===id) : null; }
function nick(){ return titleOf(S); }
function pr(s){ return s.sex==="m" ? "他" : "她"; }

/* ---------- 改数 ---------- */
function log(cls, html){
  S.log.unshift({t:S.turn, y:S.year, cy:S.careerYear, m:S.m, lv:S.lv, cls, html});
  if(S.log.length > 160) S.log.length = 160;
}
function fav(id, d){
  const p = person(id); if(!p) return;
  p.fav = c100(p.fav + d);
  const s = staff(id); if(s) s.fav = p.fav;
  const c = card(id); if(c) c.rel = p.fav;
}
function sfav(id, d){ const s = staff(id); if(!s) return; s.fav = c100(s.fav + d); const p = person(id); if(p) p.fav = s.fav; }
function allStaffFav(d){ S.staff.forEach(s => sfav(s.id, d)); }
function meet(id){ const p = person(id); if(p && !p.met){ p.met = true; p.lvMet = S.lv; } }
function dirt(n){ S.core.clean = c100(S.core.clean - n); S.flags.grayCount = (S.flags.grayCount||0)+1; }
function depAdd(v){ S.biz.base += v; }
function feeAdd(v){ S.kpi.ytd.fee += v; S.month.fee += v; }
function custAdd(v){ v = Math.round(v); S.kpi.ytd.cust += v; S.month.cust += v; }
function cardAdd(v){ v = Math.round(v); S.kpi.ytd.card += v; S.month.card += v; }
function csatAdd(v){ S.biz.csat = c100(S.biz.csat + v); }
function compAdd(v){ S.kpi.comp = c100(S.kpi.comp + v); if(v<0) S.month.compHit += -v; }
function budgetAdd(v){ S.biz.budget = Math.max(0, r2(S.biz.budget + v)); }
function apUse(n){ S.ap = Math.max(0, S.ap - (n||1)); }
function keyEvent(txt){ S.track.keyEvents.push({lv:S.lv, turn:S.turn, age:S.age, txt}); }
function schedule(id, delay, data){ S.sched.push({id, at:S.turn + delay, data:data||null, lv:S.lv}); }
function resetNoErr(){ S.biz.noErrStreak = 0; }

/* ---------- 考核卡 ---------- */
function issueKpi(){ const r = [null,issueKpiL1,issueKpiL2,issueKpiL3,issueKpiL4,issueKpiL5][S.lv](); whipTargets(); return r; }
function issueKpiL1(){
  const b = B1();
  const g = Math.pow(b.kpiGrowth, Math.min(S.year-1, b.kpiGrowthYears));
  S.kpi.card = KPI_DEF[1].map(d => {
    const base = b.kpiTarget[d.k];
    const target = d.kind==="flow" ? Math.round(base*g) : base;
    return Object.assign({}, d, {target, actual:0, done:0, pace:0});
  });
  S.kpi.depStart = depTotal() - S.biz.timepoint;
  S.kpi.ytd = {fee:0, cust:0, card:0};
  S.kpi.comp = b.compStart;
}
function monthsInYear(){ return S.m; }   // 结算时:本年已过月数(含本月)
function kpiActual(k){
  if(S.lv===2) return kpiActualL2(k);
  if(S.lv===3) return kpiActualL3(k);
  if(S.lv===4) return kpiActualL4(k);
  if(S.lv===5) return kpiActualL5(k);
  switch(k){
    case "dep":  return depTotal() - S.kpi.depStart;
    case "fee":  return S.kpi.ytd.fee;
    case "cust": return S.kpi.ytd.cust;
    case "card": return S.kpi.ytd.card;
    case "csat": return S.biz.csat;
    case "comp": return S.kpi.comp;
  }
  return 0;
}
function computeKpi(elapsed){
  const cap = BALANCE.kpiCap;
  let score = 0;
  S.kpi.card.forEach(it => {
    it.actual = kpiActual(it.k);
    it.done = it.target ? it.actual / it.target : 0;
    if(it.kind==="flow"){
      const exp = it.target * elapsed / 12;
      it.pace = exp>0 ? clamp(it.actual/exp, 0, cap) : 0;
    } else if(it.kind==="lower"){
      it.done = it.actual > 0 ? it.target / it.actual : cap;
      it.pace = clamp(it.done, 0, cap);
    } else if(it.kind==="floor"){
      it.pace = clamp(it.done, 0, 1);      // 达标即可,多了不加分
    } else {
      it.pace = clamp(it.done, 0, cap);
    }
    score += it.pace * it.w;
  });
  S.kpi.score = r1(score);
  return S.kpi.score;
}

/* ---------- 对手与排名 ---------- */
function stepRivals(newYear){
  const cfg = BALANCE["rivalL"+S.lv] || BALANCE.rivalL1;
  S.rivals.forEach(r => {
    if(newYear) r.shift += (STYLE_TREND[r.style]||0)*cfg.trendSd + gauss()*cfg.yearShift;
    r.score = r1(r.base + r.shift + gauss()*cfg.sd + (r.bonus||0) + (r.chase||0));
    r.bonus = 0;
  });
}
function computeRank(){
  if(S.lv===5) return computeRankL5();
  const list = S.rivals.map(r=>({id:r.id, name:r.name, boss:r.boss, score:r.score, me:false}));
  list.push({id:"me", name:myUnitName(), boss:S.player.sur+S.player.given, score:S.kpi.score, me:true});
  list.sort((a,b)=>b.score-a.score);
  const rank = list.findIndex(x=>x.me) + 1;
  S.kpi.prevRank = S.kpi.rank || rank;
  S.kpi.rank = rank;
  S.kpi.table = list;
  return rank;
}

/* ---------- 四项核心值 ---------- */
function computeCore(){
  const c = BALANCE.core;
  if(S.track.scoreHistory.length) S.core.perf = Math.round(c100((S.kpi.score - c.perfFrom) * c.perfK));
  const subs = subordinates();
  const favAvg = subs.length ? subs.reduce((a,s)=>a+s.fav,0)/subs.length : 50;
  S.core.rep = Math.round(c100(favAvg*c.repStaff + S.biz.csat*c.repCsat));
  const w = c.trustByLv[S.lv] || c.trustByLv[1];
  S.track.minClean = Math.min(S.track.minClean==null?100:S.track.minClean, S.core.clean);
  S.core.trust = Math.round(c100(Object.entries(w).reduce((a,[id,k]) => a + (person(id) ? person(id).fav : 50) * k, 0)));
}
function computeAll(){ computeKpi(Math.max(1, S.m)); stepRivals(false); computeRank(); computeCore(); }

/* ---------- 回合开始 ---------- */
function supId(){ return [null,"huang","zhouqm","lu","lu","songwy"][S.lv]; }
function myUnitName(){ return [null,"弹子石网点","南岸支行","万州分行","重庆分行","泰和银行"][S.lv] || ""; }
function subordinates(){ return [null,()=>S.staff,subsL2,subsL3,subsL4,subsL5][S.lv](); }
function monthStart(first){ return [null,monthStartL1,monthStartL2,monthStartL3,monthStartL4,monthStartL5][S.lv](first); }
function monthStartL1(first){
  const b = B1();
  S.ap = S.apMax = BALANCE.ap[S.lv];
  if(S.flags.apDebt){ S.ap = Math.max(0, S.ap - S.flags.apDebt); S.flags.apDebt = 0; }
  S.month = {dep0: depTotal(), fee:0, cust:0, card:0, compHit:0, errors:0, lost:0, events:[]};
  S.biz.rallied = false; S.biz.rallyFlop = false; S.biz.bossDone = false;
  S.biz.cards.forEach(c => c.maint = false);
  if(!first) budgetAdd(b.budgetMonthly);
  // 临时任务
  S.biz.task = (R() < b.task.chance) ? pick(TASKS_L1) : null;
  S.biz.taskDone = false;
}

/* ---------- 月末结算 ---------- */
function settleMonth(){ return [null,settleL1,settleL2,settleL3,settleL4,settleL5][S.lv](); }
function settleL1(){
  const b = B1(), rl = b.role;
  const M = S.month;
  const kmh = (S.m <= 3) ? (b.kmhMult||1) : 1;
  // 1 员工产出
  S.staff.forEach(s => {
    if(s.off === S.turn) return;
    const eff = (1 - s.fatigue/b.fatigueDiv) * (S.biz.rallied ? (S.biz.rallyFlop ? 1 + (b.rally.mult-1)*BALANCE.odds.L1.rally.flopMult : b.rally.mult) : 1) * kmh;
    if(s.role==="teller"){
      csatAdd((rl.teller.csatBase + (s.op-5)*rl.teller.csatK) * 0.5);
      custAdd(s.mk * rl.teller.custK * eff);
      const pErr = Math.max(rl.teller.errMin, rl.teller.errBase + (6-s.op)*rl.teller.errSkill + s.fatigue*rl.teller.errFat - s.cp*rl.teller.errComp);
      if(R() < pErr){ M.errors++; compAdd(-3); }
    } else if(s.role==="lobby"){
      custAdd(s.mk * rl.lobby.custK * eff);
      cardAdd(s.mk * rl.lobby.cardK * eff);
      depAdd(s.mk * rl.lobby.depK * eff);
      csatAdd(rl.lobby.csatBase + (s.mk-5)*rl.lobby.csatK);
    } else if(s.role==="wealth"){
      feeAdd(s.mk * rl.wealth.feeK * eff);
      depAdd(s.mk * rl.wealth.depK * eff);
    } else if(s.role==="cm"){
      custAdd(s.mk * rl.cm.custK * eff);
      depAdd(s.mk * rl.cm.depK * eff);
      cardAdd(s.mk * rl.cm.cardK * eff);
    }
  });
  if(!staffByRole("lobby").length) csatAdd(-2);
  if(!staffByRole("teller").length) csatAdd(-4);
  if(M.errors){ resetNoErr(); } else { S.biz.noErrStreak++; }
  // 2 客户到期
  const cb = b.card;
  S.biz.cards.forEach(c => {
    if(c.due === S.m && !c.maint && c.own > 0){
      const keep = cb.retainBase + c.rel*cb.retainRel;
      if(R() > keep){
        const out = Math.round(c.own * cb.leaveShare);
        c.own -= out; c.other += out; M.lost += out;
        c.rel = c100(c.rel - 5);
      }
    }
    if(!c.maint) c.rel = c100(c.rel - cb.relDecay*0.3);
    c.other = Math.round(c.other * (1 + cb.otherRegrow));
  });
  // 3 自然流动 + 代发沉淀
  depAdd(b.drift.mean + gauss()*b.drift.sd + S.biz.payrollInflow);
  // 4 满意度回归
  S.biz.csat = c100(S.biz.csat + (b.csatHome - S.biz.csat)*b.csatRevert);
  // 5 临时任务
  if(S.biz.task && !S.biz.taskDone){ fav("huang", b.task.miss); M.taskMissed = true; }
  // 6 挑战
  S.chal = S.chal.filter(ch => {
    if(S.turn < ch.due) return true;
    const got = depTotal() - ch.start;
    if(got >= ch.target){ fav("huang", ch.win); log("good", `${ch.title}：净增${fmtWan(got)}，任务完成。黄世海在群里说了句「弹子石可以」。`); }
    else { fav("huang", ch.lose); log("bad", `${ch.title}：只做到${fmtWan(got)}，差${fmtWan(ch.target-got)}。黄世海在例会上没点你的名，点了一句「有些网点报数不负责」。`); }
    return false;
  });
  // 7 员工恢复
  S.staff.forEach(s => {
    s.fatigue = c100(s.fatigue - b.fatigueRecover + (S.biz.rallied ? 0 : 0));
    s.fav = c100(s.fav + (b.favHome - s.fav) * 0.02);
    const p = person(s.id); if(p) p.fav = s.fav;
  });
  // 8 考核
  const newYear = false;
  computeKpi(S.m);
  stepRivals(newYear);
  computeRank();
  computeCore();
  S.track.rankHistory.push(S.kpi.rank);
  S.track.scoreHistory.push(S.kpi.score);
  S.track.depHistory.push(Math.round(depTotal()));
  S.biz.rankStreak = (S.kpi.rank === 1) ? (S.biz.rankStreak||0)+1 : 0; rivalReact();
  // 9 本月报告
  const rep = {
    turn:S.turn, m:S.m, year:S.year,
    dep: depTotal(), dDep: depTotal() - M.dep0,
    fee: M.fee, cust: M.cust, card: M.card, errors: M.errors, lost: M.lost,
    rank: S.kpi.rank, prevRank: S.kpi.prevRank, score: S.kpi.score,
    taskMissed: !!M.taskMissed,
  };
  S.report = rep;
  // 10 时点存款回吐(结算后再退,下月初体现)
  return rep;
}

/* ---------- 里程碑 ---------- */
function checkMilestones(atSettle){
  const got = [];
  const lvMs = MILESTONES[S.lv] || [];
  const test = {
    dep35:  ()=> depTotal() - S.biz.timepoint >= B1().depMilestone,
    payroll:()=> S.biz.prospects.some(p=>p.won),
    noerr:  ()=> S.biz.noErrStreak >= B1().streakNoError,
    fanzha: ()=> !!S.flags.fanzhaSaved,
    rank1q: ()=> atSettle && S.m % 3 === 0 && S.kpi.rank === 1,
    dep45:  ()=> depTotal() >= BALANCE.L2.depMilestone,
    proj1:  ()=> S.biz.projects && S.biz.projects.some(p=>p.stage===3),
    allhit: ()=> !!S.biz.allHit,
    npl1:   ()=> atSettle && S.m===12 && nplRatio() < BALANCE.L2.nplMilestone,
    rank3q: ()=> atSettle && S.m % 3 === 0 && S.kpi.rank <= 3,
    wz_new: ()=> !!S.flags.wzNewPaid,
    wz_npl: ()=> atSettle && nplL3()/loansTotalL3()*100 < 1.5,
    wz_dep: ()=> depTotal() >= 4500000,
    wz_all: ()=> atSettle && S.m===12 && !!S.biz.allGrow,
    wz_rank:()=> atSettle && S.kpi.rank <= 3,
    cq_proj:()=> (S.flags.projDone||0) > 0,
    cq_r1:  ()=> !!S.flags.rating1,
    cq_unity:()=> S.biz.unity >= 80,
    cq_crisis:()=> !!S.flags.crisisGood,
    cq_rank:()=> atSettle && S.kpi.rank <= 3,
  };
  lvMs.forEach(ms => {
    if(S.milestones[ms.id]) return;
    if(test[ms.id] && test[ms.id]()){
      S.milestones[ms.id] = {turn:S.turn, age:S.age, lv:S.lv};
      const rw = ms.reward || {};
      if(rw.rep){ if(S.lv>=2) subordinates().forEach(x=>fav(x.id, rw.rep)); else allStaffFav(rw.rep); }
      if(rw.sup) fav(supId(), rw.sup);
      if(rw.huang) fav("huang", rw.huang);
      if(rw.lu){ meet("lu"); fav("lu", rw.lu); }
      if(rw.gu){ meet("gu"); fav("gu", rw.gu); }
      if(rw.budget) budgetAdd(rw.budget);
      keyEvent(ms.stmt);
      log("gold", `里程碑 · <b>${ms.name}</b>。${ms.ceremony}`);
      got.push(ms);
    }
  });
  computeCore();
  return got;
}
