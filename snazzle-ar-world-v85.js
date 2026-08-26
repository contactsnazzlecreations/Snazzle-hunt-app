// Snazzle AR World v85.1 — gebruikt permanent door beheer geplaatste AR-punten.
// Exacte punten worden alleen tijdens de actieve AR-zoekactie gelezen; de route van het kind wordt niet opgeslagen.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth(), db=getFirestore();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=s=>document.querySelector(s);
const toRad=d=>d*Math.PI/180;
let world=[],target=null,stream=null,watchId=null,armed=false,currentAccuracy=0;

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

function customizeUi(){
  const tag=$('#snArLaunch .sn-ar-tag');if(tag)tag.textContent='LIVE';
  const small=$('#snArLaunch .sn-ar-copy small');if(small)small.textContent='Zoek echte geplaatste Snazzles met camera en GPS';
  const badge=$('#snArIntro .sn-ar-badge');if(badge)badge.textContent='SNAZZLE AR · GPS + CAMERA';
  const title=$('#snArIntro h2');if(title)title.textContent='Zoek een verborgen Snazzle ✨';
  const text=$('#snArIntro p:not(.sn-ar-privacy)');if(text)text.textContent='De app zoekt de dichtstbijzijnde actieve AR Snazzle in jouw gekozen dorp. Tijdens het lopen blijft de camera afgeschermd zodat je voor je kunt kijken.';
  const start=$('#snArStart');if(start)start.textContent='Zoek AR Snazzle';
  const privacy=$('#snArIntro .sn-ar-privacy');if(privacy)privacy.textContent='🔒 Je GPS wordt alleen tijdens het zoeken gebruikt. Jouw route of exacte positie wordt niet opgeslagen.';
}

function setVisible(on){
  $('#snArDuck')?.classList.toggle('sn-ar-hidden',!on);
  $('#snArReticle')?.classList.toggle('sn-ar-hidden',!on);
  $('#snArCatchHint')?.classList.toggle('sn-ar-hidden',!on);
  armed=on;
  window.SnazzleArSafetyV82b?.refresh?.();
}
function setTargetVisual(){
  if(!target)return;
  const catchBtn=$('#snArCatchDuck');
  if(catchBtn&&target.imageUrl){catchBtn.innerHTML=`<img src="${String(target.imageUrl).replace(/"/g,'&quot;')}" alt="${String(target.name||'Snazzle').replace(/"/g,'&quot;')}" style="width:100%;height:100%;object-fit:contain">`;}
}
function stop(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  if(watchId!==null&&navigator.geolocation){navigator.geolocation.clearWatch(watchId);watchId=null;}
  $('#snArOverlay')?.classList.remove('show');setVisible(false);target=null;currentAccuracy=0;
}

function update(pos){
  if(!target)return;
  const here=point(pos),remaining=dist(here,{lat:Number(target.lat),lon:Number(target.lon)}),radius=Math.max(4,Number(target.radius||7));currentAccuracy=Math.round(Number(pos.coords.accuracy||0));
  const reveal=remaining<=radius;
  setVisible(reveal);
  const hud=$('#snArHudText'),box=$('#snArDistance');
  if(reveal){if(hud)hud.textContent=`${target.name||'Snazzle'} gevonden · GPS ±${currentAccuracy} m`;if(box)box.textContent='Je bent op de juiste plek ✅';}
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
    if(status)status.textContent=`✅ ${target.name||'Snazzle'}-signaal gevonden · ongeveer ${remaining} m verderop.`;
    stream=await camera();const video=$('#snArCamera');if(video){video.srcObject=stream;await video.play().catch(()=>{});}$('#snArIntro')?.classList.remove('show');$('#snArOverlay')?.classList.add('show');
    const hud=$('#snArHudText'),box=$('#snArDistance');if(hud)hud.textContent=`Snazzle-signaal actief in ${target.village} · GPS ±${currentAccuracy} m`;if(box)box.textContent=`Nog ongeveer ${remaining} meter… 👣`;startWatch();update(pos);
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
  if(launch&&!launch.dataset.world85){launch.dataset.world85='1';launch.addEventListener('click',async()=>{customizeUi();const status=$('#snArStatus');if(status)status.textContent='Actieve AR Snazzles controleren…';try{await loadWorld();const n=villagePoints().length;if(status)status.textContent=n?`✅ ${n} actieve AR Snazzle${n===1?'':'s'} in ${localStorage.getItem('snazzleVillage')||'jouw dorp'}.`:`ℹ️ Er staat nu geen actieve AR Snazzle in ${localStorage.getItem('snazzleVillage')||'jouw dorp'}.`;}catch{if(status)status.textContent='AR-punten konden nu niet worden geladen.';}},false);}
  window.addEventListener('pagehide',stop,{once:true});
}

function boot(){if($('#snArStart'))wire();else{const ob=new MutationObserver(()=>{if($('#snArStart')){ob.disconnect();wire();}});if(document.body)ob.observe(document.body,{childList:true,subtree:true});}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SnazzleArWorldV85={reload:loadWorld,stop};