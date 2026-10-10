/* =====================================================================
   行动成败:每次行动掷一次。成功率挂在关系、能力、口碑上,
   界面只给三档:有把握 / 看情况 / 悬
   ===================================================================== */
function oddsClamp(p){ const o = BALANCE.odds; return clamp(p, o.min, o.max); }
function oddsTier(p){
  const o = BALANCE.odds; p = oddsClamp(p);
  return p >= o.sure ? {k:"sure", t:"有把握"} : (p >= o.maybe ? {k:"maybe", t:"看情况"} : {k:"risky", t:"悬"});
}
function oddsChip(p){ if(p == null) return ""; const t = oddsTier(p); return `<i class="odds odds-${t.k}">${t.t}</i>`; }
function roll(p){
  const ok = R() < oddsClamp(p);
  const r = S.track.rolls = S.track.rolls || {n:0, fail:0};
  r.n++; if(!ok) r.fail++;
  return ok;
}
const avgOf = (arr, f) => arr.length ? arr.reduce((a,x)=>a+f(x),0)/arr.length : 0;
const favOf = id => { const p = person(id); return p ? p.fav : 50; };

/* 每关每个行动的成功率。带参数的(选客户、选人)在选择面板里给档位 */
const ODDS = {
  1: {
    maintain: (c, prod) => { const k = BALANCE.odds.L1.maintain;
      return k.base + c.rel*k.rel + (k.prod[prod]||0) + (prod==="insure" && c.type==="retire" ? k.oldInsure : 0) + (S.biz.csat-80)*k.csat; },
    hall: () => { const k = BALANCE.odds.L1.hall; return k.base + staffByRole("lobby").reduce((a,s)=>a+s.mk,0)*k.mk + (S.biz.csat-80)*k.csat; },
    out: () => { const k = BALANCE.odds.L1.out, cm = staffByRole("cm")[0]; return k.base + (cm?cm.mk:3)*k.mk; },
    train: s => { const k = BALANCE.odds.L1.train; return k.base + (s.grow-1)*k.grow - s.fatigue*k.fat; },
    rally: () => { const k = BALANCE.odds.L1.rally; return k.base - avgOf(S.staff, s=>s.fatigue)*k.fat; },
    boss: () => { const k = BALANCE.odds.L1.boss; return k.base + (favOf("huang")-50)*k.fav; },
  },
  2: {
    supervise: o => { const k = BALANCE.odds.L2.supervise; return k.base + (o.morale-50)*k.morale + ((o.mgr?favOf(o.mgr):50)-50)*k.fav; },
    push: p => { const k = BALANCE.odds.L2.push; if(!p) return null;
      if(p.stage >= 2){ const b = B2().project, d = PROJ_L2.find(x=>x.id===p.id); return Math.min(b.cap, b.approveBase - b.risk[d.tier] + p.visits*b.visit + p.gift*b.gift + (S.flags.projBonus && S.flags.projBonus[p.id] || 0)); }
      return k.base + p.visits*k.visit; },
    campaign: () => { const k = BALANCE.odds.L2.campaign; return k.base + (avgOf(S.biz.outlets, o=>o.morale)-50)*k.morale; },
    reportup: () => { const k = BALANCE.odds.L2.report; return k.base + (favOf("zhouqm")-50)*k.fav; },
  },
  3: {
    open: a => { const k = BALANCE.odds.L3.open; return a ? k.base + (a.heat - a.comp*0.5)*k.heat : null; },
    squat: x => { const k = BALANCE.odds.L3.squat; return x ? k.base + (favOf(x.mgr)-50)*k.fav : null; },
    renovate: () => BALANCE.odds.L3.renovate,
    reportup: () => { const k = BALANCE.odds.L3.report; return k.base + (favOf("lu")-50)*k.fav; },
  },
  4: {
    talk: id => { const k = BALANCE.odds.L4.talk; return id ? k.base + (favOf(id)-50)*k.fav : null; },
    pushp: () => BALANCE.odds.L4.push,
    quota: () => { const k = BALANCE.odds.L4.quota; return k.base + (favOf("lu") - B4().askQuota.needFav)*k.fav; },
    regulator: () => { const k = BALANCE.odds.L4.reg; return k.base + (favOf("gu")-50)*k.fav; },
  },
  5: {
    survey: () => BALANCE.odds.L5.survey,
    reg5: () => { const k = BALANCE.odds.L5.reg; return k.base + (favOf("gu")-50)*k.fav; },
  },
};
/* 不带参数也算得出来的,给行动按钮挂档位 */
function actOdds(id){ const f = ODDS[S.lv] && ODDS[S.lv][id]; if(!f || f.length > 0) return null; try { return f(); } catch(e){ return null; } }
