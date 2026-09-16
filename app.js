// Snazzle Hunt v247 — snelle single-start bootstrap.
// Eerst de bruikbare app laden; kaartcatalogus en herstelmodules pas daarna op de achtergrond.

window.__snazzleBootStartedAt=window.__snazzleBootStartedAt||performance.now();

async function optionalImport(path,label){
  try{return await import(path);}
  catch(err){console.error(`${label||path} kon niet laden`,err);return null;}
}

// Kritieke route: start de echte app direct. Geen kaart-seeds meer vóór het beginscherm.
await import('./app-runtime-v245.js?v=247');
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

// Niet-kritieke uitbreidingen laden pas nadat het beginscherm al werkt.
(async()=>{
  await optionalImport('./snazzle-card-structure-v233.js?v=247','Snazzle Cards structuur');

  await Promise.allSettled([
    optionalImport('./snazzle-mystic-v221.js?v=247','Snazzle MYSTIC seed'),
    optionalImport('./snazzle-blaze-v229.js?v=247','Snazzle BLAZE seed'),
    optionalImport('./snazzle-admin-analytics-v218.js?v=247','Snazzle bezoekersstatistieken'),
    optionalImport('./snazzle-ar-menu-fix-v215.js?v=247','Snazzle AR menu fix'),
    optionalImport('./snazzle-onboarding-stability-v208.js?v=247','Snazzle onboarding stability'),
    optionalImport('./snazzle-card-catalog-repair-v217.js?v=247','Snazzle Cards catalogus-herstel')
  ]);

  await optionalImport('./snazzle-card-fixed-v205.js?v=247','Snazzle Cards renderer');

  await Promise.allSettled([
    optionalImport('./snazzle-mystic-series-v219.js?v=247','Snazzle MYSTIC Series 01'),
    optionalImport('./snazzle-mystic-verify-v220.js?v=247','Snazzle MYSTIC controle'),
    optionalImport('./snazzle-mystic-ui-v227.js?v=247','Snazzle MYSTIC UI'),
    optionalImport('./snazzle-blaze-ui-v231.js?v=247','Snazzle BLAZE UI'),
    optionalImport('./snazzle-blaze-sync-v228.js?v=247','Snazzle BLAZE sync'),
    optionalImport('./snazzle-card-progress-v234.js?v=247','Snazzle Cards voortgang'),
    optionalImport('./snazzle-card-rewards-ui-v235.js?v=247','Snazzle Cards beloningen'),
    optionalImport('./snazzle-card-counter-guard-v236.js?v=247','Snazzle Cards tellerbewaking'),
    optionalImport('./snazzle-spotbook-v237.js?v=247','Snazzle Spotboek')
  ]);

  // Eén gecontroleerde herstelronde, plus één korte nacontrole. Geen 7 seconden lang her-renderen meer.
  repairSupplementalUi();
  setTimeout(repairSupplementalUi,700);
})().catch(err=>console.error('Snazzle achtergrondmodules',err));
