// Snazzle BLAZE/UI v231 — zelfde kaartprocedure als MYSTIC, met geldige BLAZE-atlas.
const VERSION='231.1';
const ATLAS_B64='./assets/cards/snazzle-blaze-atlas-v231.b64?v=2311';
let queued=false,atlasSrc='';

function blazeIndex(text){
  const m=String(text||'').toUpperCase().match(/S01-B(\d{2})/);
  if(!m)return -1;
  const i=Number(m[1])-1;
  return i>=0&&i<12?i:-1;
}

async function loadAtlas(){
  const r=await fetch(ATLAS_B64,{cache:'no-store'});
  if(!r.ok)throw new Error(`BLAZE atlas ${r.status}`);
  const b=(await r.text()).replace(/\s+/g,'');
  if(!b.startsWith('/9j/'))throw new Error('BLAZE atlas is geen geldige JPEG-base64');
  atlasSrc=`data:image/jpeg;base64,${b}`;
  await new Promise((ok,no)=>{const im=new Image();im.onload=ok;im.onerror=no;im.src=atlasSrc});
  return atlasSrc;
}

function installStyle(){
  let s=document.getElementById('snBlazeUiV231Style');
  if(!s){s=document.createElement('style');s.id='snBlazeUiV231Style';document.head.appendChild(s)}
  s.textContent=`
    #sc2Grid .sc2-card[data-blaze-v231='1'] .sc2-media,
    #sc2VaultGrid .sc2-card[data-blaze-v231='1'] .sc2-media,
    #sc2List .sc2-row[data-blaze-v231='1'] .sc2-thumb{position:relative!important;overflow:hidden!important;background:#171326!important}
    .sn-blaze-v231-art{position:absolute!important;inset:0!important;z-index:70!important;overflow:hidden!important;display:block!important;background:#171326!important;pointer-events:none!important;transform-origin:center center!important}
    .sn-blaze-v231-art>img{position:absolute!important;width:400%!important;height:300%!important;max-width:none!important;display:block!important;opacity:1!important;visibility:visible!important;object-fit:fill!important;filter:none!important;transform:none!important}
    #sc2Grid .sc2-card.locked[data-blaze-v231='1'] .sn-blaze-v231-art,#sc2VaultGrid .sc2-card.locked[data-blaze-v231='1'] .sn-blaze-v231-art{filter:brightness(.46) saturate(.68) blur(3.2px)!important;transform:scale(1.065)!important}
    #sc2Grid .sc2-card.unlocked[data-blaze-v231='1'] .sn-blaze-v231-art,#sc2VaultGrid .sc2-card.unlocked[data-blaze-v231='1'] .sn-blaze-v231-art{filter:none!important;transform:none!important}
    #sc2Grid .sc2-card[data-blaze-v231='1'] .sc2-lock,#sc2VaultGrid .sc2-card[data-blaze-v231='1'] .sc2-lock{z-index:90!important;color:#ffe15a!important;text-shadow:0 3px 12px #000!important}
    #sc2Grid .sc2-card[data-blaze-v231='1'] .sc2-rarity,#sc2Grid .sc2-card[data-blaze-v231='1'] .sc2-num,#sc2VaultGrid .sc2-card[data-blaze-v231='1'] .sc2-rarity,#sc2VaultGrid .sc2-card[data-blaze-v231='1'] .sc2-num{z-index:91!important}
    #sc2List .sc2-row[data-blaze-v231='1'] .sn-blaze-v231-art{filter:none!important;transform:none!important}
  `;
}

function cleanBox(box){
  if(!box)return;
  box.querySelectorAll(':scope > img').forEach(el=>el.remove());
  box.querySelectorAll(':scope > div').forEach(el=>{if(!el.classList.contains('sn-blaze-v231-art'))el.remove()});
  box.querySelectorAll(':scope > .sn-blaze-v228-art,:scope > .sn-blaze-v229-art,:scope > .sn-blaze-v230-art').forEach(el=>el.remove());
}

function ensureArt(box,i){
  if(!box||!atlasSrc)return false;
  cleanBox(box);
  let wrap=box.querySelector(':scope > .sn-blaze-v231-art');
  if(!wrap){wrap=document.createElement('div');wrap.className='sn-blaze-v231-art';const img=document.createElement('img');wrap.appendChild(img);box.appendChild(wrap)}
  const img=wrap.querySelector('img');
  if(img.src!==atlasSrc)img.src=atlasSrc;
  img.alt=`S01-B${String(i+1).padStart(2,'0')}`;
  const col=i%4,row=Math.floor(i/4);
  img.style.setProperty('left',`${-col*100}%`,'important');
  img.style.setProperty('top',`${-row*100}%`,'important');
  wrap.dataset.card=`S01-B${String(i+1).padStart(2,'0')}`;
  return true;
}

function repair(){
  installStyle();if(!atlasSrc)return 0;let count=0;
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const i=blazeIndex(card.querySelector('.sc2-num')?.textContent||card.textContent);if(i<0)return;
    card.dataset.blazeV231='1';const box=card.querySelector('.sc2-media');if(!box)return;
    if(ensureArt(box,i))count++;
    const lock=box.querySelector('.sc2-lock');if(lock)lock.style.setProperty('display',card.classList.contains('locked')?'grid':'none','important');
  });
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const i=blazeIndex(row.querySelector('strong')?.textContent||row.textContent);if(i<0)return;
    row.dataset.blazeV231='1';if(ensureArt(row.querySelector('.sc2-thumb'),i))count++;
  });
  window.__snazzleBlazeUiV231={count,atlas:true,at:new Date().toISOString()};return count;
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{repair()}catch(e){console.error('BLAZE/UI v231 repair',e)}})}

installStyle();
try{await loadAtlas()}catch(e){console.error('BLAZE/UI v231 atlas kon niet laden',e)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queue()}).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',e=>{if(e.target.closest('#collectionSheet,#adminSheet,[data-seriespick],[data-sc2f],[data-tab],[data-collection-tab]'))[0,60,180,420,900].forEach(ms=>setTimeout(queue,ms))},{passive:true});
document.addEventListener('snazzle:admin-ui-ready',queue);
document.addEventListener('snazzle:blaze-ready',queue);
[0,100,250,600,1200,2400,5000,9000].forEach(ms=>setTimeout(queue,ms));
window.SnazzleBlazeUiV231={version:VERSION,repair};
console.info(`Snazzle BLAZE/UI ${VERSION} geladen`);
