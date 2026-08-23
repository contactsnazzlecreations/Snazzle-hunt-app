// Snazzle Speurtocht demo — interactieve OpenStreetMap/Leaflet kaart met Google Maps route-link.
// De vier punten hieronder zijn bewust DEMO-punten en kunnen later in Beheer vervangbaar worden gemaakt.

const ROUTE_VERSION = '1.0.0';
const $r = (s, root=document) => root.querySelector(s);
const $$r = (s, root=document) => [...root.querySelectorAll(s)];

const demoStops = [
  {id:1, lat:51.12686, lng:5.94545, title:'Startpunt', icon:'🦆', task:'Zoek op deze plek naar iets met de kleur groen. Tik daarna op “Opdracht klaar”.'},
  {id:2, lat:51.12778, lng:5.94705, title:'Geheime aanwijzing', icon:'🔎', task:'Kijk goed om je heen. Welke vorm zie je hier het vaakst? Onthoud je antwoord.'},
  {id:3, lat:51.12695, lng:5.94905, title:'Snazzle opdracht', icon:'⭐', task:'Doe samen 5 grote speurdersstappen en zoek daarna naar een opvallend detail in de omgeving.'},
  {id:4, lat:51.12565, lng:5.94720, title:'Finish', icon:'🏆', task:'Je bent bij de finish! Tik op “Opdracht klaar” om de demo-speurtocht te voltooien.'}
];

let leafletPromise = null;
let routeMap = null;
let routeMarkers = [];
let userMarker = null;
let completedStops = new Set();

function injectRouteStyles(){
  if($r('#snazzleRouteStyles')) return;
  const style=document.createElement('style');
  style.id='snazzleRouteStyles';
  style.textContent=`
    #routeSheet{z-index:78}
    #routeSheet .panel{background:linear-gradient(180deg,#fff0b0 0%,#efd18a 100%);overflow-x:hidden}
    .route-hero{position:relative;overflow:hidden;padding:15px;border-radius:21px;background:linear-gradient(135deg,#8ee05a,#3fbf72);border:3px solid #3d8e43;color:#173d25;box-shadow:0 5px 0 #397033;margin-bottom:13px}
    .route-hero:after{content:'🗺️';position:absolute;right:13px;top:9px;font-size:48px;opacity:.82;transform:rotate(8deg)}
    .route-hero strong{display:block;font-size:21px;margin-bottom:4px;max-width:78%}.route-hero p{margin:0;font-weight:760;line-height:1.4;max-width:80%}
    .route-demo-note{margin:0 0 12px;padding:10px 12px;border-radius:14px;background:#fff8dd;border:2px dashed #aa7d3f;color:#5e431f;font-size:12px;font-weight:850;line-height:1.35}
    .route-progress{display:flex;align-items:center;gap:10px;margin:10px 0 11px;padding:10px 12px;border-radius:15px;background:#f6f1d1;border:2px solid #9eb968;color:#30451d;font-weight:950}
    .route-progress-bar{height:11px;flex:1;border-radius:99px;background:#d3caa0;overflow:hidden;border:1px solid #a99b67}.route-progress-fill{height:100%;width:0;background:linear-gradient(90deg,#6fc63f,#2da366);transition:width .25s ease}
    #snazzleRouteMap{height:330px;border-radius:20px;border:4px solid #65401f;overflow:hidden;background:#cfe6be;box-shadow:0 6px 0 #4c3019,0 10px 22px rgba(0,0,0,.18);position:relative;z-index:1}
    .route-map-loading{height:100%;display:grid;place-items:center;text-align:center;padding:20px;color:#31552e;font-weight:950;background:linear-gradient(135deg,#dff4c6,#b5df9d)}
    .route-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:12px 0}.route-actions button,.route-google{border:0;border-radius:14px;padding:12px;font-weight:1000;min-height:48px}
    .route-location{background:linear-gradient(#65bde9,#348bc3);color:#fff;box-shadow:0 4px 0 #27688f}.route-fit{background:linear-gradient(#82ce4d,#4d9d32);color:#fff;box-shadow:0 4px 0 #377529}
    .route-google{display:block;width:100%;text-align:center;text-decoration:none;background:linear-gradient(#ffd853,#f3a52d);color:#3c280e;box-shadow:0 4px 0 #a86a1d;margin-bottom:13px}
    .route-stops{display:grid;gap:9px}.route-stop{display:grid;grid-template-columns:49px 1fr auto;gap:10px;align-items:center;padding:11px;border-radius:17px;background:#fff8df;border:2px solid #b69761;color:#332318;box-shadow:0 4px 0 #9a7745;transition:.15s ease}
    .route-stop.done{background:#e3f5bd;border-color:#79a945;box-shadow:0 4px 0 #5d8735}.route-stop.active{outline:4px solid #ffd84d;outline-offset:-4px}
    .route-stop-num{width:45px;height:45px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(#ffd84d,#f0a126);border:3px solid #8e5b20;font-size:20px;font-weight:1000;color:#4a2e11}.route-stop.done .route-stop-num{background:linear-gradient(#83d752,#4ca836);color:#fff;border-color:#39772d}
    .route-stop strong{display:block;font-size:14px}.route-stop small{display:block;color:#78583a;font-weight:750;line-height:1.28;margin-top:2px}.route-stop button{border:0;border-radius:11px;padding:8px 9px;background:#5c9e3d;color:#fff;font-weight:950;font-size:11px;white-space:nowrap}.route-stop.done button{background:#4e8440}
    .route-complete{display:none;margin-top:13px;padding:17px;text-align:center;border-radius:19px;background:linear-gradient(135deg,#fff18a,#ffbd3e);border:3px solid #b9771d;color:#46300d;box-shadow:0 5px 0 #9a611b}.route-complete.show{display:block;animation:routePop .3s ease-out}.route-complete .big{font-size:45px}.route-complete strong{display:block;font-size:23px}.route-complete span{font-weight:800;line-height:1.4;display:block}
    .snazzle-map-marker{background:none!important;border:0!important}.snazzle-map-pin{width:40px;height:40px;border-radius:50% 50% 50% 8px;transform:rotate(-45deg);display:grid;place-items:center;background:#ffd44e;border:3px solid #70431f;box-shadow:0 4px 8px rgba(0,0,0,.28)}.snazzle-map-pin span{transform:rotate(45deg);font-size:19px}.snazzle-map-pin.done{background:#71ca49}.snazzle-user-dot{width:22px;height:22px;border-radius:50%;background:#2b8be0;border:4px solid #fff;box-shadow:0 0 0 4px rgba(43,139,224,.27),0 3px 8px rgba(0,0,0,.3)}
    @keyframes routePop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
    @media(max-width:410px){#snazzleRouteMap{height:300px}.route-stop{grid-template-columns:44px 1fr}.route-stop>button{grid-column:1/-1;width:100%}.route-actions{grid-template-columns:1fr 1fr}.route-hero strong,.route-hero p{max-width:76%}}
  `;
  document.head.appendChild(style);
}

function ensureRouteSheet(){
  if($r('#routeSheet')) return;
  const sheet=document.createElement('div');
  sheet.className='sheet';
  sheet.id='routeSheet';
  sheet.innerHTML=`<div class="panel">
    <button class="close" id="routeClose" type="button" aria-label="Sluiten">×</button><div class="handle"></div>
    <h2>Snazzle Speurtocht 🗺️</h2>
    <div class="route-hero"><strong>De Snazzle Route</strong><p>Volg de lijn op de kaart, bezoek de 4 stops en voer bij elk punt een kleine opdracht uit.</p></div>
    <div class="route-demo-note">🛠️ <b>DEMO:</b> deze 4 punten zijn alleen voorbeeldpunten. Daarna kunnen we in Beheer echte locaties, opdrachten, foto's en routes invoeren.</div>
    <div class="route-progress"><span id="routeProgressText">0 van 4 klaar</span><div class="route-progress-bar"><div class="route-progress-fill" id="routeProgressFill"></div></div></div>
    <div id="snazzleRouteMap"><div class="route-map-loading">🗺️ Kaart wordt geladen…</div></div>
    <div class="route-actions"><button class="route-location" id="routeLocationBtn" type="button">📍 Mijn locatie</button><button class="route-fit" id="routeFitBtn" type="button">🗺️ Hele route</button></div>
    <a class="route-google" id="routeGoogleBtn" target="_blank" rel="noopener">➡️ Open wandelroute in Google Maps</a>
    <div class="route-stops" id="routeStops"></div>
    <div class="route-complete" id="routeComplete"><div class="big">🏆🦆✨</div><strong>SNAZZLE SPEURDER!</strong><span>Je hebt alle 4 demo-opdrachten voltooid.</span></div>
  </div>`;
  document.body.appendChild(sheet);
  $r('#routeClose').onclick=()=>sheet.classList.remove('show');
  sheet.addEventListener('click',e=>{if(e.target===sheet) sheet.classList.remove('show');});
  $r('#routeLocationBtn').onclick=showUserLocation;
  $r('#routeFitBtn').onclick=fitRoute;
  $r('#routeGoogleBtn').href=googleMapsRouteUrl();
  renderStopList();
}

function googleMapsRouteUrl(){
  const first=demoStops[0], last=demoStops[demoStops.length-1];
  const waypoints=demoStops.slice(1,-1).map(s=>`${s.lat},${s.lng}`).join('|');
  const q=new URLSearchParams({api:'1',origin:`${first.lat},${first.lng}`,destination:`${last.lat},${last.lng}`,waypoints,travelmode:'walking'});
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}

function injectMenuButton(){
  const nav=$r('.quick-menu-list');
  if(!nav || nav.querySelector('[data-snazzle-route]')) return false;
  const btn=document.createElement('button');
  btn.type='button'; btn.dataset.snazzleRoute='1';
  btn.innerHTML='<b>🗺️</b><span><strong>Speurtocht</strong><small>Volg een Snazzle-route op de kaart</small></span><i>›</i>';
  const before=nav.querySelector('[data-snazzle-fun="coloring"]') || nav.querySelector('[data-quick-action="event"]') || nav.querySelector('[data-quick-action="shop"]');
  if(before) nav.insertBefore(btn,before); else nav.appendChild(btn);
  btn.onclick=openRouteSheet;
  return true;
}

function closeQuickMenu(){
  const overlay=$r('#quickMenuOverlay');
  if(overlay){overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');}
  $r('#quickMenuBtn')?.setAttribute('aria-expanded','false');
  document.documentElement.style.overflow=''; document.body.style.overflow='';
}

async function openRouteSheet(){
  closeQuickMenu();
  ensureRouteSheet();
  const sheet=$r('#routeSheet'); sheet.classList.add('show');
  sheet.querySelector('.panel').scrollTop=0;
  try{ await ensureLeaflet(); initMap(); setTimeout(()=>routeMap?.invalidateSize(),120); }
  catch(err){ console.error('Snazzle kaart kon niet laden',err); const box=$r('#snazzleRouteMap'); if(box) box.innerHTML='<div class="route-map-loading">⚠️ De kaart kon niet worden geladen. Controleer je internetverbinding.</div>'; }
}

function ensureLeaflet(){
  if(window.L) return Promise.resolve(window.L);
  if(leafletPromise) return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    if(!$r('link[data-leaflet-snazzle]')){
      const link=document.createElement('link'); link.rel='stylesheet'; link.dataset.leafletSnazzle='1'; link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
    }
    const script=document.createElement('script'); script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async=true; script.onload=()=>resolve(window.L); script.onerror=reject; document.head.appendChild(script);
  });
  return leafletPromise;
}

function markerIcon(stop){
  const done=completedStops.has(stop.id)?' done':'';
  return L.divIcon({className:'snazzle-map-marker',html:`<div class="snazzle-map-pin${done}"><span>${completedStops.has(stop.id)?'✓':stop.id}</span></div>`,iconSize:[40,40],iconAnchor:[20,38],popupAnchor:[0,-36]});
}

function initMap(){
  if(routeMap){ refreshMarkers(); return; }
  const mapBox=$r('#snazzleRouteMap'); mapBox.innerHTML='';
  routeMap=L.map(mapBox,{zoomControl:true,scrollWheelZoom:false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap-bijdragers'}).addTo(routeMap);
  L.polyline(demoStops.map(s=>[s.lat,s.lng]),{color:'#e28b24',weight:6,opacity:.9,dashArray:'10,8'}).addTo(routeMap);
  refreshMarkers(); fitRoute();
}

function refreshMarkers(){
  if(!routeMap || !window.L) return;
  routeMarkers.forEach(m=>m.remove()); routeMarkers=[];
  demoStops.forEach(stop=>{
    const marker=L.marker([stop.lat,stop.lng],{icon:markerIcon(stop)}).addTo(routeMap);
    marker.bindPopup(`<b>${stop.id}. ${stop.title}</b><br>${stop.task}`);
    marker.on('click',()=>highlightStop(stop.id));
    routeMarkers.push(marker);
  });
}

function fitRoute(){
  if(!routeMap || !window.L) return;
  const bounds=L.latLngBounds(demoStops.map(s=>[s.lat,s.lng])); routeMap.fitBounds(bounds.pad(.18));
}

function showUserLocation(){
  if(!navigator.geolocation){ showRouteToast('Locatie wordt niet ondersteund op dit toestel'); return; }
  const btn=$r('#routeLocationBtn'); if(btn){btn.disabled=true;btn.textContent='📍 Even zoeken…';}
  navigator.geolocation.getCurrentPosition(pos=>{
    if(btn){btn.disabled=false;btn.textContent='📍 Mijn locatie';}
    if(!routeMap || !window.L) return;
    const lat=pos.coords.latitude,lng=pos.coords.longitude;
    if(userMarker) userMarker.remove();
    const icon=L.divIcon({className:'snazzle-map-marker',html:'<div class="snazzle-user-dot"></div>',iconSize:[22,22],iconAnchor:[11,11]});
    userMarker=L.marker([lat,lng],{icon}).addTo(routeMap).bindPopup('📍 Jij bent hier');
    routeMap.setView([lat,lng],16); userMarker.openPopup(); showRouteToast('Je locatie staat nu op de kaart 📍');
  },err=>{
    if(btn){btn.disabled=false;btn.textContent='📍 Mijn locatie';}
    const message=err.code===1?'Sta locatie-toegang toe om jezelf op de kaart te zien':'Je locatie kon niet worden bepaald'; showRouteToast(message);
  },{enableHighAccuracy:true,timeout:10000,maximumAge:15000});
}

function renderStopList(){
  const list=$r('#routeStops'); if(!list) return;
  list.innerHTML='';
  demoStops.forEach(stop=>{
    const done=completedStops.has(stop.id);
    const card=document.createElement('div'); card.className='route-stop'+(done?' done':''); card.dataset.stopId=stop.id;
    card.innerHTML=`<div class="route-stop-num">${done?'✓':stop.id}</div><div><strong>${stop.icon} ${stop.title}</strong><small>${stop.task}</small></div><button type="button">${done?'Klaar ✓':'Opdracht klaar'}</button>`;
    card.querySelector('button').onclick=e=>{e.stopPropagation();toggleStop(stop.id);};
    card.onclick=()=>{highlightStop(stop.id); if(routeMap) routeMap.setView([stop.lat,stop.lng],17); routeMarkers[stop.id-1]?.openPopup();};
    list.appendChild(card);
  });
  updateProgress();
}

function highlightStop(id){
  $$r('.route-stop').forEach(c=>c.classList.toggle('active',Number(c.dataset.stopId)===Number(id)));
  const card=$r(`.route-stop[data-stop-id="${id}"]`); card?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function toggleStop(id){
  if(completedStops.has(id)) completedStops.delete(id); else completedStops.add(id);
  renderStopList(); refreshMarkers();
  if(completedStops.size===demoStops.length){$r('#routeComplete')?.classList.add('show');showRouteToast('Speurtocht voltooid! 🏆');}
  else $r('#routeComplete')?.classList.remove('show');
}

function updateProgress(){
  const count=completedStops.size,total=demoStops.length;
  const text=$r('#routeProgressText'),fill=$r('#routeProgressFill');
  if(text) text.textContent=`${count} van ${total} klaar`; if(fill) fill.style.width=`${(count/total)*100}%`;
}

function showRouteToast(message){
  const t=$r('#toast');
  if(!t){alert(message);return;}
  t.textContent=message;t.classList.add('show');clearTimeout(window.__routeToast);window.__routeToast=setTimeout(()=>t.classList.remove('show'),2700);
}

function initRoute(){
  if(window.__snazzleRouteLoaded) return; window.__snazzleRouteLoaded=true;
  injectRouteStyles(); ensureRouteSheet(); injectMenuButton();
  const observer=new MutationObserver(()=>injectMenuButton()); observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')$r('#routeSheet')?.classList.remove('show');});
  console.info(`Snazzle Route ${ROUTE_VERSION} geladen`);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initRoute,{once:true}); else initRoute();
