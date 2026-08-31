// Snazzle Cards v201 compatibility — doorsturen naar v202.
// Dit vangt ook oudere gecachte app.js-versies af die nog v201 proberen te laden.
const VERSION='201-forward-to-202';

async function load202(){
  try{
    await import(`./snazzle-card-thumb-fix-v202.js?from=v201&fresh=${Date.now()}`);
    return window.SnazzleCardThumbFixV202?.repair?.();
  }catch(err){
    console.error('Snazzle Cards v201 -> v202',err);
    return 0;
  }
}

window.SnazzleCardThumbFixV201={version:VERSION,repair:load202};
load202();
