// Snazzle AR zone map fix v167 — vaste, rustige kaarttegels op mobiel.
// Beschermt Leaflet tegen de algemene afbeeldings-polish en voorkomt onnodig herladen van kaarttegels.

let readyPromise=null,patched=false;
const $=s=>document.querySelector(s);

function installCss(){
  if(!document.getElementById('snArZoneMapFix167Style')){
    const s=document.createElement('style');
    s.id='snArZoneMapFix167Style';
    s.textContent=`
      #snArZoneMap.leaflet-container{background:#dce9d7!important;position:relative!important}
      #snArZoneMap .leaflet-map-pane,
      #snArZoneMap .leaflet-pane,
      #snArZoneMap .leaflet-tile-pane{display:block!important;visibility:visible!important;opacity:1!important}
      #snArZoneMap .leaflet-tile-container{
        position:absolute!important;
        left:0!important;
        top:0!important;
        overflow:visible!important;
        width:auto!important;
        height:auto!important;
        visibility:visible!important;
        opacity:1!important;
      }
      #snArZoneMap img.leaflet-tile{
        position:absolute!important;
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
        transition:none!important;
        animation:none!important;
      }
      #snArZoneMap .leaflet-tile-pane{z-index:200!important}
      #snArZoneMap .leaflet-overlay-pane{z-index:400!important}
      #snArZoneMap .leaflet-control-container{display:block!important;visibility:visible!important;opacity:1!important}
    `;
    document.head.appendChild(s);
  }
  if(!document.querySelector('link[href*="leaflet@1.9.4/dist/leaflet.css"],link[href*="leaflet.css"]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
    l.dataset.snArZoneMapFix167='1';
    document.head.appendChild(l);
  }
}

function sanitizeMapDom(root=$('#snArZoneMap')){
  if(!root)return;
  root.querySelectorAll('img.leaflet-tile,img.leaflet-marker-icon,img.leaflet-marker-shadow').forEach(img=>{
    img.classList.remove('sn59-media','sn59-loading','sn59-loaded');
    try{delete img.dataset.sn59Media;}catch{}
  });
  root.querySelectorAll('.leaflet-tile-container,.leaflet-layer,.leaflet-pane').forEach(el=>{
    el.classList.remove('sn59-media-shell','sn59-waiting');
  });
}

function startDomProtection(){
  if(window.__snazzleLeafletDomProtect167)return;
  window.__snazzleLeafletDomProtect167=true;
  const run=()=>sanitizeMapDom();
  const mo=new MutationObserver(records=>{
    let relevant=false;
    for(const r of records){
      const target=r.target;
      if(target?.closest?.('#snArZoneMap')||[...r.addedNodes||[]].some(n=>n?.nodeType===1&&(n.id==='snArZoneMap'||n.closest?.('#snArZoneMap')||n.querySelector?.('#snArZoneMap,.leaflet-tile')))){
        relevant=true;break;
      }
    }
    if(relevant)queueMicrotask(run);
  });
  if(document.body)mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  run();
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

function isZoneMap(map){return map?.getContainer?.()?.id==='snArZoneMap';}

function stabilizeMap(map){
  if(!map)return;
  const fix=()=>{
    sanitizeMapDom(map.getContainer?.());
    try{map.invalidateSize({pan:false,animate:false});}catch{}
  };
  [0,80,240,650].forEach(ms=>setTimeout(fix,ms));
}

function attachResizeFix(map){
  const el=map?.getContainer?.();
  if(!el||el.dataset.snMapResize167)return;
  el.dataset.snMapResize167='1';
  if(window.ResizeObserver){
    const ro=new ResizeObserver(()=>stabilizeMap(map));
    ro.observe(el);
    el.__snArZoneResize167=ro;
  }
  map.on?.('zoomend moveend',()=>{sanitizeMapDom(el);});
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
      url:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      options:{subdomains:'abcd',maxZoom:20,attribution:'© OpenStreetMap © CARTO',updateWhenIdle:true,updateWhenZooming:false,keepBuffer:3,detectRetina:false}
    },
    {
      url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options:{maxZoom:19,attribution:'© OpenStreetMap',updateWhenIdle:true,updateWhenZooming:false,keepBuffer:3,detectRetina:false}
    },
    {
      url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      options:{maxZoom:19,attribution:'Tiles © Esri',updateWhenIdle:true,updateWhenZooming:false,keepBuffer:3,detectRetina:false}
    }
  ];

  function removeBaseLayers(map){
    try{
      map.eachLayer(layer=>{
        if(layer?._url)map.removeLayer(layer);
      });
    }catch{}
  }

  function addProvider(map,index=0){
    if(!isZoneMap(map))return null;
    const i=Math.max(0,Math.min(index,providers.length-1));
    const p=providers[i];
    removeBaseLayers(map);
    const layer=originalTileLayer(p.url,p.options);
    map.__snProvider167=i;
    map.__snBase167=layer;
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
      if(!isZoneMap(map)||!$('#snArZoneModal')?.classList.contains('show'))return;
      sanitizeMapDom(map.getContainer());
      const imgs=[...map.getContainer().querySelectorAll('img.leaflet-tile')];
      const visible=imgs.some(img=>img.complete&&img.naturalWidth>0);
      if(!loaded&&!visible)next();
    },2200);
    return layer;
  }

  const wrappedMap=function(target,options){
    const map=originalMap(target,options);
    const id=typeof target==='string'?target:target?.id;
    if(id==='snArZoneMap'){
      window.__snazzleZoneMap167=map;
      window.__snazzleZoneMap166=map;
      window.__snazzleZoneMap112=map;
      attachResizeFix(map);
      setTimeout(()=>{if(isZoneMap(map)&&!map.__snBase167)addProvider(map,0);},0);
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
      if(!map.__snBase167){
        setTimeout(()=>{
          try{if(map.hasLayer(layer))map.removeLayer(layer);}catch{}
          if(!map.__snBase167)addProvider(map,0);
        },0);
      }else if(layer!==map.__snBase167){
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
  const map=window.__snazzleZoneMap167||window.__snazzleZoneMap166||window.__snazzleZoneMap112;
  sanitizeMapDom();
  if(map){
    if(!map.__snBase167){
      try{const L=window.L;if(L)installLeafletPatches(L);}catch{}
    }
    stabilizeMap(map);
  }
});
if(document.body)modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});

installCss();
startDomProtection();
prepare().catch(()=>{});
window.SnazzleArZoneMapFixV112={prepare,stabilize:()=>stabilizeMap(window.__snazzleZoneMap167||window.__snazzleZoneMap166||window.__snazzleZoneMap112),sanitize:sanitizeMapDom};
