// Snazzle AR Engine v293 — AR-afbeeldingen uit beveiligde Firestore-opslag.
// Tweede systematische stabiliteitspass: sessie-races afgevangen, verse GPS-start en reeds gevangen punten overslaan.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const DEFAULT_MAX_RADIUS_KM=25;
const START_GOOD_ACCURACY_M=25;
const REVEAL_MAX_ACCURACY_M=20;
const GPS_SAMPLE_WINDOW_MS=7000;
const MIN_STABLE_SAMPLES=3;
const MAX_STABILITY_SPREAD_M=16;
const $=s=>document.querySelector(s);
const toRad=d=>d*Math.PI/180;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

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
let sessionToken=0;
let lifecycleInstalled=false;
let gpsSamples=[];
let originalDuckHtml='';
let originalResultHtml='';
const arImageCache=new Map();

function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
function activePoints(points){return(Array.isArray(points)?points:[]).filter(p=>p&&p.active!==false&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon)));}
async function resolveArImage(point){
  if(!point||point.imageUrl||!point.imageDocId)return point;
  const id=String(point.imageDocId);
  if(arImageCache.has(id))return{...point,imageUrl:arImageCache.get(id)||''};
  try{
    const snap=await Promise.race([getDoc(doc(db,'snazzleArImages',id)),timeout(4500,'AR-afbeelding laden duurt te lang.')]);
    const dataUrl=snap.exists()?String(snap.data()?.dataUrl||''):'';
    arImageCache.set(id,dataUrl);
    return{...point,imageUrl:dataUrl};
  }catch{
    arImageCache.set(id,'');
    return point;
  }
}
async function resolveArImages(points){return Promise.all((Array.isArray(points)?points:[]).map(resolveArImage))}

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
function stopTracks(s){if(!s)return;try{s.getTracks().forEach(t=>t.stop());}catch{}}

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
  if(worldPromise)return worldPromise;
  worldPromise=(async()=>{
    await waitForUser();
    const snap=await Promise.race([getDoc(WORLD_DOC),timeout(6500,'AR-punten laden duurt te lang.')]);
    const data=snap.exists()?snap.data():{};
    world=await resolveArImages(activePoints(data.points));
    maxRadiusKm=clampSearchRadius(data.arMaxSearchRadiusKm??DEFAULT_MAX_RADIUS_KM);
    worldLoadedAt=Date.now();
    return world;
  })();
  try{return await worldPromise;}finally{worldPromise=null;}
}

function requestPosition(options){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund op dit toestel.'));
    navigator.geolocation.getCurrentPosition(resolve,reject,options);
  });
}
async function getStartPosition(){
  let quick=null;
  try{
    quick=await requestPosition({enableHighAccuracy:false,timeout:3500,maximumAge:3000});
  }catch(err){
    if(err?.code===1)throw new Error('Locatietoestemming is geweigerd. Geef Snazzle toegang tot je locatie.');
  }
  const quickAccuracy=Number(quick?.coords?.accuracy??Infinity);
  if(quick&&quickAccuracy<=START_GOOD_ACCURACY_M)return quick;
  try{
    const precise=await requestPosition({enableHighAccuracy:true,timeout:9000,maximumAge:0});
    const preciseAccuracy=Number(precise?.coords?.accuracy??Infinity);
    return quick&&quickAccuracy<preciseAccuracy?quick:precise;
  }catch(err){
    if(quick)return quick;
    const msg=err?.code===1?'Locatietoestemming is geweigerd. Geef Snazzle toegang tot je locatie.':err?.code===3?'GPS reageert te langzaam. Controleer of locatie aan staat.':'Je locatie kon niet worden bepaald.';
    throw new Error(msg);
  }
}

function resetGpsSamples(){gpsSamples=[];}
function stabilizedFix(pos){
  const lat=Number(pos?.coords?.latitude),lon=Number(pos?.coords?.longitude),accuracy=Math.max(0,Number(pos?.coords?.accuracy??Infinity));
  if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
  const now=Date.now();
  gpsSamples.push({lat,lon,accuracy,at:now});
  gpsSamples=gpsSamples.filter(s=>now-s.at<=GPS_SAMPLE_WINDOW_MS).slice(-10);
  const usable=gpsSamples.filter(s=>Number.isFinite(s.accuracy)&&s.accuracy<=35);
  if(!usable.length)return{lat,lon,accuracy,samples:1,spread:Infinity,rawAccuracy:accuracy};
  let sumW=0,sumLat=0,sumLon=0;
  for(const s of usable){
    const w=1/Math.pow(Math.max(4,s.accuracy),2);
    sumW+=w;sumLat+=s.lat*w;sumLon+=s.lon*w;
  }
  const fixed={lat:sumLat/sumW,lon:sumLon/sumW};
  const spread=usable.reduce((m,s)=>Math.max(m,dist(fixed,s)),0);
  const bestAccuracy=Math.min(...usable.map(s=>s.accuracy));
  return{...fixed,accuracy:Math.max(bestAccuracy,spread),samples:usable.length,spread,rawAccuracy:accuracy};
}

function timedCamera(constraints,ms=7500){
  let expired=false;
  const request=navigator.mediaDevices.getUserMedia(constraints).then(s=>{
    if(expired){stopTracks(s);throw new Error('camera-timeout');}
    return s;
  });
  const timer=new Promise((_,reject)=>setTimeout(()=>{expired=true;reject(new Error('camera-timeout'));},ms));
  return Promise.race([request,timer]);
}
async function openCamera(){
  if(!window.isSecureContext)throw new Error('Camera werkt alleen via een beveiligde HTTPS-verbinding.');
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera wordt niet ondersteund op dit toestel.');
  try{
    return await timedCamera({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false},7500);
  }catch(err){
    if(err?.name==='NotAllowedError'||err?.name==='SecurityError')throw new Error('Cameratoestemming is geweigerd. Geef Snazzle cameratoegang.');
    if(err?.message==='camera-timeout')throw new Error('Camera reageert te langzaam. Sluit andere camera-apps en probeer opnieuw.');
    try{return await timedCamera({video:true,audio:false},6500);}catch(err2){
      if(err2?.name==='NotAllowedError'||err2?.name==='SecurityError')throw new Error('Cameratoestemming is geweigerd. Geef Snazzle cameratoegang.');
      if(err2?.name==='NotFoundError')throw new Error('Geen camera gevonden op dit toestel.');
      if(err2?.message==='camera-timeout')throw new Error('Camera reageert te langzaam. Sluit andere camera-apps en probeer opnieuw.');
      throw new Error('Camera kon niet worden gestart. Probeer de app opnieuw te openen.');
    }
  }
}

function isCameraPlacement(p){
  const mode=String(p?.placement?.mode||'').toLowerCase();
  return ['camera-composed','direct-map-camera','camera-v244','camera-v245','camera'].includes(mode);
}
function mappedPlacement(){
  const p=target?.placement||{};
  let x=clamp(Number(p.x||.5),.06,.94),y=clamp(Number(p.y||.48),.12,.9),size=clamp(Number(p.size||.34),.18,.62);
  const sourceX=Number(p.sourceX),sourceY=Number(p.sourceY),sourceSize=Number(p.sourceSize);
  const video=$('#snArCamera'),stage=$('#snArOverlay');
  if(Number.isFinite(sourceX)&&Number.isFinite(sourceY)&&Number.isFinite(sourceSize)&&video?.videoWidth&&video?.videoHeight&&stage){
    const r=stage.getBoundingClientRect();
    if(r.width&&r.height){
      const scale=Math.max(r.width/video.videoWidth,r.height/video.videoHeight);
      const renderedWidth=video.videoWidth*scale,renderedHeight=video.videoHeight*scale;
      const cropX=Math.max(0,(renderedWidth-r.width)/2),cropY=Math.max(0,(renderedHeight-r.height)/2);
      x=clamp((sourceX*renderedWidth-cropX)/r.width,.04,.96);
      y=clamp((sourceY*renderedHeight-cropY)/r.height,.08,.92);
      size=clamp((sourceSize*renderedWidth)/r.width,.14,.68);
    }
  }
  return{x,y,size,rotation:clamp(Number(p.rotation||0),-180,180)};
}
function resetPlacementVisual(){
  const duck=$('#snArDuck'),catchBtn=$('#snArCatchDuck');
  if(duck){duck.style.left='';duck.style.top='';duck.style.width='';duck.style.height='';duck.style.aspectRatio='';}
  if(catchBtn)catchBtn.style.transform='';
}
function applySavedPlacement(){
  resetPlacementVisual();
  if(!target?.placement||!isCameraPlacement(target))return;
  const duck=$('#snArDuck'),catchBtn=$('#snArCatchDuck');if(!duck)return;
  const {x,y,size,rotation}=mappedPlacement();
  duck.style.left=`${x*100}%`;duck.style.top=`${y*100}%`;duck.style.width=`${size*100}%`;duck.style.height='auto';duck.style.aspectRatio='1 / 1';
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
  const video=$('#snArCamera');
  if(video&&!video.dataset.snPlacementMap274){video.dataset.snPlacementMap274='1';video.addEventListener('loadedmetadata',()=>{if(target)applySavedPlacement();});}
}
function setVisible(on){
  if(revealed===on&&armed===on)return;
  revealed=on;armed=on;
  $('#snArDuck')?.classList.toggle('sn-ar-hidden',!on);
  $('#snArReticle')?.classList.toggle('sn-ar-hidden',!on);
  $('#snArCatchHint')?.classList.toggle('sn-ar-hidden',!on);
}

function stopSession({showIntro=false}={}){
  sessionToken++;
  stopTracks(stream);stream=null;
  const video=$('#snArCamera');
  if(video){try{video.pause();}catch{}video.srcObject=null;}
  if(watchId!==null&&navigator.geolocation){navigator.geolocation.clearWatch(watchId);watchId=null;}
  $('#snArOverlay')?.classList.remove('show');
  setVisible(false);resetPlacementVisual();
  target=null;armed=false;revealed=false;starting=false;resetGpsSamples();
  window.__snazzleArPriority=false;
  if(showIntro)$('#snArIntro')?.classList.add('show');
}

function updatePosition(pos,token=sessionToken){
  if(token!==sessionToken||!target)return;
  const fix=stabilizedFix(pos);if(!fix)return;
  const here={lat:fix.lat,lon:fix.lon};
  const remaining=dist(here,{lat:Number(target.lat),lon:Number(target.lon)});
  const baseRadius=Math.max(4,Number(target.radius||7));
  const accuracy=Math.max(0,Number(fix.accuracy||Infinity));
  const accuracyOk=accuracy<=REVEAL_MAX_ACCURACY_M;
  const samplesOk=fix.samples>=MIN_STABLE_SAMPLES;
  const stabilityOk=fix.spread<=MAX_STABILITY_SPREAD_M;
  const enterRadius=baseRadius+1.5;
  const leaveRadius=baseRadius+5;
  const shouldReveal=revealed
    ? accuracy<=30&&remaining<=leaveRadius
    : accuracyOk&&samplesOk&&stabilityOk&&remaining<=enterRadius;
  setVisible(shouldReveal);
  const hud=$('#snArHudText'),box=$('#snArDistance');
  if(shouldReveal){
    setText(hud,`${target.name||'Snazzle'} gevonden · GPS stabiel ±${Math.round(accuracy)} m`);
    setText(box,isCameraPlacement(target)?'Je bent op de juiste plek ✅ · kijk rond zoals hij geplaatst is':'Je bent op de juiste plek ✅ · tik op de Snazzle');
  }else if(remaining<Math.max(45,baseRadius*5)&&!samplesOk){
    setText(hud,`${rarity(target.rarity)} Snazzle-signaal · GPS verfijnen ${Math.min(fix.samples,MIN_STABLE_SAMPLES)}/${MIN_STABLE_SAMPLES}`);
    setText(box,'Blijf een paar seconden in de buurt zodat GPS de plek nauwkeuriger vastzet… 📍');
  }else if(remaining<Math.max(45,baseRadius*5)&&(!accuracyOk||!stabilityOk)){
    setText(hud,`${rarity(target.rarity)} Snazzle-signaal · GPS ±${Math.round(accuracy)} m`);
    setText(box,'GPS is nog niet nauwkeurig genoeg. Loop rustig verder of wacht even buiten… 📍');
  }else{
    setText(hud,`${rarity(target.rarity)} Snazzle-signaal · ${areaLabel(target.village)} · GPS ±${Math.round(accuracy)} m`);
    setText(box,`Nog ongeveer ${Math.max(0,Math.round(remaining))} meter… 👣`);
  }
}
function startWatch(token){
  if(watchId!==null)navigator.geolocation.clearWatch(watchId);
  watchId=navigator.geolocation.watchPosition(pos=>updatePosition(pos,token),err=>{
    if(token!==sessionToken)return;
    const box=$('#snArDistance');
    if(box)setText(box,err?.code===1?'Locatietoegang is uitgezet. Geef Snazzle locatietoegang.':'GPS-signaal even kwijt… blijf buiten en wacht kort.');
  },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
}
function caughtList(){try{const x=JSON.parse(localStorage.getItem('snazzleARCollection')||'[]');return Array.isArray(x)?x:[];}catch{return[];}}
function uncaughtPoints(points){
  const caught=new Set(caughtList().map(x=>String(x?.id||'')));
  return points.filter(p=>!caught.has(String(p.id||'')));
}

async function startAr(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();
  if(starting)return;
  const token=++sessionToken;
  resetGpsSamples();
  starting=true;window.__snazzleArPriority=true;
  const btn=$('#snArStart'),status=$('#snArStatus'),intro=$('#snArIntro'),overlay=$('#snArOverlay');
  const hud=$('#snArHudText'),box=$('#snArDistance'),video=$('#snArCamera');
  if(btn)btn.disabled=true;
  intro?.classList.remove('show');overlay?.classList.add('show');setVisible(false);
  setText(hud,'📷 Camera openen…');setText(box,'📍 Locatie en Snazzle-punten bepalen…');
  try{
    const cameraTask=openCamera().then(s=>{
      if(token!==sessionToken){stopTracks(s);throw new Error('ar-session-cancelled');}
      stream=s;
      if(video){video.srcObject=s;video.play().catch(()=>{});}
      setText(hud,'✅ Camera klaar · locatie bepalen…');
      return s;
    });
    const [cam,pos,points]=await Promise.all([cameraTask,getStartPosition(),loadWorld(true)]);
    void cam;
    if(token!==sessionToken)throw new Error('ar-session-cancelled');
    if(!points.length)throw new Error('Er staan nu geen actieve AR Snazzles op de kaart.');
    const candidates=uncaughtPoints(points);
    if(!candidates.length)throw new Error('Je hebt alle actieve AR Snazzles al gevangen. Nieuwe Snazzles verschijnen automatisch zodra ze worden geplaatst.');
    const here=point(pos);
    const sorted=candidates.slice().sort((a,b)=>dist(here,a)-dist(here,b));
    const nearest=sorted[0],nearestMeters=dist(here,nearest);
    if(nearestMeters>maxRadiusKm*1000)throw new Error(`Geen nog niet gevangen Snazzle binnen ${radiusLabel()}. Bekijk de Snazzle-zones op de kaart.`);
    target=nearest;setTargetVisual();
    setText(hud,`${rarity(target.rarity)} Snazzle-signaal · ${areaLabel(target.village)}`);
    setText(box,`Dichtstbijzijnde nieuwe Snazzle: nog ongeveer ${Math.round(nearestMeters)} meter… 👣`);
    startWatch(token);updatePosition(pos,token);
  }catch(err){
    if(err?.message!=='ar-session-cancelled')console.error('Snazzle AR v245 start',err);
    if(token===sessionToken){
      stopSession({showIntro:true});
      if(err?.message!=='ar-session-cancelled')setText(status,'⚠️ '+(err?.message||'AR kon niet starten.'));
    }
  }finally{
    if(token===sessionToken){starting=false;if(btn)btn.disabled=false;}
    else if(btn&&!starting)btn.disabled=false;
  }
}

function catchSnazzle(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();
  if(!armed||!target)return;
  const caught=target,list=caughtList();
  armed=false;
  if(!list.some(x=>String(x.id)===String(caught.id))){
    list.push({id:caught.id,number:caught.number||'—',name:caught.name||'Snazzle',rarity:caught.rarity||'COMMON',village:areaLabel(caught.village),lat:Number(caught.lat),lon:Number(caught.lon),placeName:String(caught.placeName||''),caughtAt:new Date().toISOString(),edition:'Snazzle AR'});
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
  if(!panel)return;
  $('#snArIntroCloseV244')?.remove();
  if(!$('#snArIntroCloseV245')){
    if(!$('#snArIntroCloseV245Style')){
      const style=document.createElement('style');style.id='snArIntroCloseV245Style';style.textContent=`#snArIntro .sn-ar-panel{position:relative!important;padding-top:38px!important}#snArIntroCloseV245{position:absolute;right:12px;top:12px;width:46px;height:46px;border:2px solid rgba(255,255,255,.75);border-radius:14px;background:#70472b;color:#fff;font-size:30px;font-weight:1000;display:grid;place-items:center;z-index:20;touch-action:manipulation}`;document.head.appendChild(style);
    }
    const b=document.createElement('button');b.id='snArIntroCloseV245';b.type='button';b.textContent='×';b.setAttribute('aria-label','Sluit Snazzle AR');panel.prepend(b);
    b.addEventListener('click',()=>{stopSession();$('#snArIntro')?.classList.remove('show');});
  }
}
function ensureZoneLink(){
  const existing=$('#snArZoneNativeOpen');
  if(existing){existing.href='./snazzle-zones.html?v=287';existing.textContent='🗺️ Bekijk alle Snazzle-zones';return;}
  const old=$('#snArZoneOpen');if(!old)return;
  const a=document.createElement('a');a.id='snArZoneNativeOpen';a.className=old.className||'sn-ar-zone-btn';a.href='./snazzle-zones.html?v=287';a.textContent='🗺️ Bekijk alle Snazzle-zones';a.setAttribute('role','button');old.replaceWith(a);
}
async function refreshIntro(){
  const status=$('#snArStatus');
  setText($('#snArLaunch .sn-ar-copy small'),'Zoek geplaatste Snazzles met camera en GPS');
  setText($('#snArIntro p:not(.sn-ar-privacy)'),`Bekijk eventueel eerst de Snazzle-zones. Daarna kiest AR automatisch de dichtstbijzijnde nog niet gevangen Snazzle binnen maximaal ${radiusLabel()}.`);
  setText($('#snArStart'),'Zoek dichtstbijzijnde AR Snazzle');
  try{
    const points=await loadWorld();
    const remaining=uncaughtPoints(points).length;
    if(status&&$('#snArIntro')?.classList.contains('show'))setText(status,points.length?`✅ ${remaining} nog te vinden van ${points.length} actieve AR Snazzle${points.length===1?'':'s'} · zoeken tot ${radiusLabel()}.`:'ℹ️ Er staan nu geen actieve AR Snazzles op de kaart.');
  }catch{if(status&&$('#snArIntro')?.classList.contains('show'))setText(status,'⚠️ AR-punten konden niet worden geladen. Controleer internet.');}
}

function bindControl(selector,handler){
  const old=$(selector);if(!old)return false;
  if(old.dataset.snArOwner==='245')return true;
  const fresh=old.cloneNode(true);fresh.dataset.snArOwner='245';old.replaceWith(fresh);fresh.addEventListener('click',handler,{capture:true});return true;
}
function bindShellHooks(){
  const launch=$('#snArLaunch');
  if(launch&&!launch.dataset.snArEngine245){launch.dataset.snArEngine245='1';launch.addEventListener('click',()=>{window.__snazzleArPriority=true;setTimeout(refreshIntro,40);});}
  const cancel=$('#snArCancel');
  if(cancel&&!cancel.dataset.snArEngine245){cancel.dataset.snArEngine245='1';cancel.addEventListener('click',()=>{window.__snazzleArPriority=false;});}
}
function repair(){
  if(!$('#snArStart')||!$('#snArCatchDuck')||!$('#snArClose'))return false;
  const duck=$('#snArCatchDuck');if(duck&&!originalDuckHtml)originalDuckHtml=duck.innerHTML;
  const rv=$('#snArResult .sn-ar-result-duck');if(rv&&!originalResultHtml)originalResultHtml=rv.innerHTML;
  bindControl('#snArStart',startAr);bindControl('#snArCatchDuck',catchSnazzle);
  if($('#snArCatchHint'))bindControl('#snArCatchHint',catchSnazzle);
  bindControl('#snArClose',e=>{e.preventDefault();e.stopImmediatePropagation();stopSession();});
  ensureIntroClose();ensureZoneLink();bindShellHooks();
  if(!lifecycleInstalled){
    lifecycleInstalled=true;
    window.addEventListener('pagehide',()=>stopSession());
    window.addEventListener('resize',()=>{if(target&&$('#snArOverlay')?.classList.contains('show'))requestAnimationFrame(applySavedPlacement);},{passive:true});
    window.addEventListener('orientationchange',()=>{if(target&&$('#snArOverlay')?.classList.contains('show'))setTimeout(applySavedPlacement,160);},{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&$('#snArOverlay')?.classList.contains('show'))stopSession({showIntro:true});});
  }
  refreshIntro();return true;
}
function boot(){
  if(repair())return;
  const ob=new MutationObserver(()=>{if(repair())ob.disconnect();});if(document.body)ob.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.SnazzleArWorldV85={reload:(force=false)=>loadWorld(force),get points(){return world.slice();}};
window.SnazzleArEngineV245={reload:(force=false)=>loadWorld(force),refresh:refreshIntro,repair,stop:stopSession,get maxRadiusKm(){return maxRadiusKm;}};
console.info('Snazzle AR Engine v245 actief');
