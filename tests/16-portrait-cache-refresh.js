// A warm HTTP cache must not turn a new art release into an old-image cache.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {runner}=require('./lib');const T=runner('16-portrait-cache-refresh');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/portraits/web/manifest.json')));
const base='https://example.test/bank/',handlers={},stored=new Map();let fetched=[];
const self={location:new URL('sw.js',base),addEventListener:(name,fn)=>handlers[name]=fn};
const context=vm.createContext({self,URL,Request,Response,location:self.location,
  importScripts:()=>vm.runInContext(fs.readFileSync(path.join(root,'assets/portraits/precache.js'),'utf8'),context),
  caches:{open:async()=>({addAll:async requests=>{
    fetched=requests;
    // An ordinary request is served the stale image from a still-fresh HTTP
    // cache. A reload request obtains the replacement from the origin.
    for(const req of requests)stored.set(req.url,req.cache==='reload'?'new-art':'old-art');
  }})}
});
(async()=>{
 vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),context);
 let installed;handlers.install({waitUntil:p=>installed=p});await installed;
 const images=Object.values(manifest).flatMap(p=>[p.small,p.large]);
 T.ok('新版本安装覆盖全部 220 张人物大小图',images.length===220&&images.every(p=>stored.has(new URL(p,base).href)));
 T.ok('HTTP 缓存仍有效时也能下载并缓存替换后的立绘',images.every(p=>stored.get(new URL(p,base).href)==='new-art'));
 T.ok('应用壳同样更新且缓存地址保持原有路径',stored.get(base+'index.html')==='new-art'&&fetched.every(req=>new URL(req.url).origin===new URL(base).origin&&!new URL(req.url).search));
 T.done();
})().catch(e=>{console.error(e);process.exitCode=1});
