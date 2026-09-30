/* =====================================================================
   升职流程(界面版)。逻辑函数与无头版共用。
   ===================================================================== */
UI.promoFlow = function(done){
  const T = PROMO_TEXT[S.lv];
  UI.showTab("colM");
  UI.snapL1 = $("colM").innerHTML;
  const st = $("stage");
  const show = (html) => { st.innerHTML = `<div class="inner">${html}</div>`; st.classList.remove("hidden"); st.scrollTop = 0; };
  const btn = (id, txt, cls) => `<button class="btn ${cls||""}" id="${id}">${txt}</button>`;
  const finish = () => { st.classList.add("hidden"); st.innerHTML = ""; S.promo.stage = null; save(); UI.refresh(); done(); };

  const votes = promoVotes();
  const stmts = promoStatements();
  const answers = [];
  let chosen = [];

  // 1 考察
  show(`<h1>组织考察</h1><div class="lead">${paras(T.assessIntro)}</div><p class="cap">民主测评 · 竞聘陈述 · 谈话</p><div class="next">${btn("n1","开始测评")}</div>`);
  $("n1").onclick = stepVotes;

  function stepVotes(){
    const cards = votes.voters.map((v,i)=>`<div class="vote" id="v${i}"><div class="in">
      <div class="f"><b>${i+1}</b>测评表</div>
      <div class="b"><span class="muted">${v.name} · ${v.role}</span><b class="v-${v.vote}">${{good:"优秀",ok:"称职",bad:"不称职"}[v.vote]}</b></div></div></div>`).join("");
    show(`<h1>民主测评</h1><div class="lead"><p>测评表一张张翻过来。</p></div><div class="votes">${cards}</div><p class="tally" id="tally">&nbsp;</p><div class="next">${btn("n2","竞聘陈述")}</div>`);
    $("n2").disabled = true;
    let i = 0;
    const tick = () => {
      if(i >= votes.voters.length){
        const g = votes.voters.filter(v=>v.vote==="good").length, o = votes.voters.filter(v=>v.vote==="ok").length, b = votes.voters.length-g-o;
        $("tally").textContent = `优秀 ${g} · 称职 ${o} · 不称职 ${b}`;
        $("n2").disabled = false; return;
      }
      $("v"+i).classList.add("flip"); i++; setTimeout(tick, 420);
    };
    setTimeout(tick, 500);
    $("n2").onclick = stepStmt;
  }

  function stepStmt(){
    const need = Math.min(BALANCE.promo.stmtPick, stmts.length);
    const dots = v => v>=85 ? "●●●" : (v>=68 ? "●●○" : "●○○");
    const render = () => {
      show(`<h1>竞聘陈述</h1><div class="lead"><p>十分钟。从这两年做成的事里挑${need}条讲。</p></div>
        <div class="stmts">${stmts.map((s,i)=>`<button class="stmt ${chosen.includes(i)?"on":""}" data-s="${i}"><span class="dot"></span>${esc(s.txt)}<span class="str">${dots(s.v)}</span></button>`).join("")}</div>
        <div class="next">${btn("n3", `讲这${need}条（${chosen.length}/${need}）`)}</div>`);
      st.querySelectorAll("[data-s]").forEach(el => el.onclick = () => {
        const k = +el.dataset.s;
        if(chosen.includes(k)) chosen = chosen.filter(x=>x!==k);
        else if(chosen.length < need) chosen.push(k);
        render();
      });
      $("n3").disabled = chosen.length < need;
      $("n3").onclick = () => stepTalk(0);
    };
    render();
  }

  function stepTalk(qi){
    const q = T.talk[qi];
    if(!q){ stepReveal(); return; }
    show(`<h1>谈话</h1><div class="lead">${qi===0?paras(T.talkIntro):""}<p><b>${esc(q.q)}</b></p></div>
      <div class="opts">${q.opts.map((o,i)=>`<button class="opt" data-a="${i}"><b>${esc(o.t)}</b></button>`).join("")}</div>`);
    st.querySelectorAll("[data-a]").forEach(el => el.onclick = () => { answers[qi] = +el.dataset.a; stepTalk(qi+1); });
  }

  function stepReveal(){
    const res = promoFinal(votes, chosen, answers);
    const all = [{name:"你", score:res.mine.total, me:true}].concat(res.rivals.map(r=>({name:r.name, score:r.score, from:r.from})));
    all.sort((a,b)=>b.score-a.score);
    show(`<h1>考察结果</h1><div class="lead"><p>${esc(T.target)}，${all.length}个人。</p></div>
      <div class="bars">${all.map((r,i)=>`<div class="brow ${r.me?"me":""}"><span>${r.me?S.player.sur+S.player.given:r.name}${r.from?`<br><small class="muted">${r.from}</small>`:""}</span><div class="bar"><i data-w="${r.score}"></i></div><b class="num">${r.score}</b></div>`).join("")}</div>
      <p class="cap">业绩 ${res.mine.perf} · 测评 ${res.mine.vote} · 上级信任 ${res.mine.trust} · 陈述谈话 ${res.mine.talk}</p>
      <div class="lead" id="verdict" style="opacity:0;transition:opacity .6s"></div><div class="next" id="vbtn"></div>`);
    requestAnimationFrame(()=>requestAnimationFrame(()=>st.querySelectorAll("[data-w]").forEach(el=>el.style.width = el.dataset.w+"%")));
    setTimeout(() => {
      const v = $("verdict");
      if(res.win){
        v.innerHTML = paras(T.revealWin);
        $("vbtn").innerHTML = btn("n5","公示","gold");
        $("n5").onclick = stepPublic;
      } else {
        v.innerHTML = paras(T.revealLose(res.best));
        $("vbtn").innerHTML = btn("n5", [null,"回到网点","回到南岸","回到万州","回到重庆分行"][S.lv]);
        $("n5").onclick = () => { S.phase = "play"; promoLose("lose"); finish(); };
      }
      v.style.opacity = 1;
    }, 1500);
  }

  function stepPublic(){
    const pub = promoPublicity();
    S.promo.pub = pub;
    show(`<h1>公示</h1><div class="lead"><p>任前公示七天，贴在支行一楼公告栏，分行内网也挂了。</p></div>
      <div class="days">${[1,2,3,4,5,6,7].map(d=>`<div class="day" id="d${d}">${d}</div>`).join("")}</div>
      <div class="lead" id="pubtxt"></div><div class="next" id="pbtn"></div>`);
    let d = 1;
    const stopAt = pub.reported ? 4 : 8;
    const tick = () => {
      if(d >= stopAt){
        if(pub.reported){
          $("d4").classList.add("alarm");
          $("pubtxt").innerHTML = paras(T.reportBody(S, T.reportWhat(S)));
          $("pbtn").innerHTML = btn("n6","然后");
          $("n6").onclick = () => {
            if(pub.result === "shield"){ $("pubtxt").innerHTML += paras(T.shield); $("pbtn").innerHTML = btn("n7","任命","gold"); $("n7").onclick = stepAppoint; }
            else if(pub.result === "defer"){ $("pubtxt").innerHTML += paras(T.defer); $("pbtn").innerHTML = btn("n7", [null,"回到网点","回到南岸","回到万州","回到重庆分行"][S.lv]); $("n7").onclick = () => { S.phase = "play"; promoLose("defer"); finish(); }; }
            else { endGame("caught"); finish(); }
          };
        } else {
          $("pubtxt").innerHTML = "<p>七天，公告栏前面没人停下来。</p>";
          $("pbtn").innerHTML = btn("n7","任命","gold"); $("n7").onclick = stepAppoint;
        }
        return;
      }
      $("d"+d).classList.add("lit"); d++; setTimeout(tick, 380);
    };
    setTimeout(tick, 400);
  }

  function stepAppoint(){
    const doc = T.doc(S);
    applyAppoint();
    show(`<div class="doc"><div class="hd">${doc.head}</div><div class="no">${doc.no}</div><div class="tt">${esc(doc.title)}</div>
      <p>${doc.to}</p>${doc.body.split("\n").map(x=>`<p style="text-indent:2em">${esc(x)}</p>`).join("")}
      <div class="sg">${esc(doc.sign)}</div><div class="stamp">${doc.head==="泰和银行"||doc.head.indexOf("委员会")>=0?"泰和银行":"泰和银行<br>重庆分行"}</div></div>
      <div class="next">${btn("n8","第二天")}</div>`);
    $("n8").onclick = stepCalls;
  }
  function stepCalls(){
    const lines = T.calls(S);
    show(`<h1>称呼</h1><div class="calls">${lines.map((l,i)=>`<p style="animation-delay:${i*1.1}s">${esc(l)}</p>`).join("")}</div><div class="next">${btn("n9","去新办公室")}</div>`);
    $("n9").onclick = stepOffice;
  }
  function stepOffice(){
    show(`<h1>办公室</h1><div class="scene">${SCENES[T.office.svg]}</div><p class="cap">${T.office.caption}</p><div class="lead" style="margin-top:14px">${paras(T.units(S))}</div><div class="next">${btn("n10", S.lv===1?"交接":"收拾东西")}</div>`);
    $("n10").onclick = S.lv===1 ? stepHandover : stepFarewell;
  }
  function stepHandover(){
    const list = S.staff.slice().map(s => ({s, k:staffSkill(s)})).sort((a,b)=>b.k-a.k);
    show(`<h1>交接</h1><div class="lead"><p>弹子石得有人接。支行让你推荐个人。</p><p class="muted" style="font-size:14px">接手的人以后替你管这个网点，网点的产出看${"他"}的本事。</p></div>
      <div class="opts">${list.map(x=>`<button class="opt" data-h="${x.s.id}"><b>${x.s.name} · ${ROLE_NAME[x.s.role]}</b><small>营销${x.s.mk} 业务${x.s.op} 合规${x.s.cp} · 带过${x.s.trained||0}回 · ${x.s.fav>=65?"跟你亲":(x.s.fav<45?"跟你有距离":"关系一般")}</small></button>`).join("")}</div>`);
    st.querySelectorAll("[data-h]").forEach(el => el.onclick = () => { S.promo.succ = el.dataset.h; stepFarewell(); });
  }
  function stepFarewell(){
    show(`<h1>送行</h1><div class="lead">${paras(farewellLine())}</div><div class="next">${btn("n11","两年")}</div>`);
    $("n11").onclick = stepTrans;
  }
  function stepTrans(){
    const a0 = S.age, lv0 = S.lv;
    const txt = applyTransition();
    show(`<h1>${BALANCE.transTitle[lv0]}的${["","两","两","两","三"][lv0]}年</h1><div class="bigage" id="bigage">${a0}岁</div><div class="lead">${txt.map(x=>`<p>${esc(x)}</p>`).join("")}</div><div class="next">${btn("n12","上任","gold")}</div>`);
    let a = a0; const it = setInterval(()=>{ a++; $("bigage") && ($("bigage").textContent = a+"岁"); if(a >= S.age) clearInterval(it); }, 700);
    $("n12").onclick = () => { clearInterval(it); stepZoom(); };
  }
  function stepZoom(){
    st.classList.add("hidden"); st.innerHTML = "";
    UI.refresh();
    if(S.lv === 2) UI.zoomOut(UI.snapL1, stepFirst, "l2mine");
    else if(S.lv === 4) UI.zoomOut(UI.snapL1, stepFirst, "l4wz");
    else if(S.lv === 3){ const mp = $("l3map"); if(mp){ mp.classList.add("mapin"); } setTimeout(stepFirst, 1100); }
    else setTimeout(stepFirst, 300);
  }
  function stepFirst(){
    const succ = S.carry && S.carry.succ ? person(S.carry.succ) : null;
    const sref = succ ? (staff(succ.id) || {name:succ.name, sex:"f"}) : null;
    const I = [null,null,L2_INTRO,L3_INTRO,L4_INTRO,L5_INTRO][S.lv];
    const rep = S.lv === 2 ? I.firstReport(S, sref) : I.firstReport(S);
    show(`<h1>上任第一天</h1><div class="scene">${SCENES[I.office.svg]}</div><p class="cap">${I.office.caption}</p>
      <div class="lead" style="margin-top:14px">${paras(rep)}</div>
      <div class="box" style="margin-top:16px"><h3>这一关</h3>${I.howto.map(x=>`<p style="margin:0 0 6px">${esc(x)}</p>`).join("")}</div>
      <div class="next">${btn("n13","开始")}</div>`);
    $("n13").onclick = finish;
  }
};

/* 镜头拉远:旧面板缩成新面板里的一行 */
UI.zoomOut = function(html, cb, tid){
  const col = $("colM");
  const target = $(tid || "l2mine");
  if(!html || !target){ cb(); return; }
  const r0 = col.getBoundingClientRect();
  const z = document.createElement("div");
  z.className = "zoomer";
  z.style.left = r0.left+"px"; z.style.top = r0.top+"px"; z.style.width = r0.width+"px"; z.style.height = r0.height+"px";
  z.innerHTML = html;
  z.querySelectorAll("button,select").forEach(b=>b.disabled = true);
  document.body.appendChild(z);
  let ended = false;
  const end = () => { if(ended) return; ended = true; z.remove(); cb(); };
  z.onclick = end;
  setTimeout(() => {
    const r1 = target.getBoundingClientRect();
    const sx = r1.width / r0.width, sy = r1.height / r0.height;
    z.style.transform = `translate(${r1.left - r0.left}px, ${r1.top - r0.top}px) scale(${sx}, ${sy})`;
    z.style.opacity = "0.15";
  }, 350);
  setTimeout(end, 350 + 650);
};
