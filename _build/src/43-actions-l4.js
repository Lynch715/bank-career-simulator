/* =====================================================================
   L4 行动(每个 1 AP)
   ===================================================================== */
const ACTIONS_L4 = [
  {id:"swap",     name:"调整分工",   desc:"两个副行长对调分管条线"},
  {id:"talk",     name:"找副行长谈话", desc:"关系近一点，班子团结一点"},
  {id:"startp",   name:"启动战略项目", desc:"同时最多三个，占资本额度"},
  {id:"pushp",    name:"推进战略项目", desc:"亲自盯一个项目，进度加一格"},
  {id:"focus",    name:"机构资源倾斜", desc:"今年资源往一个二级机构偏"},
  {id:"quota",    name:"去总行要额度", desc:"资本额度不够用的时候去要"},
  {id:"regulator",name:"监管沟通",   desc:"去监管局汇报，评级好说一点"},
];
function canActL4(id){
  if(S.phase!=="play") return {ok:false, why:"现在不能操作"};
  if(S.ap < 1) return {ok:false, why:"本季行动点用完了"};
  const act = S.biz.projects.filter(p=>!p.done);
  if(id==="startp"){
    if(act.length >= B4().proj.max) return {ok:false, why:"手上已经有三个项目了"};
    if(!S.biz.projQueue.length) return {ok:false, why:"没有新项目可以启动"};
  }
  if(id==="pushp" && !act.length) return {ok:false, why:"没有在推的项目"};
  return {ok:true};
}
function doSwap(a, bId){
  const ck = canActL4("swap"); if(!ck.ok) return null;
  const x = S.biz.deputies.find(d=>d.id===a), y = S.biz.deputies.find(d=>d.id===bId); if(!x || !y || x===y) return null;
  apUse(1);
  const before = x.fit[x.line] + y.fit[y.line];
  [x.line, y.line] = [y.line, x.line];
  const after = x.fit[x.line] + y.fit[y.line];
  const u = B4().unity;
  S.biz.unity = c100(S.biz.unity + u.swap + (after > before ? u.good : 0));
  fav(x.id, after > before ? 2 : -3); fav(y.id, after > before ? 2 : -3);
  const ln = id => LINES_L4.find(l=>l.id===id).name;
  log("", `班子会上宣布了新分工：${x.name}管${ln(x.line)}，${y.name}管${ln(y.line)}。会开完，${y.name}在走廊上站了一会儿才回办公室。`);
  return {better: after > before};
}
function doTalk(id){
  const ck = canActL4("talk"); if(!ck.ok) return null;
  const p = person(id); if(!p) return null;
  apUse(1);
  fav(id, B4().unity.talk); S.biz.unity = c100(S.biz.unity + 3);
  const lines = {
    zhouqm: "周启明坐下来先提南岸：「你那时候报的数，我都记得。」两个人都笑了。",
    duheng: "杜衡带了一份公司部的规划，讲了四十分钟，最后问了句：「您看哪条不行？」",
    shenlan: "沈岚没带材料，聊了半个钟头她女儿的高考。走的时候说，零售那边她心里有数。",
    jianggd: "蒋国栋把一份合同摊在桌上，指着第十七条：「这种条款，以后分行不签。」你说好。",
  };
  log("good", (lines[id] || `你和${p.name}谈了一下午。`) + ` <span class="num">${p.name}好感+${B4().unity.talk}</span>`);
  return true;
}
function doStartProj(pid){
  const ck = canActL4("startp"); if(!ck.ok) return null;
  const id = pid || S.biz.projQueue[0];
  const i = S.biz.projQueue.indexOf(id); if(i<0) return null;
  const s = STRAT_L4.find(x=>x.id===id);
  if(capRoom() < s.rwa) return {noRoom:true};
  apUse(1);
  S.biz.projQueue.splice(i,1);
  S.biz.projects.push({id, prog:0, done:false, at:S.turn});
  log("", `<b>${s.name}</b>启动了。${s.what}。项目组的第一次会在分行十七楼开，${deputy("corp") ? deputy("corp").name : "分管副行长"}坐在长桌那头。`);
  return true;
}
function doPushProj(pid){
  const ck = canActL4("pushp"); if(!ck.ok) return null;
  const p = S.biz.projects.find(x=>x.id===pid && !x.done); if(!p) return null;
  apUse(1);
  p.prog++;
  const s = STRAT_L4.find(x=>x.id===p.id);
  if(p.prog >= s.q) finishProject(p);
  else log("", `你去${s.name}的现场看了一天。回来的车上，项目组长把进度表改了一格。`);
  return true;
}
function doFocus(iid){
  const ck = canActL4("focus"); if(!ck.ok) return null;
  const x = inst(iid); if(!x) return null;
  apUse(1);
  S.biz.inst.forEach(r => r.focus = (r.id === iid));
  S.biz.focusId = iid;
  log("", `今年分行的资源往${x.name}偏。消息传得很快，下午就有两个二级分行的行长打来电话，问有没有「政策」。`);
  return true;
}
function doQuota(){
  const ck = canActL4("quota"); if(!ck.ok) return null;
  const q = B4().askQuota;
  apUse(1);
  if(person("lu").fav >= q.needFav){
    S.biz.capital += q.add; fav("lu", q.fav);
    log("good", `你在总行等了两天。第三天下午，陆明远把一份批复放在桌上：「就这一次。」<span class="num">资本额度+${fmtYi(q.add)}</span>`);
    return true;
  }
  fav("lu", -2);
  log("bad", "总行资负部的处长听你讲完，说要研究研究。你回重庆的高铁上，收到一条短信：本年度额度已分配完毕。");
  return false;
}
function doRegulator(){
  const ck = canActL4("regulator"); if(!ck.ok) return null;
  const r = B4().regTalk;
  apUse(1);
  fav("gu", r.fav); S.biz.regScore = Math.min(10, (S.biz.regScore||0) + r.score*0.5);
  log("", `你去监管局汇报。顾清越坐在长桌对面，面前一个笔记本，一支笔，一杯自己带的水。她问了三个问题，都是不良。<span class="num">顾清越好感+${r.fav}</span>`);
  return true;
}
