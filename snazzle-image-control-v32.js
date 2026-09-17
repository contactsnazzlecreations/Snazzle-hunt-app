// Snazzle Hunt v32.1 — extra paginabeeldbeheer zonder conflict met het centrale v31-beheer.
// v31 blijft de enige hoofdbeheerder voor home/tegels/iconen; v32 voegt alleen overige pagina-afbeeldingen toe.

const V32='32.1.0';
const q32=(s,r=document)=>r.querySelector(s);
const qa32=(s,r=document)=>[...r.querySelectorAll(s)];
const DB32='snazzleVisualAssetsV28';
const STORE32='assets';
let db32Promise=null;
let queue32Timer=null;
let pageSlots32=new Map();

function ensureCss32(){
  if(q32('#snazzleImageControlV32'))return;
  const l=document.createElement('link');
  l.id='snazzleImageControlV32';
  l.rel='stylesheet';
  l.href='./snazzle-image-control-v32.css?v=32.1';
  document.head.appendChild(l);
}
function db32(){
  if(db32Promise)return db32Promise;
  db32Promise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB32,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE32))r.result.createObjectStore(STORE32);};
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error||new Error('Beeldopslag kon niet openen'));
  });
  return db32Promise;
}
async function get32(key){
  try{
    const db=await db32();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE32,'readonly');
      const r=tx.objectStore(STORE32).get(key);
      r.onsuccess=()=>resolve(r.result||'');
      r.onerror=()=>reject(r.error);
    });
  }catch(e){console.warn('Snazzle v32 lezen',e);return '';}
}
async function set32(key,val){
  const db=await db32();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE32,'readwrite');
    tx.objectStore(STORE32).put(val,key);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}
async function del32(key){
  const db=await db32();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE32,'readwrite');
    tx.objectStore(STORE32).delete(key);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}
function isImageFile32(file){
  if(!file)return false;
  if(String(file.type||'').toLowerCase().startsWith('image/'))return true;
  return /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(String(file.name||''));
}
function compress32(file,max=1400,quality=.86){
  return new Promise((resolve,reject)=>{
    if(!isImageFile32(file))return reject(new Error('Kies een PNG, JPG of WebP-afbeelding'));
    const fr=new FileReader();
    fr.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
    fr.onload=()=>{
      const im=new Image();
      im.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));
      im.onload=()=>{
        try{
          const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;
          if(!w||!h)throw new Error('Afbeelding heeft geen geldige afmetingen');
          const scale=Math.min(1,max/Math.max(w,h));
          const c=document.createElement('canvas');
          c.width=Math.max(1,Math.round(w*scale));
          c.height=Math.max(1,Math.round(h*scale));
          const ctx=c.getContext('2d');
          if(!ctx)throw new Error('Afbeelding verwerken lukt niet op dit toestel');
          ctx.drawImage(im,0,0,c.width,c.height);
          let out=c.toDataURL('image/webp',quality);
          if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/jpeg',quality);
          resolve(out);
        }catch(err){reject(err);}
      };
      im.src=String(fr.result||'');
    };
    fr.readAsDataURL(file);
  });
}
function toast32(text){
  const t=q32('#toast');
  if(!t){console.info(text);return;}
  t.textContent=text;
  t.classList.add('show');
  clearTimeout(window.__v32toast);
  window.__v32toast=setTimeout(()=>t.classList.remove('show'),2600);
}
function slug32(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function villageName32(btn){return (btn?.querySelector('.v31-village-label')?.textContent||btn?.textContent||'').replace(/^\s*📍\s*/,'').trim();}

function ensureVillagePhoto32(btn){
  let img=btn.querySelector(':scope > img.v32-village-photo');
  if(!img){
    img=document.createElement('img');
    img.className='v32-village-photo';
    img.alt='';
    btn.insertBefore(img,btn.firstChild);
  }
  return img;
}
async function applyVillages32(){
  for(const b of qa32('.village')){
    const name=villageName32(b);if(!name)continue;
    const src=await get32('village:'+slug32(name));
    const img=ensureVillagePhoto32(b);
    if(src){
      if(img.getAttribute('src')!==src)img.src=src;
      img.style.display='block';
      b.classList.add('v32-has-photo');
    }else{
      img.removeAttribute('src');
      img.style.display='none';
      b.classList.remove('v32-has-photo');
    }
  }
}
async function applyFixed32(){
  const bg=async(sel,key)=>{
    const el=q32(sel),src=await get32(key);if(!el)return;
    if(src){
      el.style.setProperty('background-image',`linear-gradient(180deg,rgba(4,45,35,.04),rgba(3,36,29,.72)),url("${src}")`,'important');
      el.style.setProperty('background-size','cover','important');
      el.style.setProperty('background-position','center','important');
      el.dataset.v32Bg='1';
    }else if(el.dataset.v32Bg==='1'){
      el.style.removeProperty('background-image');
      delete el.dataset.v32Bg;
    }
  };
  await bg('.finds','quickFinds');
  await bg('.profile','quickProfile');
  await bg('#collectionHomeCard','collectionCard');

  const navKeys=['navHome','navHunt','navFriends','navShop','navProfile'];
  const nav=qa32('.bottom button').slice(0,5);
  for(let i=0;i<nav.length;i++){
    const h=nav[i].querySelector('b');if(!h)continue;
    if(!h.dataset.v32Original)h.dataset.v32Original=h.innerHTML;
    const src=await get32(navKeys[i]);
    if(src){
      const current=h.querySelector(':scope > img.v32-nav-img');
      if(current?.getAttribute('src')!==src)h.innerHTML=`<img class="v32-nav-img" src="${src}" alt="">`;
    }else if(h.querySelector(':scope > img.v32-nav-img'))h.innerHTML=h.dataset.v32Original;
  }
  const secret=await get32('secretCharacter');
  if(secret)qa32('#ui28Runner img,#ui28Peeker img,#snazzleVisitor img,#magicBig img').forEach(img=>{if(img.getAttribute('src')!==secret)img.src=secret;});
  const guide=await get32('guideCharacter');
  if(guide)qa32('.quick-menu-duck img').forEach(img=>{if(img.getAttribute('src')!==guide)img.src=guide;});
}

function ignoredImage32(img){
  return !img||img.closest('#imagesAdmin,#v31ImageManager,#v32PageAddon,#referenceAssets,.proof-preview,.proof-box')||img.matches('#profileLogo,#profilePreview,#heroPreview,#homeImg1,#homeImg2,#home1Preview,#home2Preview,.v32-village-photo,.v31-nav-img,.v32-nav-img,[data-ui28-character]');
}
function pageContext32(img){
  const sheet=img.closest('.sheet');
  const head=sheet?.querySelector('h2,h3')?.textContent?.trim();
  if(head)return head.slice(0,40);
  const section=img.closest('section,article,.panel,.card,.home-magic-card,.collector-card,.bonus-card');
  const t=section?.querySelector('h2,h3,strong')?.textContent?.trim();
  return (t||'Pagina').slice(0,40);
}
function signature32(img){
  if(img.id)return 'id:'+img.id;
  const card=img.closest('.collector-card,.bonus-card,.home-magic-card');
  if(card){const t=card.querySelector('strong,h3')?.textContent||img.alt||'kaart';return 'card:'+slug32(pageContext32(img))+':'+slug32(t);}
  const parent=img.closest('[id]');
  if(parent){const imgs=qa32('img',parent).filter(x=>!ignoredImage32(x));const idx=Math.max(0,imgs.indexOf(img));return 'parent:'+parent.id+':'+idx;}
  const all=qa32('img').filter(x=>!ignoredImage32(x));
  return 'page:'+slug32(pageContext32(img))+':'+Math.max(0,all.indexOf(img));
}
function label32(img){
  const ctx=pageContext32(img),own=(img.alt||img.title||'Afbeelding').trim();
  return `${ctx} — ${own}`.replace(/\s+/g,' ').slice(0,80);
}
async function applyPageOverride32(img){
  if(ignoredImage32(img))return;
  const sig=signature32(img),key='override:'+sig;
  if(!img.dataset.v32BaseSrc&&img.getAttribute('src'))img.dataset.v32BaseSrc=img.getAttribute('src');
  const src=await get32(key);
  if(src){
    img.dataset.v32Override='1';
    if(img.getAttribute('src')!==src)img.setAttribute('src',src);
    img.style.display='block';
  }else if(img.dataset.v32Override==='1'){
    delete img.dataset.v32Override;
    if(img.dataset.v32BaseSrc)img.setAttribute('src',img.dataset.v32BaseSrc);
  }
  pageSlots32.set(sig,{img,label:label32(img),key});
}
async function scanPageImages32(){
  for(const img of qa32('img'))await applyPageOverride32(img);
  await renderPageSlots32();
}

function preview32(src){return src?`<img src="${src}" alt="Voorbeeld">`:'Geen afbeelding ingesteld';}
function makeCard32(label,src){
  const c=document.createElement('div');
  c.className='v32-image-item';
  c.innerHTML=`<strong>${label}</strong><div class="v32-image-preview">${preview32(src)}</div><label class="v32-pick">Kies eigen afbeelding<input type="file" accept="image/*"></label><button type="button" class="v32-remove">Terug naar standaard</button>`;
  return c;
}
function section32(title,desc){
  const s=document.createElement('section');
  s.className='v32-manager-section';
  s.innerHTML=`<h4>${title}</h4>${desc?`<p>${desc}</p>`:''}<div class="v32-image-grid"></div>`;
  return s;
}
async function renderPageSlots32(){
  const grid=q32('#v32PageImageGrid');if(!grid)return;
  const existing=new Set([...grid.children].map(x=>x.dataset.slot));
  for(const [sig,slot] of pageSlots32){
    if(existing.has(sig))continue;
    const src=await get32(slot.key),c=makeCard32(slot.label,src);
    c.dataset.slot=sig;
    const input=c.querySelector('input'),rm=c.querySelector('.v32-remove');
    input.onchange=async e=>{
      const f=e.target.files?.[0];if(!f)return;
      try{
        const data=await compress32(f,1400,.87);
        await set32(slot.key,data);
        input.value='';
        c.querySelector('.v32-image-preview').innerHTML=preview32(data);
        const target=pageSlots32.get(sig)?.img;
        if(target){target.dataset.v32Override='1';target.src=data;target.style.display='block';}
        toast32('Pagina-afbeelding aangepast ✓');
      }catch(err){toast32(err.message||'Opslaan mislukt');}
    };
    rm.onclick=async()=>{
      await del32(slot.key);
      c.querySelector('.v32-image-preview').innerHTML=preview32('');
      const target=pageSlots32.get(sig)?.img;
      if(target){delete target.dataset.v32Override;if(target.dataset.v32BaseSrc)target.src=target.dataset.v32BaseSrc;}
      toast32('Standaardafbeelding hersteld');
    };
    grid.appendChild(c);
  }
  const empty=q32('#v32PageEmpty');
  if(empty)empty.style.display=grid.children.length?'none':'block';
}

async function buildManager32(){
  const admin=q32('#imagesAdmin');if(!admin)return;
  const old=q32('#referenceAssets');if(old)old.style.display='none';

  // Belangrijk: v31 is het centrale hoofdbeheer. Niet meer verwijderen of vervangen.
  const main=q32('#v31ImageManager',admin);
  if(!main)return;
  q32('#v32ImageManager')?.remove();

  let addon=q32('#v32PageAddon',main);
  if(!addon){
    addon=section32('🧩 Afbeeldingen op overige pagina’s','Open een pagina één keer als hij hier nog niet staat. Deze extra sectie werkt naast het centrale afbeeldingsbeheer hierboven.');
    addon.id='v32PageAddon';
    addon.querySelector('.v32-image-grid').id='v32PageImageGrid';
    const scan=document.createElement('button');
    scan.type='button';
    scan.className='v32-scan';
    scan.textContent='🔄 Zoek alle pagina-afbeeldingen opnieuw';
    scan.onclick=async()=>{pageSlots32.clear();q32('#v32PageImageGrid')?.replaceChildren();await scanPageImages32();toast32('Pagina-afbeeldingen bijgewerkt');};
    addon.insertBefore(scan,addon.querySelector('.v32-image-grid'));
    const empty=document.createElement('div');
    empty.id='v32PageEmpty';
    empty.className='v32-empty';
    empty.textContent='Nog geen extra pagina-afbeeldingen gevonden.';
    addon.appendChild(empty);
    main.appendChild(addon);
  }
  await renderPageSlots32();
}

function ensureWink32(){
  const logo=q32('.logo');if(!logo||q32('.v32-wink-eye',logo))return;
  const eye=document.createElement('span');eye.className='v32-wink-eye';eye.setAttribute('aria-hidden','true');
  const sparkle=document.createElement('span');sparkle.className='v32-wink-spark';sparkle.textContent='✦';sparkle.setAttribute('aria-hidden','true');
  logo.append(eye,sparkle);
  if(window.__snazzleWinkPlayed)return;
  window.__snazzleWinkPlayed=true;
  setTimeout(()=>{logo.classList.add('v32-wink-now');setTimeout(()=>logo.classList.remove('v32-wink-now'),900);},1050);
}

async function sync32(){
  ensureCss32();
  await applyVillages32();
  await applyFixed32();
  ensureWink32();
  await buildManager32();
  await scanPageImages32();
}
function queue32(){
  clearTimeout(queue32Timer);
  queue32Timer=setTimeout(()=>sync32().catch(e=>console.warn('Snazzle v32',e)),240);
}
function observe32(){
  const mo=new MutationObserver(muts=>{
    let relevant=false;
    for(const m of muts){
      if(m.type==='childList'){
        if(m.target?.closest?.('#v31ImageManager,#v32PageAddon'))continue;
        relevant=true;break;
      }
      if(m.type==='attributes'&&m.target instanceof HTMLImageElement&&!ignoredImage32(m.target)){relevant=true;break;}
    }
    if(relevant)queue32();
  });
  mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.village,[data-tab],.bottom button,.quick-menu-list button'))setTimeout(queue32,120);
  });
}
async function init32(){
  if(window.__snazzleV32)return;
  window.__snazzleV32=true;
  await sync32();
  observe32();
  console.info(`Snazzle image control ${V32} geladen`);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init32,{once:true});else init32();