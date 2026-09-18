const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');

const WORLD_ID = 'snazzle_ar_world_v1';
const ALLOWED_RARITIES = new Set(['COMMON','UNCOMMON','RARE','EPIC','GOLD','PLATINUM','BLACK','LEGENDARY','SECRET']);

function text(value,max=120){
  return String(value ?? '').trim().slice(0,max);
}
function finite(value,min,max,label){
  const n=Number(value);
  if(!Number.isFinite(n)||n<min||n>max)throw new HttpsError('invalid-argument',label);
  return n;
}
async function requireSuperAdmin(db,uid){
  if(!uid)throw new HttpsError('unauthenticated','Log eerst in via Snazzle Beheer.');
  const snap=await db.collection('adminUsers').doc(uid).get();
  const admin=snap.exists?(snap.data()||{}):{};
  if(admin.active!==true||admin.role!=='superadmin'){
    throw new HttpsError('permission-denied','Alleen de actieve hoofdbeheerder kan AR-Snazzles plaatsen.');
  }
  return admin;
}
function cleanPlacement(raw={}){
  const mode=raw.mode==='camera-composed'?'camera-composed':'map-only';
  const base={
    version:7,
    mode,
    x:finite(raw.x??.5,0,1,'Ongeldige horizontale plaatsing.'),
    y:finite(raw.y??.5,0,1,'Ongeldige verticale plaatsing.'),
    size:finite(raw.size??.34,.02,1.5,'Ongeldige grootte.'),
    rotation:finite(raw.rotation??0,-180,180,'Ongeldige draaiing.'),
    placedAt:new Date().toISOString()
  };
  if(mode==='camera-composed'&&Number.isFinite(Number(raw.sourceX))&&Number.isFinite(Number(raw.sourceY))&&Number.isFinite(Number(raw.sourceSize))){
    base.sourceX=finite(raw.sourceX,0,1,'Ongeldige cameracoördinaat.');
    base.sourceY=finite(raw.sourceY,0,1,'Ongeldige cameracoördinaat.');
    base.sourceSize=finite(raw.sourceSize,.02,1.5,'Ongeldige cameragrootte.');
    if(Number.isFinite(Number(raw.videoAspect)))base.videoAspect=finite(raw.videoAspect,.2,5,'Ongeldige cameraverhouding.');
  }
  return base;
}

const saveArPoint = onCall({region:'europe-west1'},async request=>{
  const uid=request.auth?.uid;
  const db=getFirestore();
  await requireSuperAdmin(db,uid);

  const raw=request.data?.point||{};
  const id=text(raw.id,80);
  const name=text(raw.name,50);
  const number=text(raw.number||'—',16)||'—';
  const rarity=text(raw.rarity||'COMMON',20).toUpperCase();
  const village=text(raw.village||'Algemeen',60)||'Algemeen';
  const imageUrl=text(raw.imageUrl||'',2200);
  if(!/^ar_[a-z0-9_\-]+$/i.test(id))throw new HttpsError('invalid-argument','Ongeldig AR-puntnummer.');
  if(name.length<2)throw new HttpsError('invalid-argument','Vul een Snazzle-naam in.');
  if(!ALLOWED_RARITIES.has(rarity))throw new HttpsError('invalid-argument','Ongeldige zeldzaamheid.');
  const radius=finite(raw.radius??7,4,100,'Vangzone moet tussen 4 en 100 meter liggen.');
  const lat=finite(raw.lat,-90,90,'Ongeldige breedtegraad.');
  const lon=finite(raw.lon,-180,180,'Ongeldige lengtegraad.');
  const accuracy=finite(raw.accuracy??0,0,10000,'Ongeldige GPS-nauwkeurigheid.');
  const placement=cleanPlacement(raw.placement||{});
  const now=new Date().toISOString();

  const point={id,name,number,rarity,village,radius,lat,lon,accuracy,imageUrl,active:true,placement,createdAt:now,updatedAt:now,createdBy:uid};
  const ref=db.collection('hunts').doc(WORLD_ID);
  let count=0;
  await db.runTransaction(async tx=>{
    const snap=await tx.get(ref);
    const data=snap.exists?(snap.data()||{}):{};
    const points=Array.isArray(data.points)?data.points:[];
    if(points.some(p=>p?.id===id))throw new HttpsError('already-exists','Dit AR-punt bestaat al.');
    if(points.length>=800)throw new HttpsError('resource-exhausted','Het maximale aantal AR-punten is bereikt.');
    const next=[...points,point];count=next.length;
    tx.set(ref,{
      _snazzleInternalType:'arWorld',
      title:'[SYSTEEM] AR-WERELD',
      village:'snazzle-internal',
      description:'Interne opslag voor permanente Snazzle AR-punten',
      rule:'',hint:'',foundMessage:'',imageUrl:'',start:'',end:'',mode:'draft',
      version:10,
      points:next,
      updatedAt:now,
      updatedBy:uid
    },{merge:true});
  });

  return{ok:true,id,pointCount:count};
});

module.exports={saveArPoint};
