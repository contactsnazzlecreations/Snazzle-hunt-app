// Snazzle AR Findings Bridge v126
// Zorgt dat AR-vondsten ook direct zichtbaar zijn in het bestaande venster 'Mijn vondsten'.
// Leest zowel lokale vangsten als de persoonlijke cloudcollectie en laat gewone hunt-vondsten intact.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
const LOCAL_KEY='snazzleARCollection';
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let cloudItems=[];
let worldMap=new Map();
let worldLoaded=false;
let userUnsub=null;
let listObserver=null;
let sheetObserver=null;
let rendering=false;
let rerenderTimer=null;
let lastBaseSignature='';

function localItems(){
  try{
    const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');
    return Array.isArray(x)?x.filter(v=>v&&v.id):[];
  }catch{return[];}
}
function normalize(item){
  const world=worldMap.get(String(item?.id||''))||{};
  const caughtAt=String(item?.caughtAt||new Date().toISOString());
  return {
    id:String(item?.id||world.id||'').slice(0,120),
    number:String(item?.number||world.number||'—').slice(0,20),
    name:String(item?.name||world.name||'Snazzle').slice(0,60),
    rarity:String(item?.rarity||world.rarity||'COMMON').toUpperCase().slice(0,20),
    village:String(item?.village||world.village||localStorage.getItem('snazzleVillage')||'Montfort').slice(0,60),
    caughtAt,
    edition:String(item?.edition||'Snazzle AR').slice(0,60)
  };
}
function mergedItems(){
  const map=new Map();
  [...cloudItems,...localItems()].forEach(raw=>{
    if(!raw?.id)return;
    const item=normalize(raw),prev=map.get(item.id);
    if(!prev || String(item.caughtAt)<String(prev.caughtAt))map.set(item.id,item);
  });
  return [...map.values()].sort((a,b)=>String(b.caughtAt).localeCompare(String(a.caughtAt)));
}
function fmtDate(value){
  const d=new Date(value||0);
  if(Number.isNaN(d.getTime()))return 'AR-vondst';
  return d.toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'});
}
function scoutSvg(){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="bg126" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#49cceb"/><stop offset="1" stop-color="#4653bb"/></linearGradient></defs><rect width="800" height="800" rx="70" fill="url(#bg126)"/><g><ellipse cx="350" cy="500" rx="225" ry="165" fill="#39bde8" stroke="#47351f" stroke-width="18"/><circle cx="548" cy="326" r="124" fill="#39bde8" stroke="#47351f" stroke-width="18"/><path d="M645 320 780 370 645 425Z" fill="#ff8f32" stroke="#47351f" stroke-width="15"/><circle cx="586" cy="294" r="17" fill="#15251c"/><circle cx="592" cy="288" r="5" fill="#fff"/><path d="M470 248 Q548 153 655 215 L666 275 Q555 236 470 292Z" fill="#30343b" stroke="#25282d" stroke-width="14"/><path d="M463 281 Q558 247 667 285" fill="none" stroke="#17191d" stroke-width="20" stroke-linecap="round"/></g><text x="400" y="735" text-anchor="middle" font-family="Arial,sans-serif" font-size="47" font-weight="900" fill="#fff7dd">SCOUT SNAZZLE</text></svg>`;
}
function svgUrl(svg){return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;}
function visualFor(item){
  const world=worldMap.get(String(item.id||''))||{};
  if(world.imageUrl)return world.imageUrl;
  return svgUrl(scoutSvg());
}
async function loadWorld(){
  if(worldLoaded)return;
  try{
    const snap=await getDoc(WORLD_DOC),data=snap.exists()?snap.data():{};
    const points=Array.isArray(data.points)?data.points:[];
    worldMap=new Map(points.filter(p=>p?.id).map(p=>[String(p.id),p]));
  }catch(err){console.warn('AR-vondsten: wereldafbeeldingen konden niet laden',err);}
  worldLoaded=true;
}
function installStyles(){
  if($('#snArFindingsStyle126'))return;
  const s=document.createElement('style');
  s.id='snArFindingsStyle126';
  s.textContent=`
    #findsList .sn-ar-find126{display:grid;grid-template-columns:68px 1fr;gap:11px;align-items:center;position:relative;padding:10px!important;border:2px solid #b78c4e!important;background:linear-gradient(145deg,#fff8df,#f0d18b)!important;overflow:hidden}
    #findsList .sn-ar-find126 .sn-ar-thumb126{width:68px;height:68px;border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#54cce8,#554fc0);border:2px solid #76512b}
    #findsList .sn-ar-find126 .sn-ar-thumb126 img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;margin:0!important;border:0!important;border-radius:0!important}
    #findsList .sn-ar-find126 .sn-ar-copy126{min-width:0}
    #findsList .sn-ar-find126 .sn-ar-copy126 strong{display:block;font-size:14px;line-height:1.2;color:#332317}
    #findsList .sn-ar-find126 .sn-ar-copy126 span{display:block;margin-top:4px;font-size:10px;line-height:1.35;font-weight:850;color:#665039}
    #findsList .sn-ar-find126 .sn-ar-badge126{position:absolute;right:7px;top:7px;border-radius:999px;padding:4px 6px;background:#2f7b37;color:#fff;border:1px solid #ddf7ac;font-size:8px;font-weight:1000}
  `;
  document.head.appendChild(s);
}
function baseSignature(list){
  return [...list.children].filter(el=>!el.classList.contains('sn-ar-find126')).map(el=>el.outerHTML).join('');
}
function hasOrdinaryFindings(list){
  return [...list.children].some(el=>!el.classList.contains('sn-ar-find126') && !/^Nog niets gevonden$/i.test((el.textContent||'').trim()));
}
async function renderFinds(){
  if(rendering)return;
  const list=$('#findsList');if(!list)return;
  rendering=true;
  try{
    await loadWorld();
    installStyles();
    list.querySelectorAll('.sn-ar-find126').forEach(el=>el.remove());
    const items=mergedItems();
    if(items.length){
      [...list.children].forEach(el=>{
        if(/^Nog niets gevonden$/i.test((el.textContent||'').trim()))el.remove();
      });
      items.forEach(item=>{
        const row=document.createElement('div');
        row.className='listitem sn-ar-find126';
        row.dataset.arId=item.id;
        row.innerHTML=`<div class="sn-ar-thumb126"><img src="${esc(visualFor(item))}" alt="${esc(item.name)}"></div><div class="sn-ar-copy126"><strong>📷 ${esc(item.name)}</strong><span>#${esc(item.number)} · ${esc(item.rarity)}<br>📍 ${esc(item.village)} · ${esc(fmtDate(item.caughtAt))}</span></div><span class="sn-ar-badge126">AR GEVANGEN ✓</span>`;
        list.appendChild(row);
      });
    }else if(!hasOrdinaryFindings(list) && ![...list.children].some(el=>/^Nog niets gevonden$/i.test((el.textContent||'').trim()))){
      list.innerHTML='<div class="listitem"><strong>Nog niets gevonden</strong></div>';
    }
    lastBaseSignature=baseSignature(list);
  }finally{
    rendering=false;
  }
}
function scheduleRender(delay=30){
  clearTimeout(rerenderTimer);
  rerenderTimer=setTimeout(renderFinds,delay);
}
function watchFindsUi(){
  const list=$('#findsList'),sheet=$('#findsSheet');
  if(!list||!sheet){
    const ob=new MutationObserver(()=>{if($('#findsList')&&$('#findsSheet')){ob.disconnect();watchFindsUi();}});
    if(document.body)ob.observe(document.body,{childList:true,subtree:true});
    return;
  }
  if(!list.dataset.arFindings126){
    list.dataset.arFindings126='1';
    lastBaseSignature=baseSignature(list);
    listObserver=new MutationObserver(()=>{
      if(rendering)return;
      const sig=baseSignature(list);
      if(sig!==lastBaseSignature){lastBaseSignature=sig;scheduleRender(20);}
    });
    listObserver.observe(list,{childList:true});
  }
  if(!sheet.dataset.arFindings126){
    sheet.dataset.arFindings126='1';
    sheetObserver=new MutationObserver(()=>{if(sheet.classList.contains('show'))scheduleRender(0);});
    sheetObserver.observe(sheet,{attributes:true,attributeFilter:['class']});
  }
  scheduleRender(0);
}
function bindUser(user){
  try{userUnsub?.();}catch{}
  userUnsub=null;cloudItems=[];
  if(!user){scheduleRender();return;}
  userUnsub=onSnapshot(doc(db,'users',user.uid),snap=>{
    const data=snap.exists()?snap.data():{};
    cloudItems=Array.isArray(data.arCollectionV1)?data.arCollectionV1.filter(v=>v?.id):[];
    scheduleRender(0);
  },err=>{console.warn('AR-vondsten: persoonlijke cloudcollectie kon niet laden',err);scheduleRender();});
}

document.addEventListener('click',e=>{
  if(e.target?.closest?.('#snArCatchDuck,#snArCatchHint'))scheduleRender(360);
},true);
window.addEventListener('storage',e=>{if(e.key===LOCAL_KEY)scheduleRender(0);});
window.addEventListener('pageshow',()=>scheduleRender(0));

onAuthStateChanged(auth,bindUser);
if(auth.currentUser)bindUser(auth.currentUser);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchFindsUi,{once:true});else watchFindsUi();

window.SnazzleArFindingsBridgeV126={render:renderFinds};
