// Snazzle Hunt v213 — originele kaartafbeeldingen zonder beschadigde binaire atlas.
// De bestaande v207 runtime blijft intact; daarna laden we de gecontroleerde kaartweergave vers in.
await import(`./app-runtime-v207.js?base=${Date.now()}`);
try {
  await import(`./snazzle-card-fixed-v205.js?v=213-${Date.now()}`);
  [0,120,350,800,1600].forEach(ms=>setTimeout(()=>window.SnazzleCardFixedV205?.repair?.(),ms));
} catch (err) {
  console.error('Snazzle Cards v213 kon niet laden', err);
}
