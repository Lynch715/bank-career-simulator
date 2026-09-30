/* =====================================================================
   L2 行动(每个 1 AP)。贷款审批不占行动点。
   ===================================================================== */
const ACTIONS_L2 = [
  {id:"supervise", name:"下网点督导", desc:"选一个网点，本月产出和士气上去"},
  {id:"push",      name:"推进对公项目", desc:"项目往前走一格；到了审批就上会"},
  {id:"visit",     name:"拜访客户",   desc:"登门拜访或请顿饭，项目过会的把握大一些"},
  {id:"appoint",   name:"人事任免",   desc:"换一个网点的负责人"},
  {id:"campaign",  name:"营销战役",   desc:"全支行一起冲存款，花营销费用"},
  {id:"reportup",  name:"向上汇报",   desc:"去分行找周启明汇报工作"},
];

function canActL2(id){
  if(S.phase!=="play") return {ok:false, why:"现在不能操作"};
  if(S.ap < 1) return {ok:false, why:"本月行动点用完了"};
  const b = B2();
  if(id==="campaign"){
    if(S.biz.campaignDone) return {ok:false, why:"这个月已经搞过一次了"};
    if(S.biz.budget < b.campaign.cost) return {ok:false, why:`营销费用不够（要${b.campaign.cost}万）`};
  }
  if(id==="reportup" && S.biz.reported) return {ok:false, why:"这个月已经去过分行了"};
  if((id==="push"||id==="visit") && !activeProjects().length) return {ok:false, why:"看板上没有在跟的项目"};
  return {ok:true};
}
function activeProjects(){ return S.biz.projects.filter(p=>!p.lost && p.stage<3); }

function doSupervise(oid){
  const ck = canActL2("supervise"); if(!ck.ok) return null;
  const o = outlet(oid); if(!o || o.supervised) return null;
  const b = B2().supervise;
  apUse(1);
  o.supervised = true; o.morale = c100(o.morale + b.morale);
  const p = person(o.mgr);
  const d = p ? (b.fav[p.trait] != null ? b.fav[p.trait] : 1) : 0;
  if(p) fav(p.id, d);
  const lines = {
    狼性: `你在南坪坐了一上午。${p&&p.name}把排班表改了三遍，送你到门口时说：「领导放心，这个月不会难看。」`,
    稳健: `你去茶园看了晨会。${p&&p.name}让柜员把上周的差错单念了一遍，念完才讲营销。`,
    关系: `你到四公里的时候，${p&&p.name}已经把社区主任请来了，桌上泡着茶。`,
    新手: `你回了趟弹子石。${p&&p.name}把这个月的客户名单拿给你看，有几行是你原来的字迹。`,
    老实: `你在网点转了一圈。${p&&p.name}跟在后面，你问一句，${p&&p.sex==="m"?"他":"她"}答一句。`,
  };
  log("good", ((p && lines[p.trait]) || `你去${o.name}督导了一天。`) + ` <span class="num">${o.name}本月产出提高</span>`);
  return true;
}

function doPush(pid){
  const ck = canActL2("push"); if(!ck.ok) return null;
  const p = project(pid); if(!p || p.lost || p.stage>=3) return null;
  apUse(1);
  return projAdvance(p, false);
}

function doVisit(pid, gift){
  const ck = canActL2("visit"); if(!ck.ok) return null;
  const p = project(pid); if(!p || p.lost || p.stage>=3) return null;
  const b = B2().project, d = PROJ_L2.find(x=>x.id===p.id);
  if(gift && S.biz.budget < b.giftCost) return null;
  apUse(1);
  if(gift){
    p.gift++; S.biz.budget = r1(S.biz.budget - b.giftCost); S.month.spent = (S.month.spent||0) + b.giftCost;
    dirt(b.giftClean);
    if(d.who) fav(d.who, 6);
    log("warn", `请${d.name}的人在南滨路吃了顿饭，后备箱里放了两瓶酒。${d.who==="weilc"?"魏临川喝到第三杯，开始叫你兄弟。":"对方临走说了句「贵行有诚意」。"}`);
  } else {
    p.visits++;
    if(d.who) fav(d.who, 3);
    log("good", `去${d.name}坐了一下午，把方案一页页过了一遍。对方财务把你的名片插进了桌垫下面。`);
  }
  if(p.stage < 2 && R() < 0.5) projAdvance(p, true);
  return true;
}

/* 任免候选:L1 的旧部 + 现任负责人之外的人 */
function appointCands(oid){
  const o = outlet(oid);
  const used = new Set(S.biz.outlets.map(x=>x.mgr).concat([S.biz.corp.lead]));
  return S.people.filter(p => p.alive && p.met && p.kind==="staff" && p.skill!=null && !used.has(p.id) && p.pos.indexOf("离职")<0);
}
function doAppoint(oid, pid){
  const ck = canActL2("appoint"); if(!ck.ok) return null;
  const o = outlet(oid), np = person(pid); if(!o || !np) return null;
  const b = B2().appoint;
  apUse(1);
  const old = o.mgr ? person(o.mgr) : null;
  if(old){ fav(old.id, b.oldFavHit); old.pos = "南岸支行后台"; old.recent = `被你从${o.name}调下来`; old.kind = old.kind==="sub" ? "npc" : old.kind; }
  o.mgr = pid; o.morale = b.moraleReset;
  np.pos = o.name + "负责人"; np.recent = "你提上来的"; np.kind = "sub"; if(!np.trait) np.trait = "新手";
  fav(pid, b.newFav);
  S.biz.outlets.forEach(x => { if(x.id!==oid && x.mgr) fav(x.mgr, b.othersMorale); });
  keyEvent(`提拔${np.name}任${o.name}负责人`);
  log("", `${o.name}换了负责人：${np.name}。${old?old.name+"交钥匙的时候，把办公室的绿萝也搬走了。":""}`);
  return true;
}

function doCampaign(){
  const ck = canActL2("campaign"); if(!ck.ok) return null;
  const b = B2().campaign;
  apUse(1);
  S.biz.campaignDone = true;
  S.biz.budget = r1(S.biz.budget - b.cost); S.month.spent = (S.month.spent||0) + b.cost;
  let tot = 0;
  S.biz.outlets.forEach(o => { const add = Math.round(o.dep * b.depK * delegK(o.mgr)); o.dep += add; tot += add; o.morale = c100(o.morale + b.morale); if(o.mgr) fav(o.mgr, b.fav); });
  log("good", `全支行搞了一场「南岸存款月」。四个网点门口的拱门是同一家公司扎的。<span class="num">存款+${fmtWan(tot)}</span>`);
  return {tot};
}

function doReportUp(){
  const ck = canActL2("reportup"); if(!ck.ok) return null;
  apUse(1);
  S.biz.reported = true;
  fav("zhouqm", B2().reportUp.fav);
  const lines = [
    "周启明听你讲完，在本子上记了两行，问了一句不良率。",
    "你在周启明办公室外面等了四十分钟。进去讲了十分钟，他说：「嗯，按这个思路。」",
    "周启明把你的汇报材料翻到最后一页，用红笔在一个数字下面画了道线。",
  ];
  log("", pick(lines) + ` <span class="num">周启明好感+${B2().reportUp.fav}</span>`);
  return true;
}
