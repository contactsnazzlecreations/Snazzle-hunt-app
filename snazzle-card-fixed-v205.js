// Snazzle Cards v213 — vaste weergave van de 24 originele SPARK/WILD-kaarten.
// Geen extern JPEG-bestand, geen canvas en geen opgeslagen foutieve imageData voor deze 24 kaarten.
import ATLAS from './snazzle-card-atlas-v213.js?v=213';

const VERSION='213.0-verified-original-atlas';
const CARD_RE=/S01-([SW])(\d{2})/i;
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
    #sc2List .sc2-thumb{width:72px!important;height:120px!important;position:relative!important;overflow:hidden!important;border-radius:11px!important;background:#17242e!important}
    .sn-v213-art{position:absolute!important;inset:0!important;display:block!important;z-index:20!important;background-repeat:no-repeat!important;pointer-events:none!important}
    #sc2List .sc2-thumb.sn-v213-ready>img{opacity:0!important;visibility:hidden!important}
    #sc2Grid .sc2-media.sn-v213-ready>img,#sc2VaultGrid .sc2-media.sn-v213-ready>img{opacity:0!important;visibility:hidden!important}
  `;
}
function paint(box,number,isCollection=false){
  if(!ready||!box)return false;
  const index=cardIndex(number); if(index<0)return false;
  const col=index%6,row=Math.floor(index/6);
  box.classList.remove('sn-atlas-ready-v210');
  box.style.removeProperty('background-image');
  if(isCollection)box.style.aspectRatio='3 / 5';
  let art=box.querySelector(':scope > .sn-v213-art');
  if(!art){art=document.createElement('span');art.className='sn-v213-art';box.appendChild(art);}
  art.style.backgroundImage=`url("${ATLAS}")`;
  art.style.backgroundSize='600% 400%';
  art.style.backgroundPosition=`${(col/5)*100}% ${(row/3)*100}%`;
  art.dataset.cardNumber=number;
  box.dataset.snCardNumberV213=number;
  box.classList.add('sn-v213-ready');
  return true;
}
function repair(){
  installStyle(); if(!ready)return 0; let count=0;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const n=numberFromRow(row),box=row.querySelector('.sc2-thumb');
    if(!n||!box)return;
    const art=box.querySelector(':scope > .sn-v213-art');
    if(art?.dataset.cardNumber===n)return;
    if(paint(box,n,false))count++;
  });
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const n=numberFromCard(card),box=card.querySelector('.sc2-media');
    if(!n||!box)return;
    const art=box.querySelector(':scope > .sn-v213-art');
    if(art?.dataset.cardNumber===n)return;
    if(paint(box,n,true))count++;
  });
  return count;
}
function queueRepair(){
  if(repairQueued)return; repairQueued=true;
  requestAnimationFrame(()=>{repairQueued=false;try{repair();}catch(e){console.error('Snazzle Cards v213 repair',e);}});
}
function loadAtlas(){
  const test=new Image();
  test.decoding='async';
  test.onload=()=>{
    if(test.naturalWidth!==144||test.naturalHeight!==160){console.error('Snazzle Cards v213: onverwachte atlasmaat',test.naturalWidth,test.naturalHeight);return;}
    ready=true; window.__snCardAtlasV213Loaded=true; queueRepair();
    [80,250,600,1200,2500].forEach(ms=>setTimeout(queueRepair,ms));
  };
  test.onerror=()=>{ready=false;window.__snCardAtlasV213Loaded=false;console.error('Snazzle Cards v213 atlas kon niet laden');};
  test.src=ATLAS;
}
function start(){
  installStyle();loadAtlas();
  if(!window.__snazzleCardV213Observer){
    const o=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queueRepair();});
    o.observe(document.body,{subtree:true,childList:true});window.__snazzleCardV213Observer=o;
  }
  if(!window.__snazzleCardV213Clicks){
    window.__snazzleCardV213Clicks=true;
    document.addEventListener('click',e=>{if(e.target.closest('#adminSheet,#collectionSheet,[data-tab],[data-collection-tab],[data-sc2edit]'))[0,80,250,600,1200].forEach(ms=>setTimeout(queueRepair,ms));},{passive:true});
  }
}
window.SnazzleCardFixedV205={version:VERSION,repair};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
console.info(`Snazzle Cards ${VERSION} geladen`);
