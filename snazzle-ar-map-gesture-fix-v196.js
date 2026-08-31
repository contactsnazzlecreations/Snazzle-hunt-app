// Snazzle AR camera + kaart-zonder-camera v197
// Herstelt Android/PWA camera-openen en maakt plaatsen vanaf huis mogelijk via een gezocht adres.

const MODAL197='snArDirect195';
const WORLD197='snazzle_ar_world_v1';
let stream197=null;
let previewUrl197='';
let remotePoint197=null;
let installing197=false;
let savedViewport197=null;

const $197=(s,r=document)=>r.querySelector(s);
const esc197=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep197=ms=>new Promise(r=>setTimeout(r,ms));

function toast197(message){
  const t=$197('#toast');
  if(t){t.textContent=message;t.classList.add('show');clearTimeout(window.__sn197Toast);window.__sn197Toast=setTimeout(()=>t.classList.remove('show'),3400);}
  else console.warn(message);
}

function installStyle197(){
  if($197('#sn197Style'))return;
  const s=document.createElement('style');
  s.id='sn197Style';
  s.textContent=`
    #${MODAL197} .sn197-remote{margin-top:12px;padding:12px;border:2px solid #b58b4c;border-radius:15px;background:#fff3cd}
    #${MODAL197} .sn197-remote b{display:block;margin-bottom:5px;font-size:13px}
    #${MODAL197} .sn197-remote p{margin:4px 0 9px;font-size:12px;line-height:1.35}
    #${MODAL197} .sn197-searchrow{display:grid;grid-template-columns:1fr auto;gap:8px}
    #${MODAL197} .sn197-searchrow input{min-width:0;border:2px solid #b9955e;border-radius:12px;padding:11px;background:#fffdf6;color:#2d2116;font-size:16px}
    #${MODAL197} .sn197-searchrow button{border:0;border-radius:12px;padding:10px 13px;background:#3d6fc2;color:#fff;font-weight:950}
    #${MODAL197} .sn197-searchstatus{font-size:11px;font-weight:850;margin:8px 0;color:#604925}
    #${MODAL197} .sn197-maponly{width:100%;min-height:51px;border:0;border-radius:14px;padding:12px;background:linear-gradient(#7ec742,#468f2e);color:#fff;font-weight:1000;box-shadow:0 4px 0 #2c6722}
    #${MODAL197} .sn197-retry{display:none;width:100%;margin-top:9px;min-height:48px;border:0;border-radius:13px;padding:10px;background:#3d6fc2;color:#fff;font-weight:1000}
    #${MODAL197} .sn197-retry.show{display:block}
    #${MODAL197} .sn195-map{overscroll-behavior:contain!important;touch-action:auto!important}
    #${MODAL197} .sn195-map iframe{pointer-events:auto!important;touch-action:auto!important}
    #${MODAL197} .sn195-pin{pointer-events:none!important;user-select:none!important}
    @media(max-width:390px){#${MODAL197} .sn197-searchrow{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function viewport197(){return document.querySelector('meta[name="viewport"]');}
function lockPageZoom197(){
  const meta=viewport197();
  if(!meta||savedViewport197!==null)return;
  savedViewport197=meta.getAttribute('content')||'';
  meta.setAttribute('content','width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
  document.documentElement.style.overscrollBehavior='none';
}
function unlockPageZoom197(){
  const meta=viewport197();
  if(meta&&savedViewport197!==null)meta.setAttribute('content',savedViewport197);
  savedViewport197=null;
  document.documentElement.style.overscrollBehavior='';
}
function applyMapGesture197(){
  const modal=$197('#'+MODAL197),frame=$197('#sn195MapFrame');
  if(frame){frame.style.setProperty('pointer-events','auto','important');frame.style.setProperty('touch-action','auto','important');frame.setAttribute('scrolling','no');}
  if(modal?.classList.contains('show'))lockPageZoom197();else unlockPageZoom197();
}

function parseCurrentPoint197(){
  if(remotePoint197&&Number.isFinite(remotePoint197.lat)&&Number.isFinite(remotePoint197.lon))return {...remotePoint197};
  const status=$197('#sn195LocationStatus');
  const text=status?.textContent||'';
  const m=text.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if(m){const lat=Number(m[1]),lon=Number(m[2]);if(Number.isFinite(lat)&&Number.isFinite(lon))return {lat,lon,label:'huidige kaartlocatie'};}
  const src=$197('#sn195MapFrame')?.src||'';
  try{const u=new URL(src);const marker=decodeURIComponent(u.searchParams.get('marker')||'');const [lat,lon]=marker.split(',').map(Number);if(Number.isFinite(lat)&&Number.isFinite(lon))return {lat,lon,label:'kaartlocatie'};}catch{}
  return null;
}

function mapUrl197(lat,lon){
  const dLat=.0022,dLon=.0036;
  const l=(lon-dLon).toFixed(6),r=(lon+dLon).toFixed(6),b=(lat-dLat).toFixed(6),t=(lat+dLat).toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(`${l},${b},${r},${t}`)}&layer=mapnik&marker=${encodeURIComponent(`${lat.toFixed(6)},${lon.toFixed(6)}`)}`;
}

function setRemotePoint197(point){
  remotePoint197=point;
  const frame=$197('#sn195MapFrame');if(frame)frame.src=mapUrl197(point.lat,point.lon);
  const st=$197('#sn195LocationStatus');
  if(st){st.className='sn195-status ok';st.textContent=`📍 ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)} · gekozen adres`;st.dataset.sn197Lat=String(point.lat);st.dataset.sn197Lon=String(point.lon);}
  const ss=$197('#sn197SearchStatus');if(ss)ss.textContent=`✅ ${point.label||'Adres gevonden'}`;
}

async function searchAddress197(){
  const input=$197('#sn197Address'),status=$197('#sn197SearchStatus');
  const q=(input?.value||'').trim();
  if(q.length<4){if(status)status.textContent='Vul straat + plaats in, bijvoorbeeld Markt 1 Montfort.';return;}
  if(status)status.textContent='🔎 Adres zoeken…';
  try{
    const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=nl&q=${encodeURIComponent(q)}`;
    const res=await fetch(url,{headers:{Accept:'application/json'}});if(!res.ok)throw new Error('Adreszoeker reageert niet.');
    const rows=await res.json(),hit=rows?.[0];if(!hit)throw new Error('Geen adres gevonden. Voeg plaatsnaam of huisnummer toe.');
    const lat=Number(hit.lat),lon=Number(hit.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))throw new Error('Adres gaf geen geldige locatie.');
    setRemotePoint197({lat,lon,label:hit.display_name||q});
  }catch(err){if(status)status.textContent='⚠️ '+(err?.message||'Adres zoeken mislukt.');}
}

function formData197(){return{name:($197('#snArAdminName85')?.value||'Scout Snazzle').trim(),number:($197('#snArAdminNumber85')?.value||'001').trim(),rarity:$197('#snArAdminRarity85')?.value||'RARE',village:$197('#snArAdminVillage85')?.value||'Montfort',radius:Number($197('#snArAdminRadius85')?.value||7),file:$197('#snArAdminImage85')?.files?.[0]||null};}

async function saveMapOnly197(){
  const btn=$197('#sn197MapOnly'),searchStatus=$197('#sn197SearchStatus'),f=formData197(),p=parseCurrentPoint197();
  if(f.name.length<2){toast197('⚠️ Vul eerst een naam voor de Snazzle in.');return;}
  if(!p){toast197('⚠️ Kies eerst een GPS-locatie of zoek een adres.');return;}
  if(btn)btn.disabled=true;if(searchStatus)searchStatus.textContent='☁️ Snazzle op kaart opslaan…';
  try{
    const [{getAuth},{getFirestore,doc,getDoc,setDoc},{getStorage,ref,uploadBytes,getDownloadURL}]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js'),import('https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js')]);
    const auth=getAuth();if(!auth.currentUser)throw new Error('Je bent niet meer ingelogd als beheerder.');
    const db=getFirestore(),storage=getStorage(),worldDoc=doc(db,'hunts',WORLD197),id=`ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
    let imageUrl='';
    if(f.file){if(f.file.size>8*1024*1024)throw new Error('Afbeelding is groter dan 8 MB.');const safe=(f.file.name||'snazzle.png').replace(/[^a-zA-Z0-9._-]+/g,'-');const target=ref(storage,`listen-stories/images/${auth.currentUser.uid}/ar-${id}-${safe}`);await uploadBytes(target,f.file,{contentType:f.file.type||'image/png'});imageUrl=await getDownloadURL(target);}
    const snap=await getDoc(worldDoc),data=snap.exists()?snap.data():{},existing=Array.isArray(data.points)?data.points:[],now=new Date().toISOString();
    const point={id,name:f.name,number:f.number||'—',rarity:f.rarity,village:f.village,radius:f.radius,lat:p.lat,lon:p.lon,accuracy:0,imageUrl,active:true,placement:{version:3,mode:'map-only',x:.5,y:.56,size:.34,rotation:0,placedAt:now},createdAt:now,updatedAt:now,createdBy:auth.currentUser.uid};
    await setDoc(worldDoc,{_snazzleInternalType:'arWorld',title:'[SYSTEEM] AR-WERELD',village:'snazzle-internal',description:'Interne opslag voor permanente Snazzle AR-punten',rule:'',hint:'',foundMessage:'',imageUrl:'',start:'',end:'',mode:'draft',version:6,points:[...existing,point],updatedAt:now,updatedBy:auth.currentUser.uid},{merge:true});
    if(searchStatus)searchStatus.textContent=`✅ ${f.name} staat nu op deze kaartlocatie.`;toast197('✅ Snazzle via kaart geplaatst — camera niet nodig.');window.SnazzleArAdminV85?.refresh?.();
  }catch(err){console.error('Snazzle kaart-only v197',err);if(searchStatus)searchStatus.textContent='⚠️ '+(err?.message||'Opslaan mislukt.');}
  finally{if(btn)btn.disabled=false;}
}

function stopCamera197(){
  if(stream197){try{stream197.getTracks().forEach(t=>t.stop());}catch{}stream197=null;}
  const video=$197('#sn195Video'),old=video?.srcObject;if(old){try{old.getTracks?.().forEach(t=>t.stop());}catch{}}if(video)video.srcObject=null;
}
function setPreview197(){
  if(previewUrl197){try{URL.revokeObjectURL(previewUrl197);}catch{}previewUrl197='';}
  const file=formData197().file,img=$197('#sn195Image'),duck=$197('#sn195Duck');if(!img||!duck)return;
  if(file){previewUrl197=URL.createObjectURL(file);img.src=previewUrl197;img.hidden=false;duck.hidden=true;}else{img.removeAttribute('src');img.hidden=true;duck.hidden=false;}
}
function showCameraStep197(){
  const map=$197('#sn195MapSection'),cam=$197('#sn195CamSection'),done=$197('#sn195DoneSection');if(map)map.hidden=true;if(cam)cam.hidden=false;if(done)done.hidden=true;
  $197('#sn195StepMap')?.classList.remove('on');$197('#sn195StepCam')?.classList.add('on');$197('#sn195StepSave')?.classList.remove('on');
}
function timedCamera197(constraints,ms=9000){
  let timedOut=false;
  const request=navigator.mediaDevices.getUserMedia(constraints).then(s=>{if(timedOut){try{s.getTracks().forEach(t=>t.stop());}catch{}throw new Error('camera-timeout');}return s;});
  const timeout=new Promise((_,reject)=>setTimeout(()=>{timedOut=true;reject(new Error('camera-timeout'));},ms));return Promise.race([request,timeout]);
}
async function chooseRearCamera197(current){
  try{const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput'),rear=devices.find(d=>/back|rear|environment|achter/i.test(d.label||''));if(!rear)return current;const settings=current.getVideoTracks?.()[0]?.getSettings?.()||{};if(settings.deviceId===rear.deviceId)return current;const next=await timedCamera197({video:{deviceId:{exact:rear.deviceId}},audio:false},7000);try{current.getTracks().forEach(t=>t.stop());}catch{}return next;}catch{return current;}
}
async function startCamera197(){
  const status=$197('#sn195CameraStatus'),retry=$197('#sn197RetryCamera'),video=$197('#sn195Video');if(retry)retry.classList.remove('show');stopCamera197();setPreview197();if(status){status.className='sn195-status';status.textContent='📷 Camera openen…';}
  try{
    if(!window.isSecureContext)throw new Error('Camera vereist een beveiligde HTTPS-verbinding.');if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera wordt op dit toestel niet ondersteund.');
    let s=await timedCamera197({video:true,audio:false},9000);s=await chooseRearCamera197(s);stream197=s;if(!video)throw new Error('Camerabeeld ontbreekt.');video.srcObject=s;await Promise.race([video.play().catch(()=>{}),sleep197(2500)]);
    if(status){status.className='sn195-status ok';status.textContent='✅ Camera actief. Sleep de Snazzle naar de juiste plek.';}
  }catch(err){
    console.error('Camera v197',err);stopCamera197();let msg='Camera kon niet openen.';
    if(err?.name==='NotAllowedError'||/permission|toegang|denied/i.test(err?.message||''))msg='Cameratoegang is geweigerd. Geef de Snazzle-app cameratoegang en probeer opnieuw.';else if(err?.name==='NotFoundError')msg='Geen camera gevonden op dit toestel.';else if(/timeout/.test(err?.message||''))msg='Camera reageerde niet binnen 9 seconden. Tik op “Camera opnieuw openen”.';else if(err?.message)msg=err.message;
    if(status){status.className='sn195-status err';status.textContent='⚠️ '+msg;}if(retry)retry.classList.add('show');
  }
}

function addUi197(){
  if(installing197)return;installing197=true;
  try{
    installStyle197();
    const card=$197(`#${MODAL197} #sn195MapSection .sn195-card`);
    if(card&&!$197('#sn197RemoteBox')){
      const box=document.createElement('div');box.id='sn197RemoteBox';box.className='sn197-remote';
      box.innerHTML=`<b>🏠 Vanuit huis plaatsen zonder camera</b><p>Zoek een straat of adres. Daarna kun je de Snazzle direct op die locatie opslaan, zonder dat je daar zelf hoeft te staan.</p><div class="sn197-searchrow"><input id="sn197Address" type="search" placeholder="Bijv. Markt 1, Montfort"><button type="button" id="sn197Search">Zoek adres</button></div><div class="sn197-searchstatus" id="sn197SearchStatus">Gebruik een volledig adres voor de nauwkeurigste plek.</div><button type="button" class="sn197-maponly" id="sn197MapOnly">📍 Alleen via kaart plaatsen</button>`;
      const actions=card.querySelector('.sn195-actions');if(actions)card.insertBefore(box,actions);else card.appendChild(box);
      $197('#sn197Search')?.addEventListener('click',searchAddress197);$197('#sn197Address')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchAddress197();}});$197('#sn197MapOnly')?.addEventListener('click',saveMapOnly197);
    }
    const camCard=$197(`#${MODAL197} #sn195CamSection .sn195-card`);
    if(camCard&&!$197('#sn197RetryCamera')){const retry=document.createElement('button');retry.type='button';retry.id='sn197RetryCamera';retry.className='sn197-retry';retry.textContent='📷 Camera opnieuw openen';const status=$197('#sn195CameraStatus');if(status)status.insertAdjacentElement('afterend',retry);else camCard.appendChild(retry);retry.addEventListener('click',startCamera197);}
  }finally{installing197=false;}
}

function cameraButton197(target){return target?.closest?.('#sn195ToCamera');}
document.addEventListener('pointerdown',event=>{if(!cameraButton197(event.target))return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();showCameraStep197();startCamera197();},true);
document.addEventListener('click',event=>{if(cameraButton197(event.target)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();return;}if(event.target?.closest?.('#sn195BackMap,#sn195Close,#sn195DoneClose'))stopCamera197();},true);
document.addEventListener('pointerdown',event=>{if(event.target?.closest?.(`#${MODAL197} .sn195-map`)){lockPageZoom197();const frame=$197('#sn195MapFrame');if(frame)frame.style.setProperty('pointer-events','auto','important');}},true);

const obs197=new MutationObserver(()=>{addUi197();applyMapGesture197();});
function boot197(){addUi197();applyMapGesture197();if(document.body)obs197.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});[50,150,400,900,1800,3500,7000].forEach(ms=>setTimeout(()=>{addUi197();applyMapGesture197();},ms));}
if(document.body)boot197();else document.addEventListener('DOMContentLoaded',boot197,{once:true});
window.addEventListener('pagehide',()=>{stopCamera197();unlockPageZoom197();});

window.SnazzleArCameraMapOnlyV197={camera:startCamera197,search:searchAddress197,saveMapOnly:saveMapOnly197};
console.info('Snazzle AR camera + kaart-zonder-camera v197 geladen');