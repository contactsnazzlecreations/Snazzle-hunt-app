// Snazzle BLAZE sync v236 — één gerichte beheer-sync volgens definitieve 48-kaartenstructuur.
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,collection,doc,getDoc,getDocs,writeBatch } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='236.0-single-sync';
const LOCAL_KEY='snazzleCardCatalogV2';
const DEFS=[
  ['S01-B01','Flame Runner','core'],['S01-B02','Ember Dash','core'],['S01-B03','Fire Jumper','core'],['S01-B04','Heat Rider','core'],
  ['S01-B05','Lava Leap','core'],['S01-B06','Spark Striker','core'],['S01-B07','Blazing Bolt','rare'],['S01-B08','Inferno Rush','rare'],
  ['S01-B09','Firestorm Fury','silver'],['S01-B10','Crimson Blaze','silver'],['S01-B11','Flame Guardian','gold'],['S01-B12','Blaze Master','platinum']
];
const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
let busy=false,lastSyncedUid='';

function localCards(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
async function isSuperAdmin(u){
  if(!u||u.isAnonymous||!db)return false;
  try{const s=await getDoc(doc(db,'adminUsers',u.uid));return s.exists()&&s.data().active===true&&s.data().role==='superadmin'}catch{return false}
}
async function sync(u,{force=false}={}){
  if(busy||!db||!u||u.isAnonymous)return false;
  if(!force&&lastSyncedUid===u.uid)return true;
  if(!(await isSuperAdmin(u)))return false;
  busy=true;
  try{
    const local=localCards(),byNo=new Map(local.map(c=>[String(c.number||'').toUpperCase(),c]));
    const snap=await getDocs(collection(db,'snazzleCards')),centralByNo=new Map(snap.docs.map(d=>[String(d.data().number||'').toUpperCase(),d]));
    const batch=writeBatch(db),now=new Date().toISOString();let changes=0;
    DEFS.forEach(([number,name,rarity],i)=>{
      const lc=byNo.get(number)||{},found=centralByNo.get(number),old=found?.data?.()||{},id=found?.id||lc.id||`seed-blaze-${String(i+1).padStart(2,'0')}`;
      const desired={
        id,number,name,series:'BLAZE Series 01',description:'Vuur, snelheid & lef',rarity,
        unlockType:'challenge',challengeId:`blaze-${String(i+1).padStart(2,'0')}`,huntId:'',threshold:0,
        active:true,secretName:false,baseCollection:true,seriesKey:'blaze',structureVersion:'1.0.0',
        imageData:lc.imageData||old.imageData||'',createdAt:old.createdAt||lc.createdAt||now
      };
      const changed=!found||Object.entries(desired).some(([k,v])=>String(old[k]??'')!==String(v??''));
      if(changed){batch.set(doc(db,'snazzleCards',id),{...desired,updatedAt:now},{merge:true});changes++;}
    });
    if(changes)await batch.commit();
    lastSyncedUid=u.uid;
    window.dispatchEvent(new CustomEvent('snazzle:blaze-ready',{detail:{version:VERSION,count:12,synced:true,changes}}));
    window.SnazzleCardProgressV234?.render?.();
    console.info(`BLAZE Series 01 gecontroleerd: ${changes} wijziging(en)`);
    return true;
  }catch(e){console.warn('BLAZE centrale sync wacht op beheerrechten',e);return false}
  finally{busy=false}
}
if(auth)onAuthStateChanged(auth,u=>{
  if(!u||u.isAnonymous){lastSyncedUid='';return;}
  setTimeout(()=>sync(u),500);
});
window.SnazzleBlazeSyncV228={version:VERSION,sync:(u=auth?.currentUser)=>sync(u,{force:true})};
