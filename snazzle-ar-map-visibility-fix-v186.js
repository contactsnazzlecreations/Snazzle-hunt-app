// Snazzle AR map visibility fix v186
// Android/PWA: Leaflet-tegels kunnen geladen zijn maar verborgen blijven doordat
// de load-status niet goed wordt verwerkt. Deze laag forceert zichtbaarheid en
// gebruikt alleen bij een echte laadfout een alternatieve tegelserver.

const MAP_ID='snArMap184';
const TILE_SELECTOR='#'+MAP_ID+' img.leaflet-tile';
const ESRI_BASE='https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile';
let observer=null;

function installCss(){
  if(document.getElementById('snArMapVisibilityV186Style'))return;
  const s=document.createElement('style');
  s.id='snArMapVisibilityV186Style';
  s.textContent=`
    #${MAP_ID} .leaflet-tile-pane{display:block!important;visibility:visible!important;opacity:1!important;filter:none!important;}
    #${MAP_ID} img.leaflet-tile,
    #${MAP_ID} img.leaflet-tile-loaded{
      display:block!important;
      visibility:visible!important;
      opacity:1!important;
      max-width:none!important;
      max-height:none!important;
      filter:none!important;
      mix-blend-mode:normal!important;
    }
  `;
  document.head.appendChild(s);
}

function esriUrl(src){
  try{
    const u=new URL(src,location.href);
    const m=u.pathname.match(/\/(\d+)\/(\d+)\/(\d+)(?:\.png)?$/);
    if(!m)return '';
    const [,z,x,y]=m;
    return `${ESRI_BASE}/${z}/${y}/${x}`;
  }catch{return '';}
}

function forceVisible(img){
  if(!(img instanceof HTMLImageElement))return;
  img.style.setProperty('display','block','important');
  img.style.setProperty('visibility','visible','important');
  img.style.setProperty('opacity','1','important');
  img.style.setProperty('max-width','none','important');
  img.style.setProperty('max-height','none','important');
  img.style.setProperty('filter','none','important');
  img.classList.add('leaflet-tile-loaded');
}

function protectTile(img){
  if(!(img instanceof HTMLImageElement))return;
  forceVisible(img);
  if(img.dataset.snV186Protected==='1')return;
  img.dataset.snV186Protected='1';
  const original=img.currentSrc||img.src||'';
  const fallback=esriUrl(original);
  img.addEventListener('load',()=>forceVisible(img));
  img.addEventListener('error',()=>{
    if(!fallback||img.dataset.snV186Fallback==='1')return;
    img.dataset.snV186Fallback='1';
    img.removeAttribute('crossorigin');
    img.referrerPolicy='no-referrer';
    img.src=fallback;
    forceVisible(img);
  });
  setTimeout(()=>{
    forceVisible(img);
    if((!img.complete||img.naturalWidth===0)&&fallback&&img.dataset.snV186Fallback!=='1'){
      img.dataset.snV186Fallback='1';
      img.removeAttribute('crossorigin');
      img.referrerPolicy='no-referrer';
      img.src=fallback;
      forceVisible(img);
    }
  },1400);
}

function scan(){
  installCss();
  document.querySelectorAll(TILE_SELECTOR).forEach(protectTile);
}

function boot(){
  scan();
  if(!observer){
    observer=new MutationObserver(scan);
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
  [100,300,700,1400,2500,4500].forEach(ms=>setTimeout(scan,ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SnazzleArMapVisibilityFixV186={scan};
