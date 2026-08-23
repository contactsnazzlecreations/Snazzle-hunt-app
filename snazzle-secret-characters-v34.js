// Snazzle Hunt v34 — ieder geheim/bewegend eendje afzonderlijk vervangbaar.
// Alleen de afbeelding verandert; bestaande bewegingen, timers en klikacties blijven intact.

const V34='34.0.0';
const q34=(s,r=document)=>r.querySelector(s);
const qa34=(s,r=document)=>[...r.querySelectorAll(s)];
const DB34='snazzleVisualAssetsV28';
const STORE34='assets';
const cache34=new Map();
let db34Promise=null;
let timer34=null;

const secretSlots34=[
  {key:'secretRunnerCharacter',label:'🏃 Langslopende Snazzle',hint:'Het eendje dat af en toe door het scherm loopt.',targets:()=>qa34('#ui28Runner')},
  {key:'secretPeekerCharacter',label:'👀 Kijkende Snazzle',hint:'Het eendje dat stiekem vanaf de linker- of rechterkant kijkt.',targets:()=>qa34('#ui28Peeker')},
  {key:'secretFloatingCharacter',label:'✨ Zwevende Snazzle',hint:'Het zwevende / onverwachte eendje dat als bezoeker verschijnt.',targets:()=>qa34('#snazzleVisitor b,#snazzleVisitor')},
  {key:'secretSurpriseCharacter',label:'🎉 Verrassings-Snazzle',hint:'Het grote eendje dat bij een geheime vondst of verrassing verschijnt.',targets:()=>qa34('#magicBig')}
];

function ensureStyles34(){
  if(q34('#snazzleSecretCharactersV34Styles'))return;
  const s=document.createElement('style');
  s.id='snazzleSecretCharactersV34Styles';
  s.textContent=`
    .v34-secret-custom{background-image:var(--v34-secret-image)!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important}
    .v34-secret-custom>img,.v34-secret-custom img{opacity:0!important;visibility:hidden!important}
    #ui28Runner.v34-secret-custom,#ui28Peeker.v34-secret-custom{background-color:transparent!important}
    #magicBig.v34-secret-custom{min-width:82px;min-height:82px}
    #snazzleVisitor b.v34-secret-custom{display:inline-block!important;min-width:42px;min-height:42px}
    .v34-secret-section{margin-top:14px;padding:12px;border-radius:17px;background:#eef4d5;border:2px solid #9eae72;color:#354229}
    .v34-secret-section h4{margin:0;font-size:16px}.v34-secret-section>p{margin:5px 0 10px;font-size:10px;font-weight:780;line-height:1.45;color:#5d6c45}
    .v34-secret-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .v34-secret-card{padding:9px;border-radius:14px;background:#fffaf0;border:1px solid #bda776;color:#3b2a1c;box-shadow:0 2px 0 rgba(90,67,40,.12)}
    .v34-secret-card strong{display:block;font-size:11px;line-height:1.25;margin-bottom:3px}.v34-secret-card small{display:block;min-height:29px;font-size:9px;line-height:1.35;color:#715c40;font-weight:720}
    .v34-secret-preview{height:92px;margin-top:7px;border-radius:11px;background:#e4ddc8;display:grid;place-items:center;overflow:hidden;color:#7a6a51;font-size:9px;font-weight:850;text-align:center}
    .v34-secret-preview img{width:100%;height:100%;object-fit:contain;display:block}
    .v34-secret-pick{display:block;margin-top:7px;padding:9px 7px;border-radius:10px;background:#417f47;color:white;text-align:center;font-size:9px;font-weight:950;cursor:pointer}
    .v34-secret-pick input{display:none!important}
    .v34-secret-clear{width:100%;margin-top:6px;padding:7px;border:0;border-radius:9px;background:#70513a;color:white;font-size:9px;font-weight:900}
    .v34-general-note{margin-top:9px;padding:8px 9px;border-radius:10px;background:#fff5cf;border:1px solid #d2b66f;font-size:9px;font-weight:800;line-height:1.4;color:#66512e}
    @media(max-width:390px){.v34-secret-grid{grid-template-columns:1fr}.v34-secret-preview{height:115px}}
  `;
  document.head.appendChild(s);
}

function db34(){
  if(db34Promise)return db34Promise;
  db34Promise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB34,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE34))r.result.createObjectStore(STORE34);};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Beeldopslag kon niet openen'));
  });
  return db34Promise;
}
async function get34(key){
  if(cache34.has(key))return cache34.get(key)||'';
  try{const db=await db34();const value=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE34,'readonly');const r=tx.objectStore(STORE34).get(key);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error);});cache34.set(key,value||'');return value||'';}catch(e){console.warn('Snazzle v34 lezen',e);return '';}
}
async function set34(key,value){
  const db=await db34();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE34,'readwrite');tx.objectStore(STORE34).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});cache34.set(key,value||'');
}
async function del34(key){
  const db=await db34();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE34,'readwrite');tx.objectStore(STORE34).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});cache34.set(key,'');
}
function compress34(file,max=1000,quality=.9){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/'))return reject(new Error('Kies een afbeelding'));
    const fr=new FileReader();fr.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
    fr.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));im.onload=()=>{const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height,scale=Math.min(1,max/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);let out=c.toDataURL('image/webp',quality);if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/png');resolve(out);};im.src=fr.result;};fr.readAsDataURL(file);
  });
}
function toast34(text){const t=q34('#toast');if(!t){console.info(text);return;}t.textContent=text;t.classList.add('show');clearTimeout(window.__v34Toast);window.__v34Toast=setTimeout(()=>t.classList.remove('show'),2400);}
function preview34(src){return src?`<img src="${src}" alt="Voorbeeld">`:'Gebruik algemene geheime Snazzle';}

async function applySecrets34(){
  for(const slot of secretSlots34){
    const src=await get34(slot.key);
    for(const target of slot.targets()){
      if(!target)continue;
      if(src){target.classList.add('v34-secret-custom');target.style.setProperty('--v34-secret-image',`url("${src}")`);}
      else{target.classList.remove('v34-secret-custom');target.style.removeProperty('--v34-secret-image');}
    }
  }
}

function hideOldGeneric34(){
  qa34('.v32-image-item').forEach(card=>{
    const t=(card.querySelector('strong')?.textContent||'').toLowerCase();
    if(t.includes('bewegende geheime snazzle'))card.style.display='none';
  });
}

async function buildManager34(){
  const parent=q34('#v32ImageManager')||q34('#imagesAdmin');if(!parent||q34('#v34SecretManager'))return;
  const section=document.createElement('section');section.id='v34SecretManager';section.className='v34-secret-section';
  section.innerHTML='<h4>🦆 Geheime bewegende Snazzles apart</h4><p>Je kunt nu ieder bewegend eendje een eigen afbeelding geven. De beweging, timing en klikactie blijven hetzelfde.</p><div class="v34-secret-grid"></div><div class="v34-general-note">Tip: kies bij voorkeur een PNG/WebP met transparante achtergrond. Met “Terug naar algemene Snazzle” gebruikt dat effect weer de algemene geheime Snazzle.</div>';
  parent.appendChild(section);const grid=q34('.v34-secret-grid',section);
  for(const slot of secretSlots34){
    const src=await get34(slot.key),card=document.createElement('div');card.className='v34-secret-card';
    card.innerHTML=`<strong>${slot.label}</strong><small>${slot.hint}</small><div class="v34-secret-preview">${preview34(src)}</div><label class="v34-secret-pick">Kies eigen afbeelding<input type="file" accept="image/*"></label><button type="button" class="v34-secret-clear">Terug naar algemene Snazzle</button>`;
    const input=q34('input',card),clear=q34('.v34-secret-clear',card),preview=q34('.v34-secret-preview',card);
    input.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=await compress34(f);await set34(slot.key,data);input.value='';preview.innerHTML=preview34(data);await applySecrets34();toast34(`${slot.label.replace(/^[^ ]+ /,'')} aangepast ✓`);}catch(err){toast34(err.message||'Opslaan mislukt');}};
    clear.onclick=async()=>{await del34(slot.key);preview.innerHTML=preview34('');await applySecrets34();toast34('Algemene Snazzle hersteld');};
    grid.appendChild(card);
  }
}

async function sync34(){ensureStyles34();hideOldGeneric34();await buildManager34();await applySecrets34();}
function queue34(){clearTimeout(timer34);timer34=setTimeout(()=>sync34().catch(e=>console.warn('Snazzle v34',e)),120);}
function observe34(){
  new MutationObserver(muts=>{for(const m of muts){if(m.type==='childList'){queue34();break;}}}).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab],.quick-menu-list button,.bottom button'))setTimeout(queue34,100);});
}
async function init34(){if(window.__snazzleV34)return;window.__snazzleV34=true;await sync34();observe34();console.info(`Snazzle secret characters ${V34} geladen`);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init34,{once:true});else init34();
