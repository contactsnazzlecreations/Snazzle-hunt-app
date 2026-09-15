// Snazzle MYSTIC/UI v227 — echte MYSTIC-artwork uit een geverifieerde atlas + vast kaartenmenu.
const VERSION='227.0';
const ATLAS='./assets/cards/snazzle-mystic-atlas-v219.jpg?v=227';
let queued=false;

function mysticIndex(text){
  const m=String(text||'').toUpperCase().match(/S01-M(\d{2})/);
  if(!m)return -1;
  const i=Number(m[1])-1;
  return i>=0&&i<12?i:-1;
}

function installStyle(){
  let s=document.getElementById('snMysticUiV227Style');
  if(!s){s=document.createElement('style');s.id='snMysticUiV227Style';document.head.appendChild(s)}
  s.textContent=`
    #collectionSheet .collection-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
    #collectionSheet .collection-tabs>button[data-sn-v227-hidden='1']{display:none!important}

    #sc2Grid .sc2-card[data-mystic-v227='1'] .sc2-media,
    #sc2VaultGrid .sc2-card[data-mystic-v227='1'] .sc2-media,
    #sc2List .sc2-row[data-mystic-v227='1'] .sc2-thumb{
      position:relative!important;overflow:hidden!important;background:#171326!important;
    }
    .sn-mystic-v227-art{position:absolute!important;inset:0!important;z-index:70!important;overflow:hidden!important;display:block!important;background:#171326!important;pointer-events:none!important;transform-origin:center center!important}
    .sn-mystic-v227-art>img{position:absolute!important;width:400%!important;height:300%!important;max-width:none!important;display:block!important;opacity:1!important;visibility:visible!important;object-fit:fill!important;filter:none!important;transform:none!important}
    #sc2Grid .sc2-card.locked[data-mystic-v227='1'] .sn-mystic-v227-art,
    #sc2VaultGrid .sc2-card.locked[data-mystic-v227='1'] .sn-mystic-v227-art{
      filter:brightness(.46) saturate(.68) blur(3.2px)!important;transform:scale(1.065)!important;
    }
    #sc2Grid .sc2-card.unlocked[data-mystic-v227='1'] .sn-mystic-v227-art,
    #sc2VaultGrid .sc2-card.unlocked[data-mystic-v227='1'] .sn-mystic-v227-art{filter:none!important;transform:none!important}
    #sc2Grid .sc2-card[data-mystic-v227='1'] .sc2-lock,
    #sc2VaultGrid .sc2-card[data-mystic-v227='1'] .sc2-lock{z-index:90!important;color:#ffe15a!important;text-shadow:0 3px 12px #000!important}
    #sc2Grid .sc2-card[data-mystic-v227='1'] .sc2-rarity,
    #sc2Grid .sc2-card[data-mystic-v227='1'] .sc2-num,
    #sc2VaultGrid .sc2-card[data-mystic-v227='1'] .sc2-rarity,
    #sc2VaultGrid .sc2-card[data-mystic-v227='1'] .sc2-num{z-index:91!important}
    #sc2List .sc2-row[data-mystic-v227='1'] .sn-mystic-v227-art{filter:none!important;transform:none!important}
  `;
}

function fixTopMenu(){
  const tabs=document.querySelector('#collectionSheet .collection-tabs');
  if(!tabs)return;
  const buttons=[...tabs.querySelectorAll('button')];
  let year=buttons.find(b=>/jaarstand|jaar|klassement/i.test(b.textContent||''));
  let vault=buttons.find(b=>b.dataset.collectionTab==='vault'||/vault/i.test(b.textContent||''));
  if(year)year.textContent='🏆 Jaarstand';
  if(vault)vault.textContent='🔐 Vault';
  if(year&&vault){
    buttons.forEach(b=>{
      if(b===year||b===vault)b.removeAttribute('data-sn-v227-hidden');
      else b.dataset.snV227Hidden='1';
    });
  }
}

function cleanBox(box){
  if(!box)return;
  box.querySelectorAll(':scope > img').forEach(el=>el.remove());
  box.querySelectorAll(':scope > div').forEach(el=>{
    if(!el.classList.contains('sn-mystic-v227-art'))el.remove();
  });
  box.querySelectorAll(':scope > .sn-mystic-v221-art,:scope > .sn-mystic-v222-art,:scope > .sn-mystic-v223-sprite,:scope > .sn-mystic-v224-clip').forEach(el=>el.remove());
}

function ensureArt(box,i){
  if(!box)return false;
  cleanBox(box);
  let wrap=box.querySelector(':scope > .sn-mystic-v227-art');
  if(!wrap){
    wrap=document.createElement('div');wrap.className='sn-mystic-v227-art';
    const img=document.createElement('img');img.src=ATLAS;img.alt=`S01-M${String(i+1).padStart(2,'0')}`;
    wrap.appendChild(img);box.appendChild(wrap);
  }
  const img=wrap.querySelector('img');
  if(img.src!==new URL(ATLAS,location.href).href)img.src=ATLAS;
  const col=i%4,row=Math.floor(i/4);
  img.style.setProperty('left',`${-col*100}%`,'important');
  img.style.setProperty('top',`${-row*100}%`,'important');
  wrap.dataset.card=`S01-M${String(i+1).padStart(2,'0')}`;
  return true;
}

function repair(){
  installStyle();fixTopMenu();let count=0;
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const i=mysticIndex(card.querySelector('.sc2-num')?.textContent||card.textContent);if(i<0)return;
    card.dataset.mysticV227='1';
    const box=card.querySelector('.sc2-media');if(!box)return;
    if(ensureArt(box,i))count++;
    const lock=box.querySelector('.sc2-lock');
    if(lock)lock.style.setProperty('display',card.classList.contains('locked')?'grid':'none','important');
    box.querySelector('.sc2-rarity')?.style.setProperty('z-index','91','important');
    box.querySelector('.sc2-num')?.style.setProperty('z-index','91','important');
  });
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const i=mysticIndex(row.querySelector('strong')?.textContent||row.textContent);if(i<0)return;
    row.dataset.mysticV227='1';if(ensureArt(row.querySelector('.sc2-thumb'),i))count++;
  });
  window.__snazzleMysticUiV227={count,at:new Date().toISOString()};
  return count;
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{repair()}catch(e){console.error('MYSTIC/UI v227 repair',e)}})}

installStyle();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queue()}).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',e=>{if(e.target.closest('#collectionSheet,#adminSheet,[data-seriespick],[data-sc2f],[data-tab],[data-collection-tab]'))[0,60,180,420,900].forEach(ms=>setTimeout(queue,ms))},{passive:true});
document.addEventListener('snazzle:admin-ui-ready',queue);
document.addEventListener('snazzle:mystic-ready',queue);
[0,100,250,600,1200,2400,5000,9000].forEach(ms=>setTimeout(queue,ms));
window.SnazzleMysticUiV227={version:VERSION,repair};
console.info(`Snazzle MYSTIC/UI ${VERSION} geladen`);
