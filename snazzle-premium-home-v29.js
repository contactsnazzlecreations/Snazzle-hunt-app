// Snazzle Hunt — Premium Adventure Home v29
// Bouwt voort op v28 zonder bestaande hunt-, menu- of beheerfuncties te vervangen.

const V29='29.0.0';
const q29=(s,r=document)=>r.querySelector(s);
const qa29=(s,r=document)=>[...r.querySelectorAll(s)];
const DB29='snazzleVisualAssetsV28';
const STORE29='assets';
let db29Promise=null;
let sync29Queued=false;
let leaf29Timer=null;
let orb29Timer=null;

function ensureCss29(){
  if(q29('#snazzlePremiumHomeV29'))return;
  const l=document.createElement('link');l.id='snazzlePremiumHomeV29';l.rel='stylesheet';l.href='./snazzle-premium-home-v29.css?v=29';document.head.appendChild(l);
}
function openDb29(){
  if(db29Promise)return db29Promise;
  db29Promise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB29,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE29))req.result.createObjectStore(STORE29);};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Afbeeldingenopslag niet beschikbaar'));
  });
  return db29Promise;
}
async function get29(key){
  try{const db=await openDb29();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE29,'readonly');const r=tx.objectStore(STORE29).get(key);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error);});}
  catch{return '';}
}
async function set29(key,value){
  const db=await openDb29();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE29,'readwrite');tx.objectStore(STORE29).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
}
async function del29(key){
  const db=await openDb29();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE29,'readwrite');tx.objectStore(STORE29).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
}
function compress29(file,max=900,quality=.9){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/'))return reject(new Error('Kies een afbeelding'));
    const fr=new FileReader();fr.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
    fr.onload=()=>{const im=new Image();im.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));im.onload=()=>{const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height,s=Math.min(1,max/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));c.getContext('2d').drawImage(im,0,0,c.width,c.height);let out=c.toDataURL('image/webp',quality);if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/png');resolve(out);};im.src=fr.result;};fr.readAsDataURL(file);
  });
}
function toast29(t){const el=q29('#toast');if(!el)return;el.textContent=t;el.classList.add('show');clearTimeout(window.__v29toast);window.__v29toast=setTimeout(()=>el.classList.remove('show'),2400);}

function greeting29(){
  const w=q29('#welcomeText');if(!w)return;
  const m=(w.textContent||'').match(/^Welkom,\s*(.+)!$/i);
  if(m)w.textContent=`Hoi ${m[1]}!`;
  else if(/^Welkom!$/i.test(w.textContent||''))w.textContent='Hoi!';
}

function sceneCharacter29(slot,src,fallback='🦆'){
  if(!slot)return;
  const current=slot.querySelector('img');
  if(src){
    if(current?.getAttribute('src')===src)return;
    slot.innerHTML=`<img src="${src}" alt="Snazzle">`;
  }else if(!slot.querySelector('.v29-duck-fallback'))slot.innerHTML=`<span class="v29-duck-fallback">${fallback}</span>`;
}

async function ensureMapWorld29(){
  const hero=q29('#hero');if(!hero)return;
  let world=q29('#v29MapWorld');
  if(!world){
    world=document.createElement('div');world.id='v29MapWorld';world.className='v29-mapworld';world.setAttribute('aria-hidden','true');
    world.innerHTML=`
      <span class="v29-map-sign">SNAZZLE ROUTE</span>
      <span class="v29-tree t1">🌳</span><span class="v29-tree t2">🌲</span><span class="v29-tree t3">🌳</span><span class="v29-tree t4">🌲</span><span class="v29-tree t5">🌳</span>
      <span class="v29-landmark windmill">🌾</span><span class="v29-landmark church">⛪</span><span class="v29-landmark castle">🏰</span><span class="v29-bridge">🌉</span>
      <span class="v29-map-pin p1"><span>?</span></span><span class="v29-map-pin p2"><span>?</span></span><span class="v29-map-pin p3"><span>✦</span></span>
      <span class="v29-map-snazzle s1" data-map-snazzle="1"></span><span class="v29-map-snazzle s2" data-map-snazzle="2"></span><span class="v29-map-snazzle s3" data-map-snazzle="3"></span>`;
    hero.insertBefore(world,hero.firstChild);
  }
  const profile=q29('#profileLogo')?.getAttribute('src')||'';
  const a1=await get29('mapSnazzle1'),a2=await get29('mapSnazzle2'),a3=await get29('mapSnazzle3');
  sceneCharacter29(q29('[data-map-snazzle="1"]',world),a1||profile,'🦆');
  sceneCharacter29(q29('[data-map-snazzle="2"]',world),a2||profile,'🐤');
  sceneCharacter29(q29('[data-map-snazzle="3"]',world),a3||profile,'🦆');
}

function ensureQuickDeck29(){
  const quick=q29('.quick');if(!quick)return;
  const collection=q29('#collectionHomeCard');
  if(collection&&collection.parentElement!==quick){
    const profile=q29('#profileBtn',quick);
    profile?quick.insertBefore(collection,profile):quick.appendChild(collection);
  }
  const finds=q29('#findsBtn');if(finds){const strong=finds.querySelector('strong'),small=finds.querySelector('small');if(strong)strong.textContent='Mijn vondsten';if(small)small.textContent='Je gevonden Snazzles';}
  if(collection){const strong=collection.querySelector('strong'),small=collection.querySelector('small');if(strong)strong.textContent='Collectie';if(small)small.textContent='Kaarten & beloningen';}
  const profile=q29('#profileBtn');if(profile){const strong=profile.querySelector('strong'),small=profile.querySelector('small');if(strong)strong.textContent='Profiel';if(small)small.textContent='Naam & avontuur';}
}

function preview29(src){return src?`<img src="${src}" alt="Voorbeeld" style="width:100%;height:100%;object-fit:contain;display:block">`:'Nog geen afbeelding';}
async function addMapAdmin29(){
  const grid=q29('#referenceAssetGrid');if(!grid||q29('[data-v29-map-admin="1"]',grid))return;
  const defs=[
    ['mapSnazzle1','Snazzle op de kaart 1','Hoofd-Snazzle op de grote avonturenkaart'],
    ['mapSnazzle2','Snazzle op de kaart 2','Tweede Snazzle op de grote avonturenkaart'],
    ['mapSnazzle3','Snazzle op de kaart 3','Derde Snazzle op de grote avonturenkaart']
  ];
  for(const [key,label,hint] of defs){
    const src=await get29(key),card=document.createElement('div');card.className='reference-asset-card';card.dataset.v29MapAdmin='1';card.dataset.assetKey=key;
    card.innerHTML=`<strong>${label}</strong><div class="reference-asset-preview" title="${hint}">${preview29(src)}</div><input type="file" accept="image/*"><button type="button">Afbeelding verwijderen</button>`;
    const input=card.querySelector('input'),remove=card.querySelector('button');
    input.onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=await compress29(file);await set29(key,data);input.value='';card.querySelector('.reference-asset-preview').innerHTML=preview29(data);await ensureMapWorld29();toast29('Kaart-Snazzle opgeslagen ✨');}catch(err){toast29(err.message||'Opslaan mislukt');}};
    remove.onclick=async()=>{await del29(key);card.querySelector('.reference-asset-preview').innerHTML=preview29('');await ensureMapWorld29();toast29('Kaart-Snazzle verwijderd');};
    grid.appendChild(card);
  }
}

function ensureFireflies29(){
  if(q29('#v29Fireflies'))return;
  const layer=document.createElement('div');layer.id='v29Fireflies';layer.className='v29-firefly-layer';layer.setAttribute('aria-hidden','true');
  [[7,17],[18,42],[90,21],[78,48],[13,67],[93,73],[34,88],[62,13],[51,61],[82,89],[28,8],[5,51],[69,31],[40,25]].forEach(([x,y],i)=>{const d=document.createElement('i');d.className='v29-firefly';d.style.left=x+'%';d.style.top=y+'%';d.style.animationDelay=(i*.57)+'s';d.style.animationDuration=(7+(i%4)*1.15)+'s';layer.appendChild(d);});
  document.body.prepend(layer);
}
function magic29(x=innerWidth/2,y=innerHeight/2){
  const visitor=q29('#snazzleVisitor');if(visitor){visitor.click();return;}
  const h=q29('.magic-hotspot');if(h){h.click();return;}
  if(navigator.vibrate)navigator.vibrate(20);toast29('✨ Geheime Snazzle-magie!');
}
function secretOkay29(){return !document.hidden&&!q29('.sheet.show')&&!q29('.onboarding.show')&&!q29('#snazzleMagicOverlay.show');}
function leaf29(){
  if(!secretOkay29())return;
  let b=q29('#v29Leaf');if(!b){b=document.createElement('button');b.id='v29Leaf';b.type='button';b.className='v29-secret-leaf';b.textContent='🍃';b.setAttribute('aria-label','Geheim bewegend blaadje');document.body.appendChild(b);b.onclick=e=>{e.preventDefault();const r=b.getBoundingClientRect();b.classList.remove('show');magic29(r.left,r.top);};}
  b.style.left=(Math.random()>.5?'-35px':Math.max(5,innerWidth-55)+'px');b.style.top='-45px';b.classList.remove('show');void b.offsetWidth;b.classList.add('show');setTimeout(()=>b.classList.remove('show'),9400);
}
function orb29(){
  if(!secretOkay29())return;
  let b=q29('#v29Orb');if(!b){b=document.createElement('button');b.id='v29Orb';b.type='button';b.className='v29-secret-orb';b.setAttribute('aria-label','Geheim lichtje');document.body.appendChild(b);b.onclick=e=>{e.preventDefault();const r=b.getBoundingClientRect();b.classList.remove('show');magic29(r.left+r.width/2,r.top+r.height/2);};}
  b.style.left=Math.round(innerWidth*(.12+Math.random()*.68))+'px';b.style.top=Math.round(innerHeight*(.45+Math.random()*.3))+'px';b.classList.remove('show');void b.offsetWidth;b.classList.add('show');setTimeout(()=>b.classList.remove('show'),7600);
}
function schedule29(){
  clearTimeout(leaf29Timer);clearTimeout(orb29Timer);
  leaf29Timer=setTimeout(function run(){leaf29();leaf29Timer=setTimeout(run,70000+Math.random()*70000);},26000+Math.random()*14000);
  orb29Timer=setTimeout(function run(){orb29();orb29Timer=setTimeout(run,76000+Math.random()*76000);},42000+Math.random()*15000);
}

async function sync29(){greeting29();await ensureMapWorld29();ensureQuickDeck29();await addMapAdmin29();}
function queue29(){if(sync29Queued)return;sync29Queued=true;setTimeout(async()=>{sync29Queued=false;try{await sync29();}catch(e){console.warn('Snazzle v29 sync',e);}},160);}
function observe29(){
  new MutationObserver(queue29).observe(document.body,{childList:true,subtree:true,characterData:true});
  document.addEventListener('change',e=>{if(e.target?.id==='profileImageInput')setTimeout(queue29,260);});
}
async function init29(){
  if(window.__snazzlePremium29)return;window.__snazzlePremium29=true;
  ensureCss29();ensureFireflies29();await sync29();observe29();schedule29();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){queue29();schedule29();}});
  console.info(`Snazzle Premium Home ${V29} geladen`);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init29,{once:true});else init29();
