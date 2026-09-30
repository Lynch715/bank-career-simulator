/* =====================================================================
   装到桌面 + 离线(service worker)
   Chrome/Edge:一键装;Safari:图文指引;Firefox 桌面:不弹
   ===================================================================== */
const INSTALL = (() => {
  if(typeof window === "undefined" || typeof HEADLESS !== "undefined" && HEADLESS) return {available:()=>false, show(){}};
  const KEY = "thsz_install";
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR/.test(ua);
  const standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  let deferred = null, armed = false;
  const get = () => { try { return localStorage.getItem(KEY); } catch(e){ return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch(e){} };

  function bar(html, btns){
    let el = document.getElementById("installBar");
    if(!el){ el = document.createElement("div"); el.id = "installBar"; document.body.appendChild(el); }
    el.innerHTML = `<div class="ib-in"><img src="icon/icon-64.png" alt=""><div class="ib-t">${html}</div><div class="ib-b">${btns}</div></div>`;
    el.classList.add("on");
    const later = el.querySelector("[data-ib=later]"); if(later) later.onclick = () => { set("dismissed"); el.classList.remove("on"); };
    const close = el.querySelector("[data-ib=close]"); if(close) close.onclick = () => el.classList.remove("on");
    const go = el.querySelector("[data-ib=go]"); if(go) go.onclick = doInstall;
    return el;
  }
  function show(manual){
    if(standalone){ if(manual) UI.toast("已经是从桌面打开的了"); return; }
    if(deferred){ bar(`<b>把银行升职记放到桌面</b><br><small>点一下就装好，断网也能玩。</small>`, `<button class="btn ghost" data-ib="later">以后再说</button><button class="btn gold" data-ib="go">装到桌面</button>`); return; }
    if(isSafari && isIOS){ bar(`<b>放到主屏幕</b><br><small>点底部工具栏的<b>分享</b>按钮，往下找<b>「添加到主屏幕」</b>，再点右上角<b>添加</b>。</small>`, `<button class="btn ghost" data-ib="${manual?"close":"later"}">知道了</button>`); return; }
    if(isSafari){ bar(`<b>放到程序坞</b><br><small>菜单栏<b>文件</b> → <b>「添加到程序坞」</b>。</small>`, `<button class="btn ghost" data-ib="${manual?"close":"later"}">知道了</button>`); return; }
    if(manual) bar(`<b>这个浏览器装不了</b><br><small>用 Chrome、Edge 或 Safari 打开这个网址，就能放到桌面。</small>`, `<button class="btn ghost" data-ib="close">知道了</button>`);
  }
  async function doInstall(){
    const el = document.getElementById("installBar"); if(el) el.classList.remove("on");
    if(!deferred) return;
    deferred.prompt();
    const r = await deferred.userChoice; deferred = null;
    set(r && r.outcome === "accepted" ? "installed" : "dismissed");
  }
  function arm(){
    if(armed || standalone) return;
    const st = get(); if(st === "dismissed" || st === "installed") return;
    armed = true;
    const t = setInterval(() => {
      const app = document.getElementById("app");
      if(app && !app.classList.contains("hidden")){ clearInterval(t); setTimeout(() => show(false), 45000); }
    }, 2000);
  }
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; arm(); });
  addEventListener("appinstalled", () => set("installed"));
  if(isSafari) addEventListener("load", arm);

  // 离线
  if("serviceWorker" in navigator && location.protocol.startsWith("http")){
    let reloading = false;
    const hadCtrl = !!navigator.serviceWorker.controller;   // 首次安装接管时不刷新,只有更新才刷新
    navigator.serviceWorker.addEventListener("controllerchange", () => { if(reloading || !hadCtrl) return; reloading = true; location.reload(); });
    addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").then(reg => {
        reg.addEventListener("updatefound", () => {
          const w = reg.installing; if(!w) return;
          w.addEventListener("statechange", () => {
            if(w.state === "installed" && navigator.serviceWorker.controller){
              const el = bar(`<b>有新版本</b><br><small>刷新一下就是新版，存档不会丢。</small>`, `<button class="btn ghost" data-ib="close">等会儿</button><button class="btn gold" data-ib="upd">刷新</button>`);
              el.querySelector("[data-ib=upd]").onclick = () => { (reg.waiting || w).postMessage("skipWaiting"); };
            }
          });
        });
      }).catch(()=>{});
    });
  }
  return {available: () => !standalone && (!!deferred || isSafari), show};
})();
