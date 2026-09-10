// Snazzle Hunt v216 — snelle startup met stabiele cacheversie.
await import('./app-runtime-v207.js?v=216');
try {
  await import('./snazzle-ar-menu-fix-v215.js?v=216');
} catch (err) {
  console.error('Snazzle AR menu fix v215 kon niet laden', err);
}
try {
  await import('./snazzle-onboarding-stability-v208.js?v=216');
} catch (err) {
  console.error('Snazzle onboarding stability v208 kon niet laden', err);
}
try {
  await import('./snazzle-card-fixed-v205.js?v=216');
  [0,120,350,800,1600].forEach(ms=>setTimeout(()=>window.SnazzleCardFixedV205?.repair?.(),ms));
} catch (err) {
  console.error('Snazzle Cards v215 kon niet laden', err);
}