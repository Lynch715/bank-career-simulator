// 职务范围回归：总行不能把能力高的网点负责人直接当高级干部任用。
const fs=require('fs');
const {load,runner,GAME}=require('./lib');
const legacy=require('./fixtures/career-legacy-v1.json');
const preScope=require('./fixtures/career-pre-scope-v4.json');
const {G,store}=load(),C=G.career,I=G.internals,T=runner('23-cadre-scope');
G.setHeadless(true);G.setBot(null);
function enter(lv){store.thsz_save=JSON.stringify(legacy[lv-1]);G.load();G.setBot(null);return G.S;}
function approveAppointment(post,pid){const a=C.appoint(post,pid);if(!a)return null;I.advance(true);return G.governance.execute(a.id);}
let s=enter(5),junior=I.person('xulp');
junior.skill=100;C.record(junior.id).assessedUntil=s.monthAbs+100;C.record(junior.id).specialty='corp';
const peopleIds=new Set(C.people().map(p=>p.id));
T.ok('总行台账只包含总行与一级分行层级干部',C.people().length>4&&C.people().every(p=>C.level(p)>=4));
T.ok('网点负责人能力100、已有考察也不能进入总行候选池',C.level(junior)===1&&!peopleIds.has(junior.id)&&!C.available('hd').some(p=>p.id===junior.id));
let before=JSON.stringify(s);
T.ok('总行任用入口拒绝基层候选且不扣资源',C.appoint('hd',junior.id)===null&&JSON.stringify(s)===before);
T.ok('培养、考察、谈话与新项目同样不能越过本级范围',C.train(junior.id,'corp')===null&&C.assess(junior.id)===null&&C.talk(junior.id,'work')===null&&C.start('wealth5',junior.id,['hd','hn'])===null&&JSON.stringify(s)===before);
T.ok('总行岗位只含总行班子与明确的一级分行负责人',C.positions().length===40&&C.positions().every(p=>/副行长|分行行长/.test(p.name))&&!C.positions().some(p=>/网点|片区统筹/.test(p.name)));
T.ok('任用收紧不删除基层旧人、培养记录或人脉',!!I.person(junior.id)&&!!I.person('xiaoman')&&C.record(junior.id).specialty==='corp');
junior.role='总行风险管理部总经理';
T.ok('人物的旧头衔不能覆盖现任网点岗位',C.level(junior)===1&&!C.available().some(p=>p.id===junior.id));
junior.pos='总行公司部客户经理';T.ok('在总行工作不等于具有总行部门负责人履历',C.level(junior)===0&&!C.available().some(p=>p.id===junior.id));
junior.pos='四川分行行长秘书';T.ok('岗位名称含行长字样也不能冒充行长履历',C.level(junior)<4&&!C.available().some(p=>p.id===junior.id));

s=enter(5);let alum=I.person('xiaoman');alum.skill=90;alum.pos='总行风险管理部总经理';
T.ok('旧部实际成长到总行部门后可以进入本级候选',C.level(alum)===4&&C.available('hd').some(p=>p.id===alum.id));
C.assess(alum.id);T.ok('合格干部经考察后可任一级分行行长',approveAppointment('hd',alum.id)&&s.biz.firstBranches.find(r=>r.id==='hd').headId===alum.id&&/上海分行行长/.test(alum.pos));
T.ok('已经担任一级分行行长者不能同时占用班子岗位',C.appoint('exec_corp',alum.id)===null);

s=enter(5);C.available().forEach(p=>p.pos='退休');
before=JSON.stringify(s);
T.ok('本级候选耗尽时保持空池，不拿基层旧部补位',C.available().length===0&&C.available('hd').length===0&&JSON.stringify(s)===before);
T.ok('反复初始化不复活退休的高级干部',C.people().every(p=>!/退休/.test(p.pos))&&C.available().length===0);

s=enter(4);junior=I.person('dengyu');junior.skill=100;
T.ok('一级分行也不把网点负责人列入本级台账',C.level(junior)===1&&!C.people().some(p=>p.id===junior.id));
const branchHead=I.person('chengxy');
T.ok('一级分行任用副行长要求更高层级履历',C.level(branchHead)===2&&!C.available('exec_corp').some(p=>p.id===branchHead.id)&&C.available('wz').some(p=>p.id===branchHead.id));
const senior=C.available('exec_corp')[0];C.assess(senior.id);
T.ok('合格二级分行干部仍可进入一级分行班子',approveAppointment('exec_corp',senior.id)&&s.biz.deputies.some(d=>d.id===senior.id));

s=enter(3);junior=I.person('xiaoman');junior.skill=100;
T.ok('二级分行不能仅凭能力把普通柜员直接任为支行行长',!C.people().some(p=>p.id===junior.id)&&!I.appointCandsL3('gst').some(p=>p.id===junior.id));
before=JSON.stringify(s);T.ok('原有支行任免入口同样执行职务边界',G.act.appointL3('gst',junior.id)===null&&JSON.stringify(s)===before);
s=enter(2);T.ok('支行阶段仍能培养基层员工与任用网点负责人',C.people().some(p=>p.id==='xiaoman')&&C.available('nanping').some(p=>p.id==='xiaoman'));
s=enter(1);T.ok('网点阶段保留员工带教范围',C.people().length===s.staff.length&&C.people().every(p=>C.level(p)===0));

store.thsz_save=JSON.stringify(preScope);G.load();s=G.S;
T.ok('上一发布版旧档的现有任命、项目、培养和贷款原样保留',JSON.stringify(s.biz.regions)===JSON.stringify(preScope.biz.regions)&&JSON.stringify(s.biz.career.projects)===JSON.stringify(preScope.biz.career.projects)&&JSON.stringify(s.cadres)===JSON.stringify(preScope.cadres)&&JSON.stringify(s.loanBook)===JSON.stringify(preScope.loanBook));
const project=s.biz.career.projects[0],stage=project.stage;
C.settle();T.ok('历史基层承办项目继续执行，不因名单收紧停摆',project.stage>stage&&!project.dispute);
T.ok('旧档中已付费的基层培养继续完成',!C.record('xiaoman').training&&C.record('xiaoman').history.some(h=>h.type==='training'));
G.save();const saved=JSON.stringify(s);G.load();T.ok('保存重读不重置任命、项目与履历',JSON.stringify(G.S)===saved);

// 真正的界面路径：当前管理、本级后备、本级全部与任用弹窗均不得漏出基层人选。
const {JSDOM,VirtualConsole}=require('jsdom'),errors=[],vc=new VirtualConsole();
vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errors.push(e.message);});
const dom=new JSDOM(fs.readFileSync(GAME,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',virtualConsole:vc,beforeParse(w){w.localStorage.setItem('thsz_save',JSON.stringify(legacy[4]));}});
const w=dom.window,d=w.document,H=w.THSZ;d.querySelector('#btnCont').click();d.querySelector('[data-ctab="people"]').click();
for(const scope of ['current','reserve','all']){
 d.querySelector('[data-cscope="'+scope+'"]').click();
 T.ok('总行界面 '+scope+' 范围没有网点或普通员工',!/网点负责人|柜员|大堂经理|理财经理|客户经理/.test(d.querySelector('.career-people').textContent));
}
T.ok('总行界面明确说明本级管理范围与旧部去向',/一级分行主要负责人/.test(d.querySelector('#careerContent').textContent)&&/人脉簿/.test(d.querySelector('#careerContent').textContent));
d.querySelector('#careerAppoint').click();
const opts=()=>[...d.querySelectorAll('#modal .opt')];
T.ok('任用岗位弹窗没有网点层级岗位',opts().slice(0,-1).every(p=>/副行长|分行行长/.test(p.textContent)));
opts().find(x=>/上海分行行长/.test(x.textContent)).click();
T.ok('任用候选弹窗没有隐藏的基层人选',!/网点负责人|柜员|理财经理/.test(d.querySelector('#modal').textContent));
opts().at(-1).click();
const candidate=H.career.available('hd')[0];H.career.assess(candidate.id);H.UI.refresh();d.querySelector('#careerAppoint').click();opts().find(x=>/上海分行行长/.test(x.textContent)).click();
const choice=opts().find(x=>x.textContent.includes(candidate.name));const ap=H.S.ap;
candidate.pos='南坪网点负责人';choice.click();
T.ok('弹窗打开后职务变化，点击旧候选仍被引擎拒绝',H.S.ap===ap&&!H.S.biz.regions.find(x=>x.id==='hd').headId);
H.UI.showPeople();T.ok('基层旧人仍可在人脉簿查看',/周小满/.test(d.querySelector('#stage').textContent));
T.ok('全程无界面脚本错误',errors.length===0,errors.join(' | '));
dom.window.close();T.done();
