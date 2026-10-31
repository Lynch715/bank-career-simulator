const fs=require('fs'), {JSDOM}=require('jsdom');
const {load,runner,GAME}=require('./lib');
const {G}=load(), I=G.internals, T=runner('19-discipline');
G.setHeadless(true);
function init(lv=1){
  G.newGame({seed:417}); G.S.carry={};
  for(let n=2;n<=lv;n++){G.S.lv=n;I['initL'+n]();}
  G.setBot(null); G.S.phase='play'; return G.S;
}
function add(points,reason='测试违规'){I.dirt(points,reason);}
let s=init();add(3,'不匹配销售');add(3,'不匹配销售');
T.ok('重复原因合并并保留次数',I.publicityReason()==='不匹配销售（共2次）');
let rec=I.resolveDiscipline('routine');
T.ok('轻微问题警告并继续游戏',rec.kind==='warning'&&s.phase==='play'&&s.lv===1&&!s.over);
T.ok('处分不清空风险和原始记录',s.core.clean===94&&s.flags.riskLedger.length===2);
T.ok('处分记录进入可导出的履历数据',I.bioData().discipline.length===1&&I.bioData().discipline[0].reason.includes('共2次'));
T.ok('同批问题立即再核查不重复处分',I.resolveDiscipline('audit')===null&&s.discipline.history.length===1&&I.publicityRisk()===0);
G.save();G.load();s=G.S;
T.ok('存读档后旧问题仍不再处分',I.resolveDiscipline('publicity')===null&&s.discipline.history.length===1);
add(2,'不匹配销售');rec=I.resolveDiscipline('routine');
T.ok('同名的新违规仍单独处理',rec.points===2&&s.discipline.history.length===2&&s.flags.riskLedger.length===3);

s=init();add(20);rec=I.resolveDiscipline('publicity');
T.ok('较重问题取消晋升并进入12个月考察',rec.kind==='probation'&&I.disciplineBlocked()&&s.discipline.until===12);
let callback=false;I.runPromo(()=>callback=true);
T.ok('考察期引擎阻止晋升流程',callback&&s.phase==='play'&&!s.promo.stage);
s.ap=4;T.ok('整改任务扣1点',I.doDisciplineTask('training')&&s.ap===3);
T.ok('同一期不能刷整改或重复任务',!I.doDisciplineTask('training')&&!I.doDisciplineTask('review')&&s.ap===3);
s.monthAbs++;I.doDisciplineTask('review');s.monthAbs++;I.doDisciplineTask('repair');
T.ok('任务完成但期限未满仍暂停晋升',I.disciplineBlocked());
s.monthAbs=12;I.updateDiscipline();
T.ok('期限与任务均满足才恢复资格，风险仍在',!I.disciplineBlocked()&&s.discipline.completed&&s.core.clean===80);

s=init();add(60,'销售适当性违规');rec=I.resolveDiscipline('publicity');
T.ok('最低级严重问题转撤职整改',rec.kind==='remove'&&s.lv===1&&s.discipline.removed&&s.phase==='play');
T.ok('撤职时称呼与管理权同步变化',G.act.rally()===null&&!G.act.setRole(s.staff[0].id,'lobby'));
const c=s.biz.cards[0];T.ok('整改期仍可合规维护客户',!!G.act.maintain(c.id,'deposit'));
T.ok('已处理问题不再触发年审或公示',!I.auditCheck()&&I.publicityRisk()===0);
s.discipline.tasks={training:1,review:1,repair:1};s.monthAbs=s.discipline.until;I.updateDiscipline();
T.ok('整改后恢复原岗位管理行动',!s.discipline.removed&&!!G.act.rally());

s=init(2);s.biz.corp.dep=123456;I.captureCareerPost();s.lv=3;I.initL3();
s.biz.budget=8765;s.loanBook.push({id:'keep3',lv:3,name:'原岗位平台旧贷',src:'platform',amt:10000,def:true,defAt:s.monthAbs,done:false});
const age=s.age,abs=s.monthAbs,ledger=s.loanBook.length,roster=s.people.map(p=>p.id).join('|');
add(60,'违规关联交易');rec=I.resolveDiscipline('audit');
T.ok('降一级后恢复原岗位经营余额',rec.kind==='demote'&&s.lv===2&&s.biz.corp.dep===123456);
T.ok('降职不倒退年龄、不丢人脉和未到期贷款',s.age===age&&s.monthAbs===abs&&s.loanBook.length===ledger&&s.people.map(p=>p.id).join('|')===roster);
T.ok('离任岗位经营与费用有快照可恢复',s.careerPosts[3].biz.budget===8765);
I.settleMonth();
T.ok('降职后的上级岗位旧贷仍兑现到原机构',s.loanBook.find(l=>l.id==='keep3').done&&s.careerPosts[3].biz.npa.some(n=>n.name==='原岗位平台旧贷'));
const npa=s.careerPosts[3].biz.npa.filter(n=>n.name==='原岗位平台旧贷').length;
I.settleMonth();T.ok('旧贷不重复入账',s.careerPosts[3].biz.npa.filter(n=>n.name==='原岗位平台旧贷').length===npa);
s.discipline.tasks={training:1,review:1,repair:1};s.monthAbs=s.discipline.until;I.updateDiscipline();
I.applyAppoint();I.applyTransition();
T.ok('整改后可走正常任命过渡重返原级',s.lv===3&&s.phase==='play'&&s.biz.npa.some(n=>n.name==='原岗位平台旧贷'));
T.ok('恢复岗位时旧贷不重复入账',s.biz.npa.filter(n=>n.name==='原岗位平台旧贷').length===1);

for(const lv of [2,3,4,5]){
  s=init(lv);const oldPeople=s.people.length;add(60);rec=I.resolveDiscipline('audit');
  T.ok(`无快照旧档 L${lv}→L${lv-1} 可继续`,rec.kind==='demote'&&s.lv===lv-1&&s.phase==='play'&&s.people.length>=oldPeople);
  let err;try{I.settleMonth();G.save();G.load();}catch(e){err=e.message;}
  T.ok(`L${lv-1} 新岗位可结算并读档`,!err&&G.S.ver===4,err);
}
s=init();s.core.clean=40;s.flags.dirtyWealth=3;
T.ok('无风险流水的旧档仍按明确标记说明原因',I.publicityReason().includes('风险测评不匹配'));
I.resolveDiscipline('audit');T.ok('旧档无流水也只处分一次',I.resolveDiscipline('audit')===null&&I.pendingDiscipline().points===0);
s=init(3);add(60);I.resolveDiscipline('audit');
add(45,'处分后再次严重违规');rec=I.resolveDiscipline('audit');
T.ok('受过降职处分后再次严重违规才终结',rec.kind==='dismiss'&&s.phase==='over'&&s.over.id==='caught');
T.ok('终结文案反映开除与本批原因',s.over.text.includes('解除劳动关系')&&s.over.text.includes('处分后再次严重违规'));
s=init();add(96,'极严重违规');rec=I.resolveDiscipline('audit');T.ok('极严重问题仍保留终结结局',rec.kind==='dismiss'&&s.phase==='over');

s=init();s.flags.signedHuang=true;add(20,'渝顺商贸贷后报告签名');I.resolveDiscipline('routine');s.discipline.tasks={training:1,review:1,repair:1};s.monthAbs=s.discipline.until;I.updateDiscipline();I.applyAppoint();I.applyTransition();
T.ok('已处分事项在升职过渡中的后续风险不会再当新违规',s.core.clean===75&&I.pendingDiscipline().points===0&&I.resolveDiscipline('audit')===null);

const html=fs.readFileSync(GAME,'utf8');let dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});
let H=dom.window.THSZ,d=dom.window.document,errors=[];dom.window.addEventListener('error',e=>errors.push(e.message));
H.setHeadless(true);H.newGame({seed:417});H.internals.dirt(60,'同类违规');H.internals.resolveDiscipline('publicity');H.setHeadless(false);H.UI.refresh();
T.ok('整改面板、任务和停晋提示可见',d.querySelector('#disciplinePanel').textContent.includes('暂停晋升')&&d.querySelectorAll('[data-rectify]').length===3);
d.querySelector('[data-rectify="training"]').click();T.ok('点击整改任务实际扣点并更新状态',H.S.ap===3&&d.querySelector('[data-rectify="training"]').disabled);
H.save();let raw=dom.window.localStorage.getItem('thsz_save');dom.window.close();
dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){w.localStorage.setItem('thsz_save',raw);}});H=dom.window.THSZ;d=dom.window.document;d.querySelector('#btnCont').click();
T.ok('重载恢复整改任务与处分通知',H.S.discipline.tasks.training===1&&d.querySelector('#modal').textContent.includes('接受处分，继续工作'));
d.querySelector('#modal .opt').click();T.ok('确认后仍在可操作面板',!d.querySelector('#colM').dataset.renderError&&d.querySelector('#disciplinePanel'));
T.ok('UI无脚本错误',!errors.length,errors.join('|'));dom.window.close();

s=init();add(60,'旧版本违规');s.phase='over';s.over={id:'caught',title:'出事',text:'撤销网点负责人职务',lv:1,age:31};const original=JSON.stringify(s);G.save();G.load();
T.ok('旧版已结束存档原样读取，需主动选择继续',G.S.phase==='over'&&JSON.stringify(G.S)===original&&I.canResumeLegacyDiscipline());
T.ok('旧版撤职存档可按新规则继续',I.resumeLegacyDiscipline()&&G.S.phase==='play'&&G.S.discipline.removed);
T.ok('旧结局恢复会进入下一期，避免原月份重复结算',G.S.turn===2&&G.S.monthAbs===1&&!G.S.justEntered);

// 年审在回合队列内降级后，新岗位不能被同一队列多结算或多推进一期。
s=init(3);add(60);s.m=12;s.turn=8;s.promo.windowAt=999;
const auditConfig={...G.BALANCE.audit};Object.assign(G.BALANCE.audit,{line:100,k:1,maxP:1});
G.endTurn();G.runJobs();
T.ok('真实年底审计管线降级后进入新岗位首期',G.S.lv===2&&G.S.turn===1&&G.S.phase==='play'&&!G.S.justEntered);
G.S.promo.windowAt=999;G.endTurn();G.runJobs();
T.ok('新岗位下一次结算正常推进且不重复处分',G.S.turn===2&&G.S.discipline.history.length===1);
Object.assign(G.BALANCE.audit,auditConfig);

async function publicFlowTest(){
 const ui=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){const later=w.setTimeout.bind(w);w.setTimeout=(f,t,...a)=>later(f,Math.min(t||0,5),...a);}});
 const H=ui.window.THSZ,d=ui.window.document,errors=[];ui.window.addEventListener('error',e=>errors.push(e.message));
 H.setHeadless(true);H.newGame({seed:417});H.internals.dirt(60,'公示核查事项');H.setHeadless(false);H.UI.refresh();
 const p=H.BALANCE.promo;Object.assign(p,{pass:-1000,rivalBase:-100,rivalMin:-100,rivalMax:-50,rivalNoise:0,rivalTopNoise:0,backP:0});Object.keys(p.rivalMaxLv||{}).forEach(k=>p.rivalMaxLv[k]=-50);p.rivalBaseLv[1]=-100;p.report.from=101;p.report.k=1;
 let done=false;H.internals.runPromo(()=>done=true);
 async function waitFor(selector){for(let i=0;i<1000;i++){const el=d.querySelector(selector);if(el&&!el.disabled)return el;await new Promise(r=>setTimeout(r,5));}throw Error('等待UI超时：'+selector);}
 (await waitFor('#n1')).click();(await waitFor('#n2')).click();
 for(let n=0;n<3;n++)d.querySelector('#stage .stmt:not(.on)').click();
 d.querySelector('#n3').click();
 for(let n=0;n<3;n++){const el=d.querySelector('#stage .opt');if(el)el.click();}
 (await waitFor('#n5')).click();(await waitFor('#n6')).click();
 T.ok('实际公示页面查实后进入整改通知，未结束游戏',!done&&H.S.phase==='play'&&H.S.discipline.removed&&d.querySelector('#modal').textContent.includes('接受处分，继续工作'));
 T.ok('公示流程收尾隐藏旧舞台，整改面板可操作',d.querySelector('#stage').classList.contains('hidden')&&d.querySelector('#disciplinePanel')&&!d.querySelector('#colM').dataset.renderError);
 d.querySelector('#modal .opt').click();T.ok('确认处分通知后才恢复公示后续回合队列',done&&H.S.phase==='play');
 T.ok('公示全流程无脚本错误',errors.length===0,errors.join('|'));ui.window.close();
}
publicFlowTest().then(()=>T.done()).catch(e=>{console.error(e);process.exitCode=1;});
