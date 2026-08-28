// Snazzle Organisatieplatform v143 — fail-safe lazy loader.
// Normale gebruikers laden alleen de publieke Special Hunt-laag; beheer en organisatieplaatsing laden pas wanneer nodig.
import { auth,db,state,call } from './snazzle-org-shared-v143.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { doc,getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

let publicModule=null,organizerModule=null,organizerUxModule=null,adminModule=null,adminLibraryModule=null,collectionModule=null,refreshTimer=null;
const ORG_FLAG='snazzleOrgAccessUsed143';

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
  if(organizerModule&&!organizerUxModule){
    organizerUxModule=await safeImport('./snazzle-org-ux-v143.js');
    organizerUxModule?.install?.();
  }
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
  if(adminModule&&!adminLibraryModule){
    adminLibraryModule=await safeImport('./snazzle-org-admin-library-v143.js');
    adminLibraryModule?.install?.();
  }
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
function organizerMayExist(){
  if(new URLSearchParams(location.search).get('orgaccess')==='1')return true;
  try{return localStorage.getItem(ORG_FLAG)==='1';}catch{return false;}
}
async function refreshSessions(){
  if(!state.user){state.organizerSessions=[];notify();return;}
  if(!organizerMayExist()&&!organizerModule){state.organizerSessions=[];notify();return;}
  try{
    const d=await call('getOrganizerSessions');
    state.organizerSessions=Array.isArray(d.items)?d.items:[];
    if(!state.organizerSessions.length&&new URLSearchParams(location.search).get('orgaccess')!=='1'){
      try{localStorage.removeItem(ORG_FLAG);}catch{}
    }
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

  // Publieke Special Hunts laden los van de hoofdapp en blokkeren de eerste paint nooit.
  pub?.refreshLiveHunts?.();

  // Alleen eerdere/deeplink organisatiegebruikers krijgen een sessiecontrole.
  const hasDeepLink=new URLSearchParams(location.search).get('orgaccess')==='1';
  if(organizerMayExist()){
    await refreshSessions();
    const org=await ensureOrganizer();
    if(state.organizerSessions.length)org?.loadSessions?.();
    if(hasDeepLink)org?.maybeOpenDeepLink?.();
  }else{
    notify();
  }

  // Event Collecties worden pas in idle-tijd geladen.
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
    if(organizerMayExist()){
      refreshSessions().then(async()=>{
        if(state.organizerSessions.length&&!organizerModule){
          const org=await ensureOrganizer();
          org?.loadSessions?.();
        }
      });
    }
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
    const m=await ensurePublic();
    const jobs=[m?.refreshLiveHunts?.(true)];
    if(organizerMayExist())jobs.push(refreshSessions());
    await Promise.allSettled(jobs);
    if(collectionModule)collectionModule.loadMyFinds?.(true);
  }
};