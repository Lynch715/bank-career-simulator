/* =====================================================================
   推不掉的会:从支行起,每回合开头冒出几件要你到场的事。
   去占 1 点;不去,对应的人或指标挨一下。职务越高,会越多
   ===================================================================== */
const subsFav = n => subordinates().forEach(p => fav(p.id, n));
const meetComp = n => { S.kpi.comp = c100(S.kpi.comp + n); };
const MEETINGS = {
  2: [
    {id:"m2_jyfx", title:"分行经营分析会",
      body:"分行的月度经营分析会定在周三下午两点，周启明主持。各支行行长挨个上去讲，讲完了他要问存款缺口怎么补。",
      go:{s:"周启明记你一笔", fn:()=>fav("zhouqm",2), log:"你讲了十二分钟。周启明在本子上记了两行，没有追问。"},
      skip:{t:"「让副行长去代会。」", s:"周启明不高兴", fn:()=>fav("zhouqm",-5), log:"代会的副行长回来说，周启明点到南岸的时候，停了一下，问了一句「你们行长呢」。"}},
    {id:"m2_qu", title:"区里的金融工作座谈会",
      body:"南岸区金融办通知，辖内银行一把手开座谈会，常务副区长参加。会上要报今年支持区里重点项目的情况。",
      go:{s:"陆明远听说了", fn:()=>fav("lu",2), log:"座谈会开了一上午。散会时金融办主任找你要了张名片。"},
      skip:{t:"「派公司部的人去。」", s:"区里那条线淡一点", fn:()=>fav("lu",-3), log:"区里的会议纪要发下来，各家银行的名字后面都跟着行长，南岸支行那一行写的是公司部经理。"}},
    {id:"m2_anfang", title:"案防检查进点会",
      body:"分行内控合规部来南岸做案防检查，按规定支行行长要参加进点会，当面签承诺书。",
      go:{s:"合规好看一点", fn:()=>meetComp(1), log:"进点会二十分钟。你签了字，检查组长把承诺书收进了文件袋。"},
      skip:{t:"「我这边走不开，让副行长签。」", s:"合规扣分", fn:()=>meetComp(-5), log:"检查报告里多了一句：支行主要负责人未参加进点会。"}},
    {id:"m2_lihui", title:"网点负责人例会",
      body:"每月头一个周一，四个网点的负责人到支行开例会。上个月有人在群里问，这个月还开不开。",
      go:{s:"下面的人心里有数", fn:()=>subsFav(1), log:"例会开到十二点。邓宇和许丽萍为一个客户归属吵了几句，最后你拍了板。"},
      skip:{t:"「这个月不开了，有事群里说。」", s:"下面的人心里没底", fn:()=>subsFav(-3), log:"群里安静了一个星期。"}},
    {id:"m2_jingshi", title:"警示教育大会",
      body:"分行开全辖警示教育大会，放一个外地银行行长受审的片子。各支行班子成员都要到，要签到。",
      go:{s:"合规好看一点", fn:()=>meetComp(1), log:"片子放了四十分钟。灯亮起来的时候，后排有人在看手机。"},
      skip:{t:"「签到让办公室代一下。」", s:"合规扣分 · 周启明知道", fn:()=>{ meetComp(-3); fav("zhouqm",-2); }, log:"纪委的人当场对了签到表。"}},
  ],
  3: [
    {id:"m3_jyfx", title:"重庆分行季度经营分析会",
      body:"重庆分行开季度经营分析会，各二级分行行长回主城当面汇报。从万州过去，高铁两个多小时。",
      go:{s:"陆明远记你一笔", fn:()=>fav("lu",2), log:"你在会上讲了万州的不良。陆明远没说话，散会后让秘书把你的材料多印了一份。"},
      skip:{t:"「视频接入，我在万州讲。」", s:"陆明远不高兴", fn:()=>fav("lu",-5), log:"视频卡了两次。陆明远说：「万州的情况，会后单独报给我。」"}},
    {id:"m3_quwei", title:"区里召集一把手开会",
      body:"万州区政府召集驻区金融机构一把手，通报今年的重点项目和化债安排。区长主持，要各行表态。",
      go:{s:"片区口碑回一点", fn:()=>S.biz.areas.forEach(a=>a.rep=c100(a.rep+1)), log:"轮到你表态，你说了三分钟，没有说具体的数。区长点了点头。"},
      skip:{t:"「派分管副行长去。」", s:"片区口碑掉", fn:()=>S.biz.areas.forEach(a=>a.rep=c100(a.rep-3)), log:"会后区里的工作群里，几家银行都发了行长表态的照片。"}},
    {id:"m3_jianguan", title:"监管分局约谈",
      body:"万州监管分局通知，就辖内贷款五级分类的问题约谈分行主要负责人。通知上写的是主要负责人。",
      go:{s:"合规好看一点 · 顾清越知道", fn:()=>{ meetComp(1); fav("gu",2); }, log:"约谈一个半小时。分局局长把问题清单念了一遍，你一条一条答了。"},
      skip:{t:"「风险总监去，他比我清楚。」", s:"合规扣分 · 顾清越知道", fn:()=>{ meetComp(-6); fav("gu",-3); }, log:"监管分局的函第二天就到了，抄送重庆监管局。"}},
    {id:"m3_hanghang", title:"支行行长会",
      body:"一季度一次的支行行长会。各支行行长从区县赶过来，有的要坐三个小时汽车。",
      go:{s:"下面的人心里有数", fn:()=>subsFav(1), log:"会开了一整天。晚饭在食堂，你挨桌敬了一杯茶。"},
      skip:{t:"「改成视频会。」", s:"下面的人心里没底", fn:()=>subsFav(-3), log:"视频会上，有三个支行的画面一直是黑的。"}},
    {id:"m3_xuncha", title:"巡察组座谈",
      body:"重庆分行巡察组进驻万州，要和班子成员一个一个谈话。第一个约的是你。",
      go:{s:"合规好看一点", fn:()=>meetComp(1), log:"谈了五十分钟。巡察组长最后问：「有没有什么要补充的？」你说没有。"},
      skip:{t:"「跟他们改个时间。」", s:"合规扣分 · 陆明远知道", fn:()=>{ meetComp(-3); fav("lu",-3); }, log:"改了时间。巡察组的工作日志上记了这一笔。"}},
  ],
  4: [
    {id:"m4_zonghang", title:"总行季度经营分析会",
      body:"总行开季度经营分析会，各一级分行行长到北京现场汇报，宋文远主持。重庆排在第十一个发言。",
      go:{s:"宋文远记你一笔", fn:()=>fav("songwy",2), log:"你讲了八分钟。宋文远问了一个资本占用的问题，你答上来了。"},
      skip:{t:"「请周启明代我去。」", s:"宋文远不高兴", fn:()=>fav("songwy",-5), log:"周启明回来说，轮到重庆的时候，宋文远看了一眼名单。"}},
    {id:"m4_shizhengfu", title:"市政府金融工作会议",
      body:"市政府召开全市金融工作会议，分管副市长主持，要几家大行发言，重庆分行排在第三个。",
      go:{s:"陆明远听说了", fn:()=>fav("lu",2), log:"你发言六分钟，讲了制造业贷款。会后市金融办把你的发言稿要走了。"},
      skip:{t:"「让副行长去发言。」", s:"市里那条线淡一点", fn:()=>fav("lu",-4), log:"第二天的新闻稿里，几家行的名字后面都是行长，重庆分行那里写的是副行长。"}},
    {id:"m4_jianguanju", title:"监管局约谈",
      body:"重庆监管局就集中度风险约谈重庆分行主要负责人，顾清越参加。",
      go:{s:"合规好看一点 · 顾清越知道", fn:()=>{ meetComp(1); fav("gu",2); }, log:"约谈两个小时。顾清越全程没开口，最后在记录上签了字。"},
      skip:{t:"「风险条线去，我书面汇报。」", s:"合规扣分 · 顾清越知道", fn:()=>{ meetComp(-6); fav("gu",-4); }, log:"监管局回了一份函，第二段写着：请主要负责人高度重视。"}},
    {id:"m4_banzi", title:"班子会",
      body:"副行长们攒了一堆要上会的事，办公室问班子会这周能不能开。",
      go:{s:"班子团结一点", fn:()=>{ S.biz.unity = c100(S.biz.unity+2); }, log:"班子会开到晚上七点，十一个议题过了九个。"},
      skip:{t:"「推到下周。」", s:"班子散一点", fn:()=>{ S.biz.unity = c100(S.biz.unity-5); }, log:"副行长们各自去找你单独汇报，同一件事你听了三个说法。"}},
    {id:"m4_xunshi", title:"总行巡视进驻",
      body:"总行巡视组进驻重庆分行，开进驻动员会。按要求一把手要作动员讲话。",
      go:{s:"合规好看一点", fn:()=>meetComp(1), log:"动员讲话十分钟，稿子是办公室写的，你改了两段。"},
      skip:{t:"「我在外地，请周启明讲。」", s:"合规扣分 · 宋文远知道", fn:()=>{ meetComp(-3); fav("songwy",-3); }, log:"巡视组长在会上说了一句：「一把手要带头接受监督。」"}},
  ],
  5: [
    {id:"m5_dongshi", title:"董事会",
      body:"董事会审议半年经营情况和资本规划，你要列席汇报。陆明远是董事长。",
      go:{s:"董事会那边稳一点", fn:()=>fav("lu",2), log:"董事会开了五个小时。独立董事问了三个问题，两个关于不良。"},
      skip:{t:"「请分管副行长汇报。」", s:"陆明远不高兴", fn:()=>fav("lu",-6), log:"会后陆明远打来电话，问你那天在忙什么。"}},
    {id:"m5_jianguan", title:"监管通报会",
      body:"金融监管总局召开年度监管通报会，各家大行行长到场。顾清越坐在主席台第二排。",
      go:{s:"评级好说一点 · 顾清越知道", fn:()=>{ fav("gu",2); S.biz.regScore = Math.min(10,(S.biz.regScore||0)+0.5); }, log:"通报会两个小时，点了四家行的名，没有泰和。"},
      skip:{t:"「请首席风险官去。」", s:"评级难说 · 顾清越知道", fn:()=>{ fav("gu",-5); S.biz.regScore = Math.max(-10,(S.biz.regScore||0)-2); }, log:"会场上各家大行的位子都是行长，泰和那张桌签换了名字。"}},
    {id:"m5_fenhang", title:"全国分行行长会",
      body:"半年一次的全国分行行长会，三十六个一级分行行长都到北京。你要作主报告。",
      go:{s:"下面的人心里有数", fn:()=>subsFav(1), log:"主报告讲了一个小时零十分。分组讨论的时候，你去了西部那一组。"},
      skip:{t:"「书面印发，我不讲了。」", s:"下面的人心里没底", fn:()=>subsFav(-4), log:"报告印发下去了。分行行长群里有人说，这是第一次行长会没有主报告。"}},
    {id:"m5_chuangkou", title:"人民银行窗口指导",
      body:"人民银行召集几家大行开窗口指导会，讲下半年的信贷投放节奏。",
      go:{s:"合规好看一点", fn:()=>meetComp(1), log:"会上没有发材料，每个人都在记。"},
      skip:{t:"「让计划财务部去听。」", s:"合规扣分", fn:()=>meetComp(-4), log:"计划财务部的人回来，记的笔记只有一页。"}},
    {id:"m5_touzizhe", title:"业绩发布会",
      body:"半年业绩发布会，分析师和记者都在。按惯例行长要上台答问。",
      go:{s:"口碑回一点", fn:()=>{ S.biz.csat = c100(S.biz.csat+2); }, log:"有分析师问息差还能守多久。你说了一个数，第二天的研报里引了。"},
      skip:{t:"「请副行长和首席财务官答。」", s:"口碑掉", fn:()=>{ S.biz.csat = c100(S.biz.csat-4); }, log:"第二天有篇报道的标题是：泰和行长缺席业绩会。"}},
  ],
};

function meetCount(){
  const d = BALANCE.meet.dist[S.lv]; if(!d) return 0;
  let x = R();
  for(let i=0;i<d.length;i++){ x -= d[i]; if(x < 0) return i; }
  return d.length - 1;
}
function meetPick(){
  const pool = (MEETINGS[S.lv] || []).slice(), n = Math.min(meetCount(), pool.length), out = [];
  for(let i=0;i<n;i++){ const k = Math.floor(R()*pool.length); out.push(pool.splice(k,1)[0]); }
  return out;
}
function meetSpec(m){
  const can = S.ap >= 1;
  return {kind:"event", id:m.id, title:m.title, body:m.body + "<br><small class=\"muted\">推不掉的会：去要占 1 个行动点。</small>", opts:[
    {t:"「我去。」", s:"占1点 · " + m.go.s, disabled:!can, fn:()=>{ apUse(1); m.go.fn(); log("", m.go.log); S.track.meetGo = (S.track.meetGo||0)+1; }},
    {t:m.skip.t, s:m.skip.s, fn:()=>{ m.skip.fn(); log("warn", m.skip.log); S.track.meetSkip = (S.track.meetSkip||0)+1; }},
  ]};
}
function meetChain(d){
  if(S.phase !== "play" || S.lv < 2) return d();
  const list = meetPick();
  const next = () => { const m = list.shift(); if(!m || S.phase!=="play") return d(); ask(meetSpec(m), next); };
  next();
}
/* 大事占几个点 */
function apCost(id){ const c = BALANCE.apCost[S.lv]; return (c && c[id]) || 1; }
function apCostTag(id){ const n = apCost(id); return n > 1 ? `<i class="apc">占${n}点</i>` : ""; }
