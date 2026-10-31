/* 游戏内授权与组织流程。阈值用于玩法，不代表现实银行的法定授权。旧档只补字段，不重记账。 */
BALANCE.authority={loanLimit:{2:{micro:600,corp:1000},3:{platform:100000}},reviewCoord:45,reviewBoard:45,reviewComp:70};
const FIRST_BRANCHES_L5={
  db:['辽宁','吉林','黑龙江','大连'],hb:['北京','天津','河北','山西','内蒙古'],
  xb:['陕西','甘肃','青海','宁夏','新疆'],hd:['上海','江苏','浙江','安徽','福建','江西','山东','宁波','厦门','青岛'],
  hz:['湖北','河南','湖南'],xn:['重庆','四川','贵州','云南','西藏'],hn:['广东','广西','海南','深圳']
};
function managementCheck(lv){
  if(!S||S.phase!=='play')return {ok:false,why:'当前不能办理'};
  if(lv&&S.lv!==lv)return {ok:false,why:'当前职务无此权限'};
  if(S.discipline?.removed)return {ok:false,why:'撤职整改期间管理权限暂停'};
  return {ok:true,why:''};
}
function governanceEnsure(g){
  if(!g.approvals)g.approvals=[];
  if(g.approvalSeq==null)g.approvalSeq=0;
  if(S.lv===5&&!S.biz.firstBranches){
    S.biz.firstBranches=[];
    S.biz.regions.forEach(r=>FIRST_BRANCHES_L5[r.id].forEach((name,i,all)=>{
      const id=i===0?r.id:r.id+'_'+i;
      const known=S.people.find(p=>careerLive(p)&&p.pos===name+'分行行长'&&!S.biz.firstBranches.some(x=>x.headId===p.id)&&!g.executives.some(x=>x.id===p.id));
      const headId=i===0&&r.headId?r.headId:known?known.id:'chief5_'+id;
      const row={id,name:name+'分行',regionId:r.id,headId,share:r.share/all.length,g:r.g};
      S.biz.firstBranches.push(row);
      if(!person(headId))S.people.push({id:headId,name:['沈','程','许','林','陈','方','叶'][Object.keys(FIRST_BRANCHES_L5).indexOf(r.id)]+['远衡','嘉宁','正安','明川','知行','文清','景和','若平','启明','思源'][i],skill:60,fav:50,kind:'sub',group:'一级分行',met:true,alive:true,lvMet:5,pos:row.name+'行长',role:row.name+'行长',trait:'稳健',recent:'现任一级分行负责人'});
    }));
    // 保留原交流人选，省分行已有现任时按总行专项岗位管理，避免同一省出现两个现任行长。
    S.people.filter(p=>p.kind==='reserve'&&careerLive(p)&&!S.biz.firstBranches.some(x=>x.headId===p.id)&&S.biz.firstBranches.some(x=>p.pos===x.name+'行长')).forEach(p=>{p.pos='总行专项岗位';});
    ['公司业务部','零售业务部','风险管理部','运营管理部'].forEach((name,i)=>{
      const id='hqdept5_'+i;if(!person(id))S.people.push({id,name:['陆承安','徐文澜','董明远','苏静宜'][i],kind:'reserve',group:'总行部门',met:true,alive:true,lvMet:5,skill:70,fav:50,pos:'总行'+name+'总经理',role:'总行'+name+'总经理',recent:'总行部门干部，可考察交流'});
    });
  }
  if(S.lv>=4)governanceChair();
}
function governanceChair(){
  const current=person('lu');
  if(current&&careerLive(current)){if(S.lv===5&&current.pos!=='总行董事长'){current.pos='总行董事长';current.recent='任总行董事长，主持董事会审议';}return current;}
  let p=person('chair5');
  if(!p){p={id:'chair5',name:'梁知远',kind:'sup',group:'董事会',met:true,alive:true,lvMet:4,skill:75,fav:60,pos:'总行董事长',role:'总行董事长',recent:'接任董事长，按任内经营和治理评价履职'};S.people.push(p);}
  return p;
}
function governanceTrust(){
  const chair=governanceChair(),g=S.biz.career;
  if(S.lv===5)return c100((g?.board??BC().boardStart)*0.7+(50+(S.biz.regScore||0)*5)*0.3);
  // 一级分行继续接受在任总行领导评价，退休前任不再作为正式上级。
  const weights=BALANCE.core.trustByLv[4],entries=Object.entries(weights).map(([id,k])=>[id==='lu'?chair:person(id),k]).filter(([p])=>careerLive(p));
  const total=entries.reduce((n,[p,k])=>n+k,0);
  return total?entries.reduce((n,[p,k])=>n+p.fav*k,0)/total:50;
}
function governanceRegionK(row){
  const rows=(S.biz.firstBranches||[]).filter(b=>b.regionId===row.id),share=rows.reduce((n,b)=>n+b.share,0);
  return share?rows.reduce((n,b)=>n+b.share*careerRegionK(b),0)/share:1;
}
function governanceRoles(id){
  if(S.lv!==3)return [];
  return S.biz.branches.filter(x=>x.mgr===id).map(x=>x.name+(x.id==='yyb'?'总经理':'行长')).concat(Object.entries(S.biz.lineHeads).filter(([k,pid])=>pid===id).map(([k])=>LINES_L3.find(x=>x.id===k).name+'负责人'));
}
function governanceActive(){return careerEnsure().approvals.filter(x=>['submitted','approved','executing'].includes(x.status));}
function governanceSubmit(kind,key,title,data,ap){
  const ck=careerCheck(0,ap==null?1:ap);if(!ck.ok)return null;
  const g=careerEnsure();
  if(governanceActive().some(x=>x.kind===kind&&x.key===key))return null;
  const row={id:'approval_'+(++g.approvalSeq),kind,key,title,data,status:'submitted',at:S.turn,lv:S.lv,reviewAt:S.turn+1};
  careerSpend(0,ap==null?1:ap);g.approvals.push(row);
  log('',`${title}已提交${kind==='appoint'?'组织审议与任免报批':kind==='loan'?'上级贷审会':kind==='quota'?'上级授信额度审批':kind==='open'||kind==='close'?'上级机构规划审批':'董事会审议及后续报批'}，下回合反馈；批复前不生效。`);
  careerDone();return row;
}
function governanceAppointCheck(slot,p){
  if(!slot||!p||!careerAvailable(slot.id).some(x=>x.id===p.id))return '人选不符合本级岗位要求或已任其他岗位';
  const r=careerRecord(p.id);
  if(r.assessedUntil<S.monthAbs)return r.assessedUntil<0?'请先完成履职考察':'履职考察已过期，请重新考察';
  if(r.training)return '正在专项培养';
  return '';
}
function governanceReviewReason(a){
  const g=careerEnsure();
  if(g.coord<BALANCE.authority.reviewCoord)return '班子协调不足，需先沟通后重新提交';
  if(S.lv===5&&g.board<BALANCE.authority.reviewBoard)return '董事会支持不足，需先完善经营与治理';
  if(a.kind==='appoint')return governanceAppointCheck(careerPositions().find(x=>x.id===a.data.postId),person(a.data.pid));
  if(['loan','quota'].includes(a.kind)&&(S.kpi.comp<BALANCE.authority.reviewComp||(a.kind==='loan'&&loanVisibleRisk(a.data.loan)&&S.kpi.comp<90)))return '风险审查未通过，材料退回';
  return '';
}
function governanceExecuteCheck(a){
  const ck=careerCheck(0,['loan','capital'].includes(a?.kind)?0:1);if(!ck.ok)return ck;
  if(!a||a.lv!==S.lv||a.status!=='approved')return {ok:false,why:'尚无有效批复'};
  if(a.kind==='appoint'){
    const why=governanceAppointCheck(careerPositions().find(x=>x.id===a.data.postId),person(a.data.pid));
    if(why)return {ok:false,why};
    if(careerPositions().find(x=>x.id===a.data.postId).pid!==a.data.oldId)return {ok:false,why:'岗位已变动，请撤回后重新报批'};
  }
  if(a.kind==='open'&&S.biz.budget<B3().outlet.build)return {ok:false,why:'筹建费用不足'};
  if(a.kind==='close'&&(!branch(a.data.bid)||branch(a.data.bid).outlets<=1))return {ok:false,why:'须保留支行基本服务网点'};
  if(a.kind==='loan'&&S.lv===3&&platformRoom()<a.data.loan.amt)return {ok:false,why:'信贷额度不足，批复不等于额度，可暂缓或撤回'};
  if(a.kind==='quota'&&(!careerEnsure().approvals.some(x=>x.id===a.data.loanId&&x.status==='approved')))return {ok:false,why:'对应融资已撤回或实施，请撤回额度方案'};
  if(a.kind==='capital'&&S.biz.capIssued>=2)return {ok:false,why:'本任资本债次数已用完'};
  return {ok:true,why:''};
}
function governanceExecute(id){
  const a=careerEnsure().approvals.find(x=>x.id===id);if(!governanceExecuteCheck(a).ok)return null;
  if(a.kind==='appoint'){
    const slot=careerPositions().find(x=>x.id===a.data.postId);
    careerApplyAppointment(slot,person(a.data.pid));a.status='done';
  }else if(a.kind==='loan'){
    const it=a.data.loan;
    if(S.lv===2)governanceBookL2(it);
    else{
      const b=B3().platform;S.biz.loans.platform+=it.amt;S.biz.platformCompliant=(S.biz.platformCompliant||0)+it.amt;
      S.loanBook.push({id:'pf_ok_'+a.id,name:it.name,amt:it.amt,tier:it.tier,src:'platform',approved:true,lv:3,at:S.monthAbs,defAt:S.monthAbs+ri(b.delayM),def:R()<b.defP/2,done:false});
      log('good',`${it.name}按上级批复落实授信与担保条件，发放${fmtYi(it.amt)}，占用信贷额度。`);
    }
    a.status='done';
  }else if(a.kind==='quota'){
    careerSpend(0);S.biz.quota+=a.data.amount;a.status='done';log('good',`上级批复补充信贷额度${fmtYi(a.data.amount)}，尚未发放贷款。`);
  }else if(a.kind==='capital'){
    S.biz.capital+=B5().dial.capital.add;S.biz.capIssued++;a.status='done';
    log('good',`完成董事会审议及发行报批后，二级资本债发行到账，资本+${fmtWy(B5().dial.capital.add)}。`);
  }else{
    careerSpend(a.kind==='open'?B3().outlet.build:0);
    a.status='executing';a.stage=0;a.nextAt=S.turn+1;
    log('',`${a.title}按批复启动${a.kind==='open'?'筹建':a.kind==='close'?'客户迁移与人员安置':'试点及人员安置'}，下回合验收，不立即改变经营机构。`);
  }
  return careerDone();
}
function governanceCancel(id){
  if(!managementCheck().ok)return null;
  const a=governanceActive().find(x=>x.id===id&&x.status!=='executing');if(!a)return null;
  a.status='cancelled';log('',a.title+'已撤回，尚未发生放款或机构变动。');return careerDone();
}
function governanceMonthStart(){
  if(!managementCheck().ok)return;
  const g=careerEnsure(),stamp=S.lv+':'+S.turn+':'+S.monthAbs;
  if(g.approvalTick===stamp)return;g.approvalTick=stamp;
  g.approvals.forEach(a=>{
    if(a.lv!==S.lv)return;
    if(a.status==='submitted'&&S.turn>=a.reviewAt){
      const why=governanceReviewReason(a);a.status=why?'rejected':'approved';a.reason=why;
      log(why?'warn':'good',`${a.title}${why?'未获批：'+why:'已获批，请在职务经营台账办理实施；尚未入账或换人'}。`);
    }else if(a.status==='executing'&&S.turn>=a.nextAt){
      if(a.kind==='open')executeOpenOutlet(a.data.aid);
      else if(a.kind==='close'){
        if(!branch(a.data.bid)||branch(a.data.bid).outlets<=1){a.status='cancelled';a.reason='服务网点数量变化，停止撤并';return;}
        executeCloseOutlet(a.data.bid);
      }else if(a.kind==='reform'){
        if(a.stage===0){a.stage=1;a.nextAt=S.turn+1;log('','机构改革试点通过，开始分批推广与岗位竞聘，下回合完成评估。');return;}
        if(!S.biz.reformDone){S.biz.reformDone=true;S.biz.expenseK*=B5().reform.expense;S.biz.csat=c100(S.biz.csat+B5().reform.rep);keyEvent('经董事会审议、试点及分批推广完成机构改革');log('warn','机构改革分批落地，管理层级压减完成，费用节约从本期开始体现。');}
      }
      a.status='done';
    }
  });
}
function loanVisibleRisk(it){
  const score=B2().tierScore;
  const risk=(score.coll[it.coll]||0)+(score.flow[it.flow]||0)+(score.tax[it.tax]||0);
  // 授权按尽调已识别的风险办理，不通过按钮泄露隐藏的真实违约风险层级。
  return it.riskFlag===true||risk>=score.high;
}
function loanAuthority(it){
  const limits=BALANCE.authority.loanLimit[S.lv];
  return it.amt>(limits?.[it.type]??0)||loanVisibleRisk(it);
}
function governanceBookL2(it){
  bookLoan(it.name,it.amt,it.tier,'queue');
  const fee=r1(it.amt*B2().loanFee);S.biz.ytd.fee+=fee;S.month.fee+=fee;
  if(it.rel)fav(it.rel,3);
  log('',`${it.name}按有效授信权限办理放款，贷款+${fmtWan(it.amt)}。`);
}
function platformRoom(){return Math.max(0,S.biz.quota-(loansTotalL3()-S.biz.loans.platform+(S.biz.platformCompliant||0)));}

function governanceRequestQuota(id){
  if(!managementCheck(3).ok)return null;
  const a=careerEnsure().approvals.find(x=>x.id===id&&x.kind==='loan'&&x.status==='approved');
  if(!a)return null;
  const amount=Math.max(0,a.data.loan.amt+loansTotalL3()-S.biz.loans.platform+(S.biz.platformCompliant||0)-S.biz.quota);
  if(!amount)return null;
  return governanceSubmit('quota','quota','平台项目配套信贷额度',{amount,loanId:id});
}
