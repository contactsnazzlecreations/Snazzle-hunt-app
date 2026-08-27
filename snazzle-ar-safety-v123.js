// Snazzle AR Safety v123 — fresh module name so Android/Chrome cannot reuse the old cached safety code.
// The STOP screen is mounted directly under <body>. When the Snazzle is reached,
// tapping the green action OR anywhere on the beige safety card releases the camera.

const $=(s,r=document)=>r.querySelector(s);
let installed=false;
let overlayObserver=null;
let bodyObserver=null;
let lastOpen=false;
let arrived=false;
let acknowledged=false;

function addStyles(){
  if($('#snArSafety123Styles'))return;
  const style=document.createElement('style');
  style.id='snArSafety123Styles';
  style.textContent=`
    #snArSafeRoot123{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:24px;background:linear-gradient(180deg,#123c25,#082719);pointer-events:auto!important;touch-action:manipulation!important;-webkit-user-select:none;user-select:none}
    #snArSafeRoot123.show{display:flex!important}
    #snArSafeCard123{width:min(520px,100%);padding:28px 24px 24px;border-radius:30px;background:#f7e9b7;color:#302318;border:5px solid #76502d;box-shadow:0 11px 0 #4e311e,0 22px 50px rgba(0,0,0,.32);text-align:center;pointer-events:auto!important;touch-action:manipulation!important}
    #snArSafeIcon123{font-size:66px;line-height:1;margin-bottom:8px;pointer-events:none}
    #snArSafeTitle123{margin:6px 0 12px;font-size:clamp(30px,8vw,46px);line-height:1;color:#97241e;font-weight:500;pointer-events:none}
    #snArSafeText123{margin:8px auto;font-size:clamp(17px,4.6vw,24px);line-height:1.38;font-weight:900;max-width:460px;pointer-events:none}
    #snArSafeDistance123{margin:22px 0 18px;padding:15px 12px;border-radius:20px;background:#153f26;color:#fff;font-size:clamp(18px,5vw,25px);font-weight:1000;pointer-events:none}
    #snArSafeAction123{display:none;width:100%;min-height:78px;border-radius:22px;padding:18px 14px;background:linear-gradient(#78d13f,#42952d);color:#fff;box-shadow:0 7px 0 #2c6b20;font-size:clamp(18px,5vw,24px);font-weight:1000;line-height:1.25;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:rgba(255,255,255,.25)}
    #snArSafeAction123.show{display:flex!important;align-items:center;justify-content:center}
    #snArSafeAction123.pressed{transform:translateY(3px);box-shadow:0 4px 0 #2c6b20}
    #snArSafeSmall123{display:block;margin-top:18px;color:#735b3d;font-size:13px;font-weight:850;pointer-events:none}
    #snArOverlay.sn-safe123-walking .sn-ar-camera{visibility:hidden!important}
    #snArOverlay.sn-safe123-walking .sn-ar-reticle,#snArOverlay.sn-safe123-walking .sn-ar-duck,#snArOverlay.sn-safe123-walking .sn-ar-catch{visibility:hidden!important}
  `;
  document.head.appendChild(style);
}

function makeRoot(){
  let root=$('#snArSafeRoot123');
  if(root)return root;
  root=document.createElement('div');
  root.id='snArSafeRoot123';
  root.innerHTML=`<div id="snArSafeCard123" role="dialog" aria-modal="true">
    <div id="snArSafeIcon123">👀</div>
    <div id="snArSafeTitle123">KIJK VOOR JE</div>
    <div id="snArSafeText123">Loop met je telefoon omlaag en let goed op je omgeving.</div>
    <div id="snArSafeDistance123">Snazzle-signaal zoeken…</div>
    <div id="snArSafeAction123" role="button" tabindex="0">Ik sta stil en heb om me heen gekeken ✓</div>
    <small id="snArSafeSmall123">Steek nooit een weg over terwijl je naar je telefoon kijkt.</small>
  </div>`;
  document.body.appendChild(root);

  const activate=(e)=>{
    if(!arrived||acknowledged)return;
    try{if(e?.cancelable)e.preventDefault();e?.stopPropagation?.();e?.stopImmediatePropagation?.();}catch{}
    releaseCamera();
  };
  // Listen on both the green action and the whole beige card. This avoids Android/WebView hit-test issues.
  const card=$('#snArSafeCard123',root),action=$('#snArSafeAction123',root);
  for(const el of [action,card]){
    el?.addEventListener('pointerdown',activate,{capture:true,passive:false});
    el?.addEventListener('touchstart',activate,{capture:true,passive:false});
    el?.addEventListener('click',activate,true);
  }
  action?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();releaseCamera();}});
  return root;
}

function duckVisible(){
  const duck=$('#snArDuck');
  if(!duck)return false;
  return !duck.classList.contains('sn-ar-hidden') && getComputedStyle(duck).display!=='none';
}

function releaseCamera(){
  if(!arrived||acknowledged)return;
  acknowledged=true;
  const root=$('#snArSafeRoot123');
  const overlay=$('#snArOverlay');
  const action=$('#snArSafeAction123');
  action?.classList.add('pressed');
  if(action)action.textContent='Camera openen… ✓';
  root?.classList.remove('show');
  overlay?.classList.remove('sn-safe123-walking');
  const camera=$('#snArCamera');
  if(camera){camera.style.visibility='visible';camera.play?.().catch(()=>{});}
  try{navigator.vibrate?.(70);}catch{}
}

function render(){
  const overlay=$('#snArOverlay');
  const root=$('#snArSafeRoot123');
  if(!overlay||!root)return;
  const open=overlay.classList.contains('show');
  if(open&&!lastOpen){arrived=false;acknowledged=false;}
  lastOpen=open;
  if(!open){
    arrived=false;acknowledged=false;
    root.classList.remove('show');
    overlay.classList.remove('sn-safe123-walking');
    return;
  }

  if(duckVisible())arrived=true;
  const title=$('#snArSafeTitle123'),text=$('#snArSafeText123'),icon=$('#snArSafeIcon123'),distance=$('#snArSafeDistance123'),action=$('#snArSafeAction123');
  if(acknowledged){root.classList.remove('show');overlay.classList.remove('sn-safe123-walking');return;}

  root.classList.add('show');
  overlay.classList.add('sn-safe123-walking');
  if(!arrived){
    if(icon)icon.textContent='👀';
    if(title)title.textContent='KIJK VOOR JE';
    if(text)text.textContent='Loop met je telefoon omlaag en let goed op je omgeving. De Snazzle verschijnt vanzelf wanneer je dichtbij genoeg bent.';
    const src=$('#snArDistance');if(distance)distance.textContent=src?.textContent||'Snazzle-signaal zoeken…';
    action?.classList.remove('show','pressed');
    return;
  }

  if(icon)icon.textContent='🛑';
  if(title)title.textContent='STOP MET LOPEN';
  if(text)text.textContent='Je bent bij de Snazzle. Blijf staan, kijk eerst goed om je heen en open daarna pas de camera.';
  if(distance)distance.textContent='Snazzle gevonden! ✨';
  if(action){action.textContent='Ik sta stil en heb om me heen gekeken ✓';action.classList.add('show');action.classList.remove('pressed');}
}

function install(){
  if(installed)return true;
  const overlay=$('#snArOverlay');
  if(!overlay||!document.body)return false;
  // Remove any leftover older safety UI if an old tab restored DOM state.
  $('#snArSafeWalk')?.remove();
  addStyles();makeRoot();
  const duck=$('#snArDuck'),distance=$('#snArDistance');
  overlayObserver=new MutationObserver(()=>queueMicrotask(render));
  overlayObserver.observe(overlay,{attributes:true,attributeFilter:['class']});
  if(duck)overlayObserver.observe(duck,{attributes:true,attributeFilter:['class']});
  if(distance)overlayObserver.observe(distance,{childList:true,subtree:true,characterData:true});
  installed=true;
  bodyObserver?.disconnect();bodyObserver=null;
  render();
  return true;
}

function boot(){
  if(install())return;
  if(bodyObserver||!document.body)return;
  bodyObserver=new MutationObserver(()=>install());
  bodyObserver.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SnazzleArSafetyV123={version:'123-fresh-body-card-touch',refresh:render,release:releaseCamera};