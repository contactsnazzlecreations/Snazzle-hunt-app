// Snazzle Organisatieplatform v143 — fail-safe lazy loader.
// Normale gebruikers laden alleen de publieke Special Hunt-laag; beheer en organisatieplaatsing laden pas wanneer nodig.
import { auth,db,state,call } from './snazzle-org-shared-v143.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { doc,getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

let publicModule=null,organizerModule=null,adminModule=null,collectionModule=null,refreshTimer=null;

async function safeImport(path){
  try{return await import(path);}
  catch(err){console.warn(`Snazzle organisatie-module kon niet laden: ${path}`,err);return null;}
}
async function ensurePublic(){
  if(publicModule)return publicModule;
  publicModule=await safeImport('./snazzle-org-public-v143.js');
  return publicModule;
}
async function ensureOrganizer(){
  if(organizerModule)return organizerModule;
  organizerModule=await safeImport('./snazzle-org-organizer-v143.js');
  return organizerModule;
}
async function ensureCollection(){
  if(collectionModule)return collectionModule;
  collectionModule=await safeImport('./snazzle-org-collection-v143.js');
  return collectionModule;
}
async function ensureAdmin(){
  if(adminModule)return adminModule;
  adminModule=await safeImport('./snazzle-org-admin-v143.js');
  return adminModule;
}
async function isSuperAdmin(){
  if(!state.user)return false;
  try{
    const snap=await getDoc(doc(db,'adminUsers',state.user.uid));
    const p=snap.exists()?snap.data():null;
    return !!(p?.active===true&&p?.role==='superadmin');
  }catch{return false;}
}
async function refreshSessions(){
  if(!state.user){state.organizerSessions=[];notify();return;}
  try{
    const d=await call('getOrganizerSessions');
    state.organizerSessions=Array.isArray(d.items)?d.items:[];
  }catch{state.organizerSessions=[];}
  notify();
}
function notify(){window.dispatchEvent(new CustomEvent('snazzle:org-state-changed'));}
function idle(task){
  if('requestIdleCallback' in window)requestIdleCallback(()=>task(),{timeout:1300});
  else setTimeout(task,350);
}
async function onUser(user){
  state.user=user||null;
  state.liveHunts=[];state.organizerSessions=[];state.myFinds=[];state.assets=[];
  const pub=await ensurePublic();
  if(!state.user){
    pub?.refreshLiveHunts?.(true);
    notify();
    return;
  }

  // Publieke Special Hunts laden parallel en los van de rest.
  pub?.refreshLiveHunts?.();

  // Alleen een organisatievertegenwoordiger krijgt de plaatsmodule.
  await refreshSessions();
  const hasDeepLink=new URLSearchParams(location.search).get('orgaccess')==='1';
  if(state.organizerSessions.length||hasDeepLink){
    const org=await ensureOrganizer();
    if(state.organizerSessions.length)org?.loadSessions?.();
    if(hasDeepLink)org?.maybeOpenDeepLink?.();
  }

  // Event Collecties zijn klein en worden pas in idle-tijd geladen.
  idle(async()=>{
    const col=await ensureCollection();
    col?.loadMyFinds?.();
  });

  // Zwaar beheer wordt uitsluitend door een hoofdbeheerder geladen.
  if(await isSuperAdmin()){
    const adm=await ensureAdmin();
    await adm?.checkRole?.();
    adm?.watchAdminUi?.();
  }

  clearInterval(refreshTimer);
  refreshTimer=setInterval(()=>{
    if(document.visibilityState!=='visible'||!state.user)return;
    pub?.refreshLiveHunts?.(true);
    refreshSessions().then(async()=>{
      if(state.organizerSessions.length&&!organizerModule){
        const org=await ensureOrganizer();
        org?.loadSessions?.();
      }
    });
  },60000);
}

// Shims laten de publieke laag organisatie-toegang openen zonder de organisatiecode vooraf te laden.
window.SnazzleOrgOrganizerV143={
  openAccess:async()=>{const m=await ensureOrganizer();await m?.loadSessions?.();m?.openAccess?.();},
  loadSessions:refreshSessions,
  maybeOpenDeepLink:async()=>{const m=await ensureOrganizer();m?.maybeOpenDeepLink?.();}
};

onAuthStateChanged(auth,onUser);

window.SnazzleOrgPlatformV143={
  open:async()=>{const m=await ensurePublic();m?.openSpecialHunts?.();},
  organizationAccess:async()=>{const m=await ensureOrganizer();await m?.loadSessions?.();m?.openAccess?.();},
  refresh:async()=>{
    const m=await ensurePublic();await Promise.allSettled([m?.refreshLiveHunts?.(true),refreshSessions()]);
    if(collectionModule)collectionModule.loadMyFinds?.(true);
  }
};
