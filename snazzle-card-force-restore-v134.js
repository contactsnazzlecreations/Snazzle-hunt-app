// Snazzle Cards v204 legacy compatibility.
// Oude sprite-, externe GitHub- en Firestore-herstelroutes zijn definitief uitgeschakeld.
// Deze entrypoint laadt alleen de vaste originele kaartweergave v204.
const VERSION='204-legacy-forward-only';

async function loadCurrent(){
  try{
    await import(`./snazzle-card-thumb-fix-v202.js?legacy204=${Date.now()}`);
    [0,80,250].forEach(ms=>setTimeout(()=>window.SnazzleCardThumbFixV204?.repair?.(),ms));
  }catch(err){console.error('Snazzle Cards v204 legacy loader',err);}
}

window.SnazzleCardAdminThumbFix={version:VERSION,repair(){return window.SnazzleCardThumbFixV204?.repair?.()||loadCurrent();}};
window.SnazzleCardThumbFixV203=window.SnazzleCardAdminThumbFix;
loadCurrent();
