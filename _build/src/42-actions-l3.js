/* =====================================================================
   L3 行动(每个 1 AP)。不良处置、信贷结构滑杆不占行动点。
   ===================================================================== */
const ACTIONS_L3 = [
  {id:"open",     name:"开网点",     desc:"在一个片区开新网点，投入三百万"},
  {id:"close",    name:"撤并网点",   desc:"撤掉一个网点，省费用，片区口碑掉"},
  {id:"renovate", name:"网点改造",   desc:"给一个支行做智能化改造，效能上去"},
  {id:"tilt",     name:"条线倾斜",   desc:"资源往一个部门偏，其他部门不高兴"},
  {id:"appoint",  name:"干部任免",   desc:"换一个支行行长"},
  {id:"platform", name:"对接地方政府", desc:"区县的平台项目，量大，风险也大"},
  {id:"reportup", name:"向上汇报",   desc:"回主城向陆明远汇报"},
];

function canActL3(id){
  if(S.phase!=="play") return {ok:false, why:"现在不能操作"};
  if(S.ap < 1) return {ok:false, why:"本季行动点用完了"};
  const b = B3();
  if(id==="open" && S.biz.budget < b.outlet.build) return {ok:false, why:`发展费用不够（要${b.outlet.build}万）`};
  if(id==="renovate" && S.biz.budget < b.renovate.cost) return {ok:false, why:`发展费用不够（要${b.renovate.cost}万）`};
  if(id==="close" && !S.biz.branches.some(x=>x.outlets>1)) return {ok:false, why:"没有能撤的网点"};
  if(id==="platform" && S.biz.platformDone.length >= PLATFORMS_L3.length) return {ok:false, why:"区里的平台都谈过了"};
  if(id==="reportup" && S.biz.reported) return {ok:false, why:"这个季度已经回过主城了"};
  return {ok:true};
}

function doOpenOutlet(aid){
  const ck = canActL3("open"); if(!ck.ok) return null;
  const a = area(aid); if(!a) return null;
  const o = B3().outlet;
  apUse(1);
  S.biz.budget -= o.build; S.month.spent += o.build;
  // 爬坡速度看热度和竞争,封顶看人口
  const ramp = Math.round(o.rampMin + (o.rampMax - o.rampMin) * clamp((a.heat - a.comp*0.5)/80, 0, 1));
  const cap = Math.round(o.capMin + (o.capMax - o.capMin) * clamp(a.pop/60 * 0.6 + a.heat/100*0.4, 0, 1));
  S.biz.outletSeq++;
  S.biz.newOutlets.push({id:"no"+S.biz.outletSeq, area:aid, dep:0, ramp, cap, age:0, earned:-o.build, paid:false});
  a.rep = c100(a.rep + o.repOpen);
  S.biz.opened++;
  keyEvent(`在万州${a.name}开了新网点`);
  log("good", `${a.name}的新网点挂牌了。剪彩那天来了两个区里的干部，横幅是谭敏连夜找人做的。`);
  return {ramp, cap};
}

function doCloseOutlet(bid){
  const ck = canActL3("close"); if(!ck.ok) return null;
  const x = branch(bid); if(!x || x.outlets <= 1) return null;
  const c = B3().closeOutlet;
  apUse(1);
  const loss = Math.round(x.dep / x.outlets * c.lossShare);
  x.outlets--; x.dep -= loss;
  S.biz.expenseQ = Math.max(0, S.biz.expenseQ - c.saveY/4);
  const a = area(x.area); a.rep = c100(a.rep + c.rep);
  S.biz.closed++; S.flags.closedAt = S.turn; S.flags.closedArea = a.id;
  const p = person(x.mgr); if(p) fav(p.id, -4);
  log("warn", `${x.name}撤掉了一个网点。关门那天，卷帘门上贴了张告示，写着最近的网点怎么走。<span class="num">存款-${fmtWan(loss)}</span>`);
  return {loss};
}

function doRenovate(bid){
  const ck = canActL3("renovate"); if(!ck.ok) return null;
  const x = branch(bid); if(!x || x.renov >= 0.3) return null;
  const r = B3().renovate;
  apUse(1);
  S.biz.budget -= r.cost; S.month.spent += r.cost;
  x.renov = r1(x.renov + r.eff);
  log("good", `${x.name}做了智能化改造。大堂里多了三台机器，柜台少了一个窗口。`);
  return true;
}

function doTilt(line){
  const ck = canActL3("tilt"); if(!ck.ok) return null;
  if(!LINES_L3.find(l=>l.id===line) || S.biz.tilt === line) return null;
  apUse(1);
  S.biz.tilt = line;
  Object.entries(S.biz.lineHeads).forEach(([k,id]) => { if(id) fav(id, k===line ? 6 : B3().tilt.others); });
  const L = LINES_L3.find(l=>l.id===line);
  log("", `分行党委会定了：今年资源往${L.name}倾斜。散会的时候，另外几个部门的老总走在最后面。`);
  return true;
}

function appointCandsL3(bid){
  const used = new Set(S.biz.branches.map(x=>x.mgr).concat(Object.values(S.biz.lineHeads)));
  const pool = S.people.filter(p => p.alive && p.met && !used.has(p.id) && p.skill != null && (p.kind==="reserve" || ((p.lvMet<=2) && p.skill >= 60 && p.pos.indexOf("离职")<0 && p.pos.indexOf("被查")<0 && p.pos !== "南岸支行行长")));
  return pool.filter(p => !["zhouqm","maben","weilc","lu","gu","huang"].includes(p.id));
}
function doAppointL3(bid, pid){
  const ck = canActL3("appoint"); if(!ck.ok) return null;
  const x = branch(bid), np = person(pid); if(!x || !np) return null;
  const b = B3().appoint;
  apUse(1);
  const old = person(x.mgr);
  if(old){ fav(old.id, b.oldFavHit); old.pos = "万州分行调研员"; old.recent = `从${x.name}调下来`; old.kind = "npc"; }
  x.mgr = pid; np.pos = x.name + "行长"; np.kind = "sub"; np.recent = np.lvMet < 3 ? "从主城调来万州，你点的名" : "你提上来的";
  fav(pid, b.newFav);
  keyEvent(`提拔${np.name}任${x.name}行长`);
  log("", `${x.name}换了行长：${np.name}。${old ? old.name + "搬办公室那天，把墙上的锦旗一面面取下来，卷好带走了。" : ""}`);
  return true;
}

function doPlatform(){
  const ck = canActL3("platform"); if(!ck.ok) return null;
  const pf = PLATFORMS_L3.find(p => !S.biz.platformDone.includes(p.id));
  if(!pf) return null;
  apUse(1);
  const b = B3().platform;
  const size = Math.round(rr(b.size) / 10000) * 10000;
  S.biz.platformOffer = {id:pf.id, size};
  return S.biz.platformOffer;
}
function decidePlatform(accept){
  const off = S.biz.platformOffer; if(!off) return null;
  const pf = PLATFORMS_L3.find(p=>p.id===off.id), b = B3().platform;
  S.biz.platformDone.push(off.id); S.biz.platformOffer = null;
  if(accept){
    S.biz.loans.platform += off.size;
    dirt(b.clean);
    const def = R() < b.defP;
    S.loanBook.push({id:"pf_"+off.id, name:pf.name, amt:off.size, tier:"high", src:"platform", lv:3, at:S.monthAbs, defAt:S.monthAbs + ri(b.delayM), def, done:false});
    fav("lu", 3);
    keyEvent(`为${pf.what}提供${fmtYi(off.size)}融资`);
    log("warn", `和${pf.name}签了。合同附件里有一份区财政局的「情况说明」，没有盖公章。<span class="num">贷款+${fmtYi(off.size)}</span>`);
  } else {
    log("", `${pf.name}的方案你退回去了。区里的人走的时候说：「那我们再找找别家。」`);
  }
  return accept;
}

function doReportUpL3(){
  const ck = canActL3("reportup"); if(!ck.ok) return null;
  apUse(1);
  S.biz.reported = true;
  fav("lu", B3().reportUp.fav);
  const lines = [
    "你开了三个小时高速回主城。陆明远听了二十分钟，问：「万州的不良，什么时候能下来？」",
    "陆明远办公室的窗台上，那盆兰花换了一盆。他听完你的汇报，把茶杯往你这边推了推。",
    "你在陆明远门口等了一个钟头。进去以后他只问了一件事：江南新区的房子卖得怎么样。",
  ];
  log("", pick(lines) + ` <span class="num">陆明远好感+${B3().reportUp.fav}</span>`);
  return true;
}

/* 不良处置(不占行动点,每季有上限) */
function disposeCap(){ return B3().dispose.perQ + (S.biz.tilt==="risk" ? B3().dispose.riskBonus : 0); }
function disposeNpa(id, how){
  const x = S.biz.npa.find(n=>n.id===id); if(!x || x.stage) return null;
  if(S.biz.disposedQ >= disposeCap()) return null;
  const d = B3().dispose;
  if(how === "writeoff"){
    if(S.biz.writeoffUsed + x.amt > d.writeoff.quotaY) return null;
    S.biz.writeoffUsed += x.amt;
    S.biz.npa = S.biz.npa.filter(n=>n!==x);
    S.biz.disposedQ++;
    log("", `${x.name}核销了。${fmtWan(x.amt)}从报表上拿掉，报告送去了分行。`);
    return true;
  }
  if(how === "restr"){
    S.biz.npa = S.biz.npa.filter(n=>n!==x);
    S.biz.restr.push({name:x.name, amt:x.amt, type:x.type, at:S.turn + d.restr.redefQ, redef: R() < d.restr.redef});
    S.biz.disposedQ++;
    log("", `和${x.name}谈了重组，还款期往后推了两年。`);
    return true;
  }
  const m = d[how]; if(!m) return null;
  const cost = Math.round(x.amt * m.cost);
  S.month.spent += cost;
  x.stage = how; x.until = S.turn + m.q;
  S.biz.disposedQ++;
  if(how==="sue" && R() < m.noiseP){ const a = pick(S.biz.areas); a.rep = c100(a.rep - 4); log("warn", `起诉${x.name}的事上了本地论坛，帖子标题是「银行逼死老厂」。`); }
  else log("", `${x.name}转${how==="collect"?"催收":"诉讼"}。${how==="sue"?"律师函是周五寄出去的。":"风险部派了两个人盯着。"}`);
  return true;
}
function setMix(corp, micro, retail){
  const s = corp + micro + retail; if(s <= 0) return false;
  S.biz.mixTarget = {corp: corp/s, micro: micro/s, retail: retail/s};
  return true;
}
