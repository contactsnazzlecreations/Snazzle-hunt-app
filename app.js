// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.

const runtimeVersion = '20260827-v1281-listen-under-play';
const fresh = (path) => `${path}${path.includes('?') ? '&' : '?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion = runtimeVersion;
window.__snazzleFresh = fresh;

function refreshLocalStyles(){
  document.querySelectorAll('link[rel="stylesheet"][href]').forEach(link=>{
    try{
      const url=new URL(link.getAttribute('href'),location.href);
      if(url.origin!==location.origin) return;
      if(!url.pathname.includes('/Snazzle-hunt-app/')) return;
      if(url.searchParams.get('fresh')===runtimeVersion) return;
      url.searchParams.set('fresh',runtimeVersion);
      link.href=url.href;
    }catch{}
  });
}
const headObserver=new MutationObserver(refreshLocalStyles);
headObserver.observe(document.head,{childList:true,subtree:true});

async function safeImport(path){
  try{return await import(fresh(path));}
  catch(err){console.error(`Snazzle module kon niet laden: ${path}`,err);return null;}
}

await safeImport('./snazzle-runtime-stability-v71.js');
await safeImport('./snazzle-image-stability-v72.js');

for(const href of ['./snazzle-magic-theme.css','./snazzle-enchanted-layer.css','./snazzle-professional-v53.css','./snazzle-final-polish-v59.css']){
  const l=document.createElement('link');l.rel='stylesheet';l.href=fresh(href);document.head.appendChild(l);
}
refreshLocalStyles();

function suppressLateStartupOverlays(){
  try{sessionStorage.setItem('snazzleProSplashSeen','1');}catch{}
  document.body?.classList.remove('sn-v59-booting');
  document.body?.classList.add('sn-v59-ready');
  document.querySelectorAll('#snV59Boot,.sn-pro-splash').forEach(el=>el.remove());
}
suppressLateStartupOverlays();
window.__snazzleReleaseBoot=()=>{};

await import(fresh('./app-core.js'));

// Kritiek: dorpzichtbaarheid moet direct na de core actief zijn, vóór alle optionele modules.
await safeImport('./snazzle-village-visibility-v120.js');

(function installHeroQuack(){
  const hero=document.getElementById('hero');
  if(!hero)return;
  let audioContext=null;
  const hasSnazzleHero=()=>getComputedStyle(hero).backgroundImage.includes('url(');
  const playQuack=()=>{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
    audioContext||=new AudioCtx();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
    const now=audioContext.currentTime,master=audioContext.createGain(),filter=audioContext.createBiquadFilter(),osc1=audioContext.createOscillator(),osc2=audioContext.createOscillator();
    filter.type='bandpass';filter.frequency.setValueAtTime(720,now);filter.Q.setValueAtTime(.75,now);
    osc1.type='sawtooth';osc2.type='square';osc1.frequency.setValueAtTime(500,now);osc1.frequency.exponentialRampToValueAtTime(255,now+.16);osc1.frequency.setValueAtTime(360,now+.17);osc1.frequency.exponentialRampToValueAtTime(215,now+.31);osc2.frequency.setValueAtTime(250,now);osc2.frequency.exponentialRampToValueAtTime(135,now+.30);
    master.gain.setValueAtTime(.0001,now);master.gain.exponentialRampToValueAtTime(.085,now+.018);master.gain.exponentialRampToValueAtTime(.045,now+.13);master.gain.setValueAtTime(.075,now+.17);master.gain.exponentialRampToValueAtTime(.0001,now+.34);
    osc1.connect(filter);osc2.connect(filter);filter.connect(master);master.connect(audioContext.destination);osc1.start(now);osc2.start(now);osc1.stop(now+.35);osc2.stop(now+.35);
  };
  hero.addEventListener('click',()=>{if(hasSnazzleHero())playQuack();});
})();

const optionalModules=[
  './snazzle-auto-update-v51.js','./snazzle-privacy-v52.js','./snazzle-parent-hub-v65.js','./snazzle-parent-close-fix-v76.js','./snazzle-central-assets-v48.js','./snazzle-admin-reset-v49.js','./snazzle-admin-backup-v50.js','./shop-compat.js','./kids-fun.js','./snazzle-route.js','./snazzle-collection.js','./snazzle-ar-v80.js','./snazzle-ar-safety-pass-v124.js','./snazzle-card-system-v2.js','./snazzle-card-worlds-v78.js','./snazzle-card-world-prompt-v79.js','./snazzle-hunt-code-v2.js','./snazzle-unlock.js','./image-fit.js','./snazzle-world.js','./snazzle-home-magic.js','./snazzle-home-magic-fix.js','./village-access.js','./snazzle-characters.js','./snazzle-adventure-ui-v28.js','./snazzle-clean-home-v31.js','./snazzle-v32-guard.js','./snazzle-image-control-v32.js','./snazzle-village-admin-v33.js','./snazzle-secret-characters-v34.js','./snazzle-idle-hunt-duck-v35.js','./snazzle-home-hunt-image-v36.js','./snazzle-click-secrets-v37.js','./snazzle-world-adventure-v38.js','./snazzle-season-theme-v38.js','./snazzle-world-theme-v39.js','./snazzle-news-v46.js','./snazzle-world-hub-v47.js','./snazzle-game-menu-v62.js','./snazzle-listen-stories-v63.js','./snazzle-central-visuals-v54.js','./snazzle-public-visual-publish-v64.js','./snazzle-image-recovery-v60.js','./snazzle-admin-close-v61.js','./snazzle-admin-access-v55.js','./snazzle-professional-v53.js','./snazzle-admin-access-v56.js','./snazzle-safe-admin-v58.js','./snazzle-final-polish-v59.js','./snazzle-star-rewards-v67.js','./snazzle-quiet-psst-v68.js','./snazzle-input-visibility-v69.js','./snazzle-top-stability-v70.js','./snazzle-bieb-v73.js','./snazzle-bieb-cloud-v74.js','./snazzle-bieb-locations-v77.js'
];
for(const modulePath of optionalModules){await safeImport(modulePath);refreshLocalStyles();}

// AR-vondsten worden direct in de persoonlijke digitale collectie zichtbaar en centraal bewaard.
await safeImport('./snazzle-ar-collection-bridge-v125.js');
// Het bestaande venster 'Mijn vondsten' toont dezelfde AR-vangsten direct mee.
await safeImport('./snazzle-ar-findings-bridge-v126.js');
// Transparante AR-Snazzle gevonden => bijbehorende aparte Wild Card / Snazzle Card wordt ontgrendeld.
await safeImport('./snazzle-ar-card-unlock-v127.js');
// Alleen de navigatie wordt gegroepeerd: zes hoofdknoppen, bestaande functies blijven intact.
await safeImport('./snazzle-main-menu-v128.js');

try{await window.__snazzleRuntimeSettle71?.();}catch(err){console.warn('Snazzle settle v71',err);}
window.__snazzleReleaseBoot?.();suppressLateStartupOverlays();

setTimeout(()=>{
  safeImport('./snazzle-ar-admin-v83.js');
  safeImport('./snazzle-ar-admin-display-v84.js');
  safeImport('./snazzle-ar-save-inline-v122.js?patch=20260827-1803');
},900);

import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
const auth=getAuth();let shopLoaded=false;
onAuthStateChanged(auth,async user=>{
  if(!user||shopLoaded)return;
  shopLoaded=true;
  await safeImport('./shop.js');
  await safeImport('./shop-email-settings.js');
  refreshLocalStyles();
});

setTimeout(()=>{refreshLocalStyles();headObserver.disconnect();},12000);
