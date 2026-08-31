// Snazzle AR kaartbediening v196
// Zorgt dat de ingebedde kaart zelf aanrakingen ontvangt: +/−, slepen en knijpen.
// Tegelijk blokkeren we alleen tijdens het plaatsingsscherm het zoomen van de hele app-pagina.

const MODAL_ID_196='snArDirect195';
const MAP_ID_196='sn195MapFrame';
let savedViewport196=null;
let modalObserver196=null;

function installStyles196(){
  if(document.getElementById('snArMapGestureStyle196')) return;
  const style=document.createElement('style');
  style.id='snArMapGestureStyle196';
  style.textContent=`
    #${MODAL_ID_196} .sn195-map{
      overscroll-behavior:contain!important;
      touch-action:auto!important;
    }
    #${MODAL_ID_196} .sn195-map iframe{
      pointer-events:auto!important;
      touch-action:auto!important;
    }
    #${MODAL_ID_196} .sn195-pin{
      pointer-events:none!important;
      user-select:none!important;
    }
  `;
  document.head.appendChild(style);
}

function viewport196(){
  return document.querySelector('meta[name="viewport"]');
}

function lockPageZoom196(){
  const meta=viewport196();
  if(!meta || savedViewport196!==null) return;
  savedViewport196=meta.getAttribute('content')||'';
  meta.setAttribute('content','width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
  document.documentElement.style.overscrollBehavior='none';
}

function unlockPageZoom196(){
  const meta=viewport196();
  if(meta && savedViewport196!==null) meta.setAttribute('content',savedViewport196);
  savedViewport196=null;
  document.documentElement.style.overscrollBehavior='';
}

function apply196(){
  installStyles196();
  const modal=document.getElementById(MODAL_ID_196);
  const frame=document.getElementById(MAP_ID_196);

  if(frame){
    frame.style.setProperty('pointer-events','auto','important');
    frame.style.setProperty('touch-action','auto','important');
    frame.setAttribute('scrolling','no');
  }

  if(modal?.classList.contains('show')) lockPageZoom196();
  else unlockPageZoom196();
}

function observe196(){
  apply196();
  if(modalObserver196 || !document.body) return;
  modalObserver196=new MutationObserver(()=>apply196());
  modalObserver196.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  [50,150,400,900,1800,3500].forEach(ms=>setTimeout(apply196,ms));
}

// Extra vangnet voor oude inline CSS: zodra er in het kaartvlak wordt aangeraakt,
// krijgt de iframe altijd de bediening en blijft de hoofdapp op vaste schaal.
document.addEventListener('pointerdown',event=>{
  const map=event.target?.closest?.(`#${MODAL_ID_196} .sn195-map`);
  if(!map) return;
  lockPageZoom196();
  const frame=document.getElementById(MAP_ID_196);
  if(frame) frame.style.setProperty('pointer-events','auto','important');
},true);

window.addEventListener('pagehide',unlockPageZoom196);
if(document.body) observe196();
else document.addEventListener('DOMContentLoaded',observe196,{once:true});

window.SnazzleArMapGestureFixV196={apply:apply196};
console.info('Snazzle AR kaartbediening v196 geladen');
