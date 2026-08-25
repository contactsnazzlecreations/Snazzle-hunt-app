// Snazzle v64 — publiceer de complete Snazzle-look zonder nieuwe Firebase-regels.
// De beelden worden als verborgen systeemdocumenten in de reeds werkende villages-collectie opgeslagen.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
const DB_NAME='snazzleVisualAssetsV28';
const STORE='assets';
const MAIN_KEYS=['profileImage','heroImage','homeImage1','homeImage2'];
const MAX_CLOUD_CHARS=680000;
let isSuperAdmin=false,publishing=false,idbPromise=null;

function toast(text,ms=4200){const el=document.getElementById('toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(window.__snV64Toast);window.__snV64Toast=setTimeout(()=>el.classList.remove('show'),ms);}
function readSettings(){try{return JSON.parse(localStorage.getItem('snazzleSettings')||'{}');}catch{return {};}}
function localMainAssets(){const s=readSettings();return new Map(MAIN_KEYS.map(key=>[key,String(s?.[key]||'')]).filter(([,v])=>v.startsWith('data:image/')));}
function openVisualDb(){
  if(idbPromise)return idbPromise;
  idbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Lokale beeldopslag kon niet worden geopend'));});
  return idbPromise;
}
async function localVisualAssets(){
  try{const visualDb=await openVisualDb();return await new Promise((resolve,reject)=>{const tx=visualDb.transaction(STORE,'readonly'),store=tx.objectStore(STORE),kr=store.getAllKeys(),vr=store.getAll();tx.oncomplete=()=>{const map=new Map(),keys=kr.result||[],vals=vr.result||[];keys.forEach((key,i)=>{const v=vals[i];if(typeof v==='string'&&v.startsWith('data:image/'))map.set(String(key),v);});resolve(map);};tx.onerror=()=>reject(tx.error||new Error('Lokale beeldopslag kon niet worden gelezen'));});}
  catch(err){console.warn('Snazzle v64 IndexedDB',err);return new Map();}
}
function toBase64Url(text){const bytes=new TextEncoder().encode(text);let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function loadImage(dataUrl){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Afbeelding kon niet worden voorbereid'));img.src=dataUrl;});}
async function cloudSafe(dataUrl){
  if(!dataUrl||dataUrl.length<=MAX_CLOUD_CHARS)return dataUrl;
  const img=await loadImage(dataUrl);let max=900;
  for(let attempt=0;attempt<5;attempt++){
    const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,scale=Math.min(1,max/Math.max(w,h));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    const q=Math.max(.5,.78-attempt*.07);let out=c.toDataURL('image/webp',q);if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/jpeg',q);
    if(out.length<=MAX_CLOUD_CHARS)return out;max=Math.round(max*.76);
  }
  throw new Error('Een afbeelding is te groot om centraal te publiceren');
}
function visualRef(key){return doc(db,'villages','__snazzle_visual_'+toBase64Url(key));}
function mainRef(key){return doc(db,'villages','__snazzle_main_asset_'+key);}
async function verifySuperAdmin(user){if(!user||user.isAnonymous)return false;try{const snap=await getDoc(doc(db,'adminUsers',user.uid));const d=snap.data()||{};return snap.exists()&&d.active===true&&d.role==='superadmin';}catch{return false;}}
async function assetCounts(){return {main:localMainAssets(),visual:await localVisualAssets()};}
async function updatePanelStatus(extra=''){const el=document.getElementById('snV64PublicStatus');if(!el)return;const {main,visual}=await assetCounts();el.innerHTML=`Op dit toestel klaar voor publicatie: <b>${main.size}</b> hoofdbeeld${main.size===1?'':'en'} en <b>${visual.size}</b> overige beeldkeuze${visual.size===1?'':'s'}.${extra?`<br><strong>${extra}</strong>`:''}`;}
async function writeAndCheck(ref,payload,checkFn){await setDoc(ref,{active:false,system:true,...payload},{merge:true});const snap=await getDoc(ref);if(!snap.exists()||!checkFn(snap.data()||{}))throw new Error('Centrale controle is mislukt');}
async function publishPublicLook(){
  if(!isSuperAdmin||publishing)return;
  const user=auth.currentUser;if(!user)return;publishing=true;
  const btn=document.getElementById('snV64PublishBtn');if(btn){btn.disabled=true;btn.textContent='🌍 Publieke Snazzle-look publiceren…';}
  try{
    const {main,visual}=await assetCounts();if(main.size===0&&visual.size===0)throw new Error('Op dit toestel zijn geen lokale Snazzle-afbeeldingen gevonden');
    await updatePanelStatus('Beelden worden nu centraal opgeslagen en gecontroleerd…');
    const now=new Date().toISOString();let mainWritten=0,visualWritten=0;
    for(const [key,raw] of main){
      const dataUrl=await cloudSafe(raw);
      await writeAndCheck(mainRef(key),{purpose:'snazzleAppAsset',key,dataUrl,cleared:false,updatedAt:now,updatedBy:user.uid,publicLookVersion:65},d=>String(d.dataUrl||'').startsWith('data:image/'));
      mainWritten++;
    }
    for(const [key,raw] of visual){
      const dataUrl=await cloudSafe(raw);
      await writeAndCheck(visualRef(key),{purpose:'snazzleVisualAssetV54',key,dataUrl,cleared:false,updatedAt:now,updatedBy:user.uid,publicLookVersion:65},d=>String(d.key||'')===key&&String(d.dataUrl||'').startsWith('data:image/'));
      visualWritten++;
    }
    const release=Date.now().toString();
    await writeAndCheck(doc(db,'villages','__snazzle_public_look'),{purpose:'snazzlePublicLook',release,mainCount:mainWritten,visualCount:visualWritten,updatedAt:now,updatedBy:user.uid},d=>d.release===release);
    const message=`Publieke Snazzle-look online ✅ ${mainWritten} hoofdbeelden + ${visualWritten} overige beelden zijn centraal gecontroleerd.`;
    await updatePanelStatus(message);toast('Publieke Snazzle-look staat online voor iedereen ✅',6500);
    try{window.SnazzleCentralAssets?.reapply?.();}catch{}
  }catch(err){
    console.error('Snazzle v64 publiceren',err);let message=err?.message||'Publiceren is mislukt';const code=String(err?.code||'');
    if(code.includes('permission-denied'))message='Publiceren wordt nog door Firebase geweigerd.';
    if(code.includes('resource-exhausted'))message='Een afbeelding is nog te groot voor de centrale opslag.';
    await updatePanelStatus(`NIET gepubliceerd: ${message}`);toast('Publieke Snazzle-look nog niet gepubliceerd ❌',6500);
  }finally{publishing=false;if(btn){btn.disabled=false;btn.textContent='🌍 Publiceer deze Snazzle-look naar iedereen';}}
}
function installPanel(){
  if(!isSuperAdmin)return;const admin=document.getElementById('imagesAdmin');if(!admin||document.getElementById('snV64PublicLookBox'))return;
  const box=document.createElement('section');box.id='snV64PublicLookBox';box.style.cssText='margin:12px 0 16px;padding:14px;border:3px solid #2f7945;border-radius:17px;background:#f5ffe8;color:#2f2a20;box-shadow:0 5px 14px rgba(0,0,0,.12)';
  box.innerHTML=`<strong style="display:block;font-size:16px;margin-bottom:6px">🌍 Publieke app-look</strong><div style="font-size:12px;line-height:1.45;margin-bottom:9px">Publiceer de Snazzle-afbeeldingen die je op dit toestel ziet naar de centrale app. Daarna krijgen gewone gebruikers via de normale link dezelfde look.</div><div id="snV64PublicStatus" style="font-size:12px;line-height:1.45;margin-bottom:10px">Lokale Snazzle-look controleren…</div><button type="button" id="snV64PublishBtn" style="width:100%;min-height:52px;border:0;border-radius:14px;background:#267246;color:white;font-weight:1000;padding:12px">🌍 Publiceer deze Snazzle-look naar iedereen</button><small style="display:block;margin-top:8px;line-height:1.35;color:#65573e">Er wordt niets van dit toestel verwijderd. Na het opslaan wordt elk centraal beeld teruggelezen ter controle.</small>`;
  admin.prepend(box);document.getElementById('snV64PublishBtn').onclick=publishPublicLook;updatePanelStatus();
}
const observer=new MutationObserver(()=>installPanel());observer.observe(document.body,{childList:true,subtree:true});
onAuthStateChanged(auth,async user=>{isSuperAdmin=await verifySuperAdmin(user);const old=document.getElementById('snV64PublicLookBox');if(!isSuperAdmin){old?.remove();return;}installPanel();updatePanelStatus();});
window.SnazzlePublicLookV64={publish:publishPublicLook,status:updatePanelStatus,counts:assetCounts};
