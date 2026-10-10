/* =====================================================================
   流程:任务队列、弹窗、回合管线
   ===================================================================== */
let JOBS = [], jobBusy = false;
function job(fn){ JOBS.push(fn); }
function runJobs(){
  if(jobBusy) return;
  while(JOBS.length){
    const f = JOBS.shift();
    let finished = false, sync = true;
    jobBusy = true;
    f(()=>{ finished = true; jobBusy = false; if(!sync) runJobs(); });
    sync = false;
    if(!finished) return;
  }
  if(!isHL() && typeof UI !== "undefined") UI.refresh();
}

/* 弹窗:无头时由 BOT 选 */
let BOT = null;
function ask(spec, done){
  if(isHL()){
    const opts = spec.opts || [{t:"好"}];
    let i = BOT ? BOT.choose(spec) : 0;
    if(i == null || !opts[i] || opts[i].disabled) i = opts.findIndex(o=>!o.disabled);
    const o = opts[Math.max(0,i)];
    if(o && o.fn) o.fn();
    if(done) done();
    return;
  }
  UI.modal(spec, done);
}

/* ---------- 事件挑选 ---------- */
function evPool(){ return [null,EVENTS,EVENTS_L2,EVENTS_L3,EVENTS_L4,EVENTS_L5][S.lv] || []; }
function evDef(id){ return evPool().find(e=>e.id===id) || EVENTS.concat(EVENTS_L2,EVENTS_L3,EVENTS_L4,EVENTS_L5).find(e=>e.id===id); }
function eligible(e){
  if(e.once && S.evDone[e.id]) return false;
  if(e.cd && S.evLast[e.id] && S.turn - S.evLast[e.id] < e.cd) return false;
  try { return !!e.when(S); } catch(err){ return false; }
}
function pickEvents(){
  const b = BALANCE.story;
  const out = [];
  const has = id => out.some(x=>x.id===id);
  while(S.pendingEv.length) out.push(S.pendingEv.shift());
  S.sched = S.sched.filter(x => {
    if(x.lv && x.lv !== S.lv) return false;
    if(x.at > S.turn) return true;
    if(x.id === "rookie"){ addRookie(); return false; }
    out.push({id:x.id, data:x.data, later:true});
    return false;
  });
  evPool().filter(e => e.fixed && !has(e.id) && eligible(e)).forEach(e => out.push({id:e.id, data:e.pick?e.pick(S):null}));
  if(R() < b.randomP){
    const pool = evPool().filter(e => !e.fixed && !has(e.id) && eligible(e));
    if(pool.length){
      const tot = pool.reduce((a,e)=>a+(e.weight||1),0);
      let x = R()*tot;
      for(const e of pool){ x -= (e.weight||1); if(x<=0){ out.push({id:e.id, data:e.pick?e.pick(S):null}); break; } }
    }
  }
  if(S.lv===4 && S.biz.crisis && !S.biz.crisis.done && S.turn >= S.biz.crisis.at){
    if(!S.biz.crisis.kind) S.biz.crisis.kind = crisisKind();
    out.unshift({id:"crisis", data:null, later:true, crisis:true});
  }
  const show = out.slice(0, b.perTurn);
  S.pendingEv = out.slice(b.perTurn);
  show.forEach(x => { if(!x.later){ S.evDone[x.id] = true; S.evLast[x.id] = S.turn; } });
  return show;
}
function eventSpec(x){
  if(x.crisis || x.id==="crisis") return crisisEventSpec();
  if(x.later){
    const L = EVENTS_LATER[x.id];
    return applyEventOdds({kind:"event", id:x.id, title:L.title, body:L.body(S, x.data||{}), opts:L.opts(S, x.data||{})}, x.id, x.data);
  }
  const e = evDef(x.id);
  return applyEventOdds({kind:"event", id:x.id, title:e.title, body:e.body(S, x.data||{}), opts:e.opts(S, x.data||{})}, x.id, x.data);
}
function addRookie(){
  if(S.staff.length >= STAFF_L1.length) return;
  const base = S.staff.some(s=>s.id===ROOKIE_L1.id) ? Object.assign({}, ROOKIE_L1, {id:"rk"+S.turn, name:pick(["吴悠","马晓","孙一","钱朵"])}) : Object.assign({}, ROOKIE_L1);
  S.staff.push(Object.assign({off:0, trained:0}, base));
  S.people.push({id:base.id, name:base.name, role:ROLE_NAME[base.role], group:"部下", lvMet:S.lv, pos:"弹子石网点"+ROLE_NAME[base.role], fav:base.fav, note:base.note, met:true, recent:"", kind:"staff", alive:true});
  log("", `新人${base.name}到岗。${base.note}`);
}

/* ---------- 回合管线 ---------- */
function endTurn(){
  if(S.phase !== "play" || jobBusy || JOBS.length) return;
  job(d => { settleMonth(); S.report.ms = checkMilestones(true); d(); });
  job(d => ask(reportSpec(), d));
  job(d => { if(S.m === 12){ yearEnd(); ask(yearSpec(), d); } else d(); });
  job(d => { checkBreakthrough(); d(); });
  job(d => { if(S.m === 12) auditCheck(); d(); });
  job(d => { if(S.lv===5 && S.turn >= BALANCE.tenure[5]){ endGame(finalL5()); } d(); });
  job(d => { if(S.phase==="play" && S.turn >= S.promo.windowAt) runPromo(d); else d(); });
  job(d => offerSidestep(d));
  job(d => { if(S.phase === "play"){ if(S.justEntered){ S.justEntered = false; levelStartJobs(); } else advance(); } d(); });
  runJobs();
}
function offerSidestep(d){
  const key = "sideOffered" + S.lv;
  if(S.phase !== "play" || S.justEntered || S.promo.tries < 2 || S.flags[key]) return d();
  S.flags[key] = true;
  const T = SIDESTEP[S.lv];
  ask({kind:"event", title:T.title, body:T.body(S), opts:[
    {t:T.stay, s:"留在这里，等下一个窗口"},
    {t:T.go, s:"这一局到此为止", fn:()=>endGame("side")},
  ]}, d);
}
function levelStartJobs(){
  job(d => ask(kpiSpec(), d));
  if(S.lv === 2) job(d => decompAsk(d));
  if(S.lv === 5) job(d => eventChain(d));     // 总行第一回合:交接、战略会
  job(d => { computeCore(); save(); d(); });
}

function advance(){
  if(S.biz.timepoint){
    S.biz.timepoint = 0;
    log("warn", "十月一号早上九点，那三千万转走了。存款日报上，弹子石的数掉回原处。");
  }
  const step = BALANCE.turnMonths[S.lv] || 1;
  S.turn++; S.monthAbs += step;
  S.m += step;
  let newYear = false;
  if(S.m > 12){ S.m -= 12; S.year++; newYear = true; }
  syncAge();
  monthStart(false);
  if(newYear){ issueKpi(); stepRivals(true); }
  computeCore();
  if(S.lv < 5 && Math.random() < 0.6) log("group", pickLine([null,"group","groupL2","groupL3","groupL4"][S.lv]));
  if(S.lv===5 && S.turn+1 >= BALANCE.L5.cut.from && S.turn < BALANCE.tenure[5]) log("group", "【同业消息】央行下调贷款市场报价利率，各行息差再压一截。");
  if(newYear) job(d => ask(kpiSpec(), d));
  if(newYear && S.lv===2) job(d => decompAsk(d));
  job(d => { rumorCheck(d); });
  job(d => meetChain(d));
  job(d => eventChain(d));
  job(d => { computeCore(); save(); d(); });
}
function eventChain(d){
  const evs = pickEvents();
  // 顺延到这回合的事件,条件可能已经不成立了(比如负责人换了),再查一遍;正文出错的也跳过
  let chain = evs.filter(x => { if(x.later || x.crisis) return true; const e = evDef(x.id); try { return !e.when || !!e.when(S); } catch(err){ return false; } })
    .map(x => (dd => { let sp; try { sp = eventSpec(x); } catch(err){ return dd(); } ask(sp, dd); }));
  const runChain = () => { const f = chain.shift(); if(!f){ d(); return; } f(runChain); };
  runChain();
}
function syncAge(){ const y = Math.floor(S.monthAbs/12); S.age = BALANCE.start.age + y; S.careerYear = BALANCE.start.careerYear + y; }
function pickLine(kind){ const a = LINES[kind]; return a[Math.floor(Math.random()*a.length)]; }

/* ---------- 弹窗内容 ---------- */
function reportSpec(){ return [null,reportSpecL1,reportSpecL2,reportSpecL3,reportSpecL4,reportSpecL5][S.lv](); }
function reportSpecL1(){
  const r = S.report;
  const arrow = r.rank < r.prevRank ? "↑" : (r.rank > r.prevRank ? "↓" : "→");
  const rows = [
    ["存款", fmtYi(r.dep), sgn(Math.round(r.dDep), v=>fmtWan(v))],
    ["中收", fmtWan(r.fee), ""],
    ["新增有效客户", r.cust+"户", ""],
    ["信用卡+代发", r.card+"户", ""],
    ["支行排名", `第${r.rank}名`, arrow],
  ];
  const notes = [];
  if(r.errors) notes.push(`柜面差错${r.errors}笔。`);
  if(r.lost > 0) notes.push(`到期没接住的客户转走了${fmtWan(r.lost)}。`);
  if(r.taskMissed) notes.push("支行的临时任务没办，黄世海在群里催了一次。");
  const quiet = !r.ms.length && !notes.length;
  return {kind:"report", title:`${S.m}月 · 月报`, rows, ms:r.ms, notes, quiet: quiet ? pickLine("quiet") : "",
    opts:[{t:S.m===12?"看年终考核":"下个月"}]};
}
function kpiSpec(){
  return {kind:"kpi", title:`入行第${S.careerYear}年 · 考核卡`,
    body:`${[null,"支行","分行","分行","总行","董事会"][S.lv]}把今年的考核卡发下来了。${S.year>1 && S.lv<5?(S.kpi.whipped===S.year?"去年你排第一，今年的目标比别人多压了一截。":"目标比去年上浮了一截。"):""}${S.year>1 && S.lv===5?"降息压着，目标没往上加。":""}`,
    items:S.kpi.card.map(it=>({name:it.name, w:it.w, target:it.target, unit:it.unit})),
    opts:[{t:"收到"}]};
}
/* 年底审计:干净度太低,每年有一定概率被查出来(不必等公示) */
function auditCheck(){
  const a = BALANCE.audit;
  if(S.phase !== "play" || S.lv >= 5 || S.core.clean >= a.line) return false;
  const p = Math.min(a.maxP, (a.line - S.core.clean) * a.k);
  if(R() >= p) return false;
  S.flags.audit = true;
  endGame("caught");
  return true;
}
function yearEnd(){
  const b = BALANCE["L"+S.lv];
  if(S.lv===2) yearEndL2();
  if(S.lv===3) yearEndL3();
  if(S.lv===4) yearEndL4();
  if(S.lv===5) yearEndL5();
  computeKpi(12);
  const final = S.kpi.card.map(it=>({name:it.name, done:it.done}));
  const rec = {year:S.year, careerYear:S.careerYear, age:S.age, score:S.kpi.score, rank:S.kpi.rank, items:final};
  S.kpi.history.push(rec);
  if(S.kpi.rank <= b.bonusTop){
    if(S.lv>=2) subordinates().forEach(p=>fav(p.id, b.bonusRep)); else allStaffFav(b.bonusRep);
    fav(supId(), b.bonusTrust);
    keyEvent(`入行第${S.careerYear}年综合考核${rankScope()}第${S.kpi.rank}`);
  }
  computeCore();
  S.lastYear = rec;
}
function rankScope(){ return [null,"全支行","全分行","二级分行中","全国一级分行中","同业"][S.lv]; }
function yearSpec(){ return S.lv===1 ? yearSpecL1() : (S.lv===2 ? yearSpecL2() : (S.lv===5 ? yearSpecL5() : yearSpecL34())); }
function yearSpecL1(){
  const r = S.lastYear;
  const good = r.rank <= B1().bonusTop;
  return {kind:"year", title:`入行第${r.careerYear}年 · 年终考核`, rec:r,
    body: good ? `年终考核弹子石排第${r.rank}。评优的名单贴在支行一楼，你的名字在第二行。年终奖比去年多了一截，员工们的也是。`
               : `年终考核弹子石排第${r.rank}。${r.rank>=6?"黄世海在总结会上念了排名，念到弹子石停了一下。":"不上不下。年终奖发了，和去年差不多。"}`,
    opts:[{t:"翻篇"}]};
}

/* ---------- 升职窗口 ---------- */
function rumorLead(){
  const p = BALANCE.promo;
  return p.rumorLead[S.lv] + (S.core.trust >= p.trustEarly ? 1 : 0);
}
function rumorCheck(d){
  if(S.lv >= 5 || S.promo.rumored || S.phase!=="play") return d();
  if(S.turn < S.promo.windowAt - rumorLead() + 1) return d();
  S.promo.rumored = true;
  const T = PROMO_TEXT[S.lv];
  const lines = [T.rumorBase];
  const lu = person("lu"), gu = person("gu");
  let patron;
  if(lu.met && lu.fav >= 50) patron = T.rumorPatron.lu;
  else if(gu.met && gu.fav >= 50) patron = T.rumorPatron.gu;
  else patron = (T.rumorPatron.sup || T.rumorPatron.huang).replace("${sur}", S.player.sur);
  lines.push(patron);
  log("group", T.rumorGroup);
  log("gold", T.rumorLog);
  const left = S.promo.windowAt - S.turn + 1;
  ask({kind:"promo", title:"风声", body: lines.join("\n\n") + `\n\n离组织考察还有${left}个月。`, opts:[{t:"晓得了"}]}, d);
}
function checkBreakthrough(){
  const p = BALANCE.promo, bt = p.bt;
  if(S.promo.bt || S.lv > 4) return;
  const ok = (S.biz.rankStreak||0) >= bt.streak && ["perf","rep","trust","clean"].every(k=>S.core[k] >= bt.coreMin);
  if(!ok) return;
  const earliest = BALANCE.tenure[S.lv] - bt.cut[S.lv];
  const at = Math.max(earliest, S.turn + rumorLead());
  if(at < S.promo.windowAt){
    S.promo.windowAt = at; S.promo.bt = true; S.promo.rumored = false;
    S.track.btLv = (S.track.btLv||[]).concat([S.lv]);
    log("gold", S.lv>=3 ? "有人在会上提了你的名字，说可以破格用。" : S.lv===2 ? "分行党委会上有人提了南岸，说这个支行行长可以破格用。" : "有人在分行的会上提了弹子石的名字，说这个网点负责人可以破格用。");
    keyEvent("被提名破格提拔");
  }
}

/* ---------- 组织考察 ---------- */
function promoVotes(){
  const p = BALANCE.promo.vote, T = PROMO_TEXT[S.lv];
  const voters = S.lv>=2 ? subordinates().slice(0,10).map(p => ({name:p.name, role:p.pos, fav:p.fav})) : S.staff.map(s => ({name:s.name, role:ROLE_NAME[s.role], fav:s.fav}));
  T.voters.forEach(v => voters.push({name:v.name, role:v.role, fav: v.src==="trust" ? S.core.trust : S.core.rep}));
  voters.forEach(v => {
    const pg = clamp((v.fav - p.goodFrom)/p.goodSpan, 0, 1);
    const pb = clamp((p.badFrom - v.fav)/p.badSpan, 0, 1);
    const x = R();
    v.vote = x < pg ? "good" : (x < pg + pb ? "bad" : "ok");
  });
  const score = voters.reduce((a,v)=>a + (v.vote==="good"?p.good:(v.vote==="ok"?p.ok:p.bad)), 0) / voters.length;
  return {voters, score: Math.round(score)};
}
function promoStatements(){
  const p = BALANCE.promo;
  const list = [];
  (MILESTONES[S.lv]||[]).forEach(ms => { if(S.milestones[ms.id]) list.push({txt:ms.stmt, v:p.stmtMilestone}); });
  const best = S.kpi.history.slice().sort((a,b)=>a.rank-b.rank)[0];
  if(best && best.rank <= 3) list.push({txt:`入行第${best.careerYear}年综合考核${rankScope()}第${best.rank}名`, v: Math.max(40, p.stmtRankTop - p.stmtRankStep*(best.rank-1))});
  const src = S.kpi.history.length ? S.kpi.history[S.kpi.history.length-1].items : S.kpi.card.map(it=>({name:it.name, done:it.done}));
  src.forEach(it => { if(it.done >= 1) list.push({txt:`${it.name}完成${Math.round(it.done*100)}%`, v: Math.min(p.stmtKpiMax, Math.round(p.stmtKpiBase + (it.done-1)*p.stmtKpiK))}); });
  if(S.lv===1 && S.flags.exposedHuang) list.push({txt:"贷后检查如实反映问题", v:78});
  if(S.lv===2 && S.flags.reportedMaben) list.push({txt:"及时向分行报告同业风险", v:74});
  if(S.lv===4 && S.flags.crisisGood) list.push({txt:"妥善处置重大风险事件", v:86});
  PROMO_TEXT[S.lv].fillers.forEach(f => {
    let v = f.v;
    if(v === "staff") v = Math.round(45 + S.staff.reduce((a,s)=>a+s.op+s.mk,0)/S.staff.length*2.5);
    if(v === "comp") v = S.kpi.comp >= 90 ? 70 : 45;
    if(v === "mgrs") v = Math.round(40 + subsL2().reduce((a,p)=>a+(p.skill||50),0)/Math.max(1,subsL2().length)*0.5);
    if(v === "npl") v = nplRatio() <= 1.2 ? 72 : 45;
    if(v === "outlets") v = (S.biz.opened||0) > 0 ? 70 : 52;
    if(v === "npl3") v = nplL3()/loansTotalL3()*100 < 1.8 ? 76 : 48;
    if(v === "unity") v = Math.round(40 + S.biz.unity*0.45);
    if(v === "rating") v = ratingNow() <= 2 ? 78 : 50;
    list.push({txt:f.txt, v});
  });
  return list;
}
function talkValue(o){
  if(o.v === "cleanCheck") return S.core.clean >= 85 ? 80 : 50;
  if(o.v === "payrollCheck") return S.biz.prospects && S.biz.prospects.some(x=>x.won) ? 86 : 70;
  if(o.huang) return o.v + (person("huang").fav >= 70 ? 8 : 0);
  if(o.v === "loanCheck") return (S.loanBook||[]).filter(l=>l.lv===2 && l.tier==="high").length <= 1 ? 84 : 48;
  if(o.v === "mabenCheck") return S.flags.mabenFall ? 80 : 45;
  if(o.v === "nplCheck") return nplL3()/loansTotalL3()*100 > 1.8 ? 78 : 58;
  if(o.v === "platformCheck") return S.loanBook.some(l=>l.src==="platform") ? 52 : 66;
  if(o.v === "crisisCheck") return S.flags.crisisGood ? 80 : 60;
  if(o.v === "familyCheck") return (S.flags.family||0) > 0 ? 76 : 60;
  return o.v;
}
function promoRivals(){
  const p = BALANCE.promo;
  let pool = S.rivals.filter(r => r.boss !== "——");
  if(S.lv===2 && S.flags.reportedMaben) pool = pool.filter(r => r.id !== "yubei");
  let top = pool.slice().sort((a,b)=>b.score-a.score).slice(0, p.rivals);
  if(S.lv===2 && !top.some(r=>r.id==="yubei")){ const mb = pool.find(r=>r.id==="yubei"); if(mb) top = top.slice(0, p.rivals-1).concat([mb]); }
  return top.map(r => {
    let sc = (p.rivalBaseLv[S.lv]||p.rivalBase) + (r.score-85)*p.rivalK + gauss()*p.rivalNoise + S.promo.tries*p.retryPenalty;
    if(r.id==="yubei" && S.flags.mabenHelped) sc += 5;
    // 封顶以后再抖一下:对手最高分落在一个带子里,不是一条死线
    const capped = clamp(sc, p.rivalMin, (p.rivalMaxLv&&p.rivalMaxLv[S.lv])||p.rivalMax) + gauss()*(p.rivalTopNoise||0);
    return {name:r.boss, from:r.name, score: Math.round(capped)};
  });
}
function promoFinal(votes, stmtIdx, answers){
  const p = BALANCE.promo, w = p.w;
  const stmts = promoStatements();
  const chosen = stmtIdx.map(i=>stmts[i]).filter(Boolean);
  while(chosen.length < p.stmtPick) chosen.push({txt:"——", v:p.stmtFiller-15});
  const stmtScore = chosen.reduce((a,x)=>a+x.v,0)/chosen.length;
  const qs = PROMO_TEXT[S.lv].talk;
  const talkScore = qs.reduce((a,q,i)=>a + talkValue(q.opts[answers[i]] || q.opts[q.opts.length-1]), 0)/qs.length;
  const talk = Math.round((stmtScore + talkScore)/2);
  qs.forEach((q,i)=>{ const o = q.opts[answers[i]]; if(o && o.huang) fav("huang",3); });
  const mine = {perf:S.core.perf, vote:votes.score, trust:S.core.trust, talk};
  // L3 起组织考察看廉洁:干净度高于基准加分,低于扣分
  const cb = p.cleanBonus && p.cleanBonus[S.lv] ? (S.core.clean - p.cleanBonus.from) * p.cleanBonus[S.lv] : 0;
  mine.clean = Math.round(cb*10)/10;
  mine.total = Math.round(mine.perf*w.perf + mine.vote*w.vote + mine.trust*w.trust + mine.talk*w.talk + cb + gauss()*(p.selfNoise||0));
  const rivals = promoRivals();
  S.promo.backed = null;
  if(R() < (p.backP||0)){ const top = rivals.slice().sort((a,b)=>b.score-a.score)[0]; top.score += p.backBonus; S.promo.backed = top.name; }
  const best = rivals.slice().sort((a,b)=>b.score-a.score)[0];
  const win = mine.total >= p.pass && mine.total > best.score;
  const res = {mine, rivals, win, best, chosen};
  S.promo.last = {turn:S.turn, total:mine.total, win, best:best.score, lv:S.lv};
  (S.track.promoLog = S.track.promoLog || []).push({lv:S.lv, turn:S.turn, total:mine.total, best:best.score, win});
  return res;
}
function promoPublicity(){
  const p = BALANCE.promo.report;
  const prob = Math.max(0, (p.from - S.core.clean) * p.k);
  const out = {prob, reported:false, result:"pass"};
  if(R() < prob){
    out.reported = true;
    const gu = person("gu");
    if(gu.met && gu.fav >= p.guShield && !S.flags.guShieldUsed){ S.flags.guShieldUsed = true; out.result = "shield"; }
    else if(S.core.clean >= p.deferMin) out.result = "defer";
    else out.result = "caught";
  }
  return out;
}
function promoLose(kind){
  const p = BALANCE.promo;
  S.promo.tries++;
  S.promo.rumored = false;
  S.promo.windowAt = S.turn + (kind==="defer" ? p.deferGap[S.lv] : p.retryGap[S.lv]);
  // 年龄线:下一个窗口时的年龄 + 过渡年数 超过下一级年龄线 → 锁定
  const ageAtWindow = S.age + Math.floor((S.m - 1 + (S.promo.windowAt - S.turn) * (BALANCE.turnMonths[S.lv]||1)) / 12);
  if(ageAtWindow + BALANCE.transYears[S.lv] > BALANCE.ageLine[S.lv+1]){
    endGame("lock");
    return;
  }
  log("bad", kind==="defer" ? "任命暂缓。下一个窗口，还要等。" : "这一回没选上。下一个窗口，要等一年。");
  if(kind !== "defer" && S.promo.backed && S.promo.last && !S.promo.last.win) log("", `后来听人说，${S.promo.backed}那边，上面有人打过招呼。`);
  S.phase = "play";
}
function endGame(id){
  id = refineEnding(id);
  S.phase = "over";
  const E = ENDINGS[S.lv][id];
  let text = E.text(S);
  if(id === "caught" && S.flags.audit && AUDIT_OPEN[S.lv]) text = AUDIT_OPEN[S.lv] + "\n\n" + text.split(/\n\n/).slice(1).join("\n\n");
  S.over = {id, title:E.title, text, lv:S.lv, age:S.age};
  keyEvent(`结局：${E.title}`);
  recordMeta();
  save();
}

/* ---------- 任命与过渡 ---------- */
function successorL1(){
  if(S.promo.succ && staff(S.promo.succ)) return staff(S.promo.succ);
  const cand = S.staff.slice().sort((a,b)=>staffSkill(b)-staffSkill(a));
  return cand[0] || null;
}
function farewellLine(){
  if(S.lv>=2) return PROMO_TEXT[S.lv].farewellBy(S);
  const T = PROMO_TEXT[1].farewell;
  const top = S.staff.slice().sort((a,b)=>b.fav-a.fav)[0];
  if(!top || top.fav < 50) return T.cold;
  if(top.id.startsWith("rk")) return `${top.name}站在最后面，等别人都散了，才小声说了句「主任再见」。`;
  return T[top.id] || T.cold;
}
function applyAppoint(){
  keyEvent(`${S.age}岁，任${PROMO_TEXT[S.lv].target}`);
  const end = {dep: depTotal(), rank:S.kpi.rank, age:S.age, turn:S.turn, core:Object.assign({},S.core)};
  if(S.lv===1){ S.track.l1End = end; S.track.l1Csat = S.biz.csat; }
  else S.track["l"+S.lv+"End"] = end;
  S.track.lvHist = S.track.lvHist || [];
  S.track.lvHist.push({lv:S.lv, history:S.kpi.history.slice(), end});
  S.phase = "trans";
  S.lvTitle = BALANCE.transTitle[S.lv];
}
function applyTransition(){ return [null,applyTransitionL1,applyTransitionL2,applyTransitionL3,applyTransitionL4][S.lv](); }
function applyTransitionL1(){
  const years = BALANCE.transYears[S.lv];
  const succ = successorL1();
  const txt = transitionText(S, succ);
  // 人脉簿推进
  if(succ){ const p = person(succ.id); if(p){ p.pos = "弹子石网点负责人"; p.recent = "接了你的位子"; } }
  S.staff.forEach(s => { if(succ && s.id===succ.id) return; const p = person(s.id); if(p && p.pos.indexOf("离职")<0){ const up = s.op + s.mk >= 13; p.recent = up ? "业务骨干，年年评优" : "还在弹子石"; } });
  const hp = person("huang"); hp.pos = "（被查）"; hp.recent = S.flags.exposedHuang ? "案卷里第一页是你写的" : "被分行纪委带走";
  if(S.flags.signedHuang){ S.core.clean = c100(S.core.clean - 5); }
  const lu = person("lu"); if(lu.met) lu.recent = "还在重庆分行";
  S.monthAbs += 1 + years*12; syncAge();
  S.carry = {succ: succ ? succ.id : null, dep: depTotal(), trans: txt};
  S.flags.grayAtL2 = S.flags.grayCount || 0;
  S.lv = 2; S.phase = "play"; S.justEntered = true;
  initL2(succ ? succ.id : null);
  txt.forEach(x => log("", x));
  log("gold", `${S.age}岁，任南岸支行行长。`);
  keyEvent(`${S.age}岁，任南岸支行行长`);
  save();
  return txt;
}

/* ---------- 无头升职(测试/校准用) ---------- */
function runPromo(done){
  S.phase = "promo";
  S.promo.stage = "assess";
  save();
  if(!isHL()){ UI.promoFlow(done); return; }
  const votes = promoVotes();
  const stmts = promoStatements();
  const pickIdx = BOT && BOT.stmt ? BOT.stmt(stmts) : stmts.map((x,i)=>[x.v,i]).sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>x[1]);
  const answers = PROMO_TEXT[S.lv].talk.map(q => BOT && BOT.talk ? BOT.talk(q) : 0);
  const res = promoFinal(votes, pickIdx, answers);
  S.promo.stage = null;
  if(!res.win){ S.phase = "play"; promoLose("lose"); return done(); }
  const pub = promoPublicity();
  S.promo.pub = pub;
  if(pub.result === "caught"){ endGame("caught"); return done(); }
  if(pub.result === "defer"){ S.phase = "play"; promoLose("defer"); return done(); }
  applyAppoint();
  applyTransition();
  done();
}
function applyTransitionL2(){
  const years = BALANCE.transYears[2];
  const txt = transitionTextL2(S);
  subsL2().forEach(p => { p.recent = p.recent && p.recent!=="现在归你管" ? p.recent : "还在南岸"; });
  const mb = person("maben");
  if(S.flags.mabenFall && S.flags.reportedMaben){ mb.pos = "（停职检查）"; mb.recent = "你报的分行"; }
  else if(S.flags.mabenFall){ mb.pos = "重庆分行调研员"; mb.recent = "从渝北调走了"; }
  else if(S.flags.mabenHelped){ mb.pos = "渝北支行行长"; mb.recent = "欠你一个人情"; }
  else { mb.pos = "涪陵分行副行长"; mb.recent = "见面先伸手"; }
  // 南岸交给谁:L2 部下里能力最高的
  const succ = subsL2().filter(p=>p.id!=="handong" || true).sort((a,b)=>(b.skill||0)-(a.skill||0))[0];
  if(succ){ succ.pos = "南岸支行行长"; succ.recent = "接了你在南岸的位子"; }
  S.carry = Object.assign(S.carry||{}, {l2dep: depTotal(), trans2: txt,
    l2: {dep: depTotal(), loans: S.biz.loans, npl: S.biz.npl, mgrName: succ ? succ.name : "——", mgrSkill: succ ? succ.skill : 60}});
  S.monthAbs += 3 + years*12; syncAge();
  S.lv = 3; S.phase = "play"; S.justEntered = true;
  initL3();
  txt.forEach(x => log("", x));
  log("gold", `${S.age}岁，任万州分行行长。`);
  keyEvent(`${S.age}岁，任万州分行行长`);
  save();
  return txt;
}
function applyTransitionL3(){
  const years = BALANCE.transYears[3];
  const txt = transitionTextL3(S);
  const subs = subsL3().filter(p => S.biz.branches.some(x=>x.mgr===p.id)).sort((a,b)=>(b.skill||0)-(a.skill||0));
  const succ = subs[0];
  if(succ){ succ.pos = "万州分行行长"; succ.recent = "接了你在万州的位子"; }
  subsL3().forEach(p => { if(p!==succ && !p.recent) p.recent = "还在万州"; });
  S.carry = Object.assign(S.carry||{}, {l3: {dep: depTotal(), loans: loansTotalL3(), npl: nplL3(), mgrName: succ ? succ.name : "——", mgrSkill: succ ? succ.skill : 60}, trans3: txt});
  S.monthAbs += years*12; syncAge();
  S.lv = 4; S.phase = "play"; S.justEntered = true;
  initL4();
  txt.forEach(x => log("", x));
  log("gold", `${S.age}岁，任重庆分行行长。`);
  keyEvent(`${S.age}岁，任重庆分行行长`);
  save();
  return txt;
}
function applyTransitionL4(){
  const years = BALANCE.transYears[4];
  const txt = transitionTextL4(S);
  S.carry = Object.assign(S.carry||{}, {l4: {dep: depTotal(), loans: loansL4(), npl: nplL4(), rating: ratingNow()}, trans4: txt});
  const lu = person("lu"); if(lu) lu.recent = "后年到龄";
  S.monthAbs += years*12; syncAge();
  S.lv = 5; S.phase = "play"; S.justEntered = true;
  initL5();
  txt.forEach(x => log("", x));
  log("gold", `${S.age}岁，任泰和银行行长。`);
  keyEvent(`${S.age}岁，任泰和银行行长`);
  save();
  return txt;
}
function decompAsk(d){
  if(S.lv !== 2 || S.biz.decompDone) return d();
  if(isHL()){ applyDecomp(BOT && BOT.decomp ? BOT.decomp() : decompProportional()); return d(); }
  UI.decompModal(d);
}

/* ---------- 存档 ---------- */
function save(){
  if(!S) return;
  try { localStorage.setItem(BALANCE.saveKey, JSON.stringify(S)); } catch(e){}
}
function load(){
  try {
    const raw = localStorage.getItem(BALANCE.saveKey);
    if(!raw) return null;
    const o = JSON.parse(raw);
    if(!o || o.ver !== BALANCE.ver) return null;
    S = o;
    seedRng((S.seed + S.turn*7919) >>> 0);
    return S;
  } catch(e){ return null; }
}
function clearSave(){ try { localStorage.removeItem(BALANCE.saveKey); } catch(e){} }
