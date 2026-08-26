// Snazzle AR Place Studio v90 — beheerflow: kaart -> camera -> opslaan.
// De kaart gebruikt OpenStreetMap/Leaflet zodat er geen betaalde Maps API-key nodig is.
// Vanuit de kaart kan de gekozen plek ook direct in Google Maps worden geopend.

import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const auth=getAuth(),db=getFirestore(),storage=getStorage();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let installObserver=null,map=null,accuracyCircle=null,stream=null,leafletPromise=null;
let state={lat:null,lon:null,accuracy:0,x:.5,y:.56,size:.34,rotation:0,dragging:false,pointerId:null};

function styles(){
  if($('#snArStudioV90Style'))return;
  const s=document.createElement('style');s.id='snArStudioV90Style';s.textContent=`
  .sn-ar-studio-launch{background:linear-gradient(135deg,#3e6fcb,#6844b7)!important;color:#fff!important}
  .sn-ar-studio{position:fixed;inset:0;z-index:520;background:#082419;display:none;color:#2f2417;overflow:auto;-webkit-overflow-scrolling:touch}.sn-ar-studio.show{display:block}
  .sn-ar-studio-shell{width:min(620px,100%);min-height:100%;margin:auto;background:linear-gradient(#fff1bd,#edd18e);padding:calc(12px + env(safe-area-inset-top)) 14px calc(22px + env(safe-area-inset-bottom))}
  .sn-ar-studio-head{display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:5;background:#f6dda2e8;backdrop-filter:blur(8px);padding:8px 0 10px}.sn-ar-studio-head h2{font-size:21px;margin:0;flex:1}.sn-ar-studio-close{width:46px;height:46px;border:0;border-radius:15px;background:#5d3b28;color:#fff;font-size:22px;font-weight:1000}
  .sn-ar-stepper{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:8px 0 14px}.sn-ar-stepper span{padding:8px 6px;border-radius:12px;background:#e0c787;text-align:center;font-size:11px;font-weight:950}.sn-ar-stepper span.on{background:#315d39;color:#fff}
  .sn-ar-studio-card{background:#fff8e7;border:2px solid #bc995f;border-radius:20px;padding:13px;margin-bottom:12px}.sn-ar-studio-card h3{margin:0 0 8px;font-size:18px}.sn-ar-studio-card p{margin:6px 0;line-height:1.4;font-size:13px;font-weight:720}
  .sn-ar-map{height:330px;border:3px solid #6c5435;border-radius:18px;overflow:hidden;background:#dfe8db;position:relative}.sn-ar-map-cross{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);z-index:900;font-size:38px;filter:drop-shadow(0 3px 2px #fff);pointer-events:none}.sn-ar-map-note{font-size:12px;font-weight:850;margin-top:8px}.sn-ar-coords{padding:9px 10px;background:#e6f2d3;border:2px solid #92ae5b;border-radius:12px;font-size:12px;font-weight:900;margin-top:9px}
  .sn-ar-studio-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.sn-ar-studio-actions.one{grid-template-columns:1fr}.sn-ar-studio-actions button{min-height:48px;border:0;border-radius:14px;padding:11px;font-weight:1000}.sn-ar-studio-primary{background:linear-gradient(#6cc83b,#3d8e2b);color:#fff;box-shadow:0 4px 0 #28661f}.sn-ar-studio-secondary{background:#d5b36e;color:#302216}.sn-ar-studio-blue{background:#3d6fc2;color:#fff}
  .sn-ar-camera-stage{height:min(66vh,520px);min-height:380px;border-radius:20px;overflow:hidden;background:#10261b;position:relative;border:3px solid #5f4a30;touch-action:none}.sn-ar-camera-stage video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.sn-ar-camera-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.28),transparent 24%,transparent 72%,rgba(0,0,0,.42));pointer-events:none}.sn-ar-place-object{position:absolute;left:50%;top:56%;width:34%;aspect-ratio:1;transform:translate(-50%,-50%);display:grid;place-items:center;touch-action:none;user-select:none;z-index:3;filter:drop-shadow(0 12px 8px rgba(0,0,0,.35))}.sn-ar-place-object img{max-width:100%;max-height:100%;object-fit:contain;pointer-events:none}.sn-ar-place-fallback{font-size:clamp(70px,25vw,145px);line-height:1;pointer-events:none}.sn-ar-place-ring{position:absolute;inset:-8px;border:2px dashed rgba(255,240,130,.9);border-radius:50%;pointer-events:none}.sn-ar-camera-help{position:absolute;left:10px;right:10px;top:10px;z-index:4;background:#143d2fdc;color:#fff;border:2px solid #d6ef70;border-radius:13px;padding:8px 10px;font-size:11px;font-weight:900;text-align:center;pointer-events:none}
  .sn-ar-controls{display:grid;gap:9px;margin-top:11px}.sn-ar-control{display:grid;grid-template-columns:92px 1fr 48px;align-items:center;gap:8px;font-size:12px;font-weight:900}.sn-ar-control input{width:100%}.sn-ar-control output{text-align:right}.sn-ar-status90{padding:10px 11px;border-radius:13px;background:#f0e1b6;border:2px solid #b08c55;font-size:12px;font-weight:900;margin:9px 0}.sn-ar-status90.ok{background:#e2f1c9;border-color:#83a94a;color:#315522}.sn-ar-status90.err{background:#f5d0c7;border-color:#c06b5d;color:#762c24}
  .sn-ar-success90{text-align:center;padding:24px 10px}.sn-ar-success90 b{font-size:44px;display:block}.sn-ar-success90 h3{font-size:25px;margin:7px 0}.leaflet-control-attribution{font-size:8px!important}
  @media(max-width:390px){.sn-ar-map{height:285px}.sn-ar-studio-actions{grid-template-columns:1fr}.sn-ar-control{grid-template-columns:78px 1fr 44px}}
  `;document.head.appendChild(s);
}

function modal(){
  if($('#snArStudioV90'))return $('#snArStudioV90');
  const el=document.createElement('div');el.id='snArStudioV90';el.className='sn-ar-studio';
  el.innerHTML=`<div class="sn-ar-studio-shell">
    <div class="sn-ar-studio-head"><h2>Snazzle precies plaatsen 🗺️📷</h2><button type="button" class="sn-ar-studio-close" id="snArStudioClose90">×</button></div>
    <div class="sn-ar-stepper"><span id="snArStepMap90" class="on">1 · Kaart</span><span id="snArStepCam90">2 · Camera</span><span id="snArStepSave90">3 · Opslaan</span></div>
    <section id="snArStudioMap90">
      <div class="sn-ar-studio-card"><h3>1. Controleer de plek</h3><p>De pin in het midden is de plek waar de Snazzle wordt opgeslagen. Verschuif de kaart als je het punt iets wilt corrigeren.</p><div class="sn-ar-map" id="snArMap90"><div class="sn-ar-map-cross">📍</div></div><div class="sn-ar-coords" id="snArCoords90">GPS bepalen…</div><div class="sn-ar-map-note">De kaart in de app gebruikt OpenStreetMap. Met de knop hieronder kun je hetzelfde punt ook in Google Maps controleren.</div><div class="sn-ar-studio-actions"><button type="button" class="sn-ar-studio-secondary" id="snArRelocate90">🎯 Mijn GPS opnieuw</button><button type="button" class="sn-ar-studio-blue" id="snArGoogle90">🗺️ Open Google Maps</button></div><div class="sn-ar-studio-actions one"><button type="button" class="sn-ar-studio-primary" id="snArToCamera90">📷 Deze plek klopt — open camera</button></div></div>
    </section>
    <section id="snArStudioCam90" hidden>
      <div class="sn-ar-studio-card"><h3>2. Zet de Snazzle in het echte beeld</h3><p>Sleep de Snazzle met één vinger naar bijvoorbeeld een paaltje, steen of bankje. Stel daarna grootte en draaiing af.</p><div class="sn-ar-camera-stage" id="snArCameraStage90"><video id="snArPlaceVideo90" autoplay muted playsinline></video><div class="sn-ar-camera-shade"></div><div class="sn-ar-camera-help">Sleep de Snazzle naar de juiste plek in beeld</div><div class="sn-ar-place-object" id="snArPlaceObject90"><div class="sn-ar-place-ring"></div><div class="sn-ar-place-fallback" id="snArPlaceFallback90">🦆</div><img id="snArPlaceImage90" alt="Snazzle" hidden></div></div><div class="sn-ar-controls"><label class="sn-ar-control">Grootte <input id="snArSize90" type="range" min="18" max="62" value="34"><output id="snArSizeOut90">34%</output></label><label class="sn-ar-control">Draaien <input id="snArRotate90" type="range" min="-180" max="180" value="0"><output id="snArRotateOut90">0°</output></label></div><div class="sn-ar-status90" id="snArStudioStatus90">Camera klaarzetten…</div><div class="sn-ar-studio-actions"><button type="button" class="sn-ar-studio-secondary" id="snArBackMap90">← Kaart</button><button type="button" class="sn-ar-studio-primary" id="snArSavePlacement90">🔒 Snazzle hier vastzetten</button></div></div>
    </section>
    <section id="snArStudioDone90" hidden><div class="sn-ar-studio-card sn-ar-success90"><b>✅</b><h3>Snazzle geplaatst</h3><p id="snArDoneText90"></p><div class="sn-ar-studio-actions"><button type="button" class="sn-ar-studio-secondary" id="snArDoneClose90">Klaar</button><button type="button" class="sn-ar-studio-primary" id="snArTest90">🧭 Test als speler</button></div></div></section>
  </div>`;
  document.body.appendChild(el);wire();return el;
}

function currentPosition(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund.'));navigator.geolocation.getCurrentPosition(resolve,e=>reject(new Error(e.code===1?'Locatietoestemming is geweigerd.':'GPS kon niet worden bepaald.')),{enableHighAccuracy:true,timeout:18000,maximumAge:0});});}

function loadLeaflet(){
  if(window.L)return Promise.resolve(window.L);if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector('link[data-sn-leaflet]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.dataset.snLeaflet='1';document.head.appendChild(l);}
    const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.async=true;s.onload=()=>resolve(window.L);s.onerror=()=>reject(new Error('Kaartmodule kon niet laden.'));document.head.appendChild(s);
  });return leafletPromise;
}

async function locate(resetView=true){
  const c=$('#snArCoords90');if(c)c.textContent='📍 GPS nauwkeurig bepalen…';
  try{const pos=await currentPosition();state.lat=Number(pos.coords.latitude);state.lon=Number(pos.coords.longitude);state.accuracy=Math.round(Number(pos.coords.accuracy||0));await ensureMap(resetView);updateCoords();}
  catch(err){if(c)c.textContent='⚠️ '+err.message;throw err;}
}

async function ensureMap(resetView){
  const L=await loadLeaflet();
  if(!map){map=L.map('snArMap90',{zoomControl:true,attributionControl:true}).setView([state.lat,state.lon],19);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap'}).addTo(map);map.on('moveend',()=>{const p=map.getCenter();state.lat=p.lat;state.lon=p.lng;updateCoords();});}
  else if(resetView)map.setView([state.lat,state.lon],19);
  if(accuracyCircle)accuracyCircle.remove();accuracyCircle=L.circle([state.lat,state.lon],{radius:Math.max(1,state.accuracy||1),weight:1,fillOpacity:.08}).addTo(map);setTimeout(()=>map.invalidateSize(),80);
}
function updateCoords(){const c=$('#snArCoords90');if(c&&Number.isFinite(state.lat))c.textContent=`📍 ${state.lat.toFixed(6)}, ${state.lon.toFixed(6)} · GPS ±${state.accuracy||'?'} m`;}

function formData(){return{name:($('#snArAdminName85')?.value||'Scout Snazzle').trim(),number:($('#snArAdminNumber85')?.value||'001').trim(),rarity:$('#snArAdminRarity85')?.value||'RARE',village:$('#snArAdminVillage85')?.value||'Montfort',radius:Number($('#snArAdminRadius85')?.value||7),file:$('#snArAdminImage85')?.files?.[0]||null};}
function setPreview(){const f=formData().file,img=$('#snArPlaceImage90'),fallback=$('#snArPlaceFallback90');if(!img||!fallback)return;if(f){const url=URL.createObjectURL(f);img.src=url;img.hidden=false;fallback.hidden=true;}else{img.removeAttribute('src');img.hidden=true;fallback.hidden=false;}}

async function startCamera(){
  stopCamera();const status=$('#snArStudioStatus90');if(status){status.className='sn-ar-status90';status.textContent='📷 Camera openen…';}
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});const v=$('#snArPlaceVideo90');v.srcObject=stream;await v.play().catch(()=>{});setPreview();applyPlacement();if(status){status.className='sn-ar-status90 ok';status.textContent='✅ Camera actief. Sleep de Snazzle precies naar de plek waar hij moet staan.';}}
  catch(err){if(status){status.className='sn-ar-status90 err';status.textContent='⚠️ Camera kon niet openen. Controleer de cameratoestemming.';}throw err;}
}
function stopCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}const v=$('#snArPlaceVideo90');if(v)v.srcObject=null;}
function applyPlacement(){const o=$('#snArPlaceObject90');if(!o)return;o.style.left=`${state.x*100}%`;o.style.top=`${state.y*100}%`;o.style.width=`${state.size*100}%`;const content=$('#snArPlaceImage90:not([hidden]),#snArPlaceFallback90:not([hidden])');if(content)content.style.transform=`rotate(${state.rotation}deg)`;const so=$('#snArSizeOut90'),ro=$('#snArRotateOut90');if(so)so.textContent=`${Math.round(state.size*100)}%`;if(ro)ro.textContent=`${Math.round(state.rotation)}°`;}

function dragStart(e){const stage=$('#snArCameraStage90');if(!stage)return;state.dragging=true;state.pointerId=e.pointerId;$('#snArPlaceObject90')?.setPointerCapture?.(e.pointerId);dragMove(e);}
function dragMove(e){if(!state.dragging||e.pointerId!==state.pointerId)return;const r=$('#snArCameraStage90')?.getBoundingClientRect();if(!r)return;state.x=Math.max(.06,Math.min(.94,(e.clientX-r.left)/r.width));state.y=Math.max(.12,Math.min(.9,(e.clientY-r.top)/r.height));applyPlacement();e.preventDefault();}
function dragEnd(e){if(e.pointerId===state.pointerId){state.dragging=false;state.pointerId=null;}}

async function upload(file,id){if(!file)return '';if(file.size>8*1024*1024)throw new Error('Afbeelding is groter dan 8 MB.');const safe=(file.name||'snazzle.png').replace(/[^a-zA-Z0-9._-]+/g,'-');const r=storageRef(storage,`listen-stories/images/${auth.currentUser.uid}/ar-${id}-${safe}`);await uploadBytes(r,file,{contentType:file.type||'image/png'});return getDownloadURL(r);}
async function readWorld(){const snap=await getDoc(WORLD_DOC),data=snap.exists()?snap.data():{};return Array.isArray(data.points)?data.points:[];}
async function writePoint(){
  const status=$('#snArStudioStatus90'),btn=$('#snArSavePlacement90'),f=formData();if(!auth.currentUser)throw new Error('Je bent niet meer ingelogd als beheerder.');if(f.name.length<2)throw new Error('Vul eerst een naam voor de Snazzle in.');if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon))throw new Error('Er is nog geen geldige kaartlocatie.');
  btn.disabled=true;if(status){status.className='sn-ar-status90';status.textContent='☁️ Afbeelding en plaatsing opslaan…';}
  try{const id=`ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,imageUrl=await upload(f.file,id),existing=await readWorld(),now=new Date().toISOString();const point={id,name:f.name,number:f.number||'—',rarity:f.rarity,village:f.village,radius:f.radius,lat:state.lat,lon:state.lon,accuracy:state.accuracy,imageUrl,active:true,placement:{version:1,mode:'camera-composed',x:Number(state.x.toFixed(4)),y:Number(state.y.toFixed(4)),size:Number(state.size.toFixed(4)),rotation:Number(state.rotation.toFixed(1)),placedAt:now},createdAt:now,updatedAt:now,createdBy:auth.currentUser.uid};await setDoc(WORLD_DOC,{_snazzleInternalType:'arWorld',title:'[SYSTEEM] AR-WERELD',village:'snazzle-internal',description:'Interne opslag voor permanente Snazzle AR-punten',rule:'',hint:'',foundMessage:'',imageUrl:'',start:'',end:'',mode:'draft',version:4,points:[...existing,point],updatedAt:now,updatedBy:auth.currentUser.uid},{merge:true});stopCamera();showDone(point);window.SnazzleArAdminV85?.refresh?.();}
  catch(err){if(status){status.className='sn-ar-status90 err';status.textContent='⚠️ '+(err?.message||'Opslaan is mislukt.');}throw err;}finally{btn.disabled=false;}
}

function showStep(step){$('#snArStudioMap90').hidden=step!=='map';$('#snArStudioCam90').hidden=step!=='cam';$('#snArStudioDone90').hidden=step!=='done';$('#snArStepMap90').classList.toggle('on',step==='map');$('#snArStepCam90').classList.toggle('on',step==='cam');$('#snArStepSave90').classList.toggle('on',step==='done');}
function showDone(point){showStep('done');const t=$('#snArDoneText90');if(t)t.innerHTML=`<b>${esc(point.name)}</b> is opgeslagen op ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}.<br>De camera-positie, grootte en draaiing zijn mee opgeslagen.`;}
function close(){stopCamera();$('#snArStudioV90')?.classList.remove('show');}
async function open(){modal();state={lat:null,lon:null,accuracy:0,x:.5,y:.56,size:.34,rotation:0,dragging:false,pointerId:null};$('#snArSize90').value='34';$('#snArRotate90').value='0';showStep('map');$('#snArStudioV90').classList.add('show');try{await locate(true);}catch{} }

function wire(){
  $('#snArStudioClose90').addEventListener('click',close);$('#snArDoneClose90').addEventListener('click',close);$('#snArRelocate90').addEventListener('click',()=>locate(true).catch(()=>{}));$('#snArGoogle90').addEventListener('click',()=>{if(Number.isFinite(state.lat))window.open(`https://www.google.com/maps?q=${state.lat},${state.lon}`,'_blank','noopener');});
  $('#snArToCamera90').addEventListener('click',async()=>{if(!Number.isFinite(state.lat))return;showStep('cam');try{await startCamera();}catch{}});$('#snArBackMap90').addEventListener('click',()=>{stopCamera();showStep('map');setTimeout(()=>map?.invalidateSize(),60);});$('#snArSavePlacement90').addEventListener('click',()=>writePoint().catch(()=>{}));
  const obj=$('#snArPlaceObject90');obj.addEventListener('pointerdown',dragStart);obj.addEventListener('pointermove',dragMove);obj.addEventListener('pointerup',dragEnd);obj.addEventListener('pointercancel',dragEnd);
  $('#snArSize90').addEventListener('input',e=>{state.size=Number(e.target.value)/100;applyPlacement();});$('#snArRotate90').addEventListener('input',e=>{state.rotation=Number(e.target.value);applyPlacement();});
  $('#snArTest90').addEventListener('click',()=>{const village=formData().village;localStorage.setItem('snazzleVillage',village);close();document.querySelector('#adminSheet .close')?.click();setTimeout(()=>document.querySelector('#snArLaunch')?.click(),180);});
}

function install(){styles();const grid=$('#snArAdminV85 .sn-ar-admin-grid');if(!grid)return false;if($('#snArStudioLaunch90'))return true;const btn=document.createElement('button');btn.type='button';btn.id='snArStudioLaunch90';btn.className='save sn-ar-studio-launch';btn.textContent='🗺️📷 Plaats via kaart + camera';btn.addEventListener('click',open);const basic=$('#snArAdminPlace85');basic?.insertAdjacentElement('afterend',btn);return true;}
function boot(){if(install())return;if(installObserver||!document.body)return;installObserver=new MutationObserver(()=>{if(install()){installObserver.disconnect();installObserver=null;}});installObserver.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SnazzleArPlaceStudioV90={open,close};