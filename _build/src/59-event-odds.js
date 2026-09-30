/* =====================================================================
   事件选项的成败(文案见 docs/11-事件成败文案稿.md)
   键:事件id:选项序号;危机是 crisis:run0:0 这种(类型+幕+序号)
   p   成功率(函数);fail 失败时做什么(拿到原选项 orig,可以先静默跑一遍再追加后果)
   rev 反过来:原来稳输,成了走 win,败了走原选项
   ===================================================================== */
/* 静默跑一遍原选项:效果留下,日志拿掉 */
function quietRun(fn){ const head = S.log[0]; fn(); while(S.log.length && S.log[0] !== head) S.log.shift(); }
const cAdd = d => { if(S.lv === 1) compAdd(d); else S.kpi.comp = c100(S.kpi.comp + d); };
const sAdd = d => { if(S.lv === 1) csatAdd(d); else S.biz.csat = c100(S.biz.csat + d); };
const moveOut = (c, share) => { const out = Math.round(c.own*share); c.own -= out; c.other += out; return out; };
function leaveForYubei(e, o){
  e.pos = "渝北支行零售部副总"; e.recent = "跳去了渝北"; e.kind = "npc";
  o.mgr = null; o.morale = c100(o.morale-10);
  keyEvent(`${e.name}去了渝北`);
}

const EVENT_ODDS = {
  /* ---------------- L1 ---------------- */
  "sdx:1": {p:()=>0.8, fail:(o)=>{ quietRun(o); compAdd(-10); sfav("suxw",-11);
    log("bad", `双录的录像第二周被支行抽到了。苏晓雯被叫去谈了一个钟头，回来眼睛是红的。<span class="num">合规-10</span>`); }},
  "sdx:2": {p:()=>0.5 + (favOf("zhangxf")-50)*0.01, fail:()=>{ const c = card("zhangxf"); const out = c ? moveOut(c, 0.3) : 0; fav("zhangxf",2); sfav("suxw",-2);
    log("bad", `张秀芬听完，说年轻人讲的她听不懂。第二天她去了隔壁行，买了那边经理推荐的一款。<span class="num">存款-${fmtWan(out)}</span>`); }},
  "tousu:0": {p:()=>0.65 + (S.biz.csat-80)*0.01, fail:()=>{ if(S.biz.budget>=0.3) budgetAdd(-0.3); compAdd(-3);
    log("bad", `刘家在六楼。老太太隔着防盗门说：「东西拿回去，我要的是个说法。」<span class="num">投诉没撤 · 合规-3</span>`); }},
  "huang1:1": {p:()=>0.45 + (favOf("huang")-50)*0.008, fail:()=>{ chal("h1","上半年加压任务",3000,3,6,-10);
    log("bad", `黄世海把单子推回来：「费用没得。数照认。」<span class="num">到6月底存款要净增0.3亿</span>`); }},
  "huang1:2": {rev:true, p:()=>0.3, win:()=>{ fav("huang",-2); allStaffFav(4); chal("h1","上半年加压任务",2000,3,4,-6);
    log("good", `黄世海盯着表看了半天，把数划掉，改小了一截。「就这样，莫再讲了。」<span class="num">到6月底净增0.2亿</span>`); }},
  "changkuan:1": {p:()=>0.75, fail:(o, d)=>{ quietRun(o); const e = staff(d.sid); compAdd(-8); if(e) sfav(e.id,-1);
    log("bad", `月底支行查库，尾箱登记簿上那一笔的日期对不上。${e?e.name:"柜员"}被叫去问话，没提你。<span class="num">合规-8</span>`); }},
  "wajiao:0": {p:()=>0.8, fail:(o)=>{ quietRun(o); const c = card("zhangxf"); const out = c ? moveOut(c, 0.25) : 0;
    log("bad", `你到的时候，张秀芬的女儿也在，在他行上班。你们聊了半个钟头。第二周，张秀芬还是转走了一笔。<span class="num">存款-${fmtWan(out)}</span>`); }},
  "wajiao:1": {p:()=>0.45 + (favOf("huang")-50)*0.008, fail:()=>{ fav("huang",-3); fav("zhangxf",-3); const c = card("zhangxf"); const out = c ? moveOut(c, 0.4) : 0;
    log("bad", `黄世海没签：「一个老太婆，至于吗？」<span class="num">存款-${fmtWan(out)}</span>`); }},
  "huoguo:0": {p:()=>0.55 + (favOf("ranguoq")-50)*0.008, fail:()=>{ cardAdd(4); depAdd(60); fav("ranguoq",4);
    log("bad", `冉国强说工资卡的事他老婆管，她在另一家行有熟人。收单机装上了，代发没谈下来。<span class="num">信用卡代发+4 · 存款+60万</span>`); }},
  "huoguo:1": {p:()=>0.8, fail:(o)=>{ quietRun(o); compAdd(-10); fav("ranguoq",-20);
    log("bad", `贷款批下来的第三个月，分行贷后抽查。装修发票上的地址，是火锅店。<span class="num">合规-10</span>`); }},
  "baoyu:1": {p:()=>0.6, fail:()=>{ S.staff.forEach(s=>s.fatigue=c100(s.fatigue+20)); csatAdd(-4);
    log("bad", `水漫过了第二层沙袋。配电箱跳了闸，客户在黑着的大厅里等了一个钟头。<span class="num">满意度-4 · 倦怠上升</span>`); }},
  "luxun:0": {p:()=>0.8, fail:()=>{ fav("lu",2); fav("huang",-5);
    log("", `陆明远点点头，没说什么。第二天，黄世海在群里发了一条：各网点的流失数，以支行口径为准。<span class="num">黄世海好感-5</span>`); }},

  /* ---------------- L2 ---------------- */
  "mb1:0": {p:()=>0.35, fail:(o, d)=>{ const e = mgrOf(d.oid), ot = outlet(d.oid); fav("maben",-5); if(e && ot) leaveForYubei(e, ot);
    log("bad", `马奔在电话那头笑：「你问${e?e.name:"人家"}自己愿不愿意。」月底，人还是走了。<span class="num">${ot?ot.name:"网点"}先空着</span>`); }},
  "mb1:1": {p:()=>0.5 + (favOf("zhouqm")-50)*0.01, fail:(o, d)=>{ const e = mgrOf(d.oid), ot = outlet(d.oid); fav("zhouqm",-4); if(e && ot) leaveForYubei(e, ot);
    log("bad", `周启明说名额今年没了。${e?e.name:"人"}等了一个月，交了辞职信。<span class="num">${ot?ot.name:"网点"}先空着</span>`); }},
  "mb2:0": {p:()=>0.8, fail:()=>{ const p = project("yujiang"); if(p) p.lost = true; const r = S.rivals.find(x=>x.id==="yubei"); if(r) r.bonus = 6; S.biz.ytd.profit -= 30;
    log("bad", `你让了，渝北又让了一截。魏临川打电话来：「兄弟，这回真的不好意思。」<span class="num">渝江物流丢了</span>`); }},
  "mb2:1": {p:()=>0.6, fail:()=>{ dirt(4); S.biz.budget = Math.max(0, S.biz.budget-2); fav("weilc",6); const p = project("yujiang"); if(p) p.lost = true;
    log("bad", `那顿饭吃到十一点。第二周，项目还是给了渝北，魏临川说是集团定的。<span class="num">渝江物流丢了</span>`); }},
  "oldstaff:2": {p:()=>0.6, fail:(o, d)=>{ const p = person(d.pid); if(p) fav(p.id,2);
    log("", `${p?p.name:"人"}考了两回，差三分。第二回出考场，发来一条消息：「主任，书我先还你。」<span class="num">没考过</span>`); }},
  "feidan:1": {p:()=>0.6, fail:()=>{ const e = mgrOf("chayuan"); dirt(6); if(e) fav(e.id,2); schedule("feidanLater", rint(1,2));
    log("bad", `三个客户里，有一个没拿到钱。他把认购书复印了一份，寄给了监管。<span class="num">事情压不住了</span>`); }},
  "feidan:2": {p:()=>0.6, fail:()=>{ const e = mgrOf("chayuan"); apUse(1); sAdd(-3); cAdd(-5); if(e) fav(e.id,1);
    log("bad", `三个客户来了两个。第三个没来，第二天带着儿子去了分行营业部。<span class="num">满意度-3 · 合规-5</span>`); }},
  "dahu:0": {p:()=>0.8, fail:()=>{ const o = outlet("sigongli"); apUse(1); if(o) o.dep -= 3000;
    log("bad", `你到的时候，刘家的儿子已经在手机上把钱转走了。他说那边多给零点二。<span class="num">存款-3000万</span>`); }},
  "dahu:2": {p:()=>0.5 + (favOf("zhouqm")-50)*0.01, fail:()=>{ const o = outlet("sigongli"); fav("zhouqm",-3); S.biz.ytd.profit -= 15; if(o) o.dep -= 900;
    log("bad", `周启明批了一半。刘家嫌少，转走了三成。<span class="num">存款-900万</span>`); }},
  "ranloan:0": {p:()=>0.75, fail:()=>{ bookLoan("冉记老灶", 150, S.flags.ranFake?"mid":"low", "event"); fav("ranguoq",-3);
    log("", `流水拿来一看，三家店有两家在亏。贷款批了一半。<span class="num">贷款+150万</span>`); }},
  "weidrink:0": {p:()=>0.75, fail:(o)=>{ quietRun(o); fav("zhouqm",-3);
    log("bad", `第二天你请了半天假。周启明在群里问了一句，你去哪了。<span class="num">周启明好感-3</span>`); }},
  "weidrink:1": {p:()=>0.55, fail:()=>{ fav("weilc",-3);
    log("", `魏临川给你倒了三回酒，你三回都用茶碰的杯。散场时他没送你到门口。<span class="num">魏临川好感-3</span>`); }},
  "neishen:0": {p:()=>0.8, fail:(o)=>{ if(l2Gray() >= 2) return o(); cAdd(-5); fav("gu",3);
    log("", `孔组长在茶园待了三天，调走了两本凭证。整改单写了一页半。<span class="num">合规-5</span>`); }},

  /* ---------------- L3 ---------------- */
  "nanan:0": {p:()=>0.6, fail:()=>{ S.flags.apDebt = (S.flags.apDebt||0)+1; fav("gu",6); fav("lu",-2); subsL2Names().forEach(id=>fav(id,-5));
    log("bad", `你讲了一个钟头。风险部的人听完，说还是要追责经办。老部下给你发了条消息，只有一个句号。<span class="num">旧部好感-5</span>`); }},
  "nanan:2": {p:()=>0.75, fail:()=>{ dirt(10); fav("zhouqm",-3);
    log("bad", `周启明挡了一次，第二次没挡住。他打电话来：「这回我也没办法了。」<span class="num">追到你头上</span>`); }},
  "flood:1": {p:()=>0.6, fail:()=>{ S.flags.apDebt = (S.flags.apDebt||0)+1; subsL3().forEach(p=>fav(p.id,3)); S.month.spent += 200;
    log("bad", `你到的时候，水已经进了营业厅。金库的钱没来得及全部转移，有一箱泡了。<span class="num">损失200万</span>`); }},
  "poach3:0": {p:()=>0.5 + (favOf("lu")-50)*0.01, fail:()=>{ const x = bOf("gst"), p = person(x.mgr); fav("lu",-4);
    if(p){ p.pos = "股份行万州分行副行长"; p.recent = "跳去了股份行"; p.kind = "npc"; }
    const c = appointCandsL3(x.id).sort((a,b)=>b.skill-a.skill)[0];
    if(c){ x.mgr = c.id; c.pos = x.name+"行长"; c.kind = "sub"; c.recent = "顶了高笋塘的缺"; }
    log("bad", `陆明远说总行今年卡编制。${p?p.name:"人"}等到年底，还是走了。<span class="num">高笋塘换人</span>`); }},
  "kaoyu:0": {p:()=>0.6, fail:(o)=>{ quietRun(o); addNpa(3000, "micro", "烤鱼连锁", "万州烤鱼连锁");
    log("bad", `第二年，二十家店关了一批。还款的现金流，跟着断了。<span class="num">不良+3000万</span>`); }},
  "kaoyu:1": {p:()=>0.8, fail:(o)=>{ quietRun(o); addNpa(500, "micro", "烤鱼连锁", "万州烤鱼连锁");
    log("bad", `五家里有一家，老板跑了。<span class="num">不良+500万</span>`); }},
  "gu3:0": {p:()=>0.75, fail:(o)=>{ quietRun(o); fav("gu",-3);
    log("", `第一季的报表交上去，顾清越圈了一个数：「这个，跟你们报总行的对不上。」<span class="num">顾清越好感只加一半</span>`); }},
  "shangfang:0": {p:()=>0.8, fail:()=>{ const a = area(S.flags.closedArea); S.flags.apDebt = (S.flags.apDebt||0)+1; if(a) a.rep = c100(a.rep+2);
    log("", `你说了一个钟头。有个老人一直没开口，最后问：「那我以后取钱，去哪里？」你答不上来。<span class="num">口碑只回来一点</span>`); }},
  "shangfang:1": {p:()=>0.55, fail:()=>{ const a = area(S.flags.closedArea); if(a) a.rep = c100(a.rep-2);
    log("bad", `专车来了，坐上去的只有三个人。其他人站在卷帘门前，没走。<span class="num">口碑再掉</span>`); }},
  "jnfang:0": {p:()=>0.55, fail:(o)=>{ quietRun(o); addNpa(5000, "corp", "停工楼盘");
    log("bad", `区里说好的配套资金，拖了半年没到。<span class="num">不良再+0.5亿</span>`); }},
  "jnfang:1": {p:()=>0.75, fail:(o)=>{ quietRun(o); addNpa(3000, "corp", "停工楼盘");
    log("bad", `查封的时候才知道，那几层楼早抵给了另一家行。<span class="num">回收少一截</span>`); }},

  /* ---------------- L4 ---------------- */
  "zhou4:1": {p:()=>0.6, fail:(o)=>{ quietRun(o); inst("yyb").npl += 50000; S.biz.unity = c100(S.biz.unity-5);
    log("bad", `那笔贷款第二年出了问题。班子会上，周启明没说话，把会议记录翻到了去年那一页。<span class="num">不良+5亿 · 团结-5</span>`); }},
  "fangqi:0": {p:()=>0.55, fail:()=>{ S.loanBook.push({id:"yx", name:"渝兴地产", amt:300000, tier:"high", src:"event", lv:4, at:S.monthAbs, defAt:S.monthAbs+12, def:true, done:false});
    log("bad", `一年后，实控人名下的房子被法院先查封了。追加的担保，排在第三顺位。<span class="num">一年后不良一次进来</span>`); }},
  "fangqi:2": {p:()=>0.8, fail:(o)=>{ quietRun(o); dirt(5); S.biz.crisisAdj += 0.3;
    log("bad", `巡视组翻台账，翻到了那一页。续贷的审批单上，签的是你的名字。<span class="num">评级受影响</span>`); }},
  "gu4:0": {p:()=>0.8, fail:()=>{ fav("gu",8); S.biz.regScore = Math.min(10,(S.biz.regScore||0)+1.5); keyEvent("接受监管约谈，认下任上的不良");
    log("", `整改方案交上去，顾清越退回来一次：「时间表写实。」<span class="num">评级加分减半</span>`); }},
  "lu4:0": {p:()=>0.65, fail:(o)=>{ quietRun(o);
    log("bad", `试点做了一年，总行换了思路，项目停了。那一年的利润，算是交了学费。<span class="num">陆明远照记着</span>`); }},
  "maben4:1": {when:()=>!!S.flags.mabenHelped, p:()=>0.8, fail:(o)=>{ quietRun(o); dirt(8); const l = S.loanBook.find(x=>x.id==="mb4"); if(l) l.def = true;
    log("bad", `马奔的项目后来出了问题。审批单上，公司部经办写着：行长交办。<span class="num">这笔会烂</span>`); }},
  "wei4:0": {p:()=>0.55 + (favOf("weilc")-50)*0.008, fail:()=>{ fav("weilc",-3); S.flags.weiIPO = null;
    log("bad", `魏临川换了牵头行。电话里他很客气，说以后还有机会。<span class="num">牵头行丢了</span>`); }},
  "media4:0": {p:()=>0.8, fail:(o)=>{ quietRun(o); S.biz.crisisAdj += 0.2;
    log("bad", `道歉信发出去，评论区第一条是：早干嘛去了。舆情又挂了三天。<span class="num">评级小扣</span>`); }},
  "xinfang4:0": {p:()=>0.65, fail:()=>{ S.biz.unity = c100(S.biz.unity-3);
    log("bad", `听到第五个，有人拍了桌子。会议室门口围了一圈人。<span class="num">团结-3</span>`); }},
  "du4:0": {p:()=>0.6, fail:(o)=>{ quietRun(o); inst("yyb").npl += 40000; fav("duheng",-15);
    log("bad", `杜衡的项目，一年后有两笔逾期。他来你办公室，站着说完的。<span class="num">不良+4亿</span>`); }},

  /* ---------------- L5 ---------------- */
  "young5:0": {p:()=>0.65, fail:()=>{ S.kpi.comp = c100(S.kpi.comp+2); S.month.spent += 200000;
    log("", `查了两个月，零售条线报上来的结论是：个别网点执行偏差。那款产品还在卖。<span class="num">合规+2</span>`); }},
  "gu5:1": {rev:true, p:()=>0.35, win:()=>{
    log("", `顾清越看了你一会儿：「好，我等你们的处置报告。」`); }},

  /* ---------------- L4 危机 ---------------- */
  "crisis:run0:0": {p:()=>0.8, fail:(o)=>{ S.biz.crisis.good--; o();
    log("bad", `现金车在长江大桥上堵了一个钟头。营业部门口的人开始拍玻璃。`); }},
  "crisis:run0:1": {rev:true, p:()=>0.3, win:(o)=>{ S.biz.crisis.good++; o();
    log("good", `限额贴出去，队伍反而短了。有人说，限额说明钱还在。`); }},
  "crisis:run1:0": {p:()=>0.7, fail:(o)=>{ S.biz.crisis.good--; o();
    log("bad", `通报发出来了。有人在门口认出你，问：「你们行长都来了，是不是真出事了？」`); }},
  "crisis:run2:0": {p:()=>0.8, fail:(o)=>{ S.biz.crisis.good--; o();
    log("", `回访到一半，有人把电话录音发到了业主群里，说银行在「排查」。`); }},
  "crisis:client0:0": {p:()=>0.65, fail:(o)=>{ o(); inst("yyb").npl += 100000;
    log("bad", `账户冻结了，账上只剩零头。钱早在上个月就转出去了。<span class="num">不良+10亿</span>`); }},
  "crisis:client1:0": {p:()=>0.6, fail:(o)=>{ S.biz.crisis.good--; o(); inst("yyb").npl += 20000;
    log("bad", `续贷的那一批里，有不少第二个季度就停了工。<span class="num">不良+2亿</span>`); }},
};

/* 给事件选项挂上成败:档位显示在选项上,点下去掷一次 */
function applyEventOdds(spec, key, data){
  if(!spec || !spec.opts) return spec;
  spec.opts = spec.opts.map((o, i) => {
    const E = EVENT_ODDS[key + ":" + i];
    if(!E || !o.fn || (E.when && !E.when())) return o;
    const orig = o.fn;
    let p; try { p = E.p(); } catch(e){ return o; }
    return Object.assign({}, o, {odds:p, fn:()=>{
      const ok = roll(p);
      if(E.rev){ if(ok) E.win(orig, data||{}); else orig(); }
      else { if(ok) orig(); else E.fail(orig, data||{}); }
    }});
  });
  return spec;
}
