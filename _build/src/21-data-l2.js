/* =====================================================================
   L2 南岸支行:数据常量
   ===================================================================== */
KPI_DEF[2] = [
  {k:"dep",    name:"存款净增", w:25, unit:"万", kind:"flow"},
  {k:"loan",   name:"贷款净增", w:20, unit:"万", kind:"flow"},
  {k:"profit", name:"模拟利润", w:20, unit:"万", kind:"flow"},
  {k:"fee",    name:"中间业务收入", w:10, unit:"万", kind:"flow"},
  {k:"npl",    name:"不良率",   w:15, unit:"%", kind:"lower"},
  {k:"comp",   name:"合规",     w:10, unit:"分", kind:"ratio"},
];

/* 四个网点。弹子石的存款和负责人从 L1 带过来 */
const OUTLETS_L2 = [
  {id:"dzs",      name:"弹子石网点", dep:null,   mgr:null},
  {id:"nanping",  name:"南坪网点",   dep:121000, mgr:"dengyu"},
  {id:"chayuan",  name:"茶园网点",   dep:96000,  mgr:"xulp"},
  {id:"sigongli", name:"四公里网点", dep:83000,  mgr:"lizheng"},
];

/* L2 新认识(或从 L1 同级变成部下)的人 */
const PEOPLE_L2 = [
  {id:"dengyu",  name:"邓宇",   role:"南坪网点负责人",   group:"部下", trait:"狼性", skill:72, fav:48,
   note:"原来南坪的负责人，你们在一张排名表上比了两年。"},
  {id:"xulp",    name:"许丽萍", role:"茶园网点负责人",   group:"部下", trait:"稳健", skill:66, fav:56,
   note:"茶园的负责人。周报从不晚交，也从不多写一个字。"},
  {id:"lizheng", name:"黎正",   role:"四公里网点负责人", group:"部下", trait:"关系", skill:55, fav:58,
   note:"四公里的负责人，南岸哪个社区主任的电话他都有。"},
  {id:"zhouqm",  name:"周启明", role:"重庆分行副行长",   group:"上级", trait:"稳健", fav:45,
   note:"分行分管公司和零售的副行长。开会看表，不看人。"},
  {id:"maben",   name:"马奔",   role:"渝北支行行长",     group:"同级", trait:"狼性", fav:40,
   note:"渝北的一把手。车里常年放着两箱酒。"},
  {id:"weilc",   name:"魏临川", role:"渝江物流董事长",   group:"客户", trait:"江湖", fav:38,
   note:"跑了十年货车起的家，朋友遍布各个码头。"},
];
const CORP_LEAD_DEFAULT = {id:"handong", name:"韩冬", sex:"m", skill:52, fav:55,
  note:"对公团队的老客户经理，四十五岁，做过三任行长的对公。"};

/* 同级对手:重庆主城其他支行(沿用《模拟银行行长》的风格) */
const RIVALS_L2 = [
  {id:"yuzhong",    name:"渝中支行",   boss:"陈崇山", style:"稳健", base:104},
  {id:"yubei",      name:"渝北支行",   boss:"马奔",   style:"狼性", base:106},
  {id:"jiangbei",   name:"江北支行",   boss:"——",     style:"稳健", base:101},
  {id:"jiulongpo",  name:"九龙坡支行", boss:"唐建国", style:"关系", base:99},
  {id:"shapingba",  name:"沙坪坝支行", boss:"文卓然", style:"稳健", base:97},
  {id:"beibei",     name:"北碚支行",   boss:"韦明德", style:"稳健", base:94},
  {id:"dadukou",    name:"大渡口支行", boss:"石小川", style:"躺平", base:90},
  {id:"banan",      name:"巴南支行",   boss:"鲁达",   style:"躺平", base:88},
];

/* 对公项目 */
const PROJ_L2 = [
  {id:"yujiang",  name:"渝江物流",     what:"结算账户+流动资金贷款", who:"weilc", dep:5000, loan:8000, tier:"mid",
   note:"魏临川的公司，四十台车，账一直放在渝北。"},
  {id:"hospital", name:"南岸二院",     what:"全院代发工资",          dep:6000, loan:0,     tier:"low",
   note:"一千二百个职工，代发合同明年三月到期。"},
  {id:"xingqiao", name:"星桥科技",     what:"代发+科技贷",           who:"fanyh", dep:2500, loan:3000, tier:"low",
   note:"做工业软件，创始人范以恒，朋友圈全是技术文章。"},
  {id:"qipei",    name:"长江汽配城",   what:"商户联保贷",            dep:1500, loan:5000,  tier:"mid",
   note:"两百多家商户，开发商想让银行打包做。"},
  {id:"wenlv",    name:"南滨路文旅街区", what:"改造项目贷款",        dep:2000, loan:15000, tier:"high",
   note:"区里的重点项目，效果图做得很漂亮。"},
  {id:"dianzi",   name:"茶园电子厂",   what:"厂房抵押贷+代发",       dep:3000, loan:6000,  tier:"mid",
   note:"给手机厂做配件，订单跟着大厂走。"},
];
const PROJ_STAGES = ["接触", "方案", "审批", "落地"];

/* 贷款审批队列:企业名随机拼 */
const LOAN_NAMES = {
  micro: ["老街麻辣烫","南坪建材批发部","海棠溪汽修","弹子石茶楼","四公里五金店","铜元局干洗店","茶园快递驿站","南山农家乐","黄桷垭烘焙坊","涂山路火锅"],
  corp:  ["渝顺建材","南岸恒通商贸","江湾装饰工程","重庆腾远电子","长生桥食品厂","鸡冠石环保科技","峡口物流","迎龙服装","广阳湾机械","明佳医疗器械"],
};
const LOAN_IND = {
  micro: ["餐饮","零售","汽修","建材","服务"],
  corp:  ["商贸","建材","电子","食品","物流","装修","机械"],
};
const LOAN_RELS = [
  {who:"zhouqm", line:"周启明的秘书打过电话，说这家「情况可以关注一下」。"},
  {who:"lizheng", line:"黎正递材料的时候说，老板是他表哥的战友。"},
  {who:"dengyu", line:"邓宇说这单他跟了三个月，南坪今年就指着它。"},
];

/* 里程碑(草案,待确认) */
MILESTONES[2] = [
  {id:"dep45",  name:"支行存款站上45亿", desc:"南岸支行存款首次突破45亿",
   ceremony:"分行季度会上，周启明念到南岸，停下来喝了口水，又念了一遍那个数。", stmt:"支行存款突破45亿", reward:{rep:2, sup:4}},
  {id:"proj1",  name:"第一个对公项目落地", desc:"对公项目走完审批、落地",
   ceremony:"放款那天，对公团队在楼下小馆子吃了顿饭。账是韩冬抢着结的。", stmt:"牵头落地首个对公重点项目", reward:{rep:2, sup:3}},
  {id:"allhit", name:"四个网点全部完成任务", desc:"年终四个网点存款任务全部完成",
   ceremony:"年终会上，四个网点负责人坐成一排。你让他们挨个上去领的奖。", stmt:"所辖四个网点全部完成年度任务", reward:{rep:4}},
  {id:"npl1",   name:"不良率压到1%以下", desc:"年末不良率低于1%",
   ceremony:"风险条线的通报里，南岸那一行后面没有标红。顾清越在旁边写了两个字：保持。", stmt:"年末不良率控制在1%以内", reward:{gu:5}},
  {id:"rank3q", name:"全分行前三", desc:"季度末综合排名进入全分行前三",
   ceremony:"排名表贴出来那天，马奔在同业群里发了个「恭喜」，后面跟了个握手。", stmt:"季度综合考核全分行前三", reward:{rep:2, sup:3}},
];

LINES.groupL2 = [
  "【重庆分行行长群】周启明：各支行今天下班前报季度预测。",
  "【重庆分行行长群】马奔：渝北今天又落一单，感谢分行支持。",
  "【重庆分行行长群】陈崇山发了个「收到」。",
  "【重庆分行行长群】江北那位转发了一篇《关于进一步做好小微金融服务的通知》。",
  "【重庆分行行长群】唐建国：九龙坡周末有个银企对接会，有兴趣的兄弟支行可以来。",
  "【重庆分行行长群】马奔：月底了，各位加油，渝北先干为敬。",
  "【重庆分行行长群】鲁达：巴南本月存款持平。",
  "【重庆分行行长群】周启明撤回了一条消息。",
];
LINES.quietL2 = [
  "这个月没什么事。三楼的饮水机换了一桶。",
  "许丽萍的周报又是周五下午四点整到的。",
  "黎正在四公里办了场坝坝宴，拍了照片发在网点群里。",
  "韩冬在对公团队的白板上画了个圈，没写字。",
  "南滨路上又开了一家火锅店，招牌比冉记的大。",
  "邓宇在南坪门口挂了一条横幅，比上个月那条长了一截。",
];
