import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword,
  signOut, createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, serverTimestamp, writeBatch
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyB4iVfasVJgRMJ5GcdkG3ZU136H9FdmAy4',
  authDomain: 'snazzle-hunt.firebaseapp.com',
  projectId: 'snazzle-hunt',
  storageBucket: 'snazzle-hunt.firebasestorage.app',
  messagingSenderId: '647665502495',
  appId: '1:647665502495:web:686488b53db468e887482a',
  measurementId: 'G-55G5DE19DL'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// Hide empty hunt metadata pills completely (prevents an empty yellow bubble).
if (!document.getElementById('emptyPillFix')) {
  const style = document.createElement('style');
  style.id = 'emptyPillFix';
  style.textContent = '.meta .pill:empty{display:none!important}';
  document.head.appendChild(style);
}

const fallbackVillages = ['Montfort', 'Posterholt', 'Sint Odiliënberg'];
const localDefaults = { profileImage:'', heroImage:'', homeImage1:'', homeImage2:'' };
let localSettings = loadLocalSettings();
let villages = [...fallbackVillages];
let hunts = [];
let findings = [];
let publicProfiles = [];
let selectedVillage = localStorage.getItem('snazzleVillage') || 'Montfort';
let proofPhoto = '';
let currentUser = null;
let adminProfile = null;
let listenersStarted = false;
let editingHuntId = null;
let editingHuntImage = '';
let centralReady = false;
let joinedHunts = [];
let seenFoundHunts = [];

function loadLocalSettings(){
  try { return {...localDefaults, ...JSON.parse(localStorage.getItem('snazzleSettings') || '{}')}; }
  catch { return {...localDefaults}; }
}
function loadLegacyHunts(){
  try { return JSON.parse(localStorage.getItem('snazzleHunts') || '[]'); }
  catch { return []; }
}
function userName(){ return (localStorage.getItem('snazzleName') || '').trim(); }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c])); }
function slug(s){ return String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.remove('show'),2600); }
function openSheet(id){ $('#'+id)?.classList.add('show'); }
function closeSheet(id){ $('#'+id)?.classList.remove('show'); }
function setImg(img, fallback, src){
  if(!img) return;
  if(src){ img.src=src; img.style.display='block'; if(fallback) fallback.style.display='none'; }
  else { img.removeAttribute('src'); img.style.display='none'; if(fallback) fallback.style.display='grid'; }
}
function renderDuckLogoFallback(){
  const fallback=$('#logoFallback');
  if(!fallback) return;
  if(localSettings.profileImage){
    fallback.innerHTML='';
    fallback.removeAttribute('aria-label');
    return;
  }
  fallback.setAttribute('aria-label','Blauw Snazzle badeendje');
  fallback.innerHTML=`<svg class="snazzle-duck-logo" viewBox="0 0 100 100" role="img" aria-hidden="true">
    <g class="duck-shape">
      <ellipse cx="45" cy="62" rx="30" ry="21"></ellipse>
      <circle cx="67" cy="39" r="15"></circle>
      <path d="M80 35 L96 42 L80 49 Z"></path>
      <path d="M20 55 L7 44 L12 64 Z"></path>
    </g>
  </svg>`;
  if(!$('#duckLogoStyles')){
    const style=document.createElement('style');
    style.id='duckLogoStyles';
    style.textContent=`
      #logoFallback{width:100%;height:100%;display:grid;place-items:center}
      .snazzle-duck-logo{width:52px;height:52px;overflow:visible;transform-origin:50% 70%;filter:drop-shadow(0 3px 2px rgba(0,0,0,.22));animation:duckLogoBob 3.2s ease-in-out infinite}
      .snazzle-duck-logo .duck-shape{fill:#2fa9e8}
      @keyframes duckLogoBob{0%,100%{transform:translateY(1px) rotate(-2deg)}50%{transform:translateY(-3px) rotate(2deg)}}
      @media(prefers-reduced-motion:reduce){.snazzle-duck-logo{animation:none}}
    `;
    document.head.appendChild(style);
  }
}
function compressFile(file, max=720, quality=.68){
  return new Promise((resolve,reject)=>{
    if(!file || !file.type.startsWith('image/')) return reject(new Error('Kies een afbeelding'));
    const r=new FileReader();
    r.onload=()=>{ const im=new Image(); im.onload=()=>{
      const scale=Math.min(1,max/Math.max(im.width,im.height));
      const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(im.width*scale)); c.height=Math.max(1,Math.round(im.height*scale));
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      const out=c.toDataURL('image/jpeg',quality);
      if(out.length>850000) reject(new Error('Afbeelding is te groot')); else resolve(out);
    }; im.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen')); im.src=r.result; };
    r.onerror=()=>reject(new Error('Bestand kon niet worden gelezen')); r.readAsDataURL(file);
  });
}
function statusOf(h){
  if(h.found===true) return 'ended';
  if(h.mode==='draft') return 'draft';
  const now=Date.now(), start=h.start ? new Date(h.start).getTime() : 0, end=h.end ? new Date(h.end).getTime() : Infinity;
  if(h.mode==='live' && !h.start) return now>end ? 'ended' : 'live';
  if(now<start) return 'planned';
  if(now>=start && now<=end) return 'live';
  return 'ended';
}
function liveForVillage(v){ return hunts.filter(h=>h.village===v && statusOf(h)==='live').sort((a,b)=>new Date(b.start||0)-new Date(a.start||0)); }
function activeHunt(){ return liveForVillage(selectedVillage)[0] || null; }

function applyName(){
  const n=userName();
  $('#welcomeText').textContent=n ? `Welkom, ${n}!` : 'Welkom!';
  $('#nameInput').value=n;
}
function renderLocalImages(){
  setImg($('#profileLogo'), $('#logoFallback'), localSettings.profileImage);
  renderDuckLogoFallback();
  setImg($('#profilePreview'), $('#profilePreviewFallback'), localSettings.profileImage);
  if(localSettings.heroImage){
    $('#hero').style.backgroundImage=`linear-gradient(rgba(15,55,28,.38),rgba(10,40,20,.67)),url(${localSettings.heroImage})`;
    setImg($('#heroPreview'), $('#heroPreviewFallback'), localSettings.heroImage);
  } else {
    $('#hero').style.backgroundImage='linear-gradient(rgba(15,55,28,.48),rgba(10,40,20,.72)),linear-gradient(135deg,#2d6a35,#173e23)';
    setImg($('#heroPreview'), $('#heroPreviewFallback'), '');
  }
  setImg($('#homeImg1'), $('#homeEmpty1'), localSettings.homeImage1);
  setImg($('#home1Preview'), $('#home1PreviewFallback'), localSettings.homeImage1);
  setImg($('#homeImg2'), $('#homeEmpty2'), localSettings.homeImage2);
  setImg($('#home2Preview'), $('#home2PreviewFallback'), localSettings.homeImage2);
}
function renderVillages(){
  if(!villages.length) villages=[...fallbackVillages];
  if(!villages.includes(selectedVillage)) selectedVillage=villages[0];
  localStorage.setItem('snazzleVillage',selectedVillage);
  const box=$('#villages'); box.innerHTML='';
  villages.forEach(v=>{
    const b=document.createElement('button'); b.className='village'+(v===selectedVillage?' active':''); b.textContent='📍 '+v;
    b.onclick=()=>{ selectedVillage=v; localStorage.setItem('snazzleVillage',v); renderAll(); renderVillagePage(v); openSheet('villageSheet'); };
    box.appendChild(b);
  });
  $('#chosenVillageLabel').textContent='📍 '+selectedVillage;
}
function renderVillagePage(v){
  const live=liveForVillage(v), planned=hunts.filter(h=>h.village===v && statusOf(h)==='planned');
  $('#villageSheetTitle').textContent='📍 '+v;
  $('#villageSheetText').textContent=live.length ? `${live.length===1?'Er is':'Er zijn'} nu ${live.length} actieve hunt${live.length===1?'':'s'} in ${v}.` : planned.length ? `Er is nu geen live hunt in ${v}, maar er staat wel een hunt ingepland.` : `Er is op dit moment geen actieve hunt in ${v}.`;
  const list=$('#villageHunts'); list.innerHTML='';
  if(!live.length) list.innerHTML='<div class="listitem"><strong>Binnenkort meer avontuur 🌿</strong><span>Kom later nog eens kijken.</span></div>';
  live.forEach(h=>{ const d=document.createElement('div'); d.className='listitem'; d.innerHTML=`<strong>🔎 ${esc(h.title)}</strong><span>${esc(h.description||'')}</span>`; list.appendChild(d); });
  $('#useVillageBtn').onclick=()=>{ selectedVillage=v; localStorage.setItem('snazzleVillage',v); closeSheet('villageSheet'); renderAll(); document.querySelector('.hunt').scrollIntoView({behavior:'smooth',block:'start'}); };
}
function renderActive(){
  const h=activeHunt();
  $('#startSubtitle').textContent='Bekijk de hunt in '+selectedVillage;
  if(!h){
    $('#activeStatus').textContent='Geen hunt in '+selectedVillage;
    $('#huntTitle').textContent='Binnenkort in '+selectedVillage;
    $('#huntVillage').textContent='📍 '+selectedVillage;
    $('#huntRule').textContent=''; $('#huntRule').style.display='none';
    $('#huntDescription').textContent='Op dit moment is hier geen actieve Snazzle Hunt.';
    $('#hintBox').classList.remove('show');
    $('#proofBox').style.display='none';
    setImg($('#huntImg'),$('#huntPlaceholder'),''); $('#huntPlaceholder').textContent='Geen actieve hunt in '+selectedVillage;
    $('#startBtn').disabled=true; $('#startBtn').textContent='Geen hunt';
    $('#foundBtn').disabled=true; $('#foundBtn').textContent='Geen hunt'; return;
  }
  $('#proofBox').style.display='block';
  $('#activeStatus').textContent='Actief in '+selectedVillage;
  $('#huntTitle').textContent=h.title;
  $('#huntVillage').textContent='📍 '+h.village;
  $('#huntRule').textContent=h.rule ? '👨‍👩‍👧 '+h.rule : ''; $('#huntRule').style.display=h.rule ? '' : 'none'; $('#huntRule').style.display=h.rule ? '' : 'none';
  $('#huntDescription').textContent=h.description||'';
  $('#hintBox').textContent=h.hint ? '💡 Hint: '+h.hint : '';
  $('#hintBox').classList.toggle('show',!!h.hint);
  setImg($('#huntImg'),$('#huntPlaceholder'),h.imageUrl||'');
  $('#sheetTitle').textContent=h.title;
  $('#sheetDescription').textContent=(h.description||'')+(h.rule?' Regel: '+h.rule+'.':'');
  $('#sheetHint').textContent=h.hint ? '💡 Hint: '+h.hint : 'De hint verschijnt zodra de beheerder hem vrijgeeft.';
  setImg($('#sheetImg'),$('#sheetPlaceholder'),h.imageUrl||'');
  $('#startBtn').disabled=false;
  $('#startBtn').textContent=joinedHunts.includes(h.id) ? 'Ik zoek mee ✅' : 'Ik ga zoeken! 🔎';
  updateFoundButton();
}
function resetProof(){ proofPhoto=''; $('#proofPreview').style.display='none'; $('#proofImg').removeAttribute('src'); updateFoundButton(); }
function updateFoundButton(){
  const h=activeHunt(), b=$('#foundBtn'); if(!h) return;
  const already=findings.some(f=>f.huntId===h.id);
  if(already){ b.disabled=false; b.className='found done'; b.textContent='Gevonden ✅'; }
  else if(proofPhoto){ b.disabled=false; b.className='found ready'; b.textContent='Bevestig gevonden 🏆'; }
  else { b.disabled=true; b.className='found'; b.textContent='Foto nodig 📸'; }
}
function renderFindings(){
  const list=$('#findsList'); list.innerHTML='';
  if(!findings.length){ list.innerHTML='<div class="listitem"><strong>Nog niets gevonden</strong></div>'; return; }
  findings.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).forEach(f=>{
    const d=document.createElement('div'); d.className='listitem';
    d.innerHTML=`<strong>🏆 ${esc(f.title)}</strong><span>📍 ${esc(f.village)} · ${esc(f.dateLabel||'')}</span>${f.photoData?`<img src="${f.photoData}" alt="Vondstfoto">`:''}`;
    list.appendChild(d);
  });
}
function ensureFriendsUI(){
  const panel=$('#friendsSheet .panel');
  if(!panel || $('#friendsList')) return;
  const intro=panel.querySelector('p');
  if(intro) intro.textContent='Hier zie je alleen Snazzlers die kort geleden actief waren. We tonen uitsluitend hun voornaam of nickname — nooit adres of exacte locatie.';
  const summary=document.createElement('div'); summary.id='friendsSummary'; summary.className='friends-summary';
  const list=document.createElement('div'); list.id='friendsList'; list.className='friends-list';
  panel.append(summary,list);
  if(!$('#friendsStyles')){
    const style=document.createElement('style'); style.id='friendsStyles'; style.textContent=`
      .friends-summary{margin:14px 0;padding:12px 14px;border-radius:16px;background:linear-gradient(135deg,#dff59c,#bfe56d);border:2px solid #8fbd42;color:#27421d;font-weight:950;display:flex;align-items:center;gap:9px}
      .friends-summary .dot{width:11px;height:11px;border-radius:50%;background:#42a62d;box-shadow:0 0 0 5px rgba(66,166,45,.16);animation:friendPulse 1.8s ease-in-out infinite}
      .friends-list{display:grid;gap:10px;margin-top:10px}
      .friend-card{display:flex;align-items:center;gap:12px;padding:12px;border-radius:17px;background:#fff8e3;border:2px solid #c4a66f;box-shadow:0 4px 0 #aa8550;color:#322318}
      .friend-avatar{width:48px;height:48px;flex:0 0 48px;border-radius:50%;display:grid;place-items:center;font-size:25px;background:linear-gradient(145deg,#70d7ef,#8e6de4);border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.18)}
      .friend-name{font-weight:1000;font-size:17px;line-height:1.15}.friend-me{font-size:11px;font-weight:950;color:#7651ad;margin-left:6px}
      .friend-status{display:flex;align-items:center;gap:6px;margin-top:5px;font-size:12px;font-weight:850;color:#4b6e37}.friend-status i{display:block;width:9px;height:9px;border-radius:50%;background:#4eb632}
      .friend-empty{padding:20px 14px;border-radius:17px;background:#fff8e3;border:2px dashed #c4a66f;text-align:center;font-weight:850;color:#604828;line-height:1.5}
      @keyframes friendPulse{50%{transform:scale(1.25);opacity:.72}}
      @media(prefers-reduced-motion:reduce){.friends-summary .dot{animation:none}}
    `; document.head.appendChild(style);
  }
}
function avatarFor(name){
  const icons=['🦆','🧭','🌿','⭐','🦋','🐸','🌈','🏆'];
  let n=0; for(const ch of String(name||'')) n=(n+ch.codePointAt(0))%icons.length;
  return icons[n];
}
function isRecentlyActive(p){
  const t=Date.parse(p.lastSeen||'');
  return Number.isFinite(t) && Date.now()-t < 10*60*1000;
}
function renderFriends(){
  ensureFriendsUI();
  const list=$('#friendsList'), summary=$('#friendsSummary');
  if(!list || !summary) return;
  const active=publicProfiles.filter(p=>p.nickname && isRecentlyActive(p)).sort((a,b)=>String(a.nickname).localeCompare(String(b.nickname),'nl'));
  summary.innerHTML=`<span class="dot"></span><span>${active.length} Snazzler${active.length===1?'':'s'} nu actief</span>`;
  list.innerHTML='';
  if(!active.length){
    list.innerHTML='<div class="friend-empty">🌿 Er is op dit moment nog niemand zichtbaar als actief.<br>Kom straks nog eens kijken!</div>';
    return;
  }
  active.forEach(p=>{
    const card=document.createElement('div'); card.className='friend-card';
    const isMe=currentUser && p.id===currentUser.uid;
    card.innerHTML=`<div class="friend-avatar" aria-hidden="true">${avatarFor(p.nickname)}</div><div><div class="friend-name">${esc(p.nickname)}${isMe?'<span class="friend-me">JIJ</span>':''}</div><div class="friend-status"><i></i> Nu actief</div></div>`;
    list.appendChild(card);
  });
}

function ensureEventPosterViewer(){
  if($('#eventPosterOverlay')) return;

  const overlay=document.createElement('div');
  overlay.id='eventPosterOverlay';
  overlay.className='event-poster-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`
    <div class="event-poster-frame" role="dialog" aria-modal="true" aria-label="Actie of evenement poster">
      <button class="event-poster-close" id="eventPosterClose" aria-label="Poster sluiten">×</button>
      <img id="eventPosterImage" alt="Actie of evenement poster">
    </div>`;
  document.body.appendChild(overlay);

  const style=document.createElement('style');
  style.id='eventPosterStyles';
  style.textContent=`
    .event-poster-overlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:8px;background:rgba(3,12,8,.94);backdrop-filter:blur(6px);touch-action:manipulation}
    .event-poster-overlay.show{display:flex;animation:eventPosterFade .2s ease-out}
    .event-poster-frame{position:relative;width:min(96vw,760px);height:min(94dvh,1000px);display:flex;align-items:center;justify-content:center;padding:8px;border-radius:20px;background:#15110e;border:3px solid #9b6936;box-shadow:0 18px 50px rgba(0,0,0,.65)}
    .event-poster-frame img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;border-radius:12px;background:#111}
    .event-poster-close{position:absolute;right:10px;top:10px;z-index:5;width:54px;height:54px;border:3px solid rgba(255,255,255,.7);border-radius:17px;background:#70472b;color:white;font-size:34px;font-weight:900;line-height:1;box-shadow:0 5px 14px rgba(0,0,0,.38);touch-action:manipulation}
    .event-poster-close:active{transform:scale(.94)}
    #homeImg2{cursor:zoom-in}
    #homeImg2+.empty,.home-card:has(#homeImg2){cursor:pointer}
    @keyframes eventPosterFade{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:scale(1)}}
  `;
  document.head.appendChild(style);

  const close=()=>{
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
    $('#eventPosterImage').removeAttribute('src');
  };
  $('#eventPosterClose').onclick=close;
  overlay.addEventListener('click',e=>{ if(e.target===overlay) close(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && overlay.classList.contains('show')) close(); });

  const card=$('#homeImg2')?.closest('.home-card');
  if(card){
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label','Actie of evenement poster openen');
    const openPoster=()=>{
      const src=localSettings.homeImage2 || $('#homeImg2')?.getAttribute('src') || '';
      if(!src) return toast('Er is nog geen actie- of evenementposter geplaatst');
      $('#eventPosterImage').src=src;
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden','false');
    };
    card.onclick=openPoster;
    card.onkeydown=e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openPoster(); } };
  }
}


function openEventPoster(){
  ensureEventPosterViewer();
  const image=$('#homeImg2');
  const src=(image && (image.currentSrc || image.getAttribute('src'))) || localSettings.homeImage2 || '';
  if(!src) return toast('Er is nog geen actie- of evenementposter geplaatst');
  const poster=$('#eventPosterImage');
  const overlay=$('#eventPosterOverlay');
  if(!poster || !overlay) return;
  poster.src=src;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow='hidden';
  document.body.style.overflow='hidden';
}

function closeEventPoster(){
  const overlay=$('#eventPosterOverlay');
  if(!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  $('#eventPosterImage')?.removeAttribute('src');
  document.documentElement.style.overflow='';
  document.body.style.overflow='';
}

function bindEventPosterClicks(){
  if(document.documentElement.dataset.eventPosterBound==='1') return;
  document.documentElement.dataset.eventPosterBound='1';

  document.addEventListener('click',e=>{
    const close=e.target.closest?.('#eventPosterClose');
    if(close){ e.preventDefault(); e.stopPropagation(); closeEventPoster(); return; }

    const overlay=e.target.closest?.('#eventPosterOverlay');
    if(overlay && e.target===overlay){ closeEventPoster(); return; }

    const card=e.target.closest?.('.home-card');
    if(card && card.querySelector('#homeImg2')){
      e.preventDefault();
      openEventPoster();
    }
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && $('#eventPosterOverlay')?.classList.contains('show')) closeEventPoster();
  });
}


function ensureQuickMenu(){
  const existing=$('#quickMenuPanel');
  if(existing){
    const village=$('#quickMenuVillage');
    if(village) village.textContent='📍 '+selectedVillage;
    return;
  }

  // Replace the separate admin lock in the header with one clear menu button.
  const oldAdmin=$('#adminBtn');
  if(oldAdmin) oldAdmin.style.display='none';

  const top=document.querySelector('.top');
  if(!top) return;

  const menuBtn=document.createElement('button');
  menuBtn.id='quickMenuBtn';
  menuBtn.className='quick-menu-btn';
  menuBtn.type='button';
  menuBtn.setAttribute('aria-label','Snelmenu openen');
  menuBtn.setAttribute('aria-expanded','false');
  menuBtn.innerHTML='<span aria-hidden="true">☰</span>';
  top.appendChild(menuBtn);

  const overlay=document.createElement('div');
  overlay.id='quickMenuOverlay';
  overlay.className='quick-menu-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`
    <aside id="quickMenuPanel" class="quick-menu-panel" role="dialog" aria-modal="true" aria-label="Snazzle snelmenu">
      <div class="quick-menu-head">
        <div class="quick-menu-brand"><span class="quick-menu-duck">🦆</span><div><strong>Snazzle Menu</strong><small id="quickMenuVillage">📍 ${esc(selectedVillage)}</small></div></div>
        <button id="quickMenuClose" class="quick-menu-close" type="button" aria-label="Menu sluiten">×</button>
      </div>
      <div class="quick-menu-note">Waar wil je naartoe?</div>
      <nav class="quick-menu-list" aria-label="Snelmenu">
        <button type="button" data-quick-action="home"><b>🏠</b><span><strong>Home</strong><small>Terug naar het begin</small></span><i>›</i></button>
        <button type="button" data-quick-action="hunt"><b>🔎</b><span><strong>Hunt zoeken</strong><small>Bekijk de actieve Snazzle Hunt</small></span><i>›</i></button>
        <button type="button" data-quick-action="village"><b>📍</b><span><strong>Kies je dorp</strong><small>Ga snel naar de dorpskeuze</small></span><i>›</i></button>
        <button type="button" data-quick-action="friends"><b>👥</b><span><strong>Vrienden</strong><small>Bekijk actieve Snazzlers</small></span><i>›</i></button>
        <button type="button" data-quick-action="findings"><b>🏆</b><span><strong>Mijn vondsten</strong><small>Jouw gevonden hunts</small></span><i>›</i></button>
        <button type="button" data-quick-action="event"><b>🎉</b><span><strong>Actie & evenement</strong><small>Open de actuele poster</small></span><i>›</i></button>
        <button type="button" data-quick-action="shop"><b>🛍️</b><span><strong>Shop</strong><small>Bekijk Snazzle items</small></span><i>›</i></button>
        <button type="button" data-quick-action="profile"><b>👤</b><span><strong>Mijn profiel</strong><small>Naam of nickname aanpassen</small></span><i>›</i></button>
      </nav>
      <button type="button" class="quick-menu-admin" data-quick-action="admin"><span>🔒</span><strong>Beheer</strong><small>Voor Snazzle beheerders</small></button>
      <div class="quick-menu-footer">Samen naar buiten 🌿</div>
    </aside>`;
  document.body.appendChild(overlay);

  const style=document.createElement('style');
  style.id='quickMenuStyles';
  style.textContent=`
    .quick-menu-btn{width:54px;height:54px;flex:0 0 54px;border-radius:18px;border:3px solid #8a6539;background:linear-gradient(145deg,#4f8f3f,#285e35);color:#fff7df;font-size:29px;font-weight:1000;display:grid;place-items:center;box-shadow:0 5px 0 #4a2e1b,0 8px 18px rgba(0,0,0,.2);position:relative;overflow:hidden}
    .quick-menu-btn:after{content:"";position:absolute;inset:-40%;background:linear-gradient(110deg,transparent 42%,rgba(255,255,255,.25) 50%,transparent 58%);transform:translateX(-70%);animation:quickMenuShine 5s ease-in-out infinite;pointer-events:none}
    .quick-menu-overlay{position:fixed;inset:0;z-index:5000;background:rgba(3,16,8,.68);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .22s ease,visibility .22s ease;display:flex;justify-content:flex-end}
    .quick-menu-overlay.show{opacity:1;visibility:visible}
    .quick-menu-panel{width:min(88vw,390px);height:100%;overflow:auto;padding:calc(18px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));background:linear-gradient(180deg,#175e35 0%,#0b472b 58%,#07351f 100%);border-left:4px solid #8c6236;box-shadow:-14px 0 38px rgba(0,0,0,.38);transform:translateX(105%);transition:transform .26s cubic-bezier(.2,.8,.2,1);color:#fff7df}
    .quick-menu-overlay.show .quick-menu-panel{transform:translateX(0)}
    .quick-menu-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 1px 16px;border-bottom:2px solid rgba(255,218,112,.22)}
    .quick-menu-brand{display:flex;align-items:center;gap:11px;min-width:0}.quick-menu-duck{width:51px;height:51px;flex:0 0 51px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#ffe36a,#ffb82f);border:3px solid #754720;font-size:26px;box-shadow:0 4px 0 #4a2b17}
    .quick-menu-brand strong{display:block;color:#ffd348;font-size:22px;line-height:1.05;text-shadow:0 2px rgba(0,0,0,.25)}.quick-menu-brand small{display:block;margin-top:5px;color:#c9ef8a;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:205px}
    .quick-menu-close{width:45px;height:45px;flex:0 0 45px;border:0;border-radius:14px;background:#744528;color:white;font-size:27px;font-weight:900;box-shadow:0 4px 0 #432618}
    .quick-menu-note{margin:14px 3px 10px;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:1.2px;color:#c9ef8a}
    .quick-menu-list{display:grid;gap:8px}.quick-menu-list button{width:100%;min-height:67px;border:2px solid rgba(255,224,147,.22);border-radius:17px;background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.055));color:#fff7df;padding:9px 11px;display:grid;grid-template-columns:42px 1fr 20px;align-items:center;gap:9px;text-align:left;box-shadow:0 4px 9px rgba(0,0,0,.12)}
    .quick-menu-list button>b{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:rgba(255,223,116,.13);font-size:23px}.quick-menu-list button span{min-width:0}.quick-menu-list button strong{display:block;font-size:16px;line-height:1.12}.quick-menu-list button small{display:block;margin-top:3px;font-size:11px;color:#d6e8bd;font-weight:720;line-height:1.25}.quick-menu-list button>i{font-style:normal;font-size:30px;color:#ffd34b;font-weight:500;text-align:center}
    .quick-menu-list button:active{background:rgba(255,211,75,.18)}
    .quick-menu-admin{width:100%;margin-top:14px;border:2px solid #9b7144;border-radius:17px;background:linear-gradient(135deg,#6b4329,#4b2d1d);color:#fff2d4;padding:12px;display:grid;grid-template-columns:42px 1fr;column-gap:8px;text-align:left;box-shadow:0 4px 0 #352117}.quick-menu-admin>span{grid-row:1/3;font-size:24px;align-self:center}.quick-menu-admin strong{font-size:15px}.quick-menu-admin small{font-size:10px;color:#dfc7a5;font-weight:700}
    .quick-menu-footer{text-align:center;color:#a9dc72;font-size:11px;font-weight:900;margin:18px 0 2px;letter-spacing:.4px}
    @keyframes quickMenuShine{0%,65%,100%{transform:translateX(-75%)}78%{transform:translateX(75%)}}
    @media(prefers-reduced-motion:reduce){.quick-menu-btn:after{animation:none}.quick-menu-panel,.quick-menu-overlay{transition:none}}
  `;
  document.head.appendChild(style);

  const openMenu=()=>{
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    menuBtn.setAttribute('aria-expanded','true');
    const village=$('#quickMenuVillage'); if(village) village.textContent='📍 '+selectedVillage;
    document.documentElement.style.overflow='hidden'; document.body.style.overflow='hidden';
  };
  const closeMenu=()=>{
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-expanded','false');
    document.documentElement.style.overflow=''; document.body.style.overflow='';
  };
  menuBtn.onclick=openMenu;
  $('#quickMenuClose').onclick=closeMenu;
  overlay.addEventListener('click',e=>{ if(e.target===overlay) closeMenu(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && overlay.classList.contains('show')) closeMenu(); });

  $$('#quickMenuPanel [data-quick-action]').forEach(btn=>btn.onclick=async()=>{
    const action=btn.dataset.quickAction;
    closeMenu();
    if(action==='home'){ window.scrollTo({top:0,behavior:'smooth'}); return; }
    if(action==='hunt'){
      if(activeHunt()) openSheet('huntSheet');
      else { renderVillagePage(selectedVillage); openSheet('villageSheet'); }
      return;
    }
    if(action==='village'){
      const target=document.querySelector('.villages') || document.querySelector('.section-head');
      if(target) setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'center'}),80);
      return;
    }
    if(action==='friends'){ await touchPublicProfile(); renderFriends(); openSheet('friendsSheet'); return; }
    if(action==='findings'){ renderFindings(); openSheet('findsSheet'); return; }
    if(action==='event'){ setTimeout(()=>openEventPoster(),80); return; }
    if(action==='shop'){ openSheet('shopSheet'); return; }
    if(action==='profile'){ openSheet('profileSheet'); return; }
    if(action==='admin'){
      if(!adminProfile){ openSheet('adminLogin'); return; }
      const oldText=btn.querySelector('small')?.textContent||'';
      const small=btn.querySelector('small');
      btn.disabled=true;
      if(small) small.textContent='Volledig beheer wordt geladen…';
      try{ await window.__snazzleAdminUiReady; }
      catch(e){ console.warn('Volledig beheermenu kon niet vooraf laden',e); }
      finally{
        btn.disabled=false;
        if(small) small.textContent=oldText;
      }
      renderAdmin();
      openSheet('adminSheet');
    }
  });
}

function renderHome(){ applyName(); renderLocalImages(); renderVillages(); renderActive(); renderFindings(); renderFriends(); renderAdmin(); ensureEventPosterViewer(); bindEventPosterClicks(); ensureQuickMenu(); }
function renderAll(){ renderHome(); }

async function syncNickname(){
  if(!currentUser || !userName() || adminProfile) return;
  const now=new Date().toISOString();
  try {
    await setDoc(doc(db,'users',currentUser.uid),{nickname:userName(),updatedAt:now},{merge:true});
    await setDoc(doc(db,'publicProfiles',currentUser.uid),{nickname:userName(),lastSeen:now},{merge:true});
  } catch(e){ console.warn('nickname/profile sync',e); }
}
async function touchPublicProfile(){
  if(!currentUser || !userName() || adminProfile) return;
  try { await setDoc(doc(db,'publicProfiles',currentUser.uid),{nickname:userName(),lastSeen:new Date().toISOString()},{merge:true}); }
  catch(e){ console.warn('public profile presence',e); }
}
async function loadUserParticipation(){
  joinedHunts=[]; seenFoundHunts=[];
  if(!currentUser || adminProfile) return;
  try {
    const snap=await getDoc(doc(db,'users',currentUser.uid));
    if(snap.exists()){
      const data=snap.data();
      joinedHunts=Array.isArray(data.joinedHunts) ? data.joinedHunts : [];
      seenFoundHunts=Array.isArray(data.seenFoundHunts) ? data.seenFoundHunts : [];
    }
  } catch(e){ console.warn('participation',e); }
}
async function saveUserParticipation(){
  if(!currentUser || adminProfile) return;
  try {
    await setDoc(doc(db,'users',currentUser.uid),{
      nickname:userName()||'Snazzle-speler', joinedHunts, seenFoundHunts, updatedAt:new Date().toISOString()
    },{merge:true});
  } catch(e){ console.warn('participation save',e); }
}
async function requestHuntNotificationPermission(){
  if(!('Notification' in window) || Notification.permission!=='default') return;
  try { await Notification.requestPermission(); } catch(e){ console.warn('notifications',e); }
}
async function joinActiveHunt(){
  const h=activeHunt();
  if(!h || !currentUser) return toast('Er is nu geen actieve hunt');
  if(h.found===true) return toast('Deze Snazzle is al gevonden');
  await requestHuntNotificationPermission();
  if(!joinedHunts.includes(h.id)){
    joinedHunts=[...joinedHunts,h.id];
    await saveUserParticipation();
    toast(`Je zoekt nu mee naar ${h.title} 🔎`);
  } else {
    toast(`Je zoekt al mee naar ${h.title} ✅`);
  }
  renderActive();
  openSheet('huntSheet');
}
async function showFoundNotification(h){
  if(seenFoundHunts.includes(h.id)) return;
  seenFoundHunts=[...seenFoundHunts,h.id];
  await saveUserParticipation();
  const body=`${h.title} in ${h.village} is gevonden. Je hoeft niet meer te zoeken.`;
  toast('🏆 Snazzle gevonden! '+body);
  if('Notification' in window && Notification.permission==='granted'){
    try { new Notification('Snazzle gevonden! 🏆',{body,tag:`snazzle-found-${h.id}`}); } catch(e){ console.warn('notification display',e); }
  }
}
async function checkFoundHunts(nextHunts){
  if(!currentUser || adminProfile || !joinedHunts.length) return;
  for(const h of nextHunts){
    if(h.found===true && joinedHunts.includes(h.id) && !seenFoundHunts.includes(h.id) && h.foundByUserId!==currentUser.uid){
      await showFoundNotification(h);
    }
  }
}
async function loadOwnFindings(){
  if(!currentUser) return;
  try {
    const snap=await getDocs(query(collection(db,'findings'),where('userId','==',currentUser.uid)));
    findings=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderFindings(); updateFoundButton();
  } catch(e){ console.warn('findings',e); }
}
function startCentralListeners(){
  if(listenersStarted || !currentUser) return; listenersStarted=true;
  onSnapshot(collection(db,'villages'),snap=>{
    const arr=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false).map(x=>x.name).filter(Boolean).sort((a,b)=>a.localeCompare(b,'nl'));
    if(arr.length) villages=arr; else villages=(localSettings.villages?.length?localSettings.villages:fallbackVillages);
    centralReady=true; renderAll();
  },e=>console.warn('villages listener',e));
  onSnapshot(collection(db,'hunts'),async snap=>{
    const arr=snap.docs.map(d=>({id:d.id,...d.data()}));
    let nextHunts;
    if(arr.length) nextHunts=arr; else {
      const legacy=loadLegacyHunts();
      nextHunts=legacy.map(h=>({...h,id:h.id||('hunt-'+Date.now()),imageUrl:h.imageUrl||h.image||''}));
    }
    await checkFoundHunts(nextHunts);
    hunts=nextHunts;
    centralReady=true; renderAll();
  },e=>console.warn('hunts listener',e));
  onSnapshot(collection(db,'publicProfiles'),snap=>{
    publicProfiles=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderFriends();
  },e=>{
    console.warn('friends listener',e);
    ensureFriendsUI();
    const summary=$('#friendsSummary'), list=$('#friendsList');
    if(summary) summary.innerHTML='<span>👥 Vriendenlijst nog niet gekoppeld</span>';
    if(list) list.innerHTML='<div class="friend-empty">De app is klaar, maar Firebase moet de vriendenlijst nog toestemming geven.</div>';
  });
}
async function ensureAuth(){
  onAuthStateChanged(auth,async user=>{
    currentUser=user;
    if(!user){ try{ await signInAnonymously(auth); }catch(e){ toast('Verbinding met Firebase lukt niet'); console.error(e); } return; }
    await refreshAdminProfile();
    await syncNickname();
    await loadUserParticipation();
    startCentralListeners();
    await loadOwnFindings();
    await touchPublicProfile();
    checkOnboarding();
    renderAll();
  });
}
async function refreshAdminProfile(){
  adminProfile=null;
  if(!currentUser || currentUser.isAnonymous) return;
  try { const s=await getDoc(doc(db,'adminUsers',currentUser.uid)); if(s.exists() && s.data().active===true) adminProfile={uid:currentUser.uid,...s.data()}; }
  catch(e){ console.warn(e); }
}
function checkOnboarding(){ if(!userName() && (!adminProfile || currentUser?.isAnonymous)) $('#onboarding').classList.add('show'); else $('#onboarding').classList.remove('show'); }

async function seedCentralIfEmpty(){
  if(adminProfile?.role!=='superadmin') return;
  const vSnap=await getDocs(collection(db,'villages'));
  if(vSnap.empty){
    const list=localSettings.villages?.length ? localSettings.villages : fallbackVillages;
    for(const name of list) await setDoc(doc(db,'villages',slug(name)),{name,active:true,createdAt:new Date().toISOString()});
  }
  const hSnap=await getDocs(collection(db,'hunts'));
  if(hSnap.empty){
    let legacy=loadLegacyHunts();
    if(!legacy.length) legacy=[{title:'De Gouden Snazzle',village:'Montfort',description:'Bekijk de Snazzle goed en ga daarna buiten op zoek.',rule:'één Snazzle per gezin',hint:'',image:'',start:'',end:'',mode:'live'}];
    for(const h of legacy){
      await addDoc(collection(db,'hunts'),{
        title:h.title||'Nieuwe Snazzle Hunt', village:h.village||'Montfort', description:h.description||'', rule:h.rule||'', hint:h.hint||'',
        imageUrl:h.imageUrl||h.image||'', foundMessage:h.foundMessage||'Gefeliciteerd! Je hebt de Snazzle gevonden!', start:h.start||'', end:h.end||'', mode:h.mode||'draft', createdAt:new Date().toISOString()
      });
    }
  }
}

async function adminLogin(){
  const email=$('#adminEmail').value.trim(), password=$('#adminPassword').value;
  if(!email || !password) return toast('Vul e-mail en wachtwoord in');
  try {
    await signInWithEmailAndPassword(auth,email,password);
    currentUser=auth.currentUser; await refreshAdminProfile();
    if(!adminProfile){ await signOut(auth); await signInAnonymously(auth); return toast('Dit account heeft geen beheerdersrechten'); }
    if(adminProfile.role==='superadmin') await seedCentralIfEmpty();
    $('#adminPassword').value=''; closeSheet('adminLogin'); openSheet('adminSheet'); renderAdmin(); toast('Beheer geopend ✅');
  } catch(e){ console.error(e); toast('Inloggen mislukt. Controleer e-mail/wachtwoord.'); }
}
async function adminLogout(){
  try { await signOut(auth); adminProfile=null; listenersStarted=false; await signInAnonymously(auth); closeSheet('adminSheet'); toast('Beheer uitgelogd'); }
  catch(e){ console.error(e); }
}

function renderAdmin(){
  if(!$('#adminRole')) return;
  $('#adminRole').textContent=adminProfile ? (adminProfile.role==='superadmin'?'Hoofdbeheerder':`Dorpsbeheerder · ${adminProfile.village||''}`) : 'Niet ingelogd';
  const superAdmin=adminProfile?.role==='superadmin';
  $$('.super-only').forEach(x=>x.style.display=superAdmin?'':'none');
  $$('.village-admin-only').forEach(x=>x.style.display=adminProfile?.role==='village_admin'?'':'none');
  renderAdminHunts(); renderAdminVillages(); renderVillageAdminPanel(); renderAdminUsers();
}
function renderAdminHunts(){
  const box=$('#adminHuntList'); if(!box) return; box.innerHTML='';
  const publicHunts=hunts.filter(h=>
    h?.id!=='snazzle_ar_world_v1' &&
    h?._snazzleInternalType!=='arWorld' &&
    h?.village!=='snazzle-internal' &&
    !/^\s*\[SYSTEEM\]/i.test(String(h?.title||''))
  );
  const visible=adminProfile?.role==='village_admin' ? publicHunts.filter(h=>h.village===adminProfile.village) : publicHunts;
  visible.slice().sort((a,b)=>String(b.start||'').localeCompare(String(a.start||''))).forEach(h=>{
    const st=statusOf(h), card=document.createElement('div'); card.className='listitem';
    card.innerHTML=`<strong>${esc(h.title)}</strong><span>📍 ${esc(h.village)}</span><span class="badge ${st}">${({live:'LIVE',planned:'INGEPLAND',draft:'CONCEPT',ended:'AFGELOPEN'}[st])}</span><button class="secondary" data-edit-hunt="${h.id}">Bewerken</button>`;
    box.appendChild(card);
  });
  $$('[data-edit-hunt]').forEach(b=>b.onclick=()=>openHuntEditor(b.dataset.editHunt));
}
function renderAdminVillages(){
  const box=$('#adminVillageList'); if(!box) return; box.innerHTML='';
  villages.forEach(v=>{ const d=document.createElement('div'); d.className='listitem'; d.innerHTML=`<strong>📍 ${esc(v)}</strong><span>Knop en dorpspagina worden automatisch gemaakt.</span>`; box.appendChild(d); });
  const sel=$('#adminUserVillage'); if(sel){ sel.innerHTML=''; villages.forEach(v=>sel.add(new Option(v,v))); }
  const huntSel=$('#huntVillageEdit'); if(huntSel){ const val=huntSel.value; huntSel.innerHTML=''; villages.forEach(v=>huntSel.add(new Option(v,v))); if(villages.includes(val)) huntSel.value=val; }
}
function renderVillageAdminPanel(){
  if(adminProfile?.role!=='village_admin') return;
  $('#villageAdminTitle').textContent='Beheer '+adminProfile.village;
  const box=$('#villageAdminHunts'); box.innerHTML='';
  hunts.filter(h=>h.village===adminProfile.village).forEach(h=>{
    const d=document.createElement('div'); d.className='listitem'; d.innerHTML=`<strong>${esc(h.title)}</strong><button class="secondary" data-village-edit="${h.id}">Foto, hint en melding aanpassen</button>`; box.appendChild(d);
  });
  $$('[data-village-edit]').forEach(b=>b.onclick=()=>openVillageEdit(b.dataset.villageEdit));
}
async function renderAdminUsers(){
  const box=$('#adminUsersList'); if(!box || adminProfile?.role!=='superadmin') return; box.innerHTML='';
  try { const snap=await getDocs(collection(db,'adminUsers')); snap.docs.forEach(d=>{ const a=d.data(); const row=document.createElement('div'); row.className='listitem'; row.innerHTML=`<strong>${a.role==='superadmin'?'Hoofdbeheerder':'Dorpsbeheerder'}</strong><span>${esc(a.village||'Alle dorpen')}</span><small>${esc(d.id)}</small>`; box.appendChild(row); }); }
  catch(e){ console.warn(e); }
}

function openHuntEditor(id=null){
  if(adminProfile?.role!=='superadmin') return;
  editingHuntId=id; const h=id ? hunts.find(x=>x.id===id) : null; editingHuntImage=h?.imageUrl||'';
  $('#huntEditor').style.display='block';
  $('#huntTitleEdit').value=h?.title||''; $('#huntVillageEdit').value=h?.village||selectedVillage; $('#huntDescEdit').value=h?.description||'';
  $('#huntRuleEdit').value=h?.rule||'één Snazzle per gezin'; $('#huntHintEdit').value=h?.hint||''; $('#huntFoundMessageEdit').value=h?.foundMessage||'Gefeliciteerd! Je hebt de Snazzle gevonden!';
  $('#huntStartEdit').value=h?.start||''; $('#huntEndEdit').value=h?.end||''; $('#huntModeEdit').value=h?.mode||'draft';
  setImg($('#huntImagePreview'),$('#huntImageFallback'),editingHuntImage);
}
async function saveHunt(){
  if(adminProfile?.role!=='superadmin') return;
  const mode=$('#huntModeEdit').value, start=$('#huntStartEdit').value;
  if(mode==='planned' && !start) return toast('Kies datum en tijd');
  const data={
    title:$('#huntTitleEdit').value.trim()||'Nieuwe Snazzle Hunt', village:$('#huntVillageEdit').value,
    description:$('#huntDescEdit').value.trim(), rule:$('#huntRuleEdit').value.trim()||'één Snazzle per gezin', hint:$('#huntHintEdit').value.trim(),
    foundMessage:$('#huntFoundMessageEdit').value.trim()||'Gefeliciteerd! Je hebt de Snazzle gevonden!', imageUrl:editingHuntImage,
    start, end:$('#huntEndEdit').value, mode, updatedAt:new Date().toISOString()
  };
  try {
    if(editingHuntId) await updateDoc(doc(db,'hunts',editingHuntId),data); else await addDoc(collection(db,'hunts'),{...data,createdAt:new Date().toISOString()});
    $('#huntEditor').style.display='none'; toast('Hunt centraal opgeslagen ✅');
  } catch(e){ console.error(e); toast('Hunt opslaan mislukt'); }
}
function openVillageEdit(id){
  const h=hunts.find(x=>x.id===id); if(!h) return;
  editingHuntId=id; editingHuntImage=h.imageUrl||'';
  $('#villageEditTitle').textContent=h.title; $('#villageHintEdit').value=h.hint||''; $('#villageFoundMessageEdit').value=h.foundMessage||'';
  setImg($('#villageImagePreview'),$('#villageImageFallback'),editingHuntImage); $('#villageEditBox').style.display='block';
}
async function saveVillageLimited(){
  if(adminProfile?.role!=='village_admin' || !editingHuntId) return;
  try { await updateDoc(doc(db,'hunts',editingHuntId),{hint:$('#villageHintEdit').value.trim(),foundMessage:$('#villageFoundMessageEdit').value.trim(),imageUrl:editingHuntImage}); $('#villageEditBox').style.display='none'; toast('Wijzigingen opgeslagen ✅'); }
  catch(e){ console.error(e); toast('Opslaan geweigerd of mislukt'); }
}
async function addVillage(){
  if(adminProfile?.role!=='superadmin') return;
  const name=$('#newVillageName').value.trim(); if(name.length<2) return toast('Vul een dorpsnaam in');
  try { await setDoc(doc(db,'villages',slug(name)),{name,active:true,createdAt:new Date().toISOString()},{merge:true}); $('#newVillageName').value=''; toast('Dorp toegevoegd ✅'); }
  catch(e){ console.error(e); toast('Dorp toevoegen mislukt'); }
}
async function createVillageAdmin(){
  if(adminProfile?.role!=='superadmin') return;
  const email=$('#adminUserEmail').value.trim(), pass=$('#adminUserPassword').value, village=$('#adminUserVillage').value;
  if(!email || pass.length<6 || !village) return toast('Vul e-mail, wachtwoord (min. 6) en dorp in');
  let secondary;
  try {
    secondary=initializeApp(firebaseConfig,'secondary-'+Date.now()); const a=getAuth(secondary); const cred=await createUserWithEmailAndPassword(a,email,pass);
    await setDoc(doc(db,'adminUsers',cred.user.uid),{role:'village_admin',village,active:true,email,createdAt:new Date().toISOString()});
    await signOut(a); await deleteApp(secondary); $('#adminUserEmail').value=''; $('#adminUserPassword').value=''; toast('Dorpsbeheerder aangemaakt ✅'); renderAdminUsers();
  } catch(e){ console.error(e); if(secondary) try{await deleteApp(secondary)}catch{} toast('Account maken mislukt'); }
}

async function saveLocalImage(key,file){
  try { const src=await compressFile(file,800,.68); localSettings[key]=src; localStorage.setItem('snazzleSettings',JSON.stringify(localSettings)); renderLocalImages(); toast('Afbeelding opgeslagen ✅'); }
  catch(e){ toast(e.message); }
}

async function markFound(){
  const h=activeHunt(); if(!h || !currentUser) return;
  if(findings.some(f=>f.huntId===h.id)) return toast('Deze hunt staat al bij je vondsten');
  if(!proofPhoto) return toast('Maak eerst een foto');
  const now=new Date().toISOString();
  const item={userId:currentUser.uid,nickname:userName()||'Snazzle-speler',huntId:h.id,title:h.title,village:h.village,photoData:proofPhoto,dateLabel:new Date().toLocaleDateString('nl-NL'),createdAt:now};
  try {
    const batch=writeBatch(db);
    batch.set(doc(db,'findings',h.id),item);
    batch.update(doc(db,'hunts',h.id),{found:true,foundAt:now,foundByUserId:currentUser.uid,foundByNickname:item.nickname});
    await batch.commit();
    findings.unshift({id:h.id,...item});
    proofPhoto=''; resetProof(); renderFindings();
    toast(h.foundMessage||'Gevonden! 🏆');
  }
  catch(e){ console.error(e); toast('Vondst kon niet worden bevestigd'); }
}

// UI bindings
$$('[data-close]').forEach(b=>b.onclick=()=>closeSheet(b.dataset.close));
$('#finishOnboarding').onclick=async()=>{ const n=$('#firstNameInput').value.trim().slice(0,20); if(n.length<2) return toast('Vul een voornaam of nickname in'); localStorage.setItem('snazzleName',n); $('#onboarding').classList.remove('show'); applyName(); await syncNickname(); renderFriends(); };
$('#saveName').onclick=async()=>{ const n=$('#nameInput').value.trim().slice(0,20); if(n.length<2) return toast('Vul minimaal 2 tekens in'); localStorage.setItem('snazzleName',n); await syncNickname(); closeSheet('profileSheet'); renderAll(); };
$('#profileBtn').onclick=$('#navProfile').onclick=()=>openSheet('profileSheet');
$('#findsBtn').onclick=()=>{ renderFindings(); openSheet('findsSheet'); };
$('#navFriends').onclick=async()=>{ await touchPublicProfile(); renderFriends(); openSheet('friendsSheet'); };
$('#navShop').onclick=()=>openSheet('shopSheet');
$('#bigStart').onclick=$('#navHunt').onclick=()=>{ if(activeHunt()) openSheet('huntSheet'); else { renderVillagePage(selectedVillage); openSheet('villageSheet'); } };
$('#startBtn').onclick=joinActiveHunt;
$('#proofBtn').onclick=()=>$('#proofInput').click();
$('#proofInput').onchange=async e=>{ try{ proofPhoto=await compressFile(e.target.files[0],520,.6); $('#proofImg').src=proofPhoto; $('#proofPreview').style.display='block'; updateFoundButton(); toast('Foto toegevoegd ✅'); } catch(err){ toast(err.message); } };
$('#foundBtn').onclick=markFound;
$('#adminBtn').onclick=()=>{ if(adminProfile) openSheet('adminSheet'); else openSheet('adminLogin'); };
$('#adminLoginBtn').onclick=adminLogin; $('#adminLogoutBtn').onclick=adminLogout;
$('#newHuntBtn').onclick=()=>openHuntEditor(null); $('#cancelHuntEditor').onclick=()=>$('#huntEditor').style.display='none'; $('#saveHuntBtn').onclick=saveHunt;
$('#huntImageInput').onchange=async e=>{ try{ editingHuntImage=await compressFile(e.target.files[0],720,.65); setImg($('#huntImagePreview'),$('#huntImageFallback'),editingHuntImage); }catch(err){toast(err.message);} };
$('#addVillageBtn').onclick=addVillage; $('#createVillageAdminBtn').onclick=createVillageAdmin;
$('#villageImageInput').onchange=async e=>{ try{ editingHuntImage=await compressFile(e.target.files[0],720,.65); setImg($('#villageImagePreview'),$('#villageImageFallback'),editingHuntImage); }catch(err){toast(err.message);} };
$('#saveVillageLimitedBtn').onclick=saveVillageLimited;
[['profileImageInput','profileImage'],['heroImageInput','heroImage'],['home1Input','homeImage1'],['home2Input','homeImage2']].forEach(([id,key])=>$('#'+id).onchange=e=>saveLocalImage(key,e.target.files[0]));
$$('[data-remove-local-image]').forEach(b=>b.onclick=()=>{ localSettings[b.dataset.removeLocalImage]=''; localStorage.setItem('snazzleSettings',JSON.stringify(localSettings)); renderLocalImages(); toast('Afbeelding verwijderd'); });
$$('[data-tab]').forEach(b=>b.onclick=()=>{ $$('[data-tab]').forEach(x=>x.classList.remove('on')); $$('.admin-section').forEach(x=>x.classList.remove('on')); b.classList.add('on'); $('#'+b.dataset.tab).classList.add('on'); });

document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') touchPublicProfile(); });
setInterval(()=>{ renderActive(); renderFriends(); },30000);
setInterval(()=>{ if(document.visibilityState==='visible') touchPublicProfile(); },180000);
renderAll();
ensureAuth();
