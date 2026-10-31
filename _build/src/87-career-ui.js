/* 职务经营台账：沿用纸墨配色、原生弹窗与移动导航。 */
Object.assign(UI, {
  careerTab:'projects',
  careerPeopleScope:'current',careerPeopleQuery:'',
  careerRun(fn){
    const result=fn();
    if(!result)UI.toast('条件已变化，请查看行动点、费用与人员状态');
    UI.refresh();
  },
  careerOption(t,s,fn,why){return {t,s:why||s,disabled:!!why,fn:()=>UI.careerRun(fn)};},
  careerPick(title,body,opts){
    UI.modal({kind:'pick',title,body,opts:opts.concat([{t:'返回',s:'保留当前安排'}]),compact:opts.length>7});
  },
  renderCareer(){
    if(!S || S.phase!=='play')return;
    const g=careerEnsure();
    const panel=document.createElement('section');panel.className='box career-ui';panel.id='careerPanel';
    const tabs=[['projects','经营项目'],['people','干部人才'],['council',S.lv>=4?'班子议事':'团队议事']];
    const period=S.lv<=2?'本月':S.lv<=4?'本季':'这半年';
    panel.innerHTML=`<h3>${CAREER_NAMES[S.lv]}<em>${period} · 协调度 ${Math.round(g.coord)}${S.lv===5?' · 董事会支持 '+Math.round(g.board):''}</em></h3>
      <div class="career-tabs" role="tablist" aria-label="职务经营">${tabs.map(([id,name])=>`<button type="button" role="tab" aria-selected="${UI.careerTab===id}" data-ctab="${id}" class="${UI.careerTab===id?'on':''}">${name}${id==='council'&&g.council?' · 待议':''}</button>`).join('')}</div>
      <div id="careerContent"></div>`;
    const col=$('colM'),anchor=col.querySelector('.box');
    if(anchor)anchor.after(panel);else col.append(panel);
    const content=panel.querySelector('#careerContent');
    if(UI.careerTab==='people')UI.careerPeoplePanel(content);
    else if(UI.careerTab==='council')UI.careerCouncilPanel(content);
    else UI.careerProjectsPanel(content);
    panel.querySelectorAll('[data-ctab]').forEach(el=>{
      el.onclick=()=>{UI.careerTab=el.dataset.ctab;UI.refresh();};
      el.onkeydown=event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const at=tabs.findIndex(x=>x[0]===UI.careerTab);
        const i=event.key==='Home'?0:event.key==='End'?tabs.length-1:(at+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
        UI.careerTab=tabs[i][0];UI.refresh();document.querySelector(`[data-ctab="${UI.careerTab}"]`).focus();
      };
    });
  },
  careerProjectsPanel(node){
    const g=careerEnsure(),active=careerActive(),plan=BC().plans.find(x=>x.id===g.plan),style=BC().styles.find(x=>x.id===g.style);
    const used=g.projects.map(p=>p.id),available=CAREER_PROJECTS.filter(d=>d.lv===S.lv&&!used.includes(d.id));
    node.innerHTML=`<p class="hint">${S.lv===1?(style?'经营特色：'+style.name:'先确定网点特色，再安排员工与项目。'):(plan?'年度方向：'+plan.name:'制定年度方向，给三个经营单位分配专项资源。')}项目需明确方案，回合结束后按执行条件推进。</p>
      <div class="career-toolbar"><button class="btn ghost" id="careerPlan">${S.lv===1?'网点特色':'年度经营安排'}</button><button class="btn" id="careerNew" ${!available.length||!careerCheck(0).ok||active.length>=BC().maxActive[S.lv]?'disabled':''}>启动新项目 · 1点</button>${S.lv===5?'<button class="btn ghost" id="careerALM">资产负债安排</button>':''}<span class="muted">在建 ${active.length}/${BC().maxActive[S.lv]}</span></div>
      ${S.lv===5?`<p class="hint">期限策略：${BC().alm.find(x=>x.id===g.alm.policy).name} · 流动性指数 ${Math.round(g.alm.liquidity)}/100 · 低于${BC().liquidityFloor}会产生应急资金成本</p>`:''}
      ${g.alloc.length?`<p class="hint">专项资源：${g.alloc.map((id,i)=>esc(careerUnits().find(x=>x.id===id)?.name||id)+' '+BC().allocation[S.lv][i]+'%').join(' · ')}</p>`:''}
      <div class="career-projects">${g.projects.map(p=>{
        const d=careerProjectDef(p.id);if(!d)return '';
        const leader=person(p.lead),e=careerExecution(p),stage=CAREER_STAGES[S.lv];
        return `<article class="career-project"><div class="career-title"><b>${esc(d.name)}</b><span class="tagx">${p.status==='done'?'持续经营':p.status==='withdrawn'?'已终止':esc(stage[p.stage])}</span></div>
          <p>${esc(d.what)}</p><p class="hint">牵头：${esc(leader?.name||'待委任')} · ${p.units.map(id=>esc(careerUnits().find(x=>x.id===id)?.name||id)).join(' / ')}</p>
          <div class="career-progress" aria-label="项目进度"><span style="width:${Math.min(100,p.stage/stage.length*100)}%"></span></div>
          <p class="hint">${p.status==='active'?`执行 ${e.score}/${BC().executeMin} · ${esc(p.dispute?'协办争议待协调':p.stage===1&&!p.choice?'等待选择实施方案':e.why)}`:p.status==='done'?`每期预计收入 ${fmtWan(d.fee*p.yield)} · 累计后续收入 ${fmtWan(p.earned)}`:'已释放额度，前期费用不退'}</p>
          ${p.partner?`<p class="hint">协办协调：${esc(person(p.partner)?.name||'待安排')} · 双方合作 ${Math.round(careerLink(p.lead,p.partner))}/100</p>`:''}
          ${p.rival?`<p class="hint">${esc(p.rival.name)} · 方案${p.rival.score}分 · 客户偏重${{price:'报价',service:'服务',select:'适合的覆盖范围'}[p.rival.need]}${p.rival.resolved?' · 竞标已结束':''}</p>`:''}
          ${p.status==='active'?`<div class="career-toolbar"><button class="btn ghost" data-cproject="${p.id}">管理项目</button>${p.stage===1&&!p.choice?`<button class="btn gold" data-cchoice="${p.id}">确定实施方案</button>`:''}${p.dispute?`<button class="btn gold" data-cresolve="${p.id}" ${careerCheck(0).ok?'':'disabled'}>协调争议 · 1点</button>`:''}</div>`:''}</article>`;
      }).join('')||'<p class="career-empty">本任期还没有新项目。选择牵头人和承办单位后即可启动；以前的经营操作仍在下方。</p>'}</div>
      ${!available.length?'<p class="hint">本任期项目已全部启动，落地项目会继续经营。</p>':''}
      ${!careerCheck(0).ok?'<p class="hint">行动点用完了，可以结束回合，查看项目进展。</p>':''}`;
    node.querySelector('#careerPlan').onclick=()=>UI.careerPlanModal();
    node.querySelector('#careerNew').onclick=()=>UI.careerNewModal();
    if(node.querySelector('#careerALM'))node.querySelector('#careerALM').onclick=()=>UI.careerALMModal();
    node.querySelectorAll('[data-cproject]').forEach(el=>el.onclick=()=>UI.careerProjectModal(el.dataset.cproject));
    node.querySelectorAll('[data-cchoice]').forEach(el=>el.onclick=()=>UI.careerChoiceModal(el.dataset.cchoice));
    node.querySelectorAll('[data-cresolve]').forEach(el=>el.onclick=()=>UI.careerRun(()=>careerPush(el.dataset.cresolve,'resolve')));
  },
  careerPeoplePanel(node){
    const all=careerPeople(),slots=careerPositions(),current=new Set(subordinates().map(p=>p.id).concat(slots.map(p=>p.pid)));
    const query=UI.careerPeopleQuery.trim();
    const people=all.filter(p=>(UI.careerPeopleScope==='all'||(UI.careerPeopleScope==='current'?current.has(p.id):!current.has(p.id)))&&(!query||(p.name+' '+p.pos).includes(query)));
    node.innerHTML=`<p class="hint">${CAREER_MANAGEMENT[S.lv].desc}候选人按现任职务与履历筛选，新任干部须先考察。${S.lv>=3?'基层旧部仍可在人脉簿查看。':'培养记录与贡献会跨职务保留。'}</p>
      ${slots.length?'<div class="career-toolbar"><button class="btn" id="careerAppoint">干部任用 · 1点</button></div>':''}
      <div class="career-toolbar">${[['current','当前管理'],['reserve',S.lv>=3?'本级后备':'旧部后备'],['all',S.lv>=3?'本级全部':'全部']].map(([id,name])=>`<button class="btn ghost" data-cscope="${id}" aria-pressed="${UI.careerPeopleScope===id}">${name}</button>`).join('')}<label class="career-search">搜索干部<input id="careerSearch" type="search" aria-label="搜索干部" placeholder="姓名或岗位"></label></div><p class="hint">当前显示${people.length}人</p>
      <div class="career-people">${people.map(p=>{
        const r=careerRecord(p.id),line=CAREER_LINES.find(x=>x.id===r.specialty),load=careerLoad(p.id);
        return `<article class="career-person">${PORTRAITS.markup(p,'tiny')}<div><b>${esc(p.name)}</b><p class="hint">${esc(p.pos||p.role||'后备干部')}</p><p>能力 ${Math.round(careerSkill(p))} · 关系 ${Math.round(p.fav)} · 贡献 ${Math.round(r.merit)}</p><p class="hint">${r.training?`培养中 · 还需${r.training.left}回合`:line?line.name+'专长':'尚无专项培养'} · ${r.assessedUntil>=S.monthAbs?'考察有效':'待考察'}${load?' · 牵头'+load+'项':''}${r.probation?' · 履职观察中':''}</p><button class="btn ghost" data-cperson="${p.id}">培养与谈话</button></div></article>`;
      }).join('')||'<p class="career-empty">没有符合条件的干部，可以切换范围或修改搜索。</p>'}</div>`;
    if(node.querySelector('#careerAppoint'))node.querySelector('#careerAppoint').onclick=()=>UI.careerAppointModal();
    node.querySelectorAll('[data-cscope]').forEach(el=>el.onclick=()=>{UI.careerPeopleScope=el.dataset.cscope;UI.careerPeoplePanel(node);PORTRAITS.bind(node);});
    const search=node.querySelector('#careerSearch');search.value=UI.careerPeopleQuery;
    search.oninput=()=>{const pos=search.selectionStart;UI.careerPeopleQuery=search.value;UI.careerPeoplePanel(node);const input=node.querySelector('#careerSearch');input.focus();input.setSelectionRange(pos,pos);PORTRAITS.bind(node);};
    node.querySelectorAll('[data-cperson]').forEach(el=>el.onclick=()=>UI.careerPersonModal(el.dataset.cperson));
  },
  careerCouncilPanel(node){
    const g=careerEnsure(),issue=g.council,def=issue&&CAREER_COUNCIL.find(x=>x.id===issue.id);
    node.innerHTML=`<p class="hint">协调度影响项目执行${S.lv===4?'与班子团结':''}。${S.lv===5?'董事会支持不足时，新战略工程暂缓立项。':''}资源分配、工作分工和贡献认定会定期提交议事。</p>
      ${def?`<article class="career-project"><b>${esc(def.title)}</b>${issue.lead?`<p class="hint">涉及：${esc(person(issue.lead)?.name||'牵头团队')}${issue.partner?'、'+esc(person(issue.partner)?.name||'协办团队'):''}${issue.project?' · '+esc(careerProjectDef(issue.project)?.name||'任内项目'):''}</p>`:''}<p>${esc(def.body)}</p><button class="btn gold" id="careerCouncil">处理待议事项</button></article>`:'<p class="career-empty">当前没有待议事项。可以找干部谈工作、认可贡献或复盘短板。</p>'}
      <div class="career-toolbar"><button class="btn ghost" id="careerTeam">找人谈工作</button></div>`;
    if(def)node.querySelector('#careerCouncil').onclick=()=>UI.careerCouncilModal();
    node.querySelector('#careerTeam').onclick=()=>UI.careerPick('找谁谈工作','同一人谈话后需要间隔一段时间。',careerPeople().map(p=>({t:p.name,s:p.pos,fn:()=>UI.careerPersonModal(p.id)})));
  },
  careerPersonModal(id){
    if(!careerPeople().some(p=>p.id===id)){UI.careerPick('不属本级干部管理范围','该人员仍保留在人脉簿中；培养与任用由其所属机构办理。',[]);return;}
    const p=person(id),r=careerRecord(id),cost=BC().trainCost[S.lv],ck=careerCheck(0);
    const links=Object.entries(S.cadreRelations||{}).filter(([key])=>key.split('|').includes(id)).map(([key,value])=>{const other=person(key.split('|').find(x=>x!==id));return other?other.name+' '+Math.round(value)+'/100':'';}).filter(Boolean);
    UI.careerPick(p.name+' · 培养与谈话',`能力${Math.round(careerSkill(p))}，与你的关系${Math.round(p.fav)}。${r.training?'正在参加专项培养。':'专项培养费用 '+fmtWan(cost)+'，需'+BC().trainTurns[S.lv]+'回合。'}${links.length?'\n\n同事合作：'+links.join('；'):''}`, [
      {t:'安排专项培养',s:'选择公司、零售、风险或运营方向',disabled:!!r.training||!careerCheck(cost).ok,fn:()=>UI.careerPick('培养方向','培养结束后提高能力，对口专业有利于执行项目。',CAREER_LINES.map(l=>UI.careerOption(l.name,`费用${fmtWan(cost)} · 1点行动`,()=>careerTrain(id,l.id))))},
      UI.careerOption('履职考察',`费用${fmtWan(BC().assessCost[S.lv])} · 1点行动 · 有效${BC().assessMonths[S.lv]}个月`,()=>careerAssess(id),r.assessedUntil>=S.monthAbs?'已有有效考察记录':!careerCheck(BC().assessCost[S.lv]).ok?careerCheck(BC().assessCost[S.lv]).why:''),
      ...[['work','明确工作分工','协调度提高，关系改善'],['credit','按贡献记功','认可工作，增加履职贡献'],['coach','复盘与指导','补充考察，积累培养记录']].map(([mode,name,desc])=>UI.careerOption(name,desc+' · 1点行动',()=>careerTalk(id,mode),!ck.ok?ck.why:S.monthAbs-r.lastTalk<BC().talkMonths?'近期已谈过，需间隔'+BC().talkMonths+'个月':'')),
      {t:'查看培养与任用记录',s:`已记录${r.history.length}项`,fn:()=>UI.careerPick(p.name+' · 履职记录',r.history.length?r.history.slice(-12).map(h=>`第${h.lv}级任内 · ${h.type==='training'?'完成'+CAREER_LINES.find(l=>l.id===h.line).name+'培养':h.type==='assess'?'完成考察，能力'+h.skill:h.type==='appoint'?'任用为'+h.post:h.post+'观察评价：'+(h.outcome||'已归档')}`).join('\n\n'):'尚无记录。',[])},
    ]);
  },
  careerALMModal(){
    const a=careerEnsure().alm;
    UI.careerPick('资产负债安排',`流动性指数${Math.round(a.liquidity)}，低于${BC().liquidityFloor}会增加应急资金成本。每半年最多调整一次。`,BC().alm.map(o=>UI.careerOption(o.name,o.desc+' · 1点行动',()=>careerALM(o.id),a.policy===o.id?'当前策略':a.changedAt===S.monthAbs?'本半年已调整':!careerCheck(0).ok?careerCheck(0).why:'')));
  },
  careerAppointModal(){
    UI.careerPick('调整哪个岗位',CAREER_MANAGEMENT[S.lv].desc+'新任人选须有有效考察记录；现任其他岗位的干部不可同时占两个岗位。',careerPositions().map(slot=>({t:slot.name,s:'现任：'+(person(slot.pid)?.name||'待选'),fn:()=>{
      const candidates=careerAvailable(slot.id);
      UI.careerPick('任用 · '+slot.name,candidates.length?'候选人职务与履历符合本岗位范围，任用后进入履职观察。':'暂无符合本岗位职务和履历要求的可调配人选。基层旧部可在人脉簿查看。',candidates.map(p=>{
        const r=careerRecord(p.id),why=!careerCheck(0).ok?careerCheck(0).why:r.training?'正在专项培养':r.assessedUntil<S.monthAbs?'请先到干部人才中完成履职考察':'';
        const option=UI.careerOption(p.name,'',()=>careerAppoint(slot.id,p.id),why);
        option.s=`${p.pos} · ${why||`能力${Math.round(careerSkill(p))} · 关系${Math.round(p.fav)} · 对口${Math.round(careerFit(p,slot.line))}`}`;
        return option;
      }));
    }})));
  },
  careerPlanModal(){
    const g=careerEnsure(),wait=BC().planMonths-(S.monthAbs-g.planAt);
    if(S.lv===1){
      UI.careerPick('网点经营特色','选择后执行一年，现有客群决定经营收益。',BC().styles.map(x=>UI.careerOption(x.name,x.desc+' · 1点行动',()=>careerStyle(x.id),g.style===x.id?'当前经营特色':S.monthAbs-g.styleAt<BC().specialtyMonths?'本年度经营特色已确定':!careerCheck(0).ok?careerCheck(0).why:'')));return;
    }
    UI.careerPick('年度经营方向','选择三个单位，按50%、30%、20%分配专项资源。方向与分配执行一年。',BC().plans.map(x=>({t:x.name,s:wait>0?'本年度已确定，'+Math.ceil(wait)+'个月后可调整':x.desc,disabled:wait>0||!careerCheck(0).ok,fn:()=>UI.careerUnitsPick('专项资源分配',3,[],ids=>UI.careerRun(()=>careerPlan(x.id,ids)))})));
  },
  careerUnitsPick(title,count,ids,done){
    if(ids.length===count){done(ids);return;}
    UI.careerPick(title,`选择第${ids.length+1}个单位${count===3?'，占'+BC().allocation[S.lv][ids.length]+'%':'；'+(ids.length===0?'负责牵头承办':'负责协办')}。`,careerUnits().filter(x=>!ids.includes(x.id)).map(x=>({t:x.name,s:S.lv===5?'全国片区':x.dep!=null?'存款 '+fmtWan(x.dep):'承办单位',fn:()=>UI.careerUnitsPick(title,count,ids.concat(x.id),done)})));
  },
  careerNewModal(){
    const defs=CAREER_PROJECTS.filter(d=>d.lv===S.lv&&!careerEnsure().projects.some(p=>p.id===d.id));
    UI.careerPick('启动职务项目','选择项目后，安排牵头人和承办单位；确认前不扣费。',defs.map(d=>{
      const ck=careerStartCheck(d.id);
      return {t:d.name,s:ck.ok?`${d.what} 费用${fmtWan(d.cost)}${d.rwa?' · 占用风险加权额度'+fmtWan(d.rwa):''}`:ck.why,disabled:!ck.ok,fn:()=>UI.careerPick('牵头人 · '+d.name,'工作负荷、专业和关系影响执行。培养期间暂不安排新项目。',careerPeople().map(p=>({t:p.name,s:careerRecord(p.id).training?'正在专项培养':`对口${Math.round(careerFit(p,d.line))} · 牵头${careerLoad(p.id)}项`,disabled:!!careerRecord(p.id).training,fn:()=>UI.careerUnitsPick('承办单位 · '+d.name,S.lv>=4?2:1,[],ids=>UI.careerPick('确认启动',`${d.name}，由${p.name}牵头。费用${fmtWan(d.cost)}，行动点1${d.rwa?'，占用风险加权额度'+fmtWan(d.rwa):''}。前期投入不退。`,[UI.careerOption('确认启动','结束回合后开始执行',()=>careerStart(d.id,p.id,ids))]))})))};
    }));
  },
  careerChoiceModal(id){
    const d=careerProjectDef(id);
    UI.careerPick(d.name+' · 实施方案','方案会改变推进难度、持续收益和团队协作。选择后本项目按此执行。',CAREER_CHOICES[d.type].map(o=>{
      const extra=d.cost*(o.extra||0),ck=careerCheck(extra);
      return UI.careerOption(o.name,o.desc+` · 追加费用${fmtWan(extra)} · 1点行动`,()=>careerChoose(id,o.id),ck.ok?'':ck.why);
    }));
  },
  careerProjectModal(id){
    const g=careerEnsure(),p=g.projects.find(x=>x.id===id),d=careerProjectDef(id),ck=careerCheck(0);
    UI.careerPick(d.name,`牵头人${person(p.lead)?.name||'待委任'}；执行分${careerExecution(p).score}，达到${BC().executeMin}才自动推进。准备度${p.quality}。${p.dispute?'协办争议尚未解决。':''}`, [
      UI.careerOption('亲自督办','准备度提高；每回合最多一次 · 1点行动',()=>careerPush(id,'push'),!ck.ok?ck.why:p.workedAt===S.monthAbs?'本回合已督办':''),
      ...(p.stage===1&&!p.choice?[{t:'确定实施方案',s:'方案确定后才能继续推进',fn:()=>UI.careerChoiceModal(id)}]:[]),
      ...(p.dispute?[UI.careerOption('协调协办争议','明确分工和收益，恢复执行 · 1点行动',()=>careerPush(id,'resolve'),ck.ok?'':ck.why)]:[]),
      {t:'调整牵头人',s:'任用适合的干部 · 1点行动',disabled:!ck.ok,fn:()=>UI.careerPick('新牵头人','同一人承担多个项目，执行能力会下降。',careerPeople().filter(x=>x.id!==p.lead).map(x=>UI.careerOption(x.name,`对口${Math.round(careerFit(x,d.line))} · 牵头${careerLoad(x.id)}项`,()=>careerPush(id,'lead',x.id),careerRecord(x.id).training?'正在专项培养':'')))},
      {t:'终止项目',s:'释放额度，前期费用不退 · 1点行动',disabled:!ck.ok,fn:()=>UI.careerPick('终止 '+d.name,'项目停止后本任期不再启动。前期费用不退，负责人评价下降。',[UI.careerOption('确认终止','行动点-1',()=>careerPush(id,'withdraw'))])},
    ]);
  },
  careerCouncilModal(){
    const issue=careerEnsure().council,d=issue&&CAREER_COUNCIL.find(x=>x.id===issue.id);if(!d)return;
    UI.careerPick(d.title,d.body,d.opts.map(o=>{
      const cost=o.cost?BC().councilFee[S.lv]:0,ck=careerCheck(cost,o.ap||0);
      return UI.careerOption(o.name,o.desc+` · 费用${fmtWan(cost)} · 行动点${o.ap||0}`,()=>careerCouncilChoice(o.id),ck.ok?'':ck.why);
    }));
  },
});
