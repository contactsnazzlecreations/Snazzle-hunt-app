// Snazzle v60.1 — veilige herstelhulp zonder automatische herstart.
// Beeldherstel is alleen nog handmatig; de app mag tijdens normaal openen nooit zichzelf verversen.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import './snazzle-public-visual-publish-v64.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
let isSuper=false;
let running=false;
let adminObserver=null;

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__v60Toast);
  window.__v60Toast=setTimeout(()=>el.classList.remove('show'),3800);
}

function mainLocalCount(){
  try{
    const s=JSON.parse(localStorage.getItem('snazzleSettings')||'{}');
    return ['profileImage','heroImage','homeImage1','homeImage2'].filter(k=>String(s?.[k]||'').startsWith('data:image/')).length;
  }catch{return 0;}
}

async function indexedLocalCount(){
  try{
    const map=await window.SnazzleVisualSyncV54?.local?.();
    return map instanceof Map ? map.size : 0;
  }catch{return 0;}
}

async function updateStatus(extra=''){
  const el=document.getElementById('snV60RecoveryStatus');
  if(!el) return;
  const main=mainLocalCount();
  const other=await indexedLocalCount();
  el.innerHTML=`Op dit toestel gevonden: <b>${main}</b> hoofdbeeld${main===1?'':'en'} en <b>${other}</b> overige beeldkeuze${other===1?'':'s'}.${extra?`<br>${extra}`:''}`;
}

async function recoverNow(){
  if(!isSuper||running) return;
  running=true;
  const btn=document.getElementById('snV60RecoverBtn');
  if(btn){btn.disabled=true;btn.textContent='Beelden herstellen…';}
  try{
    const beforeMain=mainLocalCount();
    const beforeOther=await indexedLocalCount();
    const main=Number(await window.SnazzleCentralAssets?.recover?.()||0);
    const other=Number(await window.SnazzleVisualSyncV54?.recover?.()||0);
    await window.SnazzleVisualSyncV54?.push?.();
    const found=beforeMain+beforeOther;
    const uploaded=main+other;
    if(found===0){
      await updateStatus('Er staat op deze browser geen oude lokale beeldkopie meer. Bestaande centrale beelden worden wel gewoon geladen.');
      toast('Geen oude lokale beeldkopieën gevonden op dit toestel');
    }else{
      // Pas de nieuwe centrale beelden direct toe. Belangrijk: GEEN location.reload().
      try{await window.SnazzleCentralAssets?.reapply?.();}catch{}
      try{await window.SnazzleVisualSyncV54?.pull?.();}catch{}
      await updateStatus(`Herstel uitgevoerd. ${uploaded ? uploaded+' ontbrekende centrale beeldkeuze(s) opnieuw opgeslagen.' : 'De gevonden beelden waren al centraal aanwezig.'}`);
      toast('Snazzle-beeldherstel uitgevoerd ✨');
    }
  }catch(err){
    console.warn('Snazzle v60 beeldherstel',err);
    await updateStatus('Herstellen lukte nog niet. De lokale kopieën zijn niet verwijderd.');
    toast('Beeldherstel kon nog niet worden afgerond');
  }finally{
    running=false;
    if(btn){btn.disabled=false;btn.textContent='🔄 Oude Snazzle-afbeeldingen herstellen';}
  }
}

function installPanel(){
  if(!isSuper) return;
  const admin=document.getElementById('imagesAdmin');
  if(!admin||document.getElementById('snV60RecoveryBox')) return;
  const box=document.createElement('section');
  box.id='snV60RecoveryBox';
  box.style.cssText='margin:12px 0 16px;padding:13px;border:2px solid #b78b43;border-radius:16px;background:#fff7d9;color:#3b2a18';
  box.innerHTML=`<strong style="display:block;font-size:15px;margin-bottom:5px">🛟 Beeldherstel</strong>
    <div id="snV60RecoveryStatus" style="font-size:12px;line-height:1.45;margin-bottom:9px">Lokale beeldkopieën controleren…</div>
    <button type="button" id="snV60RecoverBtn" style="width:100%;min-height:48px;border:0;border-radius:13px;background:#2f7945;color:white;font-weight:900;padding:11px">🔄 Oude Snazzle-afbeeldingen herstellen</button>
    <small style="display:block;margin-top:8px;line-height:1.35;color:#6d5737">Deze knop wist niets. Beeldherstel gebeurt alleen wanneer je hier zelf op tikt en ververst de app niet.</small>`;
  admin.prepend(box);
  document.getElementById('snV60RecoverBtn').onclick=recoverNow;
  updateStatus();
}

function observeAdmin(){
  installPanel();
  if(adminObserver) return;
  adminObserver=new MutationObserver(()=>installPanel());
  adminObserver.observe(document.body,{childList:true,subtree:true});
}

onAuthStateChanged(auth,async user=>{
  isSuper=false;
  if(!user||user.isAnonymous) return;
  try{
    const snap=await getDoc(doc(db,'adminUsers',user.uid));
    const data=snap.data()||{};
    isSuper=snap.exists()&&data.active===true&&data.role==='superadmin';
  }catch{}
  if(isSuper){
    // Geen automatisch herstel meer bij aanmelden/openen. Dat kon vroeger na circa
    // 1,7 seconde een echte location.reload() veroorzaken.
    observeAdmin();
    updateStatus();
  }
});

window.SnazzleImageRecoveryV60={run:recoverNow,status:updateStatus};
