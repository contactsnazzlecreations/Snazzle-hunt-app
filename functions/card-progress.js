const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const REGION = 'europe-west1';
const STRUCTURE_VERSION = '1.0.0';
const BASE_COLLECTION_SIZE = 48;
const SERIES_SIZE = 12;

const RARITY_BY_POSITION = {
  1:'core',2:'core',3:'core',4:'core',5:'core',6:'core',
  7:'rare',8:'rare',9:'silver',10:'silver',11:'gold',12:'platinum'
};

const SERIES = {
  wild:{prefix:'W',label:'WILD',description:'Avontuur & actie',earnType:'ar',names:[
    'Trail Blazer','Jungle Jax','Mud Runner','Storm Scout','Boulder Buddy','Night Tracker',
    'River Rush','Forest Flash','Thunder Trek','Shadow Scout','Wild Guardian','Alpha Snazzle'
  ]},
  spark:{prefix:'S',label:'SPARK',description:'Glans & fantasie',earnType:'hunt',names:[
    'Star Sprinkle','Moon Glow','Dream Dancer','Crystal Pop','Bubble Bloom','Glitter Glide',
    'Comet Dash','Rainbow Rush','Starlight Hug','Aurora Whirl','Sparkle Sprout','Nova Shine'
  ]},
  mystic:{prefix:'M',label:'MYSTIC',description:'Magie, maanlicht & mysterie',earnType:'event',names:[
    'Moon Whisper','Crystal Dream','Mystic Glow','Shadow Spell','Star Oracle','Dream Keeper',
    'Phantom Flash','Magic Mist','Lunar Legend','Secret Spirit','Mystic Guardian','Mystic Master'
  ]},
  blaze:{prefix:'B',label:'BLAZE',description:'Vuur, snelheid & lef',earnType:'challenge',names:[
    'Flame Runner','Ember Dash','Fire Jumper','Heat Rider','Lava Leap','Spark Striker',
    'Blazing Bolt','Inferno Rush','Firestorm Fury','Crimson Blaze','Flame Guardian','Blaze Master'
  ]}
};

// Eerste vaste BLAZE-challenges. Later kan Beheer de inhoud uitbreiden, maar 1 challenge = 1 kaart blijft vast.
const BLAZE_CHALLENGES = [
  {id:'blaze-01',label:'Eerste vonk',minHunts:1,minAr:0},
  {id:'blaze-02',label:'Dubbele sprint',minHunts:2,minAr:0},
  {id:'blaze-03',label:'AR-ontsteking',minHunts:0,minAr:1},
  {id:'blaze-04',label:'Hete reeks',minHunts:4,minAr:0},
  {id:'blaze-05',label:'Dubbele AR-vangst',minHunts:0,minAr:2},
  {id:'blaze-06',label:'Zes op rij',minHunts:6,minAr:0},
  {id:'blaze-07',label:'Drievoudige AR',minHunts:0,minAr:3},
  {id:'blaze-08',label:'Acht Hunts',minHunts:8,minAr:0},
  {id:'blaze-09',label:'Vier AR-vangsten',minHunts:0,minAr:4},
  {id:'blaze-10',label:'Tien Hunts',minHunts:10,minAr:0},
  {id:'blaze-11',label:'Vuurproef',minHunts:10,minAr:5},
  {id:'blaze-12',label:'Blaze Master',minHunts:12,minAr:6}
];

function pad(n){ return String(n).padStart(2,'0'); }
function cardNumber(seriesKey,index){ return `S01-${SERIES[seriesKey].prefix}${pad(index)}`; }
function cardId(seriesKey,index){ return `seed-${seriesKey}-${pad(index)}`; }
function allCardDefs(){
  return Object.entries(SERIES).flatMap(([seriesKey,meta])=>meta.names.map((name,i)=>({
    seriesKey,
    index:i+1,
    number:cardNumber(seriesKey,i+1),
    name,
    series:`${meta.label} Series 01`,
    description:meta.description,
    rarity:RARITY_BY_POSITION[i+1],
    earnType:meta.earnType
  })));
}
const BASE_CARDS = allCardDefs();
const BY_NUMBER = new Map(BASE_CARDS.map(c=>[c.number,c]));

function norm(value){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').trim();
}
function dateValue(data){
  const raw=data?.foundAt||data?.updatedAt||data?.createdAt||data?.start||'';
  const d=raw?.toDate ? raw.toDate() : new Date(raw||0);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}
function sameValue(a,b){
  if(a===b)return true;
  if(a==null&&b==null)return true;
  return String(a??'')===String(b??'');
}

async function ensureCanonicalCatalog(db){
  const snap=await db.collection('snazzleCards').get();
  const byNumber=new Map();
  snap.forEach(d=>{
    const data=d.data()||{};
    const number=String(data.number||'').toUpperCase();
    if(number&&!byNumber.has(number))byNumber.set(number,{ref:d.ref,data});
  });

  const batch=db.batch();
  let writes=0;
  const result=new Map();
  for(const def of BASE_CARDS){
    const hit=byNumber.get(def.number);
    const ref=hit?.ref||db.collection('snazzleCards').doc(cardId(def.seriesKey,def.index));
    const old=hit?.data||{};
    const patch={
      id:old.id||ref.id,
      number:def.number,
      name:def.name,
      series:def.series,
      description:def.description,
      rarity:def.rarity,
      active:true,
      secretName:false,
      baseCollection:true,
      seriesKey:def.seriesKey,
      structureVersion:STRUCTURE_VERSION
    };
    if(def.seriesKey==='wild'){
      patch.unlockType='ar';
      patch.threshold=0;
    }else if(def.seriesKey==='spark'){
      patch.unlockType='milestone';
      patch.threshold=def.index;
    }else if(def.seriesKey==='mystic'){
      patch.unlockType='event';
      patch.threshold=0;
      if(!hit)patch.huntId='';
    }else{
      patch.unlockType='challenge';
      patch.challengeId=`blaze-${pad(def.index)}`;
      patch.threshold=0;
    }

    const changed=!hit||Object.entries(patch).some(([k,v])=>!sameValue(old[k],v));
    if(changed){
      batch.set(ref,{
        ...patch,
        updatedAt:FieldValue.serverTimestamp(),
        ...(!hit?{createdAt:FieldValue.serverTimestamp()}:{}),
      },{merge:true});
      writes++;
    }
    result.set(def.number,{id:ref.id,...old,...patch});
  }
  if(writes)await batch.commit();
  return result;
}

async function userWins(db,uid){
  const snap=await db.collection('hunts').where('foundByUserId','==',uid).get();
  const wins=[];
  snap.forEach(d=>{
    const data=d.data()||{};
    if(data.found===true&&data.mode!=='draft')wins.push({id:d.id,...data});
  });
  wins.sort((a,b)=>dateValue(a)-dateValue(b)||String(a.id).localeCompare(String(b.id)));
  return wins;
}

async function userAr(db,uid,extraAr=[]){
  const snap=await db.collection('users').doc(uid).get();
  const data=snap.exists?(snap.data()||{}):{};
  const list=Array.isArray(data.arCollectionV1)?data.arCollectionV1:[];
  const map=new Map();
  [...list,...extraAr].forEach(raw=>{
    const id=String(raw?.id||raw?.pointId||'').trim();
    if(!id)return;
    const item={
      id,
      pointId:id,
      number:String(raw?.number||''),
      name:String(raw?.name||raw?.snazzleName||''),
      caughtAt:raw?.caughtAt||raw?.foundAt||''
    };
    if(!map.has(id))map.set(id,item);
  });
  return [...map.values()].sort((a,b)=>String(a.caughtAt||'').localeCompare(String(b.caughtAt||'')));
}

async function arWorld(db){
  const snap=await db.collection('hunts').doc('snazzle_ar_world_v1').get();
  const data=snap.exists?(snap.data()||{}):{};
  return Array.isArray(data.points)?data.points.filter(p=>p?.id):[];
}

function blazeCompleted(challenge,huntsCount,arCount){
  return huntsCount>=Number(challenge.minHunts||0)&&arCount>=Number(challenge.minAr||0);
}

async function syncUserCardProgress(db,uid,{reason='sync',extraAr=[]}={}){
  if(!uid)return null;
  const [catalog,wins,arItems,world,migrationSnap,unlockSnap,rewardSnap]=await Promise.all([
    ensureCanonicalCatalog(db),
    userWins(db,uid),
    userAr(db,uid,extraAr),
    arWorld(db),
    db.collection('userCardMigrations').doc(uid).get(),
    db.collection('userCardUnlocks').where('userId','==',uid).get(),
    db.collection('userCardRewards').where('userId','==',uid).get()
  ]);

  const unlocked=new Map();
  unlockSnap.forEach(d=>{
    const x=d.data()||{};
    if(BY_NUMBER.has(String(x.cardNumber||'').toUpperCase()))unlocked.set(String(x.cardNumber).toUpperCase(),{id:d.id,...x});
  });
  const existingRewards=new Set();
  rewardSnap.forEach(d=>existingRewards.add(String((d.data()||{}).rewardId||d.id)));

  const proposals=new Map();
  const propose=(number,sourceType,sourceId)=>{
    const n=String(number||'').toUpperCase();
    if(!BY_NUMBER.has(n)||unlocked.has(n)||proposals.has(n))return;
    proposals.set(n,{sourceType:String(sourceType||'progress'),sourceId:String(sourceId||reason||'progress')});
  };

  // Eerste migratie: bestaande zichtbare milestone-voortgang blijft behouden en wordt permanent.
  // Dit gebeurt éénmalig, zodat toekomstige MYSTIC/BLAZE-kaarten alleen nog via hun eigen mechanisme openen.
  const legacyMigration=!migrationSnap.exists;
  if(legacyMigration){
    const oldCount=Math.min(SERIES_SIZE,wins.length);
    for(let i=1;i<=oldCount;i++){
      propose(cardNumber('spark',i),'migration','legacy-hunt-progress');
      propose(cardNumber('mystic',i),'migration','legacy-hunt-progress');
      propose(cardNumber('blaze',i),'migration','legacy-hunt-progress');
    }
  }

  // WILD: vaste koppeling aan een AR-punt. Een expliciet arPointId in Beheer heeft voorrang;
  // anders wordt W01..W12 gekoppeld aan de eerste twaalf actieve AR-punten in de centrale AR-wereld.
  const arById=new Map(arItems.map(x=>[String(x.id),x]));
  for(let i=1;i<=SERIES_SIZE;i++){
    const number=cardNumber('wild',i),card=catalog.get(number)||{};
    const targetId=String(card.arPointId||world[i-1]?.id||'');
    let hit=targetId?arById.get(targetId):null;
    if(!hit){
      hit=arItems.find(item=>
        (item.number&&String(item.number).toUpperCase()===number) ||
        (item.name&&norm(item.name)===norm(card.name||BY_NUMBER.get(number)?.name))
      );
    }
    if(hit)propose(number,'ar',hit.id);
  }

  // MYSTIC: alleen de specifiek gekoppelde Mystery/Special Hunt of Event.
  const winIds=new Set(wins.map(x=>x.id));
  const mysticHuntIds=new Set();
  for(let i=1;i<=SERIES_SIZE;i++){
    const number=cardNumber('mystic',i),card=catalog.get(number)||{};
    const huntId=String(card.huntId||'').trim();
    if(huntId){
      mysticHuntIds.add(huntId);
      if(winIds.has(huntId))propose(number,'event',huntId);
    }
    const rewarded=wins.find(h=>String(h.rewardCardNumber||h.cardNumber||'').toUpperCase()===number);
    if(rewarded)propose(number,'event',rewarded.id);
  }

  // SPARK: gewone bevestigde Hunts; Hunts die expliciet aan MYSTIC zijn gekoppeld tellen niet mee.
  const ordinaryWins=wins.filter(h=>!mysticHuntIds.has(h.id));
  const sparkCount=Math.min(SERIES_SIZE,ordinaryWins.length);
  for(let i=1;i<=sparkCount;i++){
    propose(cardNumber('spark',i),'hunt',ordinaryWins[i-1]?.id||`hunt-${i}`);
  }

  // BLAZE: vaste Challenges op basis van server-bevestigde Hunt- en AR-activiteit.
  for(let i=1;i<=SERIES_SIZE;i++){
    const challenge=BLAZE_CHALLENGES[i-1];
    if(blazeCompleted(challenge,wins.length,arItems.length)){
      propose(cardNumber('blaze',i),'challenge',challenge.id);
    }
  }

  const combined=new Set([...unlocked.keys(),...proposals.keys()]);
  const counts={wild:0,spark:0,mystic:0,blaze:0,total:0};
  combined.forEach(number=>{
    const def=BY_NUMBER.get(number);if(!def)return;
    counts[def.seriesKey]++;
    counts.total++;
  });

  const rewardProposals=[];
  for(const seriesKey of Object.keys(SERIES)){
    if(counts[seriesKey]>=6){
      const rewardId=`series_${seriesKey}_6`;
      if(!existingRewards.has(rewardId))rewardProposals.push({rewardId,kind:'series_half_badge',seriesKey,at:6});
    }
    if(counts[seriesKey]>=12){
      const rewardId=`series_${seriesKey}_12`;
      if(!existingRewards.has(rewardId))rewardProposals.push({rewardId,kind:'series_master',seriesKey,at:12,vaultKey:true});
    }
  }
  if(counts.total>=BASE_COLLECTION_SIZE&&!existingRewards.has('master_collector_48')){
    rewardProposals.push({rewardId:'master_collector_48',kind:'master_collector',at:48,profileFrame:true,vaultCard:true});
  }

  const batch=db.batch();
  const now=FieldValue.serverTimestamp();
  for(const [number,source] of proposals){
    const def=BY_NUMBER.get(number);
    const ref=db.collection('userCardUnlocks').doc(`${uid}_${number}`);
    batch.set(ref,{
      userId:uid,
      cardNumber:number,
      seriesKey:def.seriesKey,
      rarity:def.rarity,
      unlockedAt:now,
      sourceType:source.sourceType,
      sourceId:source.sourceId,
      structureVersion:STRUCTURE_VERSION
    },{merge:false});
  }
  for(const reward of rewardProposals){
    const ref=db.collection('userCardRewards').doc(`${uid}_${reward.rewardId}`);
    batch.set(ref,{
      userId:uid,
      ...reward,
      earnedAt:now,
      structureVersion:STRUCTURE_VERSION
    },{merge:false});
  }
  if(legacyMigration){
    batch.set(db.collection('userCardMigrations').doc(uid),{
      userId:uid,
      from:'legacy-card-logic',
      to:STRUCTURE_VERSION,
      migratedAt:now,
      legacyHuntCount:wins.length
    },{merge:false});
  }
  if(proposals.size||rewardProposals.length||legacyMigration)await batch.commit();

  return {
    ok:true,
    structureVersion:STRUCTURE_VERSION,
    baseCollectionSize:BASE_COLLECTION_SIZE,
    counts,
    newUnlocks:[...proposals.keys()],
    newRewards:rewardProposals.map(x=>x.rewardId),
    migrated:legacyMigration,
    reason
  };
}

const syncCardProgress=onCall({region:REGION},async request=>{
  const uid=request.auth?.uid;
  if(!uid)throw new HttpsError('unauthenticated','Log eerst in om je kaartcollectie te synchroniseren.');
  return syncUserCardProgress(getFirestore(),uid,{reason:String(request.data?.reason||'app-sync').slice(0,60)});
});

const syncCardsAfterHunt=onDocumentUpdated({document:'hunts/{huntId}',region:REGION},async event=>{
  const before=event.data?.before?.data()||{};
  const after=event.data?.after?.data()||{};
  const uid=String(after.foundByUserId||'');
  if(!uid||after.found!==true)return;
  if(before.found===true&&before.foundByUserId===uid)return;
  await syncUserCardProgress(getFirestore(),uid,{reason:`hunt:${event.params.huntId}`});
});

const syncCardsAfterArFinding=onDocumentCreated({document:'snazzleArFindings/{findingId}',region:REGION},async event=>{
  const data=event.data?.data()||{};
  const pointId=String(data.pointId||'');
  const findingId=String(event.params.findingId||'');
  const prefix=pointId?`${pointId}_`:'';
  const uid=prefix&&findingId.startsWith(prefix)?findingId.slice(prefix.length):'';
  if(!uid)return;
  await syncUserCardProgress(getFirestore(),uid,{
    reason:`ar:${pointId}`,
    extraAr:[{id:pointId,pointId,number:data.number,name:data.snazzleName,foundAt:data.foundAt}]
  });
});

module.exports={syncCardProgress,syncCardsAfterHunt,syncCardsAfterArFinding};
