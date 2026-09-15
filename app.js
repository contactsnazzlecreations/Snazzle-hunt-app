// Snazzle Hunt v226 — MYSTIC artwork wordt direct gerenderd met dezelfde lock-blur als WILD/SPARK.
try {
  await import('./snazzle-mystic-v221.js?v=226');
} catch (err) {
  console.error('Snazzle MYSTIC v226 kon niet laden', err);
}
await import('./app-runtime-v207.js?v=226');
try {
  await import('./snazzle-admin-analytics-v218.js?v=226');
} catch (err) {
  console.error('Snazzle bezoekersstatistieken v218 konden niet laden', err);
}
[100,350,900,1800,3500,7000].forEach(ms=>setTimeout(()=>window.SnazzleMysticV221?.repair?.(),ms));
