/* =====================================================================
   对手会追、枪打出头鸟、鞭打快牛
   ===================================================================== */
const CHASE_LINES = [
  r => `【群消息】${r.name}的${r.boss}把这个月的休假全停了，晨会开到八点半。`,
  r => `【群消息】${r.boss}那边抢了两家大户，利率压得很低。有人在群里问是不是上面给了政策。`,
  r => `【群消息】${r.name}这个月的数报得很猛。${r.boss}在会上说：「第一名也不是谁家的。」`,
];
function rivalReact(){
  const c = BALANCE.chase;
  if(S.lv >= 5 || !S.rivals || !S.rivals.length) return;
  S.rivals.forEach(r => { if(r.chaseLeft > 0){ r.chaseLeft--; if(!r.chaseLeft) r.chase = 0; } });
  if((S.biz.rankStreak||0) >= c.after && !S.rivals.some(r => r.chaseLeft > 0)){
    const second = (S.kpi.table||[]).find(x => !x.me);
    const r = second && S.rivals.find(x => x.id === second.id);
    if(r){ r.chase = c.bonus[S.lv]; r.chaseLeft = c.turns[S.lv]; log("group", pick(CHASE_LINES)(r)); }
  }
  if(S.kpi.rank === 1 && S.phase === "play" && R() < c.spotP) spotlight();
}
/* 排第一,事也跟着来 */
function spotlight(){
  const c = BALANCE.chase.spot, kind = pick(S.lv === 1 ? ["poach","task","audit"] : ["poach","audit","levy"]);
  if(kind === "audit"){
    S.kpi.comp = c100(S.kpi.comp - c.audit);
    log("bad", pick([`${[null,"分行运营部","分行内控部","总行审计","总行审计"][S.lv]}来抽查，头一站就是你们。查出两张凭证盖章不清。`,
      `上面的检查组说是随机抽的，抽到的正好是排第一的。整改单写了一页半。`]) + ` <span class="num">合规-${c.audit}</span>`);
    return;
  }
  if(kind === "task" && S.lv === 1){
    if(!S.biz.task || S.biz.taskDone){ S.biz.task = pick(TASKS_L1); S.biz.taskDone = false; S.biz.bossDone = false; }
    fav("huang", -1);
    log("bad", `黄世海在群里@你：「弹子石排第一，这个任务你们来。」${S.biz.task}`);
    return;
  }
  if(kind === "levy"){
    const cut = Math.round(depTotal() * c.levy);
    if(S.lv === 2) S.biz.corp.dep = Math.max(0, S.biz.corp.dep - cut);
    else if(S.lv === 3){ const x = S.biz.branches.slice().sort((a,b)=>b.dep-a.dep)[0]; x.dep -= cut; }
    else if(S.lv === 4){ const x = S.biz.inst.slice().sort((a,b)=>b.dep-a.dep)[0]; x.dep -= cut; }
    log("bad", `上面搞专项调剂，排第一的先出。一笔存款划给了排名靠后的兄弟单位。 <span class="num">存款-${fmtWan(cut)}</span>`);
    return;
  }
  // poach:他行挖角
  if(S.lv === 1){
    const cd = S.biz.cards.filter(x => x.own > 50).sort((a,b)=>b.own-a.own)[0];
    if(!cd) return;
    const out = Math.round(cd.own * c.poach1);
    cd.own -= out; cd.other += out; cd.rel = c100(cd.rel - 5);
    log("bad", `${cd.name}的外孙女在他行上班。这个月，${cd.name}把一笔定期转过去了。 <span class="num">存款-${fmtWan(out)}</span>`);
  } else {
    const cut = Math.round(depTotal() * c.poach);
    if(S.lv === 2) S.biz.corp.dep = Math.max(0, S.biz.corp.dep - cut);
    else if(S.lv === 3){ const x = pick(S.biz.branches); x.dep -= cut; }
    else { const x = pick(S.biz.inst); x.dep -= cut; }
    log("bad", `他行给了一个大户更低的价，${pick(["那家企业的财务把结算户挪了一半过去。","对方老板打电话来，说「不好意思，那边给得多」。"])} <span class="num">存款-${fmtWan(cut)}</span>`);
  }
}
/* 鞭打快牛:去年排第一,今年的量化目标多压一截 */
function whipTargets(){
  const h = S.kpi.history; if(!h || !h.length || S.lv >= 5) return false;
  const last = h[h.length-1];
  if(last.rank !== 1) return false;
  S.kpi.card.forEach(it => { if(it.kind === "flow") it.target = Math.round(it.target * BALANCE.chase.whip); });
  S.kpi.whipped = S.year;
  return true;
}
