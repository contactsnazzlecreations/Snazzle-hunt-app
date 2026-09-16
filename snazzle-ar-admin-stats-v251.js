// Snazzle AR Admin Stats v251 — toont per geplaatst AR-punt hoeveel unieke spelers het hebben gevonden.
// Gebruikt de bestaande privacyvriendelijke snazzleArFindings-collectie: geen namen, e-mail of GPS van vinders.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const FINDINGS='snazzleArFindings';
const $=(s,r=document)=>r.querySelector(s);

let superAdmin=false;
let statsByPoint=new Map();
let worldPoints=[];
let loadBusy=false;
let lastLoadedAt=0;
let installObserver=null;
let listObserver=null;

function installStyle(){
  if($('#snArStats251Style'))return;
  const style=document.createElement('style');
  style.id='snArStats251Style';
  style.textContent=`
    .sn-ar-stats251{margin:10px 0 12px;padding:11px 12px;border:2px solid #a88b5a;border-radius:15px;background:linear-gradient(145deg,#fff8e6,#f3dfad);color:#42301f}
    .sn-ar-stats251-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.sn-ar-stats251-top strong{font-size:13px}.sn-ar-stats251-top button{border:0;border-radius:10px;padding:7px 9px;background:#477f39;color:#fff;font-size:10px;font-weight:950}
    .sn-ar-stats251-line{margin-top:7px;font-size:11px;font-weight:850;line-height:1.45;color:#624a2f}.sn-ar-stats251-note{margin-top:5px;font-size:9px;font-weight:750;color:#816b4e}
    .sn-ar-find-stat251{display:block;margin-top:6px;padding:6px 8px;border-radius:10px;background:#e9f5cf;border:1px solid #a3bf69;color:#315123;font-size:11px;font-weight:950}
    .sn-ar-find-stat251.zero{background:#f1ead8;border-color:#c9b58f;color:#6c5b40}.sn-ar-general251{display:inline-block;margin-left:6px;padding:3px 6px;border-radius:999px;background:#d8ebff;border:1px solid #87b3d8;color:#20577c;font-size:8px;font-weight:1000;vertical-align:2px}
  `;
  document.head.appendChild(style);
}

function toMillis(value){
  if(!value)return 0;
  try{
    if(typeof value.toMillis==='function')return value.toMillis();
    if(typeof value.toDate==='function')return value.toDate().getTime();
    const d=new Date(value);return Number.isNaN(d.getTime())?0:d.getTime();
  }catch{return 0;}
}
function fmtLast(ms){
  if(!ms)return'';
  try{return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(ms));}
  catch{return'';}
}

function ensureUi(){
  installStyle();
  const section=$('#snArAdminV85');
  const list=$('#snArAdminList85');
  if(!section||!list)return false;

  let box=$('#snArStats251');
  if(!box){
    box=document.createElement('div');
    box.id='snArStats251';
    box.className='sn-ar-stats251';
    box.innerHTML=`<div class="sn-ar-stats251-top"><strong>🏆 AR-vondsten</strong><button type="button" id="snArStatsRefresh251">↻ Verversen</button></div><div class="sn-ar-stats251-line" id="snArStatsLine251">Open dit onderdeel om de vondstenteller te laden.</div><div class="sn-ar-stats251-note">Elke speler telt per AR-Snazzle maximaal één keer mee.</div>`;
    list.insertAdjacentElement('beforebegin',box);
    $('#snArStatsRefresh251')?.addEventListener('click',()=>loadStats(true));
  }

  if(!listObserver){
    let queued=false;
    listObserver=new MutationObserver(()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;augmentCards();});
    });
    listObserver.observe(list,{childList:true,subtree:true});
  }
  augmentCards();
  return true;
}

function renderSummary(message=''){
  const line=$('#snArStatsLine251');if(!line)return;
  if(message){line.textContent=message;return;}
  const currentIds=new Set(worldPoints.filter(p=>p?.id).map(p=>String(p.id)));
  let total=0,foundPoints=0;
  for(const [id,s] of statsByPoint){if(!currentIds.has(id))continue;total+=s.count;if(s.count>0)foundPoints++;}
  const general=worldPoints.filter(p=>String(p?.village||'')==='Algemeen').length;
  const active=worldPoints.filter(p=>p?.active!==false).length;
  line.textContent=`${worldPoints.length} geplaatst · ${active} actief · 🌍 ${general} algemeen · 🏆 ${total} unieke vondst${total===1?'':'en'} op ${foundPoints} Snazzle${foundPoints===1?'':'s'}`;
}

function augmentCards(){
  const list=$('#snArAdminList85');if(!list)return;
  list.querySelectorAll('.sn-ar-admin-card').forEach(card=>{
    const id=card.querySelector('[data-ar-toggle]')?.dataset.arToggle||card.querySelector('[data-ar-delete]')?.dataset.arDelete||'';
    if(!id)return;
    const stat=statsByPoint.get(String(id))||{count:0,last:0};
    const meta=card.querySelector('.sn-ar-admin-meta');if(!meta)return;
    let row=meta.querySelector('.sn-ar-find-stat251');
    if(!row){row=document.createElement('span');row.className='sn-ar-find-stat251';meta.appendChild(row);}
    row.classList.toggle('zero',stat.count===0);
    row.textContent=stat.count===0?'🏆 Nog niet gevonden':`🏆 ${stat.count}× gevonden${stat.last?` · laatst ${fmtLast(stat.last)}`:''}`;

    const point=worldPoints.find(p=>String(p?.id||'')===String(id));
    const title=card.querySelector('h4');
    if(title){
      let badge=title.querySelector('.sn-ar-general251');
      if(String(point?.village||'')==='Algemeen'){
        if(!badge){badge=document.createElement('span');badge.className='sn-ar-general251';badge.textContent='🌍 ALGEMEEN';title.appendChild(badge);}
      }else badge?.remove();
    }
  });
}

async function detectSuperAdmin(user){
  superAdmin=false;
  if(!user||user.isAnonymous)return false;
  try{
    const snap=await getDoc(doc(db,'adminUsers',user.uid));
    const data=snap.exists()?snap.data():null;
    superAdmin=!!(data?.active===true&&data?.role==='superadmin');
  }catch{}
  return superAdmin;
}

async function loadStats(force=false){
  if(!superAdmin||loadBusy)return;
  if(!force&&lastLoadedAt&&Date.now()-lastLoadedAt<10000){augmentCards();return;}
  ensureUi();loadBusy=true;renderSummary('🏆 Vondsten laden…');
  try{
    const [worldSnap,findSnap]=await Promise.all([getDoc(WORLD_DOC),getDocs(collection(db,FINDINGS))]);
    const worldData=worldSnap.exists()?worldSnap.data():{};
    worldPoints=Array.isArray(worldData.points)?worldData.points:[];
    const currentIds=new Set(worldPoints.filter(p=>p?.id).map(p=>String(p.id)));
    const next=new Map();
    findSnap.forEach(d=>{
      const x=d.data()||{},id=String(x.pointId||'');
      if(!id||!currentIds.has(id))return;
      const prev=next.get(id)||{count:0,last:0};
      prev.count++;
      prev.last=Math.max(prev.last,toMillis(x.foundAt));
      next.set(id,prev);
    });
    statsByPoint=next;lastLoadedAt=Date.now();renderSummary();augmentCards();
  }catch(err){
    console.warn('Snazzle AR-vondstenteller',err);
    const denied=String(err?.code||'').includes('permission-denied');
    renderSummary(denied?'⚠️ Vondstenteller vereist de beveiligde hoofdbeheerder-sessie.':'⚠️ Vondstenteller kon nu niet worden geladen.');
  }finally{loadBusy=false;}
}

function install(){
  if(!ensureUi())return false;
  return true;
}
function watchInstall(){
  if(install())return;
  if(installObserver||!document.body)return;
  installObserver=new MutationObserver(()=>{if(install()){installObserver.disconnect();installObserver=null;}});
  installObserver.observe(document.body,{childList:true,subtree:true});
}

document.addEventListener('click',event=>{
  if(!event.target?.closest?.('#snArAdminTab85'))return;
  setTimeout(()=>loadStats(true),80);
},true);
document.addEventListener('snazzle:admin-ui-ready',()=>{watchInstall();if($('#snArAdminV85')?.classList.contains('on'))loadStats(true);});

onAuthStateChanged(auth,async user=>{
  statsByPoint=new Map();worldPoints=[];lastLoadedAt=0;
  await detectSuperAdmin(user);
  watchInstall();
  if(superAdmin&&$('#snArAdminV85')?.classList.contains('on'))loadStats(true);
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchInstall,{once:true});else watchInstall();

window.SnazzleArAdminStatsV251={refresh:()=>loadStats(true)};
console.info('Snazzle AR Admin Stats v251 geladen');
