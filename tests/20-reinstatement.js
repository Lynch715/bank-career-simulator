const fs=require('fs'),{JSDOM}=require('jsdom');
const {load,runner,GAME}=require('./lib');const {G}=load(),I=G.internals,T=runner('20-reinstatement');G.setHeadless(true);
function init(lv=3){G.newGame({seed:417});G.S.carry={};for(let n=2;n<=lv;n++){G.S.lv=n;I['initL'+n]();}G.setBot(null);return G.S;}
function demote(lv=3){const s=init(lv);I.dirt(60,'一次严重违规');I.resolveDiscipline('audit');s.justEntered=false;delete s.disciplineNotice;return s;}
function eligible(s){s.discipline.tasks={training:1,review:1,repair:1};s.monthAbs=s.discipline.until;Object.assign(s.core,{perf:75,trust:65,rep:70});s.kpi.comp=100;I.updateDiscipline();}
let s=demote();const r=I.reinstatementState();
T.ok('降职后建立原级复任目标，不指向更高职级',r.target===3&&s.lv===2&&r.nextAt===12);
s.monthAbs=11;s.discipline.tasks={training:1,review:1,repair:1};Object.assign(s.core,{perf:90,trust:90,rep:90});
T.ok('条件再好也不能在满12个月前复任',!I.applyReinstatement()&&s.lv===2);
eligible(s);s.discipline.tasks.review=0;
T.ok('期限届满但整改任务未完成，仍不可复任',!I.applyReinstatement());s.discipline.tasks.review=1;
const time=s.monthAbs,age=s.age,loanBook=JSON.stringify(s.loanBook),historyLength=s.discipline.history.length;
T.ok('已处理的60点风险不永久阻断复任',s.core.clean===40&&I.reinstatementAssessment().pass);
T.ok('符合条件即可直接复任原级',I.applyReinstatement()&&s.lv===3);
T.ok('复任不重复消耗两三年副职过渡',s.monthAbs===time&&s.age===age);
T.ok('复任保留处分、历史风险及未到期贷款',s.discipline.history.length===historyLength&&s.core.clean===40&&JSON.stringify(s.loanBook)===loanBook);
T.ok('履历登记本次复任，不能重复领取复任',s.discipline.history[0].reinstatedAt.lv===3&&!I.reinstatementState()&&!I.applyReinstatement());
G.save();G.load();T.ok('复任状态可读回且存档版本不变',G.S.lv===3&&G.S.ver===4&&G.S.discipline.history[0].reinstatedAt);

s=demote(4);eligible(s);s.core.perf=20;const oldUntil=I.reinstatementState().nextAt;let done=false;
I.runReinstatement(()=>done=true);
T.ok('复核不达标时继续游戏，不直接结束',done&&s.phase==='play'&&s.lv===3);
T.ok('失败原因明确，6个月后再次复核',I.reinstatementState().nextAt===s.monthAbs+6&&I.reinstatementState().last.reasons.some(x=>x.includes('业绩')));
eligible(s);s.monthAbs=oldUntil+5;
T.ok('复评等待期未满不能直接复任',!I.applyReinstatement());s.monthAbs=oldUntil+6;
T.ok('下一次复评达标后能复任',I.applyReinstatement()&&s.lv===4);

s=demote();eligible(s);I.dirt(1,'新增未处理问题');
T.ok('复任不豁免新增未处理问题',!I.reinstatementAssessment().pass&&!I.applyReinstatement());
I.resolveDiscipline('routine');T.ok('新的轻微处分会重新计算观察期限',I.reinstatementState().cleanSince===s.monthAbs&&I.reinstatementState().nextAt>=s.discipline.until);
s=demote();eligible(s);s.kpi.comp=80;I.trackReinstatementConduct();s.kpi.comp=100;s.monthAbs+=5;
T.ok('合规失分后需重新累计连续6个月达标',!I.reinstatementAssessment().pass);s.monthAbs++;T.ok('连续合规达标满6个月后可复核',I.reinstatementAssessment().pass);
s=demote();eligible(s);I.dirt(45,'受处分后再犯严重问题');I.resolveDiscipline('audit');
T.ok('复任通道不削弱再次严重违规的终结后果',s.phase==='over'&&s.over.id==='caught');

s=demote(2);s.biz.base+=7777;const lowerDep=I.depTotal();eligible(s);I.applyReinstatement();
T.ok('网点期间经营的最新存款随复任衔接到支行',s.biz.outlets.find(x=>x.id==='dzs').dep===lowerDep);
s=init(4);I.captureCareerPost();s.lv=5;I.initL5();const hqNpl=s.biz.npl;s.loanBook.push({id:'restore-lower-default',lv:4,name:'原分行旧贷',amt:5400,def:true,defAt:999,done:false});I.dirt(60,'测试处分');I.resolveDiscipline('audit');s.loanBook.at(-1).done=true;s.biz.inst.find(x=>x.id==='yyb').npl+=5400;eligible(s);I.applyReinstatement();
T.ok('分行期间新确认的旧贷不良随复任衔接到总行',s.lv===5&&s.biz.npl===hqNpl+5400&&s.loanBook.at(-1).done);

s=demote(4);eligible(s);s.age=55;s.monthAbs=25*12;
T.ok('恢复曾任职级可越过首次晋升年龄线',I.applyReinstatement()&&s.lv===4&&s.age===55);
s=demote(5);eligible(s);s.age=60;done=false;I.runReinstatement(()=>done=true);
T.ok('60岁到龄离岗，不能通过复任突破退休限制',done&&s.phase==='over'&&s.lv===4&&s.over.title==='到龄离岗'&&!I.applyReinstatement());

s=init(4);s.biz.projects=[{id:'park',done:true,prog:9}];s.biz.projQueue=[];I.captureCareerPost();s.lv=5;I.initL5();I.dirt(60,'高级岗位处分');I.resolveDiscipline('audit');
T.ok('原岗位项目耗尽时改考存量项目质量',s.lv===4&&s.kpi.card.some(k=>k.k==='projectOps'&&k.target===100&&k.w===10)&&!s.kpi.card.some(k=>k.k==='proj'));
const defs=JSON.stringify(s.biz.projects);I.computeKpi(3);
T.ok('存量质量考核有可实现分值，不新造项目奖励',s.kpi.card.find(k=>k.k==='projectOps').actual>0&&JSON.stringify(s.biz.projects)===defs&&s.biz.projQueue.length===0);
// 模拟旧版正在考察的存档仍保存旧项目KPI。
Object.assign(s.kpi.card.find(k=>k.k==='projectOps'),{k:'proj',name:'战略项目',target:1,unit:'个'});delete s.discipline.reinstatement;
G.save();G.load();s=G.S;I.computeKpi(3);
T.ok('旧版考察存档衔接复任和可完成KPI',I.reinstatementState().target===5&&s.kpi.card.some(k=>k.k==='projectOps'));
eligible(s);T.ok('可重返总行且使用合法半年月份',I.applyReinstatement()&&s.lv===5&&[6,12].includes(s.m));

s=demote();eligible(s);s.phase='over';s.over={id:'lock2',title:'旧年龄锁定',text:'旧版锁定',lv:s.lv,age:s.age};delete s.discipline.reinstatement;
G.save();G.load();s=G.S;
T.ok('旧版年龄锁定存档可主动继续复任考察',I.canResumeReinstatement()&&I.resumeReinstatement()&&s.phase==='play'&&I.reinstatementState());
s.phase='over';s.over={id:'side',title:'主动转岗',text:'',lv:s.lv,age:s.age};T.ok('普通主动转岗结局不会被自动恢复',!I.canResumeReinstatement());

s=demote();eligible(s);s.phase='promo';s.promo.stage='assess';done=false;I.runPromo(()=>done=true);
T.ok('旧版考察中途存档恢复时可转入复任流程',done&&s.phase==='play'&&s.lv===3&&s.discipline.history[0].reinstatedAt);
s=demote();eligible(s);Object.assign(s.core,{perf:100,rep:100,trust:44});
T.ok('复核综合分再高也需达到信任最低要求',!I.reinstatementAssessment().pass&&!I.applyReinstatement());

const html=fs.readFileSync(GAME,'utf8');const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'}),H=dom.window.THSZ,d=dom.window.document,errors=[];
dom.window.addEventListener('error',e=>errors.push(e.message));H.setHeadless(true);H.newGame({seed:417});H.S.carry={};H.S.lv=2;H.internals.initL2();H.S.lv=3;H.internals.initL3();H.internals.dirt(60,'测试处分');H.internals.resolveDiscipline('audit');H.setHeadless(false);H.UI.refresh();
T.ok('面板显示复任目标、门槛与复评期限',d.querySelector('#disciplinePanel').textContent.includes('复任目标：二级分行行长')&&d.querySelector('#disciplinePanel').textContent.includes('6个月后再评'));
H.S.phase='over';H.S.over={id:'lock2',title:'旧版锁定',text:'',lv:2,age:H.S.age};H.UI.refresh();
T.ok('旧锁定结局呈现继续复任入口',!!d.querySelector('#eReview'));d.querySelector('#eReview').click();
T.ok('选择继续后回到经营面板且不出现脚本错误',H.S.phase==='play'&&d.querySelector('#stage').classList.contains('hidden')&&!d.querySelector('#colM').dataset.renderError&&errors.length===0,errors.join('|'));
dom.window.close();T.done();
