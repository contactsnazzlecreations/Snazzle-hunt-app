// Snazzle MYSTIC preview v222 — dezelfde wazige locked-preview als WILD/SPARK, met echte MYSTIC-art.
const VERSION='222.0';
const ATLAS='./assets/cards/snazzle-mystic-atlas-v219.jpg?v=222';
const CARD_RE=/^S01-M(\d{2})$/i;
let atlas=null,art=[],queued=false;

function indexFrom(text){const m=String(text||'').toUpperCase().match(/S01-M(\d{2})/);if(!m)return-1;const i=Number(m[1])-1;return i>=0&&i<12?i:-1;}
function installStyle(){
  let s=document.getElementById('snMysticPreviewV222Style');
  if(!s){s=document.createElement('style');s.id='snMysticPreviewV222Style';document.head.appendChild(s);}
  s.textContent=`
    #sc2Grid .sc2-card .sc2-media>img.sn-mystic-v222-art,
    #sc2VaultGrid .sc2-card .sc2-media>img.sn-mystic-v222-art{
      position:absolute!important;inset:0!important;z-index:80!important;width:100%!important;height:100%!important;
      object-fit:cover!important;opacity:1!important;visibility:visible!important;display:block!important;background:#1b1427!important;
    }
    #sc2Grid .sc2-card.unlocked .sc2-media>img.sn-mystic-v222-art,
    #sc2VaultGrid .sc2-card.unlocked .sc2-media>img.sn-mystic-v222-art{
      filter:none!important;transform:none!important;
    }
    #sc2Grid .sc2-card.locked .sc2-media>img.sn-mystic-v222-art,
    #sc2VaultGrid .sc2-card.locked .sc2-media>img.sn-mystic-v222-art{
      filter:brightness(.28) saturate(.72) blur(4px)!important;transform:scale(1.08)!important;
    }
    #sc2Grid .sc2-card[data-mystic-v222='1'] .sc2-media>.sc2-lock,
    #sc2VaultGrid .sc2-card[data-mystic-v222='1'] .sc2-media>.sc2-lock{z-index:95!important;color:#ffe15a!important;text-shadow:0 3px 12px #000!important}
    #sc2Grid .sc2-card[data-mystic-v222='1'] .sc2-media>.sc2-rarity,
    #sc2Grid .sc2-card[data-mystic-v222='1'] .sc2-media>.sc2-num,
    #sc2VaultGrid .sc2-card[data-mystic-v222='1'] .sc2-media>.sc2-rarity,
    #sc2VaultGrid .sc2-card[data-mystic-v222='1'] .sc2-media>.sc2-num{z-index:96!important}
    #sc2List .sc2-row[data-mystic-v222='1'] .sc2-thumb>img.sn-mystic-v222-art{
      position:absolute!important;inset:0!important;z-index:80!important;width:100%!important;height:100%!important;object-fit:cover!important;
      opacity:1!important;visibility:visible!important;display:block!important;filter:none!important;transform:none!important;background:#1b1427!important;
    }
    #sc2Grid .sc2-card[data-mystic-v222='1'] .sc2-media>img.sn-mystic-v221-art,
    #sc2VaultGrid .sc2-card[data-mystic-v222='1'] .sc2-media>img.sn-mystic-v221-art,
    #sc2List .sc2-row[data-mystic-v222='1'] .sc2-thumb>img.sn-mystic-v221-art{display:none!important}
  `;
}

function loadAtlas(){return new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';im.onload=()=>{try{atlas=im;const cw=im.naturalWidth/4,ch=im.naturalHeight/3;art=Array.from({length:12},(_,i)=>{const c=document.createElement('canvas');c.width=360;c.height=480;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,360,480);return c.toDataURL('image/jpeg',.86)});resolve()}catch(e){reject(e)}};im.onerror=reject;im.src=ATLAS;});}

function setImage(box,i){if(!box||!art[i])return false;box.style.setProperty('position','relative','important');box.querySelectorAll(':scope > div').forEach(el=>{if(!el.classList.contains('sc2-lock'))el.style.setProperty('display','none','important')});let img=box.querySelector(':scope > img.sn-mystic-v222-art');if(!img){img=document.createElement('img');img.className='sn-mystic-v222-art';img.alt=`S01-M${String(i+1).padStart(2,'0')}`;box.appendChild(img)}if(img.src!==art[i])img.src=art[i];return true;}

function repair(){
  installStyle();if(art.length!==12)return 0;let count=0;
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const n=(card.querySelector('.sc2-num')?.textContent||'').trim();const i=indexFrom(n);if(i<0)return;
    card.dataset.mysticV222='1';if(setImage(card.querySelector('.sc2-media'),i))count++;
  });
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const n=(row.querySelector('strong')?.textContent||row.textContent||'');const i=indexFrom(n);if(i<0)return;
    row.dataset.mysticV222='1';if(setImage(row.querySelector('.sc2-thumb'),i))count++;
  });
  return count;
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{repair()}catch(e){console.error('MYSTIC preview v222 repair',e)}})}

(async()=>{try{installStyle();await loadAtlas();queue();[100,260,600,1200,2400,5000].forEach(ms=>setTimeout(queue,ms));}catch(e){console.error('MYSTIC preview v222 atlas kon niet laden',e)}})();
new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queue()}).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',e=>{if(e.target.closest('#collectionSheet,#adminSheet,[data-seriespick],[data-sc2f],[data-tab]'))[0,80,220,500].forEach(ms=>setTimeout(queue,ms));},{passive:true});
document.addEventListener('snazzle:mystic-ready',queue);
window.SnazzleMysticPreviewV222={version:VERSION,repair};
console.info(`Snazzle MYSTIC preview ${VERSION} geladen`);
