// Snazzle Hunt v227 — volledig startup-pad hersteld + MYSTIC previews + kaartenmenu.
try {
  await import('./snazzle-mystic-v221.js?v=227');
} catch (err) {
  console.error('Snazzle MYSTIC seed kon niet laden', err);
}

await import('./app-runtime-v207.js?v=227');

try {
  await import('./snazzle-admin-analytics-v218.js?v=227');
} catch (err) {
  console.error('Snazzle bezoekersstatistieken v218 konden niet laden', err);
}
try {
  await import('./snazzle-ar-menu-fix-v215.js?v=227');
} catch (err) {
  console.error('Snazzle AR menu fix v215 kon niet laden', err);
}
try {
  await import('./snazzle-onboarding-stability-v208.js?v=227');
} catch (err) {
  console.error('Snazzle onboarding stability v208 kon niet laden', err);
}
try {
  await import('./snazzle-card-catalog-repair-v217.js?v=227');
} catch (err) {
  console.error('Snazzle Cards catalogus-herstel v217 kon niet laden', err);
}
try {
  await import('./snazzle-card-fixed-v205.js?v=227');
  [0,120,350,800,1600,3000].forEach(ms=>setTimeout(()=>window.SnazzleCardFixedV205?.repair?.(),ms));
} catch (err) {
  console.error('Snazzle Cards renderer kon niet laden', err);
}
try {
  await import('./snazzle-mystic-series-v219.js?v=227');
} catch (err) {
  console.error('Snazzle MYSTIC Series 01 kon niet laden', err);
}
try {
  await import('./snazzle-mystic-verify-v220.js?v=227');
} catch (err) {
  console.error('Snazzle MYSTIC controle kon niet laden', err);
}
try {
  await import('./snazzle-mystic-ui-v227.js?v=227');
} catch (err) {
  console.error('Snazzle MYSTIC/UI v227 kon niet laden', err);
}

[100,350,900,1800,3500,7000].forEach(ms=>setTimeout(()=>{
  window.SnazzleMysticV221?.repair?.();
  window.SnazzleCardFixedV205?.repair?.();
  window.SnazzleMysticUiV227?.repair?.();
},ms));
