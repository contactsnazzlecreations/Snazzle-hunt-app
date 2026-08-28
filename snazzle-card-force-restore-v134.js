// Snazzle Cards v137 — robuuste vaste kaartweergave zonder canvas of lokale opslag.
import { assets } from './snazzle-card-assets-v133.js';

const VERSION='137-direct-sprites';
const WILD=['Trail Blazer','Jungle Jax','Mud Runner','Storm Scout','Boulder Buddy','Night Tracker','River Rush','Forest Flash','Thunder Trek','Shadow Scout','Wild Guardian','Alpha Snazzle'];
const SPARK=['Star Sprinkle','Moon Glow','Dream Dancer','Crystal Pop','Bubble Bloom','Glitter Glide','Comet Dash','Rainbow Rush','Starlight Hug','Aurora Whirl','Sparkle Sprout','Nova Shine'];
const $=(s,r=document)=>r.querySelector(s);

const cards=[
  ...WILD.map((name,i)=>({id:`seed-wild-${String(i+1).padStart(2,'0')}`,number:`S01-W${String(i+1).padStart(2,'0')}`,name,series:'WILD Series 01',rarity:i<8?'core':'rare',world:'wild',col:i%4,row:Math.floor(i/4),cols:4,rows:3})),
  ...SPARK.map((name,i)=>({id:`seed-spark-${String(i+1).padStart(2,'0')}`,number:`S01-S${String(i+1).padStart(2,'0')}`,name,series:'SPARK Series 01',rarity:i<8?'core':'rare',world:'spark',col:i%6,row:Math.floor(i/6),cols:6,rows:2}))
];

function installStyles(){
  if($('#sn137Styles'))return;
  const s=document.createElement('style');s.id='sn137Styles';s.textContent=`
    .sn137-sprite{width:100%;height:100%;background-repeat:no-repeat;background-color:#173d31}
    .sn137-sprite.wild{background-image:var(--sn137-wild);background-size:400% 300%}
    .sn137-sprite.spark{background-image:var(--sn137-spark);background-size:600% 200%}
    .sc2-card.sn137-card.locked .sn137-sprite{filter:brightness(.18) saturate(.3)}
    .sc2-card.sn137-card .sc2-lock{display:grid}
    .sc2-card.sn137-card.unlocked .sc2-lock{display:none}
    #sc2Grid[data-sn137-ready="1"] .sc2-empty{display:none!important}
  `;document.head.appendChild(s);
  document.documentElement.style.setProperty('--sn137-wild',`url("${assets.wild}")`);
  document.documentElement.style.setProperty('--sn137-spark',`url("${assets.spark}")`);
}

function pos(card){
  const x=card.cols<=1?0:(card.col/(card.cols-1))*100;
  const y=card.rows<=1?0:(card.row/(card.rows-1))*100;
  return `${x}% ${y}%`;
}
function selectedFilter(){return $('#sc2Filters .sc2-filter.on')?.dataset?.sc2f||'all';}
function html(card){
  return `<article class="sc2-card sn137-card ${card.rarity} locked" data-sn137-card="${card.id}"><div class="sc2-inner"><div class="sc2-media"><div class="sn137-sprite ${card.world}" style="background-position:${pos(card)}"></div><span class="sc2-lock">?</span><span class="sc2-rarity">${card.rarity==='rare'?'RARE':'CORE'}</span><span class="sc2-num">${card.number}</span></div><div class="sc2-info"><strong>${card.name}</strong><small>${card.series}</small><span class="sc2-source">🔎 Hunt-kaart</span></div></div></article>`;
}
function realNativeCards(grid){return [...grid.querySelectorAll('.sc2-card')].filter(el=>!el.hasAttribute('data-sn137-card')&&!el.hasAttribute('data-sn136-card'));}
function renderCollection(){
  installStyles();
  const grid=$('#sc2Grid');if(!grid)return false;
  if(realNativeCards(grid).length){grid.removeAttribute('data-sn137-ready');return true;}
  const filter=selectedFilter();
  const shown=cards.filter(c=>filter==='all'||c.rarity===filter);
  const sig=`${filter}:${shown.length}`;
  if(grid.dataset.sn137Sig!==sig||grid.querySelectorAll('[data-sn137-card]').length!==shown.length){
    grid.innerHTML=shown.length?shown.map(html).join(''):'<div class="sc2-empty">✨ Nog geen Snazzle Cards in deze categorie.</div>';
    grid.dataset.sn137Sig=sig;
  }
  grid.dataset.sn137Ready='1';
  const count=$('#sc2SummaryCount'),text=$('#sc2SummaryText');
  if(count)count.textContent=`0/${cards.length}`;
  if(text)text.textContent='24 kaarten klaar om te ontdekken';
  return true;
}
function renderAdmin(){
  const list=$('#sc2List');if(!list)return false;
  const real=[...list.querySelectorAll('.sc2-row')].filter(el=>!el.hasAttribute('data-sn137-admin')&&!el.hasAttribute('data-sn136-admin'));
  if(real.length)return true;
  if(list.dataset.sn137Ready==='1'&&list.querySelectorAll('[data-sn137-admin]').length===cards.length)return true;
  list.innerHTML=cards.map(c=>`<div class="sc2-row" data-sn137-admin="${c.id}"><div class="sc2-thumb"><div class="sn137-sprite ${c.world}" style="background-position:${pos(c)}"></div></div><div><strong>${c.number} · ${c.name}</strong><small>${c.rarity==='rare'?'RARE':'CORE'} · ${c.series} · herstelkaart</small></div></div>`).join('');
  list.dataset.sn137Ready='1';
  return true;
}
function render(){renderCollection();renderAdmin();}

installStyles();
render();
const observer=new MutationObserver(()=>queueMicrotask(render));
observer.observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-sc2f],[data-collection-tab="cards"],#openCollectionBtn'))setTimeout(render,20);},true);
setInterval(render,1200);
window.SnazzleCardForceRestoreV137={version:VERSION,count:cards.length,cards};
console.info(`Snazzle Cards v137: ${cards.length} kaarten direct op de vaste collectieplek beschikbaar.`);
