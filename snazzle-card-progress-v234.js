// Snazzle Cards v235 — permanente 48-kaarten voortgang, vaste rarities en seriebeloningen.
// Serverrecords zijn leidend zodra de Functions live zijn. Tot die tijd bewaart de app dezelfde
// permanente unlock-records veilig in het eigen cloudprofiel, zodat de migratie nu al werkt.
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFunctions,httpsCallable } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js';
import { getFirestore,collection,doc,getDoc,getDocs,setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import {
  CARD_STRUCTURE_VERSION,BASE_COLLECTION_SIZE,SERIES,BASE_CARDS,REWARDS,BLAZE_CHALLENGES,cardDefinition
} from './snazzle-card-structure-v233.js?v=235';

const VERSION='235.0-permanent-48-cloud-fallback';
const LOCAL_KEY='snazzleCardCatalogV2';
const CACHE_KEY='snazzleCardProgressV234Cache';
const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
const functions=app?getFunctions(app,'europe-west1'):null;
const syncFn=functions?httpsCallable(functions,'syncCardProgress'):null;
const stateFn=functions?httpsCallable(functions,'getCardProgressState'):null;
const byNumber=new Map(BASE_CARDS.map(c=>[c.number,c]));
const descriptions={wild:'Avontuur & actie',spark:'Glans & fantasie',mystic:'Magie, maanlicht & mysterie',blaze:'Vuur, snelheid & lef'};
const icons={wild:'🌿',spark:'✨',mystic:'🔮',blaze:'🔥'};
const labels={wild:'WILD',spark:'SPARK',mystic:'MYSTIC',blaze:'BLAZE'};
const rarityLabel={core:'CORE',rare:'RARE',silver:'SILVER',gold:'GOLD',platinum:'PLATINUM'};

let user=null;
let unlocked=new Set();
let rewardIds=new Set();
let stateReady=false;
let syncBusy=false;
let syncQueued=false;
let lastSyncAt=0;
let patchQueued=false;
let initialStateSeen=false;
let backendAvailable=null;

function readLocal(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function writeLocal(items){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(items));return true}catch(e){console.warn('Cards v235 localStorage',e);return false}}
function sourceMeta(def){
  if(def.seriesKey==='wild')return {unlockType:'ar',threshold:0};
  if(def.seriesKey==='spark')return {unlockType:'milestone',threshold:def.index};
  if(def.seriesKey==='mystic')return {unlockType:'event',threshold:0};
  return {unlockType:'challenge',threshold:0,challengeId:def.challengeId||`blaze-${String(def.index).padStart(2,'0')}`};
}
function canonicalizeLocal(){
  const before=readLocal();
  const byNo=new Map(before.filter(Boolean).map(c=>[String(c.number||'').toUpperCase(),c]));
  const baseNumbers=new Set(BASE_CARDS.map(c=>c.number));
  const keep=before.filter(c=>!baseNumbers.has(String(c?.number||'').toUpperCase()));
  const now=new Date().toISOString();
  const made=BASE_CARDS.map(def=>{
    const old=byNo.get(def.number)||{};
    const meta=sourceMeta(def);
    const next={
      ...old,
      id:old.id||`seed-${def.seriesKey}-${String(def.index).padStart(2,'0')}`,
      number:def.number,
      name:def.name,
      series:def.series,
      description:descriptions[def.seriesKey],
      rarity:def.rarity,
      ...meta,
      active:true,
      secretName:false,
      baseCollection:true,
      seriesKey:def.seriesKey,
      structureVersion:CARD_STRUCTURE_VERSION,
      createdAt:old.createdAt||now,
      updatedAt:now
    };
    if(def.seriesKey==='mystic')next.huntId=old.huntId||'';
    if(def.seriesKey==='wild'&&old.arPointId)next.arPointId=old.arPointId;
    return next;
  });
  writeLocal([...keep,...made]);
  window.__snazzleCardsV235Canonical={count:made.length,at:now};
  return made;
}

function loadCache(uid){
  try{
    const c=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');
    if(!c||c.uid!==uid||!Array.isArray(c.unlockedCards))return false;
    unlocked=new Set(c.unlockedCards.filter(n=>byNumber.has(n)));
    rewardIds=new Set(Array.isArray(c.rewardIds)?c.rewardIds:[]);
    stateReady=true;
    return true;
  }catch{return false;}
}
function saveCache(){
  if(!user)return;
  try{localStorage.setItem(CACHE_KEY,JSON.stringify({uid:user.uid,unlockedCards:[...unlocked],rewardIds:[...rewardIds],at:new Date().toISOString()}));}catch{}
}
function counts(){
  const out={wild:0,spark:0,mystic:0,blaze:0,total:0};
  unlocked.forEach(number=>{const d=byNumber.get(number);if(d){out[d.seriesKey]++;out.total++;}});
  return out;
}
function isBaseCard(number){return byNumber.has(String(number||'').toUpperCase());}
function isUnlocked(number){return stateReady&&unlocked.has(String(number||'').toUpperCase());}
function ready(){return stateReady;}

function toast(message){
  const t=document.querySelector('#toast');if(!t)return;
  t.textContent=message;t.classList.add('show');clearTimeout(window.__sn235Toast);
  window.__sn235Toast=setTimeout(()=>t.classList.remove('show'),3200);
}
function applyState(data,{announce=false}={}){
  if(!data)return false;
  const beforeRewards=new Set(rewardIds);
  unlocked=new Set((data.unlockedCards||[]).map(x=>String(x).toUpperCase()).filter(n=>byNumber.has(n)));
  rewardIds=new Set((data.rewardIds||[]).map(String));
  stateReady=true;saveCache();queuePatch();
  if(announce&&initialStateSeen){
    const gained=[...rewardIds].filter(id=>!beforeRewards.has(id));
    if(gained.includes('master_collector_48'))toast('🏆 Snazzle Master Collector behaald!');
    else if(gained.some(id=>id.endsWith('_12')))toast('🔑 Series Master behaald — Vault Key verdiend!');
    else if(gained.some(id=>id.endsWith('_6')))toast('🏅 Nieuwe serie-badge verdiend!');
  }
  initialStateSeen=true;
  return true;
}
async function fetchState({announce=false}={}){
  if(!stateFn||!user)return false;
  try{const r=await stateFn({});backendAvailable=true;return applyState(r?.data,{announce});}
  catch(e){backendAvailable=false;console.warn('Cards v235 serverstatus niet beschikbaar; cloudprofiel-fallback actief',e);return false;}
}

function normaliseName(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').trim();}
function asDateNumber(data){
  const raw=data?.foundAt||data?.updatedAt||data?.createdAt||data?.start||'';
  const d=raw?.toDate?raw.toDate():new Date(raw||0);
  return Number.isNaN(d.getTime())?0:d.getTime();
}
function localArItems(){try{const x=JSON.parse(localStorage.getItem('snazzleARCollection')||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function uniqueAr(cloud=[],local=[]){
  const map=new Map();
  [...cloud,...local].forEach(raw=>{
    const id=String(raw?.id||raw?.pointId||'').trim();if(!id)return;
    if(!map.has(id))map.set(id,{id,number:String(raw?.number||''),name:String(raw?.name||raw?.snazzleName||''),caughtAt:raw?.caughtAt||raw?.foundAt||''});
  });
  return [...map.values()].sort((a,b)=>String(a.caughtAt||'').localeCompare(String(b.caughtAt||'')));
}
function fallbackRecord(def,sourceType,sourceId,now){
  return {cardNumber:def.number,seriesKey:def.seriesKey,rarity:def.rarity,unlockedAt:now,sourceType,sourceId:String(sourceId||sourceType),structureVersion:CARD_STRUCTURE_VERSION};
}
function rewardRecord(rewardId,kind,seriesKey,at,now,extra={}){
  return {rewardId,kind,seriesKey:seriesKey||'',at,earnedAt:now,structureVersion:CARD_STRUCTURE_VERSION,...extra};
}

async function fallbackSync(reason='fallback'){
  if(!db||!user)return false;
  try{
    const userRef=doc(db,'users',user.uid);
    const [userSnap,huntSnap,cardSnap]=await Promise.all([
      getDoc(userRef),getDocs(collection(db,'hunts')),getDocs(collection(db,'snazzleCards'))
    ]);
    const profile=userSnap.exists()?(userSnap.data()||{}):{};
    const unlockMap={...(profile.cardUnlocksV1&&typeof profile.cardUnlocksV1==='object'?profile.cardUnlocksV1:{})};
    const rewardMap={...(profile.cardRewardsV1&&typeof profile.cardRewardsV1==='object'?profile.cardRewardsV1:{})};
    const catalog=new Map();
    cardSnap.forEach(d=>{const x=d.data()||{},n=String(x.number||'').toUpperCase();if(n&&!catalog.has(n))catalog.set(n,{id:d.id,...x});});
    const hunts=[];let world=[];
    huntSnap.forEach(d=>{
      const x=d.data()||{};
      if(d.id==='snazzle_ar_world_v1'){world=Array.isArray(x.points)?x.points.filter(p=>p?.id&&p.active!==false):[];return;}
      if(x.found===true&&x.foundByUserId===user.uid&&x.mode!=='draft')hunts.push({id:d.id,...x});
    });
    hunts.sort((a,b)=>asDateNumber(a)-asDateNumber(b)||String(a.id).localeCompare(String(b.id)));
    const arItems=uniqueAr(Array.isArray(profile.arCollectionV1)?profile.arCollectionV1:[],localArItems());
    const arById=new Map(arItems.map(x=>[String(x.id),x]));
    const now=new Date().toISOString();
    const hasUnlock=number=>!!unlockMap[number];
    const award=(number,sourceType,sourceId)=>{
      const def=byNumber.get(String(number||'').toUpperCase());if(!def||hasUnlock(def.number))return false;
      unlockMap[def.number]=fallbackRecord(def,sourceType,sourceId,now);return true;
    };

    // Eénmalige overgang: wat in het oude milestone-systeem al zichtbaar was, blijft permanent bezit.
    const migrated=profile.cardStructureMigrationV1?.to===CARD_STRUCTURE_VERSION;
    if(!migrated){
      const oldCount=Math.min(12,hunts.length);
      for(let i=1;i<=oldCount;i++){
        for(const key of ['spark','mystic','blaze'])award(SERIES[key].cards[i-1].number,'migration','legacy-hunt-progress');
      }
    }

    // WILD: expliciete AR-koppeling, anders de eerste twaalf centrale AR-punten in vaste volgorde.
    for(let i=0;i<12;i++){
      const def=SERIES.wild.cards[i],card=catalog.get(def.number)||{};
      const targetId=String(card.arPointId||world[i]?.id||'');
      let hit=targetId?arById.get(targetId):null;
      if(!hit)hit=arItems.find(item=>(item.number&&String(item.number).toUpperCase()===def.number)||(item.name&&normaliseName(item.name)===normaliseName(def.name)));
      if(hit)award(def.number,'ar',hit.id);
    }

    // MYSTIC: alleen de toegewezen Mystery/Special Hunt of Event.
    const wonIds=new Set(hunts.map(h=>h.id));
    const mysticHuntIds=new Set();
    for(const def of SERIES.mystic.cards){
      const card=catalog.get(def.number)||{},huntId=String(card.huntId||'').trim();
      if(huntId){mysticHuntIds.add(huntId);if(wonIds.has(huntId))award(def.number,'event',huntId);}
      const rewarded=hunts.find(h=>String(h.rewardCardNumber||h.cardNumber||'').toUpperCase()===def.number);
      if(rewarded)award(def.number,'event',rewarded.id);
    }

    // SPARK: opeenvolgende gewone, centraal bevestigde Hunts.
    const ordinary=hunts.filter(h=>!mysticHuntIds.has(h.id));
    for(let i=0;i<Math.min(12,ordinary.length);i++)award(SERIES.spark.cards[i].number,'hunt',ordinary[i].id);

    // BLAZE: twaalf vaste Challenges; afgerond blijft afgerond.
    const challengeArCount=arItems.length,challengeHuntCount=hunts.length;
    BLAZE_CHALLENGES.forEach((challenge,i)=>{
      if(challengeHuntCount>=Number(challenge.minHunts||0)&&challengeArCount>=Number(challenge.minAr||0)){
        award(SERIES.blaze.cards[i].number,'challenge',challenge.id);
      }
    });

    const currentNumbers=Object.keys(unlockMap).filter(n=>byNumber.has(n));
    const c={wild:0,spark:0,mystic:0,blaze:0,total:0};
    currentNumbers.forEach(n=>{const d=byNumber.get(n);if(d){c[d.seriesKey]++;c.total++;}});
    for(const key of Object.keys(SERIES)){
      if(c[key]>=6&&!rewardMap[`series_${key}_6`])rewardMap[`series_${key}_6`]=rewardRecord(`series_${key}_6`,'series_half_badge',key,6,now);
      if(c[key]>=12&&!rewardMap[`series_${key}_12`])rewardMap[`series_${key}_12`]=rewardRecord(`series_${key}_12`,'series_master',key,12,now,{vaultKey:true});
    }
    if(c.total>=48&&!rewardMap.master_collector_48)rewardMap.master_collector_48=rewardRecord('master_collector_48','master_collector','',48,now,{profileFrame:true,vaultCard:true});

    const patch={cardUnlocksV1:unlockMap,cardRewardsV1:rewardMap,cardProgressUpdatedAt:now,cardStructureVersion:CARD_STRUCTURE_VERSION};
    if(!migrated)patch.cardStructureMigrationV1={from:'legacy-card-logic',to:CARD_STRUCTURE_VERSION,migratedAt:now,legacyHuntCount:hunts.length};
    await setDoc(userRef,patch,{merge:true});
    backendAvailable=false;
    applyState({unlockedCards:currentNumbers,rewardIds:Object.keys(rewardMap),counts:c},{announce:true});
    lastSyncAt=Date.now();
    window.__snazzleCardFallbackV235={ok:true,reason,counts:c,at:now};
    return true;
  }catch(e){console.error('Cards v235 cloudprofiel-fallback mislukt',e);return false;}
}

async function sync(reason='app'){
  if(!user)return false;
  if(syncBusy){syncQueued=true;return false;}
  syncBusy=true;
  try{
    if(syncFn&&stateFn&&backendAvailable!==false){
      try{
        await syncFn({reason:String(reason).slice(0,60)});
        const ok=await fetchState({announce:true});
        if(ok){lastSyncAt=Date.now();return true;}
      }catch(e){backendAvailable=false;console.warn('Cards v235 serverbackend nog niet actief; fallback wordt gebruikt',e);}
    }
    return await fallbackSync(reason);
  }finally{
    syncBusy=false;
    if(syncQueued){syncQueued=false;setTimeout(()=>sync('queued'),250);}
  }
}

function sourceText(def){
  if(def.seriesKey==='wild')return unlocked.has(def.number)?'📷 AR-vangst ✓':'📷 Vang de gekoppelde AR-Snazzle';
  if(def.seriesKey==='spark')return `🔎 ${def.index} gewone Hunt${def.index===1?'':'s'}`;
  if(def.seriesKey==='mystic')return '🔮 Mystery / Special Hunt / Event';
  return `🔥 ${def.challenge?.label||`Challenge ${def.index}`}`;
}
function patchCard(card){
  const number=String(card.querySelector('.sc2-num')?.textContent||'').toUpperCase();
  const def=byNumber.get(number);if(!def)return;
  card.dataset.baseCardV234='1';card.dataset.seriesV234=def.seriesKey;
  for(const r of Object.keys(rarityLabel))card.classList.remove(r);
  card.classList.add(def.rarity);
  const rarity=card.querySelector('.sc2-rarity');if(rarity)rarity.textContent=rarityLabel[def.rarity];
  const source=card.querySelector('.sc2-source');if(source)source.textContent=sourceText(def);
  if(stateReady){
    const u=unlocked.has(number);
    card.classList.toggle('unlocked',u);card.classList.toggle('locked',!u);
    const lock=card.querySelector('.sc2-lock');
    if(lock)lock.style.setProperty('display',u?'none':'grid','important');
  }
}
function patchAdminRows(){
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const text=row.querySelector('strong')?.textContent||row.textContent||'';
    const match=String(text).toUpperCase().match(/S01-[WSMB](?:0[1-9]|1[0-2])/);if(!match)return;
    const def=byNumber.get(match[0]);if(!def)return;
    row.dataset.baseCardV234='1';row.dataset.seriesV234=def.seriesKey;
    row.querySelectorAll('small').forEach(s=>{
      const t=s.textContent||'';
      if(t.toUpperCase().includes('SERIES 01')&&/(CORE|RARE|SILVER|GOLD|PLATINUM)/i.test(t))s.textContent=t.replace(/CORE|RARE|SILVER|GOLD|PLATINUM/i,rarityLabel[def.rarity]);
    });
  });
}
function rewardEarned(seriesKey,at,c){return rewardIds.has(`series_${seriesKey}_${at}`)||c[seriesKey]>=at;}
function ensureProgressUi(){
  const summary=document.querySelector('#sc2Block .sc2-summary');if(!summary)return null;
  let box=document.querySelector('#snCardProgress234');
  if(!box){box=document.createElement('div');box.id='snCardProgress234';box.className='sn234-progress';summary.insertAdjacentElement('afterend',box);}
  if(!document.querySelector('#snCardProgress234Style')){
    const style=document.createElement('style');style.id='snCardProgress234Style';style.textContent=`
      .sn234-progress{margin:9px 0 2px;padding:9px;border:2px solid #b89254;border-radius:16px;background:rgba(255,248,221,.82);color:#4b3522}.sn234-series{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.sn234-chip{min-width:0;padding:7px 5px;border:1.5px solid #c7a873;border-radius:12px;background:#fff8e5;text-align:center}.sn234-chip span{display:block;font-size:9px;font-weight:1000;white-space:nowrap}.sn234-chip b{display:block;margin-top:2px;font-size:13px}.sn234-chip small{display:block;margin-top:2px;font-size:8px;font-weight:900;color:#765b38;white-space:nowrap}.sn234-master{margin-top:7px;padding:7px 9px;border-radius:11px;background:linear-gradient(90deg,#273d75,#4b3581);color:#fff6cf;font-size:10px;font-weight:950;display:flex;justify-content:space-between;gap:8px}.sn234-master.done{background:linear-gradient(90deg,#8c641f,#d69f24,#74531d);color:#fff}.sn234-earned{color:#20743d!important}@media(max-width:390px){.sn234-series{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;document.head.appendChild(style);
  }
  return box;
}
function patchSummary(){
  const c=counts();
  const count=document.querySelector('#sc2SummaryCount');if(count)count.textContent=`${c.total}/${BASE_COLLECTION_SIZE}`;
  const txt=document.querySelector('#sc2SummaryText');if(txt)txt.textContent=`${Math.round(c.total/BASE_COLLECTION_SIZE*100)||0}% van je basiscollectie ontdekt`;
  const home=document.querySelector('#collectionHomeStatus');if(home)home.textContent=`${c.total} van ${BASE_COLLECTION_SIZE} kaarten ontdekt`;
  const box=ensureProgressUi();if(!box)return;
  box.innerHTML=`<div class="sn234-series">${Object.keys(SERIES).map(k=>{
    const half=rewardEarned(k,6,c),full=rewardEarned(k,12,c);
    return `<div class="sn234-chip"><span>${icons[k]} ${labels[k]}</span><b>${c[k]}/12</b><small class="${full||half?'sn234-earned':''}">${full?'🔑 MASTER':half?'🏅 6/12':'○ 6 · 🔒 12'}</small></div>`;
  }).join('')}</div><div class="sn234-master ${c.total>=48||rewardIds.has(REWARDS.masterCollector.id)?'done':''}"><span>🏆 Snazzle Master Collector</span><b>${c.total}/48</b></div>`;
}
function patch(){
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(patchCard);
  patchAdminRows();
  if(stateReady)patchSummary();
  window.SnazzleMysticUiV227?.repair?.();
  window.SnazzleBlazeUiV232?.repair?.();
}
function queuePatch(){if(patchQueued)return;patchQueued=true;requestAnimationFrame(()=>{patchQueued=false;try{patch()}catch(e){console.warn('Cards v235 UI',e)}})}

function bindUser(u){
  user=u;unlocked=new Set();rewardIds=new Set();stateReady=false;initialStateSeen=false;backendAvailable=null;
  if(!u){queuePatch();return;}
  loadCache(u.uid);queuePatch();
  [120,1300,3800].forEach(ms=>setTimeout(()=>sync(`login-${ms}`),ms));
}

canonicalizeLocal();
if(auth){onAuthStateChanged(auth,bindUser);if(auth.currentUser)bindUser(auth.currentUser);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queuePatch,{once:true});else queuePatch();
new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queuePatch()}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',e=>{
  const target=e.target?.closest?.('#collectionSheet,[data-seriespick],[data-sc2f],[data-collection-tab],#snArCatchDuck,#snArCatchHint');
  if(!target)return;
  queuePatch();
  const ar=target.matches?.('#snArCatchDuck,#snArCatchHint')||target.closest?.('#snArCatchDuck,#snArCatchHint');
  if(ar)setTimeout(()=>sync('ar-catch'),1800);
  else if(Date.now()-lastSyncAt>5000)setTimeout(()=>sync('cards-open'),180);
},{capture:true,passive:true});
window.addEventListener('pageshow',()=>{queuePatch();if(user&&Date.now()-lastSyncAt>15000)sync('pageshow');});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user&&Date.now()-lastSyncAt>30000)sync('resume');});
[0,150,500,1200,2600,5200,9000].forEach(ms=>setTimeout(queuePatch,ms));

window.SnazzleCardProgressV234={
  version:VERSION,
  structureVersion:CARD_STRUCTURE_VERSION,
  ready,isBaseCard,isUnlocked,counts,sync,render:patch,canonicalize:canonicalizeLocal,cardDefinition,
  backendStatus:()=>backendAvailable===true?'server':backendAvailable===false?'cloud-profile-fallback':'checking'
};
console.info(`Snazzle Cards ${VERSION} geladen — vaste basiscollectie ${BASE_COLLECTION_SIZE}`);
