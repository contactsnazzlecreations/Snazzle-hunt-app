// Snazzle Hunt v214 — stabiele onboarding + originele kaartafbeeldingen.
// De bestaande v207 runtime blijft intact; daarna herstellen we profiel/wereldkeuze en laden we de kaartweergave vers in.
await import(`./app-runtime-v207.js?base=${Date.now()}`);
try {
  await import(`./snazzle-onboarding-stability-v208.js?v=214-${Date.now()}`);
} catch (err) {
  console.error('Snazzle onboarding stability v208 kon niet laden', err);
}
try {
  await import(`./snazzle-card-fixed-v205.js?v=214-${Date.now()}`);
  [0,120,350,800,1600].forEach(ms=>setTimeout(()=>window.SnazzleCardFixedV205?.repair?.(),ms));
} catch (err) {
  console.error('Snazzle Cards v214 kon niet laden', err);
}
