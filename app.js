// Snazzle Hunt v225 — MYSTIC gebruikt nu dezelfde normale kaartafbeelding + blur als WILD/SPARK.
try {
  await import('./snazzle-mystic-v221.js?v=225');
} catch (err) {
  console.error('Snazzle MYSTIC preseed v225 kon niet laden', err);
}
await import('./app-runtime-v207.js?v=225');
try {
  await import('./snazzle-admin-analytics-v218.js?v=225');
} catch (err) {
  console.error('Snazzle bezoekersstatistieken v218 konden niet laden', err);
}
try {
  await import('./snazzle-ar-menu-fix-v215.js?v=225');
} catch (err) {
  console.error('Snazzle AR menu fix v215 kon niet laden', err);
}
try {
  await import('./snazzle-onboarding-stability-v208.js?v=225');
} catch (err) {
  console.error('Snazzle onboarding stability v208 kon niet laden', err);
}
try {
  await import('./snazzle-card-catalog-repair-v217.js?v=225');
} catch (err) {
  console.error('Snazzle Cards catalogus-herstel v217 kon niet laden', err);
}
try {
  await import('./snazzle-card-fixed-v205.js?v=225');
  [0,120,350,800,1600,3000].forEach(ms=>setTimeout(()=>window.SnazzleCardFixedV205?.repair?.(),ms));
} catch (err) {
  console.error('Snazzle Cards serie-veilige renderer v225 kon niet laden', err);
}
try {
  await import('./snazzle-mystic-series-v219.js?v=225');
} catch (err) {
  console.error('Snazzle MYSTIC Series 01 kon niet laden', err);
}
try {
  await import('./snazzle-mystic-verify-v220.js?v=225');
} catch (err) {
  console.error('Snazzle MYSTIC controle kon niet laden', err);
}

// Geen aparte MYSTIC preview-overlay meer. De standaard kaartcode doet nu zelf:
// unlocked = helder, locked = echte afbeelding wazig/donker + vraagteken.
[250,700,1500,3000].forEach(ms=>setTimeout(()=>{
  window.SnazzleCardFixedV205?.repair?.();
  window.SnazzleMysticVerifyV220?.repair?.();
},ms));
