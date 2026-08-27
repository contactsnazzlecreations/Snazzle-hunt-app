// Snazzle AR Safety v82f — stabiele Safe Walk laag voor mobiel.
// Geen blokkade meer op Android: bij aankomst opent de camera automatisch na een korte veiligheidsmelding.
// De groene knop blijft bestaan en opent de camera direct als aanraken wel wordt geregistreerd.

const qs=(s,r=document)=>r.querySelector(s);
let installed=false;
let acknowledgedStop=false;
let arrivedLatched=false;
let lastOverlayOpen=false;
let overlayObserver=null;
let bodyObserver=null;
let distanceTimer=0;
let arrivalTimer=0;

function installSafetyStyles(){
  if(document.getElementById('snArSafetyV82bStyles')) return;
  const style=document.createElement('style');
  style.id='snArSafetyV82bStyles';
  style.textContent=`
    .sn-ar-safe-walk{position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;padding:92px 22px 145px;background:linear-gradient(180deg,#123c25,#092719);color:#fff;text-align:center;pointer-events:auto;touch-action:manipulation}
    .sn-ar-safe-walk.show{display:flex}
    .sn-ar-safe-card{width:min(430px,100%);padding:22px 18px;border-radius:26px;background:#f5e9bd;color:#2f2417;border:4px solid #7a562c;box-shadow:0 8px 0 #4d311b;position:relative;z-index:1;pointer-events:auto}
    .sn-ar-safe-icon{font-size:54px;line-height:1;margin-bottom:8px}
    .sn-ar-safe-card h2{margin:4px 0 8px;font-size:30px;line-height:1;color:#8c201b}
    .sn-ar-safe-card p{margin:8px 0;font-weight:850;line-height:1.42;font-size:16px}
    .sn-ar-safe-distance{margin:15px 0 4px;padding:12px;border-radius:16px;background:#173b24;color:#fff;font-size:19px;font-weight:1000}
    .sn-ar-safe-stop{display:none;width:100%;margin-top:14px;border:0;border-radius:16px;padding:15px;background:linear-gradient(#72c842,#438e2c);color:#fff;font-weight:1000;font-size:16px;box-shadow:0 5px 0 #2d6820;position:relative;z-index:2;pointer-events:auto!important;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .sn-ar-safe-stop.show{display:block}
    .sn-ar-safe-small{display:block;margin-top:10px;font-size:11px;font-weight:800;color:#71583a}
    .sn-ar-overlay.safe-walking .sn-ar-camera{visibility:hidden}
    .sn-ar-overlay.safe-walking .sn-ar-reticle,.sn-ar-overlay.safe-walking .sn-ar-duck,.sn-ar-overlay.safe-walking .sn-ar-catch{visibility:hidden!important}
    @media(max-width:390px){.sn-ar-safe-card h2{font-size:26px}.sn-ar-safe-walk{padding-left:14px;padding-right:14px}}
  `;
  document.head.appendChild(style);
}

function isDuckAvailable(){
  const duck=qs('#snArDuck');
  return !!duck && !duck.classList.contains('sn-ar-hidden');
}

function mirrorDistance(){
  const source=qs('#snArDistance');
  const target=qs('#snArSafeDistance');
  if(source&&target&&!arrivedLatched) target.textContent=source.textContent||'Snazzle-signaal zoeken…';
}

function clearArrivalTimer(){
  if(arrivalTimer){clearTimeout(arrivalTimer);arrivalTimer=0;}
}

function acknowledgeStop(e){
  try{if(e?.cancelable)e.preventDefault();e?.stopPropagation?.();}catch{}
  if(acknowledgedStop) return;
  clearArrivalTimer();
  arrivedLatched=true;
  acknowledgedStop=true;
  const shield=qs('#snArSafeWalk');
  const overlay=qs('#snArOverlay');
  const button=qs('#snArSafeStop');
  if(button) button.textContent='Camera openen… ✓';
  shield?.classList.remove('show');
  overlay?.classList.remove('safe-walking');
  button?.classList.remove('show');
  try{navigator.vibrate?.(70);}catch{}
}

function scheduleAutomaticRelease(){
  if(arrivalTimer||acknowledgedStop) return;
  arrivalTimer=window.setTimeout(()=>{
    arrivalTimer=0;
    acknowledgeStop();
  },1800);
}

function renderSafety(){
  const overlay=qs('#snArOverlay');
  const shield=qs('#snArSafeWalk');
  if(!overlay||!shield) return;

  const open=overlay.classList.contains('show');
  if(open&&!lastOverlayOpen){
    acknowledgedStop=false;
    arrivedLatched=false;
    clearArrivalTimer();
  }
  lastOverlayOpen=open;

  if(!open){
    acknowledgedStop=false;
    arrivedLatched=false;
    clearArrivalTimer();
    shield.classList.remove('show');
    overlay.classList.remove('safe-walking');
    return;
  }

  if(isDuckAvailable()) arrivedLatched=true;
  const title=qs('#snArSafeTitle');
  const text=qs('#snArSafeText');
  const icon=qs('#snArSafeIcon');
  const button=qs('#snArSafeStop');

  if(!arrivedLatched){
    acknowledgedStop=false;
    clearArrivalTimer();
    shield.classList.add('show');
    overlay.classList.add('safe-walking');
    if(icon) icon.textContent='👀';
    if(title) title.textContent='KIJK VOOR JE';
    if(text) text.textContent='Loop met je telefoon omlaag en let op je omgeving. De Snazzle verschijnt vanzelf wanneer je dichtbij genoeg bent.';
    button?.classList.remove('show');
    mirrorDistance();
    return;
  }

  if(!acknowledgedStop){
    shield.classList.add('show');
    overlay.classList.add('safe-walking');
    if(icon) icon.textContent='🛑';
    if(title) title.textContent='STOP MET LOPEN';
    if(text) text.textContent='Je bent bij de Snazzle. Blijf staan en kijk goed om je heen. De camera opent automatisch.';
    const d=qs('#snArSafeDistance');
    if(d) d.textContent='Snazzle gevonden! ✨';
    if(button){
      button.classList.add('show');
      button.disabled=false;
      button.textContent='Ik sta stil en heb om me heen gekeken ✓';
    }
    scheduleAutomaticRelease();
    return;
  }

  shield.classList.remove('show');
  overlay.classList.remove('safe-walking');
  button?.classList.remove('show');
}

function installOnOverlay(){
  if(installed) return true;
  const overlay=qs('#snArOverlay');
  if(!overlay) return false;

  installSafetyStyles();

  let shield=qs('#snArSafeWalk');
  if(!shield){
    shield=document.createElement('div');
    shield.id='snArSafeWalk';
    shield.className='sn-ar-safe-walk';
    shield.setAttribute('role','status');
    shield.innerHTML=`
      <div class="sn-ar-safe-card" id="snArSafeCard">
        <div class="sn-ar-safe-icon" id="snArSafeIcon">👀</div>
        <h2 id="snArSafeTitle">KIJK VOOR JE</h2>
        <p id="snArSafeText">Loop met je telefoon omlaag en let op je omgeving. Je hoeft tijdens het lopen niet naar de camera te kijken.</p>
        <div class="sn-ar-safe-distance" id="snArSafeDistance">Snazzle-signaal zoeken…</div>
        <button type="button" class="sn-ar-safe-stop" id="snArSafeStop">Ik sta stil en heb om me heen gekeken ✓</button>
        <small class="sn-ar-safe-small">Steek nooit een weg over terwijl je naar je telefoon kijkt.</small>
      </div>`;
    overlay.appendChild(shield);
  }

  const stopButton=qs('#snArSafeStop');
  const card=qs('#snArSafeCard');
  if(stopButton){
    stopButton.onclick=acknowledgeStop;
    stopButton.addEventListener('touchstart',acknowledgeStop,{passive:false});
    stopButton.addEventListener('pointerdown',acknowledgeStop,{passive:false});
  }
  if(card){
    card.addEventListener('click',e=>{
      if(arrivedLatched&&!acknowledgedStop) acknowledgeStop(e);
    });
  }

  const duck=qs('#snArDuck');
  const distance=qs('#snArDistance');
  overlayObserver=new MutationObserver(()=>queueMicrotask(renderSafety));
  overlayObserver.observe(overlay,{attributes:true,attributeFilter:['class']});
  if(duck) overlayObserver.observe(duck,{attributes:true,attributeFilter:['class']});
  if(distance) overlayObserver.observe(distance,{childList:true,subtree:true,characterData:true});

  distanceTimer=window.setInterval(()=>{
    if(overlay.classList.contains('show')){
      mirrorDistance();
      renderSafety();
    }
  },1000);

  installed=true;
  bodyObserver?.disconnect();
  bodyObserver=null;
  renderSafety();
  return true;
}

function boot(){
  if(installOnOverlay()) return;
  if(bodyObserver||!document.body) return;
  bodyObserver=new MutationObserver(()=>installOnOverlay());
  bodyObserver.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

window.SnazzleArSafetyV82b={
  version:'82f-auto-release',
  refresh:renderSafety,
  acknowledge:acknowledgeStop,
  installed:()=>installed,
  destroy(){
    overlayObserver?.disconnect();
    bodyObserver?.disconnect();
    if(distanceTimer) clearInterval(distanceTimer);
    clearArrivalTimer();
  }
};