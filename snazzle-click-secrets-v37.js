// Snazzle Hunt v37 — klikbare geheime verrassingen.
// Geen automatische popups: een kind ontdekt de verrassingen door zelf op subtiele elementen te tikken.

const V37='37.0.0';
const q37=(s,r=document)=>r.querySelector(s);
const qa37=(s,r=document)=>[...r.querySelectorAll(s)];
const DB37='snazzleVisualAssetsV28';
const STORE37='assets';
const SETTINGS37='snazzleClickSecretsV37';
let db37Promise=null;
let cache37=new Map();
let syncTimer37=null;
let code37=[];

const secrets37=[
  {id:'leaf',key:'clickSecretLeaf',label:'🍃 Snazzle achter het blad',hint:'Tik op het kleine bewegende blad bovenaan. De Snazzle gluurt kort tevoorschijn.',title:'Ssst… gevonden!',text:'Je ontdekte de Snazzle achter het blad.'},
  {id:'tree',key:'clickSecretTree',label:'🌳 Verborgen boomholte',hint:'Tik op het kleine boomholletje in de avonturenkaart.',title:'Wie zit daar?',text:'Een Snazzle zat verstopt in de boomholte!'},
  {id:'question',key:'clickSecretQuestion',label:'❓ Detective-vraagteken',hint:'Tik op het geheime vraagteken in de Hunt-kaart.',title:'Snazzle speurt mee!',text:'De detective heeft jou door zijn verrekijker gezien.'},
  {id:'moon',key:'clickSecretMoon',label:'🌙 Slaperige maan-Snazzle',hint:'Tik op het maantje bij de Snazzle Wereld.',title:'Pssst… ik sliep!',text:'Je hebt de slaperige Snazzle wakker gemaakt.'},
  {id:'compass',key:'clickSecretCompass',label:'🧭 Kompasgeheim',hint:'Tik op het kompas in Start een Hunt. Het wijst naar een verborgen plek.',title:'Volg het kompas…',text:'Het kompas heeft een geheime plek gevonden.'},
  {id:'code',key:'clickSecretCode',label:'🔐 Geheime Snazzle-code',hint:'Geheime volgorde: logo → ster → kompas.',title:'GEHEIME CODE!',text:'Jij hebt de verborgen Snazzle-code gekraakt!'}
];

function settings37(){
  try{return {...Object.fromEntries(secrets37.map(s=>[s.id,true])),...JSON.parse(localStorage.getItem(SETTINGS37)||'{}')};}
  catch{return Object.fromEntries(secrets37.map(s=>[s.id,true]));}
}
function setEnabled37(id,value){const s=settings37();s[id]=!!value;localStorage.setItem(SETTINGS37,JSON.stringify(s));}

function db37(){
  if(db37Promise)return db37Promise;
  db37Promise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB37,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE37))r.result.createObjectStore(STORE37);};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Beeldopslag kon niet openen'));
  });
  return db37Promise;
}
async function get37(key){
  if(cache37.has(key))return cache37.get(key)||'';
  try{const db=await db37();const v=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE37,'readonly');const r=tx.objectStore(STORE37).get(key);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error);});cache37.set(key,v||'');return v||'';}catch(e){console.warn('v37 lezen',e);return '';}
}
async function set37(key,value){
  const db=await db37();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE37,'readwrite');tx.objectStore(STORE37).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});cache37.set(key,value||'');
}
async function del37(key){
  const db=await db37();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE37,'readwrite');tx.objectStore(STORE37).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});cache37.set(key,'');
}
function compress37(file,max=1100,quality=.9){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/'))return reject(new Error('Kies een afbeelding'));
    const fr=new FileReader();fr.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
    fr.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));im.onload=()=>{
      const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height,scale=Math.min(1,max/Math.max(w,h));
      const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      let out=c.toDataURL('image/webp',quality);if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/png');resolve(out);
    };im.src=fr.result;};fr.readAsDataURL(file);
  });
}
function toast37(text){const t=q37('#toast');if(!t){console.info(text);return;}t.textContent=text;t.classList.add('show');clearTimeout(window.__v37Toast);window.__v37Toast=setTimeout(()=>t.classList.remove('show'),2300);}

function ensureStyles37(){
  if(q37('#snazzleClickSecretsV37Styles'))return;
  const s=document.createElement('style');s.id='snazzleClickSecretsV37Styles';s.textContent=`
    .v37-secret-trigger{position:absolute;z-index:8;border:0;background:transparent;color:#ffe891;padding:0;display:grid;place-items:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));-webkit-tap-highlight-color:transparent}
    .v37-secret-trigger:focus-visible{outline:3px solid #fff3a5;outline-offset:3px;border-radius:50%}
    #v37Leaf{left:5px;top:41%;width:44px;height:44px;font-size:27px;transform:rotate(-15deg);animation:v37Leaf 3.3s ease-in-out infinite}
    #v37Tree{left:8%;top:25%;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 48% 45%,#24170d 0 26%,#644024 29% 55%,#8b5b32 58% 70%,transparent 72%);opacity:.72}
    #v37Question{right:8%;top:27%;width:41px;height:41px;border-radius:50%;background:linear-gradient(#185c47,#0c4436);border:2px solid rgba(255,229,138,.72);font-size:20px;font-weight:1000;box-shadow:0 3px 0 rgba(72,45,20,.55)}
    #v37CodeStar{position:absolute;right:68px;top:3px;z-index:8;width:34px;height:34px;border:0;background:transparent;color:#ffe474;font-size:23px;filter:drop-shadow(0 0 7px rgba(255,225,110,.5));animation:v37Star 3.1s ease-in-out infinite}
    #v37Moon{position:absolute;right:10px;top:7px;z-index:4;width:42px;height:42px;border:0;border-radius:50%;background:transparent;font-size:25px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25));animation:v37Moon 4.2s ease-in-out infinite}
    .v37-reveal{position:fixed;left:50%;bottom:92px;transform:translateX(-50%) translateY(16px) scale(.96);z-index:9500;width:min(330px,88vw);padding:13px;border-radius:22px;background:linear-gradient(155deg,#fff5c8,#edcf83);border:3px solid #c99b48;box-shadow:0 14px 44px rgba(0,0,0,.38),0 5px 0 #70451f;color:#3a2918;display:grid;grid-template-columns:92px minmax(0,1fr);gap:11px;align-items:center;opacity:0;pointer-events:none;transition:.22s ease}
    .v37-reveal.show{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0) scale(1)}
    .v37-reveal-media{width:92px;height:92px;display:grid;place-items:center;overflow:hidden;border-radius:16px;background:rgba(255,255,255,.45)}
    .v37-reveal-media img{width:100%;height:100%;object-fit:contain;display:block}.v37-reveal-fallback{font-size:54px}
    .v37-reveal strong{display:block;font-size:16px;line-height:1.15}.v37-reveal p{margin:5px 0 0;font-size:11px;font-weight:760;line-height:1.35;color:#674c2e}.v37-reveal button{position:absolute;right:7px;top:6px;width:32px;height:32px;border:0;border-radius:11px;background:#765037;color:#fff;font-size:17px}
    .v37-compass-hint{position:fixed;z-index:9490;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#fff0a9;border:3px solid #d09935;box-shadow:0 5px 16px rgba(0,0,0,.25);font-size:21px;animation:v37Pulse .9s ease-in-out infinite alternate}
    .v37-admin{margin-top:14px;padding:12px;border-radius:17px;background:#eef4d5;border:2px solid #9eae72;color:#354229}.v37-admin h4{margin:0;font-size:16px}.v37-admin>p{margin:5px 0 10px;font-size:10px;font-weight:780;line-height:1.45;color:#5d6c45}
    .v37-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.v37-admin-card{padding:9px;border-radius:14px;background:#fffaf0;border:1px solid #bda776;color:#3b2a1c}.v37-admin-card strong{display:block;font-size:11px;line-height:1.25}.v37-admin-card small{display:block;min-height:40px;margin-top:3px;font-size:9px;line-height:1.35;color:#715c40;font-weight:720}.v37-admin-preview{height:90px;margin-top:7px;border-radius:10px;background:#e4ddc8;display:grid;place-items:center;overflow:hidden;color:#7a6a51;font-size:9px;font-weight:850;text-align:center}.v37-admin-preview img{width:100%;height:100%;object-fit:contain;display:block}.v37-pick{display:block;margin-top:7px;padding:8px;border-radius:9px;background:#417f47;color:#fff;text-align:center;font-size:9px;font-weight:950}.v37-pick input{display:none!important}.v37-clear,.v37-test{width:100%;margin-top:6px;padding:7px;border:0;border-radius:9px;font-size:9px;font-weight:900}.v37-clear{background:#70513a;color:#fff}.v37-test{background:#2d725f;color:#fff}.v37-toggle{display:flex;align-items:center;gap:7px;margin-top:7px;font-size:9px;font-weight:900;color:#4f5d3b}.v37-toggle input{width:18px;height:18px}
    @keyframes v37Leaf{0%,100%{transform:rotate(-18deg) translateY(0)}50%{transform:rotate(7deg) translateY(-2px)}}@keyframes v37Star{0%,100%{opacity:.45;transform:scale(.82) rotate(-8deg)}50%{opacity:1;transform:scale(1.06) rotate(7deg)}}@keyframes v37Moon{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg) translateY(-2px)}}@keyframes v37Pulse{from{transform:scale(.92)}to{transform:scale(1.08)}}
    @media(max-width:390px){.v37-admin-grid{grid-template-columns:1fr}.v37-reveal{grid-template-columns:78px minmax(0,1fr)}.v37-reveal-media{width:78px;height:78px}}
    @media(prefers-reduced-motion:reduce){#v37Leaf,#v37CodeStar,#v37Moon,.v37-compass-hint{animation:none!important}}
  `;document.head.appendChild(s);
}

async function reveal37(id){
  const cfg=secrets37.find(s=>s.id===id);if(!cfg||!settings37()[id])return;
  let box=q37('#v37Reveal');if(!box){box=document.createElement('div');box.id='v37Reveal';box.className='v37-reveal';box.setAttribute('role','status');box.innerHTML='<button type="button" aria-label="Sluiten">×</button><div class="v37-reveal-media"></div><div><strong></strong><p></p></div>';document.body.appendChild(box);q37('button',box).onclick=()=>box.classList.remove('show');}
  const src=await get37(cfg.key),media=q37('.v37-reveal-media',box);media.innerHTML=src?`<img src="${src}" alt="${cfg.label.replace(/^[^ ]+ /,'')}">`:'<span class="v37-reveal-fallback">🦆✨</span>';
  q37('strong',box).textContent=cfg.title;q37('p',box).textContent=cfg.text;box.classList.remove('show');void box.offsetWidth;box.classList.add('show');clearTimeout(window.__v37RevealTimer);window.__v37RevealTimer=setTimeout(()=>box.classList.remove('show'),4300);
}

function noteCode37(token){
  code37.push(token);if(code37.length>3)code37.shift();
  if(code37.join(',')==='logo,star,compass'){code37=[];setTimeout(()=>reveal37('code'),180);}
}
function sparkle37(el){if(!el)return;el.animate?.([{filter:'brightness(1)'},{filter:'brightness(1.8) drop-shadow(0 0 10px #ffe36d)'},{filter:'brightness(1)'}],{duration:420});}

function ensureTriggers37(){
  const enabled=settings37();
  const top=q37('.top');
  if(top&&!q37('#v37Leaf',top)){
    const b=document.createElement('button');b.type='button';b.id='v37Leaf';b.className='v37-secret-trigger';b.textContent='🍃';b.setAttribute('aria-label','Geheim blad');b.onclick=e=>{e.preventDefault();e.stopPropagation();reveal37('leaf');};top.appendChild(b);
  }
  if(top&&!q37('#v37CodeStar',top)){
    const b=document.createElement('button');b.type='button';b.id='v37CodeStar';b.textContent='✦';b.setAttribute('aria-label','Geheime ster');b.onclick=e=>{e.preventDefault();e.stopPropagation();sparkle37(b);noteCode37('star');};top.appendChild(b);
  }
  const logo=q37('.logo');if(logo&&!logo.dataset.v37Code){logo.dataset.v37Code='1';logo.addEventListener('click',()=>{sparkle37(logo);noteCode37('logo');},true);}
  const hero=q37('#hero');
  if(hero&&!q37('#v37Tree',hero)){const b=document.createElement('button');b.type='button';b.id='v37Tree';b.className='v37-secret-trigger';b.setAttribute('aria-label','Verborgen boomholte');b.onclick=e=>{e.preventDefault();e.stopPropagation();reveal37('tree');};hero.appendChild(b);}
  if(hero&&!q37('#v37Question',hero)){const b=document.createElement('button');b.type='button';b.id='v37Question';b.className='v37-secret-trigger';b.textContent='?';b.setAttribute('aria-label','Geheim vraagteken');b.onclick=e=>{e.preventDefault();e.stopPropagation();reveal37('question');};hero.appendChild(b);}
  const world=q37('#snazzleWorldHeading');
  if(world&&!q37('#v37Moon',world)){world.style.position='relative';const b=document.createElement('button');b.type='button';b.id='v37Moon';b.textContent='🌙';b.setAttribute('aria-label','Geheime maan');b.onclick=e=>{e.preventDefault();e.stopPropagation();reveal37('moon');};world.appendChild(b);}
  const compass=q37('#bigStart .compass');if(compass&&!compass.dataset.v37Compass){compass.dataset.v37Compass='1';compass.setAttribute('role','button');compass.setAttribute('tabindex','0');compass.setAttribute('aria-label','Geheim kompas');const run=e=>{e.preventDefault();e.stopPropagation();compassSecret37(compass);noteCode37('compass');};compass.addEventListener('click',run,true);compass.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){run(e);}},true);}
  q37('#v37Leaf')?.toggleAttribute('hidden',!enabled.leaf);q37('#v37Tree')?.toggleAttribute('hidden',!enabled.tree);q37('#v37Question')?.toggleAttribute('hidden',!enabled.question);q37('#v37Moon')?.toggleAttribute('hidden',!enabled.moon);q37('#v37CodeStar')?.toggleAttribute('hidden',!enabled.code);
}

function compassSecret37(compass){
  if(!settings37().compass)return;
  sparkle37(compass);const r=compass.getBoundingClientRect();let hint=document.createElement('button');hint.type='button';hint.className='v37-compass-hint';hint.textContent='✦';hint.setAttribute('aria-label','Door het kompas gevonden geheime plek');
  const left=Math.max(12,Math.min(innerWidth-50,r.left+(Math.random()>.5?150:-70)));const top=Math.max(90,Math.min(innerHeight-150,r.top-90-Math.random()*90));hint.style.left=left+'px';hint.style.top=top+'px';document.body.appendChild(hint);hint.onclick=e=>{e.preventDefault();e.stopPropagation();hint.remove();reveal37('compass');};setTimeout(()=>hint.remove(),6500);
}

function preview37(src){return src?`<img src="${src}" alt="Voorbeeld">`:'Nog geen eigen afbeelding gekozen';}
async function buildAdmin37(){
  const parent=q37('#v32ImageManager')||q37('#imagesAdmin');if(!parent||q37('#v37ClickSecretsAdmin'))return;
  const section=document.createElement('section');section.id='v37ClickSecretsAdmin';section.className='v37-admin';section.innerHTML='<h4>🕵️ Klikbare geheime verrassingen</h4><p>Deze geheimen verschijnen nooit vanzelf. Een kind moet eerst het verborgen knopje ontdekken. Voor ieder geheim kun je zelf een afbeelding kiezen of het geheim uitzetten.</p><div class="v37-admin-grid"></div>';
  parent.appendChild(section);const grid=q37('.v37-admin-grid',section),enabled=settings37();
  for(const cfg of secrets37){
    const src=await get37(cfg.key),card=document.createElement('div');card.className='v37-admin-card';card.innerHTML=`<strong>${cfg.label}</strong><small>${cfg.hint}</small><div class="v37-admin-preview">${preview37(src)}</div><label class="v37-pick">Kies eigen afbeelding<input type="file" accept="image/*"></label><button type="button" class="v37-clear">Afbeelding verwijderen</button><button type="button" class="v37-test">Test verrassing</button><label class="v37-toggle"><input type="checkbox" ${enabled[cfg.id]?'checked':''}> Verrassing aan</label>`;
    const input=q37('input[type=file]',card),clear=q37('.v37-clear',card),test=q37('.v37-test',card),toggle=q37('.v37-toggle input',card),preview=q37('.v37-admin-preview',card);
    input.onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=await compress37(f);await set37(cfg.key,data);input.value='';preview.innerHTML=preview37(data);toast37('Afbeelding opgeslagen ✓');}catch(err){toast37(err.message||'Opslaan mislukt');}};
    clear.onclick=async()=>{await del37(cfg.key);preview.innerHTML=preview37('');toast37('Afbeelding verwijderd');};
    test.onclick=()=>reveal37(cfg.id);toggle.onchange=()=>{setEnabled37(cfg.id,toggle.checked);ensureTriggers37();toast37(toggle.checked?'Verrassing staat aan':'Verrassing staat uit');};grid.appendChild(card);
  }
}

async function sync37(){ensureStyles37();ensureTriggers37();await buildAdmin37();}
function queue37(){clearTimeout(syncTimer37);syncTimer37=setTimeout(()=>sync37().catch(e=>console.warn('Snazzle v37',e)),120);}
function observe37(){new MutationObserver(m=>{if(m.some(x=>x.type==='childList'))queue37();}).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab],.bottom button,.quick-menu-list button'))setTimeout(queue37,90);});}
async function init37(){if(window.__snazzleV37)return;window.__snazzleV37=true;await sync37();observe37();console.info(`Snazzle click secrets ${V37} geladen`);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init37,{once:true});else init37();
