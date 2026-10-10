/* =====================================================================
   机器人策略(无头测试与数值校准)与对外 API
   ===================================================================== */
function botChooseGeneric(mode){
  return function(spec){
    const opts = (spec.opts||[]).map((o,i)=>Object.assign({i}, o)).filter(o=>!o.disabled);
    if(!opts.length) return 0;
    const clean = opts.filter(o=>!o.gray), gray = opts.filter(o=>o.gray);
    if(mode==="random") return opts[Math.floor(R()*opts.length)].i;
    if(mode==="greedy") return (gray[0]||opts[0]).i;
    if(mode==="clean") return (clean[0]||opts[0]).i;
    // balanced
    if(gray.length && R() < 0.15) return gray[0].i;
    const pool = clean.length ? clean : opts;
    return (R() < 0.5 ? pool[0] : pool[Math.floor(R()*pool.length)]).i;
  };
}
function dueCards(){ return S.biz.cards.filter(c=>c.due===S.m && !c.maint && c.own>0).sort((a,b)=>b.own-a.own); }
function potCards(){ return S.biz.cards.filter(c=>!c.maint).sort((a,b)=>b.other-a.other); }

/* 高手:会读卡、会算账的人。L1 按期望收益挑客户和产品,后面几关按 balanced 打 */
function botExpertL1(){
  // 一步前瞻:每个行动点把候选行动在副本上试一遍(按成功算),结算当月看综合得分,乘成功率取最好的
  const b = B1(); let g = 6;
  const o = BALANCE.odds, keep = [o.min, o.max];
  while(S.ap > 0 && S.phase==="play" && g-- > 0){
    const cands = [];
    if(canAct("boss").ok) cands.push({p:ODDS[1].boss(), f:()=>doBoss()});
    if(canAct("hall").ok) cands.push({p:ODDS[1].hall(), f:()=>doHall()});
    if(canAct("rally").ok) cands.push({p:ODDS[1].rally(), f:()=>doRally()});
    cands.push({p:ODDS[1].out(), f:()=>doOut("community")}, {p:ODDS[1].out(), f:()=>doOut("street")});
    const pc = b.out.payroll, cm = staffByRole("cm")[0];
    S.biz.prospects.filter(x=>!x.won).forEach(x => { if(S.biz.budget >= pc.cost) cands.push({p:pc.baseP + (cm?cm.mk:3)*pc.mkP + x.tries*pc.tryP, f:()=>doOut("payroll", x.id), payroll:true}); });
    S.staff.forEach(st => ["mk","op","cp"].forEach(at => { if(st[at] < b.train.max) cands.push({p:ODDS[1].train(st), f:()=>doTrain(st.id, at), train:true}); }));
    S.biz.cards.filter(c=>!c.maint).sort((x,y)=>(y.other + (y.due===S.m?y.own:0)) - (x.other + (x.due===S.m?x.own:0))).slice(0,10)
      .forEach(c => PRODUCTS.forEach(pd => { if(pd.id==="fund" && c.risk < b.product.fund.riskLevel) return; cands.push({p:ODDS[1].maintain(c, pd.id), f:()=>doMaintain(c.id, pd.id)}); }));
    const snap = JSON.stringify(S), base = (()=>{ S = JSON.parse(snap); settleMonth(); const v = S.kpi.score; S = JSON.parse(snap); return v; })();
    let best = null;
    o.min = o.max = 1;
    cands.forEach(cd => {
      S = JSON.parse(snap);
      try { cd.f(); settleMonth(); } catch(e){ S = JSON.parse(snap); return; }
      // 带教和代发的好处在以后,当月看不出来,给一点远期分
      const later = cd.train ? 0.6 : (cd.payroll ? 1.5 : 0);
      const ev = clamp(cd.p, keep[0], keep[1]) * (S.kpi.score - base + later);
      if(!best || ev > best.ev) best = {cd, ev};
    });
    [o.min, o.max] = keep;
    S = JSON.parse(snap);
    if(!best) break;
    best.cd.f();
  }
}
function botPlay(mode){
  if(mode === "expert"){ if(S.lv === 1) return botExpertL1(); mode = "balanced"; }
  if(S.lv === 2) return botPlayL2(mode);
  if(S.lv === 3) return botPlayL3(mode);
  if(S.lv === 4) return botPlayL4(mode);
  if(S.lv === 5) return botPlayL5(mode);
  const trainP = mode==="mentor" ? 0.85 : (mode==="grind" ? 0 : 0.35);
  const orig = mode;
  if(mode==="mentor" || mode==="grind") mode = "balanced";
  if(orig==="mentor" && S.ap>=2 && canAct("train").ok){
    const s = S.staff.slice().sort((a,b)=>(a.mk+a.op+a.cp)-(b.mk+b.op+b.cp))[0];
    const attr = ["mk","op","cp"].sort((x,y)=>s[x]-s[y])[0];
    doTrain(s.id, attr);
  }
  if(orig==="grind" && canAct("rally").ok && S.staff.every(s=>s.fatigue<40)) doRally();
  let guard = 12;
  while(S.ap > 0 && S.phase==="play" && guard-- > 0){
    if(mode==="random"){
      const ids = ACTIONS_L1.map(a=>a.id).filter(id=>canAct(id).ok);
      const id = pick(ids);
      if(!id) break;
      if(id==="maintain") doMaintain(pick(S.biz.cards).id, pick(PRODUCTS).id);
      else if(id==="hall") doHall();
      else if(id==="out"){ const k = pick(["community","street","payroll"]); const pp = S.biz.prospects.find(p=>!p.won); if(k==="payroll" && pp && S.biz.budget>=B1().out.payroll.cost) doOut("payroll", pp.id); else doOut("community"); }
      else if(id==="train"){ const s = pick(S.staff); doTrain(s.id, pick(["mk","op","cp"])) || doBoss(); }
      else if(id==="rally") doRally();
      else doBoss();
      continue;
    }
    const due = dueCards();
    const b = B1();
    // 1 临时任务
    if(S.biz.task && !S.biz.taskDone && canAct("boss").ok && (mode!=="random")){ doBoss(); continue; }
    // 2 greedy 开晨会
    if(mode==="greedy" && canAct("rally").ok && S.staff.every(s=>s.fatigue<45)){ doRally(); continue; }
    // 3 到期客户
    if(due.length && due[0].own > 60){
      const c = due[0];
      let prod = "stable";
      if(mode==="greedy") prod = "fund";
      else if(c.risk >= 4) prod = "fund";
      else if(c.type!=="retire") prod = "insure";
      doMaintain(c.id, prod); continue;
    }
    // 4 代发
    const pp = S.biz.prospects.filter(p=>!p.won).sort((a,b)=>b.tries-a.tries)[0];
    if(pp && S.biz.budget >= b.out.payroll.cost + (S.biz.budget>=b.hall.cost+b.out.payroll.cost?0:0) && R()<0.5){ doOut("payroll", pp.id); continue; }
    // 5 厅堂
    if(canAct("hall").ok){ doHall(); continue; }
    // 6 带教(薄弱项)
    if(mode!=="greedy" && R()<trainP){
      const s = S.staff.slice().sort((a,b)=>(a.mk+a.op+a.cp)-(b.mk+b.op+b.cp))[0];
      const attr = s.role==="teller" ? (s.op<=s.cp?"op":"cp") : "mk";
      if(s && doTrain(s.id, attr)) continue;
    }
    // 7 高潜力客户
    const pc = potCards()[0];
    if(pc && pc.other > 250 && R()<0.6){ doMaintain(pc.id, mode==="greedy"?"fund":(pc.risk>=4?"fund":"stable")); continue; }
    // 8 外拓
    doOut(R()<0.5?"community":"street");
  }
}
/* ---------- L2 机器人 ---------- */
function loanVisibleScore(it){ const ts = B2().tierScore; return ts.coll[it.coll] + ts.flow[it.flow] + ts.tax[it.tax]; }
function botPlayL2(mode){
  const b = B2();
  const steady = mode==="steady"; if(steady) mode = "balanced";   // steady:不督导、不换人,只看委托本身
  // 1 审批队列
  S.biz.queue.slice().forEach(it => {
    const v = loanVisibleScore(it);
    let ok;
    if(mode==="random") ok = R() < 0.5;
    else if(mode==="greedy") ok = true;
    else if(mode==="clean") ok = v <= 0.5 && !it.rel;
    else ok = v <= 0.5 || (it.rel && v <= 1);
    decideLoan(it.id, ok);
  });
  let guard = 10;
  while(S.ap > 0 && S.phase==="play" && guard-- > 0){
    const ids = ACTIONS_L2.map(a=>a.id).filter(id=>canActL2(id).ok);
    if(!ids.length) break;
    if(mode==="random"){
      const id = pick(ids), ap = activeProjects();
      if(id==="supervise") doSupervise(pick(S.biz.outlets).id);
      else if(id==="push" && ap.length) doPush(pick(ap).id);
      else if(id==="visit" && ap.length) doVisit(pick(ap).id, R()<0.5 && S.biz.budget>=b.project.giftCost);
      else if(id==="campaign") doCampaign();
      else if(id==="appoint"){ const o = pick(S.biz.outlets), c = appointCands(o.id); if(c.length) doAppoint(o.id, pick(c).id); else doReportUp() || doSupervise(o.id); }
      else doReportUp() || doSupervise(pick(S.biz.outlets).id);
      continue;
    }
    // 空缺的网点先补人
    const empty = S.biz.outlets.find(o=>!o.mgr);
    if(!steady && empty && canActL2("appoint").ok){ const c = appointCands(empty.id).sort((a,b)=>b.skill-a.skill)[0]; if(c){ doAppoint(empty.id, c.id); continue; } }
    // 能力差太多的负责人换掉
    if(mode!=="greedy" && !steady){
      const weak = S.biz.outlets.filter(o=>o.mgr).sort((a,b)=>skillOf(a.mgr)-skillOf(b.mgr))[0];
      const c = weak ? appointCands(weak.id).sort((a,b)=>b.skill-a.skill)[0] : null;
      if(c && c.skill > skillOf(weak.mgr) + 20){ doAppoint(weak.id, c.id); continue; }
    }
    const ap = activeProjects().sort((a,b)=>b.stage-a.stage || b.prog-a.prog);
    const inAppr = ap.find(p=>p.stage===2);
    if(inAppr){
      const d = PROJ_L2.find(x=>x.id===inAppr.id);
      if(inAppr.visits + inAppr.gift < (d.tier==="low"?0:1) && canActL2("visit").ok){ doVisit(inAppr.id, mode==="greedy" && S.biz.budget>=b.project.giftCost); continue; }
      doPush(inAppr.id); continue;
    }
    if(canActL2("campaign").ok && S.biz.budget >= b.campaign.cost + (mode==="greedy"?0:6)){ doCampaign(); continue; }
    if(ap.length && R() < 0.6){ doPush(ap[0].id); continue; }
    if(!S.biz.reported && person("zhouqm").fav < 65){ doReportUp(); continue; }
    const o = S.biz.outlets.filter(x=>!x.supervised).sort((a,c)=>(a.morale-c.morale))[0];
    if(o && !steady){ doSupervise(o.id); continue; }
    if(ap.length){ doPush(ap[0].id); continue; }
    break;
  }
}
/* ---------- L3 机器人 ---------- */
function botPlayL3(mode){
  const b = B3();
  const steady = mode==="steady"; if(steady || mode==="mentor" || mode==="grind") mode = "balanced";
  // 不良处置
  let guard = 6;
  while(S.biz.disposedQ < disposeCap() && guard-- > 0){
    const x = S.biz.npa.filter(n=>!n.stage).sort((a,c)=>c.amt-a.amt)[0]; if(!x) break;
    let how = "collect";
    if(mode==="random") how = pick(["collect","sue","restr","writeoff"]);
    else if(mode==="greedy") how = "restr";
    else if(S.biz.writeoffUsed + x.amt <= b.dispose.writeoff.quotaY && x.amt > 6000) how = "writeoff";
    else if(x.amt > 5000) how = "sue";
    if(!disposeNpa(x.id, how)) { if(!disposeNpa(x.id, "collect")) break; }
  }
  let g2 = 8;
  while(S.ap > 0 && S.phase==="play" && g2-- > 0){
    const ids = ACTIONS_L3.map(a=>a.id).filter(id=>canActL3(id).ok);
    if(!ids.length) break;
    if(mode==="random"){
      const id = pick(ids);
      if(id==="open") doOpenOutlet(pick(S.biz.areas).id);
      else if(id==="close") doCloseOutlet(pick(S.biz.branches.filter(x=>x.outlets>1)).id);
      else if(id==="renovate") doRenovate(pick(S.biz.branches).id) || doReportUpL3();
      else if(id==="squat") doSquatL3(pick(S.biz.branches.filter(x=>!x.squat)).id);
      else if(id==="tilt") doTilt(pick(LINES_L3).id) || doReportUpL3();
      else if(id==="appoint"){ const x = pick(S.biz.branches), c = appointCandsL3(x.id); if(c.length) doAppointL3(x.id, pick(c).id); else doReportUpL3() || apUse(1); }
      else if(id==="platform"){ doPlatform(); decidePlatform(R()<0.5); }
      else doReportUpL3() || apUse(1);
      continue;
    }
    if(!S.biz.tilt || (S.biz.tilt!=="risk" && nplL3()/loansTotalL3()*100 > 2.2)){ doTilt(nplL3()/loansTotalL3()*100 > 2.0 ? "risk" : "retail"); continue; }
    if(!steady){
      const weak = S.biz.branches.slice().sort((a,c)=>skillOf(a.mgr)-skillOf(c.mgr))[0];
      const c = appointCandsL3(weak.id).sort((a,d)=>d.skill-a.skill)[0];
      if(c && c.skill > skillOf(weak.mgr) + 15 && canActL3("appoint").ok){ doAppointL3(weak.id, c.id); continue; }
    }
    if(canActL3("platform").ok && S.turn >= 3 && ((mode==="greedy") || (mode==="balanced" && R()<0.05))){ doPlatform(); decidePlatform(mode!=="clean"); continue; }
    if(canActL3("open").ok && S.biz.newOutlets.length < 3){ const a = S.biz.areas.slice().sort((x,y)=>(y.heat-y.comp*0.5)-(x.heat-x.comp*0.5))[0]; doOpenOutlet(a.id); continue; }
    if(!S.biz.reported && person("lu").fav < 65){ doReportUpL3(); continue; }
    if(canActL3("renovate").ok){ const x = S.biz.branches.filter(y=>y.renov<0.3).sort((a,c)=>c.dep-a.dep)[0]; if(x && doRenovate(x.id)) continue; }
    if(!S.biz.reported){ doReportUpL3(); continue; }
    if(canActL3("squat").ok && !steady){ const x = S.biz.branches.filter(y=>!y.squat).sort((a,c)=>c.dep-a.dep)[0]; if(x && doSquatL3(x.id)) continue; }
    break;
  }
}
/* ---------- L4 机器人 ---------- */
function bestAssignGain(){
  let best = null;
  S.biz.deputies.forEach(x => S.biz.deputies.forEach(y => { if(x===y) return;
    const g = (x.fit[y.line] + y.fit[x.line]) - (x.fit[x.line] + y.fit[y.line]);
    if(g > 0 && (!best || g > best.g)) best = {a:x.id, b:y.id, g}; }));
  return best;
}
function botPlayL4(mode){
  if(mode==="steady" || mode==="mentor" || mode==="grind") mode = "balanced";
  let g = 8;
  while(S.ap > 0 && S.phase==="play" && g-- > 0){
    const ids = ACTIONS_L4.map(a=>a.id).filter(id=>canActL4(id).ok);
    if(!ids.length) break;
    if(mode==="random"){
      const id = pick(ids), ds = S.biz.deputies;
      if(id==="swap"){ const a = pick(ds), c = pick(ds.filter(x=>x!==a)); doSwap(a.id, c.id); }
      else if(id==="talk") doTalk(pick(ds).id);
      else if(id==="startp") doStartProj() || doRegulator();
      else if(id==="pushp") doPushProj(S.biz.projects.find(p=>!p.done).id);
      else if(id==="focus") doFocus(pick(S.biz.inst).id);
      else if(id==="quota") doQuota();
      else doRegulator();
      continue;
    }
    const gain = bestAssignGain();
    if(gain && gain.g >= 10 && S.biz.unity > 45){ doSwap(gain.a, gain.b); continue; }
    if(capRoom() < 150000){ doQuota(); continue; }
    if(canActL4("startp").ok){ const r = doStartProj(); if(r === true) continue; }
    const low = S.biz.deputies.map(d=>person(d.id)).sort((a,c)=>a.fav-c.fav)[0];
    if(S.biz.unity < 55 && low){ doTalk(low.id); continue; }
    if(person("gu").fav < 60 && mode!=="greedy"){ doRegulator(); continue; }
    if(!S.biz.focusId){ const x = S.biz.inst.slice().sort((a,c)=>c.dep-a.dep)[1]; doFocus(x.id); continue; }
    const p = S.biz.projects.find(x=>!x.done);
    if(p){ doPushProj(p.id); continue; }
    if(low){ doTalk(low.id); continue; }
    break;
  }
}
function botDecomp(mode){
  return () => {
    const f = decompFair();
    if(mode==="random"){ const e = Math.round(f.total/4/f.step)*f.step; const arr=[e,e,e,e]; arr[0]+=f.total-e*4; return arr; }
    if(mode==="greedy"){ const arr = decompProportional(); const mv = 2*f.step*3; arr[0]+=mv; arr[1]-=mv; return arr; }
    return decompProportional();
  };
}

const BOTS = {};
["random","greedy","balanced","clean","mentor","grind","steady","expert"].forEach(m => {
  const base = (m==="mentor"||m==="grind"||m==="steady"||m==="expert") ? "balanced" : m;
  BOTS[m] = {
    mode:m,
    decomp: botDecomp(base),
    choose: botChooseGeneric(base),
    stmt: list => base==="random" ? list.map((x,i)=>i).sort(()=>R()-0.5).slice(0,3) : list.map((x,i)=>[x.v,i]).sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>x[1]),
    talk: q => base==="random" ? Math.floor(R()*q.opts.length) : q.opts.map((o,i)=>[typeof o.v==="number"?o.v:75,i]).sort((a,b)=>b[0]-a[0])[0][1],
    play: ()=> botPlay(m),
  };
});

/* 无头跑一局。opts.until: "l2"(进 L2 即停) / "l3"(默认,打完 L2 到万州或出结局)。opts.mode2: L2 换一种打法 */
function botPlayL5(mode){
  if(mode==="steady" || mode==="mentor" || mode==="grind") mode = "balanced";
  const D = S.biz.dials;
  if(mode==="random"){ Object.keys(D).forEach(k => setDial(k, 1+Math.floor(Math.random()*5))); }
  else if(mode==="greedy"){ setDial("credit",5); setDial("price",4); setDial("digital",1); setDial("branch",2); }
  else if(mode==="clean"){ setDial("credit",3); setDial("price",3); setDial("digital",4); setDial("branch",3); }
  else { setDial("credit", carL5() > 14 ? 4 : 3); setDial("price",4); setDial("digital", S.turn<=5 ? 4 : 2); setDial("branch",3); }
  let g = 6;
  while(S.ap > 0 && S.phase==="play" && g-- > 0){
    const ids = L5_ACTIONS.map(a=>a.id).filter(id=>canActL5(id).ok);
    if(!ids.length) break;
    if(mode==="random"){ const id = pick(ids); if(id==="survey") doSurvey(pick(S.biz.regions).id); else if(id==="reg5") doReg5(); else if(id==="reform") doReform(); else doVisit5(); continue; }
    if(mode!=="greedy" && person("gu") && person("gu").fav < 65){ doReg5(); continue; }
    if(mode==="balanced" && S.turn===2 && ids.includes("reform")){ doReform(); continue; }
    const r = S.biz.regions.filter(x=>x.boost<=0).sort((a,c)=>c.share*c.g-a.share*a.g)[0];
    if(r){ doSurvey(r.id); continue; }
    doVisit5();
  }
}
function simGame(mode, seed, maxTurns, opts){
  opts = opts || {};
  newGame({seed, sur:"李", given:"然"});
  BOT = BOTS[mode];
  const until = opts.until || "l5";
  let steps = 0; const guardMax = maxTurns || 400;
  const trace = {windowSeen:null, l1Turns:null, l2Start:null};
  while(S.phase === "play" && steps++ < guardMax){
    if(S.lv===2 && until==="l2") break;
    if(S.lv===3 && until==="l3") break;
    if(S.lv===4 && until==="l4") break;
    if(S.lv===2 && trace.l2Start==null){ trace.l2Start = {age:S.age, dzs:outlet("dzs").dep, mgr:outlet("dzs").mgr, skill:skillOf(outlet("dzs").mgr)}; if(opts.mode2) BOT = BOTS[opts.mode2]; if(opts.onL2) opts.onL2(S); }
    BOT.play();
    const before = S.turn, lvB = S.lv;
    endTurn();
    runJobs();
    if(trace.windowSeen==null && S.track.promoLog && S.track.promoLog.length) trace.windowSeen = S.track.promoLog[0].turn;
    if(lvB===1 && S.lv===2) trace.l1Turns = before;
    if(opts.onTurn) opts.onTurn(S);
    if(S.phase==="play" && S.turn === before && S.lv === lvB) throw new Error("回合没有推进 turn="+S.turn);
  }
  return {phase:S.phase, over:S.over && S.over.id, overLv:S.over && S.over.lv, turn:S.turn, age:S.age, clean:S.core.clean, lv:S.lv,
    windowSeen:trace.windowSeen, l1Turns:trace.l1Turns, l2Start:trace.l2Start, tries:S.promo.tries, bt:S.promo.bt, rank:S.kpi.rank, score:S.kpi.score,
    core:Object.assign({}, S.core), ms:Object.keys(S.milestones), hist:S.kpi.history.map(h=>({s:h.score,r:h.rank}))};
}

const THSZ = {
  newGame, load, save, clearSave, endTurn, runJobs, simGame, BOTS,
  act:{openOutlet:doOpenOutlet, closeOutlet:doCloseOutlet, renovate:doRenovate, squat:doSquatL3, tilt:doTilt, appointL3:doAppointL3, platform:doPlatform, decidePlatform, reportUpL3:doReportUpL3, disposeNpa, setMix,
    survey:doSurvey, reg5:doReg5, reform:doReform, visit5:doVisit5, issueCapital, setDial, setStrategy,
    swap:doSwap, talk:doTalk, startProj:doStartProj, pushProj:doPushProj, focus:doFocus, quota:doQuota, regulator:doRegulator,
    maintain:doMaintain, hall:doHall, out:doOut, train:doTrain, rally:doRally, boss:doBoss, setRole,
    supervise:doSupervise, push:doPush, visit:doVisit, appoint:doAppoint, campaign:doCampaign, reportUp:doReportUp, decideLoan},
  BALANCE,
  get S(){ return S; }, set S(v){ S = v; },
  setBot(m){ BOT = m ? BOTS[m] : null; },
  setHeadless(v){ FORCE_HL = !!v; },
  internals:{ meetChain, meetSpec, meetPick, MEETINGS, apCost, promoVotes, promoStatements, promoFinal, promoPublicity, promoLose, applyAppoint, applyTransition, checkBreakthrough, computeKpi, computeCore, computeRank, settleMonth, depTotal, pickEvents, eventSpec, EVENTS, EVENTS_LATER, rumorLead, advance, runPromo, fav, dirt, person, staff, card,
    outlet, project, nplRatio, subsL2, skillOf, delegK, decompFair, decompProportional, applyDecomp, appointCands, projAdvance, bookLoan, EVENTS_L2, initL2, staffSkill, EVENTS_L3, EVENTS_L4, initL3, initL4, nplL3, loansTotalL3, effL3, area, branch, inst, depTotalL4, loansL4, nplL4, capRoom, ratingNow, lineK, crisisEventSpec, appointCandsL3, bestAssignGain,
    EVENTS_L5, initL5, levelStartJobs, oddsTier, oddsClamp, roll, ODDS, EVENT_ODDS, applyEventOdds, actOdds, rivalReact, spotlight, whipTargets, issueKpi, settleMonth, settleL5, carL5, ratingL5, rankL5, finalL5, refineEnding, ENDINGS, ENDING_LIST, loadMeta, recordMeta, bioData, bioVerdict, drawBio, endGame, kpiActualL5, get JOBS(){return JOBS;} },
};
THSZ.TEXT = () => ({EVENTS, EVENTS_LATER, EVENTS_L2, EVENTS_LATER_L2, EVENTS_L3, FAMILY_L3, EVENTS_L4, CRISIS_L4, EVENTS_L5, PROMO_TEXT, L2_INTRO, L3_INTRO, L4_INTRO, L5_INTRO, ENDINGS, SIDESTEP, AUDIT_OPEN, MILESTONES, LINES, TASKS_L1});
globalThis.THSZ = THSZ;
