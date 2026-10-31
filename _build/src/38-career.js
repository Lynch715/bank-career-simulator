/* 职务扩展引擎。个人履历跨关保留，任内项目随 biz 一起存档、离任与复任。 */
const BC = () => BALANCE.career;
function careerLive(p){ return !!p && p.alive!==false && p.met && !/离职|退休|被查|停职|撤职/.test(p.pos||''); }
function careerSkill(p){ return S.lv===1 && staff(p.id) ? staffSkill(staff(p.id)) : (p.skill==null ? 50 : p.skill); }
function careerRecord(id){
  if(!S.cadres) S.cadres={};
  if(!S.cadres[id]) S.cadres[id]={specialty:null,merit:0,assessedUntil:-1,training:null,history:[],lastTalk:-999,lastTrain:-999};
  return S.cadres[id];
}
function careerEnsure(){
  if(!S || !S.biz) return null;
  if(!S.cadres) S.cadres={};
  if(!S.biz.career) S.biz.career={lv:S.lv,projects:[],coord:BC().coordBase,board:BC().boardStart,style:null,styleAt:-999,plan:null,planAt:-999,alloc:[],engaged:false,council:null,councilSeq:0,lastCouncil:S.turn,lastSettled:null,lastEvaluation:S.monthAbs,marketStep:0};
  const g=S.biz.career;
  if(S.lv===2&&!g.teams)g.teams={retail:null,risk:null,ops:null};
  if(S.lv===5&&!g.alm)g.alm={policy:'balanced',liquidity:BC().liquidityStart,changedAt:-999,stage:0};
  if(S.lv===4){
    S.biz.inst.forEach(x=>{
      if(!x.headId){
        const p=S.people.find(p=>p.name===x.headName);
        x.headId=p?p.id:'chief_'+x.id;
      }
      if(!person(x.headId) && x.headName && !/^—+$/.test(x.headName)) S.people.push({id:x.headId,name:x.headName,skill:x.skill,kind:'sub',group:'部下',met:true,alive:true,lvMet:4,pos:x.name+'负责人',role:x.name+'负责人',fav:50,trait:'稳健',recent:'现任机构负责人'});
    });
  }
  if(S.lv===5 && !g.executives){
    g.executives=DEPUTIES_L4.map((d,i)=>{
      let p=person(d.id);
      if(!p){p={id:d.id,name:d.name,skill:Math.round(Object.values(d.fit).reduce((a,v)=>a+v,0)/4),fav:50,kind:'sub',group:'班子',met:true,alive:true,lvMet:5,pos:'总行副行长',role:'总行副行长',trait:d.trait};S.people.push(p);}
      // 已退休或受处分的人保留原履历，由可用的后备干部接替。
      if(!careerLive(p)){
        const id='exec5_'+i;
        p=person(id);
        if(!p){p={id,name:['林远舟','陈嘉宁','许正衡','方静宜'][i],skill:60,fav:50,kind:'sub',met:true,alive:true,lvMet:5,pos:'总行副行长',role:'总行副行长',group:'班子',trait:'稳健'};S.people.push(p);}
      }
      p.pos='总行副行长';
      return {id:p.id,name:p.name,line:CAREER_LINES[i].id,fit:Object.assign({},d.fit)};
    });
  }
  // 沿用已有同级负责人身份，提供符合本级任用范围的交流人选，不把基层旧部自动抬级。
  if(S.lv>=4 && !g.seniorRoster){
    const roster=S.lv===5?RIVALS_L4:RIVALS_L3;
    roster.forEach(d=>{
      if(S.people.some(p=>p.name===d.boss))return;
      S.people.push({id:'rival_'+d.id,name:d.boss,skill:BC().reserveSkill[S.lv],fav:BC().reserveFav,kind:'reserve',group:'交流干部',met:true,alive:true,lvMet:S.lv,pos:d.name+'行长',role:d.name+'行长',trait:d.style,recent:'可按本级岗位需要考察交流'});
    });
    g.seniorRoster=true;
  }
  governanceEnsure(g);
  return g;
}
function careerExecs(){ const g=careerEnsure(); return S.lv===4?S.biz.deputies:S.lv===5?g.executives:[]; }
function careerLink(a,b,delta){
  if(!a||!b||a===b)return BC().relationStart;
  if(!S.cadreRelations)S.cadreRelations={};
  const key=[a,b].sort().join('|'),value=S.cadreRelations[key]??BC().relationStart;
  if(delta!=null)S.cadreRelations[key]=c100(value+delta);
  return delta==null?value:S.cadreRelations[key];
}
function careerPartner(lead,units){
  const rows=careerUnits();
  const ids=units.map(id=>{const x=rows.find(x=>x.id===id);return x&&(x.mgr||x.headId);});
  return ids.filter(id=>id!==lead&&careerLive(person(id)))[0]||careerExecs().find(x=>x.id!==lead)?.id||null;
}
function careerLevel(p){
  if(!p)return -1;
  // 已任用的岗位是现任职务。旧档中的任命继续有效，不因规则收紧撤人或清空岗位。
  const g=S.biz.career;
  if(S.lv===5){if(g?.executives?.some(d=>d.id===p.id))return 5;if((S.biz.firstBranches||[]).some(x=>x.headId===p.id))return 4;}
  if(S.lv===4){if(S.biz.deputies.some(d=>d.id===p.id))return 4;const row=S.biz.inst.find(x=>x.headId===p.id);if(row)return row.name.includes('分行')?3:2;}
  if(S.lv===3&&(S.biz.branches.some(x=>x.mgr===p.id)||Object.values(S.biz.lineHeads).includes(p.id)))return 2;
  if(S.lv===2&&(S.biz.outlets.some(x=>x.mgr===p.id)||S.biz.corp.lead===p.id||Object.values(g?.teams||{}).includes(p.id)))return 1;
  const pos=(p.pos||p.role||'').replace(/[（(][^）)]*[）)]/g,'').trim();
  if(/总行.*副行长$/.test(pos))return 5;
  if(/总行.*(?:总经理|部门负责人|中心负责人|办公室主任|专项岗位)$/.test(pos))return 4;
  const first=['重庆分行',...RIVALS_L4.map(x=>x.name),...Object.values(CAREER_L5_BRANCHES)];
  if(first.some(name=>pos.includes(name))||/一级分行/.test(pos)){
    if(/(?:副行长|行长|片区统筹负责人)$/.test(pos))return 4;
    if(/(?:总经理|主任|负责人|专项岗位)$/.test(pos))return 3;
  }
  const second=['万州分行',...RIVALS_L3.map(x=>x.name)];
  if((second.some(name=>pos.includes(name))||/二级分行/.test(pos))&&/(?:副行长|行长|调研员)$/.test(pos))return 3;
  if(/支行.*(?:副行长|行长)$|(?:公司部|零售部|风险部|营业部|人力部|办公室).*(?:总经理|主任|负责人)$/.test(pos))return 2;
  if(/网点.*负责人$|对公团队.*负责人$|专业团队负责人$/.test(pos))return 1;
  return 0;
}
function careerPeople(){
  careerEnsure();
  const ids=new Set(subordinates().map(p=>p.id));
  if(S.lv===4) S.biz.inst.forEach(x=>ids.add(x.headId));
  if(S.lv===5) careerExecs().forEach(x=>ids.add(x.id));
  S.people.filter(p=>p.skill!=null && ['staff','sub','reserve'].includes(p.kind)).forEach(p=>ids.add(p.id));
  const scope=CAREER_MANAGEMENT[S.lv];
  return [...ids].map(person).filter(p=>careerLive(p) && !['lu','gu','huang','songwy','weilc'].includes(p.id)&&careerLevel(p)>=scope.min&&careerLevel(p)<=scope.max);
}
function careerPositions(){
  careerEnsure();
  if(S.lv===2) return S.biz.outlets.map(x=>({id:x.id,name:x.name+'负责人',pid:x.mgr,row:x,field:'mgr',line:'retail'})).concat(Object.keys(S.biz.career.teams).map(line=>({id:'team_'+line,name:CAREER_LINES.find(x=>x.id===line).name+'专业团队负责人',pid:S.biz.career.teams[line],row:S.biz.career.teams,field:line,line,team:true})));
  if(S.lv===3) return S.biz.branches.map(x=>({id:x.id,name:x.name+(x.id==='yyb'?'总经理':'行长'),pid:x.mgr,row:x,field:'mgr',line:'corp'})).concat(LINES_L3.map(x=>({id:'dept_'+x.id,name:x.name+'负责人',pid:S.biz.lineHeads[x.id],row:S.biz.lineHeads,field:x.id,line:x.id==='hr'?'ops':x.id,department:true})));
  if(S.lv===4) return S.biz.inst.map(x=>({id:x.id,name:x.name+'负责人',pid:x.headId,row:x,field:'headId',line:'corp',minLevel:2})).concat(S.biz.deputies.map(x=>({id:'exec_'+x.line,name:'分管'+CAREER_LINES.find(l=>l.id===x.line).name+'副行长',pid:x.id,row:x,field:'id',line:x.line,exec:true,minLevel:3})));
  if(S.lv===5) return S.biz.firstBranches.map(x=>({id:x.id,name:x.name+'行长',pid:x.headId,row:x,field:'headId',line:'corp',minLevel:4})).concat(careerExecs().map(x=>({id:'exec_'+x.line,name:'总行分管'+CAREER_LINES.find(l=>l.id===x.line).name+'副行长',pid:x.id,row:x,field:'id',line:x.line,exec:true,minLevel:4})));
  return [];
}
function careerUnits(){
  if(S.lv===1) return [{id:'dzs',name:'弹子石网点'}];
  if(S.lv===2) return S.biz.outlets;
  if(S.lv===3) return S.biz.branches;
  return S.lv===4?S.biz.inst:S.biz.firstBranches;
}
function careerFit(p,line){
  const d=careerExecs().find(x=>x.id===p.id);
  if(d) return d.fit[line];
  return c100(BC().fitBase+careerSkill(p)*BC().fitSkill+(careerRecord(p.id).specialty===line?BC().fitSpecialty:0));
}
function careerAvailable(postId){
  const used=new Set(careerPositions().map(x=>x.pid).filter(Boolean));
  const target=postId?careerPositions().find(x=>x.id===postId):null;
  if(postId&&!target)return [];
  if(S.lv===2) used.add(S.biz.corp.lead);
  if(S.lv===3) Object.values(S.biz.lineHeads).forEach(id=>used.add(id));
  return careerPeople().filter(p=>!used.has(p.id) && careerSkill(p)>=BC().minSkill[S.lv]&&careerLevel(p)>=(target?.minLevel??CAREER_MANAGEMENT[S.lv].min));
}
function careerCheck(cost,ap){
  const authority=managementCheck();if(!authority.ok)return authority;
  if(S.ap<(ap==null?1:ap)) return {ok:false,why:'行动点不足'};
  if(cost && S.lv<=3 && S.biz.budget<cost) return {ok:false,why:'经营费用不足'};
  return {ok:true,why:''};
}
function careerSpend(cost,ap){
  const points=ap==null?1:ap;
  if(points>0)apUse(points);
  if(cost){
    if(S.lv<=3) S.biz.budget-=cost;
    S.month.spent=(S.month.spent||0)+cost;
  }
  careerEnsure().engaged=true;
}
function careerDone(){ computeCore(); save(); return true; }
function careerTrain(id,line){
  careerEnsure();
  const p=careerPeople().find(x=>x.id===id), r=p&&careerRecord(id), cost=BC().trainCost[S.lv];
  if(!p || !CAREER_LINES.some(x=>x.id===line) || r.training || r.lastTrain===S.monthAbs || !careerCheck(cost).ok) return null;
  careerSpend(cost);r.training={line,left:BC().trainTurns[S.lv],lv:S.lv};r.lastTrain=S.monthAbs;
  log('', `${p.name}参加${CAREER_LINES.find(x=>x.id===line).name}专项培养，需${r.training.left}个回合。费用-${fmtWan(cost)} · 行动点-1。培养期间承担项目会影响执行。`);
  return careerDone();
}
function careerAssess(id){
  const p=careerPeople().find(x=>x.id===id),r=p&&careerRecord(id),cost=BC().assessCost[S.lv];
  if(!p || r.assessedUntil>=S.monthAbs || !careerCheck(cost).ok) return null;
  careerSpend(cost);r.assessedUntil=S.monthAbs+BC().assessMonths[S.lv];
  r.history.push({at:S.monthAbs,lv:S.lv,type:'assess',skill:careerSkill(p)});
  log('', `完成对${p.name}的履职考察：经营能力${Math.round(careerSkill(p))}，培养方向${r.specialty?CAREER_LINES.find(x=>x.id===r.specialty).name:'待确定'}。考察有效${BC().assessMonths[S.lv]}个月 · 费用-${fmtWan(cost)} · 行动点-1。`);
  return careerDone();
}
function careerAppoint(postId,id){
  const slot=careerPositions().find(x=>x.id===postId),p=person(id);
  if(!careerCheck(0).ok || governanceAppointCheck(slot,p))return null;
  if(S.lv>=4&&governanceActive().some(x=>x.kind==='appoint'&&x.data.pid===id))return null;
  if(S.lv>=4)return governanceSubmit('appoint',postId,'任用'+p.name+'为'+slot.name,{postId,pid:id,oldId:slot.pid});
  careerApplyAppointment(slot,p);return careerDone();
}
function careerApplyAppointment(slot,p){
  const old=person(slot.pid),id=p.id,postId=slot.id;
  if(S.lv===2&&!slot.team)applyAppointOutlet(postId,id);
  else if(S.lv===3&&!slot.department)applyAppointBranch(postId,id);
  else{
    careerSpend(0);
    const fit=slot.exec?Object.fromEntries(CAREER_LINES.map(l=>[l.id,careerFit(p,l.id)])):null;
    slot.row[slot.field]=id;
    if(slot.exec){slot.row.name=p.name;slot.row.fit=fit;}
    else if(!slot.team&&!slot.department){slot.row.headName=p.name;slot.row.skill=careerSkill(p);}
    p.pos=(S.lv===5?'':myUnitName()+'·')+slot.name;p.kind='sub';p.recent='经考察任用，正在履职观察';fav(id,BC().appointFav);
    if(old){
      const remaining=governanceRoles(old.id);
      old.pos=remaining.length?remaining.join('（兼任）'):S.lv===5?'总行专项岗位':myUnitName()+'专项岗位';old.recent=remaining.length?'解除原兼任，保留现任岗位':'调整工作分工';fav(old.id,BC().oldFav);
    }
    keyEvent(`经考察任用${p.name}担任${slot.name}`);log('',`${slot.name}由${p.name}担任，进入履职观察。行动点-1。`);
  }
  if(S.lv===3&&old){const roles=governanceRoles(old.id);if(roles.length){old.pos=roles.join('（兼任）');old.kind='sub';}}
  const g=careerEnsure();g.engaged=true;g.coord=c100(g.coord-BC().coordPenalty/2);
  careerRecord(id).probation={until:S.monthAbs+BC().probationMonths,lv:S.lv,post:slot.name};
  careerRecord(id).history.push({at:S.monthAbs,lv:S.lv,type:'appoint',post:slot.name});
  if(old&&!g.council)g.council={id:'people',at:S.turn,lead:old.id,partner:id};
}
function careerTalk(id,mode){
  const p=careerPeople().find(x=>x.id===id),r=p&&careerRecord(id),g=careerEnsure();
  if(!p || !['work','credit','coach'].includes(mode) || S.monthAbs-r.lastTalk<BC().talkMonths || !careerCheck(0).ok) return null;
  careerSpend(0);r.lastTalk=S.monthAbs;
  if(mode==='work') {g.coord=c100(g.coord+BC().talkGain);fav(id,BC().talkFav);}
  if(mode==='credit') {g.coord=c100(g.coord+BC().talkGain/2);fav(id,BC().creditFav);r.merit=c100(r.merit+BC().creditFav);}
  if(mode==='coach') {r.merit=c100(r.merit+BC().creditFav);fav(id,BC().talkFav/2);r.assessedUntil=Math.max(r.assessedUntil,S.monthAbs+BC().assessMonths[S.lv]/2);}
  log('', `${p.name}的工作谈话已完成：${{work:'明确分工，协调度提高',credit:'按贡献记功，履职记录增加',coach:'复盘短板，补充培养与考察记录'}[mode]}。行动点-1。`);
  return careerDone();
}
function careerStyle(id){
  const g=careerEnsure(),style=BC().styles.find(x=>x.id===id);
  if(S.lv!==1 || !style || g.style===id || S.monthAbs-g.styleAt<BC().specialtyMonths || !careerCheck(0).ok) return null;
  careerSpend(0);g.style=id;g.styleAt=S.monthAbs;
  log('', `网点确定经营特色：${style.name}。按现有客群持续积累收益，一年后可调整。行动点-1。`);
  return careerDone();
}
function careerPlan(line,ids){
  const g=careerEnsure(),units=careerUnits();
  if(S.lv<2 || !BC().plans.some(x=>x.id===line) || !Array.isArray(ids) || ids.length!==3 || new Set(ids).size!==3 || !ids.every(id=>units.some(x=>x.id===id)) || S.monthAbs-g.planAt<BC().planMonths || !careerCheck(0).ok) return null;
  careerSpend(0);g.plan=line;g.planAt=S.monthAbs;g.alloc=ids;
  log('', `年度经营安排：${BC().plans.find(x=>x.id===line).name}；${ids.map((id,i)=>units.find(x=>x.id===id).name+' '+BC().allocation[S.lv][i]+'%').join('、')}。同一年度内按此执行 · 行动点-1。`);
  return careerDone();
}
function careerProjectDef(id){return CAREER_PROJECTS.find(x=>x.id===id && x.lv===S.lv);}
function careerActive(){return careerEnsure().projects.filter(p=>p.status==='active');}
function careerReserved(){return !S || !S.biz || !S.biz.career?0:S.biz.career.projects.filter(p=>p.status==='active').reduce((a,p)=>a+(careerProjectDef(p.id)?.rwa||0),0);}
function careerLineK(line){
  const g=careerEnsure();if(S.lv!==5||!g.engaged)return 1;
  const d=careerExecs().find(x=>x.line===line);
  return 1+((d?d.fit[line]:BC().reviewFit)-BC().reviewFit)*BC().executiveK+(g.coord-BC().coordBase)*BC().executiveK;
}
function careerRegionK(row){
  const p=person(row.headId);return p&&careerLive(p)?1+(careerSkill(p)-BC().reviewFit)*BC().regionalK:1;
}
function careerTeamK(line){
  if(S.lv!==2)return 1;
  const g=careerEnsure(),p=person(g.teams[line]);
  return p&&careerLive(p)?1+careerSkill(p)*BC().teamK:1;
}
function careerALM(id){
  const g=careerEnsure(),o=BC().alm.find(x=>x.id===id);
  if(S.lv!==5||!o||g.alm.changedAt===S.monthAbs||g.alm.policy===id||!careerCheck(0).ok)return null;
  careerSpend(0);g.alm.policy=id;g.alm.changedAt=S.monthAbs;
  log('', `资产负债安排：${o.name}。${o.desc}。本半年执行，行动点-1。`);
  return careerDone();
}
function careerALMSpread(){const g=careerEnsure();return S.lv===5&&g.engaged?BC().alm.find(x=>x.id===g.alm.policy).spread:0;}
function careerLoad(id){return careerActive().filter(p=>p.lead===id).length;}
function careerStartCheck(id){
  const d=careerProjectDef(id),g=careerEnsure();
  if(!d) return {ok:false,why:'当前职务不能启动此项目'};
  if(g.projects.some(p=>p.id===id)) return {ok:false,why:'本任期已启动过该项目'};
  if(careerActive().length>=BC().maxActive[S.lv]) return {ok:false,why:'在建项目已达上限'};
  if(S.lv===5 && g.board<BC().boardMin) return {ok:false,why:'董事会支持不足，先完成经营协调'};
  if(S.lv===4 && capRoom()<(d.rwa||0)) return {ok:false,why:'资本空间不足'};
  if(S.lv===5 && S.biz.capital/BC().reserveCar-rwaL5()<(d.rwa||0)) return {ok:false,why:'资本空间不足'};
  return careerCheck(d.cost);
}
function careerStart(id,lead,units){
  const d=careerProjectDef(id),g=careerEnsure(),p=careerPeople().find(x=>x.id===lead);
  if(!d || !p || careerRecord(lead).training || !careerStartCheck(id).ok || !Array.isArray(units) || units.length!==(S.lv>=4?2:1) || new Set(units).size!==units.length || !units.every(id=>careerUnits().some(x=>x.id===id))) return null;
  careerSpend(d.cost);
  const rival=d.type==='competition'?{name:S.lv===1?'同业社区团队':S.lv===2?'同业支行':'同业联合团队',score:BC().competitionBase+(g.projects.length%3)*BC().creditFav,need:['price','service','select'][g.projects.length%3],resolved:false}:null;
  g.projects.push({id,lead,partner:careerPartner(lead,units),units:units.slice(),status:'active',stage:0,quality:0,yield:1,choice:null,workedAt:-1,dispute:false,exposure:0,earned:0,stalled:0,born:S.monthAbs,rival});
  log('', `启动${d.name}，由${p.name}牵头。${units.map(id=>careerUnits().find(x=>x.id===id).name).join('与')}承办。费用-${fmtWan(d.cost)} · 行动点-1${d.rwa?' · 占用风险加权额度'+fmtWan(d.rwa):''}。`);
  if(d.who){const who=person(d.who);if(who){meet(d.who);who.recent=d.lv===2?'冉记开出连锁门店，开始归集各店资金':'连锁经营扩展到异地，成为跨区域服务试点';fav(d.who,BC().projectFav);}}
  return careerDone();
}
function careerChoose(id,choice){
  const d=careerProjectDef(id),p=careerEnsure().projects.find(x=>x.id===id),o=d&&(CAREER_CHOICES[d.type]||[]).find(x=>x.id===choice);
  const extra=d&&o?d.cost*(o.extra||0):0;
  if(!p || p.status!=='active' || p.stage!==1 || p.choice || !o || !careerCheck(extra).ok) return null;
  careerSpend(extra);p.choice=choice;p.quality+=o.quality;p.yield=o.yield;p.exposure=o.exposure||0;
  careerEnsure().coord=c100(careerEnsure().coord+o.coord);
  careerLink(p.lead,p.partner,o.coord<0?-BC().relationLoss:BC().relationGain);
  log('', `${d.name}确定方案：${o.name}。预期收益系数${Math.round(o.yield*100)}% · 协调度${sgn(o.coord)} · 追加费用-${fmtWan(extra)} · 行动点-1。`);
  return careerDone();
}
function careerExecution(p){
  // 历史项目的承办人可以继续履职；收紧新增任用范围不使旧项目停摆。
  const leader=person(p.lead);
  if(!careerLive(leader)) return {score:0,why:'牵头人已离岗，需要重新委任'};
  const g=careerEnsure(),d=careerProjectDef(p.id),r=careerRecord(leader.id);
  let score=careerFit(leader,d.line)*BC().skillWeight+leader.fav*BC().relationWeight+g.coord*BC().trustWeight+p.quality+(careerLink(p.lead,p.partner)-BC().relationStart)*BC().relationK;
  if(r.training) score-=BC().trainingPenalty;
  if(careerLoad(leader.id)>BC().loadLimit) score-=BC().overloadPenalty*(careerLoad(leader.id)-BC().loadLimit);
  return {score:Math.round(score),why:score<BC().executeMin?'执行不足：培养对口干部、调整牵头人或亲自督办':'执行条件具备'};
}
function careerPush(id,mode,newLead){
  const g=careerEnsure(),p=g.projects.find(x=>x.id===id);
  if(!p || p.status!=='active' || !careerCheck(0).ok) return null;
  if(mode==='lead'){
    const candidate=careerPeople().find(x=>x.id===newLead);
    if(!candidate || newLead===p.lead || careerRecord(newLead).training) return null;
    careerSpend(0);p.lead=newLead;if(p.partner===newLead)p.partner=careerPartner(newLead,p.units);g.coord=c100(g.coord-BC().coordPenalty/2);
    log('', `${careerProjectDef(id).name}调整牵头人：${candidate.name}。行动点-1。`);
  }else if(mode==='resolve'){
    if(!p.dispute)return null;
    careerSpend(0);p.dispute=false;g.coord=c100(g.coord+BC().talkGain);p.quality+=BC().creditFav;careerLink(p.lead,p.partner,BC().relationGain);
    log('', `${careerProjectDef(id).name}明确了协办分工与收益，争议已解决。行动点-1。`);
  }else if(mode==='push'){
    if(p.workedAt===S.monthAbs)return null;
    careerSpend(0);p.workedAt=S.monthAbs;p.quality+=BC().talkGain;
    log('', `亲自督办${careerProjectDef(id).name}，项目准备度+${BC().talkGain}。本回合只能督办一次 · 行动点-1。`);
  }else if(mode==='withdraw'){
    careerSpend(0);p.status='withdrawn';fav(p.lead,BC().failureFav);
    log('warn', `${careerProjectDef(id).name}终止，停止后续投入并释放占用额度；前期费用不退。行动点-1。`);
  }else return null;
  return careerDone();
}
function careerCouncilChoice(id){
  const g=careerEnsure(),issue=g.council,def=issue&&CAREER_COUNCIL.find(x=>x.id===issue.id),o=def&&def.opts.find(x=>x.id===id);
  const cost=o&&o.cost?BC().councilFee[S.lv]:0;
  if(!o || !careerCheck(cost,o.ap||0).ok) return null;
  careerSpend(cost,o.ap||0);g.coord=c100(g.coord+o.coord);g.board=c100(g.board+(o.board||0));
  careerPeople().filter(p=>subordinates().some(s=>s.id===p.id)).forEach(p=>fav(p.id,o.fav||0));
  careerLink(issue.lead,issue.partner,o.coord<0?-BC().relationLoss:BC().relationGain);
  if(issue.lead)fav(issue.lead,o.coord<0?BC().creditFav:(o.fav||0));
  if(issue.partner)fav(issue.partner,o.coord<0?-BC().creditFav:(o.fav||0));
  careerActive().forEach(p=>p.quality+=(o.quality||0));
  log('', `${def.title}：${o.name}。协调度${sgn(o.coord)}${S.lv===5?' · 董事会支持'+sgn(o.board||0):''} · 费用-${fmtWan(cost)} · 行动点-${o.ap||0}。`);
  g.council=null;
  return careerDone();
}
function careerDeputySpec(){
  const lv=S.lv;
  return {kind:'pick',id:'careerDeputy',title:CAREER_DEPUTY.titles[lv],body:CAREER_DEPUTY.body,opts:CAREER_DEPUTY.opts.map(o=>({t:o.name,s:o.desc,fn:()=>careerDeputyChoice(o.id)}))};
}
function careerDeputyChoice(id){
  if(S.phase!=='trans' || S.lv>4 || !CAREER_DEPUTY.opts.some(x=>x.id===id))return null;
  if(!S.deputyTerms)S.deputyTerms={};
  if(S.deputyTerms[S.lv])return null;
  const o=CAREER_DEPUTY.opts.find(x=>x.id===id);
  S.deputyTerms[S.lv]={choice:id,coord:o.coord};fav(supId(),o.trust);
  if(o.merit){subordinates().filter(p=>careerLive(person(p.id))).forEach(p=>{careerRecord(p.id).merit=c100(careerRecord(p.id).merit+o.merit);});}
  keyEvent(`${CAREER_DEPUTY.titles[S.lv]}：${o.name}`);save();return true;
}
function careerMonthStart(){
  governanceMonthStart();
  const g=careerEnsure(),prev=S.deputyTerms&&S.deputyTerms[S.lv-1];
  if(prev && !g.deputyApplied){g.coord=c100(g.coord+prev.coord);g.deputyApplied=true;}
  if(S.turn-g.lastCouncil>=BC().councilInterval[S.lv]){
    if(g.council && g.engaged && S.turn-g.council.at>=BC().councilExpiry){g.coord=c100(g.coord-BC().coordPenalty/2);log('warn','待协调事项搁置过久，团队协作下降。');}
    if(!g.council || S.turn-g.council.at>=BC().councilExpiry){
      const project=g.projects.filter(p=>p.status!=='withdrawn').slice(-1)[0],team=careerPeople();
      const lead=team.find(p=>p.id===project?.lead)?.id||team[0]?.id,partner=team.find(p=>p.id===project?.partner&&p.id!==lead)?.id||team.find(p=>p.id!==lead)?.id;
      g.council={id:CAREER_COUNCIL[g.councilSeq++%CAREER_COUNCIL.length].id,at:S.turn,lead,partner,project:project?.id};g.lastCouncil=S.turn;
    }
  }
}
// 经营流量在原关卡结算之前入账，统一参与当期利润、考核和报告。
function careerAddDeposit(amount,unitId){
  const n=Math.round(amount);if(!n)return;
  if(S.lv===1)S.biz.base+=n;
  else if(S.lv===2){const x=outlet(unitId)||S.biz.outlets[0];x.dep+=n;}
  else if(S.lv===3){const x=branch(unitId)||S.biz.branches[0];x.dep+=n;}
  else if(S.lv===4){const x=inst(unitId)||S.biz.inst[0];x.dep+=n;}
  else S.biz.dep+=n;
}
function careerFee(n){
  if(S.lv===1)feeAdd(n);
  else if(S.lv===2){S.month.fee+=n;S.biz.ytd.fee+=n;}
  else if(S.lv===3)S.month.careerFee=(S.month.careerFee||0)+n;
  else S.month.once=(S.month.once||0)+n;
}
function careerSettle(){
  const g=careerEnsure(),stamp=S.lv+':'+S.turn+':'+S.monthAbs;
  if(g.lastSettled===stamp)return;
  g.lastSettled=stamp;
  if(S.lv===1 && g.style){
    const style=BC().styles.find(x=>x.id===g.style),cards=S.biz.cards.filter(c=>c.type===style.type||(g.style==='merchant'&&c.type==='boss'));
    const assets=cards.reduce((n,c)=>n+c.own,0);
    careerAddDeposit(assets*BC().specialtyDep);careerFee(assets*BC().specialtyFee);
    S.biz.csat=c100(S.biz.csat+style.csat);
  }
  if(g.plan){
    const units=careerUnits();
    g.alloc.forEach((id,i)=>{
      const x=units.find(x=>x.id===id);if(!x)return;
      const share=BC().allocation[S.lv][i]/100;
      const base=S.lv===5?S.biz.dep*x.share:x.dep;
      if(g.plan==='corp'||g.plan==='retail')careerAddDeposit(base*BC().planGrowth*share,id);
      if(g.plan==='risk'){
        if(S.lv===2||S.lv===5)S.biz.npl=Math.max(0,S.biz.npl*(1-BC().planGrowth*share));
        else if(S.lv===4)x.npl=Math.max(0,x.npl*(1-BC().planGrowth*share));
        else S.biz.npa.forEach(n=>{n.amt=Math.max(0,n.amt*(1-BC().planGrowth*share));});
      }
      if(g.plan==='ops')g.coord=c100(g.coord+share*BC().creditFav);
      if(S.lv===2)x.morale=c100(x.morale+(share<0.3?-BC().planOverload:BC().planOverload));
    });
    if(g.plan==='corp' && S.lv>=3){
      const exposure=g.projects.filter(p=>p.status!=='withdrawn'&&careerProjectDef(p.id)?.type==='industry'&&p.exposure).length;
      if(exposure>BC().concentrationLimit){
        const n=depTotal()*BC().industryNpl;
        if(S.lv===3)addNpa(n,'corp','产业集中风险');else if(S.lv===4)S.biz.inst[0].npl+=n;else S.biz.npl+=n;
        S.month.spent=(S.month.spent||0)+n*BALANCE['L'+S.lv].provision;
        log('warn', `产业投放集中，本期新增风险${fmtWan(n)}，已计入资产质量与拨备费用。`);
      }
    }
  }
  if(S.lv===5&&g.engaged){
    const a=g.alm,o=BC().alm.find(x=>x.id===a.policy),pressure=BC().liquidityPressure+Math.max(0,S.biz.dials.credit-S.biz.dials.price)*BC().liquidityGrowthK;
    a.liquidity=c100(a.liquidity+o.liquidity-pressure);
    S.month.spent=(S.month.spent||0)+S.biz.dep*(o.fee||0);
    if(a.liquidity<BC().liquidityFloor){
      const loss=S.biz.dep*BC().liquidityLoss*(BC().liquidityFloor-a.liquidity);
      S.month.spent+=loss;g.board=c100(g.board-BC().boardLoss);a.stage++;
      log('warn', `流动性压力第${a.stage}期：指数${Math.round(a.liquidity)}，本期应急资金成本${fmtWan(loss)}。可增加储备、收紧信贷或争取稳定资金。`);
    }else if(a.stage){a.stage=0;log('good','流动性压力缓解，应急资金安排已退出。');}
  }
  g.projects.forEach(p=>{
    const d=careerProjectDef(p.id);if(!d)return;
    if(p.status==='done'){
      const dep=d.dep*p.yield/CAREER_STAGES[S.lv].length,fee=d.fee*p.yield;
      p.units.forEach(id=>careerAddDeposit(dep/p.units.length,id));careerFee(fee);p.earned+=fee;
      return;
    }
    if(p.status!=='active')return;
    let why='';
    if(p.stage===1&&!p.choice)why='等待确定实施方案';
    else if(p.dispute)why='协办争议待协调';
    else if(careerExecution(p).score<BC().executeMin)why=careerExecution(p).why;
    else if(p.stage>=2 && p.units.length>1 && g.coord<BC().coordNeed){p.dispute=true;why='机构协作不足，项目出现分工争议';}
    if(why){p.stalled++;log('warn', `${d.name}本期停在${CAREER_STAGES[S.lv][p.stage]}：${why}。`);return;}
    if(p.stage===1&&p.rival&&!p.rival.resolved){
      const leader=person(p.lead),base=careerFit(leader,d.line)+p.quality;
      const advantage=p.choice===p.rival.need?BC().competitionService:0;
      const mine=base+advantage;p.rival.resolved=true;p.rival.mine=Math.round(mine);
      if(mine<p.rival.score){p.yield*=BC().competitionRetain;log('warn', `${d.name}竞标未获主办资格，保留部分客户服务：方案${Math.round(mine)}分 / 同业${p.rival.score}分，经营回报缩至${Math.round(p.yield*100)}%。`);}
      else log('good', `${d.name}取得主办资格：方案${Math.round(mine)}分 / 同业${p.rival.score}分。`);
    }
    p.stage++;p.stalled=0;
    if(p.stage>=CAREER_STAGES[S.lv].length){
      p.status='done';p.finishedAt=S.monthAbs;
      let yieldK=p.yield;
      if(S.lv===3&&d.area){const a=area(d.area);yieldK*=clamp(a.heat/100+0.5,0.65,1.3);}
      p.units.forEach(id=>careerAddDeposit(d.dep*yieldK/p.units.length,id));careerFee(d.fee*yieldK);
      careerRecord(p.lead).merit=c100(careerRecord(p.lead).merit+BC().meritGain);fav(p.lead,BC().projectFav);
      if(d.type==='turnaround'){
        const b=branch(p.units[0]);if(b){const chief=person(b.mgr);if(chief)chief.skill=c100((chief.skill||50)+BC().trainGain);}
      }
      if(S.lv===5)g.board=c100(g.board+BC().boardGain);
      keyEvent(`${d.name}完成，由${person(p.lead)?.name||'项目组'}牵头`);
      log('gold', `${d.name}完成：存款+${fmtWan(d.dep*yieldK)} · 本期收入+${fmtWan(d.fee*yieldK)}。后续每期持续经营，收益系数${Math.round(p.yield*100)}%。`);
    }else log('good', `${d.name}进入${CAREER_STAGES[S.lv][p.stage]}。牵头人：${person(p.lead)?.name||'待委任'}。`);
  });
  // 人员的培养计时跟随真实月份；跨关时不凭空重新开始，也不会自动免除成本。
  Object.entries(S.cadres).forEach(([id,r])=>{
    const p=person(id);if(!p||!careerLive(p))return;
    if(r.training){
      r.training.left--;
      if(r.training.left<=0){
        const line=r.training.line;r.specialty=line;r.training=null;
        if(S.lv===1&&staff(id)){const s=staff(id),attr=line==='corp'||line==='retail'?'mk':line==='risk'?'cp':'op';s[attr]=Math.min(10,s[attr]+BC().attrGain);s.trained=(s.trained||0)+1;}
        else p.skill=c100(careerSkill(p)+BC().trainGain);
        if(S.lv===4)S.biz.inst.filter(x=>x.headId===id).forEach(x=>x.skill=p.skill);
        careerExecs().filter(d=>d.id===id).forEach(d=>d.fit[line]=c100(d.fit[line]+BC().trainGain));
        fav(id,BC().projectFav);r.history.push({at:S.monthAbs,lv:S.lv,type:'training',line});
        log('good', `${p.name}完成${CAREER_LINES.find(x=>x.id===line).name}专项培养，能力提高。`);
      }
    }
    if(r.probation && r.probation.lv===S.lv && S.monthAbs>=r.probation.until){
      const slot=careerPositions().find(x=>x.pid===id);
      if(slot){
        const fit=careerFit(p,slot.line),help=fit<BC().reviewFit;
        fav(id,help?BC().reviewHelp:BC().probationFav);
        r.history.push({at:S.monthAbs,lv:S.lv,type:'review',post:slot.name,outcome:help?'需要帮扶':'对岗履职',fit:Math.round(fit)});
        log(help?'warn':'', `${p.name}完成${slot.name}履职观察：岗位匹配${Math.round(fit)}，${help?'需要安排对口培养或调整岗位':'已形成稳定履职能力'}。评价已归档。`);
      }
      r.probation=null;
    }
  });
  if(g.engaged)g.coord=c100(g.coord+(BC().coordBase-g.coord)*BC().coordDrift);
  if(S.lv===4 && g.engaged)S.biz.unity=c100(S.biz.unity+(g.coord-BC().coordBase)*BC().coordDrift);
  if(S.lv===5 && g.engaged && careerActive().some(p=>p.stalled>0))g.board=c100(g.board-BC().boardLoss);
  if(S.lv===3 && g.engaged && g.plan){
    g.marketStep++;
    if(g.marketStep%BC().councilInterval[3]===0){
      const rows=S.biz.areas,a=rows[g.marketStep%rows.length];a.heat=c100(a.heat+(a.id==='laocheng'?-BC().creditFav:BC().creditFav));
      log('', `${a.name}经营调查更新：片区热度${Math.round(a.heat)}，已影响网点增长与产业项目收益。`);
    }
  }
}
