/* 职务扩展：项目、人才与组织经营。费用单位均为万元。 */
BALANCE.career = {
  maxActive:{1:2,2:2,3:2,4:3,5:3},
  trainCost:{1:0.5,2:3,3:40,4:300,5:10000},
  trainTurns:{1:2,2:2,3:1,4:1,5:1}, trainGain:4, attrGain:1,
  assessMonths:{1:12,2:12,3:12,4:18,5:24},
  assessCost:{1:0,2:1,3:10,4:100,5:3000},
  specialtyMonths:12, specialtyFee:0.00003, specialtyDep:0.0003,
  planMonths:12, planGrowth:0.002, planOverload:3,
  executeMin:55, skillWeight:0.65, relationWeight:0.2, trustWeight:0.15,
  coordBase:65, coordPenalty:12, coordNeed:50, coordDrift:0.04,
  talkGain:10, talkFav:4, talkMonths:3, creditFav:4,
  trainingPenalty:12, overloadPenalty:15, loadLimit:1,
  probationMonths:12, probationFav:3, appointFav:6, oldFav:-5,
  fitBase:42, fitSkill:0.35, fitSpecialty:18,
  projectFav:3, meritGain:8, failureFav:-2, evalEveryMonths:12,
  councilInterval:{1:4,2:4,3:2,4:2,5:1}, councilExpiry:2,
  councilFee:{1:0.3,2:3,3:30,4:500,5:20000},
  boardStart:65, boardMin:45, boardGain:6, boardLoss:5,
  concentrationLimit:1, industryNpl:0.0002,
  reserveCar:0.105, costMargin:0.05, withdrawLoss:0.1,
  executiveK:0.002, regionalK:0.002, reviewFit:60, reviewHelp:-3,
  minSkill:{1:0,2:30,3:45,4:50,5:55},
  reserveSkill:{4:64,5:70}, reserveFav:50,
  teamK:0.001, competitionBase:75, competitionService:14, competitionRetain:0.6,
  relationStart:60, relationK:0.2, relationGain:10, relationLoss:12,
  liquidityStart:70, liquidityFloor:40, liquidityPressure:4, liquidityGrowthK:2, liquidityLoss:0.00005,
  alm:[
    {id:'balanced',name:'期限均衡',desc:'兼顾稳定资金与信贷期限，逐步修复流动性',liquidity:5,spread:0,fee:0},
    {id:'reserve',name:'增加流动性储备',desc:'减少期限错配；收益略降，承压能力提高',liquidity:12,spread:-0.0003,fee:0.0001},
    {id:'long',name:'增加长期资产',desc:'提高资产收益；消耗流动性，需稳定负债支持',liquidity:-8,spread:0.0004,fee:0},
  ],
  styles:[
    {id:'elder',name:'养老服务',desc:'服务退休客户，续存与满意度更稳',type:'retire',csat:1},
    {id:'merchant',name:'商户经营',desc:'维护个体户和小老板，拓展结算资金',type:'self',csat:0},
    {id:'wealth',name:'财富服务',desc:'维护有潜力的客户，积累中间业务收入',type:'boss',csat:0},
    {id:'community',name:'社区便民',desc:'覆盖社区与上班族，积累口碑',type:'worker',csat:1},
  ],
  plans:[
    {id:'corp',name:'产业拓展',desc:'资源投向企业与产业链；承担集中风险'},
    {id:'retail',name:'客户经营',desc:'资源投向零售服务与稳定结算资金'},
    {id:'risk',name:'风险整顿',desc:'放缓扩张，优先修复资产质量'},
    {id:'ops',name:'运营改革',desc:'先投入，逐步提高协同与服务能力'},
  ],
  allocation:{1:[],2:[50,30,20],3:[50,30,20],4:[50,30,20],5:[50,30,20]},
};
const CAREER_LINES = [{id:'corp',name:'公司'}, {id:'retail',name:'零售'}, {id:'risk',name:'风险'}, {id:'ops',name:'运营'}];
const CAREER_NAMES = ['', '网点特色与人才', '市场攻坚与团队', '城市经营与干部', '全省协同与班子', '全行战略与干部'];
// 0 员工，1 网点/支行团队，2 支行/二分部门，3 二分/一分部门，4 一分/总行部门，5 总行班子。
const CAREER_MANAGEMENT = {
  1:{min:0,max:0,desc:'管理本网点员工与业务骨干。'},
  2:{min:0,max:1,desc:'管理所辖网点、支行专业团队及基层后备人才。'},
  3:{min:1,max:2,desc:'管理所辖支行及二级分行部门干部。'},
  4:{min:2,max:4,desc:'管理一级分行班子、所辖二级分行及直属支行主要负责人。'},
  5:{min:4,max:5,desc:'管理总行班子、一级分行主要负责人及总行部门干部。'},
};
const CAREER_L5_BRANCHES = {db:'辽宁分行',hb:'北京分行',xb:'陕西分行',hd:'上海分行',hz:'湖北分行',xn:'重庆分行',hn:'广东分行'};
const CAREER_STAGES = {
  1:['摸排需求','服务试点','持续经营'], 2:['客户竞标','系统对接','集中迁移','客户经营'],
  3:['片区调研','核心客户','链上拓展','经营复盘'], 4:['项目论证','机构试点','联合推广','全市运营'],
  5:['战略论证','区域试点','全国推广','成效复评'],
};
const CAREER_PROJECTS = [
  {id:'street',lv:1,name:'老街商户收款',line:'corp',type:'service',cost:1.5,dep:180,fee:0.15,what:'逐户摸排、收款指导、交易维护；落地后持续积累结算资金。'},
  {id:'pension',lv:1,name:'社区养老服务',line:'retail',type:'service',cost:1,dep:220,fee:0.08,what:'预约服务与上门指导，重点是留住客户和改善服务。'},
  {id:'office',lv:1,name:'写字楼白领拓客',line:'retail',type:'competition',cost:2,dep:260,fee:0.2,what:'争取物业协作，选择价格或服务方案，再维护活跃客户。'},
  {id:'school',lv:2,name:'学校综合服务',line:'retail',type:'competition',cost:12,dep:2500,fee:4,what:'与同业竞标，完成对接、开户和切换；低价方案压缩后续收益。'},
  {id:'hotpot',lv:2,name:'冉记连锁资金归集',line:'corp',type:'integration',cost:15,dep:3000,fee:5,who:'ranguoq',what:'从老店走向连锁总部；组织网点协作，落地后持续归集资金。'},
  {id:'salary',lv:2,name:'园区企业代发迁移',line:'ops',type:'integration',cost:10,dep:2000,fee:3,what:'对接企业系统、安排开户和切换演练；对接质量影响留存。'},
  {id:'citrus',lv:3,name:'柑橘加工与冷链',line:'corp',type:'industry',cost:160,dep:15000,fee:60,area:'changling',what:'连接种植、加工、冷链与经销商；同类产业叠加会增加集中风险。'},
  {id:'food',lv:3,name:'工业园食品产业链',line:'corp',type:'industry',cost:200,dep:18000,fee:75,area:'gongye',what:'从核心加工厂拓展包装与物流；片区景气影响经营回报。'},
  {id:'branchfix',lv:3,name:'薄弱支行整顿',line:'risk',type:'turnaround',cost:120,dep:8000,fee:30,what:'核查问题、调整团队、修复客户；可提升承办支行的管理能力。'},
  {id:'auto',lv:4,name:'汽车配套企业联合服务',line:'corp',type:'integration',cost:3500,rwa:90000,dep:180000,fee:1800,what:'牵头行与协办行共享客户；需要明确分工与收益分配。'},
  {id:'health',lv:4,name:'全市医疗机构综合服务',line:'retail',type:'competition',cost:2500,rwa:30000,dep:130000,fee:1200,what:'统筹多地医疗机构，竞标后完成区域试点与全市推广。'},
  {id:'utility',lv:4,name:'公共事业缴费平台',line:'ops',type:'integration',cost:3000,rwa:20000,dep:100000,fee:1400,what:'协调业务与运营部门，处理接口、试点和使用推广。'},
  {id:'center',lv:4,name:'集中运营中心',line:'ops',type:'reform',cost:4000,rwa:15000,dep:70000,fee:1700,what:'安排试点、转岗与集中处理；人员安置影响推进与后续收益。'},
  {id:'wealth5',lv:5,name:'全行财富管理转型',line:'retail',type:'strategy',cost:80000,rwa:700000,dep:1800000,fee:35000,what:'确定客群、区域试点、推广服务；前期投入后形成持续中收。'},
  {id:'trade5',lv:5,name:'全国交易银行平台',line:'corp',type:'integration',cost:100000,rwa:900000,dep:2200000,fee:40000,who:'ranguoq',what:'以连锁客户为试点，推动全国资金管理与跨区域协作。'},
  {id:'inclusive5',lv:5,name:'普惠专业经营体系',line:'risk',type:'strategy',cost:70000,rwa:1100000,dep:1600000,fee:30000,what:'建设专业团队、区域试点与质量复评，平衡覆盖面和风险。'},
  {id:'digital5',lv:5,name:'数字化运营改革',line:'ops',type:'reform',cost:120000,rwa:500000,dep:1200000,fee:45000,what:'整合流程与系统，分期迁移；需要协调员工转岗和机构利益。'},
];
const CAREER_CHOICES = {
  competition:[
    {id:'price',name:'价格优先',desc:'降低客户使用成本；更易推进，持续收益降低',quality:15,yield:0.65,coord:0},
    {id:'service',name:'服务优先',desc:'投入对接与维护；费用增加，保留完整收益',quality:8,yield:1,coord:5,extra:0.25},
    {id:'select',name:'精选客户',desc:'控制覆盖范围；规模较小，实施更稳',quality:18,yield:0.8,coord:3},
  ],
  integration:[
    {id:'share',name:'按贡献共享收益',desc:'牵头与协办共同受益；协同提高',quality:10,yield:1,coord:15},
    {id:'lead',name:'收益向牵头倾斜',desc:'集中力量推进；协办方积极性下降',quality:18,yield:1.1,coord:-18},
    {id:'pilot',name:'先做小范围试点',desc:'压缩首期范围；更容易协调',quality:16,yield:0.75,coord:8},
  ],
  service:[
    {id:'visit',name:'定点服务与回访',desc:'稳定维护；均衡积累资金与口碑',quality:12,yield:1,coord:5},
    {id:'wide',name:'扩大活动覆盖',desc:'增加维护费用；经营规模提高',quality:5,yield:1.15,coord:0,extra:0.2},
    {id:'steady',name:'先服务现有客户',desc:'缩小范围；更快建立稳定使用习惯',quality:20,yield:0.7,coord:5},
  ],
  industry:[
    {id:'core',name:'围绕核心企业拓展',desc:'规模较大；同一行业暴露增加',quality:12,yield:1.2,coord:0,exposure:1},
    {id:'diverse',name:'分散上下游客群',desc:'投入更多调查；降低集中风险',quality:8,yield:1,coord:8,extra:0.2},
    {id:'cash',name:'以结算服务切入',desc:'首期规模较小；控制行业暴露',quality:18,yield:0.75,coord:5},
  ],
  turnaround:[
    {id:'team',name:'增援与带教',desc:'保留原团队，投入骨干帮扶',quality:12,yield:1,coord:12,extra:0.15},
    {id:'audit',name:'先核查再整改',desc:'查清问题，优先修复资产质量',quality:18,yield:0.85,coord:5},
    {id:'shrink',name:'收缩低效业务',desc:'减少经营范围；短期规模较小',quality:20,yield:0.65,coord:-5},
  ],
  reform:[
    {id:'retrain',name:'培训转岗后推广',desc:'追加安置费用；协调与执行更稳',quality:12,yield:1,coord:15,extra:0.25},
    {id:'fast',name:'集中切换',desc:'抢先推进；部门分歧加大',quality:20,yield:1.1,coord:-20},
    {id:'phase',name:'分批试点迁移',desc:'缩小第一期收益，保留调整空间',quality:15,yield:0.8,coord:10},
  ],
  strategy:[
    {id:'growth',name:'优先扩大覆盖',desc:'推广规模更大；执行要求提高',quality:3,yield:1.2,coord:-5},
    {id:'quality',name:'质量达标后推广',desc:'明确质量门槛，稳步兑现收益',quality:15,yield:1,coord:8},
    {id:'focus',name:'聚焦优势区域',desc:'先做适合的区域；范围较小',quality:22,yield:0.75,coord:5},
  ],
};
const CAREER_COUNCIL = [
  {id:'allocation',title:'资源怎么分',body:'业务团队希望把资源继续投向增长较快的机构。运营团队提醒，薄弱机构的人已经不够用了。',opts:[
    {id:'support',name:'给薄弱机构增援',desc:'追加帮扶费用，改善协作与服务',coord:10,fav:2,cost:1,board:1},
    {id:'merit',name:'按经营贡献分配',desc:'优先支持产出，提高项目准备度；部分同事有意见',coord:-5,quality:8,board:3},
    {id:'review',name:'公开依据，协商调整',desc:'用一次行动协调分歧',coord:7,fav:1,board:2,ap:1},
  ]},
  {id:'credit',title:'谁来领这份成绩',body:'项目组报来了阶段成果。牵头人希望独立汇报，协办团队补交了一份自己的工作清单。',opts:[
    {id:'joint',name:'共同汇报，分别记功',desc:'认可协办贡献，改善团队协同',coord:10,fav:3,board:1},
    {id:'single',name:'由牵头人代表汇报',desc:'牵头人获得认可；协作意愿下降',coord:-9,quality:6,board:2},
    {id:'evidence',name:'按过程记录确定贡献',desc:'花一次行动复盘，公开评价依据',coord:8,fav:2,board:3,ap:1},
  ]},
  {id:'people',title:'后备干部推荐',body:'两份推荐意见放在一起。一份强调业务能力，一份强调熟悉本地情况。人力部门请你确定培养和任用的依据。',opts:[
    {id:'open',name:'公开标准，考察后任用',desc:'追加考察费用，改善协作；候选人仍需单独考察',coord:8,fav:1,cost:1,board:3},
    {id:'old',name:'先让熟悉的人负责',desc:'推进当前工作；其他人认为机会不均',coord:-10,quality:8,board:-2},
    {id:'trial',name:'先给专项任务，再评价',desc:'用一次行动明确试岗目标',coord:6,quality:5,board:2,ap:1},
  ]},
];
const CAREER_DEPUTY = {
  titles:['','支行副行长任期','二级分行副行长任期','一级分行副行长任期','总行副行长任期'],
  body:'分管条线报来一份推进方案，另一条线认为会挤占自己的人手。一把手让你先拿出可以执行的安排。',
  opts:[
    {id:'coordinate',name:'先与平级明确分工',desc:'协调经验提高，下一级初始协同更好',coord:8,trust:0},
    {id:'sponsor',name:'向一把手争取专项支持',desc:'上级认可提高，协调经验少一些',coord:3,trust:5},
    {id:'talent',name:'安排骨干试点，自己承担协调',desc:'骨干获得成长，积累干部培养经历',coord:5,trust:2,merit:5},
  ],
};
