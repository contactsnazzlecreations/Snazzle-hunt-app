// Snazzle Hunt v264 — stabiele opstart + compleet vervangbare app-afbeeldingen.
// Eerst een vaste laadlaag; daaronder bouwt de app rustig op en verschijnt pas wanneer de home klaar is.

window.__snazzleBootStartedAt=window.__snazzleBootStartedAt||performance.now();
const quiet=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
const idle=()=>new Promise(resolve=>{'requestIdleCallback'in window?requestIdleCallback(()=>resolve(),{timeout:500}):setTimeout(resolve,60);});

const BOOT_ID='snazzleStableBootV256';
const BOOT_STYLE_ID='snazzleStableBootStyleV256';
let bootReleased=false;
function installStableBoot(){
  if(!document.getElementById(BOOT_STYLE_ID)){
    const style=document.createElement('style');
    style.id=BOOT_STYLE_ID;
    style.textContent=`#${BOOT_ID}{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:radial-gradient(circle at 50% 32%,rgba(172,237,80,.22),transparent 26%),linear-gradient(180deg,#176c3b 0%,#0c4f2e 58%,#073820 100%);color:#fff;text-align:center;padding:24px;opacity:1;transition:opacity .24s ease}#${BOOT_ID}.sn-boot-away{opacity:0;pointer-events:none}.sn-boot-card{width:min(360px,88vw);padding:32px 24px 26px;border-radius:28px;background:rgba(8,54,32,.68);border:2px solid rgba(255,223,111,.5);box-shadow:0 18px 48px rgba(0,0,0,.28)}.sn-boot-title{margin:0 0 9px;font-family:"Comic Sans MS","Trebuchet MS",cursive,sans-serif;font-size:clamp(30px,9vw,42px);line-height:1.03;font-weight:1000;letter-spacing:.3px;color:#ffd65a;text-shadow:0 3px 0 #7b4a13,0 7px 18px rgba(0,0,0,.3);transform:rotate(-2deg);animation:snBootWiggle 1.8s ease-in-out infinite alternate}.sn-boot-copy{font-size:15px;font-weight:800;color:#fff7df}.sn-boot-track{height:8px;margin-top:20px;border-radius:99px;overflow:hidden;background:rgba(255,255,255,.14)}.sn-boot-bar{height:100%;width:44%;border-radius:99px;background:linear-gradient(90deg,#ffe36a,#a9ed50);animation:snBootSlide 1s ease-in-out infinite}@keyframes snBootWiggle{from{transform:rotate(-2deg) translateY(0)}to{transform:rotate(1deg) translateY(-2px)}}@keyframes snBootSlide{0%{transform:translateX(-115%)}100%{transform:translateX(265%)}}@media(prefers-reduced-motion:reduce){.sn-boot-title,.sn-boot-bar{animation:none}.sn-boot-title{transform:none}.sn-boot-bar{width:68%}}`;
    document.head.appendChild(style);
  }
  if(document.getElementById(BOOT_ID))return;
  const boot=document.createElement('div');
  boot.id=BOOT_ID;
  boot.setAttribute('role','status');
  boot.setAttribute('aria-live','polite');
  boot.innerHTML='<div class="sn-boot-card"><div class="sn-boot-title">Snazzle komt eraan</div><div class="sn-boot-copy">Even geduld…</div><div class="sn-boot-track" aria-hidden="true"><div class="sn-boot-bar"></div></div></div>';
  document.body.appendChild(boot);
}
function releaseStableBoot(){
  if(bootReleased)return;
  bootReleased=true;
  const boot=document.getElementById(BOOT_ID);
  if(!boot)return;
  boot.classList.add('sn-boot-away');
  setTimeout(()=>boot.remove(),280);
}
function preloadCriticalAssets(){
  const moduleHrefs=[
    './app-runtime-v245.js?v=264',
    './snazzle-runtime-stability-v71.js?fresh=20260917-v264-home-visuals',
    './snazzle-image-stability-v72.js?fresh=20260917-v264-home-visuals',
    './snazzle-leaflet-isolation-v190.js?fresh=20260917-v264-home-visuals',
    './app-core.js?fresh=20260917-v264-home-visuals',
    './snazzle-core-performance-v248.js?fresh=20260917-v264-home-visuals',
    './snazzle-adventure-ui-v28.js?fresh=20260917-v264-home-visuals',
    './snazzle-clean-home-v31.js?v=264',
    './snazzle-home-card-backgrounds-v75.js?v=264'
    ,'./snazzle-central-visuals-v54.js?fresh=20260917-v264-home-visuals'
    ,'./snazzle-bieb-v73.js?fresh=20260917-v264-home-visuals'
    ,'./snazzle-news-card-bg-v49.js?fresh=20260917-v264-home-visuals'
  ];
  moduleHrefs.forEach(href=>{
    if(document.head.querySelector(`link[rel="modulepreload"][href="${href}"]`))return;
    const link=document.createElement('link');link.rel='modulepreload';link.href=href;document.head.appendChild(link);
  });
  ['./snazzle-reference-layout.css?v=264','./snazzle-clean-home-v31.css?v=264'].forEach(href=>{
    if(document.head.querySelector(`link[rel="preload"][href="${href}"]`))return;
    const link=document.createElement('link');link.rel='preload';link.as='style';link.href=href;document.head.appendChild(link);
  });
}

installStableBoot();
preloadCriticalAssets();
document.addEventListener('snazzle:home-ui-ready',releaseStableBoot,{once:true});
document.addEventListener('snazzle:interactive',releaseStableBoot,{once:true});
// Veiligheidsnet: bij een onverwachte netwerkfout blijft niemand op een laadscherm vastzitten.
setTimeout(releaseStableBoot,9000);

async function optionalImport(path,label){
  try{
    // Gebruik exact dezelfde runtime-URL als de centrale loader. Zo wordt een module
    // niet opnieuw uitgevoerd alleen omdat er een andere querystring aan hing.
    if(typeof window.__snazzleImport==='function')return await window.__snazzleImport(path);
    return await import(`${path}${path.includes('?')?'&':'?'}v=263`);
  }catch(err){console.error(`${label||path} kon niet laden`,err);return null;}
}
async function pacedImports(entries){
  for(const [path,label] of entries){
    await idle();
    await optionalImport(path,label);
    await nextPaint();
  }
}

// Kritieke route: de echte app eerst. Het laadscherm verdwijnt al zodra de home klaar is;
// kaart-, AR- en beheermodules mogen daarna op de achtergrond verder laden.
await import('./app-runtime-v245.js?v=264');
window.__snazzleAppInteractive=true;
document.dispatchEvent(new CustomEvent('snazzle:interactive'));

// De Hunt-app heeft geen eigen winkelpagina meer. De vaste Shop-knop blijft staan
// en brengt bezoekers rechtstreeks naar de webshop op snazzle.nl.
const EXTERNAL_SHOP_URL='https://snazzle.nl/#shop';
function installExternalShopLink(){
  const shopButton=document.getElementById('navShop');
  if(shopButton){
    shopButton.onclick=()=>window.location.assign(EXTERNAL_SHOP_URL);
    shopButton.setAttribute('aria-label','Open de Snazzle Shop op snazzle.nl');
  }
  document.getElementById('shopSheet')?.remove();
}
installExternalShopLink();
document.addEventListener('click',event=>{
  const quickShop=event.target?.closest?.('[data-quick-action="shop"]');
  if(!quickShop)return;
  event.preventDefault();
  event.stopPropagation();
  window.location.assign(EXTERNAL_SHOP_URL);
},{capture:true});

function repairSupplementalUi(){
  window.SnazzleMysticV221?.repair?.();
  window.SnazzleBlazeV229?.repair?.();
  window.SnazzleCardFixedV205?.repair?.();
  window.SnazzleMysticUiV227?.repair?.();
  window.SnazzleBlazeUiV232?.repair?.();
  window.SnazzleCardProgressV234?.render?.();
  window.SnazzleCardRewardsV235?.render?.();
  window.SnazzleCardCounterGuardV236?.render?.();
  window.SnazzleSpotbookV237?.render?.();
  window.SnazzleArEngineV245?.repair?.();
  window.SnazzleArEngineV245?.refresh?.();
  window.SnazzleArPlacementV245?.refresh?.();
  window.SnazzleArAdminV245?.populateVillages?.();
  window.SnazzleArAdminStatsV251?.refresh?.();
}

let progressLoadPromise=null;
function ensureCardProgressLoaded(){
  if(progressLoadPromise)return progressLoadPromise;
  progressLoadPromise=pacedImports([
    ['./snazzle-card-progress-v234.js','Snazzle Cards voortgang'],
    ['./snazzle-card-rewards-ui-v235.js','Snazzle Cards beloningen'],
    ['./snazzle-card-counter-guard-v236.js','Snazzle Cards tellerbewaking'],
    ['./snazzle-spotbook-v237.js','Snazzle Spotboek']
  ]).then(()=>{repairSupplementalUi();return true;}).catch(err=>{progressLoadPromise=null;console.error('Snazzle kaartvoortgang',err);return false;});
  return progressLoadPromise;
}
window.SnazzleEnsureCardProgress=ensureCardProgressLoaded;
document.addEventListener('click',event=>{
  if(event.target?.closest?.('#collectionSheet,[data-collection-tab],[data-seriespick],[data-sc2f],#snArCatchDuck,#snArCatchHint'))ensureCardProgressLoaded();
},{capture:true,passive:true});

(async()=>{
  // Geef tikken/navigatie en de belangrijkste runtime eerst ruimte.
  await Promise.race([
    window.__snazzleFastFeaturesReady||Promise.resolve(),
    quiet(1400)
  ]);
  await idle();

  await optionalImport('./snazzle-card-structure-v233.js','Snazzle Cards structuur');
  await pacedImports([
    ['./snazzle-mystic-v221.js','Snazzle MYSTIC seed'],
    ['./snazzle-blaze-v229.js','Snazzle BLAZE seed'],
    ['./snazzle-admin-analytics-v218.js','Snazzle bezoekersstatistieken'],
    ['./snazzle-ar-admin-stats-v251.js','Snazzle AR vondstenteller'],
    ['./snazzle-ar-menu-fix-v215.js','Snazzle AR menu fix'],
    ['./snazzle-onboarding-stability-v208.js','Snazzle onboarding stability'],
    ['./snazzle-card-catalog-repair-v217.js','Snazzle Cards catalogus-herstel'],
    ['./snazzle-card-fixed-v205.js','Snazzle Cards renderer'],
    ['./snazzle-mystic-series-v219.js','Snazzle MYSTIC Series 01'],
    ['./snazzle-mystic-verify-v220.js','Snazzle MYSTIC controle'],
    ['./snazzle-mystic-ui-v227.js','Snazzle MYSTIC UI'],
    ['./snazzle-blaze-ui-v231.js','Snazzle BLAZE UI'],
    ['./snazzle-blaze-sync-v228.js','Snazzle BLAZE sync']
  ]);

  repairSupplementalUi();
  setTimeout(repairSupplementalUi,650);

  // Pas na een ruime rustige periode voorbereiden; een tik op Kaarten laadt dit direct.
  setTimeout(()=>{if(document.visibilityState==='visible')idle().then(ensureCardProgressLoaded);},12000);
})().catch(err=>console.error('Snazzle achtergrondmodules',err));
