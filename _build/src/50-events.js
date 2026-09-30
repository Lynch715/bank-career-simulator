/* =====================================================================
   L1 事件(15 个)+ 延迟后果
   正文不出数值;选项下方的小字 s 是界面提示
   ===================================================================== */
function chal(id, title, target, months, win, lose){
  S.chal.push({id, title, start: depTotal(), target, due: S.turn + months, win, lose});
}
function firstTeller(){ return S.staff.filter(s=>s.role==="teller")[0] || S.staff[0]; }
function stressed(){ return S.staff.filter(s=>s.fatigue>75 || s.fav<35).sort((a,b)=>(b.fatigue-b.fav)-(a.fatigue-a.fav))[0]; }

const EVENTS = [
/* 1 开门红 */
{id:"kmh", title:"开门红", fixed:true, when:S=>S.m===1,
 body:S=> S.year===1
 ? `正月初八，南岸支行三楼会议室。横幅上「开门红」三个字挂歪了，黄世海让人重新挂了一遍。\n\n各网点报一季度的数。南坪的邓宇报得最大，黄世海点了点头，没说话。\n\n轮到弹子石。黄世海没看你，看的是手里的表。`
 : `又是正月初八，还是三楼会议室，横幅是去年那条。\n\n黄世海把去年各网点一季度的完成情况投在墙上，弹子石那一行${S.flags.kmhLast==="win"?"是绿的":"标了黄"}。\n\n「今年，」他把激光笔放下，「弹子石先报。」`,
 opts:S=>[
  {t:"「报一个跳一跳够得着的数。」", s:"一季度存款要净增0.12亿 · 做到了黄世海记着", fn:()=>{
    fav("huang",1); chal("kmh","开门红任务",1200,2,6,-6); S.flags.kmhLast="small";
    log("", "你报了一个数。黄世海在表上写下来，写完用笔在后面点了一下。"); }},
  {t:"「报个大数，先把会开过去。」", s:"一季度要净增0.25亿 · 当场好看 · 做不到更难看", fn:()=>{
    fav("huang",6); chal("kmh","开门红任务",2500,2,8,-12); S.flags.kmhLast="big";
    log("", "你报完，会议室里有人抬头看了你一眼。黄世海说：「这才像话。」"); }},
  {t:"「网点人手紧，数我回去算清楚再报。」", s:"黄世海不高兴 · 员工觉得你护着他们", fn:()=>{
    fav("huang",-6); allStaffFav(3); S.flags.kmhLast="none";
    log("bad", "黄世海把笔放下了：「那你回去算，算清楚。」散会后电梯里没人跟你说话。"); }},
 ]},

/* 2 适当性 */
{id:"sdx", title:"适当性", once:true, weight:3, when:S=>S.turn>=2 && staff("suxw") && card("zhangxf") && card("zhangxf").own>30,
 body:S=>`苏晓雯把张秀芬领进理财室，门一关，先给阿姨倒了杯水。\n\n「阿姨想要收益高点的。」她把一张产品单推到你面前，是一只权益基金，R4。张秀芬的测评是R2。\n\n「测评我陪阿姨重新做一遍，」苏晓雯压低声音，「阿姨自己也愿意。这个月中收就差这一口。」\n\n张秀芬捧着水杯，看看她，又看看你。`,
 opts:S=>[
  {t:"「阿姨，我们按您的等级来，给您看两款稳当的。」", s:"中收+0.8万 · 苏晓雯有点失望", fn:()=>{
    feeAdd(0.8); sfav("suxw",-3); fav("zhangxf",5);
    log("", "张秀芬买了一款一年期的稳健理财。苏晓雯出门时把产品单揉成一团，又展开，压平，放回了抽屉。"); }},
  {t:"「晓雯，你带阿姨把测评重新做一遍。」", s:"中收+4.5万 · 这事留了底", gray:true, fn:()=>{
    feeAdd(4.5); dirt(8); sfav("suxw",6); S.flags.dirtyWealth=(S.flags.dirtyWealth||0)+1;
    if(R()<0.6) schedule("complaintV", rint(3,6), {cardId:"zhangxf"});
    log("warn", "测评做了第二遍，结果是C4。张秀芬在双录的镜头前念完了那段话，念错了一个字，又重念了一遍。"); }},
  {t:"「晓雯，你先出去，我跟阿姨说。」", s:"一分中收没做 · 张秀芬记下了", fn:()=>{
    csatAdd(2); fav("zhangxf",12); sfav("suxw",-2);
    log("good", "你拿了张白纸，给张秀芬画了一条去年跌了百分之十五的曲线。她看了很久，说：「那我还是存定期。」"); }},
 ]},

/* 3 反诈 */
{id:"fanzha", title:"安全账户", once:true, weight:3, when:S=>S.turn>=4,
 body:S=>`上午十点，唐亮在大堂拦下一个老人。\n\n老人叫陈德贵，七十出头，手机贴在耳朵上一直没放下，要把二十万转到「安全账户」。唐亮问一句，他就往后退一步。\n\n「我儿子出事了，你们莫耽搁我。」\n\n电话那头的人还在说话。唐亮回头看你。`,
 opts:S=>{
  const tl = staff("tangliang");
  return [
  {t:"「先稳住他，我来报110。」", s:"占用本月1点行动 · 大概率拦得下", disabled:S.ap<1, fn:()=>{
    apUse(1); S.flags.fanzhaSaved = R()<0.92; fanzhaResult(S.flags.fanzhaSaved); }},
  {t:`「${tl?tl.name:"小唐"}，你陪他坐一下，找他儿子的电话。」`, s:`不占行动 · 成败看${tl?tl.name:"大堂"}`, fn:()=>{
    const p = 0.45 + (tl?tl.op:3)*0.05; S.flags.fanzhaSaved = R()<p; fanzhaResult(S.flags.fanzhaSaved); }},
  {t:"「他自己的钱，按流程办，让他签风险提示书。」", s:"省事", fn:()=>{
    schedule("fanzhaLost", 1);
    log("", "陈德贵在风险提示书上签了字，笔握得很紧，最后一笔拉出去老长。"); }},
 ];}},

/* 4 投诉 */
{id:"tousu", title:"投诉单", cd:6, weight:2, when:S=>S.turn>=3 && (S.biz.csat<78 || R()<0.3),
 body:S=>`支行转来一张投诉单。\n\n一位姓刘的老太太周二上午在弹子石排了一个半小时，中途起来两次，最后没办成。她女儿打的电话，话说得不好听，最后一句是「你们银行是不是只认有钱人」。\n\n支行在单子上批了四个字：限期回复。`,
 opts:S=>[
  {t:"「买箱水果，我下班去刘家一趟。」", s:S.biz.budget>=0.3?"营销费用-0.3万 · 投诉撤了":"自己掏的钱 · 投诉撤了", fn:()=>{
    if(S.biz.budget>=0.3) budgetAdd(-0.3); csatAdd(3);
    log("good", "刘家在六楼，没电梯。老太太开门看到你手里的水果：「你们主任亲自来的啊。」第二天支行说投诉撤了。"); }},
  {t:"「把那天的柜员叫来，查清楚是谁的窗口。」", s:"合规扣分 · 柜员不高兴", fn:()=>{
    const t = firstTeller(); compAdd(-3); csatAdd(1); if(t) sfav(t.id,-8);
    log("", `是${t?t.name:"柜员"}的窗口。那天上午系统卡了四十分钟，${t?pr(t):"她"}没解释，只说了句「晓得了」。`); }},
  {t:"「按模板回复，说明当日业务量大。」", s:"合规扣分 · 满意度下降", fn:()=>{
    compAdd(-3); csatAdd(-2);
    log("", "回复发出去了。三天后刘家女儿在小区业主群里转了一张截图。"); }},
 ]},

/* 5 黄世海·压指标 */
{id:"huang1", title:"加担子", fixed:true, when:S=>S.turn===3,
 body:S=>`黄世海把你叫到支行。他的烟灰缸是满的，窗户开着一条缝。\n\n「分行给南岸加了担子。」他把一张表转过来，弹子石那一栏后面用红笔添了个数，「上半年再多扛两千万。南坪邓宇已经认了。」\n\n他点了根烟，等你开口。`,
 opts:S=>[
  {t:"「认。」", s:"黄世海满意 · 到6月底存款要净增0.3亿", fn:()=>{
    fav("huang",8); chal("h1","上半年加压任务",3000,3,6,-10);
    log("", "黄世海把烟灰弹了弹：「这就对了嘛。」"); }},
  {t:"「认可以。您给弹子石批点营销费用。」", s:"营销费用+2万 · 到6月底净增0.22亿", fn:()=>{
    budgetAdd(2); fav("huang",2); chal("h1","上半年加压任务",2200,3,4,-6);
    log("", "黄世海看了你两秒，在另一张单子上签了字：「你倒是会算账。」"); }},
  {t:"「黄行，弹子石现在五个人，这个数扛不起。」", s:"黄世海不高兴 · 员工觉得你护着他们", fn:()=>{
    fav("huang",-10); allStaffFav(4);
    log("bad", "黄世海没接话，把表收回去，拿起了座机。你出门的时候他已经在给南坪打电话了。"); }},
 ]},

/* 6 黄世海·季末时点 */
{id:"huang2", title:"九月二十八号", fixed:true, when:S=>S.turn===9,
 body:S=>`九月二十八号，黄世海打电话来，声音压得很低。\n\n「三十号下午有笔钱进你那儿，三千万，一个小贷公司的。一号早上走。」他顿了一下，「季末排名分行要看。你让柜台接一下就行。」\n\n去年分行刚为存款偏离度通报过两家支行。`,
 opts:S=>[
  {t:"「晓得了，黄行。」", s:"季末存款+0.3亿，十月初转走 · 黄世海记你一功 · 这事有底", gray:true, fn:()=>{
    dirt(10); fav("huang",10); S.biz.timepoint = 3000; S.flags.huangDeal=(S.flags.huangDeal||0)+1;
    log("warn", "三十号下午四点五十，三千万进了账。何静看了一眼金额，什么都没问。"); }},
  {t:"「这笔我接不了，偏离度在查。」", s:"黄世海不高兴 · 分行有人听说了", fn:()=>{
    fav("huang",-8); fav("gu",5);
    log("", "电话那头沉默了几秒：「行，你清高。」"); }},
  {t:"「您给我发个书面通知，我照办。」", s:"钱不会来 · 黄世海记住了", fn:()=>{
    fav("huang",-4); S.flags.askedPaper = 1;
    const r = S.rivals.find(x=>x.id==="haitangxi"); if(r) r.bonus = 8;
    log("", "电话那头骂了一句，挂了。三十号那笔钱去了海棠溪。"); }},
 ]},

/* 7 黄世海·签字 */
{id:"huang3", title:"一份贷后报告", fixed:true, when:S=>S.turn===16,
 body:S=>`黄世海递过来一份贷后检查报告，借款人是渝顺商贸，地址在弹子石老街，离你的网点五百米。\n\n「你离得近，签个字，证明去看过了。」他翻到最后一页，笔帽已经拔了，「这家老板我认得，没得问题。」\n\n报告上写着：库存充足，经营正常。你没去过。`,
 opts:S=>[
  {t:"你签了字，把笔还给他。", s:"黄世海好感大涨 · 你的名字在这份报告上", gray:true, fn:()=>{
    dirt(12); fav("huang",12); S.flags.signedHuang = 1;
    log("warn", "黄世海把报告收进抽屉，拍了拍你的肩膀：「这才是自己人。」"); }},
  {t:"「我下午去看一眼，看了再签。」", s:"下个月少1点行动 · 看到什么写什么", fn:()=>{
    S.flags.apDebt = (S.flags.apDebt||0)+1; fav("huang",-15); fav("gu",10); meet("gu"); S.flags.exposedHuang = 1;
    keyEvent("在贷后报告上如实写下「库存与账面不符」");
    log("", "下午三点你到了渝顺商贸。卷帘门拉起一半，里面堆着几十个空纸箱。你在报告上写「库存与账面不符」，签了名，复印了一份自己留着。"); }},
  {t:"「让罗建去看，他跑外拓熟。」", s:"罗建签的字 · 罗建不太痛快", gray:true, fn:()=>{
    dirt(4); sfav("luojian",-8); fav("huang",4); S.flags.luoSigned = 1;
    log("", "罗建去了二十分钟就回来了，在报告上签了名。他没说看到了什么，你也没问。"); }},
 ]},

/* 8 断卡 */
{id:"duanka", title:"开卡", once:true, weight:2, when:S=>S.turn>=3,
 body:S=>{ const t = firstTeller(); return `一个二十出头的小伙子在柜台前坐下，要开一张一类卡。\n\n${t.name}看了他的身份证，户籍是外省，开户理由写的「找工作发工资」。问是哪家公司，小伙子想了一下，说还没定。\n\n系统显示他这周在南岸已经开过两张卡了。${t.name}把身份证放在台面上，没有递回去。`; },
 opts:S=>{ const t = firstTeller(); return [
  {t:"「按断卡要求，请他说清楚用途，说不清就不办。」", s:"合规加分 · 这人走的时候骂了一句", fn:()=>{
    compAdd(2); csatAdd(-1); sfav(t.id,3);
    log("", `小伙子起身把椅子踢了一下。${t.name}把这张开户申请拍了照，发到了支行运营群。`); }},
  {t:"「给他开个二类户，限额低，出不了大事。」", s:"有效客户+1 · 留了个尾巴", fn:()=>{
    custAdd(1); if(R()<0.3) schedule("duankaLater", rint(2,4), {soft:true});
    log("", "二类户开出去了，单日限额五千。小伙子拿着卡看了看，走了。"); }},
  {t:"「开吧，有效客户也是客户。」", s:"有效客户+1 · 出事了要追责", gray:true, fn:()=>{
    custAdd(1); dirt(5); if(R()<0.7) schedule("duankaLater", rint(2,4), {soft:false});
    log("warn", `${t.name}把身份证递了回去，没看你。`); }},
 ];}},

/* 9 辞职 */
{id:"lizhi", title:"一张纸", cd:4, weight:4, when:S=>S.turn>=3 && !!stressed(),
 pick:S=>({sid: stressed().id}),
 body:(S,d)=>{ const e = staff(d.sid); return `下班后${e.name}没走，在你门口站了一会儿才敲门。\n\n${pr(e)}把一张纸放在桌上，折过两道。「${S.turn>12?S.player.sur+"主任":"领导"}，我想了很久。」\n\n纸上写的是辞职申请。`; },
 opts:(S,d)=>{ const e = staff(d.sid); if(!e) return [{t:"算了。", s:"", fn:()=>{}}]; return [
  {t:"「先别交，歇一周再说。」", s:`${e.name}休一周 · 本月少一个人干活`, fn:()=>{
    e.fatigue = c100(e.fatigue-45); e.off = S.turn; sfav(e.id,6);
    log("", `${e.name}把纸收回去了。第二天${pr(e)}的工位空着，桌上的仙人掌被唐亮挪到了窗台上。`); }},
  {t:"「我去支行给你争取一下绩效。」", s:"营销费用-1万，拿去补绩效", disabled:S.biz.budget<1, fn:()=>{
    budgetAdd(-1); sfav(e.id,10); e.fatigue = c100(e.fatigue-15);
    log("", `你在黄世海办公室坐了半个小时。月底${e.name}的绩效多了一千块，${pr(e)}没提这事，把辞职申请塞进了碎纸机。`); }},
  {t:"「好，我签字。」", s:`${e.name}走了 · 下个月来个新人`, fn:()=>{
    staffLeave(e.id); allStaffFav(-3);
    log("bad", `${e.name}最后一天把工牌交给了何静。晚上网点群里有人发了个「一路顺风」，没人接。`); }},
 ];}},

/* 10 短款 */
{id:"changkuan", title:"日终轧账", cd:8, weight:2, when:S=>S.turn>=3 && S.staff.some(s=>s.role==="teller"),
 pick:S=>({sid: pick(S.staff.filter(s=>s.role==="teller")).id}),
 body:(S,d)=>{ const e = staff(d.sid); return `日终轧账，${e.name}的尾箱短了两千块。\n\n${pr(e)}把钞票又点了三遍，脸是白的。何静在旁边帮着把当天的凭证一张张翻出来。`; },
 opts:(S,d)=>{ const e = staff(d.sid); return [
  {t:"「按规定报差错，该怎么扣怎么扣。」", s:"合规扣分 · 零差错记录断了", fn:()=>{
    compAdd(-2); resetNoErr(); sfav(e.id,-2);
    log("", `差错单是${e.name}自己填的，字写得很工整。`); }},
  {t:"「让她自己先补上，这事不往上报。」".replace("她", pr(e)), s:"记录保住了 · 欠你一个人情", gray:true, fn:()=>{
    dirt(4); sfav(e.id,6);
    log("warn", `第二天一早，${e.name}的尾箱里多了两千块，崭新的，连号。`); }},
  {t:"「调监控，一张一张对。」", s:"占用1点行动 · 七成能找回来", disabled:S.ap<1, fn:()=>{
    apUse(1);
    if(R()<0.7){ sfav(e.id,5); log("good", `监控看到第四十分钟，一位客户多拿了一沓。唐亮打电话过去，对方第二天上午把钱送了回来。`); }
    else { compAdd(-2); resetNoErr(); log("", "监控看到晚上九点，没找到。差错还是报了。"); }
  }},
 ];}},

/* 11 双录抽查 */
{id:"shuanglu", title:"抽查", once:true, fixed:true, when:S=>S.turn>=10 && (R()<0.25 || S.turn>=20),
 body:S=>`顾清越没打招呼就来了，自己拎着水杯。\n\n「风险条线抽查，」她在理财室坐下，「把这半年的双录调出来，我看三十条。」\n\n苏晓雯去开电脑，手在鼠标上停了一下。`,
 opts:S=>{
  meet("gu");
  const dirty = (S.flags.dirtyWealth||0) > 0;
  const arr = [
  {t:"「都调出来，顾总随便看。」", s:"如实接受检查", fn:()=>{
    if(dirty){ compAdd(-10); fav("gu",4); log("bad", "她看到第十七条停了下来，把那条又放了一遍，在本子上写了一行。走的时候说：「整改报告下周五给我。」"); }
    else { compAdd(3); fav("gu",10); keyEvent("风险条线飞行检查零问题"); log("good", "三十条看完，她在本子上写了两行字。走的时候说了句「还行」。"); }
  }},
  {t:"「中午了，顾总在这边吃个便饭？」", s:"……", fn:()=>{
    fav("gu",-8);
    if(dirty) compAdd(-10); else compAdd(2);
    log("", "「我带了饭。」她没抬头。"); }},
  ];
  if(dirty) arr.push({t:"「晓雯，先把那几条补一补。」", s:"补录能糊过去就糊过去", gray:true, fn:()=>{
    dirt(10);
    if(R()<0.45){ compAdd(-15); fav("gu",-15); S.flags.guCaught = 1; log("bad", "顾清越看到了录像的时间戳。她把电脑合上，看着你：「这个，我要写进报告。」"); }
    else { fav("gu",2); log("warn", "补录的那几条她没点开。苏晓雯送她到门口，回来靠在墙上站了很久。"); }
  }});
  return arr;
 }},

/* 12 挖客户 */
{id:"wajiao", title:"一桶油", once:true, weight:2, when:S=>S.turn>=5 && card("zhangxf") && card("zhangxf").own>50,
 body:S=>`张秀芬打来电话。对面那家股份行的小姑娘来家里坐了一下午，还拎了一桶油。\n\n「人家一年期比你们多零点三，」她在电话里笑，「我跟她说，我要问问小${S.player.sur}。」`,
 opts:S=>{ const c = card("zhangxf"); return [
  {t:"「阿姨，我明天上午来家里。」", s:"占用1点行动 · 稳住了", disabled:S.ap<1, fn:()=>{
    apUse(1); fav("zhangxf",10); c.maint = true;
    log("good", "张秀芬家的茶几上真放着一桶油。她给你削了个苹果，说：「我就是想看你来不来。」"); }},
  {t:"「我去支行申请利率上浮。」", s:"黄世海嫌你麻烦 · 客户留下", fn:()=>{
    fav("huang",-3); fav("zhangxf",3);
    log("", "黄世海签字的时候问了一句：「一个老太婆，至于吗？」"); }},
  {t:"「零点三确实多，阿姨您自己拿主意。」", s:"张秀芬转走一部分", fn:()=>{
    const out = Math.round(c.own*0.5); c.own -= out; c.other += out; fav("zhangxf",-10);
    log("bad", `第二周张秀芬来取了一笔，${fmtWan(out)}。她在柜台前多站了一会儿，说下回再来。`); }},
 ];}},

/* 13 火锅店 */
{id:"huoguo", title:"冉记老灶", once:true, weight:2, when:S=>S.turn>=6,
 body:S=>`冉国强的火锅店要开第二家了，在南滨路，四百平。他坐在你对面，一身牛油味。\n\n「兄弟，装修还差六十万。你们那个经营贷要等好久？」他把手机里的效果图一张张划给你看，「下个月开业，等不起。」\n\n网点办不了经营贷，要报支行个贷中心，走完一个月。`,
 opts:S=>[
  {t:"「我帮你对接支行，顺便把收单和员工代发放过来。」", s:"信用卡代发+12 · 存款+200万 · 冉国强记情", fn:()=>{
    cardAdd(12); depAdd(200); fav("ranguoq",10);
    log("good", "冉国强走的时候留下两张代金券，说开业那天一定来。店里十四个服务员的工资卡，第二个月都换成了泰和的。"); }},
  {t:"「走消费贷快，用途就写装修自己房子。」", s:"存款+300万 · 冉国强很满意 · 贷款用途不实", gray:true, fn:()=>{
    dirt(6); depAdd(300); cardAdd(4); fav("ranguoq",15); S.flags.ranFake = 1;
    log("warn", "贷款一周就批了。冉国强打电话来：「兄弟，以后有事说话。」"); }},
  {t:"「先把收单机装上，贷款慢慢来。」", s:"信用卡代发+4", fn:()=>{
    cardAdd(4); fav("ranguoq",2);
    log("", "收单机装在了收银台左边，冉国强嫌它占地方，往里推了推。"); }},
 ]},

/* 14 暴雨 */
{id:"baoyu", title:"七月的雨", once:true, fixed:true, when:S=>S.m===7,
 body:S=>`七月的雨下了一夜。早上七点半，何静打电话来，说网点门口的水漫过了第二级台阶，配电箱在跳闸。\n\n江边的几家铺子都没开门。门口已经有两个老人撑着伞在等。`,
 opts:S=>[
  {t:"「按应急预案，闭店挂牌，通知客户去南坪网点。」", s:"满意度下降 · 规规矩矩", fn:()=>{
    csatAdd(-2);
    log("", "告示贴在卷帘门上，让雨打湿了一角。那两个老人看完，撑着伞往坡上走了。"); }},
  {t:"「搬沙袋，接发电机，照常开门。」", s:"员工倦怠上升 · 满意度上升", fn:()=>{
    S.staff.forEach(s=>s.fatigue=c100(s.fatigue+20)); csatAdd(4); allStaffFav(2);
    keyEvent("暴雨天坚持开门营业");
    log("good", "中午雨停了。那两个老人办完业务没走，帮着把沙袋码回墙角。"); }},
 ]},

/* 15 陆明远调研 */
{id:"luxun", title:"调研", once:true, fixed:true, /* once 保证只来一次 */ when:S=>S.turn>=6 && (R()<0.3 || S.turn>=12),
 body:S=>`黄世海的电话只提前了十分钟：「陆行长在南岸调研，可能到你那儿看看。」\n\n十分钟后陆明远进了门，没穿外套，一个人走在前面，黄世海跟在后面半步。他在填单台边站了一会儿，看个老人填单。\n\n「你们网点，」他转过来，「一年流失多少客户？」\n\n黄世海在他身后看着你。`,
 opts:S=>{ meet("lu"); return [
  {t:"「去年流失了四十多户，大多是到期没接住。」", s:"陆明远记住了你 · 黄世海脸上挂不住", fn:()=>{
    fav("lu",10); fav("huang",-4); keyEvent("陆明远调研时如实汇报客户流失");
    log("", "陆明远点点头，没说什么。走的时候他拍了拍门口那台叫号机：「老了。」"); }},
  {t:"「不多，十来户。」", s:"黄世海满意", fn:()=>{
    fav("huang",4); fav("lu",1);
    log("", "陆明远「嗯」了一声，往里走了。黄世海走在最后，经过你的时候脚步慢了一下。"); }},
  {t:"「我把台账拿给您看。」", s:"陆明远翻了几页", fn:()=>{
    fav("lu",6); fav("gu",3);
    log("", "陆明远站着翻了三页，指着其中一行问是谁。你说是张秀芬，他笑了一下：「这个名字我记住了。」"); }},
 ];}},
];

/* 延迟后果 */
const EVENTS_LATER = {
  complaintV: {title:"对账单",
    body:(S,d)=>{ const c = card(d.cardId)||{name:"一位老客户"}; return `${c.name}的儿子来了，把一沓对账单拍在柜台上。\n\n「我妈七十岁了，你们卖她R4的基金？」他嗓门大，大堂里的人都转过来看，「风险测评是哪个做的？我要看双录。」\n\n基金亏了百分之十二。`; },
    opts:(S,d)=>{ const c = card(d.cardId); return [
      {t:"「是我们的问题。我陪您算，该怎么处理按规定来。」", s:"合规扣分 · 满意度下降 · 这事了了", fn:()=>{
        compAdd(-8); csatAdd(-3); if(c) c.complain = S.turn; if(staff("suxw")) sfav("suxw",-4);
        log("bad", "你们在理财室坐到晚上七点。他走到门口，回头：「我妈说你人不坏。」"); }},
      {t:"「测评是阿姨自己签的字。」", s:"他去打了投诉电话", fn:()=>{
        compAdd(-12); csatAdd(-6); dirt(3); fav("huang",-4); if(c) c.complain = S.turn;
        log("bad", "第三天，监管转办的投诉单到了支行。黄世海把单子复印了一份，放在你桌上。"); }},
    ];}},
  duankaLater: {title:"协查函",
    body:(S,d)=>`派出所来了两个人，拿着协查函。\n\n几个月前在弹子石开的那张卡，转进转出一百多万，钱是电诈案的。开户的人找不到了。`,
    opts:(S,d)=>[
      {t:"「配合调查，开户资料都在这。」", s:"合规扣分 · 支行被分行点名", fn:()=>{
        compAdd(d&&d.soft?-5:-10); fav("huang",-5);
        log("bad", "民警把开户影像拷走了。那个月分行的断卡通报里，弹子石排在第一行。"); }},
    ]},
  fanzhaLost: {title:"立案",
    body:(S,d)=>`陈德贵的儿子来了。二十万转出去第二天就被取空，派出所立了案。\n\n他没有吵，只是问你，那天柜台上有没有人提醒过他爸。`,
    opts:(S,d)=>[
      {t:"「有，我们让他签了风险提示书。」", s:"合规扣分 · 满意度下降", fn:()=>{
        compAdd(-10); csatAdd(-4); fav("huang",-4);
        log("bad", "他看着那张风险提示书上他爸的签名，看了很久，折起来装进了口袋。"); }},
    ]},
};

function fanzhaResult(ok){
  meet("chendg");
  if(ok){
    csatAdd(3); allStaffFav(2);
    keyEvent("拦下一笔二十万的电信诈骗");
    log("gold", "派出所的民警二十分钟后到了。陈德贵的儿子从外地打来电话，在那头哭，陈德贵把手机递给你，自己坐在椅子上一直擦眼镜。");
  } else {
    schedule("fanzhaLost", 1);
    log("bad", "唐亮去倒水的工夫，陈德贵从侧门走了。下午他在别的网点把钱转了出去。");
  }
}

function staffLeave(id){
  const e = staff(id); if(!e) return;
  S.staff = S.staff.filter(s=>s.id!==id);
  const p = person(id); if(p){ p.pos = "已离职"; p.recent = "辞职离开了弹子石"; }
  schedule("rookie", 1);
}
