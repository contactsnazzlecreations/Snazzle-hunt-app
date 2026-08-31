// Snazzle Cards v210 — directe kaartweergave uit een echt JPEG-bestand in de repo.
// Geen data-URI, geen canvas en geen extra zwarte laag. Pas na succesvolle image-load
// verbergen we de oude thumbnail en tonen we de juiste cel uit de 6x4 atlas.
const VERSION='210.0-direct-repo-jpeg';
const CARD_RE=/S01-([SW])(\d{2})/i;
const ATLAS='./assets/cards/snazzle-cards-atlas-v210.jpg?v=210';
let ready=false,repairQueued=false;

function cardIndex(number){
  const m=String(number||'').toUpperCase().match(CARD_RE);
  if(!m)return -1;
  const n=Number(m[2]);
  if(n<1||n>12)return -1;
  return m[1]==='S'?n-1:12+n-1;
}
function numberFromRow(row){return String(row?.querySelector('strong')?.textContent||row?.textContent||'').toUpperCase().match(CARD_RE)?.[0]||'';}
function numberFromCard(card){return String(card?.querySelector('.sc2-num')?.textContent||card?.textContent||'').toUpperCase().match(CARD_RE)?.[0]||'';}

function installStyle(){
  let s=document.getElementById('snCardFixedV205Style');
  if(!s){s=document.createElement('style');s.id='snCardFixedV205Style';document.head.appendChild(s);}
  s.textContent=`
    #sc2List .sc2-row{grid-template-columns:72px 1fr!important;column-gap:12px!important}
    #sc2List .sc2-thumb{width:72px!important;height:120px!important;overflow:hidden!important;border-radius:11px!important;background-color:#17242e!important;background-repeat:no-repeat!important}
    #sc2List .sc2-thumb.sn-atlas-ready-v210>img:not(.sn-v210-keep){opacity:0!important;visibility:hidden!important}
    #sc2Grid .sc2-media,#sc2VaultGrid .sc2-media{background-color:#17242e!important;background-repeat:no-repeat!important;background-position:center!important}
    #sc2Grid .sc2-media.sn-atlas-ready-v210>img:not(.sn-v210-keep),#sc2VaultGrid .sc2-media.sn-atlas-ready-v210>img:not(.sn-v210-keep){opacity:0!important;visibility:hidden!important}
  `;
}

function paint(box,number){
  if(!ready||!box)return false;
  const index=cardIndex(number);if(index<0)return false;
  const col=index%6,row=Math.floor(index/6);
  box.querySelectorAll(':scope > .sn-fixed-card-v205,:scope > .sn-card-viewport-v208,:scope > img.sn-card-atlas-v209').forEach(el=>el.remove());
  box.style.backgroundImage=`url("${ATLAS}")`;
  box.style.backgroundSize='600% 400%';
  box.style.backgroundPosition=`${(col/5)*100}% ${(row/3)*100}%`;
  box.style.backgroundRepeat='no-repeat';
  box.dataset.snCardNumberV210=number;
  box.classList.add('sn-atlas-ready-v210');
  return true;
}
function repair(){
  installStyle();if(!ready)return 0;let count=0;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{const n=numberFromRow(row),box=row.querySelector('.sc2-thumb');if(!n||!box)return;if(box.dataset.snCardNumberV210===n&&box.classList.contains('sn-atlas-ready-v210'))return;if(paint(box,n))count++;});
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{const n=numberFromCard(card),box=card.querySelector('.sc2-media');if(!n||!box)return;if(box.dataset.snCardNumberV210===n&&box.classList.contains('sn-atlas-ready-v210'))return;if(paint(box,n))count++;});
  return count;
}
function queueRepair(){if(repairQueued)return;repairQueued=true;requestAnimationFrame(()=>{repairQueued=false;try{repair();}catch(e){console.error('Snazzle Cards v210 repair',e);}});}
function loadAtlas(){
  const test=new Image();
  test.decoding='async';
  test.onload=()=>{ready=true;window.__snCardAtlasV210Loaded=true;queueRepair();[80,250,600,1200,2500].forEach(ms=>setTimeout(queueRepair,ms));};
  test.onerror=()=>{ready=false;window.__snCardAtlasV210Loaded=false;console.error('Snazzle Cards v210 JPEG kon niet laden — bestaande thumbnails blijven zichtbaar');};
  test.src=ATLAS;
}
function start(){
  installStyle();loadAtlas();
  if(!window.__snazzleCardV210Observer){const o=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queueRepair();});o.observe(document.body,{subtree:true,childList:true});window.__snazzleCardV210Observer=o;}
  if(!window.__snazzleCardV210Clicks){window.__snazzleCardV210Clicks=true;document.addEventListener('click',e=>{if(e.target.closest('#adminSheet,#collectionSheet,[data-tab],[data-collection-tab],[data-sc2edit]'))[0,80,250,600,1200].forEach(ms=>setTimeout(queueRepair,ms));},{passive:true});}
}
window.SnazzleCardFixedV205={version:VERSION,repair};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
console.info(`Snazzle Cards ${VERSION} geladen`);
