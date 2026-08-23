// Snazzle Hunt v35 — het eendje in 'Nu te vinden' zonder actieve hunt is zelf vervangbaar.
// Het bestaande lege-hunt icoon wordt verborgen; beheerder kan een eigen transparante Snazzle kiezen.

const V35='35.0.0';
const q35=(s,r=document)=>r.querySelector(s);
const DB35='snazzleVisualAssetsV28';
const STORE35='assets';
const KEY35='idleHuntCharacter';
let db35Promise=null;
let cache35;
let timer35=null;

function ensureStyles35(){
  if(q35('#snazzleIdleHuntV35Styles'))return;
  const s=document.createElement('style');
  s.id='snazzleIdleHuntV35Styles';
  s.textContent=`
    /* oude losse emoji/eend in het lege Hunt-vak uitschakelen */
    #huntPlaceholder::before,#huntPlaceholder::after{content:none!important;display:none!important}
    .photo{position:relative!important}
    #v35IdleHuntDuck{
      position:absolute!important;left:18%!important;top:48%!important;transform:translate(-50%,-50%)!important;
      width:88px!important;height:88px!important;object-fit:contain!important;z-index:3!important;
      display:none;pointer-events:none!important;filter:drop-shadow(0 6px 7px rgba(0,0,0,.20));
    }
    #v35IdleHuntDuck.show{display:block!important}
    .v35-idle-section{margin-top:14px;padding:12px;border-radius:17px;background:#eef4d5;border:2px solid #9eae72;color:#354229}
    .v35-idle-section h4{margin:0;font-size:16px}.v35-idle-section>p{margin:5px 0 10px;font-size:10px;font-weight:780;line-height:1.45;color:#5d6c45}
    .v35-idle-card{padding:10px;border-radius:14px;background:#fffaf0;border:1px solid #bda776;color:#3b2a1c}
    .v35-idle-card strong{display:block;font-size:12px}.v35-idle-card small{display:block;margin-top:3px;font-size:9px;line-height:1.4;color:#715c40;font-weight:720}
    .v35-idle-preview{height:115px;margin-top:8px;border-radius:11px;background:#e4ddc8;display:grid;place-items:center;overflow:hidden;color:#7a6a51;font-size:9px;font-weight:850;text-align:center}
    .v35-idle-preview img{width:100%;height:100%;object-fit:contain;display:block}
    .v35-idle-pick{display:block;margin-top:8px;padding:10px;border-radius:10px;background:#417f47;color:#fff;text-align:center;font-size:10px;font-weight:950;cursor:pointer}
    .v35-idle-pick input{display:none!important}
    .v35-idle-clear{width:100%;margin-top:6px;padding:8px;border:0;border-radius:9px;background:#70513a;color:#fff;font-size:9px;font-weight:900}
  `;
  document.head.appendChild(s);
}
function db35(){
  if(db35Promise)return db35Promise;
  db35Promise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB35,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE35))r.result.createObjectStore(STORE35);};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Beeldopslag kon niet openen'));
  });
  return db35Promise;
}
async function get35(){
  if(cache35!==undefined)return cache35||'';
  try{const db=await db35();const value=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE35,'readonly');const r=tx.objectStore(STORE35).get(KEY35);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error);});cache35=value||'';return cache35;}catch(e){console.warn('Snazzle v35 lezen',e);return '';}
}
async function set35(value){
  const db=await db35();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE35,'readwrite');tx.objectStore(STORE35).put(value,KEY35);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});cache35=value||'';
}
async function del35(){
  const db=await db35();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE35,'readwrite');tx.objectStore(STORE35).delete(KEY35);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});cache35='';
}
function compress35(file,max=1000,quality=.9){
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
function toast35(text){const t=q35('#toast');if(!t){console.info(text);return;}t.textContent=text;t.classList.add('show');clearTimeout(window.__v35Toast);window.__v35Toast=setTimeout(()=>t.classList.remove('show'),2400);}
function ensureDuck35(){
  const photo=q35('.hunt .photo');if(!photo)return null;
  let img=q35('#v35IdleHuntDuck',photo);if(!img){img=document.createElement('img');img.id='v35IdleHuntDuck';img.alt='Snazzle bij geen actieve hunt';photo.appendChild(img);}return img;
}
async function apply35(){
  const img=ensureDuck35();if(!img)return;
  const src=await get35();
  const placeholder=q35('#huntPlaceholder');
  const noHunt=!!placeholder && /geen actieve hunt|kies eerst een dorp/i.test(placeholder.textContent||'');
  if(src&&noHunt){if(img.src!==src)img.src=src;img.classList.add('show');}
  else{img.classList.remove('show');if(!src)img.removeAttribute('src');}
}
function preview35(src){return src?`<img src="${src}" alt="Voorbeeld">`:'Nog geen eigen afbeelding gekozen';}
async function buildManager35(){
  const parent=q35('#v32ImageManager')||q35('#imagesAdmin');if(!parent||q35('#v35IdleHuntManager'))return;
  const src=await get35();
  const section=document.createElement('section');section.id='v35IdleHuntManager';section.className='v35-idle-section';
  section.innerHTML=`<h4>🦆 Eendje bij “Nu te vinden”</h4><p>Dit is precies het eendje dat zichtbaar is als er in het gekozen dorp géén actieve Hunt is. Je kunt hier jouw eigen Snazzle gebruiken.</p><div class="v35-idle-card"><strong>Geen actieve Hunt — Snazzle</strong><small>Een PNG/WebP met transparante achtergrond werkt het mooist.</small><div class="v35-idle-preview">${preview35(src)}</div><label class="v35-idle-pick">Kies eigen afbeelding<input type="file" accept="image/*"></label><button type="button" class="v35-idle-clear">Afbeelding verwijderen</button></div>`;
  parent.appendChild(section);
  const input=q35('input',section),clear=q35('.v35-idle-clear',section),preview=q35('.v35-idle-preview',section);
  input.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=await compress35(f);await set35(data);input.value='';preview.innerHTML=preview35(data);await apply35();toast35('Eendje bij Nu te vinden aangepast ✓');}catch(err){toast35(err.message||'Opslaan mislukt');}};
  clear.onclick=async()=>{await del35();preview.innerHTML=preview35('');await apply35();toast35('Afbeelding verwijderd');};
}
async function sync35(){ensureStyles35();await buildManager35();await apply35();}
function queue35(){clearTimeout(timer35);timer35=setTimeout(()=>sync35().catch(e=>console.warn('Snazzle v35',e)),120);}
function observe35(){new MutationObserver(queue35).observe(document.body,{childList:true,subtree:true,characterData:true});document.addEventListener('click',e=>{if(e.target.closest?.('.village,[data-tab],.bottom button'))setTimeout(queue35,100);});}
async function init35(){if(window.__snazzleV35)return;window.__snazzleV35=true;await sync35();observe35();console.info(`Snazzle idle hunt duck ${V35} geladen`);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init35,{once:true});else init35();
