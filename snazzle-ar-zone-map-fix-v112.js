// Snazzle AR zone map fix v112 — stabiele kaarttegels op mobiel zonder hoofdmenu/Beheer te raken.
// Laadt Leaflet vooraf, corrigeert verborgen/gewijzigde kaartmaten en gebruikt een reserve-tegellaag bij storingen.

let readyPromise=null,patched=false;
const $=s=>document.querySelector(s);

function installCss(){
  if(!document.getElementById('snArZoneMapFix112Style')){
    const s=document.createElement('style');
    s.id='snArZoneMapFix112Style';
    s.textContent=`
      #snArZoneMap .leaflet-tile-pane img.leaflet-tile{max-width:none!important;max-height:none!important;image-rendering:auto!important}
      #snArZoneMap .leaflet-container{background:#dce9d7}
    `;
    document.head.appendChild(s);
  }
  if(!document.querySelector('link[href*="leaflet@1.9.4/dist/leaflet.css"],link[href*="leaflet.css"]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
    l.dataset.snArZoneMapFix112='1';
    document.head.appendChild(l);
  }
}

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(s=>s.src===src);
    if(existing){
      if(window.L)return resolve(window.L);
      existing.addEventListener('load',()=>resolve(window.L),{once:true});
      existing.addEventListener('error',reject,{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src=src;s.async=true;
    s.onload=()=>resolve(window.L);
    s.onerror=reject;
    document.head.appendChild(s);
  });
}

async function ensureLeaflet(){
  installCss();
  if(window.L)return window.L;
  try{return await loadScript('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js');}
  catch{return await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');}
}

function stabilizeMap(map){
  if(!map)return;
  const fix=()=>{try{map.invalidateSize({pan:false,animate:false});}catch{}};
  [0,60,180,420,850].forEach(ms=>setTimeout(fix,ms));
}

function attachResizeFix(map){
  const el=map?.getContainer?.();
  if(!el||el.dataset.snMapResize112)return;
  el.dataset.snMapResize112='1';
  if(window.ResizeObserver){
    const ro=new ResizeObserver(()=>stabilizeMap(map));
    ro.observe(el);
    el.__snArZoneResize112=ro;
  }
  map.on?.('zoomend moveend',()=>stabilizeMap(map));
  window.addEventListener('orientationchange',()=>stabilizeMap(map),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)stabilizeMap(map);});
}

function installLeafletPatches(L){
  if(patched||!L?.map||!L?.tileLayer)return;
  patched=true;

  const originalMap=L.map.bind(L);
  const wrappedMap=function(target,options){
    const map=originalMap(target,options);
    const id=typeof target==='string'?target:target?.id;
    if(id==='snArZoneMap'){
      window.__snazzleZoneMap112=map;
      attachResizeFix(map);
      stabilizeMap(map);
    }
    return map;
  };
  Object.assign(wrappedMap,L.map);
  L.map=wrappedMap;

  const originalTileLayer=L.tileLayer.bind(L);
  const makeFallback=(map)=>{
    if(!map||map.__snFallback112)return;
    map.__snFallback112=true;
    try{if(map.__snPrimaryTiles112&&map.hasLayer(map.__snPrimaryTiles112))map.removeLayer(map.__snPrimaryTiles112);}catch{}
    const fallback=originalTileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{
      maxZoom:20,
      subdomains:'abcd',
      attribution:'© OpenStreetMap © CARTO',
      updateWhenIdle:false,
      updateWhenZooming:true,
      keepBuffer:4
    });
    fallback.addTo(map);
    map.__snFallbackTiles112=fallback;
    stabilizeMap(map);
  };

  const wrappedTileLayer=function(url,options={}){
    const isZoneOsm=String(url||'').includes('tile.openstreetmap.org');
    const finalUrl=isZoneOsm?'https://tile.openstreetmap.org/{z}/{x}/{y}.png':url;
    const finalOptions=isZoneOsm?{
      ...options,
      maxZoom:19,
      updateWhenIdle:false,
      updateWhenZooming:true,
      keepBuffer:4,
      detectRetina:false
    }:options;
    const layer=originalTileLayer(finalUrl,finalOptions);
    if(isZoneOsm){
      let errors=0,loaded=0;
      layer.on('tileload',()=>{loaded++;});
      layer.on('tileerror',()=>{
        errors++;
        if(errors>=3)makeFallback(window.__snazzleZoneMap112);
      });
      layer.on('add',()=>{
        const map=window.__snazzleZoneMap112;
        if(map)map.__snPrimaryTiles112=layer;
        stabilizeMap(map);
        setTimeout(()=>{
          if(map&&!loaded&&$('#snArZoneModal')?.classList.contains('show'))makeFallback(map);
        },1800);
      });
    }
    return layer;
  };
  Object.assign(wrappedTileLayer,L.tileLayer);
  L.tileLayer=wrappedTileLayer;
}

function prepare(){
  if(!readyPromise){
    readyPromise=ensureLeaflet().then(L=>{installLeafletPatches(L);return L;}).catch(err=>{readyPromise=null;throw err;});
  }
  return readyPromise;
}

// Eerste tik wordt zo nodig heel even tegengehouden totdat de stabiele kaartlaag klaarstaat.
document.addEventListener('click',async e=>{
  const btn=e.target?.closest?.('#snArZoneOpen');
  if(!btn||patched)return;
  e.preventDefault();e.stopImmediatePropagation();
  try{
    await prepare();
    window.SnazzleArWorldV85?.openZones?.();
  }catch{
    window.SnazzleArWorldV85?.openZones?.();
  }
},true);

// Bij opnieuw openen of terugkomen uit de achtergrond altijd de kaartmaat herstellen.
const modalObserver=new MutationObserver(()=>{
  const modal=$('#snArZoneModal');
  if(modal?.classList.contains('show'))stabilizeMap(window.__snazzleZoneMap112);
});
if(document.body)modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});

prepare().catch(()=>{});
window.SnazzleArZoneMapFixV112={prepare,stabilize:()=>stabilizeMap(window.__snazzleZoneMap112)};
