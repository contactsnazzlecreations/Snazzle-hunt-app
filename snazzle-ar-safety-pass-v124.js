// Snazzle AR Safety pass v124 — herstel klikbaarheid op Android.
// Deze module maakt de oude blokkerende STOP-laag volledig onschadelijk.
// De AR-camera/knoppen blijven door de bestaande AR-module bestuurd.
// Voor de daaropvolgende kaartmodule worden eerst migratie + veilige vaste kaartbasis uitgevoerd.

try{
  await import(`./snazzle-card-migration-v2.js?migration=20260827-1`);
}catch(err){
  console.warn('Snazzle Cards migratie kon niet vooraf laden',err);
}

try{
  await import(`./snazzle-card-seed-v140.js?seed=20260828-1`);
}catch(err){
  console.warn('Snazzle Cards vaste basis kon niet vooraf laden',err);
}

function cleanupSafetyBlockers(){
  try{
    document.querySelectorAll('#snArSafeWalk,#snArSafeWalk123,[id^="snArSafeWalk"],[data-sn-ar-safety]').forEach(el=>el.remove());
    document.querySelectorAll('#snArSafetyV82bStyles,#snArSafety123Style,[id^="snArSafety"]').forEach(el=>el.remove());
    document.querySelectorAll('.sn-ar-overlay.safe-walking').forEach(el=>el.classList.remove('safe-walking'));
    if(document.body){
      document.body.style.pointerEvents='';
      document.body.style.touchAction='';
    }
    if(document.documentElement){
      document.documentElement.style.pointerEvents='';
      document.documentElement.style.touchAction='';
    }
  }catch(err){
    console.debug('Snazzle safety cleanup',err);
  }
}

cleanupSafetyBlockers();

// Verwijder alleen veiligheidslagen die later nog uit een oude gecachte module verschijnen.
const observer=new MutationObserver(()=>cleanupSafetyBlockers());
if(document.body) observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
else document.addEventListener('DOMContentLoaded',()=>{
  cleanupSafetyBlockers();
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
},{once:true});

window.SnazzleArSafetyV124={
  version:'124-click-pass-card-seed-v140',
  cleanup:cleanupSafetyBlockers,
  destroy(){observer.disconnect();}
};