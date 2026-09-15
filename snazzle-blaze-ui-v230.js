// Snazzle BLAZE UI v230 — robuuste renderer met remote fallback, los van localStorage imageData.
const VERSION='230.0';
const ATLAS_SOURCES=[
  'https://raw.githubusercontent.com/contactsnazzlecreations/Snazzle-hunt-app/main/assets/cards/snazzle-blaze-atlas-v229.b64?raw=1',
  './assets/cards/snazzle-blaze-atlas-v229.b64?v=230'
];
let atlasSrc='',queued=false,loading=null;

function blazeIndex(text){
  const m=String(text||'').toUpperCase().match(/S01-B(\d{2})/);
  if(!m)return-1;
  const i=Number(m[1])-1;
  return i>=0&&i<12?i:-1;
}

function decodeOkay(src){
  return new Promise((resolve,reject)=>{
    const im=new Image();
    im.onload=()=>resolve(true);
    im.onerror=()=>reject(new Error('BLAZE atlas decode mislukt'));
    im.src=src;
  });
}

async function loadAtlas(){
  if(atlasSrc)return atlasSrc;
  if(loading)return loading;
  loading=(async()=>{
    let lastErr=null;
    for(const url of ATLAS_SOURCES){
      try{
        const r=await fetch(url,{cache:'no-store',credentials:'omit',mode:url.startsWith('http')?'cors':'same-origin'});
        if(!r.ok)throw new Error(`HTTP ${r.status}`);
        const b=(await r.text()).replace(/\s+/g,'');
        if(!b.startsWith('/9j/'))throw new Error('geen geldige JPEG-base64');
        const src=`data:image/jpeg;base64,${b}`;
        await decodeOkay(src);
        atlasSrc=src;
        window.__snazzleBlazeAtlasV230={ok:true,source:url,length:b.length,at:new Date().toISOString()};
        return src;
      }catch(e){lastErr=e;console.warn('BLAZE v230 atlasbron mislukt',url,e)}
    }
    window.__snazzleBlazeAtlasV230={ok:false,error:String(lastErr||'onbekend'),at:new Date().toISOString()};
    throw lastErr||new Error('BLAZE atlas kon niet laden');
  })();
  return loading;
}

function installStyle(){
  let s=document.getElementById('snBlazeUiV230Style');
  if(!s){s=document.createElement('style');s.id='snBlazeUiV230Style';document.head.appendChild(s)}
  s.textContent=`
    #sc2Grid .sc2-card[data-blaze-v230='1'] .sc2-media,
    #sc2VaultGrid .sc2-card[data-blaze-v230='1'] .sc2-media,
    #sc2List .sc2-row[data-blaze-v230='1'] .sc2-thumb{
      position:relative!important;overflow:hidden!important;background:#160d08!important;
    }
    .sn-blaze-v230-art{
      position:absolute!important;inset:0!important;z-index:70!important;overflow:hidden!important;
      display:block!important;background:#160d08!important;pointer-events:none!important;
      transform-origin:center center!important;
    }
    .sn-blaze-v230-art>img{
      position:absolute!important;width:400%!important;height:300%!important;max-width:none!important;
      display:block!important;opacity:1!important;visibility:visible!important;object-fit:fill!important;
      filter:none!important;transform:none!important;
    }
    #sc2Grid .sc2-card.locked[data-blaze-v230='1'] .sn-blaze-v230-art,
    #sc2VaultGrid .sc2-card.locked[data-blaze-v230='1'] .sn-blaze-v230-art{
      filter:brightness(.46) saturate(.68) blur(3.2px)!important;transform:scale(1.065)!important;
    }
    #sc2Grid .sc2-card.unlocked[data-blaze-v230='1'] .sn-blaze-v230-art,
    #sc2VaultGrid .sc2-card.unlocked[data-blaze-v230='1'] .sn-blaze-v230-art{
      filter:none!important;transform:none!important;
    }
    #sc2Grid .sc2-card[data-blaze-v230='1'] .sc2-lock,
    #sc2VaultGrid .sc2-card[data-blaze-v230='1'] .sc2-lock{z-index:90!important;color:#ffe15a!important;text-shadow:0 3px 12px #000!important}
    #sc2Grid .sc2-card[data-blaze-v230='1'] .sc2-rarity,
    #sc2Grid .sc2-card[data-blaze-v230='1'] .sc2-num,
    #sc2VaultGrid .sc2-card[data-blaze-v230='1'] .sc2-rarity,
    #sc2VaultGrid .sc2-card[data-blaze-v230='1'] .sc2-num{z-index:91!important}
    #sc2List .sc2-row[data-blaze-v230='1'] .sn-blaze-v230-art{filter:none!important;transform:none!important}
  `;
}

function hideDuckPlaceholder(box){
  if(!box)return;
  [...box.children].forEach(el=>{
    if(el.classList?.contains('sn-blaze-v230-art'))return;
    const txt=(el.textContent||'').trim();
    if(txt==='🦆'||txt.includes('🦆'))el.style.setProperty('display','none','important');
  });
  box.querySelectorAll(':scope > img').forEach(img=>{
    if(!img.classList.contains('sn-blaze-v230-base'))img.style.setProperty('visibility','hidden','important');
  });
}

function ensureArt(box,i){
  if(!box||!atlasSrc)return false;
  hideDuckPlaceholder(box);
  box.querySelectorAll(':scope > .sn-blaze-v228-art,:scope > .sn-blaze-v229-art').forEach(el=>el.remove());
  let wrap=box.querySelector(':scope > .sn-blaze-v230-art');
  if(!wrap){
    wrap=document.createElement('div');wrap.className='sn-blaze-v230-art';
    const img=document.createElement('img');wrap.appendChild(img);box.appendChild(wrap);
  }
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
  installStyle();
  if(!atlasSrc){loadAtlas().then(()=>queue()).catch(e=>console.error('BLAZE v230 atlas definitief mislukt',e));return 0}
  let count=0;
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const i=blazeIndex(card.querySelector('.sc2-num')?.textContent||card.textContent);if(i<0)return;
    card.dataset.blazeV230='1';
    const box=card.querySelector('.sc2-media');if(!box)return;
    if(ensureArt(box,i))count++;
    const lock=box.querySelector('.sc2-lock');
    if(lock)lock.style.setProperty('display',card.classList.contains('locked')?'grid':'none','important');
    box.querySelector('.sc2-rarity')?.style.setProperty('z-index','91','important');
    box.querySelector('.sc2-num')?.style.setProperty('z-index','91','important');
  });
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const i=blazeIndex(row.querySelector('strong')?.textContent||row.textContent);if(i<0)return;
    row.dataset.blazeV230='1';
    if(ensureArt(row.querySelector('.sc2-thumb'),i))count++;
  });
  window.__snazzleBlazeUiV230={count,atlas:true,at:new Date().toISOString()};
  return count;
}

function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{repair()}catch(e){console.error('BLAZE/UI v230 repair',e)}})}
installStyle();
loadAtlas().then(queue).catch(e=>console.error('BLAZE/UI v230 kon atlas niet laden',e));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queue()}).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',e=>{if(e.target.closest('#collectionSheet,#adminSheet,[data-seriespick],[data-sc2f],[data-tab],[data-collection-tab]'))[0,50,140,300,650,1200].forEach(ms=>setTimeout(queue,ms))},{passive:true});
document.addEventListener('snazzle:blaze-ready',queue);
[0,100,250,600,1200,2400,5000,9000].forEach(ms=>setTimeout(queue,ms));
window.SnazzleBlazeUiV230={version:VERSION,repair,loadAtlas};
console.info(`Snazzle BLAZE/UI ${VERSION} geladen`);
