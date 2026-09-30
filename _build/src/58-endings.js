/* =====================================================================
   结局、履历长图、图鉴
   重场戏:交策划过目
   ===================================================================== */
/* 各层级「卡住」结局的第二种:口碑差或者不干净 */
ENDINGS[1].lock2 = {title:"柜台后面", text:S=>`窗口没再来。\n\n你在弹子石又干了几年，后来去了支行后台管档案。办公室在地下一层，没有窗户。\n\n有一回整理旧卷宗，你翻到自己当年签过的一张单子。你看了一会儿，把它放回去了，按日期排好。`};
ENDINGS[2].lock2 = {title:"南岸", text:S=>`万州的窗口过去了，下一个也没等来。\n\n你在南岸又坐了几年。那几年批出去的贷款，一笔一笔到了期，有的还上了，有的没有。\n\n你退下来那天，四个网点的负责人都来了，饭桌上没人提当年的事。`};
ENDINGS[3].lock2 = {title:"江上的雾", text:S=>`回主城的窗口过去了。\n\n万州的平台贷款后来出了问题，区里换了领导，新来的不认旧账。你在万州分行行长的位子上，一户一户地处置。\n\n到龄那年冬天，江上起了雾。你站在窗前，看不见桥。`};
ENDINGS[4].lock2 = {title:"十九楼", text:S=>`去北京的窗口过去了。\n\n你在重庆分行干到了到龄。最后两年，监管的函一封接一封，十九楼的灯常常亮到半夜。\n\n交接那天，你把办公室的绿萝留给了继任者，没留别的话。`};

/* 总行结局 */
ENDINGS[5] = {
  top:   {title:"行长", text:S=>`四年任期满了。\n\n泰和银行在同业里排第${rankL5()}，不良压在${(S.biz.npl/S.biz.loans*100).toFixed(2)}%。降息压了${S.biz.cutLevel}轮，利润没有掉下来。\n\n离任审计做了三个月，报告的结论只有一段。你签完字，把办公室的钥匙交给了继任者。玻璃板下面那张照片，你带走了。`},
  mid:   {title:"任期届满", text:S=>`四年任期满了。\n\n泰和银行没出大事，也没跑到前面去。降息那几年，所有大行的日子都不好过，你的也一样。\n\n离任那天，总行食堂给你留了一张桌子。你吃了一碗面，跟打饭的师傅说了声谢谢。`},
  low:   {title:"提前离任", text:S=>`第四年还没过完，上面找你谈了话。\n\n泰和银行的规模让人超过去了，利润连着两年往下走。新的任命下来，你去了一家资产管理公司当董事长，管的是各家银行剥离出来的不良资产。\n\n你在那里又看到了一些熟悉的名字：渝兴地产，天城化工配套。`},
  clean: {title:"干干净净", text:S=>`四年任期满了。\n\n离任审计组的组长是个老审计，干了三十年。报告交上来那天，他在你办公室多坐了一会儿。\n\n「${S.player.sur}行长，」他说，「从弹子石到总行，我们翻了你二十多年的签字。」他停了一下，「一张都没挑出来。」\n\n他把报告放在桌上，走了。`},
  bt3:   {title:"三级跳", text:S=>`四年任期满了。\n\n行里的人提起你，总要带一句：网点、支行、二级分行，三次都是破格。有人讲你运气好，也有人讲你会来事。\n\n离任那天，你把三份破格任用的通知从柜子里拿出来，按日期排好，装进了信封。`},
  caught:{title:"出事", text:S=>`任期的最后一年，巡视组进驻泰和银行。\n\n他们从总行查起，一路查到重庆，查到万州，查到南岸，最后查到了弹子石。每个地方，都有你的签字。\n\n审查查了半年。结论下来那天，北京是个晴天。`},
};

/* 年底审计查出来的「出事」:换掉公示那一段开头 */
const AUDIT_OPEN = {
  1: "年底，分行审计组进了弹子石。本来是例行检查，他们在理财室多翻了两天。\n\n第三天，又来了两个穿深色夹克的人。",
  2: "年底审计，分行派来的人在南岸支行的信贷档案室待了一个星期。走之前，有一个人上了三楼。",
  3: "总行的巡察组到了万州。原定两周，后来又延了一个月。",
  4: "总行巡视组进驻重庆分行。第一次谈话，他们问的是万州的事。",
};

/* L5 终局评定 */
function finalL5(){
  const e = BALANCE.L5.endScore;
  const avg = S.biz.scoreLog.length ? S.biz.scoreLog.reduce((a,x)=>a+x,0)/S.biz.scoreLog.length : S.kpi.score;
  S.track.finalAvg = r1(avg);
  const bt = (S.track.btLv||[]);
  if(S.core.clean < 45) return "caught";
  if(S.core.clean >= 90 && (S.track.minClean||100) >= 90 && avg >= e.mid) return "clean";
  if([1,2,3].every(l => bt.includes(l))) return "bt3";
  if(avg >= e.top && rankL5() <= 2) return "top";
  if(avg >= e.mid) return "mid";
  return "low";
}

/* 结局 id 细分:卡住的结局按口碑和干净度分两种 */
function refineEnding(id){
  if(id === "lock" && S.lv <= 4 && (S.core.rep < 55 || S.core.clean < 75) && ENDINGS[S.lv].lock2) return "lock2";
  return id;
}
const ENDING_LIST = (()=>{ const out = []; [1,2,3,4].forEach(lv => ["lock","lock2","side","caught"].forEach(k => out.push({lv, k}))); ["top","mid","low","clean","bt3","caught"].forEach(k => out.push({lv:5, k})); return out; })();
const LV_TITLE = ["","网点负责人","支行行长","二级分行行长","一级分行行长","总行行长"];

/* ---------------- 图鉴(跨周目) ---------------- */
function loadMeta(){ try { const r = localStorage.getItem(BALANCE.metaKey); const m = r ? JSON.parse(r) : null; return m && m.endings ? m : {endings:{}, people:{}, runs:0}; } catch(e){ return {endings:{}, people:{}, runs:0}; } }
function saveMeta(m){ try { localStorage.setItem(BALANCE.metaKey, JSON.stringify(m)); } catch(e){} }
function recordMeta(){
  const m = loadMeta();
  if(S.over){ const key = S.over.lv + ":" + S.over.id; m.endings[key] = m.endings[key] || {first: Date.now(), name: S.player.sur+S.player.given, age:S.over.age}; m.runs = (m.runs||0) + 1; }
  S.people.filter(p=>p.met).forEach(p => { if(!m.people[p.id]) m.people[p.id] = {name:p.name, role:p.role||p.pos, note:p.note||"", lv:p.lvMet}; });
  saveMeta(m);
  return m;
}

/* ---------------- 履历长图 ---------------- */
function bioData(){
  const ke = S.track.keyEvents || [];
  const stages = [];
  const ageOf = re => { const k = ke.find(x=>re.test(x.txt)); return k ? k.age : null; };
  const a1 = BALANCE.start.age, a2 = ageOf(/任南岸支行行长/), a3 = ageOf(/任万州分行行长/), a4 = ageOf(/任重庆分行行长/), a5 = ageOf(/任泰和银行行长/);
  const endAge = S.over ? S.over.age : S.age;
  const rows = [
    {lv:1, name:"弹子石网点负责人", from:a1, to:ageOf(/任南岸支行副行长/) || (a2 ? a2-2 : endAge)},
    {lv:2, name:"南岸支行行长", from:a2, to: ageOf(/任万州分行副行长/) || (a3 ? a3-2 : endAge)},
    {lv:3, name:"万州分行行长", from:a3, to: ageOf(/任重庆分行副行长/) || (a4 ? a4-2 : endAge)},
    {lv:4, name:"重庆分行行长", from:a4, to: ageOf(/任总行副行长/) || (a5 ? a5-3 : endAge)},
    {lv:5, name:"泰和银行行长", from:a5, to: endAge},
  ].filter(r => r.from != null);
  rows.forEach(r => {
    const ev = ke.filter(k => k.lv === r.lv && !/^(\d+)岁，任/.test(k.txt) && !/综合考核/.test(k.txt));
    r.best = ev.length ? ev[0].txt : "——";
  });
  // 带出来的人:你的旧部里现在位置最高的三个
  const rank = p => /行长/.test(p.pos) ? (/分行行长|分行副行长/.test(p.pos) ? 3 : 2) : (/负责人|总经理|总监/.test(p.pos) ? 1 : 0);
  const people = S.people.filter(p => (p.kind==="sub" || p.kind==="staff") && p.lvMet <= 3 && p.alive && p.pos.indexOf("离职")<0 && !["zhouqm","duheng","shenlan","jianggd"].includes(p.id))
    .sort((a,b) => rank(b)-rank(a) || (b.skill||0)-(a.skill||0)).slice(0,3).map(p => ({name:p.name, pos:p.pos}));
  const title = S.lv >= 5 ? "行长" : titleOf(S);
  return {name:S.player.sur+S.player.given, title, rows, people, core:Object.assign({}, S.core), ending:S.over ? S.over.title : "", age:endAge, verdict: bioVerdict()};
}
function bioVerdict(){
  const c = S.core;
  if(c.clean >= 90) return "签过的字，都经得起翻。";
  if(c.clean < 60) return "有些事，终究没能翻过去。";
  if(c.rep >= 75) return "带出来的人，后来都记得他。";
  if(c.perf >= 80) return "数字一直好看。";
  return "一路走到了这里。";
}
function drawBio(canvas){
  const d = bioData();
  const W = 750, pad = 48;
  const H = 360 + d.rows.length*150 + 200 + 380 + 120;
  const dpr = 2;
  canvas.width = W*dpr; canvas.height = H*dpr;
  const g = canvas.getContext && canvas.getContext("2d");
  if(!g) return false;
  g.scale(dpr, dpr);
  const serif = '"Songti SC","STSong","Noto Serif CJK SC",serif', sans = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  g.fillStyle = "#f5f1e8"; g.fillRect(0,0,W,H);
  g.fillStyle = "#16302b"; g.fillRect(0,0,W,250);
  g.fillStyle = "#c9ab6a"; g.font = `15px ${sans}`; g.fillText("泰和银行 · 履历", pad, 60);
  g.fillStyle = "#f3edde"; g.font = `bold 52px ${serif}`; g.fillText(d.name, pad, 140);
  g.font = `22px ${serif}`; g.fillStyle = "#d8cfb6"; g.fillText(`${d.title} · ${d.age}岁`, pad, 186);
  if(d.ending){ g.font = `18px ${sans}`; g.fillStyle = "#c9ab6a"; g.fillText(`结局：${d.ending}`, pad, 222); }
  let y = 310;
  g.strokeStyle = "#a8894a"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(pad+8, y-10); g.lineTo(pad+8, y + d.rows.length*150 - 60); g.stroke();
  d.rows.forEach(r => {
    g.fillStyle = "#a8894a"; g.beginPath(); g.arc(pad+8, y+4, 8, 0, Math.PI*2); g.fill();
    g.fillStyle = "#1d2522"; g.font = `bold 26px ${serif}`; g.fillText(r.name, pad+36, y+12);
    g.fillStyle = "#6c716c"; g.font = `17px ${sans}`; g.fillText(`${r.from}岁 — ${r.to}岁`, pad+36, y+44);
    g.fillStyle = "#23463f"; g.font = `19px ${serif}`;
    wrapText(g, r.best, pad+36, y+82, W - pad*2 - 40, 30);
    y += 150;
  });
  y += 20;
  g.fillStyle = "#1d2522"; g.font = `bold 22px ${serif}`; g.fillText("带出来的人", pad, y); y += 40;
  if(!d.people.length){ g.fillStyle = "#6c716c"; g.font = `18px ${sans}`; g.fillText("——", pad, y); y += 40; }
  d.people.forEach(p => { g.fillStyle = "#1d2522"; g.font = `20px ${serif}`; g.fillText(p.name, pad, y); g.fillStyle = "#6c716c"; g.font = `17px ${sans}`; g.fillText(p.pos, pad+110, y); y += 40; });
  // 四维雷达
  y += 30;
  g.fillStyle = "#1d2522"; g.font = `bold 22px ${serif}`; g.fillText("四项", pad, y);
  const cx = W/2, cy = y + 170, R = 120;
  const keys = [["perf","业绩"],["rep","口碑"],["trust","上级信任"],["clean","干净"]];
  g.strokeStyle = "#d9d2c1"; g.lineWidth = 1;
  [0.25,0.5,0.75,1].forEach(k => { g.beginPath(); keys.forEach((_,i)=>{ const a = -Math.PI/2 + i*Math.PI/2; const px = cx + Math.cos(a)*R*k, py = cy + Math.sin(a)*R*k; i ? g.lineTo(px,py) : g.moveTo(px,py); }); g.closePath(); g.stroke(); });
  g.beginPath();
  keys.forEach(([k],i) => { const a = -Math.PI/2 + i*Math.PI/2, v = (d.core[k]||0)/100; const px = cx + Math.cos(a)*R*v, py = cy + Math.sin(a)*R*v; i ? g.lineTo(px,py) : g.moveTo(px,py); });
  g.closePath(); g.fillStyle = "rgba(168,137,74,.35)"; g.fill(); g.strokeStyle = "#a8894a"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#1d2522"; g.font = `17px ${sans}`; g.textAlign = "center";
  keys.forEach(([k,n],i) => { const a = -Math.PI/2 + i*Math.PI/2; g.fillText(`${n} ${Math.round(d.core[k]||0)}`, cx + Math.cos(a)*(R+44), cy + Math.sin(a)*(R+30) + 6); });
  g.textAlign = "left";
  y = cy + R + 90;
  g.fillStyle = "#16302b"; g.fillRect(0, y-10, W, H-y+10);
  g.fillStyle = "#f3edde"; g.font = `24px ${serif}`; wrapText(g, d.verdict, pad, y+50, W-pad*2, 36);
  g.fillStyle = "#c9ab6a"; g.font = `14px ${sans}`; g.fillText("银行升职记", pad, H-30);
  return d;
}
function wrapText(g, text, x, y, maxW, lh){
  let line = "", yy = y;
  for(const ch of String(text)){
    if(g.measureText(line + ch).width > maxW && line){ g.fillText(line, x, yy); line = ch; yy += lh; }
    else line += ch;
  }
  if(line) g.fillText(line, x, yy);
  return yy;
}
