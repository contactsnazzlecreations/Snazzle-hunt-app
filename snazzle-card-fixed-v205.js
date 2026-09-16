// Snazzle Cards v226 — WILD/SPARK atlas stabiel zonder herstelstormen op mobiel.
// Alleen kaartgerelateerde DOM-wijzigingen starten nog een compacte herstelronde.
const VERSION='226.0-smooth-atlas';
const CARD_RE=/S01-([SW])(\d{2})/i;
const ATLASES=[
  './assets/cards/snazzle-cards-atlas-v209.jpg?v=225',
  './assets/cards/snazzle-cards-atlas-v210.jpg?v=225'
];
let ready=false,repairQueued=false,atlasIndex=0,lastRepairAt=0;

function cardIndex(number){
  const m=String(number||'').toUpperCase().match(CARD_RE);
  if(!m)return -1;
  const n=Number(m[2]);
  if(n<1||n>12)return -1;
  return m[1]==='S'?n-1:12+n-1;
}
function numberFromRow(row){return String(row?.querySelector('strong')?.textContent||row?.textContent||'').toUpperCase().match(CARD_RE)?.[0]||'';}
function numberFromCard(card){return String(card?.querySelector('.sc2-num')?.textContent||card?.textContent||'').toUpperCase().match(CARD_RE)?.[0]||'';}
function cardUiExists(){return !!document.querySelector('#sc2List,#sc2Grid,#sc2VaultGrid');}

function installStyle(){
  let s=document.getElementById('snCardFixedV205Style');
  if(!s){s=document.createElement('style');s.id='snCardFixedV205Style';document.head.appendChild(s);}
  s.textContent=`
    #sc2List .sc2-row{grid-template-columns:72px 1fr!important;column-gap:12px!important}
    #sc2List .sc2-thumb{width:72px!important;height:120px!important;overflow:hidden!important;position:relative!important;border-radius:11px!important;background:#17242e!important}
    #sc2List .sc2-thumb>.sn-v213-art,#sc2Grid .sc2-media>.sn-v213-art,#sc2VaultGrid .sc2-media>.sn-v213-art{display:none!important}
    #sc2List .sc2-thumb.sn-v217-ready>img:not(.sn-card-atlas-v217),#sc2Grid .sc2-media.sn-v217-ready>img:not(.sn-card-atlas-v217),#sc2VaultGrid .sc2-media.sn-v217-ready>img:not(.sn-card-atlas-v217){opacity:0!important;visibility:hidden!important}
    #sc2List .sc2-thumb>img.sn-card-atlas-v217{position:absolute!important;inset:0!important;z-index:30!important;width:100%!important;height:100%!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important;background:#17242e!important;display:block!important}
    #sc2Grid .sc2-media>img.sn-card-atlas-v217,#sc2VaultGrid .sc2-media>img.sn-card-atlas-v217{position:absolute!important;inset:0!important;z-index:30!important;width:100%!important;height:100%!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important;background:#17242e!important;display:block!important}
    #sc2Grid .sc2-media.sn-v217-ready .sc2-lock,#sc2VaultGrid .sc2-media.sn-v217-ready .sc2-lock{z-index:35!important}
    #sc2Grid .sc2-media.sn-v217-ready .sc2-rarity,#sc2Grid .sc2-media.sn-v217-ready .sc2-num,#sc2VaultGrid .sc2-media.sn-v217-ready .sc2-rarity,#sc2VaultGrid .sc2-media.sn-v217-ready .sc2-num{z-index:36!important}
  `;
}

function cleanOld(box){
  if(!box)return;
  box.classList.remove('sn-atlas-ready-v210','sn-v213-ready');
  box.style.removeProperty('background-image');
  box.querySelectorAll(':scope > .sn-v213-art,:scope > .sn-fixed-card-v205,:scope > .sn-card-viewport-v208,:scope > img.sn-card-atlas-v209,:scope > img.sn-card-atlas-v210').forEach(el=>el.remove());
}

function setAtlasImage(box,number,isCollection=false){
  if(!ready||!box)return false;
  const index=cardIndex(number);if(index<0)return false;
  const atlas=window.__snCardAtlasV217;if(!atlas?.naturalWidth||!atlas?.naturalHeight)return false;
  const col=index%6,row=Math.floor(index/6);
  cleanOld(box);
  if(isCollection)box.style.aspectRatio='3 / 5';
  let img=box.querySelector(':scope > img.sn-card-atlas-v217');
  if(!img){img=document.createElement('img');img.className='sn-card-atlas-v217';img.alt=number;box.appendChild(img);}
  const w=Math.max(72,box.clientWidth||72),h=Math.max(120,box.clientHeight||120);
  const canvas=document.createElement('canvas');
  const dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
  const ctx=canvas.getContext('2d');if(!ctx)return false;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle='#17242e';ctx.fillRect(0,0,canvas.width,canvas.height);
  const cellW=atlas.naturalWidth/6,cellH=atlas.naturalHeight/4;
  ctx.drawImage(atlas,col*cellW,row*cellH,cellW,cellH,0,0,canvas.width,canvas.height);
  img.src=canvas.toDataURL('image/jpeg',0.9);
  img.dataset.cardNumber=number;
  box.dataset.snCardNumberV217=number;
  box.classList.add('sn-v217-ready');
  return true;
}

function repair(){
  installStyle();if(!ready||!cardUiExists())return 0;let count=0;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const n=numberFromRow(row),box=row.querySelector('.sc2-thumb');if(!n||!box)return;
    const old=box.querySelector(':scope > img.sn-card-atlas-v217');
    if(old?.dataset.cardNumber===n){cleanOldArtifactsOnly(box);return;}
    if(setAtlasImage(box,n,false))count++;
  });
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const n=numberFromCard(card),box=card.querySelector('.sc2-media');if(!n||!box)return;
    const old=box.querySelector(':scope > img.sn-card-atlas-v217');
    if(old?.dataset.cardNumber===n){cleanOldArtifactsOnly(box);return;}
    if(setAtlasImage(box,n,true))count++;
  });
  lastRepairAt=performance.now();
  return count;
}
function cleanOldArtifactsOnly(box){
  box?.querySelectorAll(':scope > .sn-v213-art,:scope > .sn-fixed-card-v205,:scope > .sn-card-viewport-v208,:scope > img.sn-card-atlas-v209,:scope > img.sn-card-atlas-v210').forEach(el=>el.remove());
  box?.classList.remove('sn-atlas-ready-v210','sn-v213-ready');
}
function queueRepair(force=false){
  if(repairQueued||!cardUiExists())return;
  const elapsed=performance.now()-lastRepairAt;
  if(!force&&elapsed<90){setTimeout(()=>queueRepair(true),Math.ceil(90-elapsed));return;}
  repairQueued=true;
  requestAnimationFrame(()=>{repairQueued=false;try{repair();}catch(e){console.error('Snazzle Cards v226 repair',e);}});
}
function mutationTouchesCards(mutations){
  return mutations.some(m=>{
    const target=m.target instanceof Element?m.target:null;
    if(target?.closest?.('#sc2List,#sc2Grid,#sc2VaultGrid'))return true;
    return [...m.addedNodes].some(node=>node instanceof Element&&(node.matches?.('#sc2List,#sc2Grid,#sc2VaultGrid,.sc2-row,.sc2-card,.sc2-media,.sc2-thumb')||node.querySelector?.('#sc2List,#sc2Grid,#sc2VaultGrid,.sc2-row,.sc2-card')));
  });
}

function loadAtlas(){
  const src=ATLASES[atlasIndex];
  const atlas=new Image();atlas.decoding='async';
  atlas.onload=()=>{
    if(atlas.naturalWidth<6||atlas.naturalHeight<4){return tryNextAtlas('ongeldige atlasmaat');}
    window.__snCardAtlasV217=atlas;ready=true;window.__snCardAtlasV217Loaded=src;
    queueRepair(true);
    setTimeout(()=>queueRepair(true),450);
  };
  atlas.onerror=()=>tryNextAtlas('atlas kon niet laden');
  atlas.src=src;
}
function tryNextAtlas(reason){
  ready=false;atlasIndex++;
  if(atlasIndex<ATLASES.length){console.warn(`Snazzle Cards v226: ${reason}, reserve-atlas proberen`);loadAtlas();}
  else console.error('Snazzle Cards v226: geen kaartatlas kon worden geladen');
}

function start(){
  installStyle();loadAtlas();
  if(!window.__snazzleCardV217Observer){
    const o=new MutationObserver(ms=>{if(mutationTouchesCards(ms))queueRepair();});
    o.observe(document.body,{subtree:true,childList:true});window.__snazzleCardV217Observer=o;
  }
  if(!window.__snazzleCardV217Clicks){
    window.__snazzleCardV217Clicks=true;
    document.addEventListener('click',e=>{
      if(!e.target.closest('#collectionSheet,[data-collection-tab],[data-sc2edit],#sc2List,#sc2Grid,#sc2VaultGrid'))return;
      queueRepair();setTimeout(()=>queueRepair(true),260);
    },{passive:true});
  }
  document.addEventListener('snazzle:cards-repaired',()=>{queueRepair();setTimeout(()=>queueRepair(true),320);});
}
window.SnazzleCardFixedV205={version:VERSION,repair};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
console.info(`Snazzle Cards ${VERSION} geladen`);
