// Snazzle AR Safety pass v125 — herstel klikbaarheid op Android + duidelijke sluitknop.
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

function installArIntroClose(){
  const panel=document.querySelector('#snArIntro .sn-ar-panel');
  const cancel=document.getElementById('snArCancel');
  if(!panel||!cancel)return false;

  if(!document.getElementById('snArIntroCloseV125Style')){
    const style=document.createElement('style');
    style.id='snArIntroCloseV125Style';
    style.textContent=`
      #snArIntro .sn-ar-panel{position:relative!important;padding-top:36px!important}
      #snArCancel{
        position:absolute!important;
        top:12px!important;
        right:12px!important;
        width:46px!important;
        height:46px!important;
        min-width:46px!important;
        min-height:46px!important;
        margin:0!important;
        padding:0!important;
        border-radius:14px!important;
        border:2px solid rgba(255,255,255,.65)!important;
        background:#70472b!important;
        color:#fff!important;
        box-shadow:0 4px 0 #4c2e1d,0 6px 14px rgba(0,0,0,.2)!important;
        font-size:0!important;
        line-height:1!important;
        z-index:50!important;
        display:grid!important;
        place-items:center!important;
      }
      #snArCancel::after{content:'×';font-size:30px;font-weight:1000;line-height:1;color:#fff}
      #snArCancel:active{transform:scale(.94)!important}
    `;
    document.head.appendChild(style);
  }

  cancel.setAttribute('aria-label','Sluit Snazzle AR');
  cancel.setAttribute('title','Sluiten');
  return true;
}

cleanupSafetyBlockers();
installArIntroClose();

// Verwijder alleen veiligheidslagen die later nog uit een oude gecachte module verschijnen.
// Tegelijk houden we de X-sluitknop aanwezig wanneer de AR-interface later wordt opgebouwd.
const observer=new MutationObserver(()=>{
  cleanupSafetyBlockers();
  installArIntroClose();
});
if(document.body) observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
else document.addEventListener('DOMContentLoaded',()=>{
  cleanupSafetyBlockers();
  installArIntroClose();
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
},{once:true});

window.SnazzleArSafetyV124={
  version:'125-click-pass-ar-intro-close',
  cleanup:cleanupSafetyBlockers,
  installClose:installArIntroClose,
  destroy(){observer.disconnect();}
};