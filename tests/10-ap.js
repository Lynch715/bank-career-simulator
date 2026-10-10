// 行动点随职务加、大事占两点、推不掉的会、下支行蹲点
const {load, runner} = require("./lib");
const {G} = load();
const I = G.internals, A = G.act;
const T = runner("10-ap");
const S = () => G.S;
const B = G.BALANCE;

T.ok("行动点 4/5/6/6/6", [1,2,3,4,5].map(l=>B.ap[l]).join("/") === "4/5/6/6/6");

function toLevel(lv, seed){
  for(let sd = seed; sd < seed + 80; sd++){
    G.simGame("balanced", sd, 800, {until:"l"+lv});
    if(S().lv === lv && S().phase === "play") return sd;
  }
  throw new Error("没打到 L"+lv);
}

/* 推不掉的会 */
toLevel(2, 100); G.setBot(null);
T.ok("L1 没有会,L2 起有", !I.MEETINGS[1] && [2,3,4,5].every(l => I.MEETINGS[l].length >= 4));
const m = I.MEETINGS[2][0];
S().ap = 5; const z0 = I.person("zhouqm").fav;
let sp = I.meetSpec(m); sp.opts[0].fn();
T.ok("去开会占 1 点", S().ap === 4);
T.ok("去了周启明记一笔", I.person("zhouqm").fav >= Math.min(100, z0 + 1));
const z1 = I.person("zhouqm").fav; sp = I.meetSpec(m); sp.opts[1].fn();
T.ok("不去不占点,周启明不高兴", S().ap === 4 && I.person("zhouqm").fav < z1);
S().ap = 0; sp = I.meetSpec(m);
T.ok("点用完了,「我去」是灰的", sp.opts[0].disabled === true);
const c0 = S().kpi.comp; I.meetSpec(I.MEETINGS[2].find(x=>x.id==="m2_anfang")).opts[1].fn();
T.ok("案防进点会不去,合规扣分", S().kpi.comp < c0, c0+"→"+S().kpi.comp);
// 频率:L2 每月平均半件上下
let n = 0; for(let i=0;i<400;i++) n += I.meetPick().length;
T.ok("L2 每月平均 0.3~0.7 件会", n/400 > 0.3 && n/400 < 0.7, (n/400).toFixed(2));

/* L3:开网点占两点,蹲点 */
toLevel(3, 100); G.setBot(null);
T.ok("L3 开网点占 2 点", I.apCost("open") === 2 && I.apCost("platform") === 2 && I.apCost("renovate") === 1);
S().ap = 1; S().biz.budget = 1000;
T.ok("只剩 1 点开不了网点", !G.act.openOutlet(S().biz.areas[0].id) && S().ap === 1);
S().ap = 2; const no0 = S().biz.newOutlets.length; G.act.openOutlet(S().biz.areas[1].id);
T.ok("2 点开网点,点数清零", S().biz.newOutlets.length === no0 + 1 && S().ap === 0);
// 蹲点:成功时这季存款增量多三成
Object.assign(B.odds, {min:1, max:1});
S().ap = 3; const br = S().biz.branches[0];
A.squat(br.id);
T.ok("蹲点:占 1 点,这季加成挂上", S().ap === 2 && br.squat && br.squatK === B.L3.squat.boost);
T.ok("同一个支行一季只能蹲一次", A.squat(br.id) === null && S().ap === 2);
let n3 = 0; for(let i=0;i<400;i++) n3 += I.meetPick().length;
T.ok("L3 每季平均 0.8~1.2 件会", n3/400 > 0.8 && n3/400 < 1.2, (n3/400).toFixed(2));
Object.assign(B.odds, {min:0.12, max:0.93});

/* L4 / L5 */
toLevel(4, 100); G.setBot(null);
T.ok("L4 启动项目、要额度占 2 点", I.apCost("startp") === 2 && I.apCost("quota") === 2);
let n4 = 0; for(let i=0;i<400;i++) n4 += I.meetPick().length;
T.ok("L4 每季平均 1.3~1.7 件会", n4/400 > 1.3 && n4/400 < 1.7, (n4/400).toFixed(2));
const u0 = S().biz.unity; I.meetSpec(I.MEETINGS[4].find(x=>x.id==="m4_banzi")).opts[1].fn();
T.ok("班子会推掉,团结度掉", S().biz.unity < u0);

T.done();
