// Snazzle Cards legacy compatibility v201.
// De oude v134/v141 sprite-oplossing is bewust uitgeschakeld: die zette kaart-<img>'s op opacity:0
// en veroorzaakte de halve afbeeldingen en grijze vakken vanaf S01-S07.
const VERSION='201-legacy-sprite-disabled';

async function loadFix(){
  try{
    await import(`./snazzle-card-thumb-fix-v201.js?legacy=${Date.now()}`);
    setTimeout(()=>window.SnazzleCardThumbFixV201?.repair?.(),20);
  }catch(err){
    console.error('Snazzle Cards v201 kon niet laden',err);
  }
}

window.SnazzleCardAdminThumbFix={
  version:VERSION,
  repair(){return window.SnazzleCardThumbFixV201?.repair?.()||loadFix();}
};

loadFix();
