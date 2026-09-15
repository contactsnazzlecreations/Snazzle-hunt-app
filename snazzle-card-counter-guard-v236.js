// Snazzle Cards v236 — bewaakt overal de vaste x/48-hoofdteller en 4 × x/12 serietellers.
import { BASE_COLLECTION_SIZE,SERIES,BASE_CARDS } from './snazzle-card-structure-v233.js?v=236';

const VERSION='236.0-counter-guard';
const KEYS=['wild','spark','mystic','blaze'];
const ICONS={wild:'🌿',spark:'✨',mystic:'🔮',blaze:'🔥'};
const LABELS={wild:'WILD',spark:'SPARK',mystic:'MYSTIC',blaze:'BLAZE'};
let queued=false,painting=false;

function audit(){
  const perSeries=Object.fromEntries(KEYS.map(k=>[k,Array.isArray(SERIES[k]?.cards)?SERIES[k].cards.length:0]));
  const denominatorSum=Object.values(perSeries).reduce((a,b)=>a+b,0);
  const uniqueNumbers=new Set(BASE_CARDS.map(c=>String(c.number||'').toUpperCase())).size;
  const ok=BASE_COLLECTION_SIZE===48&&KEYS.length===4&&KEYS.every(k=>perSeries[k]===12)&&denominatorSum===48&&BASE_CARDS.length===48&&uniqueNumbers===48;
  const result={version:VERSION,ok,baseCollectionSize:BASE_COLLECTION_SIZE,seriesCount:KEYS.length,perSeries,denominatorSum,cardDefinitions:BASE_CARDS.length,uniqueNumbers,checkedAt:new Date().toISOString()};
  window.__snazzleCardCounterAuditV236=result;
  if(!ok)console.error('Snazzle Cards v236 structuurcontrole mislukt',result);
  return result;
}

function engine(){return window.SnazzleCardProgressV234||null;}
function values(){
  const e=engine(),ready=!!e?.ready?.();
  const raw=ready&&e?.counts?e.counts():null;
  const out={wild:null,spark:null,mystic:null,blaze:null,total:null,ready};
  if(ready&&raw){
    for(const k of KEYS)out[k]=Math.max(0,Math.min(12,Number(raw[k])||0));
    out.total=KEYS.reduce((sum,k)=>sum+out[k],0);
  }
  return out;
}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
function ensureStyle(){
  if(document.getElementById('snCardCounterGuard236Style'))return;
  const s=document.createElement('style');s.id='snCardCounterGuard236Style';s.textContent=`
    .sn234-progress{margin:9px 0 2px;padding:9px;border:2px solid #b89254;border-radius:16px;background:rgba(255,248,221,.82);color:#4b3522}.sn234-series{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.sn234-chip{min-width:0;padding:7px 5px;border:1.5px solid #c7a873;border-radius:12px;background:#fff8e5;text-align:center}.sn234-chip span{display:block;font-size:9px;font-weight:1000;white-space:nowrap}.sn234-chip b{display:block;margin-top:2px;font-size:13px}.sn234-chip small{display:block;margin-top:2px;font-size:8px;font-weight:900;color:#765b38;white-space:nowrap}.sn234-master{margin-top:7px;padding:7px 9px;border-radius:11px;background:linear-gradient(90deg,#273d75,#4b3581);color:#fff6cf;font-size:10px;font-weight:950;display:flex;justify-content:space-between;gap:8px}.sn234-master.done{background:linear-gradient(90deg,#8c641f,#d69f24,#74531d);color:#fff}@media(max-width:390px){.sn234-series{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;document.head.appendChild(s);
}
function ensureProgressBox(){
  const summary=document.querySelector('#sc2Block .sc2-summary');if(!summary)return null;
  let box=document.getElementById('snCardProgress234');
  if(!box){box=document.createElement('div');box.id='snCardProgress234';box.className='sn234-progress';summary.insertAdjacentElement('afterend',box);}
  return box;
}
function renderBox(v){
  const box=ensureProgressBox();if(!box)return;
  const earned=(n,at)=>v.ready&&n>=at;
  const html=`<div class="sn234-series">${KEYS.map(k=>{
    const n=v[k],full=earned(n,12),half=earned(n,6),shown=v.ready?n:'…';
    return `<div class="sn234-chip" data-sn236-series="${k}"><span>${ICONS[k]} ${LABELS[k]}</span><b>${shown}/12</b><small>${full?'🔑 MASTER':half?'🏅 6/12':'○ 6 · 🔒 12'}</small></div>`;
  }).join('')}</div><div class="sn234-master ${v.ready&&v.total===48?'done':''}"><span>🏆 Snazzle Master Collector</span><b>${v.ready?v.total:'…'}/48</b></div>`;
  if(box.innerHTML!==html)box.innerHTML=html;
}
function patch(){
  if(painting)return;painting=true;
  try{
    ensureStyle();const a=audit(),v=values();
    if(!a.ok)return;
    setText(document.getElementById('sc2SummaryCount'),`${v.ready?v.total:'…'}/48`);
    setText(document.getElementById('sc2SummaryText'),v.ready?`${Math.round(v.total/48*100)||0}% van je basiscollectie ontdekt`:'Kaartvoortgang laden…');
    setText(document.getElementById('collectionHomeStatus'),v.ready?`${v.total} van 48 kaarten ontdekt`:'Kaartvoortgang laden… / 48');
    renderBox(v);
    document.getElementById('sc2ArProgress127')?.remove();
    window.__snazzleCardCounterStateV236={...v,seriesDenominator:12,totalDenominator:48,sum:v.ready?KEYS.reduce((s,k)=>s+v[k],0):null,at:new Date().toISOString()};
  }finally{painting=false;}
}
function queue(){if(queued||painting)return;queued=true;requestAnimationFrame(()=>{queued=false;patch()});}

audit();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
new MutationObserver(ms=>{if(!painting&&ms.some(m=>m.type==='childList'||m.type==='characterData'))queue()}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
document.addEventListener('click',e=>{if(e.target.closest('#collectionSheet,[data-seriespick],[data-sc2f],[data-collection-tab]'))[0,40,120,300].forEach(ms=>setTimeout(queue,ms))},{passive:true});
window.addEventListener('pageshow',queue);
[0,100,300,700,1400,3000,6000,10000].forEach(ms=>setTimeout(queue,ms));
window.SnazzleCardCounterGuardV236={version:VERSION,audit,render:patch,state:()=>window.__snazzleCardCounterStateV236};
console.info('Snazzle Cards v236 tellerbewaking actief: 4 × 12 = 48');