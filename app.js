// Snazzle Hunt v248 — vloeiende single-start bootstrap.
// Eerst de bruikbare app; zware kaart- en beheeruitbreidingen daarna gedoseerd.

window.__snazzleBootStartedAt=window.__snazzleBootStartedAt||performance.now();
const quiet=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
const idle=()=>new Promise(resolve=>{'requestIdleCallback'in window?requestIdleCallback(()=>resolve(),{timeout:500}):setTimeout(resolve,60);});

async function optionalImport(path,label){
  try{
    // Gebruik exact dezelfde runtime-URL als de centrale loader. Zo wordt een module
    // niet opnieuw uitgevoerd alleen omdat er een andere querystring aan hing.
    if(typeof window.__snazzleImport==='function')return await window.__snazzleImport(path);
    return await import(`${path}${path.includes('?')?'&':'?'}v=248`);
  }catch(err){console.error(`${label||path} kon niet laden`,err);return null;}
}
async function pacedImports(entries){
  for(const [path,label] of entries){
    await idle();
    await optionalImport(path,label);
    await nextPaint();
  }
}

// Kritieke route: de echte app eerst. Geen kaart-seeds vóór het beginscherm.
await import('./app-runtime-v245.js?v=248');
window.__snazzleAppInteractive=true;
document.dispatchEvent(new CustomEvent('snazzle:interactive'));

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
}

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
    ['./snazzle-ar-menu-fix-v215.js','Snazzle AR menu fix'],
    ['./snazzle-onboarding-stability-v208.js','Snazzle onboarding stability'],
    ['./snazzle-card-catalog-repair-v217.js','Snazzle Cards catalogus-herstel'],
    ['./snazzle-card-fixed-v205.js','Snazzle Cards renderer'],
    ['./snazzle-mystic-series-v219.js','Snazzle MYSTIC Series 01'],
    ['./snazzle-mystic-verify-v220.js','Snazzle MYSTIC controle'],
    ['./snazzle-mystic-ui-v227.js','Snazzle MYSTIC UI'],
    ['./snazzle-blaze-ui-v231.js','Snazzle BLAZE UI'],
    ['./snazzle-blaze-sync-v228.js','Snazzle BLAZE sync'],
    ['./snazzle-card-progress-v234.js','Snazzle Cards voortgang'],
    ['./snazzle-card-rewards-ui-v235.js','Snazzle Cards beloningen'],
    ['./snazzle-card-counter-guard-v236.js','Snazzle Cards tellerbewaking'],
    ['./snazzle-spotbook-v237.js','Snazzle Spotboek']
  ]);

  repairSupplementalUi();
  setTimeout(repairSupplementalUi,650);
})().catch(err=>console.error('Snazzle achtergrondmodules',err));
