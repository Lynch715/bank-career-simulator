// 职务经营：真实旧档、培养任用、阶段决策、跨机构争议、收益与资本约束。
const {load,runner}=require('./lib');
const legacy=require('./fixtures/career-legacy-v1.json');
const {G,store}=load();G.setHeadless(true);G.setBot(null);
const C=G.career,I=G.internals,T=runner('21-career');
const choose={service:'visit',competition:'service',integration:'share',industry:'diverse',turnaround:'audit',reform:'retrain',strategy:'quality'};
function enter(lv){
  store.thsz_save=JSON.stringify(legacy[lv-1]);G.load();G.setBot(null);G.S.phase='play';return G.S;
}
function advance(){I.advance(true);}
function units(lv){return lv===1?['dzs']:lv===2?['dzs']:lv===3?['yyb']:lv===4?['yyb','yz']:['hd','hn'];}
function leader(d){return C.people().slice().sort((a,b)=>b.skill-a.skill).find(p=>!C.record(p.id).training)||C.people()[0];}
function round(){I.settleMonth();advance();}
for(let lv=1;lv<=5;lv++){
  const s=enter(lv),old=legacy[lv-1];
  T.ok('L'+lv+'真实旧档可读，职务、费用、年龄、贷款与风险保留',s.lv===lv&&s.age===old.age&&s.ap===old.ap&&s.core.clean===old.core.clean&&JSON.stringify(s.loanBook)===JSON.stringify(old.loanBook)&&s.biz.budget===old.biz.budget);
  T.ok('L'+lv+'按需补齐扩展字段，存档版本未变',!!s.biz.career&&s.ver===old.ver);
  const before=JSON.stringify(s);G.save();G.S=null;G.load();
  T.ok('L'+lv+'保存重读不重复初始化或改写原数据',JSON.stringify(G.S)===before);
}
enter(1);let s=G.S;
T.ok('确定网点特色花1点，重复与年度内改向均拒绝',C.style('elder')&&s.ap===3&&C.style('elder')===null&&C.style('wealth')===null);
const trainee=C.people()[0],r=C.record(trainee.id),attr=s.staff.find(x=>x.id===trainee.id).mk,budget=s.biz.budget;
T.ok('专项培养扣费扣点，重复报名拒绝',C.train(trainee.id,'corp')&&s.biz.budget===budget-G.BALANCE.career.trainCost[1]&&s.ap===2&&C.train(trainee.id,'risk')===null);
round();T.ok('培养尚未结束时不会提前加能力',!!r.training&&s.staff.find(x=>x.id===trainee.id).mk===attr);
round();T.ok('培养期满提高能力，履历与专业保留',!r.training&&r.specialty==='corp'&&s.staff.find(x=>x.id===trainee.id).mk===attr+1&&r.history.some(x=>x.type==='training'));
I.applyTransition();
T.ok('L1培养跨关进入支行，专业与履历继承',G.S.lv===2&&C.record(trainee.id).specialty==='corp'&&C.record(trainee.id).history.some(x=>x.type==='training'));
enter(2);s=G.S;
const candidate=C.available()[0],post=C.positions()[0];
T.ok('干部任用需有效考察，不能直接提拔',!!candidate&&C.appoint(post.id,candidate.id)===null);
T.ok('考察需费用与行动点，并有明确有效期',C.assess(candidate.id)&&C.record(candidate.id).assessedUntil===s.monthAbs+G.BALANCE.career.assessMonths[2]);
const ap=s.ap;T.ok('新任干部进入履职观察，同一人不能占两个岗位',C.appoint(post.id,candidate.id)&&s.ap===ap-1&&C.record(candidate.id).probation&&C.appoint(C.positions()[1].id,candidate.id)===null);
s.monthAbs+=13;s.turn+=13;C.monthStart();C.settle();
T.ok('履职观察期满生成评价记录',!C.record(candidate.id).probation&&C.record(candidate.id).history.some(x=>x.type==='review'&&x.outcome));
enter(2);s=G.S;const teamCandidate=C.available()[0];
C.assess(teamCandidate.id);T.ok('可组建专业团队，团队负责人实际影响委托产出',C.appoint('team_retail',teamCandidate.id)&&C.teamK('retail')>1&&C.positions().length===7);
const teamAp=s.ap;T.ok('已任用团队负责人不可重复占网点岗位',C.appoint('dzs',teamCandidate.id)===null&&s.ap===teamAp);
enter(4);s=G.S;let p=C.available('exec_corp')[0];
T.ok('一级分行有机构和班子岗位可任用',C.positions().length===16&&!!p);
C.assess(p.id);T.ok('可任用副行长，姓名、分工、专长一致更新',C.appoint('exec_corp',p.id)&&s.biz.deputies.find(d=>d.line==='corp').id===p.id&&s.biz.deputies.find(d=>d.id===p.id).name===p.name);
enter(5);s=G.S;p=C.available()[0];C.assess(p.id);
T.ok('总行可任用片区负责人，不与班子重复',C.appoint('hd',p.id)&&s.biz.regions.find(x=>x.id==='hd').headId===p.id&&C.appoint('exec_risk',p.id)===null);
p.pos='退休';T.ok('退休人员退出可任用和项目名单',!C.people().some(x=>x.id===p.id));
enter(4);s=G.S;const chief=s.biz.inst.find(x=>x.headId&&I.person(x.headId));const chiefSkill=chief.skill;
C.train(chief.headId,'retail');round();
T.ok('机构负责人培训后，实际经营能力同步提高',chief.skill===chiefSkill+G.BALANCE.career.trainGain&&I.person(chief.headId).skill===chief.skill);

for(const d of C.projects){
  enter(d.lv);s=G.S;if(d.lv<=3)s.biz.budget=100000;
  const who=leader(d),u=units(d.lv),cost=d.cost,ap0=s.ap,budget0=s.biz.budget;
  T.ok(d.name+'：启动扣费扣点，写入牵头与承办单位',C.start(d.id,who.id,u)&&s.ap===ap0-1&&(d.lv>3||s.biz.budget===budget0-cost)&&s.biz.career.projects[0].lead===who.id);
  const pr=s.biz.career.projects[0];
  T.ok(d.name+'：同项目不能重复启动',C.start(d.id,who.id,u)===null);
  if(C.execution(pr).score<55)C.push(d.id,'push');
  round();const stage=pr.stage;
  round();T.ok(d.name+'：未确定方案时停留待办阶段',stage===1&&pr.stage===1);
  C.choose(d.id,choose[d.type]);
  for(let i=0;i<6&&pr.status==='active';i++){
    if(pr.dispute)C.push(d.id,'resolve');
    if(C.execution(pr).score<55)C.push(d.id,'push');
    round();
  }
  T.ok(d.name+'：正确决策后落地并留有履历',pr.status==='done'&&s.track.keyEvents.some(x=>x.txt.includes(d.name+'完成')));
  const earned=pr.earned;C.settle();const once=pr.earned;C.settle();
  T.ok(d.name+'：落地后持续经营，同期不重复发收益',once>earned&&pr.earned===once);
  G.save();const saved=JSON.stringify(s.biz.career);G.load();
  T.ok(d.name+'：进度和收益读档一致',JSON.stringify(G.S.biz.career)===saved);
}
enter(4);s=G.S;const d=C.projects.find(x=>x.lv===4),who=leader(d);
const room=I.capRoom();C.start(d.id,who.id,['yyb','yz']);
T.ok('新项目占用真实资本空间',Math.abs(I.capRoom()-(room-d.rwa))<1&&C.reserved()===d.rwa);
T.ok('终止项目释放额度且不退前期费用',C.push(d.id,'withdraw')&&C.reserved()===0&&Math.abs(I.capRoom()-room)<1&&s.month.spent===d.cost);
enter(4);s=G.S;s.biz.capital=1;T.ok('资本不足时不能启动项目',!C.startCheck(d.id).ok&&C.start(d.id,leader(d).id,['yyb','yz'])===null);
enter(1);s=G.S;s.biz.budget=0;const a=s.ap;T.ok('费用不足不扣行动点，也不启动项目',C.start('street',C.people()[0].id,['dzs'])===null&&s.ap===a&&s.biz.career.projects.length===0);
enter(4);s=G.S;C.start('auto',leader(d).id,['yyb','yz']);C.push('auto','push');round();C.choose('auto','lead');round();
const pr=s.biz.career.projects[0];s.biz.career.coord=30;round();
T.ok('跨机构协作不足会阻滞项目并提出争议',pr.dispute&&pr.stage===2);
C.push('auto','resolve');C.talk(pr.lead,'work');round();
T.ok('解决争议后项目恢复推进',!pr.dispute&&pr.stage>2);
const partner=pr.partner,relation=C.link(pr.lead,partner);s.biz.career.council={id:'credit',at:s.turn,lead:pr.lead,partner};
C.council('single');
T.ok('独享成绩会伤害具体协办人的合作关系',C.link(pr.lead,partner)<relation);
G.save();const linkSnapshot=JSON.stringify(s.cadreRelations);G.load();
T.ok('干部间合作关系单独存档并在重读后保留',JSON.stringify(G.S.cadreRelations)===linkSnapshot);
enter(2);s=G.S;T.ok('年度资源分配拒绝重复单位，正确安排可执行',C.plan('corp',['dzs','dzs','nanping'])===null&&C.plan('retail',['dzs','nanping','chayuan'])&&C.plan('risk',['dzs','nanping','chayuan'])===null);
enter(5);s=G.S;let g=s.biz.career;g.council={id:'credit',at:s.turn};s.ap=0;const coord=g.coord;
T.ok('不耗行动点的议事选项在0点时可处理且不扣点',C.council('joint')&&s.ap===0&&g.coord>coord);
T.ok('议事已处理不能重复领取效果',C.council('joint')===null);
enter(5);s=G.S;g=s.biz.career;
C.alm('long');for(let i=0;i<3;i++)round();
T.ok('长期资产策略消耗流动性，低位形成持续压力与成本',g.alm.liquidity<40&&g.alm.stage>0&&s.log.some(x=>/应急资金成本/.test(x.html)));
C.alm('reserve');for(let i=0;i<4;i++)round();
T.ok('流动性储备策略可逐步缓解压力',g.alm.liquidity>=40&&g.alm.stage===0);
enter(3);s=G.S;g=s.biz.career;g.engaged=true;g.plan='corp';
g.projects=['citrus','food'].map(id=>({id,status:'done',exposure:1,lead:C.people()[0].id,units:['yyb'],yield:1,earned:0}));
C.settle();
T.ok('已落地产生持续收益的产业项目仍计入集中风险',s.log.some(x=>/产业投放集中/.test(x.html))&&s.month.spent>0);
enter(1);s=G.S;s.phase='trans';const clean=s.core.clean;
T.ok('副行长短任期有选择且不能重复刷效果',C.deputyChoice('coordinate')&&C.deputyChoice('sponsor')===null&&s.core.clean===clean);
I.applyTransition();T.ok('副行长协调经验带入下一职务',G.S.biz.career.coord>65&&G.S.deputyTerms[1].choice==='coordinate');
T.done();
