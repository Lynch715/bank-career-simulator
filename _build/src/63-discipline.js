/* 分级处分：风险记录不删除，结案游标保证同一批事项只处理一次。 */
function disciplineState(){
  if(!S.discipline) S.discipline = {cursor:0, resolvedRisk:0, history:[], until:0, tasks:{}, removed:false};
  return S.discipline;
}
function pendingDiscipline(){
  const d = S.discipline, ledger = S.flags.riskLedger || [];
  const entries = ledger.slice(d ? d.cursor : 0);
  const recorded = entries.reduce((n,e)=>n+(e.added||0),0);
  const extra = Math.max(0, 100-S.core.clean-(d ? d.resolvedRisk : 0)-recorded);
  return {entries, points:entries.reduce((n,e)=>n+(e.points==null ? e.added||0 : e.points),0)+extra, extra};
}
function groupedRiskReasons(entries){
  const groups = new Map();
  entries.forEach(e=>{ const reason = String(e.reason||"具体事项待核实").trim(); groups.set(reason,(groups.get(reason)||0)+1); });
  return [...groups].map(([reason,n])=>reason+(n>1?`（共${n}次）`:"")).join("；");
}
function disciplineBlocked(){
  const d = S.discipline;
  return !!(d && (S.monthAbs < d.until || Object.values(d.tasks).some(n=>n<1)));
}
function captureCareerPost(){
  saveL2ProjectDefinitions();
  const post = {};
  post.level=S.lv;
  ["biz","kpi","rivals","turn","year","m","sched","pendingEv","chal"].forEach(k=>post[k]=S[k]);
  post.loanDone=(S.loanBook||[]).filter(l=>l.done).map(l=>l.id);
  (S.careerPosts || (S.careerPosts={}))[S.lv] = JSON.parse(JSON.stringify(post));
}
function restoreCareerPost(lv, departure){
  const post = S.careerPosts && S.careerPosts[lv];
  if(!post) return false;
  (S.loanBook||[]).filter(l=>(lv>=4?l.lv<=lv:l.lv===lv) && l.done && !(post.loanDone||[]).includes(l.id)).forEach(l=>archiveLoanDefault(post,l));
  ["biz","kpi","rivals","turn","year","m","sched","pendingEv","chal"].forEach(k=>S[k]=JSON.parse(JSON.stringify(post[k])));
  if(departure && lv===2){ const row=S.biz.outlets.find(x=>x.id==="dzs"); if(row)row.dep=departure.dep; }
  if(departure && lv===4){ const row=S.biz.inst.find(x=>x.id==="wz"); if(row)Object.assign(row,{dep:departure.dep,loans:departure.loans,npl:departure.npl}); }
  S.turn++; S.year++; S.m=lv===5?6:(lv>=3?3:1);
  S.promo={windowAt:S.turn+BALANCE.tenure[lv],rumored:false,bt:false,stage:null,tries:0,last:null};
  S.pendingEv=[]; S.chal=[];
  S.track.scoreHistory=[]; S.track.rankHistory=[];
  restoreL2ProjectDefinitions(); issueKpi(); monthStart(true); computeAll();
  return true;
}
function archiveLoanDefault(post,l){
  const b=post.biz;
  const lv=post.level || (b.inst?4:b.peers?5:b.branches?3:2);
  if(lv===2 || lv===5) b.npl+=l.amt;
  else if(lv===3){ b.npaSeq++; b.npa.push({id:"npa"+b.npaSeq,name:l.name,amt:l.amt,type:l.src==="platform"?"platform":"corp",stage:null,until:0,origin:"离任后旧贷逾期",orig:l.amt}); }
  else if(lv===4){ const row=b.inst.find(x=>x.id===(l.lv<=2?"na":l.lv===3?"wz":l.institution||(l.id==="mb4"?"yb":"yyb"))); if(row)row.npl+=l.amt; }
  (post.loanDone||(post.loanDone=[])).push(l.id);
}
function settleDisplacedLoans(){
  (S.loanBook||[]).forEach(l=>{
    if(l.lv<=S.lv || !l.def || l.done || S.monthAbs<l.defAt)return;
    const post=S.careerPosts && S.careerPosts[l.lv]; if(!post)return;
    archiveLoanDefault(post,l); l.done=true;
    log("bad",`原岗位旧贷逾期：${esc(l.name)}，${fmtWan(l.amt)}已计入原机构的不良记录。降职不会消除这笔旧账。`);
  });
}
function demoteCareer(){
  const target=S.lv-1;
  captureCareerPost();
  S.lv=target; S.phase="play"; S.carry=S.carry||{};
  if(!restoreCareerPost(target)){
    // 旧档尚无岗位快照：以该岗位模板接任，保留人物、员工、旧贷和全局履历。
    const people=JSON.parse(JSON.stringify(S.people)), staffCopy=JSON.parse(JSON.stringify(S.staff));
    const histories={score:S.track.scoreHistory.slice(),rank:S.track.rankHistory.slice()};
    if(target===1){
      initL1();
      if(staffCopy.length) S.staff=staffCopy;
      const dep=S.track.l1End && S.track.l1End.dep;
      if(dep) S.biz.base+=dep-depTotal();
      S.kpi={card:[],score:0,rank:0,history:[],depStart:0,ytd:{fee:0,cust:0,card:0},comp:B1().compStart};
      S.promo={windowAt:BALANCE.tenure[1],rumored:false,bt:false,stage:null,tries:0,last:null};
      S.turn=1; S.m=1; S.year=1; S.sched=[]; S.pendingEv=[]; S.chal=[];
      S.track.scoreHistory=[]; S.track.rankHistory=[];
      issueKpi(); monthStart(true);
    } else [null,null,initL2,initL3,initL4][target](target===2 ? S.carry.succ : undefined);
    const newcomers=S.people.filter(p=>!people.some(q=>q.id===p.id));
    S.people=people.concat(newcomers);
    S.track.displacedHistory=(S.track.displacedHistory||[]).concat([{lv:target+1,...histories}]);
    computeAll();
  }
  S.justEntered=true;
  S.promo.windowAt=Math.max(S.promo.windowAt,S.turn+Math.ceil(BALANCE.discipline.demoteMonths/(BALANCE.turnMonths[target]||1)));
}
function resolveDiscipline(source){
  const pending=pendingDiscipline();
  if(pending.points<=0) return null;
  const d=disciplineState(), b=BALANCE.discipline;
  const repeated=d.history.some(h=>h.kind==="demote"||h.kind==="remove");
  const kind=pending.points>=b.dismiss || (repeated && pending.points>=b.demote) ? "dismiss" : pending.points>=b.demote ? (S.lv>1?"demote":"remove") : pending.points>=b.probation ? "probation" : "warning";
  const reason=groupedRiskReasons(pending.entries) || publicityReason();
  const record={kind,source,lv:S.lv,age:S.age,monthAbs:S.monthAbs,points:r1(pending.points),reason,from:d.cursor,to:(S.flags.riskLedger||[]).length};
  d.cursor=record.to; d.resolvedRisk=100-S.core.clean; d.signedHuangHandled=!!S.flags.signedHuang; d.history.push(record);
  S.promo.stage=null; S.promo.rumored=false; S.flags.audit=false;
  if(kind==="dismiss"){
    endGame("caught",true);
    S.over.text=`核查结论下来，${reason}。\n\n${repeated?"此前已经受到撤职或降职处分，这次又发生严重违规。":"本次问题情节极其严重。"}行里决定解除劳动关系，你的银行职业生涯到此结束。`;
    save(); return record;
  }
  const oldLevel=S.lv;
  if(kind==="demote") demoteCareer();
  const months=kind==="warning"?b.warningMonths:kind==="probation"?b.probationMonths:b.demoteMonths;
  d.until=Math.max(d.until,S.monthAbs+months);
  d.tasks=kind==="warning"?{training:0}:{training:0,review:0,repair:0};
  d.completed=false;
  d.removed=kind==="remove" || d.removed;
  if(d.removed) S.biz.task=null;
  d.lastTaskAt=null;
  const review=reinstatementState();
  if(review){ review.nextAt=Math.max(review.nextAt,d.until); review.cleanSince=S.monthAbs; }
  S.phase="play"; S.over=null; S.lvTitle=null;
  const hit=kind==="warning"?8:kind==="probation"?15:25;
  fav(supId(),-hit);
  subordinates().forEach(p=>fav(p.id,-Math.ceil(hit/3)));
  computeCore();
  S.promo.windowAt=Math.max(S.promo.windowAt,S.turn+Math.ceil(months/(BALANCE.turnMonths[S.lv]||1)));
  const title={warning:"警告处分",probation:"取消晋升，进入考察期",demote:"降职任用",remove:"撤职整改"}[kind];
  record.target=S.lv;
  keyEvent(`${title}：${reason}${oldLevel!==S.lv?`，降任${LV_TITLE[S.lv]}`:""}`);
  log("bad",`${title}：${esc(reason)}。${kind==="demote"?`改任${LV_TITLE[S.lv]}。`:kind==="remove"?"撤销网点负责人职务，转入后台整改岗位。":"本次晋升取消。"}考察至少${months}个月，完成整改后可重新争取任职与晋升；风险和处分记录保留。`);
  S.disciplineNotice={title,body:`核查事项：${reason}。\n\n${kind==="demote"?`降一级，改任${LV_TITLE[S.lv]}，继续经营。`:kind==="remove"?"撤销网点负责人职务，转到后台整改。可维护客户、做厅堂服务；人员安排及其他管理行动暂停。":"本次晋升取消，继续在当前岗位工作。"}\n\n考察至少${months}个月；完成整改后${review?`可在期末申请恢复${LV_TITLE[review.target]}，复核通过后直接复任，不再重复副职过渡。`:"恢复任职与晋升资格。"}原有年龄、人脉、风险记录和未到期贷款保留，同一批事项不再重复处分。`};
  save(); return record;
}
function routineDisciplineCheck(){
  const points=pendingDiscipline().points;
  if(S.phase!=="play" || points<=0 || points>=BALANCE.discipline.demote) return false;
  if(R()>=BALANCE.discipline.reviewP)return false;
  return !!resolveDiscipline("routine");
}
function showDisciplineNotice(done){
  const notice=S.disciplineNotice;
  if(!notice || S.phase==="over"){ if(done)done(); return; }
  delete S.disciplineNotice; save();
  ask({kind:"discipline",title:notice.title,body:notice.body,opts:[{t:"接受处分，继续工作"}]},done);
}
function doDisciplineTask(id){
  const d=S.discipline;
  if(S.phase!=="play" || !d || !Object.prototype.hasOwnProperty.call(d.tasks,id) || d.tasks[id]>=1 || S.ap<1 || d.lastTaskAt===S.monthAbs) return false;
  apUse(1); d.tasks[id]=1; d.lastTaskAt=S.monthAbs;
  log("good",`完成整改：${{training:"合规培训",review:"业务档案复核",repair:"客户善后回访"}[id]}。行动点-1，本期整改已完成。历史违规记录继续保留。`);
  updateDiscipline(); save(); return true;
}
function updateDiscipline(){
  const d=S.discipline;
  if(!d || d.completed || disciplineBlocked())return;
  d.completed=true; d.removed=false;
  keyEvent("完成整改考察，恢复任职与晋升资格");
  log("gold","整改任务完成，考察期已满。恢复任职与晋升资格，仍需正常参加考察与竞聘；历史处分记录保留。");
}

/* 恢复曾任职级与首次晋升分别考核；旧版处分存档按原处分记录衔接。 */
function reinstatementState(){
  const d=S.discipline; if(!d || !d.history)return null;
  let index=-1;
  for(let i=d.history.length-1;i>=0;i--){
    const h=d.history[i];
    if(h.kind==="demote" && !h.reinstatedAt && h.lv===S.lv+1){ index=i; break; }
  }
  if(index<0)return null;
  if(!d.reinstatement || d.reinstatement.record!==index){
    const h=d.history[index];
    d.reinstatement={record:index,target:h.lv,nextAt:d.until,cleanSince:h.monthAbs,attempts:0,last:null};
  }
  return d.reinstatement;
}
function trackReinstatementConduct(){
  const review=reinstatementState(); if(!review)return;
  if(pendingDiscipline().points>0 || S.kpi.comp<BALANCE.discipline.returnComp) review.cleanSince=S.monthAbs;
}
function reinstatementAssessment(){
  const r=reinstatementState(); if(!r)return null;
  const b=BALANCE.discipline;
  const score=r1(S.core.perf*0.5+S.core.trust*0.25+S.core.rep*0.25);
  const reasons=[];
  if(disciplineBlocked())reasons.push("整改任务或考察期限尚未完成");
  if(pendingDiscipline().points>0)reasons.push("有新增待核查问题");
  if(S.monthAbs-r.cleanSince<b.returnCleanMonths)reasons.push(`需连续${b.returnCleanMonths}个月合规达标`);
  if(S.kpi.comp<b.returnComp)reasons.push(`合规需达到${b.returnComp}分`);
  if(S.core.perf<b.returnPerf)reasons.push(`业绩需达到${b.returnPerf}分`);
  if(S.core.trust<b.returnTrust)reasons.push(`上级信任需达到${b.returnTrust}分`);
  if(score<b.returnScore)reasons.push(`复核综合分需达到${b.returnScore}分`);
  return {score,pass:!reasons.length,reasons};
}
function applyReinstatement(){
  const review=reinstatementState(), assessment=reinstatementAssessment();
  if(!review || S.phase!=="play" || !assessment.pass || S.monthAbs<review.nextAt || S.age>=BALANCE.retireAge)return false;
  const target=review.target, rec=S.discipline.history[review.record];
  const departure={dep:depTotal()};
  if(S.lv===2)Object.assign(departure,{loans:S.biz.loans,npl:S.biz.npl});
  if(S.lv===3)Object.assign(departure,{loans:loansTotalL3(),npl:nplL3()});
  if(S.lv===4)Object.assign(departure,{loans:loansL4(),npl:nplL4(),rating:ratingNow()});
  S.carry=S.carry||{};
  if(S.lv>=2)S.carry["l"+S.lv]=Object.assign({},S.carry["l"+S.lv]||{},departure);
  captureCareerPost();
  S.lv=target; S.carry=S.carry||{};
  if(!restoreCareerPost(target,departure)) [null,null,initL2,initL3,initL4,initL5][target](target===2?S.carry.succ:undefined);
  rec.reinstatedAt={monthAbs:S.monthAbs,age:S.age,lv:target};
  review.completedAt=S.monthAbs;
  S.phase="play";S.over=null;S.lvTitle=null;S.justEntered=true;
  keyEvent(`${S.age}岁，复任${LV_TITLE[target]}`);
  log("gold",`复任复核通过，综合分${assessment.score}。恢复${LV_TITLE[target]}职务，直接上岗，不重复副职过渡。历史处分、风险与旧贷继续保留。`);
  save();return true;
}
function runReinstatement(done){
  const review=reinstatementState(); if(!review || !["play","promo"].includes(S.phase)){done();return;}
  if(S.phase==="promo"){S.phase="play";S.promo.stage=null;}
  if(S.age>=BALANCE.retireAge){log("", "已到退休年龄，复任考察结束，办理离岗。");endGame("lock",false,{title:"到龄离岗",text:`${S.age}岁，已达到离岗年龄。\n\n复任考察到此结束，你在${LV_TITLE[S.lv]}岗位办理交接。曾经的任职、整改和处分都保留在履历里。`});done();return;}
  if(S.monthAbs<review.nextAt || disciplineBlocked()){done();return;}
  const assessment=reinstatementAssessment();review.attempts++;
  review.last={monthAbs:S.monthAbs,score:assessment.score,pass:assessment.pass,reasons:assessment.reasons};
  if(assessment.pass){
    const title=LV_TITLE[review.target];if(!applyReinstatement()){done();return;}
    ask({kind:"reinstatement",title:"复任复核通过",body:`恢复${title}职务，直接上岗。\n\n年龄和履历继续累计，处分记录与旧贷保留。今后超过原有职级的晋升，仍按正常流程考察。`,opts:[{t:"回到岗位"}]},done);
  }else{
    review.nextAt=S.monthAbs+BALANCE.discipline.returnRetryMonths;
    log("warn",`复任复核暂未通过：${assessment.reasons.join("；")}。${BALANCE.discipline.returnRetryMonths}个月后再次复核，继续经营。`);
    save();
    ask({kind:"reinstatement",title:"继续争取复任",body:`本次未通过：${assessment.reasons.join("；")}。\n\n${BALANCE.discipline.returnRetryMonths}个月后可再复核；恢复曾任职级不使用首次晋升年龄线，到${BALANCE.retireAge}岁办理离岗。`,opts:[{t:"继续整改经营"}]},done);
  }
}
function exhaustedStrategicProjects(){
  return S.lv===4 && S.biz.projects.length>0 && !S.biz.projQueue.length && S.biz.projects.every(p=>p.done);
}
function adaptReinstatementKpi(){
  if(!reinstatementState() || !exhaustedStrategicProjects())return;
  const item=S.kpi.card.find(k=>k.k==="proj");
  if(item)Object.assign(item,{k:"projectOps",name:"存量项目质量",target:100,unit:"分",kind:"ratio"});
}
function canResumeReinstatement(){
  return S.phase==="over" && S.over && ["lock","lock2"].includes(S.over.id) && S.age<BALANCE.retireAge && !!reinstatementState();
}
function resumeReinstatement(){
  if(!canResumeReinstatement())return false;
  S.phase="play";S.over=null;S.justEntered=false;advance(true);
  save();return true;
}
function canResumeLegacyDiscipline(){
  return S.phase==="over" && S.over && S.over.id==="caught" && !S.discipline && pendingDiscipline().points>0 && pendingDiscipline().points<BALANCE.discipline.dismiss;
}
function resumeLegacyDiscipline(){
  if(!canResumeLegacyDiscipline())return false;
  const oldLevel=S.lv;
  S.phase="play"; S.over=null;
  resolveDiscipline("legacy");
  if(S.lv===oldLevel) advance(true);
  S.justEntered=false; save();
  return true;
}
