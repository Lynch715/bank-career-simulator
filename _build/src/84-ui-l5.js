/* =====================================================================
   L5 总行界面、结局页、履历长图、图鉴
   ===================================================================== */
Object.assign(UI, {
  renderL5(){
    const b = B5(), B = S.biz;
    const acts = L5_ACTIONS.map(a => { const ck = canActL5(a.id); return `<button class="act" data-act5="${a.id}" ${ck.ok?"":"disabled"} title="${esc(ck.ok?a.desc:ck.why)}"><b>${a.name}${apCostTag(a.id)}${oddsChip(actOdds(a.id))}</b><small>${a.desc}</small></button>`; }).join("");
    const dials = DIAL_DEF.map(d => `<div class="dial"><div class="dh"><b>${d.name}</b><span class="muted">${d.tip}</span></div>
      <div class="dr"><small>${d.lo}</small><input type="range" min="1" max="5" step="1" value="${B.dials[d.k]}" data-dial="${d.k}" aria-label="${d.name}"><small>${d.hi}</small><b class="num">${B.dials[d.k]}</b></div></div>`).join("");
    const peers = (S.kpi.table||[]).map((p,i) => `<tr class="${p.me?"me":""}"><td class="n">${i+1}</td><td>${p.name}</td><td class="s num">${fmtWy(p.score)}</td></tr>`).join("");
    const cell = 64;
    const tiles = B.regions.map(r => { const heat = r.boost>0 ? "#c9ab6a" : "#23463f", tc = r.boost>0 ? "#16302b" : "#f3edde"; const op = 0.35 + r.share*2.2;
      return `<g data-region="${r.id}" style="cursor:pointer"><rect x="${r.x*cell+2}" y="${r.y*cell+2}" width="${r.w*cell-4}" height="${r.h*cell-4}" rx="6" fill="${heat}" fill-opacity="${Math.min(0.95,op)}"/>
        <text x="${r.x*cell+10}" y="${r.y*cell+26}" font-size="15" fill="${tc}" font-family="sans-serif">${r.name}${r.cq?" ·重庆":""}</text>
        <text x="${r.x*cell+10}" y="${r.y*cell+46}" font-size="13" fill="${tc}" font-family="sans-serif">占${Math.round(r.share*100)}%${r.boost>0?" · 调研中":""}</text></g>`; }).join("");
    $("colM").innerHTML = `
      <div class="box"><h3>泰和银行 <em>三十六个一级分行 · 全国${B.outlets}个网点</em></h3>
        <div class="stats">
          <div class="stat"><span>存款</span><b class="num">${fmtWy(B.dep)}</b></div>
          <div class="stat"><span>贷款</span><b class="num">${fmtWy(B.loans)}</b></div>
          <div class="stat"><span>不良率</span><b class="num">${(B.npl/B.loans*100).toFixed(2)}%</b></div>
          <div class="stat"><span>资本充足率</span><b class="num">${carL5().toFixed(1)}%</b></div>
          <div class="stat"><span>贷款息差</span><b class="num">${((B.lastSpread?B.lastSpread.l:b.spreadLoan)*100).toFixed(2)}%</b></div>
        </div>
        <p class="hint" style="margin-top:8px">${B.strategy?`今年的调子：${STRAT_OPTS.find(x=>x.id===B.strategy).name}。`:""}${B.cutLevel ? `降息已经压了${B.cutLevel}轮。` : "降息还没开始。"}任期还剩${Math.max(0, BALANCE.tenure[5]-S.turn+1)}个半年。</p></div>
      <div class="box"><h3>五个拨盘 <em>拨盘不占行动点，半年结算一次</em></h3>${dials}
        <div class="dial"><div class="dh"><b>资本补充</b><span class="muted">资本充足率低于 10.5% 贷款就放不出去。窗口开的时候会有人来报。</span></div><div class="dr"><small>这一任已经发了${B.capIssued}次二级资本债</small></div></div></div>
      <div class="box"><h3>这半年 <em>剩 ${S.ap} 点</em></h3><div class="acts">${acts}</div>
        <div class="endbar"><button class="btn" id="btnEnd">${S.turn >= BALANCE.tenure[5] ? "任期届满" : "结束这半年"}</button></div></div>
      <div class="box"><h3>全国 <em>点一个片区去调研</em></h3><div class="scene"><svg viewBox="0 0 ${7*cell} ${4*cell}" xmlns="http://www.w3.org/2000/svg" style="background:var(--paper2)">${tiles}</svg></div></div>
      <div class="box"><h3>同业规模排名</h3><table class="rank-t">${peers}</table></div>`;
    $("colM").querySelectorAll("[data-act5]").forEach(el => el.onclick = () => UI.onAct5(el.dataset.act5));
    $("colM").querySelectorAll("[data-region]").forEach(el => el.onclick = () => { if(canActL5("survey").ok){ doSurvey(el.dataset.region); UI.refresh(); } else UI.toast(canActL5("survey").why); });
    $("colM").querySelectorAll("[data-dial]").forEach(el => el.onchange = () => { setDial(el.dataset.dial, +el.value); UI.refresh(); });
    $("btnEnd").onclick = () => { endTurn(); UI.refresh(); };
  },
  onAct5(id){
    if(id==="reg5"){ doReg5(); UI.refresh(); return; }
    if(id==="reform"){ UI.modal({kind:"pick", title:"机构改革", body:"压掉一个管理层级，费用省下一截。四千多个岗位要重新竞聘，下面会有怨气。这件事一任只能做一次。", opts:[{t:"「做。」", s:"费用省8% · 口碑掉", fn:()=>doReform()},{t:"再想想", s:""}]}); return; }
    if(id==="visit5"){ doVisit5(); UI.refresh(); return; }
    if(id==="survey"){ const opts = S.biz.regions.map(r => ({t:r.name+(r.cq?"（有重庆）":""), s:`占全行存款${Math.round(r.share*100)}%`, odds:ODDS[5].survey(), fn:()=>doSurvey(r.id)})); opts.push({t:"算了", s:""}); UI.modal({kind:"pick", title:"去哪里调研", body:"", opts}); }
  },

  /* ---------- 结局页 ---------- */
  showEnding(){
    const o = S.over;
    const st = $("stage");
    const lvName = o.lv === 5 ? "泰和银行行长" : ("止步于" + ["","弹子石网点负责人","南岸支行行长","万州分行行长","重庆分行行长"][o.lv]);
    st.innerHTML = `<div class="inner"><h1>${esc(o.title)}</h1><div class="lead">${paras(o.text)}</div>
      <p class="cap">${S.player.sur}${S.player.given} · ${o.age}岁 · ${lvName}</p>
      <div class="next"><button class="btn gold" id="eB">看履历</button><button class="btn ghost" id="eP">人脉簿</button><button class="btn ghost" id="eD">图鉴</button><button class="btn" id="eR">再开一局</button></div></div>`;
    st.classList.remove("hidden"); st.scrollTop = 0;
    $("eB").onclick = UI.showBio;
    $("eP").onclick = UI.showPeople;
    $("eD").onclick = UI.showDex;
    $("eR").onclick = () => { clearSave(); UI.start(); };
  },
  showBio(){
    const st = $("stage");
    const cv = document.createElement("canvas");
    let url = "";
    try { if(drawBio(cv) !== false) url = cv.toDataURL("image/png"); } catch(e){}
    st.innerHTML = `<div class="inner"><h1>履历</h1>
      <div class="bioimg">${url ? `<img src="${url}" alt="履历长图">` : '<p class="muted">这个浏览器画不了图。</p>'}</div>
      <p class="cap">手机上长按图片保存；电脑上点「存图」。</p>
      <div class="next"><a class="btn gold" id="bS" ${url?`href="${url}" download="履历-${S.player.sur}${S.player.given}.png"`:""}>存图</a><button class="btn ghost" id="bBack">回去</button></div></div>`;
    st.scrollTop = 0;
    $("bBack").onclick = () => UI.showEnding();
  },
  showDex(fromStart){
    const m = loadMeta();
    const st = $("stage");
    const lvName = ["","网点","支行","万州","重庆分行","总行"];
    const got = ENDING_LIST.filter(e => m.endings[e.lv+":"+e.k]).length;
    const cards = ENDING_LIST.map(e => {
      const rec = m.endings[e.lv+":"+e.k], E = ENDINGS[e.lv][e.k];
      return `<div class="pc ${rec?"":"locked"}"><span class="muted">${lvName[e.lv]}</span><br><b>${rec ? E.title : "？？？"}</b>${rec?`<div class="muted" style="margin-top:4px">${esc(rec.name)} · ${rec.age}岁</div>`:""}</div>`;
    }).join("");
    const ppl = Object.values(m.people).map(p => `<div class="pc"><b>${esc(p.name)}</b><div class="pos">${esc(p.role||"")}</div><div class="muted">${esc(p.note||"")}</div></div>`).join("");
    st.innerHTML = `<div class="inner"><h1>图鉴</h1><p class="cap">结局 ${got}/${ENDING_LIST.length} · 打过 ${m.runs||0} 局</p>
      <div class="pgroup">结局</div><div class="pgrid dex">${cards}</div>
      <div class="pgroup">认识的人</div><div class="pgrid">${ppl || '<p class="muted">还没有。</p>'}</div>
      <div class="next"><button class="btn" id="dBack">回去</button></div></div>`;
    st.classList.remove("hidden"); st.scrollTop = 0;
    $("dBack").onclick = () => { if(fromStart === true || !S){ st.classList.add("hidden"); $("startScr").classList.remove("hidden"); } else if(S.phase==="over") UI.showEnding(); else st.classList.add("hidden"); };
  },
});
