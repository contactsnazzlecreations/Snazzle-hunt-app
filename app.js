// Snazzle Hunt v96.2 — complete menu/home, lightweight startup.
// Alle onderdelen zijn direct zichtbaar; zware functies laden alleen wanneer de gebruiker ze opent.

const runtimeVersion='20260826-v96-2';
const fresh=(path)=>`${path}${path.includes('?')?'&':'?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion=runtimeVersion;
window.__snazzleFresh=fresh;
window.__snazzleSafeMode='v96';

// Stabiliteitslaag voor Android/in-app browsers: geen oneindige animaties tijdens normaal scrollen.
const perf=document.createElement('style');
perf.id='snazzleV96PerfGuard';
perf.textContent=`
  *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  html,body{touch-action:pan-y pinch-zoom!important;overscroll-behavior:auto!important}
  body{overflow-x:hidden!important}
  [style*="backdrop-filter"],.sheet,.quick-menu-overlay,.sn96-busy{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
`;
document.head.appendChild(perf);

let release=()=>{};
(function boot(){
  const build=()=>{
    if(!document.body||document.getElementById('snV96Boot'))return;
    const d=document.createElement('div');d.id='snV96Boot';d.style.cssText='position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:linear-gradient(180deg,#0d6944,#043b2c);color:#fff7df;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif';d.innerHTML='<div style="padding:24px"><div style="width:104px;height:104px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;background:#ffd15c;border:5px solid #775026;font-size:50px">🦆</div><div style="font-size:42px;font-weight:1000;color:#ffd35e">Snazzle</div><div style="margin-top:10px;font-size:19px;font-weight:900">Samen naar buiten</div><div style="margin-top:8px;font-size:13px;font-weight:750">Menu en avontuur worden klaargezet…</div></div>';document.body.appendChild(d);let done=false;release=()=>{if(done)return;done=true;d.remove();document.body.classList.add('sn-v96-ready');};setTimeout(release,2600);
  };
  if(document.body)build();else document.addEventListener('DOMContentLoaded',build,{once:true});
})();

try{
  const shell=await import(fresh('./snazzle-shell-v96.js'));
  shell?.init?.();

  // Hunt en Vondsten openen na core direct hun bestaande scherm.
  // Geen klik-op-eigen-lazy-loader lus meer.
  if(shell?.actions&&shell?.ensureCore){
    shell.actions.hunt=async()=>{
      try{await shell.ensureCore();}catch{}
      document.getElementById('villageSheet')?.classList.add('show');
    };
    shell.actions.findings=async()=>{
      try{await shell.ensureCore();}catch{}
      document.getElementById('findsSheet')?.classList.add('show');
    };
    const navHunt=document.getElementById('navHunt');
    const bigStart=document.getElementById('bigStart');
    const findsBtn=document.getElementById('findsBtn');
    if(navHunt)navHunt.onclick=shell.actions.hunt;
    if(bigStart)bigStart.onclick=shell.actions.hunt;
    if(findsBtn)findsBtn.onclick=shell.actions.findings;
  }
}catch(err){
  console.error('Snazzle v96 shell kon niet laden',err);
}
release();

// Geen zware achtergrondimports bij het openen van de app.
// De complete zichtbare set is aanwezig: Hunt, dorp, Snazzle Spel, Luisterverhalen, De Bieb,
// Collectie/kaarten/Nest, AR, Nieuws, Vrienden, Vondsten, Shop, Profiel, Voor ouders en Beheer.
// Elk zwaar onderdeel wordt pas geïmporteerd wanneer de gebruiker erop tikt.
