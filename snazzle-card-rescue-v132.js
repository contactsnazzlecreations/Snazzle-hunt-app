// Snazzle Cards v204 compatibility loader.
// De oude rescue/seeding-code blijft uit: die kon kapotte imageData opnieuw opslaan.
// Alleen de vaste originele kaartweergave wordt opnieuw, cachevrij, aangeroepen.
const VERSION='204-rescue-disabled';

async function loadCurrentCardRepair(){
  try{
    await import(`./snazzle-card-thumb-fix-v202.js?rescue204=${Date.now()}`);
    [0,80,250,700].forEach(ms=>setTimeout(()=>window.SnazzleCardThumbFixV204?.repair?.(),ms));
  }catch(err){console.error('Snazzle Cards v204 kon niet laden',err);}
}

window.SnazzleCardRestoreV133={version:VERSION,count:0,disabled:true};
loadCurrentCardRepair();
