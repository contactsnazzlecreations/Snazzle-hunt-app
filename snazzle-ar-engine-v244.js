// Snazzle AR Engine v244 — één controller voor camera, GPS, werelddata en vangen.
// Vervangt de overlappende AR-world/global controllers. Exacte AR-coördinaten blijven alleen
// tijdens de actieve zoeksessie in het geheugen; de route van de zoeker wordt niet opgeslagen.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const DEFAULT_MAX_RADIUS_KM=25;
const $=s=>document.querySelector(s);
const toRad=d=>d*Math.PI/180;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

let world=[];
let worldLoadedAt=0;
let worldPromise=null;
let maxRadiusKm=DEFAULT_MAX_RADIUS_KM;
let target=null;
let stream=null;
let watchId=null;
let starting=false;
let armed=false;
let revealed=false;
let installed=false;
let originalDuckHtml='';
let originalResultHtml='';

function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function activePoints(points){return (Array.isArray(points)?points:[]).filter(p=>p&&p.active!==false&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon)));}
function point(pos){return{lat:Number(pos.coords.latitude),lon:Number(pos.coords.longitude)};}
function dist(a,b){
  const R=6371000,p1=toRad(a.lat),p2=toRad(b.lat),dp=toRad(b.lat-a.lat),dl=toRad(b.lon-a.lon);
  const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
function areaLabel(v){return String(v||'Algemeen')==='Algemeen'?'Algemeen / overal':String(v||'Algemeen');}
function rarity(v){return String(v||'COMMON').toUpperCase();}
function radiusLabel(v=maxRadiusKm){return Number(v)%1===0?`${Number(v)} km`:`${Number(v).toFixed(1)} km`;}
function clampSearchRadius(v){const n=Number(v);return Number.isFinite(n)?clamp(n,.1,1000):DEFAULT_MAX_RADIUS_KM;}
function timeout(ms,message){return new Promise((_,reject)=>setTimeout(()=>reject(new Error(message)),ms));}

async function waitForUser(){
  if(auth.currentUser)return auth.currentUser;
  return new Promise(resolve=>{
    let done=false;
    const off=onAuthStateChanged(auth,u=>{if(done||!u)return;done=true;off();resolve(u);});
    setTimeout(()=>{if(done)return;done=true;off();resolve(auth.currentUser);},1600);
  });
}

async function loadWorld(force=false){
  const now=Date.now();
  if(!force&&worldLoadedAt&&now-worldLoadedAt<45000)return world;
  if(!force&&worldPromise)return worldPromise;
  worldPromise=(async()=>{
    await waitForUser();
    const snap=await Promise.race([getDoc(WORLD_DOC),timeout(6500,'AR-punten laden duurt te lang.')]);
    const data=snap.exists()?snap.data():{};
    world=activePoints(data.points);
    maxRadiusKm=clampSearchRadius(data.arMaxSearchRadiusKm??DEFAULT_MAX_RADIUS_KM);
    worldLoadedAt=Date.now();
    return world;
  })();
  try{return await worldPromise;}finally{worldPromise=null;}
}

function geoQuick(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund op dit toestel.'));
    navigator.geolocation.getCurrentPosition(resolve,e=>{
      const msg=e.code===1?'Locatietoestemming is geweigerd. Geef Snazzle toegang tot je locatie.':e.code===3?'GPS reageert te langzaam. Controleer of locatie aan staat.':'Je locatie kon niet worden bepaald.';
      reject(new Error(msg));
    },{enableHighAccuracy:false,timeout:5500,maximumAge:30000});
  });
}

function timedCamera(constraints,ms=7500){
  let expired=false;
  const request=navigator.mediaDevices.getUserMedia(constraints).then(s=>{
    if(expired){try{s.getTracks().forEach(t=>t.stop());}catch{}throw new Error('camera-timeout');}
    return s;
  });
  const timer=new Promise((_,reject)=>setTimeout(()=>{expired=true;reject(new Error('camera-timeout'));},ms));
  return Promise.race([request,timer]);
}

async function openCamera(){
  if(!window.isSecureContext)throw new Error('Camera werkt alleen via een beveiligde HTTPS-verbinding.');
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera wordt niet ondersteund op dit toestel.');
  let s;
  try{
    s=await timedCamera({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false},7500);
  }catch(err){
    if(err?.name==='NotAllowedError'||err?.name==='SecurityError')throw new Error('Cameratoestemming is geweigerd. Geef Snazzle cameratoegang.');
    if(err?.message==='camera-timeout')throw new Error('Camera reageert te langzaam. Sluit andere camera-apps en probeer opnieuw.');
    try{s=await timedCamera({video:true,audio:false},6500);}catch(err2){
      if(err2?.name==='NotAllowedError'||err2?.name==='SecurityError')throw new Error('Cameratoestemming is geweigerd. Geef Snazzle cameratoegang.');
      if(err2?.name==='NotFoundError')throw new Error('Geen camera gevonden op dit toestel.');
      throw new Error('Camera kon niet worden gestart. Probeer de app opnieuw te openen.');
    }
  }
  return s;
}

function isCameraPlacement(p){
  const mode=String(p?.placement?.mode||'').toLowerCase();
  return ['camera-composed','direct-map-camera','camera-v244','camera'].includes(mode);
}

function resetPlacementVisual(){
  const duck=$('#snArDuck'),catchBtn=$('#snArCatchDuck');
  if(duck){duck.style.left='';duck.style.top='';duck.style.width='';duck.style.height='';}
  if(catchBtn)catchBtn.style.transform='';
}

function applySavedPlacement(){
  resetPlacementVisual();
  if(!target?.placement||!isCameraPlacement(target))return;
  const duck=$('#snArDuck'),catchBtn=$('#snArCatchDuck');
  if(!duck)return;
  const x=clamp(Number(target.placement.x||.5),.06,.94);
  const y=clamp(Number(target.placement.y||.48),.12,.9);
  const size=clamp(Number(target.placement.size||.34),.18,.62);
  const rotation=clamp(Number(target.placement.rotation||0),-180,180);
  duck.style.left=`${x*100}%`;
  duck.style.top=`${y*100}%`;
  duck.style.width=`${size*100}vw`;
  duck.style.height=`${size*100}vw`;
  if(catchBtn)catchBtn.style.transform=`rotate(${rotation}deg)`;
}

function setTargetVisual(){
  const catchBtn=$('#snArCatchDuck');
  if(!catchBtn||!target)return;
  if(!originalDuckHtml)originalDuckHtml=catchBtn.innerHTML;
  catchBtn.innerHTML=target.imageUrl
    ? `<img src="${String(target.imageUrl).replace(/"/g,'&quot;')}" alt="${String(target.name||'Snazzle').replace(/"/g,'&quot;')}" style="width:100%;height:100%;object-fit:contain">`
    : originalDuckHtml;
  applySavedPlacement();
}

function setVisible(on){
  if(revealed===on&&armed===on)return;
  revealed=on;armed=on;
  $('#snArDuck')?.classList.toggle('sn-ar-hidden',!on);
  $('#snArReticle')?.classList.toggle('sn-ar-hidden',!on);
  $('#snArCatchHint')?.classList.toggle('sn-ar-hidden',!on);
}

function stopSession({showIntro=false}={}){
  if(stream){try{stream.getTracks().forEach(t=>t.stop());}catch{}stream=null;}
  const video=$('#snArCamera');
  if(video){try{video.pause();}catch{}video.srcObject=null;}
  if(watchId!==null&&navigator.geolocation){navigator.geolocation.clearWatch(watchId);watchId=null;}
  $('#snArOverlay')?.classList.remove('show');
  setVisible(false);
  resetPlacementVisual();
  target=null;armed=false;revealed=false;starting=false;
  window.__snazzleArPriority=false;
  if(showIntro)$('#snArIntro')?.classList.add('show');
}

function updatePosition(pos){
  if(!target)return;
  const here=point(pos);
  const remaining=dist(here,{lat:Number(target.lat),lon:Number(target.lon)});
  const baseRadius=Math.max(4,Number(target.radius||7));
  const accuracy=Math.max(0,Number(pos.coords.accuracy||0));
  const accuracyOk=accuracy<=60;
  const enterRadius=baseRadius+Math.min(5,accuracy*.18);
  const leaveRadius=baseRadius+8;
  const shouldReveal=revealed ? remaining<=leaveRadius : (accuracyOk&&remaining<=enterRadius);
  setVisible(shouldReveal);
  const hud=$('#snArHudText'),box=$('#snArDistance');
  if(shouldReveal){
    setText(hud,`${target.name||'Snazzle'} gevonden · GPS ±${Math.round(accuracy)} m`);
    setText(box,isCameraPlacement(target)?'Je bent op de juiste plek ✅ · kijk rond zoals hij geplaatst is':'Je bent op de juiste plek ✅ · tik op de Snazzle');
  }else if(!accuracyOk&&remaining<Math.max(35,baseRadius*4)){
    setText(hud,`${rarity(target.rarity)} Snazzle-signaal · GPS ±${Math.round(accuracy)} m`);
    setText(box,'GPS is nog te onnauwkeurig. Blijf even buiten staan… 📍');
  }else{
    setText(hud,`${rarity(target.rarity)} Snazzle-signaal · ${areaLabel(target.village)} · GPS ±${Math.round(accuracy)} m`);
    setText(box,`Nog ongeveer ${Math.max(0,Math.round(remaining))} meter… 👣`);
  }
}

function startWatch(){
  if(watchId!==null)navigator.geolocation.clearWatch(watchId);
  watchId=navigator.geolocation.watchPosition(updatePosition,err=>{
    const box=$('#snArDistance');
    if(box)setText(box,err?.code===1?'Locatietoegang is uitgezet. Geef Snazzle locatietoegang.':'GPS-signaal even kwijt… blijf buiten en wacht kort.');
  },{enableHighAccuracy:true,timeout:15000,maximumAge:1000});
}

async function startAr(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();
  if(starting)return;
  starting=true;window.__snazzleArPriority=true;
  const btn=$('#snArStart'),status=$('#snArStatus'),intro=$('#snArIntro'),overlay=$('#snArOverlay');
  const hud=$('#snArHudText'),box=$('#snArDistance'),video=$('#snArCamera');
  if(btn)btn.disabled=true;
  intro?.classList.remove('show');overlay?.classList.add('show');
  setVisible(false);
  setText(hud,'📷 Camera openen…');setText(box,'📍 Locatie en Snazzle-punten bepalen…');
  try{
    const cameraTask=openCamera().then(s=>{
      stream=s;
      if(video){video.srcObject=s;video.play().catch(()=>{});}
      setText(hud,'✅ Camera klaar · locatie bepalen…');
      return s;
    });
    const [cam,pos,points]=await Promise.all([cameraTask,geoQuick(),loadWorld(true)]);
    void cam;
    if(!points.length)throw new Error('Er staan nu geen actieve AR Snazzles op de kaart.');
    const here=point(pos);
    const sorted=points.slice().sort((a,b)=>dist(here,a)-dist(here,b));
    const nearest=sorted[0],nearestMeters=dist(here,nearest);
    if(nearestMeters>maxRadiusKm*1000)throw new Error(`Geen actieve Snazzle binnen ${radiusLabel()}. Bekijk de Snazzle-zones op de kaart.`);
    target=nearest;
    setTargetVisual();
    setText(hud,`${rarity(target.rarity)} Snazzle-signaal · ${areaLabel(target.village)}`);
    setText(box,`Dichtstbijzijnde Snazzle: nog ongeveer ${Math.round(nearestMeters)} meter… 👣`);
    startWatch();
    updatePosition(pos);
  }catch(err){
    console.error('Snazzle AR v244 start',err);
    stopSession({showIntro:true});
    setText(status,'⚠️ '+(err?.message||'AR kon niet starten.'));
  }finally{
    starting=false;
    if(btn)btn.disabled=false;
  }
}

function caughtList(){try{return JSON.parse(localStorage.getItem('snazzleARCollection')||'[]')}catch{return[]}}
function catchSnazzle(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();
  if(!armed||!target)return;
  const caught=target,list=caughtList();
  armed=false;
  if(!list.some(x=>x.id===caught.id)){
    list.push({id:caught.id,number:caught.number||'—',name:caught.name||'Snazzle',rarity:caught.rarity||'COMMON',village:areaLabel(caught.village),caughtAt:new Date().toISOString(),edition:'Snazzle AR'});
    localStorage.setItem('snazzleARCollection',JSON.stringify(list));
  }
  try{navigator.vibrate?.([80,50,120]);}catch{}
  stopSession();
  const result=$('#snArResult');
  if(result){
    setText(result.querySelector('.sn-ar-badge'),'SNAZZLE AR · GEVANGEN');
    setText(result.querySelector('h2'),caught.name||'Snazzle');
    const ps=result.querySelectorAll('p');
    if(ps[0])setText(ps[0],`#${caught.number||'—'} · ${caught.rarity||'COMMON'} · ${areaLabel(caught.village)}`);
    const visual=result.querySelector('.sn-ar-result-duck');
    if(visual){
      if(!originalResultHtml)originalResultHtml=visual.innerHTML;
      visual.innerHTML=caught.imageUrl?`<img src="${String(caught.imageUrl).replace(/"/g,'&quot;')}" alt="${String(caught.name||'Snazzle').replace(/"/g,'&quot;')}">`:originalResultHtml;
    }
    result.classList.add('show');
  }
  setText($('#snArCount'),String(list.length));
}

function ensureIntroClose(){
  const panel=$('#snArIntro .sn-ar-panel');
  if(!panel||$('#snArIntroCloseV244'))return;
  const style=document.createElement('style');style.id='snArIntroCloseV244Style';style.textContent=`#snArIntro .sn-ar-panel{position:relative!important;padding-top:38px!important}#snArIntroCloseV244{position:absolute;right:12px;top:12px;width:46px;height:46px;border:2px solid rgba(255,255,255,.75);border-radius:14px;background:#70472b;color:#fff;font-size:30px;font-weight:1000;display:grid;place-items:center;z-index:20;touch-action:manipulation}`;document.head.appendChild(style);
  const b=document.createElement('button');b.id='snArIntroCloseV244';b.type='button';b.textContent='×';b.setAttribute('aria-label','Sluit Snazzle AR');panel.prepend(b);
  b.addEventListener('click',()=>{stopSession();$('#snArIntro')?.classList.remove('show');});
}

function ensureZoneLink(){
  const existing=$('#snArZoneNativeOpen');
  if(existing){existing.href='./snazzle-zones.html?v=244';existing.textContent='🗺️ Bekijk alle Snazzle-zones';return;}
  const old=$('#snArZoneOpen');
  if(!old)return;
  const a=document.createElement('a');a.id='snArZoneNativeOpen';a.className=old.className||'sn-ar-zone-btn';a.href='./snazzle-zones.html?v=244';a.textContent='🗺️ Bekijk alle Snazzle-zones';a.setAttribute('role','button');old.replaceWith(a);
}

async function refreshIntro(){
  const status=$('#snArStatus');
  setText($('#snArLaunch .sn-ar-copy small'),'Zoek geplaatste Snazzles met camera en GPS');
  setText($('#snArIntro p:not(.sn-ar-privacy)'),`Bekijk eventueel eerst de Snazzle-zones. Daarna kiest AR automatisch de dichtstbijzijnde actieve Snazzle binnen maximaal ${radiusLabel()}.`);
  setText($('#snArStart'),'Zoek dichtstbijzijnde AR Snazzle');
  try{
    const points=await loadWorld();
    if(status&&$('#snArIntro')?.classList.contains('show'))setText(status,points.length?`✅ ${points.length} actieve AR Snazzle${points.length===1?'':'s'} klaar · zoeken tot ${radiusLabel()}.`:'ℹ️ Er staan nu geen actieve AR Snazzles op de kaart.');
  }catch(err){if(status&&$('#snArIntro')?.classList.contains('show'))setText(status,'⚠️ AR-punten konden niet worden geladen. Controleer internet.');}
}

function bindControl(selector,handler){
  const old=$(selector);if(!old)return false;
  const fresh=old.cloneNode(true);old.replaceWith(fresh);fresh.addEventListener('click',handler,{capture:true});return true;
}

function install(){
  if(installed)return true;
  if(!$('#snArStart')||!$('#snArCatchDuck')||!$('#snArClose'))return false;
  const duck=$('#snArCatchDuck');if(duck&&!originalDuckHtml)originalDuckHtml=duck.innerHTML;
  const rv=$('#snArResult .sn-ar-result-duck');if(rv&&!originalResultHtml)originalResultHtml=rv.innerHTML;
  bindControl('#snArStart',startAr);
  bindControl('#snArCatchDuck',catchSnazzle);
  if($('#snArCatchHint'))bindControl('#snArCatchHint',catchSnazzle);
  bindControl('#snArClose',e=>{e.preventDefault();e.stopImmediatePropagation();stopSession();});
  ensureIntroClose();ensureZoneLink();
  $('#snArLaunch')?.addEventListener('click',()=>{window.__snazzleArPriority=true;setTimeout(refreshIntro,40);});
  $('#snArCancel')?.addEventListener('click',()=>{window.__snazzleArPriority=false;});
  window.addEventListener('pagehide',()=>stopSession(),{once:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&$('#snArOverlay')?.classList.contains('show'))stopSession({showIntro:true});});
  installed=true;
  refreshIntro();
  return true;
}

function boot(){
  if(install())return;
  const ob=new MutationObserver(()=>{if(install())ob.disconnect();});
  if(document.body)ob.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

// Compatibiliteit voor bestaande menu/kaartmodules die de oude world-API aanroepen.
window.SnazzleArWorldV85={reload:(force=false)=>loadWorld(force),get points(){return world.slice();}};
window.SnazzleArEngineV244={reload:(force=false)=>loadWorld(force),refresh:refreshIntro,stop:stopSession,get maxRadiusKm(){return maxRadiusKm;}};
console.info('Snazzle AR Engine v244 actief');
