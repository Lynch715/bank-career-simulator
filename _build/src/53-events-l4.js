/* =====================================================================
   L4 重庆分行:12 个事件 + 危机三幕
   声音档案:
   宋文远 总行行长，只在视频里，一句话
   陆明远 总行副行长，更短
   顾清越 监管，一句一事，叫你「${sur}行长」
   周启明 原上级现副手，客气里带一点旧称呼
   杜衡   冲，讲数
   沈岚   笑着说难听的话
   蒋国栋 慢，翻条款
   ===================================================================== */
function l4Gray(){ return (S.flags.grayCount||0) - (S.flags.grayAtL4||0); }

const EVENTS_L4 = [
/* 1 开门红 */
{id:"kmh4", title:"开门红", fixed:true, when:S=>S.m===3,
 body:S=>`总行的开门红视频会，三十六个一级分行排成六行六列，重庆在第三行。\n\n宋文远没开摄像头，只有声音：「重庆。」`,
 opts:S=>[
  {t:"「规模净增五百亿，不良压在一点五以内。」", s:"宋文远记着", fn:()=>{ fav("songwy",2); log("", "屏幕上重庆的格子亮了一下，又暗了。"); }},
  {t:"「重庆今年报六百亿。」", s:"宋文远满意 · 做不到难看", fn:()=>{ fav("songwy",6); S.chal.push({id:"kmh4", title:"开门红任务", start:depTotal(), target:1400000, due:S.turn, win:4, lose:-8, sup:"songwy"}); log("", "视频里有人咳嗽了一声。宋文远说：「好。下一个。」"); }},
 ]},

/* 2 周启明 */
{id:"zhou4", title:"班子会", once:true, weight:3, when:S=>S.turn>=2,
 body:S=>`班子会上，讨论一笔给房企的展期。你讲完意见，周启明把笔放下。\n\n「${S.player.sur}行长，」他顿了一下，这个称呼他叫得还不太顺，「这笔我有不同看法。当年在南岸，你也不会这么批。」\n\n会议室里没人说话。蒋国栋在翻合同。`,
 opts:S=>[
  {t:"「周行说得对。这笔再议。」", s:"周启明服气 · 班子团结", fn:()=>{ fav("zhouqm",8); S.biz.unity = c100(S.biz.unity+6); log("good", "散会后，周启明在电梯里跟你说：「你还是那个你。」电梯到了，他先出去了。"); }},
  {t:"「按我说的办。会后你来我办公室。」", s:"周启明不痛快 · 班子紧一点", fn:()=>{ fav("zhouqm",-8); S.biz.unity = c100(S.biz.unity-6); log("", "周启明没来你办公室。第二天他交了一份书面意见，放在你秘书桌上。"); }},
 ]},

/* 3 房企展期 */
{id:"fangqi", title:"三十亿", once:true, weight:3, when:S=>S.turn>=3,
 body:S=>`渝兴地产的董事长亲自来了，带着一份展期申请：三十亿，延两年。\n\n「不展，下个月就是不良，」他把茶杯捧在手里，「展了，我还有几个盘能卖。」\n\n杜衡坐在旁边，面前的本子上写了一个数，你看不清。`,
 opts:S=>[
  {t:"「展期，要追加抵押和实控人担保。」", s:"不良暂时不出 · 风险后移", fn:()=>{ S.loanBook.push({id:"yx", name:"渝兴地产", amt:300000, tier:"high", src:"event", lv:4, at:S.monthAbs, defAt:S.monthAbs+rint(9,18), def:R()<0.4, done:false}); log("", "追加的抵押物是两块还没开发的地。董事长签字的时候，手有点抖。"); }},
  {t:"「不展。按合同走。」", s:"当期不良+30亿 · 干净", fn:()=>{ inst("yyb").npl += 300000; S.month.eventNpl = (S.month.eventNpl||0) + 300000; fav("gu",4); log("bad", "渝兴地产下个月就上了失信名单。杜衡把那个本子合上了，没说话。"); }},
  {t:"「借新还旧，换个名目续上。」", s:"报表干净 · 留底", gray:true, fn:()=>{ dirt(10); S.loanBook.push({id:"yx", name:"渝兴地产", amt:300000, tier:"high", src:"event", lv:4, at:S.monthAbs, defAt:S.monthAbs+rint(6,12), def:R()<0.55, done:false}); log("warn", "新合同上的借款人换成了渝兴的一家子公司。蒋国栋在会签单上写了两个字：同意。字写得很小。"); }},
 ]},

/* 4 监管约谈 */
{id:"gu4", title:"约谈", once:true, fixed:true, when:S=>S.turn>=3 && (R()<0.35 || S.turn>=6),
 body:S=>{ const na = inst("na"), wz = inst("wz"); return `监管局的约谈通知，落款是顾清越。\n\n会议室不大，她面前一个笔记本。「重庆分行的不良，我看了。」她翻开一页，「南岸支行${(na.npl/na.loans*100).toFixed(1)}%，万州分行${(wz.npl/wz.loans*100).toFixed(1)}%。」\n\n她抬头：「这两个地方，${S.player.sur}行长都待过。」`; },
 opts:S=>[
  {t:"「是我在任时批的。我拿整改方案来。」", s:"顾清越记着 · 评级好说", fn:()=>{ fav("gu",8); S.biz.regScore = Math.min(10,(S.biz.regScore||0)+3); keyEvent("接受监管约谈，认下任上的不良"); log("", "顾清越把笔帽盖上：「三个月，我等你的方案。」"); }},
  {t:"「这些是历史遗留，现任在处置。」", s:"顾清越不满意", fn:()=>{ fav("gu",-8); S.biz.crisisAdj += 0.3; log("", "「历史。」她在本子上写了两个字，合上了。"); }},
 ]},

/* 5 陆明远的试点 */
{id:"lu4", title:"试点", once:true, weight:3, when:S=>S.turn>=2,
 body:S=>`陆明远从总行打来电话。\n\n「数字化转型，总行要找一家分行试点。」他停了一下，「费钱，出成绩慢。」\n\n电话里有翻文件的声音。`,
 opts:S=>[
  {t:"「重庆来。」", s:"陆明远记着 · 今年利润少三亿", fn:()=>{ fav("lu",10); S.month.spent += 40000; keyEvent("承接总行数字化转型试点"); log("good", "陆明远说：「好。」电话挂了。一周后，总行派来的项目组住进了分行对面的酒店。"); }},
  {t:"「重庆今年指标压力大，下一轮吧。」", s:"陆明远不太高兴", fn:()=>{ fav("lu",-5); log("", "「知道了。」试点后来给了四川。"); }},
 ]},

/* 6 马奔 */
{id:"maben4", title:"马奔", once:true, weight:3, when:S=>S.turn>=3 && !!person("maben"),
 body:S=>{ const mb = person("maben");
   if(S.flags.mabenHelped) return `马奔来了，还是那辆车，后备箱里还是两箱酒。\n\n「兄弟，那年的事我记着。」他坐下，没寒暄，「渝北想上个物流园，额度卡在分行，二十个亿。」`;
   return `马奔来了。${mb.pos}，头发白了一半。\n\n他在你办公室门口站了一下才进来：「${S.player.sur}行长，我想回业务口，干什么都行。」\n\n他手里拿着信封，没递过来。`; },
 opts:S=>{
  if(S.flags.mabenHelped) return [
   {t:"「按正常流程报，我不打招呼。」", s:"马奔不痛快", fn:()=>{ fav("maben",-8); log("", "马奔笑了一下：「你还是那样。」他走的时候没拿那两箱酒，你让司机追出去还给他了。"); }},
   {t:"你给公司部打了个电话。", s:"马奔的人情还了 · 留底", gray:true, fn:()=>{ dirt(6); fav("maben",10); inst("yb").loans += 200000; S.loanBook.push({id:"mb4", name:"渝北物流园", amt:200000, tier:"high", src:"event", lv:4, at:S.monthAbs, defAt:S.monthAbs+rint(12,24), def:R()<0.35, done:false}); log("warn", "额度批下来那天，马奔在行长群里发了个抱拳。"); }},
  ];
  return [
   {t:"「分行营业部缺个公司业务总监，你去。」", s:"马奔感激 · 周启明有意见", fn:()=>{ fav("maben",15); fav("zhouqm",-4); const mb = person("maben"); mb.pos = "分行营业部公司业务总监"; mb.recent = "你给了他一个位子"; log("good", "马奔把信封放回口袋，站起来，站得很直。「谢谢。」"); }},
   {t:"「现在没有合适的位子。」", s:"马奔走了", fn:()=>{ fav("maben",-5); log("", "马奔点点头，把信封放回口袋。你后来才知道，信封里是一份检讨书。"); }},
  ];
 }},

/* 7 弹子石 */
{id:"dzs4", title:"撤并名单", once:true, fixed:true, when:S=>S.turn>=4 && (R()<0.3 || S.turn>=8),
 body:S=>`总行要求重庆今年撤并二十个网点。运营部报上来的名单，第十三个是弹子石。\n\n理由写的是：客流下降，人均效能排全市后十。\n\n${(person("hejing")&&person("hejing").pos.indexOf("负责人")>=0)?"网点负责人一栏写着何静。":"你盯着那一行看了很久。"}`,
 opts:S=>[
  {t:"你把弹子石划掉，换上了另一个。", s:"弹子石留下 · 有人会说闲话", fn:()=>{ fav("jianggd",-3); S.biz.unity = c100(S.biz.unity-3); keyEvent("把弹子石从撤并名单上划掉"); log("", "名单报上去了。运营部的人把你划掉的那一行又看了一遍，什么都没问。"); }},
  {t:"你在名单上签了字。", s:"按规矩办", fn:()=>{ log("", "弹子石撤并那天，你没去。晚上有人在群里发了张照片：叫号机搬上了货车。"); }},
 ]},

/* 8 魏临川 */
{id:"wei4", title:"上市", once:true, weight:3, when:S=>S.turn>=2 && !!person("weilc") && person("weilc").fav>=45,
 body:S=>`魏临川的渝江物流要上市了。他请你当牵头行，在朝天门那家吃过的夜宵摊旁边，开了一家很贵的酒楼。\n\n「兄弟，当年你来码头喝的那杯，我记着。」他给你倒茶，「这回，我想让你们行多赚点。」`,
 opts:S=>[
  {t:"「牵头可以，尽调按总行的规矩来。」", s:"规矩做 · 魏临川觉得你生分了", fn:()=>{ fav("weilc",-3); S.flags.weiIPO = "clean"; log("", "尽调组在渝江物流待了一个月，报告写了三百页。魏临川签字的时候说：「你们比证监会还细。」"); }},
  {t:"「魏总的事，我们尽力。」", s:"魏临川高兴 · 尽调松一点 · 留底", gray:true, fn:()=>{ dirt(6); fav("weilc",10); S.flags.weiIPO = "loose"; log("warn", "尽调报告写了八十页。魏临川在酒楼门口送你，说：「兄弟，这才像话。」"); }},
 ]},

/* 9 巡视 */
{id:"xunshi", title:"巡视组", once:true, fixed:true, when:S=>S.turn>=6 && (R()<0.35 || S.turn>=9),
 body:S=>`总行巡视组进驻重庆分行，一个月。\n\n组长姓闻，六十岁，戴老花镜。第一次见面，他只说了一句：「${S.player.sur}行长，你的履历我看了。弹子石、南岸、万州，每个地方我们都会去。」`,
 opts:S=>{ const g = S.flags.grayCount||0; return [
  {t:"「每个地方的材料，我让人都备齐。」", s:g>=6?"……":"坦坦荡荡", fn:()=>{
    if(g >= 6){ S.biz.crisisAdj += 0.8; fav("songwy",-8); log("bad", "一个月后，巡视反馈意见里有一页专门写你，标题是《关于个别领导干部履职中存在的问题》。"); S.flags.xunshiBad = true; }
    else { fav("songwy",5); keyEvent("总行巡视无问题"); log("good", "巡视组走的时候，闻组长跟你握了手：「干净。」"); }
  }},
  {t:"晚上你去酒店看了看闻组长。", s:"……", fn:()=>{ fav("songwy",-6); dirt(4); if(g>=4){ S.biz.crisisAdj += 0.5; S.flags.xunshiBad = true; } log("", `闻组长没开门。隔着门说：「${S.player.sur}行长，回去吧。」`); }},
 ];}},

/* 10 自媒体 */
{id:"media4", title:"一条视频", once:true, weight:2, when:S=>S.turn>=3,
 body:S=>`网上有条视频，播放量两百万：分行催收外包公司的人，在老人家门口喷红漆。\n\n视频的最后一帧，是泰和银行的招牌。`,
 opts:S=>[
  {t:"「马上终止合作，分行出面道歉，赔偿。」", s:"舆情压下去 · 费用", fn:()=>{ S.month.spent += 500; S.biz.crisisAdj -= 0.2; log("", "道歉声明是你改过三遍才发的。第二天，播放量停在了两百三十万。"); }},
  {t:"「外包公司的事，让他们自己处理。」", s:"舆情发酵 · 评级受影响", fn:()=>{ S.biz.crisisAdj += 0.6; fav("gu",-4); log("bad", "三天后，视频上了本地新闻。监管局来了一份函，要求书面说明。"); }},
 ]},

/* 11 信访 */
{id:"xinfang4", title:"老员工", once:true, weight:2, when:S=>S.turn>=4,
 body:S=>`分行门口来了二十几个退休员工，举着一块纸板，写着「企业年金」。\n\n领头的你认识，是弹子石的老柜员，何静的师傅。她看到你下车，把纸板放低了一点。`,
 opts:S=>[
  {t:"你请他们进会议室，倒了茶，一个个听。", s:"耗一下午 · 口碑", fn:()=>{ subsL4().forEach(p=>fav(p.id,1)); S.biz.unity = c100(S.biz.unity+2); log("good", "你们谈到晚上七点。最后你答应向总行打报告。老柜员走的时候，把纸板折好，夹在了胳膊底下。"); }},
  {t:"「让人力部接待，按政策解释。」", s:"平息 · 老员工不满意", fn:()=>{ log("", "人力部的人在门口讲了半个钟头政策。人散了，纸板留在了台阶上。"); }},
 ]},

/* 12 杜衡 */
{id:"du4", title:"杜衡", once:true, weight:2, when:S=>S.turn>=5,
 body:S=>{ const d = S.biz.deputies.find(x=>x.id==="duheng"); return `杜衡敲门进来，手里拿着一份报告。\n\n「${S.player.sur}行，公司条线${d && d.line==="corp" ? "今年的额度，我想再要一百亿" : "现在的分管，我有想法"}。」他把报告放下，「数我都算过了。」`; },
 opts:S=>{ const d = S.biz.deputies.find(x=>x.id==="duheng"); return [
  {t:d && d.line==="corp" ? "「额度给你。出了问题你担。」" : "「公司条线给你管。」", s:"杜衡卖力 · 其他人有想法", fn:()=>{
    fav("duheng",10); S.biz.unity = c100(S.biz.unity-4);
    if(d && d.line !== "corp"){ const c = S.biz.deputies.find(x=>x.line==="corp"); [d.line, c.line] = ["corp", d.line]; }
    log("", "杜衡拿着报告出去的时候，脚步很快。"); }},
  {t:"「班子会上讨论。」", s:"杜衡等着", fn:()=>{ fav("duheng",-3); log("", "杜衡点点头，把报告留在了你桌上，第一页折了个角。"); }},
 ];}},
];

/* 危机三幕 */
function crisisKind(){ return (person("weilc") && person("weilc").fav >= 55 && S.flags.weiIPO) ? "client" : "run"; }
const CRISIS_L4 = {
  run: [
    {title:"谣言", body:S=>`周五晚上，一条语音在涪陵几个业主群里转：泰和银行要倒了，钱取不出来了。\n\n周六早上八点，涪陵分行营业部门口排了一百多人。郑天明打来电话，背景里有人在喊。`,
     opts:[{t:"「全部网点延时营业，现金从主城调，要多少调多少。」", good:true, s:"成本高 · 稳人心"},{t:"「先限额，每人每天五万。」", s:"省现金 · 可能火上浇油"}]},
    {title:"第二天", body:S=>`队伍排到了第二天。本地电视台的车停在街对面。\n\n公安那边来电话，说谣言的源头找到了，是个做民间借贷的，想让大家把钱转到他那里。`,
     opts:[{t:"「请公安发通报，我去营业部门口站着。」", good:true, s:"下季少1点行动"},{t:"「让涪陵分行自己处理，分行发个声明。」", s:"省事"}]},
    {title:"第三天", body:S=>`第三天上午，队伍短了一半。有人把取出来的钱又存了回来。\n\n郑天明发来一张照片：营业部的地上全是矿泉水瓶和废号票。`,
     opts:[{t:"「今天之内，把每个来过的人回访一遍。」", good:true, s:"费人力 · 收尾干净"},{t:"「好了，大家辛苦了。」", s:"到此为止"}]},
  ],
  client: [
    {title:"渝江物流", body:S=>`魏临川被带走了。消息是凌晨两点传来的，渝江物流的财务总监在电话里哭。\n\n上市的材料里，有一部分收入是假的。泰和银行是牵头行，贷款余额二十个亿。`,
     opts:[{t:"「连夜冻结账户，资产保全，天亮前报总行和监管。」", good:true, s:"狠 · 该做的"},{t:"「先等一等，看看情况。」", s:"……"}]},
    {title:"三百家", body:S=>`渝江物流上下游三百多家小企业，账期全在它身上。\n\n早上有二十几个小老板堵在分行楼下，有人认得你，喊你的名字。`,
     opts:[{t:"「供应链上的小企业，单独开个续贷通道。」", good:true, s:"不良多一点 · 保住一片"},{t:"「按合同，一律催收。」", s:"干净 · 一片哀声"}]},
    {title:"尽调报告", body:S=>`监管局的函到了，要求说明牵头行尽调情况。\n\n${S.flags.weiIPO==="loose"?"那份八十页的尽调报告，就在你的抽屉里。":"那份三百页的尽调报告，就在你的抽屉里。"}`,
     opts:[{t:"「报告原样交上去。」", good:true, s:"该担的担"},{t:"「报告先让法务过一遍。」", s:"拖一拖"}]},
  ],
};
function crisisEventSpec(){
  const c = S.biz.crisis; const k = c.kind, st = c.stage;
  const a = CRISIS_L4[k][st];
  return applyEventOdds({kind:"event", id:"crisis", title:`危机 · ${a.title}`, body:a.body(S), opts:a.opts.map(o=>({t:o.t, s:o.s, fn:()=>{
    if(o.good) c.good++;
    if(k==="client" && st===0){ const amt = 200000; inst("yyb").npl += amt; person("weilc").pos = "（被带走调查）"; person("weilc").recent = "渝江物流出事"; }
    if(k==="client" && st===1 && o.good) inst("yyb").npl += 30000;
    if(k==="run" && st===0 && o.good) S.month.spent += 800;
    if(k==="run" && st===1 && o.good) S.flags.apDebt = (S.flags.apDebt||0)+1;
    if(k==="client" && st===2 && S.flags.weiIPO==="loose" && o.good){ fav("gu",4); S.biz.crisisAdj += 0.3; }
    c.stage++;
    if(c.stage >= 3){
      c.done = true;
      if(c.good >= 2){ S.biz.crisisAdj += B4().rating.crisisGood; S.flags.crisisGood = true; keyEvent(k==="run" ? "平息涪陵挤兑谣言" : "处置渝江物流风险事件"); log("gold", "事情过去了。总行的通报里有一句：重庆分行处置及时。"); }
      else { S.biz.crisisAdj += B4().rating.crisisBad; fav("songwy",-6); log("bad", "事情过去了。总行的通报里有一句：重庆分行应对迟缓。"); }
    }
  }}))}, `crisis:${k}${st}`);
}
