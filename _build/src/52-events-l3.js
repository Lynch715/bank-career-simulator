/* =====================================================================
   L3 万州:12 个事件 + 3 个家里的事(每年二季度一个)
   声音档案:
   陆明远 极短，半句
   顾清越 一句一事
   程晓燕 快，报数
   冉光明 慢，万州话，「要得」
   谭敏   稳，只讲安排
   区里的人 客气，话里有话
   ===================================================================== */
function l3Gray(){ return (S.flags.grayCount||0) - (S.flags.grayAtL3||0); }
function nplRatioL3(){ return nplL3() / loansTotalL3() * 100; }
function bOf(id){ return branch(id); }

const EVENTS_L3 = [
/* 1 开门红 */
{id:"kmh3", title:"开门红", fixed:true, when:S=>S.m===3,
 body:S=>`重庆分行的开门红视频会，万州的画面在第三排左边。\n\n陆明远一个个点名。点到万州，他停了一下：「万州，今年打算怎么搞？」\n\n谭敏在你旁边把话筒的开关推上去了。`,
 opts:S=>[
  {t:"「存款保底三十亿，不良降下来。」", s:"陆明远记着", fn:()=>{ fav("lu",2); log("", "陆明远点了下头，画面切到了下一个分行。"); }},
  {t:"「万州今年冲一冲，存款报四十亿。」", s:"陆明远满意 · 一季度做不到难看", fn:()=>{
    fav("lu",6); S.chal.push({id:"kmh3", title:"开门红任务", start:depTotal(), target:90000, due:S.turn, win:4, lose:-8, sup:"lu"});
    log("", "会议室里安静了两秒。陆明远说：「好。」"); }},
  {t:"「万州先把前任留下的不良处置干净，存款不冒进。」", s:"陆明远不太高兴 · 顾清越听说了", fn:()=>{
    fav("lu",-4); fav("gu",5);
    log("", "陆明远没接话。散会后十分钟，顾清越发来一条短信：「这个思路对。」"); }},
 ]},

/* 2 南岸的电话 */
{id:"nanan", title:"南岸的电话", once:true, fixed:true, when:S=>(S.flags.nananDefault||[]).length > 0,
 body:S=>{ const n = S.flags.nananDefault; const succ = S.carry && S.carry.l2 && S.carry.l2.mgrName; return `${succ||"南岸现在的行长"}打来电话，声音压得很低。\n\n「${S.player.sur}行长，${n[0]}那笔，逾期了。分行风险部在查当年的审批，${n.length>1?"还有"+(n.length-1)+"笔也在名单上，":""}下周要请你回来讲一讲。」\n\n他停了一下：「我什么都没讲。」`; },
 opts:S=>[
  {t:"「我回来。当时怎么批的，我怎么讲。」", s:"跑一趟主城，下季少1点行动 · 顾清越看在眼里", fn:()=>{
    S.flags.apDebt = (S.flags.apDebt||0)+1; fav("gu",6); fav("lu",-2);
    keyEvent("回南岸说明当年的贷款审批");
    log("", "你在分行风险部的小会议室坐了一上午。出来的时候，汪明从万州打来电话，问你中午回不回来吃饭。"); }},
  {t:"「经办和审查都签了字，我这里有审批记录。」", s:"说得通 · 旧部心里不舒服", fn:()=>{
    fav("gu",-4); subsL2Names().forEach(id=>fav(id,-5));
    log("", "你把当年的审批单扫描发了过去。那天晚上，南岸支行的群里没人说话。"); }},
  {t:"你给周启明打了个电话。", s:"周启明帮你挡一下 · 留底", gray:true, fn:()=>{
    dirt(5); fav("zhouqm",-3);
    log("warn", "周启明在电话里说：「我知道了。」风险部后来没再来找你。"); }},
 ]},

/* 3 库区资金 */
{id:"yimin", title:"库区的钱", once:true, weight:3, when:S=>S.turn>=2,
 body:S=>`区移民局有一笔后扶资金要重新选存放银行，二十个亿，三年。\n\n谭敏把招标文件放在你桌上，封面上有一行手写的字，是区里一位科长的电话。「其他几家行都去拜访过了。」`,
 opts:S=>[
  {t:"「按招标文件做方案，利率报实价。」", s:"正常投标 · 看运气", fn:()=>{
    if(R()<0.45){ bOf("yyb").dep += 200000; keyEvent("中标区移民后扶资金存放"); log("good", "开标那天，万州分行的方案排第一。谭敏把中标通知复印了一份，贴在了办公室门背后。"); }
    else log("", "资金去了另一家行。科长后来在饭局上碰到你，说：「下次，下次。」");
  }},
  {t:"「利率往上报，拼一把。」", s:"大概率拿下 · 利润让出去一截", fn:()=>{
    if(R()<0.75){ bOf("yyb").dep += 200000; S.biz.ytd.profit -= 3000; log("good", "中标了。财务部算了一下，这笔钱三年下来几乎不赚。"); }
    else { S.biz.ytd.profit -= 0; log("", "利率报上去了，资金还是去了别家。"); }
  }},
  {t:"你让谭敏约那位科长吃顿饭。", s:"拿下的把握大 · 留底", gray:true, fn:()=>{
    dirt(6); bOf("yyb").dep += 200000;
    log("warn", "饭局在平湖边上。科长喝到第二杯，说了句「万州分行的同志实在」。一个月后资金到账。"); }},
 ]},

/* 4 汛期 */
{id:"flood", title:"汛期", once:true, fixed:true, when:S=>S.m===9 && S.year===1,
 body:S=>`长江涨水，滨江路封了。\n\n凌晨两点，${person("xiongw").name}打来电话：营业部负一楼的金库外面，水已经漫过了门槛。「押运车进不来。」`,
 opts:S=>[
  {t:"「按应急预案，金库资金连夜转移，营业部闭店。」", s:"稳妥 · 片区口碑掉一点", fn:()=>{
    const a = area("laocheng"); a.rep = c100(a.rep-4);
    log("", "天亮之前，最后一箱现金转到了高笋塘支行。营业部门口贴了闭店告示，让雨打湿了一角。"); }},
  {t:"你开车去了营业部。", s:"下季少1点行动 · 大家看在眼里", fn:()=>{
    S.flags.apDebt = (S.flags.apDebt||0)+1; subsL3().forEach(p=>fav(p.id,3));
    keyEvent("汛期夜里守在营业部金库");
    log("good", "你到的时候，熊伟穿着雨靴站在金库门口。你们俩一直守到押运车来。第二天全行都知道了。"); }},
 ]},

/* 5 同业挖人 */
{id:"poach3", title:"一张名片", once:true, weight:2, when:S=>S.turn>=3 && !!person(bOf("gst").mgr),
 body:S=>{ const p = person(bOf("gst").mgr); return `${p.name}把一张名片放在你桌上，是一家股份行的万州分行行长。\n\n「他们请我去当副行长，」${heShe(p)}看着窗外，「年薪翻一番。」\n\n名片背面写着手机号。`; },
 opts:S=>{ const x = bOf("gst"), p = person(x.mgr); return [
  {t:"「我跟分行申请，给你提个行长助理。」", s:"陆明远那里要欠人情 · 人留下", fn:()=>{
    fav("lu",-4); fav(p.id,10);
    log("", `${p.name}把名片收回去了。三个月后，分行的任命文件上多了一行字。`); }},
  {t:"「人往高处走。你去吧，我写推荐信。」", s:p.name+"走了 · 高笋塘换人", fn:()=>{
    p.pos = "股份行万州分行副行长"; p.recent = "跳去了股份行"; p.kind = "npc";
    const c = appointCandsL3(x.id).sort((a,b)=>b.skill-a.skill)[0];
    if(c){ x.mgr = c.id; c.pos = x.name+"行长"; c.kind = "sub"; c.recent = "顶了高笋塘的缺"; }
    log("", `${p.name}走那天，高笋塘支行的员工在楼下站了一排。${c?c.name+"第二天就去报到了。":""}`); }},
 ];}},

/* 6 烤鱼 */
{id:"kaoyu", title:"烤鱼", once:true, weight:2, when:S=>S.turn>=2,
 body:S=>`万州烤鱼有个连锁老板来找你，要在主城和成都开二十家店，想贷八千万。\n\n他带来一盘烤鱼，放在会议桌中间，还冒着热气。「行长，你尝一口，尝了再说。」`,
 opts:S=>[
  {t:"「做成县域特色产业贷，门店现金流做还款来源。」", s:"贷款+0.8亿 · 风险中等", fn:()=>{
    S.biz.loans.micro += 8000; bookLoanL3("万州烤鱼连锁", 8000, "mid");
    log("", "你尝了一口。老板盯着你：「咋样？」你讲辣。他笑了：「主城的店，做微辣。」"); }},
  {t:"「二十家太多，先做五家。」", s:"贷款+0.2亿 · 稳", fn:()=>{
    S.biz.loans.micro += 2000; bookLoanL3("万州烤鱼连锁", 2000, "low");
    log("", "老板有点不高兴，还是签了。那盘烤鱼后来让谭敏分给了办公室的人。"); }},
  {t:"「餐饮业这两年不好说，缓一缓。」", s:"不做", fn:()=>{
    log("", "老板把烤鱼端走了。半年后，他的店在解放碑开了，贷款是另一家行放的。"); }},
 ]},

/* 7 顾清越 */
{id:"gu3", title:"顾清越来万州", once:true, fixed:true, when:S=>S.turn>=4 && (R()<0.3 || S.turn>=7),
 body:S=>`顾清越来万州，坐的是早班高铁，没让人接。\n\n她在风险部待了一整天，汪明的门第一次开了一整天。傍晚她来你办公室，手里一张纸：「不良率${nplRatioL3().toFixed(2)}%。」她把纸放下，「你打算怎么办？」`,
 opts:S=>{ meet("gu"); const bad = nplRatioL3() > 2.0; return [
  {t:"「前任的烂账三年处置完，每季报给你看。」", s:bad?"顾清越记着 · 压力在你身上":"顾清越满意", fn:()=>{
    fav("gu", bad ? 4 : 8); S.flags.guPromise = true;
    log("", "她把那张纸折起来放进包里：「每季，我等着。」"); }},
  {t:"「万州的底子就这样，库区企业难做。」", s:"顾清越不满意", fn:()=>{
    fav("gu",-8);
    log("", "顾清越看了你一眼：「南岸的时候，你不是这么说话的。」"); }},
  {t:"「晚上一起吃个饭，我慢慢跟你讲。」", s:"……", fn:()=>{
    fav("gu",-4);
    log("", "「我坐七点的高铁。」她拿起水杯走了。"); }},
 ];}},

/* 8 陆明远 */
{id:"lu3", title:"陆明远", once:true, weight:3, when:S=>S.turn>=5,
 body:S=>`陆明远来万州开现场会，会后在江边走了一段。\n\n他在一截石阶上停下来，看着江对面：「南岸那几年，你批过的东西，有人在翻。」\n\n风很大，他的话吹散了一半。`,
 opts:S=>[
  {t:"「该我担的，我担。」", s:"陆明远记住了", fn:()=>{
    fav("lu",6); fav("gu",2);
    log("", "陆明远没说话，拍了一下栏杆，往回走了。"); }},
  {t:"「谁在翻？」", s:"陆明远不想多说", fn:()=>{
    fav("lu",-3);
    log("", "「你不用知道。」他把外套的扣子扣上了。"); }},
 ]},

/* 9 挪用 */
{id:"nuoyong", title:"八十万", once:true, weight:2, when:S=>S.turn>=5,
 body:S=>`长岭支行一个柜员，挪了客户的定期八十万，炒股亏了。客户来取钱，发现存单是假的。\n\n${person(bOf("cl").mgr).name}在电话里一直在道歉。\n\n这种事，按规定要在二十四小时内报分行。`,
 opts:S=>{ const p = person(bOf("cl").mgr); return [
  {t:"「马上报分行，报案。客户的钱，分行先垫。」", s:"合规大扣分 · 客户没损失", fn:()=>{
    S.kpi.comp = c100(S.kpi.comp-10); S.month.spent += 80; area("changling").rep = c100(area("changling").rep+2);
    log("bad", `分行的通报第二天就出来了。${p.name}被记过，他在长岭支行门口站了很久，把行长室的牌子摘了下来。`); }},
  {t:"「先让他家里把钱补上，再报。」", s:"晚报两天 · 留底", gray:true, fn:()=>{
    dirt(8); S.kpi.comp = c100(S.kpi.comp-4);
    if(R()<0.4){ S.kpi.comp = c100(S.kpi.comp-10); fav("gu",-8); log("bad", "迟报的事被分行查到了。通报里多了一句：负责人未及时报告。"); }
    else log("warn", "柜员的父母卖了一套房。第三天，钱补上了，报告才送到分行。");
  }},
 ];}},

/* 10 区里打招呼 */
{id:"quli", title:"区里的电话", once:true, weight:2, when:S=>S.turn>=3,
 body:S=>`区里一位副区长的秘书打来电话，很客气。\n\n「${S.player.sur}行长，天城那边有家企业，三个亿，材料在你们公司部。区里很重视。」停了一下，「领导说，万州的发展，要靠大家。」`,
 opts:S=>[
  {t:"「请公司部按流程审，有结果第一时间报给区里。」", s:"区里不太满意", fn:()=>{
    area("gongye").rep = c100(area("gongye").rep-3);
    log("", "材料审了一个月，风险部的意见是「担保不足」。秘书后来没再打来。"); }},
  {t:"你在审批单上签了字。", s:"贷款+3亿 · 区里记着 · 风险大", gray:true, fn:()=>{
    dirt(6); S.biz.loans.corp += 30000; bookLoanL3("天城化工配套", 30000, "high"); area("gongye").rep = c100(area("gongye").rep+5);
    log("warn", "放款那天，副区长在会上点了万州分行的名，说支持地方发展有担当。"); }},
 ]},

/* 11 撤网点上访 */
{id:"shangfang", title:"网点门口", once:true, fixed:true, when:S=>S.flags.closedAt && S.turn - S.flags.closedAt <= 2 && S.turn > S.flags.closedAt,
 body:S=>`撤掉的那个网点门口，来了十几个老人，坐在台阶上不走。\n\n领头的姓刘，八十岁，拿着一本存折：「我在这存了三十年钱，你们说关就关？」\n\n区里信访办的人也来了，站在旁边打电话。`,
 opts:S=>{ const a = area(S.flags.closedArea); return [
  {t:"你去了，坐在台阶上跟他们说。", s:"下季少1点行动 · 口碑回来一点", fn:()=>{
    S.flags.apDebt = (S.flags.apDebt||0)+1; a.rep = c100(a.rep+6);
    log("good", "你在台阶上坐了一下午。最后你答应每周二派一辆流动服务车来。刘大爷把存折收进了内衣口袋。"); }},
  {t:"「让支行派人解释，安排专车接到新网点。」", s:"平息一部分", fn:()=>{
    a.rep = c100(a.rep+2);
    log("", "支行租了一辆面包车，每天早上九点在老网点门口等。第一周坐满了，第二周只来了三个人。"); }},
 ];}},

/* 12 江南新区 */
{id:"jnfang", title:"江南新区的楼盘", once:true, weight:2, when:S=>S.turn>=6,
 body:S=>`江南新区有个楼盘停工了。开发商在万州分行有两亿的开发贷，还有一百多户业主的按揭。\n\n业主们拉了横幅，站在江南支行门口。横幅上写的是「停贷」。\n\n${person(bOf("jn").mgr).name}在电话里问你怎么办。`,
 opts:S=>{ const x = bOf("jn"); return [
  {t:"「按揭照常，开发贷配合区里保交楼。」", s:"不良+1亿 · 口碑稳住", fn:()=>{
    addNpa(10000, "corp", "停工楼盘"); area("jiangnan").rep = c100(area("jiangnan").rep+3);
    log("", "区里成立了专班，你是成员之一。每周三下午开会，开了四个月。"); }},
  {t:"「开发贷马上起诉，资产保全。」", s:"回收多一点 · 口碑掉", fn:()=>{
    addNpa(6000, "corp", "停工楼盘"); area("jiangnan").rep = c100(area("jiangnan").rep-8);
    log("", "诉讼保全冻结了开发商的账户。第二天，横幅上多了一行字，写的是万州分行。"); }},
 ];}},
];

/* 家里的事:每年二季度一个 */
const FAMILY_L3 = [
{id:"fam1", title:"家长会", fixed:true, when:S=>S.m===6 && S.year===1,
 body:S=>`爱人打来电话。孩子这学期的家长会，你又没去。\n\n「老师问我，孩子爸爸妈妈是不是有个不在重庆。」电话那头停了一下，「我说在万州。」\n\n电话里有电视的声音，孩子在看什么动画片。`,
 opts:S=>[
  {t:"「下周五我请假回来，接他放学。」", s:"下季少1点行动 · 家里记着", fn:()=>{ S.flags.apDebt = (S.flags.apDebt||0)+1; S.flags.family = (S.flags.family||0)+1; keyEvent("在万州的第一年，回主城接孩子放学"); log("", "那个周五你四点到的学校。孩子从校门出来，看到你，愣了一下才跑过来。"); }},
  {t:"「这段时间忙，过完这个季度。」", s:"工作不耽误", fn:()=>{ S.flags.family = (S.flags.family||0)-1; fav("lu",2); log("", "爱人说好。那天晚上你在办公室待到十一点，谭敏走的时候帮你关了走廊的灯。"); }},
 ]},
{id:"fam2", title:"医院", fixed:true, when:S=>S.m===6 && S.year===2,
 body:S=>`母亲住院了，在主城的西南医院，要做个手术。\n\n周四上午分行要开年中工作会，陆明远亲自主持，万州要第一个发言。`,
 opts:S=>[
  {t:"你连夜开车回了主城，会上请了假。", s:"陆明远有点意见 · 下属看在眼里", fn:()=>{ fav("lu",-4); subsL3().forEach(p=>fav(p.id,2)); S.flags.family = (S.flags.family||0)+1; keyEvent("母亲手术那天守在医院"); log("", "手术做了四个小时。你在走廊上坐着，手机上是会议的直播，万州的发言是熊伟替你念的。"); }},
  {t:"开完会再回去。", s:"会上发言顺利", fn:()=>{ fav("lu",3); S.flags.family = (S.flags.family||0)-1; log("", "你发言完就出了会场。到医院的时候，手术已经做完了，母亲在睡。"); }},
 ]},
{id:"fam3", title:"过年", fixed:true, when:S=>S.m===6 && S.year===3,
 body:S=>`爱人打电话来：「今年过年，我们来万州。」\n\n停了一下：「孩子想看看你住的地方。」`,
 opts:S=>[
  {t:"「好。我带你们去江边吃烤鱼。」", s:"家里记着", fn:()=>{ S.flags.family = (S.flags.family||0)+1; subsL3().forEach(p=>fav(p.id,1)); log("good", "年三十那天，你们在江边的烤鱼店坐到十点。孩子指着江上的桥，问那是不是你办公室窗户里的那座。"); }},
  {t:"「过年要值班，还是我回来。」", s:"工作不耽误", fn:()=>{ S.flags.family = (S.flags.family||0)-1; log("", "初一早上你开车回主城，高速上车很少。到家的时候，饺子已经凉了。"); }},
 ]},
];
EVENTS_L3.push(...FAMILY_L3);

function bookLoanL3(name, amt, tier){
  const b = BALANCE.L2;
  S.loanBook.push({id:"l3_"+S.loanBook.length, name, amt, tier, src:"event", lv:3, at:S.monthAbs, defAt:S.monthAbs + ri(b.defaultDelay), def: R() < b.tierDefault[tier], done:false});
}
function subsL2Names(){ return ["dengyu","xulp","lizheng","luojian"].filter(id=>person(id)); }
