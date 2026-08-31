// Snazzle AR Place Studio v184 — kaart direct zichtbaar, GPS daarna verfijnen.
// De kaart gebruikt OpenStreetMap/Leaflet zonder betaalde Maps API-key.

import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const auth=getAuth(),db=getFirestore(),storage=getStorage();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const VILLAGE_CENTERS={
  'Montfort':[51.1262,5.9488],
  'Posterholt':[51.1230,6.0310],
  'Sint Odiliënberg':[51.1430,6.0000]
};
let installObserver=null,map=null,accuracyCircle=null,tileLayer=null,stream=null,leafletPromise=null;
let tileErrors=0,usingFallbackTiles=false;
let state={lat:51.1262,lon:5.9488,accuracy:0,source:'fallback',x:.5,y:.56,size:.34,rotation:0,dragging:false,pointerId:null};

function styles(){
  if($('#snArStudioV184Style'))return;
  const s=document.createElement('style');s.id='snArStudioV184Style';s.textContent=`
  .sn-ar-studio-launch184{background:linear-gradient(135deg,#3e6fcb,#6844b7)!important;color:#fff!important}
  .sn-ar-studio184{position:fixed;inset:0;z-index:540;background:#082419;display:none;color:#2f2417;overflow:auto;-webkit-overflow-scrolling:touch}.sn-ar-studio184.show{display:block}
  .sn-ar-studio-shell184{width:min(620px,100%);min-height:100%;margin:auto;background:linear-gradient(#fff1bd,#edd18e);padding:calc(12px + env(safe-area-inset-top)) 14px calc(22px + env(safe-area-inset-bottom))}
  .sn-ar-studio-head184{display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:5;background:#f6dda2e8;backdrop-filter:blur(8px);padding:8px 0 10px}.sn-ar-studio-head184 h2{font-size:21px;margin:0;flex:1}.sn-ar-studio-close184{width:46px;height:46px;border:0;border-radius:15px;background:#5d3b28;color:#fff;font-size:22px;font-weight:1000}
  .sn-ar-stepper184{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:8px 0 14px}.sn-ar-stepper184 span{padding:8px 6px;border-radius:12px;background:#e0c787;text-align:center;font-size:11px;font-weight:950}.sn-ar-stepper184 span.on{background:#315d39;color:#fff}
  .sn-ar-card184{background:#fff8e7;border:2px solid #bc995f;border-radius:20px;padding:13px;margin-bottom:12px}.sn-ar-card184 h3{margin:0 0 8px;font-size:18px}.sn-ar-card184 p{margin:6px 0;line-height:1.4;font-size:13px;font-weight:720}
  .sn-ar-map184{height:330px;border:3px solid #6c5435;border-radius:18px;overflow:hidden;background:#dfe8db;position:relative}.sn-ar-map-cross184{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);z-index:900;font-size:38px;filter:drop-shadow(0 3px 2px #fff);pointer-events:none}.sn-ar-map-note184{font-size:12px;font-weight:850;margin-top:8px}.sn-ar-coords184{padding:9px 10px;background:#e6f2d3;border:2px solid #92ae5b;border-radius:12px;font-size:12px;font-weight:900;margin-top:9px}.sn-ar-coords184.warn{background:#fff0c8;border-color:#d6a341}.sn-ar-coords184.err{background:#f5d0c7;border-color:#c06b5d;color:#762c24}
  .sn-ar-actions184{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.sn-ar-actions184.one{grid-template-columns:1fr}.sn-ar-actions184 button{min-height:48px;border:0;border-radius:14px;padding:11px;font-weight:1000}.sn-ar-primary184{background:linear-gradient(#6cc83b,#3d8e2b);color:#fff;box-shadow:0 4px 0 #28661f}.sn-ar-secondary184{background:#d5b36e;color:#302216}.sn-ar-blue184{background:#3d6fc2;color:#fff}
  .sn-ar-camera-stage184{height:min(66vh,520px);min-height:380px;border-radius:20px;overflow:hidden;background:#10261b;position:relative;border:3px solid #5f4a30;touch-action:none}.sn-ar-camera-stage184 video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.sn-ar-camera-shade184{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.28),transparent 24%,transparent 72%,rgba(0,0,0,.42));pointer-events:none}.sn-ar-place-object184{position:absolute;left:50%;top:56%;width:34%;aspect-ratio:1;transform:translate(-50%,-50%);display:grid;place-items:center;touch-action:none;user-select:none;z-index:3;filter:drop-shadow(0 12px 8px rgba(0,0,0,.35))}.sn-ar-place-object184 img{max-width:100%;max-height:100%;object-fit:contain;pointer-events:none}.sn-ar-place-fallback184{font-size:clamp(70px,25vw,145px);line-height:1;pointer-events:none}.sn-ar-place-ring184{position:absolute;inset:-8px;border:2px dashed rgba(255,240,130,.9);border-radius:50%;pointer-events:none}.sn-ar-camera-help184{position:absolute;left:10px;right:10px;top:10px;z-index:4;background:#143d2fdc;color:#fff;border:2px solid #d6ef70;border-radius:13px;padding:8px 10px;font-size:11px;font-weight:900;text-align:center;pointer-events:none}
  .sn-ar-controls184{display:grid;gap:9px;margin-top:11px}.sn-ar-control184{display:grid;grid-template-columns:92px 1fr 48px;align-items:center;gap:8px;font-size:12px;font-weight:900}.sn-ar-control184 input{width:100%}.sn-ar-control184 output{text-align:right}.sn-ar-status184{padding:10px 11px;border-radius:13px;background:#f0e1b6;border:2px solid #b08c55;font-size:12px;font-weight:900;margin:9px 0}.sn-ar-status184.ok{background:#e2f1c9;border-color:#83a94a;color:#315522}.sn-ar-status184.err{background:#f5d0c7;border-color:#c06b5d;color:#762c24}
  .sn-ar-success184{text-align:center;padding:24px 10px}.sn-ar-success184 b{font-size:44px;display:block}.sn-ar-success184 h3{font-size:25px;margin:7px 0}.leaflet-control-attribution{font-size:8px!important}
  @media(max-width:390px){.sn-ar-map184{height:285px}.sn-ar-actions184{grid-template-columns:1fr}.sn-ar-control184{grid-template-columns:78px 1fr 44px}}
  `;document.head.appendChild(s);
}

function modal(){
  if($('#snArStudioV184'))return $('#snArStudioV184');
  $('#snArStudioV90')?.remove();
  const el=document.createElement('div');el.id='snArStudioV184';el.className='sn-ar-studio184';
  el.innerHTML=`<div class="sn-ar-studio-shell184">
    <div class="sn-ar-studio-head184"><h2>Snazzle precies plaatsen 🗺️📷</h2><button type="button" class="sn-ar-studio-close184" id="snArStudioClose184">×</button></div>
    <div class="sn-ar-stepper184"><span id="snArStepMap184" class="on">1 · Kaart</span><span id="snArStepCam184">2 · Camera</span><span id="snArStepSave184">3 · Opslaan</span></div>
    <section id="snArStudioMap184">
      <div class="sn-ar-card184"><h3>1. Controleer de plek</h3><p>De kaart verschijnt meteen. De pin in het midden is de plek waar de Snazzle wordt opgeslagen. GPS springt daarna automatisch naar jouw echte locatie.</p><div class="sn-ar-map184" id="snArMap184"><div class="sn-ar-map-cross184">📍</div></div><div class="sn-ar-coords184 warn" id="snArCoords184">🗺️ Kaart openen…</div><div class="sn-ar-map-note184">Verschuif de kaart gerust handmatig. GPS wordt op de achtergrond eerst snel en daarna extra nauwkeurig bepaald.</div><div class="sn-ar-actions184"><button type="button" class="sn-ar-secondary184" id="snArRelocate184">🎯 Mijn GPS opnieuw</button><button type="button" class="sn-ar-blue184" id="snArGoogle184">🗺️ Open Google Maps</button></div><div class="sn-ar-actions184 one"><button type="button" class="sn-ar-primary184" id="snArToCamera184">📷 Deze plek klopt — open camera</button></div></div>
    </section>
    <section id="snArStudioCam184" hidden>
      <div class="sn-ar-card184"><h3>2. Zet de Snazzle in het echte beeld</h3><p>Sleep de Snazzle met één vinger naar bijvoorbeeld een paaltje, steen of bankje. Stel daarna grootte en draaiing af.</p><div class="sn-ar-camera-stage184" id="snArCameraStage184"><video id="snArPlaceVideo184" autoplay muted playsinline></video><div class="sn-ar-camera-shade184"></div><div class="sn-ar-camera-help184">Sleep de Snazzle naar de juiste plek in beeld</div><div class="sn-ar-place-object184" id="snArPlaceObject184"><div class="sn-ar-place-ring184"></div><div class="sn-ar-place-fallback184" id="snArPlaceFallback184">🦆</div><img id="snArPlaceImage184" alt="Snazzle" hidden></div></div><div class="sn-ar-controls184"><label class="sn-ar-control184">Grootte <input id="snArSize184" type="range" min="18" max="62" value="34"><output id="snArSizeOut184">34%</output></label><label class="sn-ar-control184">Draaien <input id="snArRotate184" type="range" min="-180" max="180" value="0"><output id="snArRotateOut184">0°</output></label></div><div class="sn-ar-status184" id="snArStudioStatus184">Camera klaarzetten…</div><div class="sn-ar-actions184"><button type="button" class="sn-ar-secondary184" id="snArBackMap184">← Kaart</button><button type="button" class="sn-ar-primary184" id="snArSavePlacement184">🔒 Snazzle hier vastzetten</button></div></div>
    </section>
    <section id="snArStudioDone184" hidden><div class="sn-ar-card184 sn-ar-success184"><b>✅</b><h3>Snazzle geplaatst</h3><p id="snArDoneText184"></p><div class="sn-ar-actions184"><button type="button" class="sn-ar-secondary184" id="snArDoneClose184">Klaar</button><button type="button" class="sn-ar-primary184" id="snArTest184">🧭 Test als speler</button></div></div></section>
  </div>`;
  document.body.appendChild(el);wire();return el;
}

function initialCenter(){
  try{const raw=JSON.parse(localStorage.getItem('snazzleArLastPoint')||'null');if(Number.isFinite(raw?.lat)&&Number.isFinite(raw?.lon))return [raw.lat,raw.lon];}catch{}
  const village=$('#snArAdminVillage85')?.value||localStorage.getItem('snazzleVillage')||'Montfort';
  return VILLAGE_CENTERS[village]||VILLAGE_CENTERS.Montfort;
}
function saveLastPoint(){try{localStorage.setItem('snazzleArLastPoint',JSON.stringify({lat:state.lat,lon:state.lon}));}catch{}}

function loadLeaflet(){
  if(window.L)return Promise.resolve(window.L);if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector('link[data-sn-leaflet184]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.dataset.snLeaflet184='1';document.head.appendChild(l);}
    const sources=['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'];
    const trySource=i=>{if(i>=sources.length){reject(new Error('Kaartmodule kon niet laden.'));return;}const s=document.createElement('script');s.src=sources[i];s.async=true;s.onload=()=>window.L?resolve(window.L):trySource(i+1);s.onerror=()=>trySource(i+1);document.head.appendChild(s);};
    trySource(0);
  });return leafletPromise;
}

function addTiles(L){
  tileErrors=0;usingFallbackTiles=false;
  tileLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap'}).addTo(map);
  tileLayer.on('tileerror',()=>{tileErrors++;if(tileErrors>=4&&!usingFallbackTiles){usingFallbackTiles=true;try{tileLayer.remove();}catch{}tileLayer=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd',attribution:'© OpenStreetMap © CARTO'}).addTo(map);const c=$('#snArCoords184');if(c)c.textContent='🗺️ Alternatieve kaartlaag geladen · GPS wordt bepaald…';}});
}

async function ensureMap(resetView=true){
  const L=await loadLeaflet();
  if(!map){map=L.map('snArMap184',{zoomControl:true,attributionControl:true}).setView([state.lat,state.lon],18);addTiles(L);map.on('dragstart',()=>{state.source='manual';state.accuracy=0;});map.on('moveend',()=>{const p=map.getCenter();state.lat=p.lat;state.lon=p.lng;saveLastPoint();updateCoords();});}
  else if(resetView)map.setView([state.lat,state.lon],18);
  updateAccuracyCircle(L);
  setTimeout(()=>map?.invalidateSize(),80);
}
function updateAccuracyCircle(L=window.L){if(!map||!L)return;if(accuracyCircle)accuracyCircle.remove();if(state.accuracy>0)accuracyCircle=L.circle([state.lat,state.lon],{radius:Math.max(1,state.accuracy),weight:1,fillOpacity:.08}).addTo(map);}
function updateCoords(extra=''){const c=$('#snArCoords184');if(!c||!Number.isFinite(state.lat))return;c.className='sn-ar-coords184'+(state.source==='fallback'?' warn':'');const acc=state.accuracy>0?` · GPS ±${Math.round(state.accuracy)} m`:state.source==='manual'?' · handmatig gekozen':' · GPS zoeken…';c.textContent=`📍 ${state.lat.toFixed(6)}, ${state.lon.toFixed(6)}${acc}${extra?` · ${extra}`:''}`;}

function requestPosition(enableHighAccuracy,timeout,maximumAge){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund.'));navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy,timeout,maximumAge});});}
async function applyGpsPosition(pos,label){state.lat=Number(pos.coords.latitude);state.lon=Number(pos.coords.longitude);state.accuracy=Math.round(Number(pos.coords.accuracy||0));state.source='gps';saveLastPoint();if(map)map.setView([state.lat,state.lon],19);updateAccuracyCircle();updateCoords(label);}
async function locate(){
  const c=$('#snArCoords184');if(c){c.className='sn-ar-coords184 warn';c.textContent='📍 Kaart staat klaar · GPS zoeken…';}
  let found=false;
  try{const fast=await requestPosition(false,5000,300000);found=true;await applyGpsPosition(fast,'snelle locatie');}catch{}
  try{const precise=await requestPosition(true,12000,0);found=true;await applyGpsPosition(precise,'nauwkeurig');}catch(err){if(!found&&c){c.className='sn-ar-coords184 warn';c.textContent=err?.code===1?'⚠️ Locatietoestemming is geweigerd. Verschuif de kaart handmatig of geef locatie-toegang.':'⚠️ GPS reageert niet. De kaart blijft bruikbaar; verschuif hem handmatig of probeer “Mijn GPS opnieuw”.';}}
}

function openGoogleMaps(){if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon))return;const query=encodeURIComponent(`${state.lat.toFixed(7)},${state.lon.toFixed(7)}`);window.location.assign(`https://www.google.com/maps/search/?api=1&query=${query}`);}
function formData(){return{name:($('#snArAdminName85')?.value||'Scout Snazzle').trim(),number:($('#snArAdminNumber85')?.value||'001').trim(),rarity:$('#snArAdminRarity85')?.value||'RARE',village:$('#snArAdminVillage85')?.value||'Montfort',radius:Number($('#snArAdminRadius85')?.value||7),file:$('#snArAdminImage85')?.files?.[0]||null};}
function setPreview(){const f=formData().file,img=$('#snArPlaceImage184'),fallback=$('#snArPlaceFallback184');if(!img||!fallback)return;if(f){const url=URL.createObjectURL(f);img.src=url;img.hidden=false;fallback.hidden=true;}else{img.removeAttribute('src');img.hidden=true;fallback.hidden=false;}}

async function startCamera(){stopCamera();const status=$('#snArStudioStatus184');if(status){status.className='sn-ar-status184';status.textContent='📷 Camera openen…';}try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});const v=$('#snArPlaceVideo184');v.srcObject=stream;await v.play().catch(()=>{});setPreview();applyPlacement();if(status){status.className='sn-ar-status184 ok';status.textContent='✅ Camera actief. Sleep de Snazzle precies naar de plek waar hij moet staan.';}}catch(err){if(status){status.className='sn-ar-status184 err';status.textContent='⚠️ Camera kon niet openen. Controleer de cameratoestemming.';}throw err;}}
function stopCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}const v=$('#snArPlaceVideo184');if(v)v.srcObject=null;}
function applyPlacement(){const o=$('#snArPlaceObject184');if(!o)return;o.style.left=`${state.x*100}%`;o.style.top=`${state.y*100}%`;o.style.width=`${state.size*100}%`;const content=$('#snArPlaceImage184:not([hidden]),#snArPlaceFallback184:not([hidden])');if(content)content.style.transform=`rotate(${state.rotation}deg)`;const so=$('#snArSizeOut184'),ro=$('#snArRotateOut184');if(so)so.textContent=`${Math.round(state.size*100)}%`;if(ro)ro.textContent=`${Math.round(state.rotation)}°`;}
function dragStart(e){state.dragging=true;state.pointerId=e.pointerId;$('#snArPlaceObject184')?.setPointerCapture?.(e.pointerId);dragMove(e);}
function dragMove(e){if(!state.dragging||e.pointerId!==state.pointerId)return;const r=$('#snArCameraStage184')?.getBoundingClientRect();if(!r)return;state.x=Math.max(.06,Math.min(.94,(e.clientX-r.left)/r.width));state.y=Math.max(.12,Math.min(.9,(e.clientY-r.top)/r.height));applyPlacement();e.preventDefault();}
function dragEnd(e){if(e.pointerId===state.pointerId){state.dragging=false;state.pointerId=null;}}

async function upload(file,id){if(!file)return '';if(file.size>8*1024*1024)throw new Error('Afbeelding is groter dan 8 MB.');const safe=(file.name||'snazzle.png').replace(/[^a-zA-Z0-9._-]+/g,'-');const r=storageRef(storage,`listen-stories/images/${auth.currentUser.uid}/ar-${id}-${safe}`);await uploadBytes(r,file,{contentType:file.type||'image/png'});return getDownloadURL(r);}
async function readWorld(){const snap=await getDoc(WORLD_DOC),data=snap.exists()?snap.data():{};return Array.isArray(data.points)?data.points:[];}
async function writePoint(){const status=$('#snArStudioStatus184'),btn=$('#snArSavePlacement184'),f=formData();if(!auth.currentUser)throw new Error('Je bent niet meer ingelogd als beheerder.');if(f.name.length<2)throw new Error('Vul eerst een naam voor de Snazzle in.');if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon))throw new Error('Er is nog geen geldige kaartlocatie.');btn.disabled=true;if(status){status.className='sn-ar-status184';status.textContent='☁️ Afbeelding en plaatsing opslaan…';}try{const id=`ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,imageUrl=await upload(f.file,id),existing=await readWorld(),now=new Date().toISOString();const point={id,name:f.name,number:f.number||'—',rarity:f.rarity,village:f.village,radius:f.radius,lat:state.lat,lon:state.lon,accuracy:state.accuracy,imageUrl,active:true,placement:{version:1,mode:'camera-composed',x:Number(state.x.toFixed(4)),y:Number(state.y.toFixed(4)),size:Number(state.size.toFixed(4)),rotation:Number(state.rotation.toFixed(1)),placedAt:now},createdAt:now,updatedAt:now,createdBy:auth.currentUser.uid};await setDoc(WORLD_DOC,{_snazzleInternalType:'arWorld',title:'[SYSTEEM] AR-WERELD',village:'snazzle-internal',description:'Interne opslag voor permanente Snazzle AR-punten',rule:'',hint:'',foundMessage:'',imageUrl:'',start:'',end:'',mode:'draft',version:4,points:[...existing,point],updatedAt:now,updatedBy:auth.currentUser.uid},{merge:true});stopCamera();showDone(point);window.SnazzleArAdminV85?.refresh?.();}catch(err){if(status){status.className='sn-ar-status184 err';status.textContent='⚠️ '+(err?.message||'Opslaan is mislukt.');}throw err;}finally{btn.disabled=false;}}

function showStep(step){$('#snArStudioMap184').hidden=step!=='map';$('#snArStudioCam184').hidden=step!=='cam';$('#snArStudioDone184').hidden=step!=='done';$('#snArStepMap184').classList.toggle('on',step==='map');$('#snArStepCam184').classList.toggle('on',step==='cam');$('#snArStepSave184').classList.toggle('on',step==='done');}
function showDone(point){showStep('done');const t=$('#snArDoneText184');if(t)t.innerHTML=`<b>${esc(point.name)}</b> is opgeslagen op ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}.<br>De camera-positie, grootte en draaiing zijn mee opgeslagen.`;}
function close(){stopCamera();$('#snArStudioV184')?.classList.remove('show');}
async function open(){modal();const [lat,lon]=initialCenter();state={lat:Number(lat),lon:Number(lon),accuracy:0,source:'fallback',x:.5,y:.56,size:.34,rotation:0,dragging:false,pointerId:null};$('#snArSize184').value='34';$('#snArRotate184').value='0';showStep('map');$('#snArStudioV184').classList.add('show');const c=$('#snArCoords184');try{await ensureMap(true);updateCoords('kaart klaar');locate().catch(()=>{});}catch(err){if(c){c.className='sn-ar-coords184 err';c.textContent='⚠️ Kaart kon niet laden. Controleer internet en probeer opnieuw.';}}}

function wire(){$('#snArStudioClose184').addEventListener('click',close);$('#snArDoneClose184').addEventListener('click',close);$('#snArRelocate184').addEventListener('click',()=>locate().catch(()=>{}));$('#snArGoogle184').addEventListener('click',openGoogleMaps);$('#snArToCamera184').addEventListener('click',async()=>{showStep('cam');try{await startCamera();}catch{}});$('#snArBackMap184').addEventListener('click',()=>{stopCamera();showStep('map');setTimeout(()=>map?.invalidateSize(),60);});$('#snArSavePlacement184').addEventListener('click',()=>writePoint().catch(()=>{}));const obj=$('#snArPlaceObject184');obj.addEventListener('pointerdown',dragStart);obj.addEventListener('pointermove',dragMove);obj.addEventListener('pointerup',dragEnd);obj.addEventListener('pointercancel',dragEnd);$('#snArSize184').addEventListener('input',e=>{state.size=Number(e.target.value)/100;applyPlacement();});$('#snArRotate184').addEventListener('input',e=>{state.rotation=Number(e.target.value);applyPlacement();});$('#snArTest184').addEventListener('click',()=>{const village=formData().village;localStorage.setItem('snazzleVillage',village);close();document.querySelector('#adminSheet .close')?.click();setTimeout(()=>document.querySelector('#snArLaunch')?.click(),180);});}

function install(){styles();const grid=$('#snArAdminV85 .sn-ar-admin-grid');if(!grid)return false;$('#snArStudioLaunch90')?.remove();if($('#snArStudioLaunch184'))return true;const btn=document.createElement('button');btn.type='button';btn.id='snArStudioLaunch184';btn.className='save sn-ar-studio-launch184';btn.textContent='🗺️📷 Plaats via kaart + camera';btn.addEventListener('click',open);const basic=$('#snArAdminPlace85');basic?.insertAdjacentElement('afterend',btn);return true;}
function boot(){if(install())return;if(installObserver||!document.body)return;installObserver=new MutationObserver(()=>{if(install()){installObserver.disconnect();installObserver=null;}});installObserver.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SnazzleArPlaceStudioV184={open,close};
