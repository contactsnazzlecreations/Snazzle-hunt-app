// Snazzle v67.1 — de kleine gouden ster opent alleen een magische verrassing.
// Geen punten, levels of beloningen. Beheer kan de afbeelding en tekst zelf aanpassen.

const MAGIC_STAR_VERSION='67.1.0';
const q67=(s,r=document)=>r.querySelector(s);
const DB67='snazzleVisualAssetsV28';
const STORE67='assets';
const IMAGE_KEY67='magicStarImageV67';
const TEXT_KEY67='magicStarTextV67';
const DEFAULT_TEXT67='Yeah! De ster is magisch ✨';
const EMPTY_IMAGE67='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxtZXRhZGF0YT5TTkFaWkxFX01BR0lDX1NUQVJfRU1QVF k8L21ldGFkYXRhPjwvc3ZnPg=='.replace(/\s/g,'');
let dbPromise67=null;
let starButton67=null;
let adminQueued67=false;

function db67(){
  if(dbPromise67)return dbPromise67;
  dbPromise67=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB67,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE67))req.result.createObjectStore(STORE67);};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Snazzle opslag kon niet openen'));
  });
  return dbPromise67;
}
async function get67(key){
  try{const db=await db67();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE67,'readonly');const r=tx.objectStore(STORE67).get(key);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error);});}
  catch(e){console.warn('Magische ster lezen',e);return '';}
}
async function set67(key,value){
  const db=await db67();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE67,'readwrite');tx.objectStore(STORE67).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
}
function utf8ToBase6467(text){
  const bytes=new TextEncoder().encode(text);let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);
}
function base64ToUtf867(value){
  try{const bin=atob(value),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new TextDecoder().decode(bytes);}catch{return '';}
}
function escXml67(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function unescXml67(s){return String(s||'').replace(/&apos;/g,"'").replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');}
function textAsset67(text){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><metadata id="snazzleMagicText">${escXml67(text)}</metadata></svg>`;
  return 'data:image/svg+xml;base64,'+utf8ToBase6467(svg);
}
function readTextAsset67(asset){
  if(!asset||!asset.startsWith('data:image/svg+xml;base64,'))return '';
  const svg=base64ToUtf867(asset.split(',')[1]||'');
  const m=svg.match(/<metadata id="snazzleMagicText">([\s\S]*?)<\/metadata>/i);
  return m?unescXml67(m[1]).trim():'';
}
function isRealImage67(src){return !!src&&src!==EMPTY_IMAGE67&&src.startsWith('data:image/');}
function toast67(msg){const t=q67('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window.__magicStarToast67);window.__magicStarToast67=setTimeout(()=>t.classList.remove('show'),2600);}

function ensureStyles67(){
  if(q67('#snazzleMagicStarV67Styles'))return;
  const style=document.createElement('style');style.id='snazzleMagicStarV67Styles';style.textContent=`
    .sn-magic-star-overlay{position:fixed;inset:0;z-index:12500;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,24,17,.78);backdrop-filter:blur(7px);opacity:0;visibility:hidden;transition:.2s ease}
    .sn-magic-star-overlay.show{opacity:1;visibility:visible}
    .sn-magic-star-card{position:relative;width:min(430px,94vw);max-height:88dvh;overflow:auto;padding:14px 14px 18px;border-radius:28px;background:linear-gradient(180deg,#fff5c9,#ecd18c);border:4px solid #d2a34b;box-shadow:0 20px 54px rgba(0,0,0,.4),0 7px 0 #745026;color:#342719;text-align:center;transform:scale(.94) translateY(8px);transition:.22s cubic-bezier(.2,.85,.25,1.15)}
    .sn-magic-star-overlay.show .sn-magic-star-card{transform:scale(1) translateY(0)}
    .sn-magic-star-close{position:absolute;right:10px;top:10px;z-index:3;width:42px;height:42px;border:0;border-radius:14px;background:#68442d;color:#fff;font-size:25px;font-weight:900;box-shadow:0 4px 0 #452c1d}
    .sn-magic-star-spark{font-size:34px;line-height:1;margin:3px 0 8px;animation:snMagicTwinkle67 2.2s ease-in-out infinite}
    .sn-magic-star-media{width:100%;min-height:210px;max-height:48dvh;border-radius:21px;overflow:hidden;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,#fff8cf,#f5c74d 58%,#d79a2d);border:3px solid #c18a2d;box-shadow:0 5px 0 #9b6829,0 9px 20px rgba(88,57,18,.16)}
    .sn-magic-star-media img{display:block;width:100%;height:100%;max-height:48dvh;object-fit:cover}
    .sn-magic-star-fallback{font-size:82px;padding:50px 10px;filter:drop-shadow(0 5px 3px rgba(92,62,21,.2));animation:snMagicFloat67 2.6s ease-in-out infinite}
    .sn-magic-star-text{margin:17px 8px 2px;color:#0d543f;font-size:25px;line-height:1.15;font-weight:1000;text-wrap:balance}
    .sn-magic-star-sub{margin:7px 14px 0;color:#755b35;font-size:11px;line-height:1.4;font-weight:780}
    .sn-magic-star-admin{margin-top:16px;padding:13px;border-radius:17px;background:#f2f6dc;border:2px solid #9eae73;color:#34432b}
    .sn-magic-star-admin h4{margin:0 0 4px;font-size:16px}.sn-magic-star-admin>p{margin:0 0 10px;font-size:10px;font-weight:760;line-height:1.4;color:#617049}
    .sn-magic-star-preview{height:135px;border-radius:13px;overflow:hidden;display:grid;place-items:center;background:#e7dec7;color:#79684e;font-size:10px;font-weight:850;text-align:center}
    .sn-magic-star-preview img{width:100%;height:100%;object-fit:cover;display:block}
    .sn-magic-star-admin label{display:block;margin-top:9px;font-size:10px;font-weight:950;color:#435334;text-align:left}
    .sn-magic-star-admin input[type="text"]{width:100%;min-height:44px;margin-top:4px;padding:10px 11px;border:2px solid #b7a276;border-radius:11px;background:#fffaf0;color:#30271e;font-size:14px}
    .sn-magic-star-file{display:block;margin-top:9px;padding:10px;border-radius:11px;background:#2f7950;color:#fff;text-align:center;font-size:10px;font-weight:950}.sn-magic-star-file input{display:none!important}
    .sn-magic-star-admin-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.sn-magic-star-admin-actions button{border:0;border-radius:11px;padding:10px;font-size:10px;font-weight:950}.sn-magic-star-save{background:#1f7251;color:#fff}.sn-magic-star-clear{background:#73523a;color:#fff}
    @keyframes snMagicTwinkle67{0%,100%{opacity:.55;transform:scale(.9) rotate(-4deg)}50%{opacity:1;transform:scale(1.08) rotate(4deg)}}
    @keyframes snMagicFloat67{0%,100%{transform:translateY(2px) rotate(-3deg)}50%{transform:translateY(-7px) rotate(3deg)}}
    @media(prefers-reduced-motion:reduce){.sn-magic-star-spark,.sn-magic-star-fallback{animation:none!important}.sn-magic-star-overlay,.sn-magic-star-card{transition:none!important}}
  `;document.head.appendChild(style);
}

async function currentMagic67(){
  const [img,textAsset]=await Promise.all([get67(IMAGE_KEY67),get67(TEXT_KEY67)]);
  return {img:isRealImage67(img)?img:'',text:readTextAsset67(textAsset)||DEFAULT_TEXT67};
}
async function ensureOverlay67(){
  let overlay=q67('#snMagicStarOverlay');
  if(!overlay){
    overlay=document.createElement('div');overlay.id='snMagicStarOverlay';overlay.className='sn-magic-star-overlay';overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`<section class="sn-magic-star-card" role="dialog" aria-modal="true" aria-labelledby="snMagicStarText"><button type="button" class="sn-magic-star-close" aria-label="Sluiten">×</button><div class="sn-magic-star-spark">✨ ⭐ ✨</div><div class="sn-magic-star-media" id="snMagicStarMedia"><div class="sn-magic-star-fallback">🦆⭐</div></div><div class="sn-magic-star-text" id="snMagicStarText">${DEFAULT_TEXT67}</div><div class="sn-magic-star-sub">Psst… jij hebt de geheime Snazzle-ster ontdekt!</div></section>`;
    document.body.appendChild(overlay);
    q67('.sn-magic-star-close',overlay).onclick=closeMagic67;
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeMagic67();});
  }
  const data=await currentMagic67(),media=q67('#snMagicStarMedia',overlay),text=q67('#snMagicStarText',overlay);
  media.innerHTML=data.img?`<img src="${data.img}" alt="Magische Snazzle verrassing">`:'<div class="sn-magic-star-fallback">🦆⭐</div>';
  text.textContent=data.text;
  return overlay;
}
async function openMagic67(){
  const overlay=await ensureOverlay67();overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');setTimeout(()=>q67('.sn-magic-star-close',overlay)?.focus({preventScroll:true}),40);
}
function closeMagic67(){const overlay=q67('#snMagicStarOverlay');if(!overlay)return;overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');setTimeout(()=>starButton67?.focus?.({preventScroll:true}),40);}

function bindStar67(){
  q67('#snStarFallback')?.remove();q67('#snStarRewardsOverlay')?.remove();
  const star=q67('#v37CodeStar');if(!star)return false;
  if(star.dataset.magicStar67==='1'){starButton67=star;return true;}
  star.dataset.magicStar67='1';starButton67=star;star.setAttribute('aria-label','Open de magische Snazzle-ster');star.title='Magische Snazzle-ster';
  star.onclick=e=>{e.preventDefault();e.stopPropagation();openMagic67();};
  return true;
}

function compressImage67(file,max=1100,quality=.86){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/'))return reject(new Error('Kies een afbeelding'));
    const fr=new FileReader();fr.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
    fr.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));im.onload=()=>{
      const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height,scale=Math.min(1,max/Math.max(w,h));
      const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      let out=c.toDataURL('image/webp',quality);if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/jpeg',quality);resolve(out);
    };im.src=fr.result;};fr.readAsDataURL(file);
  });
}
async function pushCentral67(){try{await window.SnazzleVisualSyncV54?.push?.();}catch(e){console.warn('Magische ster synchroniseren',e);}}
async function refreshAdmin67(box){
  const data=await currentMagic67(),preview=q67('.sn-magic-star-preview',box),text=q67('input[type="text"]',box);
  if(preview)preview.innerHTML=data.img?`<img src="${data.img}" alt="Voorbeeld magische ster">`:'Nog geen eigen afbeelding — kinderen zien 🦆⭐';
  if(text&&document.activeElement!==text)text.value=data.text;
}
async function ensureAdmin67(){
  const host=q67('#imagesAdmin');if(!host||q67('#snMagicStarAdmin',host))return;
  const box=document.createElement('section');box.id='snMagicStarAdmin';box.className='sn-magic-star-admin';
  box.innerHTML=`<h4>⭐ Magische ster</h4><p>Dit is wat kinderen zien als ze bovenaan op het kleine gouden sterretje tikken. Je kunt de afbeelding en tekst hier zelf veranderen.</p><div class="sn-magic-star-preview">Laden…</div><label class="sn-magic-star-file">📷 Kies grappige afbeelding<input type="file" accept="image/*"></label><label>Tekst bij de ster<input type="text" maxlength="90" value="${DEFAULT_TEXT67.replace(/"/g,'&quot;')}"></label><div class="sn-magic-star-admin-actions"><button type="button" class="sn-magic-star-save">Opslaan</button><button type="button" class="sn-magic-star-clear">Afbeelding verwijderen</button></div>`;
  host.appendChild(box);await refreshAdmin67(box);
  const file=q67('input[type="file"]',box),text=q67('input[type="text"]',box);
  q67('.sn-magic-star-save',box).onclick=async()=>{
    try{
      const chosen=file.files?.[0];if(chosen)await set67(IMAGE_KEY67,await compressImage67(chosen));
      await set67(TEXT_KEY67,textAsset67(text.value.trim()||DEFAULT_TEXT67));file.value='';await refreshAdmin67(box);toast67('Magische ster aangepast ✨');setTimeout(pushCentral67,250);
    }catch(e){console.warn(e);toast67(e.message||'Opslaan lukt nu niet');}
  };
  q67('.sn-magic-star-clear',box).onclick=async()=>{
    await set67(IMAGE_KEY67,EMPTY_IMAGE67);await refreshAdmin67(box);toast67('Afbeelding verwijderd');setTimeout(pushCentral67,250);
  };
}
function queueAdmin67(){if(adminQueued67)return;adminQueued67=true;setTimeout(()=>{adminQueued67=false;ensureAdmin67();bindStar67();},120);}

function init67(){
  if(window.__snazzleMagicStarV67)return;window.__snazzleMagicStarV67=true;ensureStyles67();bindStar67();ensureAdmin67();
  const obs=new MutationObserver(queueAdmin67);obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&q67('#snMagicStarOverlay')?.classList.contains('show'))closeMagic67();});
  console.info(`Snazzle magische ster ${MAGIC_STAR_VERSION} geladen`);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init67,{once:true});else init67();
