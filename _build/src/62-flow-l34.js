/* =====================================================================
   L3/L4 流程文本:季报、年考、开门红任务结算、危机插队
   ===================================================================== */
function settleChalGeneric(){
  S.chal = S.chal.filter(ch => {
    if(S.turn < ch.due) return true;
    const got = depTotal() - ch.start, who = ch.sup || supId(), p = person(who);
    if(got >= ch.target){ fav(who, ch.win); log("good", `${ch.title}：一季度净增${fmtWan(got)}。${p?p.name:"上面"}在群里点了名。`); }
    else { fav(who, ch.lose); log("bad", `${ch.title}：一季度只做到${fmtWan(got)}，差${fmtWan(ch.target-got)}。`); }
    return false;
  });
}
function reportSpecL3(){
  const r = S.report;
  const arrow = r.rank < r.prevRank ? "↑" : (r.rank > r.prevRank ? "↓" : "→");
  const rows = [
    ["存款", fmtYi1(r.dep), sgn(Math.round(r.dDep), fmtYi1)],
    ["贷款", fmtYi1(r.loans), sgn(Math.round(r.dLoan), fmtYi1)],
    ["本季模拟利润", fmtYi1(r.profit), ""],
    ["不良率", r.npl.toFixed(2)+"%", r.newNpl ? "新增"+fmtYi1(r.newNpl) : ""],
    ["二级分行排名", `第${r.rank}名`, arrow],
  ];
  const notes = [];
  if(r.recovered) notes.push(`处置收回${fmtWan(r.recovered)}。`);
  if(r.quotaFull) notes.push("贷款额度用满了，本季有几笔没放出去。");
  if(r.nanan.length) notes.push(`南岸那边：${r.nanan.join("、")}逾期。`);
  const quiet = !r.ms.length && !notes.length;
  return {kind:"report", title:`${r.q} · 季报`, rows, ms:r.ms, notes, quiet: quiet ? pickLine("quietL3") : "", opts:[{t:S.m===12?"看年终考核":"下个季度"}]};
}
function reportSpecL4(){
  const r = S.report;
  const arrow = r.rank < r.prevRank ? "↑" : (r.rank > r.prevRank ? "↓" : "→");
  const rows = [
    ["存款", fmtBai(r.dep), sgn(Math.round(r.dDep), fmtYi0)],
    ["贷款", fmtBai(r.loans), sgn(Math.round(r.dLoan), fmtYi0)],
    ["本季净利润", fmtYi1(r.profit), ""],
    ["不良率", r.npl.toFixed(2)+"%", ""],
    ["监管评级(预估)", Math.round(r.rating)+"级", ""],
    ["全国排名", `第${r.rank}名`, arrow],
  ];
  const notes = [];
  if(r.capRoom < 0) notes.push("资本额度用满了，贷款停了下来。");
  else if(r.capRoom < 100000) notes.push(`资本额度只剩${fmtYi0(r.capRoom)}的空间。`);
  if(r.defaults.length) notes.push(`贷款逾期：${r.defaults.join("、")}，已计入不良和本期拨备。`);
  const quiet = !r.ms.length && !notes.length;
  return {kind:"report", title:`${r.q} · 季报`, rows, ms:r.ms, notes, quiet: quiet ? pickLine("quietL4") : "", opts:[{t:S.m===12?"看年终考核":"下个季度"}]};
}
function yearSpecL34(){
  const r = S.lastYear, lv = S.lv, b = BALANCE["L"+lv];
  const good = r.rank <= b.bonusTop;
  const who = lv===3 ? "陆明远" : "宋文远";
  const scope = lv===3 ? "二级分行" : "全国一级分行";
  const lines = [good ? `年终考核，${lv===3?"万州":"重庆"}在${scope}里排第${r.rank}。${who}在总结会上念到这里，停了一下。`
                      : `年终考核，${lv===3?"万州":"重庆"}在${scope}里排第${r.rank}。${r.rank>=6?`${who}念完排名，说了句：「有的分行要反思。」`:"不上不下。"}`];
  if(lv===3 && S.biz.allGrow) lines.push("七个支行的存款都比年初多。");
  if(lv===4) lines.push(`年度监管评级：${S.biz.ratingY}级。`);
  return {kind:"year", title:`入行第${r.careerYear}年 · 年终考核`, rec:r, body: lines.join("\n\n"), opts:[{t:"翻篇"}]};
}
function reportSpecL5(){
  const r = S.report;
  const rows = [
    ["存款", fmtWy(r.dep), sgn(Math.round(r.dDep/10000), v=>v+"亿")],
    ["贷款", fmtWy(r.loans), sgn(Math.round(r.dLoan/10000), v=>v+"亿")],
    ["半年净利润", Math.round(r.profit/10000)+"亿", ""],
    ["贷款息差", (r.spread*100).toFixed(2)+"%", ""],
    ["不良率", r.npl.toFixed(2)+"%", ""],
    ["资本充足率", r.car.toFixed(1)+"%", ""],
    ["同业规模排名", `第${r.rank}名`, ""],
  ];
  const notes = [`全国网点${r.outlets}个。`];
  if(r.defaults && r.defaults.length) notes.push(`旧账逾期：${r.defaults.join("、")}，已计入不良和本期拨备。`);
  if(r.digi > 0.02) notes.push(`数字化省下来的费用，已经有${Math.round(r.digi*100)}个点。`);
  return {kind:"report", title:`${S.m===6?"上半年":"下半年"} · 报告`, rows, ms:r.ms||[], notes, quiet:"", opts:[{t:S.m===12?"看年终考核":"下半年"}]};
}
function yearSpecL5(){
  const r = S.lastYear;
  return {kind:"year", title:`入行第${r.careerYear}年 · 年度经营`, rec:r, body:`年报发布会上，泰和银行在同业里排第${rankL5()}。台下的记者问得最多的，是息差。`, opts:[{t:"翻篇"}]};
}
function fmtYi1(v){ return (v/10000).toFixed(1) + "亿"; }
function fmtYi0(v){ return Math.round(v/10000) + "亿"; }
function fmtBai(v){ const y = v/10000; return y >= 10000 ? (y/10000).toFixed(2) + "万亿" : Math.round(y) + "亿"; }
