// jsdom 里点按钮走一整关:开局 → L1 两年 → 升职全流程 → 进 L2 → 指标分解 → L2 玩三个月
const {GAME, runner, has, skip} = require("./lib");
if(!has("jsdom")){ skip("05-ui", "没装 jsdom(cd tests && npm install)"); return; }
const {JSDOM} = require("jsdom");
const fs = require("fs");
const T = runner("05-ui");

const html = fs.readFileSync(GAME, "utf8");
const dom = new JSDOM(html, {runScripts:"dangerously", pretendToBeVisual:true, url:"http://localhost/"});
const w = dom.window, d = w.document;
const errors = [];
w.addEventListener("error", e => errors.push(e.message));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = s => d.querySelector(s);
const vis = el => el && !el.classList.contains("hidden");
const click = el => el.dispatchEvent(new w.MouseEvent("click", {bubbles:true}));

(async () => {
  // 固定随机种子,保证每次走同一局
  let seed = +(process.env.UI_SEED || 11);
  w.Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  click($("#btnNew")); await sleep(50);
  T.ok("开局弹出考核卡", vis($("#modal")) && /考核卡/.test($("#modal").textContent));
  click($("#modal .opt")); await sleep(30);
  T.ok("主面板出现 6 个行动", d.querySelectorAll("[data-act]").length === 6);
  // 手点一次厅堂营销
  const hall = $('[data-act="hall"]'); click(hall); await sleep(20);
  T.ok("点厅堂营销扣了行动点", w.THSZ.S.ap === w.THSZ.BALANCE.ap[1] - 1);
  // 手点一张客户卡 + 选产品
  const cc = $(".cc:not(.done)"); if(cc){ click(cc); await sleep(20); click($("#modal .opt")); await sleep(20); }
  T.ok("维护客户扣了行动点", w.THSZ.S.ap === w.THSZ.BALANCE.ap[1] - 2);

  let seen = new Set(), decomp = false, l2Turns = 0, lastT = null, guard = 0, stmtClicked = false, handover = false;
  while(guard++ < 6000){
    const S = w.THSZ.S;
    if(process.env.DBG && guard%200===0) console.log('dbg', guard, S.lv, S.turn, S.phase, S.ap, vis($('#stage'))&&($('#stage h1')||{}).textContent, vis($('#modal'))&&$('#modal h2').textContent);
    if(S.phase === "over"){ break; }
    if(vis($("#stage"))){
      const h1 = $("#stage h1"); if(h1) seen.add(h1.textContent);
      if(h1 && h1.textContent==="交接") handover = true;
      const st = [...d.querySelectorAll("#stage .stmt:not(.on)")], on = d.querySelectorAll("#stage .stmt.on");
      if(st.length && on.length < 3){ click(st[0]); stmtClicked = true; await sleep(5); continue; }
      const b = [...d.querySelectorAll("#stage .opt, #stage .btn")].filter(x=>!x.disabled);
      if(b.length){ click(b[b.length-1]); await sleep(40); continue; }
      await sleep(120); continue;
    }
    if(vis($("#modal"))){
      if($("#dcAuto")){ decomp = true; click($("#dcAuto")); await sleep(5); click($("#dcOk")); await sleep(5); continue; }
      const o = [...d.querySelectorAll("#modal .opt")].filter(x=>!x.disabled);
      if(o.length){ click(o[0]); await sleep(2); continue; }
    }
    if($(".zoomer")){ await sleep(100); continue; }
    if(S.lv === 2 && S.phase === "play" && !vis($("#modal")) && !vis($("#stage"))){
      if(lastT !== null && S.turn !== lastT) l2Turns++;
      lastT = S.turn;
      if(l2Turns >= 3) break;
    }
    if(S.phase === "play" && S.ap > 0){ w.THSZ.setBot("balanced"); w.THSZ.BOTS.balanced.play(); w.THSZ.setBot(null); w.THSZ.UI.refresh(); }
    const end = $("#btnEnd");
    if(end){ click(end); await sleep(2); continue; }
    await sleep(50);
  }
  const S = w.THSZ.S;
  T.ok("升职流程每一屏都走到了", ["组织考察","民主测评","竞聘陈述","谈话","考察结果","公示","称呼","办公室","交接","送行","上任第一天"].every(x=>seen.has(x)) || S.phase==="over", [...seen].join("/"));
  T.ok("竞聘陈述可以挑条目", stmtClicked || S.phase==="over");
  T.ok("交接时可以选接班人", handover || S.phase==="over");
  if(S.phase !== "over"){
    T.ok("进入 L2 并弹出指标分解", S.lv === 2 && decomp);
    T.ok("L2 面板:网点表四行 + 审批队列 + 看板四列", d.querySelectorAll("[data-outlet]").length === 4 && d.querySelectorAll(".kcol").length === 4);
    T.ok("L2 走了三个月", l2Turns >= 3, l2Turns);
    T.ok("称呼变成 X行", /行$/.test($("#top .who").textContent), $("#top .who").textContent);
  } else console.log("  · 这一局 L1 就结束了:" + S.over.id);
  T.ok("全程无脚本错误", errors.length === 0, errors.slice(0,3).join(" | "));
  T.done();
  w.close();
})();
