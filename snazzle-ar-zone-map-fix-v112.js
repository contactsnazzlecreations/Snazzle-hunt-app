// Snazzle AR map fix v183 — stabiele kaarttegels voor zones én precies plaatsen.
// De klik wordt centraal afgehandeld, zodat een later vervangen knop nooit zijn event-listener kwijt kan raken.

let readyPromise=null;
let patched=false;
const $=s=>document.querySelector(s);
const MANAGED_MAP_SELECTOR='#snArZoneMap,#snArMap90';

function installCss(){
  if(document.getElementById('snArZoneMapFix183Style'))return;
  const s=document.createElement('style');
  s.id='snArZoneMapFix183Style';
  s.textContent=`
    #snArZoneMap.leaflet-container,#snArMap90.leaflet-container{background:#dce9d7!important;position:relative!important}
    #snArZoneMap .leaflet-map-pane,
    #snArZoneMap .leaflet-pane,
    #snArZoneMap .leaflet-tile-pane,
    #snArMap90 .leaflet-map-pane,
    #snArMap90 .leaflet-pane,
    #snArMap90 .leaflet-tile-pane{display:block!important;visibility:visible!important;opacity:1!important}
    #snArZoneMap .leaflet-tile-container,#snArMap90 .leaflet-tile-container{visibility:visible!important;opacity:1!important}
    #snArZoneMap img.leaflet-tile,#snArMap90 img.leaflet-tile{
      display:block!important;visibility:visible!important;opacity:1!important;
      max-width:none!important;max-height:none!important;width:256px!important;height:256px!important;
      object-fit:fill!important;filter:none!important;transition:none!important;animation:none!important
    }
    #snArZoneMap .leaflet-tile-pane,#snArMap90 .leaflet-tile-pane{z-index:200!important}
    #snArZoneMap .leaflet-overlay-pane,#snArMap90 .leaflet-overlay-pane{z-index:400!important}
    #snArZoneMap .leaflet-control-container,#snArMap90 .leaflet-control-container{display:block!important;visibility:visible!important;opacity:1!important}
  `;
  document.head.appendChild(s);
  if(!document.querySelector('link[href*="leaflet@1.9.4/dist/leaflet.css"],link[href*="leaflet.css"]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
    l.dataset.snArZoneMapFix183='1';
    document.head.appendChild(l);
  }
}

function sanitizeMapDom(root=null){
  const roots=root?[root]:[...document.querySelectorAll(MANAGED_MAP_SELECTOR)];
  roots.forEach(mapRoot=>{
    if(!mapRoot)return;
    mapRoot.querySelectorAll('img.leaflet-tile,img.leaflet-marker-icon,img.leaflet-marker-shadow').forEach(img=>{
      img.classList.remove('sn59-media','sn59-loading','sn59-loaded');
      try{delete img.dataset.sn59Media;}catch{}
      img.style.display='block';
      img.style.visibility='visible';
      img.style.opacity='1';
      img.style.filter='none';
    });
    mapRoot.querySelectorAll('.leaflet-tile-container,.leaflet-layer,.leaflet-pane').forEach(el=>{
      el.classList.remove('sn59-media-shell','sn59-waiting');
    });
  });
}

function startDomProtection(){
  if(window.__snazzleLeafletDomProtect183)return;
  window.__snazzleLeafletDomProtect183=true;
  const mo=new MutationObserver(records=>{
    let relevant=false;
    for(const r of records){
      if(r.target?.closest?.(MANAGED_MAP_SELECTOR)){relevant=true;break;}
      for(const n of r.addedNodes||[]){
        if(n?.nodeType===1&&(
          n.matches?.(MANAGED_MAP_SELECTOR) ||
          n.closest?.(MANAGED_MAP_SELECTOR) ||
          n.querySelector?.(`${MANAGED_MAP_SELECTOR},.leaflet-tile`)
        )){relevant=true;break;}
      }
      if(relevant)break;
    }
    if(relevant)queueMicrotask(()=>sanitizeMapDom());
  });
  if(document.body)mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
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
  startDomProtection();
  if(window.L)return window.L;
  try{return await loadScript('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js');}
  catch{return await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');}
}

function isManagedMap(map){return ['snArZoneMap','snArMap90'].includes(map?.getContainer?.()?.id);}
function isManagedMapOpen(map){
  const id=map?.getContainer?.()?.id;
  if(id==='snArZoneMap')return !!$('#snArZoneModal')?.classList.contains('show');
  if(id==='snArMap90')return !!$('#snArStudioV90')?.classList.contains('show');
  return false;
}

function stabilizeMap(map){
  if(!map)return;
  const fix=()=>{
    sanitizeMapDom(map.getContainer?.());
    try{map.invalidateSize({pan:false,animate:false});}catch{}
  };
  [0,80,220,550,1100].forEach(ms=>setTimeout(fix,ms));
}

function attachResizeFix(map){
  const el=map?.getContainer?.();
  if(!el||el.dataset.snMapResize168)return;
  el.dataset.snMapResize168='1';
  if(window.ResizeObserver){
    const ro=new ResizeObserver(()=>stabilizeMap(map));
    ro.observe(el);
    el.__snArZoneResize168=ro;
  }
  map.on?.('zoomend moveend',()=>sanitizeMapDom(el));
  window.addEventListener('orientationchange',()=>stabilizeMap(map),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)stabilizeMap(map);});
}

function installLeafletPatches(L){
  if(patched||!L?.map||!L?.tileLayer)return;
  patched=true;
  const originalMap=L.map.bind(L);
  const originalTileLayer=L.tileLayer.bind(L);
  const providers=[
    {url:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',options:{subdomains:'abcd',maxZoom:20,attribution:'© OpenStreetMap © CARTO',updateWhenIdle:true,updateWhenZooming:false,keepBuffer:3,detectRetina:false}},
    {url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',options:{maxZoom:19,attribution:'© OpenStreetMap',updateWhenIdle:true,updateWhenZooming:false,keepBuffer:3,detectRetina:false}},
    {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',options:{maxZoom:19,attribution:'Tiles © Esri',updateWhenIdle:true,updateWhenZooming:false,keepBuffer:3,detectRetina:false}}
  ];

  function removeBaseLayers(map){
    try{map.eachLayer(layer=>{if(layer?._url)map.removeLayer(layer);});}catch{}
  }

  function addProvider(map,index=0){
    if(!isManagedMap(map))return null;
    const i=Math.max(0,Math.min(index,providers.length-1));
    const p=providers[i];
    removeBaseLayers(map);
    const layer=originalTileLayer(p.url,p.options);
    map.__snProvider168=i;
    map.__snBase168=layer;
    let loaded=0,errors=0,switched=false;
    const next=()=>{
      if(switched||i>=providers.length-1)return;
      switched=true;
      try{map.removeLayer(layer);}catch{}
      addProvider(map,i+1);
    };
    layer.on('tileload',()=>{loaded++;sanitizeMapDom(map.getContainer());});
    layer.on('tileerror',()=>{errors++;if(errors>=3)next();});
    layer.addTo(map);
    stabilizeMap(map);
    setTimeout(()=>{
      if(!isManagedMapOpen(map))return;
      const imgs=[...map.getContainer().querySelectorAll('img.leaflet-tile')];
      const visible=imgs.some(img=>img.complete&&img.naturalWidth>0);
      if(!loaded&&!visible)next();
    },2200);
    return layer;
  }

  const wrappedMap=function(target,options){
    const map=originalMap(target,options);
    const id=typeof target==='string'?target:target?.id;
    if(id==='snArZoneMap'||id==='snArMap90'){
      if(id==='snArZoneMap'){
        window.__snazzleZoneMap168=map;
        window.__snazzleZoneMap167=map;
        window.__snazzleZoneMap112=map;
      }else window.__snazzlePlaceMap183=map;
      attachResizeFix(map);
      setTimeout(()=>{if(isManagedMap(map)&&!map.__snBase168)addProvider(map,0);},0);
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
      if(!isManagedMap(map))return;
      if(!map.__snBase168){
        setTimeout(()=>{
          try{if(map.hasLayer(layer))map.removeLayer(layer);}catch{}
          if(!map.__snBase168)addProvider(map,0);
        },0);
      }else if(layer!==map.__snBase168){
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

async function waitForWorldApi(timeout=3000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    if(window.SnazzleArWorldV85?.openZones)return window.SnazzleArWorldV85;
    await new Promise(resolve=>setTimeout(resolve,40));
  }
  return window.SnazzleArWorldV85||null;
}

// Altijd centraal afhandelen. Dit blijft werken als de knop later opnieuw in de DOM wordt gezet.
document.addEventListener('click',async e=>{
  const btn=e.target?.closest?.('#snArZoneOpen');
  if(!btn)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  btn.disabled=true;
  try{
    await prepare().catch(()=>null);
    const api=await waitForWorldApi();
    if(api?.openZones)await api.openZones(e);
  }finally{
    btn.disabled=false;
  }
},true);

const modalObserver=new MutationObserver(()=>{
  const zoneOpen=$('#snArZoneModal')?.classList.contains('show');
  const studioOpen=$('#snArStudioV90')?.classList.contains('show');
  if(!zoneOpen&&!studioOpen)return;
  const maps=[window.__snazzleZoneMap168||window.__snazzleZoneMap167||window.__snazzleZoneMap112,window.__snazzlePlaceMap183].filter(Boolean);
  sanitizeMapDom();
  maps.forEach(stabilizeMap);
});
if(document.body)modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});

installCss();
startDomProtection();
prepare().catch(()=>{});
window.SnazzleArZoneMapFixV112={
  prepare,
  stabilize:()=>[
    window.__snazzleZoneMap168||window.__snazzleZoneMap167||window.__snazzleZoneMap112,
    window.__snazzlePlaceMap183
  ].filter(Boolean).forEach(stabilizeMap),
  sanitize:sanitizeMapDom
};
