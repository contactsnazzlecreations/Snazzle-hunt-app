// Snazzle Nieuws v46 — interactieve krant met paginawissel en centraal beheer.
import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, writeBatch
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);
// Gebruik verborgen, inactieve systeemdocumenten in de bestaande villages-collectie.
// Die collectie heeft al productie-rechten in de app; active:false houdt deze documenten
// volledig buiten de dorpenlijsten. Zo werkt de krant zonder een extra Firebase-deploy.
const NEWS_COLLECTION = 'villages';
const NEWS_KIND = 'snazzleNewsPage';
const MAX_IMAGES = 3;

let pages = [];
let currentPage = 0;
let unsubscribeNews = null;
let adminRole = null;
let editingId = null;
let editorImages = [];
let flipBusy = false;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));

function toast(message){
  const node = $('#toast');
  if(node){
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(window.__snazzleNewsToast);
    window.__snazzleNewsToast = setTimeout(()=>node.classList.remove('show'), 2800);
  } else {
    console.info('[Snazzle Nieuws]', message);
  }
}

function injectStyles(){
  if($('#snazzleNewsStyles')) return;
  const style = document.createElement('style');
  style.id = 'snazzleNewsStyles';
  style.textContent = `
    .home-card.sn-news-launch-card{height:155px!important;background:linear-gradient(145deg,#236d3e,#0f4c2d)!important;border-color:#d3aa5c!important;box-shadow:0 6px 0 #3f2817,0 12px 25px rgba(0,0,0,.2)!important;overflow:hidden!important}
    .home-card.sn-news-launch-card>img,.home-card.sn-news-launch-card>.empty,.home-card.sn-news-launch-card>.label{display:none!important}
    .sn-news-launch{position:absolute;inset:0;width:100%;border:0;background:radial-gradient(circle at 86% 18%,rgba(255,226,131,.22),transparent 20%),linear-gradient(135deg,rgba(28,113,65,.98),rgba(8,62,36,.98));color:#fff7df;text-align:left;padding:18px 20px;display:grid;grid-template-columns:64px 1fr 34px;align-items:center;gap:13px}
    .sn-news-launch .paper-icon{width:58px;height:68px;border-radius:7px;background:#fff7df;color:#173c29;display:grid;place-items:center;font-size:34px;border:3px solid #d7b56c;box-shadow:4px 5px 0 rgba(53,33,18,.55);transform:rotate(-4deg)}
    .sn-news-launch strong{display:block;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1;color:#ffe391;text-shadow:0 2px rgba(0,0,0,.3)}
    .sn-news-launch small{display:block;margin-top:7px;font-weight:800;line-height:1.25;color:#f8f0d1}
    .sn-news-launch .arrow{font-size:38px;color:#ffd85e;text-align:right;animation:snNewsArrow 2s ease-in-out infinite}
    @keyframes snNewsArrow{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}

    .sn-news-overlay{position:fixed;inset:0;z-index:2200;background:rgba(6,12,8,.9);backdrop-filter:blur(7px);display:none;align-items:center;justify-content:center;padding:12px}
    .sn-news-overlay.show{display:flex}
    .sn-news-shell{width:min(720px,100%);height:min(92vh,840px);display:flex;flex-direction:column;position:relative}
    .sn-news-topbar{display:flex;justify-content:space-between;align-items:center;color:#fff8e5;margin-bottom:8px;padding:0 2px;gap:8px}
    .sn-news-topbar strong{font-size:13px;letter-spacing:.8px;text-transform:uppercase}
    .sn-news-close{width:44px;height:44px;border:0;border-radius:14px;background:#fff7df;color:#3b2a1d;font-size:24px;font-weight:900;box-shadow:0 4px 0 #96744b}
    .sn-news-stage{flex:1;min-height:0;perspective:1500px;position:relative;display:flex;align-items:center;justify-content:center}
    .sn-newspaper{width:100%;height:100%;max-height:760px;background:#f7f0dc;color:#201b16;border-radius:5px;box-shadow:0 18px 50px rgba(0,0,0,.45),inset 0 0 40px rgba(110,86,45,.08);border:1px solid #d7c7a5;overflow:hidden;position:relative;transform-style:preserve-3d}
    .sn-newspaper:before{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(75,55,30,.018) 0 1px,transparent 1px 4px);mix-blend-mode:multiply;z-index:1}
    .sn-news-page{height:100%;overflow:auto;padding:18px 18px 76px;position:relative;z-index:2;scrollbar-width:thin}
    .sn-news-masthead{border-top:4px double #211c17;border-bottom:4px double #211c17;padding:8px 0 7px;margin-bottom:10px;text-align:center}
    .sn-news-masthead h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(31px,7vw,55px);line-height:.95;letter-spacing:-1.6px;margin:0;color:#1e1a16;text-transform:uppercase}
    .sn-news-masthead .strap{display:flex;justify-content:space-between;gap:8px;margin-top:7px;font:700 10px/1.2 Georgia,'Times New Roman',serif;text-transform:uppercase;letter-spacing:.8px}
    .sn-news-kicker{display:inline-block;border:1px solid #2a241e;padding:4px 7px;font:800 10px/1.2 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.8px;margin:5px 0 8px;background:#eee3c7}
    .sn-news-headline{font-family:Georgia,'Times New Roman',serif;font-size:clamp(27px,6vw,48px);line-height:.97;letter-spacing:-1px;margin:3px 0 10px;color:#17130f}
    .sn-news-deck{font:italic 700 14px/1.35 Georgia,'Times New Roman',serif;border-bottom:1px solid #7b6a4e;padding-bottom:9px;margin-bottom:10px;color:#443a2e}
    .sn-news-photos{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:10px 0}
    .sn-news-photos.one{grid-template-columns:1fr}
    .sn-news-photos img{width:100%;height:180px;object-fit:cover;filter:saturate(.9) contrast(1.03);border:1px solid #8f8068;background:#ddd0b4}
    .sn-news-photos.one img{height:min(34vh,300px)}
    .sn-news-photos img:first-child:nth-last-child(3){grid-column:span 2;height:210px}
    .sn-news-caption{font:italic 11px/1.3 Georgia,'Times New Roman',serif;color:#5b4f40;margin:4px 0 8px}
    .sn-news-body{font:15px/1.55 Georgia,'Times New Roman',serif;color:#262019;white-space:pre-line;text-align:left}
    .sn-news-body:first-letter{float:left;font-size:48px;line-height:.78;padding:7px 6px 0 0;font-weight:700}
    .sn-news-empty{height:70%;display:grid;place-items:center;text-align:center;padding:24px;font-family:Georgia,'Times New Roman',serif}
    .sn-news-empty b{display:block;font-size:30px;margin-bottom:8px}
    .sn-news-page-no{position:absolute;bottom:14px;left:18px;right:18px;border-top:1px solid #98866a;padding-top:7px;display:flex;justify-content:space-between;font:700 10px/1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.7px;background:#f7f0dc}
    .sn-news-nav{position:absolute;left:10px;right:10px;bottom:10px;z-index:8;display:grid;grid-template-columns:48px 1fr 48px;align-items:center;gap:8px;pointer-events:none}
    .sn-news-nav button{pointer-events:auto;width:48px;height:48px;border-radius:50%;border:2px solid #e3c888;background:#2f251b;color:#ffe9a9;font-size:27px;box-shadow:0 5px 15px rgba(0,0,0,.25)}
    .sn-news-counter{text-align:center;color:#fff6dc;font-weight:900;font-size:12px;text-shadow:0 2px 4px #000}
    .sn-news-nav button:disabled{opacity:.32;filter:grayscale(1)}
    .sn-news-turning{position:absolute;inset:0;background:#f7f0dc;z-index:20;transform-style:preserve-3d;backface-visibility:hidden;box-shadow:-8px 0 20px rgba(0,0,0,.16);overflow:hidden}
    .sn-news-turning.next{transform-origin:left center;animation:snTurnNext .48s cubic-bezier(.45,.05,.25,1) forwards}
    .sn-news-turning.prev{transform-origin:right center;animation:snTurnPrev .48s cubic-bezier(.45,.05,.25,1) forwards}
    @keyframes snTurnNext{0%{transform:rotateY(0)}100%{transform:rotateY(-168deg);opacity:.12}}
    @keyframes snTurnPrev{0%{transform:rotateY(0)}100%{transform:rotateY(168deg);opacity:.12}}

    .sn-news-admin-note{padding:11px 12px;border-radius:13px;background:#fff8df;border:2px solid #d3b878;margin:9px 0;color:#3a2a1d;font-weight:750}
    .sn-news-admin-list{display:grid;gap:9px;margin-top:12px}
    .sn-news-admin-row{border:2px solid #c4a66f;background:#fff9e9;border-radius:15px;padding:11px;color:#332418}
    .sn-news-admin-row strong{display:block;font-family:Georgia,'Times New Roman',serif;font-size:17px}
    .sn-news-admin-row small{display:block;margin:4px 0 9px;color:#685742}
    .sn-news-admin-actions{display:grid;grid-template-columns:1fr 44px 44px 48px;gap:6px}
    .sn-news-admin-actions button{border:0;border-radius:10px;padding:9px 6px;background:#73512f;color:#fff7df;font-weight:900}
    .sn-news-admin-actions .danger{background:#93443b}
    .sn-news-editor{margin-top:14px;padding-top:13px;border-top:2px dashed #b99a66}
    .sn-news-image-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:8px 0}
    .sn-news-image-chip{position:relative;height:95px;border:2px solid #b79a6b;border-radius:10px;overflow:hidden;background:#eadfca}
    .sn-news-image-chip img{width:100%;height:100%;object-fit:cover}
    .sn-news-image-chip button{position:absolute;right:4px;top:4px;width:30px;height:30px;border:0;border-radius:50%;background:#7d3029;color:#fff;font-weight:1000}

    @media(max-width:520px){
      .sn-news-overlay{padding:0}
      .sn-news-shell{height:100dvh;max-height:none;width:100%}
      .sn-news-topbar{padding:8px 10px 0;margin-bottom:6px}
      .sn-newspaper{border-radius:0;border-left:0;border-right:0}
      .sn-news-page{padding:14px 14px 80px}
      .sn-news-photos img{height:135px}
      .sn-news-photos.one img{height:min(31vh,250px)}
      .sn-news-page-no{left:14px;right:14px}
    }
    @media(prefers-reduced-motion:reduce){.sn-news-turning.next,.sn-news-turning.prev,.sn-news-launch .arrow{animation:none}}
  `;
  document.head.appendChild(style);
}

function buildHomeButton(){
  const firstCard = document.querySelector('.home-images .home-card');
  if(!firstCard || firstCard.classList.contains('sn-news-launch-card')) return;
  firstCard.classList.add('sn-news-launch-card');
  firstCard.setAttribute('aria-label', 'Open Het Snazzle Nieuws');
  firstCard.insertAdjacentHTML('beforeend', `
    <button class="sn-news-launch" id="snNewsLaunch" type="button">
      <span class="paper-icon">🗞️</span>
      <span><strong>Het Snazzle Nieuws</strong><small>Lees de nieuwste verhalen uit de Snazzle Wereld</small></span>
      <span class="arrow">›</span>
    </button>`);
  $('#snNewsLaunch').addEventListener('click', openNews);
}

function buildReader(){
  if($('#snNewsOverlay')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="sn-news-overlay" id="snNewsOverlay" aria-hidden="true">
      <div class="sn-news-shell" role="dialog" aria-modal="true" aria-label="Het Snazzle Nieuws">
        <div class="sn-news-topbar"><strong>🗞️ Het Snazzle Nieuws</strong><button class="sn-news-close" id="snNewsClose" aria-label="Sluiten">×</button></div>
        <div class="sn-news-stage" id="snNewsStage">
          <article class="sn-newspaper" id="snNewspaper"><div class="sn-news-page" id="snNewsPage"></div></article>
          <div class="sn-news-nav">
            <button id="snNewsPrev" aria-label="Vorige pagina">‹</button>
            <div class="sn-news-counter" id="snNewsCounter">Pagina 1</div>
            <button id="snNewsNext" aria-label="Volgende pagina">›</button>
          </div>
        </div>
      </div>
    </div>`);
  $('#snNewsClose').onclick = closeNews;
  $('#snNewsPrev').onclick = ()=>turnPage(-1);
  $('#snNewsNext').onclick = ()=>turnPage(1);
  $('#snNewsOverlay').addEventListener('click', e=>{ if(e.target === $('#snNewsOverlay')) closeNews(); });
  document.addEventListener('keydown', e=>{
    if(!$('#snNewsOverlay')?.classList.contains('show')) return;
    if(e.key === 'Escape') closeNews();
    if(e.key === 'ArrowRight') turnPage(1);
    if(e.key === 'ArrowLeft') turnPage(-1);
  });
  let startX = null;
  $('#snNewsStage').addEventListener('pointerdown', e=>{ startX = e.clientX; }, {passive:true});
  $('#snNewsStage').addEventListener('pointerup', e=>{
    if(startX === null) return;
    const delta = e.clientX - startX;
    startX = null;
    if(Math.abs(delta) < 55) return;
    turnPage(delta < 0 ? 1 : -1);
  }, {passive:true});
}

function openNews(){
  buildReader();
  currentPage = Math.min(currentPage, Math.max(0, pages.length - 1));
  renderPage();
  $('#snNewsOverlay').classList.add('show');
  $('#snNewsOverlay').setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}

function closeNews(){
  const overlay = $('#snNewsOverlay');
  if(!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

function newspaperDate(){
  return new Intl.DateTimeFormat('nl-NL', {weekday:'long', day:'numeric', month:'long', year:'numeric'}).format(new Date());
}

function pageHtml(page, index){
  const total = pages.length;
  if(!page){
    return `<div class="sn-news-masthead"><h1>Het Snazzle Nieuws</h1><div class="strap"><span>De krant van de Snazzle Wereld</span><span>${esc(newspaperDate())}</span></div></div><div class="sn-news-empty"><div><b>De eerste editie wordt voorbereid</b><span>Binnenkort verschijnt hier het laatste Snazzle nieuws.</span></div></div><div class="sn-news-page-no"><span>Snazzle Creations</span><span>Pagina 1</span></div>`;
  }
  const images = Array.isArray(page.images) ? page.images.filter(Boolean).slice(0, MAX_IMAGES) : [];
  const imageBlock = images.length ? `<div class="sn-news-photos ${images.length===1?'one':''}">${images.map(src=>`<img src="${src}" alt="Nieuwsafbeelding">`).join('')}</div>` : '';
  const caption = page.caption ? `<div class="sn-news-caption">${esc(page.caption)}</div>` : '';
  const kicker = page.kicker ? `<span class="sn-news-kicker">${esc(page.kicker)}</span>` : '';
  const deck = page.deck ? `<div class="sn-news-deck">${esc(page.deck)}</div>` : '';
  return `
    <div class="sn-news-masthead"><h1>Het Snazzle Nieuws</h1><div class="strap"><span>De krant van de Snazzle Wereld</span><span>${esc(newspaperDate())}</span></div></div>
    ${kicker}
    <h2 class="sn-news-headline">${esc(page.title || 'Snazzle Nieuws')}</h2>
    ${deck}
    ${imageBlock}${caption}
    <div class="sn-news-body">${esc(page.body || '')}</div>
    <div class="sn-news-page-no"><span>Snazzle Creations</span><span>Pagina ${index+1} van ${total}</span></div>`;
}

function renderPage(){
  buildReader();
  const page = pages[currentPage] || null;
  $('#snNewsPage').innerHTML = pageHtml(page, currentPage);
  const total = Math.max(1, pages.length);
  $('#snNewsCounter').textContent = `Pagina ${Math.min(currentPage+1,total)} van ${total}`;
  $('#snNewsPrev').disabled = currentPage <= 0 || pages.length <= 1;
  $('#snNewsNext').disabled = currentPage >= pages.length - 1 || pages.length <= 1;
}

function turnPage(direction){
  if(flipBusy || pages.length <= 1) return;
  const nextIndex = currentPage + direction;
  if(nextIndex < 0 || nextIndex >= pages.length) return;
  const paper = $('#snNewspaper');
  const current = $('#snNewsPage');
  if(!paper || !current) return;
  flipBusy = true;
  const turning = document.createElement('div');
  turning.className = `sn-news-turning ${direction>0?'next':'prev'}`;
  turning.innerHTML = `<div class="sn-news-page">${current.innerHTML}</div>`;
  paper.appendChild(turning);
  currentPage = nextIndex;
  setTimeout(renderPage, 160);
  setTimeout(()=>{ turning.remove(); flipBusy = false; }, 520);
}

async function compressImage(file){
  if(!file || !file.type.startsWith('image/')) throw new Error('Kies een geldige foto.');
  const dataUrl = await new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>resolve(reader.result);
    reader.onerror = ()=>reject(new Error('Foto kon niet worden gelezen.'));
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve,reject)=>{
    const img = new Image();
    img.onload = ()=>resolve(img);
    img.onerror = ()=>reject(new Error('Foto kon niet worden geopend.'));
    img.src = dataUrl;
  });
  let max = 820;
  let quality = .58;
  for(let attempt=0; attempt<5; attempt++){
    const scale = Math.min(1, max / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    const out = canvas.toDataURL('image/jpeg', quality);
    if(out.length < 245000) return out;
    max = Math.round(max * .82);
    quality = Math.max(.42, quality - .05);
  }
  throw new Error('Deze foto blijft te groot. Kies een andere foto.');
}

function buildAdminUI(){
  const tabs = $('#adminSheet .super-only .tabs');
  const superOnly = $('#adminSheet .super-only');
  if(!tabs || !superOnly || $('#newsAdmin')) return;

  const tab = document.createElement('button');
  tab.type = 'button';
  tab.dataset.newsTab = 'newsAdmin';
  tab.textContent = 'Nieuws';
  tabs.appendChild(tab);

  const section = document.createElement('section');
  section.className = 'admin-section';
  section.id = 'newsAdmin';
  section.innerHTML = `
    <h3>Het Snazzle Nieuws 🗞️</h3>
    <div class="sn-news-admin-note">Maak hier de krant. Je kunt pagina's toevoegen, verwijderen en in een andere volgorde zetten. Per pagina kun je tekst en maximaal ${MAX_IMAGES} foto's plaatsen.</div>
    <button class="save" id="snNewsNewPage">+ Nieuwe krantenpagina</button>
    <div class="sn-news-admin-list" id="snNewsAdminList"></div>
    <div class="sn-news-editor" id="snNewsEditor" style="display:none">
      <h3 id="snNewsEditorTitle">Pagina bewerken</h3>
      <div class="field"><label>Rubriek / klein kopje</label><input id="snNewsKicker" maxlength="40" placeholder="Bijv. SNAZZLE HUNT"></div>
      <div class="field"><label>Grote krantenkop</label><input id="snNewsTitle" maxlength="110" placeholder="Bijv. Nieuwe Snazzle Hunt trekt eropuit!"></div>
      <div class="field"><label>Korte inleiding onder de kop</label><textarea id="snNewsDeck" maxlength="240"></textarea></div>
      <div class="field"><label>Artikeltekst</label><textarea id="snNewsBody" style="min-height:180px" maxlength="7000"></textarea></div>
      <div class="field"><label>Foto's (maximaal ${MAX_IMAGES})</label><input id="snNewsImages" type="file" accept="image/*" multiple></div>
      <div class="sn-news-image-grid" id="snNewsImagePreview"></div>
      <div class="field"><label>Bijschrift bij foto('s)</label><input id="snNewsCaption" maxlength="180"></div>
      <button class="save" id="snNewsSavePage">Pagina opslaan</button>
      <button class="secondary" id="snNewsCancelEdit">Annuleren</button>
    </div>`;
  // De nieuwssectie hoort binnen het hoofdbeheerblok zelf.
  superOnly.appendChild(section);

  tab.addEventListener('click', ()=>{
    $$('#adminSheet [data-tab]').forEach(b=>b.classList.remove('on'));
    $$('#adminSheet [data-news-tab]').forEach(b=>b.classList.remove('on'));
    $$('#adminSheet .admin-section').forEach(s=>s.classList.remove('on'));
    tab.classList.add('on');
    section.classList.add('on');
    renderAdminList();
  });
  $('#snNewsNewPage').onclick = ()=>openEditor(null);
  $('#snNewsCancelEdit').onclick = closeEditor;
  $('#snNewsSavePage').onclick = saveEditor;
  $('#snNewsImages').onchange = handleImages;
  renderAdminList();
}

function renderAdminList(){
  const list = $('#snNewsAdminList');
  if(!list) return;
  list.innerHTML = '';
  if(!pages.length){
    list.innerHTML = '<div class="sn-news-admin-note">Nog geen pagina’s. Tik op <b>Nieuwe krantenpagina</b> om te beginnen.</div>';
    return;
  }
  pages.forEach((page,index)=>{
    const row = document.createElement('div');
    row.className = 'sn-news-admin-row';
    row.innerHTML = `<strong>Pagina ${index+1}: ${esc(page.title || 'Zonder kop')}</strong><small>${esc(page.kicker || 'Snazzle Nieuws')} · ${(page.images?.length || 0)} foto('s)</small><div class="sn-news-admin-actions"><button data-edit="${page.id}">Bewerken</button><button data-up="${page.id}" aria-label="Omhoog">↑</button><button data-down="${page.id}" aria-label="Omlaag">↓</button><button class="danger" data-delete="${page.id}" aria-label="Verwijderen">🗑</button></div>`;
    list.appendChild(row);
  });
  list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEditor(b.dataset.edit));
  list.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>movePage(b.dataset.up,-1));
  list.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>movePage(b.dataset.down,1));
  list.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removePage(b.dataset.delete));
}

function openEditor(id){
  if(adminRole !== 'superadmin') return toast('Alleen de hoofdbeheerder kan het nieuws aanpassen.');
  editingId = id;
  const page = pages.find(p=>p.id===id) || null;
  editorImages = page?.images ? [...page.images] : [];
  $('#snNewsEditor').style.display = 'block';
  $('#snNewsEditorTitle').textContent = page ? `Pagina ${pages.indexOf(page)+1} bewerken` : 'Nieuwe krantenpagina';
  $('#snNewsKicker').value = page?.kicker || '';
  $('#snNewsTitle').value = page?.title || '';
  $('#snNewsDeck').value = page?.deck || '';
  $('#snNewsBody').value = page?.body || '';
  $('#snNewsCaption').value = page?.caption || '';
  $('#snNewsImages').value = '';
  renderEditorImages();
  $('#snNewsEditor').scrollIntoView({behavior:'smooth',block:'start'});
}

function closeEditor(){
  editingId = null;
  editorImages = [];
  const editor = $('#snNewsEditor');
  if(editor) editor.style.display = 'none';
}

function renderEditorImages(){
  const box = $('#snNewsImagePreview');
  if(!box) return;
  box.innerHTML = '';
  editorImages.forEach((src,index)=>{
    const chip = document.createElement('div');
    chip.className = 'sn-news-image-chip';
    chip.innerHTML = `<img src="${src}" alt="Foto ${index+1}"><button type="button" aria-label="Foto verwijderen">×</button>`;
    chip.querySelector('button').onclick = ()=>{ editorImages.splice(index,1); renderEditorImages(); };
    box.appendChild(chip);
  });
}

async function handleImages(event){
  try{
    const files = [...(event.target.files || [])];
    if(!files.length) return;
    const room = MAX_IMAGES - editorImages.length;
    if(room <= 0) return toast(`Maximaal ${MAX_IMAGES} foto's per pagina.`);
    for(const file of files.slice(0,room)){
      toast('Foto verwerken…');
      editorImages.push(await compressImage(file));
      renderEditorImages();
    }
    if(files.length > room) toast(`Maximaal ${MAX_IMAGES} foto's per pagina.`);
  }catch(err){ toast(err.message || 'Foto kon niet worden toegevoegd.'); }
  finally{ event.target.value = ''; }
}

async function saveEditor(){
  if(adminRole !== 'superadmin') return toast('Alleen de hoofdbeheerder kan het nieuws aanpassen.');
  const title = $('#snNewsTitle').value.trim();
  if(title.length < 2) return toast('Vul een krantenkop in.');
  const existing = pages.find(p=>p.id===editingId);
  const payload = {
    active: false,
    contentType: NEWS_KIND,
    name: 'Snazzle Nieuws systeempagina',
    kicker: $('#snNewsKicker').value.trim(),
    title,
    deck: $('#snNewsDeck').value.trim(),
    body: $('#snNewsBody').value.trim(),
    caption: $('#snNewsCaption').value.trim(),
    images: editorImages.slice(0,MAX_IMAGES),
    order: existing ? Number(existing.order ?? pages.indexOf(existing)) : pages.length,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  try{
    $('#snNewsSavePage').disabled = true;
    if(editingId) await updateDoc(doc(db,NEWS_COLLECTION,editingId), payload);
    else await addDoc(collection(db,NEWS_COLLECTION), payload);
    toast('Krantenpagina opgeslagen ✅');
    closeEditor();
  }catch(err){
    console.error(err);
    toast('Opslaan lukte niet. Controleer de beheerrechten.');
  }finally{
    if($('#snNewsSavePage')) $('#snNewsSavePage').disabled = false;
  }
}

async function removePage(id){
  if(adminRole !== 'superadmin') return;
  const page = pages.find(p=>p.id===id);
  if(!page || !confirm(`Pagina “${page.title || 'Zonder kop'}” verwijderen?`)) return;
  try{
    await deleteDoc(doc(db,NEWS_COLLECTION,id));
    toast('Pagina verwijderd.');
  }catch(err){ console.error(err); toast('Verwijderen lukte niet.'); }
}

async function movePage(id,delta){
  if(adminRole !== 'superadmin') return;
  const index = pages.findIndex(p=>p.id===id);
  const target = index + delta;
  if(index < 0 || target < 0 || target >= pages.length) return;
  try{
    const batch = writeBatch(db);
    batch.update(doc(db,NEWS_COLLECTION,pages[index].id), {order:target,updatedAt:new Date().toISOString()});
    batch.update(doc(db,NEWS_COLLECTION,pages[target].id), {order:index,updatedAt:new Date().toISOString()});
    await batch.commit();
  }catch(err){ console.error(err); toast('Volgorde wijzigen lukte niet.'); }
}

function startNewsListener(){
  if(unsubscribeNews) return;
  unsubscribeNews = onSnapshot(collection(db,NEWS_COLLECTION), snap=>{
    pages = snap.docs
      .map(d=>({id:d.id,...d.data()}))
      .filter(page=>page.contentType===NEWS_KIND)
      .sort((a,b)=>(a.order??0)-(b.order??0));
    if(currentPage > pages.length-1) currentPage = Math.max(0,pages.length-1);
    if($('#snNewsOverlay')?.classList.contains('show')) renderPage();
    renderAdminList();
  }, err=>{
    console.error('Snazzle Nieuws kon niet laden', err);
  });
}

onAuthStateChanged(auth, async user=>{
  if(!user){ adminRole = null; return; }
  startNewsListener();
  try{
    const snap = await getDoc(doc(db,'adminUsers',user.uid));
    adminRole = snap.exists() && snap.data()?.active !== false ? snap.data()?.role || null : null;
  }catch{ adminRole = null; }
});

injectStyles();
buildHomeButton();
buildReader();
buildAdminUI();
