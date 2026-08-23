// Snazzle Hunt v33 — dorpafbeeldingen direct in Dorpen-beheer + duidelijkere eenmalige knipoog.

const $v33=(s,r=document)=>r.querySelector(s);
const $$v33=(s,r=document)=>[...r.querySelectorAll(s)];
const DB33='snazzleVisualAssetsV28';
const STORE33='assets';
let db33Promise=null;

function slug33(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function db33(){
  if(db33Promise)return db33Promise;
  db33Promise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB33,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE33))r.result.createObjectStore(STORE33);};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  return db33Promise;
}
async function get33(key){const db=await db33();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE33,'readonly');const r=tx.objectStore(STORE33).get(key);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error);});}
async function set33(key,val){const db=await db33();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE33,'readwrite');tx.objectStore(STORE33).put(val,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function del33(key){const db=await db33();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE33,'readwrite');tx.objectStore(STORE33).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function compress33(file,max=1400,quality=.87){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/'))return reject(new Error('Kies een afbeelding'));
    const fr=new FileReader();fr.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
    fr.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));im.onload=()=>{const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height,s=Math.min(1,max/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));c.getContext('2d').drawImage(im,0,0,c.width,c.height);let out=c.toDataURL('image/webp',quality);if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/jpeg',quality);resolve(out);};im.src=fr.result;};fr.readAsDataURL(file);
  });
}
function toast33(text){const t=$v33('#toast');if(!t)return; t.textContent=text;t.classList.add('show');clearTimeout(window.__v33toast);window.__v33toast=setTimeout(()=>t.classList.remove('show'),2400);}

async function applyHomeVillage33(name,src){
  for(const b of $$v33('.village')){
    const label=(b.querySelector('.v31-village-label')?.textContent||b.textContent||'').replace(/^\s*📍\s*/,'').trim();
    if(label!==name)continue;
    let img=b.querySelector(':scope > img.v32-village-photo');
    if(!img){img=document.createElement('img');img.className='v32-village-photo';img.alt='';b.insertBefore(img,b.firstChild);}
    if(src){img.src=src;img.style.display='block';b.classList.add('v32-has-photo');}
    else{img.removeAttribute('src');img.style.display='none';b.classList.remove('v32-has-photo');}
  }
}

async function decorateVillageAdminCard33(card){
  if(card.dataset.v33ImageAdmin==='1')return;
  const strong=card.querySelector('strong');if(!strong)return;
  const name=strong.textContent.replace(/^\s*📍\s*/,'').trim();if(!name)return;
  card.dataset.v33ImageAdmin='1';
  const key='village:'+slug33(name),src=await get33(key);
  const box=document.createElement('div');box.className='v33-village-image-admin';
  box.innerHTML=`<div class="v33-village-preview">${src?`<img src="${src}" alt="${name}">`:'<span>Geen dorpafbeelding</span>'}</div><div class="v33-village-actions"><label>📷 Afbeelding wijzigen<input type="file" accept="image/*"></label><button type="button">Verwijderen</button></div>`;
  const input=box.querySelector('input'),remove=box.querySelector('button'),preview=box.querySelector('.v33-village-preview');
  ['click','keydown','pointerdown','touchstart'].forEach(type=>box.addEventListener(type,e=>e.stopPropagation()));
  input.onchange=async e=>{
    const f=e.target.files?.[0];if(!f)return;
    try{const data=await compress33(f);await set33(key,data);preview.innerHTML=`<img src="${data}" alt="${name}">`;input.value='';await applyHomeVillage33(name,data);toast33(`${name} afbeelding aangepast ✓`);}catch(err){toast33(err.message||'Opslaan mislukt');}
  };
  remove.onclick=async e=>{e.preventDefault();e.stopPropagation();await del33(key);preview.innerHTML='<span>Geen dorpafbeelding</span>';await applyHomeVillage33(name,'');toast33(`${name} afbeelding verwijderd`);};
  card.appendChild(box);
}
async function enhanceVillageAdmin33(){
  const list=$v33('#adminVillageList');if(!list)return;
  for(const card of [...list.children])await decorateVillageAdminCard33(card);
}

function strongerWink33(){
  const logo=$v33('.logo');if(!logo||logo.dataset.v33Wink==='1')return;
  logo.dataset.v33Wink='1';
  // Oude v32-overlay verwijderen om dubbele effecten te voorkomen.
  $v33('.v32-wink-eye',logo)?.remove();$v33('.v32-wink-spark',logo)?.remove();logo.classList.remove('v32-wink-now');
  const lid=document.createElement('span');lid.className='v33-wink-lid';lid.setAttribute('aria-hidden','true');
  const star=document.createElement('span');star.className='v33-wink-star';star.textContent='✦';star.setAttribute('aria-hidden','true');
  logo.append(lid,star);
  setTimeout(()=>{
    logo.classList.add('v33-wink-now');
    setTimeout(()=>logo.classList.remove('v33-wink-now'),1300);
  },900);
}

function ensureCss33(){
  if($v33('#snazzleVillageAdminV33Css'))return;
  const l=document.createElement('link');l.id='snazzleVillageAdminV33Css';l.rel='stylesheet';l.href='./snazzle-village-admin-v33.css?v=33';document.head.appendChild(l);
}
async function sync33(){ensureCss33();await enhanceVillageAdmin33();strongerWink33();}
function init33(){if(window.__snazzleV33)return;window.__snazzleV33=true;sync33();new MutationObserver(()=>sync33()).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init33,{once:true});else init33();
