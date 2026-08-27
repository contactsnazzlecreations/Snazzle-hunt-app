// Snazzle AR Collection Bridge v125
// Koppelt AR-vondsten aan de persoonlijke digitale collectie zonder het openbare hunt-klassement te beïnvloeden.
// Bestaande lokale AR-vondsten worden automatisch gemigreerd naar het eigen user-document en blijven lokaal als fallback beschikbaar.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, onSnapshot, setDoc, serverTimestamp, arrayUnion } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
const LOCAL_KEY='snazzleARCollection';
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let cloudItems=[];
let worldMap=new Map();
let worldLoaded=false;
let unsubUser=null;
let syncBusy=false;
let lastSyncSignature='';

function localItems(){
  try{
    const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');
    return Array.isArray(x)?x.filter(v=>v&&v.id):[];
  }catch{return[];}
}
function cleanId(id){return String(id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,120);}
function cleanRarity(value){
  const allowed=['COMMON','UNCOMMON','RARE','EPIC','GOLD','PLATINUM','BLACK','LEGENDARY','SECRET'];
  const r=String(value||'COMMON').toUpperCase();
  return allowed.includes(r)?r:'COMMON';
}
function canonical(item){
  const world=worldMap.get(String(item?.id||''))||{};
  const caughtAt=String(item?.caughtAt||new Date().toISOString());
  return {
    id:String(item?.id||world.id||'').slice(0,120),
    number:String(item?.number||world.number||'—').slice(0,20),
    name:String(item?.name||world.name||'Snazzle').slice(0,60),
    rarity:cleanRarity(item?.rarity||world.rarity),
    village:String(item?.village||world.village||localStorage.getItem('snazzleVillage')||'Montfort').slice(0,60),
    caughtAt,
    edition:String(item?.edition||'Snazzle AR').slice(0,60)
  };
}
function mergedItems(){
  const map=new Map();
  [...cloudItems,...localItems()].forEach(raw=>{
    if(!raw?.id)return;
    const item=canonical(raw),prev=map.get(item.id);
    if(!prev || String(item.caughtAt)<String(prev.caughtAt))map.set(item.id,item);
  });
  return [...map.values()].sort((a,b)=>String(b.caughtAt).localeCompare(String(a.caughtAt)));
}
function fmtDate(value){
  const d=new Date(value||0);
  if(Number.isNaN(d.getTime()))return 'AR-vondst';
  return d.toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'});
}
function scoutSvg(){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4ad0ef"/><stop offset="1" stop-color="#3e4fb8"/></linearGradient><filter id="ds"><feDropShadow dx="0" dy="16" stdDeviation="15" flood-opacity=".3"/></filter></defs><rect width="800" height="800" rx="70" fill="url(#bg)"/><circle cx="130" cy="125" r="75" fill="#fff" opacity=".13"/><g fill="#fff9a7" opacity=".9"><circle cx="655" cy="145" r="10"/><circle cx="710" cy="225" r="7"/><circle cx="125" cy="605" r="8"/></g><g filter="url(#ds)"><ellipse cx="350" cy="500" rx="225" ry="165" fill="#39bde8" stroke="#47351f" stroke-width="18"/><circle cx="548" cy="326" r="124" fill="#39bde8" stroke="#47351f" stroke-width="18"/><path d="M645 320 780 370 645 425Z" fill="#ff8f32" stroke="#47351f" stroke-width="15"/><circle cx="586" cy="294" r="17" fill="#15251c"/><circle cx="592" cy="288" r="5" fill="#fff"/><path d="M470 248 Q548 153 655 215 L666 275 Q555 236 470 292Z" fill="#30343b" stroke="#25282d" stroke-width="14"/><path d="M463 281 Q558 247 667 285" fill="none" stroke="#17191d" stroke-width="20" stroke-linecap="round"/></g><text x="400" y="735" text-anchor="middle" font-family="Arial,sans-serif" font-size="47" font-weight="900" fill="#fff7dd">SCOUT SNAZZLE</text></svg>`;
}
function svgUrl(svg){return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;}
function visualFor(item){
  const world=worldMap.get(String(item.id||''))||{};
  if(world.imageUrl)return world.imageUrl;
  try{
    if(item.id==='AR-001'){
      const settings=JSON.parse(localStorage.getItem('snazzleSettings')||'{}');
      if(settings.profileImage)return settings.profileImage;
    }
  }catch{}
  return svgUrl(scoutSvg());
}

async function loadWorld(){
  if(worldLoaded)return;
  try{
    const snap=await getDoc(WORLD_DOC);
    const data=snap.exists()?snap.data():{};
    const points=Array.isArray(data.points)?data.points:[];
    worldMap=new Map(points.filter(p=>p?.id).map(p=>[String(p.id),p]));
  }catch(err){console.warn('AR-collectie kon AR-wereld niet laden',err);}
  worldLoaded=true;
}

async function submitAnonymousStat(user,item){
  const pointId=cleanId(item.id);if(!pointId||!user)return;
  const findingId=`${pointId}_${user.uid}`;
  try{
    await setDoc(doc(db,'snazzleArFindings',findingId),{
      pointId,
      snazzleName:String(item.name||'Snazzle').slice(0,60),
      number:String(item.number||'—').slice(0,20),
      rarity:cleanRarity(item.rarity),
      village:String(item.village||'Montfort').slice(0,60),
      foundAt:serverTimestamp()
    });
  }catch(err){
    // Een tweede create van dezelfde vondst wordt bewust door de regels geweigerd.
    if(!String(err?.code||'').includes('permission-denied'))console.warn('AR-statistiek opslaan mislukt',err);
  }
}

async function syncLocalToCloud(){
  const user=auth.currentUser;if(!user||syncBusy)return;
  const local=localItems();
  const signature=JSON.stringify(local.map(x=>[x?.id,x?.caughtAt]));
  if(signature===lastSyncSignature){render();return;}
  syncBusy=true;
  try{
    await loadWorld();
    for(const raw of local){
      const item=canonical(raw);if(!item.id)continue;
      await setDoc(doc(db,'users',user.uid),{
        arCollectionV1:arrayUnion(item),
        arCollectionUpdatedAt:serverTimestamp()
      },{merge:true});
      await submitAnonymousStat(user,item);
    }
    lastSyncSignature=signature;
  }catch(err){console.warn('AR-vondsten konden niet centraal worden gesynchroniseerd',err);}
  finally{syncBusy=false;render();}
}

function ensureUi(){
  const section=$('#collectionCards');if(!section)return false;
  const statline=$('.collection-statline');
  if(statline&&!$('#collectionArPillV125')){
    const pill=document.createElement('span');pill.className='collection-pill';pill.id='collectionArPillV125';pill.textContent='📷 0 AR-vondsten';statline.appendChild(pill);
  }
  if(!$('#snArCollectionBridge125')){
    const box=document.createElement('div');box.id='snArCollectionBridge125';box.innerHTML=`
      <div class="collection-section-title sn-ar-col-head125"><h3>Mijn AR-vondsten 📷</h3><span>Direct bewaard na het vangen</span></div>
      <div class="sn-ar-col-grid125" id="snArCollectionGrid125"></div>`;
    section.appendChild(box);
  }
  if(!$('#snArCollectionStyle125')){
    const style=document.createElement('style');style.id='snArCollectionStyle125';style.textContent=`
      #snArCollectionBridge125{margin-top:22px;padding-top:16px;border-top:2px dashed rgba(88,62,31,.35)}
      .sn-ar-col-head125{margin-bottom:10px}.sn-ar-col-grid125{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
      .sn-ar-col-card125{position:relative;border:3px solid #6d4825;border-radius:20px;overflow:hidden;background:linear-gradient(145deg,#fff4c8,#eecb83);box-shadow:0 5px 0 #50301c;color:#2e2116}
      .sn-ar-col-img125{aspect-ratio:1/1;background:linear-gradient(135deg,#5bcde7,#574fc0);overflow:hidden}.sn-ar-col-img125 img{width:100%;height:100%;object-fit:contain;display:block}
      .sn-ar-col-info125{padding:10px}.sn-ar-col-info125 strong{display:block;font-size:14px;line-height:1.15}.sn-ar-col-info125 small{display:block;margin-top:4px;font-size:10px;font-weight:800;line-height:1.35;color:#665038}
      .sn-ar-col-stamp125{position:absolute;right:7px;top:7px;background:#2f7b37;color:#fff;border:2px solid #dff7a8;border-radius:999px;padding:5px 7px;font-size:8px;font-weight:1000;box-shadow:0 3px 8px rgba(0,0,0,.2)}
      .sn-ar-col-empty125{grid-column:1/-1;padding:14px;border:2px dashed #b79760;border-radius:15px;background:#fff8e8;text-align:center;font-size:12px;font-weight:850;color:#6a5538}
      @media(max-width:380px){.sn-ar-col-grid125{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }
  return true;
}

async function render(){
  await loadWorld();
  if(!ensureUi())return;
  const items=mergedItems(),grid=$('#snArCollectionGrid125'),pill=$('#collectionArPillV125');
  if(pill)pill.textContent=`📷 ${items.length} AR-vondst${items.length===1?'':'en'}`;
  if(!grid)return;
  if(!items.length){grid.innerHTML='<div class="sn-ar-col-empty125">Nog geen AR-Snazzle gevangen. Zodra je er één vangt, verschijnt hij hier direct.</div>';return;}
  grid.innerHTML=items.map(item=>`<article class="sn-ar-col-card125"><div class="sn-ar-col-img125"><img src="${esc(visualFor(item))}" alt="${esc(item.name)}"></div><span class="sn-ar-col-stamp125">AR GEVANGEN ✓</span><div class="sn-ar-col-info125"><strong>${esc(item.name)}</strong><small>#${esc(item.number)} · ${esc(item.rarity)}<br>📍 ${esc(item.village)} · ${esc(fmtDate(item.caughtAt))}</small></div></article>`).join('');
}

function watchCollectionUi(){
  if(ensureUi()){render();const sheet=$('#collectionSheet');if(sheet&&!sheet.dataset.arBridge125){sheet.dataset.arBridge125='1';new MutationObserver(()=>{if(sheet.classList.contains('show')){syncLocalToCloud();render();}}).observe(sheet,{attributes:true,attributeFilter:['class']});}return;}
  const ob=new MutationObserver(()=>{if(ensureUi()){ob.disconnect();watchCollectionUi();}});
  if(document.body)ob.observe(document.body,{childList:true,subtree:true});
}

function bindUser(user){
  try{unsubUser?.();}catch{}unsubUser=null;cloudItems=[];
  if(!user){render();return;}
  unsubUser=onSnapshot(doc(db,'users',user.uid),snap=>{
    const data=snap.exists()?snap.data():{};
    cloudItems=Array.isArray(data.arCollectionV1)?data.arCollectionV1.filter(v=>v?.id):[];
    render();
  },err=>{console.warn('Persoonlijke AR-collectie kon niet worden geladen',err);render();});
  syncLocalToCloud();
}

// Capture op documentniveau: deze listener ziet de vangklik ook wanneer een later AR-module
// de normale klik met stopImmediatePropagation afhandelt.
document.addEventListener('click',e=>{
  const trigger=e.target?.closest?.('#snArCatchDuck,#snArCatchHint');
  if(!trigger)return;
  setTimeout(()=>{syncLocalToCloud();render();},260);
},true);
window.addEventListener('storage',e=>{if(e.key===LOCAL_KEY){syncLocalToCloud();render();}});
window.addEventListener('pageshow',()=>{syncLocalToCloud();render();});

onAuthStateChanged(auth,bindUser);
if(auth.currentUser)bindUser(auth.currentUser);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchCollectionUi,{once:true});else watchCollectionUi();

window.SnazzleArCollectionBridgeV125={sync:syncLocalToCloud,render};
