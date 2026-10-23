// Cross-group art audit: customer/story replacements must keep game identity stable.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {load,GAME,runner}=require('./lib');
const T=runner('17-customer-faces'),{G}=load(),P=G.Portraits,root=path.dirname(GAME);
const inv=JSON.parse(fs.readFileSync(path.join(root,'assets/portraits/inventory.json')));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/portraits/web/manifest.json')));
const audit=inv.customerFaceAudit,rows=(audit&&audit.redesigned||[]).map(key=>inv.characters.find(c=>c.key===key));
T.ok('补查并重绘 43 位客户与其他 NPC，包含 38 位姓名池客户',rows.length===43&&rows.filter(c=>c.sources.includes('CUST_NAMES')).length===38);
T.ok('43 位角色接入第四版原画并保留旧版记录',rows.every(c=>c.status==='ready'&&c.artRevision===4&&c.asset.endsWith('-v4.png')&&c.previousPortraits.length));
T.ok('替换后的原画与历史版本实际不同',rows.every(c=>c.previousPortraits.every(old=>old.sha256!==c.sha256)));
T.ok('43 位角色分别设计面部结构和体态',new Set(rows.map(c=>c.faceDesign)).size===43&&rows.every(c=>c.faceDesign&&c.hairDesign&&c.bodyDesign));
T.ok('既有 65 位银行人物及两位玩家形象未被覆盖',!!audit&&Object.keys(audit.retainedSourceHashes||{}).length===67&&Object.entries(audit.retainedSourceHashes).every(([key,hash])=>inv.characters.find(c=>c.key===key).sha256===hash));
T.ok('全体 110 人跨分组仍是一人一个独立身份',inv.characters.length===110&&new Set(inv.characters.map(c=>P.key(c.name))).size===110&&inv.characters.every(c=>P.key(c.name)===c.key));
for(const size of ['small','large']){
 const hashes=Object.values(manifest).map(c=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,c[size]))).digest('hex'));
 T.ok('全体 '+size+' WebP 实际文件没有重复内容',hashes.length===110&&new Set(hashes).size===110);
}
G.newGame({seed:718});const before=JSON.stringify(G.S),keys=G.S.biz.cards.map(c=>P.key(c));
for(const c of G.S.biz.cards){P.markup(c,'small');P.markup(c,'large');}
for(const c of rows)P.inline(c.name);
T.ok('新图片绑定不修改客户、余额、行动点或随机序列',JSON.stringify(G.S)===before);
G.save();G.load();T.ok('存档继续后 40 位客户保持原有身份和立绘',G.S.biz.cards.length===40&&G.S.biz.cards.every((c,i)=>P.key(c)===keys[i])&&new Set(keys).size===40);
T.ok('明确主体事件仍显示本人，不受客户重绘影响',P.key(P.event({id:'sdx',data:{}}))==='zhangxf'&&P.key(P.event({id:'ranloan',data:{}}))==='ranguoq'&&P.key(P.event({id:'fanzha',data:{}}))==='chendg'&&P.key(P.event({id:'weidrink',data:{}}))==='weilc');
T.done();
