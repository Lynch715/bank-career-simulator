// 改造满级支行曾仍可点击，选中后静默关闭且不扣点。
const fs = require('fs');
const {JSDOM} = require('jsdom');
const {GAME, runner} = require('./lib');
const T = runner('18-renovation');
const html = fs.readFileSync(GAME, 'utf8');
const errors = [];
function open(raw){
  const dom = new JSDOM(html, {runScripts:'dangerously', pretendToBeVisual:true, url:'http://localhost/',
    beforeParse(w){ if(raw) w.localStorage.setItem('thsz_save', raw); }});
  dom.window.addEventListener('error', e=>errors.push(e.message));
  const G = dom.window.THSZ, d = dom.window.document;
  if(raw) d.querySelector('#btnCont').click();
  else {
    G.setHeadless(true); G.newGame({seed:417}); G.S.carry={}; G.S.lv=3; G.internals.initL3();
    G.setBot(null); G.setHeadless(false); G.S.phase='play'; G.UI.refresh();
  }
  return {dom, G, d};
}
let {dom, G, d} = open();
const s=G.S, branches=s.biz.branches, x=branches[0];
const pick=()=>d.querySelector('[data-act3="renovate"]').click();
const options=()=>[...d.querySelectorAll('#modal .opt')];
const close=()=>options().at(-1).click();
x.renov=.3; branches[1].renov=.4; s.ap=6; s.biz.budget=1000; G.UI.refresh();
pick();
T.ok('达到上限及旧档超过上限的支行置灰并说明原因', options().slice(0,2).every(o=>o.disabled&&/已达改造上限/.test(o.textContent)));
const capped=JSON.stringify(s); options()[0].click();
T.ok('点击已满级支行不关闭弹窗也不扣资源', !d.querySelector('#modal').classList.contains('hidden')&&JSON.stringify(s)===capped);
T.ok('未满级支行仍可选并显示费用', !options()[2].disabled&&/200万 \/ 1点行动/.test(options()[2].textContent));
close();
T.ok('取消改造不扣资源', JSON.stringify(s)===capped);
Object.assign(G.BALANCE.odds,{min:1,max:1});
const target=branches[2], dep=target.dep, spent=s.month.spent;
pick(); options()[2].click();
T.ok('实际改造扣1点与200万且记入费用', s.ap===5&&s.biz.budget===800&&s.month.spent===spent+200);
T.ok('改造加成增加，存款等待季末结算', target.renov>0&&target.dep===dep);
T.ok('日志明确显示扣费扣点及生效时间', /发展费用-200万.*行动点-1.*季末生效/.test(s.log[0].html));
G.UI.branchModal(x.id);
T.ok('支行详情入口同样禁用满级改造', options().find(o=>/网点改造/.test(o.textContent)).disabled&&/已达改造上限/.test(d.querySelector('#modal').textContent)); close();
Object.assign(G.BALANCE.odds,{min:0,max:0});
const ap=s.ap, budget=s.biz.budget, before=branches[3].renov;
pick(); options()[3].click();
T.ok('效果打折也扣费扣点并保留加成', s.ap===ap-1&&s.biz.budget===budget-200&&branches[3].renov>before&&/效果打了折扣/.test(s.log[0].html));
branches.forEach(b=>b.renov=.3); branches[1].renov=.4; s.ap=6; G.UI.refresh();
T.ok('全部支行达到上限时主入口禁用并说明原因', d.querySelector('[data-act3="renovate"]').disabled&&/所有支行都已达到改造上限/.test(d.querySelector('[data-act3="renovate"]').title));
const unchanged=JSON.stringify(s); T.ok('引擎拒绝满级改造且保留原存档数值', G.act.renovate(x.id)===null&&JSON.stringify(s)===unchanged);
G.save(); const raw=dom.window.localStorage.getItem('thsz_save'); dom.window.close();
({dom,G,d}=open(raw));
T.ok('旧存档继续游戏保留行动点、费用和超过上限的加成', G.S.ap===6&&G.S.biz.budget===budget-200&&G.S.biz.branches[1].renov===.4);
T.ok('读档后满级入口仍禁用，面板无错误', d.querySelector('[data-act3="renovate"]').disabled&&!d.querySelector('#colM').dataset.renderError);
G.S.biz.branches[0].renov=0; G.S.biz.budget=199; G.UI.refresh();
T.ok('费用不足时主入口禁用',d.querySelector('[data-act3="renovate"]').disabled);
G.S.biz.budget=1000; G.S.ap=0; G.UI.refresh();
T.ok('行动点不足时主入口禁用',d.querySelector('[data-act3="renovate"]').disabled);
// 同一份存档以相同随机序列结算，检查改造确实作用于季末增长。
const quarter=JSON.parse(JSON.stringify(G.S));
function settleWith(renov){
  quarter.biz.branches[0].renov=renov;
  dom.window.localStorage.setItem('thsz_save',JSON.stringify(quarter));
  G.load(); G.internals.settleMonth();
  return G.S.biz.branches[0].lastInc;
}
const plain=settleWith(0), boosted=settleWith(.2);
T.ok('相同存档与随机序列下，改造增加季末存款增长', boosted>plain,plain+' → '+boosted);
T.ok('全程无脚本错误',errors.length===0,errors.join(' | '));
dom.window.close(); T.done();
