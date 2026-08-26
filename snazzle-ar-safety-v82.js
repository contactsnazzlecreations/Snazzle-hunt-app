// Snazzle AR Safety v82 — children should not walk while watching the camera.
// This module deliberately hides the camera while travelling and requires a stop confirmation before catching.

const qs = (s) => document.querySelector(s);
let safetyReady = false;
let acknowledgedStop = false;
let lastOverlayOpen = false;

function installSafetyStyles(){
  if(document.getElementById('snArSafetyV82Styles')) return;
  const style=document.createElement('style');
  style.id='snArSafetyV82Styles';
  style.textContent=`
    .sn-ar-safe-walk{position:absolute;inset:0;z-index:4;display:none;align-items:center;justify-content:center;padding:92px 22px 145px;background:linear-gradient(180deg,#123c25,#092719);color:#fff;text-align:center}
    .sn-ar-safe-walk.show{display:flex}
    .sn-ar-safe-card{width:min(430px,100%);padding:22px 18px;border-radius:26px;background:#f5e9bd;color:#2f2417;border:4px solid #7a562c;box-shadow:0 8px 0 #4d311b}
    .sn-ar-safe-icon{font-size:54px;line-height:1;margin-bottom:8px}
    .sn-ar-safe-card h2{margin:4px 0 8px;font-size:30px;line-height:1;color:#8c201b}
    .sn-ar-safe-card p{margin:8px 0;font-weight:850;line-height:1.42;font-size:16px}
    .sn-ar-safe-distance{margin:15px 0 4px;padding:12px;border-radius:16px;background:#173b24;color:#fff;font-size:19px;font-weight:1000}
    .sn-ar-safe-stop{display:none;width:100%;margin-top:14px;border:0;border-radius:16px;padding:15px;background:linear-gradient(#72c842,#438e2c);color:#fff;font-weight:1000;font-size:16px;box-shadow:0 5px 0 #2d6820}
    .sn-ar-safe-stop.show{display:block}
    .sn-ar-safe-small{display:block;margin-top:10px;font-size:11px;font-weight:800;color:#71583a}
    .sn-ar-overlay.safe-walking .sn-ar-camera{visibility:hidden}
    .sn-ar-overlay.safe-walking .sn-ar-reticle,.sn-ar-overlay.safe-walking .sn-ar-duck,.sn-ar-overlay.safe-walking .sn-ar-catch{visibility:hidden!important}
    @media(max-width:390px){.sn-ar-safe-card h2{font-size:26px}.sn-ar-safe-walk{padding-left:14px;padding-right:14px}}
  `;
  document.head.appendChild(style);
}

function installSafetyUi(){
  const overlay=qs('#snArOverlay');
  if(!overlay || qs('#snArSafeWalk')) return false;
  const shield=document.createElement('div');
  shield.id='snArSafeWalk';
  shield.className='sn-ar-safe-walk';
  shield.setAttribute('role','status');
  shield.innerHTML=`
    <div class="sn-ar-safe-card">
      <div class="sn-ar-safe-icon" id="snArSafeIcon">👀</div>
      <h2 id="snArSafeTitle">KIJK VOOR JE</h2>
      <p id="snArSafeText">Loop met je telefoon omlaag en let op je omgeving. Je hoeft tijdens het lopen niet naar de camera te kijken.</p>
      <div class="sn-ar-safe-distance" id="snArSafeDistance">Snazzle-signaal zoeken…</div>
      <button type="button" class="sn-ar-safe-stop" id="snArSafeStop">Ik sta stil en heb om me heen gekeken ✓</button>
      <small class="sn-ar-safe-small">Steek nooit een weg over terwijl je naar je telefoon kijkt.</small>
    </div>`;
  overlay.appendChild(shield);
  qs('#snArSafeStop')?.addEventListener('click',()=>{
    acknowledgedStop=true;
    renderSafety();
    if(navigator.vibrate) navigator.vibrate(70);
  });
  return true;
}

function isDuckAvailable(){
  const duck=qs('#snArDuck');
  return !!duck && !duck.classList.contains('sn-ar-hidden');
}

function mirrorDistance(){
  const source=qs('#snArDistance');
  const target=qs('#snArSafeDistance');
  if(source && target && !isDuckAvailable()) target.textContent=source.textContent || 'Snazzle-signaal zoeken…';
}

function renderSafety(){
  const overlay=qs('#snArOverlay');
  const shield=qs('#snArSafeWalk');
  if(!overlay || !shield) return;
  const open=overlay.classList.contains('show');
  if(open && !lastOverlayOpen) acknowledgedStop=false;
  lastOverlayOpen=open;
  if(!open){
    shield.classList.remove('show');
    overlay.classList.remove('safe-walking');
    return;
  }

  const arrived=isDuckAvailable();
  const title=qs('#snArSafeTitle');
  const text=qs('#snArSafeText');
  const icon=qs('#snArSafeIcon');
  const button=qs('#snArSafeStop');

  if(!arrived){
    acknowledgedStop=false;
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
    if(text) text.textContent='Je bent bij de Snazzle. Blijf staan, kijk eerst goed om je heen en open daarna pas de camera.';
    const d=qs('#snArSafeDistance'); if(d) d.textContent='Snazzle gevonden! ✨';
    button?.classList.add('show');
    return;
  }

  shield.classList.remove('show');
  overlay.classList.remove('safe-walking');
  button?.classList.remove('show');
}

function observeSafety(){
  const overlay=qs('#snArOverlay');
  const duck=qs('#snArDuck');
  const distance=qs('#snArDistance');
  if(!overlay || !duck) return;
  const observer=new MutationObserver(()=>renderSafety());
  observer.observe(overlay,{attributes:true,attributeFilter:['class']});
  observer.observe(duck,{attributes:true,attributeFilter:['class']});
  if(distance) observer.observe(distance,{childList:true,subtree:true,characterData:true});
  setInterval(()=>{ if(overlay.classList.contains('show')){mirrorDistance();renderSafety();} },800);
  renderSafety();
}

function bootSafety(){
  if(safetyReady) return;
  installSafetyStyles();
  if(!installSafetyUi()){
    setTimeout(bootSafety,250);
    return;
  }
  safetyReady=true;
  observeSafety();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bootSafety,{once:true});
else bootSafety();

// Load the persistent AR placement admin only after the safety layer is present.
const arAdminUrl = window.__snazzleFresh ? window.__snazzleFresh('./snazzle-ar-admin-v83.js') : `./snazzle-ar-admin-v83.js?v=${Date.now()}`;
const arAdminDisplayUrl = window.__snazzleFresh ? window.__snazzleFresh('./snazzle-ar-admin-display-v84.js') : `./snazzle-ar-admin-display-v84.js?v=${Date.now()}`;
Promise.all([
  import(arAdminUrl),
  import(arAdminDisplayUrl)
]).catch(err=>console.warn('AR admin kon niet laden',err));
