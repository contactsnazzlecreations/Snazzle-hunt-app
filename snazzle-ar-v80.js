// Snazzle AR v80 — first safe location + camera catch prototype.
// Uses GPS only in memory; exact coordinates are never persisted.

const AR_COLLECTION_KEY = 'snazzleARCollection';
const TEST_SNAZZLE = {
  id: 'AR-001', number: '001', name: 'Scout Snazzle', rarity: 'RARE', stars: 3,
  edition: 'First AR Test Edition'
};

const $ar = (sel) => document.querySelector(sel);

function arCollection(){
  try { return JSON.parse(localStorage.getItem(AR_COLLECTION_KEY) || '[]'); }
  catch { return []; }
}

function saveArCatch(){
  const list = arCollection();
  if(!list.some(x => x.id === TEST_SNAZZLE.id)){
    list.push({
      ...TEST_SNAZZLE,
      caughtAt: new Date().toISOString(),
      village: localStorage.getItem('snazzleVillage') || 'Montfort'
    });
    localStorage.setItem(AR_COLLECTION_KEY, JSON.stringify(list));
  }
  updateArCounter();
}

function updateArCounter(){
  const n = arCollection().length;
  const badge = $ar('#snArCount');
  if(badge) badge.textContent = String(n);
}

function brandImage(){
  try {
    const settings = JSON.parse(localStorage.getItem('snazzleSettings') || '{}');
    return settings.profileImage || '';
  } catch { return ''; }
}

function duckMarkup(cls=''){
  const img = brandImage();
  if(img) return `<img class="${cls}" src="${img}" alt="Snazzle">`;
  return `<svg class="${cls}" viewBox="0 0 220 220" aria-hidden="true">
    <ellipse cx="93" cy="137" rx="70" ry="49" fill="#31aee7" stroke="#fff0a8" stroke-width="7"/>
    <circle cx="145" cy="86" r="43" fill="#31aee7" stroke="#fff0a8" stroke-width="7"/>
    <path d="M178 79 L217 94 L178 108 Z" fill="#f6a323" stroke="#7b451c" stroke-width="5"/>
    <circle cx="157" cy="76" r="7" fill="#17231b"/><circle cx="159" cy="73" r="2.5" fill="white"/>
    <path d="M45 131 9 108 20 157Z" fill="#31aee7" stroke="#fff0a8" stroke-width="6"/>
    <path d="M90 101c16 20 18 43 5 62" fill="none" stroke="#1789bd" stroke-width="6" stroke-linecap="round"/>
    <circle cx="79" cy="124" r="8" fill="#ffd748" opacity=".9"/><circle cx="63" cy="144" r="5" fill="#ffd748" opacity=".75"/>
  </svg>`;
}

function installStyles(){
  if(document.getElementById('snArV80Styles')) return;
  const style = document.createElement('style');
  style.id = 'snArV80Styles';
  style.textContent = `
    .sn-ar-launch{width:100%;margin:17px 0 2px;border:4px solid #70431f;border-radius:23px;padding:15px 16px;background:linear-gradient(135deg,#32205f,#7246b5 55%,#a168dc);color:#fff;display:flex;align-items:center;gap:13px;text-align:left;box-shadow:0 6px 0 #442719,0 12px 24px rgba(0,0,0,.22);position:relative;overflow:hidden}
    .sn-ar-launch:after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 33%,rgba(255,255,255,.24) 48%,transparent 63%);transform:translateX(-120%);animation:snArShine 4.5s ease-in-out infinite;pointer-events:none}
    .sn-ar-icon{width:58px;height:58px;flex:0 0 58px;border-radius:18px;display:grid;place-items:center;font-size:31px;background:rgba(14,8,31,.36);border:2px solid rgba(255,255,255,.28)}
    .sn-ar-copy{min-width:0;flex:1}.sn-ar-copy strong{display:block;font-size:20px;line-height:1.05}.sn-ar-copy small{display:block;margin-top:4px;font-weight:800;color:#f0e6ff;line-height:1.3}.sn-ar-tag{background:#ffd64a;color:#37220f;border-radius:99px;padding:6px 8px;font-size:9px;font-weight:1000;white-space:nowrap}
    .sn-ar-count{position:absolute;right:10px;bottom:7px;background:#18260f;color:#d8ff72;border:2px solid #b6e958;border-radius:99px;min-width:25px;height:25px;padding:0 7px;display:grid;place-items:center;font-size:11px;font-weight:1000}
    .sn-ar-overlay{position:fixed;inset:0;z-index:250;background:#020705;display:none}.sn-ar-overlay.show{display:block}.sn-ar-camera{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#102018}
    .sn-ar-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.48),transparent 23%,transparent 70%,rgba(0,0,0,.65));pointer-events:none}.sn-ar-hud{position:absolute;left:0;right:0;top:0;padding:calc(14px + env(safe-area-inset-top)) 14px 0;display:flex;align-items:flex-start;justify-content:space-between;z-index:5}.sn-ar-hudbox{max-width:76%;background:rgba(5,38,23,.86);border:2px solid rgba(203,247,93,.72);border-radius:16px;padding:10px 12px;backdrop-filter:blur(5px);box-shadow:0 6px 18px rgba(0,0,0,.25)}.sn-ar-hudbox b{display:block;color:#d8ff6c;font-size:13px}.sn-ar-hudbox small{display:block;color:#fff;font-weight:800;margin-top:2px}.sn-ar-close{width:47px;height:47px;border-radius:15px;border:2px solid rgba(255,255,255,.35);background:rgba(0,0,0,.58);color:#fff;font-size:24px;font-weight:1000}
    .sn-ar-reticle{position:absolute;left:50%;top:49%;width:min(78vw,360px);height:min(78vw,360px);transform:translate(-50%,-50%);border:2px dashed rgba(220,255,126,.38);border-radius:50%;z-index:2;pointer-events:none;animation:snArPulse 2.4s ease-in-out infinite}.sn-ar-duck{position:absolute;left:50%;top:48%;width:min(50vw,205px);height:min(50vw,205px);transform:translate(-50%,-50%);z-index:4;filter:drop-shadow(0 16px 9px rgba(0,0,0,.38));animation:snArBob 2.2s ease-in-out infinite;touch-action:manipulation}.sn-ar-duck button{width:100%;height:100%;padding:0;border:0;background:transparent}.sn-ar-duck img,.sn-ar-duck svg{width:100%;height:100%;object-fit:contain}.sn-ar-glow{position:absolute;inset:-18%;border-radius:50%;background:radial-gradient(circle,rgba(255,221,77,.28),transparent 63%);animation:snArGlow 1.8s ease-in-out infinite;pointer-events:none}
    .sn-ar-bottom{position:absolute;left:14px;right:14px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:5}.sn-ar-distance{padding:11px 14px;border-radius:16px;background:rgba(5,34,20,.88);border:2px solid rgba(255,255,255,.25);text-align:center;color:#fff;font-weight:950;margin-bottom:10px}.sn-ar-catch{width:100%;border:0;border-radius:17px;padding:15px;background:linear-gradient(#ffd953,#f2a728);color:#34220e;font-weight:1000;font-size:17px;box-shadow:0 5px 0 #935915}
    .sn-ar-intro,.sn-ar-result{position:fixed;inset:0;z-index:270;background:rgba(1,12,7,.88);display:none;align-items:flex-end;padding:16px}.sn-ar-intro.show,.sn-ar-result.show{display:flex}.sn-ar-panel{width:min(520px,100%);margin:auto;background:linear-gradient(#fff1b5,#edcf8c);color:#2f2217;border:4px solid #744821;border-radius:27px;padding:19px;box-shadow:0 10px 0 #422719,0 24px 55px rgba(0,0,0,.45)}.sn-ar-panel h2{margin:5px 0 8px;font-size:27px;line-height:1.04}.sn-ar-panel p{font-weight:720;line-height:1.43}.sn-ar-status{padding:11px 12px;background:#fff9e8;border:2px solid #b9965b;border-radius:14px;font-weight:900;margin:12px 0}.sn-ar-primary{width:100%;border:0;border-radius:16px;padding:15px;background:linear-gradient(#76c844,#438f2b);color:#fff;font-weight:1000;font-size:16px;box-shadow:0 5px 0 #2d6b20}.sn-ar-primary:disabled{filter:grayscale(.7);opacity:.62;box-shadow:none}.sn-ar-secondary{width:100%;border:0;border-radius:15px;padding:13px;margin-top:9px;background:#d4ad66;color:#302216;font-weight:1000}.sn-ar-privacy{font-size:11px!important;color:#6b5437}.sn-ar-result .sn-ar-panel{text-align:center}.sn-ar-result-duck{width:175px;height:175px;margin:4px auto}.sn-ar-result-duck img,.sn-ar-result-duck svg{width:100%;height:100%;object-fit:contain}.sn-ar-badge{display:inline-block;border-radius:99px;background:#241b16;color:#ffe16b;padding:7px 11px;font-size:10px;font-weight:1000;letter-spacing:.8px}.sn-ar-success{color:#34751e;font-weight:1000}.sn-ar-result h2{font-size:31px}
    @keyframes snArBob{0%,100%{transform:translate(-50%,-50%) translateY(3px) rotate(-2deg) scale(.97)}50%{transform:translate(-50%,-50%) translateY(-13px) rotate(2deg) scale(1.04)}}@keyframes snArPulse{0%,100%{transform:translate(-50%,-50%) scale(.94);opacity:.45}50%{transform:translate(-50%,-50%) scale(1.04);opacity:.88}}@keyframes snArGlow{0%,100%{transform:scale(.9);opacity:.35}50%{transform:scale(1.08);opacity:.88}}@keyframes snArShine{0%,65%{transform:translateX(-120%)}82%,100%{transform:translateX(120%)}}
    @media(prefers-reduced-motion:reduce){.sn-ar-launch:after,.sn-ar-reticle,.sn-ar-duck,.sn-ar-glow{animation:none!important}}
  `;
  document.head.appendChild(style);
}

function installUi(){
  if(document.getElementById('snArLaunch')) return;
  const quick = document.querySelector('.quick');
  if(!quick) return;

  const launch = document.createElement('button');
  launch.id = 'snArLaunch';
  launch.className = 'sn-ar-launch';
  launch.innerHTML = `<span class="sn-ar-icon">📷</span><span class="sn-ar-copy"><strong>Snazzle AR</strong><small>Vind en vang een Snazzle met je camera</small></span><span class="sn-ar-tag">TEST</span><span class="sn-ar-count" id="snArCount">0</span>`;
  quick.parentNode.insertBefore(launch, quick);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="sn-ar-intro" id="snArIntro" role="dialog" aria-modal="true">
      <div class="sn-ar-panel">
        <div class="sn-ar-badge">FASE 1 · GPS + CAMERA</div>
        <h2>Vind een Snazzle in de echte wereld ✨</h2>
        <p>Voor deze eerste test zetten we tijdelijk een Snazzle op jouw huidige plek. Zo testen we eerst of GPS, camera en digitaal vangen goed werken op jouw telefoon.</p>
        <div class="sn-ar-status" id="snArStatus">Klaar om te testen.</div>
        <button class="sn-ar-primary" id="snArStart">Start AR-test op mijn locatie</button>
        <button class="sn-ar-secondary" id="snArCancel">Nog niet</button>
        <p class="sn-ar-privacy">🔒 Je exacte GPS-positie wordt niet opgeslagen. Alleen de digitale vangst komt in je collectie.</p>
      </div>
    </div>
    <div class="sn-ar-overlay" id="snArOverlay">
      <video class="sn-ar-camera" id="snArCamera" autoplay muted playsinline></video><div class="sn-ar-shade"></div><div class="sn-ar-reticle"></div>
      <div class="sn-ar-hud"><div class="sn-ar-hudbox"><b>✨ SNAZZLE-SIGNAAL</b><small id="snArHudText">Locatie controleren…</small></div><button class="sn-ar-close" id="snArClose">×</button></div>
      <div class="sn-ar-duck" id="snArDuck"><div class="sn-ar-glow"></div><button id="snArCatchDuck" aria-label="Vang de Snazzle">${duckMarkup()}</button></div>
      <div class="sn-ar-bottom"><div class="sn-ar-distance" id="snArDistance">Je bent op de juiste plek ✅</div><button class="sn-ar-catch" id="snArCatchHint">Tik op de Snazzle om hem te vangen!</button></div>
    </div>
    <div class="sn-ar-result" id="snArResult" role="dialog" aria-modal="true"><div class="sn-ar-panel"><div class="sn-ar-badge">FIRST AR CATCH · TEST EDITION</div><div class="sn-ar-result-duck">${duckMarkup()}</div><div class="sn-ar-success">🎉 GEVANGEN!</div><h2>Scout Snazzle</h2><p>#001 · RARE ⭐⭐⭐</p><p>Toegevoegd aan je digitale Snazzle-collectie.</p><button class="sn-ar-primary" id="snArDone">Ga verder</button></div></div>
  `);

  wireUi();
  updateArCounter();
}

let arStream = null;
let arArmed = false;

function stopArCamera(){
  if(arStream){ arStream.getTracks().forEach(track => track.stop()); arStream = null; }
  $ar('#snArOverlay')?.classList.remove('show');
  arArmed = false;
}

function getArLocation(){
  return new Promise((resolve,reject) => {
    if(!navigator.geolocation) return reject(new Error('GPS wordt niet ondersteund op dit toestel.'));
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => reject(new Error(err.code === 1 ? 'Locatietoestemming is geweigerd.' : 'Je locatie kon niet worden bepaald.')),
      {enableHighAccuracy:true, timeout:12000, maximumAge:0}
    );
  });
}

async function getArCamera(){
  if(!navigator.mediaDevices?.getUserMedia) throw new Error('Camera wordt niet ondersteund in deze browser.');
  return navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
}

async function startArTest(){
  const button = $ar('#snArStart');
  const status = $ar('#snArStatus');
  if(button) button.disabled = true;
  if(status) status.textContent = '📍 GPS controleren…';
  try{
    const pos = await getArLocation();
    const accuracy = Math.round(pos.coords.accuracy || 0);
    if(status) status.textContent = `✅ Locatie gevonden (nauwkeurigheid ±${accuracy} m). Camera openen…`;
    arStream = await getArCamera();
    const video = $ar('#snArCamera');
    video.srcObject = arStream;
    await video.play().catch(()=>{});
    $ar('#snArIntro')?.classList.remove('show');
    $ar('#snArOverlay')?.classList.add('show');
    const village = localStorage.getItem('snazzleVillage') || 'jouw dorp';
    $ar('#snArHudText').textContent = `Snazzle gevonden in ${village} · GPS ±${accuracy} m`;
    $ar('#snArDistance').textContent = 'Je bent op de juiste plek ✅';
    arArmed = true;
  } catch(err){
    stopArCamera();
    if(status) status.textContent = `⚠️ ${err.message}`;
  } finally {
    if(button) button.disabled = false;
  }
}

function catchArSnazzle(){
  if(!arArmed) return;
  arArmed = false;
  if(navigator.vibrate) navigator.vibrate([80,50,120]);
  saveArCatch();
  stopArCamera();
  $ar('#snArResult')?.classList.add('show');
}

function wireUi(){
  $ar('#snArLaunch')?.addEventListener('click',()=>{
    const status = $ar('#snArStatus');
    if(status) status.textContent = 'Klaar om te testen.';
    $ar('#snArIntro')?.classList.add('show');
  });
  $ar('#snArCancel')?.addEventListener('click',()=> $ar('#snArIntro')?.classList.remove('show'));
  $ar('#snArStart')?.addEventListener('click',startArTest);
  $ar('#snArClose')?.addEventListener('click',stopArCamera);
  $ar('#snArCatchDuck')?.addEventListener('click',catchArSnazzle);
  $ar('#snArCatchHint')?.addEventListener('click',catchArSnazzle);
  $ar('#snArDone')?.addEventListener('click',()=> $ar('#snArResult')?.classList.remove('show'));
  window.addEventListener('pagehide',stopArCamera);
}

function bootAr(){ installStyles(); installUi(); }
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',bootAr,{once:true});
else bootAr();
