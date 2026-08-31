// Snazzle Cards legacy compatibility v202.
// Alle oude kaart-herstelroutes sturen nu naar de nieuwe 24-kaartenfix.
const VERSION='202-legacy-forward';

async function loadFix(){
  try{
    await import(`./snazzle-card-thumb-fix-v202.js?legacy=${Date.now()}`);
    setTimeout(()=>window.SnazzleCardThumbFixV202?.repair?.(),20);
  }catch(err){
    console.error('Snazzle Cards v202 kon niet laden',err);
  }
}

window.SnazzleCardAdminThumbFix={
  version:VERSION,
  repair(){return window.SnazzleCardThumbFixV202?.repair?.()||loadFix();}
};

loadFix();
