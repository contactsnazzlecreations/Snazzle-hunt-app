import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
const ASSETS=['profileImage','heroImage','homeImage1','homeImage2'];
const central={};
let currentIsSuperAdmin=false;
let listenersStarted=false;

// Gebruik de reeds werkende villages-collectie als verborgen systeemopslag.
// active:false + geen name betekent dat deze documenten nooit als dorp in de app verschijnen.
const assetRef=key=>doc(db,'villages','__snazzle_main_asset_'+key);

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__centralAssetToast);
  window.__centralAssetToast=setTimeout(()=>el.classList.remove('show'),3200);
}
function readSettings(){try{return JSON.parse(localStorage.getItem('snazzleSettings')||'{}');}catch{return {};}}
function writeSettings(settings){try{localStorage.setItem('snazzleSettings',JSON.stringify(settings));}catch{}}
function readLocal(key){return String(readSettings()?.[key]||'');}
function mirrorLocal(key,src){const s=readSettings();s[key]=src||'';writeSettings(s);}
function setImg(imgId,fallbackId,src){
  const img=document.getElementById(imgId),fallback=document.getElementById(fallbackId);
  if(!img) return;
  if(src){img.src=src;img.style.display='block';if(fallback) fallback.style.display='none';}
  else{img.removeAttribute('src');img.style.display='none';if(fallback) fallback.style.display='grid';}
}
function applyAsset(key,src,{persist=true}={}){
  central[key]=src||'';
  if(persist) mirrorLocal(key,central[key]);
  if(key==='profileImage'){
    setImg('profileLogo','logoFallback',central[key]);
    setImg('profilePreview','profilePreviewFallback',central[key]);
  }
  if(key==='heroImage'){
    const hero=document.getElementById('hero');
    if(hero) hero.style.backgroundImage=central[key]?`linear-gradient(rgba(15,55,28,.38),rgba(10,40,20,.67)),url(${central[key]})`:'';
    setImg('heroPreview','heroPreviewFallback',central[key]);
  }
  if(key==='homeImage1'){
    setImg('homeImg1','homeEmpty1',central[key]);
    setImg('home1Preview','home1PreviewFallback',central[key]);
  }
  if(key==='homeImage2'){
    setImg('homeImg2','homeEmpty2',central[key]);
    setImg('home2Preview','home2PreviewFallback',central[key]);
  }
}
function compressFile(file,max=800,quality=.72){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/')) return reject(new Error('Kies een afbeelding'));
    const r=new FileReader();
    r.onload=()=>{const img=new Image();img.onload=()=>{
      const scale=Math.min(1,max/Math.max(img.width,img.height));
      const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      let out=c.toDataURL('image/webp',quality);if(!out.startsWith('data:image/webp')) out=c.toDataURL('image/jpeg',quality);
      if(out.length>850000) reject(new Error('Afbeelding is te groot'));else resolve(out);
    };img.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));img.src=r.result;};
    r.onerror=()=>reject(new Error('Bestand kon niet worden gelezen'));r.readAsDataURL(file);
  });
}
async function saveCentralValue(key,src,extra={}){
  const user=auth.currentUser;
  if(!user||!currentIsSuperAdmin||!src) return false;
  await setDoc(assetRef(key),{
    active:false,
    system:true,
    purpose:'snazzleAppAsset',
    key,
    dataUrl:src,
    cleared:false,
    updatedAt:new Date().toISOString(),
    updatedBy:user.uid,
    ...extra
  },{merge:true});
  applyAsset(key,src,{persist:true});
  return true;
}
async function saveCentralAsset(key,file){
  let src='';
  try{src=await compressFile(file);}catch(err){toast(err?.message||'Afbeelding kon niet worden gelezen');return;}
  try{await saveCentralValue(key,src);toast('Afbeelding centraal opgeslagen ✅');}
  catch(err){console.error(err);applyAsset(key,src,{persist:true});toast('Afbeelding lokaal opgeslagen; centraal opslaan lukte niet');}
}
async function clearCentralAsset(key){
  try{
    const user=auth.currentUser;
    await setDoc(assetRef(key),{
      active:false,system:true,purpose:'snazzleAppAsset',key,dataUrl:'',cleared:true,
      updatedAt:new Date().toISOString(),updatedBy:user?.uid||''
    },{merge:true});
  }catch(err){console.warn(err);}
  mirrorLocal(key,'');applyAsset(key,'',{persist:false});toast('Afbeelding verwijderd');
}
function installAdminHandlers(){
  [['profileImageInput','profileImage'],['heroImageInput','heroImage'],['home1Input','homeImage1'],['home2Input','homeImage2']].forEach(([id,key])=>{
    const input=document.getElementById(id);if(input) input.onchange=e=>saveCentralAsset(key,e.target.files?.[0]);
  });
  document.querySelectorAll('[data-remove-local-image]').forEach(button=>button.onclick=()=>clearCentralAsset(button.dataset.removeLocalImage));
  const note=document.querySelector('#imagesAdmin p');
  if(note) note.textContent='Deze afbeeldingen worden centraal opgeslagen. Iedereen ziet automatisch hetzelfde Snazzle-uiterlijk.';
}
function startListeners(){
  if(listenersStarted) return;
  listenersStarted=true;
  ASSETS.forEach(key=>{
    onSnapshot(assetRef(key),async snap=>{
      if(snap.exists()){
        const data=snap.data()||{};
        const src=String(data.dataUrl||'');
        if(src){applyAsset(key,src,{persist:true});return;}
        if(data.cleared===true&&!currentIsSuperAdmin){applyAsset(key,'',{persist:true});return;}
      }
      const local=readLocal(key);
      if(local){applyAsset(key,local,{persist:false});if(currentIsSuperAdmin){try{await saveCentralValue(key,local,{recoveredFromLocal:true});}catch{}}}
    },err=>console.warn('Centraal Snazzle-beeld niet geladen',key,err));
  });
}
async function recoverLocalAssets(user){
  if(!currentIsSuperAdmin) return 0;
  let count=0;
  for(const key of ASSETS){
    const local=readLocal(key);if(!local) continue;
    try{
      const snap=await getDoc(assetRef(key));
      if(!snap.exists()||!String(snap.data()?.dataUrl||'')){await saveCentralValue(key,local,{recoveredFromLocal:true});count++;}
    }catch(err){console.warn('Herstel hoofdbeeld',key,err);}
  }
  if(count) toast(`${count} hoofdafbeelding${count===1?'':'en'} centraal hersteld ✨`);
  return count;
}
onAuthStateChanged(auth,async user=>{
  if(!user) return;
  currentIsSuperAdmin=false;
  if(!user.isAnonymous){
    try{const snap=await getDoc(doc(db,'adminUsers',user.uid));const d=snap.data()||{};currentIsSuperAdmin=snap.exists()&&d.active===true&&d.role==='superadmin';}catch{}
  }
  startListeners();installAdminHandlers();
  if(currentIsSuperAdmin) setTimeout(()=>recoverLocalAssets(user),500);
});
installAdminHandlers();
window.SnazzleCentralAssets={
  reapply(){ASSETS.forEach(key=>{if(key in central) applyAsset(key,central[key],{persist:false});});},
  recover:async()=>{const user=auth.currentUser;if(!user||user.isAnonymous) return 0;return recoverLocalAssets(user);},
  localStatus:()=>Object.fromEntries(ASSETS.map(key=>[key,!!readLocal(key)]))
};
setTimeout(()=>window.SnazzleCentralAssets.reapply(),800);
setTimeout(()=>window.SnazzleCentralAssets.reapply(),2200);
