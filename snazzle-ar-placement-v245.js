// Snazzle AR Placement v278 — native standalone plaatsing met gedeelde beheerlogin.
// Kaartgebaren blijven binnen de kaart: slepen verplaatst de plaatsing, knijpen zoomt de kaart en niet de pagina.

import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, runTransaction, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const auth=getAuth();
const db=getFirestore();
const storage=getStorage();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const MODAL_ID='snArPlacement245';
const BUTTON_ID='snArPlacementLaunch245';
const DEFAULT_MAX_RADIUS_KM=25;
const MAX_GPS_SAVE_ACCURACY=50;
const VILLAGE_CENTERS={Montfort:[51.1262,5.9488],Posterholt:[51.1230,6.0310],'Sint Odiliënberg':[51.1430,6.0000]};
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

let cameraStream=null;
let cameraToken=0;
let previewUrl='';
let dragging=false;
let pointerId=null;
let previousBodyOverflow='';
let installed=false;
let saving=false;
let cameraStarting=false;
let locateToken=0;
let state={lat:51.1262,lon:5.9488,accuracy:0,source:'fallback',label:'',x:.5,y:.56,size:.34,rotation:0};

function formData(){
  return{
    name:($('#snArAdminName85')?.value||'').trim(),number:($('#snArAdminNumber85')?.value||'001').trim(),
    rarity:$('#snArAdminRarity85')?.value||'RARE',village:$('#snArAdminVillage85')?.value||'Montfort',
    radius:Number($('#snArAdminRadius85')?.value||7),file:$('#snArAdminImage85')?.files?.[0]||null
  };
}
function makeId(){return`ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
function toast(message){const t=$('#toast');if(!t)return;setText(t,message);t.classList.add('show');clearTimeout(window.__snArPlacement245Toast);window.__snArPlacement245Toast=setTimeout(()=>t.classList.remove('show'),3200);}
function setStatus(message,type=''){const s=$('#sn245Status');if(!s)return;s.className='sn245-status'+(type?` ${type}`:'');setText(s,message);}
function setCameraStatus(message,type=''){const s=$('#sn245CameraStatus');if(!s)return;s.className='sn245-status'+(type?` ${type}`:'');setText(s,message);}
function stopTracks(s){if(!s)return;try{s.getTracks().forEach(t=>t.stop());}catch{}}

function initialCenter(){
  try{const p=JSON.parse(localStorage.getItem('snazzleArLastPoint')||'null');if(Number.isFinite(p?.lat)&&Number.isFinite(p?.lon))return[p.lat,p.lon];}catch{}
  return VILLAGE_CENTERS[formData().village]||VILLAGE_CENTERS.Montfort;
}
function rememberPoint(){try{localStorage.setItem('snazzleArLastPoint',JSON.stringify({lat:state.lat,lon:state.lon}));}catch{}}
let placementMap=null;
let placementBaseLayer=null;
let leafletPromise=null;
let mapProgrammatic=false;
let mapGesture=false;
let mapSyncToken=0;
let placementProviderIndex=0;
let placementTileFailures=0;
const MAP_TILE_PROVIDERS=[
  {url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',options:{maxZoom:19,attribution:'© OpenStreetMap'}},
  {url:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',options:{subdomains:'abcd',maxZoom:20,attribution:'© OpenStreetMap © CARTO'}},
  {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',options:{maxZoom:19,attribution:'Tiles © Esri'}}
];
function loadLeafletScript(src,timeout=6500){
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src;script.async=true;script.dataset.sn245Leaflet='1';
    let settled=false;
    const finish=(ok,value)=>{if(settled)return;settled=true;clearTimeout(timer);ok?resolve(value):reject(value);};
    const timer=setTimeout(()=>{script.remove();finish(false,new Error('Kaartmodule reageert niet.'));},timeout);
    script.onload=()=>window.L?.map?finish(true,window.L):finish(false,new Error('Kaartmodule is niet gestart.'));
    script.onerror=()=>{script.remove();finish(false,new Error('Kaartmodule kon niet laden.'));};
    document.head.appendChild(script);
  });
}
async function ensureLeaflet(){
  if(window.L?.map)return window.L;
  if(leafletPromise)return leafletPromise;
  if(!document.querySelector('link[href*="leaflet.css"]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';css.dataset.sn245LeafletCss='1';
    css.onerror=()=>{if(!document.querySelector('link[data-sn245-leaflet-css-fallback]')){const fallback=document.createElement('link');fallback.rel='stylesheet';fallback.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';fallback.dataset.sn245LeafletCssFallback='1';document.head.appendChild(fallback);}};
    document.head.appendChild(css);
  }
  leafletPromise=(async()=>{
    try{return await loadLeafletScript('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js');}
    catch{return await loadLeafletScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');}
  })();
  try{return await leafletPromise;}catch(err){leafletPromise=null;throw err;}
}
function installPlacementBaseLayer(L,index=0){
  if(!placementMap)return;
  const nextIndex=Math.max(0,Math.min(index,MAP_TILE_PROVIDERS.length-1));
  if(placementBaseLayer){try{placementMap.removeLayer(placementBaseLayer);}catch{}}
  placementProviderIndex=nextIndex;placementTileFailures=0;
  const provider=MAP_TILE_PROVIDERS[nextIndex];
  const layer=L.tileLayer(provider.url,{...provider.options,keepBuffer:3,updateWhenIdle:false,updateWhenZooming:true});
  placementBaseLayer=layer;
  let loaded=0,switched=false;
  const switchNext=()=>{
    if(switched||placementBaseLayer!==layer||nextIndex>=MAP_TILE_PROVIDERS.length-1)return;
    switched=true;
    installPlacementBaseLayer(L,nextIndex+1);
    updateMapStatus(`kaartlaag ${nextIndex+2}/${MAP_TILE_PROVIDERS.length} actief`);
  };
  layer.on('tileload',()=>{loaded++;placementTileFailures=0;});
  layer.on('tileerror',()=>{placementTileFailures++;if(placementTileFailures>=4)switchNext();});
  layer.addTo(placementMap);
  setTimeout(()=>{
    if(placementBaseLayer!==layer||switched)return;
    const canvas=$('#sn245MapCanvas');
    const visible=[...(canvas?.querySelectorAll('img.leaflet-tile')||[])].some(img=>img.complete&&img.naturalWidth>0);
    if(!loaded&&!visible)switchNext();
  },2600);
}
function updateMapStatus(note=''){
  const source=state.source==='gps'?`GPS ±${Math.round(state.accuracy||0)} m`:state.source==='address'?'adres gekozen':state.source==='manual'?'kaart/pijltjes handmatig':'nog geen bevestigde plek';
  const ok=state.source==='address'||state.source==='manual'||(state.source==='gps'&&state.accuracy<=MAX_GPS_SAVE_ACCURACY);
  setStatus(`📍 ${state.lat.toFixed(6)}, ${state.lon.toFixed(6)} · ${source}${note?` · ${note}`:''}`,ok?'ok':'');
  if(state.source!=='fallback')rememberPoint();
}
function syncMapToState(zoom=null){
  if(!placementMap)return;
  const token=++mapSyncToken;mapProgrammatic=true;
  const z=Number.isFinite(Number(zoom))?Number(zoom):placementMap.getZoom();
  placementMap.setView([state.lat,state.lon],z,{animate:false});
  setTimeout(()=>{if(token===mapSyncToken)mapProgrammatic=false;},90);
}
async function ensureInteractiveMap(){
  const canvas=$('#sn245MapCanvas');if(!canvas)return null;
  const L=await ensureLeaflet();
  if(!placementMap){
    placementMap=L.map(canvas,{zoomControl:true,attributionControl:true,preferCanvas:true,dragging:true,touchZoom:true,scrollWheelZoom:true,doubleClickZoom:true,boxZoom:false,keyboard:false,bounceAtZoomLimits:false}).setView([state.lat,state.lon],17);
    installPlacementBaseLayer(L,0);
    placementMap.on('movestart',()=>{if(!mapProgrammatic)mapGesture=true;});
    placementMap.on('moveend',()=>{
      if(mapProgrammatic){mapProgrammatic=false;return;}
      if(!mapGesture)return;
      mapGesture=false;
      const c=placementMap.getCenter();
      const moved=Math.abs(c.lat-state.lat)>0.000003||Math.abs(c.lng-state.lon)>0.000004;
      if(moved){
        locateToken++;
        state.lat=Number(c.lat);state.lon=Number(c.lng);state.accuracy=0;state.source='manual';state.label='kaart';
        updateMapStatus('pin in het midden is nu de gekozen plek');
      }else updateMapStatus('kaart ingezoomd; plek bleef gelijk');
    });
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
  }
  setTimeout(()=>placementMap?.invalidateSize({pan:false,animate:false}),20);
  return placementMap;
}
function updateMap(note='',zoom=null){
  updateMapStatus(note);
  ensureInteractiveMap().then(()=>syncMapToState(zoom)).catch(err=>setStatus('⚠️ '+(err?.message||'Kaart kon niet laden.'),'err'));
}

function installStyle(){
  if($('#snArPlacement245Style'))return;
  const s=document.createElement('style');s.id='snArPlacement245Style';s.textContent=`
#${BUTTON_ID}{width:100%;margin-top:9px;min-height:50px;border:0;border-radius:14px;padding:12px;background:linear-gradient(#4279ca,#315da3);color:#fff;font-weight:1000;font-size:14px;box-shadow:0 4px 0 #244879;touch-action:manipulation;pointer-events:auto!important;position:relative;z-index:12;text-decoration:none;display:flex;align-items:center;justify-content:center;text-align:center}
#${MODAL_ID}{position:fixed;inset:0;z-index:52000;display:none;overflow:auto;background:#082419;color:#2d2116;-webkit-overflow-scrolling:touch}#${MODAL_ID}.show{display:block}
.sn245-shell{width:min(650px,100%);min-height:100%;margin:auto;background:linear-gradient(#fff1bd,#edd18e);padding:calc(12px + env(safe-area-inset-top)) 14px calc(24px + env(safe-area-inset-bottom))}
.sn245-head{position:sticky;top:0;z-index:12;display:flex;align-items:center;gap:9px;background:#f4dca2f5;padding:7px 0 10px}.sn245-head h2{flex:1;margin:0;font-size:21px}.sn245-close{width:48px;height:48px;border:0;border-radius:14px;background:#66402a;color:#fff;font-size:28px;font-weight:1000;touch-action:manipulation}
.sn245-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:7px 0 13px}.sn245-steps span{padding:8px 4px;border-radius:11px;text-align:center;background:#d9bd78;font-size:11px;font-weight:950}.sn245-steps span.on{background:#315d39;color:#fff}
.sn245-card{background:#fff8e7;border:2px solid #bc995f;border-radius:18px;padding:13px;margin-bottom:12px}.sn245-card h3{margin:0 0 7px;font-size:18px}.sn245-card p{margin:5px 0 10px;font-size:13px;font-weight:730;line-height:1.4}
.sn245-map{height:300px;border:3px solid #6c5435;border-radius:16px;overflow:hidden;background:#dfe8db;position:relative;touch-action:none;overscroll-behavior:contain}.sn245-map-canvas{position:absolute;inset:0;z-index:1;touch-action:none;overscroll-behavior:contain}.sn245-map .leaflet-container{width:100%;height:100%;touch-action:none;background:#dfe8db}.sn245-map .leaflet-control{font-family:inherit}.sn245-pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);font-size:40px;z-index:500;filter:drop-shadow(0 2px 2px #fff);pointer-events:none}.sn245-map-help{position:absolute;left:8px;right:8px;bottom:8px;z-index:550;padding:6px 8px;border-radius:10px;background:#173c2ddd;color:#fff;text-align:center;font-size:10px;font-weight:900;pointer-events:none}
.sn245-status{padding:10px 11px;border-radius:12px;background:#fff0c8;border:2px solid #d6a341;font-size:12px;font-weight:900;margin-top:9px;line-height:1.35}.sn245-status.ok{background:#e2f1c9;border-color:#83a94a;color:#315522}.sn245-status.err{background:#f5d0c7;border-color:#c06b5d;color:#762c24}
.sn245-search{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.sn245-search input{min-width:0;border:2px solid #b9955e;border-radius:12px;padding:11px;background:#fffdf6;color:#2d2116;font-size:16px}.sn245-search button{border:0;border-radius:12px;padding:10px 13px;background:#3d6fc2;color:#fff;font-weight:950}
.sn245-nudge{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}.sn245-nudge button{min-height:43px;border:0;border-radius:12px;background:#ead49c;color:#3a2b18;font-weight:950}.sn245-nudge .gps{background:#5d8f45;color:#fff}.sn245-nudge .blank{visibility:hidden}
.sn245-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px}.sn245-actions button{min-height:49px;border:0;border-radius:14px;padding:10px;font-weight:1000;touch-action:manipulation}.sn245-primary{background:linear-gradient(#69c43a,#3b8b29);color:#fff;box-shadow:0 4px 0 #28661f}.sn245-secondary{background:#d5b36e;color:#302216}.sn245-actions button:disabled{opacity:.55;box-shadow:none}
.sn245-camera{height:min(64vh,520px);min-height:370px;border:3px solid #5f4a30;border-radius:18px;overflow:hidden;background:#10261b;position:relative;touch-action:none}.sn245-camera video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.sn245-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.26),transparent 22%,transparent 75%,rgba(0,0,0,.38));pointer-events:none}.sn245-help{position:absolute;left:10px;right:10px;top:10px;z-index:4;background:#143d2fdd;color:#fff;border:2px solid #d6ef70;border-radius:12px;padding:8px;text-align:center;font-size:11px;font-weight:900;pointer-events:none}
.sn245-object{position:absolute;left:50%;top:56%;width:34%;aspect-ratio:1;transform:translate(-50%,-50%);display:grid;place-items:center;z-index:3;touch-action:none;user-select:none;filter:drop-shadow(0 12px 8px rgba(0,0,0,.35))}.sn245-object img{max-width:100%;max-height:100%;object-fit:contain;pointer-events:none}.sn245-duck{font-size:clamp(72px,25vw,145px);line-height:1;pointer-events:none}.sn245-ring{position:absolute;inset:-8px;border:2px dashed #fff08a;border-radius:50%;pointer-events:none}
.sn245-controls{display:grid;gap:9px;margin-top:11px}.sn245-control{display:grid;grid-template-columns:82px 1fr 48px;align-items:center;gap:8px;font-size:12px;font-weight:900}.sn245-control input{width:100%}.sn245-control output{text-align:right}.sn245-retry{display:none;width:100%;margin-top:9px;min-height:47px;border:0;border-radius:13px;background:#3d6fc2;color:#fff;font-weight:1000}.sn245-retry.show{display:block}
.sn245-done{text-align:center;padding:22px 8px}.sn245-done b{display:block;font-size:44px}.sn245-done h3{font-size:24px;margin:6px 0}
.sn245-radius{margin-top:10px;padding:10px;border:2px solid #bc995f;border-radius:13px;background:#fff4d5}.sn245-radius-row{display:grid;grid-template-columns:1fr auto;gap:8px}.sn245-radius input{min-width:0;border:2px solid #b9955e;border-radius:11px;padding:9px;font-size:15px}.sn245-radius button{border:0;border-radius:11px;padding:9px 12px;background:#5d8f45;color:#fff;font-weight:950}
@media(max-width:390px){.sn245-map{height:265px}.sn245-actions,.sn245-search{grid-template-columns:1fr}.sn245-control{grid-template-columns:72px 1fr 44px}}
`;
  document.head.appendChild(s);
}

function ensureModal(){
  installStyle();let modal=$('#'+MODAL_ID);if(modal)return modal;
  modal=document.createElement('div');modal.id=MODAL_ID;
  modal.innerHTML=`<div class="sn245-shell"><div class="sn245-head"><h2>Snazzle nauwkeurig plaatsen 🗺️📷</h2><button class="sn245-close" id="sn245Close" type="button" aria-label="Sluiten">×</button></div><div class="sn245-steps"><span id="sn245StepMap" class="on">1 · Plek</span><span id="sn245StepCamera">2 · Camera</span><span id="sn245StepDone">3 · Klaar</span></div>
<section id="sn245MapSection"><div class="sn245-card"><h3>1. Kies de vaste plek</h3><p>Gebruik GPS als je op locatie bent, of zoek een volledig adres. Opslaan kan pas nadat GPS/adres/handmatige bijstelling een echte plek heeft bevestigd.</p><div class="sn245-map"><div class="sn245-map-canvas" id="sn245MapCanvas" aria-label="Interactieve kaart voor Snazzle-plaatsing"></div><div class="sn245-pin">📍</div><div class="sn245-map-help">Sleep de kaart onder de pin · knijp om alleen de kaart te zoomen</div></div><div class="sn245-status" id="sn245Status">Kaart klaarzetten…</div><div class="sn245-search"><input id="sn245Address" type="search" placeholder="Bijv. Markt 1, Montfort" autocomplete="street-address"><button id="sn245Search" type="button">Zoek adres</button></div><div class="sn245-nudge"><span class="blank"></span><button type="button" data-sn245-nudge="n">↑ Noord</button><span class="blank"></span><button type="button" data-sn245-nudge="w">← West</button><button type="button" class="gps" id="sn245Gps">🎯 GPS</button><button type="button" data-sn245-nudge="e">Oost →</button><span class="blank"></span><button type="button" data-sn245-nudge="s">↓ Zuid</button><span class="blank"></span></div><div class="sn245-actions"><button class="sn245-secondary" id="sn245MapOnly" type="button">📍 Alleen kaart opslaan</button><button class="sn245-primary" id="sn245ToCamera" type="button">📷 Plek klopt — camera</button></div></div></section>
<section id="sn245CameraSection" hidden><div class="sn245-card"><h3>2. Zet de Snazzle in beeld</h3><p>Sleep hem naar de gewenste schermpositie en stel grootte en draaiing af. De zoeker ziet deze 2D-plaatsing zodra de GPS-vangzone is bereikt.</p><div class="sn245-camera" id="sn245Camera"><video id="sn245Video" autoplay muted playsinline></video><div class="sn245-shade"></div><div class="sn245-help">Sleep de Snazzle naar de juiste plek</div><div class="sn245-object" id="sn245Object"><div class="sn245-ring"></div><div class="sn245-duck" id="sn245Duck">🦆</div><img id="sn245Image" alt="Snazzle" hidden></div></div><div class="sn245-controls"><label class="sn245-control">Grootte <input id="sn245Size" type="range" min="18" max="62" value="34"><output id="sn245SizeOut">34%</output></label><label class="sn245-control">Draaien <input id="sn245Rotate" type="range" min="-180" max="180" value="0"><output id="sn245RotateOut">0°</output></label></div><div class="sn245-status" id="sn245CameraStatus">Camera klaarzetten…</div><button class="sn245-retry" id="sn245RetryCamera" type="button">📷 Camera opnieuw openen</button><div class="sn245-actions"><button class="sn245-secondary" id="sn245Back" type="button">← Terug naar plek</button><button class="sn245-primary" id="sn245SaveCamera" type="button">🔒 Hier vastzetten</button></div></div></section>
<section id="sn245DoneSection" hidden><div class="sn245-card sn245-done"><b>✅</b><h3>Snazzle geplaatst</h3><p id="sn245DoneText"></p><div class="sn245-actions"><button class="sn245-secondary" id="sn245PlaceAnother" type="button">Nog één plaatsen</button><button class="sn245-primary" id="sn245DoneClose" type="button">Klaar</button></div></div></section></div>`;
  document.body.appendChild(modal);wireModal();return modal;
}
function showStep(step){
  $('#sn245MapSection').hidden=step!=='map';$('#sn245CameraSection').hidden=step!=='camera';$('#sn245DoneSection').hidden=step!=='done';
  $('#sn245StepMap').classList.toggle('on',step==='map');$('#sn245StepCamera').classList.toggle('on',step==='camera');$('#sn245StepDone').classList.toggle('on',step==='done');
}

function requestPos(highAccuracy,timeoutMs,maxAge){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund.'));navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:highAccuracy,timeout:timeoutMs,maximumAge:maxAge});});}
function applyGpsPosition(pos,note=''){
  if(['address','manual'].includes(state.source))return;
  state.lat=Number(pos.coords.latitude);state.lon=Number(pos.coords.longitude);state.accuracy=Number(pos.coords.accuracy||0);state.source='gps';state.label='GPS';updateMap(note);
}
async function locate({force=false}={}){
  const token=++locateToken;if(force)state.source='fallback';setStatus('📍 GPS zoeken…');let gotOne=false;
  try{const quick=await requestPos(false,4200,10000);if(token!==locateToken)return;gotOne=true;applyGpsPosition(quick,'snelle locatie');}catch{}
  try{const precise=await requestPos(true,12000,0);if(token!==locateToken)return;gotOne=true;applyGpsPosition(precise,Number(precise.coords.accuracy||0)<=MAX_GPS_SAVE_ACCURACY?'nauwkeurig':'GPS nog verfijnen');}
  catch(err){if(token!==locateToken)return;if(!gotOne&&!['address','manual'].includes(state.source)){const msg=err?.code===1?'Locatietoestemming is geweigerd. Zoek een adres of geef locatietoegang.':'GPS reageert niet. Zoek een adres of probeer GPS opnieuw.';setStatus('⚠️ '+msg,'err');}}
}
function nudge(dir){
  locateToken++;const step=.00005;if(dir==='n')state.lat+=step;if(dir==='s')state.lat-=step;if(dir==='e')state.lon+=step;if(dir==='w')state.lon-=step;
  state.accuracy=0;state.source='manual';state.label='handmatig';updateMap('± 5 m bijgesteld');
}

async function fetchJson(url,ms=6500){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),ms);try{const r=await fetch(url,{signal:ctl.signal,headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json();}finally{clearTimeout(timer);}}
async function geocode(query){
  try{const rows=await fetchJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=nl&accept-language=nl&q=${encodeURIComponent(query)}`,6000);const hit=rows?.[0];if(hit){const lat=Number(hit.lat),lon=Number(hit.lon);if(Number.isFinite(lat)&&Number.isFinite(lon))return{lat,lon,label:hit.display_name||query};}}catch{}
  try{const data=await fetchJson(`https://photon.komoot.io/api/?limit=1&lang=nl&q=${encodeURIComponent(query)}`,6000);const hit=data?.features?.[0],c=hit?.geometry?.coordinates;if(Array.isArray(c)){const lon=Number(c[0]),lat=Number(c[1]),p=hit.properties||{};if(Number.isFinite(lat)&&Number.isFinite(lon))return{lat,lon,label:[p.name,p.street,p.housenumber,p.city||p.locality].filter(Boolean).join(', ')||query};}}catch{}
  try{const data=await fetchJson(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=1&countryCode=NLD&outFields=Match_addr&SingleLine=${encodeURIComponent(query)}`,6500);const hit=data?.candidates?.[0],loc=hit?.location,lat=Number(loc?.y),lon=Number(loc?.x);if(Number.isFinite(lat)&&Number.isFinite(lon))return{lat,lon,label:hit.address||query};}catch{}
  return null;
}
async function searchAddress(){
  const input=$('#sn245Address'),btn=$('#sn245Search'),q=(input?.value||'').trim();if(q.length<4){setStatus('⚠️ Vul straat + huisnummer + plaats in.','err');return;}
  btn.disabled=true;setStatus('🔎 Adres zoeken…');
  try{const hit=await geocode(q);if(!hit)throw new Error('Adres niet gevonden. Probeer straat + huisnummer + plaatsnaam.');locateToken++;state.lat=hit.lat;state.lon=hit.lon;state.accuracy=0;state.source='address';state.label=hit.label;updateMap('adres gevonden',18);toast('✅ Adres gevonden. Sleep of zoom de kaart voor de exacte plek.');}
  catch(err){setStatus('⚠️ '+(err?.message||'Adres zoeken mislukt.'),'err');}finally{btn.disabled=false;}
}

function setPreview(){
  if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}
  const file=formData().file,img=$('#sn245Image'),duck=$('#sn245Duck');if(!img||!duck)return;
  if(file){previewUrl=URL.createObjectURL(file);img.src=previewUrl;img.hidden=false;duck.hidden=true;}else{img.removeAttribute('src');img.hidden=true;duck.hidden=false;}
}
function applyPlacement(){
  const o=$('#sn245Object');if(!o)return;o.style.left=`${state.x*100}%`;o.style.top=`${state.y*100}%`;o.style.width=`${state.size*100}%`;
  const content=!$('#sn245Image')?.hidden?$('#sn245Image'):$('#sn245Duck');if(content)content.style.transform=`rotate(${state.rotation}deg)`;
  setText($('#sn245SizeOut'),`${Math.round(state.size*100)}%`);setText($('#sn245RotateOut'),`${Math.round(state.rotation)}°`);
}
function releaseCamera(){stopTracks(cameraStream);cameraStream=null;const video=$('#sn245Video');if(video){try{video.pause();}catch{}video.srcObject=null;}}
function stopCamera(){cameraToken++;releaseCamera();cameraStarting=false;}
function timedCamera(constraints,ms=8000){
  let expired=false;const req=navigator.mediaDevices.getUserMedia(constraints).then(s=>{if(expired){stopTracks(s);throw new Error('camera-timeout');}return s;});
  const timer=new Promise((_,reject)=>setTimeout(()=>{expired=true;reject(new Error('camera-timeout'));},ms));return Promise.race([req,timer]);
}
async function startCamera(){
  if(cameraStarting)return;
  releaseCamera();const token=++cameraToken;cameraStarting=true;setPreview();applyPlacement();
  const retry=$('#sn245RetryCamera');retry?.classList.remove('show');setCameraStatus('📷 Camera openen…');
  try{
    if(!window.isSecureContext)throw new Error('Camera vereist een beveiligde HTTPS-verbinding.');
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera wordt niet ondersteund op dit toestel.');
    let s;
    try{s=await timedCamera({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false},8000);}catch(err){if(err?.name==='NotAllowedError'||err?.name==='SecurityError'||err?.message==='camera-timeout')throw err;s=await timedCamera({video:true,audio:false},6500);}
    if(token!==cameraToken||!$('#'+MODAL_ID)?.classList.contains('show')||$('#sn245CameraSection')?.hidden){stopTracks(s);return;}
    cameraStream=s;const video=$('#sn245Video');if(!video){stopTracks(s);cameraStream=null;throw new Error('Camerabeeld ontbreekt.');}
    video.srcObject=s;await video.play().catch(()=>{});
    if(token!==cameraToken){releaseCamera();return;}setCameraStatus('✅ Camera actief. Sleep de Snazzle naar de juiste plek.','ok');
  }catch(err){
    if(token!==cameraToken)return;releaseCamera();let msg='Camera kon niet openen.';
    if(err?.name==='NotAllowedError'||err?.name==='SecurityError')msg='Cameratoegang is geweigerd. Geef Snazzle cameratoegang en probeer opnieuw.';
    else if(err?.name==='NotFoundError')msg='Geen camera gevonden op dit toestel.';else if(err?.message==='camera-timeout')msg='Camera reageert te langzaam. Sluit andere camera-apps en probeer opnieuw.';else if(err?.message)msg=err.message;
    setCameraStatus('⚠️ '+msg,'err');retry?.classList.add('show');
  }finally{if(token===cameraToken)cameraStarting=false;}
}
function dragStart(e){dragging=true;pointerId=e.pointerId;$('#sn245Object')?.setPointerCapture?.(e.pointerId);dragMove(e);}
function dragMove(e){if(!dragging||e.pointerId!==pointerId)return;const r=$('#sn245Camera')?.getBoundingClientRect();if(!r)return;state.x=clamp((e.clientX-r.left)/r.width,.06,.94);state.y=clamp((e.clientY-r.top)/r.height,.12,.9);applyPlacement();e.preventDefault();}
function dragEnd(e){if(e.pointerId!==pointerId)return;dragging=false;pointerId=null;}

function sourcePlacement(){
  const video=$('#sn245Video'),frame=$('#sn245Camera');
  if(!video||!frame||!video.videoWidth||!video.videoHeight)return null;
  const r=frame.getBoundingClientRect();if(!r.width||!r.height)return null;
  const scale=Math.max(r.width/video.videoWidth,r.height/video.videoHeight);
  const renderedWidth=video.videoWidth*scale,renderedHeight=video.videoHeight*scale;
  const cropX=Math.max(0,(renderedWidth-r.width)/2),cropY=Math.max(0,(renderedHeight-r.height)/2);
  return{
    sourceX:Number(clamp((state.x*r.width+cropX)/renderedWidth,0,1).toFixed(5)),
    sourceY:Number(clamp((state.y*r.height+cropY)/renderedHeight,0,1).toFixed(5)),
    sourceSize:Number(clamp((state.size*r.width)/renderedWidth,.02,1.5).toFixed(5)),
    videoAspect:Number((video.videoWidth/video.videoHeight).toFixed(5))
  };
}

function validatePlacementSource(mode){
  if(!['gps','address','manual'].includes(state.source))throw new Error('Kies eerst een echte plek via GPS, adres of de pijltjes. Het startpunt wordt nooit automatisch opgeslagen.');
  if(state.source==='gps'&&Number(state.accuracy||Infinity)>MAX_GPS_SAVE_ACCURACY)throw new Error(`GPS is nog te onnauwkeurig (±${Math.round(state.accuracy)} m). Tik GPS opnieuw of gebruik adres/pijltjes.`);
  if(mode==='camera-composed'&&!cameraStream)throw new Error('Open eerst de camera. Een camera-plaatsing wordt pas opgeslagen als het camerabeeld actief is.');
}
async function uploadImage(file,id){
  if(!file)return'';if(file.size>8*1024*1024)throw new Error('Afbeelding is groter dan 8 MB.');
  const safe=(file.name||'snazzle.png').replace(/[^a-zA-Z0-9._-]+/g,'-');const ref=storageRef(storage,`listen-stories/images/${auth.currentUser.uid}/ar-${id}-${safe}`);
  await uploadBytes(ref,file,{contentType:file.type||'image/png'});return getDownloadURL(ref);
}
async function persistPoint(mode){
  const f=formData();if(f.name.length<2)throw new Error('Vul eerst een naam voor de Snazzle in.');if(!auth.currentUser)throw new Error('Je bent niet meer ingelogd als beheerder.');
  if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon))throw new Error('Er is geen geldige locatie gekozen.');validatePlacementSource(mode);
  const id=makeId(),imageUrl=await uploadImage(f.file,id),now=new Date().toISOString();
  const source=mode==='camera-composed'?sourcePlacement():null;
  const placement=mode==='camera-composed'?{version:7,mode:'camera-composed',x:Number(state.x.toFixed(4)),y:Number(state.y.toFixed(4)),size:Number(state.size.toFixed(4)),rotation:Number(state.rotation.toFixed(1)),...(source||{}),placedAt:now}:{version:7,mode:'map-only',x:.5,y:.5,size:.34,rotation:0,placedAt:now};
  const point={id,name:f.name,number:f.number||'—',rarity:f.rarity,village:f.village,radius:Math.max(4,Number(f.radius||7)),lat:Number(state.lat),lon:Number(state.lon),accuracy:Number(state.accuracy||0),imageUrl,active:true,placement,createdAt:now,updatedAt:now,createdBy:auth.currentUser.uid};
  await runTransaction(db,async tx=>{const snap=await tx.get(WORLD_DOC),data=snap.exists()?snap.data():{},existing=Array.isArray(data.points)?data.points:[];tx.set(WORLD_DOC,{_snazzleInternalType:'arWorld',title:'[SYSTEEM] AR-WERELD',village:'snazzle-internal',description:'Interne opslag voor permanente Snazzle AR-punten',rule:'',hint:'',foundMessage:'',imageUrl:'',start:'',end:'',mode:'draft',version:9,points:[...existing,point],updatedAt:now,updatedBy:auth.currentUser.uid},{merge:true});});
  return point;
}
async function save(mode){
  if(saving)return;saving=true;const btn=mode==='camera-composed'?$('#sn245SaveCamera'):$('#sn245MapOnly');if(btn)btn.disabled=true;const status=mode==='camera-composed'?setCameraStatus:setStatus;status('☁️ Snazzle veilig opslaan…');
  try{const point=await persistPoint(mode);stopCamera();showStep('done');$('#sn245DoneText').innerHTML=`<b>${esc(point.name)}</b> is opgeslagen.<br>${mode==='camera-composed'?'Schermpositie, grootte en draaiing zijn vastgelegd.':'De kaartlocatie is vastgelegd; tijdens het zoeken verschijnt hij standaard in het midden.'}`;window.SnazzleArAdminV245?.refresh?.();window.SnazzleArEngineV245?.reload?.(true).catch?.(()=>{});toast('✅ Snazzle geplaatst.');}
  catch(err){console.error('Snazzle placement v245',err);status('⚠️ '+(err?.message||'Opslaan is mislukt.'),'err');}finally{saving=false;if(btn)btn.disabled=false;}
}

function resetState(){const [lat,lon]=initialCenter();state={lat:Number(lat),lon:Number(lon),accuracy:0,source:'fallback',label:'',x:.5,y:.56,size:.34,rotation:0};if($('#sn245Size'))$('#sn245Size').value='34';if($('#sn245Rotate'))$('#sn245Rotate').value='0';applyPlacement();}
function open(){const modal=ensureModal();resetState();showStep('map');previousBodyOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';modal.classList.add('show');updateMap('nog bevestigen',17);const input=$('#sn245Address');if(input)input.value='';setTimeout(()=>{placementMap?.invalidateSize(false);locate().catch(()=>{});},80);}
function close(){locateToken++;stopCamera();dragging=false;pointerId=null;if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}$('#'+MODAL_ID)?.classList.remove('show');document.body.style.overflow=previousBodyOverflow;previousBodyOverflow='';}
function placeAnother(){resetState();showStep('map');updateMap('nieuwe plaatsing — nog bevestigen',17);setTimeout(()=>{placementMap?.invalidateSize(false);locate().catch(()=>{});},80);}
function wireModal(){
  $('#sn245Close').addEventListener('click',close);$('#sn245DoneClose').addEventListener('click',close);$('#sn245PlaceAnother').addEventListener('click',placeAnother);$('#sn245Gps').addEventListener('click',()=>locate({force:true}).catch(()=>{}));
  $('#sn245Search').addEventListener('click',searchAddress);$('#sn245Address').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchAddress();}});document.querySelectorAll('[data-sn245-nudge]').forEach(b=>b.addEventListener('click',()=>nudge(b.dataset.sn245Nudge)));
  $('#sn245MapOnly').addEventListener('click',()=>save('map-only'));$('#sn245ToCamera').addEventListener('click',()=>{try{validatePlacementSource('map-only');showStep('camera');startCamera();}catch(err){setStatus('⚠️ '+err.message,'err');}});$('#sn245RetryCamera').addEventListener('click',startCamera);$('#sn245Back').addEventListener('click',()=>{stopCamera();showStep('map');});$('#sn245SaveCamera').addEventListener('click',()=>save('camera-composed'));
  const obj=$('#sn245Object');obj.addEventListener('pointerdown',dragStart);obj.addEventListener('pointermove',dragMove);obj.addEventListener('pointerup',dragEnd);obj.addEventListener('pointercancel',dragEnd);$('#sn245Size').addEventListener('input',e=>{state.size=Number(e.target.value)/100;applyPlacement();});$('#sn245Rotate').addEventListener('input',e=>{state.rotation=Number(e.target.value);applyPlacement();});
}

async function loadRadius(){try{const snap=await getDoc(WORLD_DOC),data=snap.exists()?snap.data():{};return Math.max(.1,Math.min(1000,Number(data.arMaxSearchRadiusKm??DEFAULT_MAX_RADIUS_KM)));}catch{return DEFAULT_MAX_RADIUS_KM;}}
async function saveRadius(){const input=$('#sn245MaxRadius'),status=$('#sn245MaxRadiusStatus');let value=Number(input?.value);if(!Number.isFinite(value)||value<.1||value>1000){setText(status,'⚠️ Kies 0,1 t/m 1000 km.');return;}const btn=$('#sn245SaveRadius');btn.disabled=true;try{await setDoc(WORLD_DOC,{arMaxSearchRadiusKm:value,updatedAt:new Date().toISOString(),updatedBy:auth.currentUser?.uid||''},{merge:true});setText(status,`✅ Zoekstraal opgeslagen: ${value} km`);window.SnazzleArEngineV245?.reload?.(true).catch?.(()=>{});}catch{setText(status,'⚠️ Opslaan van de zoekstraal mislukte.');}finally{btn.disabled=false;}}
function installRadiusControl(){
  const grid=$('#snArAdminV85 .sn-ar-admin-grid');if(!grid||$('#sn245RadiusWrap'))return;$('#sn244RadiusWrap')?.remove();
  const wrap=document.createElement('div');wrap.id='sn245RadiusWrap';wrap.className='sn245-radius';wrap.innerHTML=`<b>Maximale AR-zoekafstand</b><div class="sn245-radius-row"><input id="sn245MaxRadius" type="number" min="0.1" max="1000" step="0.5" inputmode="decimal" value="25"><button id="sn245SaveRadius" type="button">Opslaan</button></div><small id="sn245MaxRadiusStatus">Bepaalt hoe ver AR naar de dichtstbijzijnde nog niet gevangen Snazzle zoekt.</small>`;
  const status=$('#snArAdminStatus85');if(status)grid.insertBefore(wrap,status);else grid.appendChild(wrap);$('#sn245SaveRadius').addEventListener('click',saveRadius);loadRadius().then(v=>{const i=$('#sn245MaxRadius');if(i)i.value=String(v);});
}
function installButton(){
  const basic=$('#snArAdminPlace85');if(!basic)return false;
  installStyle();basic.textContent='📍 Snel plaatsen op huidige GPS';
  $('#snArPlacementLaunch244')?.remove();
  let current=$('#'+BUTTON_ID);
  const href='./snazzle-ar-place.html?v=278';
  if(!current||current.tagName!=='A'){
    const link=document.createElement('a');
    link.id=BUTTON_ID;
    link.href=href;
    link.textContent='🗺️📷 Nauwkeurig via kaart + camera';
    link.setAttribute('role','button');
    link.setAttribute('aria-label','Open nauwkeurig AR plaatsen');
    if(current)current.replaceWith(link);else basic.insertAdjacentElement('afterend',link);
    current=link;
  }else{
    current.href=href;
    current.textContent='🗺️📷 Nauwkeurig via kaart + camera';
  }
  installRadiusControl();installed=true;return true;
}
function boot(){installButton();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('snazzle:admin-ui-ready',()=>{installButton();installRadiusControl();});
window.addEventListener('orientationchange',()=>{setTimeout(()=>placementMap?.invalidateSize({pan:false,animate:false}),180);},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&$('#'+MODAL_ID)?.classList.contains('show'))setTimeout(()=>placementMap?.invalidateSize({pan:false,animate:false}),100);});
window.addEventListener('pagehide',()=>{stopCamera();locateToken++;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&$('#'+MODAL_ID)?.classList.contains('show')){stopCamera();if(!$('#sn245CameraSection')?.hidden){setCameraStatus('Camera gepauzeerd omdat de app naar de achtergrond ging. Tik op Camera opnieuw openen.','err');$('#sn245RetryCamera')?.classList.add('show');}}});

window.SnazzleArPlacementV245={open,close,locate,refresh:installButton};
console.info('Snazzle AR Placement v278 native plaatslink actief');
