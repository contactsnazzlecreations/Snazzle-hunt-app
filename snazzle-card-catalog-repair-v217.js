// Snazzle Cards v217.2 — herstel WILD/SPARK volgens definitieve 48-kaartenstructuur.
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,collection,getDocs,doc,getDoc,writeBatch } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='217.2-final-48-structure';
const WILD=['Trail Blazer','Jungle Jax','Mud Runner','Storm Scout','Boulder Buddy','Night Tracker','River Rush','Forest Flash','Thunder Trek','Shadow Scout','Wild Guardian','Alpha Snazzle'];
const SPARK=['Star Sprinkle','Moon Glow','Dream Dancer','Crystal Pop','Bubble Bloom','Glitter Glide','Comet Dash','Rainbow Rush','Starlight Hug','Aurora Whirl','Sparkle Sprout','Nova Shine'];
const rarity=i=>i<6?'core':i<8?'rare':i<10?'silver':i===10?'gold':'platinum';
let running=false,done=false;

function canonical(world,index){
  const n=index+1,wild=world==='wild',prefix=wild?'W':'S';
  return {
    id:`seed-${world}-${String(n).padStart(2,'0')}`,
    number:`S01-${prefix}${String(n).padStart(2,'0')}`,
    name:(wild?WILD:SPARK)[index],
    series:wild?'WILD Series 01':'SPARK Series 01',
    description:wild?'Avontuur & actie':'Glans & fantasie',
    rarity:rarity(index),
    unlockType:wild?'ar':'milestone',
    huntId:'',
    threshold:wild?0:n,
    world,
    baseCollection:true,
    seriesKey:world,
    structureVersion:'1.0.0',
    active:true,
    secretName:false,
    seedVersion:VERSION
  };
}
const STANDARD=[...Array.from({length:12},(_,i)=>canonical('spark',i)),...Array.from({length:12},(_,i)=>canonical('wild',i))];
const norm=v=>String(v||'').trim().toUpperCase();

async function isSuperAdmin(db,user){
  if(!user||user.isAnonymous)return false;
  const s=await getDoc(doc(db,'adminUsers',user.uid));
  const p=s.exists()?s.data():null;
  return p?.active===true&&p?.role==='superadmin';
}

async function repair(db){
  if(running||done)return;
  running=true;
  try{
    const snap=await getDocs(collection(db,'snazzleCards'));
    const byNumber=new Map();
    snap.docs.forEach(d=>{const data=d.data()||{},key=norm(data.number);if(key&&!byNumber.has(key))byNumber.set(key,{ref:d.ref,data});});
    const batch=writeBatch(db);let changes=0,created=0,patched=0;const now=new Date().toISOString();
    for(const std of STANDARD){
      const hit=byNumber.get(norm(std.number));
      if(!hit){batch.set(doc(db,'snazzleCards',std.id),{...std,createdAt:now,updatedAt:now});changes++;created++;continue;}
      const cur=hit.data||{};
      const patch={
        name:std.name,series:std.series,description:std.description,rarity:std.rarity,
        unlockType:std.unlockType,threshold:std.threshold,baseCollection:true,seriesKey:std.seriesKey,
        structureVersion:'1.0.0',active:true,secretName:false,world:std.world,seedVersion:VERSION
      };
      if(std.world==='wild'&&cur.arPointId)patch.arPointId=cur.arPointId;
      const changed=Object.entries(patch).some(([k,v])=>String(cur[k]??'')!==String(v??''));
      if(changed){patch.updatedAt=now;batch.set(hit.ref,patch,{merge:true});changes++;patched++;}
    }
    if(changes)await batch.commit();
    done=true;
    window.__snazzleCardCatalogRepairV217={version:VERSION,total:STANDARD.length,changes,created,patched,done:true};
    console.info(`Snazzle Cards v217.2: ${STANDARD.length} WILD/SPARK-kaarten gecontroleerd; ${created} toegevoegd, ${patched} bijgewerkt.`);
    document.dispatchEvent(new CustomEvent('snazzle:cards-repaired',{detail:window.__snazzleCardCatalogRepairV217}));
    [100,400,1000,2200].forEach(ms=>setTimeout(()=>{window.SnazzleCardFixedV205?.repair?.();window.SnazzleCardProgressV234?.render?.();},ms));
  }catch(err){
    console.error('Snazzle Cards v217.2 catalogus-herstel mislukt',err);
    window.__snazzleCardCatalogRepairV217={version:VERSION,error:String(err?.message||err),done:false};
  }finally{running=false;}
}

function start(){
  const app=getApps().length?getApp():null;if(!app)return;
  const auth=getAuth(app),db=getFirestore(app);
  onAuthStateChanged(auth,async user=>{try{if(await isSuperAdmin(db,user))await repair(db);}catch(err){console.warn('Snazzle Cards v217.2 admincontrole',err);}});
}
window.SnazzleCardCatalogRepairV217={version:VERSION,count:STANDARD.length,repair:()=>{
  const app=getApps().length?getApp():null;if(!app)return Promise.resolve(false);return repair(getFirestore(app));
}};
start();
