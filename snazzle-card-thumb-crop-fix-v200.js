// Snazzle Cards v200 compatibility — v201 is de enige actieve thumbnail-renderer.
const VERSION='200-compat-v201';

async function load(){
  try{
    await import(`./snazzle-card-thumb-fix-v201.js?v200=${Date.now()}`);
    return window.SnazzleCardThumbFixV201?.repair?.();
  }catch(err){
    console.error('Snazzle Cards v201 compat laden mislukt',err);
    return false;
  }
}

window.SnazzleCardThumbCropFixV200={version:VERSION,repair:load};
load();
