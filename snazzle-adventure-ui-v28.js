// Snazzle Hunt — Adventure Passport UI v28
// Presentatie en extra magie; bestaande IDs, knoppen en menu-acties blijven behouden.

const UI28_VERSION = '28.0.0';
const q28 = (s, r=document) => r.querySelector(s);
const qa28 = (s, r=document) => [...r.querySelectorAll(s)];
const DB28 = 'snazzleVisualAssetsV28';
const STORE28 = 'assets';
const cache28 = new Map();
let db28Promise = null;
let ui28Queued = false;
let runner28Timer = null;
let peeker28Timer = null;

const assetDefs28 = [
  ['quickFinds','Kaart Mijn vondsten','Achtergrond van Mijn vondsten'],
  ['quickProfile','Kaart Mijn profiel','Achtergrond van Mijn profiel'],
  ['guideCharacter','Snazzle gids','Snazzle voor gids- en menumomenten'],
  ['secretCharacter','Geheime Snazzle','Snazzle voor geheime bewegende verrassingen'],
  ['natureCharacter','Natuur Snazzle','Snazzle voor de natuurwereld'],
  ['celebrationCharacter','Feest / beloning Snazzle','Snazzle voor vondsten en beloningen']
];

function ensureTheme28(){
  if(q28('#snazzleAdventureThemeV28')) return;
  const l=document.createElement('link');
  l.id='snazzleAdventureThemeV28';l.rel='stylesheet';l.href='./snazzle-reference-layout.css?v=28';
  document.head.appendChild(l);
}

function db28(){
  if(db28Promise) return db28Promise;
  db28Promise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB28,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE28))req.result.createObjectStore(STORE28);};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Afbeeldingenopslag kon niet openen'));
  });
  return db28Promise;
}
async function getAsset28(key){
  if(cache28.has(key)) return cache28.get(key)||'';
  try{
    const db=await db28();
    const value=await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE28,'readonly');const r=tx.objectStore(STORE28).get(key);
      r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error);
    });
    cache28.set(key,value||'');return value||'';
  }catch(e){console.warn('Snazzle afbeelding lezen',e);return '';}
}
async function setAsset28(key,value){
  const db=await db28();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE28,'readwrite');tx.objectStore(STORE28).put(value,key);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  cache28.set(key,value||'');
}
async function deleteAsset28(key){
  const db=await db28();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE28,'readwrite');tx.objectStore(STORE28).delete(key);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  cache28.set(key,'');
}

function compress28(file,max=1200,quality=.82){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/'))return reject(new Error('Kies een afbeelding'));
    const fr=new FileReader();
    fr.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
    fr.onload=()=>{
      const im=new Image();
      im.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));
      im.onload=()=>{
        const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;
        const scale=Math.min(1,max/Math.max(w,h));
        const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
        c.getContext('2d').drawImage(im,0,0,c.width,c.height);
        let out=c.toDataURL('image/webp',quality);
        if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/png');
        resolve(out);
      };
      im.src=fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function toast28(text){
  const t=q28('#toast');if(!t){console.info(text);return;}
  t.textContent=text;t.classList.add('show');clearTimeout(window.__snazzleUi28Toast);
  window.__snazzleUi28Toast=setTimeout(()=>t.classList.remove('show'),2500);
}
function villageName28(text){return String(text||'').replace(/^\s*📍\s*/,'').trim();}
function villageSlug28(text){return String(text||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function currentVillage28(){return villageName28(q28('#chosenVillageLabel')?.textContent)||'Kies een dorp';}
function finds28(){
  const box=q28('#findsList');if(!box)return 0;const rows=qa28('.listitem',box);
  return rows.length===1&&/nog niets gevonden/i.test(rows[0].textContent||'')?0:rows.length;
}

function ensurePassport28(){
  const top=q28('.top'),welcome=q28('#welcomeText');if(!top||!welcome)return;
  let p=q28('#snazzlePassport');
  if(!p){
    p=document.createElement('section');p.id='snazzlePassport';p.className='snazzle-passport';
    p.innerHTML='<div class="passport-kicker">Mijn Snazzle paspoort</div><div class="passport-welcome-slot"></div><div class="passport-stats"><div class="passport-stat"><strong id="passportFinds">0</strong><small>Snazzles gevonden</small></div><div class="passport-stat"><strong id="passportVillage">—</strong><small>gekozen dorp</small></div><div class="passport-stat"><strong>Explorer</strong><small>klaar voor avontuur</small></div></div>';
    top.insertAdjacentElement('afterend',p);
  }
  const slot=q28('.passport-welcome-slot',p);if(slot&&welcome.parentElement!==slot)slot.appendChild(welcome);
  updatePassport28();
}
function updatePassport28(){
  const f=q28('#passportFinds'),v=q28('#passportVillage'),fc=String(finds28()),vc=currentVillage28();if(f&&f.textContent!==fc)f.textContent=fc;if(v&&v.textContent!==vc)v.textContent=vc;
}

function ensureHero28(){
  const hero=q28('#hero'),start=q28('#bigStart');if(!hero||!start)return;
  const small=hero.querySelector(':scope > small');if(small&&small.textContent!=='Snazzle avontuur')small.textContent='Snazzle avontuur';
  if(!q28('#adventureTitle',hero)){
    const h=document.createElement('h2');h.id='adventureTitle';h.className='adventure-title';h.textContent='Klaar voor avontuur?';
    const p=hero.querySelector(':scope > p');p?hero.insertBefore(h,p):hero.appendChild(h);
  }
  if(!q28('.adventure-route',hero)){
    const r=document.createElement('div');r.className='adventure-route';r.setAttribute('aria-hidden','true');
    r.innerHTML='<span class="route-mark one">?</span><span class="route-mark two">✦</span><span class="route-mark three">?</span><span class="route-duck">🦆</span>';
    hero.insertBefore(r,hero.firstChild);
  }
  if(start.parentElement!==hero)hero.appendChild(start);
}

function relabelAdmin28(){
  const box=q28('#imagesAdmin');if(!box)return;
  qa28('h3',box).forEach(h=>{
    const t=(h.textContent||'').trim();
    if(t==='Profielfoto / logo')h.textContent='Snazzle logo / profielfoto';
    if(t==='Welkomstafbeelding')h.textContent='Grote Hunt-kaart / avontuur-afbeelding';
    if(t==='Extra afbeelding 1')h.textContent='Snazzle nieuws-afbeelding';
    if(t==='Extra afbeelding 2')h.textContent='Actie / evenement-afbeelding';
  });
  const intro=box.querySelector(':scope > p');
  if(intro&&!intro.dataset.ui28){intro.dataset.ui28='1';intro.textContent='De bestaande afbeeldingen kun je hier blijven vervangen. Daaronder vind je extra afbeeldingsvakken voor de avonturenlayout.';}
}
function preview28(src){return src?`<img src="${src}" alt="Voorbeeld">`:'Nog geen afbeelding';}
function setPreview28(el,src){const p=el?.querySelector('.reference-asset-preview');if(p&&p.innerHTML!==preview28(src))p.innerHTML=preview28(src);}

async function ensureAssetAdmin28(){
  const images=q28('#imagesAdmin');if(!images||q28('#referenceAssets',images))return;
  const wrap=document.createElement('div');wrap.id='referenceAssets';wrap.className='reference-assets';
  wrap.innerHTML='<h3>✨ Thema-afbeeldingen & Snazzle-personages</h3><p>Deze nieuwe afbeeldingen kun je zelf vervangen. Ze worden in deze eerste versie op dit toestel bewaard.</p><div class="reference-asset-grid" id="referenceAssetGrid"></div><h3 style="margin-top:17px">🏘️ Afbeeldingen per dorp</h3><p>Geef ieder dorpkaartje zijn eigen foto.</p><div class="reference-village-assets" id="referenceVillageAssets"></div>';
  images.appendChild(wrap);
  const grid=q28('#referenceAssetGrid',wrap);
  for(const [key,label,hint] of assetDefs28){
    const src=await getAsset28(key),card=document.createElement('div');card.className='reference-asset-card';card.dataset.assetKey=key;
    card.innerHTML=`<strong>${label}</strong><div class="reference-asset-preview" title="${hint}">${preview28(src)}</div><input type="file" accept="image/*"><button type="button">Afbeelding verwijderen</button>`;
    const input=card.querySelector('input'),remove=card.querySelector('button');
    input.onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{const char=key.endsWith('Character'),data=await compress28(file,char?900:1200,char ? .88 : .82);await setAsset28(key,data);input.value='';setPreview28(card,data);await applyAssets28();toast28('Afbeelding opgeslagen ✨');}
      catch(err){toast28(err.message||'Opslaan mislukt');}
    };
    remove.onclick=async()=>{await deleteAsset28(key);setPreview28(card,'');await applyAssets28();toast28('Afbeelding verwijderd');};
    grid.appendChild(card);
  }
  await syncVillageAdmin28();
}

async function syncVillageAdmin28(){
  const box=q28('#referenceVillageAssets');if(!box)return;
  const names=[...new Set(qa28('.village').map(b=>villageName28(b.textContent)).filter(Boolean))];
  for(const name of names){
    const slug=villageSlug28(name),key=`village:${slug}`;if(box.querySelector(`[data-village-asset="${slug}"]`))continue;
    const src=await getAsset28(key),row=document.createElement('div');row.className='reference-village-row';row.dataset.villageAsset=slug;
    row.innerHTML=`<div class="reference-asset-preview">${preview28(src)}</div><div><strong>${name}</strong><input type="file" accept="image/*"><button type="button">Verwijderen</button></div>`;
    const input=row.querySelector('input'),remove=row.querySelector('button');
    input.onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=await compress28(file,1200,.82);await setAsset28(key,data);input.value='';setPreview28(row,data);await applyVillageImages28();toast28(`${name} aangepast ✨`);}catch(err){toast28(err.message||'Opslaan mislukt');}};
    remove.onclick=async()=>{await deleteAsset28(key);setPreview28(row,'');await applyVillageImages28();toast28(`${name} afbeelding verwijderd`);};
    box.appendChild(row);
  }
}

function setBg28(el,src,overlay){
  if(!el)return;
  if(!src){if(el.dataset.ui28Image==='1'){el.style.removeProperty('background-image');el.style.removeProperty('background-size');el.style.removeProperty('background-position');delete el.dataset.ui28Image;}return;}
  const value=`${overlay},url("${src}")`;
  if(el.style.getPropertyValue('background-image')!==value){el.style.setProperty('background-image',value,'important');el.style.setProperty('background-size','cover','important');el.style.setProperty('background-position','center','important');el.dataset.ui28Image='1';}
}
async function applyVillageImages28(){
  for(const b of qa28('.village')){const name=villageName28(b.textContent),src=await getAsset28(`village:${villageSlug28(name)}`);setBg28(b,src,'linear-gradient(180deg,rgba(5,49,37,.05),rgba(3,37,29,.68))');}
}

function character28(el,src,alt){
  if(!el)return;
  if(!el.dataset.ui28Original)el.dataset.ui28Original=el.innerHTML;
  if(!src){const original=el.dataset.ui28Original;if(el.innerHTML!==original)el.innerHTML=original;return;}
  const current=el.querySelector(':scope > img[data-ui28-character]');if(current?.getAttribute('src')===src)return;
  el.innerHTML=`<img data-ui28-character="1" src="${src}" alt="${alt}" style="width:100%;height:100%;object-fit:contain;display:block">`;
}
async function applyCharacters28(){
  const guide=await getAsset28('guideCharacter'),secret=await getAsset28('secretCharacter'),nature=await getAsset28('natureCharacter'),party=await getAsset28('celebrationCharacter');
  const menu=q28('.quick-menu-duck');if(menu)character28(menu,guide,'Snazzle gids');
  const visitor=q28('#snazzleVisitor b');if(visitor){visitor.style.width='42px';visitor.style.height='42px';character28(visitor,secret,'Geheime Snazzle');}
  const magic=q28('#magicBig');if(magic&&(secret||magic.dataset.ui28Original)){character28(magic,secret,'Geheime Snazzle');if(secret){magic.style.width='90px';magic.style.height='90px';magic.style.margin='0 auto';}else{magic.style.removeProperty('width');magic.style.removeProperty('height');magic.style.removeProperty('margin');}}
  const hero=q28('.nature-hero');let n=hero?.querySelector('.ui28-nature-character');
  if(hero&&nature){if(!n){n=document.createElement('img');n.className='ui28-nature-character';n.alt='Natuur Snazzle';n.style.cssText='position:absolute;right:10px;bottom:8px;width:72px;height:72px;object-fit:contain;z-index:3;filter:drop-shadow(0 4px 3px rgba(0,0,0,.25))';hero.appendChild(n);}if(n.src!==nature)n.src=nature;}else n?.remove();
  qa28('.home-magic-card .big').forEach(big=>{character28(big,party,'Feest Snazzle');if(party){big.style.width='90px';big.style.height='90px';big.style.margin='0 auto';}else{big.style.removeProperty('width');big.style.removeProperty('height');big.style.removeProperty('margin');}});
}
async function applyAssets28(){
  setBg28(q28('.finds'),await getAsset28('quickFinds'),'linear-gradient(180deg,rgba(10,86,66,.06),rgba(4,51,41,.72))');
  setBg28(q28('.profile'),await getAsset28('quickProfile'),'linear-gradient(180deg,rgba(20,91,101,.06),rgba(4,47,56,.72))');
  await applyVillageImages28();await applyCharacters28();
}

function ensureAmbient28(){
  if(q28('.reference-fireflies'))return;
  const layer=document.createElement('div');layer.className='reference-fireflies';layer.setAttribute('aria-hidden','true');
  [[7,15],[20,36],[88,21],[74,45],[13,68],[92,72],[35,88],[63,12],[52,62],[81,89],[29,7],[4,48]].forEach(([x,y],i)=>{const d=document.createElement('i');d.className='reference-firefly';d.style.left=x+'%';d.style.top=y+'%';d.style.animationDelay=(i*.62)+'s';d.style.animationDuration=(6.5+(i%4)*1.2)+'s';layer.appendChild(d);});
  document.body.prepend(layer);
}
function ensureHotspots28(){
  const app=q28('.app');if(!app||q28('.extra-magic-hotspot.four',app))return;
  ['four','five'].forEach(cls=>{const b=document.createElement('button');b.type='button';b.className='extra-magic-hotspot '+cls;b.setAttribute('aria-label','Geheime Snazzle ster');b.onclick=e=>{e.stopPropagation();const r=b.getBoundingClientRect();triggerMagic28(r.left+r.width/2,r.top+r.height/2);};app.appendChild(b);});
}
function secretAllowed28(){return !document.hidden&&!q28('.sheet.show')&&!q28('.onboarding.show')&&!q28('#snazzleMagicOverlay.show')&&!q28('.secret-runner.show')&&!q28('.secret-peeker.show');}
function sparkle28(x,y){
  const bits=['✦','✨','★','·','💫'];for(let i=0;i<11;i++){const s=document.createElement('i');s.className='secret-spark';s.textContent=bits[i%bits.length];s.style.left=(x-8+(Math.random()*32-16))+'px';s.style.top=(y-8+(Math.random()*24-12))+'px';s.style.animationDelay=(Math.random()*.14)+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),1200);}
}
function triggerMagic28(x=innerWidth/2,y=innerHeight/2){
  sparkle28(x,y);if(navigator.vibrate)navigator.vibrate(22);
  const visitor=q28('#snazzleVisitor');if(visitor){visitor.click();return;}
  const star=q28('.magic-hotspot');if(star){star.click();return;}
  toast28('✨ Je hebt een geheime Snazzle ontdekt!');
}
async function secretButton28(b){const src=await getAsset28('secretCharacter');const html=src?`<img src="${src}" alt="Geheime Snazzle">`:'<span class="secret-emoji">🦆</span>';if(b.innerHTML!==html)b.innerHTML=html;}
async function runner28(){
  if(!secretAllowed28())return;let b=q28('#ui28Runner');
  if(!b){b=document.createElement('button');b.id='ui28Runner';b.type='button';b.className='secret-runner';b.setAttribute('aria-label','Geheime bewegende Snazzle');document.body.appendChild(b);}
  await secretButton28(b);const left=Math.random()>.5,y=Math.round(innerHeight*(.27+Math.random()*.39));b.style.top=y+'px';b.style.left=(left?-82:innerWidth+8)+'px';b.classList.add('show');
  const d=innerWidth+170,dir=left?1:-1,anim=b.animate([{transform:'translateX(0) translateY(0) rotate(-4deg)'},{offset:.3,transform:`translateX(${dir*d*.3}px) translateY(-9px) rotate(4deg)`},{offset:.62,transform:`translateX(${dir*d*.62}px) translateY(7px) rotate(-5deg)`},{transform:`translateX(${dir*d}px) translateY(-3px) rotate(5deg)`}],{duration:9000+Math.random()*2400,easing:'linear'});
  b.onclick=e=>{e.preventDefault();e.stopPropagation();const r=b.getBoundingClientRect();anim.cancel();b.classList.remove('show');triggerMagic28(r.left+r.width/2,r.top+r.height/2);};anim.onfinish=()=>b.classList.remove('show');anim.oncancel=()=>b.classList.remove('show');
}
async function peeker28(){
  if(!secretAllowed28())return;let b=q28('#ui28Peeker');
  if(!b){b=document.createElement('button');b.id='ui28Peeker';b.type='button';b.className='secret-peeker';b.setAttribute('aria-label','Geheime Snazzle kijkt mee');document.body.appendChild(b);}
  await secretButton28(b);const right=Math.random()>.5;b.style.top=Math.round(innerHeight*(.35+Math.random()*.34))+'px';b.style.left=right?'auto':'-14px';b.style.right=right?'-14px':'auto';b.style.transform=right?'rotate(-12deg)':'scaleX(-1) rotate(-12deg)';b.classList.add('show');clearTimeout(b.__hide28);b.__hide28=setTimeout(()=>b.classList.remove('show'),8500);
  b.onclick=e=>{e.preventDefault();e.stopPropagation();clearTimeout(b.__hide28);const r=b.getBoundingClientRect();b.classList.remove('show');triggerMagic28(r.left+r.width/2,r.top+r.height/2);};
}
function scheduleSecrets28(){
  clearTimeout(runner28Timer);clearTimeout(peeker28Timer);
  runner28Timer=setTimeout(async function run(){await runner28();runner28Timer=setTimeout(run,65000+Math.random()*65000);},18000+Math.random()*10000);
  peeker28Timer=setTimeout(async function peek(){await peeker28();peeker28Timer=setTimeout(peek,60000+Math.random()*65000);},34000+Math.random()*14000);
}

async function syncUi28(){
  ensurePassport28();ensureHero28();relabelAdmin28();ensureHotspots28();updatePassport28();await ensureAssetAdmin28();await syncVillageAdmin28();await applyAssets28();
}
function queueUi28(){
  if(ui28Queued)return;ui28Queued=true;setTimeout(async()=>{ui28Queued=false;try{await syncUi28();}catch(e){console.warn('Snazzle UI v28',e);}},120);
}
function observeUi28(){new MutationObserver(queueUi28).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('.village,#foundBtn,#saveNameBtn'))setTimeout(updatePassport28,80);});}
async function initUi28(){
  if(window.__snazzleUi28)return;window.__snazzleUi28=true;ensureTheme28();ensureAmbient28();await syncUi28();observeUi28();scheduleSecrets28();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){queueUi28();scheduleSecrets28();}});
  console.info(`Snazzle Adventure Passport ${UI28_VERSION} geladen`);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initUi28,{once:true});else initUi28();
