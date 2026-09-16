// v52 — stille versiecontrole zonder herstart tijdens actief gebruik.
// Een nieuwe GitHub-versie mag de app nooit meer onder de gebruiker opnieuw laden.

const REPO_HEAD_URL='https://api.github.com/repos/contactsnazzlecreations/Snazzle-hunt-app/commits/main';
const STORAGE_KEY='snazzleKnownRepoShaV52';
const PENDING_KEY='snazzlePendingRepoShaV52';
const CHECK_EVERY_MS=5*60*1000;

let checking=false;
let lastCheckAt=0;

function rememberVersion(sha){
  if(!sha) return;
  try{
    const known=localStorage.getItem(STORAGE_KEY)||'';
    if(known && known!==sha) localStorage.setItem(PENDING_KEY,sha);
    localStorage.setItem(STORAGE_KEY,sha);
  }catch{}
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
    rememberVersion(sha);
  }catch(err){
    console.debug('Snazzle versiecontrole tijdelijk niet beschikbaar',err);
  }finally{
    checking=false;
  }
}

// Controleer rustig op de achtergrond. Nooit location.replace() of location.reload().
setTimeout(checkForUpdate,4000);
setInterval(checkForUpdate,CHECK_EVERY_MS);

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && Date.now()-lastCheckAt>60*1000) checkForUpdate();
});
window.addEventListener('online',()=>setTimeout(checkForUpdate,1500));

window.SnazzleAutoUpdate={
  checkNow:checkForUpdate,
  pending(){try{return localStorage.getItem(PENDING_KEY)||'';}catch{return '';}}
};
