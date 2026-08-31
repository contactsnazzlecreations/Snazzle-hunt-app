// Snazzle Hunt v209 — stabiele kaartassets zonder zwarte/grijze herstel-lagen.
// De bestaande v207 runtime blijft intact; daarna laden we expliciet de v209 kaartenrenderer.
await import(`./app-runtime-v207.js?base=${Date.now()}`);
try {
  await import(`./snazzle-card-fixed-v205.js?v=209-${Date.now()}`);
  [0,120,350,800,1600].forEach(ms=>setTimeout(()=>window.SnazzleCardFixedV205?.repair?.(),ms));
} catch (err) {
  console.error('Snazzle Cards v209 kon niet laden', err);
}
