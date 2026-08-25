import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const ASSETS = ['profileImage','heroImage','homeImage1','homeImage2'];
const central = {};
let listenersStarted = false;
let currentIsSuperAdmin = false;
let recovering = false;

// Gebruik een reeds bestaande, centraal leesbare configuratiecollectie.
// Alleen de hoofdbeheerder kan hierin schrijven volgens de bestaande Firestore-regels.
const assetRef = key => doc(db,'shopMailConfig','snazzleAsset_'+key);

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__centralAssetToast);
  window.__centralAssetToast=setTimeout(()=>el.classList.remove('show'),3000);
}

function readSettings(){
  try{return JSON.parse(localStorage.getItem('snazzleSettings')||'{}');}
  catch{return {};}
}
function writeSettings(settings){
  try{localStorage.setItem('snazzleSettings',JSON.stringify(settings));}catch{}
}
function readLocal(key){
  return String(readSettings()?.[key]||'');
}
function mirrorLocal(key,src){
  const settings=readSettings();
  settings[key]=src||'';
  writeSettings(settings);
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

function applyAsset(key,src,{persist=true}={}){
  central[key]=src||'';
  // Belangrijk: een remote leegte mag niet stilzwijgend een oude lokale kopie vernietigen.
  if(persist) mirrorLocal(key,central[key]);
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

function preserveLocalAsset(key){
  const local=readLocal(key);
  if(local){
    central[key]=local;
    applyAsset(key,local,{persist:false});
    return local;
  }
  return '';
}

function compressFile(file,max=800,quality=.72){
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
        let out=canvas.toDataURL('image/webp',quality);
        if(!out.startsWith('data:image/webp')) out=canvas.toDataURL('image/jpeg',quality);
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

async function saveCentralValue(key,src,{migrated=false,recovered=false}={}){
  const user=auth.currentUser;
  if(!user || !currentIsSuperAdmin || !src) return false;
  await setDoc(assetRef(key),{
    dataUrl:src,
    cleared:false,
    updatedAt:new Date().toISOString(),
    updatedBy:user.uid,
    purpose:'snazzleAppAsset',
    ...(migrated?{migratedFromLocal:true}:{}),
    ...(recovered?{recoveredFromLegacyLocal:true}:{})
  });
  applyAsset(key,src,{persist:true});
  return true;
}

async function saveCentralAsset(key,file){
  let src='';
  try{src=await compressFile(file);}
  catch(err){toast(err?.message||'Afbeelding kon niet worden gelezen');return;}
  try{
    await saveCentralValue(key,src);
    toast('Afbeelding centraal opgeslagen ✅');
  }catch(err){
    console.error(err);
    applyAsset(key,src,{persist:true});
    toast('Afbeelding lokaal opgeslagen; centraal opslaan lukte niet');
  }
}

async function clearCentralAsset(key){
  try{
    const user=auth.currentUser;
    await setDoc(assetRef(key),{
      dataUrl:'',
      cleared:true,
      updatedAt:new Date().toISOString(),
      updatedBy:user?.uid||'',
      purpose:'snazzleAppAsset'
    });
    // Alleen een bewuste beheeractie verwijdert ook de lokale kopie.
    mirrorLocal(key,'');
    applyAsset(key,'',{persist:false});
    toast('Afbeelding centraal verwijderd');
  }catch(err){
    console.error(err);
    mirrorLocal(key,'');
    applyAsset(key,'',{persist:false});
    toast('Afbeelding op dit toestel verwijderd');
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
  if(note) note.textContent='Deze afbeeldingen worden centraal opgeslagen. Iedereen ziet automatisch hetzelfde Snazzle-uiterlijk.';
}

async function recoverLocalKeyIfNeeded(key,remoteData={}){
  const local=readLocal(key);
  if(!local || !currentIsSuperAdmin) return false;
  // Als de cloud geen bruikbaar beeld heeft, is de nog aanwezige beheer-kopie de herstelbron.
  if(remoteData?.dataUrl) return false;
  try{
    await saveCentralValue(key,local,{recovered:true});
    return true;
  }catch(err){
    console.warn('Snazzle hoofdbeeld herstel',key,err);
    return false;
  }
}

function startListeners(){
  if(listenersStarted) return;
  listenersStarted=true;
  ASSETS.forEach(key=>{
    onSnapshot(assetRef(key),async snap=>{
      if(!snap.exists()){
        const local=preserveLocalAsset(key);
        if(local && currentIsSuperAdmin) await recoverLocalKeyIfNeeded(key,{});
        return;
      }
      const data=snap.data()||{};
      const src=String(data.dataUrl||'');
      if(src){
        applyAsset(key,src,{persist:true});
        return;
      }

      const local=preserveLocalAsset(key);
      if(local){
        // Ook een oud 'cleared' document mag een nog aanwezige beheer-kopie niet meer wissen.
        if(currentIsSuperAdmin) await recoverLocalKeyIfNeeded(key,data);
        return;
      }

      // Geen lokale herstelbron: dan is een expliciet centraal verwijderd beeld echt leeg.
      if(data.cleared===true) applyAsset(key,'',{persist:false});
    },err=>console.warn('Centraal Snazzle-beeld niet geladen',key,err));
  });
}

async function migrateOwnersLocalAssets(user){
  if(recovering) return 0;
  recovering=true;
  let uploaded=0;
  try{
    const adminSnap=await getDoc(doc(db,'adminUsers',user.uid));
    const admin=adminSnap.data();
    if(!adminSnap.exists() || admin?.active!==true || admin?.role!=='superadmin') return 0;
    currentIsSuperAdmin=true;
    for(const key of ASSETS){
      const local=readLocal(key);
      if(!local) continue;
      const target=assetRef(key);
      const snap=await getDoc(target);
      const data=snap.exists() ? (snap.data()||{}) : {};
      // Iedere nog aanwezige lokale beheer-kopie mag een ontbrekend/leeg oud document herstellen.
      if(!snap.exists() || !data.dataUrl){
        await saveCentralValue(key,local,{migrated:true,recovered:snap.exists()});
        uploaded++;
      }
    }
    if(uploaded) toast(`${uploaded} hoofdafbeelding${uploaded===1?'':'en'} hersteld en centraal bewaard ✨`);
    return uploaded;
  }catch(err){
    console.warn('Lokale Snazzle-afbeeldingen konden nog niet centraal worden gemigreerd',err);
    return uploaded;
  }finally{
    recovering=false;
  }
}

onAuthStateChanged(auth,async user=>{
  if(!user) return;
  currentIsSuperAdmin=false;
  if(!user.isAnonymous){
    try{
      const adminSnap=await getDoc(doc(db,'adminUsers',user.uid));
      const data=adminSnap.data()||{};
      currentIsSuperAdmin=adminSnap.exists()&&data.active===true&&data.role==='superadmin';
    }catch{}
  }
  startListeners();
  installAdminHandlers();
  if(currentIsSuperAdmin) await migrateOwnersLocalAssets(user);
});

installAdminHandlers();

window.SnazzleCentralAssets={
  reapply(){ ASSETS.forEach(key=>{ if(key in central) applyAsset(key,central[key],{persist:false}); }); },
  recover:async()=>{
    const user=auth.currentUser;
    if(!user||user.isAnonymous) return 0;
    return migrateOwnersLocalAssets(user);
  },
  localStatus:()=>Object.fromEntries(ASSETS.map(key=>[key,!!readLocal(key)]))
};
setTimeout(()=>window.SnazzleCentralAssets.reapply(),800);
setTimeout(()=>window.SnazzleCentralAssets.reapply(),2200);
