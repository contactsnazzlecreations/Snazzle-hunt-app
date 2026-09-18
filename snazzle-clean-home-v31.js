// Snazzle Hunt v31.6 — overzichtelijk compleet afbeeldingsbeheer met directe publieke sync.
// Zichtbare home-tegels, tegel-iconen, dorpen en ondermenu zijn via Beheer → Afbeeldingen vervangbaar.

const V31='31.6.0';
const q31=(s,r=document)=>r.querySelector(s);
const qa31=(s,r=document)=>[...r.querySelectorAll(s)];
const DB31='snazzleVisualAssetsV28';
const STORE31='assets';
const cache31=new Map();
let db31Promise=null;
let queued31=false;

const extraAssets31=[
  ['mainStartCard','Achtergrond Start een Hunt'],
  ['mainStartIcon','Icoon Start een Hunt'],
  ['arCard','Achtergrond Snazzle AR'],
  ['arTileIcon','Icoon Snazzle AR'],
  ['quickFinds','Achtergrond Mijn vondsten'],
  ['quickFindsIcon','Icoon Mijn vondsten'],
  ['quickProfile','Achtergrond Mijn profiel'],
  ['quickProfileIcon','Icoon Mijn profiel'],
  ['biebCard','Achtergrond De Bieb'],
  ['biebTileIcon','Icoon De Bieb'],
  ['collectionCard','Achtergrond Mijn Snazzles'],
  ['collectionTileIcon','Icoon Mijn Snazzles'],
  ['newsCard','Snazzle Nieuws afbeelding'],
  ['newsTileIcon','Icoon Snazzle Nieuws'],
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
  const l=document.createElement('link');l.id='snazzleCleanHomeV31';l.rel='stylesheet';l.href='./snazzle-clean-home-v31.css?v=31.6';document.head.appendChild(l);
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
function isImageFile31(file){
  if(!file)return false;
  if(String(file.type||'').toLowerCase().startsWith('image/'))return true;
  return /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(String(file.name||''));
}
function compress31(file,max=1200,quality=.84){
  return new Promise((resolve,reject)=>{
    if(!isImageFile31(file))return reject(new Error('Kies een PNG, JPG of WebP-afbeelding'));
    const fr=new FileReader();fr.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
    fr.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));im.onload=()=>{
      try{
        const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;
        if(!w||!h)throw new Error('Afbeelding heeft geen geldige afmetingen');
        const scale=Math.min(1,max/Math.max(w,h));
        const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
        const ctx=c.getContext('2d');if(!ctx)throw new Error('Afbeelding verwerken lukt niet op dit toestel');ctx.drawImage(im,0,0,c.width,c.height);
        let out=c.toDataURL('image/webp',quality);if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/jpeg',quality);
        if(!out.startsWith('data:image/'))throw new Error('Afbeelding kon niet worden omgezet');
        resolve(out);
      }catch(err){reject(err);}
    };im.src=String(fr.result||'');};fr.readAsDataURL(file);
  });
}
function toast31(text){
  const t=q31('#toast');if(!t){console.info(text);return;}t.textContent=text;t.classList.add('show');clearTimeout(window.__v31toast);window.__v31toast=setTimeout(()=>t.classList.remove('show'),3000);
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
    if(src){
      const current=holder.querySelector(':scope > img.v31-nav-img');
      if(current?.getAttribute('src')!==src)holder.innerHTML=`<img class="v31-nav-img" src="${src}" alt="">`;
    }else if(holder.querySelector(':scope > img.v31-nav-img'))holder.innerHTML=holder.dataset.v31Original;
  }
}
function bg31(el,src){
  if(!el)return;
  if(src){
    if(el.dataset.v31BgSrc===src)return;
    el.style.setProperty('background-image',`linear-gradient(180deg,rgba(5,45,35,.10),rgba(3,36,29,.52)),url("${src}")`,'important');
    el.style.setProperty('background-size','cover','important');
    el.style.setProperty('background-position','center','important');
    el.style.setProperty('background-repeat','no-repeat','important');
    el.dataset.v31Bg='1';el.dataset.v31BgSrc=src;
  }else if(el.dataset.v31Bg==='1'){
    el.style.removeProperty('background-image');el.style.removeProperty('background-size');el.style.removeProperty('background-position');el.style.removeProperty('background-repeat');
    delete el.dataset.v31Bg;delete el.dataset.v31BgSrc;
  }
}
function tileIcon31(el,src,fallback){
  if(!el)return;
  if(!el.dataset.v31Original)el.dataset.v31Original=el.innerHTML||fallback||'';
  const current=el.querySelector(':scope > img[data-v31-tile-icon]');
  if(src){
    if(current?.getAttribute('src')===src)return;
    el.innerHTML=`<img data-v31-tile-icon="1" src="${src}" alt="" style="display:block;width:100%;height:100%;object-fit:contain;border-radius:inherit;padding:2px">`;
  }else if(current){
    el.innerHTML=el.dataset.v31Original||fallback||'';
  }
}
function quickIconHolder31(button,fallback){
  if(!button)return null;
  let holder=button.querySelector(':scope > .v31-quick-icon');
  if(holder)return holder;
  holder=document.createElement('span');
  holder.className='v31-quick-icon';
  holder.style.cssText='display:inline-grid;place-items:center;width:34px;height:34px;margin-right:4px;vertical-align:middle;font-size:24px;border-radius:10px;overflow:hidden';
  holder.textContent=fallback;
  const textNode=[...button.childNodes].find(n=>n.nodeType===3&&String(n.textContent||'').trim());
  if(textNode){holder.textContent=String(textNode.textContent||'').trim()||fallback;button.replaceChild(holder,textNode);}
  else button.prepend(holder);
  return holder;
}
function ensureFastBiebShell31(){
  let button=q31('#snBiebHome73');
  if(button)return button;
  const quick=q31('.quick');if(!quick)return null;
  button=document.createElement('button');
  button.id='snBiebHome73';button.className='sn-bieb-home sn-bieb-home-shell';button.type='button';
  button.innerHTML='<span class="icon">📚</span><span><strong>De Bieb</strong><small>Vul je eigen boekenkast en bouw met lezen je Snazzle-leeshoek.</small></span><span class="arrow">›</span>';
  button.addEventListener('click',async()=>{
    if(window.SnazzleBiebV73?.open){window.SnazzleBiebV73.open();return;}
    button.setAttribute('aria-busy','true');
    try{
      if(typeof window.__snazzleImport==='function')await window.__snazzleImport('./snazzle-bieb-v73.js');
      else await import('./snazzle-bieb-v73.js?v=264');
      window.SnazzleBiebV73?.open?.();
    }catch(err){console.warn('Snazzle Bieb snel openen',err);toast31('De Bieb wordt nog geladen…');}
    finally{button.removeAttribute('aria-busy');}
  });
  quick.insertAdjacentElement('afterend',button);
  return button;
}

function saveCentralKey31(key,data){
  let tries=0;
  const run=()=>{
    const api=window.SnazzleVisualSyncV54;
    api?.markDirty?.(key);
    if(api?.saveKey){Promise.resolve(api.saveKey(key,data)).catch(()=>{});return;}
    if(api?.save){Promise.resolve(api.save(key,data)).catch(()=>{});return;}
    if(api?.push){Promise.resolve(api.push()).catch(()=>{});return;}
    if(++tries<120)setTimeout(run,500);
  };
  setTimeout(run,60);
}
async function clearCentral31(key){
  for(let i=0;i<120;i++){
    const api=window.SnazzleVisualSyncV54;
    api?.markDirty?.(key);
    if(api?.clear){try{return await api.clear(key);}catch{return false;}}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  return false;
}
async function applyExtraImages31(){
  bg31(q31('#bigStart'),await get31('mainStartCard'));
  bg31(q31('#snArLaunch'),await get31('arCard'));
  bg31(q31('#findsBtn')||q31('.finds'),await get31('quickFinds'));
  bg31(q31('#profileBtn')||q31('.profile'),await get31('quickProfile'));
  bg31(q31('#snBiebHome73')||q31('.sn-bieb-home'),await get31('biebCard'));
  const collectionBg31=await get31('collectionCard');
  bg31(q31('#collectionHomeCard')||q31('.collection-home-card'),collectionBg31);
  const newsBg31=await get31('newsCard');
  bg31(q31('#snNewsLaunch')||q31('.sn-news-launch'),newsBg31);
  bg31(q31('.home-card.sn-news-launch-card'),newsBg31);

  tileIcon31(q31('#bigStart .compass'),await get31('mainStartIcon'),'🧭');
  tileIcon31(q31('#snArLaunch .sn-ar-icon'),await get31('arTileIcon'),'📷');
  tileIcon31(quickIconHolder31(q31('#findsBtn'),'🏆'),await get31('quickFindsIcon'),'🏆');
  tileIcon31(quickIconHolder31(q31('#profileBtn'),'👤'),await get31('quickProfileIcon'),'👤');
  tileIcon31(q31('#snBiebHome73 .icon'),await get31('biebTileIcon'),'📚');
  tileIcon31(q31('#collectionHomeCard .collection-home-icon'),await get31('collectionTileIcon'),'✨');
  tileIcon31(q31('#snNewsLaunch .sn-news-launch-icon'),await get31('newsTileIcon'),'🦆');

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
  item.dataset.assetKey=key;input.dataset.assetKey=key;
  input.onchange=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    const preview=item.querySelector('.v31-image-preview');const previous=preview?.innerHTML||'';
    if(preview)preview.textContent='Afbeelding verwerken…';
    try{
      window.SnazzleVisualSyncV54?.markDirty?.(key);
      const icon=/Icon$|TileIcon$|^nav/.test(key);
      const data=await compress31(file,icon?720:key.includes('Character')?950:1500,icon?.90:.87);
      await set31(key,data);input.value='';
      if(preview)preview.innerHTML=previewHtml31(data);
      await applyExtraImages31();
      document.dispatchEvent(new CustomEvent('snazzle:visual-asset-changed',{detail:{key,source:'v31'}}));
      saveCentralKey31(key,data);
      toast31('Afbeelding aangepast ✓');
    }catch(err){
      if(preview)preview.innerHTML=previous;
      console.error('Snazzle afbeelding upload',key,err);
      toast31(err?.message||'Opslaan mislukt');
    }
  };
  remove.onclick=async()=>{
    window.SnazzleVisualSyncV54?.markDirty?.(key);
    await del31(key);item.querySelector('.v31-image-preview').innerHTML=previewHtml31('');await applyExtraImages31();
    document.dispatchEvent(new CustomEvent('snazzle:visual-asset-changed',{detail:{key,source:'v31',deleted:true}}));
    const cleared=await clearCentral31(key);toast31(cleared?'Afbeelding overal verwijderd':'Afbeelding verwijderd; centrale sync volgt');
  };
  grid.appendChild(item);
}
async function ensureManager31(){
  const admin=q31('#imagesAdmin');if(!admin||q31('#v31ImageManager',admin))return;
  const box=document.createElement('div');box.id='v31ImageManager';box.className='v31-image-manager';
  box.innerHTML='<h3>🖼️ Alle app-afbeeldingen</h3><p>Hier pas je de zichtbare afbeeldingen én tegel-iconen van de home, Snazzles, dorpen en het ondermenu zelf aan. Deze beeldkeuzes worden centraal gesynchroniseerd zodat bezoekers dezelfde app-look krijgen.</p><div class="v31-image-grid" id="v31ImageGrid"></div><div class="v31-manager-note"><b>Waar wijzig je de rest?</b><br>Hunt-foto’s: <b>Beheer → Hunts</b> · Nieuwsberichten/posters: <b>Beheer → Nieuws</b> · Snazzle Card-afbeeldingen: <b>Beheer → Kaarten</b> · Productfoto’s: webshopbeheer. De home-tegels en iconen pas je hierboven aan.</div>';
  admin.appendChild(box);const grid=q31('#v31ImageGrid',box);
  await addLocalCard31(grid,'profileImage','Logo / Snazzle linksboven');
  await addLocalCard31(grid,'heroImage','Grote Hunt-afbeelding');
  await addLocalCard31(grid,'homeImage1','Oude home banner 1 / fallback');
  await addLocalCard31(grid,'homeImage2','Actie / evenement afbeelding');
  for(const [key,label] of extraAssets31)await addDbCard31(grid,key,label);
  wrapVillages31();
  for(const b of qa31('.village'))await addDbCard31(grid,'village:'+slug31(villageName31(b)),`Dorpkaart ${villageName31(b)}`);
}

function hideOldExtraManager31(){
  const old=q31('#referenceAssets');if(old)old.style.display='none';
}
function expectedImageCards31(){
  return 4 + extraAssets31.length + qa31('.village').length;
}
async function repairImageManager31(){
  const admin=q31('#imagesAdmin');if(!admin)return false;
  let manager=q31('#v31ImageManager',admin);
  const current=manager?.querySelectorAll('.v31-image-item').length||0;
  const expected=expectedImageCards31();
  if(!manager||current<expected){
    manager?.remove();
    await ensureManager31();
    manager=q31('#v31ImageManager',admin);
  }
  return !!manager;
}
async function sync31(){
  cleanWelcome31();structureHero31();wrapVillages31();applyLegacyImages31();hideOldExtraManager31();ensureFastBiebShell31();
  // Bouw Beheer → Afbeeldingen altijd eerst. Als een losse home-tegel later faalt,
  // blijft de beheerpagina daardoor toch compleet beschikbaar.
  await repairImageManager31();
  await applyExtraImages31();
}
function queue31(){if(queued31)return;queued31=true;setTimeout(async()=>{queued31=false;try{await sync31();}catch(e){console.warn('Snazzle v31',e);}},140);}
function observe31(){
  new MutationObserver(mutations=>{
    if(mutations.every(m=>m.target?.closest?.('#v31ImageManager,#v32PageAddon')))return;
    queue31();
  }).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    const imageTab=e.target.closest?.('[data-tab="imagesAdmin"]');
    if(imageTab){
      setTimeout(()=>repairImageManager31().catch(err=>console.warn('Snazzle compleet afbeeldingsbeheer',err)),40);
      setTimeout(()=>repairImageManager31().catch(()=>{}),450);
      return;
    }
    if(e.target.closest?.('.village,#saveNameBtn,[data-tab]'))setTimeout(queue31,80);
  });
}
async function init31(){
  if(window.__snazzleV31)return;window.__snazzleV31=true;ensureCss31();await sync31();observe31();console.info(`Snazzle clean home ${V31} geladen`);
}
document.addEventListener('snazzle:admin-ui-ready',()=>setTimeout(()=>repairImageManager31().catch(()=>{}),30));
document.addEventListener('snazzle:visual-sync-ready',()=>setTimeout(()=>repairImageManager31().catch(()=>{}),80));
document.addEventListener('snazzle:visual-assets-updated',()=>{cache31.clear();queue31();});
document.addEventListener('snazzle:visual-asset-changed',event=>{const key=String(event.detail?.key||'');if(key)cache31.delete(key);setTimeout(queue31,20);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init31,{once:true});else init31();
setTimeout(()=>repairImageManager31().catch(()=>{}),900);
setTimeout(()=>repairImageManager31().catch(()=>{}),2200);
setTimeout(()=>repairImageManager31().catch(()=>{}),5000);
window.SnazzleImageManagerV31={repair:repairImageManager31,expected:expectedImageCards31};