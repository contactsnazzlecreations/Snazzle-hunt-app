// Snazzle Hunt v215 — stabiele onboarding + originele kaartafbeeldingen + robuuste AR-menuknop.
// De bestaande v207 runtime blijft intact; daarna herstellen we de directe AR-menuactie, profiel/wereldkeuze en kaartweergave.
await import(`./app-runtime-v207.js?base=${Date.now()}`);
try {
  await import(`./snazzle-ar-menu-fix-v215.js?v=215-${Date.now()}`);
} catch (err) {
  console.error('Snazzle AR menu fix v215 kon niet laden', err);
}
try {
  await import(`./snazzle-onboarding-stability-v208.js?v=215-${Date.now()}`);
} catch (err) {
  console.error('Snazzle onboarding stability v208 kon niet laden', err);
}
try {
  await import(`./snazzle-card-fixed-v205.js?v=215-${Date.now()}`);
  [0,120,350,800,1600].forEach(ms=>setTimeout(()=>window.SnazzleCardFixedV205?.repair?.(),ms));
} catch (err) {
  console.error('Snazzle Cards v215 kon niet laden', err);
}