import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const ASSETS = ['profileImage','heroImage','homeImage1','homeImage2'];
const central = {};
let listenersStarted = false;

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__centralAssetToast);
  window.__centralAssetToast=setTimeout(()=>el.classList.remove('show'),2600);
}

function setImg(imgId,fallbackId,src){
  const img=document.getElementById(imgId);
  const fallback=document.getElementById(fallbackId);
  if(!img) return;
  if(src){
    img.src=src;
    img.style.display='block';
    if(fallback) fallback.style.display='none';
  } else {
    img.removeAttribute('src');
    img.style.display='none';
    if(fallback) fallback.style.display='grid';
  }
}

function mirrorLocal(key,src){
  try{
    const settings=JSON.parse(localStorage.getItem('snazzleSettings')||'{}');
    settings[key]=src||'';
    localStorage.setItem('snazzleSettings',JSON.stringify(settings));
  }catch{}
}

function applyAsset(key,src){
  central[key]=src||'';
  mirrorLocal(key,central[key]);
  if(key==='profileImage'){
    setImg('profileLogo','logoFallback',central[key]);
    setImg('profilePreview','profilePreviewFallback',central[key]);
  }
  if(key==='heroImage'){
    const hero=document.getElementById('hero');
    if(hero){
      hero.style.backgroundImage=central[key]
        ? `linear-gradient(rgba(15,55,28,.38),rgba(10,40,20,.67)),url(${central[key]})`
        : '';
    }
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

function compressFile(file,max=800,quality=.68){
  return new Promise((resolve,reject)=>{
    if(!file || !file.type?.startsWith('image/')) return reject(new Error('Kies een afbeelding'));
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const scale=Math.min(1,max/Math.max(img.width,img.height));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(img.width*scale));
        canvas.height=Math.max(1,Math.round(img.height*scale));
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        const out=canvas.toDataURL('image/jpeg',quality);
        if(out.length>850000) reject(new Error('Afbeelding is te groot'));
        else resolve(out);
      };
      img.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
      img.src=reader.result;
    };
    reader.onerror=()=>reject(new Error('Bestand kon niet worden gelezen'));
    reader.readAsDataURL(file);
  });
}

async function saveCentralAsset(key,file){
  try{
    const src=await compressFile(file);
    await setDoc(doc(db,'snazzleAppAssets',key),{
      dataUrl:src,
      updatedAt:new Date().toISOString(),
      updatedBy:auth.currentUser?.uid||''
    });
    applyAsset(key,src);
    toast('Afbeelding centraal opgeslagen ✅');
  }catch(err){
    console.error(err);
    toast(err?.message||'Centraal opslaan mislukt');
  }
}

async function clearCentralAsset(key){
  try{
    await setDoc(doc(db,'snazzleAppAssets',key),{
      dataUrl:'',
      updatedAt:new Date().toISOString(),
      updatedBy:auth.currentUser?.uid||''
    });
    applyAsset(key,'');
    toast('Afbeelding centraal verwijderd');
  }catch(err){
    console.error(err);
    toast('Verwijderen mislukt');
  }
}

function installAdminHandlers(){
  const pairs=[
    ['profileImageInput','profileImage'],
    ['heroImageInput','heroImage'],
    ['home1Input','homeImage1'],
    ['home2Input','homeImage2']
  ];
  pairs.forEach(([id,key])=>{
    const input=document.getElementById(id);
    if(input) input.onchange=e=>saveCentralAsset(key,e.target.files?.[0]);
  });
  document.querySelectorAll('[data-remove-local-image]').forEach(button=>{
    button.onclick=()=>clearCentralAsset(button.dataset.removeLocalImage);
  });
  const note=document.querySelector('#imagesAdmin p');
  if(note) note.textContent='Deze afbeeldingen worden nu centraal opgeslagen. Iedereen ziet automatisch hetzelfde Snazzle-uiterlijk.';
}

function startListeners(){
  if(listenersStarted) return;
  listenersStarted=true;
  ASSETS.forEach(key=>{
    onSnapshot(doc(db,'snazzleAppAssets',key),snap=>{
      if(snap.exists()) applyAsset(key,snap.data()?.dataUrl||'');
    },err=>console.warn('Centraal Snazzle-beeld niet geladen',key,err));
  });
}

async function migrateOwnersLocalAssets(user){
  try{
    const adminSnap=await getDoc(doc(db,'adminUsers',user.uid));
    const admin=adminSnap.data();
    if(!adminSnap.exists() || admin?.active!==true || admin?.role!=='superadmin') return;
    let local={};
    try{ local=JSON.parse(localStorage.getItem('snazzleSettings')||'{}'); }catch{}
    for(const key of ASSETS){
      if(!local[key]) continue;
      const target=doc(db,'snazzleAppAssets',key);
      const snap=await getDoc(target);
      if(!snap.exists()){
        await setDoc(target,{
          dataUrl:local[key],
          updatedAt:new Date().toISOString(),
          updatedBy:user.uid,
          migratedFromLocal:true
        });
      }
    }
  }catch(err){
    console.warn('Lokale Snazzle-afbeeldingen konden nog niet centraal worden gemigreerd',err);
  }
}

installAdminHandlers();
onAuthStateChanged(auth,async user=>{
  if(!user) return;
  startListeners();
  installAdminHandlers();
  await migrateOwnersLocalAssets(user);
});

// Andere modules kunnen centrale assets opnieuw toepassen nadat zij de home hebben opgebouwd.
window.SnazzleCentralAssets={
  reapply(){ ASSETS.forEach(key=>{ if(key in central) applyAsset(key,central[key]); }); }
};
setTimeout(()=>window.SnazzleCentralAssets.reapply(),800);
setTimeout(()=>window.SnazzleCentralAssets.reapply(),2200);
