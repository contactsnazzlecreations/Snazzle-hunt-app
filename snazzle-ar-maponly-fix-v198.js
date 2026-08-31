// Snazzle AR kaart-only herstel v198
// Robuuste adreszoeker + betrouwbare knopafhandeling voor Android/PWA.

const MODAL198='snArDirect195';
const WORLD198='snazzle_ar_world_v1';
let selected198=null;
let searchBusy198=false;
let saveBusy198=false;
let lastAction198={type:'',at:0};
const $198=(s,r=document)=>r.querySelector(s);
const sleep198=ms=>new Promise(r=>setTimeout(r,ms));

function toast198(message){
  const t=$198('#toast');
  if(t){
    t.textContent=message;
    t.classList.add('show');
    clearTimeout(window.__sn198Toast);
    window.__sn198Toast=setTimeout(()=>t.classList.remove('show'),3400);
  }
}

function status198(message,ok=false){
  const s=$198('#sn197SearchStatus');
  if(!s)return;
  s.textContent=message;
  s.style.color=ok?'#315522':'#604925';
}

function form198(){
  return {
    name:($198('#snArAdminName85')?.value||'Scout Snazzle').trim(),
    number:($198('#snArAdminNumber85')?.value||'001').trim(),
    rarity:$198('#snArAdminRarity85')?.value||'RARE',
    village:$198('#snArAdminVillage85')?.value||'Montfort',
    radius:Number($198('#snArAdminRadius85')?.value||7),
    file:$198('#snArAdminImage85')?.files?.[0]||null
  };
}

function mapUrl198(lat,lon){
  const dLat=.0022,dLon=.0036;
  const l=(lon-dLon).toFixed(6),r=(lon+dLon).toFixed(6),b=(lat-dLat).toFixed(6),t=(lat+dLat).toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(`${l},${b},${r},${t}`)}&layer=mapnik&marker=${encodeURIComponent(`${lat.toFixed(6)},${lon.toFixed(6)}`)}`;
}

function setPoint198(point){
  selected198={lat:Number(point.lat),lon:Number(point.lon),label:point.label||'Gekozen locatie'};
  if(!Number.isFinite(selected198.lat)||!Number.isFinite(selected198.lon))return false;
  const frame=$198('#sn195MapFrame');
  if(frame)frame.src=mapUrl198(selected198.lat,selected198.lon);
  const loc=$198('#sn195LocationStatus');
  if(loc){
    loc.className='sn195-status ok';
    loc.textContent=`📍 ${selected198.lat.toFixed(6)}, ${selected198.lon.toFixed(6)} · gekozen adres`;
    loc.dataset.sn198Lat=String(selected198.lat);
    loc.dataset.sn198Lon=String(selected198.lon);
  }
  try{sessionStorage.setItem('snazzleRemotePoint198',JSON.stringify(selected198));}catch{}
  status198(`✅ ${selected198.label}`,true);
  return true;
}

async function fetchJson198(url,timeout=6500){
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{signal:ctl.signal,headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }finally{clearTimeout(timer);}
}

async function geocodeNominatim198(q){
  const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=nl&accept-language=nl&q=${encodeURIComponent(q)}`;
  const rows=await fetchJson198(url,6000);
  const hit=rows?.[0];
  if(!hit)return null;
  const lat=Number(hit.lat),lon=Number(hit.lon);
  return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon,label:hit.display_name||q}:null;
}

async function geocodePhoton198(q){
  const rows=await fetchJson198(`https://photon.komoot.io/api/?limit=1&lang=nl&q=${encodeURIComponent(q)}`,6000);
  const hit=rows?.features?.[0],coords=hit?.geometry?.coordinates;
  if(!Array.isArray(coords)||coords.length<2)return null;
  const lon=Number(coords[0]),lat=Number(coords[1]);
  const p=hit?.properties||{};
  const label=[p.name,p.street,p.housenumber,p.city||p.locality,p.state].filter(Boolean).join(', ')||q;
  return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon,label}:null;
}

async function geocodeArcgis198(q){
  const url=`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=1&countryCode=NLD&outFields=Match_addr&SingleLine=${encodeURIComponent(q)}`;
  const data=await fetchJson198(url,6500);
  const hit=data?.candidates?.[0],loc=hit?.location;
  const lat=Number(loc?.y),lon=Number(loc?.x);
  return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon,label:hit.address||q}:null;
}

async function search198(){
  if(searchBusy198)return;
  const input=$198('#sn197Address');
  const btn=$198('#sn197Search');
  const q=(input?.value||'').trim();
  if(q.length<4){status198('⚠️ Vul straat + huisnummer + plaats in, bijvoorbeeld Markt 1 Montfort.');return;}
  searchBusy198=true;
  if(btn){btn.disabled=true;btn.textContent='Zoeken…';}
  status198('🔎 Adres zoeken…');
  selected198=null;
  try{
    let point=null;
    for(const geocoder of [geocodeNominatim198,geocodePhoton198,geocodeArcgis198]){
      try{point=await geocoder(q);}catch(err){console.debug('geocoder v198',err);}
      if(point)break;
    }
    if(!point)throw new Error('Adres niet gevonden. Probeer straat + huisnummer + plaatsnaam.');
    setPoint198(point);
    toast198('✅ Adres gevonden. Je kunt nu via kaart plaatsen.');
  }catch(err){
    console.error('Adres zoeken v198',err);
    status198('⚠️ '+(err?.message||'Adres zoeken mislukt.'));
  }finally{
    searchBusy198=false;
    if(btn){btn.disabled=false;btn.textContent='Zoek adres';}
  }
}

function point198(){
  if(selected198&&Number.isFinite(selected198.lat)&&Number.isFinite(selected198.lon))return selected198;
  const loc=$198('#sn195LocationStatus');
  const dLat=Number(loc?.dataset?.sn198Lat||loc?.dataset?.sn197Lat),dLon=Number(loc?.dataset?.sn198Lon||loc?.dataset?.sn197Lon);
  if(Number.isFinite(dLat)&&Number.isFinite(dLon))return {lat:dLat,lon:dLon,label:'gekozen adres'};
  const m=(loc?.textContent||'').match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if(m){const lat=Number(m[1]),lon=Number(m[2]);if(Number.isFinite(lat)&&Number.isFinite(lon))return {lat,lon,label:'huidige kaartlocatie'};}
  return null;
}

async function save198(){
  if(saveBusy198)return;
  const btn=$198('#sn197MapOnly');
  const f=form198(),p=point198();
  if(f.name.length<2){toast198('⚠️ Vul eerst een naam voor de Snazzle in.');return;}
  if(!p){status198('⚠️ Zoek eerst een adres of gebruik GPS zodat er een locatie bekend is.');return;}
  saveBusy198=true;
  if(btn){btn.disabled=true;btn.textContent='📍 Plaatsen…';}
  status198('☁️ Snazzle op kaart opslaan…');
  try{
    const [{getAuth},{getFirestore,doc,getDoc,setDoc},{getStorage,ref,uploadBytes,getDownloadURL}]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js')
    ]);
    const auth=getAuth();
    if(!auth.currentUser)throw new Error('Je bent niet meer ingelogd als beheerder.');
    const db=getFirestore(),storage=getStorage(),worldDoc=doc(db,'hunts',WORLD198);
    const id=`ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
    let imageUrl='';
    if(f.file){
      if(f.file.size>8*1024*1024)throw new Error('Afbeelding is groter dan 8 MB.');
      const safe=(f.file.name||'snazzle.png').replace(/[^a-zA-Z0-9._-]+/g,'-');
      const target=ref(storage,`listen-stories/images/${auth.currentUser.uid}/ar-${id}-${safe}`);
      await uploadBytes(target,f.file,{contentType:f.file.type||'image/png'});
      imageUrl=await getDownloadURL(target);
    }
    const snap=await getDoc(worldDoc),data=snap.exists()?snap.data():{},existing=Array.isArray(data.points)?data.points:[],now=new Date().toISOString();
    const point={
      id,name:f.name,number:f.number||'—',rarity:f.rarity,village:f.village,radius:f.radius,
      lat:Number(p.lat),lon:Number(p.lon),accuracy:0,imageUrl,active:true,
      placement:{version:4,mode:'map-only-v198',x:.5,y:.56,size:.34,rotation:0,placedAt:now},
      createdAt:now,updatedAt:now,createdBy:auth.currentUser.uid
    };
    await setDoc(worldDoc,{_snazzleInternalType:'arWorld',title:'[SYSTEEM] AR-WERELD',village:'snazzle-internal',description:'Interne opslag voor permanente Snazzle AR-punten',rule:'',hint:'',foundMessage:'',imageUrl:'',start:'',end:'',mode:'draft',version:7,points:[...existing,point],updatedAt:now,updatedBy:auth.currentUser.uid},{merge:true});
    status198(`✅ ${f.name} is geplaatst op ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}.`,true);
    toast198('✅ Snazzle via kaart geplaatst.');
    window.SnazzleArAdminV85?.refresh?.();
  }catch(err){
    console.error('Kaart-only opslaan v198',err);
    status198('⚠️ '+(err?.message||'Opslaan mislukt.'));
  }finally{
    saveBusy198=false;
    if(btn){btn.disabled=false;btn.textContent='📍 Alleen via kaart plaatsen';}
  }
}

function runOnce198(type,fn){
  const now=Date.now();
  if(lastAction198.type===type&&now-lastAction198.at<500)return;
  lastAction198={type,at:now};
  fn();
}

function intercept198(event){
  const search=event.target?.closest?.('#sn197Search');
  const save=event.target?.closest?.('#sn197MapOnly');
  if(!search&&!save)return;
  event.preventDefault?.();event.stopPropagation?.();event.stopImmediatePropagation?.();
  if(search)runOnce198('search',search198);
  else runOnce198('save',save198);
}

document.addEventListener('pointerdown',intercept198,true);
document.addEventListener('click',intercept198,true);
document.addEventListener('keydown',event=>{
  if(event.key==='Enter'&&event.target?.matches?.('#sn197Address')){
    event.preventDefault();runOnce198('search',search198);
  }
},true);

const obs198=new MutationObserver(()=>{
  const modal=$198('#'+MODAL198);
  if(!modal?.classList.contains('show'))return;
  const search=$198('#sn197Search'),save=$198('#sn197MapOnly');
  if(search){search.type='button';search.disabled=false;search.style.pointerEvents='auto';search.style.touchAction='manipulation';}
  if(save){save.type='button';save.disabled=false;save.style.pointerEvents='auto';save.style.touchAction='manipulation';}
});
if(document.body)obs198.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled']});

window.SnazzleArMapOnlyFixV198={search:search198,save:save198};
console.info('Snazzle AR kaart-only herstel v198 geladen');