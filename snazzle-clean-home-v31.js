// Snazzle Hunt v31 — rustige home + centraal beeldbeheer.
// Bestaande knoppen/functies blijven behouden; deze laag herschikt alleen de presentatie.

const V31='31.0.0';
const q31=(s,r=document)=>r.querySelector(s);
const qa31=(s,r=document)=>[...r.querySelectorAll(s)];
const DB31='snazzleVisualAssetsV28';
const STORE31='assets';
const cache31=new Map();
let db31Promise=null;
let queued31=false;

const extraAssets31=[
  ['quickFinds','Kaart Mijn vondsten'],
  ['quickProfile','Kaart Mijn profiel'],
  ['collectionCard','Kaart Mijn verzameling'],
  ['guideCharacter','Snazzle gids / menu'],
  ['secretCharacter','Geheime bewegende Snazzle'],
  ['natureCharacter','Natuur Snazzle'],
  ['celebrationCharacter','Beloning / feest Snazzle'],
  ['navHome','Icoon ondermenu Home'],
  ['navHunt','Icoon ondermenu Hunt'],
  ['navFriends','Icoon ondermenu Vrienden'],
  ['navShop','Icoon ondermenu Shop'],
  ['navProfile','Icoon ondermenu Profiel']
];

function ensureCss31(){
  if(q31('#snazzleCleanHomeV31'))return;
  const l=document.createElement('link');l.id='snazzleCleanHomeV31';l.rel='stylesheet';l.href='./snazzle-clean-home-v31.css?v=31';document.head.appendChild(l);
}
function db31(){
  if(db31Promise)return db31Promise;
  db31Promise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB31,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE31))r.result.createObjectStore(STORE31);};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Beeldopslag kon niet openen'));
  });
  return db31Promise;
}
async function get31(key){
  if(cache31.has(key))return cache31.get(key)||'';
  try{
    const db=await db31();
    const value=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE31,'readonly');const r=tx.objectStore(STORE31).get(key);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error);});
    cache31.set(key,value||'');return value||'';
  }catch(e){console.warn('Snazzle beeld lezen',e);return '';}
}
async function set31(key,value){
  const db=await db31();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE31,'readwrite');tx.objectStore(STORE31).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
  cache31.set(key,value||'');
}
async function del31(key){
  const db=await db31();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE31,'readwrite');tx.objectStore(STORE31).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
  cache31.set(key,'');
}
function compress31(file,max=1200,quality=.84){
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
function toast31(text){
  const t=q31('#toast');if(!t){console.info(text);return;}t.textContent=text;t.classList.add('show');clearTimeout(window.__v31toast);window.__v31toast=setTimeout(()=>t.classList.remove('show'),2400);
}
function loadLocal31(){try{return JSON.parse(localStorage.getItem('snazzleSettings')||'{}');}catch{return {};}}
function saveLocal31(key,value){const s=loadLocal31();s[key]=value;localStorage.setItem('snazzleSettings',JSON.stringify(s));applyLegacyImages31();}
function removeLocal31(key){const s=loadLocal31();s[key]='';localStorage.setItem('snazzleSettings',JSON.stringify(s));applyLegacyImages31();}
function image31(img,fallback,src){if(!img)return;if(src){img.src=src;img.style.display='block';if(fallback)fallback.style.display='none';}else{img.removeAttribute('src');img.style.display='none';if(fallback)fallback.style.display='grid';}}
function applyLegacyImages31(){
  const s=loadLocal31();
  image31(q31('#profileLogo'),q31('#logoFallback'),s.profileImage||'');
  image31(q31('#profilePreview'),q31('#profilePreviewFallback'),s.profileImage||'');
  const hero=q31('#hero');
  if(hero){if(s.heroImage){hero.style.setProperty('background-image',`url("${s.heroImage}")`,'important');hero.style.setProperty('background-size','cover','important');hero.style.setProperty('background-position','center top','important');}else{hero.style.removeProperty('background-image');}}
  image31(q31('#heroPreview'),q31('#heroPreviewFallback'),s.heroImage||'');
  image31(q31('#homeImg1'),q31('#homeEmpty1'),s.homeImage1||'');
  image31(q31('#homeImg2'),q31('#homeEmpty2'),s.homeImage2||'');
  image31(q31('#home1Preview'),q31('#home1PreviewFallback'),s.homeImage1||'');
  image31(q31('#home2Preview'),q31('#home2PreviewFallback'),s.homeImage2||'');
}

function cleanWelcome31(){
  const w=q31('#welcomeText');if(w&&/^Welkom,/i.test(w.textContent||''))w.textContent=w.textContent.replace(/^Welkom,/i,'Hoi');
}
function structureHero31(){
  const hero=q31('#hero');if(!hero)return;
  const small=hero.querySelector(':scope > small');const title=q31('#adventureTitle',hero);const p=hero.querySelector(':scope > p');
  let wrap=q31('.v31-hero-copy',hero);
  if(!wrap){wrap=document.createElement('div');wrap.className='v31-hero-copy';const start=q31('#bigStart',hero);if(start)hero.insertBefore(wrap,start);else hero.appendChild(wrap);}
  [small,title,p].forEach(el=>{if(el&&el.parentElement!==wrap)wrap.appendChild(el);});
  if(small)small.textContent='Snazzle avontuur';
  if(title)title.textContent='Klaar voor avontuur?';
  if(p)p.textContent='Vind een Snazzle en ontdek jouw dorp.';
}
function villageName31(btn){
  const label=btn?.querySelector('.v31-village-label');
  if(label)return label.textContent.trim();
  return String(btn?.textContent||'').replace(/^\s*📍\s*/,'').trim();
}
function slug31(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function wrapVillages31(){
  qa31('.village').forEach(b=>{
    if(b.querySelector('.v31-village-label'))return;
    const name=villageName31(b);b.textContent='';const span=document.createElement('span');span.className='v31-village-label';span.textContent=name;b.appendChild(span);
  });
}
function navButtons31(){
  const bottom=q31('.bottom');if(!bottom)return [];
  return qa31('button',bottom).slice(0,5);
}
async function applyNav31(){
  const keys=['navHome','navHunt','navFriends','navShop','navProfile'];
  const buttons=navButtons31();
  for(let i=0;i<buttons.length;i++){
    const b=buttons[i],holder=b.querySelector('b');if(!holder)continue;
    if(!holder.dataset.v31Original)holder.dataset.v31Original=holder.innerHTML;
    const src=await get31(keys[i]);
    if(src){holder.innerHTML=`<img class="v31-nav-img" src="${src}" alt="">`;}
    else if(holder.innerHTML.includes('v31-nav-img'))holder.innerHTML=holder.dataset.v31Original;
  }
}
function bg31(el,src){
  if(!el)return;
  if(src){el.style.setProperty('background-image',`linear-gradient(180deg,rgba(5,45,35,.04),rgba(3,36,29,.72)),url("${src}")`,'important');el.style.setProperty('background-size','cover','important');el.style.setProperty('background-position','center','important');el.dataset.v31Bg='1';}
  else if(el.dataset.v31Bg==='1'){el.style.removeProperty('background-image');el.style.removeProperty('background-size');el.style.removeProperty('background-position');delete el.dataset.v31Bg;}
}
async function applyExtraImages31(){
  bg31(q31('.finds'),await get31('quickFinds'));
  bg31(q31('.profile'),await get31('quickProfile'));
  bg31(q31('#collectionHomeCard'),await get31('collectionCard'));
  wrapVillages31();
  for(const b of qa31('.village'))bg31(b,await get31('village:'+slug31(villageName31(b))));
  await applyNav31();
}

function previewHtml31(src){return src?`<img src="${src}" alt="Voorbeeld">`:'Geen afbeelding';}
function card31(label,src){const item=document.createElement('div');item.className='v31-image-item';item.innerHTML=`<strong>${label}</strong><div class="v31-image-preview">${previewHtml31(src)}</div><input type="file" accept="image/*"><button type="button">Verwijderen</button>`;return item;}
async function addLocalCard31(grid,key,label){
  const src=loadLocal31()[key]||'',item=card31(label,src),input=item.querySelector('input'),remove=item.querySelector('button');
  input.onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=await compress31(file,key==='profileImage'?900:1400,.86);saveLocal31(key,data);input.value='';item.querySelector('.v31-image-preview').innerHTML=previewHtml31(data);toast31('Afbeelding aangepast ✓');}catch(err){toast31(err.message||'Opslaan mislukt');}};
  remove.onclick=()=>{removeLocal31(key);item.querySelector('.v31-image-preview').innerHTML=previewHtml31('');toast31('Afbeelding verwijderd');};grid.appendChild(item);
}
async function addDbCard31(grid,key,label){
  const src=await get31(key),item=card31(label,src),input=item.querySelector('input'),remove=item.querySelector('button');
  input.onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=await compress31(file,key.includes('Character')?950:1200,.86);await set31(key,data);input.value='';item.querySelector('.v31-image-preview').innerHTML=previewHtml31(data);await applyExtraImages31();toast31('Afbeelding aangepast ✓');}catch(err){toast31(err.message||'Opslaan mislukt');}};
  remove.onclick=async()=>{await del31(key);item.querySelector('.v31-image-preview').innerHTML=previewHtml31('');await applyExtraImages31();toast31('Afbeelding verwijderd');};grid.appendChild(item);
}
async function ensureManager31(){
  const admin=q31('#imagesAdmin');if(!admin||q31('#v31ImageManager',admin))return;
  const box=document.createElement('div');box.id='v31ImageManager';box.className='v31-image-manager';
  box.innerHTML='<h3>🖼️ Alle app-afbeeldingen</h3><p>Hier pas je de zichtbare afbeeldingen van de home, Snazzles, dorpen en ondermenu zelf aan. We voegen nergens automatisch dezelfde foto meerdere keren toe.</p><div class="v31-image-grid" id="v31ImageGrid"></div><div class="v31-manager-note">Hunt-foto’s pas je per Hunt aan bij <b>Beheer → Hunts</b>. Productfoto’s blijven bij het Shop-beheer. Zo blijft elk beeld aan de juiste inhoud gekoppeld.</div>';
  admin.appendChild(box);const grid=q31('#v31ImageGrid',box);
  await addLocalCard31(grid,'profileImage','Logo / Snazzle linksboven');
  await addLocalCard31(grid,'heroImage','Grote Hunt-afbeelding');
  await addLocalCard31(grid,'homeImage1','Home banner 1');
  await addLocalCard31(grid,'homeImage2','Home banner 2');
  for(const [key,label] of extraAssets31)await addDbCard31(grid,key,label);
  wrapVillages31();
  for(const b of qa31('.village'))await addDbCard31(grid,'village:'+slug31(villageName31(b)),`Dorpkaart ${villageName31(b)}`);
}

function hideOldExtraManager31(){
  const old=q31('#referenceAssets');if(old)old.style.display='none';
}
async function sync31(){
  cleanWelcome31();structureHero31();wrapVillages31();applyLegacyImages31();hideOldExtraManager31();await applyExtraImages31();await ensureManager31();
}
function queue31(){if(queued31)return;queued31=true;setTimeout(async()=>{queued31=false;try{await sync31();}catch(e){console.warn('Snazzle v31',e);}},120);}
function observe31(){
  new MutationObserver(queue31).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('.village,#saveNameBtn,[data-tab]'))setTimeout(queue31,80);});
}
async function init31(){
  if(window.__snazzleV31)return;window.__snazzleV31=true;ensureCss31();await sync31();observe31();console.info(`Snazzle clean home ${V31} geladen`);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init31,{once:true});else init31();
