// 银行升职记:离线缓存。代码走网络优先,图片走缓存优先。
const VER = "thsz-v19-distinct-customers-20261022";
importScripts('./assets/portraits/precache.js');
const SHELL = ["./", "./index.html", "./site.webmanifest", "./favicon.ico", "./icon/icon-192.png", "./icon/icon-512.png", "./icon/icon-64.png", "./icon/icon-180.png"];
self.addEventListener("install", e => {
  // Replaced portraits keep their public filenames. Bypass the HTTP cache so
  // installing a new release actually downloads the new image bytes.
  const fresh = SHELL.concat(PORTRAIT_PRECACHE).map(path => new Request(new URL(path, self.location.href), {cache:"reload"}));
  e.waitUntil(caches.open(VER).then(c => c.addAll(fresh)));
});
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
