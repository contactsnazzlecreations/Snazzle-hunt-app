// Snazzle v54 — centrale synchronisatie voor alle vervangbare visuele assets.
// Gebruikt verborgen documenten in de bestaande villages-collectie zodat geen nieuwe Firebase-regels nodig zijn.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, query, where, onSnapshot, getDocs, getDoc, doc, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
const DB_NAME='snazzleVisualAssetsV28';
const STORE='assets';
const PURPOSE='snazzleVisualAssetV54';
const COLLECTION='villages';
const MAX_CLOUD_CHARS=680000;
let dbPromise=null,superAdmin=false,pushing=false,reloadTimer=0;
let remoteMap=new Map();

function toast(text){const el=document.getElementById('toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(window.__v54Toast);window.__v54Toast=setTimeout(()=>el.classList.remove('show'),3300);}
function openVisualDb(){
  if(dbPromise) return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Beeldopslag kon niet openen'));
  });
  return dbPromise;
}
async function allLocal(){
  try{
    const visualDb=await openVisualDb();
    return await new Promise((resolve,reject)=>{
      const tx=visualDb.transaction(STORE,'readonly'),store=tx.objectStore(STORE),kr=store.getAllKeys(),vr=store.getAll();
      tx.oncomplete=()=>{const map=new Map(),keys=kr.result||[],vals=vr.result||[];keys.forEach((key,i)=>{const v=vals[i];if(typeof v==='string'&&v.startsWith('data:image/')) map.set(String(key),v);});resolve(map);};
      tx.onerror=()=>reject(tx.error||new Error('Beeldopslag lezen mislukt'));
    });
  }catch(err){console.warn('Snazzle v54 lokale beelden lezen',err);return new Map();}
}
async function putLocal(key,value){const visualDb=await openVisualDb();await new Promise((resolve,reject)=>{const tx=visualDb.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function deleteLocal(key){const visualDb=await openVisualDb();await new Promise((resolve,reject)=>{const tx=visualDb.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function toBase64Url(text){const bytes=new TextEncoder().encode(text);let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function visualRef(key){return doc(db,COLLECTION,'__snazzle_visual_'+toBase64Url(key));}
function loadImage(dataUrl){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Afbeelding kon niet worden voorbereid'));img.src=dataUrl;});}
async function cloudSafe(dataUrl){
  if(!dataUrl||dataUrl.length<=MAX_CLOUD_CHARS) return dataUrl;
  const img=await loadImage(dataUrl);let max=900;
  for(let attempt=0;attempt<5;attempt++){
    const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,scale=Math.min(1,max/Math.max(w,h));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    const q=Math.max(.5,.78-attempt*.07);let out=c.toDataURL('image/webp',q);if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/jpeg',q);
    if(out.length<=MAX_CLOUD_CHARS) return out;max=Math.round(max*.76);
  }
  throw new Error('Een afbeelding is te groot om centraal te bewaren');
}
function queueReload(){clearTimeout(reloadTimer);reloadTimer=setTimeout(()=>{const active=document.activeElement;if(active&&['INPUT','TEXTAREA','SELECT'].includes(active.tagName))return queueReload();toast('Jouw Snazzle-afbeeldingen zijn bijgewerkt ✨');setTimeout(()=>location.reload(),650);},500);}
async function readRemoteOnce(){
  const snap=await getDocs(query(collection(db,COLLECTION),where('purpose','==',PURPOSE)));const map=new Map();
  snap.docs.forEach(d=>{const x=d.data()||{},key=String(x.key||'');if(key)map.set(key,{dataUrl:String(x.dataUrl||''),cleared:x.cleared===true});});return map;
}
async function saveRemote(key,raw,user,extra={}){
  const dataUrl=await cloudSafe(raw);
  await setDoc(visualRef(key),{active:false,system:true,purpose:PURPOSE,key,dataUrl,cleared:false,updatedAt:new Date().toISOString(),updatedBy:user.uid,...extra},{merge:true});
  return dataUrl;
}
async function pushLocalSnapshot(){
  if(!superAdmin||pushing) return 0;pushing=true;let count=0;
  try{
    const user=auth.currentUser;if(!user)return 0;const local=await allLocal();const remote=await readRemoteOnce();
    for(const [key,raw] of local){const current=remote.get(key);const dataUrl=await cloudSafe(raw);if(current?.dataUrl===dataUrl&&!current?.cleared)continue;await setDoc(visualRef(key),{active:false,system:true,purpose:PURPOSE,key,dataUrl,cleared:false,updatedAt:new Date().toISOString(),updatedBy:user.uid},{merge:true});count++;}
    if(count) toast(`${count} Snazzle-afbeelding${count===1?'':'en'} centraal opgeslagen ✓`);
  }catch(err){console.warn('Snazzle v54 centraal opslaan',err);toast('Een afbeelding kon nog niet centraal worden opgeslagen');}
  finally{pushing=false;}
  return count;
}
function startRemoteListener(){
  const q=query(collection(db,COLLECTION),where('purpose','==',PURPOSE));
  onSnapshot(q,async snap=>{
    const next=new Map();snap.docs.forEach(d=>{const x=d.data()||{},key=String(x.key||'');if(key)next.set(key,{dataUrl:String(x.dataUrl||''),cleared:x.cleared===true});});remoteMap=next;
    const local=await allLocal();let changed=false;
    for(const [key,remote] of next){
      if(remote.cleared){if(local.has(key)&&!superAdmin){await deleteLocal(key);changed=true;}continue;}
      if(remote.dataUrl&&local.get(key)!==remote.dataUrl){await putLocal(key,remote.dataUrl);changed=true;}
    }
    if(changed) queueReload();
  },err=>console.warn('Snazzle v54 centrale beelden niet geladen',err));
}
async function isCurrentUserSuperAdmin(user){try{const snap=await getDoc(doc(db,'adminUsers',user.uid));const d=snap.data()||{};return snap.exists()&&d.active===true&&d.role==='superadmin';}catch{return false;}}
function watchAdminImageEdits(){
  document.addEventListener('change',e=>{const input=e.target;if(!superAdmin||!(input instanceof HTMLInputElement)||input.type!=='file')return;if(input.closest('#imagesAdmin,#v32ImageManager,#adminVillageList'))setTimeout(()=>pushLocalSnapshot(),1400);},true);
  document.addEventListener('click',e=>{if(!superAdmin)return;const b=e.target.closest?.('button');if(!b||!b.closest('#imagesAdmin,#v32ImageManager,#adminVillageList'))return;if(/verwijder|standaard|terug/i.test(b.textContent||''))setTimeout(()=>pushLocalSnapshot(),900);},true);
}
onAuthStateChanged(auth,async user=>{if(!user)return;superAdmin=await isCurrentUserSuperAdmin(user);startRemoteListener();if(superAdmin)setTimeout(()=>pushLocalSnapshot(),700);});
watchAdminImageEdits();
window.SnazzleVisualSyncV54={push:pushLocalSnapshot,pushAndClean:pushLocalSnapshot,recover:pushLocalSnapshot,local:allLocal};
