// Snazzle MYSTIC v221 — zaait de 12 kaarten vóór het kaartensysteem en toont hun artwork betrouwbaar.
const VERSION='221.0';
const LOCAL_KEY='snazzleCardCatalogV2';
const ATLAS='./assets/cards/snazzle-mystic-atlas-v219.jpg?v=221';
const DEFS=[
  ['S01-M01','Moon Whisper','core'],
  ['S01-M02','Crystal Dream','core'],
  ['S01-M03','Mystic Glow','core'],
  ['S01-M04','Shadow Spell','core'],
  ['S01-M05','Star Oracle','core'],
  ['S01-M06','Dream Keeper','core'],
  ['S01-M07','Phantom Flash','core'],
  ['S01-M08','Magic Mist','core'],
  ['S01-M09','Lunar Legend','rare'],
  ['S01-M10','Secret Spirit','rare'],
  ['S01-M11','Mystic Guardian','gold'],
  ['S01-M12','Mystic Master','platinum']
];
let art=[];
let queued=false;

function readLocal(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function writeLocal(items){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(items));return true}catch(e){console.warn('MYSTIC localStorage',e);return false}}
function seedBeforeCards(){
  const before=readLocal();
  const byNo=new Map(before.map(c=>[String(c.number||'').toUpperCase(),c]));
  const mysticNos=new Set(DEFS.map(x=>x[0]));
  const keep=before.filter(c=>!mysticNos.has(String(c.number||'').toUpperCase()));
  const now=new Date().toISOString();
  const made=DEFS.map(([number,name,rarity],i)=>{
    const old=byNo.get(number)||{};
    return {...old,id:old.id||`seed-mystic-${String(i+1).padStart(2,'0')}`,number,name,series:'MYSTIC Series 01',description:'Magie, maanlicht & mysterie',rarity,unlockType:'milestone',huntId:'',threshold:i+1,active:true,secretName:false,imageData:old.imageData||'',createdAt:old.createdAt||now,updatedAt:now};
  });
  writeLocal([...keep,...made]);
  window.__snazzleMysticPreseedV221={count:12,at:now};
  document.dispatchEvent(new CustomEvent('snazzle:mystic-preseeded',{detail:{version:VERSION,count:12}}));
}
seedBeforeCards();

function loadAtlas(){return new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';im.onload=()=>{try{const cw=im.naturalWidth/4,ch=im.naturalHeight/3;art=DEFS.map((_,i)=>{const c=document.createElement('canvas');c.width=360;c.height=480;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,360,480);return c.toDataURL('image/jpeg',.8)});resolve()}catch(e){reject(e)}};im.onerror=reject;im.src=ATLAS;});}
function persistArtwork(){if(art.length!==12)return;const cards=readLocal();let changed=false;cards.forEach(c=>{const m=String(c.number||'').toUpperCase().match(/^S01-M(\d{2})$/);if(!m)return;const i=Number(m[1])-1;if(i<0||i>11)return;if(c.imageData!==art[i]){c.imageData=art[i];c.updatedAt=new Date().toISOString();changed=true}});if(changed)writeLocal(cards);}
function numberIndex(text){const m=String(text||'').toUpperCase().match(/S01-M(\d{2})/);if(!m)return-1;const i=Number(m[1])-1;return i>=0&&i<12?i:-1;}
function forceImg(img){img.style.setProperty('position','absolute','important');img.style.setProperty('inset','0','important');img.style.setProperty('width','100%','important');img.style.setProperty('height','100%','important');img.style.setProperty('object-fit','contain','important');img.style.setProperty('opacity','1','important');img.style.setProperty('visibility','visible','important');img.style.setProperty('display','block','important');img.style.setProperty('filter','none','important');img.style.setProperty('transform','none','important');img.style.setProperty('z-index','80','important');img.style.setProperty('background','#20132e','important');}
function paint(box,i){if(!box||!art[i])return;box.style.setProperty('position','relative','important');let img=box.querySelector(':scope > img.sn-mystic-v221-art');if(!img){img=document.createElement('img');img.className='sn-mystic-v221-art';box.appendChild(img)}if(img.src!==art[i])img.src=art[i];forceImg(img);box.dataset.mysticV221=String(i+1);}
function renderArtwork(){if(art.length!==12)return;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{const i=numberIndex(row.querySelector('strong')?.textContent||row.textContent);if(i<0)return;paint(row.querySelector('.sc2-thumb'),i);});
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{const i=numberIndex(card.querySelector('.sc2-num')?.textContent||card.textContent);if(i<0)return;const box=card.querySelector('.sc2-media');paint(box,i);box?.querySelector('.sc2-lock')?.style.setProperty('z-index','90','important');box?.querySelector('.sc2-rarity')?.style.setProperty('z-index','91','important');box?.querySelector('.sc2-num')?.style.setProperty('z-index','91','important');});
  const sync=document.querySelector('#sc2Sync');if(sync&&!document.querySelector('#mysticV221Status')){const b=document.createElement('div');b.id='mysticV221Status';b.style.cssText='margin:7px 0;padding:8px 10px;border-radius:12px;background:#efe2ff;border:2px solid #8b63aa;color:#55306b;font-size:11px;font-weight:950';b.textContent='🔮 MYSTIC Series 01 · 12/12 kaarten geladen';sync.insertAdjacentElement('afterend',b)}
}
function repair(){renderArtwork();window.SnazzleMysticVerifyV220?.repair?.();window.SnazzleMysticV219?.repair?.();}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair()})}

(async()=>{try{await loadAtlas();persistArtwork();repair();[150,400,900,1800,3500,7000].forEach(ms=>setTimeout(queue,ms));}catch(e){console.error('MYSTIC v221 artwork kon niet laden',e)}})();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queue()}).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('snazzle:admin-ui-ready',queue);document.addEventListener('snazzle:mystic-ready',queue);
window.SnazzleMysticV221={version:VERSION,seed:seedBeforeCards,repair,defs:DEFS};
console.info(`Snazzle MYSTIC ${VERSION} geladen`);
