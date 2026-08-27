// Snazzle Cards v133 — herstelt de teruggevonden WILD- en SPARK-kaarten in de app.
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,doc,getDoc,setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { assets } from './snazzle-card-assets-v133.js';

const VERSION='133-card-restore';
const TARGET_KEY='snazzleCardCatalogV2';
const namesWild=['Trail Blazer','Jungle Jax','Mud Runner','Storm Scout','Boulder Buddy','Night Tracker','River Rush','Forest Flash','Thunder Trek','Shadow Scout','Wild Guardian','Alpha Snazzle'];
const namesSpark=['Star Sprinkle','Moon Glow','Dream Dancer','Crystal Pop','Bubble Bloom','Glitter Glide','Comet Dash','Rainbow Rush','Starlight Hug','Aurora Whirl','Sparkle Sprout','Nova Shine'];

function readLocal(){try{const v=JSON.parse(localStorage.getItem(TARGET_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
const imageCache=new Map();
async function imageFor(key){if(!imageCache.has(key))imageCache.set(key,loadImage(assets[key]));return imageCache.get(key);}
async function crop(key,col,row,cols,rows){
  const im=await imageFor(key);
  const sx=Math.round(im.naturalWidth*col/cols),sy=Math.round(im.naturalHeight*row/rows);
  const sw=Math.max(1,Math.round(im.naturalWidth/cols)),sh=Math.max(1,Math.round(im.naturalHeight/rows));
  const c=document.createElement('canvas');
  c.width=240;c.height=300;
  const ctx=c.getContext('2d');ctx.fillStyle='#132f27';ctx.fillRect(0,0,c.width,c.height);
  ctx.drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);
  return c.toDataURL('image/jpeg',.78);
}
function baseCard({id,number,name,world,rarity,threshold,imageData}){
  const now=new Date().toISOString();
  return {id,number,name,series:world==='wild'?'WILD Series 01':'SPARK Series 01',description:world==='wild'?'Avontuur & actie':'Glans & fantasie',rarity,unlockType:'milestone',huntId:'',threshold,world,active:true,secretName:false,imageData,seedVersion:VERSION,createdAt:now,updatedAt:now};
}
async function buildSeeds(){
  const out=[];
  for(let i=0;i<12;i++){
    const c=i%4,r=Math.floor(i/4);
    out.push(baseCard({id:`seed-wild-${String(i+1).padStart(2,'0')}`,number:`S01-W${String(i+1).padStart(2,'0')}`,name:namesWild[i],world:'wild',rarity:i<8?'core':'rare',threshold:i+1,imageData:await crop('wild',c,r,4,3)}));
  }
  for(let i=0;i<12;i++){
    const c=i%6,r=Math.floor(i/6);
    out.push(baseCard({id:`seed-spark-${String(i+1).padStart(2,'0')}`,number:`S01-S${String(i+1).padStart(2,'0')}`,name:namesSpark[i],world:'spark',rarity:i<8?'core':'rare',threshold:i+1,imageData:await crop('spark',c,r,6,2)}));
  }
  return out;
}

let seeds=[];
try{
  seeds=await buildSeeds();
  const current=readLocal();
  const map=new Map(current.filter(Boolean).map(c=>[c.id,c]));
  for(const seed of seeds){
    const old=map.get(seed.id);
    map.set(seed.id,old?{...seed,...old,imageData:old.imageData||seed.imageData,world:old.world||seed.world}:seed);
  }
  const merged=[...map.values()];
  localStorage.setItem(TARGET_KEY,JSON.stringify(merged));
  localStorage.setItem('snazzleCardRestoreV133',JSON.stringify({version:VERSION,at:new Date().toISOString(),seeded:seeds.length,total:merged.length}));
  window.dispatchEvent(new CustomEvent('snazzle-card-catalog-restored',{detail:{count:seeds.length}}));
  console.info(`Snazzle Cards v133: ${seeds.length} teruggevonden kaarten lokaal hersteld.`);
}catch(err){console.warn('Snazzle Cards v133 lokaal herstel mislukt',err);}

window.SnazzleCardRestoreV133={version:VERSION,count:seeds.length};

const app=getApps().length?getApp():null;
if(app&&seeds.length){
  const auth=getAuth(app),db=getFirestore(app);let syncing=false,done=false;
  onAuthStateChanged(auth,async user=>{
    if(!user||user.isAnonymous||syncing||done)return;
    syncing=true;
    try{
      const a=await getDoc(doc(db,'adminUsers',user.uid));
      const p=a.exists()?a.data():null;
      if(p?.active!==true||p?.role!=='superadmin'){syncing=false;return;}
      for(const card of seeds) await setDoc(doc(db,'snazzleCards',card.id),card,{merge:true});
      done=true;
      localStorage.setItem('snazzleCardRestoreV133Central',JSON.stringify({version:VERSION,at:new Date().toISOString(),count:seeds.length}));
      console.info(`Snazzle Cards v133: ${seeds.length} kaarten centraal hersteld.`);
    }catch(err){console.warn('Snazzle Cards v133 centrale synchronisatie wacht op beheerlogin/rechten',err);}finally{syncing=false;}
  });
}
