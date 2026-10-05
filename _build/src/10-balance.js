/* =====================================================================
   BALANCE —— 所有数值都在这里。逻辑里不许出现魔数。
   货币单位:万元。利率年化。
   ===================================================================== */
const BALANCE = {
  ver: 4,              // 存档版本。P3 起为 4,P2 的存档停在占位的 L5,读不回来
  saveKey: "thsz_save",
  metaKey: "thsz_meta",

  start: { age:30, careerYear:8, lv:1 },
  ap: {1:4, 2:4, 3:4, 4:4, 5:3},
  turnMonths: {1:1, 2:1, 3:3, 4:3, 5:6},
  tenure: {1:24, 2:24, 3:12, 4:12, 5:8},        // 最低任期(回合)
  transYears: {1:2, 2:2, 3:2, 4:3},              // 过渡期年数
  transTitle: {1:"支行副行长", 2:"二级分行副行长", 3:"一级分行副行长", 4:"总行副行长"},
  ageLine: {2:40, 3:45, 4:50, 5:56},             // 进入该级的年龄上限
  retireAge: 60,

  promo: {
    rumorLead: {1:3, 2:3, 3:1, 4:1},             // 风声提前回合
    trustEarly: 60,                              // trust 达到此值风声再提前 1 回合
    retryGap: {1:12, 2:12, 3:4, 4:4},            // 没选上,下个窗口
    deferGap: {1:6, 2:6, 3:2, 4:2},              // 暂缓任用,下个窗口
    bt: { coreMin:75, streak:6, cut:{1:6, 2:6, 3:4, 4:4} },   // 破格:连续第一回合数 / 任期减免
    w: { perf:0.4, vote:0.25, trust:0.2, talk:0.15 },
    pass: 60,
    rivals: 3,
    rivalBase: 55, rivalBaseLv: {1:55, 2:61, 3:62, 4:63}, retryPenalty: 3, rivalK: 0.7, rivalNoise: 5, rivalMin: 45, rivalMax: 82, rivalMaxLv: {1:73, 2:76, 3:84, 4:80}, rivalTopNoise: 3,
    vote: { goodFrom:40, goodSpan:50, badFrom:40, badSpan:40, good:100, ok:70, bad:0 },
    report: { from:80, k:0.015, guShield:80, deferMin:60 },
    cleanBonus: { from:80, 3:0.04, 4:0 },      // L3/L4 组织考察:干净度每高出 1 点加分
    selfNoise: 2.5, backP: 0.2, backBonus: 5,   // 升职:自己的总分抖一下;对手有两成概率「上面打过招呼」
    stmtPick: 3,
    stmtFiller: 55,
    stmtMilestone: 88,
    stmtKpiBase: 70, stmtKpiK: 100, stmtKpiMax: 92,
    stmtRankTop: 100, stmtRankStep: 8,
  },

  core: {
    perfFrom: 40, perfK: 1.25,                   // perf = (综合得分-40)*1.25
    repStaff: 0.6, repCsat: 0.4,
    trustW: { huang:0.5, lu:0.3, gu:0.2 },
    trustByLv: { 1:{huang:0.5, lu:0.3, gu:0.2}, 2:{zhouqm:0.5, lu:0.3, gu:0.2}, 3:{lu:0.6, zhouqm:0.2, gu:0.2}, 4:{lu:0.5, songwy:0.3, gu:0.2}, 5:{songwy:0.4, lu:0.3, gu:0.3} },
    cleanWarn: 70,
  },

  /* 行动成败:成功率夹在 min~max 之间;>= sure 显示「有把握」,>= maybe「看情况」,再低是「悬」 */
  odds: { min:0.12, max:0.93, sure:0.75, maybe:0.5,
    L1: { maintain:{ base:0.56, rel:0.003, prod:{deposit:0.12, stable:0.06, insure:0, fund:-0.06}, oldInsure:-0.08, csat:0.005, poach:0.3, poachShare:0.08 },
          hall:{ base:0.56, mk:0.03, csat:0.01, flop:0.35 },
          out:{ base:0.52, mk:0.04, flop:0.2 },
          train:{ base:0.64, grow:0.35, fat:0.003 },
          rally:{ base:0.86, fat:0.008, flopMult:0.5, flopFat:8 },
          boss:{ base:0.78, fav:0.006, flopFav:-2 } },
    L2: { supervise:{ base:0.62, morale:0.006, fav:0.004 }, push:{ base:0.68, visit:0.06 }, campaign:{ base:0.6, morale:0.01, flop:0.35 }, report:{ base:0.68, fav:0.006 } },
    L3: { open:{ base:0.55, heat:0.004, coldRamp:0.5 }, renovate:0.7, report:{ base:0.62, fav:0.006 } },
    L4: { talk:{ base:0.58, fav:0.008 }, push:0.72, quota:{ base:0.5, fav:0.02 }, reg:{ base:0.68, fav:0.006 } },
    L5: { survey:0.7, reg:{ base:0.65, fav:0.006 } },
  },

  /* 对手会追(连续第一 after 回合,第二名分数加 bonus,持续 turns 回合)、出头鸟(排第一时每回合 spotP 概率出事)、鞭打快牛 */
  chase: { after:2, bonus:{1:10, 2:9, 3:8, 4:8}, turns:{1:3, 2:3, 3:2, 4:2}, spotP:0.3, whip:1.08,
           spot:{ audit:3, poach1:0.25, poach:0.012, levy:0.01 } },

  audit: { line:40, k:0.004, maxP:0.12 },       // 年底审计:干净度低于 40,每年被查概率 (40-干净度)×0.4%,封顶 12%

  kpiCap: 1.2,
  rankStreakKeep: 12,

  /* ---------------- L1 网点 ---------------- */
  L1: {
    depStart: 30000,           // 3 亿
    budgetMonthly: 2.0,        // 营销费用,万/月
    csatStart: 82, csatHome: 80, csatRevert: 0.25,
    compStart: 100,
    kpiTarget: { dep:5000, fee:90, cust:270, card:280, csat:90, comp:100 },
    kpiGrowth: 1.15,           // 第二年起目标上浮
    kpiGrowthYears: 1,         // 上浮只算一次,卡在本关的人不会越卡越难
    drift: { mean:-40, sd:60 },           // 非卡片存款自然流动
    // 员工岗位产出(属性 1~10,倦怠 0~100,效率 = 1 - 倦怠/fatigueDiv)
    fatigueDiv: 200,
    role: {
      teller: { csatBase:0.2, csatK:0.3, errBase:0.06, errSkill:0.015, errFat:1/400, errComp:0.004, errMin:0.01, custK:0.2 },
      lobby:  { custK:1.0, cardK:0.8, csatBase:0.5, csatK:0.12, depK:6 },
      wealth: { feeK:0.45, depK:6 },
      cm:     { custK:0.8, depK:18, cardK:0.5 },
    },
    fatigueRecover: 8,
    favDrift: 0.5,             // 员工好感每月向 55 回归
    favHome: 55,
    // 客户卡
    card: {
      retainBase:0.5, retainRel:1/200, leaveShare:0.6,
      pullBase:0.12, pullRel:1/350,
      relMaintain:8, relDecay:1,
      otherRegrow:0.02,        // 他行资产每月回长
    },
    product: {
      deposit: { pull:1.0, fee:0,     feeFix:0,   retain:1 },
      stable:  { pull:0.8, fee:0.004, feeFix:0,   retain:1 },
      insure:  { pull:0.7, fee:0.005, feeFix:0.6, retain:0.85, oldCsat:-1 },
      fund:    { pull:0.8, fee:0.015, feeFix:0,   retain:0.95, riskLevel:4 },
    },
    violation: { clean:3, complainP:0.25, delayMin:3, delayMax:6, comp:8, csat:5, cleanLater:3 },
    // 行动
    hall: { cost:1.2, cust:[8,16], dep:[80,160], card:[4,9], csat:1 },
    out: {
      community: { cust:[8,14], dep:[60,120], card:[2,5] },
      street:    { cust:[6,10],  dep:[60,120], card:[8,14] },
      payroll:   { baseP:0.2, mkP:0.05, tryP:0.15, cost:0.5, card:[60,120], dep:[600,1500], cust:[30,50] },
    },
    train: { attr:1, fav:6, max:10 },
    rally: { mult:1.3, fatigue:15, fav:-2 },
    task: { chance:0.5, done:4, miss:-5, report:2 },
    // 核心值折算
    huangFav:55, luFav:35, guFav:40,
    streakNoError: 6,
    kmhMult: 1.2,              // 开门红(1~3月)员工产出加成
    depMilestone: 35000,
    // 月度事件
    storyPerTurn: 2,
    randomEventP: 0.55,
    // 年终
    bonusTop: 2, bonusRep: 3, bonusTrust: 3,
  },

  /* 对手网点:综合得分随机游走 */
  rivalL1: { sd:4, trendSd:1.5, yearShift:3 },
  rivalL2: { sd:3.5, trendSd:1.5, yearShift:3 },
  rivalL3: { sd:3.5, trendSd:1.5, yearShift:3 },
  rivalL4: { sd:3, trendSd:1.2, yearShift:2.5 },
  rivalL5: { sd:0, trendSd:0, yearShift:0 },

  story: { perTurn:2, randomP:0.55 },

  /* ---------------- L2 支行 ---------------- */
  L2: {
    corpDep: 65000,             // 对公团队存款
    loansStart: 360000,         // 36 亿,存贷比九成
    nplStartRatio: 0.012,
    carryDep: 1.12,             // 过渡两年,老网点存款自然长了一截
    budgetMonthly: 15,          // 营销费用,万/月
    csatHome: 80, csatRevert: 0.15,
    growth: 0.0038,             // 网点存款月度自然增长潜力(占存款)
    noise: 0.0015,
    deleg: { base:0.6, k:0.6 }, // 委托:产出 × (0.6 + skill/100 × 0.6)
    morale: { base:0.7, k:0.6, home:60, revert:0.05, start:60 },
    favHome: 55, favRevert: 0.03,
    supervise: { mult:1.5, morale:4, fav:{狼性:-3, 稳健:1, 关系:2, 新手:4, 老实:2} },
    campaign: { cost:12, depK:0.0025, morale:-2, fav:-1 },
    reportUp: { fav:4 },
    appoint: { cost:1, oldFavHit:-20, newFav:10, moraleReset:55, othersMorale:-3 },
    feeRate: 0.00013,
    retailK: 0.0040,            // 网点个贷月投放(占网点存款)
    amort: 0.004,               // 贷款月摊还
    corpGrowth: 0.002,
    // 利润口径(2026-09-30 确认):存款 1 亿一年收入 200 多万,贷款息差收窄后 1 亿一年近 100 万
    spread: { dep:0.022, loan:0.010 },
    expense: 300,               // 月费用(人工+运营,一年 3600 万)
    provision: 0.7,
    nplBase: { rate:0.010, resolve:0.07 },
    kpiTarget: { dep:40000, loan:30000, profit:6800, fee:600, npl:1.5, comp:100 },
    kpiGrowth: 1.12, kpiGrowthYears: 1,
    corpShare: 12000,           // 分解指标时对公条线先扣掉的存款任务
    queue: { min:2, max:3, microShare:0.6, micro:[100,600], corp:[600,2000], relP:0.15, expireMsg:true },
    tierScore: { coll:{房产抵押:-1, 担保公司担保:0, 信用:1}, flow:{稳定:-1, 波动:0, 下滑:1.5}, tax:{A:-0.5, B:0, C:1}, noise:0.8, low:-0.8, high:1.0 },
    tierDefault: { low:0.02, mid:0.10, high:0.30 },
    defaultDelay: [6,18],
    loanFee: 0.004,             // 放款当月中收
    project: { spawnEvery:4, max:4, need:[3,2], autoK:1/220, approveBase:0.72, risk:{low:0, mid:0.08, high:0.18}, visit:0.08, gift:0.15, giftCost:1.5, giftClean:3, cap:0.95 },
    decomp: { step:1000, over:1.3, high:1.2, low:0.85, moraleOver:-15, moraleHigh:-5, moraleFit:2, moraleLow:4, stretch:0.05, slack:-0.05 },
    yearEnd: { hit:6, miss:-6 },
    skillFromAttr: { base:25, off:9, span:21, k:65, favK:1/3 },   // 能力 = 25 + (属性和-9)/21×65 ± 好感
    depMilestone: 450000, nplMilestone: 1.0,
    bonusTop: 3, bonusRep: 3, bonusTrust: 3,
  },

  /* ---------------- L3 万州分行(按季) ---------------- */
  L3: {
    ldr: 0.7,                   // 存贷比七成(2026-09-30 确认)
    loanMix: { corp:0.45, micro:0.20, retail:0.35 },
    spread: { dep:0.022, corp:0.008, micro:0.016, retail:0.009, platform:0.006 },
    nplRate: { corp:0.012, micro:0.025, retail:0.008 },      // 年化新增
    nplStart: 0.018,
    expenseRate: 0.009,         // 年费用 = 存款 × 0.9%
    feeRate: 0.00125,           // 年中收 = 存款 × 0.125%
    provision: 0.7,
    budgetQ: 500,               // 每季发展费用(万)
    area: { g0:0.009, heatK:0.012, compK:0.006, heatDrift:{gaotie:3, jiangnan:1} },
    deleg: { base:0.6, k:0.6 },
    loanGrowthQ: 0.022, quotaYear: 0.10, mixStep: 0.05,
    outlet: { build:300, costY:150, rampMin:2000, rampMax:6000, capMin:20000, capMax:50000, repOpen:5, perBranch:4 },
    closeOutlet: { lossShare:0.3, rep:-10, saveY:150 },
    renovate: { cost:200, eff:0.15 },
    tilt: { corpLoan:1.35, retailDep:1.25, retailLoan:1.2, riskNpl:0.85, riskRecover:1.2, opsComp:3, opsExpense:0.95, hrSkill:1, others:-3 },
    dispose: { perQ:3, riskBonus:1,
      collect:{ cost:0.02, q:2, rec:0.30 }, sue:{ cost:0.05, q:4, rec:0.50, noiseP:0.2 }, restr:{ cost:0, q:0, redef:0.4, redefQ:2 }, writeoff:{ quotaY:40000 } },
    npaSplit: [2,3],
    naturalResolve: 0.03,
    platform: { size:[200000,500000], clean:8, gov:10, defP:0.35, delayM:[24,48] },
    appoint: { oldFavHit:-15, newFav:10 },
    reportUp: { fav:4 },
    kpiTarget: { profit:70000, dep:300000, loan:300000, npl:2.0, eff:null, comp:100 },
    effTargetK: 1.03,
    kpiGrowth: 1.08, kpiGrowthYears: 1,
    bonusTop: 3, bonusRep: 3, bonusTrust: 3,
    familyQ: 2,
  },

  /* ---------------- L4 重庆分行(按季) ---------------- */
  L4: {
    tax: 0.25,
    spreadDep: 0.022, spreadLoan: 0.010, feeRate: 0.00125, expenseRate: 0.009, provision: 0.7,
    nplRate: 0.011, nplResolveQ: 0.2,
    rwaK: 0.7, capRatio: 0.13, minCar: 0.105,
    growthQ: 0.015, focus: 1.25, focusFav: -3,
    deleg: { base:0.6, k:0.6 },
    unity: { start:60, talk:6, swap:-6, good:4 },
    lineK: { base:0.8, k:0.4 },   // 分管副行长对口能力 → 条线系数
    proj: { max:3, autoK:1/260 },
    askQuota: { add:30000, fav:-6, needFav:45 },
    regTalk: { fav:5, score:4 },
    rating: { base:2.5, nplK:0.8, compK:0.03, crisisBad:1, crisisGood:-0.5 },
    reportUp: { fav:4 },
    kpiTarget: { profit:600000, scale:6000000, npl:1.5, roe:15, rating:2, proj:1 },
    kpiGrowth: 1.08, kpiGrowthYears: 1,
    bonusTop: 3, bonusRep: 3, bonusTrust: 3,
    crisisAt: [5,8],
  },

  /* ---------------- L5 总行(按半年,8 回合) ---------------- */
  L5: {
    dep: 1200000000,            // 12 万亿(万元)
    ldr: 0.75,
    spreadDep: 0.022, spreadLoan: 0.010, feeRate: 0.00125, expenseRate: 0.009, provision: 0.7, tax: 0.25,
    nplStart: 0.013, nplRate: 0.008, nplResolveH: 0.30,
    rwaK: 0.7, capRatio: 0.135,
    cut: { from:2, loan:0.0003, dep:0.00015, warn:1 },     // 降息周期:第 2 回合起每半年压一次
    dial: {
      price:  { depG:0.012, spread:0.0015 },               // 存款定价每档:增速 / 付息
      credit: { loanG:0.015, npl:0.0003, lag:2 },          // 信贷增速每档
      digital:{ costPer:150000, lag:2, maxCut:0.2, depG:0.01, per:600000, dep:0.15, stock0:3000000 },  // 数字化每档每半年投入(万);存量每半年折旧 15%
      branch: { outletsPer:400, costPer:0.012, rep:-2, depG:0.003 },
      capital:{ add:10000000, roeHit:0.3, needTrust:55 },  // 发二级资本债:+1000 亿
    },
    baseDepG: 0.030, baseLoanG: 0.034,
    outlets: 30000,
    strategy: { scale:{g:1.2, npl:1.1}, profit:{spread:1.05, g:0.9}, risk:{npl:0.85, g:0.9} },
    survey: { g:1.3, turns:2, rep:2 },
    reform: { expense:0.92, rep:-5, clean:0 },
    regTalk: { fav:5, score:4 },
    rating: { base:2.4, nplK:0.8, compK:0.03 },
    retain: 0.7,                // 税后利润留存补资本(分红三成)
    kpiTarget: { profit:18000000, roe:12, npl:1.3, car:13, rank:3, rating:2 },
    peers: [
      {id:"guoxin", name:"国信银行", dep:1600000000, g:0.030},
      {id:"hualian",name:"华联银行", dep:1400000000, g:0.032},
      {id:"hengtong",name:"恒通银行", dep:1100000000, g:0.034},
      {id:"donglian",name:"东联银行", dep:900000000, g:0.036},
      {id:"pingchuan",name:"平川银行", dep:800000000, g:0.035},
    ],
    endScore: { top:107, mid:101 },
    bonusTop: 2, bonusRep: 2, bonusTrust: 2,
  },
};
