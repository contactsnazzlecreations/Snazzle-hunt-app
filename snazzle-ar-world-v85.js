// Snazzle AR World v85.3 — permanente AR-punten + veilige openbare zoekzones.
// Exacte punten worden alleen tijdens de actieve AR-zoekactie gebruikt; de kaart toont alleen afgeronde zones.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth(), db=getFirestore();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=s=>document.querySelector(s);
const toRad=d=>d*Math.PI/180;
let world=[],target=null,stream=null,watchId=null,armed=false,currentAccuracy=0;
let zoneMap=null,zoneLayer=null,leafletPromise=null;

const rarityRank={COMMON:1,UNCOMMON:2,RARE:3,EPIC:4,GOLD:5,PLATINUM:6,BLACK:7,LEGENDARY:8,SECRET:9};
const rarityInfo={
  COMMON:{label:'COMMON',emoji:'🟢',color:'#4f9b4f',radius:90},
  UNCOMMON:{label:'UNCOMMON',emoji:'🔵',color:'#3b82c4',radius:100},
  RARE:{label:'RARE',emoji:'💜',color:'#7b55c7',radius:120},
  EPIC:{label:'EPIC',emoji:'✨',color:'#b242c1',radius:135},
  GOLD:{label:'GOLD',emoji:'⭐',color:'#d6a51d',radius:145},
  PLATINUM:{label:'PLATINUM',emoji:'💎',color:'#6d93a7',radius:155},
  BLACK:{label:'BLACK',emoji:'🖤',color:'#34343d',radius:170},
  LEGENDARY:{label:'LEGENDARY',emoji:'👑',color:'#d77820',radius:190},
  SECRET:{label:'SECRET',emoji:'❓',color:'#b42d64',radius:210}
};

function waitForUser(){
  if(auth.currentUser)return Promise.resolve(auth.currentUser);
  return new Promise(resolve=>{const off=onAuthStateChanged(auth,u=>{if(u){off();resolve(u);}});setTimeout(()=>{off();resolve(auth.currentUser)},5000);});
}
function dist(a,b){const R=6371000,p1=toRad(a.lat),p2=toRad(b.lat),dp=toRad(b.lat-a.lat),dl=toRad(b.lon-a.lon),h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
function point(pos){return{lat:Number(pos.coords.latitude),lon:Number(pos.coords.longitude)}}
function geoOnce(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund op dit toestel.'));navigator.geolocation.getCurrentPosition(resolve,e=>reject(new Error(e.code===1?'Locatietoestemming is geweigerd.':'Je locatie kon niet worden bepaald.')),{enableHighAccuracy:true,timeout:16000,maximumAge:0});});}
async function camera(){if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera wordt niet ondersteund in deze browser.');return navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});}

async function loadWorld(){
  await waitForUser();
  const snap=await getDoc(WORLD_DOC),data=snap.exists()?snap.data():{};
  world=Array.isArray(data.points)?data.points.filter(p=>p&&p.active!==false&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon))):[];
  return world;
}
function villagePoints(){const village=localStorage.getItem('snazzleVillage')||'Montfort';return world.filter(p=>String(p.village||'')===village);}

function normalizeRarity(value){const r=String(value||'COMMON').toUpperCase();return rarityInfo[r]?r:'COMMON';}
function publicZones(){
  const groups=new Map();
  villagePoints().forEach(p=>{
    const lat=Math.round(Number(p.lat)*1000)/1000;
    const lon=Math.round(Number(p.lon)*1000)/1000;
    const key=`${lat.toFixed(3)}|${lon.toFixed(3)}`;
    const rarity=normalizeRarity(p.rarity);
    if(!groups.has(key))groups.set(key,{lat,lon,count:0,rarities:{},top:rarity});
    const z=groups.get(key);z.count++;z.rarities[rarity]=(z.rarities[rarity]||0)+1;
    if((rarityRank[rarity]||0)>(rarityRank[z.top]||0))z.top=rarity;
  });
  return [...groups.values()];
}
function zoneSummary(z){
  return Object.entries(z.rarities).sort((a,b)=>(rarityRank[b[0]]||0)-(rarityRank[a[0]]||0)).map(([r,n])=>`${n}× ${r}`).join(' · ');
}
function installZoneStyles(){
  if($('#snArZoneStyle'))return;
  const s=document.createElement('style');s.id='snArZoneStyle';s.textContent=`
  .sn-ar-zone-btn{display:block;width:100%;margin:10px 0 4px;min-height:48px;border:0;border-radius:15px;padding:11px 14px;background:linear-gradient(135deg,#2d6f4e,#4f8e3d);color:#fff;font-weight:950;font-size:14px;box-shadow:0 4px 0 rgba(25,74,47,.35)}
  .sn-ar-zone-modal{position:fixed;inset:0;z-index:515;display:none;background:#10251ce8;padding:calc(12px + env(safe-area-inset-top)) 10px calc(12px + env(safe-area-inset-bottom));overflow:auto}.sn-ar-zone-modal.show{display:block}
  .sn-ar-zone-shell{width:min(620px,100%);margin:auto;background:#fff4d1;border:3px solid #5f4930;border-radius:22px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.35)}
  .sn-ar-zone-head{display:flex;align-items:center;gap:10px;padding:12px 13px;background:linear-gradient(135deg,#325b3a,#244634);color:#fff}.sn-ar-zone-head h2{margin:0;flex:1;font-size:20px}.sn-ar-zone-close{width:44px;height:44px;border:0;border-radius:13px;background:#fff;color:#2f4934;font-size:22px;font-weight:1000}
  .sn-ar-zone-copy{padding:11px 13px 9px;font-size:12px;line-height:1.45;font-weight:800;color:#4c3b28}.sn-ar-zone-copy b{color:#253f2d}
  #snArZoneMap{height:min(58vh,430px);min-height:330px;margin:0 10px 10px;border:3px solid #765b3a;border-radius:17px;overflow:hidden;background:#dce9d7}
  .sn-ar-zone-legend{display:flex;gap:6px;overflow-x:auto;padding:0 12px 12px}.sn-ar-zone-chip{white-space:nowrap;background:#fff;border:1px solid #c8ad78;border-radius:999px;padding:6px 8px;font-size:10px;font-weight:950}
  .sn-ar-zone-empty{margin:0 12px 14px;padding:14px;border-radius:14px;background:#fff;border:2px dashed #c9aa70;text-align:center;font-weight:850;color:#685236}
  .sn-ar-zone-popup{font-weight:800;line-height:1.35}.sn-ar-zone-popup strong{font-size:14px}.sn-ar-zone-popup small{display:block;margin-top:4px;color:#65533d}
  @media(max-width:390px){#snArZoneMap{min-height:300px}.sn-ar-zone-head h2{font-size:18px}}
  `;document.head.appendChild(s);
}
function installZoneUi(){
  installZoneStyles();
  const start=$('#snArStart');
  if(start&&!$('#snArZoneOpen')){
    const b=document.createElement('button');b.type='button';b.id='snArZoneOpen';b.className='sn-ar-zone-btn';b.textContent='🗺️ Bekijk Snazzle-zones';start.insertAdjacentElement('afterend',b);b.addEventListener('click',openZoneMap);
  }
  if(!$('#snArZoneModal')){
    const modal=document.createElement('div');modal.id='snArZoneModal';modal.className='sn-ar-zone-modal';modal.innerHTML=`<div class="sn-ar-zone-shell"><div class="sn-ar-zone-head"><h2>Snazzle-zones 🗺️</h2><button type="button" class="sn-ar-zone-close" id="snArZoneClose">×</button></div><div class="sn-ar-zone-copy"><b>Hier ergens zit een Snazzle.</b> De cirkels tonen expres alleen ongeveer waar. Bij zeldzame Snazzles is de zoekzone groter, zodat je nog echt moet speuren.</div><div id="snArZoneMap"></div><div class="sn-ar-zone-empty" id="snArZoneEmpty" hidden>Er zijn nu geen actieve Snazzle-zones in dit dorp.</div><div class="sn-ar-zone-legend" id="snArZoneLegend"></div></div>`;document.body.appendChild(modal);
    $('#snArZoneClose')?.addEventListener('click',closeZoneMap);
    modal.addEventListener('click',e=>{if(e.target===modal)closeZoneMap();});
  }
}
function closeZoneMap(){$('#snArZoneModal')?.classList.remove('show');}
function loadLeaflet(){
  if(window.L)return Promise.resolve(window.L);if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector('link[data-sn-zone-leaflet]')&&!document.querySelector('link[href*="leaflet.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.dataset.snZoneLeaflet='1';document.head.appendChild(l);}
    const existing=[...document.scripts].find(x=>x.src?.includes('leaflet@1.9.4/dist/leaflet.js'));
    if(existing){if(window.L)return resolve(window.L);existing.addEventListener('load',()=>resolve(window.L),{once:true});existing.addEventListener('error',()=>reject(new Error('Kaartmodule kon niet laden.')),{once:true});return;}
    const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.async=true;s.onload=()=>resolve(window.L);s.onerror=()=>reject(new Error('Kaartmodule kon niet laden.'));document.head.appendChild(s);
  });return leafletPromise;
}
async function openZoneMap(e){
  e?.preventDefault?.();e?.stopPropagation?.();installZoneUi();const modal=$('#snArZoneModal'),empty=$('#snArZoneEmpty'),legend=$('#snArZoneLegend');modal?.classList.add('show');if(empty){empty.hidden=true;empty.textContent='Snazzle-zones laden…';}
  try{
    await loadWorld();const zones=publicZones();const L=await loadLeaflet();
    if(!zoneMap){zoneMap=L.map('snArZoneMap',{zoomControl:true,attributionControl:true});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(zoneMap);zoneLayer=L.layerGroup().addTo(zoneMap);}else zoneLayer.clearLayers();
    if(legend){const seen=[...new Set(zones.map(z=>z.top))].sort((a,b)=>(rarityRank[b]||0)-(rarityRank[a]||0));legend.innerHTML=seen.map(r=>`<span class="sn-ar-zone-chip">${rarityInfo[r].emoji} ${r}</span>`).join('');}
    if(!zones.length){if(empty){empty.hidden=false;empty.textContent=`Er zijn nu geen actieve Snazzle-zones in ${localStorage.getItem('snazzleVillage')||'dit dorp'}.`;}zoneMap.setView([51.125,5.948],13);setTimeout(()=>zoneMap.invalidateSize(),80);return;}
    if(empty)empty.hidden=true;
    const bounds=[];
    zones.forEach(z=>{const info=rarityInfo[z.top]||rarityInfo.COMMON;const circle=L.circle([z.lat,z.lon],{radius:info.radius,color:info.color,fillColor:info.color,fillOpacity:.18,weight:3,opacity:.9}).addTo(zoneLayer);circle.bindPopup(`<div class="sn-ar-zone-popup"><strong>${info.emoji} ${info.label}-signaal</strong><br>${z.count===1?'Er zit een Snazzle in deze zoekzone.':`Er zitten ${z.count} Snazzle-signalen in deze zoekzone.`}<small>${zoneSummary(z)}<br>De exacte plek blijft geheim.</small></div>`);bounds.push([z.lat,z.lon]);});
    if(bounds.length===1)zoneMap.setView(bounds[0],15);else zoneMap.fitBounds(bounds,{padding:[28,28],maxZoom:15});setTimeout(()=>zoneMap.invalidateSize(),100);
  }catch(err){if(empty){empty.hidden=false;empty.textContent='⚠️ '+(err?.message||'De Snazzle-kaart kon niet laden.');}}
}

function customizeUi(){
  const tag=$('#snArLaunch .sn-ar-tag');if(tag)tag.textContent='LIVE';
  const small=$('#snArLaunch .sn-ar-copy small');if(small)small.textContent='Zoek echte geplaatste Snazzles met camera en GPS';
  const badge=$('#snArIntro .sn-ar-badge');if(badge)badge.textContent='SNAZZLE AR · GPS + CAMERA';
  const title=$('#snArIntro h2');if(title)title.textContent='Zoek een verborgen Snazzle ✨';
  const text=$('#snArIntro p:not(.sn-ar-privacy)');if(text)text.textContent='Bekijk eerst ongeveer waar Snazzles zitten op de kaart, en start daarna de AR-zoektocht. Tijdens het lopen blijft de camera afgeschermd zodat je voor je kunt kijken.';
  const start=$('#snArStart');if(start)start.textContent='Zoek AR Snazzle';
  const privacy=$('#snArIntro .sn-ar-privacy');if(privacy)privacy.textContent='🔒 Je GPS wordt alleen tijdens het zoeken gebruikt. De kaart toont geen exacte Snazzle-locaties en jouw route wordt niet opgeslagen.';
  installZoneUi();
}

function setVisible(on){
  $('#snArDuck')?.classList.toggle('sn-ar-hidden',!on);
  $('#snArReticle')?.classList.toggle('sn-ar-hidden',!on);
  $('#snArCatchHint')?.classList.toggle('sn-ar-hidden',!on);
  armed=on;
  window.SnazzleArSafetyV82b?.refresh?.();
}
function resetPlacementVisual(){
  const duck=$('#snArDuck'),catchBtn=$('#snArCatchDuck');
  if(duck){duck.style.left='';duck.style.top='';duck.style.width='';duck.style.height='';}
  if(catchBtn)catchBtn.style.transform='';
}
function applySavedPlacement(){
  resetPlacementVisual();
  if(!target?.placement||target.placement.mode!=='camera-composed')return;
  const duck=$('#snArDuck'),catchBtn=$('#snArCatchDuck');if(!duck)return;
  const x=Math.max(.06,Math.min(.94,Number(target.placement.x||.5)));
  const y=Math.max(.12,Math.min(.9,Number(target.placement.y||.48)));
  const size=Math.max(.18,Math.min(.62,Number(target.placement.size||.5)));
  const rot=Math.max(-180,Math.min(180,Number(target.placement.rotation||0)));
  duck.style.left=`${x*100}%`;duck.style.top=`${y*100}%`;duck.style.width=`${size*100}vw`;duck.style.height=`${size*100}vw`;
  if(catchBtn)catchBtn.style.transform=`rotate(${rot}deg)`;
}
function setTargetVisual(){
  if(!target)return;
  const catchBtn=$('#snArCatchDuck');
  if(catchBtn&&target.imageUrl){catchBtn.innerHTML=`<img src="${String(target.imageUrl).replace(/"/g,'&quot;')}" alt="${String(target.name||'Snazzle').replace(/"/g,'&quot;')}" style="width:100%;height:100%;object-fit:contain">`;}
  applySavedPlacement();
}
function stop(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  if(watchId!==null&&navigator.geolocation){navigator.geolocation.clearWatch(watchId);watchId=null;}
  $('#snArOverlay')?.classList.remove('show');setVisible(false);resetPlacementVisual();target=null;currentAccuracy=0;
}

function update(pos){
  if(!target)return;
  const here=point(pos),remaining=dist(here,{lat:Number(target.lat),lon:Number(target.lon)}),radius=Math.max(4,Number(target.radius||7));currentAccuracy=Math.round(Number(pos.coords.accuracy||0));
  const reveal=remaining<=radius;
  setVisible(reveal);
  const hud=$('#snArHudText'),box=$('#snArDistance');
  if(reveal){if(hud)hud.textContent=`${target.name||'Snazzle'} gevonden · GPS ±${currentAccuracy} m`;if(box)box.textContent=target.placement?.mode==='camera-composed'?'Je bent op de juiste plek ✅ · kijk rond met de camera':'Je bent op de juiste plek ✅';}
  else{if(hud)hud.textContent=`Snazzle-signaal actief in ${target.village||'jouw dorp'} · GPS ±${currentAccuracy} m`;if(box)box.textContent=`Nog ongeveer ${Math.max(0,Math.round(remaining))} meter… 👣`;}
}
function startWatch(){if(watchId!==null)navigator.geolocation.clearWatch(watchId);watchId=navigator.geolocation.watchPosition(update,()=>{const b=$('#snArDistance');if(b)b.textContent='GPS-signaal even kwijt… blijf buiten en wacht kort.';},{enableHighAccuracy:true,timeout:16000,maximumAge:1000});}

async function startReal(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();
  const btn=$('#snArStart'),status=$('#snArStatus');if(btn)btn.disabled=true;if(status)status.textContent='📍 Actieve AR Snazzles zoeken…';
  try{
    await loadWorld();const choices=villagePoints();if(!choices.length){if(status)status.textContent=`ℹ️ Er staat nu geen actieve AR Snazzle in ${localStorage.getItem('snazzleVillage')||'dit dorp'}.`;return;}
    const pos=await geoOnce(),here=point(pos);target=choices.slice().sort((a,b)=>dist(here,a)-dist(here,b))[0];setTargetVisual();setVisible(false);
    const remaining=Math.round(dist(here,{lat:Number(target.lat),lon:Number(target.lon)}));currentAccuracy=Math.round(Number(pos.coords.accuracy||0));
    if(status)status.textContent=`✅ ${normalizeRarity(target.rarity)}-signaal gevonden · ongeveer ${remaining} m verderop.`;
    stream=await camera();const video=$('#snArCamera');if(video){video.srcObject=stream;await video.play().catch(()=>{});}$('#snArIntro')?.classList.remove('show');$('#snArOverlay')?.classList.add('show');
    const hud=$('#snArHudText'),box=$('#snArDistance');if(hud)hud.textContent=`${normalizeRarity(target.rarity)} Snazzle-signaal actief in ${target.village} · GPS ±${currentAccuracy} m`;if(box)box.textContent=`Nog ongeveer ${remaining} meter… 👣`;startWatch();update(pos);
  }catch(err){stop();if(status)status.textContent='⚠️ '+(err?.message||'AR kon niet starten.');}finally{if(btn)btn.disabled=false;}
}

function caughtList(){try{return JSON.parse(localStorage.getItem('snazzleARCollection')||'[]')}catch{return[]}}
function catchReal(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();if(!armed||!target)return;
  const caught=target;armed=false;const list=caughtList();if(!list.some(x=>x.id===caught.id)){list.push({id:caught.id,number:caught.number||'—',name:caught.name||'Snazzle',rarity:caught.rarity||'COMMON',village:caught.village,caughtAt:new Date().toISOString(),edition:'Snazzle AR'});localStorage.setItem('snazzleARCollection',JSON.stringify(list));}
  try{navigator.vibrate?.([80,50,120]);}catch{}stop();
  const result=$('#snArResult');if(result){const badge=result.querySelector('.sn-ar-badge');if(badge)badge.textContent='SNAZZLE AR · GEVANGEN';const h=result.querySelector('h2');if(h)h.textContent=caught.name||'Snazzle';const ps=result.querySelectorAll('p');if(ps[0])ps[0].textContent=`#${caught.number||'—'} · ${caught.rarity||'COMMON'}`;const visual=result.querySelector('.sn-ar-result-duck');if(visual&&caught.imageUrl)visual.innerHTML=`<img src="${String(caught.imageUrl).replace(/"/g,'&quot;')}" alt="${String(caught.name||'Snazzle').replace(/"/g,'&quot;')}">`;result.classList.add('show');}
  const badgeCount=$('#snArCount');if(badgeCount)badgeCount.textContent=String(list.length);
}

function wire(){
  customizeUi();const start=$('#snArStart'),duck=$('#snArCatchDuck'),hint=$('#snArCatchHint'),close=$('#snArClose'),launch=$('#snArLaunch');
  if(start&&!start.dataset.world85){start.dataset.world85='1';start.addEventListener('click',startReal,true);}
  for(const b of [duck,hint])if(b&&!b.dataset.world85){b.dataset.world85='1';b.addEventListener('click',catchReal,true);}
  if(close&&!close.dataset.world85){close.dataset.world85='1';close.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();stop();},true);}
  if(launch&&!launch.dataset.world85){launch.dataset.world85='1';launch.addEventListener('click',async()=>{customizeUi();const status=$('#snArStatus');if(status)status.textContent='Actieve AR Snazzles controleren…';try{await loadWorld();const n=villagePoints().length;if(status)status.textContent=n?`✅ ${n} actieve AR Snazzle${n===1?'':'s'} in ${localStorage.getItem('snazzleVillage')||'jouw dorp'} · bekijk de zoekzones op de kaart.`:`ℹ️ Er staat nu geen actieve AR Snazzle in ${localStorage.getItem('snazzleVillage')||'jouw dorp'}.`;}catch{if(status)status.textContent='AR-punten konden nu niet worden geladen.';}},false);}
  window.addEventListener('pagehide',stop,{once:true});
}

function boot(){if($('#snArStart'))wire();else{const ob=new MutationObserver(()=>{if($('#snArStart')){ob.disconnect();wire();}});if(document.body)ob.observe(document.body,{childList:true,subtree:true});}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SnazzleArWorldV85={reload:loadWorld,stop,openZones:openZoneMap};
