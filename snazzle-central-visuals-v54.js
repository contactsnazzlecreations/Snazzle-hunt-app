// Snazzle v54 — centrale synchronisatie voor ALLE vervangbare visuele assets.
// Oudere beeldmodules bewaren keuzes in IndexedDB. Deze laag maakt die keuzes gedeeld
// via de reeds toegankelijke shopMailConfig-collectie, zonder een nieuwe Firebase deploy.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, query, where, onSnapshot,
  getDocs, getDoc, doc, setDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
const DB_NAME='snazzleVisualAssetsV28';
const STORE='assets';
const PURPOSE='snazzleVisualAssetV54';
const COLLECTION='shopMailConfig';
const MAX_CLOUD_CHARS=680000;

let dbPromise=null;
let remoteReady=false;
let superAdmin=false;
let pushing=false;
let pushTimer=0;
let reloadTimer=0;
let remoteMap=new Map();

function toast(text){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=text;
  el.classList.add('show');
  clearTimeout(window.__v54Toast);
  window.__v54Toast=setTimeout(()=>el.classList.remove('show'),3300);
}

function openVisualDb(){
  if(dbPromise) return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{
      if(!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Beeldopslag kon niet openen'));
  });
  return dbPromise;
}

async function allLocal(){
  try{
    const visualDb=await openVisualDb();
    return await new Promise((resolve,reject)=>{
      const tx=visualDb.transaction(STORE,'readonly');
      const store=tx.objectStore(STORE);
      const keysReq=store.getAllKeys();
      const valsReq=store.getAll();
      tx.oncomplete=()=>{
        const keys=keysReq.result||[];
        const vals=valsReq.result||[];
        const map=new Map();
        keys.forEach((key,i)=>{
          const value=vals[i];
          if(typeof value==='string' && value.startsWith('data:image/')) map.set(String(key),value);
        });
        resolve(map);
      };
      tx.onerror=()=>reject(tx.error||new Error('Beeldopslag lezen mislukt'));
    });
  }catch(err){
    console.warn('Snazzle v54 lokale beelden lezen',err);
    return new Map();
  }
}

async function putLocal(key,value){
  const visualDb=await openVisualDb();
  await new Promise((resolve,reject)=>{
    const tx=visualDb.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(value,key);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}

async function deleteLocal(key){
  const visualDb=await openVisualDb();
  await new Promise((resolve,reject)=>{
    const tx=visualDb.transaction(STORE,'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}

function toBase64Url(text){
  const bytes=new TextEncoder().encode(text);
  let binary='';
  for(const b of bytes) binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function visualRef(key){
  return doc(db,COLLECTION,'snazzleVisual54_'+toBase64Url(key));
}

function loadImage(dataUrl){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error('Afbeelding kon niet worden voorbereid'));
    img.src=dataUrl;
  });
}

async function cloudSafe(dataUrl){
  if(!dataUrl || dataUrl.length<=MAX_CLOUD_CHARS) return dataUrl;
  try{
    const img=await loadImage(dataUrl);
    let max=900;
    for(let attempt=0;attempt<4;attempt++){
      const scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
      canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      let out=canvas.toDataURL('image/webp',Math.max(.55,.76-attempt*.07));
      if(!out.startsWith('data:image/webp')) out=canvas.toDataURL('image/jpeg',Math.max(.55,.76-attempt*.07));
      if(out.length<=MAX_CLOUD_CHARS) return out;
      max=Math.round(max*.76);
    }
  }catch(err){
    console.warn('Snazzle v54 compressie',err);
  }
  throw new Error('Een afbeelding is te groot om centraal te bewaren');
}

function safeToReload(){
  const active=document.activeElement;
  if(active && ['INPUT','TEXTAREA','SELECT'].includes(active.tagName)) return false;
  if(document.getElementById('adminSheet')?.classList.contains('show')) return false;
  if(document.getElementById('adminLogin')?.classList.contains('show')) return false;
  return true;
}

function queueVisualReload(){
  clearTimeout(reloadTimer);
  reloadTimer=setTimeout(()=>{
    if(!safeToReload()){
      queueVisualReload();
      return;
    }
    toast('Jouw Snazzle-afbeeldingen zijn gesynchroniseerd ✨');
    setTimeout(()=>location.reload(),650);
  },450);
}

async function applyRemoteSnapshot(snapshot){
  const next=new Map();
  snapshot.docs.forEach(d=>{
    const data=d.data()||{};
    const key=String(data.key||'');
    if(!key) return;
    next.set(key,{
      dataUrl:String(data.dataUrl||''),
      cleared:data.cleared===true,
      updatedAt:String(data.updatedAt||'')
    });
  });
  remoteMap=next;

  const local=await allLocal();
  let changed=false;
  let adminRecoveryNeeded=false;
  for(const [key,remote] of remoteMap){
    if(remote.cleared){
      if(local.has(key)){
        if(superAdmin){
          // Een nog aanwezige oude beheer-kopie is een herstelbron en wordt niet meer stil verwijderd.
          adminRecoveryNeeded=true;
        }else{
          await deleteLocal(key);
          changed=true;
        }
      }
      continue;
    }
    if(remote.dataUrl && local.get(key)!==remote.dataUrl){
      await putLocal(key,remote.dataUrl);
      changed=true;
    }
  }
  remoteReady=true;
  if(adminRecoveryNeeded) setTimeout(()=>pushLocalSnapshot({propagateDeletes:false}),120);
  if(changed) queueVisualReload();
}

async function readRemoteOnce(){
  const snap=await getDocs(query(collection(db,COLLECTION),where('purpose','==',PURPOSE)));
  const map=new Map();
  snap.docs.forEach(d=>{
    const data=d.data()||{};
    const key=String(data.key||'');
    if(key) map.set(key,{dataUrl:String(data.dataUrl||''),cleared:data.cleared===true,updatedAt:String(data.updatedAt||'')});
  });
  return map;
}

async function isCurrentUserSuperAdmin(user){
  try{
    const snap=await getDoc(doc(db,'adminUsers',user.uid));
    const data=snap.data()||{};
    return snap.exists() && data.active===true && data.role==='superadmin';
  }catch{return false;}
}

async function migrateExistingLocal(user){
  if(!superAdmin) return 0;
  let uploaded=0;
  try{
    const local=await allLocal();
    if(!local.size) return 0;
    const remote=await readRemoteOnce();
    for(const [key,raw] of local){
      const current=remote.get(key);
      // Alleen een werkelijk bestaand cloudbeeld is leidend. Een oude clear mag een lokale beheer-kopie herstellen.
      if(current?.dataUrl) continue;
      const dataUrl=await cloudSafe(raw);
      await setDoc(visualRef(key),{
        purpose:PURPOSE,
        key,
        dataUrl,
        cleared:false,
        updatedAt:new Date().toISOString(),
        updatedBy:user.uid,
        migratedFromLocal:true,
        recoveredFromLegacyLocal:current?.cleared===true
      });
      uploaded++;
    }
    if(uploaded) toast(`${uploaded} bestaande Snazzle-afbeeldingen veilig centraal bewaard ✓`);
  }catch(err){
    console.warn('Snazzle v54 migratie',err);
  }
  return uploaded;
}

async function pushLocalSnapshot({propagateDeletes=false}={}){
  if(!superAdmin || pushing) return 0;
  pushing=true;
  let uploaded=0;
  try{
    const user=auth.currentUser;
    if(!user) return 0;
    const local=await allLocal();
    const remote=remoteReady ? remoteMap : await readRemoteOnce();
    for(const [key,raw] of local){
      const current=remote.get(key);
      const dataUrl=await cloudSafe(raw);
      if(current?.dataUrl===dataUrl && current?.cleared!==true) continue;
      await setDoc(visualRef(key),{
        purpose:PURPOSE,
        key,
        dataUrl,
        cleared:false,
        updatedAt:new Date().toISOString(),
        updatedBy:user.uid,
        recoveredFromLegacyLocal:current?.cleared===true
      });
      uploaded++;
    }
    if(propagateDeletes && remoteReady){
      for(const [key,current] of remote){
        if(current.cleared || local.has(key)) continue;
        await setDoc(visualRef(key),{
          purpose:PURPOSE,
          key,
          dataUrl:'',
          cleared:true,
          updatedAt:new Date().toISOString(),
          updatedBy:user.uid
        });
      }
    }
  }catch(err){
    console.warn('Snazzle v54 centraal opslaan',err);
    toast('Een aangepaste afbeelding kon nog niet centraal worden opgeslagen');
  }finally{
    pushing=false;
  }
  return uploaded;
}

function schedulePush(options){
  clearTimeout(pushTimer);
  pushTimer=setTimeout(()=>pushLocalSnapshot(options),1500);
}

function watchAdminImageEdits(){
  document.addEventListener('change',e=>{
    const input=e.target;
    if(!superAdmin || !(input instanceof HTMLInputElement) || input.type!=='file') return;
    if(input.closest('#imagesAdmin,#v32ImageManager,#adminVillageList')) schedulePush({propagateDeletes:false});
  },true);
  document.addEventListener('click',e=>{
    if(!superAdmin) return;
    const button=e.target.closest?.('button');
    if(!button || !button.closest('#imagesAdmin,#v32ImageManager,#adminVillageList')) return;
    if(/verwijder|standaard|terug/i.test(button.textContent||'')) schedulePush({propagateDeletes:true});
  },true);
}

function startRemoteListener(){
  const visualQuery=query(collection(db,COLLECTION),where('purpose','==',PURPOSE));
  onSnapshot(visualQuery,snapshot=>{
    applyRemoteSnapshot(snapshot).catch(err=>console.warn('Snazzle v54 toepassen',err));
  },err=>console.warn('Snazzle v54 centrale beelden niet geladen',err));
}

onAuthStateChanged(auth,async user=>{
  if(!user) return;
  superAdmin=await isCurrentUserSuperAdmin(user);
  startRemoteListener();
  if(superAdmin) setTimeout(()=>migrateExistingLocal(user),900);
});

watchAdminImageEdits();
window.SnazzleVisualSyncV54={
  push:()=>pushLocalSnapshot({propagateDeletes:false}),
  pushAndClean:()=>pushLocalSnapshot({propagateDeletes:true}),
  recover:async()=>{
    const user=auth.currentUser;
    if(!user||!superAdmin) return 0;
    return migrateExistingLocal(user);
  },
  local:allLocal
};
