// Snazzle AR Safety v82e — top-level Android-safe STOP-laag.
// De veiligheidskaart staat direct onder document.body met maximale z-index,
// zodat geen AR/HUD/overlay de groene knop kan onderscheppen.

const qs=(s,r=document)=>r.querySelector(s);
let installed=false;
let acknowledgedStop=false;
let arrivedLatched=false;
let lastOverlayOpen=false;
let overlayObserver=null;
let bodyObserver=null;
let distanceTimer=0;

function installSafetyStyles(){
  if(document.getElementById('snArSafetyV82bStyles')) return;
  const style=document.createElement('style');
  style.id='snArSafetyV82bStyles';
  style.textContent=`
    .sn-ar-safe-walk{position:fixed!important;inset:0!important;z-index:2147483000!important;display:none;align-items:center;justify-content:center;padding:92px 22px 145px;background:linear-gradient(180deg,#123c25,#092719);color:#fff;text-align:center;pointer-events:auto!important;touch-action:manipulation!important}
    .sn-ar-safe-walk.show{display:flex!important}
    .sn-ar-safe-card{width:min(430px,100%);padding:22px 18px;border-radius:26px;background:#f5e9bd;color:#2f2417;border:4px solid #7a562c;box-shadow:0 8px 0 #4d311b;position:relative;z-index:2;pointer-events:auto!important;touch-action:manipulation!important}
    .sn-ar-safe-icon{font-size:54px;line-height:1;margin-bottom:8px;pointer-events:none}.sn-ar-safe-card h2{margin:4px 0 8px;font-size:30px;line-height:1;color:#8c201b;pointer-events:none}.sn-ar-safe-card p{margin:8px 0;font-weight:850;line-height:1.42;font-size:16px;pointer-events:none}
    .sn-ar-safe-distance{margin:15px 0 4px;padding:12px;border-radius:16px;background:#173b24;color:#fff;font-size:19px;font-weight:1000;pointer-events:none}
    .sn-ar-safe-stop{display:none!important;width:100%;min-height:68px;margin-top:14px;border:0;border-radius:16px;padding:15px;background:linear-gradient(#72c842,#438e2c);color:#fff;font-weight:1000;font-size:16px;box-shadow:0 5px 0 #2d6820;position:relative;z-index:5;pointer-events:auto!important;touch-action:manipulation!important;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:rgba(255,255,255,.22)}
    .sn-ar-safe-stop.show{display:block!important}.sn-ar-safe-stop:active{transform:translateY(2px);box-shadow:0 3px 0 #2d6820}
    .sn-ar-safe-small{display:block;margin-top:10px;font-size:11px;font-weight:800;color:#71583a;pointer-events:none}
    .sn-ar-overlay.safe-walking .sn-ar-camera{visibility:hidden!important}
    .sn-ar-overlay.safe-walking .sn-ar-reticle,.sn-ar-overlay.safe-walking .sn-ar-duck,.sn-ar-overlay.safe-walking .sn-ar-catch{visibility:hidden!important}
    @media(max-width:390px){.sn-ar-safe-card h2{font-size:26px}.sn-ar-safe-walk{padding-left:14px;padding-right:14px}}
  `;
  document.head.appendChild(style);
}

function isDuckAvailable(){const duck=qs('#snArDuck');return !!duck&&!duck.classList.contains('sn-ar-hidden');}
function mirrorDistance(){const source=qs('#snArDistance'),target=qs('#snArSafeDistance');if(source&&target&&!arrivedLatched)target.textContent=source.textContent||'Snazzle-signaal zoeken…';}

function forceRelease(){
  arrivedLatched=true;
  acknowledgedStop=true;
  const shield=qs('#snArSafeWalk'),overlay=qs('#snArOverlay'),button=qs('#snArSafeStop');
  if(button){button.textContent='Camera openen… ✓';button.classList.remove('show');button.disabled=true;}
  shield?.classList.remove('show');
  shield?.setAttribute('aria-hidden','true');
  overlay?.classList.remove('safe-walking');
  try{navigator.vibrate?.(70);}catch{}
}

function acknowledgeStop(e){
  if(acknowledgedStop)return;
  try{if(e?.cancelable)e.preventDefault();e?.stopPropagation?.();}catch{}
  forceRelease();
}

function renderSafety(){
  const overlay=qs('#snArOverlay'),shield=qs('#snArSafeWalk');if(!overlay||!shield)return;
  const open=overlay.classList.contains('show');
  if(open&&!lastOverlayOpen){acknowledgedStop=false;arrivedLatched=false;const b=qs('#snArSafeStop');if(b){b.disabled=false;b.textContent='Ik sta stil en heb om me heen gekeken ✓';}}
  lastOverlayOpen=open;
  if(!open){acknowledgedStop=false;arrivedLatched=false;shield.classList.remove('show');shield.setAttribute('aria-hidden','true');overlay.classList.remove('safe-walking');return;}
  if(isDuckAvailable())arrivedLatched=true;
  const title=qs('#snArSafeTitle'),text=qs('#snArSafeText'),icon=qs('#snArSafeIcon'),button=qs('#snArSafeStop');
  if(acknowledgedStop){shield.classList.remove('show');overlay.classList.remove('safe-walking');button?.classList.remove('show');return;}
  shield.classList.add('show');shield.setAttribute('aria-hidden','false');overlay.classList.add('safe-walking');
  if(!arrivedLatched){
    if(icon)icon.textContent='👀';if(title)title.textContent='KIJK VOOR JE';if(text)text.textContent='Loop met je telefoon omlaag en let op je omgeving. De Snazzle verschijnt vanzelf wanneer je dichtbij genoeg bent.';button?.classList.remove('show');mirrorDistance();return;
  }
  if(icon)icon.textContent='🛑';if(title)title.textContent='STOP MET LOPEN';if(text)text.textContent='Je bent bij de Snazzle. Blijf staan, kijk eerst goed om je heen en open daarna pas de camera.';
  const d=qs('#snArSafeDistance');if(d)d.textContent='Snazzle gevonden! ✨';if(button){button.disabled=false;button.classList.add('show');}
}

function wireShield(shield){
  const button=qs('#snArSafeStop',shield),card=qs('.sn-ar-safe-card',shield);
  const direct=e=>{if(!arrivedLatched||acknowledgedStop)return;acknowledgeStop(e);};
  if(button){button.onclick=direct;button.onpointerdown=direct;button.ontouchstart=direct;}
  // Android-fallback: zodra STOP zichtbaar is, mag ook een tik op de beige kaart doorgaan.
  if(card){card.addEventListener('pointerdown',e=>{if(arrivedLatched&&!acknowledgedStop)direct(e);},{passive:false});card.addEventListener('touchstart',e=>{if(arrivedLatched&&!acknowledgedStop)direct(e);},{passive:false});}
  // Laatste fallback op de volledige top-level veiligheidslaag.
  shield.addEventListener('pointerdown',e=>{if(!arrivedLatched||acknowledgedStop)return;const r=card?.getBoundingClientRect();if(!r)return;if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)direct(e);},{capture:true,passive:false});
}

function installOnOverlay(){
  if(installed)return true;
  const overlay=qs('#snArOverlay');if(!overlay)return false;
  installSafetyStyles();
  let shield=qs('#snArSafeWalk');
  if(!shield){
    shield=document.createElement('div');shield.id='snArSafeWalk';shield.className='sn-ar-safe-walk';shield.setAttribute('role','status');shield.setAttribute('aria-hidden','true');
    shield.innerHTML=`<div class="sn-ar-safe-card"><div class="sn-ar-safe-icon" id="snArSafeIcon">👀</div><h2 id="snArSafeTitle">KIJK VOOR JE</h2><p id="snArSafeText">Loop met je telefoon omlaag en let op je omgeving.</p><div class="sn-ar-safe-distance" id="snArSafeDistance">Snazzle-signaal zoeken…</div><button type="button" class="sn-ar-safe-stop" id="snArSafeStop">Ik sta stil en heb om me heen gekeken ✓</button><small class="sn-ar-safe-small">Steek nooit een weg over terwijl je naar je telefoon kijkt.</small></div>`;
    document.body.appendChild(shield);
  }else if(shield.parentElement!==document.body){document.body.appendChild(shield);}
  wireShield(shield);
  const duck=qs('#snArDuck'),distance=qs('#snArDistance');
  overlayObserver=new MutationObserver(()=>queueMicrotask(renderSafety));overlayObserver.observe(overlay,{attributes:true,attributeFilter:['class']});if(duck)overlayObserver.observe(duck,{attributes:true,attributeFilter:['class']});if(distance)overlayObserver.observe(distance,{childList:true,subtree:true,characterData:true});
  distanceTimer=window.setInterval(()=>{if(overlay.classList.contains('show')){mirrorDistance();renderSafety();}},750);
  installed=true;bodyObserver?.disconnect();bodyObserver=null;renderSafety();return true;
}

function boot(){if(installOnOverlay())return;if(bodyObserver||!document.body)return;bodyObserver=new MutationObserver(()=>installOnOverlay());bodyObserver.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.SnazzleArSafetyV82b={version:'82e-top-level-android',refresh:renderSafety,acknowledge:acknowledgeStop,forceRelease,installed:()=>installed,destroy(){overlayObserver?.disconnect();bodyObserver?.disconnect();if(distanceTimer)clearInterval(distanceTimer);}};