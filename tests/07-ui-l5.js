// jsdom:总行面板、拨盘、结束半年、任满出结局、履历、图鉴
const {GAME, runner, has, skip} = require("./lib");
if(!has("jsdom")){ skip("07-ui-l5", "没装 jsdom(cd tests && npm install)"); return; }
const {JSDOM, VirtualConsole} = require("jsdom");
const vc = new VirtualConsole(); vc.on("jsdomError", e => { if(!/Not implemented/.test(e.message)) console.log(e.message); });
const fs = require("fs");
const T = runner("07-ui-l5");
const html = fs.readFileSync(GAME, "utf8");
const dom = new JSDOM(html, {runScripts:"dangerously", pretendToBeVisual:true, url:"http://localhost/", virtualConsole:vc});
const w = dom.window, d = w.document;
const errors = [];
w.addEventListener("error", e => errors.push(e.message));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = s => d.querySelector(s);
const vis = el => el && !el.classList.contains("hidden");
const click = el => el.dispatchEvent(new w.MouseEvent("click", {bubbles:true}));
async function drain(max){ for(let i=0;i<(max||20) && vis($("#modal")); i++){ click($("#modal .opt")); await sleep(15); } }

(async () => {
  const G = w.THSZ, I = G.internals;
  T.ok("开始页有图鉴入口", !!$("#btnDex"));
  click($("#btnDex")); await sleep(20);
  T.ok("开始页点图鉴:22 格,没解锁的是问号", vis($("#stage")) && d.querySelectorAll("#stage .pc.locked").length === 22 && /？？？/.test($("#stage").textContent));
  click($("#dBack")); await sleep(20);
  T.ok("图鉴返回开始页", vis($("#startScr")));
  // 无头打到 L4,升到总行,再交给界面
  G.setHeadless(true);
  let sd = 100; for(; sd < 260; sd++){ G.simGame("balanced", sd, 600, {until:"l4"}); if(G.S.lv===4 && G.S.phase==="play") break; }
  w.localStorage.removeItem(G.BALANCE.metaKey);
  I.applyTransition(); G.S.justEntered = false; G.setBot(null);
  G.setHeadless(false);
  $("#startScr").classList.add("hidden");
  G.UI.refresh(); await sleep(20);
  T.ok("总行面板:四个拨盘滑杆", d.querySelectorAll("[data-dial]").length === 4);
  T.ok("总行面板:四个行动、七个片区、同业六家", d.querySelectorAll("[data-act5]").length === 4 && d.querySelectorAll("[data-region]").length === 7 && d.querySelectorAll(".rank-t tr").length >= 6);
  T.ok("左栏考核卡 6 项", d.querySelectorAll("#colL .kpi-it").length === 6);
  T.ok("顶栏写的是上半年", /上半年/.test($("#top").textContent));
  const dl = $('[data-dial="price"]'); dl.value = "5"; dl.dispatchEvent(new w.Event("change", {bubbles:true})); await sleep(10);
  T.ok("拖拨盘改了存款定价", G.S.biz.dials.price === 5);
  click($('[data-act5="reg5"]')); await sleep(10);
  T.ok("点监管沟通扣行动点", G.S.ap === G.S.apMax - 1);
  click($('[data-act5="survey"]')); await sleep(10);
  T.ok("点下去调研弹出片区", vis($("#modal")) && d.querySelectorAll("#modal .opt").length === 8);
  click($("#modal .opt")); await sleep(10);
  const t0 = G.S.turn;
  click($("#btnEnd")); await sleep(20); await drain();
  T.ok("结束半年:进到下一个半年", G.S.turn === t0 + 1 && /下半年/.test($("#top").textContent));
  // 跳到最后一个半年
  G.S.turn = G.BALANCE.tenure[5]; G.UI.refresh(); await sleep(10);
  T.ok("最后一个半年按钮写着任期届满", /任期届满/.test($("#btnEnd").textContent));
  click($("#btnEnd")); await sleep(20); await drain();
  T.ok("任满出结局页", G.S.phase === "over" && vis($("#stage")) && /泰和银行行长/.test($("#stage").textContent));
  click($("#eB")); await sleep(30);
  T.ok("看履历不报错(jsdom 没有 canvas 就给提示)", /履历/.test($("#stage h1").textContent));
  click($("#bBack")); await sleep(10);
  click($("#eD")); await sleep(20);
  T.ok("图鉴里这个结局解锁了", d.querySelectorAll("#stage .pc.locked").length === 21);
  click($("#dBack")); await sleep(10);
  T.ok("图鉴返回结局页", !!$("#eR"));
  T.ok("全程没有脚本错误", errors.length === 0, errors.slice(0,3).join(" | "));
  T.done();
})();
