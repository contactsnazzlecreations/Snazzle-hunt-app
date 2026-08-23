// Snazzle Collectie — persoonlijke spaarkaart, Snazzle Nest en jaarstand.
// Scores worden uitsluitend afgeleid van centraal bevestigde hunts (foundByUserId),
// zodat een kind de teller niet zelf kan ophogen.

import { getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const COLLECTION_VERSION = '1.0.0';
const $c = (s, root=document) => root.querySelector(s);
const $$c = (s, root=document) => [...root.querySelectorAll(s)];

const app = getApps().length ? getApp() : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

let currentUser = null;
let allHunts = [];
let selectedYear = new Date().getFullYear();
let selectedVillage = 'all';
let firstSnapshotReady = false;

const milestoneRewards = [
  {count:3, icon:'🥚', name:'Mysterie-ei', subtitle:'Er beweegt iets vanbinnen…', kind:'egg'},
  {count:5, icon:'🌙', name:'Moonlight Snazzle', subtitle:'Een geheime Snazzle die alleen verzamelaars kennen.', kind:'moon'},
  {count:10, icon:'💎', name:'Prisma Snazzle', subtitle:'Een zeldzame glinster-Snazzle.', kind:'prisma'},
  {count:15, icon:'👑', name:'Crownkeeper Snazzle', subtitle:'Legendary verzamelbeloning.', kind:'crown'}
];

function escC(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function hashText(text){
  let h=2166136261;
  for(const ch of String(text)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); }
  return h>>>0;
}
function toDate(value){
  if(!value) return null;
  if(value instanceof Date) return value;
  if(typeof value?.toDate==='function') return value.toDate();
  const d=new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
function huntDate(h){
  return toDate(h.start) || toDate(h.foundAt) || toDate(h.createdAt) || toDate(h.updatedAt);
}
function huntYear(h){ return huntDate(h)?.getFullYear() || new Date().getFullYear(); }
function visibleHuntsForYear(year){
  return allHunts
    .filter(h=>h.mode!=='draft' && huntYear(h)===Number(year))
    .sort((a,b)=>(huntDate(a)?.getTime()||0)-(huntDate(b)?.getTime()||0));
}
function foundHuntsForYear(year){ return visibleHuntsForYear(year).filter(h=>h.found===true && h.foundByUserId); }
function myWinsForYear(year){
  if(!currentUser) return [];
  return foundHuntsForYear(year).filter(h=>h.foundByUserId===currentUser.uid);
}
function safeNickname(h){
  const n=String(h.foundByNickname||'Snazzle-speler').trim();
  return n.slice(0,24) || 'Snazzle-speler';
}
function leaderboard(year, village='all'){
  const map=new Map();
  foundHuntsForYear(year)
    .filter(h=>village==='all' || h.village===village)
    .forEach(h=>{
      const uid=h.foundByUserId;
      if(!uid) return;
      const prev=map.get(uid)||{uid,nickname:safeNickname(h),count:0,lastFound:0};
      prev.count+=1;
      prev.nickname=safeNickname(h)||prev.nickname;
      prev.lastFound=Math.max(prev.lastFound,huntDate(h)?.getTime()||0);
      map.set(uid,prev);
    });
  return [...map.values()].sort((a,b)=>b.count-a.count || a.lastFound-b.lastFound || a.nickname.localeCompare(b.nickname,'nl'));
}
function allYears(){
  const years=new Set([new Date().getFullYear()]);
  allHunts.filter(h=>h.mode!=='draft').forEach(h=>years.add(huntYear(h)));
  return [...years].sort((a,b)=>b-a);
}
function villagesForYear(year){
  return [...new Set(visibleHuntsForYear(year).map(h=>h.village).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'nl'));
}
function currentNickname(){
  return (localStorage.getItem('snazzleName')||'Snazzle-speler').trim().slice(0,24) || 'Snazzle-speler';
}

function collectorTheme(h){
  const themes=[
    {name:'Jungle', bg1:'#36b86a', bg2:'#0c6039', body:'#ffd84d', accent:'#7fe35b', accessory:'leaf'},
    {name:'Sterren', bg1:'#6154d8', bg2:'#25175e', body:'#75d9ff', accent:'#ffe66a', accessory:'star'},
    {name:'Vuur', bg1:'#ef7c33', bg2:'#8e2f21', body:'#ffd35a', accent:'#ff7b45', accessory:'flame'},
    {name:'Ridder', bg1:'#52758f', bg2:'#253746', body:'#f4c94f', accent:'#dce9f1', accessory:'helmet'},
    {name:'Schat', bg1:'#c98b2f', bg2:'#684119', body:'#ffe162', accent:'#65d8c2', accessory:'gem'},
    {name:'IJs', bg1:'#67cce8', bg2:'#216c95', body:'#f9f2cc', accent:'#b5f2ff', accessory:'snow'}
  ];
  return themes[hashText(h.id||h.title)%themes.length];
}
function accessorySvg(kind){
  if(kind==='leaf') return '<path d="M510 220 Q570 140 655 170 Q620 245 535 255Z" fill="#79dd55" stroke="#50351b" stroke-width="10"/><path d="M535 245 Q570 215 620 185" fill="none" stroke="#50351b" stroke-width="8"/>';
  if(kind==='star') return '<path d="M582 120 l23 51 56 6-42 38 12 55-49-28-49 28 12-55-42-38 56-6z" fill="#ffe46c" stroke="#4c341c" stroke-width="10"/>';
  if(kind==='flame') return '<path d="M575 105 Q635 180 590 248 Q548 211 566 170 Q525 203 535 260 Q470 207 513 151 Q545 119 575 105Z" fill="#ff7d43" stroke="#5a311e" stroke-width="10"/>';
  if(kind==='helmet') return '<path d="M485 250 Q500 130 610 130 Q715 130 730 250 L690 250 Q680 185 610 180 Q540 185 525 250Z" fill="#d9e2e7" stroke="#45382c" stroke-width="11"/><path d="M610 130 V92 M580 103 H640" stroke="#45382c" stroke-width="10" fill="none"/>';
  if(kind==='gem') return '<path d="M555 115 H645 L690 170 600 255 510 170Z" fill="#64d8c4" stroke="#4c341c" stroke-width="10"/><path d="M555 115 600 255 645 115 M510 170 H690" fill="none" stroke="#fff" stroke-width="6" opacity=".55"/>';
  return '<path d="M600 105 618 147 662 151 628 180 638 223 600 200 562 223 572 180 538 151 582 147Z" fill="#dff9ff" stroke="#4a6270" stroke-width="9"/><path d="M600 84 V240 M520 162 H680 M545 108 655 218 M655 108 545 218" stroke="#dff9ff" stroke-width="7"/>';
}
function collectorSvg(h, locked=false){
  const t=collectorTheme(h);
  const id=(h.id||'snazzle').replace(/[^a-z0-9]/gi,'').slice(0,12);
  if(locked){
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#214c35"/><stop offset="1" stop-color="#092c1d"/></linearGradient></defs><rect width="800" height="800" rx="70" fill="url(#l${id})"/><g opacity=".35" fill="#d8f0c8"><circle cx="120" cy="150" r="9"/><circle cx="690" cy="110" r="12"/><circle cx="675" cy="610" r="8"/><circle cx="145" cy="645" r="11"/></g><g fill="#071a12" opacity=".88"><ellipse cx="380" cy="485" rx="245" ry="180"/><circle cx="555" cy="310" r="130"/><path d="M655 300 780 352 655 408Z"/></g><text x="400" y="195" text-anchor="middle" font-family="Arial,sans-serif" font-size="132" font-weight="900" fill="#f5dd65">?</text><text x="400" y="725" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="900" fill="#d8f0c8">MYSTERIE SNAZZLE</text></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="b${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient><linearGradient id="d${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.body}"/><stop offset="1" stop-color="${t.accent}"/></linearGradient><filter id="s${id}"><feDropShadow dx="0" dy="14" stdDeviation="13" flood-opacity=".35"/></filter></defs><rect width="800" height="800" rx="70" fill="url(#b${id})"/><circle cx="115" cy="125" r="70" fill="#fff" opacity=".13"/><circle cx="700" cy="620" r="95" fill="#fff" opacity=".10"/><g fill="#fff5b8" opacity=".8"><path d="M115 310 l13 29 32 3-24 21 7 31-28-16-28 16 7-31-24-21 32-3z"/><path d="M700 215 l10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z"/></g><g filter="url(#s${id})">${accessorySvg(t.accessory)}<ellipse cx="355" cy="505" rx="235" ry="175" fill="url(#d${id})" stroke="#66401f" stroke-width="17"/><circle cx="545" cy="315" r="125" fill="url(#d${id})" stroke="#66401f" stroke-width="17"/><path d="M645 306 780 360 645 419 Q600 360 645 306Z" fill="#ff8a38" stroke="#66401f" stroke-width="14"/><circle cx="582" cy="282" r="16" fill="#14251b"/><circle cx="588" cy="277" r="5" fill="#fff"/><path d="M265 493 Q365 387 485 482 Q425 610 300 596 Q245 550 265 493Z" fill="${t.accent}" stroke="#66401f" stroke-width="13"/></g><text x="400" y="710" text-anchor="middle" font-family="Arial,sans-serif" font-size="46" font-weight="900" fill="#fff7d9" stroke="#53331d" stroke-width="2">${t.name.toUpperCase()} SNAZZLE</text><text x="400" y="758" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="800" fill="#fff7d9">UNIEKE VONDST</text></svg>`;
}
function bonusSvg(kind, locked=false){
  const dummy={id:'bonus-'+kind,title:kind};
  if(locked) return collectorSvg(dummy,true);
  const base=collectorSvg(dummy,false);
  const label={egg:'MYSTERIE-EI',moon:'MOONLIGHT',prisma:'PRISMA',crown:'CROWNKEEPER'}[kind]||'BONUS';
  return base.replace('UNIEKE VONDST',label);
}
function svgUrl(svg){ return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }

function injectCollectionStyles(){
  if($c('#snazzleCollectionStyles')) return;
  const style=document.createElement('style');
  style.id='snazzleCollectionStyles';
  style.textContent=`
    #collectionSheet{z-index:82}.collection-panel{background:radial-gradient(circle at 85% 0%,rgba(255,227,93,.55),transparent 23%),linear-gradient(180deg,#fff1aa 0%,#f0d18b 100%)!important;overflow-x:hidden}
    .collection-home-card{margin-top:14px;border:4px solid #6b4522;border-radius:22px;padding:13px 14px;display:grid;grid-template-columns:58px 1fr auto;align-items:center;gap:11px;background:linear-gradient(135deg,#6b54d8,#3653b8 48%,#157f68);color:#fff;box-shadow:0 6px 0 #49301d,0 10px 22px rgba(0,0,0,.2);position:relative;overflow:hidden}
    .collection-home-card:after{content:'✨';position:absolute;right:10px;top:6px;font-size:25px;opacity:.8;animation:collectionSpark 2.4s ease-in-out infinite}.collection-home-icon{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(#ffe870,#ffbd37);border:3px solid #72471f;font-size:30px;box-shadow:0 4px 0 #4e2d18}.collection-home-card strong{display:block;font-size:18px}.collection-home-card small{display:block;margin-top:3px;font-weight:760;color:#e6f8df;line-height:1.25}.collection-home-go{font-size:31px;font-weight:900;color:#ffec7a}
    .collection-hero{padding:17px;border-radius:22px;background:linear-gradient(135deg,#6b54d8,#4050c1 48%,#188b70);border:3px solid #553b98;color:#fff;box-shadow:0 5px 0 #43316d;margin-bottom:13px;position:relative;overflow:hidden}.collection-hero:after{content:'🦆';position:absolute;right:14px;bottom:-7px;font-size:76px;opacity:.2;transform:rotate(-8deg)}.collection-kicker{font-size:11px;font-weight:1000;letter-spacing:1.3px;color:#ffe87b}.collection-hero h3{font-size:25px;margin:4px 0 5px}.collection-hero p{margin:0;font-weight:760;line-height:1.4;max-width:83%}.collection-statline{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.collection-pill{padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);font-size:11px;font-weight:950}
    .collection-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.collection-controls label{display:block;font-size:10px;font-weight:950;color:#60431f;margin:0 0 4px 3px}.collection-controls select{width:100%;border:2px solid #b28d56;border-radius:12px;padding:9px;background:#fff8e2;color:#382719;font-weight:850}
    .collection-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px}.collection-tabs button{border:2px solid #b99055;border-radius:12px;padding:9px 5px;background:#fff4cf;color:#51371e;font-size:11px;font-weight:1000}.collection-tabs button.on{background:linear-gradient(#8ad953,#55aa39);border-color:#478430;color:#fff;box-shadow:0 3px 0 #367027}
    .collection-section{display:none}.collection-section.on{display:block}.collection-section-title{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:10px 2px 8px}.collection-section-title h3{margin:0;color:#3d2a18}.collection-section-title span{font-size:11px;font-weight:900;color:#6c532f;text-align:right}
    .collector-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.collector-card{border:3px solid #8a5b30;border-radius:18px;overflow:hidden;background:#fff8e4;color:#332318;box-shadow:0 4px 0 #6d4526;position:relative}.collector-card.found{border-color:#6d8e34}.collector-img{aspect-ratio:1;background:#183a29;overflow:hidden}.collector-img img{width:100%;height:100%;display:block;object-fit:cover}.collector-info{padding:9px}.collector-info strong{display:block;font-size:13px;line-height:1.18}.collector-info small{display:block;font-size:10px;color:#765a3a;font-weight:750;margin-top:3px;line-height:1.25}.collector-stamp{position:absolute;right:7px;top:7px;padding:5px 7px;border-radius:99px;background:#3d9b3a;color:#fff;border:2px solid #fff;font-size:9px;font-weight:1000;transform:rotate(5deg);box-shadow:0 2px 5px rgba(0,0,0,.2)}.collector-lock{position:absolute;right:8px;top:8px;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#1c2e25dd;color:#ffe66c;font-size:16px;border:2px solid #8ca478}
    .empty-collection{padding:20px;text-align:center;border:2px dashed #a88752;border-radius:17px;background:#fff7dd;color:#604727;font-weight:850;line-height:1.4}
    .nest-card{padding:14px;border-radius:20px;background:linear-gradient(135deg,#244c35,#153526);border:3px solid #775131;color:#fff6dc;box-shadow:0 5px 0 #4c321f}.nest-visual{text-align:center;font-size:55px;min-height:70px;display:grid;place-items:center}.nest-next{text-align:center;font-weight:900;color:#ffe56a;margin:2px 0 10px}.nest-bar{height:13px;border-radius:99px;background:#0e2419;border:2px solid #6b5937;overflow:hidden}.nest-bar>i{display:block;height:100%;background:linear-gradient(90deg,#75ce4b,#ffd94e);width:0;transition:width .3s ease}.milestone-list{display:grid;gap:9px;margin-top:12px}.milestone{display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:center;padding:10px;border-radius:15px;background:#fff8e2;border:2px solid #b18c55;color:#392719}.milestone.unlocked{background:#e9f8c8;border-color:#7da94a}.milestone-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#dccca5;font-size:28px;filter:grayscale(1);opacity:.7}.milestone.unlocked .milestone-icon{background:linear-gradient(#ffe777,#ffbf3f);filter:none;opacity:1}.milestone strong{display:block;font-size:13px}.milestone small{display:block;font-size:10px;color:#715536;font-weight:750;margin-top:3px}
    .bonus-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.bonus-card{border:3px solid #7e5732;border-radius:17px;overflow:hidden;background:#fff8e4;color:#332318;position:relative}.bonus-card img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#173825}.bonus-card div{padding:8px}.bonus-card strong{display:block;font-size:12px}.bonus-card small{display:block;font-size:9px;font-weight:760;color:#745637;margin-top:3px}.bonus-card.locked{filter:saturate(.72)}
    .leader-hero{padding:15px;border-radius:20px;background:linear-gradient(135deg,#ffe578,#ffb73d);border:3px solid #b16f1e;color:#4b310f;box-shadow:0 5px 0 #925b18;text-align:center;margin-bottom:12px}.leader-crown{font-size:45px}.leader-hero strong{display:block;font-size:22px}.leader-hero span{font-weight:850}.leader-note{font-size:11px;line-height:1.4;font-weight:800;color:#6b4d2a;margin:8px 2px 12px}.leaderboard{display:grid;gap:8px}.leader-row{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;padding:10px;border-radius:15px;background:#fff8e3;border:2px solid #b38f5a;color:#342419;box-shadow:0 3px 0 #9b7748}.leader-row.me{background:#e6f5bc;border-color:#79a649}.leader-rank{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#ead7aa;font-weight:1000}.leader-row:nth-child(1) .leader-rank{background:#ffd84e}.leader-row:nth-child(2) .leader-rank{background:#d7dde2}.leader-row:nth-child(3) .leader-rank{background:#d99554}.leader-name strong{display:block;font-size:14px}.leader-name small{display:block;font-size:9px;color:#765a3a;font-weight:750;margin-top:2px}.leader-score{font-size:18px;font-weight:1000;color:#49762c}.privacy-note{margin-top:11px;padding:9px 11px;border-radius:13px;background:#f7edce;border:2px dashed #b49460;color:#654b2e;font-size:10px;font-weight:800;line-height:1.4}
    #legendModal{position:fixed;inset:0;z-index:6500;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,14,8,.88);backdrop-filter:blur(6px)}#legendModal.show{display:flex}.legend-card{width:min(92vw,430px);text-align:center;padding:24px 18px;border-radius:25px;background:radial-gradient(circle at 50% 0,#fff6a6,#ffc344 58%,#ed9430);border:4px solid #75461f;color:#4a2f0d;box-shadow:0 18px 55px rgba(0,0,0,.55);position:relative;overflow:hidden}.legend-card:before,.legend-card:after{content:'✨';position:absolute;font-size:46px;animation:collectionSpark 2s ease-in-out infinite}.legend-card:before{left:18px;top:24px}.legend-card:after{right:18px;top:55px;animation-delay:.5s}.legend-big{font-size:74px}.legend-card h2{font-size:28px;margin:5px 0}.legend-card p{font-weight:850;line-height:1.4}.legend-card button{border:0;border-radius:14px;padding:12px 18px;background:#4c9136;color:#fff;font-weight:1000;box-shadow:0 4px 0 #326828}
    @keyframes collectionSpark{0%,100%{transform:scale(.9) rotate(-8deg);opacity:.55}50%{transform:scale(1.18) rotate(7deg);opacity:1}}
    @media(max-width:400px){.collection-home-card{grid-template-columns:52px 1fr 22px}.collector-info strong{font-size:12px}.collector-grid,.bonus-grid{gap:8px}.collection-controls{grid-template-columns:1fr}.collection-tabs button{font-size:10px}}
    @media(prefers-reduced-motion:reduce){.collection-home-card:after,.legend-card:before,.legend-card:after{animation:none}}
  `;
  document.head.appendChild(style);
}

function ensureCollectionUI(){
  if(!$c('#collectionSheet')){
    const sheet=document.createElement('div');
    sheet.className='sheet';
    sheet.id='collectionSheet';
    sheet.innerHTML=`<div class="panel collection-panel"><button class="close" id="collectionClose" type="button" aria-label="Sluiten">×</button><div class="handle"></div><h2>Mijn Snazzle Wereld ✨</h2><div class="collection-hero"><div class="collection-kicker">MIJN MAGISCHE VERZAMELING</div><h3 id="collectionHeroTitle">Snazzle Collectie</h3><p>Elke echte Snazzle-vondst onthult een unieke verzamel-Snazzle. Nieuwe hunts verschijnen vanzelf als mysteriekaart.</p><div class="collection-statline"><span class="collection-pill" id="collectionFoundPill">0 gevonden</span><span class="collection-pill" id="collectionTotalPill">0 hunts</span><span class="collection-pill" id="collectionRankPill">Nog geen plek</span></div></div><div class="collection-controls"><div><label>Jaar</label><select id="collectionYear"></select></div><div><label>Klassement</label><select id="collectionVillage"><option value="all">🌍 Algemeen</option></select></div></div><div class="collection-tabs"><button class="on" data-collection-tab="cards">✨ Collectie</button><button data-collection-tab="nest">🥚 Nest</button><button data-collection-tab="ranking">🏆 Jaarstand</button></div><section class="collection-section on" id="collectionCards"><div class="collection-section-title"><h3>Mijn kaarten</h3><span id="collectionCardSub">Nieuwe hunts = nieuwe kaart</span></div><div class="collector-grid" id="collectorGrid"></div></section><section class="collection-section" id="collectionNest"><div class="collection-section-title"><h3>Snazzle Nest</h3><span>Blijf zoeken, blijf unlocken</span></div><div class="nest-card"><div class="nest-visual" id="nestVisual">🥚</div><div class="nest-next" id="nestNext">Nog 3 vondsten tot het Mysterie-ei</div><div class="nest-bar"><i id="nestProgress"></i></div></div><div class="milestone-list" id="milestoneList"></div><div class="collection-section-title"><h3>Geheime bonus-Snazzles</h3><span>Niet te vinden — alleen te verdienen</span></div><div class="bonus-grid" id="bonusGrid"></div></section><section class="collection-section" id="collectionRanking"><div id="leaderHero"></div><div class="leader-note">Het klassement telt alleen centraal bevestigde vondsten. Alleen nicknames zijn zichtbaar; geen adres of exacte locatie.</div><div class="leaderboard" id="leaderboard"></div><div class="privacy-note">🌿 Iedereen kan meedoen. Ook als je niet bovenaan staat, verdien je via het Snazzle Nest eigen geheime beloningen bij 3, 5, 10 en 15 vondsten.</div></section></div>`;
    document.body.appendChild(sheet);
    $c('#collectionClose').onclick=()=>sheet.classList.remove('show');
    sheet.addEventListener('click',e=>{if(e.target===sheet) sheet.classList.remove('show');});
    $$c('[data-collection-tab]').forEach(btn=>btn.onclick=()=>switchCollectionTab(btn.dataset.collectionTab));
    $c('#collectionYear').onchange=e=>{selectedYear=Number(e.target.value); selectedVillage='all'; renderCollection();};
    $c('#collectionVillage').onchange=e=>{selectedVillage=e.target.value; renderCollection();};
  }
  if(!$c('#legendModal')){
    const modal=document.createElement('div');
    modal.id='legendModal'; modal.setAttribute('aria-hidden','true');
    modal.innerHTML='<div class="legend-card"><div class="legend-big">👑🦆🏆</div><h2 id="legendTitle">Snazzle Legend</h2><p id="legendText"></p><button type="button" id="legendClose">Magisch! ✨</button></div>';
    document.body.appendChild(modal);
    $c('#legendClose').onclick=()=>{modal.classList.remove('show');modal.setAttribute('aria-hidden','true');};
    modal.addEventListener('click',e=>{if(e.target===modal)$c('#legendClose').click();});
  }
}
function ensureHomeEntry(){
  const quick=$c('.quick');
  if(!quick || $c('#collectionHomeCard')) return;
  const card=document.createElement('button');
  card.type='button'; card.id='collectionHomeCard'; card.className='collection-home-card';
  card.innerHTML='<span class="collection-home-icon">✨</span><span><strong>Mijn Snazzle Collectie</strong><small id="collectionHomeStatus">Ontdek je magische spaarkaart</small></span><span class="collection-home-go">›</span>';
  quick.insertAdjacentElement('afterend',card);
  card.onclick=openCollection;
}
function injectMenuButton(){
  const nav=$c('.quick-menu-list');
  if(!nav || nav.querySelector('[data-snazzle-collection]')) return false;
  const btn=document.createElement('button');
  btn.type='button'; btn.dataset.snazzleCollection='1';
  btn.innerHTML='<b>✨</b><span><strong>Mijn Snazzle Collectie</strong><small>Spaarkaart, Nest & jaarstand</small></span><i>›</i>';
  const before=nav.querySelector('[data-quick-action="findings"]') || nav.firstElementChild;
  if(before) nav.insertBefore(btn,before); else nav.appendChild(btn);
  btn.onclick=openCollection;
  return true;
}
function closeQuickMenuCollection(){
  const overlay=$c('#quickMenuOverlay'); if(overlay){overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');}
  $c('#quickMenuBtn')?.setAttribute('aria-expanded','false');
  document.documentElement.style.overflow=''; document.body.style.overflow='';
}
function openCollection(){
  closeQuickMenuCollection();
  ensureCollectionUI(); renderCollection();
  const sheet=$c('#collectionSheet'); sheet.classList.add('show'); sheet.querySelector('.panel').scrollTop=0;
}
function switchCollectionTab(tab){
  const map={cards:'collectionCards',nest:'collectionNest',ranking:'collectionRanking'};
  $$c('[data-collection-tab]').forEach(b=>b.classList.toggle('on',b.dataset.collectionTab===tab));
  $$c('.collection-section').forEach(s=>s.classList.remove('on'));
  $c('#'+map[tab])?.classList.add('on');
}

function renderControls(){
  const yearSel=$c('#collectionYear'); if(!yearSel) return;
  const years=allYears();
  if(!years.includes(selectedYear)) selectedYear=years[0];
  yearSel.innerHTML=years.map(y=>`<option value="${y}"${y===selectedYear?' selected':''}>${y}</option>`).join('');
  const villageSel=$c('#collectionVillage');
  const villages=villagesForYear(selectedYear);
  if(selectedVillage!=='all' && !villages.includes(selectedVillage)) selectedVillage='all';
  villageSel.innerHTML='<option value="all">🌍 Algemeen</option>'+villages.map(v=>`<option value="${escC(v)}"${v===selectedVillage?' selected':''}>📍 ${escC(v)}</option>`).join('');
}
function renderHero(){
  const hunts=visibleHuntsForYear(selectedYear), mine=myWinsForYear(selectedYear), board=leaderboard(selectedYear,'all');
  const rank=currentUser ? board.findIndex(x=>x.uid===currentUser.uid)+1 : 0;
  $c('#collectionHeroTitle').textContent=`Mijn Snazzle Collectie ${selectedYear}`;
  $c('#collectionFoundPill').textContent=`✨ ${mine.length} gevonden`;
  $c('#collectionTotalPill').textContent=`🗺️ ${hunts.length} hunt${hunts.length===1?'':'s'}`;
  $c('#collectionRankPill').textContent=rank ? `🏆 plek ${rank}` : '🌱 nog geen score';
  const home=$c('#collectionHomeStatus');
  if(home) home.textContent=hunts.length ? `${mine.length} van ${hunts.length} verzameld · open je Nest` : 'Je eerste mysterievak wacht op een hunt';
}
function renderCards(){
  const grid=$c('#collectorGrid'); if(!grid) return;
  const hunts=visibleHuntsForYear(selectedYear);
  if(!hunts.length){ grid.innerHTML='<div class="empty-collection" style="grid-column:1/-1">✨ Zodra er een Snazzle Hunt wordt gepubliceerd, verschijnt hier automatisch het eerste mysterievak.</div>'; return; }
  grid.innerHTML='';
  hunts.forEach((h,index)=>{
    const mine=currentUser && h.found===true && h.foundByUserId===currentUser.uid;
    const foundByOther=h.found===true && h.foundByUserId && !mine;
    const card=document.createElement('article'); card.className='collector-card'+(mine?' found':'');
    const date=huntDate(h); const dateLabel=date?date.toLocaleDateString('nl-NL',{day:'numeric',month:'short'}):`Hunt ${index+1}`;
    const subtitle=mine ? `${dateLabel} · ${h.village||'Snazzle Hunt'}` : foundByOther ? `Deze Snazzle is door een andere speurder gevonden` : `${dateLabel} · nog te ontdekken`;
    card.innerHTML=`<div class="collector-img"><img alt="${mine?'Verzamel-Snazzle':'Mysterie Snazzle'}" src="${svgUrl(collectorSvg(h,!mine))}"></div>${mine?'<span class="collector-stamp">GEVONDEN ✓</span>':'<span class="collector-lock">🔒</span>'}<div class="collector-info"><strong>${mine?escC(collectorTheme(h).name+' Snazzle'):'Mysterie Snazzle #'+(index+1)}</strong><small>${escC(subtitle)}</small></div>`;
    grid.appendChild(card);
  });
  $c('#collectionCardSub').textContent=`${myWinsForYear(selectedYear).length} van ${hunts.length} onthuld`;
}
function renderNest(){
  const count=myWinsForYear(selectedYear).length;
  const list=$c('#milestoneList'); list.innerHTML='';
  milestoneRewards.forEach(r=>{
    const unlocked=count>=r.count;
    const row=document.createElement('div'); row.className='milestone'+(unlocked?' unlocked':'');
    row.innerHTML=`<div class="milestone-icon">${unlocked?r.icon:'🔒'}</div><div><strong>${r.count} vondsten · ${escC(r.name)} ${unlocked?'✓':''}</strong><small>${unlocked?escC(r.subtitle):`Nog ${r.count-count} te gaan om deze beloning te onthullen.`}</small></div>`;
    list.appendChild(row);
  });
  const next=milestoneRewards.find(r=>count<r.count);
  const prevCount=[...milestoneRewards].reverse().find(r=>count>=r.count)?.count||0;
  const target=next?.count||milestoneRewards.at(-1).count;
  const pct=next ? Math.max(0,Math.min(100,((count-prevCount)/(target-prevCount))*100)) : 100;
  $c('#nestProgress').style.width=pct+'%';
  if(next){
    $c('#nestVisual').textContent=count>=5?'🦆✨':'🥚✨';
    $c('#nestNext').textContent=`Nog ${next.count-count} vondst${next.count-count===1?'':'en'} tot ${next.name}`;
  }else{
    $c('#nestVisual').textContent='👑🦆✨';
    $c('#nestNext').textContent='Legendary Nest compleet!';
  }
  const bonus=$c('#bonusGrid'); bonus.innerHTML='';
  milestoneRewards.forEach(r=>{
    const unlocked=count>=r.count;
    const card=document.createElement('article'); card.className='bonus-card'+(unlocked?'':' locked');
    card.innerHTML=`<img alt="${unlocked?escC(r.name):'Geheime bonus-Snazzle'}" src="${svgUrl(bonusSvg(r.kind,!unlocked))}"><div><strong>${unlocked?escC(r.name):'??? Geheime Snazzle'}</strong><small>${unlocked?escC(r.subtitle):`Wordt onthuld bij ${r.count} vondsten.`}</small></div>`;
    bonus.appendChild(card);
  });
}
function renderRanking(){
  const board=leaderboard(selectedYear,selectedVillage);
  const hero=$c('#leaderHero');
  if(!board.length){
    hero.innerHTML='<div class="leader-hero"><div class="leader-crown">👑</div><strong>De troon is nog vrij!</strong><span>De eerste bevestigde vondst opent het klassement.</span></div>';
    $c('#leaderboard').innerHTML=''; return;
  }
  const leader=board[0];
  const final=isYearFinal(selectedYear);
  hero.innerHTML=`<div class="leader-hero"><div class="leader-crown">${final?'👑🏆':'👑'}</div><strong>${final?`Snazzle Legend ${selectedYear}`:`Koploper ${selectedYear}`}</strong><span>${escC(leader.nickname)} · ${leader.count} Snazzle${leader.count===1?'':'s'} gevonden</span></div>`;
  const box=$c('#leaderboard'); box.innerHTML='';
  board.slice(0,10).forEach((row,i)=>{
    const div=document.createElement('div'); div.className='leader-row'+(currentUser?.uid===row.uid?' me':'');
    div.innerHTML=`<div class="leader-rank">${i<3?['🥇','🥈','🥉'][i]:i+1}</div><div class="leader-name"><strong>${escC(row.nickname)}${currentUser?.uid===row.uid?' · jij':''}</strong><small>${i===0?'Op jacht naar de Snazzle-kroon':'Snazzle speurder'}</small></div><div class="leader-score">${row.count} 🦆</div>`;
    box.appendChild(div);
  });
}
function isYearFinal(year){
  const now=new Date();
  return Number(year)<now.getFullYear();
}
function maybeShowLegendAnnouncement(){
  if(!firstSnapshotReady || !currentUser) return;
  const completedYear=new Date().getFullYear()-1;
  const board=leaderboard(completedYear,'all');
  if(!board.length) return;
  const key=`snazzleLegendSeen:${completedYear}:${currentUser.uid}`;
  if(localStorage.getItem(key)==='1') return;
  const winner=board[0], me=winner.uid===currentUser.uid;
  $c('#legendTitle').textContent=me?`JIJ BENT SNAZZLE LEGEND ${completedYear}!`:`Snazzle Legend ${completedYear}`;
  $c('#legendText').textContent=me?`Wat een avontuur! Jij vond ${winner.count} Snazzles en eindigde bovenaan. De Snazzle-kroon is van jou!`:`${winner.nickname} vond ${winner.count} Snazzles en is de Snazzle Legend van ${completedYear}. Op naar een nieuw jaar vol avonturen!`;
  const modal=$c('#legendModal'); modal.classList.add('show');modal.setAttribute('aria-hidden','false');
  localStorage.setItem(key,'1');
}
function renderCollection(){
  ensureCollectionUI(); renderControls(); renderHero(); renderCards(); renderNest(); renderRanking();
}

function initData(){
  if(!auth || !db) return;
  onAuthStateChanged(auth,user=>{ currentUser=user||null; if(firstSnapshotReady){renderCollection(); maybeShowLegendAnnouncement();} });
  onSnapshot(collection(db,'hunts'),snap=>{
    allHunts=snap.docs.map(d=>({id:d.id,...d.data()}));
    firstSnapshotReady=true;
    renderCollection(); maybeShowLegendAnnouncement();
  },err=>{
    console.warn('Snazzle Collectie kon hunts niet laden',err);
    const home=$c('#collectionHomeStatus'); if(home) home.textContent='Collectie tijdelijk niet beschikbaar';
  });
}
function initCollection(){
  if(window.__snazzleCollectionLoaded) return;
  window.__snazzleCollectionLoaded=true;
  injectCollectionStyles(); ensureCollectionUI(); ensureHomeEntry(); injectMenuButton();
  const observer=new MutationObserver(()=>{ensureHomeEntry();injectMenuButton();});
  observer.observe(document.body,{childList:true,subtree:true});
  initData();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initCollection,{once:true}); else initCollection();
console.info(`Snazzle Collectie ${COLLECTION_VERSION} geladen`);
