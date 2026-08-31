// v51.1 / runtime v193 — directe veilige activatie van nieuwe Snazzle-code.
// Als GitHub main wijzigt, wordt de nieuwe runtime eenmalig geladen in plaats van
// eindeloos te blijven hangen op 'actief bij volgende start'.

const REPO_HEAD_URL='https://api.github.com/repos/contactsnazzlecreations/Snazzle-hunt-app/commits/main';
const STORAGE_KEY='snazzleKnownRepoShaV51';
const RELOAD_KEY='snazzleReloadedRepoShaV193';
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

function activateUpdate(sha){
  let reloaded='';
  try{reloaded=sessionStorage.getItem(RELOAD_KEY)||'';}catch{}
  if(reloaded===sha) return;
  try{
    sessionStorage.setItem(RELOAD_KEY,sha);
    localStorage.setItem(STORAGE_KEY,sha);
  }catch{}
  toast('Nieuwe Snazzle-versie laden…');
  setTimeout(()=>{
    try{
      const url=new URL(location.href);
      url.searchParams.set('snv',sha.slice(0,10));
      location.replace(url.href);
    }catch{
      location.reload();
    }
  },350);
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
    try{known=localStorage.getItem(STORAGE_KEY)||'';}catch{}

    if(!known){
      try{localStorage.setItem(STORAGE_KEY,sha);}catch{}
      return;
    }

    if(sha!==known){
      activateUpdate(sha);
    }
  }catch(err){
    console.debug('Snazzle versiecontrole tijdelijk niet beschikbaar',err);
  }finally{
    checking=false;
  }
}

setTimeout(checkForUpdate,2500);
setInterval(checkForUpdate,CHECK_EVERY_MS);

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && Date.now()-lastCheckAt>45*1000) checkForUpdate();
});
window.addEventListener('focus',()=>{
  if(Date.now()-lastCheckAt>45*1000) checkForUpdate();
});
window.addEventListener('online',()=>setTimeout(checkForUpdate,1200));

window.SnazzleAutoUpdate={checkNow:checkForUpdate};
