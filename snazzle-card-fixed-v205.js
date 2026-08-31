// Snazzle Cards v209 — stabiele kaartweergave vanuit één echt JPEG-bestand in de repo.
// Geen data-URI, canvas of sheet-JS meer. De 24 kaarten staan exact in een 6x4 atlas.
const VERSION='209.0-stable-repo-atlas';
const CARD_RE=/S01-([SW])(\d{2})/i;
const ATLAS='./assets/cards/snazzle-cards-atlas-v209.jpg?v=209';
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
    #sc2List .sc2-thumb{width:72px!important;height:120px!important;overflow:hidden!important;position:relative!important;border-radius:11px!important;background:#17242e!important}
    #sc2List .sc2-thumb>img{width:100%!important;height:100%!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important;background:#17242e!important}
    #sc2Grid .sc2-media>img,#sc2VaultGrid .sc2-media>img{width:100%!important;height:100%!important;object-fit:contain!important;background:#17242e!important}
  `;
}
function setAtlasImage(box,number){
  if(!ready||!box)return false;
  const index=cardIndex(number);if(index<0)return false;
  const col=index%6,row=Math.floor(index/6);
  let img=box.querySelector(':scope > img.sn-card-atlas-v209');
  if(!img){
    box.querySelectorAll(':scope > .sn-fixed-card-v205,:scope > .sn-card-viewport-v208').forEach(el=>el.remove());
    img=document.createElement('img');img.className='sn-card-atlas-v209';img.alt='';box.appendChild(img);
  }
  const w=box.clientWidth||72,h=box.clientHeight||120;
  const canvas=document.createElement('canvas');
  const dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.fillStyle='#17242e';ctx.fillRect(0,0,canvas.width,canvas.height);
  const atlas=window.__snCardAtlasV209;
  const cellW=atlas.naturalWidth/6,cellH=atlas.naturalHeight/4;
  const sx=col*cellW,sy=row*cellH;
  ctx.drawImage(atlas,sx,sy,cellW,cellH,0,0,canvas.width,canvas.height);
  img.src=canvas.toDataURL('image/jpeg',0.92);
  img.dataset.cardNumber=number;
  return true;
}
function repair(){
  installStyle();if(!ready)return 0;let count=0;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{const n=numberFromRow(row),box=row.querySelector('.sc2-thumb');const old=box?.querySelector(':scope > img.sn-card-atlas-v209');if(old?.dataset.cardNumber===n)return;if(n&&setAtlasImage(box,n))count++;});
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{const n=numberFromCard(card),box=card.querySelector('.sc2-media');const old=box?.querySelector(':scope > img.sn-card-atlas-v209');if(old?.dataset.cardNumber===n)return;if(n&&setAtlasImage(box,n))count++;});
  return count;
}
function queueRepair(){if(repairQueued)return;repairQueued=true;requestAnimationFrame(()=>{repairQueued=false;try{repair();}catch(e){console.error('Snazzle Cards v209 repair',e);}});}
function loadAtlas(){
  const atlas=new Image();
  atlas.decoding='async';
  atlas.onload=()=>{window.__snCardAtlasV209=atlas;ready=true;queueRepair();[80,250,600,1200].forEach(ms=>setTimeout(queueRepair,ms));};
  atlas.onerror=()=>{ready=false;console.error('Snazzle Cards v209 atlas kon niet laden');};
  atlas.src=ATLAS;
}
function start(){
  installStyle();loadAtlas();
  if(!window.__snazzleCardV209Observer){const o=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queueRepair();});o.observe(document.body,{subtree:true,childList:true});window.__snazzleCardV209Observer=o;}
  document.addEventListener('click',e=>{if(e.target.closest('#adminSheet,#collectionSheet,[data-tab],[data-collection-tab]'))[0,80,250,600].forEach(ms=>setTimeout(queueRepair,ms));},{passive:true});
}
window.SnazzleCardFixedV205={version:VERSION,repair};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
console.info(`Snazzle Cards ${VERSION} geladen`);
