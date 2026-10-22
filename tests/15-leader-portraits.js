// Audit the actual data definitions, including ranking aliases and carried roles.
const fs=require('fs'),path=require('path');
const {load,GAME,runner}=require('./lib');
const T=runner('15-leader-portraits');
const {G}=load({patch:code=>code.replace('const THSZ = {','const THSZ = { portraitAuditRoster:{STAFF_L1,ROOKIE_L1,PEOPLE_DEF,PEOPLE_L2,CORP_LEAD_DEFAULT,PEOPLE_L3,RESERVES_L3,DEPUTIES_L4,PEOPLE_L4,RIVALS_L1,RIVALS_L2,RIVALS_L3,RIVALS_L4,INST_HEADS},')});
const R=G.portraitAuditRoster,P=G.Portraits,root=path.dirname(GAME);
const inventory=JSON.parse(fs.readFileSync(path.join(root,'assets/portraits/inventory.json')));
const entries=[];
const add=(name,id)=>entries.push({name,id});
for(const group of ['STAFF_L1','PEOPLE_DEF','PEOPLE_L2','PEOPLE_L3','RESERVES_L3','DEPUTIES_L4','PEOPLE_L4']){
  for(const p of R[group]) if(p.id!=='weilc') add(p.name,p.id);
}
add(R.ROOKIE_L1.name,R.ROOKIE_L1.id);add(R.CORP_LEAD_DEFAULT.name,R.CORP_LEAD_DEFAULT.id);
for(const group of ['RIVALS_L1','RIVALS_L2','RIVALS_L3','RIVALS_L4']){
  for(const p of R[group]) add(p.boss==='——'?'江北那位':p.boss,'rival_'+p.id);
}
for(const [id,p] of Object.entries(R.INST_HEADS))add(p.name,id);
for(const name of ['蒋红','程立','孔组长','吴悠','马晓','孙一','钱朵'])add(name,inventory.characters.find(c=>c.name===name).key);
const names=[...new Set(entries.map(p=>p.name))],keys=names.map(name=>P.key(name));
T.ok('从员工、储备、网点、各级分行和总行定义提取 65 位银行人物',names.length===65);
T.ok('65 位不同人物映射到 65 个独立立绘身份',keys.every(Boolean)&&new Set(keys).size===65);
T.ok('所有跨关卡 ID、排名 ID 与本人的姓名映射一致',entries.every(p=>P.key(p.id)===P.key(p.name)));
const rows=keys.map(key=>inventory.characters.find(c=>c.key===key));
T.ok('65 位人物的源文件指纹互不重复',new Set(rows.map(p=>p.sha256)).size===65);
const replacements=inventory.leadershipAudit.redesigned.map(key=>inventory.characters.find(c=>c.key===key));
T.ok('62 位重制人物均接入版本三专属原画',replacements.length===62&&replacements.every(c=>c.status==='ready'&&c.artRevision===3&&c.asset.endsWith('-v3.png')&&c.previousAssets.length));
T.ok('62 位人物确实替换为不同于旧图的新原画',replacements.every(c=>c.previousPortraits&&c.previousPortraits.every(old=>old.sha256!==c.sha256)));
T.ok('重制人物逐人定义独立面部结构',new Set(replacements.map(c=>c.faceDesign)).size===62&&replacements.every(c=>c.faceDesign&&c.hairDesign&&c.bodyDesign));
T.ok('原有三位风格基准人物保留专属身份',inventory.leadershipAudit.retained.length===3&&inventory.leadershipAudit.retained.every(key=>P.key(key)===key&&!inventory.leadershipAudit.redesigned.includes(key)));
T.ok('三张保留原画没有被覆盖',inventory.leadershipAudit.retained.every(key=>inventory.characters.find(c=>c.key===key).sha256===inventory.leadershipAudit.retainedSourceHashes[key]));
T.ok('江北排名匿名称谓也有本人的专属图',P.key({id:'rival_jiangbei',name:'——'})==='jbnw');
T.ok('相似姓名的两位负责人不会混用',P.key('沈岚')!==P.key('沈国梁')&&P.key('何静')!==P.key('顾清越')&&P.key('田瑛')!==P.key('许丽萍'));
G.newGame({seed:718});
const before=JSON.stringify(G.S);
for(const p of entries){P.key(p);P.inline(p,p.name);}
T.ok('遍历所有负责人身份不改变存档或随机数',before===JSON.stringify(G.S));
G.save();G.load();
T.ok('旧存档里的员工继续使用本人专属图',G.S.staff.every(c=>P.key(c)===P.key(c.name)));
const {JSDOM,VirtualConsole}=require('jsdom');const errors=[],vc=new VirtualConsole();
vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errors.push(e.message)});
const dom=new JSDOM(fs.readFileSync(GAME,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',virtualConsole:vc});
const w=dom.window,d=w.document,H=w.THSZ;
H.newGame({seed:718});H.S.lv=2;H.internals.initL2('xiaoman');d.querySelector('#startScr').classList.add('hidden');H.UI.refresh();
T.ok('L2 排名里的匿名负责人使用专属立绘',!!d.querySelector('.rank-t [data-portrait="jbnw"]'));
T.ok('机构排名不再按相同职位误绑不同人物',new Set([...d.querySelectorAll('.rank-t .portrait')].map(e=>e.dataset.portrait)).size===d.querySelectorAll('.rank-t .portrait').length);
T.ok('排名与负责人界面无脚本错误',errors.length===0,errors.join(' / '));
dom.window.close();T.done();
