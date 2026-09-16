// Snazzle AR Placement v244 — één beheerflow voor GPS, adres/kaart, camera en opslaan.
// Vervangt de overlappende v195/v197/v198 plaatsingslagen en gebruikt één vaste placement-structuur.

import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, runTransaction, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const auth=getAuth();
const db=getFirestore();
const storage=getStorage();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const MODAL_ID='snArPlacement244';
const BUTTON_ID='snArPlacementLaunch244';
const DEFAULT_MAX_RADIUS_KM=25;
const VILLAGE_CENTERS={Montfort:[51.1262,5.9488],Posterholt:[51.1230,6.0310],'Sint Odiliënberg':[51.1430,6.0000]};
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

let cameraStream=null;
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
    name:($('#snArAdminName85')?.value||'').trim(),
    number:($('#snArAdminNumber85')?.value||'001').trim(),
    rarity:$('#snArAdminRarity85')?.value||'RARE',
    village:$('#snArAdminVillage85')?.value||'Montfort',
    radius:Number($('#snArAdminRadius85')?.value||7),
    file:$('#snArAdminImage85')?.files?.[0]||null
  };
}
function makeId(){return`ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;}
function toast(message){const t=$('#toast');if(!t)return;setText(t,message);t.classList.add('show');clearTimeout(window.__snArPlacement244Toast);window.__snArPlacement244Toast=setTimeout(()=>t.classList.remove('show'),3200);}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
function setStatus(message,type=''){const s=$('#sn244Status');if(!s)return;s.className='sn244-status'+(type?` ${type}`:'');setText(s,message);}
function setCameraStatus(message,type=''){const s=$('#sn244CameraStatus');if(!s)return;s.className='sn244-status'+(type?` ${type}`:'');setText(s,message);}

function initialCenter(){
  try{const p=JSON.parse(localStorage.getItem('snazzleArLastPoint')||'null');if(Number.isFinite(p?.lat)&&Number.isFinite(p?.lon))return[p.lat,p.lon];}catch{}
  const center=VILLAGE_CENTERS[formData().village];
  return center||VILLAGE_CENTERS.Montfort;
}
function rememberPoint(){try{localStorage.setItem('snazzleArLastPoint',JSON.stringify({lat:state.lat,lon:state.lon}));}catch{}}
function mapUrl(){
  const dLat=.0022,dLon=.0036;
  const l=(state.lon-dLon).toFixed(6),r=(state.lon+dLon).toFixed(6),b=(state.lat-dLat).toFixed(6),t=(state.lat+dLat).toFixed(6);
  return`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(`${l},${b},${r},${t}`)}&layer=mapnik&marker=${encodeURIComponent(`${state.lat.toFixed(6)},${state.lon.toFixed(6)}`)}`;
}
function updateMap(note=''){
  const frame=$('#sn244MapFrame');if(frame)frame.src=mapUrl();
  const source=state.source==='gps'?`GPS ±${Math.round(state.accuracy||0)} m`:state.source==='address'?'adres gekozen':state.source==='manual'?'handmatig bijgestuurd':'startpunt';
  setStatus(`📍 ${state.lat.toFixed(6)}, ${state.lon.toFixed(6)} · ${source}${note?` · ${note}`:''}`,state.source==='gps'||state.source==='address'?'ok':'');
  rememberPoint();
}

function installStyle(){
  if($('#snArPlacement244Style'))return;
  const s=document.createElement('style');s.id='snArPlacement244Style';s.textContent=`
#${BUTTON_ID}{width:100%;margin-top:9px;min-height:50px;border:0;border-radius:14px;padding:12px;background:linear-gradient(#4279ca,#315da3);color:#fff;font-weight:1000;font-size:14px;box-shadow:0 4px 0 #244879;touch-action:manipulation}
#${MODAL_ID}{position:fixed;inset:0;z-index:52000;display:none;overflow:auto;background:#082419;color:#2d2116;-webkit-overflow-scrolling:touch}
#${MODAL_ID}.show{display:block}
.sn244-shell{width:min(650px,100%);min-height:100%;margin:auto;background:linear-gradient(#fff1bd,#edd18e);padding:calc(12px + env(safe-area-inset-top)) 14px calc(24px + env(safe-area-inset-bottom))}
.sn244-head{position:sticky;top:0;z-index:12;display:flex;align-items:center;gap:9px;background:#f4dca2f5;padding:7px 0 10px}.sn244-head h2{flex:1;margin:0;font-size:21px}.sn244-close{width:48px;height:48px;border:0;border-radius:14px;background:#66402a;color:#fff;font-size:28px;font-weight:1000;touch-action:manipulation}
.sn244-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:7px 0 13px}.sn244-steps span{padding:8px 4px;border-radius:11px;text-align:center;background:#d9bd78;font-size:11px;font-weight:950}.sn244-steps span.on{background:#315d39;color:#fff}
.sn244-card{background:#fff8e7;border:2px solid #bc995f;border-radius:18px;padding:13px;margin-bottom:12px}.sn244-card h3{margin:0 0 7px;font-size:18px}.sn244-card p{margin:5px 0 10px;font-size:13px;font-weight:730;line-height:1.4}
.sn244-map{height:300px;border:3px solid #6c5435;border-radius:16px;overflow:hidden;background:#dfe8db;position:relative}.sn244-map iframe{width:100%;height:100%;border:0;pointer-events:none}.sn244-pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);font-size:40px;z-index:3;filter:drop-shadow(0 2px 2px #fff);pointer-events:none}
.sn244-status{padding:10px 11px;border-radius:12px;background:#fff0c8;border:2px solid #d6a341;font-size:12px;font-weight:900;margin-top:9px;line-height:1.35}.sn244-status.ok{background:#e2f1c9;border-color:#83a94a;color:#315522}.sn244-status.err{background:#f5d0c7;border-color:#c06b5d;color:#762c24}
.sn244-search{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.sn244-search input{min-width:0;border:2px solid #b9955e;border-radius:12px;padding:11px;background:#fffdf6;color:#2d2116;font-size:16px}.sn244-search button{border:0;border-radius:12px;padding:10px 13px;background:#3d6fc2;color:#fff;font-weight:950}
.sn244-nudge{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}.sn244-nudge button{min-height:43px;border:0;border-radius:12px;background:#ead49c;color:#3a2b18;font-weight:950}.sn244-nudge .gps{background:#5d8f45;color:#fff}.sn244-nudge .blank{visibility:hidden}
.sn244-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px}.sn244-actions button{min-height:49px;border:0;border-radius:14px;padding:10px;font-weight:1000;touch-action:manipulation}.sn244-primary{background:linear-gradient(#69c43a,#3b8b29);color:#fff;box-shadow:0 4px 0 #28661f}.sn244-secondary{background:#d5b36e;color:#302216}.sn244-blue{background:#3d6fc2;color:#fff}.sn244-actions button:disabled{opacity:.55;box-shadow:none}
.sn244-camera{height:min(64vh,520px);min-height:370px;border:3px solid #5f4a30;border-radius:18px;overflow:hidden;background:#10261b;position:relative;touch-action:none}.sn244-camera video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.sn244-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.26),transparent 22%,transparent 75%,rgba(0,0,0,.38));pointer-events:none}.sn244-help{position:absolute;left:10px;right:10px;top:10px;z-index:4;background:#143d2fdd;color:#fff;border:2px solid #d6ef70;border-radius:12px;padding:8px;text-align:center;font-size:11px;font-weight:900;pointer-events:none}
.sn244-object{position:absolute;left:50%;top:56%;width:34%;aspect-ratio:1;transform:translate(-50%,-50%);display:grid;place-items:center;z-index:3;touch-action:none;user-select:none;filter:drop-shadow(0 12px 8px rgba(0,0,0,.35))}.sn244-object img{max-width:100%;max-height:100%;object-fit:contain;pointer-events:none}.sn244-duck{font-size:clamp(72px,25vw,145px);line-height:1;pointer-events:none}.sn244-ring{position:absolute;inset:-8px;border:2px dashed #fff08a;border-radius:50%;pointer-events:none}
.sn244-controls{display:grid;gap:9px;margin-top:11px}.sn244-control{display:grid;grid-template-columns:82px 1fr 48px;align-items:center;gap:8px;font-size:12px;font-weight:900}.sn244-control input{width:100%}.sn244-control output{text-align:right}.sn244-retry{display:none;width:100%;margin-top:9px;min-height:47px;border:0;border-radius:13px;background:#3d6fc2;color:#fff;font-weight:1000}.sn244-retry.show{display:block}
.sn244-done{text-align:center;padding:22px 8px}.sn244-done b{display:block;font-size:44px}.sn244-done h3{font-size:24px;margin:6px 0}
.sn244-radius{margin-top:10px;padding:10px;border:2px solid #bc995f;border-radius:13px;background:#fff4d5}.sn244-radius-row{display:grid;grid-template-columns:1fr auto;gap:8px}.sn244-radius input{min-width:0;border:2px solid #b9955e;border-radius:11px;padding:9px;font-size:15px}.sn244-radius button{border:0;border-radius:11px;padding:9px 12px;background:#5d8f45;color:#fff;font-weight:950}
@media(max-width:390px){.sn244-map{height:265px}.sn244-actions,.sn244-search{grid-template-columns:1fr}.sn244-control{grid-template-columns:72px 1fr 44px}}
`;
  document.head.appendChild(s);
}

function ensureModal(){
  installStyle();
  let modal=$('#'+MODAL_ID);if(modal)return modal;
  modal=document.createElement('div');modal.id=MODAL_ID;
  modal.innerHTML=`<div class="sn244-shell"><div class="sn244-head"><h2>Snazzle nauwkeurig plaatsen 🗺️📷</h2><button class="sn244-close" id="sn244Close" type="button" aria-label="Sluiten">×</button></div><div class="sn244-steps"><span id="sn244StepMap" class="on">1 · Plek</span><span id="sn244StepCamera">2 · Camera</span><span id="sn244StepDone">3 · Klaar</span></div>
<section id="sn244MapSection"><div class="sn244-card"><h3>1. Kies de vaste plek</h3><p>Gebruik GPS als je op locatie bent, of zoek een volledig adres als je vanuit huis plaatst. Met de pijltjes kun je de pin per stap ongeveer vijf meter bijstellen.</p><div class="sn244-map"><iframe id="sn244MapFrame" title="Kaartcontrole"></iframe><div class="sn244-pin">📍</div></div><div class="sn244-status" id="sn244Status">Kaart klaarzetten…</div><div class="sn244-search"><input id="sn244Address" type="search" placeholder="Bijv. Markt 1, Montfort" autocomplete="street-address"><button id="sn244Search" type="button">Zoek adres</button></div><div class="sn244-nudge"><span class="blank"></span><button type="button" data-sn244-nudge="n">↑ Noord</button><span class="blank"></span><button type="button" data-sn244-nudge="w">← West</button><button type="button" class="gps" id="sn244Gps">🎯 GPS</button><button type="button" data-sn244-nudge="e">Oost →</button><span class="blank"></span><button type="button" data-sn244-nudge="s">↓ Zuid</button><span class="blank"></span></div><div class="sn244-actions"><button class="sn244-secondary" id="sn244MapOnly" type="button">📍 Alleen kaart opslaan</button><button class="sn244-primary" id="sn244ToCamera" type="button">📷 Plek klopt — camera</button></div></div></section>
<section id="sn244CameraSection" hidden><div class="sn244-card"><h3>2. Zet de Snazzle in beeld</h3><p>Sleep hem naar de plek waar hij voor een zoeker in beeld moet staan. Stel daarna grootte en draaiing af.</p><div class="sn244-camera" id="sn244Camera"><video id="sn244Video" autoplay muted playsinline></video><div class="sn244-shade"></div><div class="sn244-help">Sleep de Snazzle naar de juiste plek</div><div class="sn244-object" id="sn244Object"><div class="sn244-ring"></div><div class="sn244-duck" id="sn244Duck">🦆</div><img id="sn244Image" alt="Snazzle" hidden></div></div><div class="sn244-controls"><label class="sn244-control">Grootte <input id="sn244Size" type="range" min="18" max="62" value="34"><output id="sn244SizeOut">34%</output></label><label class="sn244-control">Draaien <input id="sn244Rotate" type="range" min="-180" max="180" value="0"><output id="sn244RotateOut">0°</output></label></div><div class="sn244-status" id="sn244CameraStatus">Camera klaarzetten…</div><button class="sn244-retry" id="sn244RetryCamera" type="button">📷 Camera opnieuw openen</button><div class="sn244-actions"><button class="sn244-secondary" id="sn244Back" type="button">← Terug naar plek</button><button class="sn244-primary" id="sn244SaveCamera" type="button">🔒 Hier vastzetten</button></div></div></section>
<section id="sn244DoneSection" hidden><div class="sn244-card sn244-done"><b>✅</b><h3>Snazzle geplaatst</h3><p id="sn244DoneText"></p><div class="sn244-actions"><button class="sn244-secondary" id="sn244PlaceAnother" type="button">Nog één plaatsen</button><button class="sn244-primary" id="sn244DoneClose" type="button">Klaar</button></div></div></section></div>`;
  document.body.appendChild(modal);wireModal();return modal;
}

function showStep(step){
  $('#sn244MapSection').hidden=step!=='map';$('#sn244CameraSection').hidden=step!=='camera';$('#sn244DoneSection').hidden=step!=='done';
  $('#sn244StepMap').classList.toggle('on',step==='map');$('#sn244StepCamera').classList.toggle('on',step==='camera');$('#sn244StepDone').classList.toggle('on',step==='done');
}

function requestPos(highAccuracy,timeoutMs,maxAge){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund.'));
    navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:highAccuracy,timeout:timeoutMs,maximumAge:maxAge});
  });
}
function applyGpsPosition(pos,note=''){
  if(['address','manual'].includes(state.source))return;
  state.lat=Number(pos.coords.latitude);state.lon=Number(pos.coords.longitude);state.accuracy=Number(pos.coords.accuracy||0);state.source='gps';state.label='GPS';updateMap(note);
}
async function locate({force=false}={}){
  const token=++locateToken;
  if(force)state.source='fallback';
  setStatus('📍 GPS zoeken…');
  let gotOne=false;
  try{
    const quick=await requestPos(false,4500,60000);
    if(token!==locateToken)return;
    gotOne=true;applyGpsPosition(quick,'snelle locatie');
  }catch{}
  try{
    const precise=await requestPos(true,12000,0);
    if(token!==locateToken)return;
    gotOne=true;applyGpsPosition(precise,'nauwkeurig');
  }catch(err){
    if(token!==locateToken)return;
    if(!gotOne&&!['address','manual'].includes(state.source)){
      const msg=err?.code===1?'Locatietoestemming is geweigerd. Zoek een adres of geef locatietoegang.':'GPS reageert niet. Zoek een adres of probeer GPS opnieuw.';
      setStatus('⚠️ '+msg,'err');
    }
  }
}
function nudge(dir){
  locateToken++;
  const step=.00005;
  if(dir==='n')state.lat+=step;if(dir==='s')state.lat-=step;if(dir==='e')state.lon+=step;if(dir==='w')state.lon-=step;
  state.accuracy=0;state.source='manual';state.label='handmatig';updateMap('± 5 m bijgesteld');
}

async function fetchJson(url,ms=6500){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),ms);
  try{const r=await fetch(url,{signal:ctl.signal,headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json();}finally{clearTimeout(timer);}
}
async function geocode(query){
  try{
    const rows=await fetchJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=nl&accept-language=nl&q=${encodeURIComponent(query)}`,6000);
    const hit=rows?.[0];if(hit){const lat=Number(hit.lat),lon=Number(hit.lon);if(Number.isFinite(lat)&&Number.isFinite(lon))return{lat,lon,label:hit.display_name||query};}
  }catch{}
  try{
    const data=await fetchJson(`https://photon.komoot.io/api/?limit=1&lang=nl&q=${encodeURIComponent(query)}`,6000);
    const hit=data?.features?.[0],c=hit?.geometry?.coordinates;if(Array.isArray(c)){const lon=Number(c[0]),lat=Number(c[1]),p=hit.properties||{};if(Number.isFinite(lat)&&Number.isFinite(lon))return{lat,lon,label:[p.name,p.street,p.housenumber,p.city||p.locality].filter(Boolean).join(', ')||query};}
  }catch{}
  return null;
}
async function searchAddress(){
  const input=$('#sn244Address'),btn=$('#sn244Search'),q=(input?.value||'').trim();
  if(q.length<4){setStatus('⚠️ Vul straat + huisnummer + plaats in.','err');return;}
  btn.disabled=true;setStatus('🔎 Adres zoeken…');
  try{
    const hit=await geocode(q);if(!hit)throw new Error('Adres niet gevonden. Probeer straat + huisnummer + plaatsnaam.');
    locateToken++;state.lat=hit.lat;state.lon=hit.lon;state.accuracy=0;state.source='address';state.label=hit.label;updateMap('adres gevonden');toast('✅ Adres gevonden. Controleer de pin.');
  }catch(err){setStatus('⚠️ '+(err?.message||'Adres zoeken mislukt.'),'err');}
  finally{btn.disabled=false;}
}

function setPreview(){
  if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}
  const file=formData().file,img=$('#sn244Image'),duck=$('#sn244Duck');
  if(file){previewUrl=URL.createObjectURL(file);img.src=previewUrl;img.hidden=false;duck.hidden=true;}
  else{img.removeAttribute('src');img.hidden=true;duck.hidden=false;}
}
function applyPlacement(){
  const o=$('#sn244Object');if(!o)return;
  o.style.left=`${state.x*100}%`;o.style.top=`${state.y*100}%`;o.style.width=`${state.size*100}%`;
  const content=!$('#sn244Image')?.hidden?$('#sn244Image'):$('#sn244Duck');if(content)content.style.transform=`rotate(${state.rotation}deg)`;
  setText($('#sn244SizeOut'),`${Math.round(state.size*100)}%`);setText($('#sn244RotateOut'),`${Math.round(state.rotation)}°`);
}
function stopCamera(){
  if(cameraStream){try{cameraStream.getTracks().forEach(t=>t.stop());}catch{}cameraStream=null;}
  const video=$('#sn244Video');if(video){try{video.pause();}catch{}video.srcObject=null;}
  cameraStarting=false;
}
function timedCamera(constraints,ms=8000){
  let expired=false;
  const req=navigator.mediaDevices.getUserMedia(constraints).then(s=>{if(expired){try{s.getTracks().forEach(t=>t.stop());}catch{}throw new Error('camera-timeout');}return s;});
  const timer=new Promise((_,reject)=>setTimeout(()=>{expired=true;reject(new Error('camera-timeout'));},ms));
  return Promise.race([req,timer]);
}
async function startCamera(){
  if(cameraStarting)return;
  cameraStarting=true;stopCamera();cameraStarting=true;setPreview();applyPlacement();
  const retry=$('#sn244RetryCamera');retry?.classList.remove('show');setCameraStatus('📷 Camera openen…');
  try{
    if(!window.isSecureContext)throw new Error('Camera vereist een beveiligde HTTPS-verbinding.');
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera wordt niet ondersteund op dit toestel.');
    let s;
    try{s=await timedCamera({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false},8000);}catch(err){
      if(err?.name==='NotAllowedError'||err?.name==='SecurityError')throw err;
      s=await timedCamera({video:true,audio:false},6500);
    }
    cameraStream=s;
    const video=$('#sn244Video');if(!video)throw new Error('Camerabeeld ontbreekt.');video.srcObject=s;await video.play().catch(()=>{});
    setCameraStatus('✅ Camera actief. Sleep de Snazzle naar de juiste plek.','ok');
  }catch(err){
    stopCamera();
    let msg='Camera kon niet openen.';
    if(err?.name==='NotAllowedError'||err?.name==='SecurityError')msg='Cameratoegang is geweigerd. Geef Snazzle cameratoegang en probeer opnieuw.';
    else if(err?.name==='NotFoundError')msg='Geen camera gevonden op dit toestel.';
    else if(err?.message==='camera-timeout')msg='Camera reageert te langzaam. Sluit andere camera-apps en probeer opnieuw.';
    else if(err?.message)msg=err.message;
    setCameraStatus('⚠️ '+msg,'err');retry?.classList.add('show');
  }finally{cameraStarting=false;}
}
function dragStart(e){dragging=true;pointerId=e.pointerId;$('#sn244Object')?.setPointerCapture?.(e.pointerId);dragMove(e);}
function dragMove(e){if(!dragging||e.pointerId!==pointerId)return;const r=$('#sn244Camera')?.getBoundingClientRect();if(!r)return;state.x=clamp((e.clientX-r.left)/r.width,.06,.94);state.y=clamp((e.clientY-r.top)/r.height,.12,.9);applyPlacement();e.preventDefault();}
function dragEnd(e){if(e.pointerId!==pointerId)return;dragging=false;pointerId=null;}

async function uploadImage(file,id){
  if(!file)return'';
  if(file.size>8*1024*1024)throw new Error('Afbeelding is groter dan 8 MB.');
  const safe=(file.name||'snazzle.png').replace(/[^a-zA-Z0-9._-]+/g,'-');
  const ref=storageRef(storage,`listen-stories/images/${auth.currentUser.uid}/ar-${id}-${safe}`);
  await uploadBytes(ref,file,{contentType:file.type||'image/png'});return getDownloadURL(ref);
}
async function persistPoint(mode){
  const f=formData();
  if(f.name.length<2)throw new Error('Vul eerst een naam voor de Snazzle in.');
  if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon))throw new Error('Er is geen geldige locatie gekozen.');
  if(!auth.currentUser)throw new Error('Je bent niet meer ingelogd als beheerder.');
  const id=makeId(),imageUrl=await uploadImage(f.file,id),now=new Date().toISOString();
  const placement=mode==='camera-composed'
    ? {version:5,mode:'camera-composed',x:Number(state.x.toFixed(4)),y:Number(state.y.toFixed(4)),size:Number(state.size.toFixed(4)),rotation:Number(state.rotation.toFixed(1)),placedAt:now}
    : {version:5,mode:'map-only',x:.5,y:.5,size:.34,rotation:0,placedAt:now};
  const point={id,name:f.name,number:f.number||'—',rarity:f.rarity,village:f.village,radius:Math.max(4,Number(f.radius||7)),lat:Number(state.lat),lon:Number(state.lon),accuracy:Number(state.accuracy||0),imageUrl,active:true,placement,createdAt:now,updatedAt:now,createdBy:auth.currentUser.uid};
  await runTransaction(db,async tx=>{
    const snap=await tx.get(WORLD_DOC),data=snap.exists()?snap.data():{},existing=Array.isArray(data.points)?data.points:[];
    tx.set(WORLD_DOC,{_snazzleInternalType:'arWorld',title:'[SYSTEEM] AR-WERELD',village:'snazzle-internal',description:'Interne opslag voor permanente Snazzle AR-punten',rule:'',hint:'',foundMessage:'',imageUrl:'',start:'',end:'',mode:'draft',version:8,points:[...existing,point],updatedAt:now,updatedBy:auth.currentUser.uid},{merge:true});
  });
  return point;
}
async function save(mode){
  if(saving)return;
  saving=true;
  const btn=mode==='camera-composed'?$('#sn244SaveCamera'):$('#sn244MapOnly');if(btn)btn.disabled=true;
  const status=mode==='camera-composed'?setCameraStatus:setStatus;status('☁️ Snazzle veilig opslaan…');
  try{
    const point=await persistPoint(mode);stopCamera();showStep('done');
    $('#sn244DoneText').innerHTML=`<b>${esc(point.name)}</b> is opgeslagen.<br>${mode==='camera-composed'?'Camera-positie, grootte en draaiing zijn vastgelegd.':'De kaartlocatie is vastgelegd; tijdens het zoeken verschijnt hij standaard in het midden.'}`;
    window.SnazzleArAdminV85?.refresh?.();window.SnazzleArEngineV244?.reload?.(true).catch?.(()=>{});toast('✅ Snazzle geplaatst.');
  }catch(err){console.error('Snazzle placement v244',err);status('⚠️ '+(err?.message||'Opslaan is mislukt.'),'err');}
  finally{saving=false;if(btn)btn.disabled=false;}
}

function resetState(){
  const [lat,lon]=initialCenter();state={lat:Number(lat),lon:Number(lon),accuracy:0,source:'fallback',label:'',x:.5,y:.56,size:.34,rotation:0};
  if($('#sn244Size'))$('#sn244Size').value='34';if($('#sn244Rotate'))$('#sn244Rotate').value='0';applyPlacement();
}
function open(){
  const modal=ensureModal();resetState();showStep('map');previousBodyOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';modal.classList.add('show');updateMap('kaart geopend');
  const input=$('#sn244Address');if(input)input.value='';setTimeout(()=>locate().catch(()=>{}),30);
}
function close(){
  locateToken++;stopCamera();dragging=false;pointerId=null;
  if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}
  $('#'+MODAL_ID)?.classList.remove('show');document.body.style.overflow=previousBodyOverflow;previousBodyOverflow='';
}
function placeAnother(){resetState();showStep('map');updateMap('nieuwe plaatsing');setTimeout(()=>locate().catch(()=>{}),30);}

function wireModal(){
  $('#sn244Close').addEventListener('click',close);$('#sn244DoneClose').addEventListener('click',close);$('#sn244PlaceAnother').addEventListener('click',placeAnother);
  $('#sn244Gps').addEventListener('click',()=>locate({force:true}).catch(()=>{}));
  $('#sn244Search').addEventListener('click',searchAddress);$('#sn244Address').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchAddress();}});
  document.querySelectorAll('[data-sn244-nudge]').forEach(b=>b.addEventListener('click',()=>nudge(b.dataset.sn244Nudge)));
  $('#sn244MapOnly').addEventListener('click',()=>save('map-only'));
  $('#sn244ToCamera').addEventListener('click',()=>{showStep('camera');startCamera();});
  $('#sn244RetryCamera').addEventListener('click',startCamera);
  $('#sn244Back').addEventListener('click',()=>{stopCamera();showStep('map');});
  $('#sn244SaveCamera').addEventListener('click',()=>save('camera-composed'));
  const obj=$('#sn244Object');obj.addEventListener('pointerdown',dragStart);obj.addEventListener('pointermove',dragMove);obj.addEventListener('pointerup',dragEnd);obj.addEventListener('pointercancel',dragEnd);
  $('#sn244Size').addEventListener('input',e=>{state.size=Number(e.target.value)/100;applyPlacement();});$('#sn244Rotate').addEventListener('input',e=>{state.rotation=Number(e.target.value);applyPlacement();});
}

async function loadRadius(){
  try{const snap=await getDoc(WORLD_DOC),data=snap.exists()?snap.data():{};return Math.max(.1,Math.min(1000,Number(data.arMaxSearchRadiusKm??DEFAULT_MAX_RADIUS_KM)));}catch{return DEFAULT_MAX_RADIUS_KM;}
}
async function saveRadius(){
  const input=$('#sn244MaxRadius'),status=$('#sn244MaxRadiusStatus');let value=Number(input?.value);
  if(!Number.isFinite(value)||value<.1||value>1000){setText(status,'⚠️ Kies 0,1 t/m 1000 km.');return;}
  const btn=$('#sn244SaveRadius');btn.disabled=true;
  try{await setDoc(WORLD_DOC,{arMaxSearchRadiusKm:value,updatedAt:new Date().toISOString(),updatedBy:auth.currentUser?.uid||''},{merge:true});setText(status,`✅ Zoekstraal opgeslagen: ${value} km`);window.SnazzleArEngineV244?.reload?.(true).catch?.(()=>{});}catch{setText(status,'⚠️ Opslaan van de zoekstraal mislukte.');}finally{btn.disabled=false;}
}
function installRadiusControl(){
  const grid=$('#snArAdminV85 .sn-ar-admin-grid');if(!grid||$('#sn244RadiusWrap'))return;
  const wrap=document.createElement('div');wrap.id='sn244RadiusWrap';wrap.className='sn244-radius';wrap.innerHTML=`<b>Maximale AR-zoekafstand</b><div class="sn244-radius-row"><input id="sn244MaxRadius" type="number" min="0.1" max="1000" step="0.5" inputmode="decimal" value="25"><button id="sn244SaveRadius" type="button">Opslaan</button></div><small id="sn244MaxRadiusStatus">Bepaalt hoe ver AR naar de dichtstbijzijnde actieve Snazzle zoekt.</small>`;
  const status=$('#snArAdminStatus85');if(status)grid.insertBefore(wrap,status);else grid.appendChild(wrap);
  $('#sn244SaveRadius').addEventListener('click',saveRadius);loadRadius().then(v=>{const i=$('#sn244MaxRadius');if(i)i.value=String(v);});
}
function installButton(){
  const basic=$('#snArAdminPlace85');if(!basic)return false;
  installStyle();
  basic.textContent='📍 Snel plaatsen op huidige GPS';
  if(!$('#'+BUTTON_ID)){
    const btn=document.createElement('button');btn.id=BUTTON_ID;btn.type='button';btn.textContent='🗺️📷 Nauwkeurig via kaart + camera';basic.insertAdjacentElement('afterend',btn);btn.addEventListener('click',open);
  }
  installRadiusControl();installed=true;return true;
}
function boot(){
  if(installButton())return;
  const ob=new MutationObserver(()=>{if(installButton())ob.disconnect();});if(document.body)ob.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('snazzle:admin-ui-ready',()=>{if(!installed)installButton();else installRadiusControl();});
window.addEventListener('pagehide',()=>{stopCamera();locateToken++;},{once:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&$('#'+MODAL_ID)?.classList.contains('show')){stopCamera();if(!$('#sn244CameraSection')?.hidden)setCameraStatus('Camera gepauzeerd omdat de app naar de achtergrond ging. Tik op Camera opnieuw openen.','err'),$('#sn244RetryCamera')?.classList.add('show');}});

window.SnazzleArPlacementV244={open,close,locate,refresh:installButton};
console.info('Snazzle AR Placement v244 actief');
