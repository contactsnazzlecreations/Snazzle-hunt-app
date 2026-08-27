// Snazzle Cards migratie V1 -> V2.
// Behoudt oudere lokale uploads, maakt ze zichtbaar in de V2-collectie
// en synchroniseert ze centraal zodra de hoofdbeheerder is ingelogd.
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,doc,getDoc,setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='1.0.0';
const KEY_V1='snazzleCardCatalogV1';
const KEY_V2='snazzleCardCatalogV2';
const MIGRATION_MARK='snazzleCardMigrationV1V2';
const CENTRAL_MARK='snazzleCardMigrationV1V2Central';

function readCards(key){
  try{
    const value=JSON.parse(localStorage.getItem(key)||'[]');
    return Array.isArray(value)?value:[];
  }catch{return [];}
}
function cleanSlug(value){
  return String(value||'snazzle').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'snazzle';
}
function stableHash(value){
  let h=2166136261;
  for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  return (h>>>0).toString(36);
}
function normalizeCard(card,index){
  const c={...(card||{})};
  if(!c.id)c.id=`legacy-${cleanSlug(c.number||c.name||index+1)}-${stableHash(`${c.number||''}|${c.name||''}|${c.series||''}|${index}`)}`;
  c.number=String(c.number||`SNZ-${index+1}`).trim().toUpperCase();
  c.name=String(c.name||'Snazzle Card').trim();
  c.series=String(c.series||'Snazzle Series 01').trim();
  c.rarity=['core','rare','silver','gold','platinum'].includes(c.rarity)?c.rarity:'core';
  c.unlockType=['hunt','event','shop','milestone','special'].includes(c.unlockType)?c.unlockType:'hunt';
  c.huntId=String(c.huntId||'');
  c.threshold=Math.max(0,Number(c.threshold)||0);
  c.active=c.active!==false;
  c.updatedAt=c.updatedAt||new Date().toISOString();
  c.createdAt=c.createdAt||c.updatedAt;
  return c;
}

const legacy=readCards(KEY_V1).map(normalizeCard);
const current=readCards(KEY_V2).map(normalizeCard);
const mergedMap=new Map();
legacy.forEach(c=>mergedMap.set(c.id,c));
current.forEach(c=>mergedMap.set(c.id,c)); // V2 wint bij een bestaand id.
const merged=[...mergedMap.values()];
const migratedIds=legacy.filter(c=>!current.some(v=>v.id===c.id)).map(c=>c.id);

if(legacy.length){
  try{
    localStorage.setItem(KEY_V2,JSON.stringify(merged));
    localStorage.setItem(MIGRATION_MARK,JSON.stringify({version:VERSION,at:new Date().toISOString(),legacy:legacy.length,total:merged.length}));
    console.info(`Snazzle Cards migratie: ${legacy.length} oude kaart(en) meegenomen naar V2.`);
  }catch(err){console.warn('Snazzle Cards lokale migratie mislukt',err);}
}

window.SnazzleCardMigrationV2={version:VERSION,legacyCount:legacy.length,totalCount:merged.length,migratedIds};

const app=getApps().length?getApp():null;
if(app&&merged.length){
  const auth=getAuth(app),db=getFirestore(app);
  let synced=false;
  onAuthStateChanged(auth,async user=>{
    if(!user||user.isAnonymous||synced)return;
    try{
      const adminSnap=await getDoc(doc(db,'adminUsers',user.uid));
      const profile=adminSnap.exists()?adminSnap.data():null;
      if(profile?.active!==true||profile?.role!=='superadmin')return;
      for(const card of merged){
        await setDoc(doc(db,'snazzleCards',card.id),card,{merge:true});
      }
      synced=true;
      localStorage.setItem(CENTRAL_MARK,JSON.stringify({version:VERSION,at:new Date().toISOString(),count:merged.length}));
      console.info(`Snazzle Cards migratie: ${merged.length} kaart(en) centraal gesynchroniseerd.`);
    }catch(err){console.warn('Snazzle Cards centrale migratie wacht op geldige beheerlogin',err);}
  });
}
