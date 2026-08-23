// Snazzle Hunt v36 — eigen afbeelding voor Snazzle Thuis Hunt.
// Vervangt alleen het huis/eend-icoon links; de kaart, tekst en klikfunctie blijven intact.

const V36='36.0.0';
const q36=(s,r=document)=>r.querySelector(s);
const qa36=(s,r=document)=>[...r.querySelectorAll(s)];
const DB36='snazzleVisualAssetsV28';
const STORE36='assets';
const KEY36='homeHuntCharacter';
let db36Promise=null;
let cache36;
let timer36=null;

function ensureStyles36(){
  if(q36('#snazzleHomeHuntImageV36Styles'))return;
  const s=document.createElement('style');
  s.id='snazzleHomeHuntImageV36Styles';
  s.textContent=`
    #snazzleHomeHuntHome>b.v36-home-hunt-image,
    [data-home-hunt]>b.v36-home-hunt-image{
      display:grid!important;place-items:center!important;
      font-size:0!important;line-height:1!important;
      overflow:visible!important;
    }
    #snazzleHomeHuntHome>b.v36-home-hunt-image img{
      width:58px!important;height:58px!important;object-fit:contain!important;display:block!important;
      filter:drop-shadow(0 4px 4px rgba(0,0,0,.24));
    }
    [data-home-hunt]>b.v36-home-hunt-image img{
      width:42px!important;height:42px!important;object-fit:contain!important;display:block!important;
      filter:drop-shadow(0 3px 3px rgba(0,0,0,.20));
    }
    .v36-homehunt-section{margin-top:14px;padding:12px;border-radius:17px;background:#e9f3d3;border:2px solid #9eae72;color:#354229}
    .v36-homehunt-section h4{margin:0;font-size:16px}.v36-homehunt-section>p{margin:5px 0 10px;font-size:10px;font-weight:780;line-height:1.45;color:#5d6c45}
    .v36-homehunt-card{padding:10px;border-radius:14px;background:#fffaf0;border:1px solid #bda776;color:#3b2a1c}
    .v36-homehunt-card strong{display:block;font-size:12px}.v36-homehunt-card small{display:block;margin-top:3px;font-size:9px;line-height:1.4;color:#715c40;font-weight:720}
    .v36-homehunt-preview{height:120px;margin-top:8px;border-radius:11px;background:linear-gradient(135deg,#eee7d3,#dcd2ba);display:grid;place-items:center;overflow:hidden;color:#7a6a51;font-size:9px;font-weight:850;text-align:center}
    .v36-homehunt-preview img{width:100%;height:100%;object-fit:contain;display:block}
    .v36-homehunt-pick{display:block;margin-top:8px;padding:10px;border-radius:10px;background:#417f47;color:#fff;text-align:center;font-size:10px;font-weight:950;cursor:pointer}
    .v36-homehunt-pick input{display:none!important}
    .v36-homehunt-clear{width:100%;margin-top:6px;padding:8px;border:0;border-radius:9px;background:#70513a;color:#fff;font-size:9px;font-weight:900}
  `;
  document.head.appendChild(s);
}

function db36(){
  if(db36Promise)return db36Promise;
  db36Promise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB36,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE36))r.result.createObjectStore(STORE36);};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Beeldopslag kon niet openen'));
  });
  return db36Promise;
}
async function get36(){
  if(cache36!==undefined)return cache36||'';
  try{const db=await db36();const v=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE36,'readonly');const r=tx.objectStore(STORE36).get(KEY36);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error);});cache36=v||'';return cache36;}catch(e){console.warn('Snazzle v36 lezen',e);return '';}
}
async function set36(value){
  const db=await db36();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE36,'readwrite');tx.objectStore(STORE36).put(value,KEY36);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});cache36=value||'';
}
async function del36(){
  const db=await db36();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE36,'readwrite');tx.objectStore(STORE36).delete(KEY36);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});cache36='';
}
function compress36(file,max=1100,quality=.9){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/'))return reject(new Error('Kies een afbeelding'));
    const fr=new FileReader();fr.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
    fr.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));im.onload=()=>{
      const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height,scale=Math.min(1,max/Math.max(w,h));
      const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      let out=c.toDataURL('image/webp',quality);if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/png');resolve(out);
    };im.src=fr.result;};fr.readAsDataURL(file);
  });
}
function toast36(text){const t=q36('#toast');if(!t){console.info(text);return;}t.textContent=text;t.classList.add('show');clearTimeout(window.__v36Toast);window.__v36Toast=setTimeout(()=>t.classList.remove('show'),2400);}
function preview36(src){return src?`<img src="${src}" alt="Voorbeeld Snazzle Thuis Hunt">`:'Nog geen eigen afbeelding gekozen';}

async function apply36(){
  const src=await get36();
  const targets=[q36('#snazzleHomeHuntHome>b'),q36('[data-home-hunt]>b')].filter(Boolean);
  for(const target of targets){
    if(!target.dataset.v36Original)target.dataset.v36Original=target.innerHTML;
    if(src){
      target.classList.add('v36-home-hunt-image');
      const old=target.querySelector('img[data-v36-homehunt]');
      if(old){if(old.getAttribute('src')!==src)old.setAttribute('src',src);}
      else target.innerHTML=`<img data-v36-homehunt="1" src="${src}" alt="Snazzle Thuis Hunt">`;
    }else{
      target.classList.remove('v36-home-hunt-image');
      if(target.querySelector('img[data-v36-homehunt]'))target.innerHTML=target.dataset.v36Original||'🏠🦆';
    }
  }
}

async function buildManager36(){
  const parent=q36('#v32ImageManager')||q36('#imagesAdmin');
  if(!parent||q36('#v36HomeHuntManager'))return;
  const src=await get36();
  const section=document.createElement('section');section.id='v36HomeHuntManager';section.className='v36-homehunt-section';
  section.innerHTML=`<h4>🏠🦆 Afbeelding Snazzle Thuis Hunt</h4><p>Hier verander je het plaatje links in de paarse “Snazzle Thuis Hunt”-kaart. Dezelfde afbeelding wordt ook in het Thuis Hunt-menu gebruikt.</p><div class="v36-homehunt-card"><strong>Snazzle Thuis Hunt — afbeelding links</strong><small>Gebruik bij voorkeur een PNG/WebP met transparante achtergrond. Tekst en werking van de knop blijven ongewijzigd.</small><div class="v36-homehunt-preview">${preview36(src)}</div><label class="v36-homehunt-pick">Kies eigen afbeelding<input type="file" accept="image/*"></label><button type="button" class="v36-homehunt-clear">Terug naar standaard 🏠🦆</button></div>`;
  parent.appendChild(section);
  const input=q36('input',section),clear=q36('.v36-homehunt-clear',section),preview=q36('.v36-homehunt-preview',section);
  input.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=await compress36(f);await set36(data);input.value='';preview.innerHTML=preview36(data);await apply36();toast36('Snazzle Thuis Hunt afbeelding aangepast ✓');}catch(err){toast36(err.message||'Opslaan mislukt');}};
  clear.onclick=async()=>{await del36();preview.innerHTML=preview36('');await apply36();toast36('Standaard Thuis Hunt afbeelding hersteld');};
}

async function sync36(){ensureStyles36();await buildManager36();await apply36();}
function queue36(){clearTimeout(timer36);timer36=setTimeout(()=>sync36().catch(e=>console.warn('Snazzle v36',e)),120);}
function observe36(){new MutationObserver(muts=>{for(const m of muts){if(m.type==='childList'){queue36();break;}}}).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab],.quick-menu-list button,.bottom button,#snazzleHomeHuntHome'))setTimeout(queue36,100);});}
async function init36(){if(window.__snazzleV36)return;window.__snazzleV36=true;await sync36();observe36();console.info(`Snazzle home hunt image ${V36} geladen`);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init36,{once:true});else init36();
