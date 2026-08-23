// Snazzle Hunt — Adventure Passport layout v27
// Additieve presentatie-/magielaag. Bestaande IDs, menu-items en huntlogica blijven behouden.

const REF_VERSION='1.0.0';
const $r=(s,r=document)=>r.querySelector(s);
const $$r=(s,r=document)=>[...r.querySelectorAll(s)];

const DB_NAME='snazzleVisualAssetsV1';
const DB_STORE='assets';
const assetCache=new Map();
let dbPromise=null;
let observerQueued=false;
let runnerTimer=null;
let peekerTimer=null;
let firstRunner=true;
let firstPeeker=true;

const ASSET_DEFS=[
  {key:'quickFinds',label:'Kaart Mijn vondsten',hint:'Achtergrond van de knop Mijn vondsten.'},
  {key:'quickProfile',label:'Kaart Mijn profiel',hint:'Achtergrond van de knop Mijn profiel.'},
  {key:'guideCharacter',label:'Snazzle gids',hint:'Transparante Snazzle voor menu- en gidsmomenten.'},
  {key:'secretCharacter',label:'Geheime Snazzle',hint:'Snazzle die onverwacht door beeld beweegt en bij geheime magie verschijnt.'},
  {key:'natureCharacter',label:'Natuur Snazzle',hint:'Snazzle voor de natuurwereld.'},
  {key:'celebrationCharacter',label:'Feest / beloning Snazzle',hint:'Snazzle bij magische vondsten en beloningen.'}
];

function ensureThemeLink(){
  if($r('#snazzleReferenceTheme'))return;
  const link=document.createElement('link');
  link.id='snazzleReferenceTheme';
  link.rel='stylesheet';
  link.href='./snazzle-reference-layout.css?v=27';
  document.head.appendChild(link);
}

function openDb(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE);
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Afbeeldingenopslag kon niet worden geopend'));
  });
  return dbPromise;
}

async function dbGet(key){
  if(assetCache.has(key))return assetCache.get(key)||'';
  try{
    const db=await openDb();
    const value=await new Promise((resolve,reject)=>{
      const tx=db.transaction(DB_STORE,'readonly');
      const req=tx.objectStore(DB_STORE).get(key);
      req.onsuccess=()=>resolve(req.result||'');
      req.onerror=()=>reject(req.error);
    });
    assetCache.set(key,value||'');
    return value||'';
  }catch(err){console.warn('Snazzle asset lezen mislukt',err);return '';}
}

async function dbSet(key,value){
  const db=await openDb();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).put(value,key);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
  assetCache.set(key,value||'');
}

async function dbDelete(key){
  try{
    const db=await openDb();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(DB_STORE,'readwrite');
      tx.objectStore(DB_STORE).delete(key);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
    });
  }finally{assetCache.set(key,'');}
}

function compressImage(file,max=1200,quality=.74){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/'))return reject(new Error('Kies een afbeelding.'));
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen.'));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend.'));
      img.onload=()=>{
        const scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
        canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
        const ctx=canvas.getContext('2d',{alpha:false});
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function slugVillage(name){
  return String(name||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function villageNameFromButton(btn){return (btn?.textContent||'').replace(/^\s*📍\s*/,'').trim();}
function activeVillage(){return ($r('#chosenVillageLabel')?.textContent||'').replace(/^\s*📍\s*/,'').trim()||'Kies een dorp';}

function countFindings(){
  const list=$r('#findsList');
  if(!list)return 0;
  const items=$$r('.listitem',list);
  if(items.length===1&&/nog niets gevonden/i.test(items[0].textContent||''))return 0;
  return items.length;
}

function ensurePassport(){
  const app=$r('.app'),top=$r('.top'),welcome=$r('#welcomeText');
  if(!app||!top||!welcome)return;
  let passport=$r('#snazzlePassport');
  if(!passport){
    passport=document.createElement('section');
    passport.id='snazzlePassport';
    passport.className='snazzle-passport';
    passport.innerHTML=`<div class="passport-kicker">Mijn Snazzle paspoort</div><div class="passport-welcome-slot"></div><div class="passport-stats"><div class="passport-stat"><strong id="passportFinds">0</strong><small>Snazzles gevonden</small></div><div class="passport-stat"><strong id="passportVillage">—</strong><small>gekozen dorp</small></div><div class="passport-stat"><strong>Explorer</strong><small>klaar voor avontuur</small></div></div>`;
    top.insertAdjacentElement('afterend',passport);
  }
  const slot=$r('.passport-welcome-slot',passport);
  if(slot&&welcome.parentElement!==slot)slot.appendChild(welcome);
  updatePassport();
}

function updatePassport(){
  const finds=$r('#passportFinds'),village=$r('#passportVillage');
  if(finds)finds.textContent=String(countFindings());
  if(village)village.textContent=activeVillage();
}

function ensureAdventureHero(){
  const hero=$r('#hero'),bigStart=$r('#bigStart');
  if(!hero||!bigStart)return;
  const small=hero.querySelector(':scope > small');
  if(small)small.textContent='Snazzle avontuur';
  let title=$r('#adventureTitle');
  if(!title){
    title=document.createElement('h2');title.id='adventureTitle';title.className='adventure-title';title.textContent='Klaar voor avontuur?';
    const p=hero.querySelector(':scope > p');
    if(p)hero.insertBefore(title,p);else hero.appendChild(title);
  }
  if(bigStart.parentElement!==hero)hero.appendChild(bigStart);
  if(!$r('.adventure-route',hero)){
    const route=document.createElement('div');route.className='adventure-route';route.setAttribute('aria-hidden','true');
    route.innerHTML='<span class="route-mark one">?</span><span class="route-mark two">✦</span><span class="route-mark three">?</span><span class="route-duck">🦆</span>';
    hero.insertBefore(route,hero.firstChild);
  }
}

function relabelExistingImageAdmin(){
  const images=$r('#imagesAdmin');if(!images)return;
  $$r('h3',images).forEach(h=>{
    const t=(h.textContent||'').trim();
    if(t==='Welkomstafbeelding')h.textContent='Grote Hunt-kaart / avontuur-afbeelding';
    if(t==='Profielfoto / logo')h.textContent='Snazzle logo / profielfoto';
    if(t==='Extra afbeelding 1')h.textContent='Snazzle nieuws-afbeelding';
    if(t==='Extra afbeelding 2')h.textContent='Actie / evenement-afbeelding';
  });
  const intro=images.querySelector(':scope > p');
  if(intro)intro.textContent='Deze algemene afbeeldingen kun je zelf blijven vervangen. De extra thema-afbeeldingen hieronder worden apart bewaard op dit toestel.';
}

function assetPreviewHtml(src){return src?`<img src="${src}" alt="Voorbeeld">`:'Nog geen afbeelding';}

async function buildReferenceAssetAdmin(){
  const images=$r('#imagesAdmin');if(!images||$r('#referenceAssets',images))return;
  const wrap=document.createElement('div');wrap.id='referenceAssets';wrap.className='reference-assets';
  wrap.innerHTML='<h3>✨ Thema-afbeeldingen & Snazzle-personages</h3><p>Hier kun je de nieuwe avonturenlayout zelf voorzien van jouw eigen afbeeldingen. Deze extra thema-afbeeldingen worden op dit toestel opgeslagen; de normale Hunt-foto blijft via het bestaande Hunt-beheer lopen.</p><div class="reference-asset-grid" id="referenceAssetGrid"></div><h3 style="margin-top:17px">🏘️ Afbeeldingen per dorp</h3><p>Elk dorpkaartje kan zijn eigen foto krijgen.</p><div class="reference-village-assets" id="referenceVillageAssets"></div>';
  images.appendChild(wrap);
  const grid=$r('#referenceAssetGrid',wrap);
  for(const def of ASSET_DEFS){
    const src=await dbGet(def.key);
    const card=document.createElement('div');card.className='reference-asset-card';card.dataset.assetKey=def.key;
    card.innerHTML=`<strong>${def.label}</strong><div class="reference-asset-preview" title="${def.hint}">${assetPreviewHtml(src)}</div><input type="file" accept="image/*"><button type="button">Afbeelding verwijderen</button>`;
    const input=card.querySelector('input'),remove=card.querySelector('button');
    input.onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{const data=await compressImage(file,def.key.includes('Character')?900:1200,def.key.includes('Character')?.78:.74);await dbSet(def.key,data);input.value='';await applyAllAssets();renderAssetPreview(card,data);showLocalToast('Afbeelding opgeslagen ✨');}
      catch(err){showLocalToast(err.message||'Opslaan mislukt');}
    };
    remove.onclick=async()=>{await dbDelete(def.key);renderAssetPreview(card,'');await applyAllAssets();showLocalToast('Afbeelding verwijderd');};
    grid.appendChild(card);
  }
  await syncVillageAssetAdmin();
}

function renderAssetPreview(card,src){
  const p=card?.querySelector('.reference-asset-preview');if(!p)return;p.innerHTML=assetPreviewHtml(src);
}

async function syncVillageAssetAdmin(){
  const box=$r('#referenceVillageAssets');if(!box)return;
  const names=[...new Set($$r('.village').map(villageNameFromButton).filter(Boolean))];
  for(const name of names){
    const slug=slugVillage(name),key='village:'+slug;
    if(box.querySelector(`[data-village-asset="${CSS.escape(slug)}"]`))continue;
    const src=await dbGet(key);
    const row=document.createElement('div');row.className='reference-village-row';row.dataset.villageAsset=slug;
    row.innerHTML=`<div class="reference-asset-preview">${assetPreviewHtml(src)}</div><div><strong>${name}</strong><input type="file" accept="image/*"><button type="button">Verwijderen</button></div>`;
    const input=row.querySelector('input'),remove=row.querySelector('button');
    input.onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{const data=await compressImage(file,1200,.74);await dbSet(key,data);input.value='';renderAssetPreview(row,data);await applyVillageAssets();showLocalToast(`${name} aangepast ✨`);}
      catch(err){showLocalToast(err.message||'Opslaan mislukt');}
    };
    remove.onclick=async()=>{await dbDelete(key);renderAssetPreview(row,'');await applyVillageAssets();showLocalToast(`${name} afbeelding verwijderd`);};
    box.appendChild(row);
  }
}

function showLocalToast(message){
  const t=$r('#toast');
  if(t){t.textContent=message;t.classList.add('show');clearTimeout(window.__refToast);window.__refToast=setTimeout(()=>t.classList.remove('show'),2600);return;}
  console.info(message);
}

function setBackgroundAsset(el,src,overlay){
  if(!el)return;
  if(src){
    el.style.setProperty('background-image',`${overlay},url("${src}")`,'important');
    el.style.setProperty('background-size','cover','important');
    el.style.setProperty('background-position','center','important');
  }else{
    el.style.removeProperty('background-image');
    el.style.removeProperty('background-size');
    el.style.removeProperty('background-position');
  }
}

async function applyVillageAssets(){
  for(const btn of $$r('.village')){
    const name=villageNameFromButton(btn),key='village:'+slugVillage(name),src=await dbGet(key);
    if(src)setBackgroundAsset(btn,src,'linear-gradient(180deg,rgba(7,55,41,.06),rgba(3,37,29,.66))');
    else btn.style.removeProperty('background-image');
  }
}

function rememberOriginal(el){if(el&&!el.dataset.refOriginalHtml)el.dataset.refOriginalHtml=el.innerHTML;}
function restoreOriginal(el){if(el?.dataset.refOriginalHtml!==undefined){el.innerHTML=el.dataset.refOriginalHtml;delete el.dataset.refOriginalHtml;}}
function setCharacterIn(el,src,alt='Snazzle'){
  if(!el)return;
  if(src){
    rememberOriginal(el);
    if(el.querySelector(':scope > img[data-ref-character]')?.src===src)return;
    el.innerHTML='';const img=document.createElement('img');img.src=src;img.alt=alt;img.dataset.refCharacter='1';img.style.cssText='width:100%;height:100%;object-fit:contain;display:block;';el.appendChild(img);
  }else restoreOriginal(el);
}

async function applyCharacterAssets(){
  const guide=await dbGet('guideCharacter');
  const secret=await dbGet('secretCharacter');
  const nature=await dbGet('natureCharacter');
  const celebration=await dbGet('celebrationCharacter');

  const menuDuck=$r('.quick-menu-duck');
  if(menuDuck){menuDuck.style.overflow='hidden';setCharacterIn(menuDuck,guide,'Snazzle gids');}

  const visitorIcon=$r('#snazzleVisitor b');
  if(visitorIcon){visitorIcon.style.width='42px';visitorIcon.style.height='42px';setCharacterIn(visitorIcon,secret,'Geheime Snazzle');}

  const magicBig=$r('#magicBig');
  if(magicBig&&secret){
    if(!magicBig.querySelector('img[data-ref-character]')){
      magicBig.innerHTML=`<img data-ref-character="1" src="${secret}" alt="Geheime Snazzle" style="width:88px;height:88px;object-fit:contain;display:block;margin:0 auto">`;
    }
  }

  const natureHero=$r('.nature-hero');
  let natureImg=$r('.reference-nature-character',natureHero||document);
  if(natureHero&&nature){
    if(!natureImg){natureImg=document.createElement('img');natureImg.className='reference-nature-character';natureImg.alt='Natuur Snazzle';natureImg.style.cssText='position:absolute;right:10px;bottom:8px;width:70px;height:70px;object-fit:contain;z-index:3;filter:drop-shadow(0 4px 3px rgba(0,0,0,.25))';natureHero.appendChild(natureImg);}natureImg.src=nature;
  }else natureImg?.remove();

  if(celebration){
    $$r('.home-magic-card .big').forEach(big=>{
      if(!big.querySelector('img[data-ref-character]'))big.innerHTML=`<img data-ref-character="1" src="${celebration}" alt="Feest Snazzle" style="width:88px;height:88px;object-fit:contain;display:block;margin:0 auto">`;
    });
  }
}

async function applyAllAssets(){
  const finds=await dbGet('quickFinds'),profile=await dbGet('quickProfile');
  setBackgroundAsset($r('.finds'),finds,'linear-gradient(180deg,rgba(12,90,70,.08),rgba(4,52,42,.72))');
  setBackgroundAsset($r('.profile'),profile,'linear-gradient(180deg,rgba(23,94,103,.08),rgba(4,49,57,.72))');
  await applyVillageAssets();
  await applyCharacterAssets();
}

function ensureFireflies(){
  if($r('.reference-fireflies'))return;
  const layer=document.createElement('div');layer.className='reference-fireflies';layer.setAttribute('aria-hidden','true');
  const spots=[[7,15],[20,36],[88,21],[74,45],[13,68],[92,72],[35,88],[63,12],[52,62],[81,89],[29,7],[4,48]];
  spots.forEach(([x,y],i)=>{const f=document.createElement('i');f.className='reference-firefly';f.style.left=x+'%';f.style.top=y+'%';f.style.animationDelay=(i*.62)+'s';f.style.animationDuration=(6.5+(i%4)*1.2)+'s';layer.appendChild(f);});
  document.body.prepend(layer);
}

function secretAllowed(){
  return !document.hidden&&!$r('.sheet.show')&&!$r('.onboarding.show')&&!$r('#snazzleMagicOverlay.show')&&!$r('.secret-runner.show')&&!$r('.secret-peeker.show');
}

async function secretVisual(button,kind){
  const src=await dbGet('secretCharacter');
  if(src)button.innerHTML=`<img src="${src}" alt="Geheime Snazzle">`;
  else button.innerHTML='<span class="secret-emoji">🦆</span>';
  button.dataset.kind=kind;
}

function burstAt(x,y){
  const bits=['✦','✨','★','·','💫'];
  for(let i=0;i<11;i++){
    const s=document.createElement('i');s.className='secret-spark';s.textContent=bits[i%bits.length];s.style.left=(x-8+(Math.random()*32-16))+'px';s.style.top=(y-8+(Math.random()*24-12))+'px';s.style.animationDelay=(Math.random()*.14)+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),1200);
  }
}

function triggerExistingMagic(x=innerWidth/2,y=innerHeight/2){
  burstAt(x,y);
  if(navigator.vibrate)navigator.vibrate(22);
  const visitor=$r('#snazzleVisitor');
  if(visitor){visitor.click();return;}
  const hotspot=$r('.magic-hotspot,.extra-magic-hotspot');
  hotspot?.click();
}

async function showRunner(){
  if(!secretAllowed())return;
  let b=$r('#referenceSecretRunner');
  if(!b){b=document.createElement('button');b.id='referenceSecretRunner';b.type='button';b.className='secret-runner';b.setAttribute('aria-label','Geheime bewegende Snazzle');document.body.appendChild(b);}
  await secretVisual(b,'runner');
  const fromLeft=Math.random()>.5;
  const y=Math.round(innerHeight*(.26+Math.random()*.42));
  b.style.top=y+'px';b.style.left=(fromLeft?-82:innerWidth+8)+'px';b.classList.add('show');
  const distance=innerWidth+170;
  const anim=b.animate([
    {transform:'translateX(0) translateY(0) rotate(-4deg)'},
    {offset:.30,transform:`translateX(${(fromLeft?1:-1)*distance*.30}px) translateY(-9px) rotate(4deg)`},
    {offset:.62,transform:`translateX(${(fromLeft?1:-1)*distance*.62}px) translateY(7px) rotate(-5deg)`},
    {transform:`translateX(${(fromLeft?1:-1)*distance}px) translateY(-3px) rotate(5deg)`}
  ],{duration:9200+Math.random()*2300,easing:'linear'});
  b.onclick=e=>{e.preventDefault();e.stopPropagation();anim.cancel();b.classList.remove('show');const r=b.getBoundingClientRect();triggerExistingMagic(r.left+r.width/2,r.top+r.height/2);};
  anim.onfinish=()=>b.classList.remove('show');anim.oncancel=()=>b.classList.remove('show');
}

async function showPeeker(){
  if(!secretAllowed())return;
  let b=$r('#referenceSecretPeeker');
  if(!b){b=document.createElement('button');b.id='referenceSecretPeeker';b.type='button';b.className='secret-peeker';b.setAttribute('aria-label','Geheime Snazzle kijkt mee');document.body.appendChild(b);}
  await secretVisual(b,'peeker');
  const right=Math.random()>.5;
  b.style.top=Math.round(innerHeight*(.35+Math.random()*.35))+'px';b.style.left=right?'auto':'-14px';b.style.right=right?'-14px':'auto';b.style.transform=right?'rotate(-12deg)':'scaleX(-1) rotate(-12deg)';b.classList.add('show');
  const hide=()=>b.classList.remove('show');
  clearTimeout(b.__hideTimer);b.__hideTimer=setTimeout(hide,8500);
  b.onclick=e=>{e.preventDefault();e.stopPropagation();clearTimeout(b.__hideTimer);const r=b.getBoundingClientRect();hide();triggerExistingMagic(r.left+r.width/2,r.top+r.height/2);};
}

function scheduleRunner(){
  clearTimeout(runnerTimer);
  const delay=firstRunner?18000+Math.random()*9000:70000+Math.random()*65000;firstRunner=false;
  runnerTimer=setTimeout(async()=>{await showRunner();scheduleRunner();},delay);
}
function schedulePeeker(){
  clearTimeout(peekerTimer);
  const delay=firstPeeker?33000+Math.random()*14000:60000+Math.random()*65000;firstPeeker=false;
  peekerTimer=setTimeout(async()=>{await showPeeker();schedulePeeker();},delay);
}

function ensureExtraHotspots(){
  const app=$r('.app');if(!app)return;
  if(!$r('.extra-magic-hotspot.four',app)){
    ['four','five'].forEach(cls=>{const b=document.createElement('button');b.type='button';b.className='extra-magic-hotspot '+cls;b.setAttribute('aria-label','Geheime Snazzle ster');b.onclick=e=>{e.stopPropagation();const r=b.getBoundingClientRect();triggerExistingMagic(r.left+r.width/2,r.top+r.height/2);};app.appendChild(b);});
  }
}

function bindObservers(){
  const obs=new MutationObserver(()=>{
    if(observerQueued)return;observerQueued=true;
    requestAnimationFrame(async()=>{
      observerQueued=false;
      ensurePassport();ensureAdventureHero();relabelExistingImageAdmin();updatePassport();
      if($r('#imagesAdmin')){await buildReferenceAssetAdmin();await syncVillageAssetAdmin();}
      await applyAllAssets();ensureExtraHotspots();
    });
  });
  obs.observe(document.body,{childList:true,subtree:true,characterData:true});
}

async function initReferenceLayout(){
  if(window.__snazzleReferenceLayoutLoaded)return;
  window.__snazzleReferenceLayoutLoaded=true;
  ensureThemeLink();
  ensurePassport();
  ensureAdventureHero();
  relabelExistingImageAdmin();
  ensureFireflies();
  ensureExtraHotspots();
  await buildReferenceAssetAdmin();
  await applyAllAssets();
  updatePassport();
  bindObservers();
  scheduleRunner();
  schedulePeeker();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){updatePassport();scheduleRunner();schedulePeeker();}});
  console.info(`Snazzle Adventure Passport ${REF_VERSION} geladen`);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initReferenceLayout,{once:true});else initReferenceLayout();
