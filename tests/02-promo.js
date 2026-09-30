// 升职流程各分支:胜出 / 落选 / 公示举报(挡下、暂缓、查实) / 破格 / 年龄线锁定
const {load, runner} = require("./lib");
const {G} = load();
// 机制测试:行动一律成功,关掉对手追赶、出头鸟和升职变数(这些在 09-odds 单独测)
const SURE_ODDS = () => { Object.assign(G.BALANCE.odds, {min:1, max:1}); Object.assign(G.BALANCE.chase, {after:99, spotP:0, whip:1}); Object.assign(G.BALANCE.promo, {selfNoise:0, backP:0}); };
SURE_ODDS();
const I = G.internals;
const T = runner("02-promo");

function playTo(turn, mode, seed){
  G.newGame({seed: seed||1}); G.setBot(mode||"balanced");
  // 只推到窗口前,不触发升职
  while(G.S.turn < turn){ G.BOTS[mode||"balanced"].play(); G.endTurn(); G.runJobs(); if(G.S.phase!=="play") break; }
}
function setCore(o){ Object.assign(G.S.core, o); }

// 1 胜出:把分数拉满
playTo(20);
setCore({perf:95, trust:90, rep:90, clean:100});
G.S.staff.forEach(s=>{ s.fav=95; I.person(s.id).fav=95; });
let v = I.promoVotes();
T.ok("测评票数随好感走:高好感全部≥称职", v.voters.every(x=>x.vote!=="bad"), v.score);
let res = I.promoFinal(v, [0,1,2], [0,0,0]);
T.ok("高分胜出", res.win, `${res.mine.total} vs ${res.best.score}`);
T.ok("考察分按 0.4/0.25/0.2/0.15 合成", res.mine.total === Math.round(res.mine.perf*0.4+res.mine.vote*0.25+res.mine.trust*0.2+res.mine.talk*0.15));

// 2 落选:分数压低
playTo(20, "balanced", 2);
setCore({perf:20, trust:20, rep:20});
G.S.staff.forEach(s=>{ s.fav=10; });
v = I.promoVotes();
res = I.promoFinal(v, [0,1,2], [2,2,2]);
T.ok("低分落选", !res.win, res.mine.total);
const w0 = G.S.turn;
G.S.phase = "play"; I.promoLose("lose");
T.ok("落选后下个窗口在 12 个月后", G.S.promo.windowAt === w0 + 12);
T.ok("落选后本关继续", G.S.phase === "play");

// 3 公示:clean 100 不会被举报
playTo(10, "clean", 3);
let reported = 0; for(let k=0;k<300;k++){ if(I.promoPublicity().reported) reported++; }
T.ok("clean=100 公示期零举报", reported===0);
// clean 20:举报概率 90%,顾清越好感高挡一次
G.S.core.clean = 20; I.person("gu").met = true; I.person("gu").fav = 90; G.S.flags.guShieldUsed = false;
let p = null; for(let k=0;k<50 && !(p && p.reported);k++){ G.S.flags.guShieldUsed=false; p = I.promoPublicity(); }
T.ok("顾清越好感≥80 挡下举报", p.result==="shield");
T.ok("挡过一次后不再挡", (()=>{ let r; for(let k=0;k<50;k++){ r = I.promoPublicity(); if(r.reported) break; } return r.result!=="shield"; })());
// clean 65:暂缓
G.S.core.clean = 65; I.person("gu").fav = 30;
let rr; for(let k=0;k<200;k++){ rr = I.promoPublicity(); if(rr.reported) break; }
T.ok("clean 在 60~80 被举报 → 暂缓任用", rr.reported && rr.result==="defer");
G.S.core.clean = 40;
for(let k=0;k<50;k++){ rr = I.promoPublicity(); if(rr.reported) break; }
T.ok("clean<60 被举报 → 查实", rr.result==="caught");

// 4 破格:连续第一 + 四项≥75
playTo(8, "clean", 4);
G.S.biz.rankStreak = 6; setCore({perf:90, rep:90, trust:90, clean:95});
I.checkBreakthrough();
T.ok("破格:窗口提前,最早第18回合", G.S.promo.bt && G.S.promo.windowAt < 24 && G.S.promo.windowAt >= 18, G.S.promo.windowAt);
playTo(8, "clean", 5);
G.S.biz.rankStreak = 6; setCore({perf:90, rep:90, trust:90, clean:70});
I.checkBreakthrough();
T.ok("有一项<75 不破格", !G.S.promo.bt);

// 5 年龄线锁定
playTo(20, "balanced", 6);
G.S.monthAbs = 12*9; G.S.age = 39; G.S.phase="play";
I.promoLose("lose");
T.ok("下次窗口过年龄线 → 锁定结局", G.S.phase==="over" && G.S.over.id==="lock");

// 6 任命与过渡:年龄、称呼、人脉簿
playTo(24, "clean", 7);
if(G.S.phase==="play"){ // 强制走胜出
  setCore({perf:95,trust:95,rep:95,clean:100});
  I.applyAppoint(); I.applyTransition();
}
T.ok("进入 L2", G.S.lv===2 && G.S.phase==="play");
T.ok("进入 L2 时 34 岁(顺利时)", G.S.age===34, G.S.age);
T.ok("旧部接了弹子石", (()=>{ const id=G.S.carry.succ; return id && I.person(id).pos==="弹子石网点负责人"; })());
T.ok("黄世海 L1 末被查", I.person("huang").pos.indexOf("被查")>=0);
T.ok("keyEvents 记下任职", G.S.track.keyEvents.some(k=>/任南岸支行行长/.test(k.txt)));

// 7 风声提前量:trust≥60 多提前 1 回合
playTo(3, "clean", 8);
G.S.core.trust = 70; const a = I.rumorLead(); G.S.core.trust = 40; const b = I.rumorLead();
T.ok("trust≥60 风声提前 1 回合", a === b+1, `${a}/${b}`);
T.done();
