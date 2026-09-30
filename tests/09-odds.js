// 难度:行动成败、三档把握、对手会追、出头鸟、鞭打快牛、升职变数、高手机器人
const {load, runner, pct} = require("./lib");
const {G} = load(); G.setHeadless(true);
const I = G.internals, A = G.act, B = G.BALANCE;
const T = runner("09-odds");
const S = () => G.S;

/* 三档 */
T.ok("三档:≥0.75 有把握 · ≥0.5 看情况 · 更低是悬", I.oddsTier(0.8).t==="有把握" && I.oddsTier(0.6).t==="看情况" && I.oddsTier(0.3).t==="悬");
T.ok("成功率夹在上下限之间,永远到不了百分之百", I.oddsClamp(1.5) === B.odds.max && I.oddsClamp(-1) === B.odds.min && B.odds.max < 1);

/* 维护客户:失败率跟算出来的成功率对得上 */
G.newGame({seed:9}); G.setBot(null);
const snap = JSON.stringify(G.S);
const c0 = S().biz.cards.find(c => c.other > 100);
const p = I.oddsClamp(I.ODDS[1].maintain(c0, "stable"));
let fail = 0, N = 400, lost = 0;
for(let i=0;i<N;i++){ G.S = JSON.parse(snap); S().ap = 3; const r = A.maintain(c0.id, "stable"); if(r.fail){ fail++; if(r.lost) lost++; } }
T.ok("维护客户的失败率 ≈ 1 - 成功率", Math.abs(fail/N - (1-p)) < 0.07, `失败 ${pct(fail,N)}% · 算的 ${Math.round((1-p)*100)}%`);
T.ok("维护失败时,有时候钱还被他行挖走一截", lost > 0, lost+" 次");
G.S = JSON.parse(snap);
const lowRel = Object.assign({}, c0, {rel:10}), hiRel = Object.assign({}, c0, {rel:90});
T.ok("关系越好,把握越大", I.ODDS[1].maintain(hiRel,"stable") > I.ODDS[1].maintain(lowRel,"stable"));
T.ok("只做续存比推基金有把握", I.ODDS[1].maintain(c0,"deposit") > I.ODDS[1].maintain(c0,"fund"));

/* 厅堂营销失败:效果打折 */
let flop = null, good = null;
for(let i=0;i<60 && (!flop||!good);i++){ G.S = JSON.parse(snap); S().ap = 3; S().biz.budget = 50; const r = A.hall(); if(r.fail && !flop) flop = r; if(!r.fail && !good) good = r; }
T.ok("厅堂营销会失手,失手时来的人少", flop && good && flop.cu < good.cu, flop && good ? `${flop.cu} vs ${good.cu}` : "");

/* 带教失败不长能力 */
let tf = null;
for(let i=0;i<80 && !tf;i++){ G.S = JSON.parse(snap); S().ap = 3; const st = S().staff[0]; const v0 = st.op; const r = A.train(st.id, "op"); if(r && r.fail) tf = {v0, v1: I.staff(st.id).op}; }
T.ok("带教会失手,失手时能力不涨", tf && tf.v0 === tf.v1);

/* 行动按钮上的档位 */
G.S = JSON.parse(snap);
T.ok("行动按钮带档位:厅堂、晨会、应付上级有,维护(要选人)没有", I.actOdds("hall")!=null && I.actOdds("rally")!=null && I.actOdds("boss")!=null && I.actOdds("maintain")==null);

/* 对手会追 */
G.S = JSON.parse(snap);
I.settleMonth();
S().biz.rankStreak = B.chase.after; S().kpi.rank = 1;
const second = S().kpi.table.find(x => !x.me);
const logN = S().log.length;
I.rivalReact();
const r2 = S().rivals.find(r => r.id === second.id);
T.ok("连续第一,排第二的开始追:分数加一截,持续几个月", r2.chase === B.chase.bonus[1] && r2.chaseLeft === B.chase.turns[1], `${second.name} +${r2.chase}`);
T.ok("追赶有群消息", S().log.length > logN && /群消息/.test(S().log[0].html));
for(let k=0;k<B.chase.turns[1];k++){ S().biz.rankStreak = 0; I.rivalReact(); }
T.ok("几个月后追劲过去", !r2.chaseLeft && !r2.chase);

/* 出头鸟 */
G.S = JSON.parse(snap); I.settleMonth();
const comp0 = S().kpi.comp, dep0 = I.depTotal(), n0 = S().log.length;
for(let k=0;k<6;k++) I.spotlight();
T.ok("排第一会招事:抽查扣合规、他行挖客户或临时任务", S().log.length >= n0 + 6 && (S().kpi.comp < comp0 || I.depTotal() < dep0 || !!S().biz.task));

/* 鞭打快牛 */
G.S = JSON.parse(snap);
S().kpi.history = [{year:1, rank:1, score:110, items:[]}]; S().year = 2;
I.issueKpi(); const tWhip = S().kpi.card.find(x=>x.k==="dep").target;
S().kpi.history = [{year:1, rank:4, score:95, items:[]}];
I.issueKpi(); const tNorm = S().kpi.card.find(x=>x.k==="dep").target;
T.ok("去年第一,今年存款目标多压一截", tWhip === Math.round(tNorm * B.chase.whip), `${tNorm} → ${tWhip}`);

/* 升职变数:对手有人打招呼 */
const bp = B.promo.backP; B.promo.backP = 1;
let backedSeen = false;
for(let sd=500; sd<540 && !backedSeen; sd++){ G.simGame("balanced", sd, 30, {onTurn: s => { if(s.promo.backed) backedSeen = true; }}); }
B.promo.backP = bp;
T.ok("升职时对手可能有人打招呼", backedSeen);

/* 行动失手率(balanced 跑一局 L1) */
G.simGame("balanced", 777, 24);
const rr = S().track.rolls;
T.ok("L1 一年下来,两到三成的行动失手", rr && rr.fail/rr.n > 0.12 && rr.fail/rr.n < 0.4, rr && `${rr.fail}/${rr.n}`);

/* 高手机器人:L1 拿第一的月份约三成,前三约七成(12 局) */
let n = 0, first = 0, top3 = 0;
for(let i=0;i<12;i++){ G.simGame("expert", 70000+i, 24, {onTurn: s => { if(s.lv===1 && s.kpi.rank){ n++; if(s.kpi.rank===1) first++; if(s.kpi.rank<=3) top3++; } }}); }
T.ok("高手 L1 拿第一的月份在两成到四成五之间", pct(first,n) >= 20 && pct(first,n) <= 45, pct(first,n)+"%");
T.ok("高手 L1 进前三的月份在六成到九成之间", pct(top3,n) >= 60 && pct(top3,n) <= 90, pct(top3,n)+"%");
T.done();
