// Snazzle AR World v176 — snelle, begrensde GPS + camera start op mobiel.
// Exacte AR-punten blijven alleen tijdens de actieve zoekactie beschikbaar.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=s=>document.querySelector(s);
const toRad=d=>d*Math.PI/180;

let world=[];
let worldLoadedAt=0;
let worldPromise=null;
let target=null;
let stream=null;
let watchId=null;
let armed=false;
let starting=false;

const rarityInfo={COMMON:'COMMON',UNCOMMON:'UNCOMMON',RARE:'RARE',EPIC:'EPIC',GOLD:'GOLD',PLATINUM:'PLATINUM',BLACK:'BLACK',LEGENDARY:'LEGENDARY',SECRET:'SECRET'};

function timeoutPromise(ms,message){return new Promise((_,reject)=>setTimeout(()=>reject(new Error(message)),ms));}
function waitForUser(){
  if(auth.currentUser)return Promise.resolve(auth.currentUser);
  return new Promise(resolve=>{
    let done=false;
    const off=onAuthStateChanged(auth,u=>{if(u&&!done){done=true;off();resolve(u);}});
    setTimeout(()=>{if(!done){done=true;off();resolve(auth.currentUser);}},2200);
  });
}
function dist(a,b){
  const R=6371000,p1=toRad(a.lat),p2=toRad(b.lat),dp=toRad(b.lat-a.lat),dl=toRad(b.lon-a.lon);
  const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
function point(pos){return{lat:Number(pos.coords.latitude),lon:Number(pos.coords.longitude)};}
function normalizeRarity(v){const r=String(v||'COMMON').toUpperCase();return rarityInfo[r]?r:'COMMON';}
function villagePoints(){const village=localStorage.getItem('snazzleVillage')||'Montfort';return world.filter(p=>String(p.village||'')===village&&p.active!==false);}

async function loadWorld(force=false){
  const now=Date.now();
  if(!force&&worldLoadedAt&&now-worldLoadedAt<45000)return world;
  if(!force&&worldPromise)return worldPromise;
  worldPromise=(async()=>{
    await waitForUser();
    const snap=await Promise.race([getDoc(WORLD_DOC),timeoutPromise(5500,'De AR-punten laden duurt te lang.')]);
    const data=snap.exists()?snap.data():{};
    world=Array.isArray(data.points)?data.points.filter(p=>p&&p.active!==false&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon))):[];
    worldLoadedAt=Date.now();
    return world;
  })();
  try{return await worldPromise;}finally{worldPromise=null;}
}

function geoOnceFast(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund op dit toestel.'));
    navigator.geolocation.getCurrentPosition(resolve,e=>{
      const msg=e.code===1?'Locatietoestemming is geweigerd. Zet locatie aan voor Snazzle AR.':e.code===3?'GPS reageert te langzaam. Ga even buiten staan en probeer opnieuw.':'Je locatie kon niet worden bepaald.';
      reject(new Error(msg));
    },{enableHighAccuracy:true,timeout:7500,maximumAge:30000});
  });
}

function cameraFast(){
  return new Promise((resolve,reject)=>{
    if(!navigator.mediaDevices?.getUserMedia)return reject(new Error('Camera wordt niet ondersteund in deze browser.'));
    let settled=false;
    const timer=setTimeout(()=>{
      if(settled)return;settled=true;
      reject(new Error('Camera reageert te langzaam. Controleer de cameratoestemming en probeer opnieuw.'));
    },7500);
    navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:960},height:{ideal:540}},audio:false}).then(s=>{
      if(settled){s.getTracks().forEach(t=>t.stop());return;}
      settled=true;clearTimeout(timer);resolve(s);
    }).catch(err=>{
      if(settled)return;settled=true;clearTimeout(timer);
      const denied=err?.name==='NotAllowedError'||err?.name==='SecurityError';
      reject(new Error(denied?'Cameratoestemming is geweigerd. Sta camera toe voor Snazzle AR.':'Camera kon niet worden gestart.'));
    });
  });
}

function customizeUi(){
  const tag=$('#snArLaunch .sn-ar-tag');if(tag)tag.textContent='LIVE';
  const small=$('#snArLaunch .sn-ar-copy small');if(small)small.textContent='Zoek echte geplaatste Snazzles met camera en GPS';
  const badge=$('#snArIntro .sn-ar-badge');if(badge)badge.textContent='SNAZZLE AR · GPS + CAMERA';
  const title=$('#snArIntro h2');if(title)title.textContent='Zoek een verborgen Snazzle ✨';
  const text=$('#snArIntro p:not(.sn-ar-privacy)');if(text)text.textContent='Bekijk eerst ongeveer waar Snazzles zitten op de kaart, en start daarna de AR-zoektocht. Tijdens het lopen blijft de camera afgeschermd zodat je voor je kunt kijken.';
  const start=$('#snArStart');if(start)start.textContent='Zoek AR Snazzle';
  const privacy=$('#snArIntro .sn-ar-privacy');if(privacy)privacy.textContent='🔒 Je GPS wordt alleen tijdens het zoeken gebruikt. De kaart toont geen exacte Snazzle-locaties en jouw route wordt niet opgeslagen.';
}
function setVisible(on){
  $('#snArDuck')?.classList.toggle('sn-ar-hidden',!on);
  $('#snArReticle')?.classList.toggle('sn-ar-hidden',!on);
  $('#snArCatchHint')?.classList.toggle('sn-ar-hidden',!on);
  armed=on;
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
  if(catchBtn&&target.imageUrl)catchBtn.innerHTML=`<img src="${String(target.imageUrl).replace(/"/g,'&quot;')}" alt="${String(target.name||'Snazzle').replace(/"/g,'&quot;')}" style="width:100%;height:100%;object-fit:contain">`;
  applySavedPlacement();
}
function stop(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  if(watchId!==null&&navigator.geolocation){navigator.geolocation.clearWatch(watchId);watchId=null;}
  $('#snArOverlay')?.classList.remove('show');
  setVisible(false);resetPlacementVisual();target=null;armed=false;starting=false;
}
function update(pos){
  if(!target)return;
  const here=point(pos),remaining=dist(here,{lat:Number(target.lat),lon:Number(target.lon)}),radius=Math.max(4,Number(target.radius||7)),accuracy=Math.round(Number(pos.coords.accuracy||0));
  const reveal=remaining<=radius;
  setVisible(reveal);
  const hud=$('#snArHudText'),box=$('#snArDistance');
  if(reveal){
    if(hud)hud.textContent=`${target.name||'Snazzle'} gevonden · GPS ±${accuracy} m`;
    if(box)box.textContent=target.placement?.mode==='camera-composed'?'Je bent op de juiste plek ✅ · kijk rond met de camera':'Je bent op de juiste plek ✅';
  }else{
    if(hud)hud.textContent=`${normalizeRarity(target.rarity)} Snazzle-signaal · GPS ±${accuracy} m`;
    if(box)box.textContent=`Nog ongeveer ${Math.max(0,Math.round(remaining))} meter… 👣`;
  }
}
function startWatch(){
  if(watchId!==null)navigator.geolocation.clearWatch(watchId);
  watchId=navigator.geolocation.watchPosition(update,()=>{const b=$('#snArDistance');if(b)b.textContent='GPS-signaal even kwijt… blijf buiten en wacht kort.';},{enableHighAccuracy:true,timeout:12000,maximumAge:1500});
}

async function startReal(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();
  if(starting)return;
  starting=true;
  const btn=$('#snArStart'),status=$('#snArStatus');
  if(btn)btn.disabled=true;
  try{
    if(status)status.textContent='⚡ AR direct klaarzetten…';
    const points=await loadWorld();
    const choices=villagePoints();
    if(!choices.length){if(status)status.textContent=`ℹ️ Er staat nu geen actieve AR Snazzle in ${localStorage.getItem('snazzleVillage')||'dit dorp'}.`;return;}

    if(status)status.textContent='📍 GPS en camera verbinden…';
    const [pos,camStream]=await Promise.all([geoOnceFast(),cameraFast()]);
    stream=camStream;

    const here=point(pos);
    target=choices.slice().sort((a,b)=>dist(here,a)-dist(here,b))[0];
    setTargetVisual();setVisible(false);

    const video=$('#snArCamera');
    if(video){video.srcObject=stream;video.play().catch(()=>{});}
    $('#snArIntro')?.classList.remove('show');
    $('#snArOverlay')?.classList.add('show');

    const remaining=Math.round(dist(here,{lat:Number(target.lat),lon:Number(target.lon)}));
    const accuracy=Math.round(Number(pos.coords.accuracy||0));
    const hud=$('#snArHudText'),box=$('#snArDistance');
    if(hud)hud.textContent=`${normalizeRarity(target.rarity)} Snazzle-signaal actief · GPS ±${accuracy} m`;
    if(box)box.textContent=`Nog ongeveer ${remaining} meter… 👣`;
    startWatch();update(pos);
  }catch(err){
    stop();
    if(status)status.textContent='⚠️ '+(err?.message||'AR kon niet starten.');
  }finally{
    starting=false;
    if(btn)btn.disabled=false;
  }
}

function caughtList(){try{return JSON.parse(localStorage.getItem('snazzleARCollection')||'[]')}catch{return[]}}
function catchReal(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();if(!armed||!target)return;
  const caught=target,list=caughtList();armed=false;
  if(!list.some(x=>x.id===caught.id)){
    list.push({id:caught.id,number:caught.number||'—',name:caught.name||'Snazzle',rarity:caught.rarity||'COMMON',village:caught.village,caughtAt:new Date().toISOString(),edition:'Snazzle AR'});
    localStorage.setItem('snazzleARCollection',JSON.stringify(list));
  }
  try{navigator.vibrate?.([80,50,120]);}catch{}
  stop();
  const result=$('#snArResult');
  if(result){
    const badge=result.querySelector('.sn-ar-badge');if(badge)badge.textContent='SNAZZLE AR · GEVANGEN';
    const h=result.querySelector('h2');if(h)h.textContent=caught.name||'Snazzle';
    const ps=result.querySelectorAll('p');if(ps[0])ps[0].textContent=`#${caught.number||'—'} · ${caught.rarity||'COMMON'}`;
    const visual=result.querySelector('.sn-ar-result-duck');if(visual&&caught.imageUrl)visual.innerHTML=`<img src="${String(caught.imageUrl).replace(/"/g,'&quot;')}" alt="${String(caught.name||'Snazzle').replace(/"/g,'&quot;')}">`;
    result.classList.add('show');
  }
  const badgeCount=$('#snArCount');if(badgeCount)badgeCount.textContent=String(list.length);
}

function wire(){
  customizeUi();
  const start=$('#snArStart'),duck=$('#snArCatchDuck'),hint=$('#snArCatchHint'),close=$('#snArClose'),launch=$('#snArLaunch');
  if(start&&!start.dataset.world176){start.dataset.world176='1';start.addEventListener('click',startReal,true);}
  for(const b of [duck,hint])if(b&&!b.dataset.world176){b.dataset.world176='1';b.addEventListener('click',catchReal,true);}
  if(close&&!close.dataset.world176){close.dataset.world176='1';close.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();stop();},true);}
  if(launch&&!launch.dataset.world176){
    launch.dataset.world176='1';
    launch.addEventListener('click',async()=>{
      customizeUi();
      const status=$('#snArStatus');if(status)status.textContent='Actieve AR Snazzles controleren…';
      try{
        const points=await loadWorld();const n=villagePoints().length;
        if(status)status.textContent=n?`✅ ${n} actieve AR Snazzle${n===1?'':'s'} in ${localStorage.getItem('snazzleVillage')||'jouw dorp'} · bekijk de zoekzones op de kaart.`:`ℹ️ Er staat nu geen actieve AR Snazzle in ${localStorage.getItem('snazzleVillage')||'jouw dorp'}.`;
      }catch(err){if(status)status.textContent='⚠️ '+(err?.message||'AR-punten konden niet worden geladen.');}
    },false);
  }
  window.addEventListener('pagehide',stop,{once:true});
  setTimeout(()=>loadWorld().catch(()=>{}),250);
}

function boot(){
  if($('#snArStart'))wire();
  else{
    const ob=new MutationObserver(()=>{if($('#snArStart')){ob.disconnect();wire();}});
    if(document.body)ob.observe(document.body,{childList:true,subtree:true});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.SnazzleArWorldV85={reload:loadWorld,stop,openZones:()=>{location.href='./snazzle-zones.html?v=176';}};
