/* =====================================================================
   界面
   ===================================================================== */
const SCENES = {
  deputy: `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">
    <rect width="520" height="260" fill="var(--paper2)"/>
    <rect x="300" y="30" width="170" height="130" fill="var(--card)" stroke="var(--line)" stroke-width="4"/>
    <line x1="385" y1="30" x2="385" y2="160" stroke="var(--line)" stroke-width="3"/>
    <rect x="312" y="44" width="62" height="108" fill="var(--paper2)"/><rect x="396" y="44" width="62" height="108" fill="var(--paper2)"/>
    <g fill="var(--muted)" opacity=".55"><rect x="318" y="60" width="40" height="24" rx="2"/><rect x="402" y="60" width="40" height="24" rx="2"/><rect x="318" y="104" width="40" height="24" rx="2"/><rect x="402" y="104" width="40" height="24" rx="2"/></g>
    <g stroke="var(--card)" stroke-width="1.5" opacity=".8"><line x1="322" y1="66" x2="354" y2="66"/><line x1="322" y1="72" x2="354" y2="72"/><line x1="406" y1="66" x2="438" y2="66"/><line x1="406" y1="72" x2="438" y2="72"/><line x1="322" y1="110" x2="354" y2="110"/><line x1="406" y1="110" x2="438" y2="110"/></g>
    <rect x="40" y="170" width="300" height="14" fill="var(--ink2)"/>
    <rect x="52" y="184" width="10" height="60" fill="var(--ink2)"/><rect x="318" y="184" width="10" height="60" fill="var(--ink2)"/>
    <rect x="120" y="128" width="90" height="42" fill="var(--ink)" rx="3"/><rect x="160" y="170" width="10" height="4" fill="var(--ink)"/>
    <rect x="228" y="150" width="54" height="20" fill="var(--card)" stroke="var(--line)"/><rect x="232" y="146" width="54" height="20" fill="var(--card)" stroke="var(--line)"/>
    <rect x="80" y="152" width="16" height="18" rx="3" fill="var(--gold)"/>
    
  </svg>`,
  branch: `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">
    <rect width="520" height="260" fill="var(--paper2)"/>
    <rect x="180" y="24" width="320" height="150" fill="#2b4a5a" stroke="var(--line)" stroke-width="4"/>
    <rect x="184" y="28" width="312" height="80" fill="#3f6273"/>
    <g fill="#1e333d"><rect x="196" y="70" width="22" height="38"/><rect x="224" y="58" width="16" height="50"/><rect x="246" y="76" width="28" height="32"/><rect x="282" y="50" width="18" height="58"/><rect x="306" y="66" width="30" height="42"/><rect x="342" y="44" width="20" height="64"/><rect x="368" y="72" width="26" height="36"/><rect x="400" y="60" width="18" height="48"/><rect x="424" y="68" width="30" height="40"/><rect x="460" y="54" width="24" height="54"/></g>
    <g fill="var(--gold2)" opacity=".8"><rect x="229" y="64" width="3" height="3"/><rect x="287" y="58" width="3" height="3"/><rect x="347" y="52" width="3" height="3"/><rect x="351" y="62" width="3" height="3"/><rect x="465" y="62" width="3" height="3"/><rect x="405" y="70" width="3" height="3"/></g>
    <rect x="184" y="108" width="312" height="62" fill="#4d6f78"/>
    <path d="M184 128 Q300 120 496 134" stroke="#9fb7bb" stroke-width="2" fill="none" opacity=".6"/>
    <path d="M184 146 Q320 140 496 150" stroke="#9fb7bb" stroke-width="1.5" fill="none" opacity=".4"/>
    <line x1="340" y1="24" x2="340" y2="174" stroke="var(--line)" stroke-width="3"/>
    <rect x="20" y="176" width="340" height="16" fill="var(--ink2)"/>
    <rect x="34" y="192" width="12" height="58" fill="var(--ink2)"/><rect x="334" y="192" width="12" height="58" fill="var(--ink2)"/>
    <rect x="90" y="132" width="100" height="44" fill="var(--ink)" rx="3"/>
    <rect x="220" y="160" width="60" height="16" fill="var(--card)" stroke="var(--line)"/>
    <rect x="42" y="156" width="18" height="20" rx="3" fill="var(--gold)"/>
    
  </svg>`,
};

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const paras = s => String(s).split(/\n\n+/).map(p=>`<p>${p.replace(/\n/g,"<br>")}</p>`).join("");

const UI = {
  tab: "colM",
  custTab: "due",
  rolls: {},
  snapL1: null,

  /* ---------- 渲染 ---------- */
  refresh(){
    if(!S) return;
    if(S.phase === "over"){ UI.showEnding(); return; }
    $("app").classList.remove("hidden");
    UI.renderTop(); UI.renderLeft(); UI.renderMid(); UI.renderLog();
    const th = $("top").getBoundingClientRect().height;
    document.documentElement.style.setProperty("--toph", th + "px");
  },
  renderTop(){
    const c = S.core, cw = BALANCE.core.cleanWarn;
    const apDots = Array.from({length:S.apMax}, (_,i)=>`<i class="${i<S.ap?"on":""}"></i>`).join("");
    const turnTxt = S.lv<=2 ? `${S.m}月 · 第${S.turn}回合` : (S.lv<=4 ? `${qName()} · 第${S.turn}回合` : `${S.m<=6?"上半年":"下半年"} · 第${S.turn}回合`);
    $("top").innerHTML = `
      <div class="who">${esc(titleOf(S))}</div>
      <div class="meta">${S.age}岁 · 入行第${S.careerYear}年 · ${turnTxt}</div>
      ${S.phase==="play" ? `<div class="ap" title="行动点">${apDots}</div>` : ""}
      ${S.promo.rumored && S.phase==="play" ? `<div class="win-badge" title="升职窗口">窗口 · ${Math.max(0,S.promo.windowAt - S.turn)}月后考察</div>` : ""}
      <div class="cores">
        <div class="core"><b class="num" data-roll="perf">${c.perf}</b><span>业绩</span></div>
        <div class="core"><b class="num" data-roll="rep">${c.rep}</b><span>口碑</span></div>
        <div class="core"><b class="num" data-roll="trust">${c.trust}</b><span>上级信任</span></div>
        ${c.clean <= cw ? `<div class="clean-ico" title="有些事，经不起翻">🗂</div>` : ""}
        <button class="topbtn" id="btnPeople">人脉簿</button>
        <button class="topbtn" id="btnMenu">菜单</button>
      </div>`;
    $("btnPeople").onclick = UI.showPeople;
    $("btnMenu").onclick = UI.showMenu;
    UI.rollAll();
  },
  renderLeft(){
    const cap = BALANCE.kpiCap;
    const items = S.kpi.card.map(it => {
      const pct = clamp(it.done/cap, 0, 1)*100;
      const pace = it.kind==="flow" ? clamp((S.m/12)/cap, 0, 1)*100 : clamp(1/cap,0,1)*100;
      if(it.kind==="lower") it.done = it.pace;
      const cls = it.pace >= 1 ? "ok" : (it.pace < 0.85 ? "lo" : "");
      const big = v => S.lv===5 ? (v/10000).toFixed(0)+"亿" : S.lv>=3 ? (Math.abs(v)>=1000000 ? fmtYi0(v) : fmtYi1(v)) : fmtWan(v);
      const lowerPct = it.k==="npl";
      const act = it.unit==="万" ? big(it.actual) : (it.unit==="%" ? Number(it.actual).toFixed(lowerPct?2:1)+"%" : (it.unit==="亿/网点" ? Number(it.actual).toFixed(1)+"亿" : Math.round(it.actual)+it.unit));
      const tgt = it.unit==="万" ? big(it.target) : (it.unit==="%" ? (lowerPct?"≤":"≥")+it.target+"%" : (it.unit==="亿/网点" ? "≥"+it.target+"亿" : (it.k==="rating" ? "≤"+it.target+"级" : (it.k==="rank" ? "前"+it.target+"名" : it.target+it.unit))));
      return `<div class="kpi-it"><div class="l"><span>${it.name} <small>${it.w}</small></span><span class="num">${act} <small>/ ${tgt}</small></span></div>
        <div class="bar"><i class="${cls}" style="width:${pct}%"></i><span class="pace" style="left:${pace}%"></span></div></div>`;
    }).join("");
    const first = !S.track.scoreHistory.length;
    let t = S.kpi.table || [];
    if(first && S.lv<=2) t = t.filter(r=>!r.me).concat([{name:S.lv===2?"南岸支行":"弹子石网点", boss:S.player.sur+S.player.given, score:null, me:true}]);
    const rows = t.map((r,i) => {
      let arr = "";
      if(r.me && S.kpi.prevRank){ const d = S.kpi.prevRank - S.kpi.rank; arr = d>0?`<span class="arr-up">↑${d}</span>`:(d<0?`<span class="arr-dn">↓${-d}</span>`:""); }
      return `<tr class="${r.me?"me":""}"><td class="n">${i+1}</td><td>${r.name}<br><small class="muted">${r.boss}</small></td><td class="s num">${r.score==null?"—":(S.lv===5?fmtWy(r.score):r.score.toFixed(1))} ${first?"":arr}</td></tr>`;
    }).join("");
    $("colL").innerHTML = `
      <div class="box"><h3>考核卡 <em>入行第${S.careerYear}年</em></h3>${items}
        <div class="score"><span class="muted">综合得分</span><b class="num" data-roll="score">${S.track.scoreHistory.length?S.kpi.score.toFixed(1):"—"}</b></div>
        <p class="hint" style="margin-top:6px">金线是时序进度。完成率封顶${Math.round(cap*100)}%。</p></div>
      <div class="box"><h3>${[null,"支行","分行","二级分行","全国一级分行","同业规模"][S.lv]}排名 <em>${first?(S.lv===5?"半年后出排名":"月底出排名"):"第"+S.kpi.rank+"名"}</em></h3><table class="rank-t">${rows}</table></div>`;
    UI.rollAll();
  },
  renderMid(){
    if(S.lv === 2){ UI.renderL2(); return; }
    if(S.lv === 3){ UI.renderL3(); return; }
    if(S.lv === 4){ UI.renderL4(); return; }
    if(S.lv === 5){ UI.renderL5(); return; }
    const b = B1();
    const dep = depTotal(), dd = dep - S.month.dep0;
    const tk = S.biz.task;
    const acts = ACTIONS_L1.map(a => {
      const ck = canAct(a.id);
      return `<button class="act" data-act="${a.id}" ${ck.ok?"":"disabled"} title="${esc(ck.ok?a.desc:ck.why)}"><b>${a.name}${oddsChip(actOdds(a.id))}</b><small>${a.desc}</small></button>`;
    }).join("");
    $("colM").innerHTML = `
      <div class="box">
        <h3>弹子石网点 <em>${S.staff.length}人 · 一个厅</em></h3>
        <div class="stats">
          <div class="stat"><span>存款</span><b class="num" data-roll="dep">${fmtYi(dep)}</b></div>
          <div class="stat"><span>本月增量</span><b class="num" style="color:${dd>=0?"var(--good)":"var(--bad)"}">${sgn(Math.round(dd), fmtWan)}</b></div>
          <div class="stat"><span>营销费用</span><b class="num">${r1(S.biz.budget)}万</b></div>
          <div class="stat"><span>满意度</span><b class="num">${Math.round(S.biz.csat)}</b></div>
          <div class="stat"><span>合规</span><b class="num">${Math.round(S.kpi.comp)}</b></div>
        </div>
        ${tk ? `<div class="task ${S.biz.taskDone?"done":""}">支行临时任务：${esc(tk)}${S.biz.taskDone?"（已办）":""}</div>` : ""}
      </div>
      <div class="box"><h3>本月行动 <em>剩 ${S.ap} 点</em></h3><div class="acts">${acts}</div>
        <div class="endbar"><span class="muted" style="font-size:12px">${S.ap?"行动点没用完也可以结束":""}</span><button class="btn" id="btnEnd">结束本月</button></div></div>
      <div class="box" id="custBox">${UI.custHtml()}</div>
      <div class="box"><h3>员工 <em>岗位可以随时调</em></h3><div class="staffs">${UI.staffHtml()}</div></div>`;
    $("colM").querySelectorAll("[data-act]").forEach(el => el.onclick = () => UI.onAct(el.dataset.act));
    $("btnEnd").onclick = () => { endTurn(); UI.refresh(); };
    UI.bindCust(); UI.bindStaff();
    UI.rollAll();
  },
  custList(){
    const cs = S.biz.cards;
    if(UI.custTab === "due") return cs.filter(c=>c.due===S.m).sort((a,b)=>b.own-a.own);
    if(UI.custTab === "pot") return cs.slice().sort((a,b)=>b.other-a.other).slice(0,12);
    if(UI.custTab === "cmp") return cs.filter(c=>c.complain && S.turn - c.complain <= 6);
    return cs.slice().sort((a,b)=>b.own-a.own);
  },
  custHtml(){
    const tabs = [["due","本月到期"],["pot","高潜力"],["cmp","近期投诉"],["all","全部"]];
    const list = UI.custList();
    const cards = list.map(c => {
      const due = c.due === S.m;
      return `<button class="cc ${due?"due":""} ${c.maint?"done":""}" data-card="${c.id}">
        <span class="rk ${c.risk<=2?"":"hi"}">R${c.risk}</span>
        <b>${c.name}</b> <span class="muted">${CUST_TYPES[c.type].name}</span><br>
        本行 <span class="num">${fmtWan(c.own)}</span> · 他行 <span class="num">${fmtWan(c.other)}</span><br>
        <span class="tag ${c.complain && S.turn-c.complain<=6?"bad":""}">${c.maint?"本月已维护":(due?"本月到期":`${c.due}月到期`)}${c.complain && S.turn-c.complain<=6?" · 投诉过":""}</span>
        <div class="rel"><i style="width:${c.rel}%"></i></div></button>`;
    }).join("") || `<p class="muted" style="grid-column:1/-1">${UI.custTab==="cmp"?"最近没有投诉。":"没有。"}</p>`;
    return `<h3>客户池 <em>点卡片维护，每次1点行动</em></h3>
      <div class="tabsx">${tabs.map(t=>`<button data-ct="${t[0]}" class="${UI.custTab===t[0]?"on":""}">${t[1]}${t[0]==="due"?` (${S.biz.cards.filter(c=>c.due===S.m&&!c.maint).length})`:""}</button>`).join("")}</div>
      <div class="cards">${cards}</div>`;
  },
  bindCust(){
    const box = $("custBox"); if(!box) return;
    box.querySelectorAll("[data-ct]").forEach(el => el.onclick = () => { UI.custTab = el.dataset.ct; box.innerHTML = UI.custHtml(); UI.bindCust(); });
    box.querySelectorAll("[data-card]").forEach(el => el.onclick = () => UI.pickProduct(el.dataset.card));
  },
  staffHtml(){
    return S.staff.map(s => {
      const roles = Object.keys(ROLE_NAME).map(r=>`<option value="${r}" ${s.role===r?"selected":""}>${ROLE_NAME[r]}</option>`).join("");
      return `<div class="sc ${s.off===S.turn?"off":""}" title="${esc(s.note)}">
        <div class="top"><b>${s.name}</b><select data-staff="${s.id}" ${S.phase!=="play"?"disabled":""}>${roles}</select></div>
        <div class="attrs">营销 <b>${s.mk}</b> 业务 <b>${s.op}</b> 合规 <b>${s.cp}</b></div>
        <div class="mini">倦怠<div class="bar"><i class="${s.fatigue>70?"lo":""}" style="width:${s.fatigue}%"></i></div></div>
        <div class="mini">好感<div class="bar"><i class="ok" style="width:${s.fav}%"></i></div></div>
        ${s.off===S.turn?'<small class="muted">本月休假</small>':`<small class="muted">${ROLE_DESC[s.role]}</small>`}
      </div>`;
    }).join("");
  },
  bindStaff(){
    $("colM").querySelectorAll("[data-staff]").forEach(el => el.onchange = () => { setRole(el.dataset.staff, el.value); log("", `${staff(el.dataset.staff).name}调到${ROLE_NAME[el.value]}岗。`); UI.refresh(); });
  },
  renderLog(){
    let html = "", last = null;
    S.log.slice(0, 90).forEach(l => {
      const k = (l.cy||l.y)+"-"+l.m;
      if(k !== last){ html += `<div class="mh">入行第${l.cy || (BALANCE.start.careerYear + l.y - 1)}年 · ${l.m}月</div>`; last = k; }
      html += `<p class="${l.cls||""}">${l.html}</p>`;
    });
    $("colR").innerHTML = `<div class="box log"><h3>日志与消息</h3>${html}</div>`;
  },

  /* ---------- 数字滚动 ---------- */
  rollAll(){
    document.querySelectorAll("[data-roll]").forEach(el => {
      const key = el.dataset.roll, txt = el.textContent;
      const m = txt.match(/-?[\d.]+/); if(!m) return;
      const to = parseFloat(m[0]), from = UI.rolls[key];
      UI.rolls[key] = to;
      if(from == null || from === to) return;
      const dec = (m[0].split(".")[1]||"").length, pre = txt.slice(0, m.index), suf = txt.slice(m.index + m[0].length);
      const t0 = performance.now(), D = 400;
      const step = now => { const k = Math.min(1,(now-t0)/D), v = from + (to-from)*(1-Math.pow(1-k,3)); el.textContent = pre + v.toFixed(dec) + suf; if(k<1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  },

  /* ---------- 行动 ---------- */
  onAct(id){
    if(id === "maintain"){
      UI.custTab = "due"; UI.showTab("colM");
      const box = $("custBox"); box.innerHTML = UI.custHtml(); UI.bindCust();
      box.classList.remove("flash"); void box.offsetWidth; box.classList.add("flash");
      box.scrollIntoView({behavior:"smooth", block:"start"});
      return;
    }
    if(id === "hall"){ doHall(); UI.after(); return; }
    if(id === "rally"){ doRally(); UI.after(); return; }
    if(id === "boss"){ doBoss(); UI.after(); return; }
    if(id === "out"){
      const pc = B1().out.payroll;
      const opts = [
        {t:"去社区", s:"老人多，新客户和存款", odds:ODDS[1].out(), fn:()=>doOut("community")},
        {t:"走商户街", s:"个体户多，收单和信用卡", odds:ODDS[1].out(), fn:()=>doOut("street")},
      ];
      S.biz.prospects.filter(p=>!p.won).forEach(p => opts.push({t:`跑企业代发：${p.name}（${p.staff}人）`, s:`${p.note}${p.tries?` · 已跑${p.tries}回`:""} · 花营销费用${pc.cost}万`, disabled:S.biz.budget<pc.cost, odds:pc.baseP + (staffByRole("cm")[0]?staffByRole("cm")[0].mk:3)*pc.mkP + p.tries*pc.tryP, fn:()=>doOut("payroll", p.id)}));
      opts.push({t:"算了", s:"", cancel:true});
      UI.modal({kind:"pick", title:"外拓", body:"罗建把车钥匙拿在手上，等你说去哪。", opts}, UI.after);
      return;
    }
    if(id === "train"){
      const opts = [];
      S.staff.forEach(s => ["mk","op","cp"].forEach(a => { if(s[a] < B1().train.max) opts.push({t:`${s.name} · ${ATTR_NAME[a]} ${s[a]}→${s[a]+1}`, s:ROLE_NAME[s.role], odds:ODDS[1].train(s), fn:()=>doTrain(s.id,a)}); }));
      opts.push({t:"算了", s:"", cancel:true});
      UI.modal({kind:"pick", title:"带教", body:"带谁，教什么。", opts, compact:true}, UI.after);
    }
  },
  pickProduct(cardId){
    const c = card(cardId);
    if(!canAct("maintain").ok){ UI.toast(canAct("maintain").why); return; }
    if(c.maint){ UI.toast("这位客户本月已经维护过了"); return; }
    const b = B1();
    const opts = PRODUCTS.map(p => {
      const P = b.product[p.id];
      const fee = r2((c.own + c.other*(b.card.pullBase + c.rel*b.card.pullRel)*P.pull) * P.fee + P.feeFix);
      let s = p.tip + (fee ? ` · 中收约${fmtWan(fee)}` : "");
      return {t:p.name, s, odds:ODDS[1].maintain(c, p.id), fn:()=>doMaintain(c.id, p.id)};
    });
    opts.push({t:"算了", s:"", cancel:true});
    const T = CUST_TYPES[c.type];
    UI.modal({kind:"pick", title:c.name,
      body:`${T.name} · 风险测评R${c.risk} · 本行${fmtWan(c.own)} · 他行${fmtWan(c.other)} · ${c.due===S.m?"本月到期":c.due+"月到期"}${c.note?"\n\n"+c.note:""}`, opts}, UI.after);
  },
  after(){ UI.refresh(); },

  /* ---------- 弹窗 ---------- */
  modal(spec, done){
    const m = $("modal");
    let html = `<div class="modal"><h2>${esc(spec.title||"")}</h2>`;
    if(spec.kind === "report"){
      html += `<table class="rtab">${spec.rows.map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num muted">${r[2]}</td></tr>`).join("")}</table>`;
      (spec.ms||[]).forEach(ms => html += `<div class="ms"><b>里程碑 · ${ms.name}</b><br>${ms.ceremony}</div>`);
      if(spec.notes.length) html += `<div class="body">${spec.notes.map(n=>`<p class="muted" style="font-size:14px">${n}</p>`).join("")}</div>`;
      if(spec.quiet) html += `<div class="body"><p class="muted">${spec.quiet}</p></div>`;
    } else if(spec.kind === "kpi"){
      html += `<div class="body">${paras(spec.body)}</div><table class="rtab">${spec.items.map(i=>`<tr><td>${i.name}</td><td class="num">${i.unit==="万"?fmtWan(i.target):i.target+i.unit}</td><td class="num muted">权重${i.w}</td></tr>`).join("")}</table>`;
    } else if(spec.kind === "year"){
      html += `<div class="body">${paras(spec.body)}</div><table class="rtab">${spec.rec.items.map(i=>`<tr><td>${i.name}</td><td class="num">${Math.round(i.done*100)}%</td><td></td></tr>`).join("")}
        <tr><td><b>综合得分</b></td><td class="num"><b>${spec.rec.score.toFixed(1)}</b></td><td class="num">第${spec.rec.rank}名</td></tr></table>`;
    } else {
      html += `<div class="body">${paras(spec.body||"")}</div>`;
    }
    const opts = spec.opts || [{t:"好"}];
    html += `<div class="opts">${opts.map((o,i)=>`<button class="opt" data-i="${i}" ${o.disabled?"disabled":""} ${spec.compact?'style="min-height:40px;padding:6px 12px"':""}><b>${esc(o.t)}${o.odds!=null?oddsChip(o.odds):""}</b>${o.s?`<small>${esc(o.s)}</small>`:""}</button>`).join("")}</div></div>`;
    m.innerHTML = html;
    m.classList.remove("hidden");
    m.scrollTop = 0;
    m.querySelectorAll(".opt").forEach(el => el.onclick = () => {
      const o = opts[+el.dataset.i];
      m.classList.add("hidden"); m.innerHTML = "";
      if(o.fn) o.fn();
      if(done) done();
      UI.refresh();
      const ms = spec.kind!=="report" && S && S.phase==="play" ? checkMilestonesSoft() : [];
      ms.forEach(x => UI.toast(`里程碑 · ${x.name}`));
    });
  },
  toast(txt){
    const t = document.createElement("div"); t.className = "toast"; t.textContent = txt;
    document.body.appendChild(t); setTimeout(()=>t.remove(), 2700);
  },

  /* ---------- 窄屏标签 ---------- */
  showTab(t){
    if(t === "people"){ UI.showPeople(); return; }
    UI.tab = t;
    ["colL","colM","colR"].forEach(id => $(id).classList.toggle("show", id===t));
    document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.t===t));
  },

  /* ---------- 人脉簿 ---------- */
  showPeople(){
    const groups = {};
    S.people.filter(p=>p.met).forEach(p => { (groups[p.lvMet] = groups[p.lvMet] || []).push(p); });
    const lvName = {1:"网点时认识的", 2:"支行时认识的", 3:"万州时认识的", 4:"重庆分行时认识的", 5:"总行时认识的"};
    let html = "";
    Object.keys(groups).sort().forEach(lv => {
      html += `<div class="pgroup">${lvName[lv]}</div><div class="pgrid">` + groups[lv].map(p => `
        <div class="pc"><b>${p.name}</b> <span class="muted">${p.group||""}</span>
          <div class="pos">${p.pos}</div>
          <div class="mini">好感<div class="bar"><i class="ok" style="width:${p.fav}%"></i></div></div>
          <div class="muted" style="margin-top:4px">${esc(p.recent || p.note || "")}</div></div>`).join("") + `</div>`;
    });
    const st = $("stage");
    st.innerHTML = `<div class="inner"><h1>人脉簿</h1>${html}<div class="next"><button class="btn" id="pClose">合上</button></div></div>`;
    st.classList.remove("hidden"); st.scrollTop = 0;
    $("pClose").onclick = () => { st.classList.add("hidden"); if(UI.tab==="people") UI.showTab("colM"); };
  },
  showMenu(){
    UI.modal({kind:"pick", title:"菜单", body:`存档会自动保存。当前随机种子 ${S.seed}。\n\n<small class="muted">屏幕 ${screen.width}×${screen.height} · 可视 ${innerWidth}×${innerHeight} · ${document.documentElement.classList.contains("iosfix")?"桌面模式 "+getComputedStyle(document.documentElement).getPropertyValue("--apph"):"浏览器模式"}</small>`, opts:[
      {t:"切换亮色 / 暗色", s:"", fn:()=>{ const r = document.documentElement; const cur = r.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"); r.dataset.theme = cur==="dark"?"light":"dark"; }},
      {t:"放到桌面", s:"装好以后断网也能玩", fn:()=>INSTALL.show(true)},
      {t:"重新开一局", s:"当前进度会被覆盖", fn:()=>{ clearSave(); UI.start(); }},
      {t:"回到游戏", s:""},
    ]});
  },

  /* ---------- 开局 ---------- */
  start(){
    $("stage").classList.add("hidden"); $("modal").classList.add("hidden");
    $("app").classList.add("hidden");
    const has = (()=>{ try { const r = localStorage.getItem(BALANCE.saveKey); return !!r && JSON.parse(r).ver === BALANCE.ver; } catch(e){ return false; } })();
    const s = $("startScr");
    s.innerHTML = `<div class="start"><h1>银行升职记</h1><div class="sub">泰和银行 · 从网点到总行</div>
      <p class="muted" style="font-size:14px;line-height:1.9">入行第八年，三十岁。<br>你被派到南岸区弹子石网点当负责人。</p>
      <div class="nm"><input id="inSur" maxlength="2" value="李" aria-label="姓"><input id="inGiven" maxlength="2" value="然" aria-label="名"></div>
      <div class="btns">${has?'<button class="btn gold" id="btnCont">继续上次</button>':""}<button class="btn" id="btnNew">${has?"重新开始":"上班"}</button></div>
      <p style="margin-top:18px"><button class="btn ghost" id="btnDex">图鉴</button></p>
      <p class="muted" style="font-size:12px;margin-top:30px">虚构银行，真实地名。离线可玩，自动存档。</p></div>`;
    s.classList.remove("hidden");
    $("btnDex").onclick = () => { s.classList.add("hidden"); UI.showDex(true); };
    if(has) $("btnCont").onclick = () => { if(load()){ s.classList.add("hidden"); UI.resume(); } };
    $("btnNew").onclick = () => {
      const sur = ($("inSur").value||"李").trim().slice(0,2) || "李", given = ($("inGiven").value||"然").trim().slice(0,2) || "然";
      newGame({sur, given}); s.classList.add("hidden"); UI.rolls = {}; save(); UI.refresh();
      job(d => ask(kpiSpec(), d)); runJobs();
    };
  },
  resume(){
    UI.rolls = {};
    if(S.phase === "promo"){ UI.refresh(); JOBS = []; jobBusy = false; job(d => runPromo(d)); job(d => { if(S.phase==="play") advance(); d(); }); runJobs(); return; }
    UI.refresh();
  },
};

/* 弹窗里做了选择以后顺手查一下里程碑(反诈等) */
function checkMilestonesSoft(){ return S.lv===1 ? checkMilestones() : []; }
