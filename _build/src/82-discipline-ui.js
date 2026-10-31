Object.assign(UI,{
  renderDiscipline(){
    const d=S.discipline; if(!d || !d.history.length)return;
    const active=disciplineBlocked(), last=d.history[d.history.length-1], review=reinstatementState();
    const assessment=review?reinstatementAssessment():null;
    const reviewHtml=review?`<p><b>复任目标：${LV_TITLE[review.target]}</b> · ${review.nextAt>S.monthAbs?"最早"+Math.ceil(review.nextAt-S.monthAbs)+"个月后期末复核":"本期期末复核"}</p><p class="hint">复核综合分${assessment.score}/${BALANCE.discipline.returnScore}；业绩≥${BALANCE.discipline.returnPerf}，信任≥${BALANCE.discipline.returnTrust}，合规≥${BALANCE.discipline.returnComp}，连续${BALANCE.discipline.returnCleanMonths}个月合规达标。通过后直接复任；未通过${BALANCE.discipline.returnRetryMonths}个月后再评，${BALANCE.retireAge}岁到龄离岗。</p>${review.last&&!review.last.pass?`<p class="hint">上次暂缓：${esc(review.last.reasons.join("；"))}</p>`:""}`:"";
    const names={warning:"警告",probation:"考察期",demote:"降职后考察",remove:"撤职整改",dismiss:"职业终结"};
    const tasks=Object.entries(d.tasks).map(([id,n])=>`<button class="btn sm ghost" data-rectify="${id}" ${n>=1||S.ap<1||d.lastTaskAt===S.monthAbs||S.phase!=="play"?"disabled":""}>${{training:"合规培训",review:"档案复核",repair:"客户善后"}[id]}${n>=1?" · 已完成":" · 1点"}</button>`).join(" ");
    const panel=document.createElement("div");panel.className="box";panel.id="disciplinePanel";
    panel.innerHTML=`<h3>${active?names[last.kind]:"处分与整改记录"}<em>${active?"暂停晋升":review?"等待复任复核":"已恢复任职与晋升资格"}</em></h3><p>${esc(last.reason)}</p><p class="hint">${active?`考察至少还需${Math.max(0,d.until-S.monthAbs)}个月，每期可完成一项整改。期限届满且任务全部完成后恢复资格。`:"整改已完成，历史风险及处分记录仍保留。"}</p>${active?`<div class="lb">${tasks}</div>`:""}${reviewHtml}<button class="btn sm ghost" data-discipline-history>查看处分记录（${d.history.length}次）</button>`;
    $("colM").prepend(panel);
    panel.querySelectorAll("[data-rectify]").forEach(el=>el.onclick=()=>{doDisciplineTask(el.dataset.rectify);UI.refresh();});
    panel.querySelector("[data-discipline-history]").onclick=()=>UI.modal({title:"处分记录",body:d.history.map(h=>`${h.age}岁 · ${LV_TITLE[h.lv]} · ${{warning:"警告",probation:"考察",demote:"降职",remove:"撤职",dismiss:"职业终结"}[h.kind]}\n${h.reason}${h.reinstatedAt?"\n"+h.reinstatedAt.age+"岁，已复任"+LV_TITLE[h.reinstatedAt.lv]:""}`).join("\n\n"),opts:[{t:"关闭"}]});
  }
});
