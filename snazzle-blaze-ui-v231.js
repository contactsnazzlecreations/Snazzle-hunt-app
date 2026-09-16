// Snazzle BLAZE/UI v233 — atlasrenderer met gerichte, lichte reparaties.
const VERSION='233.0-smooth';
const ATLAS='./assets/cards/snazzle-blaze-atlas-v231.jpg?v=232';
let queued=false,lastRepairAt=0;

function blazeIndex(text){
  const m=String(text||'').toUpperCase().match(/S01-B(\d{2})/);
  if(!m)return -1;
  const i=Number(m[1])-1;
  return i>=0&&i<12?i:-1;
}
function cardUiExists(){return !!document.querySelector('#collectionSheet,#sc2Grid,#sc2VaultGrid,#sc2List');}

function installStyle(){
  let s=document.getElementById('snBlazeUiV232Style');
  if(!s){s=document.createElement('style');s.id='snBlazeUiV232Style';document.head.appendChild(s)}
  s.textContent=`
    #sc2Grid .sc2-card[data-blaze-v232='1'] .sc2-media,#sc2VaultGrid .sc2-card[data-blaze-v232='1'] .sc2-media,#sc2List .sc2-row[data-blaze-v232='1'] .sc2-thumb{position:relative!important;overflow:hidden!important;background:#171326!important}
    .sn-blaze-v232-art{position:absolute!important;inset:0!important;z-index:70!important;overflow:hidden!important;display:block!important;background:#171326!important;pointer-events:none!important;transform-origin:center center!important}
    .sn-blaze-v232-art>img{position:absolute!important;width:400%!important;height:300%!important;max-width:none!important;display:block!important;opacity:1!important;visibility:visible!important;object-fit:fill!important;filter:none!important;transform:none!important}
    #sc2Grid .sc2-card.locked[data-blaze-v232='1'] .sn-blaze-v232-art,#sc2VaultGrid .sc2-card.locked[data-blaze-v232='1'] .sn-blaze-v232-art{filter:brightness(.46) saturate(.68) blur(3.2px)!important;transform:scale(1.065)!important}
    #sc2Grid .sc2-card.unlocked[data-blaze-v232='1'] .sn-blaze-v232-art,#sc2VaultGrid .sc2-card.unlocked[data-blaze-v232='1'] .sn-blaze-v232-art{filter:none!important;transform:none!important}
    #sc2Grid .sc2-card[data-blaze-v232='1'] .sc2-lock,#sc2VaultGrid .sc2-card[data-blaze-v232='1'] .sc2-lock{z-index:90!important;color:#ffe15a!important;text-shadow:0 3px 12px #000!important}
    #sc2Grid .sc2-card[data-blaze-v232='1'] .sc2-rarity,#sc2Grid .sc2-card[data-blaze-v232='1'] .sc2-num,#sc2VaultGrid .sc2-card[data-blaze-v232='1'] .sc2-rarity,#sc2VaultGrid .sc2-card[data-blaze-v232='1'] .sc2-num{z-index:91!important}
    #sc2List .sc2-row[data-blaze-v232='1'] .sn-blaze-v232-art{filter:none!important;transform:none!important}
  `;
}

function cleanBox(box){
  if(!box)return;
  box.querySelectorAll(':scope > img.sn-card-atlas-v217,:scope > img.sn-card-atlas-v209,:scope > img.sn-card-atlas-v210').forEach(el=>el.remove());
  box.querySelectorAll(':scope > .sn-blaze-v228-art,:scope > .sn-blaze-v229-art,:scope > .sn-blaze-v230-art,:scope > .sn-blaze-v231-art').forEach(el=>el.remove());
  [...box.children].forEach(el=>{
    const txt=(el.textContent||'').trim();
    if(txt==='🦆'||txt.includes('🦆'))el.style.setProperty('display','none','important');
  });
}

function ensureArt(box,i){
  if(!box)return false;
  cleanBox(box);
  let wrap=box.querySelector(':scope > .sn-blaze-v232-art');
  if(!wrap){
    wrap=document.createElement('div');wrap.className='sn-blaze-v232-art';
    const img=document.createElement('img');img.src=ATLAS;img.alt=`S01-B${String(i+1).padStart(2,'0')}`;
    wrap.appendChild(img);box.appendChild(wrap);
  }
  const img=wrap.querySelector('img');
  const expected=new URL(ATLAS,location.href).href;
  if(img.src!==expected)img.src=ATLAS;
  const col=i%4,row=Math.floor(i/4);
  img.style.setProperty('left',`${-col*100}%`,'important');
  img.style.setProperty('top',`${-row*100}%`,'important');
  wrap.dataset.card=`S01-B${String(i+1).padStart(2,'0')}`;
  return true;
}

function repair(){
  installStyle();if(!cardUiExists())return 0;let count=0;
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const i=blazeIndex(card.querySelector('.sc2-num')?.textContent||card.textContent);if(i<0)return;
    card.dataset.blazeV232='1';
    const box=card.querySelector('.sc2-media');if(!box)return;
    if(ensureArt(box,i))count++;
    const lock=box.querySelector('.sc2-lock');if(lock)lock.style.setProperty('display',card.classList.contains('locked')?'grid':'none','important');
    box.querySelector('.sc2-rarity')?.style.setProperty('z-index','91','important');
    box.querySelector('.sc2-num')?.style.setProperty('z-index','91','important');
  });
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const i=blazeIndex(row.querySelector('strong')?.textContent||row.textContent);if(i<0)return;
    row.dataset.blazeV232='1';if(ensureArt(row.querySelector('.sc2-thumb'),i))count++;
  });
  lastRepairAt=performance.now();
  window.__snazzleBlazeUiV232={count,at:new Date().toISOString()};
  return count;
}
function queue(force=false){
  if(queued||!cardUiExists())return;
  const elapsed=performance.now()-lastRepairAt;
  if(!force&&elapsed<90){setTimeout(()=>queue(true),Math.ceil(90-elapsed));return;}
  queued=true;requestAnimationFrame(()=>{queued=false;try{repair()}catch(e){console.error('BLAZE/UI v233 repair',e)}});
}
function relevantMutation(m){
  const target=m.target instanceof Element?m.target:null;
  if(target?.closest?.('#collectionSheet,#sc2Grid,#sc2VaultGrid,#sc2List'))return true;
  return [...m.addedNodes].some(n=>n instanceof Element&&(n.matches?.('#collectionSheet,#sc2Grid,#sc2VaultGrid,#sc2List,.sc2-card,.sc2-row')||n.querySelector?.('#collectionSheet,#sc2Grid,#sc2VaultGrid,#sc2List,.sc2-card,.sc2-row')));
}

installStyle();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queue(true),{once:true});else queue(true);
new MutationObserver(ms=>{if(ms.some(relevantMutation))queue()}).observe(document.body,{subtree:true,childList:true});
document.addEventListener('click',e=>{
  if(!e.target.closest('#collectionSheet,[data-seriespick],[data-sc2f],[data-collection-tab]'))return;
  queue();setTimeout(()=>queue(true),260);
},{passive:true});
document.addEventListener('snazzle:admin-ui-ready',()=>queue());
document.addEventListener('snazzle:blaze-ready',()=>{queue(true);setTimeout(()=>queue(true),300);});
setTimeout(()=>queue(true),500);
setTimeout(()=>queue(true),1400);
window.SnazzleBlazeUiV232={version:VERSION,repair};
window.SnazzleBlazeUiV231=window.SnazzleBlazeUiV232;
console.info(`Snazzle BLAZE/UI ${VERSION} geladen`);
