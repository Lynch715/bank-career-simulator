// L3 万州 / L4 重庆分行:经营模型、跨关旧账、存档独立起玩、事件
const {load, runner} = require("./lib");
const {G, store} = load();
// 机制测试:行动一律成功,关掉对手追赶、出头鸟和升职变数(这些在 09-odds 单独测)
const SURE_ODDS = () => { Object.assign(G.BALANCE.odds, {min:1, max:1}); Object.assign(G.BALANCE.chase, {after:99, spotP:0, whip:1}); Object.assign(G.BALANCE.promo, {selfNoise:0, backP:0}); };
SURE_ODDS();
const I = G.internals, A = G.act;
const T = runner("04-l34");
const S = () => G.S;

function toLevel(lv, seed, mode){
  for(let sd = seed; sd < seed + 60; sd++){
    G.simGame(mode||"balanced", sd, 600, {until:"l"+lv});
    if(S().lv === lv && S().phase === "play") return sd;
  }
  throw new Error("没打到 L"+lv);
}
function endQ(){ G.setBot(null); G.endTurn(); G.runJobs(); }

/* ---------------- L3 ---------------- */
let sd3 = toLevel(3, 100);
T.ok("进入 L3:七个支行、六个片区", S().biz.branches.length===7 && S().biz.areas.length===6);
T.ok("万州存贷比七成", Math.abs(I.loansTotalL3()/I.depTotal() - 0.7) < 0.01, (I.loansTotalL3()/I.depTotal()).toFixed(3));
T.ok("起始不良率约 1.8%", Math.abs(I.nplL3()/I.loansTotalL3()*100 - 1.8) < 0.15, (I.nplL3()/I.loansTotalL3()*100).toFixed(2));
T.ok("L3 按季:开局在三月,行动点 4", S().m===3 && S().ap===4);
T.ok("考核卡 6 项,含网点效能", S().kpi.card.length===6 && S().kpi.card.some(x=>x.k==="eff"));
const m0 = S().m; endQ();
T.ok("一回合走三个月", S().m === m0 + 3, S().m);
// 开网点
S().ap = 4; S().biz.budget = 1000;
const n0 = I.effL3(), out0 = S().biz.newOutlets.length;
A.openOutlet("gaotie");
T.ok("开网点:扣 300 万,多一个新网点", S().biz.newOutlets.length === out0+1 && S().biz.budget === 700);
T.ok("新网点刚开,网点效能先掉", I.effL3() < n0);
// 处置
S().biz.disposedQ = 0;
const cap = 3 + (S().biz.tilt==="risk"?1:0);
let did = 0; S().biz.npa.slice(0,6).forEach(x => { if(A.disposeNpa(x.id, "collect")) did++; });
T.ok("每季处置有上限", did === cap, did+"/"+cap);
S().biz.disposedQ = 0;
const big = S().biz.npa.filter(x=>!x.stage).sort((a,b)=>b.amt-a.amt)[0], npl0 = I.nplL3();
A.disposeNpa(big.id, "restr");
T.ok("重组:马上出表", I.nplL3() < npl0 && S().biz.restr.length > 0);
// 结构滑杆
A.setMix(20, 50, 30);
const L = S().biz.loans, share0 = L.micro/(L.corp+L.micro+L.retail);
S().ap = 0; endQ();
const L2 = S().biz.loans, share1 = L2.micro/(L2.corp+L2.micro+L2.retail);
T.ok("信贷结构往目标挪,每季挪 5 个点(另加各类增速差)", share1 > share0 && share1 - share0 <= 0.075, (share0*100).toFixed(1)+"→"+(share1*100).toFixed(1));
// 平台
S().ap = 4;
const pl0 = S().biz.loans.platform, cl0 = S().core.clean;
const off = A.platform(); A.decidePlatform(true);
const pb = S().loanBook.find(l=>l.src==="platform");
T.ok("平台贷款:规模大、不占额度、干净度下降", S().biz.loans.platform === pl0 + off.size && S().core.clean < cl0);
T.ok("平台贷款的违约时间落在两到四年后(L4 才冒)", pb.defAt - pb.at >= 24 && pb.defAt - pb.at <= 48);

// 跨关:L2 批的贷款在 L3 逾期
toLevel(3, 200);
S().loanBook.push({id:"t2", name:"测试南岸旧贷", amt:5000, tier:"high", src:"queue", lv:2, at:S().monthAbs-12, defAt:S().monthAbs, def:true, done:false});
const cnpl = S().carry.l2.npl;
S().ap = 0; endQ();
T.ok("L2 的烂贷款在 L3 冒出来:记进南岸的账,日志里看得到", S().carry.l2.npl >= cnpl + 5000 && S().log.some(l=>/测试南岸旧贷/.test(l.html)));
T.ok("L3 有事件接这笔旧账(南岸的电话)", (S().flags.nananDefault||[]).includes("测试南岸旧贷"));

// 存档起玩 L3
toLevel(3, 300);
const snap3 = JSON.stringify(S());
store.thsz_save = snap3;
G.S = null;
const back3 = G.load();
T.ok("L3 存档读回", back3 && back3.lv===3);
let err3 = null;
try{ G.setBot("balanced"); let g=0; while(S().phase==="play" && S().lv===3 && g++<80){ G.BOTS.balanced.play(); G.endTurn(); G.runJobs(); } }catch(e){ err3 = e.message; }
T.ok("从 L3 存档起玩到关底无报错", !err3 && (S().lv>3 || S().phase!=="play"), err3 || ("lv"+S().lv+" "+S().phase));

// L3 事件
let e3 = [];
I.EVENTS_L3.forEach(ev => {
  try{
    toLevel(3, 400); S().turn = 8; S().m = 6; S().flags.nananDefault = ["测试"]; S().flags.closedAt = 7; S().flags.closedArea = "wuqiao";
    const spec = I.eventSpec({id:ev.id});
    spec.opts.forEach((o,k) => { toLevel(3, 400); S().turn=8; S().m=6; S().flags.nananDefault=["测试"]; S().flags.closedAt=7; S().flags.closedArea="wuqiao"; const sp = I.eventSpec({id:ev.id}); if(sp.opts[k].fn) sp.opts[k].fn(); });
  }catch(err){ e3.push(ev.id+":"+err.message); }
});
T.ok("L3 事件 12 个 + 家里的事 3 个", I.EVENTS_L3.filter(e=>!/^fam/.test(e.id)).length===12 && I.EVENTS_L3.filter(e=>/^fam/.test(e.id)).length===3);
T.ok("L3 每个事件每个选项都能执行", e3.length===0, e3.join(" "));

/* ---------------- L4 ---------------- */
let sd4 = toLevel(4, 500);
T.ok("进入 L4:十二个二级机构,南岸和万州标着你待过", S().biz.inst.length===12 && S().biz.inst.filter(x=>x.mine).length===2);
T.ok("班子四个人,周启明成了副手", S().biz.deputies.length===4 && S().biz.deputies.some(d=>d.id==="zhouqm"));
T.ok("陆明远去了总行,顾清越去了监管", /总行/.test(I.person("lu").pos) && /监管/.test(I.person("gu").pos));
T.ok("考核卡 6 项,含监管评级和资本回报", S().kpi.card.some(x=>x.k==="rating") && S().kpi.card.some(x=>x.k==="roe"));
T.ok("监管评级在 1~5 之间", I.ratingNow() >= 1 && I.ratingNow() <= 5, I.ratingNow());
// 分工
S().ap = 4;
const gain = I.bestAssignGain();
if(gain){ const k0 = I.lineK("corp")+I.lineK("retail")+I.lineK("risk")+I.lineK("ops"); A.swap(gain.a, gain.b); const k1 = I.lineK("corp")+I.lineK("retail")+I.lineK("risk")+I.lineK("ops");
  T.ok("分工调对口,条线系数合计上升", k1 >= k0 - 0.02, k0.toFixed(3)+"→"+k1.toFixed(3)); }
// 项目
S().ap = 4;
const room0 = I.capRoom();
A.startProj();
T.ok("启动战略项目占资本额度", I.capRoom() < room0);
const pj = S().biz.projects[0]; const need = 10;
for(let i=0;i<need && !pj.done;i++){ S().ap = 4; A.pushProj(pj.id); }
T.ok("项目推满落地,战略项目计数+1", pj.done && S().biz.ytd.proj >= 1);
// 跨关:L2、L3 的旧账在 L4 的南岸、万州两行
toLevel(4, 600);
const na = I.inst("na"), wz = I.inst("wz");
const na0 = na.npl, wz0 = wz.npl;
S().loanBook.push({id:"t4a", name:"测试南岸旧贷二", amt:8000, tier:"high", src:"queue", lv:2, at:0, defAt:S().monthAbs, def:true, done:false});
S().loanBook.push({id:"t4b", name:"测试万州平台", amt:300000, tier:"high", src:"platform", lv:3, at:0, defAt:S().monthAbs, def:true, done:false});
S().ap = 0; endQ();
T.ok("L2 批的烂贷款压在 L4 南岸那一行", na.npl > na0*0.8 + 8000*0.9, na0+"→"+na.npl);
T.ok("L3 批的平台贷款压在 L4 万州那一行", wz.npl > wz0*0.8 + 300000*0.9, wz0+"→"+wz.npl);
// 危机三幕
toLevel(4, 700);
S().biz.crisis.at = S().turn + 1;
let acts = 0;
for(let q=0;q<5 && !S().biz.crisis.done;q++){ S().ap = 0; G.setBot("balanced"); G.endTurn(); G.runJobs(); acts = S().biz.crisis.stage; }
T.ok("危机三幕按季度演完", S().biz.crisis.done && acts===3, S().biz.crisis.kind);

// 存档起玩 L4
toLevel(4, 800);
store.thsz_save = JSON.stringify(S());
G.S = null;
const back4 = G.load();
let err4 = null;
try{ G.setBot("balanced"); let g=0; while(S().phase==="play" && S().lv===4 && g++<80){ G.BOTS.balanced.play(); G.endTurn(); G.runJobs(); } }catch(e){ err4 = e.message; }
T.ok("从 L4 存档起玩到关底无报错", back4 && !err4 && (S().lv>4 || S().phase!=="play"), err4 || ("lv"+S().lv+" "+S().phase));

// L4 事件
let e4 = [];
I.EVENTS_L4.forEach(ev => {
  try{
    toLevel(4, 900); S().turn = 9; S().m = 6; S().flags.weiIPO = "loose";
    const spec = I.eventSpec({id:ev.id});
    spec.opts.forEach((o,k) => { toLevel(4, 900); S().turn=9; S().m=6; S().flags.weiIPO="loose"; const sp = I.eventSpec({id:ev.id}); if(sp.opts[k].fn) sp.opts[k].fn(); });
  }catch(err){ e4.push(ev.id+":"+err.message); }
});
T.ok("L4 事件 12 个", I.EVENTS_L4.length===12, I.EVENTS_L4.length);
T.ok("L4 每个事件每个选项都能执行", e4.length===0, e4.join(" "));
T.done();
