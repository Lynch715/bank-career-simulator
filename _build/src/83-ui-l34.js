/* =====================================================================
   L3 万州 / L4 重庆分行 / L5 占位 界面
   ===================================================================== */
SCENES.cqoffice = `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">
  <rect width="520" height="260" fill="var(--paper2)"/>
  <rect x="120" y="16" width="384" height="170" fill="#9fb0ad" stroke="var(--line)" stroke-width="4"/>
  <rect x="124" y="20" width="376" height="70" fill="#c7d0ce"/>
  <g fill="#6d7f7b"><rect x="140" y="54" width="18" height="36"/><rect x="164" y="40" width="14" height="50"/><rect x="186" y="60" width="24" height="30"/><rect x="420" y="46" width="16" height="44"/><rect x="442" y="58" width="22" height="32"/><rect x="470" y="36" width="18" height="54"/></g>
  <path d="M124 90 L300 90 Q330 120 312 182 L124 182Z" fill="#7c9a92"/>
  <path d="M300 90 L500 90 L500 182 L312 182 Q330 120 300 90Z" fill="#a08b5e"/>
  <path d="M300 90 Q330 120 312 182" stroke="#e7dfc9" stroke-width="2" fill="none" opacity=".7"/>
  <line x1="312" y1="16" x2="312" y2="186" stroke="var(--line)" stroke-width="3"/>
  <rect x="16" y="190" width="300" height="16" fill="var(--ink2)"/>
  <rect x="30" y="206" width="12" height="46" fill="var(--ink2)"/><rect x="290" y="206" width="12" height="46" fill="var(--ink2)"/>
  <rect x="70" y="146" width="100" height="44" fill="var(--ink)" rx="3"/>
  <path d="M40 190 L44 160 L56 160 L60 190Z" fill="var(--gold)"/>
  <g fill="#4f7a5a"><ellipse cx="50" cy="150" rx="14" ry="10"/><ellipse cx="40" cy="140" rx="8" ry="10"/><ellipse cx="60" cy="138" rx="8" ry="11"/></g>
</svg>`;
SCENES.hqoffice = `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">
  <rect width="520" height="260" fill="var(--paper2)"/>
  <rect x="140" y="16" width="360" height="170" fill="#b7b9b6" stroke="var(--line)" stroke-width="4"/>
  <g fill="#8d918e"><rect x="150" y="70" width="40" height="110"/><rect x="196" y="50" width="34" height="130"/><rect x="236" y="80" width="46" height="100"/><rect x="290" y="44" width="36" height="136"/><rect x="332" y="66" width="44" height="114"/><rect x="382" y="54" width="30" height="126"/><rect x="418" y="76" width="40" height="104"/><rect x="462" y="60" width="30" height="120"/></g>
  <g stroke="#6f7370" stroke-width="1.5"><line x1="210" y1="50" x2="210" y2="34"/><line x1="306" y1="44" x2="306" y2="26"/><line x1="396" y1="54" x2="396" y2="38"/></g>
  <line x1="320" y1="16" x2="320" y2="186" stroke="var(--line)" stroke-width="3"/>
  <rect x="16" y="190" width="320" height="16" fill="var(--ink2)"/>
  <rect x="30" y="206" width="12" height="46" fill="var(--ink2)"/><rect x="310" y="206" width="12" height="46" fill="var(--ink2)"/>
  <rect x="80" y="146" width="110" height="44" fill="var(--ink)" rx="3"/>
  <rect x="220" y="176" width="64" height="14" fill="var(--card)" stroke="var(--line)"/>
  <rect x="40" y="170" width="18" height="20" rx="3" fill="var(--gold)"/>
</svg>`;

function wzMapSvg(){
  const pos = {laocheng:[225,126], gaotie:[330,121], jiangnan:[262,261], gongye:[428,121], wuqiao:[92,118], changling:[410,256]};
  const dots = S.biz.areas.map(a => {
    const [x,y] = pos[a.id];
    const n = S.biz.branches.filter(b=>b.area===a.id).reduce((s,b)=>s+b.outlets,0) + S.biz.newOutlets.filter(o=>o.area===a.id).length;
    const nn = S.biz.newOutlets.filter(o=>o.area===a.id).length;
    let g = "";
    for(let i=0;i<n;i++){ const cx = x - 30 + (i%6)*12, cy = y + 12 + Math.floor(i/6)*11; g += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${i >= n-nn ? "var(--gold)" : "var(--ink2)"}"/>`; }
    return `<g data-area="${a.id}" style="cursor:pointer">${g}<text x="${x-30}" y="${y}" font-size="12" fill="var(--muted)" font-family="sans-serif">热${Math.round(a.heat)} 争${a.comp}</text></g>`;
  }).join("");
  return SCENES.wzmap.replace("</svg>", dots + "</svg>");
}

Object.assign(UI, {
  renderL3(){
    const b = B3();
    const dep = depTotal(), loans = loansTotalL3(), npl = nplL3();
    const acts = ACTIONS_L3.map(a => { const ck = canActL3(a.id); return `<button class="act" data-act3="${a.id}" ${ck.ok?"":"disabled"} title="${esc(ck.ok?a.desc:ck.why)}"><b>${a.name}${apCostTag(a.id)}${oddsChip(actOdds(a.id))}</b><small>${a.desc}</small></button>`; }).join("");
    const rows = S.biz.branches.map(x => { const m = person(x.mgr), a = area(x.area);
      return `<tr data-branch="${x.id}" tabindex="0"><td>${x.name}<br><small class="muted">${a.name} · ${x.outlets}个网点${x.renov?` · 改造+${Math.round(x.renov*100)}%`:""}</small></td>
        <td>${m?m.name:"—"}<br><small class="muted">能力${m?m.skill:"—"}</small></td><td class="num">${fmtYi1(x.dep)}</td>
        <td class="num ${x.lastInc<0?"neg":""}">${S.track.scoreHistory.length?sgn(Math.round(x.lastInc), fmtYi1):"—"}</td></tr>`; }).join("");
    const newRows = S.biz.newOutlets.map(o => `<tr><td>${area(o.area).name}新网点<br><small class="muted">开了${o.age}个季度</small></td><td>—</td><td class="num">${fmtYi1(o.dep)}</td><td class="num">${o.paid?'<span class="okx">已回本</span>':`<small class="muted">还差${fmtWan(Math.max(0,-o.earned))}</small>`}</td></tr>`).join("");
    const L = S.biz.loans, lt = L.corp+L.micro+L.retail;
    const mix = LOAN_TYPES.map(k => `<div class="mixr"><span>${LOAN_TYPE_NAME[k]}</span><input type="range" min="10" max="70" step="5" value="${Math.round(S.biz.mixTarget[k]*100)}" data-mix="${k}" aria-label="${LOAN_TYPE_NAME[k]}目标占比"><b class="num">${Math.round(S.biz.mixTarget[k]*100)}%</b><small class="muted">现在${Math.round(L[k]/lt*100)}%</small></div>`).join("");
    const cap = disposeCap();
    const npa = S.biz.npa.slice().sort((a,c)=>c.amt-a.amt).slice(0,8).map(x => `<div class="ln"><div class="lh"><b>${x.name}</b><span class="num">${fmtWan(x.amt)}</span></div>
      <div class="lm">${LOAN_TYPE_NAME[x.type]||"对公"} · ${x.origin}${x.stage?` · <span class="gold">${x.stage==="collect"?"催收中":"诉讼中"}</span>`:""}</div>
      ${x.stage?"":`<div class="lb npab"><button class="btn sm ghost" data-npa="${x.id}" data-how="collect" ${S.biz.disposedQ>=cap?"disabled":""}>催收</button><button class="btn sm ghost" data-npa="${x.id}" data-how="sue" ${S.biz.disposedQ>=cap?"disabled":""}>诉讼</button><button class="btn sm ghost" data-npa="${x.id}" data-how="restr" ${S.biz.disposedQ>=cap?"disabled":""}>重组</button><button class="btn sm ghost" data-npa="${x.id}" data-how="writeoff" ${S.biz.disposedQ>=cap || S.biz.writeoffUsed + x.amt > b.dispose.writeoff.quotaY?"disabled":""}>核销</button></div>`}</div>`).join("");
    const tiltName = S.biz.tilt ? LINES_L3.find(l=>l.id===S.biz.tilt).name : "没有";
    $("colM").innerHTML = `
      <div class="box"><h3>万州分行 <em>七个支行 · ${outletCount()}个网点</em></h3>
        <div class="stats">
          <div class="stat"><span>存款</span><b class="num">${fmtYi1(dep)}</b></div>
          <div class="stat"><span>贷款</span><b class="num">${fmtYi1(loans)}</b></div>
          <div class="stat"><span>不良率</span><b class="num">${(npl/loans*100).toFixed(2)}%</b></div>
          <div class="stat"><span>网点效能</span><b class="num">${effL3().toFixed(1)}亿</b></div>
          <div class="stat"><span>发展费用</span><b class="num">${Math.round(S.biz.budget)}万</b></div>
        </div></div>
      <div class="box"><h3>本季行动 <em>剩 ${S.ap} 点 · 处置不良、调信贷结构不占行动点</em></h3><div class="acts">${acts}</div>
        <div class="endbar"><span class="muted" style="font-size:12px">资源倾斜：${tiltName}</span><button class="btn" id="btnEnd">结束本季</button></div></div>
      <div class="box"><h3>片区 <em>点片区开网点</em></h3><div class="scene" id="l3map">${wzMapSvg()}</div>
        <p class="hint" style="margin-top:8px">深色点是支行网点，金色是你开的新网点。热度高、竞争少的片区，新网点长得快。</p></div>
      <div class="box"><h3>支行 <em>点一行改造、换人、撤网点</em></h3><div class="tscroll"><table class="l2t"><tr><th>支行</th><th>行长</th><th>存款</th><th>上季</th></tr>${rows}${newRows}</table></div></div>
      <div class="box"><h3>信贷结构 <em>每季最多挪五个点 · 额度还剩${fmtYi1(Math.max(0, S.biz.quota - (loansTotalL3()-L.platform)))}</em></h3>${mix}
        <p class="hint">小微息差最高，不良也最高。平台贷款${L.platform?fmtYi1(L.platform):"没有"}，不占额度。</p></div>
      <div class="box"><h3>不良处置 <em>本季还能处置${Math.max(0,cap-S.biz.disposedQ)}户 · 今年核销额度还剩${fmtYi1(b.dispose.writeoff.quotaY - S.biz.writeoffUsed)}</em></h3>
        <p class="hint">催收：两个季度收回三成。诉讼：四个季度收回五成，可能上论坛。重组：马上出表，四成会再违约。核销：马上出表，吃额度。</p><div class="lq">${npa || '<p class="muted">没有不良。</p>'}</div></div>`;
    $("colM").querySelectorAll("[data-act3]").forEach(el => el.onclick = () => UI.onAct3(el.dataset.act3));
    $("colM").querySelectorAll("[data-branch]").forEach(el => el.onclick = () => UI.branchModal(el.dataset.branch));
    $("colM").querySelectorAll("[data-area]").forEach(el => el.onclick = () => UI.areaModal(el.dataset.area));
    $("colM").querySelectorAll("[data-npa]").forEach(el => el.onclick = () => { disposeNpa(el.dataset.npa, el.dataset.how); UI.refresh(); });
    $("colM").querySelectorAll("[data-mix]").forEach(el => el.onchange = () => {
      const v = {}; $("colM").querySelectorAll("[data-mix]").forEach(r => v[r.dataset.mix] = +r.value); setMix(v.corp, v.micro, v.retail); UI.refresh(); });
    $("btnEnd").onclick = () => { endTurn(); UI.refresh(); };
  },
  onAct3(id){
    if(id==="open"){ UI.pickArea(); return; }
    if(id==="reportup"){ doReportUpL3(); UI.refresh(); return; }
    if(id==="platform"){ const off = doPlatform(); if(off) UI.platformModal(); UI.refresh(); return; }
    if(id==="tilt"){
      const opts = LINES_L3.map(l => { const h = person(S.biz.lineHeads[l.id]); return {t:`${l.name}${S.biz.tilt===l.id?"（现在）":""}`, s:`${l.desc}${h?" · 负责人"+h.name:""}`, disabled:S.biz.tilt===l.id, fn:()=>doTilt(l.id)}; });
      opts.push({t:"算了", s:""});
      UI.modal({kind:"pick", title:"资源往哪条线偏", body:"偏了一条，另外几条的老总心里有数。", opts}); return;
    }
    const opts = S.biz.branches.filter(x => (id!=="close" || x.outlets>1) && (id!=="squat" || !x.squat)).map(x => { const m = person(x.mgr); return {t:`${x.name} · ${m?m.name:""}`, s:`${area(x.area).name} · ${x.outlets}个网点 · ${fmtYi1(x.dep)}`, odds: id==="squat" ? ODDS[3].squat(x) : undefined, fn:()=> id==="close" ? doCloseOutlet(x.id) : (id==="renovate" ? doRenovate(x.id) : (id==="squat" ? doSquatL3(x.id) : setTimeout(()=>UI.appointModalL3(x.id),0)))}; });
    opts.push({t:"算了", s:""});
    UI.modal({kind:"pick", title:{close:"撤哪个支行的网点",renovate:"改造哪个支行",appoint:"换哪个支行的行长",squat:"去哪个支行蹲点"}[id], body:"", opts});
  },
  pickArea(){
    const opts = S.biz.areas.map(a => ({t:`${a.name}`, s:`人口${a.pop}万 · 热度${Math.round(a.heat)} · 竞争${a.comp} · ${a.note}`, odds:ODDS[3].open(a), fn:()=>doOpenOutlet(a.id)}));
    opts.push({t:"算了", s:""});
    UI.modal({kind:"pick", title:"新网点开在哪", body:`投入${B3().outlet.build}万，一年费用${B3().outlet.costY}万。`, opts});
  },
  areaModal(aid){
    const a = area(aid);
    UI.modal({kind:"pick", title:a.name, body:`${a.note}\n\n人口${a.pop}万，热度${Math.round(a.heat)}，同业竞争${a.comp}，口碑${Math.round(a.rep)}。`, opts:[
      {t:"在这里开网点", s:`${B3().outlet.build}万 · ${apCost("open")}点行动`, disabled:!canActL3("open").ok, fn:()=>doOpenOutlet(aid)}, {t:"关掉", s:""}]});
  },
  branchModal(bid){
    const x = branch(bid), m = person(x.mgr);
    UI.modal({kind:"pick", title:x.name, body:`${m?`行长${m.name}，能力${m.skill}。${m.note||""}`:""}\n\n存款${fmtYi1(x.dep)}，${x.outlets}个网点。`, opts:[
      {t:"下去蹲点", s:"1点行动 · 这季存款长得快一点", odds:ODDS[3].squat(x), disabled:!canActL3("squat").ok || x.squat, fn:()=>doSquatL3(bid)},
      {t:"网点改造", s:`${B3().renovate.cost}万 · 1点行动`, disabled:!canActL3("renovate").ok || x.renov>=0.3, fn:()=>doRenovate(bid)},
      {t:"撤一个网点", s:"1点行动 · 片区口碑掉", disabled:!canActL3("close").ok || x.outlets<=1, fn:()=>doCloseOutlet(bid)},
      {t:"换行长", s:"1点行动", disabled:!canActL3("appoint").ok, fn:()=>setTimeout(()=>UI.appointModalL3(bid),0)},
      {t:"关掉", s:""}]});
  },
  appointModalL3(bid){
    const x = branch(bid), cur = person(x.mgr);
    const cands = appointCandsL3(bid).sort((a,c)=>c.skill-a.skill);
    const opts = cands.map(p => ({t:`${p.name} · 能力${p.skill}`, s:`${p.pos}${p.lvMet<3?" · 老部下":""}`, fn:()=>doAppointL3(bid, p.id)}));
    if(!opts.length) opts.push({t:"没有合适的人", s:"", disabled:true});
    opts.push({t:"算了", s:""});
    UI.modal({kind:"pick", title:`${x.name}换行长`, body: cur ? `现在是${cur.name}，能力${cur.skill}。` : "", opts});
  },
  platformModal(){
    const off = S.biz.platformOffer; if(!off) return;
    const pf = PLATFORMS_L3.find(p=>p.id===off.id);
    UI.modal({kind:"event", title:"区里的项目", body:`区财政局的人带着${pf.name}的材料来了。${pf.what}，要${fmtYi1(off.size)}。\n\n${pf.note}\n\n「区里会全力支持，」对方把一份没盖章的情况说明推过来，「还款的事，您放心。」`, opts:[
      {t:"「做。」", s:`贷款+${fmtYi1(off.size)} · 不占额度 · 息差薄 · 留底`, gray:true, fn:()=>decidePlatform(true)},
      {t:"「这个方案我们做不了。」", s:"区里不太高兴", fn:()=>decidePlatform(false)},
    ]});
  },

  renderL4(){
    const dep = depTotalL4(), loans = loansL4(), npl = nplL4();
    const acts = ACTIONS_L4.map(a => { const ck = canActL4(a.id); return `<button class="act" data-act4="${a.id}" ${ck.ok?"":"disabled"} title="${esc(ck.ok?a.desc:ck.why)}"><b>${a.name}${apCostTag(a.id)}${oddsChip(actOdds(a.id))}</b><small>${a.desc}</small></button>`; }).join("");
    const rows = S.biz.inst.map(x => `<tr class="${x.mine?"mine":""}" ${x.mine==="l3"?'id="l4wz"':""}><td>${x.name}${x.mine?' <small class="muted">你待过</small>':""}${x.focus?' <small class="tagx">倾斜</small>':""}</td>
      <td>${x.headName}</td><td class="num">${fmtYi0(x.dep)}</td><td class="num">${fmtYi0(x.loans)}</td><td class="num ${x.npl/x.loans>0.02?"neg":""}">${(x.npl/x.loans*100).toFixed(2)}%</td></tr>`).join("");
    const deps = S.biz.deputies.map(d => { const p = person(d.id), ln = LINES_L4.find(l=>l.id===d.line).name;
      return `<div class="sc"><div class="top"><b>${d.name}</b><span class="muted">分管${ln}</span></div>
        <div class="attrs fitrow">${LINES_L4.map(l=>`<span class="${d.line===l.id?"cur":""}">${l.name}<b>${d.fit[l.id]}</b></span>`).join("")}</div>
        <div class="mini">好感<div class="bar"><i class="ok" style="width:${p.fav}%"></i></div></div><small class="muted">${esc(p.note||"")}</small></div>`; }).join("");
    const act = S.biz.projects.filter(p=>!p.done), done = S.biz.projects.filter(p=>p.done);
    const pj = act.map(p => { const s = STRAT_L4.find(x=>x.id===p.id); return `<div class="pj tier-mid"><b>${s.name}</b><small>${s.what}</small><div class="dots">${Array.from({length:s.q},(_,i)=>`<i class="${i<p.prog?"on":""}"></i>`).join("")}</div><small class="muted">占资本${fmtYi0(s.rwa)}</small></div>`; }).join("")
      + done.map(p => `<div class="pj tier-low"><b>${STRAT_L4.find(x=>x.id===p.id).name}</b><small class="okx">已落地</small></div>`).join("");
    const room = capRoom();
    $("colM").innerHTML = `
      <div class="box"><h3>重庆分行 <em>十二个二级机构</em></h3>
        <div class="stats">
          <div class="stat"><span>存款</span><b class="num">${fmtBai(dep)}</b></div>
          <div class="stat"><span>贷款</span><b class="num">${fmtBai(loans)}</b></div>
          <div class="stat"><span>不良率</span><b class="num">${(npl/loans*100).toFixed(2)}%</b></div>
          <div class="stat"><span>资本空间</span><b class="num ${room<100000?"neg":""}">${fmtYi0(Math.max(0,room))}</b></div>
          <div class="stat"><span>监管评级</span><b class="num">${Math.round(ratingNow())}级</b></div>
        </div></div>
      <div class="box"><h3>本季行动 <em>剩 ${S.ap} 点</em></h3><div class="acts">${acts}</div>
        <div class="endbar"><span class="muted" style="font-size:12px">班子团结度 ${Math.round(S.biz.unity)}</span><button class="btn" id="btnEnd">结束本季</button></div></div>
      <div class="box"><h3>班子 <em>分管对口，条线才转得动</em></h3><div class="staffs">${deps}</div></div>
      <div class="box"><h3>二级机构</h3><div class="tscroll"><table class="l2t"><tr><th>机构</th><th>负责人</th><th>存款</th><th>贷款</th><th>不良率</th></tr>${rows}</table></div></div>
      <div class="box"><h3>战略项目 <em>最多同时三个 · 还能启动${S.biz.projQueue.length}个</em></h3><div class="lq">${pj || '<p class="muted">还没有启动项目。</p>'}</div></div>`;
    $("colM").querySelectorAll("[data-act4]").forEach(el => el.onclick = () => UI.onAct4(el.dataset.act4));
    $("btnEnd").onclick = () => { endTurn(); UI.refresh(); };
  },
  onAct4(id){
    if(id==="quota"){ doQuota(); UI.refresh(); return; }
    if(id==="regulator"){ doRegulator(); UI.refresh(); return; }
    if(id==="swap"){
      const opts = [];
      S.biz.deputies.forEach((x,i) => S.biz.deputies.forEach((y,j) => { if(j<=i) return;
        const nm = l => LINES_L4.find(z=>z.id===l).name;
        const gain = (x.fit[y.line]+y.fit[x.line]) - (x.fit[x.line]+y.fit[y.line]);
        opts.push({t:`${x.name}↔${y.name}`, s:`${x.name}改管${nm(y.line)}，${y.name}改管${nm(x.line)} · 对口${gain>=0?"+":""}${gain}`, fn:()=>doSwap(x.id,y.id)}); }));
      opts.push({t:"算了", s:""});
      UI.modal({kind:"pick", title:"调整分工", body:"数字是两个人对新条线的熟悉程度，加起来比原来多还是少。调分工会伤一点团结。", opts, compact:true}); return;
    }
    if(id==="talk"){
      const opts = S.biz.deputies.map(d => ({t:d.name, s:`好感${person(d.id).fav}`, odds:ODDS[4].talk(d.id), fn:()=>doTalk(d.id)})); opts.push({t:"算了", s:""});
      UI.modal({kind:"pick", title:"找谁谈", body:"", opts}); return;
    }
    if(id==="startp"){
      const opts = S.biz.projQueue.map(pid => { const s = STRAT_L4.find(x=>x.id===pid); return {t:s.name, s:`${s.what} · ${s.q}个季度 · 占资本${fmtYi0(s.rwa)} · 规模+${fmtYi0(s.scale)}`, disabled: capRoom() < s.rwa, fn:()=>doStartProj(pid)}; });
      opts.push({t:"算了", s:""});
      UI.modal({kind:"pick", title:"启动哪个项目", body:"", opts}); return;
    }
    if(id==="pushp"){
      const opts = S.biz.projects.filter(p=>!p.done).map(p => { const s = STRAT_L4.find(x=>x.id===p.id); return {t:s.name, s:`进度${p.prog}/${s.q}`, fn:()=>doPushProj(p.id)}; });
      opts.push({t:"算了", s:""});
      UI.modal({kind:"pick", title:"推哪个项目", body:"", opts}); return;
    }
    if(id==="focus"){
      const opts = S.biz.inst.map(x => ({t:x.name, s:`${x.headName} · 存款${fmtYi0(x.dep)}${x.focus?" · 现在":""}`, fn:()=>doFocus(x.id)}));
      opts.push({t:"算了", s:""});
      UI.modal({kind:"pick", title:"今年往哪偏", body:"被倾斜的机构长得快一截，其他负责人会有想法。", opts, compact:true});
    }
  },

});
