/* =====================================================================
   L2 界面:网点表、对公看板、审批队列、指标分解;L3 占位
   ===================================================================== */
SCENES.wanzhou = `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">
  <rect width="520" height="260" fill="var(--paper2)"/>
  <rect x="150" y="20" width="350" height="160" fill="#b9c4c2" stroke="var(--line)" stroke-width="4"/>
  <rect x="154" y="24" width="342" height="70" fill="#d3dad8"/>
  <path d="M154 70 L200 52 L240 64 L290 40 L340 58 L390 44 L440 60 L496 48 L496 94 L154 94Z" fill="#8fa19c"/>
  <rect x="154" y="94" width="342" height="82" fill="#6f8a86"/>
  <path d="M154 120 Q320 112 496 124" stroke="#a9bdb9" stroke-width="2" fill="none" opacity=".7"/>
  <path d="M154 150 Q330 144 496 154" stroke="#a9bdb9" stroke-width="1.5" fill="none" opacity=".5"/>
  <g stroke="#3d4f4b" stroke-width="3" fill="none"><path d="M170 100 L480 100"/><path d="M230 100 L230 170"/><path d="M420 100 L420 170"/><path d="M230 100 Q325 60 420 100"/></g>
  <g stroke="#3d4f4b" stroke-width="1"><line x1="255" y1="88" x2="255" y2="100"/><line x1="280" y1="80" x2="280" y2="100"/><line x1="305" y1="76" x2="305" y2="100"/><line x1="330" y1="75" x2="330" y2="100"/><line x1="355" y1="77" x2="355" y2="100"/><line x1="380" y1="82" x2="380" y2="100"/><line x1="400" y1="90" x2="400" y2="100"/></g>
  <line x1="325" y1="20" x2="325" y2="180" stroke="var(--line)" stroke-width="3"/>
  <rect x="20" y="182" width="330" height="16" fill="var(--ink2)"/>
  <rect x="34" y="198" width="12" height="52" fill="var(--ink2)"/><rect x="324" y="198" width="12" height="52" fill="var(--ink2)"/>
  <rect x="80" y="138" width="100" height="44" fill="var(--ink)" rx="3"/>
  <rect x="210" y="166" width="60" height="16" fill="var(--card)" stroke="var(--line)"/>
  <rect x="44" y="162" width="18" height="20" rx="3" fill="var(--gold)"/>
</svg>`;

SCENES.wzmap = `<svg viewBox="0 0 520 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="520" height="300" fill="var(--paper2)"/>
  <path d="M0 160 C90 140 150 190 250 170 S420 120 520 150 L520 185 C420 158 340 210 250 205 S90 175 0 195Z" fill="#8fb0ab" opacity=".85"/>
  <g font-family="sans-serif" font-size="13" fill="var(--text)">
    <g><path d="M170 60 L260 50 L275 150 L180 160Z" fill="var(--card)" stroke="var(--ink2)" stroke-width="1.5"/><text x="195" y="110">老城</text></g>
    <g><path d="M275 50 L380 60 L375 140 L275 150Z" fill="var(--card)" stroke="var(--ink2)" stroke-width="1.5"/><text x="300" y="105">高铁片区</text></g>
    <g><path d="M200 205 L320 200 L330 270 L210 280Z" fill="var(--card)" stroke="var(--ink2)" stroke-width="1.5"/><text x="232" y="245">江南新区</text></g>
    <g><path d="M380 60 L480 70 L470 135 L375 140Z" fill="var(--card)" stroke="var(--ink2)" stroke-width="1.5"/><text x="398" y="105">工业园</text></g>
    <g><path d="M40 40 L165 60 L175 160 L40 150Z" fill="var(--paper)" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="4 3"/><text x="62" y="102">五桥</text></g>
    <g><path d="M335 205 L480 190 L490 270 L340 275Z" fill="var(--paper)" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="4 3"/><text x="380" y="240">长岭</text></g>
  </g>
  <text x="18" y="290" font-family="sans-serif" font-size="11" fill="var(--muted)">长江</text>
</svg>`;

Object.assign(UI, {
  renderL2(){
    const b = B2();
    const dep = depTotal(), dd = S.report && S.lv===2 && S.report.dDep!=null && S.track.scoreHistory.length ? S.report.dDep : 0;
    const acts = ACTIONS_L2.map(a => {
      const ck = canActL2(a.id);
      return `<button class="act" data-act2="${a.id}" ${ck.ok?"":"disabled"} title="${esc(ck.ok?a.desc:ck.why)}"><b>${a.name}</b><small>${a.desc}</small></button>`;
    }).join("");
    const rows = S.biz.outlets.map(o => {
      const m = o.mgr ? person(o.mgr) : null;
      const got = o.dep - o.y0, pct = o.target ? Math.round(got/o.target*100) : null;
      return `<tr class="${o.id==="dzs"?"mine":""}" ${o.id==="dzs"?'id="l2mine"':""} data-outlet="${o.id}" tabindex="0">
        <td>${o.name}${o.id==="dzs"?' <small class="muted">你待过</small>':""}${o.supervised?' <small class="tagx">督导中</small>':""}</td>
        <td>${m?m.name:'<span class="neg">空缺</span>'}${m?`<br><small class="muted">能力${m.skill}</small>`:""}</td>
        <td class="num">${fmtYi(o.dep)}</td>
        <td class="num ${o.lastInc<0?"neg":""}">${S.track.scoreHistory.length?sgn(Math.round(o.lastInc), fmtWan):"—"}</td>
        <td class="num">${pct==null?"—":pct+"%"}</td>
        <td><div class="mini"><div class="bar"><i class="${o.morale<35?"lo":"ok"}" style="width:${o.morale}%"></i></div></div></td></tr>`;
    }).join("");
    const lead = person(S.biz.corp.lead);
    const cols = [0,1,2,3].map(st => {
      const cards = S.biz.projects.filter(p => !p.lost && (st<3 ? p.stage===st : p.stage===3)).slice(-3).map(p => {
        const d = PROJ_L2.find(x=>x.id===p.id);
        const need = st<2 ? b.project.need[st] : 0;
        return `<div class="pj tier-${d.tier}" data-proj="${p.id}"><b>${d.name}</b><small>${d.what}</small>
          <small class="muted">存款${fmtWan(d.dep)}${d.loan?" · 贷款"+fmtWan(d.loan):""}</small>
          ${st<2?`<div class="dots">${Array.from({length:need},(_,i)=>`<i class="${i<p.prog?"on":""}"></i>`).join("")}</div>`:""}
          ${st===2?`<small class="gold">待上会${p.visits+p.gift?` · 拜访${p.visits+p.gift}次`:""}</small>`:""}</div>`;
      }).join("") || `<div class="pj empty">——</div>`;
      return `<div class="kcol"><div class="kh">${PROJ_STAGES[st]}</div>${cards}</div>`;
    }).join("");
    const lost = S.biz.projects.filter(p=>p.lost).map(p=>PROJ_L2.find(x=>x.id===p.id).name);
    const q = S.biz.queue.map(it => {
      const rel = it.rel ? `<div class="rel">${esc(it.relLine)}</div>` : "";
      return `<div class="ln"><div class="lh"><b>${it.name}</b><span class="num">${fmtWan(it.amt)}</span></div>
        <div class="lm">${it.type==="micro"?"小微":"对公"} · ${it.ind} · ${it.coll}</div>
        <div class="lm">流水${it.flow} · 纳税${it.tax}级</div>${rel}
        <div class="lb"><button class="btn sm" data-loan="${it.id}" data-ok="1">批</button><button class="btn sm ghost" data-loan="${it.id}" data-ok="0">退</button></div></div>`;
    }).join("") || `<p class="muted" style="margin:0">这个月的申请都处理完了。</p>`;
    $("colM").innerHTML = `
      <div class="box">
        <h3>南岸支行 <em>四个网点 · 对公团队</em></h3>
        <div class="stats">
          <div class="stat"><span>存款</span><b class="num" data-roll="dep2">${fmtYi(dep)}</b></div>
          <div class="stat"><span>上月增量</span><b class="num" style="color:${dd>=0?"var(--good)":"var(--bad)"}">${sgn(Math.round(dd), fmtWan)}</b></div>
          <div class="stat"><span>贷款</span><b class="num">${fmtYi(S.biz.loans)}</b></div>
          <div class="stat"><span>不良率</span><b class="num">${nplRatio().toFixed(2)}%</b></div>
          <div class="stat"><span>营销费用</span><b class="num">${r1(S.biz.budget)}万</b></div>
        </div>
      </div>
      <div class="box"><h3>本月行动 <em>剩 ${S.ap} 点 · 批贷款不占行动点</em></h3><div class="acts">${acts}</div>
        <div class="endbar"><span class="muted" style="font-size:12px">${S.biz.queue.length?`还有${S.biz.queue.length}笔贷款没批，月底不处理就过期`:""}</span><button class="btn" id="btnEnd">结束本月</button></div></div>
      <div class="box"><h3>网点 <em>点一行看详情、督导、换人</em></h3>
        <div class="tscroll"><table class="l2t"><tr><th>网点</th><th>负责人</th><th>存款</th><th>本月</th><th>任务</th><th>士气</th></tr>${rows}
        <tr><td>对公团队</td><td>${lead?lead.name:"—"}${lead?`<br><small class="muted">能力${lead.skill}</small>`:""}</td><td class="num">${fmtYi(S.biz.corp.dep)}</td><td></td><td></td><td></td></tr></table></div></div>
      <div class="box"><h3>贷款审批 <em>本月 ${S.biz.queue.length} 笔</em></h3><p class="hint">抵押、流水、纳税看得见，真实风险看不见。批出去的贷款一年左右才见分晓。</p><div class="lq">${q}</div></div>
      <div class="box"><h3>对公项目 <em>${lost.length?"丢了："+lost.join("、"):"推进和拜访都在行动里"}</em></h3><div class="kanban">${cols}</div></div>`;
    $("colM").querySelectorAll("[data-act2]").forEach(el => el.onclick = () => UI.onAct2(el.dataset.act2));
    $("colM").querySelectorAll("[data-outlet]").forEach(el => { el.onclick = () => UI.outletModal(el.dataset.outlet); el.onkeydown = e => { if(e.key==="Enter") UI.outletModal(el.dataset.outlet); }; });
    $("colM").querySelectorAll("[data-loan]").forEach(el => el.onclick = () => { decideLoan(el.dataset.loan, el.dataset.ok==="1"); UI.refresh(); });
    $("colM").querySelectorAll("[data-proj]").forEach(el => el.onclick = () => UI.projModal(el.dataset.proj));
    $("btnEnd").onclick = () => { endTurn(); UI.refresh(); };
    UI.rollAll();
  },

  onAct2(id){
    const b = B2();
    if(id==="campaign"){ doCampaign(); UI.refresh(); return; }
    if(id==="reportup"){ doReportUp(); UI.refresh(); return; }
    if(id==="supervise" || id==="appoint"){
      const opts = S.biz.outlets.map(o => { const m = o.mgr?person(o.mgr):null; return {t:`${o.name} · ${m?m.name:"空缺"}`, s:`士气${Math.round(o.morale)}${o.supervised?" · 本月已督导":""}`, disabled: id==="supervise" && o.supervised, fn:()=> id==="supervise" ? doSupervise(o.id) : setTimeout(()=>UI.appointModal(o.id), 0)}; });
      opts.push({t:"算了", s:""});
      UI.modal({kind:"pick", title: id==="supervise"?"去哪个网点":"换哪个网点的负责人", body:"", opts});
      return;
    }
    if(id==="push" || id==="visit"){
      const ps = activeProjects();
      const opts = ps.map(p => { const d = PROJ_L2.find(x=>x.id===p.id); return {t:`${d.name} · ${PROJ_STAGES[p.stage]}`, s:d.what, fn:()=> id==="push" ? doPush(p.id) : setTimeout(()=>UI.visitModal(p.id), 0)}; });
      opts.push({t:"算了", s:""});
      UI.modal({kind:"pick", title: id==="push"?"推进哪个项目":"去拜访谁", body: id==="push"?"到了「审批」一栏的项目，推进就是上分行贷审会。":"", opts});
    }
  },
  visitModal(pid){
    const b = B2().project, d = PROJ_L2.find(x=>x.id===pid);
    UI.modal({kind:"pick", title:d.name, body:d.note, opts:[
      {t:"登门拜访，把方案过一遍", s:"过会把握大一点", fn:()=>doVisit(pid,false)},
      {t:"请对方吃顿饭，带两瓶酒", s:`营销费用-${b.giftCost}万 · 过会把握大不少 · 留底`, disabled:S.biz.budget<b.giftCost, fn:()=>doVisit(pid,true)},
      {t:"算了", s:""},
    ]});
  },
  projModal(pid){
    const p = project(pid), d = PROJ_L2.find(x=>x.id===pid);
    const tierTxt = {low:"风险部看着没什么问题", mid:"风险部有保留意见", high:"风险部意见很大"}[d.tier];
    UI.modal({kind:"pick", title:d.name, body:`${d.what}。${d.note}\n\n现在在「${PROJ_STAGES[p.stage]}」。${tierTxt}。`, opts:[
      {t:p.stage===2?"上贷审会":"推进一步", s:"1点行动", disabled:!canActL2("push").ok || p.stage>=3 || p.lost, fn:()=>doPush(pid)},
      {t:"去拜访", s:"1点行动", disabled:!canActL2("visit").ok || p.stage>=3 || p.lost, fn:()=>setTimeout(()=>UI.visitModal(pid),0)},
      {t:"关掉", s:""},
    ]});
  },
  outletModal(oid){
    const o = outlet(oid), m = o.mgr ? person(o.mgr) : null;
    const got = o.dep - o.y0;
    const body = `${m?`负责人${m.name}，能力${m.skill}，${m.trait||""}。${m.note||m.recent||""}`:"负责人空缺，网点只能维持。"}\n\n存款${fmtYi(o.dep)}，今年净增${fmtWan(got)}${o.target?`，任务${fmtWan(o.target)}`:""}。士气${Math.round(o.morale)}。`;
    UI.modal({kind:"pick", title:o.name, body, opts:[
      {t:"下去督导", s:"1点行动 · 本月产出和士气上去", disabled:!canActL2("supervise").ok || o.supervised, fn:()=>doSupervise(oid)},
      {t:"换负责人", s:"1点行动", disabled:!canActL2("appoint").ok, fn:()=>setTimeout(()=>UI.appointModal(oid),0)},
      {t:"关掉", s:""},
    ]});
  },
  appointModal(oid){
    const o = outlet(oid), cur = o.mgr ? person(o.mgr) : null;
    const cands = appointCands(oid).sort((a,b)=>b.skill-a.skill);
    const opts = cands.map(p => ({t:`${p.name} · 能力${p.skill}`, s:`${p.pos} · ${p.recent||p.note||""}`, fn:()=>doAppoint(oid, p.id)}));
    if(!opts.length) opts.push({t:"没有合适的人", s:"人脉簿里弹子石的旧部都有位子了", disabled:true});
    opts.push({t:"算了", s:""});
    UI.modal({kind:"pick", title:`${o.name}换人`, body: cur ? `现在是${cur.name}，能力${cur.skill}。换下来的人会去支行后台，心里有数。` : "这个位子空着。", opts});
  },

  decompModal(done){
    const f = decompFair(), step = f.step;
    const alloc = decompProportional().map((x,i)=> i===0 ? x : x);
    // 初始给平均数,让玩家自己拆
    const even = Math.round(f.total/4/step)*step; alloc.fill(even); alloc[0] += f.total - even*4;
    const m = $("modal");
    const render = () => {
      const left = f.total - alloc.reduce((a,b)=>a+b,0);
      const rows = S.biz.outlets.map((o,i) => {
        const mg = o.mgr ? person(o.mgr) : null, r = alloc[i]/f.fair[i];
        const tag = r > BALANCE.L2.decomp.over ? '<span class="neg">压太重</span>' : (r > BALANCE.L2.decomp.high ? '<span class="warnx">偏重</span>' : (r < BALANCE.L2.decomp.low ? '<span class="muted">偏松</span>' : '<span class="okx">合适</span>'));
        return `<div class="dc"><div><b>${o.name}</b><br><small class="muted">${mg?mg.name:"空缺"} · 去年规模${fmtYi(o.dep)}</small></div>
          <div class="dcb"><button class="btn sm ghost" data-d="${i}" data-v="-1" aria-label="减">−</button><b class="num">${fmtWan(alloc[i])}</b><button class="btn sm ghost" data-d="${i}" data-v="1" aria-label="加">＋</button></div>
          <div class="dct">${tag}</div></div>`;
      }).join("");
      m.innerHTML = `<div class="modal"><h2>指标分解</h2><div class="body"><p>分行给南岸的存款任务是${fmtWan(S.kpi.card.find(x=>x.k==="dep").target)}。对公条线先扣${fmtWan(B2().corpShare)}，剩下的拆给四个网点。</p>
        <p class="muted" style="font-size:13px">拆得和网点的底子不配，负责人会有意见。压得稍微紧一点，他们会多使点劲。</p></div>
        ${rows}<p class="tally">${left===0?"刚好分完":(left>0?`还剩${fmtWan(left)}没分`:`多分了${fmtWan(-left)}`)}</p>
        <div class="opts"><button class="opt" id="dcOk" ${left!==0?"disabled":""}><b>把任务书发下去</b></button><button class="opt" id="dcAuto"><b>按各网点的底子拆</b><small>系统按潜力比例分</small></button></div></div>`;
      m.classList.remove("hidden");
      m.querySelectorAll("[data-d]").forEach(el => el.onclick = () => { const i = +el.dataset.d; alloc[i] = Math.max(0, alloc[i] + (+el.dataset.v)*step); render(); });
      $("dcAuto").onclick = () => { decompProportional().forEach((x,i)=>alloc[i]=x); render(); };
      $("dcOk").onclick = () => { m.classList.add("hidden"); m.innerHTML = ""; applyDecomp(alloc); done(); UI.refresh(); };
    };
    render();
  },

});
