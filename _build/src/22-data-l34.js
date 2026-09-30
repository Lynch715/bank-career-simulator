/* =====================================================================
   L3 万州分行 / L4 重庆分行:数据常量
   ===================================================================== */
KPI_DEF[3] = [
  {k:"profit", name:"模拟利润", w:25, unit:"万", kind:"flow"},
  {k:"dep",    name:"存款净增", w:15, unit:"万", kind:"flow"},
  {k:"loan",   name:"贷款净增", w:15, unit:"万", kind:"flow"},
  {k:"npl",    name:"不良率",   w:20, unit:"%",  kind:"lower"},
  {k:"eff",    name:"网点效能", w:10, unit:"亿/网点", kind:"ratio"},
  {k:"comp",   name:"合规",     w:15, unit:"分", kind:"ratio"},
];
KPI_DEF[4] = [
  {k:"profit", name:"净利润",   w:25, unit:"万", kind:"flow"},
  {k:"scale",  name:"规模净增", w:15, unit:"万", kind:"flow"},
  {k:"npl",    name:"不良率",   w:20, unit:"%",  kind:"lower"},
  {k:"roe",    name:"资本回报", w:15, unit:"%",  kind:"ratio"},
  {k:"rating", name:"监管评级", w:15, unit:"级", kind:"lower"},
  {k:"proj",   name:"战略项目", w:10, unit:"个", kind:"ratio"},
];

/* 万州六个片区 */
const AREAS_L3 = [
  {id:"laocheng", name:"老城",     pop:60, heat:45, comp:85, rep:55, note:"人最多，五家银行的招牌挤在一条街上。"},
  {id:"jiangnan", name:"江南新区", pop:30, heat:80, comp:55, rep:50, note:"新楼盘一片接一片，晚上亮灯的不到一半。"},
  {id:"gaotie",   name:"高铁片区", pop:15, heat:65, comp:25, rep:45, note:"高铁站通车两年，周边的地还在拍。"},
  {id:"gongye",   name:"工业园",   pop:10, heat:55, comp:40, rep:50, note:"盐化工和食品厂，对公的活多。"},
  {id:"wuqiao",   name:"五桥",     pop:20, heat:35, comp:30, rep:60, note:"城郊，老人多，存款稳，贷款难放。"},
  {id:"changling",name:"长岭",     pop:12, heat:25, comp:15, rep:60, note:"镇上，逢场天人最多。"},
];
/* 七个支行。dep:万元 */
const BRANCHES_L3 = [
  {id:"yyb",    name:"分行营业部", area:"laocheng", dep:900000, outlets:5, mgr:"xiongw"},
  {id:"gst",    name:"高笋塘支行", area:"laocheng", dep:700000, outlets:4, mgr:"chengxy"},
  {id:"jn",     name:"江南支行",   area:"jiangnan", dep:600000, outlets:4, mgr:"fugh"},
  {id:"tc",     name:"天城支行",   area:"gongye",   dep:550000, outlets:3, mgr:"moujun"},
  {id:"wq",     name:"五桥支行",   area:"wuqiao",   dep:450000, outlets:4, mgr:"ranggm"},
  {id:"ld",     name:"龙都支行",   area:"laocheng", dep:450000, outlets:4, mgr:"xianghong"},
  {id:"cl",     name:"长岭支行",   area:"changling",dep:350000, outlets:4, mgr:"dengjf"},
];
const LINES_L3 = [
  {id:"corp",   name:"公司部", desc:"对公贷款长得快，平台和工业园的活好做"},
  {id:"retail", name:"零售部", desc:"存款和小微、个贷长得快"},
  {id:"risk",   name:"风险部", desc:"新增不良少，处置回收多，每季多处置一户"},
  {id:"ops",    name:"运营部", desc:"合规加分，费用省一点"},
  {id:"hr",     name:"人力部", desc:"支行行长们的能力慢慢往上走"},
];
const PEOPLE_L3 = [
  {id:"xiongw",   name:"熊伟",   role:"分行营业部总经理", trait:"稳健", skill:66, fav:52, sex:"m", note:"在营业部干了十二年，桌上的茶杯是万州三中的校庆纪念品。"},
  {id:"chengxy",  name:"程晓燕", role:"高笋塘支行行长",   trait:"狼性", skill:70, fav:48, sex:"f", note:"说话快，报数比报表还快。"},
  {id:"fugh",     name:"付国华", role:"江南支行行长",     trait:"关系", skill:58, fav:56, sex:"m", note:"江南新区的开发商，他叫得出一半人的小名。"},
  {id:"moujun",   name:"牟俊",   role:"天城支行行长",     trait:"稳健", skill:62, fav:54, sex:"m", note:"工科出身，看财报先看应收账款。"},
  {id:"ranggm",   name:"冉光明", role:"五桥支行行长",     trait:"老实", skill:50, fav:60, sex:"m", note:"五桥本地人，快退了。"},
  {id:"xianghong",name:"向红",   role:"龙都支行行长",     trait:"稳健", skill:60, fav:55, sex:"f", note:"龙都支行的账，她一个人理了三年。"},
  {id:"dengjf",   name:"邓家福", role:"长岭支行行长",     trait:"老实", skill:45, fav:58, sex:"m", note:"逢场天自己去街上摆摊宣传。"},
  {id:"tanmin",   name:"谭敏",   role:"万州分行办公室主任", trait:"稳健", skill:60, fav:55, sex:"f", note:"分行的会，座签都是她摆的。"},
  {id:"wangming", name:"汪明",   role:"万州分行风险部总经理", trait:"稳健", skill:64, fav:50, sex:"m", note:"风险部的门常年关着，门上贴着一张便签：敲门。"},
];
const RESERVES_L3 = [
  {id:"duanbin", name:"段斌", role:"公司部副总经理", trait:"狼性", skill:68, fav:50, sex:"m", note:"跑工业园跑出来的，车里常年放着安全帽。"},
  {id:"liujia",  name:"刘佳", role:"零售部副总经理", trait:"稳健", skill:57, fav:55, sex:"f", note:"做过五年理财经理，客户名单记在脑子里。"},
  {id:"huangwei",name:"黄炜", role:"营业部副总经理", trait:"关系", skill:52, fav:58, sex:"m", note:"区里好几个局的办公室主任是他同学。"},
];
const RIVALS_L3 = [
  {id:"fuling",   name:"涪陵分行", boss:"郑天明", style:"稳健", base:107},
  {id:"yongchuan",name:"永川分行", boss:"卢晓峰", style:"狼性", base:109},
  {id:"hechuan",  name:"合川分行", boss:"许建",   style:"稳健", base:104},
  {id:"jiangjin", name:"江津分行", boss:"曹勇",   style:"关系", base:102},
  {id:"qianjiang",name:"黔江分行", boss:"田瑛",   style:"稳健", base:98},
  {id:"changshou",name:"长寿分行", boss:"聂平",   style:"冲劲", base:100},
  {id:"qijiang",  name:"綦江分行", boss:"符军",   style:"躺平", base:93},
];
const NPA_NAMES = ["万州盐化配套","三峡库区物流","长江船务","天城建材","五桥农副产品","江南置业","平湖酒店","龙都商贸","万州机械厂","滨江食品","高笋塘百货","万达汽配","港口装卸","沱口木业","长岭养殖场"];
const PLATFORMS_L3 = [
  {id:"pf1", name:"万州江南新区建设发展公司", what:"江南新区基础设施", note:"区城投的全资子公司，报表上的收入一大半是财政补贴。"},
  {id:"pf2", name:"万州三峡港务投资公司", what:"新田港二期", note:"港口是真的，吞吐量是预测的。"},
  {id:"pf3", name:"万州高铁片区开发公司", what:"站前片区土地整理", note:"土地还没卖出去，还款来源写的是「土地出让收入」。"},
];

MILESTONES[3] = [
  {id:"wz_new",  name:"第一个新网点回本", desc:"新开的网点累计赚回投入", ceremony:"新网点的负责人发来一张照片：营业厅坐满了，门口还排着人。", stmt:"新设网点当期回本", reward:{rep:2, sup:3}},
  {id:"wz_npl",  name:"不良率降到1.5%以下", desc:"季末不良率低于1.5%", ceremony:"分行风险通报里，万州那一行后面第一次没有标红。", stmt:"不良率压降至1.5%以内", reward:{gu:5}},
  {id:"wz_dep",  name:"存款站上450亿", desc:"万州分行存款突破450亿", ceremony:"谭敏在分行一楼的电子屏上打了一行字，晚上下班才撤。", stmt:"存款规模突破450亿", reward:{rep:2, sup:4}},
  {id:"wz_all",  name:"七个支行全部盈利增长", desc:"年末七个支行存款全部正增长", ceremony:"年终会上，七个支行行长坐成一排，冉光明坐在最边上，一直在笑。", stmt:"所辖支行全部实现正增长", reward:{rep:4}},
  {id:"wz_rank", name:"二级分行前三", desc:"季末综合排名进入前三", ceremony:"陆明远在全分行视频会上念到万州，说了两个字：不错。", stmt:"季度综合考核二级分行前三", reward:{rep:2, sup:3}},
];

LINES.groupL3 = [
  "【重庆分行二级分行行长群】郑天明：涪陵本季拨备覆盖率已达标。",
  "【重庆分行二级分行行长群】卢晓峰：永川又拿下一个产业园，感谢分行公司部。",
  "【重庆分行二级分行行长群】陆明远发了一份文件：《关于加强异地交流干部管理的通知》。",
  "【重庆分行二级分行行长群】田瑛：黔江这周下大雪，网点照常营业。",
  "【重庆分行二级分行行长群】符军发了个「收到」。",
  "【重庆分行二级分行行长群】曹勇：江津下周银企对接会，欢迎各位兄弟分行。",
];
LINES.quietL3 = [
  "这个季度没什么事。江上的雾散了三天，又起来了。",
  "谭敏把会议室的座签换了一批新的，你的那张字大了一号。",
  "五桥支行的冉光明送来一袋自家的柚子，放在办公室门口。",
  "长江水位降了，滨江路下面露出一截老码头的石阶。",
  "风险部的门还是关着，便签换了一张新的。",
];

/* ---------------- L4 重庆分行 ---------------- */
const INST_L4 = [
  {id:"yyb",  name:"分行营业部", dep:11000000, ldr:0.95, head:"shenlan2", g:1.00},
  {id:"yz",   name:"渝中支行",   dep:2500000,  ldr:0.85, head:"chencs",   g:1.00},
  {id:"jb",   name:"江北支行",   dep:2000000,  ldr:0.85, head:"jbnw",     g:1.02},
  {id:"yb",   name:"渝北支行",   dep:2200000,  ldr:0.9,  head:"yubeihead",g:1.03},
  {id:"na",   name:"南岸支行",   dep:null,     ldr:0.9,  head:null,       g:1.00, mine:"l2"},
  {id:"jlp",  name:"九龙坡支行", dep:1800000,  ldr:0.85, head:"tangjg",   g:0.99},
  {id:"wz",   name:"万州分行",   dep:null,     ldr:0.7,  head:null,       g:1.00, mine:"l3"},
  {id:"fl",   name:"涪陵分行",   dep:4200000,  ldr:0.72, head:"zhengtm",  g:1.00},
  {id:"yc",   name:"永川分行",   dep:4000000,  ldr:0.75, head:"luxf",     g:1.02},
  {id:"hc",   name:"合川分行",   dep:3800000,  ldr:0.72, head:"xujian",   g:0.99},
  {id:"jj",   name:"江津分行",   dep:3700000,  ldr:0.72, head:"caoyong",  g:0.99},
  {id:"qj",   name:"黔江分行",   dep:3000000,  ldr:0.65, head:"tianying", g:0.98},
];
const INST_HEADS = {
  shenlan2:{name:"沈国梁", skill:64}, chencs:{name:"陈崇山", skill:66}, jbnw:{name:"江北那位", skill:70},
  yubeihead:{name:"卢敏", skill:60}, tangjg:{name:"唐建国", skill:55}, zhengtm:{name:"郑天明", skill:65},
  luxf:{name:"卢晓峰", skill:68}, xujian:{name:"许建", skill:62}, caoyong:{name:"曹勇", skill:57}, tianying:{name:"田瑛", skill:60},
};
const DEPUTIES_L4 = [
  {id:"zhouqm", name:"周启明", fit:{corp:70, retail:66, risk:55, ops:60}, trait:"稳健", note:"南岸时的上级。现在排座次，他坐你右手边。"},
  {id:"duheng", name:"杜衡",   fit:{corp:74, retail:50, risk:58, ops:55}, trait:"狼性", fav:50, sex:"m", note:"原来的公司部总经理，考察你那年给你投过票。"},
  {id:"shenlan",name:"沈岚",   fit:{corp:52, retail:76, risk:55, ops:62}, trait:"稳健", fav:52, sex:"f", note:"做零售出身，开会从不看稿子。"},
  {id:"jianggd",name:"蒋国栋", fit:{corp:55, retail:50, risk:75, ops:66}, trait:"老实", fav:50, sex:"m", note:"风险条线干了二十年，签字前要把合同从头翻到尾。"},
];
const LINES_L4 = [{id:"corp",name:"公司"},{id:"retail",name:"零售"},{id:"risk",name:"风险"},{id:"ops",name:"运营"}];
const STRAT_L4 = [
  {id:"park",   name:"西部科学城产业园", what:"园区企业综合金融", rwa:120000, q:6, scale:1500000, profitOnce:30000},
  {id:"rural",  name:"乡村振兴·柑橘产业带", what:"涪陵到万州沿江的柑橘种植和冷链", rwa:60000, q:5, scale:600000, profitOnce:8000},
  {id:"minsheng",name:"民生金融·社保卡", what:"全市社保卡第三代换卡", rwa:20000, q:4, scale:1200000, profitOnce:12000},
  {id:"crossb", name:"中欧班列跨境结算", what:"团结村站的进出口结算", rwa:40000, q:6, scale:800000, profitOnce:20000},
  {id:"yujiang2",name:"渝江物流供应链金融", what:"魏临川的上下游三百家", rwa:90000, q:5, scale:900000, profitOnce:15000, who:"weilc"},
];
const RIVALS_L4 = [
  {id:"sc", name:"四川分行", boss:"何嘉陵", style:"稳健", base:110},
  {id:"hb", name:"湖北分行", boss:"严峻",   style:"狼性", base:112},
  {id:"hn", name:"湖南分行", boss:"谷雨",   style:"稳健", base:107},
  {id:"sx", name:"陕西分行", boss:"秦汉",   style:"关系", base:105},
  {id:"gz", name:"贵州分行", boss:"龙安",   style:"冲劲", base:103},
  {id:"yn", name:"云南分行", boss:"段云",   style:"稳健", base:101},
  {id:"gx", name:"广西分行", boss:"韦桂生", style:"躺平", base:97},
];
const PEOPLE_L4 = [
  {id:"songwy", name:"宋文远", role:"总行行长", group:"上级", trait:"稳健", fav:45, sex:"m", note:"总行一把手。视频会上从不开摄像头。"},
];

MILESTONES[4] = [
  {id:"cq_proj",  name:"第一个战略项目落地", desc:"战略项目完成", ceremony:"总行的简报用了一整版，照片上你站在第二排。", stmt:"牵头落地全行战略项目", reward:{sup:4}},
  {id:"cq_r1",    name:"监管评级升到1级", desc:"年度监管评级1级", ceremony:"监管局的评级通知只有一页纸。顾清越的签名在最下面。", stmt:"监管评级获评1级", reward:{gu:4}},
  {id:"cq_unity", name:"班子团结度过80", desc:"班子团结度达到80", ceremony:"班子会开到晚上八点，散会时周启明说了句：「这样开会，开得下去。」", stmt:"班子团结有力", reward:{rep:3}},
  {id:"cq_crisis",name:"危机平稳处置", desc:"大事件处置得当", ceremony:"事情过去以后，总行发了一份通报，你的名字在「处置得力」那一段里。", stmt:"妥善处置重大风险事件", reward:{sup:5}},
  {id:"cq_rank",  name:"全国一级分行前三", desc:"季末综合排名全国前三", ceremony:"总行的排名表发到群里，重庆排第三。陆明远私下发来一条：记得你在弹子石的时候。", stmt:"综合考核全国一级分行前三", reward:{rep:2, sup:3}},
];

LINES.groupL4 = [
  "【总行一级分行行长群】严峻：湖北本季存款增量第一，感谢总行零售条线指导。",
  "【总行一级分行行长群】宋文远转发了一篇文章：《做难而正确的事》。",
  "【总行一级分行行长群】何嘉陵发了个「收到」。",
  "【总行一级分行行长群】陆明远：各分行下周一前报送资本使用计划。",
  "【总行一级分行行长群】龙安：贵州这边的乡村振兴项目，欢迎兄弟分行来看看。",
];
LINES.quietL4 = [
  "这个季度没什么事。分行大楼的电梯检修了一周，你每天走楼梯上十九楼。",
  "周启明在班子会上带了一盒自己炒的花生，没人动。",
  "两江交汇的地方，江水一半清一半黄，今天分得特别清楚。",
  "办公室的绿萝是陆明远留下的，已经长到了窗台。",
];
