// Snazzle Nieuws v47 — snelle visuele nieuwsfeed met posters, dagkaartjes en AI-ready cache.
// Belangrijk: er wordt NOOIT een AI-model aangeroepen wanneer een bezoeker de pagina opent.
// De app rendert alleen opgeslagen/cached items plus een lichte lokale dagselectie.
import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, writeBatch
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const NEWS_COLLECTION = 'villages';
const NEWS_KIND = 'snazzleNewsItem';
const MAX_IMAGE_CHARS = 620000;

let storedItems = [];
let adminRole = null;
let unsubscribeNews = null;
let editingId = null;
let editorImage = '';
let activeFilter = 'all';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));
const categories = {
  snazzle: {label:'Snazzle', icon:'✨'},
  roerdalen: {label:'Roerdalen', icon:'📍'},
  eenden: {label:'Eendenlol', icon:'🦆'},
  buiten: {label:'Buiten-tip', icon:'🌳'},
  weetje: {label:'Wist je dat?', icon:'💡'}
};

function toast(message){
  const node = $('#toast');
  if(node){
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(window.__snazzleNewsToast47);
    window.__snazzleNewsToast47 = setTimeout(()=>node.classList.remove('show'), 2800);
  } else console.info('[Snazzle Nieuws]', message);
}

function todayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function nlDate(){
  return new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
}
function daySeed(){
  return Number(todayKey().replaceAll('-','')) || 1;
}
function pick(list, offset=0){
  if(!list.length) return null;
  return list[(daySeed()+offset*17) % list.length];
}

const LOCAL_FACTS = [
  ['Roerdalen bestaat uit zes dorpskernen: Herkenbosch, Melick, Montfort, Posterholt, Sint Odiliënberg en Vlodrop.','Zes dorpen, heel veel plek om te ontdekken.'],
  ['In Roerdalen vind je bossen, beekdalen, heide en landbouwlandschap dicht bij elkaar.','Een goede reden om buiten eens extra goed om je heen te kijken.'],
  ['Bij Montfort herinneren de kasteelruïne en het landschap nog aan een lange geschiedenis.','Geschiedenis ligt soms gewoon langs je wandelroute.'],
  ['De Roer stroomt door Midden-Limburg en gaf het landschap én de streek mede vorm.','Water maakt onderweg altijd zijn eigen avontuur.'],
  ['Nationaal Park De Meinweg ligt deels in Roerdalen en is bekend om zijn bijzondere terrassenlandschap.','Heuvel op, heuvel af: natuur kan verrassend zijn.'],
  ['In veel Limburgse dorpen staan kapelletjes, oude boerderijen en kerken die iets vertellen over vroeger.','Kijk tijdens een wandeling eens hoeveel oude details je kunt spotten.']
];
const DUCK_FACTS = [
  ['Eenden smeren hun veren in met vet uit een klier bij hun staart.','Daardoor blijven hun veren beter waterafstotend. Handig als je bijna de hele dag bij water bent.'],
  ['Eenden hebben zwemvliezen tussen hun tenen.','Die werken onder water een beetje als kleine peddels.'],
  ['Veel vogels, ook eenden, hebben een extra doorschijnend ooglid.','Dat helpt het oog beschermen en schoonhouden.'],
  ['De poten van watervogels kunnen veel kou verdragen.','Hun bloedsomloop helpt warmteverlies via de poten te beperken.'],
  ['Een eend schudt na het zwemmen vaak flink met zijn veren.','Zo komt er lucht tussen de veren en blijft het verenkleed netjes.'],
  ['Eenden zoeken voedsel op heel verschillende manieren.','Sommige grondelen met hun kop onder water, andere duiken helemaal kopje-onder.']
];
const OUTSIDE_TIPS = [
  ['Mini-speurtocht','Zoek buiten iets ronds, iets geels, iets dat beweegt en iets dat lekker ruikt. Vier vondsten = missie geslaagd.'],
  ['Geluidenjacht','Sta één minuut stil. Hoeveel verschillende geluiden hoor je? Vogel, auto, wind, voetstappen… tel maar mee.'],
  ['Snazzle-route','Laat bij elke kruising om de beurt iemand bepalen: links, rechts of rechtdoor. Kijk waar je na tien minuten uitkomt.'],
  ['Kleurenchallenge','Probeer buiten vijf verschillende tinten groen te vinden. Bonuspunt als je er een grappige naam voor verzint.'],
  ['Wolkenverhaal','Kijk naar de wolken en kies allebei een figuur die je erin ziet. Maak er samen één gek verhaal van.'],
  ['Foto-missie','Maak drie foto’s: iets kleins, iets ouds en iets waarvan je normaal zomaar voorbijloopt.']
];
const FUN_FACTS = [
  ['Een slak kan niet rennen, maar wint wél bijna altijd van een stilstaande Snazzle.','Wetenschappelijk totaal onbelangrijk. Voor Snazzle: groot nieuws.'],
  ['Buiten spelen heeft een geheime superkracht: je merkt vaak pas achteraf hoeveel je bewogen hebt.','Dat noemen wij sluip-bewegen. 😄'],
  ['Een plas water is volgens volwassenen een plas.','Volgens kinderen is het soms een oceaan, racebaan of testplek voor laarzen.'],
  ['Een stok op de grond kan in vijf seconden veranderen in een zwaard, toverstaf of wandelstok.','Gratis fantasie-upgrade inbegrepen.'],
  ['De beste verstopplek is vaak de plek waar iedereen te snel voorbijloopt.','Snazzle-regel nummer één: kijk nog een keer.'],
  ['Een wandeling wordt 38% leuker als iemand onderweg “ik zie, ik zie…” begint.','Bron: het zeer officiële Snazzle Instituut voor Gezellige Onzin. 😉']
];

function dailyCards(){
  const local = pick(LOCAL_FACTS,1);
  const duck = pick(DUCK_FACTS,2);
  const outside = pick(OUTSIDE_TIPS,3);
  const fun = pick(FUN_FACTS,4);
  const date = todayKey();
  return [
    {id:`daily-local-${date}`,contentType:NEWS_KIND,source:'daily',category:'roerdalen',type:'card',title:local[0],body:local[1],published:true,publishedAt:date,updatedAt:date},
    {id:`daily-duck-${date}`,contentType:NEWS_KIND,source:'daily',category:'eenden',type:'card',title:duck[0],body:duck[1],published:true,publishedAt:date,updatedAt:date},
    {id:`daily-outside-${date}`,contentType:NEWS_KIND,source:'daily',category:'buiten',type:'card',title:outside[0],body:outside[1],published:true,publishedAt:date,updatedAt:date},
    {id:`daily-fun-${date}`,contentType:NEWS_KIND,source:'daily',category:'weetje',type:'card',title:fun[0],body:fun[1],published:true,publishedAt:date,updatedAt:date}
  ];
}

function publicItems(){
  const remote = storedItems.filter(item=>item.published !== false);
  return [...remote, ...dailyCards()].sort((a,b)=>{
    const fa = a.featured ? 1 : 0, fb = b.featured ? 1 : 0;
    if(fa !== fb) return fb-fa;
    const oa = Number(a.order ?? 9999), ob = Number(b.order ?? 9999);
    if(oa !== ob) return oa-ob;
    return String(b.publishedAt||b.updatedAt||'').localeCompare(String(a.publishedAt||a.updatedAt||''));
  });
}

function injectStyles(){
  if($('#snazzleNewsStyles47')) return;
  const style = document.createElement('style');
  style.id = 'snazzleNewsStyles47';
  style.textContent = `
    .home-card.sn-news-launch-card{height:155px!important;background:linear-gradient(145deg,#7051c8,#4a2f93)!important;border-color:#f5c84b!important;box-shadow:0 6px 0 #3f2817,0 12px 25px rgba(0,0,0,.20)!important;overflow:hidden!important}
    .home-card.sn-news-launch-card>img,.home-card.sn-news-launch-card>.empty,.home-card.sn-news-launch-card>.label{display:none!important}
    .sn-news-launch{position:absolute;inset:0;width:100%;border:0;background:radial-gradient(circle at 86% 18%,rgba(255,232,126,.22),transparent 22%),linear-gradient(135deg,#7256c8,#4d2e91);color:#fff;text-align:left;padding:18px 19px;display:grid;grid-template-columns:62px 1fr 32px;align-items:center;gap:13px}
    .sn-news-launch-icon{width:58px;height:58px;display:grid;place-items:center;border-radius:19px;background:#fff4c5;font-size:32px;box-shadow:0 5px 0 rgba(51,33,91,.48);transform:rotate(-3deg)}
    .sn-news-launch strong{display:block;font-size:22px;line-height:1;color:#fff7cc;text-shadow:0 2px rgba(0,0,0,.22)}
    .sn-news-launch small{display:block;margin-top:7px;color:#f4eeff;font-weight:800;line-height:1.25}
    .sn-news-launch-arrow{font-size:34px;color:#ffe277;text-align:right}

    .sn-news-overlay{position:fixed;inset:0;z-index:2200;background:#f8f4ff;display:none;overflow:auto;color:#2d2840;overscroll-behavior:contain}
    .sn-news-overlay.show{display:block}
    .sn-news-shell{width:min(760px,100%);min-height:100%;margin:0 auto;background:linear-gradient(180deg,#fbf8ff 0,#fffdf7 38%,#f8fff7 100%);box-shadow:0 0 50px rgba(30,18,62,.12)}
    .sn-news-topbar{position:sticky;top:0;z-index:8;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;background:rgba(251,248,255,.96);border-bottom:1px solid #e7dff2;backdrop-filter:blur(14px)}
    .sn-news-brand{display:flex;align-items:center;gap:10px;min-width:0}.sn-news-brand-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(145deg,#ffe789,#ffd05a);font-size:24px;box-shadow:0 3px 0 #c29132}
    .sn-news-brand strong{display:block;font-size:18px;color:#3b2d62;line-height:1}.sn-news-brand small{display:block;margin-top:4px;color:#817696;font-size:11px;font-weight:750;text-transform:capitalize}
    .sn-news-close{width:44px;height:44px;border:0;border-radius:14px;background:#4c397c;color:#fff;font-size:24px;font-weight:900;box-shadow:0 4px 0 #2d214b}
    .sn-news-intro{padding:22px 16px 6px}.sn-news-intro h1{margin:0;font-size:clamp(30px,8vw,46px);line-height:.95;color:#38275f;letter-spacing:-1.5px}.sn-news-intro p{margin:10px 0 0;color:#746b84;font-weight:700;line-height:1.45}
    .sn-news-filters{display:flex;gap:8px;overflow:auto;padding:14px 16px 11px;scrollbar-width:none}.sn-news-filters::-webkit-scrollbar{display:none}.sn-news-filter{flex:0 0 auto;border:1px solid #e0d7ec;border-radius:999px;background:#fff;color:#6b5b84;padding:9px 12px;font-weight:900;font-size:12px}.sn-news-filter.on{background:#5b4090;color:#fff;border-color:#5b4090;box-shadow:0 4px 12px rgba(78,54,129,.18)}
    .sn-news-content{padding:0 16px 28px}.sn-news-feature-title,.sn-news-list-title{margin:17px 2px 10px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#7a678f;font-weight:1000}.sn-news-feature-title{margin-top:7px}
    .sn-news-feature{overflow:hidden;border-radius:26px;background:#fff;border:1px solid #eadff0;box-shadow:0 14px 34px rgba(45,30,81,.10);margin-bottom:18px}.sn-news-feature button,.sn-news-poster button{display:block;width:100%;border:0;padding:0;background:#efeaf5}.sn-news-feature img,.sn-news-poster img{display:block;width:100%;height:auto;max-height:72vh;object-fit:contain;background:#eee7f5}.sn-news-feature-copy{padding:16px 17px 18px}.sn-news-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#786c87;font-size:11px;font-weight:900}.sn-news-badge{display:inline-flex;align-items:center;gap:4px;padding:5px 8px;border-radius:999px;background:#f2ecfb;color:#5f438d}.sn-news-ai-badge{background:#e8f8f0;color:#277453}.sn-news-feature-copy h2{margin:10px 0 7px;font-size:24px;line-height:1.08;color:#352a4d}.sn-news-feature-copy p{margin:0;color:#6e6876;line-height:1.55;font-weight:650}
    .sn-news-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.sn-news-card{min-width:0;overflow:hidden;border-radius:21px;background:#fff;border:1px solid #e9e3ed;box-shadow:0 9px 24px rgba(45,30,81,.07)}.sn-news-card.sn-news-poster{grid-column:1/-1}.sn-news-card-body{padding:14px}.sn-news-card h3{margin:9px 0 7px;font-size:17px;line-height:1.15;color:#392e50}.sn-news-card p{margin:0;color:#726b78;font-size:13px;line-height:1.48;font-weight:650}.sn-news-card .sn-news-meta{font-size:10px}.sn-news-empty{padding:30px 18px;text-align:center;border:2px dashed #ddd2e5;border-radius:22px;background:#fff}.sn-news-empty b{display:block;font-size:21px;color:#4f3d70;margin-bottom:6px}.sn-news-empty span{color:#7b7383}
    .sn-news-footer{padding:4px 16px 32px;text-align:center;color:#8b8196;font-size:11px;font-weight:750}.sn-news-footer b{color:#5c4383}
    .sn-news-image-view{position:fixed;inset:0;z-index:2400;background:rgba(12,8,22,.94);display:none;align-items:center;justify-content:center;padding:12px}.sn-news-image-view.show{display:flex}.sn-news-image-view img{max-width:100%;max-height:94vh;object-fit:contain;border-radius:13px}.sn-news-image-view button{position:absolute;right:14px;top:14px;width:46px;height:46px;border:0;border-radius:50%;background:#fff;color:#302446;font-size:26px;font-weight:1000}

    .sn-news-admin-note{padding:12px 13px;border-radius:14px;background:#f6efff;border:2px solid #c9b1e6;margin:10px 0;color:#4a3667;font-weight:750;line-height:1.42}.sn-news-admin-list{display:grid;gap:9px;margin-top:12px}.sn-news-admin-row{border:2px solid #c4a66f;background:#fff9e9;border-radius:15px;padding:11px;color:#332418}.sn-news-admin-row strong{display:block;font-size:16px}.sn-news-admin-row small{display:block;margin:4px 0 9px;color:#685742}.sn-news-admin-actions{display:grid;grid-template-columns:1fr 42px 42px 46px;gap:6px}.sn-news-admin-actions button{border:0;border-radius:10px;padding:9px 5px;background:#73512f;color:#fff7df;font-weight:900}.sn-news-admin-actions .danger{background:#93443b}.sn-news-editor{margin-top:14px;padding-top:13px;border-top:2px dashed #b99a66}.sn-news-preview{min-height:130px;display:grid;place-items:center;overflow:hidden;border:2px dashed #b99a66;border-radius:15px;background:#fffaf0;margin:8px 0 12px;color:#8f7654;font-weight:850;text-align:center}.sn-news-preview img{display:block;width:100%;max-height:420px;object-fit:contain}.sn-news-check{display:flex;align-items:center;gap:9px;padding:10px 0;font-weight:900}.sn-news-check input{width:20px;height:20px}
    @media(max-width:520px){.sn-news-grid{grid-template-columns:1fr}.sn-news-card.sn-news-poster{grid-column:auto}.sn-news-feature img,.sn-news-poster img{max-height:76vh}.sn-news-intro{padding-top:18px}.sn-news-topbar{padding-top:calc(10px + env(safe-area-inset-top))}.sn-news-content{padding-bottom:calc(28px + env(safe-area-inset-bottom))}}
    @media(prefers-reduced-motion:reduce){.sn-news-launch-arrow{animation:none}}
  `;
  document.head.appendChild(style);
}

function buildHomeButton(){
  const firstCard = document.querySelector('.home-images .home-card');
  if(!firstCard) return;
  if(firstCard.classList.contains('sn-news-launch-card')){
    const old = firstCard.querySelector('.sn-news-launch');
    if(old && old.dataset.news47 === '1') return;
    old?.remove();
  }
  firstCard.classList.add('sn-news-launch-card');
  firstCard.setAttribute('aria-label','Open Snazzle Nieuws');
  firstCard.insertAdjacentHTML('beforeend',`
    <button class="sn-news-launch" id="snNewsLaunch" data-news47="1" type="button">
      <span class="sn-news-launch-icon">🦆</span>
      <span><strong>Snazzle Nieuws</strong><small>Foto’s, Roerdalen, eendenlol & buiten-tips</small></span>
      <span class="sn-news-launch-arrow">›</span>
    </button>`);
  $('#snNewsLaunch').onclick = openNews;
}

function buildReader(){
  $('#snNewsOverlay')?.remove();
  $('#snNewsImageView')?.remove();
  document.body.insertAdjacentHTML('beforeend',`
    <div class="sn-news-overlay" id="snNewsOverlay" aria-hidden="true">
      <div class="sn-news-shell" role="dialog" aria-modal="true" aria-label="Snazzle Nieuws">
        <div class="sn-news-topbar">
          <div class="sn-news-brand"><span class="sn-news-brand-icon">🦆</span><span><strong>Snazzle Nieuws</strong><small id="snNewsDate">${esc(nlDate())}</small></span></div>
          <button class="sn-news-close" id="snNewsClose" aria-label="Sluiten">×</button>
        </div>
        <div class="sn-news-intro"><h1>Vandaag valt er weer iets te ontdekken.</h1><p>Leuke Snazzle-updates, weetjes uit Roerdalen, eendenlol en kleine redenen om naar buiten te gaan.</p></div>
        <div class="sn-news-filters" id="snNewsFilters"></div>
        <main class="sn-news-content" id="snNewsContent"></main>
        <div class="sn-news-footer"><b>Snazzle Creations</b> · kleine eendjes, grote avonturen</div>
      </div>
    </div>
    <div class="sn-news-image-view" id="snNewsImageView" aria-hidden="true"><button type="button" id="snNewsImageClose" aria-label="Afbeelding sluiten">×</button><img id="snNewsImageLarge" alt="Snazzle nieuwsafbeelding"></div>`);
  $('#snNewsClose').onclick = closeNews;
  $('#snNewsOverlay').addEventListener('click',e=>{ if(e.target === $('#snNewsOverlay')) closeNews(); });
  $('#snNewsImageClose').onclick = closeImage;
  $('#snNewsImageView').addEventListener('click',e=>{ if(e.target === $('#snNewsImageView')) closeImage(); });
  document.addEventListener('keydown',e=>{
    if(e.key !== 'Escape') return;
    if($('#snNewsImageView')?.classList.contains('show')) closeImage();
    else if($('#snNewsOverlay')?.classList.contains('show')) closeNews();
  });
  renderFilters();
}

function openNews(){
  renderNews();
  const overlay = $('#snNewsOverlay');
  if(!overlay) return;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  overlay.scrollTop = 0;
}
function closeNews(){
  const overlay = $('#snNewsOverlay');
  if(!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
function openImage(src){
  if(!src) return;
  $('#snNewsImageLarge').src = src;
  $('#snNewsImageView').classList.add('show');
  $('#snNewsImageView').setAttribute('aria-hidden','false');
}
function closeImage(){
  $('#snNewsImageView')?.classList.remove('show');
  $('#snNewsImageView')?.setAttribute('aria-hidden','true');
  const img=$('#snNewsImageLarge'); if(img) img.removeAttribute('src');
}

function renderFilters(){
  const box = $('#snNewsFilters');
  if(!box) return;
  const filterList = [['all','Alles','🌈'],...Object.entries(categories).map(([key,v])=>[key,v.label,v.icon])];
  box.innerHTML = filterList.map(([key,label,icon])=>`<button type="button" class="sn-news-filter ${activeFilter===key?'on':''}" data-news-filter="${key}">${icon} ${esc(label)}</button>`).join('');
  box.querySelectorAll('[data-news-filter]').forEach(btn=>btn.onclick=()=>{
    activeFilter = btn.dataset.newsFilter || 'all';
    renderFilters();
    renderNews();
  });
}

function categoryMeta(item){
  return categories[item.category] || categories.snazzle;
}
function sourceBadge(item){
  if(item.source === 'ai') return '<span class="sn-news-badge sn-news-ai-badge">✨ AI-nieuwtje</span>';
  if(item.source === 'daily') return '<span class="sn-news-badge sn-news-ai-badge">☀️ Dagelijks</span>';
  return '<span class="sn-news-badge">🦆 Snazzle</span>';
}
function cardMeta(item){
  const cat = categoryMeta(item);
  return `<div class="sn-news-meta"><span class="sn-news-badge">${cat.icon} ${esc(cat.label)}</span>${sourceBadge(item)}</div>`;
}
function imageButton(item, eager=false){
  if(!item.image) return '';
  const safe = String(item.image);
  return `<button type="button" data-news-image="${esc(safe)}" aria-label="Afbeelding groot bekijken"><img src="${esc(safe)}" alt="${esc(item.title || 'Snazzle nieuws')}" loading="${eager?'eager':'lazy'}" decoding="async"></button>`;
}
function featureHtml(item){
  if(!item) return '';
  const hasText = Boolean(item.title || item.body);
  return `<section class="sn-news-feature">${imageButton(item,true)}${hasText?`<div class="sn-news-feature-copy">${cardMeta(item)}${item.title?`<h2>${esc(item.title)}</h2>`:''}${item.body?`<p>${esc(item.body)}</p>`:''}</div>`:''}</section>`;
}
function cardHtml(item){
  const poster = item.type === 'poster' || (item.image && !item.title && !item.body);
  if(poster) return `<article class="sn-news-card sn-news-poster">${imageButton(item,false)}${item.title||item.body?`<div class="sn-news-card-body">${cardMeta(item)}${item.title?`<h3>${esc(item.title)}</h3>`:''}${item.body?`<p>${esc(item.body)}</p>`:''}</div>`:''}</article>`;
  return `<article class="sn-news-card">${item.image?imageButton(item,false):''}<div class="sn-news-card-body">${cardMeta(item)}${item.title?`<h3>${esc(item.title)}</h3>`:''}${item.body?`<p>${esc(item.body)}</p>`:''}</div></article>`;
}

function renderNews(){
  const root = $('#snNewsContent');
  if(!root) return;
  let items = publicItems();
  if(activeFilter !== 'all') items = items.filter(item=>item.category===activeFilter);
  const featured = items.find(item=>item.featured && item.image) || items.find(item=>item.image) || items[0] || null;
  const rest = featured ? items.filter(item=>item.id!==featured.id) : items;
  if(!featured){
    root.innerHTML = '<div class="sn-news-empty"><b>Nog even geduld 🦆</b><span>Het volgende Snazzle nieuwtje komt eraan.</span></div>';
    return;
  }
  root.innerHTML = `${activeFilter==='all'?'<div class="sn-news-feature-title">Vandaag bij Snazzle</div>':''}${featureHtml(featured)}${rest.length?'<div class="sn-news-list-title">Meer om te ontdekken</div>':''}<div class="sn-news-grid">${rest.map(cardHtml).join('')}</div>`;
  root.querySelectorAll('[data-news-image]').forEach(btn=>btn.onclick=()=>openImage(btn.dataset.newsImage));
}

async function compressPoster(file){
  if(!file || !file.type.startsWith('image/')) throw new Error('Kies een geldige afbeelding.');
  const dataUrl = await new Promise((resolve,reject)=>{
    const r = new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen.')); r.readAsDataURL(file);
  });
  const image = await new Promise((resolve,reject)=>{
    const im = new Image(); im.onload=()=>resolve(im); im.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend.')); im.src=dataUrl;
  });
  let max = 1500, quality = .86;
  for(let attempt=0; attempt<7; attempt++){
    const scale = Math.min(1,max/Math.max(image.width,image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(image.width*scale));
    canvas.height = Math.max(1,Math.round(image.height*scale));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    let out = '';
    try{ out = canvas.toDataURL('image/webp',quality); }catch{ out = canvas.toDataURL('image/jpeg',quality); }
    if(out.length <= MAX_IMAGE_CHARS) return out;
    max = Math.round(max*.84); quality = Math.max(.55,quality-.06);
  }
  throw new Error('De afbeelding blijft te groot. Kies een iets kleinere afbeelding.');
}

function buildAdminUI(){
  const tabs = $('#adminSheet .super-only .tabs');
  const superOnly = $('#adminSheet .super-only');
  if(!tabs || !superOnly || $('#newsAdmin47')) return;

  // Verwijder eventueel de oude krantenbeheer-sectie uit v46 als die nog in de DOM stond.
  $('#newsAdmin')?.remove();
  tabs.querySelector('[data-news-tab]')?.remove();

  const tab = document.createElement('button');
  tab.type='button'; tab.dataset.newsTab47='newsAdmin47'; tab.textContent='Nieuws'; tabs.appendChild(tab);
  const section = document.createElement('section');
  section.className='admin-section'; section.id='newsAdmin47';
  section.innerHTML = `
    <h3>Snazzle Nieuws 🦆</h3>
    <div class="sn-news-admin-note"><b>Nieuw:</b> plaats rechtstreeks een kant-en-klare nieuwsafbeelding of maak een kort bericht. De oude krantenopmaak is weg. Afbeeldingen worden automatisch verkleind zodat de app snel blijft.</div>
    <button class="save" id="snNewsNewItem">+ Afbeelding / nieuws toevoegen</button>
    <div class="sn-news-admin-list" id="snNewsAdminList47"></div>
    <div class="sn-news-editor" id="snNewsEditor47" style="display:none">
      <h3 id="snNewsEditorTitle47">Nieuws toevoegen</h3>
      <div class="field"><label>Soort</label><select id="snNewsType47"><option value="poster">Afbeelding / poster (tekst mag al in de afbeelding staan)</option><option value="card">Kort nieuwskaartje</option></select></div>
      <div class="field"><label>Categorie</label><select id="snNewsCategory47">${Object.entries(categories).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label}</option>`).join('')}</select></div>
      <div class="field"><label>Titel (optioneel bij een poster)</label><input id="snNewsTitle47" maxlength="120" placeholder="Bijv. Nieuwe Snazzle Hunt"></div>
      <div class="field"><label>Korte tekst (optioneel bij een poster)</label><textarea id="snNewsBody47" maxlength="700" placeholder="Kort en kindvriendelijk"></textarea></div>
      <div class="field"><label>Afbeelding</label><input id="snNewsImage47" type="file" accept="image/*"></div>
      <div class="sn-news-preview" id="snNewsPreview47">Nog geen afbeelding</div>
      <label class="sn-news-check"><input id="snNewsFeatured47" type="checkbox"> Bovenaan uitlichten</label>
      <label class="sn-news-check"><input id="snNewsPublished47" type="checkbox" checked> Meteen zichtbaar</label>
      <button class="save" id="snNewsSave47">Opslaan</button>
      <button class="secondary" id="snNewsCancel47">Annuleren</button>
    </div>`;
  superOnly.appendChild(section);

  tab.onclick=()=>{
    $$('#adminSheet [data-tab]').forEach(b=>b.classList.remove('on'));
    $$('#adminSheet [data-news-tab47]').forEach(b=>b.classList.remove('on'));
    $$('#adminSheet .admin-section').forEach(s=>s.classList.remove('on'));
    tab.classList.add('on'); section.classList.add('on'); renderAdminList();
  };
  $('#snNewsNewItem').onclick=()=>openEditor(null);
  $('#snNewsCancel47').onclick=closeEditor;
  $('#snNewsSave47').onclick=saveEditor;
  $('#snNewsImage47').onchange=handleImage;
  renderAdminList();
}

function renderAdminList(){
  const list=$('#snNewsAdminList47'); if(!list) return;
  list.innerHTML='';
  if(!storedItems.length){
    list.innerHTML='<div class="sn-news-admin-note">Nog geen eigen nieuws. Tik op <b>Afbeelding / nieuws toevoegen</b>. De dagelijkse Snazzle-kaartjes verschijnen automatisch voor bezoekers.</div>';
    return;
  }
  storedItems.forEach((item,index)=>{
    const row=document.createElement('div'); row.className='sn-news-admin-row';
    const cat=categoryMeta(item);
    row.innerHTML=`<strong>${item.title?esc(item.title):item.type==='poster'?'Nieuwsafbeelding':'Nieuwskaartje'}</strong><small>${cat.icon} ${esc(cat.label)} · ${item.published===false?'concept':'zichtbaar'}${item.featured?' · bovenaan':''}</small><div class="sn-news-admin-actions"><button data-edit="${item.id}">Bewerken</button><button data-up="${item.id}" aria-label="Omhoog">↑</button><button data-down="${item.id}" aria-label="Omlaag">↓</button><button class="danger" data-delete="${item.id}" aria-label="Verwijderen">🗑</button></div>`;
    list.appendChild(row);
  });
  list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEditor(b.dataset.edit));
  list.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>moveItem(b.dataset.up,-1));
  list.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>moveItem(b.dataset.down,1));
  list.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeItem(b.dataset.delete));
}

function openEditor(id){
  if(adminRole !== 'superadmin') return toast('Alleen de hoofdbeheerder kan Snazzle Nieuws aanpassen.');
  editingId=id;
  const item=storedItems.find(x=>x.id===id)||null;
  editorImage=item?.image||'';
  $('#snNewsEditor47').style.display='block';
  $('#snNewsEditorTitle47').textContent=item?'Nieuws bewerken':'Nieuws toevoegen';
  $('#snNewsType47').value=item?.type||'poster';
  $('#snNewsCategory47').value=item?.category||'snazzle';
  $('#snNewsTitle47').value=item?.title||'';
  $('#snNewsBody47').value=item?.body||'';
  $('#snNewsFeatured47').checked=Boolean(item?.featured);
  $('#snNewsPublished47').checked=item ? item.published!==false : true;
  $('#snNewsImage47').value='';
  renderEditorPreview();
  $('#snNewsEditor47').scrollIntoView({behavior:'smooth',block:'start'});
}
function closeEditor(){
  editingId=null; editorImage='';
  if($('#snNewsEditor47')) $('#snNewsEditor47').style.display='none';
}
function renderEditorPreview(){
  const box=$('#snNewsPreview47'); if(!box) return;
  box.innerHTML=editorImage?`<img src="${esc(editorImage)}" alt="Voorbeeld">`:'Nog geen afbeelding';
}
async function handleImage(event){
  try{
    const file=event.target.files?.[0]; if(!file) return;
    toast('Afbeelding optimaliseren…');
    editorImage=await compressPoster(file); renderEditorPreview(); toast('Afbeelding klaar ✅');
  }catch(err){toast(err.message||'Afbeelding kon niet worden toegevoegd.');}
  finally{event.target.value='';}
}

async function saveEditor(){
  if(adminRole !== 'superadmin') return toast('Alleen de hoofdbeheerder kan Snazzle Nieuws aanpassen.');
  const type=$('#snNewsType47').value;
  const title=$('#snNewsTitle47').value.trim();
  const body=$('#snNewsBody47').value.trim();
  if(type==='poster' && !editorImage && !title && !body) return toast('Voeg een afbeelding of tekst toe.');
  if(type==='card' && !title) return toast('Geef het nieuwskaartje een titel.');
  const existing=storedItems.find(x=>x.id===editingId);
  const now=new Date().toISOString();
  const payload={
    active:false,
    contentType:NEWS_KIND,
    name:'Snazzle Nieuws item',
    source:existing?.source==='ai'?'ai':'manual',
    type,
    category:$('#snNewsCategory47').value,
    title, body, image:editorImage,
    featured:$('#snNewsFeatured47').checked,
    published:$('#snNewsPublished47').checked,
    order:existing?Number(existing.order??storedItems.indexOf(existing)):storedItems.length,
    publishedAt:existing?.publishedAt||now,
    createdAt:existing?.createdAt||now,
    updatedAt:now
  };
  try{
    $('#snNewsSave47').disabled=true;
    if(editingId) await updateDoc(doc(db,NEWS_COLLECTION,editingId),payload);
    else await addDoc(collection(db,NEWS_COLLECTION),payload);
    toast('Snazzle Nieuws opgeslagen ✅'); closeEditor();
  }catch(err){console.error(err);toast('Opslaan lukte niet. Controleer de beheerrechten.');}
  finally{if($('#snNewsSave47')) $('#snNewsSave47').disabled=false;}
}
async function removeItem(id){
  if(adminRole !== 'superadmin') return;
  const item=storedItems.find(x=>x.id===id); if(!item || !confirm('Dit nieuwsitem verwijderen?')) return;
  try{await deleteDoc(doc(db,NEWS_COLLECTION,id));toast('Nieuws verwijderd.');}catch(err){console.error(err);toast('Verwijderen lukte niet.');}
}
async function moveItem(id,delta){
  if(adminRole !== 'superadmin') return;
  const index=storedItems.findIndex(x=>x.id===id), target=index+delta;
  if(index<0||target<0||target>=storedItems.length) return;
  try{
    const batch=writeBatch(db), now=new Date().toISOString();
    batch.update(doc(db,NEWS_COLLECTION,storedItems[index].id),{order:target,updatedAt:now});
    batch.update(doc(db,NEWS_COLLECTION,storedItems[target].id),{order:index,updatedAt:now});
    await batch.commit();
  }catch(err){console.error(err);toast('Volgorde wijzigen lukte niet.');}
}

function startNewsListener(){
  if(unsubscribeNews) return;
  unsubscribeNews=onSnapshot(collection(db,NEWS_COLLECTION),snap=>{
    storedItems=snap.docs.map(d=>({id:d.id,...d.data()})).filter(item=>item.contentType===NEWS_KIND).sort((a,b)=>(a.order??0)-(b.order??0));
    if($('#snNewsOverlay')?.classList.contains('show')) renderNews();
    renderAdminList();
  },err=>console.error('Snazzle Nieuws kon niet laden',err));
}

onAuthStateChanged(auth,async user=>{
  if(!user){adminRole=null;return;}
  startNewsListener();
  try{
    const snap=await getDoc(doc(db,'adminUsers',user.uid));
    adminRole=snap.exists()&&snap.data()?.active!==false?snap.data()?.role||null:null;
  }catch{adminRole=null;}
  buildAdminUI();
});

injectStyles();
buildHomeButton();
buildReader();
buildAdminUI();
document.addEventListener('snazzle:admin-ui-ready',()=>buildAdminUI(),{once:false});
document.addEventListener('snazzle:home-ui-ready',()=>buildHomeButton(),{once:false});

window.SnazzleNewsV47={open:openNews,render:renderNews,version:'47'};
