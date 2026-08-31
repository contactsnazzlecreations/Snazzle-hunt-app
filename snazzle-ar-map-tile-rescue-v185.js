// Snazzle AR map tile rescue v185
// Android/PWA fallback: vervang niet-ladende OSM-tegels door Esri World Street Map.

const MAP_ID='snArMap184';
const TILE_SELECTOR='#'+MAP_ID+' img.leaflet-tile';
const ESRI_BASE='https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile';
let observer=null;

function toEsri(src){
  try{
    const u=new URL(src,location.href);
    const m=u.pathname.match(/\/(\d+)\/(\d+)\/(\d+)\.png$/);
    if(!m)return '';
    const [,z,x,y]=m;
    return `${ESRI_BASE}/${z}/${y}/${x}`;
  }catch{return '';}
}

function rescueTile(img){
  if(!(img instanceof HTMLImageElement)||img.dataset.snTileRescue185==='1')return;
  const original=img.currentSrc||img.src||'';
  const esri=toEsri(original);
  if(!esri)return;
  img.dataset.snTileRescue185='1';
  // Op sommige Android-webviews vuurt tileerror laat of helemaal niet af.
  // Geef de primaire laag kort de kans en schakel daarna hard over als er geen pixels zijn.
  const swap=()=>{
    if(img.naturalWidth>0&&img.complete)return;
    img.crossOrigin='anonymous';
    img.referrerPolicy='no-referrer';
    img.src=esri;
  };
  img.addEventListener('error',swap,{once:true});
  setTimeout(swap,900);
}

function scan(){document.querySelectorAll(TILE_SELECTOR).forEach(rescueTile);}

function installLabel(){
  const map=document.getElementById(MAP_ID);
  if(!map||map.querySelector('.sn-tile-rescue-label185'))return;
  const label=document.createElement('div');
  label.className='sn-tile-rescue-label185';
  label.textContent='Kaartlaag automatisch hersteld';
  Object.assign(label.style,{position:'absolute',right:'8px',top:'8px',zIndex:'1000',background:'rgba(255,255,255,.88)',color:'#3a2a1d',padding:'5px 7px',borderRadius:'8px',fontSize:'10px',fontWeight:'900',pointerEvents:'none',display:'none'});
  map.appendChild(label);
  setTimeout(()=>{
    const any=[...map.querySelectorAll('img.leaflet-tile')].some(i=>i.dataset.snTileRescue185==='1');
    if(any){label.style.display='block';setTimeout(()=>label.style.display='none',3500);}
  },1500);
}

function boot(){
  scan();installLabel();
  if(observer)return;
  observer=new MutationObserver(()=>{scan();installLabel();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  // Extra scans voor traag opgebouwde Leaflet-tegels.
  [400,1000,2200,4000].forEach(ms=>setTimeout(scan,ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SnazzleArMapTileRescueV185={scan};
