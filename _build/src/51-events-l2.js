/* =====================================================================
   L2 事件(15 个,含马奔三幕)+ 延迟后果
   声音档案:
   马奔   短句，江湖气，叫你「兄弟」「南岸的」，从不说「请」
   周启明 极短，「嗯」「你看着办」，只问数
   陆明远 更短，话说一半
   顾清越 一句一个事，不寒暄
   邓宇   报数，叫「领导」
   许丽萍 规矩，叫「李行」式的姓+行，话里有分寸
   黎正   叫「哥」，谈人不谈事
   魏临川 码头腔，「兄弟」「莫得」
   冉国强 重庆话，「兄弟伙」
   ===================================================================== */
function mgrOf(oid){ const o = outlet(oid); return o && o.mgr ? person(o.mgr) : null; }
function bestMgrOutlet(){ return S.biz.outlets.filter(o=>o.mgr).sort((a,b)=>skillOf(b.mgr)-skillOf(a.mgr))[0]; }
function troubledOutlet(){ return S.biz.outlets.filter(o=>o.mgr && (o.overload || o.morale < 30)).sort((a,b)=>a.morale-b.morale)[0]; }
function chalL2(title, target, months, win, lose){ S.chal.push({id:title, title, start: depTotal(), target, due: S.turn + months, win, lose}); }
function l2Gray(){ return (S.flags.grayCount||0) - (S.flags.grayAtL2||0); }
function heShe(p){ return p && p.sex==="m" ? "他" : "她"; }

const EVENTS_L2 = [
/* 1 开门红 */
{id:"kmh2", title:"开门红", fixed:true, when:S=>S.m===1,
 body:S=>`正月初八，重庆分行十二楼大会议室。各支行行长按片区坐，南岸挨着渝北。\n\n马奔先报。数说完，他把话筒往你这边推了推。\n\n周启明看着表：「南岸。」`,
 opts:S=>[
  {t:"「一季度净增一个亿出头，南岸够得着。」", s:"一季度存款要净增1.1亿 · 周启明记着", fn:()=>{
    fav("zhouqm",1); chalL2("开门红任务",11000,2,6,-6);
    log("", "周启明在表上写了个数，没抬头。马奔在旁边敲了两下桌子。"); }},
  {t:"「比渝北多报两千万。」", s:"一季度要净增1.8亿 · 当场好看 · 做不到更难看", fn:()=>{
    fav("zhouqm",6); fav("maben",-3); chalL2("开门红任务",18000,2,8,-12);
    log("", "会议室里有人笑了一声。马奔侧过头看你，把话筒拿回去了。"); }},
  {t:"「南岸今年先把资产质量做扎实，存款报个保底。」", s:"周启明不高兴 · 顾清越听说了", fn:()=>{
    fav("zhouqm",-5); fav("gu",4); meet("gu");
    log("", "周启明把笔帽合上了。散会后，顾清越在电梯口等你：「这话对。」"); }},
 ]},

/* 2 马奔·挖人 */
{id:"mb1", title:"一条微信", once:true, fixed:true, when:S=>S.turn>=4 && !!bestMgrOutlet(),
 pick:S=>({oid: bestMgrOutlet().id}),
 body:(S,d)=>{ const e = mgrOf(d.oid); return `${e.name}下班后来找你，把手机放在桌上，屏幕朝上。\n\n是马奔的微信：「渝北零售部副总，考虑一下。兄弟不会亏待你。」\n\n${e.name}没说话，等你看完。`; },
 opts:(S,d)=>{ const e = mgrOf(d.oid), o = outlet(d.oid); return [
  {t:"你拿起电话打给马奔：「我的人，你莫动。」", s:"马奔记下了 · "+e.name+"觉得你护着"+heShe(e), fn:()=>{
    fav("maben",-8); fav(e.id,8);
    log("", `马奔在电话那头笑：「兄弟，开个玩笑嘛。」挂电话前他又说了一句：「人是留得住的，心不一定。」`); }},
  {t:`「我去分行给你争个行长助理的名头。」`, s:"周启明那里要欠个人情 · "+e.name+"留下", fn:()=>{
    fav("zhouqm",-4); fav(e.id,12); e.skill = c100((e.skill||50)+3);
    log("", `你在周启明办公室坐了二十分钟。一个月后，${e.name}的名片上多了一行字。`); }},
  {t:"「人往高处走。你去吧。」", s:e.name+"走了 · "+o.name+"暂时没人管", fn:()=>{
    fav("maben",5); e.pos = "渝北支行零售部副总"; e.recent = "跳去了渝北"; e.kind = "npc";
    o.mgr = null; o.morale = c100(o.morale-10);
    keyEvent(`${e.name}去了渝北`);
    log("bad", `${e.name}走的那天，把网点的钥匙放在你桌上，钥匙圈上还挂着个平安符。${o.name}先空着。`); }},
 ];}},

/* 3 马奔·抢客户 */
{id:"mb2", title:"低零点三", once:true, fixed:true, when:S=>S.turn>=8 && (()=>{ const p = project("yujiang"); return p && !p.lost && p.stage<3; })(),
 body:S=>`魏临川打来电话，背景里是码头的汽笛声。\n\n「兄弟，渝北的马奔昨天来了，利率比你们低零点三，还说结算账户一起给我开好。」他停了一下，「我这人讲感情，但是账要算。」`,
 opts:S=>[
  {t:"「我们跟。利率往下让。」", s:"项目过会的把握大一些 · 利润让出去一块", fn:()=>{
    S.flags.projBonus = S.flags.projBonus||{}; S.flags.projBonus.yujiang = 0.12; fav("weilc",5); S.biz.ytd.profit -= 60;
    log("", "你让韩冬重做了方案。魏临川看完回了两个字：可以。"); }},
  {t:"「魏总，晚上朝天门，我请。」", s:"魏临川很受用 · 这顿饭有点贵", gray:true, fn:()=>{
    S.flags.projBonus = S.flags.projBonus||{}; S.flags.projBonus.yujiang = 0.18; fav("weilc",12); dirt(4); S.biz.budget = Math.max(0, S.biz.budget-2);
    log("warn", "那天喝到十一点。魏临川搂着你的肩膀，指着江对面：「那边是渝北，这边是南岸。我晓得站哪边。」"); }},
  {t:"「利率不让。南岸做事怎么样，魏总心里有数。」", s:"可能保住，也可能丢", fn:()=>{
    if(R()<0.5){ const p = project("yujiang"); p.lost = true; const r = S.rivals.find(x=>x.id==="yubei"); if(r) r.bonus = 6; fav("weilc",-4);
      log("bad", "一周后，渝江物流的账户开在了渝北。马奔在行长群里发了张签约照片。"); }
    else { fav("weilc",4); log("good", "魏临川在电话里骂了一句马奔，说他去年一笔款子放得拖拖拉拉。他没提利率的事了。"); }
  }},
 ]},

/* 4 马奔·暴雷 */
{id:"mb3", title:"半夜的电话", once:true, fixed:true, when:S=>S.turn>=18,
 body:S=>`夜里十二点，马奔打来电话，声音是哑的。\n\n「兄弟，渝北有个大户的贷款后天到期。转贷基金排不上号，外头拆借日息千分之三，他扛不住。」他喘了口气，「你给他关联公司放一笔流贷，八千万，他拿去把渝北的还了，渝北马上续给他。三天，钱就回来。」\n\n电话里有打火机响了两下，没点着。`,
 opts:S=>[
  {t:"「三天。第四天早上钱要回来。」", s:"马奔欠你个大人情 · 这笔钱不一定回得来 · 留底", gray:true, fn:()=>{
    dirt(12); fav("maben",20); S.flags.mabenHelped = true;
    S.loanBook.push({id:"bridge", name:"渝北大户关联公司流贷", amt:8000, tier:"high", src:"event", lv:2, at:S.monthAbs, defAt:S.monthAbs+2, def:R()<0.35, done:false});
    S.biz.loans += 8000;
    log("warn", "钱第二天下午走的。马奔发来一条语音，你没点开。"); }},
  {t:"「这个忙我帮不了。」", s:"马奔自己扛", fn:()=>{
    fav("maben",-10); S.flags.mabenFall = true;
    const r = S.rivals.find(x=>x.id==="yubei"); if(r){ r.shift -= 10; }
    log("", "电话那头很久没声音。挂之前，马奔说：「行，南岸的。」"); }},
  {t:"「马奔，这事我得报分行。」", s:"马奔恨上你 · 分行和风险条线记你一笔", fn:()=>{
    fav("maben",-30); fav("zhouqm",6); fav("gu",8); meet("gu"); S.flags.mabenFall = true; S.flags.reportedMaben = true;
    const r = S.rivals.find(x=>x.id==="yubei"); if(r){ r.shift -= 14; }
    keyEvent("及时向分行报告同业风险");
    log("", "第二天上午，分行风险部的人进了渝北。马奔的车在停车场停了一整天，没人去开。"); }},
 ]},

/* 5 撂挑子 */
{id:"ltz", title:"这个数", cd:6, weight:5, when:S=>S.biz.decompDone && !!troubledOutlet(),
 pick:S=>({oid: troubledOutlet().id}),
 body:(S,d)=>{ const e = mgrOf(d.oid), o = outlet(d.oid); return `${e.name}把今年的任务书放在你桌上，没坐。\n\n「${S.player.sur}行，${o.name}去年净增多少，你是晓得的。」${heShe(e)}用指头点了点那个数，「这个，我做不了。」`; },
 opts:(S,d)=>{ const e = mgrOf(d.oid), o = outlet(d.oid); return [
  {t:"「数不改。做到了，年底我去分行给你争。」", s:"数压着 · "+e.name+"不太痛快", fn:()=>{
    fav(e.id,-4); o.morale = c100(o.morale+3);
    log("", `${e.name}把任务书拿回去了。那天晚上${o.name}的灯亮到九点。`); }},
  {t:"「减两千万。差的我从对公那边补。」", s:o.name+"任务减0.2亿 · 士气回来", fn:()=>{
    o.target = Math.max(0, o.target-2000); o.overload = false; o.morale = c100(o.morale+10); fav(e.id,6);
    log("good", `${e.name}出门的时候，把门轻轻带上了。`); }},
  {t:"「做不了，我就换个做得了的。」", s:e.name+"记恨 · 其他负责人看在眼里", fn:()=>{
    fav(e.id,-15); o.morale = c100(o.morale-8); S.biz.outlets.forEach(x=>{ if(x.mgr && x.mgr!==e.id) fav(x.mgr,-2); });
    log("bad", `${e.name}站了两秒，说了声「晓得了」。第二天的周例会，没人主动发言。`); }},
 ];}},

/* 6 旧部 */
{id:"oldstaff", title:"老同事", once:true, weight:3, when:S=>S.turn>=3 && oldStaffAsk().length>0,
 pick:S=>({pid: oldStaffAsk()[0].id}),
 body:(S,d)=>{ const p = person(d.pid); return `${p.name}在支行楼下等你，手里拎着一袋弹子石老街的麻花。\n\n「${S.player.sur}行，」${heShe(p)}叫得有点生，「我在弹子石干了这么些年，想去对公学一学。」\n\n麻花袋子被${heShe(p)}捏出了一道褶。`; },
 opts:(S,d)=>{ const p = person(d.pid); const lead = person(S.biz.corp.lead); return [
  {t:`「我跟${lead.name}说，下个月你去对公团队。」`, s:"对公团队多个人 · 弹子石少个骨干", fn:()=>{
    p.pos = "南岸支行对公团队"; p.recent = "去了对公团队"; fav(p.id,10); lead.skill = c100((lead.skill||50)+4);
    const o = outlet("dzs"); o.morale = c100(o.morale-3);
    log("good", `${p.name}去对公报到那天，穿了一件新衬衫，领子还有折痕。`); }},
  {t:"「弹子石离不开你。再等一年。」", s:p.name+"有点失落", fn:()=>{
    fav(p.id,-6); const o = outlet("dzs"); o.morale = c100(o.morale+2);
    log("", `${p.name}说好，把麻花留下就走了。`); }},
  {t:"「先把对公的资格证考下来，我给你找书。」", s:p.name+"能力涨一截", fn:()=>{
    fav(p.id,4); p.skill = c100((p.skill||45)+8);
    log("", `你从办公室书柜里抽了三本书给${heShe(p)}。第二年春天，${heShe(p)}在群里发了张证书的照片。`); }},
 ];}},

/* 7 黄世海留下的 */
{id:"huangleg", title:"渝顺商贸", once:true, fixed:true, when:S=>S.turn===5,
 body:S=>`渝顺商贸的贷款逾期满九十天，进了不良。一千五百万。\n\n分行风险部打来电话，问当年那份贷后检查报告是谁做的。电话那头在翻纸，翻得很慢。`,
 opts:S=>{
  const base = ()=>{ S.biz.npl += 1500; S.loanBook.push({id:"yushun", name:"渝顺商贸", amt:1500, tier:"high", src:"legacy", lv:1, at:0, defAt:S.monthAbs, def:true, done:true}); };
  if(S.flags.signedHuang) return [
   {t:"「报告是我签的字。我去分行说明情况。」", s:"周启明、合规都要扣 · 顾清越看你认账", fn:()=>{ base(); fav("zhouqm",-4); fav("gu",2); S.kpi.comp = c100(S.kpi.comp-4);
     log("bad", "你在风险部的小会议室坐了两个钟头。出来的时候，签字那一页的复印件还在你手里。"); }},
   {t:"「那是黄世海让签的。」", s:"说的是实话，听的人不这么想", fn:()=>{ base(); fav("gu",-6); fav("zhouqm",-2); S.kpi.comp = c100(S.kpi.comp-6);
     log("bad", "电话那头「嗯」了一声，接着问：「那你当时去现场了吗？」"); }},
  ];
  if(S.flags.exposedHuang) return [
   {t:"「报告在档案里，库存和账面对不上，我写了的。」", s:"顾清越记着这件事", fn:()=>{ base(); fav("gu",8); fav("zhouqm",3); meet("gu");
     log("good", "风险部把那份报告调了出来。第二天顾清越发来一条短信：看到了。"); }},
  ];
  if(S.flags.luoSigned && person("luojian")) return [
   {t:"「罗建去看的，我让他去的。算我的。」", s:"罗建记情 · 合规扣分", fn:()=>{ base(); fav("luojian",10); S.kpi.comp = c100(S.kpi.comp-4);
     log("", "罗建后来听到了这件事。在走廊上碰到你，他站住，点了下头。"); }},
   {t:"「是罗建签的，让他去说明。」", s:"罗建心凉了", fn:()=>{ base(); fav("luojian",-12);
     log("", "罗建从风险部回来，把工牌摘下来放在桌上，过了一会儿又戴上了。"); }},
  ];
  return [{t:"「按程序处置，该核销核销。」", s:"前任留下的不良", fn:()=>{ base(); log("", "你在不良处置的审批单上签了字。经办人那一栏，写的还是黄世海。"); }}];
 }},

/* 8 陆明远 */
{id:"lujob", title:"保障房", once:true, weight:2, when:S=>S.turn>=6,
 body:S=>`陆明远的电话很短。\n\n「区里有个保障房项目，一个半亿，利率压得低。」他停了停，「别的行不太想做。你看看。」\n\n电话挂了。你手里的笔在纸上点了三个点。`,
 opts:S=>{ meet("lu"); return [
  {t:"「南岸来做。」", s:"陆明远记着 · 贷款+1.5亿 · 利润薄", fn:()=>{
    fav("lu",10); bookLoan("南岸区保障房项目", 15000, "low", "event"); S.biz.ytd.profit -= 120;
    keyEvent("承接区保障房项目");
    log("good", "合同签了。陆明远没再打电话来，年底分行评先进，南岸多了个名额。"); }},
  {t:"「利率太低，我让公司部算了账，这个做不了。」", s:"陆明远不太高兴", fn:()=>{
    fav("lu",-6); fav("zhouqm",2);
    log("", "你把测算表发了过去。陆明远回了一个字：好。"); }},
 ];}},

/* 9 顾清越 */
{id:"gufx", title:"几笔看不懂的", once:true, weight:3, when:S=>S.turn>=8 && S.loanBook.filter(l=>l.lv===2 && l.tier==="high" && l.src!=="legacy").length >= 2,
 body:S=>{ const n = S.loanBook.filter(l=>l.lv===2 && l.tier==="high").length; return `顾清越把一张打印的清单放在你桌上，上面有${n>9?"十几":["","一","两","三","四","五","六","七","八","九"][n]}行用铅笔勾过。\n\n「这些，我看不太懂。」她没坐，「你讲讲。」`; },
 opts:S=>{ meet("gu"); return [
  {t:"「以后这一类的，报你们风险部复核再批。」", s:"顾清越记你一笔 · 合规加分", fn:()=>{
    fav("gu",8); S.kpi.comp = c100(S.kpi.comp+3); S.flags.guReview = true;
    log("good", "顾清越把清单收回去，折了两折：「行。」"); }},
  {t:"「都在南岸的审批权限里，程序上没问题。」", s:"顾清越不满意", fn:()=>{
    fav("gu",-6);
    log("", "「程序。」她重复了一遍这两个字，走了。"); }},
 ];}},

/* 10 飞单 */
{id:"feidan", title:"一份合同", once:true, weight:2, when:S=>S.turn>=4 && !!mgrOf("chayuan"),
 body:S=>{ const e = mgrOf("chayuan"); return `${e.name}关上门，把一份合同放在你桌上。不是行里的产品，是一家私募的认购书。\n\n「茶园的理财经理卖的，三个客户，四百多万。」${heShe(e)}的声音压得很低，「钱还没出事。」`; },
 opts:S=>{ const e = mgrOf("chayuan"); return [
  {t:"「报分行，按规定处理。」", s:"合规扣分 · 客户那边要解释", fn:()=>{
    S.kpi.comp = c100(S.kpi.comp-3); fav(e.id,4); S.biz.csat = c100(S.biz.csat-2);
    log("", `那个理财经理被停了岗。${e.name}在网点晨会上念了一遍《员工行为守则》，念完没说别的。`); }},
  {t:"「让她自己去找客户把钱退回来，这事就到这。」", s:"一时压住了 · 留底", gray:true, fn:()=>{
    dirt(6); fav(e.id,2); if(R()<0.35) schedule("feidanLater", rint(3,6));
    log("warn", `${e.name}拿回合同，点了点头。出门前${heShe(e)}回头看了你一眼。`); }},
  {t:"「把三个客户请来，支行出面谈。」", s:"占用1点行动 · 客户安心", disabled:S.ap<1, fn:()=>{
    apUse(1); S.biz.csat = c100(S.biz.csat+3); S.kpi.comp = c100(S.kpi.comp-1); fav(e.id,3);
    log("good", "三个客户坐在会议室，你一个个讲清楚。最后一个老太太把茶杯放下：「你们早讲嘛。」"); }},
 ];}},

/* 11 存款大户 */
{id:"dahu", title:"拆迁款", cd:8, weight:2, when:S=>S.turn>=3 && !!mgrOf("sigongli"),
 body:S=>{ const e = mgrOf("sigongli"); return `${e.name}打来电话：「哥，四公里刘家的拆迁款，三千万，要转去对面做理财。」\n\n那边有人在吵，是一家子人的声音。${e.name}捂住话筒说了句什么，又拿开。\n\n「你能不能过来一趟？」`; },
 opts:S=>{ const e = mgrOf("sigongli"), o = outlet("sigongli"); return [
  {t:"「我下午过去。」", s:"占用1点行动 · 钱留住", disabled:S.ap<1, fn:()=>{
    apUse(1); fav(e.id,4);
    log("good", "刘家三兄弟在网点贵宾室吵了一下午。你让他们各自开了户，钱分三份，都存在四公里。"); }},
  {t:`「你先处理，${e.name}。」`, s:"成败看"+e.name, fn:()=>{
    if(R() < 0.3 + skillOf(e.id)/200){ fav(e.id,3); log("good", `${e.name}请刘家老大吃了顿饭，钱没走。`); }
    else { o.dep -= 3000; log("bad", "晚上八点，刘家的钱转走了。四公里的存款日报掉了一截。"); }
  }},
  {t:"「给刘家申请个利率上浮。」", s:"周启明嫌麻烦 · 利润让一点", fn:()=>{
    fav("zhouqm",-3); S.biz.ytd.profit -= 30;
    log("", "上浮的审批单在周启明桌上放了三天才签。钱留住了。"); }},
 ];}},

/* 12 关系贷 */
{id:"relloan", title:"打过招呼", once:true, weight:2, when:S=>S.turn>=5,
 body:S=>`周启明的电话：「恒通商贸，三千万，材料在你们公司部。」\n\n「嗯。」他停了一下，「你看着办。」\n\n韩冬把材料拿上来。流水是上个月才开始变好看的。`.replace("韩冬", person(S.biz.corp.lead).name),
 opts:S=>[
  {t:"你在审批单上签了字。", s:"周启明满意 · 贷款+0.3亿 · 这笔不好说", gray:true, fn:()=>{
    dirt(6); fav("zhouqm",8); bookLoan("恒通商贸", 3000, "high", "event");
    log("warn", "放款那天，周启明在群里给南岸点了个赞。"); }},
  {t:"「材料我再看看。」", s:"拖着", fn:()=>{
    if(R()<0.5) fav("zhouqm",-4);
    log("", "你让公司部补了三次材料。恒通商贸后来没再来。"); }},
  {t:"「周行，这单南岸的权限批不了，您看走分行的额度。」", s:"周启明不高兴 · 顾清越听说了", fn:()=>{
    fav("zhouqm",-8); fav("gu",4);
    log("", "周启明挂电话之前说：「好，我知道了。」"); }},
 ]},

/* 13 冉国强 */
{id:"ranloan", title:"第三家店", once:true, weight:2, when:S=>S.turn>=4 && !!person("ranguoq"),
 body:S=>`冉国强在支行楼下打电话，一身牛油味顺着电话线都闻得到。\n\n「兄弟伙，冉记要开第三家了，在南坪万达。差三百万。」他顿了一下，${S.flags.ranFake?"「还是上回那种搞法嘛，快。」":"「这回我把账本都带来了。」"}`,
 opts:S=>[
  {t:"「走经营贷。流水和租赁合同拿来。」", s:"贷款+300万 · 规规矩矩", fn:()=>{
    bookLoan("冉记老灶", 300, S.flags.ranFake?"mid":"low", "event"); fav("ranguoq",5);
    log("", "冉国强把两年的流水打出来，一尺厚，用麻绳捆着。"); }},
  {t:"「还是走消费贷，快。」", s:"冉国强满意 · 用途不实", gray:true, fn:()=>{
    dirt(5); bookLoan("冉记老灶", 300, "high", "event"); fav("ranguoq",10);
    log("warn", "一周放款。冉国强请全支行吃了顿火锅，锅底是他亲自炒的。"); }},
  {t:"「冉哥，今年火锅不好做，缓一缓。」", s:"冉国强不高兴", fn:()=>{
    fav("ranguoq",-8);
    log("", "冉国强说「要得」，挂了电话。南坪万达那家店后来还是开了，贷款是在渝北办的。"); }},
 ]},

/* 14 魏临川 */
{id:"weidrink", title:"朝天门", once:true, weight:3, when:S=>S.turn>=3 && (()=>{ const p = project("yujiang"); return p && !p.lost && p.stage<3; })(),
 body:S=>`魏临川发来个定位，朝天门码头边上的一家夜宵摊。\n\n「几个跑船的兄弟，你来认识一下。」后面跟了一句语音，你点开，是一片划拳的声音。`,
 opts:S=>[
  {t:"你去了，端起杯子。", s:"魏临川很受用 · 陪客户喝酒", gray:true, fn:()=>{
    dirt(2); fav("weilc",10); S.flags.projBonus = S.flags.projBonus||{}; S.flags.projBonus.yujiang = (S.flags.projBonus.yujiang||0)+0.1;
    log("warn", "那天你认识了四个船老板，记住了两个名字。魏临川送你上车，拍了三下车顶。"); }},
  {t:"你去了，只喝茶。", s:"魏临川还算高兴", fn:()=>{
    fav("weilc",4);
    log("", "魏临川看了一眼你的茶杯，没劝。散的时候，他把烟盒里剩下的两根烟塞进了你口袋。"); }},
  {t:"「魏总，这周实在排不开。」", s:"魏临川不太高兴", fn:()=>{
    fav("weilc",-4);
    log("", "魏临川回了个「好」。那晚的照片他发在了朋友圈，定位是朝天门。"); }},
 ]},

/* 15 内审 */
{id:"neishen", title:"内审进驻", once:true, fixed:true, when:S=>S.turn>=14 && (R()<0.3 || S.turn>=20),
 body:S=>`分行内审组进驻南岸两周。组长姓孔，五十来岁，带着保温杯和U盘。\n\n他们要了一间会议室，门一直关着。第三天，孔组长来问：「这两年的授信审批底稿，都在这儿了吗？」`,
 opts:S=>{ const dirty = l2Gray() >= 2; return [
  {t:"「都在。孔组长要什么，我让人去调。」", s:"如实接受检查", fn:()=>{
    if(dirty){ S.kpi.comp = c100(S.kpi.comp-12); fav("gu",2); log("bad", "两周后，内审报告里有一页专门写南岸，标题是《授信管理中存在的问题》。"); }
    else { S.kpi.comp = c100(S.kpi.comp+4); fav("gu",6); keyEvent("内审进驻两周无重大问题"); log("good", "孔组长走的时候，把保温杯里的茶叶倒进了垃圾桶，说南岸的底稿理得清楚。"); }
  }},
  {t:"「孔组长辛苦，晚上一起吃个便饭？」", s:"……", fn:()=>{
    fav("gu",-8);
    if(dirty) S.kpi.comp = c100(S.kpi.comp-12); else S.kpi.comp = c100(S.kpi.comp+2);
    log("", "孔组长摆了摆手：「纪律。」这事后来传到了顾清越那里。"); }},
 ];}},
];

const EVENTS_LATER_L2 = {
  feidanLater: {title:"私募爆了",
    body:S=>`那家私募的老板联系不上了。\n\n三个客户里的一个，拿着认购书去了监管局。认购书右下角有个章，印着茶园网点的名字。行里查了，是萝卜章。`,
    opts:S=>[
      {t:"「配合调查。」", s:"合规大扣分 · 满意度下降", fn:()=>{
        S.kpi.comp = c100(S.kpi.comp-12); S.biz.csat = c100(S.biz.csat-5); fav("zhouqm",-5);
        log("bad", "监管的约谈函寄到支行，收件人写的是你的名字。"); }},
    ]},
};
Object.assign(EVENTS_LATER, EVENTS_LATER_L2);

function oldStaffAsk(){
  return S.people.filter(p => p.kind==="staff" && p.skill!=null && p.pos.indexOf("离职")<0 && p.pos.indexOf("负责人")<0 && p.pos.indexOf("对公")<0 && p.fav >= 55)
    .sort((a,b)=>b.fav-a.fav);
}
