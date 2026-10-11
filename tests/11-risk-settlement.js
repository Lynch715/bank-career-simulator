const {load, runner} = require('./lib');
const {G} = load(), I = G.internals, T = runner('11-risk-settlement');
G.setHeadless(true);
function setup(lv){
  G.newGame({seed:417}); G.S.carry = {}; G.S.lv = 4; I.initL4();
  if(lv === 5){ G.S.lv = 5; I.initL5(); }
  G.S.loanBook = []; G.BALANCE.chase.spotP = 0;
}
function result(lv, loan){
  setup(lv);
  if(loan) G.S.loanBook.push({...loan, def:true, defAt:G.S.monthAbs, done:false});
  I.settleMonth();
  return {npl:lv===4?I.nplL4():G.S.biz.npl, profit:G.S.month.profit, state:JSON.parse(JSON.stringify(G.S))};
}
const base4 = result(4);
for(const loan of [{id:'yx',lv:4,name:'渝兴地产',amt:300000},{id:'mb4',lv:4,name:'渝北物流园',amt:200000}]){
  const r = result(4,loan);
  T.ok(loan.name+'到期进入不良',r.npl-base4.npl===loan.amt);
  T.ok(loan.name+'拨备扣减税后利润',Math.abs(base4.profit-r.profit-loan.amt*.7*.75)<.001);
  T.ok(loan.name+'报告可见且标记已处理',r.state.report.defaults.includes(loan.name)&&r.state.loanBook[0].done);
  T.ok(loan.name+'归属正确机构',r.state.biz.inst.find(x=>x.id===(loan.id==='mb4'?'yb':'yyb')).npl-base4.state.biz.inst.find(x=>x.id===(loan.id==='mb4'?'yb':'yyb')).npl===loan.amt);
  G.S.loanBook[0].amt=99999999; G.S.month.defaults=[]; I.settleMonth();
  T.ok('已处理贷款不重复爆雷',G.S.month.defaults.length===0);
}
const base5=result(5), r5=result(5,{id:'yx',lv:4,name:'旧房企展期',amt:300000});
T.ok('总行继续兑现旧贷款不良',r5.npl-base5.npl===300000);
T.ok('总行旧账计入拨备和报告',Math.abs(base5.profit-r5.profit-157500)<.001&&r5.state.report.defaults.includes('旧房企展期'));
setup(4); G.S.loanBook.push({id:'yx',name:'跨关展期',lv:4,amt:300000,def:true,defAt:G.S.monthAbs+12,done:false});
G.S.monthAbs+=36;G.S.lv=5;I.initL5();I.settleMonth();
T.ok('升职过渡期跨过到期日仍兑现',G.S.loanBook[0].done&&G.S.report.defaults.includes('跨关展期'));
setup(4); I.EVENTS_L4.find(x=>x.id==='fangqi').opts(G.S)[1].fn();I.settleMonth();
T.ok('当期事件不良不提前自然化解',I.nplL4()-base4.npl===300000);
T.ok('直接确认房企不良也计提拨备',Math.abs(base4.profit-G.S.month.profit-157500)<.001);
G.newGame({seed:32}); Object.assign(G.BALANCE.odds,{min:1,max:1});
const c=G.S.biz.cards.find(x=>x.type==='boss');const q=I.maintainQuote(c,'stable');const a=G.act.maintain(c.id,'stable');
T.ok('客户收益预览与成功结算一致',q.pull===a.pull&&q.fee===a.fee);
const snap=JSON.stringify(G.S);T.ok('重复维护被引擎拒绝且不扣资源',G.act.maintain(c.id,'stable')===null&&snap===JSON.stringify(G.S));
G.save();G.S=null;G.load();T.ok('旧版本存档格式仍能读取',G.S.ver===4&&G.S.biz.cards.find(x=>x.id===c.id).maint);
T.done();
