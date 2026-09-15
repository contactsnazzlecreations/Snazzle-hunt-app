// Snazzle BLAZE sync v228 — synchroniseert de 12 BLAZE kaarten centraal voor alle spelers.
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,collection,doc,getDoc,getDocs,writeBatch } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='228.0';
const LOCAL_KEY='snazzleCardCatalogV2';
const DEFS=[
  ['S01-B01','Flame Runner','core'],['S01-B02','Ember Dash','core'],['S01-B03','Fire Jumper','core'],['S01-B04','Heat Rider','core'],
  ['S01-B05','Lava Leap','core'],['S01-B06','Spark Striker','core'],['S01-B07','Blazing Bolt','core'],['S01-B08','Inferno Rush','core'],
  ['S01-B09','Firestorm Fury','rare'],['S01-B10','Crimson Blaze','rare'],['S01-B11','Flame Guardian','gold'],['S01-B12','Blaze Master','platinum']
];
const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
let busy=false;

function localCards(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
async function isSuperAdmin(u){if(!u||!db)return false;try{const s=await getDoc(doc(db,'adminUsers',u.uid));return s.exists()&&s.data().active===true&&s.data().role==='superadmin'}catch{return false}}
async function sync(u){
  if(busy||!db||!(await isSuperAdmin(u)))return false;
  busy=true;
  try{
    const local=localCards();
    const byNo=new Map(local.map(c=>[String(c.number||'').toUpperCase(),c]));
    const snap=await getDocs(collection(db,'snazzleCards'));
    const centralByNo=new Map(snap.docs.map(d=>[String(d.data().number||'').toUpperCase(),d]));
    const batch=writeBatch(db),now=new Date().toISOString();
    DEFS.forEach(([number,name,rarity],i)=>{
      const lc=byNo.get(number)||{};
      const found=centralByNo.get(number);
      const old=found?.data?.()||{};
      const id=found?.id||lc.id||`seed-blaze-${String(i+1).padStart(2,'0')}`;
      batch.set(doc(db,'snazzleCards',id),{
        id,number,name,series:'BLAZE Series 01',description:'Vuur, snelheid & lef',rarity,
        unlockType:'milestone',huntId:'',threshold:i+1,active:true,secretName:false,
        imageData:lc.imageData||old.imageData||'',createdAt:old.createdAt||lc.createdAt||now,updatedAt:now
      },{merge:true});
    });
    await batch.commit();
    window.dispatchEvent(new CustomEvent('snazzle:blaze-ready',{detail:{version:VERSION,count:12,synced:true}}));
    console.info('BLAZE Series 01 centraal gesynchroniseerd: 12/12');
    return true;
  }catch(e){console.warn('BLAZE centrale sync wacht op beheerrechten',e);return false}
  finally{busy=false}
}
if(auth)onAuthStateChanged(auth,u=>{if(u)[100,800,2200].forEach(ms=>setTimeout(()=>sync(u),ms))});
window.SnazzleBlazeSyncV228={version:VERSION,sync};
