// Snazzle v73 — De Bieb: persoonlijke boekenkast, leeshoek en beloning per twee boeken.
// Privacy: boekgegevens staan alleen in het eigen gebruikersdocument. Kaftfoto's staan
// in een afgeschermde Firebase Storage-map die uitsluitend het eigen account mag lezen.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, doc, onSnapshot, runTransaction
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const VERSION='73.1.0';
const MAX_BOOKS=200;
const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
const storage=getStorage(app);

let currentUser=null;
let books=[];
let stopBooksListener=null;
let selectedCover=null;
let selectedQuestion='';
let saving=false;
const coverUrls=new Map();

const READ_QUESTIONS=[
  'Wat vond je het leukste aan dit boek?',
  'Wie of wat uit het boek bleef het meest in je hoofd?',
  'Zou je dit boek aan iemand aanraden? Waarom?',
  'Welke gebeurtenis uit het boek vond je het spannendst of grappigst?'
];
const BIEB_MEANINGS=[
  'Bewondering In Elk Boek',
  'Boeken Inspireren Elke Bladzijde',
  'Beleef Iets Extra’s met Boeken'
];
const ROOM_REWARDS=[
  {at:2, icon:'🌱', name:'Verhalenplant'},
  {at:4, icon:'💡', name:'Leeslamp'},
  {at:6, icon:'🪑', name:'Voorleesstoel'},
  {at:8, icon:'🗝️', name:'Geheime Bieb-lade'},
  {at:10,icon:'🦆', name:'Gouden Lees-Snazzle'},
  {at:12,icon:'🧸', name:'Knuffelhoek'},
  {at:14,icon:'🌟', name:'Sterrenplafond'},
  {at:16,icon:'🗺️', name:'Verhalenkaart'},
  {at:18,icon:'🔭', name:'Droomkijker'},
  {at:20,icon:'👑', name:'Biebmeester-kroon'}
];

function esc(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}
function nickname(){
  const name=String(localStorage.getItem('snazzleName')||'').trim().slice(0,20);
  return name.length>=2 ? name : 'Snazzler';
}
function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__snBiebToast73);
  window.__snBiebToast73=setTimeout(()=>el.classList.remove('show'),3300);
}
function today(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatDate(value){
  if(!value) return '';
  try{
    const [y,m,d]=String(value).slice(0,10).split('-').map(Number);
    if(!y||!m||!d) return String(value);
    return new Intl.DateTimeFormat('nl-NL',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(y,m-1,d));
  }catch{return String(value);}
}
function randomMeaning(){
  return BIEB_MEANINGS[Math.floor(Math.random()*BIEB_MEANINGS.length)];
}
function chooseQuestion(){
  selectedQuestion=READ_QUESTIONS[Math.floor(Math.random()*READ_QUESTIONS.length)];
  const label=document.getElementById('snBiebQuestion');
  if(label) label.textContent=selectedQuestion;
}
function nextReward(total){
  const exact=ROOM_REWARDS.find(r=>r.at>total);
  if(exact) return exact;
  const nextEven=total%2===0 ? total+2 : total+1;
  return {at:nextEven,icon:'🪶',name:`Leesveer ${Math.floor(nextEven/2)}`};
}
function rewardFor(total){
  const exact=ROOM_REWARDS.find(r=>r.at===total);
  return exact || {at:total,icon:'🪶',name:`Nieuwe Leesveer ${Math.floor(total/2)}`};
}

function installStyles(){
  if(document.getElementById('snBiebStyles73')) return;
  const style=document.createElement('style');
  style.id='snBiebStyles73';
  style.textContent=`
    .sn-bieb-home{width:100%;margin:17px 0 0;border:3px solid #6b4325;border-radius:23px;padding:16px;background:linear-gradient(135deg,#6b4027 0%,#8b5c30 46%,#365b36 100%);color:#fff8df;box-shadow:0 6px 0 #3e2818,0 10px 22px rgba(0,0,0,.2);display:grid;grid-template-columns:58px 1fr 34px;align-items:center;gap:12px;text-align:left;position:relative;overflow:hidden}
    .sn-bieb-home:before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 0 62%,rgba(255,221,118,.1) 62% 76%,transparent 76%);pointer-events:none}
    .sn-bieb-home .icon{width:58px;height:58px;border-radius:17px;display:grid;place-items:center;background:#f6d67b;color:#4b2f1d;font-size:31px;border:3px solid #9b6b35;box-shadow:0 4px 0 #50311d;position:relative;z-index:1}
    .sn-bieb-home strong{display:block;font-size:20px;line-height:1.05;position:relative;z-index:1}.sn-bieb-home small{display:block;margin-top:5px;color:#e8edc4;font-weight:760;line-height:1.3;position:relative;z-index:1}.sn-bieb-home .arrow{font-size:34px;color:#ffd96a;text-align:center;position:relative;z-index:1}

    .sn-bieb-overlay{position:fixed;inset:0;z-index:7800;background:#09271d;display:none;color:#fff8e8;overscroll-behavior:contain}.sn-bieb-overlay.show{display:block}
    .sn-bieb-page{width:min(100%,620px);height:100%;margin:auto;overflow:auto;padding:calc(10px + env(safe-area-inset-top)) 13px calc(30px + env(safe-area-inset-bottom));background:radial-gradient(circle at 90% 2%,rgba(244,201,88,.14),transparent 26%),linear-gradient(180deg,#174b32 0%,#123823 34%,#0c291c 100%)}
    .sn-bieb-top{position:sticky;top:0;z-index:8;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0 12px;background:linear-gradient(180deg,#174b32 72%,transparent)}
    .sn-bieb-title{display:flex;align-items:center;gap:9px;min-width:0}.sn-bieb-title b{font-size:29px}.sn-bieb-title strong{display:block;font-size:22px;color:#ffd462;line-height:1}.sn-bieb-title small{display:block;color:#cae7bd;font-weight:760;margin-top:3px;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}
    .sn-bieb-close{width:47px;height:47px;flex:0 0 47px;border:2px solid #b98a4f;border-radius:15px;background:#69452b;color:#fff;font-size:27px;font-weight:900;box-shadow:0 4px 0 #392518}
    .sn-bieb-hero{border:3px solid #8d6336;border-radius:24px;padding:17px;background:linear-gradient(145deg,#fff0bd,#e8c981);color:#392619;box-shadow:0 7px 0 #4d301c,0 12px 24px rgba(0,0,0,.22);position:relative;overflow:hidden}.sn-bieb-hero:after{content:"📚";position:absolute;right:10px;top:3px;font-size:78px;opacity:.12;transform:rotate(8deg)}
    .sn-bieb-hero .eyebrow{font-size:11px;font-weight:1000;text-transform:uppercase;letter-spacing:1.2px;color:#7d5a32}.sn-bieb-hero h1{margin:4px 0 5px;font-size:29px;line-height:1}.sn-bieb-hero p{margin:0;font-weight:760;line-height:1.42;max-width:430px}.sn-bieb-meaning{margin-top:11px;display:inline-block;padding:7px 10px;border-radius:999px;background:#fff9df;border:2px solid #c79b53;font-weight:950;font-size:11px}
    .sn-bieb-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:13px}.sn-bieb-stat{padding:10px 7px;border-radius:15px;background:rgba(255,255,255,.09);border:1px solid rgba(255,230,161,.22);text-align:center}.sn-bieb-stat b{display:block;font-size:22px;color:#ffd25f}.sn-bieb-stat span{font-size:10px;font-weight:850;color:#e4f0d7}

    .sn-bieb-section{margin-top:17px}.sn-bieb-section-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:0 2px 9px}.sn-bieb-section-head h2{margin:0;font-size:20px}.sn-bieb-section-head small{color:#d5e8c6;font-weight:760;text-align:right}
    .sn-bieb-room{border:3px solid #76502d;border-radius:23px;padding:14px;background:linear-gradient(180deg,#b67c45 0 12%,#edd39d 12% 82%,#815b3d 82%);color:#332318;box-shadow:0 6px 0 #432b1a;min-height:272px;position:relative;overflow:hidden}.sn-bieb-room:before,.sn-bieb-room:after{content:"";position:absolute;left:8%;right:8%;height:12px;border-radius:5px;background:#684328;box-shadow:0 4px 0 rgba(0,0,0,.25);z-index:1}.sn-bieb-room:before{top:50px}.sn-bieb-room:after{top:145px}
    .sn-bieb-room-name{position:relative;z-index:2;font-weight:1000;background:#fff2c2;border:2px solid #9b6b38;border-radius:999px;padding:6px 10px;display:inline-block;font-size:11px}.sn-bieb-room-items{position:relative;z-index:2;display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:34px}.sn-bieb-room-item{min-height:72px;border-radius:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;text-align:center;background:rgba(255,249,225,.78);border:2px solid rgba(105,71,39,.45);filter:grayscale(1);opacity:.34}.sn-bieb-room-item.on{filter:none;opacity:1;box-shadow:0 4px 0 rgba(82,54,31,.34)}.sn-bieb-room-item b{font-size:25px}.sn-bieb-room-item span{font-size:8px;line-height:1.08;font-weight:900;margin-top:2px}
    .sn-bieb-progress{margin-top:11px;border-radius:15px;background:rgba(255,255,255,.09);padding:10px 12px;border:1px solid rgba(255,233,173,.2)}.sn-bieb-progress-row{display:flex;justify-content:space-between;gap:10px;font-size:11px;font-weight:900}.sn-bieb-progress-track{height:9px;background:#092619;border-radius:999px;margin-top:7px;overflow:hidden}.sn-bieb-progress-fill{height:100%;background:linear-gradient(90deg,#f5bc3d,#ffde70);border-radius:inherit}

    .sn-bieb-add{width:100%;min-height:56px;border:0;border-radius:17px;background:linear-gradient(#ffd663,#f2ad31);color:#3a2816;font-weight:1000;font-size:16px;box-shadow:0 5px 0 #986025;margin-top:12px}.sn-bieb-form{display:none;margin-top:11px;padding:14px;border:3px solid #8a6338;border-radius:21px;background:#f3d99f;color:#332318;box-shadow:0 6px 0 #4b301e}.sn-bieb-form.show{display:block}.sn-bieb-form h3{margin:0 0 7px}.sn-bieb-note{font-size:11px;line-height:1.4;color:#624829;font-weight:720}.sn-bieb-field{margin:11px 0}.sn-bieb-field label{display:block;font-size:11px;font-weight:1000;margin-bottom:5px}.sn-bieb-field input,.sn-bieb-field textarea,.sn-bieb-field select{width:100%;border:2px solid #b58b4e;border-radius:13px;background:#fffaf0;color:#2d2117;padding:11px;font-size:16px;outline:none}.sn-bieb-field textarea{min-height:76px;resize:vertical}.sn-bieb-field input:focus,.sn-bieb-field textarea:focus,.sn-bieb-field select:focus{border-color:#448840;box-shadow:0 0 0 3px rgba(68,136,64,.15)}
    .sn-bieb-cover-preview{height:180px;border:2px dashed #a67c42;border-radius:16px;background:#e6c98e;display:grid;place-items:center;overflow:hidden;color:#6d512e;font-weight:900}.sn-bieb-cover-preview img{width:100%;height:100%;object-fit:contain;display:none;background:#1c241c}.sn-bieb-form-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:8px;margin-top:12px}.sn-bieb-cancel,.sn-bieb-save{border:0;border-radius:14px;padding:12px;font-weight:1000;min-height:48px}.sn-bieb-cancel{background:#c9a66c;color:#382719}.sn-bieb-save{background:#4d9444;color:white;box-shadow:0 4px 0 #2e682e}.sn-bieb-save:disabled{opacity:.6;box-shadow:none}

    .sn-bieb-shelf{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sn-bieb-empty{grid-column:1/-1;padding:20px;border:2px dashed rgba(255,229,161,.35);border-radius:18px;text-align:center;color:#dce9d3;background:rgba(255,255,255,.05);font-weight:800;line-height:1.45}.sn-bieb-book{min-width:0;border:3px solid #80552e;border-radius:18px;overflow:hidden;background:#f1d795;color:#322218;box-shadow:0 5px 0 #4d301e;position:relative}.sn-bieb-cover{height:180px;background:linear-gradient(135deg,#866641,#493621);display:grid;place-items:center;overflow:hidden}.sn-bieb-cover img{width:100%;height:100%;object-fit:contain;background:#171b17}.sn-bieb-cover-placeholder{padding:14px;text-align:center;color:#fff2ce;font-weight:900}.sn-bieb-book-body{padding:10px}.sn-bieb-book h3{font-size:15px;margin:0;line-height:1.15}.sn-bieb-book-meta{font-size:9px;color:#735737;font-weight:850;margin-top:5px}.sn-bieb-stars{color:#b9730e;letter-spacing:-1px;font-size:12px;margin-top:5px}.sn-bieb-reaction{font-size:10px;line-height:1.35;margin-top:6px;color:#4a3926;font-weight:720}.sn-bieb-delete{width:100%;margin-top:8px;border:0;border-radius:10px;padding:7px;background:#ddbea0;color:#704130;font-size:9px;font-weight:950}

    .sn-bieb-facts{display:grid;gap:8px}.sn-bieb-fact{padding:12px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,232,168,.18);display:grid;grid-template-columns:38px 1fr;gap:9px;align-items:start}.sn-bieb-fact b{font-size:25px}.sn-bieb-fact strong{display:block;color:#ffdb73;font-size:13px}.sn-bieb-fact span{display:block;margin-top:3px;font-size:11px;line-height:1.38;color:#e0eed7;font-weight:700}
    .sn-bieb-missions{display:flex;gap:8px;overflow:auto;padding:1px 1px 8px}.sn-bieb-mission{flex:0 0 164px;min-height:88px;border-radius:17px;padding:11px;background:linear-gradient(145deg,#366f4a,#275239);border:2px solid #6d9a5b;box-shadow:0 4px 0 #173c28}.sn-bieb-mission b{font-size:23px}.sn-bieb-mission strong{display:block;margin-top:5px;font-size:12px}.sn-bieb-mission span{display:block;margin-top:3px;font-size:10px;color:#dcebd4;line-height:1.3;font-weight:700}

    .sn-bieb-reward{position:fixed;inset:0;z-index:7900;background:rgba(4,16,9,.82);display:none;align-items:center;justify-content:center;padding:20px}.sn-bieb-reward.show{display:flex}.sn-bieb-reward-card{width:min(100%,390px);border:4px solid #8b5d2f;border-radius:27px;padding:21px;background:linear-gradient(#fff0b5,#e7c477);color:#362419;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,.5)}.sn-bieb-reward-icon{font-size:64px}.sn-bieb-reward-card h2{margin:7px 0 5px}.sn-bieb-reward-card p{margin:0;line-height:1.42;font-weight:760}.sn-bieb-reward-card button{width:100%;margin-top:14px;border:0;border-radius:14px;padding:12px;background:#4a9143;color:white;font-weight:1000;box-shadow:0 4px 0 #2d662e}
    @media(max-width:380px){.sn-bieb-room-items{grid-template-columns:repeat(5,1fr);gap:4px}.sn-bieb-room-item{min-height:68px}.sn-bieb-room-item b{font-size:22px}.sn-bieb-cover{height:156px}.sn-bieb-title small{max-width:210px}}
    @media(prefers-reduced-motion:reduce){.sn-bieb-page{scroll-behavior:auto}}
  `;
  document.head.appendChild(style);
}

function ensureHomeEntry(){
  if(document.getElementById('snBiebHome73')) return;
  const quick=document.querySelector('.quick');
  if(!quick) return;
  const button=document.createElement('button');
  button.id='snBiebHome73';
  button.className='sn-bieb-home';
  button.type='button';
  button.innerHTML='<span class="icon">📚</span><span><strong>De Bieb</strong><small>Vul je eigen boekenkast en bouw met lezen je Snazzle-leeshoek.</small></span><span class="arrow">›</span>';
  button.addEventListener('click',openBieb);
  quick.insertAdjacentElement('afterend',button);
}

function ensureQuickMenuEntry(){
  if(document.getElementById('snBiebMenu73')) return;
  const list=document.querySelector('#quickMenuPanel .quick-menu-list');
  if(!list) return;
  const button=document.createElement('button');
  button.id='snBiebMenu73';
  button.type='button';
  button.innerHTML='<b>📚</b><span><strong>De Bieb</strong><small>Jouw boeken en leeshoek</small></span><i>›</i>';
  button.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    try{document.getElementById('quickMenuClose')?.click();}catch{}
    setTimeout(openBieb,70);
  });
  const game=document.getElementById('snazzleGameMenuV62');
  const hunt=[...list.querySelectorAll('button')].find(b=>b.dataset?.quickAction==='hunt');
  const anchor=game||hunt;
  if(anchor?.nextSibling) list.insertBefore(button,anchor.nextSibling); else list.appendChild(button);
}

function ensureBiebUI(){
  installStyles();
  ensureHomeEntry();
  ensureQuickMenuEntry();
  if(document.getElementById('snBiebOverlay73')) return;

  const overlay=document.createElement('div');
  overlay.id='snBiebOverlay73';
  overlay.className='sn-bieb-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`
    <div class="sn-bieb-page" role="dialog" aria-modal="true" aria-label="De Bieb">
      <div class="sn-bieb-top">
        <div class="sn-bieb-title"><b>📚</b><div><strong>De Bieb</strong><small id="snBiebTopMeaning">Bewondering In Elk Boek</small></div></div>
        <button class="sn-bieb-close" id="snBiebClose73" type="button" aria-label="De Bieb sluiten">×</button>
      </div>

      <section class="sn-bieb-hero">
        <div class="eyebrow">Snazzle Leesavontuur</div>
        <h1>Jouw verhalen. Jouw kast.</h1>
        <p>Maak een foto van de kaft als je een boek uit hebt. Om de twee boeken verdien je een Leesveer en groeit jouw eigen leeshoek.</p>
        <div class="sn-bieb-meaning" id="snBiebMeaning73">B.I.E.B. = Bewondering In Elk Boek 😄</div>
        <div class="sn-bieb-stats">
          <div class="sn-bieb-stat"><b id="snBiebBookCount73">0</b><span>boeken</span></div>
          <div class="sn-bieb-stat"><b id="snBiebFeatherCount73">0</b><span>Leesveren</span></div>
          <div class="sn-bieb-stat"><b id="snBiebNextCount73">2</b><span>volgende verrassing</span></div>
        </div>
      </section>

      <section class="sn-bieb-section">
        <div class="sn-bieb-section-head"><h2>🛋️ Mijn leeshoek</h2><small id="snBiebRoomHint73">Nog 2 boeken tot je eerste verrassing</small></div>
        <div class="sn-bieb-room">
          <div class="sn-bieb-room-name">De kamer van <span id="snBiebRoomName73">Snazzler</span></div>
          <div class="sn-bieb-room-items" id="snBiebRoomItems73"></div>
        </div>
        <div class="sn-bieb-progress">
          <div class="sn-bieb-progress-row"><span id="snBiebProgressText73">0 van 2 boeken</span><span id="snBiebProgressReward73">🌱 Verhalenplant</span></div>
          <div class="sn-bieb-progress-track"><div class="sn-bieb-progress-fill" id="snBiebProgressFill73" style="width:0%"></div></div>
        </div>
        <button class="sn-bieb-add" id="snBiebAdd73" type="button">📸 Zet een gelezen boek in mijn Bieb</button>

        <form class="sn-bieb-form" id="snBiebForm73" novalidate>
          <h3>Nieuw boek 📖</h3>
          <div class="sn-bieb-note">Maak liefst alleen een foto van de <b>boekkaft</b>, zonder herkenbare gezichten. Je hoeft geen lange boekbespreking te schrijven.</div>
          <div class="sn-bieb-field"><label>Foto van de kaft</label><input id="snBiebCoverInput73" type="file" accept="image/*"><div class="sn-bieb-cover-preview" id="snBiebCoverPreview73"><span id="snBiebCoverEmpty73">📷 Kies of maak een foto</span><img id="snBiebCoverImg73" alt="Voorbeeld van boekkaft"></div></div>
          <div class="sn-bieb-field"><label>Titel van het boek</label><input id="snBiebTitle73" maxlength="80" autocomplete="off" placeholder="Bijv. De Gorgels"></div>
          <div class="sn-bieb-field"><label>Wanneer had je hem uit?</label><input id="snBiebReadAt73" type="date"></div>
          <div class="sn-bieb-field"><label>Hoeveel sterren geef je het boek?</label><select id="snBiebRating73"><option value="">Kies sterren</option><option value="1">⭐ 1 ster</option><option value="2">⭐⭐ 2 sterren</option><option value="3">⭐⭐⭐ 3 sterren</option><option value="4">⭐⭐⭐⭐ 4 sterren</option><option value="5">⭐⭐⭐⭐⭐ 5 sterren</option></select></div>
          <div class="sn-bieb-field"><label id="snBiebQuestion">Wat vond je het leukste aan dit boek?</label><textarea id="snBiebReaction73" maxlength="180" placeholder="Een paar woorden of één zin is genoeg."></textarea></div>
          <div class="sn-bieb-note">Snazzle controleert niet met een toets of je echt gelezen hebt. De Bieb werkt op vertrouwen — jouw korte antwoord maakt ieder boek wel echt van jou.</div>
          <div class="sn-bieb-form-actions"><button class="sn-bieb-cancel" id="snBiebCancel73" type="button">Annuleren</button><button class="sn-bieb-save" id="snBiebSave73" type="submit">Boek in mijn kast ✓</button></div>
        </form>
      </section>

      <section class="sn-bieb-section">
        <div class="sn-bieb-section-head"><h2>📚 Mijn boekenkast</h2><small id="snBiebShelfCount73">0 gelezen</small></div>
        <div class="sn-bieb-shelf" id="snBiebShelf73"><div class="sn-bieb-empty">Je kast is nog leeg. Zet je eerste uitgelezen boek erin en begin je eigen Snazzle-Bieb.</div></div>
      </section>

      <section class="sn-bieb-section">
        <div class="sn-bieb-section-head"><h2>🧠 Waarom lezen?</h2><small>Kleine superkrachten</small></div>
        <div class="sn-bieb-facts">
          <div class="sn-bieb-fact"><b>🎬</b><div><strong>Je hoofd maakt de film</strong><span>Bij lezen bedenk je zelf hoe personen, plekken en avonturen eruitzien. Je fantasie doet dus volop mee.</span></div></div>
          <div class="sn-bieb-fact"><b>🗣️</b><div><strong>Nieuwe woorden sluipen naar binnen</strong><span>In verhalen kom je woorden en zinnen tegen die je in gewone gesprekken misschien minder vaak hoort.</span></div></div>
          <div class="sn-bieb-fact"><b>🎯</b><div><strong>Aandacht oefenen</strong><span>Een verhaal volgen vraagt dat je even bij één ding blijft. Ook tien rustige leesminuten zijn al een mooi leesmoment.</span></div></div>
          <div class="sn-bieb-fact"><b>❤️</b><div><strong>Even in iemand anders zijn schoenen</strong><span>Verhalen laten je meemaken wat andere personen denken, voelen en kiezen — zelfs in een compleet verzonnen wereld.</span></div></div>
        </div>
      </section>

      <section class="sn-bieb-section">
        <div class="sn-bieb-section-head"><h2>🧭 Leesmissies</h2><small>Geen huiswerk — gewoon proberen</small></div>
        <div class="sn-bieb-missions">
          <div class="sn-bieb-mission"><b>😂</b><strong>Lachmissie</strong><span>Lees eens iets waarvan je moet lachen.</span></div>
          <div class="sn-bieb-mission"><b>🐾</b><strong>Dierenmissie</strong><span>Kies een verhaal waarin een dier belangrijk is.</span></div>
          <div class="sn-bieb-mission"><b>🌳</b><strong>Buitenmissie</strong><span>Lees een stukje buiten op een fijne plek.</span></div>
          <div class="sn-bieb-mission"><b>💬</b><strong>Samenmissie</strong><span>Lees iets samen of vertel iemand over je boek.</span></div>
          <div class="sn-bieb-mission"><b>💥</b><strong>Stripmissie</strong><span>Een strip telt óók. Verhalen zijn er in alle vormen.</span></div>
        </div>
      </section>
    </div>`;
  document.body.appendChild(overlay);

  const reward=document.createElement('div');
  reward.id='snBiebReward73';
  reward.className='sn-bieb-reward';
  reward.setAttribute('aria-hidden','true');
  reward.innerHTML='<div class="sn-bieb-reward-card"><div class="sn-bieb-reward-icon" id="snBiebRewardIcon73">🪶</div><h2 id="snBiebRewardTitle73">Leesveer verdiend!</h2><p id="snBiebRewardText73"></p><button id="snBiebRewardClose73" type="button">Zet hem in mijn leeshoek ✨</button></div>';
  document.body.appendChild(reward);

  document.getElementById('snBiebClose73').addEventListener('click',closeBieb);
  document.getElementById('snBiebAdd73').addEventListener('click',openAddForm);
  document.getElementById('snBiebCancel73').addEventListener('click',closeAddForm);
  document.getElementById('snBiebCoverInput73').addEventListener('change',handleCoverSelection);
  document.getElementById('snBiebForm73').addEventListener('submit',saveBook);
  document.getElementById('snBiebRewardClose73').addEventListener('click',closeReward);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&reward.classList.contains('show')) closeReward();
    else if(e.key==='Escape'&&overlay.classList.contains('show')) closeBieb();
  });

  renderBieb();
}

function openBieb(){
  ensureBiebUI();
  const overlay=document.getElementById('snBiebOverlay73');
  if(!overlay) return;
  const meaning=randomMeaning();
  document.getElementById('snBiebTopMeaning').textContent=meaning;
  document.getElementById('snBiebMeaning73').textContent=`B.I.E.B. = ${meaning} 😄`;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow='hidden';
  document.body.style.overflow='hidden';
  renderBieb();
  overlay.querySelector('.sn-bieb-page')?.scrollTo({top:0,behavior:'auto'});
}
function closeBieb(){
  const overlay=document.getElementById('snBiebOverlay73');
  if(!overlay) return;
  closeAddForm();
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow='';
  document.body.style.overflow='';
}
function openAddForm(){
  if(!currentUser) return toast('De Bieb wacht nog even op je Snazzle-profiel');
  const form=document.getElementById('snBiebForm73');
  if(!form) return;
  form.classList.add('show');
  document.getElementById('snBiebReadAt73').value=today();
  chooseQuestion();
  setTimeout(()=>form.scrollIntoView({behavior:'smooth',block:'start'}),50);
}
function closeAddForm(){
  const form=document.getElementById('snBiebForm73');
  if(!form) return;
  form.classList.remove('show');
  form.reset();
  const date=document.getElementById('snBiebReadAt73');
  if(date) date.value=today();
  selectedCover=null;
  selectedQuestion='';
  const img=document.getElementById('snBiebCoverImg73');
  const empty=document.getElementById('snBiebCoverEmpty73');
  if(img){img.removeAttribute('src');img.style.display='none';}
  if(empty) empty.style.display='block';
}

function fileToImage(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Deze afbeelding kon niet worden gelezen'));};
    img.src=url;
  });
}
function canvasToBlob(canvas,type,quality){
  return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
}
async function blobToDataUrl(blob){
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('Afbeelding kon niet worden voorbereid'));
    reader.readAsDataURL(blob);
  });
}
async function compressCover(file){
  if(!file||!String(file.type||'').startsWith('image/')) throw new Error('Kies een foto van een boekkaft');
  if(file.size>15*1024*1024) throw new Error('Deze foto is te groot; kies een kleinere foto');
  const source=await fileToImage(file);
  const originalW=source.naturalWidth||source.width;
  const originalH=source.naturalHeight||source.height;
  let maxSide=760;
  let quality=.74;
  let blob=null;
  for(let attempt=0;attempt<6;attempt++){
    const scale=Math.min(1,maxSide/Math.max(originalW,originalH));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(originalW*scale));
    canvas.height=Math.max(1,Math.round(originalH*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(source,0,0,canvas.width,canvas.height);
    blob=await canvasToBlob(canvas,'image/webp',quality);
    if(!blob) blob=await canvasToBlob(canvas,'image/jpeg',quality);
    if(blob&&blob.size<=350000) break;
    maxSide=Math.max(420,Math.round(maxSide*.82));
    quality=Math.max(.55,quality-.05);
  }
  if(!blob) throw new Error('De kaftfoto kon niet worden verkleind');
  if(blob.size>430000) throw new Error('De kaftfoto blijft te groot; maak de foto iets dichterbij');
  const dataUrl=await blobToDataUrl(blob);
  if(dataUrl.length>620000) throw new Error('De kaftfoto blijft te groot; probeer een andere foto');
  return {blob,dataUrl};
}
async function handleCoverSelection(event){
  const file=event.target.files?.[0];
  if(!file){selectedCover=null;return;}
  const preview=document.getElementById('snBiebCoverPreview73');
  if(preview) preview.setAttribute('aria-busy','true');
  try{
    selectedCover=await compressCover(file);
    const img=document.getElementById('snBiebCoverImg73');
    const empty=document.getElementById('snBiebCoverEmpty73');
    if(img){img.src=selectedCover.dataUrl;img.style.display='block';}
    if(empty) empty.style.display='none';
  }catch(err){
    selectedCover=null;
    event.target.value='';
    toast(err?.message||'De foto kon niet worden gebruikt');
  }finally{
    if(preview) preview.removeAttribute('aria-busy');
  }
}

function createBookId(){
  try{return crypto.randomUUID().replace(/[^a-zA-Z0-9_-]/g,'');}
  catch{return `${Date.now()}_${Math.random().toString(36).slice(2,10)}`;}
}

async function saveBook(event){
  event.preventDefault();
  if(saving) return;
  if(!currentUser) return toast('Je Snazzle-profiel is nog niet klaar');
  const title=String(document.getElementById('snBiebTitle73')?.value||'').trim().replace(/\s+/g,' ').slice(0,80);
  const reaction=String(document.getElementById('snBiebReaction73')?.value||'').trim().replace(/\s+/g,' ').slice(0,180);
  const rating=Number(document.getElementById('snBiebRating73')?.value||0);
  const readAt=String(document.getElementById('snBiebReadAt73')?.value||today()).slice(0,10);
  if(title.length<2) return toast('Vul de titel van het boek in');
  if(books.some(b=>String(b.title||'').trim().toLocaleLowerCase('nl-NL')===title.toLocaleLowerCase('nl-NL'))) return toast('Dit boek staat al in jouw Bieb 📚');
  if(books.length>=MAX_BOOKS) return toast('Je Bieb zit vol met 200 boeken. Wat een leesprestatie!');
  if(!selectedCover) return toast('Kies eerst een foto van de boekkaft');
  if(!Number.isInteger(rating)||rating<1||rating>5) return toast('Kies hoeveel sterren je het boek geeft');
  if(reaction.length<3) return toast('Vertel in een paar woorden iets over het boek');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(readAt)) return toast('Kies een geldige leesdatum');
  if(!selectedQuestion) chooseQuestion();

  saving=true;
  const saveBtn=document.getElementById('snBiebSave73');
  if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Boek wordt in je kast gezet…';}
  const bookId=createBookId();
  const ext=String(selectedCover.blob.type||'').includes('jpeg')?'jpg':'webp';
  const path=`bieb/covers/${currentUser.uid}/${bookId}.${ext}`;
  const imageRef=storageRef(storage,path);
  const userRef=doc(db,'users',currentUser.uid);
  let uploaded=false;
  let beforeCount=books.length;

  try{
    // Eerst de privé-kaft opslaan. Pas daarna wordt het boek zichtbaar in de boekenkast.
    await uploadBytes(imageRef,selectedCover.blob,{
      contentType:selectedCover.blob.type||'image/webp',
      cacheControl:'private,max-age=604800'
    });
    uploaded=true;

    const metadata={
      id:bookId,
      title,
      question:selectedQuestion.slice(0,120),
      reaction,
      rating,
      readAt,
      coverPath:path,
      createdAt:new Date().toISOString(),
      version:1
    };

    await runTransaction(db,async tx=>{
      const snap=await tx.get(userRef);
      const current=Array.isArray(snap.data()?.biebBooks)?snap.data().biebBooks.filter(x=>x&&typeof x==='object'):[];
      if(current.length>=MAX_BOOKS) throw new Error('BIEB_MAX_BOOKS');
      const duplicate=current.some(b=>String(b.title||'').trim().toLocaleLowerCase('nl-NL')===title.toLocaleLowerCase('nl-NL'));
      if(duplicate) throw new Error('BIEB_DUPLICATE');
      beforeCount=current.length;
      tx.set(userRef,{
        biebBooks:[...current,metadata],
        biebUpdatedAt:new Date().toISOString()
      },{merge:true});
    });

    const newCount=beforeCount+1;
    closeAddForm();
    toast('Boek staat in je Bieb 📚');
    if(newCount>0&&newCount%2===0) setTimeout(()=>showReward(newCount),260);
    setTimeout(()=>document.getElementById('snBiebShelf73')?.scrollIntoView({behavior:'smooth',block:'start'}),330);
  }catch(err){
    console.error('Snazzle Bieb boek opslaan',err);
    if(uploaded){try{await deleteObject(imageRef);}catch{}}
    if(err?.message==='BIEB_DUPLICATE') toast('Dit boek staat al in jouw Bieb 📚');
    else if(err?.message==='BIEB_MAX_BOOKS') toast('Je Bieb zit vol met 200 boeken. Wat een leesprestatie!');
    else if(/storage\/(unauthorized|object-not-found)/i.test(String(err?.code||''))) toast('De kaft kon nog niet privé worden opgeslagen. Probeer het zo nog eens.');
    else toast('Het boek kon nog niet worden opgeslagen. Probeer het opnieuw.');
  }finally{
    saving=false;
    if(saveBtn){saveBtn.disabled=false;saveBtn.textContent='Boek in mijn kast ✓';}
  }
}

async function removeBook(id){
  const book=books.find(b=>b.id===id);
  if(!book||!currentUser) return;
  const ok=window.confirm(`Wil je “${book.title}” echt uit je Bieb verwijderen?`);
  if(!ok) return;
  try{
    const userRef=doc(db,'users',currentUser.uid);
    let removed=false;
    await runTransaction(db,async tx=>{
      const snap=await tx.get(userRef);
      const current=Array.isArray(snap.data()?.biebBooks)?snap.data().biebBooks.filter(x=>x&&typeof x==='object'):[];
      const next=current.filter(item=>String(item.id||'')!==String(id));
      removed=next.length!==current.length;
      if(removed){
        tx.set(userRef,{biebBooks:next,biebUpdatedAt:new Date().toISOString()},{merge:true});
      }
    });
    if(removed&&book.coverPath){
      try{await deleteObject(storageRef(storage,book.coverPath));}catch(err){console.warn('Snazzle Bieb kaft opruimen',err);}
    }
    coverUrls.delete(id);
    toast(removed?'Boek uit je Bieb verwijderd':'Dit boek stond al niet meer in je Bieb');
  }catch(err){
    console.error('Snazzle Bieb boek verwijderen',err);
    toast('Verwijderen lukte niet');
  }
}

function showReward(total){
  const overlay=document.getElementById('snBiebReward73');
  if(!overlay) return;
  const reward=rewardFor(total);
  document.getElementById('snBiebRewardIcon73').textContent=reward.icon;
  document.getElementById('snBiebRewardTitle73').textContent=`${reward.name} ontgrendeld!`;
  document.getElementById('snBiebRewardText73').textContent=`Je hebt ${total} boeken in je Bieb. Dat is Leesveer ${Math.floor(total/2)} — en je leeshoek is weer een stukje rijker.`;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
}
function closeReward(){
  const overlay=document.getElementById('snBiebReward73');
  if(!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
}

function renderRoom(total){
  const box=document.getElementById('snBiebRoomItems73');
  if(!box) return;
  box.innerHTML=ROOM_REWARDS.map(r=>`<div class="sn-bieb-room-item ${total>=r.at?'on':''}" title="${esc(r.name)}"><b>${r.icon}</b><span>${esc(r.name)}</span></div>`).join('');
  const next=nextReward(total);
  const target=next.at;
  const start=Math.max(0,target-2);
  const progress=Math.max(0,Math.min(100,((total-start)/2)*100));
  const remaining=Math.max(0,target-total);
  document.getElementById('snBiebRoomHint73').textContent=remaining===1?`Nog 1 boek tot ${next.name}`:`Nog ${remaining} boeken tot ${next.name}`;
  document.getElementById('snBiebProgressText73').textContent=`${total-start} van 2 boeken`;
  document.getElementById('snBiebProgressReward73').textContent=`${next.icon} ${next.name}`;
  document.getElementById('snBiebProgressFill73').style.width=`${progress}%`;
}

function cleanupUnusedCoverUrls(){
  const ids=new Set(books.map(b=>b.id));
  for(const id of coverUrls.keys()) if(!ids.has(id)) coverUrls.delete(id);
}
async function loadPrivateCover(book,img){
  if(!img||!book) return;
  if(!book.coverPath) return;
  const cached=coverUrls.get(book.id);
  if(cached?.path===book.coverPath&&cached.url){
    if(img.getAttribute('src')!==cached.url) img.src=cached.url;
    return;
  }
  try{
    const url=await getDownloadURL(storageRef(storage,book.coverPath));
    coverUrls.set(book.id,{path:book.coverPath,url});
    if(document.contains(img)&&img.dataset.bookId===book.id) img.src=url;
  }catch(err){
    console.warn('Snazzle Bieb privé kaft laden',err);
    img.closest('.sn-bieb-cover')?.classList.add('missing');
  }
}

function renderShelf(){
  const shelf=document.getElementById('snBiebShelf73');
  if(!shelf) return;
  cleanupUnusedCoverUrls();
  if(!books.length){
    shelf.innerHTML='<div class="sn-bieb-empty">Je kast is nog leeg. Zet je eerste uitgelezen boek erin en begin je eigen Snazzle-Bieb.</div>';
    return;
  }
  shelf.innerHTML=books.map(book=>`
    <article class="sn-bieb-book">
      <div class="sn-bieb-cover"><span class="sn-bieb-cover-placeholder">📖 Kaft wordt klaargezet…</span><img data-book-id="${esc(book.id)}" alt="Kaft van ${esc(book.title)}" loading="lazy" decoding="async"></div>
      <div class="sn-bieb-book-body"><h3>${esc(book.title)}</h3><div class="sn-bieb-book-meta">Uitgelezen ${esc(formatDate(book.readAt))}</div><div class="sn-bieb-stars" aria-label="${Number(book.rating)||0} van 5 sterren">${'⭐'.repeat(Math.max(0,Math.min(5,Number(book.rating)||0)))}</div><div class="sn-bieb-reaction">“${esc(book.reaction||'')}”</div><button class="sn-bieb-delete" type="button" data-bieb-delete="${esc(book.id)}">Uit mijn kast verwijderen</button></div>
    </article>`).join('');
  shelf.querySelectorAll('[data-bieb-delete]').forEach(btn=>btn.addEventListener('click',()=>removeBook(btn.dataset.biebDelete)));
  shelf.querySelectorAll('img[data-book-id]').forEach(img=>{
    const book=books.find(b=>b.id===img.dataset.bookId);
    if(book) loadPrivateCover(book,img);
  });
}

function renderBieb(){
  if(!document.getElementById('snBiebOverlay73')) return;
  const total=books.length;
  const next=nextReward(total);
  document.getElementById('snBiebBookCount73').textContent=String(total);
  document.getElementById('snBiebFeatherCount73').textContent=String(Math.floor(total/2));
  document.getElementById('snBiebNextCount73').textContent=String(next.at);
  document.getElementById('snBiebShelfCount73').textContent=`${total} gelezen`;
  document.getElementById('snBiebRoomName73').textContent=nickname();
  renderRoom(total);
  renderShelf();
}

function stopListener(){
  try{stopBooksListener?.();}catch{}
  stopBooksListener=null;
}
function startBooksListener(user){
  stopListener();
  books=[];
  renderBieb();
  if(!user) return;
  const userRef=doc(db,'users',user.uid);
  stopBooksListener=onSnapshot(userRef,snapshot=>{
    const raw=Array.isArray(snapshot.data()?.biebBooks)?snapshot.data().biebBooks:[];
    books=raw
      .filter(item=>item&&typeof item==='object'&&String(item.id||'')&&String(item.title||''))
      .map(item=>({
        id:String(item.id),
        title:String(item.title||'').slice(0,80),
        question:String(item.question||'').slice(0,120),
        reaction:String(item.reaction||'').slice(0,180),
        rating:Math.max(1,Math.min(5,Number(item.rating)||1)),
        readAt:String(item.readAt||'').slice(0,10),
        coverPath:String(item.coverPath||''),
        createdAt:String(item.createdAt||''),
        version:Number(item.version)||1
      }))
      .sort((a,b)=>String(b.readAt||b.createdAt||'').localeCompare(String(a.readAt||a.createdAt||'')));
    renderBieb();
  },err=>{
    console.warn('Snazzle Bieb laden',err);
    toast('De Bieb kon nog niet met de cloud verbinden');
  });
}

function init(){
  ensureBiebUI();
  const observer=new MutationObserver(()=>{
    ensureHomeEntry();
    ensureQuickMenuEntry();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  onAuthStateChanged(auth,user=>{
    currentUser=user||null;
    startBooksListener(currentUser);
    renderBieb();
  });
  console.info(`Snazzle Bieb ${VERSION} geladen`);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

window.SnazzleBiebV73={open:openBieb,render:renderBieb};
