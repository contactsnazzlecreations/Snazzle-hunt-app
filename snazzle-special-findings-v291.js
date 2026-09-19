// Snazzle Special Findings v291 — aparte, betrouwbare verzameling voor algemene AR Special Snazzles.
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
const LOCAL_KEY='snazzleARCollection';
const PLACE_CACHE_KEY='snazzleARPlaceNamesV292';
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let cloudItems=[];
let worldMap=new Map();
let worldLoadedAt=0;
let userUnsub=null;
let listObserver=null;
let sheetObserver=null;
let renderTimer=null;
let rendering=false;
let activeTab='';
let placeCache=loadPlaceCache();

function loadPlaceCache(){
  try{
    const x=JSON.parse(localStorage.getItem(PLACE_CACHE_KEY)||'{}');
    return x&&typeof x==='object'&&!Array.isArray(x)?x:{};
  }catch{return{};}
}
function savePlaceCache(){
  try{localStorage.setItem(PLACE_CACHE_KEY,JSON.stringify(placeCache));}catch{}
}
function localItems(){
  try{
    const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');
    return Array.isArray(x)?x.filter(v=>v&&v.id):[];
  }catch{return[];}
}
function cleanVillage(v){
  const value=String(v||'Algemeen').trim();
  if(value==='Algemeen / overal')return'Algemeen';
  return value||'Algemeen';
}
function normalize(item){
  const world=worldMap.get(String(item?.id||''))||{};
  return{
    id:String(item?.id||world.id||'').slice(0,120),
    number:String(item?.number||world.number||'—').slice(0,20),
    name:String(item?.name||world.name||'Snazzle').slice(0,60),
    rarity:String(item?.rarity||world.rarity||'SPECIAL').toUpperCase().slice(0,20),
    village:cleanVillage(item?.village||world.village),
    placeName:String(item?.placeName||world.placeName||'').slice(0,80),
    lat:Number(world.lat??item?.lat),
    lon:Number(world.lon??item?.lon),
    caughtAt:String(item?.caughtAt||new Date().toISOString()),
    edition:String(item?.edition||'Special Snazzle').slice(0,60)
  };
}
function mergedItems(){
  const map=new Map();
  [...cloudItems,...localItems()].forEach(raw=>{
    if(!raw?.id)return;
    const item=normalize(raw),prev=map.get(item.id);
    if(!prev||String(item.caughtAt)<String(prev.caughtAt))map.set(item.id,item);
  });
  return[...map.values()].sort((a,b)=>String(b.caughtAt).localeCompare(String(a.caughtAt)));
}
function fmtDate(value){
  const d=new Date(value||0);
  return Number.isNaN(d.getTime())?'Datum onbekend':d.toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'});
}
function bestLocality(address={}){
  return String(address.city||address.town||address.village||address.hamlet||address.municipality||address.county||'').trim();
}
async function reversePlace(item){
  if(item.placeName)return item.placeName;
  const cached=String(placeCache[item.id]||'').trim();
  if(cached)return cached;
  if(!Number.isFinite(item.lat)||!Number.isFinite(item.lon))return item.village==='Algemeen'?'Onbekende plaats':item.village;
  try{
    const url='https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=nl&lat='+encodeURIComponent(item.lat)+'&lon='+encodeURIComponent(item.lon);
    const ctl=new AbortController();
    const timer=setTimeout(()=>ctl.abort(),4500);
    const response=await fetch(url,{signal:ctl.signal,headers:{Accept:'application/json'}});
    clearTimeout(timer);
    if(response.ok){
      const data=await response.json();
      const place=bestLocality(data?.address||{});
      if(place){
        placeCache[item.id]=place;
        savePlaceCache();
        return place;
      }
    }
  }catch{}
  const fallback=item.village==='Algemeen'?'Algemene locatie':item.village;
  placeCache[item.id]=fallback;
  savePlaceCache();
  return fallback;
}
async function enrichPlaces(items){
  const out=[];
  for(const item of items){
    const placeName=await reversePlace(item);
    out.push({...item,placeName});
  }
  return out;
}
function huntCount(){
  const list=$('#findsList');
  if(!list)return 0;
  return[...list.children].filter(el=>{
    if(el.classList.contains('sn-ar-find126'))return false;
    const t=(el.textContent||'').trim();
    return t&&!/^Nog niets gevonden$/i.test(t);
  }).length;
}
async function resolveWorldPoint(point){
  if(!point?.id)return point;
  if(point.imageUrl)return point;
  if(!point.imageDocId)return point;
  try{
    const snap=await getDoc(doc(db,'snazzleArImages',String(point.imageDocId)));
    const dataUrl=snap.exists()?String(snap.data()?.dataUrl||''):'';
    return dataUrl?{...point,imageUrl:dataUrl}:point;
  }catch{return point;}
}
async function loadWorld(force=false){
  if(!force&&worldLoadedAt&&Date.now()-worldLoadedAt<45000)return;
  try{
    const snap=await getDoc(WORLD_DOC);
    const data=snap.exists()?snap.data():{};
    const points=Array.isArray(data.points)?data.points:[];
    const resolved=await Promise.all(points.filter(p=>p?.id).map(resolveWorldPoint));
    worldMap=new Map(resolved.map(p=>[String(p.id),p]));
    worldLoadedAt=Date.now();
  }catch(err){console.warn('Special Snazzles: AR-wereld kon niet laden',err);}
}
function visualFor(item){
  const world=worldMap.get(String(item.id||''))||{};
  return String(world.imageUrl||'');
}
function installStyles(){
  if($('#snSpecialFindsStyle291'))return;
  const s=document.createElement('style');
  s.id='snSpecialFindsStyle291';
  s.textContent=[
    '#findsSheet .panel{padding-bottom:34px}',
    '.sn-find-hub291{margin:4px 0 14px;padding:12px;border-radius:18px;background:linear-gradient(145deg,#fff7df,#f0d18b);border:2px solid #b58b4f;box-shadow:0 4px 0 #9a733f}',
    '.sn-find-hub291 h3{margin:0;font-size:18px;color:#3a2919}.sn-find-hub291 p{margin:5px 0 11px;font-size:11px;line-height:1.4;font-weight:760;color:#6a5237}',
    '.sn-find-tabs291{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sn-find-tab291{border:2px solid #b48a4c;border-radius:15px;padding:10px 8px;background:#fff9e9;color:#3a2818;text-align:left;box-shadow:0 3px 0 #a47a40}',
    '.sn-find-tab291 strong{display:block;font-size:13px}.sn-find-tab291 small{display:block;margin-top:3px;font-size:9px;font-weight:800;color:#70583c;line-height:1.25}.sn-find-tab291 span{float:right;border-radius:99px;padding:2px 7px;background:#d9c28d;font-size:10px}',
    '.sn-find-tab291.on{background:linear-gradient(145deg,#466fc4,#604fba);border-color:#49398d;color:#fff;box-shadow:0 3px 0 #35286d}.sn-find-tab291.on small{color:#f4edff}.sn-find-tab291.on span{background:#fff2a8;color:#47361c}',
    '.sn-find-section291{display:none}.sn-find-section291.on{display:block}.sn-find-section-title291{margin:6px 2px 10px}.sn-find-section-title291 h3{margin:0;font-size:18px}.sn-find-section-title291 p{margin:3px 0 0;font-size:10px;font-weight:760;color:#715a3e}',
    '.sn-special-list291{display:grid;gap:10px}.sn-special-card291{width:100%;border:2px solid #b98c4d;border-radius:17px;padding:9px;background:linear-gradient(145deg,#fff9e9,#efd08b);display:grid;grid-template-columns:82px 1fr;gap:11px;align-items:center;text-align:left;color:#2f2115;box-shadow:0 4px 0 #9a7039;position:relative}',
    '.sn-special-img291{width:82px;height:82px;border-radius:15px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,#4ccce9,#6254c5);font-size:42px;border:2px solid #6e4a28}.sn-special-img291 img{display:block;width:100%;height:100%;object-fit:contain}',
    '.sn-special-copy291{min-width:0;padding-right:6px}.sn-special-copy291 strong{display:block;font-size:16px;line-height:1.18}.sn-special-copy291 .where{display:block;margin-top:5px;font-size:11px;font-weight:900;color:#4b6d35}.sn-special-copy291 .meta{display:block;margin-top:3px;font-size:10px;font-weight:800;color:#70583f;line-height:1.35}',
    '.sn-special-badge291{position:absolute;right:7px;top:7px;border-radius:999px;padding:4px 7px;background:#744fc0;color:#fff;font-size:8px;font-weight:1000;border:1px solid #f0e3ff}.sn-special-arrow291{position:absolute;right:10px;bottom:8px;font-size:18px;color:#7a572c}',
    '.sn-special-empty291{padding:15px;border:2px dashed #ba9a65;border-radius:15px;background:#fff8e8;text-align:center;font-size:12px;font-weight:850;color:#6d573d}',
    '#snSpecialDetail291{position:fixed;inset:0;z-index:115;display:none;align-items:flex-end;background:rgba(3,16,9,.78)}#snSpecialDetail291.show{display:flex}.sn-special-detail-card291{width:min(560px,100%);max-height:88vh;overflow:auto;margin:auto;background:linear-gradient(#fff0b5,#edcf8a);border:4px solid #81562d;border-radius:28px 28px 0 0;padding:16px 18px 26px;color:#2d2116}.sn-special-detail-close291{float:right;width:44px;height:44px;border:0;border-radius:14px;background:#70472b;color:#fff;font-size:26px;font-weight:1000}.sn-special-detail-img291{clear:both;margin:9px auto 14px;width:min(280px,76vw);aspect-ratio:1;border-radius:24px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,#4ccce9,#6254c5);font-size:90px;border:3px solid #72502f}.sn-special-detail-img291 img{width:100%;height:100%;object-fit:contain}.sn-special-detail-card291 h2{margin:0 0 7px;font-size:25px}.sn-special-detail-info291{padding:12px;border-radius:16px;background:#fff8e6;border:2px solid #ba965c;font-weight:850;line-height:1.55}',
    '@media(max-width:380px){.sn-find-tabs291{grid-template-columns:1fr}.sn-special-card291{grid-template-columns:72px 1fr}.sn-special-img291{width:72px;height:72px}}'
  ].join('');
  document.head.appendChild(s);
}
function syncMenuLabels(){
  const direct=$('#findsBtn small');
  if(direct)direct.textContent='Hunts & Speciale Snazzles';
  document.querySelectorAll('#quickMenuPanel button').forEach(b=>{
    if(/mijn vondsten/i.test(b.textContent||'')){
      const small=b.querySelector('small');
      if(small)small.textContent='Hunts & Speciale Snazzles';
    }
  });
}
function ensureLayout(){
  const sheet=$('#findsSheet'),list=$('#findsList'),panel=sheet?.querySelector('.panel');
  if(!sheet||!list||!panel)return false;
  installStyles();
  if(!$('#snFindHub291',panel)){
    const hub=document.createElement('div');
    hub.id='snFindHub291';hub.className='sn-find-hub291';
    hub.innerHTML='<h3>Jouw Snazzle-verzameling ✨</h3><p>Gewone Hunt-vondsten en Algemene Special Snazzles staan apart, zodat je alles snel terugvindt.</p><div class="sn-find-tabs291"><button type="button" class="sn-find-tab291" data-sn-find-tab="hunts"><span id="snHuntCount291">0</span><strong>🏆 Hunt-vondsten</strong><small>Snazzles uit gewone Hunts</small></button><button type="button" class="sn-find-tab291" data-sn-find-tab="special"><span id="snSpecialCount291">0</span><strong>✨ Speciale Snazzles</strong><small>Algemene Snazzles gevonden via AR</small></button></div>';
    const hunts=document.createElement('section');
    hunts.id='snHuntFinds291';hunts.className='sn-find-section291';
    hunts.innerHTML='<div class="sn-find-section-title291"><h3>🏆 Hunt-vondsten</h3><p>Je gevonden Snazzles uit gewone Snazzle Hunts.</p></div>';
    const special=document.createElement('section');
    special.id='snSpecialFinds291';special.className='sn-find-section291';
    special.innerHTML='<div class="sn-find-section-title291"><h3>✨ Algemene Special Snazzles</h3><p>Los van Hunts: speciale Snazzles die je via AR in de wereld kunt vinden.</p></div><div class="sn-special-list291" id="snSpecialList291"></div>';
    panel.insertBefore(hub,list);
    panel.insertBefore(hunts,list);
    hunts.appendChild(list);
    hunts.insertAdjacentElement('afterend',special);
    hub.querySelectorAll('[data-sn-find-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.snFindTab,true)));
  }
  if(!$('#snSpecialDetail291')){
    const detail=document.createElement('div');
    detail.id='snSpecialDetail291';
    detail.innerHTML='<div class="sn-special-detail-card291" role="dialog" aria-modal="true" aria-labelledby="snSpecialDetailTitle291"><button type="button" class="sn-special-detail-close291" aria-label="Sluiten">×</button><div class="sn-special-detail-img291" id="snSpecialDetailImg291">🦆</div><h2 id="snSpecialDetailTitle291">Special Snazzle</h2><div class="sn-special-detail-info291" id="snSpecialDetailInfo291"></div></div>';
    document.body.appendChild(detail);
    detail.querySelector('.sn-special-detail-close291').addEventListener('click',()=>detail.classList.remove('show'));
    detail.addEventListener('click',e=>{if(e.target===detail)detail.classList.remove('show');});
  }
  syncMenuLabels();
  return true;
}
function setTab(tab,persist=false){
  if(!['hunts','special'].includes(tab))tab='hunts';
  activeTab=tab;
  document.querySelectorAll('[data-sn-find-tab]').forEach(b=>b.classList.toggle('on',b.dataset.snFindTab===tab));
  $('#snHuntFinds291')?.classList.toggle('on',tab==='hunts');
  $('#snSpecialFinds291')?.classList.toggle('on',tab==='special');
  if(persist){try{localStorage.setItem('snazzleFindsTab291',tab);}catch{}}
}
function openDetail(item){
  const detail=$('#snSpecialDetail291');if(!detail)return;
  const img=$('#snSpecialDetailImg291'),src=visualFor(item);
  img.innerHTML=src?'<img src="'+esc(src)+'" alt="'+esc(item.name)+'">':'🦆';
  $('#snSpecialDetailTitle291').textContent=item.name;
  $('#snSpecialDetailInfo291').innerHTML='<b>✨ Algemene Special Snazzle</b><br>📍 Gevonden in '+esc(item.placeName||item.village)+'<br>📅 '+esc(fmtDate(item.caughtAt))+'<br>🏷️ '+esc(item.rarity)+(item.number&&item.number!=='—'?'<br>🔢 #'+esc(item.number):'');
  detail.classList.add('show');
}
async function render(){
  if(rendering)return;
  rendering=true;
  try{
    await loadWorld();
    if(!ensureLayout())return;
    const list=$('#findsList');
    list?.querySelectorAll('.sn-ar-find126').forEach(el=>el.remove());
    const items=await enrichPlaces(mergedItems());
    const hCount=huntCount();
    const hc=$('#snHuntCount291'),sc=$('#snSpecialCount291');
    if(hc)hc.textContent=String(hCount);
    if(sc)sc.textContent=String(items.length);
    const grid=$('#snSpecialList291');
    if(grid){
      if(!items.length){
        grid.innerHTML='<div class="sn-special-empty291">Nog geen Special Snazzle gevonden. Zodra je er één via AR vangt, verschijnt hij hier automatisch.</div>';
      }else{
        grid.innerHTML='';
        items.forEach(item=>{
          const src=visualFor(item);
          const card=document.createElement('button');
          card.type='button';card.className='sn-special-card291';card.dataset.specialId=item.id;
          card.innerHTML='<div class="sn-special-img291">'+(src?'<img src="'+esc(src)+'" alt="'+esc(item.name)+'">':'🦆')+'</div><div class="sn-special-copy291"><strong>'+esc(item.name)+'</strong><span class="where">📍 Gevonden in '+esc(item.placeName||item.village)+'</span><span class="meta">📅 '+esc(fmtDate(item.caughtAt))+' · '+esc(item.rarity)+(item.number&&item.number!=='—'?' · #'+esc(item.number):'')+'</span></div><span class="sn-special-badge291">SPECIAL</span><span class="sn-special-arrow291">›</span>';
          card.addEventListener('click',()=>openDetail(item));
          grid.appendChild(card);
        });
      }
    }
    let preferred='';
    try{preferred=localStorage.getItem('snazzleFindsTab291')||'';}catch{}
    if(!activeTab)activeTab=preferred||((items.length>0)?'special':'hunts');
    if(activeTab==='special'&&!items.length&&hCount>0)activeTab='hunts';
    setTab(activeTab,false);
    const passport=$('#passportFinds');
    if(passport)passport.textContent=String(hCount+items.length);
    syncMenuLabels();
  }finally{rendering=false;}
}
function schedule(delay=20){
  clearTimeout(renderTimer);
  renderTimer=setTimeout(()=>render(),delay);
}
function watchUi(){
  if(!ensureLayout()){
    const ob=new MutationObserver(()=>{if(ensureLayout()){ob.disconnect();watchUi();}});
    if(document.body)ob.observe(document.body,{childList:true,subtree:true});
    return;
  }
  const list=$('#findsList'),sheet=$('#findsSheet');
  if(list&&!list.dataset.snSpecial291){
    list.dataset.snSpecial291='1';
    listObserver=new MutationObserver(()=>schedule(10));
    listObserver.observe(list,{childList:true});
  }
  if(sheet&&!sheet.dataset.snSpecial291){
    sheet.dataset.snSpecial291='1';
    sheetObserver=new MutationObserver(()=>{if(sheet.classList.contains('show'))schedule(0);});
    sheetObserver.observe(sheet,{attributes:true,attributeFilter:['class']});
  }
  schedule(0);
}
function bindUser(user){
  try{userUnsub?.();}catch{}
  userUnsub=null;cloudItems=[];
  if(!user){schedule();return;}
  userUnsub=onSnapshot(doc(db,'users',user.uid),snap=>{
    const data=snap.exists()?snap.data():{};
    cloudItems=Array.isArray(data.arCollectionV1)?data.arCollectionV1.filter(v=>v?.id):[];
    schedule(0);
  },()=>schedule());
}
document.addEventListener('click',e=>{
  if(e.target?.closest?.('#snArCatchDuck,#snArCatchHint')){
    try{localStorage.setItem('snazzleFindsTab291','special');}catch{}
    activeTab='special';
    setTimeout(()=>{worldLoadedAt=0;schedule(0);},280);
  }
},true);
window.addEventListener('storage',e=>{if(e.key===LOCAL_KEY)schedule(0);});
window.addEventListener('pageshow',()=>schedule(0));
document.addEventListener('snazzle:home-ui-ready',()=>schedule(0));
onAuthStateChanged(auth,bindUser);
if(auth.currentUser)bindUser(auth.currentUser);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchUi,{once:true});else watchUi();
window.SnazzleSpecialFindingsV291={render,openSpecial:()=>{activeTab='special';setTab('special',true);schedule(0);}};
console.info('Snazzle Special Findings v292 plaatsnamen actief');
