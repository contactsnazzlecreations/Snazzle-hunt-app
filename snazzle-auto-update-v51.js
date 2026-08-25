// v51 — automatische versiecontrole voor de publieke Snazzle-app.
// Firebase-inhoud (hunts, dorpen, nieuws, beelden) blijft live via listeners;
// deze module is uitsluitend voor nieuwe programmaversies uit GitHub.

const REPO_HEAD_URL='https://api.github.com/repos/contactsnazzlecreations/Snazzle-hunt-app/commits/main';
const STORAGE_KEY='snazzleKnownRepoShaV51';
const CHECK_EVERY_MS=5*60*1000;
const MIN_DEPLOY_AGE_MS=2*60*1000;
const SAFE_RETRY_MS=20*1000;

let checking=false;
let pendingSha='';
let lastCheckAt=0;
let reloadTimer=0;

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__autoUpdateToast);
  window.__autoUpdateToast=setTimeout(()=>el.classList.remove('show'),4200);
}

function userIsEditing(){
  const active=document.activeElement;
  if(active && ['INPUT','TEXTAREA','SELECT'].includes(active.tagName)) return true;
  const admin=document.getElementById('adminSheet');
  if(admin?.classList.contains('show')) return true;
  const login=document.getElementById('adminLogin');
  if(login?.classList.contains('show')) return true;
  return false;
}

async function clearOldRuntimeCaches(){
  try{
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(key=>caches.delete(key)));
    }
  }catch{}
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg=>reg.unregister()));
    }
  }catch{}
}

async function performUpdate(sha){
  if(!sha || sha!==pendingSha) return;
  if(userIsEditing()){
    toast('Nieuwe Snazzle-versie klaar ✨ Ik vernieuw zodra Beheer is gesloten.');
    reloadTimer=setTimeout(()=>performUpdate(sha),SAFE_RETRY_MS);
    return;
  }
  try{ localStorage.setItem(STORAGE_KEY,sha); }catch{}
  toast('Nieuwe Snazzle-versie wordt geladen… ✨');
  await clearOldRuntimeCaches();
  const target=new URL('./',location.href);
  target.searchParams.set('fresh',Date.now().toString());
  target.searchParams.set('release',sha.slice(0,10));
  location.replace(target.href);
}

function scheduleUpdate(sha,commitDate){
  if(!sha || pendingSha===sha) return;
  pendingSha=sha;
  const age=commitDate ? Date.now()-new Date(commitDate).getTime() : MIN_DEPLOY_AGE_MS;
  const wait=Math.max(5000,MIN_DEPLOY_AGE_MS-Math.max(0,age));
  toast('Nieuwe Snazzle-versie gevonden ✨ Deze wordt automatisch geladen.');
  clearTimeout(reloadTimer);
  reloadTimer=setTimeout(()=>performUpdate(sha),wait);
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
      const commitDate=data?.commit?.committer?.date || data?.commit?.author?.date || '';
      scheduleUpdate(sha,commitDate);
    }
  }catch(err){
    console.debug('Snazzle versiecontrole tijdelijk niet beschikbaar',err);
  }finally{
    checking=false;
  }
}

// Eerste controle kort na het opbouwen van de app.
setTimeout(checkForUpdate,3500);
setInterval(checkForUpdate,CHECK_EVERY_MS);

// Bij terugkeren naar de app meteen controleren, maar nooit onnodig vaak.
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && Date.now()-lastCheckAt>60*1000) checkForUpdate();
});
window.addEventListener('focus',()=>{
  if(Date.now()-lastCheckAt>60*1000) checkForUpdate();
});
window.addEventListener('online',()=>setTimeout(checkForUpdate,1500));

window.SnazzleAutoUpdate={checkNow:checkForUpdate};
