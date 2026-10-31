// 职务权限与组织流程：真实旧档、旧入口、待批状态、过期批复、额度、重复入账与恢复。
const fs=require('fs');
const {load,runner,GAME}=require('./lib');
const legacy=require('./fixtures/career-legacy-v1.json');
const oldCareer=require('./fixtures/career-pre-scope-v4.json');
const {G,store}=load({patch:c=>c.replace('const THSZ = {','const THSZ = { qa:{subordinates,subsFav,governanceChair,managementCheck,loanAuthority,governanceRegionK},')});
const T=runner('24-authority'),C=G.career,A=G.act,I=G.internals,V=G.governance;
G.setHeadless(true);G.setBot(null);
function enter(lv,save){store.thsz_save=JSON.stringify(save||legacy[lv-1]);G.load();G.setBot(null);return G.S;}
function next(){I.advance(true);}
function snapshot(){G.save();const text=store.thsz_save;G.S=null;T.ok('流程中存读档状态一致',!!G.load()&&JSON.stringify(G.S)===text);return G.S;}
function active(kind){return V.active().find(x=>x.kind===kind);}
let s=enter(1);I.dirt(G.BALANCE.discipline.demote+1);I.resolveDiscipline('audit');
const res=[s.ap,s.biz.budget],lead=C.people()[0];
T.ok('实际撤职处分生效',s.discipline.removed);
T.ok('撤职后新培养、考察、谈话、特色、项目均拒绝',!C.train(lead.id,'corp')&&!C.assess(lead.id)&&!C.talk(lead.id,'work')&&!C.style('elder')&&!C.start('street',lead.id,['dzs']));
T.ok('拒绝不扣费、不扣行动点',s.ap===res[0]&&s.biz.budget===res[1]);
T.ok('整改期间客户维护仍可实际执行',!!A.maintain(s.biz.cards.find(c=>!c.maint).id,'deposit'));
s=enter(2);const oldRole=s.staff[0].role,oldAP=s.ap,oldBudget=s.biz.budget;
T.ok('升职后旧网点操作和员工分工入口失效',!A.train(s.staff[0].id,'op')&&!A.hall()&&!A.setRole(s.staff[0].id,'lobby')&&s.staff[0].role===oldRole&&s.ap===oldAP&&s.biz.budget===oldBudget);

for(const lv of [2,3]){
 s=enter(lv);const slot=C.positions()[0],p=C.available(slot.id)[0],old=slot.pid,ap=s.ap;
 const appoint=lv===2?A.appoint:A.appointL3;
 T.ok('L'+lv+'旧入口拒绝未考察人选',!appoint(slot.id,p.id)&&C.positions()[0].pid===old&&s.ap===ap);
 C.assess(p.id);const before=s.ap;
 T.ok('L'+lv+'旧入口考察后任命，写履职观察与历史',appoint(slot.id,p.id)&&s.ap===before-1&&C.record(p.id).probation&&C.record(p.id).history.some(x=>x.type==='appoint'));
 T.ok('L'+lv+'同一人不能再占其他岗位',!appoint(C.positions()[1].id,p.id));
 p.pos='退休';T.ok('L'+lv+'退休干部不能从任免候选回流',!I[lv===2?'appointCands':'appointCandsL3'](slot.id).some(x=>x.id===p.id));
}
s=enter(3);T.ok('二级分行有七家经营机构和五个本部部门岗位',C.positions().length===12&&C.positions().filter(x=>x.department).length===5);
T.ok('旧档熊伟兼任完整保留且可识别',s.biz.lineHeads.ops==='xiongw'&&s.biz.branches[0].mgr==='xiongw'&&V.roles('xiongw').length===2);
const dp=C.available('dept_ops')[0];C.assess(dp.id);C.appoint('dept_ops',dp.id);
T.ok('补任部门负责人解除兼任，原营业部职务保留',s.biz.lineHeads.ops===dp.id&&s.biz.branches[0].mgr==='xiongw'&&V.roles('xiongw').length===1&&/营业部/.test(I.person('xiongw').pos));
G.newGame({seed:244});s=G.S;s.lv=3;I.initL3();
T.ok('新任期运营负责人和营业部负责人分设',s.biz.lineHeads.ops!==s.biz.branches[0].mgr);

for(const lv of [4,5]){
 s=enter(lv);const p=C.available('exec_corp')[0],old=C.positions().find(x=>x.id==='exec_corp').pid;C.assess(p.id);
 const app=C.appoint('exec_corp',p.id);T.ok('L'+lv+'副行长任用先报批，现任仍履职',app?.status==='submitted'&&C.positions().find(x=>x.id==='exec_corp').pid===old&&!C.record(p.id).probation);
 T.ok('L'+lv+'同一人不能同时报两个岗位',!C.appoint('exec_risk',p.id));
 T.ok('L'+lv+'未获批不能实施',!V.execute(app.id));
 s=snapshot();next();const approved=active('appoint');T.ok('L'+lv+'下一回合获得任免批复',approved.status==='approved');
 T.ok('L'+lv+'获批后任命生效，原批复不能重复执行',V.execute(app.id)&&C.positions().find(x=>x.id==='exec_corp').pid===p.id&&C.record(p.id).probation&&!V.execute(app.id));
}
s=enter(4);let candidate=C.available('exec_corp')[0];C.assess(candidate.id);let a=C.appoint('exec_corp',candidate.id);next();I.person(candidate.id).pos='退休';let ap=s.ap;
T.ok('批复后退休仍不可执行，不扣行动点',!V.execute(a.id)&&s.ap===ap);
T.ok('失效方案可撤回且不重复撤回',V.cancel(a.id)&&!V.cancel(a.id));
s=enter(5);candidate=C.available('exec_corp')[0];C.assess(candidate.id);a=C.appoint('exec_corp',candidate.id);next();C.record(candidate.id).assessedUntil=s.monthAbs-1;
T.ok('收到批复后考察过期，必须重新考察',!V.execute(a.id));
C.assess(candidate.id);T.ok('补充考察后可依批复任用',V.execute(a.id));
s=enter(5);candidate=C.available('exec_corp')[0];C.assess(candidate.id);s.biz.career.coord=20;a=C.appoint('exec_corp',candidate.id);next();
T.ok('组织协调不足时任免被退回，不换现任',a.status==='rejected'&&C.positions().find(x=>x.id==='exec_corp').pid!==candidate.id);

s=enter(5);T.ok('总行有36家独立一级分行，七大区只保留汇总',s.biz.firstBranches.length===36&&C.positions().length===40&&Math.abs(s.biz.firstBranches.reduce((n,x)=>n+x.share,0)-1)<1e-10&&C.positions().filter(x=>!x.exec).every(x=>x.row.regionId));
T.ok('总行直属下属不包含旧网点人员',G.qa.subordinates().length===40&&!G.qa.subordinates().some(p=>C.level(p)<4));
const junior=I.person('dengyu'),fav=junior.fav;G.qa.subsFav(1);
T.ok('全国行长会不再改变基层旧部的管理关系',junior.fav===fav);
const hd=s.biz.regions.find(x=>x.id==='hd'),sh=s.biz.firstBranches.find(x=>x.id==='hd'),shHead=I.person(sh.headId),start=V.regionK(hd);
shHead.skill+=10;const delta=V.regionK(hd)-start;
T.ok('上海行长只影响上海份额，华东按各分行加权汇总',Math.abs(delta-10*G.BALANCE.career.regionalK*sh.share/hd.share)<1e-10&&sh.share<hd.share);
I.person('songwy').fav=0;I.computeCore();const trust=s.core.trust;I.person('songwy').fav=100;I.computeCore();
T.ok('退休前任私人好感不再控制总行信任',s.core.trust===trust);
const lu=I.person('lu');lu.pos='退休';const board=I.MEETINGS[5].find(x=>x.id==='m5_dongshi'),spec=I.meetSpec(board),luFav=lu.fav;board.go.fn();
T.ok('董事长退休后会议使用继任者，关系与董事会支持更新',spec.portrait==='chair5'&&lu.fav===luFav&&!/陆明远是董事长/.test(spec.body)&&s.biz.career.board>G.BALANCE.career.boardStart);

s=enter(2);
T.ok('授权不通过隐藏风险层级泄露真实风险',!G.qa.loanAuthority({amt:200,type:'micro',tier:'high',coll:'房产抵押',flow:'稳定',tax:'A'}));
T.ok('可见尽调识别的高风险须报批，即使隐藏层级偏低',G.qa.loanAuthority({amt:200,type:'micro',tier:'low',coll:'信用',flow:'下滑',tax:'C'}));
T.ok('相同金额按产品执行不同授权上限',G.qa.loanAuthority({amt:800,type:'micro'})&&!G.qa.loanAuthority({amt:800,type:'corp'}));
s.biz.queue=[{id:'small',name:'授权内小微',amt:400,type:'micro',tier:'low'},{id:'large',name:'超限对公',amt:1200,type:'corp',tier:'mid'},{id:'risk',name:'高风险小额',amt:200,type:'micro',tier:'high',riskFlag:true}];
let loans=s.biz.loans;A.decideLoan('small',true);T.ok('支行授权内低风险贷款直接发放',s.biz.loans===loans+400);
loans=s.biz.loans;A.decideLoan('large',true);A.decideLoan('risk',true);
T.ok('超金额与高风险均走上级审查，待批贷款不入账',s.biz.loans===loans&&V.active().filter(x=>x.kind==='loan').length===2);
s=snapshot();next();let credit=V.active().find(x=>x.data.loan?.id==='large');const fee=s.biz.ytd.fee;
T.ok('超限贷款批复后才能放款，收入仅入账一次',V.execute(credit.id)&&s.biz.loans===loans+1200&&s.biz.ytd.fee>fee&&!V.execute(credit.id));

s=enter(3);s.biz.quota=0;loans=s.biz.loans.platform;let off=A.platform();A.decidePlatform('submit');a=active('loan');
T.ok('平台正规路径零额度时仅报批，不产生贷款或违规风险',a.status==='submitted'&&s.biz.loans.platform===loans);
next();T.ok('平台授信获批仍受额度约束',!V.execute(a.id));
let q=V.requestQuota(a.id);T.ok('不足额度可以向上申请，未批复不增加额度',!!q&&s.biz.quota===0);
next();V.execute(q.id);T.ok('额度批复落实后贷款可按批复放款',V.execute(a.id)&&s.biz.platformCompliant===off.size&&s.biz.loans.platform===loans+off.size&&V.platformRoom()===0);
T.ok('平台按批复放款不可重复，仍保留风险台账',!V.execute(a.id)&&s.loanBook.some(x=>x.approved&&x.amt===off.size));
s=enter(3);s.biz.quota=0;off=A.platform();const risk=s.core.clean;A.decidePlatform('gray');
T.ok('明确选择违规绕行才可超额度，合规风险增加',s.biz.loans.platform===off.size&&s.core.clean<risk&&!s.biz.platformCompliant);

s=enter(3);s.biz.budget=1000;const count=s.biz.newOutlets.length;a=A.openOutlet('gaotie');
T.ok('网点提案不挂牌、不扣建设费，重复提案拒绝',a.status==='submitted'&&s.biz.newOutlets.length===count&&s.biz.budget===1000&&!A.openOutlet('gaotie'));
next();const money=s.biz.budget;V.execute(a.id);T.ok('批复后投入筹建费，筹建期尚未营业',s.biz.budget===money-300&&s.biz.newOutlets.length===count);
s=snapshot();let budget=s.biz.budget;next();T.ok('存读档后验收挂牌一次，不重复扣建设费',s.biz.newOutlets.length===count+1&&s.biz.budget===budget+G.BALANCE.L3.budgetQ);V.monthStart();T.ok('重复调用月初流程不重复开店',s.biz.newOutlets.length===count+1);
const branch=s.biz.branches[1],outlets=branch.outlets,deposit=branch.dep;a=A.closeOutlet(branch.id);next();V.execute(a.id);
T.ok('撤并迁移期间保留原网点和客户资金',branch.outlets===outlets&&branch.dep===deposit);next();T.ok('迁移验收后才撤并并确认流失',branch.outlets===outlets-1&&branch.dep<deposit);

s=enter(5);let expense=s.biz.expenseK;a=A.reform();T.ok('改革提案不直接裁撤全国管理层级',!!a&&!s.biz.reformDone&&s.biz.expenseK===expense);
next();V.execute(a.id);s=snapshot();next();T.ok('改革试点完成后仍须分批推广',!s.biz.reformDone&&s.biz.expenseK===expense&&active('reform').stage===1);next();T.ok('完成推广后才节约费用，一任仅一次',s.biz.reformDone&&s.biz.expenseK<expense&&!A.reform());
s=enter(5);let capital=s.biz.capital;a=A.issueCapital();const cap=active('capital');T.ok('资本发行先审议报批，不提前增加资本',a.ok&&a.pending&&s.biz.capital===capital);next();V.execute(cap.id);capital=s.biz.capital;T.ok('资本到账后重放批复不会重复记账',s.biz.capIssued===1&&!V.execute(cap.id)&&s.biz.capital===capital);

s=enter(5,oldCareer);T.ok('上版旧档的项目、培养、原地区数据和贷款原样保留',JSON.stringify(s.biz.career.projects)===JSON.stringify(oldCareer.biz.career.projects)&&JSON.stringify(s.cadres)===JSON.stringify(oldCareer.cadres)&&JSON.stringify(s.loanBook)===JSON.stringify(oldCareer.loanBook)&&JSON.stringify(s.biz.regions)===JSON.stringify(oldCareer.biz.regions));
T.ok('旧档地区人事映射至对应一级分行，不重复任命',s.biz.regions.filter(x=>x.headId).every(x=>s.biz.firstBranches.find(b=>b.id===x.id).headId===x.headId));snapshot();

// Normal UI paths, including legacy modals and new pending workflow controls.
const {JSDOM,VirtualConsole}=require('jsdom'),errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errors.push(e.message);});
function ui(lv){const dom=new JSDOM(fs.readFileSync(GAME,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',virtualConsole:vc,beforeParse(w){w.localStorage.setItem('thsz_save',JSON.stringify(legacy[lv-1]));}});dom.window.document.querySelector('#btnCont').click();return dom;}
let dom=ui(2),w=dom.window,d=w.document;w.THSZ.UI.appointModal('nanping');
T.ok('旧任免弹窗展示考察限制，未考察按钮禁用',/考察/.test(d.querySelector('#modal').textContent)&&[...d.querySelectorAll('#modal .opt')].filter(x=>!/返回/.test(x.textContent)).every(x=>x.disabled));dom.window.close();
dom=ui(1);w=dom.window;d=w.document;w.THSZ.internals.dirt(w.THSZ.BALANCE.discipline.demote+1);w.THSZ.internals.resolveDiscipline('audit');w.THSZ.UI.refresh();T.ok('撤职界面不提供干部、项目或议事管理按钮',/管理权限暂停/.test(d.querySelector('#careerPanel').textContent)&&!d.querySelector('#careerNew')&&!d.querySelector('#careerAppoint'));dom.window.close();
dom=ui(5);w=dom.window;d=w.document;w.THSZ.act.reform();w.THSZ.UI.refresh();T.ok('报批台账展示待审且不能提前实施',/待董事会审议/.test(d.querySelector('#governancePanel').textContent)&&!d.querySelector('[data-gexec]'));w.THSZ.internals.advance(true);w.THSZ.UI.refresh();T.ok('获得批复后出现实施按钮',!!d.querySelector('[data-gexec]'));d.querySelector('[data-gexec]').click();T.ok('正常点击实施进入试点且未立即节约费用',w.THSZ.S.biz.expenseK===1&&/实施中/.test(d.querySelector('#governancePanel').textContent));dom.window.close();
T.ok('五级新增流程没有界面脚本异常',errors.length===0,errors.join(' | '));T.done();
