/* 人物美术层：只读取状态，不调用游戏随机数，不改写存档中的人物属性。 */
const PORTRAITS = {
  byName: Object.fromEntries(Object.entries(PORTRAIT_DATA).map(([key, p])=>[p.name, key])),
  byId: Object.fromEntries(Object.entries(PORTRAIT_DATA).flatMap(([key, p])=>p.ids.map(id=>[id,key]))),
  key(subject){
    if(!subject) return null;
    if(typeof subject==='string') return PORTRAIT_DATA[subject] ? subject : (this.byId[subject] || this.byName[subject] || null);
    // 以名字优先识别旧存档或跨关卡角色，避免同名角色换岗后换脸。
    if(this.byName[subject.name]) return this.byName[subject.name];
    if(this.byId[subject.id]) return this.byId[subject.id];
    if(subject.portrait && PORTRAIT_DATA[subject.portrait]) return subject.portrait;
    // 客户姓名池、补充员工均有专属图。未识别身份时不再借用别人的脸。
    return null;
  },
  markup(subject, size='small', caption=false){
    const key=this.key(subject); if(!key) return '';
    const p=PORTRAIT_DATA[key], full=size==='large'||size==='card'||size==='choice';
    const name=typeof subject==='object' ? subject.name||p.name : p.name;
    return `<figure class="portrait portrait-${size}" data-portrait="${key}"><img src="${full?p.large:p.small}" alt="${esc(name).replace(/\"/g,'&quot;')}立绘" loading="${size==='large'?'eager':'lazy'}" decoding="async" width="${full?p.width:p.thumbWidth}" height="${full?p.height:p.thumbHeight}">${caption?`<figcaption>${esc(name)}</figcaption>`:''}</figure>`;
  },
  inline(subject, name){
    const key=this.key(subject);
    const label=name!=null?name:(typeof subject==='string'?subject:(subject&&subject.name)||'');
    return `<span class="person-inline">${key?this.markup(subject,'tiny'):''}<span>${esc(label)}</span></span>`;
  },
  event(x){
    const d=x.data||{};
    if(d.sid) return staff(d.sid)||person(d.sid);
    if(d.pid) return person(d.pid);
    if(x.id==='ltz' && d.oid) return mgrOf(d.oid);
    if(x.id==='nanan') return S.carry&&S.carry.l2&&S.carry.l2.mgrName;
    if(x.id==='poach3') return person(branch('gst').mgr);
    if(x.id==='nuoyong') return person(branch('cl').mgr);
    if(x.id==='jnfang') return person(branch('jn').mgr);
    if(x.id==='feidan') return mgrOf('chayuan');
    if(x.id==='dahu') return mgrOf('sigongli');
    if(x.id==='dzs5') return 'hejing';
    const map={kmh:'huang',huang1:'huang',huang2:'huang',huang3:'huang',sdx:'zhangxf',fanzha:'chendg',shuanglu:'gu',wajiao:'zhangxf',huoguo:'ranguoq',luxun:'lu',
      kmh2:'zhouqm',mb1:'maben',mb2:'weilc',mb3:'maben',huangleg:'zhouqm',lujob:'lu',gufx:'gu',relloan:'zhouqm',ranloan:'ranguoq',weidrink:'weilc',neishen:'kong',
      kmh3:'lu',yimin:'tanmin',flood:'ranggm',kaoyu:'ranggm',gu3:'gu',lu3:'lu',
      kmh4:'songwy',zhou4:'zhouqm',fangqi:'duheng',gu4:'gu',lu4:'lu',maben4:'maben',wei4:'weilc',du4:'duheng',
      song5:'songwy',strat:'lu',gu5:'gu',lu5:'lu',zhou5:'zhouqm'};
    return map[x.id]||null;
  },
  option(o){
    if(o.portrait) return o.portrait;
    // 只匹配以姓名开头的候选人物选项，不从叙事或多方评论里猜发言人。
    return Object.keys(this.byName).find(name=>o.t===name || String(o.t).startsWith(name+' ·'))||null;
  },
  bind(root){
    root.querySelectorAll('.portrait img').forEach(img=>{
      img.onerror=()=>{img.closest('.portrait').classList.add('portrait-unavailable');};
      if(img.complete && img.naturalWidth===0) img.onerror();
    });
  },
};
THSZ.Portraits=PORTRAITS;
