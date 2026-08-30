// Snazzle Zone Map v169 — zelfstandige, stabiele kaartlaag voor mobiel.
// Tekent kaarttegels op canvas zodat algemene afbeeldings-effecten in de app Leaflet niet meer kunnen verstoren.

const $=s=>document.querySelector(s);
let map=null,zoneLayer=null,baseLayer=null,leafletPromise=null,opening=false;

const rarityRank={COMMON:1,UNCOMMON:2,RARE:3,EPIC:4,GOLD:5,PLATINUM:6,BLACK:7,LEGENDARY:8,SECRET:9};
const rarityInfo={
  COMMON:{label:'COMMON',emoji:'🟢',color:'#4f9b4f',radius:90},
  UNCOMMON:{label:'UNCOMMON',emoji:'🔵',color:'#3b82c4',radius:100},
  RARE:{label:'RARE',emoji:'💜',color:'#7b55c7',radius:120},
  EPIC:{label:'EPIC',emoji:'✨',color:'#b242c1',radius:135},
  GOLD:{label:'GOLD',emoji:'⭐',color:'#d6a51d',radius:145},
  PLATINUM:{label:'PLATINUM',emoji:'💎',color:'#6d93a7',radius:155},
  BLACK:{label:'BLACK',emoji:'🖤',color:'#34343d',radius:170},
  LEGENDARY:{label:'LEGENDARY',emoji:'👑',color:'#d77820',radius:190},
  SECRET:{label:'SECRET',emoji:'❓',color:'#b42d64',radius:210}
};

function installCss(){
  if(document.getElementById('snZoneMapV169Style'))return;
  const s=document.createElement('style');
  s.id='snZoneMapV169Style';
  s.textContent=`
    #snArZoneMap.leaflet-container{background:#dce9d7!important;position:relative!important}
    #snArZoneMap canvas.leaflet-tile{display:block!important;visibility:visible!important;opacity:1!important;filter:none!important;transition:none!important;animation:none!important}
    #snArZoneMap .leaflet-pane,#snArZoneMap .leaflet-map-pane,#snArZoneMap .leaflet-tile-pane{visibility:visible!important;opacity:1!important}
    #snArZoneMap .leaflet-tile-pane{z-index:200!important}
    #snArZoneMap .leaflet-overlay-pane{z-index:400!important}
    #snArZoneMap .leaflet-control-container{display:block!important;visibility:visible!important;opacity:1!important}
    #snArZoneMapStatus{margin:0 12px 9px;padding:8px 10px;border-radius:12px;background:#fffaf0;color:#5d492f;border:1px solid #d0b47b;font-size:11px;font-weight:850;line-height:1.35}
    #snArZoneMapStatus[hidden]{display:none!important}
  `;
  document.head.appendChild(s);
}

function ensureModal(){
  installCss();
  let modal=$('#snArZoneModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='snArZoneModal';
    modal.className='sn-ar-zone-modal';
    modal.innerHTML=`<div class="sn-ar-zone-shell"><div class="sn-ar-zone-head"><h2>Snazzle-zones 🗺️</h2><button type="button" class="sn-ar-zone-close" id="snArZoneClose">×</button></div><div class="sn-ar-zone-copy"><b>Hier ergens zit een Snazzle.</b> De cirkels tonen expres alleen ongeveer waar. Bij zeldzame Snazzles is de zoekzone groter, zodat je nog echt moet speuren.</div><div id="snArZoneMapStatus">Kaart laden…</div><div id="snArZoneMap"></div><div class="sn-ar-zone-empty" id="snArZoneEmpty" hidden></div><div class="sn-ar-zone-legend" id="snArZoneLegend"></div></div>`;
    document.body.appendChild(modal);
  }
  const mapEl=$('#snArZoneMap');
  if(mapEl&&!$('#snArZoneMapStatus')){
    const status=document.createElement('div');
    status.id='snArZoneMapStatus';
    status.textContent='Kaart laden…';
    mapEl.insertAdjacentElement('beforebegin',status);
  }
  const close=$('#snArZoneClose');
  if(close&&!close.dataset.snZone169){
    close.dataset.snZone169='1';
    close.addEventListener('click',e=>{e.preventDefault();modal.classList.remove('show');});
  }
  if(!modal.dataset.snZone169){
    modal.dataset.snZone169='1';
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show');});
  }
  return modal;
}

function setStatus(text,hide=false){
  const el=$('#snArZoneMapStatus');
  if(!el)return;
  el.textContent=text||'';
  el.hidden=!!hide;
}

function loadLeafletScript(src,timeout=5000){
  return new Promise((resolve,reject)=>{
    if(window.L)return resolve(window.L);
    const s=document.createElement('script');
    s.src=`${src}${src.includes('?')?'&':'?'}snazzle=v169-${Date.now()}`;
    s.async=true;
    const timer=setTimeout(()=>{s.remove();reject(new Error('Kaartmodule reageert niet.'));},timeout);
    s.onload=()=>{clearTimeout(timer);window.L?resolve(window.L):reject(new Error('Kaartmodule is niet gestart.'));};
    s.onerror=()=>{clearTimeout(timer);s.remove();reject(new Error('Kaartmodule kon niet laden.'));};
    document.head.appendChild(s);
  });
}

async function ensureLeaflet(){
  installCss();
  if(window.L)return window.L;
  if(leafletPromise)return leafletPromise;
  leafletPromise=(async()=>{
    if(!document.querySelector('link[href*="leaflet.css"]')){
      const l=document.createElement('link');
      l.rel='stylesheet';
      l.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
      l.dataset.snZone169='1';
      document.head.appendChild(l);
    }
    try{return await loadLeafletScript('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js');}
    catch{return await loadLeafletScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');}
  })();
  try{return await leafletPromise;}finally{if(!window.L)leafletPromise=null;}
}

function tileUrls(c){
  const sub=['a','b','c','d'][Math.abs(c.x+c.y)%4];
  return [
    `https://tile.openstreetmap.org/${c.z}/${c.x}/${c.y}.png`,
    `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${c.z}/${c.x}/${c.y}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${c.z}/${c.y}/${c.x}`
  ];
}

function makeCanvasBaseLayer(L){
  const CanvasTiles=L.GridLayer.extend({
    createTile(coords,done){
      const tile=L.DomUtil.create('canvas','leaflet-tile');
      const size=this.getTileSize();
      tile.width=size.x;tile.height=size.y;
      const ctx=tile.getContext('2d');
      const urls=tileUrls(coords);
      let index=0,finished=false;
      const finish=err=>{if(finished)return;finished=true;done(err||null,tile);};
      const tryNext=()=>{
        if(index>=urls.length){
          ctx.fillStyle='#dce9d7';ctx.fillRect(0,0,size.x,size.y);
          finish(null);return;
        }
        const img=new Image();
        const timer=setTimeout(()=>{img.onload=null;img.onerror=null;index++;tryNext();},4500);
        img.onload=()=>{
          clearTimeout(timer);
          try{ctx.drawImage(img,0,0,size.x,size.y);finish(null);}catch{index++;tryNext();}
        };
        img.onerror=()=>{clearTimeout(timer);index++;tryNext();};
        img.src=urls[index];
      };
      tryNext();
      return tile;
    }
  });
  return new CanvasTiles({tileSize:256,minZoom:2,maxZoom:19,keepBuffer:3,updateWhenIdle:false,updateWhenZooming:true});
}

function removeOldZoneMap(){
  const old=window.__snazzleZoneMap168||window.__snazzleZoneMap167||window.__snazzleZoneMap166||window.__snazzleZoneMap112;
  if(old&&old!==map){try{old.remove();}catch{}}
  for(const key of ['__snazzleZoneMap168','__snazzleZoneMap167','__snazzleZoneMap166','__snazzleZoneMap112']){
    try{delete window[key];}catch{}
  }
}

function ensureMap(L){
  const root=$('#snArZoneMap');
  if(!root)throw new Error('Kaartvlak ontbreekt.');
  if(map&&map.getContainer?.()===root){
    setTimeout(()=>map.invalidateSize({pan:false,animate:false}),0);
    return map;
  }
  removeOldZoneMap();
  try{if(root._leaflet_id)delete root._leaflet_id;}catch{}
  root.innerHTML='';
  map=L.map(root,{zoomControl:true,attributionControl:true,preferCanvas:true});
  baseLayer=makeCanvasBaseLayer(L).addTo(map);
  zoneLayer=L.layerGroup().addTo(map);
  map.setView([51.125,5.948],13);
  map.attributionControl.setPrefix('Leaflet');
  map.attributionControl.addAttribution('© OpenStreetMap contributors · CARTO/Esri fallback');
  window.__snazzleZoneMap169=map;
  setTimeout(()=>map.invalidateSize({pan:false,animate:false}),60);
  return map;
}

function publicZones(points){
  const village=localStorage.getItem('snazzleVillage')||'Montfort';
  const groups=new Map();
  (Array.isArray(points)?points:[]).filter(p=>p&&p.active!==false&&String(p.village||'')===village).forEach(p=>{
    const plat=Number(p.lat),plon=Number(p.lon);
    if(!Number.isFinite(plat)||!Number.isFinite(plon))return;
    const lat=Math.round(plat*1000)/1000,lon=Math.round(plon*1000)/1000;
    const key=`${lat.toFixed(3)}|${lon.toFixed(3)}`;
    const raw=String(p.rarity||'COMMON').toUpperCase();
    const rarity=rarityInfo[raw]?raw:'COMMON';
    if(!groups.has(key))groups.set(key,{lat,lon,count:0,rarities:{},top:rarity});
    const z=groups.get(key);z.count++;z.rarities[rarity]=(z.rarities[rarity]||0)+1;
    if((rarityRank[rarity]||0)>(rarityRank[z.top]||0))z.top=rarity;
  });
  return [...groups.values()];
}

function zoneSummary(z){
  return Object.entries(z.rarities).sort((a,b)=>(rarityRank[b[0]]||0)-(rarityRank[a[0]]||0)).map(([r,n])=>`${n}× ${r}`).join(' · ');
}

function renderZones(L,zones){
  zoneLayer?.clearLayers();
  const legend=$('#snArZoneLegend');
  if(legend){
    const seen=[...new Set(zones.map(z=>z.top))].sort((a,b)=>(rarityRank[b]||0)-(rarityRank[a]||0));
    legend.innerHTML=seen.map(r=>`<span class="sn-ar-zone-chip">${rarityInfo[r].emoji} ${r}</span>`).join('');
  }
  if(!zones.length){
    map.setView([51.125,5.948],13);
    setStatus(`Er zijn nu geen actieve Snazzle-zones in ${localStorage.getItem('snazzleVillage')||'dit dorp'}.`);
    setTimeout(()=>map.invalidateSize({pan:false,animate:false}),60);
    return;
  }
  const bounds=[];
  zones.forEach(z=>{
    const info=rarityInfo[z.top]||rarityInfo.COMMON;
    const circle=L.circle([z.lat,z.lon],{radius:info.radius,color:info.color,fillColor:info.color,fillOpacity:.18,weight:3,opacity:.9}).addTo(zoneLayer);
    circle.bindPopup(`<div class="sn-ar-zone-popup"><strong>${info.emoji} ${info.label}-signaal</strong><br>${z.count===1?'Er zit een Snazzle in deze zoekzone.':`Er zitten ${z.count} Snazzle-signalen in deze zoekzone.`}<small>${zoneSummary(z)}<br>De exacte plek blijft geheim.</small></div>`);
    bounds.push([z.lat,z.lon]);
  });
  if(bounds.length===1)map.setView(bounds[0],15);else map.fitBounds(bounds,{padding:[28,28],maxZoom:15});
  setStatus('',true);
  setTimeout(()=>map.invalidateSize({pan:false,animate:false}),80);
}

async function openZones(e){
  e?.preventDefault?.();
  e?.stopImmediatePropagation?.();
  if(opening)return;
  opening=true;
  const modal=ensureModal();
  modal.classList.add('show');
  setStatus('Kaart laden…');
  const empty=$('#snArZoneEmpty');if(empty)empty.hidden=true;
  try{
    const L=await ensureLeaflet();
    ensureMap(L);
    setStatus('Snazzle-zones ophalen…');
    const api=window.SnazzleArWorldV85;
    if(!api?.reload)throw new Error('Snazzle-zones zijn nog niet klaar.');
    const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('Snazzle-zones laden duurt te lang.')),9000));
    const points=await Promise.race([api.reload(),timeout]);
    renderZones(L,publicZones(points));
  }catch(err){
    setStatus(`⚠️ ${err?.message||'De Snazzle-kaart kon niet laden.'}`);
  }finally{
    opening=false;
  }
}

document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#snArZoneOpen');
  if(!btn)return;
  openZones(e);
},true);

window.addEventListener('orientationchange',()=>{setTimeout(()=>map?.invalidateSize({pan:false,animate:false}),180);},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>map?.invalidateSize({pan:false,animate:false}),120);});

installCss();
window.SnazzleZoneMapV169={open:openZones,refresh:()=>map?.invalidateSize({pan:false,animate:false})};
