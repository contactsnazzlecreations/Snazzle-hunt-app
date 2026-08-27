// v51 — veilige versiecontrole voor de publieke Snazzle-app.
// Nieuwe code wordt nooit meer midden in het gebruik geforceerd geladen.
// Firebase-inhoud (hunts, dorpen, nieuws en beelden) blijft live via listeners.
// Een nieuwe programmaversie wordt vanzelf actief bij de volgende normale appstart.

const REPO_HEAD_URL='https://api.github.com/repos/contactsnazzlecreations/Snazzle-hunt-app/commits/main';
const STORAGE_KEY='snazzleKnownRepoShaV51';
const CHECK_EVERY_MS=5*60*1000;

let checking=false;
let lastCheckAt=0;

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__autoUpdateToast);
  window.__autoUpdateToast=setTimeout(()=>el.classList.remove('show'),4200);
}

async function checkForUpdate(){
  if(checking || !navigator.onLine) return;
  checking=true;
  lastCheckAt=Date.now();
  try{
    const response=await fetch(REPO_HEAD_URL,{
      cache:'no-store',
      headers:{'Accept':'application/vnd.github+json'}
    });
    if(!response.ok) return;
    const data=await response.json();
    const sha=String(data?.sha||'');
    if(!sha) return;

    let known='';
    try{ known=localStorage.getItem(STORAGE_KEY)||''; }catch{}

    if(!known){
      try{ localStorage.setItem(STORAGE_KEY,sha); }catch{}
      return;
    }

    if(sha!==known){
      // Belangrijk: alleen onthouden, nooit location.reload/replace uitvoeren.
      // index.html haalt app.js bij een volgende normale start vers op.
      try{ localStorage.setItem(STORAGE_KEY,sha); }catch{}
      toast('Nieuwe Snazzle-versie staat klaar ✨ Actief bij de volgende start.');
    }
  }catch(err){
    console.debug('Snazzle versiecontrole tijdelijk niet beschikbaar',err);
  }finally{
    checking=false;
  }
}

// Controleer rustig na het openen en daarna periodiek, zonder de gebruiker te onderbreken.
setTimeout(checkForUpdate,3500);
setInterval(checkForUpdate,CHECK_EVERY_MS);

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && Date.now()-lastCheckAt>60*1000) checkForUpdate();
});
window.addEventListener('focus',()=>{
  if(Date.now()-lastCheckAt>60*1000) checkForUpdate();
});
window.addEventListener('online',()=>setTimeout(checkForUpdate,1500));

window.SnazzleAutoUpdate={checkNow:checkForUpdate};
