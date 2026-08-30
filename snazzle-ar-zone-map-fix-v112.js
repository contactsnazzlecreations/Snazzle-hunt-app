// Snazzle AR zone map fix v166 — kaarttegels altijd zichtbaar op mobiel.
// Dwingt de Leaflet-tegels zichtbaar, gebruikt een stabiele CARTO-kaartlaag en schakelt automatisch naar OSM/Esri bij fouten.

let readyPromise=null,patched=false;
const $=s=>document.querySelector(s);

function installCss(){
  if(!document.getElementById('snArZoneMapFix166Style')){
    const s=document.createElement('style');
    s.id='snArZoneMapFix166Style';
    s.textContent=`
      #snArZoneMap.leaflet-container{background:#dce9d7!important;position:relative!important}
      #snArZoneMap .leaflet-map-pane,
      #snArZoneMap .leaflet-tile-pane{display:block!important;visibility:visible!important;opacity:1!important}
      #snArZoneMap .leaflet-tile-pane img.leaflet-tile,
      #snArZoneMap img.leaflet-tile{
        display:block!important;
        visibility:visible!important;
        opacity:1!important;
        max-width:none!important;
        max-height:none!important;
        width:256px!important;
        height:256px!important;
        object-fit:fill!important;
        image-rendering:auto!important;
        filter:none!important;
      }
      #snArZoneMap .leaflet-overlay-pane{z-index:400!important}
      #snArZoneMap .leaflet-tile-pane{z-index:200!important}
      #snArZoneMap .leaflet-control-container{display:block!important;visibility:visible!important;opacity:1!important}
    `;
    document.head.appendChild(s);
  }
  if(!document.querySelector('link[href*="leaflet@1.9.4/dist/leaflet.css"],link[href*="leaflet.css"]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
    l.dataset.snArZoneMapFix166='1';
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
  const fix=()=>{
    try{
      map.invalidateSize({pan:false,animate:false});
      map.eachLayer?.(layer=>{if(layer?.redraw&&layer?._url)layer.redraw();});
    }catch{}
  };
  [0,60,180,420,850,1500].forEach(ms=>setTimeout(fix,ms));
}

function isZoneMap(map){return map?.getContainer?.()?.id==='snArZoneMap';}

function attachResizeFix(map){
  const el=map?.getContainer?.();
  if(!el||el.dataset.snMapResize166)return;
  el.dataset.snMapResize166='1';
  if(window.ResizeObserver){
    const ro=new ResizeObserver(()=>stabilizeMap(map));
    ro.observe(el);
    el.__snArZoneResize166=ro;
  }
  map.on?.('zoomend moveend resize',()=>stabilizeMap(map));
  window.addEventListener('orientationchange',()=>stabilizeMap(map),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)stabilizeMap(map);});
}

function installLeafletPatches(L){
  if(patched||!L?.map||!L?.tileLayer)return;
  patched=true;

  const originalMap=L.map.bind(L);
  const originalTileLayer=L.tileLayer.bind(L);

  const providers=[
    {
      url:'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      options:{maxZoom:20,attribution:'© OpenStreetMap © CARTO',updateWhenIdle:false,updateWhenZooming:true,keepBuffer:4,detectRetina:false}
    },
    {
      url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options:{maxZoom:19,attribution:'© OpenStreetMap',updateWhenIdle:false,updateWhenZooming:true,keepBuffer:4,detectRetina:false}
    },
    {
      url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      options:{maxZoom:19,attribution:'Tiles © Esri',updateWhenIdle:false,updateWhenZooming:true,keepBuffer:4,detectRetina:false}
    }
  ];

  function removeBaseLayers(map){
    try{
      map.eachLayer(layer=>{
        if(layer?._url && !(layer instanceof L.Circle) && !(layer instanceof L.Marker))map.removeLayer(layer);
      });
    }catch{}
  }

  function addProvider(map,index=0){
    if(!isZoneMap(map))return null;
    const i=Math.max(0,Math.min(index,providers.length-1));
    const p=providers[i];
    removeBaseLayers(map);
    const layer=originalTileLayer(p.url,p.options);
    map.__snProvider166=i;
    map.__snBase166=layer;
    let loaded=0,errors=0,switched=false;
    const next=()=>{
      if(switched||i>=providers.length-1)return;
      switched=true;
      try{map.removeLayer(layer);}catch{}
      addProvider(map,i+1);
      stabilizeMap(map);
    };
    layer.on('tileload',()=>{loaded++;});
    layer.on('tileerror',()=>{errors++;if(errors>=2)next();});
    layer.addTo(map);
    setTimeout(()=>{
      if(!isZoneMap(map)||!$('#snArZoneModal')?.classList.contains('show'))return;
      const imgs=[...map.getContainer().querySelectorAll('.leaflet-tile-pane img.leaflet-tile')];
      const visible=imgs.some(img=>img.complete&&img.naturalWidth>0);
      if(!loaded&&!visible)next();
    },1600);
    stabilizeMap(map);
    return layer;
  }

  const wrappedMap=function(target,options){
    const map=originalMap(target,options);
    const id=typeof target==='string'?target:target?.id;
    if(id==='snArZoneMap'){
      window.__snazzleZoneMap166=map;
      window.__snazzleZoneMap112=map;
      attachResizeFix(map);
      setTimeout(()=>{
        if(isZoneMap(map)&&!map.__snBase166)addProvider(map,0);
      },0);
      stabilizeMap(map);
    }
    return map;
  };
  Object.assign(wrappedMap,L.map);
  L.map=wrappedMap;

  const wrappedTileLayer=function(url,options={}){
    const layer=originalTileLayer(url,options);
    layer.on('add',()=>{
      const map=layer._map;
      if(!isZoneMap(map))return;
      // De oorspronkelijke OSM-laag uit de AR-module wordt direct vervangen door onze mobiele kaartlaag.
      if(!map.__snBase166){
        setTimeout(()=>{
          try{if(map.hasLayer(layer))map.removeLayer(layer);}catch{}
          if(!map.__snBase166)addProvider(map,0);
        },0);
      }else if(layer!==map.__snBase166){
        setTimeout(()=>{try{if(map.hasLayer(layer))map.removeLayer(layer);}catch{}},0);
      }
    });
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

// Zorg dat de fix vóór het openen van de zonekaart actief is.
document.addEventListener('click',async e=>{
  const btn=e.target?.closest?.('#snArZoneOpen');
  if(!btn||patched)return;
  e.preventDefault();e.stopImmediatePropagation();
  try{await prepare();}catch{}
  window.SnazzleArWorldV85?.openZones?.();
},true);

const modalObserver=new MutationObserver(()=>{
  const modal=$('#snArZoneModal');
  if(!modal?.classList.contains('show'))return;
  const map=window.__snazzleZoneMap166||window.__snazzleZoneMap112;
  if(map){
    if(!map.__snBase166){
      try{const L=window.L;if(L)installLeafletPatches(L);}catch{}
    }
    stabilizeMap(map);
  }
});
if(document.body)modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});

prepare().catch(()=>{});
window.SnazzleArZoneMapFixV112={prepare,stabilize:()=>stabilizeMap(window.__snazzleZoneMap166||window.__snazzleZoneMap112)};
