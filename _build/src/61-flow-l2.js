/* =====================================================================
   L2 流程文本:月报、年考、开门红任务结算
   ===================================================================== */
function settleChalL2(){
  S.chal = S.chal.filter(ch => {
    if(S.turn < ch.due) return true;
    const got = depTotal() - ch.start;
    if(got >= ch.target){ fav("zhouqm", ch.win); log("good", `${ch.title}：净增${fmtWan(got)}。周启明在行长群里点了南岸的名。`); }
    else { fav("zhouqm", ch.lose); log("bad", `${ch.title}：只做到${fmtWan(got)}。分行的通报里，南岸那一行标了黄。`); }
    return false;
  });
}
function reportSpecL2(){
  const r = S.report;
  const arrow = r.rank < r.prevRank ? "↑" : (r.rank > r.prevRank ? "↓" : "→");
  const rows = [
    ["存款", fmtYi(r.dep), sgn(Math.round(r.dDep), fmtWan)],
    ["贷款", fmtYi(r.loans), sgn(Math.round(r.dLoan), fmtWan)],
    ["本月模拟利润", fmtWan(r.profit), ""],
    ["不良率", r.npl.toFixed(2)+"%", ""],
    ["分行排名", `第${r.rank}名`, arrow],
  ];
  const notes = [];
  const best = r.outlets.slice().sort((a,b)=>b.inc-a.inc)[0], worst = r.outlets.slice().sort((a,b)=>a.inc-b.inc)[0];
  if(best && best.inc > 0) notes.push(`${best.name}这个月最好，净增${fmtWan(best.inc)}。`);
  if(worst && worst.inc < 0) notes.push(`${worst.name}掉了${fmtWan(-worst.inc)}。`);
  if(r.expired) notes.push(`有${r.expired}笔贷款申请没批也没退，客户去了别家。`);
  if(r.landed.length) notes.push(`${r.landed.join("、")}落地。`);
  const quiet = !r.ms.length && !r.defaults && !r.landed.length && r.expired===0;
  return {kind:"report", title:`${S.m}月 · 月报`, rows, ms:r.ms, notes, quiet: quiet ? pickLine("quietL2") : "",
    opts:[{t:S.m===12?"看年终考核":"下个月"}]};
}
function yearSpecL2(){
  const r = S.lastYear;
  const good = r.rank <= B2().bonusTop;
  const hit = S.biz.outlets.filter(o=>o.hit).map(o=>o.name), miss = S.biz.outlets.filter(o=>!o.hit).map(o=>o.name);
  const lines = [];
  lines.push(good ? `年终考核，南岸在分行排第${r.rank}。周启明在总结会上念到南岸，没有停顿。`
                  : `年终考核，南岸在分行排第${r.rank}。${r.rank>=7?"总结会上，周启明念完排名，说了句：「有的支行要想一想。」":"不上不下。"}`);
  if(miss.length === 0) lines.push("四个网点的任务都完成了。");
  else lines.push(`${hit.length?hit.join("、")+"完成了任务，":""}${miss.join("、")}没完成。`);
  return {kind:"year", title:`入行第${r.careerYear}年 · 年终考核`, rec:r, body: lines.join("\n\n"), opts:[{t:"翻篇"}]};
}
