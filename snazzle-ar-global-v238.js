// Snazzle AR Global v238 — AR-punten overal plaatsen en zoeken via één wereldkaart.
// Gewone Hunts blijven per dorp werken. AR is onafhankelijk van de gekozen dorpsfilter.

const $=s=>document.querySelector(s);
const toRad=d=>d*Math.PI/180;
const GENERAL_VALUE='Algemeen';
const GENERAL_LABEL='🌍 Algemeen / overal';

let target=null;
let stream=null;
let watchId=null;
let armed=false;
let starting=false;
let controllerInstalled=false;
let originalDuckHtml='';

const rarityInfo={COMMON:'COMMON',UNCOMMON:'UNCOMMON',RARE:'RARE',EPIC:'EPIC',GOLD:'GOLD',PLATINUM:'PLATINUM',BLACK:'BLACK',LEGENDARY:'LEGENDARY',SECRET:'SECRET'};

function dist(a,b){
  const R=6371000,p1=toRad(a.lat),p2=toRad(b.lat),dp=toRad(b.lat-a.lat),dl=toRad(b.lon-a.lon);
  const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
function point(pos){return{lat:Number(pos.coords.latitude),lon:Number(pos.coords.longitude)};}
function normalizeRarity(v){const r=String(v||'COMMON').toUpperCase();return rarityInfo[r]?r:'COMMON';}
function activePoints(points){return(Array.isArray(points)?points:[]).filter(p=>p&&p.active!==false&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon)));}
function areaLabel(v){return String(v||GENERAL_VALUE)===GENERAL_VALUE?'Algemeen / overal':String(v||GENERAL_VALUE);}

function installGeneralAdminOption(){
  const select=$('#snArAdminVillage85');
  if(!select)return false;
  let option=[...select.options].find(o=>o.value===GENERAL_VALUE);
  if(!option){
    option=document.createElement('option');
    option.value=GENERAL_VALUE;
    option.textContent=GENERAL_LABEL;
    select.insertBefore(option,select.firstChild);
  }else option.textContent=GENERAL_LABEL;

  const field=select.closest('.field');
  if(field&&!field.querySelector('.sn-ar-general-help')){
    const help=document.createElement('small');
    help.className='sn-ar-general-help';
    help.style.cssText='display:block;margin-top:6px;font-weight:800;line-height:1.35;color:#6b5438';
    help.textContent='Kies Algemeen als je een Snazzle buiten een aangemeld dorp plaatst. Hij verschijnt dan gewoon op de landelijke/wereldwijde Snazzle-kaart.';
    field.appendChild(help);
  }
  return true;
}

function lockArAdminToHeadAdmin(){
  const role=($('#adminRole')?.textContent||'').trim();
  const isHead=role==='Hoofdbeheerder';
  const tab=$('#snArAdminTab85'),section=$('#snArAdminV85');
  if(tab)tab.style.display=isHead?'':'none';
  if(section&&!isHead)section.classList.remove('on');
}

function ensureGlobalMapLink(){
  const existing=$('#snArZoneNativeOpen');
  if(existing){
    existing.href='./snazzle-zones.html?v=238';
    existing.textContent='🗺️ Bekijk alle Snazzle-zones';
    existing.setAttribute('aria-label','Bekijk alle Snazzle-zones in Nederland en daarbuiten');
    return true;
  }
  const old=$('#snArZoneOpen');
  if(!old||old.hidden)return false;
  const link=document.createElement('a');
  link.id='snArZoneNativeOpen';
  link.className=old.className||'sn-ar-zone-btn';
  link.href='./snazzle-zones.html?v=238';
  link.textContent='🗺️ Bekijk alle Snazzle-zones';
  link.setAttribute('role','button');
  link.setAttribute('aria-label','Bekijk alle Snazzle-zones in Nederland en daarbuiten');
  old.replaceWith(link);
  return true;
}

function customizeGlobalCopy(){
  const small=$('#snArLaunch .sn-ar-copy small');
  if(small)small.textContent='Zoek geplaatste Snazzles overal met camera en GPS';
  const text=$('#snArIntro p:not(.sn-ar-privacy)');
  if(text)text.textContent='Bekijk op de kaart waar Snazzle-zones zijn in Nederland en daarbuiten. Start daarna AR: de app kiest automatisch de dichtstbijzijnde actieve Snazzle.';
  const start=$('#snArStart');if(start)start.textContent='Zoek dichtstbijzijnde AR Snazzle';
}

async function reloadWorld(){
  const api=window.SnazzleArWorldV85;
  if(!api?.reload)throw new Error('AR-punten zijn nog niet klaar. Open AR opnieuw.');
  const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('AR-punten laden duurt te lang.')),7000));
  return activePoints(await Promise.race([api.reload(true),timeout]));
}

async function refreshIntroStatus(){
  const status=$('#snArStatus');
  try{
    const points=await reloadWorld();
    if(status&&$('#snArIntro')?.classList.contains('show')){
      status.textContent=points.length?`✅ ${points.length} actieve AR Snazzle${points.length===1?'':'s'} op de kaart · je zoekt automatisch de dichtstbijzijnde.`:'ℹ️ Er staan nu geen actieve AR Snazzles op de kaart.';
    }
  }catch{}
}

function geoQuick(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund op dit toestel.'));
    navigator.geolocation.getCurrentPosition(resolve,e=>{
      const msg=e.code===1?'Locatietoestemming is geweigerd. Zet locatie aan voor Snazzle AR.':e.code===3?'GPS reageert te langzaam. Controleer of locatie aan staat en probeer opnieuw.':'Je locatie kon niet worden bepaald.';
      reject(new Error(msg));
    },{enableHighAccuracy:false,timeout:5000,maximumAge:120000});
  });
}
function cameraFast(){
  return new Promise((resolve,reject)=>{
    if(!navigator.mediaDevices?.getUserMedia)return reject(new Error('Camera wordt niet ondersteund in deze browser.'));
    let settled=false;
    const timer=setTimeout(()=>{if(settled)return;settled=true;reject(new Error('Camera reageert te langzaam. Controleer de cameratoestemming en probeer opnieuw.'));},5500);
    navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:640},height:{ideal:480}},audio:false}).then(s=>{
      if(settled){s.getTracks().forEach(t=>t.stop());return;}
      settled=true;clearTimeout(timer);resolve(s);
    }).catch(err=>{
      if(settled)return;settled=true;clearTimeout(timer);
      const denied=err?.name==='NotAllowedError'||err?.name==='SecurityError';
      reject(new Error(denied?'Cameratoestemming is geweigerd. Sta camera toe voor Snazzle AR.':'Camera kon niet worden gestart.'));
    });
  });
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
  const catchBtn=$('#snArCatchDuck');if(!catchBtn||!target)return;
  if(!originalDuckHtml)originalDuckHtml=catchBtn.innerHTML;
  catchBtn.innerHTML=target.imageUrl?`<img src="${String(target.imageUrl).replace(/"/g,'&quot;')}" alt="${String(target.name||'Snazzle').replace(/"/g,'&quot;')}" style="width:100%;height:100%;object-fit:contain">`:originalDuckHtml;
  applySavedPlacement();
}
function stopGlobal(){
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  if(watchId!==null&&navigator.geolocation){navigator.geolocation.clearWatch(watchId);watchId=null;}
  $('#snArOverlay')?.classList.remove('show');
  setVisible(false);resetPlacementVisual();target=null;armed=false;starting=false;
  window.__snazzleArPriority=false;
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
    if(hud)hud.textContent=`${normalizeRarity(target.rarity)} Snazzle-signaal · ${areaLabel(target.village)} · GPS ±${accuracy} m`;
    if(box)box.textContent=`Nog ongeveer ${Math.max(0,Math.round(remaining))} meter… 👣`;
  }
}
function startWatch(){
  if(watchId!==null)navigator.geolocation.clearWatch(watchId);
  watchId=navigator.geolocation.watchPosition(update,()=>{const b=$('#snArDistance');if(b)b.textContent='GPS-signaal even kwijt… blijf buiten en wacht kort.';},{enableHighAccuracy:true,timeout:10000,maximumAge:2000});
}

async function startGlobal(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();
  if(starting)return;
  starting=true;window.__snazzleArPriority=true;
  const btn=$('#snArStart'),status=$('#snArStatus'),intro=$('#snArIntro'),overlay=$('#snArOverlay');
  const hud=$('#snArHudText'),box=$('#snArDistance'),video=$('#snArCamera');
  if(btn)btn.disabled=true;
  intro?.classList.remove('show');overlay?.classList.add('show');
  if(hud)hud.textContent='⚡ Camera direct starten…';if(box)box.textContent='Dichtstbijzijnde Snazzle bepalen…';
  try{
    const cameraTask=cameraFast().then(s=>{stream=s;if(video){video.srcObject=s;video.play().catch(()=>{});}if(hud)hud.textContent='📍 Camera klaar · locatie bepalen…';return s;});
    const gpsTask=geoQuick();
    const pointsTask=reloadWorld();
    const [,pos,points]=await Promise.all([cameraTask,gpsTask,pointsTask]);
    if(!points.length)throw new Error('Er staan nu geen actieve AR Snazzles op de kaart.');
    const here=point(pos);
    target=points.slice().sort((a,b)=>dist(here,a)-dist(here,b))[0];
    setTargetVisual();setVisible(false);
    const remaining=Math.round(dist(here,{lat:Number(target.lat),lon:Number(target.lon)}));
    const accuracy=Math.round(Number(pos.coords.accuracy||0));
    if(hud)hud.textContent=`${normalizeRarity(target.rarity)} Snazzle-signaal · ${areaLabel(target.village)} · GPS ±${accuracy} m`;
    if(box)box.textContent=`Dichtstbijzijnde Snazzle: nog ongeveer ${remaining} meter… 👣`;
    startWatch();update(pos);
  }catch(err){
    stopGlobal();intro?.classList.add('show');if(status)status.textContent='⚠️ '+(err?.message||'AR kon niet starten.');
  }finally{starting=false;if(btn)btn.disabled=false;}
}

function caughtList(){try{return JSON.parse(localStorage.getItem('snazzleARCollection')||'[]')}catch{return[]}}
function catchGlobal(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();if(!armed||!target)return;
  const caught=target,list=caughtList();armed=false;
  if(!list.some(x=>x.id===caught.id)){
    list.push({id:caught.id,number:caught.number||'—',name:caught.name||'Snazzle',rarity:caught.rarity||'COMMON',village:areaLabel(caught.village),caughtAt:new Date().toISOString(),edition:'Snazzle AR'});
    localStorage.setItem('snazzleARCollection',JSON.stringify(list));
  }
  try{navigator.vibrate?.([80,50,120]);}catch{}
  stopGlobal();
  const result=$('#snArResult');
  if(result){
    const badge=result.querySelector('.sn-ar-badge');if(badge)badge.textContent='SNAZZLE AR · GEVANGEN';
    const h=result.querySelector('h2');if(h)h.textContent=caught.name||'Snazzle';
    const ps=result.querySelectorAll('p');if(ps[0])ps[0].textContent=`#${caught.number||'—'} · ${caught.rarity||'COMMON'} · ${areaLabel(caught.village)}`;
    const visual=result.querySelector('.sn-ar-result-duck');if(visual&&caught.imageUrl)visual.innerHTML=`<img src="${String(caught.imageUrl).replace(/"/g,'&quot;')}" alt="${String(caught.name||'Snazzle').replace(/"/g,'&quot;')}">`;
    result.classList.add('show');
  }
  const badgeCount=$('#snArCount');if(badgeCount)badgeCount.textContent=String(list.length);
}

function replaceControl(id,handler){
  const old=$(id);if(!old)return null;
  const fresh=old.cloneNode(true);
  fresh.removeAttribute('data-world177');
  old.replaceWith(fresh);
  fresh.addEventListener('click',handler,true);
  return fresh;
}
function installGlobalController(){
  if(controllerInstalled)return true;
  if(!$('#snArStart')||!$('#snArCatchDuck')||!$('#snArClose'))return false;
  const duck=$('#snArCatchDuck');if(duck&&!originalDuckHtml)originalDuckHtml=duck.innerHTML;
  replaceControl('#snArStart',startGlobal);
  replaceControl('#snArCatchDuck',catchGlobal);
  if($('#snArCatchHint'))replaceControl('#snArCatchHint',catchGlobal);
  replaceControl('#snArClose',e=>{e.preventDefault();e.stopImmediatePropagation();stopGlobal();});
  controllerInstalled=true;customizeGlobalCopy();
  window.addEventListener('pagehide',stopGlobal,{once:true});
  return true;
}

function repair(){
  installGeneralAdminOption();
  lockArAdminToHeadAdmin();
  ensureGlobalMapLink();
  customizeGlobalCopy();
  installGlobalController();
}

const observer=new MutationObserver(repair);
if(document.body)observer.observe(document.body,{subtree:true,childList:true,characterData:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',repair,{once:true});else repair();
[80,250,700,1500,3000].forEach(ms=>setTimeout(repair,ms));

document.addEventListener('click',e=>{
  if(e.target?.closest?.('#snArLaunch'))setTimeout(()=>{customizeGlobalCopy();ensureGlobalMapLink();refreshIntroStatus();},80);
},false);

window.SnazzleArGlobalV238={repair,refreshIntroStatus,stop:stopGlobal};
