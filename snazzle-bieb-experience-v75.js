// Snazzle v75 — rustige belevingslaag voor De Bieb.
// Verfijnt alleen de presentatie: leeshoek, bibliothecaris, boekdetail, leesweetjes en lokale bieb-locaties.
// Geen eindeloze transform-animaties: de eerdere stabiliteitsfixes blijven leidend.

const VERSION='75.0.0';

const LIBRARIES=[
  {
    place:'Montfort',icon:'🏡',name:'BIEB Mofert',address:'De Vaert 15, 6065 CX Montfort',hours:'Woensdag 10.00 – 12.00 uur',
    note:'Bibliorura organiseert daarnaast ook activiteiten in Dörpshoes Montfort, Markt 14. Kijk voor een activiteit altijd even in de actuele agenda.',
    route:'https://www.google.com/maps/search/?api=1&query=De+Vaert+15+6065+CX+Montfort'
  },
  {
    place:'Herkenbosch',icon:'📚',name:'Open Bieb',address:'Bosscherhof 1, 6075 HE Herkenbosch',hours:'Woensdag en vrijdag 14.30 – 17.00 uur',
    route:'https://www.google.com/maps/search/?api=1&query=Bosscherhof+1+6075+HE+Herkenbosch'
  },
  {
    place:'Melick',icon:'📖',name:'Aaj Bieb',address:'Markt 70, 6074 BB Melick',hours:'Vrijdag 14.00 – 15.00 uur',
    note:'Deze vrijwilligersbieb is volgens Bibliorura geen afhaalpunt voor gereserveerde Bibliorura-boeken.',
    route:'https://www.google.com/maps/search/?api=1&query=Markt+70+6074+BB+Melick'
  },
  {
    place:'Posterholt',icon:'📗',name:'Bieb Postert',address:'Nieuw Holsterweg 27, 6061 EG Posterholt',hours:'Dinsdag en donderdag 13.30 – 15.30 uur · laatste zaterdag van de maand 14.00 – 15.00 uur',
    route:'https://www.google.com/maps/search/?api=1&query=Nieuw+Holsterweg+27+6061+EG+Posterholt'
  },
  {
    place:'Sint Odiliënberg',icon:'📘',name:'Berger Bieb',address:'Schaapsweg 24, 6077 CG Sint Odiliënberg',hours:'Dinsdag 16.00 – 17.00 uur · donderdag 15.00 – 16.00 uur',
    route:'https://www.google.com/maps/search/?api=1&query=Schaapsweg+24+6077+CG+Sint+Odilienberg'
  },
  {
    place:'Vlodrop',icon:'📙',name:'Blokhutbib',address:'Koebroekweg 3, 6063 AS Vlodrop',hours:'Maandag 10.00 – 12.00 uur · woensdag 14.00 – 16.00 uur',
    route:'https://www.google.com/maps/search/?api=1&query=Koebroekweg+3+6063+AS+Vlodrop'
  },
  {
    place:'Swalmen',icon:'📕',name:'De Laeskamer',address:'Markt 3, 6071 JD Swalmen',hours:'Maandag en woensdag 10.00 – 12.00 uur · dinsdag en donderdag 14.00 – 16.00 uur',
    nearby:true,route:'https://www.google.com/maps/search/?api=1&query=Markt+3+6071+JD+Swalmen'
  },
  {
    place:'Roermond',icon:'🏛️',name:'Stadsbibliotheek Bibliorura',address:'Neerstraat 11-13, 6041 KA Roermond',hours:'Ma 13.00 – 18.00 · di 11.00 – 20.00 · wo-vr 11.00 – 18.00 · za 10.00 – 17.00 · zo 13.00 – 17.00',
    nearby:true,route:'https://www.google.com/maps/search/?api=1&query=Neerstraat+11-13+6041+KA+Roermond'
  }
];

const FACTS=[
  ['🎬','Je hoofd is de regisseur','Tijdens het lezen maak je zelf beelden van personen, plekken en avonturen.'],
  ['🗣️','Woorden groeien mee','In verhalen kom je ongemerkt nieuwe woorden en manieren van vertellen tegen.'],
  ['🎯','Aandacht krijgt training','Een verhaal volgen helpt je om rustig bij één ding te blijven.'],
  ['❤️','Je kijkt door andere ogen','Verhalen laten je voelen en begrijpen hoe iemand anders iets kan beleven.'],
  ['🌙','Een rustig leesmoment','Even lezen kan een fijne overgang zijn van een drukke dag naar een rustiger moment.'],
  ['🚀','Boeken brengen je overal','Een boek kan je meenemen naar een andere tijd, een ander land of een compleet verzonnen wereld.']
];

function esc(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function installStyles(){
  if(document.getElementById('snBiebExperienceStyles75')) return;
  const style=document.createElement('style');
  style.id='snBiebExperienceStyles75';
  style.textContent=`
    .sn-bieb-librarian75{margin-top:14px;border:2px solid rgba(255,225,139,.4);border-radius:19px;padding:12px 13px;background:linear-gradient(135deg,rgba(70,41,24,.92),rgba(36,76,48,.94));display:grid;grid-template-columns:58px 1fr;gap:12px;align-items:center;box-shadow:0 5px 0 rgba(29,18,12,.55);contain:layout paint}
    .sn-bieb-librarian-avatar75{width:58px;height:58px;border-radius:18px;background:#f6d875;border:3px solid #8e6232;display:grid;place-items:center;font-size:34px;position:relative;overflow:hidden}
    .sn-bieb-librarian-avatar75:after{content:'👓';position:absolute;font-size:25px;left:16px;top:13px;pointer-events:none}
    .sn-bieb-librarian75 strong{display:block;color:#ffe58b;font-size:16px}.sn-bieb-librarian75 span{display:block;color:#eef3d9;font-size:12px;line-height:1.4;font-weight:720;margin-top:3px}

    .sn-bieb-room-scene75{height:164px;margin:14px 0 12px;border:2px solid rgba(103,70,37,.52);border-radius:17px;position:relative;overflow:hidden;background:linear-gradient(180deg,#d9ecdf 0 46%,#efddb1 46% 78%,#83583a 78%);box-shadow:inset 0 0 0 4px rgba(255,255,255,.16);contain:layout paint}
    .sn-bieb-window75{position:absolute;left:14px;top:14px;width:67px;height:59px;border:7px solid #765031;border-radius:7px;background:linear-gradient(145deg,#79b7d8,#dff4d1);box-shadow:inset 0 0 0 2px rgba(255,255,255,.55)}
    .sn-bieb-window75:before,.sn-bieb-window75:after{content:'';position:absolute;background:#765031}.sn-bieb-window75:before{width:5px;top:0;bottom:0;left:26px}.sn-bieb-window75:after{height:5px;left:0;right:0;top:23px}
    .sn-bieb-shelfscene75{position:absolute;right:12px;top:16px;width:116px;height:80px;border:6px solid #70472c;border-radius:6px;background:repeating-linear-gradient(90deg,#c45b48 0 13px,#e2b44e 13px 25px,#4e7d67 25px 38px,#5d6fa6 38px 51px);box-shadow:inset 0 -8px 0 #70472c}
    .sn-bieb-rug75{position:absolute;left:50%;bottom:8px;width:150px;height:38px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse,#e8b951 0 42%,#b56a42 43% 68%,#5f7f57 69%);opacity:.92}
    .sn-bieb-duck75{position:absolute;left:50%;bottom:25px;transform:translateX(-50%);font-size:52px;filter:drop-shadow(0 3px 1px rgba(0,0,0,.25));z-index:3}
    .sn-bieb-duck75:after{content:'👓';position:absolute;font-size:24px;left:14px;top:5px}
    .sn-bieb-room-object75{position:absolute;font-size:31px;opacity:.18;filter:grayscale(1);transition:opacity .18s ease,filter .18s ease}.sn-bieb-room-object75.on{opacity:1;filter:none}
    .sn-bieb-room-object75[data-at='2']{left:8px;bottom:19px}.sn-bieb-room-object75[data-at='4']{right:8px;bottom:18px}.sn-bieb-room-object75[data-at='6']{left:75px;bottom:11px}.sn-bieb-room-object75[data-at='8']{right:77px;top:82px}.sn-bieb-room-object75[data-at='10']{left:50%;top:8px;transform:translateX(-50%)}
    .sn-bieb-room-status75{position:absolute;left:9px;right:9px;bottom:7px;text-align:center;font-size:9px;font-weight:950;color:#39251b;z-index:4;pointer-events:none}

    .sn-bieb-factspot75{border:2px solid rgba(255,220,120,.3);border-radius:18px;padding:13px;background:linear-gradient(135deg,rgba(255,244,201,.12),rgba(98,142,83,.13));display:grid;grid-template-columns:46px 1fr;gap:10px;align-items:center;cursor:pointer;margin-bottom:10px}
    .sn-bieb-factspot75 b{font-size:32px;text-align:center}.sn-bieb-factspot75 strong{display:block;color:#ffe287;font-size:14px}.sn-bieb-factspot75 span{display:block;color:#e1ebd8;font-size:11px;line-height:1.4;font-weight:720;margin-top:3px}.sn-bieb-factspot75 small{display:block;color:#b9d1ad;font-size:9px;margin-top:6px;font-weight:800}

    .sn-bieb-locations75{display:grid;gap:8px}.sn-bieb-location75{border:2px solid rgba(255,226,151,.28);border-radius:16px;background:rgba(255,255,255,.07);overflow:hidden}.sn-bieb-location75 summary{list-style:none;display:grid;grid-template-columns:38px 1fr auto;gap:9px;align-items:center;padding:11px;cursor:pointer}.sn-bieb-location75 summary::-webkit-details-marker{display:none}.sn-bieb-location75 summary b{font-size:25px;text-align:center}.sn-bieb-location75 summary strong{display:block;color:#ffe083;font-size:13px}.sn-bieb-location75 summary span{display:block;color:#d7e8ce;font-size:10px;font-weight:760;margin-top:2px}.sn-bieb-location75 summary em{font-style:normal;color:#ffd55e;font-size:18px}
    .sn-bieb-location-body75{padding:0 12px 12px 59px;color:#eaf0df;font-size:11px;line-height:1.45}.sn-bieb-location-body75 p{margin:5px 0}.sn-bieb-location-note75{color:#c9d9bf;font-size:10px}.sn-bieb-route75{display:inline-flex;align-items:center;gap:6px;margin-top:7px;padding:8px 10px;border-radius:11px;background:#f0c653;color:#342416!important;font-weight:950;text-decoration:none!important}
    .sn-bieb-location-sub75{margin:12px 2px 7px;color:#dcebd4;font-size:11px;font-weight:950;letter-spacing:.2px}.sn-bieb-source75{margin-top:9px;font-size:9px;color:#aeca9f;line-height:1.4}.sn-bieb-source75 a{color:#f6d26c;font-weight:900}

    .sn-bieb-detail75{position:fixed;inset:0;z-index:7900;display:none;place-items:center;padding:18px;background:rgba(4,20,13,.86);backdrop-filter:blur(4px)}.sn-bieb-detail75.show{display:grid}.sn-bieb-detail-card75{width:min(100%,430px);max-height:84vh;overflow:auto;border:3px solid #9e713b;border-radius:22px;background:linear-gradient(180deg,#f5e1ad,#e7c986);color:#332318;box-shadow:0 10px 32px rgba(0,0,0,.38);padding:14px;position:relative}.sn-bieb-detail-close75{position:absolute;right:10px;top:10px;width:42px;height:42px;border:0;border-radius:13px;background:#70482d;color:#fff;font-size:22px;font-weight:1000}.sn-bieb-detail-cover75{height:260px;border-radius:15px;background:#6e5436;overflow:hidden;display:grid;place-items:center;margin-bottom:12px}.sn-bieb-detail-cover75 img{width:100%;height:100%;object-fit:contain;background:#222}.sn-bieb-detail-card75 h3{font-size:22px;margin:4px 50px 4px 0}.sn-bieb-detail-meta75{font-size:11px;color:#6b4d2d;font-weight:800}.sn-bieb-detail-stars75{font-size:19px;margin:7px 0}.sn-bieb-detail-reaction75{padding:11px;border-radius:13px;background:rgba(255,255,255,.42);font-weight:800;line-height:1.45;font-size:12px}

    .sn-bieb-book{cursor:pointer}.sn-bieb-book:focus-visible{outline:3px solid #ffdc6b;outline-offset:3px}
    @media (max-width:380px){.sn-bieb-room-scene75{height:150px}.sn-bieb-shelfscene75{width:96px}.sn-bieb-librarian75{grid-template-columns:52px 1fr}.sn-bieb-librarian-avatar75{width:52px;height:52px}}
  `;
  document.head.appendChild(style);
}

function bookCount(){
  const n=Number(document.getElementById('snBiebBookCount73')?.textContent||0);
  return Number.isFinite(n)&&n>=0?n:0;
}

function ensureLibrarian(overlay){
  if(document.getElementById('snBiebLibrarian75')) return;
  const hero=overlay.querySelector('.sn-bieb-hero');
  if(!hero) return;
  const card=document.createElement('div');
  card.id='snBiebLibrarian75';
  card.className='sn-bieb-librarian75';
  card.innerHTML='<div class="sn-bieb-librarian-avatar75">🦆</div><div><strong>Professor Kwak leest mee</strong><span id="snBiebLibrarianText75">Zet je eerste uitgelezen boek in de kast. Daarna begint je leeshoek te groeien.</span></div>';
  hero.insertAdjacentElement('afterend',card);
}

function ensureRoomScene(overlay){
  if(document.getElementById('snBiebRoomScene75')) return;
  const room=overlay.querySelector('.sn-bieb-room');
  const items=room?.querySelector('.sn-bieb-room-items');
  if(!room||!items) return;
  const scene=document.createElement('div');
  scene.id='snBiebRoomScene75';
  scene.className='sn-bieb-room-scene75';
  scene.innerHTML=`
    <div class="sn-bieb-window75"></div><div class="sn-bieb-shelfscene75"></div><div class="sn-bieb-rug75"></div>
    <div class="sn-bieb-room-object75" data-at="2" title="Verhalenplant">🌱</div>
    <div class="sn-bieb-room-object75" data-at="4" title="Leeslamp">💡</div>
    <div class="sn-bieb-room-object75" data-at="6" title="Voorleesstoel">🪑</div>
    <div class="sn-bieb-room-object75" data-at="8" title="Geheime Bieb-lade">🗝️</div>
    <div class="sn-bieb-room-object75" data-at="10" title="Gouden Lees-Snazzle">✨</div>
    <div class="sn-bieb-duck75">🦆</div><div class="sn-bieb-room-status75" id="snBiebRoomStatus75"></div>`;
  items.insertAdjacentElement('beforebegin',scene);
}

let factIndex=0;
function renderFact(){
  const box=document.getElementById('snBiebFactSpot75');
  if(!box) return;
  const [icon,title,text]=FACTS[factIndex%FACTS.length];
  box.innerHTML=`<b>${icon}</b><div><strong>${esc(title)}</strong><span>${esc(text)}</span><small>Tik voor nog een leesweetje ↻</small></div>`;
}

function ensureFactSpot(overlay){
  if(document.getElementById('snBiebFactSpot75')) return;
  const facts=overlay.querySelector('.sn-bieb-facts');
  if(!facts) return;
  const box=document.createElement('div');
  box.id='snBiebFactSpot75';box.className='sn-bieb-factspot75';box.tabIndex=0;box.setAttribute('role','button');box.setAttribute('aria-label','Toon een ander leesweetje');
  box.addEventListener('click',()=>{factIndex=(factIndex+1)%FACTS.length;renderFact();});
  box.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();box.click();}});
  facts.insertAdjacentElement('beforebegin',box);renderFact();
}

function locationMarkup(item){
  return `<details class="sn-bieb-location75"><summary><b>${item.icon}</b><div><strong>${esc(item.place)} · ${esc(item.name)}</strong><span>${esc(item.address)}</span></div><em>⌄</em></summary><div class="sn-bieb-location-body75"><p><strong>🕒 ${esc(item.hours)}</strong></p>${item.note?`<p class="sn-bieb-location-note75">${esc(item.note)}</p>`:''}<a class="sn-bieb-route75" href="${esc(item.route)}" target="_blank" rel="noopener noreferrer">📍 Route bekijken</a></div></details>`;
}

function ensureLocations(overlay){
  if(document.getElementById('snBiebLocations75')) return;
  const missions=overlay.querySelector('.sn-bieb-missions')?.closest('.sn-bieb-section');
  if(!missions) return;
  const section=document.createElement('section');
  section.id='snBiebLocations75';section.className='sn-bieb-section';
  const local=LIBRARIES.filter(x=>!x.nearby).map(locationMarkup).join('');
  const nearby=LIBRARIES.filter(x=>x.nearby).map(locationMarkup).join('');
  section.innerHTML=`<div class="sn-bieb-section-head"><h2>📍 Waar is een Bieb?</h2><small>Roerdalen & dichtbij</small></div><div class="sn-bieb-locations75">${local}<div class="sn-bieb-location-sub75">Ook vlakbij Roerdalen</div>${nearby}</div><div class="sn-bieb-source75">Locaties en tijden gecontroleerd bij Bibliotheek Bibliorura in augustus 2026. Openingstijden kunnen wijzigen. <a href="https://bibliorura.nl/service/afhaalpunten-vrijwilligersbibliotheken" target="_blank" rel="noopener noreferrer">Bekijk actuele Roerdalen-info</a> · <a href="https://bibliorura.nl/service/openingstijden" target="_blank" rel="noopener noreferrer">Roermond</a></div>`;
  missions.insertAdjacentElement('afterend',section);
}

function ensureDetail(overlay){
  if(document.getElementById('snBiebDetail75')) return;
  const detail=document.createElement('div');
  detail.id='snBiebDetail75';detail.className='sn-bieb-detail75';detail.setAttribute('aria-hidden','true');
  detail.innerHTML='<div class="sn-bieb-detail-card75" role="dialog" aria-modal="true" aria-label="Boek bekijken"><button type="button" class="sn-bieb-detail-close75" aria-label="Sluiten">×</button><div class="sn-bieb-detail-cover75" id="snBiebDetailCover75">📖</div><h3 id="snBiebDetailTitle75"></h3><div class="sn-bieb-detail-meta75" id="snBiebDetailMeta75"></div><div class="sn-bieb-detail-stars75" id="snBiebDetailStars75"></div><div class="sn-bieb-detail-reaction75" id="snBiebDetailReaction75"></div></div>';
  overlay.appendChild(detail);
  const close=()=>{detail.classList.remove('show');detail.setAttribute('aria-hidden','true');};
  detail.querySelector('.sn-bieb-detail-close75')?.addEventListener('click',close);
  detail.addEventListener('click',e=>{if(e.target===detail)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&detail.classList.contains('show'))close();});
}

function openBookDetail(card){
  const detail=document.getElementById('snBiebDetail75');
  if(!detail) return;
  const img=card.querySelector('.sn-bieb-cover img');
  const cover=document.getElementById('snBiebDetailCover75');
  if(cover) cover.innerHTML=img?.src?`<img src="${esc(img.src)}" alt="Boekkaft">`:'📖';
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value||'';};
  set('snBiebDetailTitle75',card.querySelector('h3')?.textContent?.trim()||'Mijn boek');
  set('snBiebDetailMeta75',card.querySelector('.sn-bieb-book-meta')?.textContent?.trim()||'');
  set('snBiebDetailStars75',card.querySelector('.sn-bieb-stars')?.textContent?.trim()||'');
  set('snBiebDetailReaction75',card.querySelector('.sn-bieb-reaction')?.textContent?.trim()||'');
  detail.classList.add('show');detail.setAttribute('aria-hidden','false');detail.querySelector('.sn-bieb-detail-close75')?.focus();
}

function bindBooks(overlay){
  if(overlay.dataset.snBiebV75Books==='1') return;
  overlay.dataset.snBiebV75Books='1';
  overlay.addEventListener('click',e=>{
    if(e.target.closest('.sn-bieb-delete')) return;
    const card=e.target.closest('.sn-bieb-book');
    if(card) openBookDetail(card);
  });
  overlay.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ') return;
    const card=e.target.closest?.('.sn-bieb-book');
    if(!card||e.target.closest('.sn-bieb-delete')) return;
    e.preventDefault();openBookDetail(card);
  });
}

function makeBooksFocusable(overlay){
  overlay.querySelectorAll('.sn-bieb-book').forEach(card=>{
    if(!card.hasAttribute('tabindex')) card.tabIndex=0;
    if(!card.hasAttribute('aria-label')){
      const title=card.querySelector('h3')?.textContent?.trim()||'boek';
      card.setAttribute('aria-label',`${title} bekijken`);
    }
  });
}

function updateExperience(){
  const n=bookCount();
  const librarian=document.getElementById('snBiebLibrarianText75');
  const roomStatus=document.getElementById('snBiebRoomStatus75');
  if(librarian){
    librarian.textContent=n===0?'Zet je eerste uitgelezen boek in de kast. Daarna begint je leeshoek te groeien.':n<2?'Mooi begin! Nog één boek en je eerste kamerverrassing verschijnt.':n<10?`Je hebt al ${n} boeken gelezen. Iedere twee boeken wordt je leeshoek een stukje rijker.`:`Wauw — ${n} boeken! Je hebt de Gouden Lees-Snazzle bereikt. Blijf vooral boeken kiezen die jij écht leuk vindt.`;
  }
  document.querySelectorAll('.sn-bieb-room-object75').forEach(el=>el.classList.toggle('on',n>=Number(el.dataset.at||999)));
  if(roomStatus){
    const next=n<2?2:n%2===0?n+2:n+1;
    roomStatus.textContent=n>=10?`${n} boeken · Gouden Lees-Snazzle ontgrendeld ✨`:`${n} gelezen · nog ${Math.max(0,next-n)} tot de volgende kamerverrassing`;
  }
  const overlay=document.getElementById('snBiebOverlay73');
  if(overlay) makeBooksFocusable(overlay);
}

function ensureAll(){
  installStyles();
  const overlay=document.getElementById('snBiebOverlay73');
  if(!overlay) return false;
  ensureLibrarian(overlay);ensureRoomScene(overlay);ensureFactSpot(overlay);ensureLocations(overlay);ensureDetail(overlay);bindBooks(overlay);updateExperience();
  const count=document.getElementById('snBiebBookCount73');
  if(count&&!count.dataset.snBiebV75Watch){
    count.dataset.snBiebV75Watch='1';
    new MutationObserver(updateExperience).observe(count,{childList:true,characterData:true,subtree:true});
  }
  const shelf=document.getElementById('snBiebShelf73');
  if(shelf&&!shelf.dataset.snBiebV75Watch){
    shelf.dataset.snBiebV75Watch='1';
    new MutationObserver(()=>{makeBooksFocusable(overlay);updateExperience();}).observe(shelf,{childList:true,subtree:true});
  }
  return true;
}

function init(){
  if(ensureAll()) console.info(`Snazzle Bieb experience ${VERSION} geladen`);
  const observer=new MutationObserver(()=>ensureAll());
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),15000);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
