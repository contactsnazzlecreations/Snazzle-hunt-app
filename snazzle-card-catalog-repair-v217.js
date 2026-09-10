// Snazzle Cards v217 — herstel ontbrekende standaardkaarten centraal.
// Herstelt alleen ontbrekende kaartnummers en ontbrekende basisvelden; bestaande custom gegevens blijven staan.
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,collection,getDocs,doc,getDoc,writeBatch } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='217-card-catalog-repair';
const WILD=['Trail Blazer','Jungle Jax','Mud Runner','Storm Scout','Boulder Buddy','Night Tracker','River Rush','Forest Flash','Thunder Trek','Shadow Scout','Wild Guardian','Alpha Snazzle'];
const SPARK=['Star Sprinkle','Moon Glow','Dream Dancer','Crystal Pop','Bubble Bloom','Glitter Glide','Comet Dash','Rainbow Rush','Starlight Hug','Aurora Whirl','Sparkle Sprout','Nova Shine'];
let running=false,done=false;

function canonical(world,index){
  const n=index+1;
  const wild=world==='wild';
  const prefix=wild?'W':'S';
  const number=`S01-${prefix}${String(n).padStart(2,'0')}`;
  return {
    id:`seed-${world}-${String(n).padStart(2,'0')}`,
    number,
    name:(wild?WILD:SPARK)[index],
    series:wild?'WILD Series 01':'SPARK Series 01',
    description:wild?'Avontuur & actie':'Glans & fantasie',
    rarity:index<8?'core':'rare',
    unlockType:'milestone',
    huntId:'',
    threshold:n,
    world,
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
    snap.docs.forEach(d=>{
      const data=d.data()||{};
      const key=norm(data.number);
      if(key&&!byNumber.has(key))byNumber.set(key,{ref:d.ref,data});
    });

    const batch=writeBatch(db);
    let changes=0,created=0,patched=0;
    const now=new Date().toISOString();

    for(const std of STANDARD){
      const hit=byNumber.get(norm(std.number));
      if(!hit){
        batch.set(doc(db,'snazzleCards',std.id),{...std,createdAt:now,updatedAt:now});
        changes++;created++;
        continue;
      }
      const cur=hit.data||{};
      const patch={};
      if(!cur.name)patch.name=std.name;
      if(!cur.series)patch.series=std.series;
      if(!cur.description)patch.description=std.description;
      if(!cur.rarity)patch.rarity=std.rarity;
      if(!cur.unlockType)patch.unlockType=std.unlockType;
      if(cur.threshold===undefined||cur.threshold===null||cur.threshold==='')patch.threshold=std.threshold;
      if(cur.secretName===undefined)patch.secretName=false;
      if(cur.active===false)patch.active=true;
      if(!cur.world)patch.world=std.world;
      if(Object.keys(patch).length){
        patch.updatedAt=now;
        patch.seedVersion=VERSION;
        batch.set(hit.ref,patch,{merge:true});
        changes++;patched++;
      }
    }

    if(changes)await batch.commit();
    done=true;
    window.__snazzleCardCatalogRepairV217={version:VERSION,total:STANDARD.length,changes,created,patched,done:true};
    console.info(`Snazzle Cards v217: ${STANDARD.length} standaardkaarten gecontroleerd; ${created} toegevoegd, ${patched} hersteld.`);
    document.dispatchEvent(new CustomEvent('snazzle:cards-repaired',{detail:window.__snazzleCardCatalogRepairV217}));
    [100,400,1000,2200].forEach(ms=>setTimeout(()=>window.SnazzleCardFixedV205?.repair?.(),ms));
  }catch(err){
    console.error('Snazzle Cards v217 catalogus-herstel mislukt',err);
    window.__snazzleCardCatalogRepairV217={version:VERSION,error:String(err?.message||err),done:false};
  }finally{running=false;}
}

function start(){
  const app=getApps().length?getApp():null;
  if(!app)return;
  const auth=getAuth(app),db=getFirestore(app);
  onAuthStateChanged(auth,async user=>{
    try{
      if(await isSuperAdmin(db,user))await repair(db);
    }catch(err){console.warn('Snazzle Cards v217 admincontrole',err);}
  });
}

window.SnazzleCardCatalogRepairV217={version:VERSION,count:STANDARD.length,repair:()=>{
  const app=getApps().length?getApp():null;
  if(!app)return Promise.resolve(false);
  return repair(getFirestore(app));
}};
start();
