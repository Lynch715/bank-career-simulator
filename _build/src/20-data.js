/* =====================================================================
   数据常量:人物、客户、对手、考核卡、里程碑、临时任务、同事群
   ===================================================================== */

/* 考核卡定义。flow=按时序折算的流量指标;ratio=水平值指标 */
const KPI_DEF = {
  1: [
    {k:"dep",  name:"存款净增",      w:30, unit:"万", kind:"flow"},
    {k:"fee",  name:"中间业务收入",  w:20, unit:"万", kind:"flow"},
    {k:"cust", name:"有效客户数",    w:15, unit:"户", kind:"flow"},
    {k:"card", name:"信用卡+代发户", w:10, unit:"户", kind:"flow"},
    {k:"csat", name:"服务满意度",    w:10, unit:"分", kind:"ratio"},
    {k:"comp", name:"运营合规",      w:15, unit:"分", kind:"ratio"},
  ],
};

/* L1 员工。attr 1~10 */
const STAFF_L1 = [
  {id:"xiaoman", name:"周小满", sex:"f", role:"teller", mk:4, op:6, cp:7, fav:60, fatigue:20, grow:1.5,
   note:"南川来的，入行第二年。点钞比谁都慢，差错比谁都少。"},
  {id:"hejing",  name:"何静",   sex:"f", role:"teller", mk:3, op:8, cp:8, fav:58, fatigue:30, grow:0.6,
   note:"在弹子石站了十一年柜台。叫你小李，一直没改口。"},
  {id:"tangliang", name:"唐亮", sex:"m", role:"lobby", mk:6, op:5, cp:5, fav:62, fatigue:25, grow:1.0,
   note:"大堂经理，嘴甜，老年客户都认他。"},
  {id:"suxw",    name:"苏晓雯", sex:"f", role:"wealth", mk:8, op:6, cp:4, fav:55, fatigue:35, grow:1.0,
   note:"理财经理，业绩榜上常年前三，手机从不离手。"},
  {id:"luojian", name:"罗建",   sex:"m", role:"cm", mk:6, op:5, cp:6, fav:60, fatigue:25, grow:1.0,
   note:"客户经理，跑外拓，车里常年放着一箱宣传折页。"},
];
const ROOKIE_L1 = {id:"jiangke", name:"江可", sex:"f", role:"teller", mk:3, op:3, cp:5, fav:55, fatigue:0, grow:1.8,
  note:"刚从柜员培训班出来，工号还没背熟。"};

const ROLE_NAME = {teller:"柜员", lobby:"大堂经理", wealth:"理财经理", cm:"客户经理"};
const ROLE_DESC = {
  teller:"管差错和排队满意度",
  lobby:"管分流和厅堂转化",
  wealth:"管中收",
  cm:"管外拓新客",
};
const ATTR_NAME = {mk:"营销", op:"业务", cp:"合规"};

/* 客户卡。本行/他行资产单位:万元 */
const CUST_TYPES = {
  retire:  {name:"退休",   risk:[1,2], own:[80,320],  other:[60,400],  rel:[45,70]},
  worker:  {name:"上班族", risk:[2,3], own:[20,120],  other:[20,150],  rel:[30,55]},
  self:    {name:"个体户", risk:[3,4], own:[30,180],  other:[50,300],  rel:[25,50]},
  boss:    {name:"小老板", risk:[3,5], own:[100,500], other:[200,900], rel:[20,45]},
};
const CUST_FIXED = [
  {id:"zhangxf", name:"张秀芬", type:"retire", risk:2, own:180, other:260, due:3, rel:60,
   note:"纺织厂退休会计，每回来都要把利息算一遍。"},
  {id:"ranguoq", name:"冉国强", type:"self", risk:4, own:60, other:150, due:5, rel:45,
   note:"在弹子石老街开火锅店，店名叫「冉记老灶」。"},
  {id:"chendg",  name:"陈德贵", type:"retire", risk:1, own:40, other:30, due:8, rel:50,
   note:"老码头工人，存折用塑料袋包着。"},
];
const CUST_NAMES = ["王德明","刘桂兰","杨淑芬","赵建华","黄丽","周国平","吴晓燕","郑大勇","孙玉梅","马俊",
  "胡秋菊","朱永红","何家伟","郭春燕","林涛","谢红","邱志强","梁晓敏","宋文斌","唐秀英",
  "许志刚","韩梅","冯建军","曹玉兰","彭勇","曾晓红","蒋德福","田秀珍","钟建国","廖小琴",
  "范明","汪丽萍","邹强","熊春华","万国庆","雷敏","龙泽","袁淑华"];
const CUST_TYPE_SEQ = ["retire","retire","retire","worker","worker","worker","self","self","boss","retire","worker","self","retire","worker","boss"];

/* 代发意向单位 */
const PAYROLL_PROSPECTS = [
  {id:"yutong", name:"渝通建材", staff:60,  note:"财务刘姐说老板在考虑"},
  {id:"jiangnan", name:"江南汽修厂", staff:90, note:"老板是罗建的老乡"},
  {id:"yuanfan", name:"远帆物流", staff:120, note:"在他行代发了六年"},
];

/* 支行辖内另外 7 个网点 */
const RIVALS_L1 = [
  {id:"nanping",  name:"南坪网点",   boss:"邓宇",   style:"狼性", base:108},
  {id:"chayuan",  name:"茶园网点",   boss:"许丽萍", style:"稳健", base:107},
  {id:"sigongli", name:"四公里网点", boss:"黎正",   style:"关系", base:105},
  {id:"haitangxi",name:"海棠溪网点", boss:"付强",   style:"灰色", base:103},
  {id:"tongyuan", name:"铜元局网点", boss:"杨帆",   style:"稳健", base:97},
  {id:"dafo",     name:"大佛段网点", boss:"秦月",   style:"冲劲", base:94},
  {id:"nanshan",  name:"南山网点",   boss:"曾德福", style:"躺平", base:88},
];
const STYLE_TREND = {狼性:0.6, 稳健:0.2, 关系:0.1, 灰色:0.4, 冲劲:0.8, 躺平:-0.3};

/* 全局固定人物(人脉簿) */
const PEOPLE_DEF = [
  {id:"huang", name:"黄世海", role:"南岸支行行长", group:"上级", trait:"灰色",
   note:"爱压指标，爱让下面报虚数。烟灰缸从来没空过。", fav:55},
  {id:"lu",    name:"陆明远", role:"重庆分行行长", group:"贵人", trait:"爱惜羽毛",
   note:"分行一把手，话说得轻。", fav:35, hidden:true},
  {id:"gu",    name:"顾清越", role:"重庆分行风险总监", group:"贵人", trait:"慎独",
   note:"开会不参加饭局，水杯自己带。", fav:40, hidden:true},
];
const PERSON_STAFF_ROLE = "弹子石网点";

/* 里程碑(草案,待确认) */
const MILESTONES = {
  1: [
    {id:"dep35",   name:"存款站上3.5亿", desc:"网点存款首次突破3.5亿",
     ceremony:"支行在月度例会上念了弹子石的名字。黄世海带头鼓了两下掌。", stmt:"网点存款突破3.5亿", reward:{rep:2, huang:4}},
    {id:"payroll", name:"第一家代发单位", desc:"外拓拿下一家企业代发",
     ceremony:"支行奖了弹子石一万块营销费用。罗建把合同复印了一份贴在休息室。", stmt:"拓展首家企业代发单位", reward:{budget:1, rep:1}},
    {id:"noerr",   name:"半年零差错", desc:"连续6个月柜面零差错",
     ceremony:"分行运营部的通报表扬发到了群里。何静截了图，没说话。", stmt:"连续半年柜面零差错", reward:{rep:2, gu:4}},
    {id:"fanzha",  name:"拦下一笔电诈", desc:"成功劝阻一起电信诈骗",
     ceremony:"派出所送来一面锦旗，红底黄字。唐亮踩着凳子把它挂在了叫号机上面。", stmt:"成功劝阻电信诈骗，为客户挽回损失", reward:{rep:3, lu:3}},
    {id:"rank1q",  name:"季度排名第一", desc:"季度末综合排名全支行第一",
     ceremony:"季度奖金多了三千。黄世海在群里发了个大拇指。", stmt:"季度综合考核排名全支行第一", reward:{rep:2, huang:3}},
  ],
};

/* 支行临时任务(应付上级) */
const TASKS_L1 = [
  "支行要一份《厅堂服务提升方案》，周五前交。",
  "工会羽毛球赛，弹子石出两个人。",
  "分行要来查消防台账，今天之内补齐。",
  "黄世海让你周六去支行，陪客户钓鱼。",
  "支行搞「金融知识进社区」，要照片和简报。",
  "个金部要全网点存量客户的资产分层，明天上午要。",
  "支行开警示教育大会，每个网点出一篇心得。",
];

/* 同事群、月报随手一句 */
const LINES = {
  group: [
    "【南岸支行工作群】黄世海：各网点今天下班前把存款日报发一下。",
    "【南岸支行工作群】邓宇：南坪今天又进了一笔代发，谢谢各位领导支持。",
    "【南岸支行工作群】许丽萍：茶园周六的社区活动需要两个易拉宝，谁那有多的？",
    "【南岸支行工作群】付强：月底了，大家冲一冲。",
    "【南岸支行工作群】曾德福发了个「收到」。",
    "【南岸支行工作群】秦月：大佛段本周新客户破二十了！",
    "【南岸支行工作群】黄世海撤回了一条消息。",
    "【南岸支行工作群】黎正：四公里那边拆迁款下来了，有需要的兄弟网点可以一起做。",
  ],
  quiet: [
    "这个月没什么事。叫号机又卡了一次纸。",
    "唐亮在大堂教个老人用手机银行，教了四十分钟。",
    "何静带了一罐自己泡的酸萝卜，放在休息室。",
    "罗建的车又让交警贴了条。",
    "苏晓雯的业绩表上多了两行红笔。",
    "周小满把尾箱钥匙挂在脖子上，上厕所也不摘。",
  ],
};

/* 称呼 */
function titleOf(S){
  const sur = S.player.sur;
  if(S.lv===1) return S.turn>12 ? `${sur}主任` : `小${sur}`;
  if(S.lv===2) return `${sur}行`;
  if(S.lv===5) return "行长";
  return `${sur}行长`;
}
