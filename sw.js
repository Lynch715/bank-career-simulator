// 银行升职记:离线缓存。代码走网络优先,图片走缓存优先。
const VER = "thsz-v16-portrait-layout-20261013";
importScripts('./assets/portraits/precache.js');
const SHELL = ["./", "./index.html", "./site.webmanifest", "./favicon.ico", "./icon/icon-192.png", "./icon/icon-512.png", "./icon/icon-64.png", "./icon/icon-180.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL.concat(PORTRAIT_PRECACHE)))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("message", e => { if(e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isImg = /\.(png|ico|jpg|jpeg|webp|svg)$/.test(new URL(req.url).pathname);
  if(isImg){
    e.respondWith(caches.open(VER).then(c => c.match(req).then(hit => {
      if(hit) return hit;
      return fetch(req).then(r => { if(r.ok) c.put(req, r.clone()); return r; }).catch(() => new Response('',{status:503}));
    })));
  } else {
    e.respondWith(fetch(req).then(r => { if(r.ok){ const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req).then(h => h || caches.match("./index.html"))));
  }
});
