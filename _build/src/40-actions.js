/* =====================================================================
   L1 行动(每个 1 AP)
   ===================================================================== */
const ACTIONS_L1 = [
  {id:"maintain", name:"维护客户", desc:"选一张客户卡：续存、挖他行资产、顺带推产品"},
  {id:"hall",     name:"厅堂营销", desc:"花营销费用办一场厅堂活动，本月新客户和存款上来"},
  {id:"out",      name:"外拓",     desc:"社区 / 商户街 / 企业代发，三选一"},
  {id:"train",    name:"带教员工", desc:"选一个人，一项能力 +1"},
  {id:"rally",    name:"晨会动员", desc:"本月全员产出提高，倦怠也上去"},
  {id:"boss",     name:"应付上级", desc:"办支行的临时任务；没任务就去汇报"},
];
const PRODUCTS = [
  {id:"deposit", name:"只做续存", tip:"稳稳接住，他行资产挖得最多"},
  {id:"stable",  name:"续存 + 稳健理财", tip:"R2 产品，中收一点点"},
  {id:"insure",  name:"续存 + 期缴保险", tip:"中收多些，老人不太喜欢"},
  {id:"fund",    name:"推权益基金", tip:"R4 产品，中收最多；客户等级不够就是违规"},
];

function canAct(id){
  if(S.phase!=="play") return {ok:false, why:"现在不能操作"};
  if(S.ap < 1) return {ok:false, why:"本月行动点用完了"};
  const b = B1();
  if(id==="hall" && S.biz.budget < b.hall.cost) return {ok:false, why:`营销费用不够（要${b.hall.cost}万）`};
  if(id==="rally" && S.biz.rallied) return {ok:false, why:"这个月已经开过动员会了"};
  if(id==="boss" && S.biz.bossDone) return {ok:false, why:"这个月已经去过支行了"};
  return {ok:true};
}

function doMaintain(cardId, prodId){
  const c = card(cardId); if(!c) return null;
  const chk = canAct("maintain"); if(!chk.ok) return null;
  const b = B1(), cb = b.card, P = b.product[prodId];
  if(!P) return null;
  apUse(1);
  const isDue = (c.due === S.m);
  let pull = Math.round(c.other * (cb.pullBase + c.rel*cb.pullRel) * P.pull);
  pull = Math.min(pull, c.other);
  c.other -= pull; c.own += pull;
  const fee = r2(c.own * P.fee + P.feeFix);
  if(fee) feeAdd(fee);
  c.rel = c100(c.rel + cb.relMaintain);
  const p = person(c.id); if(p) p.fav = c.rel;
  // 保险对退休客户略减满意
  if(prodId==="insure" && c.type==="retire") csatAdd(P.oldCsat);
  // 续存:到期卡按产品保留率
  if(isDue){
    if(R() < P.retain) c.maint = true;
    else { c.maint = true; const out = Math.round(c.own*cb.leaveShare*0.5); c.own -= out; c.other += out; }
  } else c.maint = true;
  let viol = false;
  if(prodId==="fund" && c.risk < P.riskLevel){
    viol = true;
    const v = b.violation;
    dirt(v.clean);
    S.flags.dirtyWealth = (S.flags.dirtyWealth||0) + 1;
    const p = c.risk<=2 ? v.complainP : v.complainP*0.6;
    if(R() < p) schedule("complaintV", rint(v.delayMin, v.delayMax), {cardId:c.id});
  }
  const txt = `维护<b>${c.name}</b>（${CUST_TYPES[c.type].name} · R${c.risk}）：${pull?`从他行挪过来${fmtWan(pull)}`:"没挪过来钱"}${fee?`，中收${fmtWan(fee)}`:""}。` + (viol?"基金是R4的，她的测评不够。":"");
  log(viol?"warn":"good", txt + ` <span class="num">存款${sgn(pull,fmtWan)}</span>`);
  return {pull, fee, viol};
}

function doHall(){
  const chk = canAct("hall"); if(!chk.ok) return null;
  const h = B1().hall;
  apUse(1); budgetAdd(-h.cost);
  const lobbyBoost = staffByRole("lobby").reduce((a,s)=>a+s.mk,0)/10 + 0.8;
  const cu = Math.round(ri(h.cust)*lobbyBoost), dp = Math.round(ri(h.dep)*lobbyBoost), cd = Math.round(ri(h.card)*lobbyBoost);
  custAdd(cu); depAdd(dp); cardAdd(cd); csatAdd(h.csat);
  log("good", `厅堂办了一场「存款送米」，门口排到了人行道上。<span class="num">新客户+${cu} · 存款+${fmtWan(dp)} · 营销费用-${h.cost}万</span>`);
  return {cu, dp, cd};
}

function doOut(kind, prospectId){
  const chk = canAct("out"); if(!chk.ok) return null;
  const o = B1().out;
  const cm = staffByRole("cm")[0];
  const boost = cm ? (0.7 + cm.mk*0.06) : 0.6;
  if(kind==="payroll"){
    const pp = S.biz.prospects.find(p=>p.id===prospectId && !p.won);
    if(!pp) return null;
    const pc = o.payroll;
    if(S.biz.budget < pc.cost) return null;
    apUse(1); budgetAdd(-pc.cost);
    const p = pc.baseP + (cm?cm.mk:3)*pc.mkP + pp.tries*pc.tryP;
    pp.tries++;
    if(R() < p){
      pp.won = true;
      const cd = Math.round(rr(pc.card) * pp.staff/90), dp = Math.round(rr(pc.dep) * pp.staff/90), cu = Math.round(rr(pc.cust) * pp.staff/90);
      cardAdd(cd); depAdd(dp); custAdd(cu);
      S.biz.payrollInflow += Math.round(pp.staff * 0.3);
      if(cm) sfav(cm.id, 4);
      log("gold", `<b>${pp.name}</b>的代发签下来了。${cm?cm.name:"你"}从财务室出来，在车里坐了五分钟才发动。<span class="num">代发户+${cd} · 存款+${fmtWan(dp)}</span>`);
      keyEvent(`拿下${pp.name}代发`);
      return {won:true};
    }
    log("", `去了趟<b>${pp.name}</b>，对方说再考虑考虑。${pp.tries>1?"比上回多聊了二十分钟。":""}`);
    return {won:false};
  }
  const t = o[kind]; if(!t) return null;
  apUse(1);
  const cu = Math.round(ri(t.cust)*boost), dp = Math.round(ri(t.dep)*boost), cd = Math.round(ri(t.card)*boost);
  custAdd(cu); depAdd(dp); cardAdd(cd);
  const where = kind==="community" ? "去弹子石社区摆了一上午摊，量血压的比办业务的多" : "沿着老街一家家铺子走过去，收了一摞名片";
  log("good", `${where}。<span class="num">新客户+${cu} · 存款+${fmtWan(dp)} · 信用卡代发+${cd}</span>`);
  return {cu, dp, cd};
}

function doTrain(staffId, attr){
  const chk = canAct("train"); if(!chk.ok) return null;
  const s = staff(staffId); if(!s || !ATTR_NAME[attr]) return null;
  const t = B1().train;
  if(s[attr] >= t.max) return null;
  apUse(1);
  const up = Math.min(t.max - s[attr], t.attr * (R() < (s.grow-1)*0.5 ? 2 : 1));
  s[attr] += up; s.trained++;
  sfav(s.id, t.fav);
  const lines = {
    mk:`你带${s.name}见了三个客户，回来的路上${pr(s)}一直在本子上记。`,
    op:`下班后你陪${s.name}把几种挂失、冻结的流程过了一遍。`,
    cp:`你把去年分行的差错通报找出来，跟${s.name}一条条对。`,
  };
  log("good", `${lines[attr]}<span class="num">${s.name} ${ATTR_NAME[attr]}+${up}</span>`);
  return {up};
}

function doRally(){
  const chk = canAct("rally"); if(!chk.ok) return null;
  const r = B1().rally;
  apUse(1);
  S.biz.rallied = true;
  S.staff.forEach(s => { s.fatigue = c100(s.fatigue + r.fatigue); sfav(s.id, r.fav); });
  log("", `八点二十开晨会，你把这个月的数写在白板上。没人说话，${pick(S.staff).name}在底下打了个呵欠。<span class="num">本月产出提高 · 倦怠上升</span>`);
  return true;
}

function doBoss(){
  const chk = canAct("boss"); if(!chk.ok) return null;
  const t = B1().task;
  apUse(1);
  S.biz.bossDone = true;
  if(S.biz.task && !S.biz.taskDone){
    S.biz.taskDone = true;
    fav("huang", t.done);
    log("", `${S.biz.task.replace(/。$/,"")}，办了。黄世海回了个「嗯」。<span class="num">黄世海好感+${t.done}</span>`);
  } else {
    fav("huang", t.report);
    log("", `你去支行汇报了一趟。黄世海听到一半接了个电话，挥手让你回去。<span class="num">黄世海好感+${t.report}</span>`);
  }
  return true;
}

function setRole(staffId, role){
  const s = staff(staffId); if(!s || !ROLE_NAME[role]) return false;
  if(S.phase!=="play") return false;
  s.role = role;
  const p = person(s.id); if(p){ p.role = ROLE_NAME[role]; p.pos = "弹子石网点"+ROLE_NAME[role]; }
  return true;
}
