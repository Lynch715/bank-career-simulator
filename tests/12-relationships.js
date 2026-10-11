const {load,runner}=require('./lib');
const {G}=load({patch:s=>s.replace('internals:{ maintainQuote,','internals:{ monthStart, maintainQuote,')});
const I=G.internals,T=runner('12-relationships');G.setHeadless(true);
function init(lv=1){G.newGame({seed:4});G.BALANCE.chase.spotP=0;if(lv===2){G.S.carry={};G.S.lv=2;I.initL2('xiaoman');}return G.S;}
const near=(a,b)=>Math.abs(a-b)<1e-8;
let s=init(),c=I.card('zhangxf'),p=I.person(c.id);s.m=c.due;I.settleMonth();
T.ok('到期流失后客户卡与人脉簿同步',near(c.rel,p.fav)&&c.rel<55);
const before=c.rel;I.fav(c.id,-4);T.ok('事件扣4不会反向加分',near(c.rel,before-4)&&near(p.fav,c.rel));
I.fav(c.id,4);T.ok('事件加4不会翻倍',near(c.rel,before));
I.fav(c.id,100);T.ok('好感封顶同步',c.rel===100&&p.fav===100);I.fav(c.id,-200);T.ok('好感最低为0',c.rel===0&&p.fav===0);
s=init();c=I.card('zhangxf');p=I.person(c.id);I.ODDS[1].maintain=()=>0;G.BALANCE.odds.min=0;const old=c.rel;G.act.maintain(c.id,'deposit');T.ok('维护失败的1点好感同步',c.rel===old+1&&p.fav===c.rel);
I.ODDS[1].maintain=()=>1;G.BALANCE.odds.max=1;c.maint=false;G.act.maintain(c.id,'deposit');T.ok('维护成功只增加配置值',c.rel===old+1+G.BALANCE.L1.card.relMaintain&&p.fav===c.rel);
s=init();c=I.card('zhangxf');p=I.person(c.id);c.rel=54.7;p.fav=60;G.save();G.load();T.ok('旧L1存档以客户真实关系校准',I.card('zhangxf').rel===54.7&&I.person('zhangxf').fav===54.7);
s=init(2);I.person('xiaoman').fav=72;I.staff('xiaoman').fav=60;G.save();G.load();T.ok('旧L2存档以现任人脉好感校准',I.staff('xiaoman').fav===72&&I.person('xiaoman').fav===72);
s=init(2);I.settleMonth();T.ok('升职后月末好感恢复同步旧员工',near(I.staff('xiaoman').fav,I.person('xiaoman').fav));
s=init(2);I.applyDecomp(I.decompProportional());T.ok('按潜力分配不压垮小网点',s.biz.outlets.every(o=>!o.overload&&o.morale>=60));
for(const success of [true,false]){
 s=init(2);I.ODDS[2].campaign=()=>success?1:0;const fav=I.person('dengyu').fav;G.act.campaign();T.ok('营销'+(success?'成功':'失败')+'均只消耗1士气',s.biz.outlets.find(o=>o.id==='nanping').morale===59);T.ok('营销不额外扣好感',I.person('dengyu').fav===fav);
 const snapshot=JSON.stringify(s);G.act.campaign();T.ok('重复营销无额外扣减',JSON.stringify(s)===snapshot);
}
s=init(2);I.ODDS[2].campaign=()=>1;for(let i=0;i<12;i++){G.act.campaign();I.settleMonth();I.monthStart();}const morale=s.biz.outlets.find(o=>o.id==='nanping').morale;T.ok('每月营销一年后士气仍高于50',morale>50&&morale<60,morale.toFixed(2));
// 用真实UI事件处理器检查单次点击和净变化日志，避免只测内部函数。
const {JSDOM}=require('jsdom'),fs=require('fs');
const dom=new JSDOM(fs.readFileSync(require('./lib').GAME,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});
const W=dom.window,H=W.THSZ;H.newGame({seed:417});H.UI.refresh();T.ok("L1员工好感数值可以渲染",W.document.querySelector("#colM").textContent.includes("好感 60/100"));H.S.carry={};H.S.lv=2;H.internals.initL2('xiaoman');H.internals.ODDS[2].reportup=()=>1;H.UI.refresh();const f=H.internals.person('zhouqm').fav;
W.document.querySelector('[data-act2="reportup"]').click();T.ok('按钮点击只增加4点',H.internals.person('zhouqm').fav===f+4);T.ok('日志显示实际净变化',H.S.log.some(l=>l.html.includes(`周启明好感+4（${f}→${f+4}）`)));
const logs=H.S.log.length;H.UI.refresh();H.UI.refresh();T.ok('重复刷新不重复结算或记账',H.S.log.length===logs&&H.internals.person('zhouqm').fav===f+4);
H.UI.decompModal(()=>{});W.document.querySelector('#dcOk').click();T.ok('界面默认分配也按潜力执行',H.S.biz.outlets.every(o=>!o.overload));dom.window.close();T.done();
