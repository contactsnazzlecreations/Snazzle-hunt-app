// Snazzle Hunt v220 — startup + kaartenherstel + bezoekersstatistieken + MYSTIC Series 01 controle.
await import('./app-runtime-v207.js?v=220');
try {
  await import('./snazzle-admin-analytics-v218.js?v=220');
} catch (err) {
  console.error('Snazzle bezoekersstatistieken v218 konden niet laden', err);
}
try {
  await import('./snazzle-ar-menu-fix-v215.js?v=220');
} catch (err) {
  console.error('Snazzle AR menu fix v215 kon niet laden', err);
}
try {
  await import('./snazzle-onboarding-stability-v208.js?v=220');
} catch (err) {
  console.error('Snazzle onboarding stability v208 kon niet laden', err);
}
try {
  await import('./snazzle-card-catalog-repair-v217.js?v=220');
} catch (err) {
  console.error('Snazzle Cards catalogus-herstel v217 kon niet laden', err);
}
try {
  await import('./snazzle-card-fixed-v205.js?v=220');
  [0,120,350,800,1600,3000].forEach(ms=>setTimeout(()=>window.SnazzleCardFixedV205?.repair?.(),ms));
} catch (err) {
  console.error('Snazzle Cards v217 kon niet laden', err);
}
try {
  await import('./snazzle-mystic-series-v219.js?v=220');
} catch (err) {
  console.error('Snazzle MYSTIC Series 01 v219 kon niet laden', err);
}
try {
  await import('./snazzle-mystic-verify-v220.js?v=220');
} catch (err) {
  console.error('Snazzle MYSTIC controle v220 kon niet laden', err);
}
