// Snazzle Kids Fun: kleurplaten + spelletjes.
// Volledig lokaal in de app: geen extra Firebase-collecties nodig.

const FUN_VERSION = '1.0.0';
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

function svgDataUrl(svg){
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function baseColoringPage(title, body){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240 1754" role="img" aria-label="${title}">
    <rect width="1240" height="1754" fill="#fff"/>
    <g fill="none" stroke="#111" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
      <rect x="36" y="36" width="1168" height="1682" rx="42"/>
      <path d="M85 190 C220 115 355 115 490 190"/>
      <path d="M750 190 C885 115 1020 115 1155 190"/>
      ${body}
      <path d="M120 1550 C260 1485 390 1605 535 1538 C690 1466 835 1598 1120 1518"/>
      <circle cx="165" cy="1435" r="32"/><circle cx="1080" cy="1408" r="32"/>
      <path d="M148 1418 l17 -28 17 28 31 8-22 23 5 32-31-15-31 15 5-32-22-23z"/>
      <path d="M1063 1391 l17 -28 17 28 31 8-22 23 5 32-31-15-31 15 5-32-22-23z"/>
    </g>
    <g fill="#111" font-family="Arial, sans-serif" text-anchor="middle">
      <text x="620" y="105" font-size="48" font-weight="900">SNAZZLE KLEURPLAAT</text>
      <text x="620" y="1645" font-size="42" font-weight="800">${title}</text>
      <text x="620" y="1693" font-size="25">Samen naar buiten • Snazzle Hunt</text>
    </g>
  </svg>`;
}

function coloringSvg(theme){
  const duck = `
    <ellipse cx="595" cy="880" rx="315" ry="245"/>
    <circle cx="790" cy="595" r="150"/>
    <path d="M920 575 L1100 635 L920 700 Q850 635 920 575 Z"/>
    <circle cx="835" cy="555" r="18" fill="#111"/>
    <path d="M460 850 Q585 715 735 845 Q655 1010 490 990 Q420 925 460 850 Z"/>
    <path d="M380 1075 Q330 1195 255 1235 M520 1100 Q500 1225 430 1260"/>
    <path d="M230 1240 Q295 1205 355 1240 M395 1265 Q460 1230 525 1265"/>
  `;

  if(theme==='jungle'){
    return baseColoringPage('Jungle Snazzle', `
      ${duck}
      <path d="M155 390 Q80 555 185 740 Q260 610 210 470 Q185 425 155 390 Z"/>
      <path d="M250 350 Q175 515 285 700 Q365 565 310 425 Q285 380 250 350 Z"/>
      <path d="M1035 350 Q1115 510 1010 705 Q925 575 980 425 Q1005 380 1035 350 Z"/>
      <path d="M1090 455 Q1175 605 1060 780 Q985 665 1030 525 Q1052 485 1090 455 Z"/>
      <path d="M120 1040 Q210 930 305 1040 M915 1015 Q1010 905 1110 1025"/>
      <circle cx="230" cy="900" r="28"/><circle cx="1040" cy="880" r="28"/>
      <path d="M190 825 l40 -65 40 65 M1000 805 l40 -65 40 65"/>
    `);
  }

  if(theme==='treasure'){
    return baseColoringPage('Schatzoeker Snazzle', `
      ${duck}
      <path d="M675 470 Q790 385 910 470 L875 520 L700 520 Z"/>
      <path d="M740 470 L770 385 L830 385 L860 470"/>
      <path d="M130 390 L380 320 L460 500 L210 570 Z"/>
      <path d="M180 420 Q255 365 315 445 Q365 500 420 455"/>
      <path d="M245 490 l45 45 m0 -45 l-45 45"/>
      <circle cx="1030" cy="430" r="95"/>
      <path d="M1030 350 L1060 430 L1030 510 L1000 430 Z"/>
      <rect x="865" y="1125" width="255" height="165" rx="20"/>
      <path d="M865 1180 Q995 1085 1120 1180 M990 1125 V1290"/>
      <circle cx="990" cy="1210" r="18"/>
      <path d="M135 1215 Q250 1095 360 1215 L330 1320 L165 1320 Z"/>
      <circle cx="245" cy="1215" r="24"/>
    `);
  }

  return baseColoringPage('Kasteel Snazzle', `
    ${duck}
    <path d="M110 520 V880 H390 V520 L350 470 L310 520 L270 470 L230 520 L190 470 L150 520 Z"/>
    <path d="M860 470 V865 H1140 V470 L1100 420 L1060 470 L1020 420 L980 470 L940 420 L900 470 Z"/>
    <path d="M170 705 H330 V880 H170 Z M920 660 H1080 V865 H920 Z"/>
    <path d="M215 880 Q250 760 285 880 M965 865 Q1000 745 1035 865"/>
    <path d="M305 410 V255 L420 315 L305 370"/>
    <path d="M1005 360 V220 L1125 280 L1005 330"/>
    <path d="M720 430 Q795 350 875 430 L850 485 H745 Z"/>
    <path d="M795 350 V300 M755 325 H835"/>
    <circle cx="185" cy="1080" r="42"/><circle cx="1060" cy="1055" r="42"/>
    <path d="M185 1038 V1122 M143 1080 H227 M1060 1013 V1097 M1018 1055 H1102"/>
  `);
}

const coloringPages = [
  {id:'jungle', title:'Jungle Snazzle', subtitle:'Een Snazzle tussen bladeren en sterren.'},
  {id:'treasure', title:'Schatzoeker Snazzle', subtitle:'Met kaart, kompas en een schatkist.'},
  {id:'castle', title:'Kasteel Snazzle', subtitle:'Een koninklijk avontuur bij het kasteel.'}
];

function puzzleSvg(){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#30aa62"/><stop offset="1" stop-color="#075333"/></linearGradient>
      <linearGradient id="duck" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd84b"/><stop offset="1" stop-color="#ff9d22"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-opacity=".3"/></filter>
    </defs>
    <rect width="900" height="900" rx="55" fill="url(#bg)"/>
    <circle cx="125" cy="130" r="82" fill="#ffd84b" opacity=".95"/>
    <circle cx="770" cy="155" r="55" fill="#55c9ef" opacity=".85"/>
    <path d="M60 690 Q175 555 275 690 Q190 775 90 765Z" fill="#79c93c" opacity=".9"/>
    <path d="M670 650 Q790 500 865 665 Q775 775 690 745Z" fill="#8bd743" opacity=".9"/>
    <g filter="url(#shadow)">
      <ellipse cx="430" cy="535" rx="245" ry="190" fill="url(#duck)" stroke="#75451f" stroke-width="18"/>
      <circle cx="600" cy="335" r="125" fill="url(#duck)" stroke="#75451f" stroke-width="18"/>
      <path d="M700 330 L850 385 L700 440 Q650 385 700 330Z" fill="#ff7d2c" stroke="#75451f" stroke-width="16"/>
      <circle cx="635" cy="300" r="16" fill="#17251d"/>
      <circle cx="642" cy="294" r="5" fill="#fff"/>
      <path d="M325 515 Q430 400 550 505 Q485 640 350 625 Q300 575 325 515Z" fill="#f2bb2f" stroke="#75451f" stroke-width="14"/>
    </g>
    <g fill="#ffe66a">
      <path d="M110 300 l17 37 40 4-30 27 9 39-36-20-35 20 8-39-29-27 40-4z"/>
      <path d="M785 485 l14 31 34 3-25 23 7 33-30-17-31 17 7-33-25-23 35-3z"/>
      <path d="M160 560 l10 23 25 2-19 17 6 25-22-13-23 13 6-25-19-17 26-2z"/>
    </g>
    <g transform="translate(625 620)" filter="url(#shadow)">
      <circle cx="80" cy="80" r="72" fill="#f4e5bc" stroke="#704523" stroke-width="16"/>
      <path d="M80 18 L102 80 L80 142 L58 80Z" fill="#e74b3c"/>
      <circle cx="80" cy="80" r="10" fill="#704523"/>
    </g>
    <text x="450" y="820" text-anchor="middle" font-family="Arial,sans-serif" font-size="72" font-weight="900" fill="#fff5c9" stroke="#67401f" stroke-width="3">SNAZZLE!</text>
    <text x="450" y="865" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#fff5c9">PUZZEL AVONTUUR</text>
  </svg>`;
}
const PUZZLE_IMAGE = svgDataUrl(puzzleSvg());

const puzzle = {
  size: 3,
  order: [],
  selected: null,
  moves: 0,
  won: false
};

function injectStyles(){
  if($('#kidsFunStyles')) return;
  const style=document.createElement('style');
  style.id='kidsFunStyles';
  style.textContent=`
    .kids-fun-sheet{z-index:75}
    .kids-fun-sheet .panel{background:linear-gradient(180deg,#fff2b5 0%,#f1d487 100%);overflow-x:hidden}
    .kids-fun-hero{padding:15px;border-radius:20px;background:linear-gradient(135deg,#dff79b,#85db5c);border:3px solid #5a9d39;color:#24451d;box-shadow:0 5px 0 #5a7931;margin-bottom:14px;position:relative;overflow:hidden}
    .kids-fun-hero:after{content:'✨';position:absolute;right:14px;top:9px;font-size:34px;animation:kidsSpark 2s ease-in-out infinite}
    .kids-fun-hero strong{display:block;font-size:20px;margin-bottom:4px}.kids-fun-hero p{margin:0;font-weight:750;line-height:1.42;max-width:88%}
    .coloring-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .coloring-card{background:#fffaf0;border:3px solid #8b5b2d;border-radius:19px;overflow:hidden;box-shadow:0 5px 0 #68401f,0 8px 17px rgba(0,0,0,.12);color:#302217}
    .coloring-preview{aspect-ratio:.707/1;background:#fff;overflow:hidden;border-bottom:2px solid #c7aa76;cursor:zoom-in}.coloring-preview img{width:100%;height:100%;object-fit:cover;display:block}
    .coloring-body{padding:11px}.coloring-body strong{display:block;font-size:15px}.coloring-body small{display:block;min-height:34px;margin:4px 0 9px;color:#745638;font-weight:700;line-height:1.3}
    .coloring-actions{display:grid;gap:7px}.coloring-actions button{border:0;border-radius:12px;padding:9px;font-weight:950}.coloring-open{background:#55a53d;color:#fff;box-shadow:0 3px 0 #347528}.coloring-download{background:#ffd04a;color:#39250f;box-shadow:0 3px 0 #b8771f}
    .coloring-tip{margin-top:14px;padding:11px 12px;border-radius:15px;background:#fff7df;border:2px dashed #b59054;color:#604525;font-size:12px;font-weight:800;line-height:1.4}
    #coloringViewer{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(2,17,8,.92);backdrop-filter:blur(6px)}#coloringViewer.show{display:flex}
    .coloring-viewer-card{width:min(94vw,620px);max-height:94vh;display:flex;flex-direction:column;background:#fff0b7;border:4px solid #805128;border-radius:22px;overflow:hidden;box-shadow:0 18px 55px rgba(0,0,0,.5)}
    .coloring-viewer-head{display:flex;align-items:center;gap:10px;padding:10px 12px;color:#342318}.coloring-viewer-head strong{flex:1}.coloring-viewer-head button{width:44px;height:44px;border:0;border-radius:13px;background:#70472b;color:#fff;font-size:25px;font-weight:900}
    .coloring-viewer-img{background:#fff;min-height:0;overflow:auto;text-align:center}.coloring-viewer-img img{display:block;width:100%;height:auto;max-height:72vh;object-fit:contain;background:#fff}
    .coloring-viewer-download{border:0;margin:11px;border-radius:14px;padding:13px;background:linear-gradient(#6fc746,#42962f);color:#fff;font-weight:1000;box-shadow:0 4px 0 #2e7025}
    .games-intro{display:grid;grid-template-columns:70px 1fr;gap:12px;align-items:center;padding:13px;border-radius:18px;background:linear-gradient(135deg,#7cd9f3,#53aee3);border:3px solid #377fa9;color:#15394b;box-shadow:0 5px 0 #315e79;margin-bottom:13px}.games-intro .game-duck{font-size:48px;animation:kidsDuck 2.6s ease-in-out infinite}.games-intro strong{font-size:20px;display:block}.games-intro span{font-weight:760;line-height:1.35}
    .puzzle-card{padding:13px;border-radius:20px;background:#fff8df;border:3px solid #84542a;color:#332318;box-shadow:0 5px 0 #68401f}
    .puzzle-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}.puzzle-head h3{margin:0;flex:1}.puzzle-moves{padding:6px 9px;border-radius:99px;background:#e7f6bd;color:#355523;font-weight:950;font-size:12px}
    .puzzle-levels{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.puzzle-levels button{border:2px solid #b7935c;border-radius:12px;padding:9px;background:#fff2c8;color:#4d351d;font-weight:900}.puzzle-levels button.on{background:linear-gradient(#8bdc55,#5bb339);border-color:#4d8c31;color:#fff;box-shadow:0 3px 0 #387327}
    .puzzle-board{display:grid;gap:3px;aspect-ratio:1;border:5px solid #65401f;border-radius:17px;overflow:hidden;background:#173d29;box-shadow:inset 0 0 0 2px rgba(255,255,255,.18);touch-action:manipulation}
    .puzzle-tile{border:0;min-width:0;min-height:0;background-repeat:no-repeat;padding:0;position:relative;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.55);border-radius:0}.puzzle-tile:after{content:'';position:absolute;inset:0;border:2px solid rgba(81,48,20,.55);pointer-events:none}.puzzle-tile.selected{outline:6px solid #ffef63;outline-offset:-6px;z-index:2;filter:brightness(1.12)}
    .puzzle-help{font-size:12px;font-weight:800;line-height:1.4;color:#654a2c;margin:10px 0}.puzzle-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.puzzle-actions button{border:0;border-radius:13px;padding:11px;font-weight:950}.puzzle-shuffle{background:#f4ad35;color:#41280f;box-shadow:0 3px 0 #a9671a}.puzzle-preview-btn{background:#4f9d3d;color:#fff;box-shadow:0 3px 0 #317327}
    .game-coming{margin-top:13px;padding:13px;border-radius:18px;background:linear-gradient(135deg,#be78eb,#7d55ce);border:3px solid #6536a1;color:#fff;box-shadow:0 5px 0 #4e287e}.game-coming strong{display:block;font-size:17px}.game-coming small{font-weight:700;line-height:1.35}
    #puzzlePreview{position:fixed;inset:0;z-index:121;display:none;align-items:center;justify-content:center;background:rgba(2,17,8,.92);padding:18px}#puzzlePreview.show{display:flex}#puzzlePreview img{width:min(90vw,620px);height:auto;border-radius:22px;border:4px solid #f3cc68;box-shadow:0 18px 50px rgba(0,0,0,.5)}#puzzlePreview button{position:absolute;right:18px;top:18px;width:50px;height:50px;border:0;border-radius:15px;background:#70472b;color:#fff;font-size:28px;font-weight:900}
    .puzzle-win{display:none;margin-top:12px;padding:17px 12px;text-align:center;border-radius:18px;background:linear-gradient(135deg,#fff187,#ffbf3c);border:3px solid #bd7b1f;color:#46300e;position:relative;overflow:hidden}.puzzle-win.show{display:block;animation:kidsWin .35s ease-out}.puzzle-win .big{font-size:42px}.puzzle-win strong{display:block;font-size:23px}.puzzle-win span{font-weight:800}.puzzle-win button{margin-top:10px;border:0;border-radius:12px;padding:10px 13px;background:#47973a;color:#fff;font-weight:950}
    .mini-confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden}.mini-confetti i{position:absolute;top:-20px;font-style:normal;animation:kidsConfetti 1.7s ease-in forwards}
    @keyframes kidsSpark{0%,100%{transform:scale(.9) rotate(-8deg);opacity:.55}50%{transform:scale(1.15) rotate(8deg);opacity:1}}@keyframes kidsDuck{0%,100%{transform:translateY(2px) rotate(-3deg)}50%{transform:translateY(-5px) rotate(3deg)}}@keyframes kidsWin{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}@keyframes kidsConfetti{to{transform:translateY(300px) rotate(520deg);opacity:0}}
    @media(max-width:400px){.coloring-grid{grid-template-columns:1fr 1fr}.coloring-body{padding:9px}.coloring-body strong{font-size:13px}.coloring-body small{font-size:10px}.coloring-actions button{font-size:11px;padding:8px}.puzzle-card{padding:10px}}
    @media(prefers-reduced-motion:reduce){.kids-fun-hero:after,.games-intro .game-duck,.mini-confetti i{animation:none}}
  `;
  document.head.appendChild(style);
}

function ensureColoringViewer(){
  if($('#coloringViewer')) return;
  const viewer=document.createElement('div');
  viewer.id='coloringViewer';
  viewer.setAttribute('aria-hidden','true');
  viewer.innerHTML=`<div class="coloring-viewer-card" role="dialog" aria-modal="true" aria-label="Kleurplaat bekijken"><div class="coloring-viewer-head"><strong id="coloringViewerTitle">Kleurplaat</strong><button type="button" id="coloringViewerClose" aria-label="Sluiten">×</button></div><div class="coloring-viewer-img"><img id="coloringViewerImage" alt="Snazzle kleurplaat"></div><button type="button" class="coloring-viewer-download" id="coloringViewerDownload">⬇️ Download kleurplaat als PNG</button></div>`;
  document.body.appendChild(viewer);
  $('#coloringViewerClose').onclick=closeColoringViewer;
  viewer.addEventListener('click',e=>{ if(e.target===viewer) closeColoringViewer(); });
}

function ensurePuzzlePreview(){
  if($('#puzzlePreview')) return;
  const overlay=document.createElement('div');
  overlay.id='puzzlePreview';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`<button type="button" aria-label="Sluiten">×</button><img src="${PUZZLE_IMAGE}" alt="Voorbeeld van de Snazzle puzzel">`;
  document.body.appendChild(overlay);
  const close=()=>{overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');};
  overlay.querySelector('button').onclick=close;
  overlay.addEventListener('click',e=>{if(e.target===overlay) close();});
}

function ensureSheets(){
  if(!$('#coloringSheet')){
    const sheet=document.createElement('div');
    sheet.className='sheet kids-fun-sheet';
    sheet.id='coloringSheet';
    sheet.innerHTML=`<div class="panel"><button class="close kids-fun-close" type="button" aria-label="Sluiten">×</button><div class="handle"></div><h2>Snazzle Kleurplaten 🎨</h2><div class="kids-fun-hero"><strong>Pak je stiften erbij! 🖍️</strong><p>Kies een kleurplaat, bekijk hem groot en download hem gratis op je telefoon of tablet.</p></div><div class="coloring-grid" id="coloringGrid"></div><div class="coloring-tip">💡 Tip voor ouders: na het downloaden kun je de PNG vanuit je galerij of bestanden-app printen op A4.</div></div>`;
    document.body.appendChild(sheet);
  }
  if(!$('#gamesSheet')){
    const sheet=document.createElement('div');
    sheet.className='sheet kids-fun-sheet';
    sheet.id='gamesSheet';
    sheet.innerHTML=`<div class="panel"><button class="close kids-fun-close" type="button" aria-label="Sluiten">×</button><div class="handle"></div><h2>Snazzle Spelletjes 🎮</h2><div class="games-intro"><div class="game-duck">🦆</div><div><strong>Klaar voor een uitdaging?</strong><span>Maak de Snazzle weer compleet door twee puzzelstukjes na elkaar aan te tikken.</span></div></div><div class="puzzle-card"><div class="puzzle-head"><h3>🧩 Snazzle Puzzel</h3><span class="puzzle-moves" id="puzzleMoves">0 zetten</span></div><div class="puzzle-levels"><button type="button" data-puzzle-size="3" class="on">🌱 Makkelijk 3×3</button><button type="button" data-puzzle-size="4">🔥 Uitdaging 4×4</button></div><div class="puzzle-board" id="puzzleBoard" aria-label="Snazzle puzzel"></div><div class="puzzle-help">Tik eerst één stukje aan en daarna het stukje waarmee je wilt wisselen. Probeer zo de afbeelding weer helemaal goed te krijgen.</div><div class="puzzle-actions"><button type="button" class="puzzle-shuffle" id="puzzleShuffle">🔀 Opnieuw schudden</button><button type="button" class="puzzle-preview-btn" id="puzzleShowPreview">👀 Voorbeeld</button></div><div class="puzzle-win" id="puzzleWin"><div class="mini-confetti" id="puzzleConfetti"></div><div class="big">🎉🦆🎉</div><strong>SNAZZLE-TASTISCH!</strong><span id="puzzleWinText">Je hebt de puzzel opgelost!</span><button type="button" id="puzzleAgain">Nog een keer</button></div></div><div class="game-coming"><strong>🧠 Volgende spel: Snazzle Memory</strong><small>Hier kunnen we straks steeds nieuwe Snazzle-spelletjes aan toevoegen.</small></div></div>`;
    document.body.appendChild(sheet);
  }
  ensureColoringViewer();
  ensurePuzzlePreview();
}

function renderColoringPages(){
  const grid=$('#coloringGrid');
  if(!grid || grid.dataset.ready==='1') return;
  grid.dataset.ready='1';
  coloringPages.forEach(page=>{
    const svg=coloringSvg(page.id);
    const card=document.createElement('article');
    card.className='coloring-card';
    card.innerHTML=`<div class="coloring-preview" data-color-preview="${page.id}"><img src="${svgDataUrl(svg)}" alt="${page.title}"></div><div class="coloring-body"><strong>${page.title}</strong><small>${page.subtitle}</small><div class="coloring-actions"><button class="coloring-open" type="button" data-color-open="${page.id}">🔍 Groot bekijken</button><button class="coloring-download" type="button" data-color-download="${page.id}">⬇️ Download</button></div></div>`;
    grid.appendChild(card);
  });
  $$('[data-color-open], [data-color-preview]',grid).forEach(el=>el.addEventListener('click',()=>openColoringViewer(el.dataset.colorOpen||el.dataset.colorPreview)));
  $$('[data-color-download]',grid).forEach(el=>el.addEventListener('click',()=>downloadColoring(el.dataset.colorDownload)));
}

function openColoringViewer(id){
  const page=coloringPages.find(p=>p.id===id); if(!page) return;
  const viewer=$('#coloringViewer');
  $('#coloringViewerTitle').textContent=page.title;
  $('#coloringViewerImage').src=svgDataUrl(coloringSvg(page.id));
  $('#coloringViewerDownload').onclick=()=>downloadColoring(page.id);
  viewer.classList.add('show'); viewer.setAttribute('aria-hidden','false');
}
function closeColoringViewer(){ const viewer=$('#coloringViewer'); if(viewer){viewer.classList.remove('show');viewer.setAttribute('aria-hidden','true');} }

async function downloadColoring(id){
  const page=coloringPages.find(p=>p.id===id); if(!page) return;
  const svg=coloringSvg(id);
  const svgBlob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
  const svgUrl=URL.createObjectURL(svgBlob);
  const image=new Image();
  try{
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=svgUrl;});
    const canvas=document.createElement('canvas'); canvas.width=1240; canvas.height=1754;
    const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',1));
    if(!blob) throw new Error('PNG maken mislukt');
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`snazzle-kleurplaat-${id}.png`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    showFunToast('Kleurplaat wordt gedownload 🎨');
  }catch(err){
    console.warn('kleurplaat download',err);
    const a=document.createElement('a'); a.href=svgDataUrl(svg); a.download=`snazzle-kleurplaat-${id}.svg`; document.body.appendChild(a); a.click(); a.remove();
    showFunToast('Kleurplaat wordt gedownload 🎨');
  }finally{ URL.revokeObjectURL(svgUrl); }
}

function showFunToast(message){
  const toast=$('#toast');
  if(!toast){ alert(message); return; }
  toast.textContent=message; toast.classList.add('show');
  clearTimeout(window.__kidsFunToast);
  window.__kidsFunToast=setTimeout(()=>toast.classList.remove('show'),2600);
}

function closeQuickMenu(){
  const overlay=$('#quickMenuOverlay');
  if(overlay){overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');}
  $('#quickMenuBtn')?.setAttribute('aria-expanded','false');
  document.documentElement.style.overflow=''; document.body.style.overflow='';
}
function openFunSheet(id){
  closeQuickMenu();
  const sheet=$('#'+id); if(!sheet) return;
  sheet.classList.add('show');
  const panel=sheet.querySelector('.panel'); if(panel) panel.scrollTop=0;
  if(id==='gamesSheet' && !puzzle.order.length) newPuzzle(puzzle.size);
}
function closeFunSheet(sheet){
  sheet?.classList.remove('show');
  closeColoringViewer();
}

function injectMenuButtons(){
  const nav=$('.quick-menu-list');
  if(!nav || nav.querySelector('[data-snazzle-fun]')) return false;
  const coloring=document.createElement('button');
  coloring.type='button'; coloring.dataset.snazzleFun='coloring';
  coloring.innerHTML='<b>🎨</b><span><strong>Kleurplaten</strong><small>Gratis downloaden en kleuren</small></span><i>›</i>';
  const games=document.createElement('button');
  games.type='button'; games.dataset.snazzleFun='games';
  games.innerHTML='<b>🎮</b><span><strong>Spelletjes</strong><small>Speel de Snazzle Puzzel</small></span><i>›</i>';
  const before=nav.querySelector('[data-quick-action="event"]') || nav.querySelector('[data-quick-action="shop"]');
  if(before){ nav.insertBefore(coloring,before); nav.insertBefore(games,before); }
  else { nav.append(coloring,games); }
  coloring.onclick=()=>openFunSheet('coloringSheet');
  games.onclick=()=>openFunSheet('gamesSheet');
  return true;
}

function shuffledOrder(size){
  const total=size*size;
  let arr=[];
  do{
    arr=Array.from({length:total},(_,i)=>i);
    for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  }while(arr.every((v,i)=>v===i));
  return arr;
}
function newPuzzle(size=puzzle.size){
  puzzle.size=size; puzzle.order=shuffledOrder(size); puzzle.selected=null; puzzle.moves=0; puzzle.won=false;
  $('#puzzleWin')?.classList.remove('show');
  $$('.puzzle-levels [data-puzzle-size]').forEach(b=>b.classList.toggle('on',Number(b.dataset.puzzleSize)===size));
  renderPuzzle();
}
function renderPuzzle(){
  const board=$('#puzzleBoard'); if(!board) return;
  const size=puzzle.size;
  board.style.gridTemplateColumns=`repeat(${size},1fr)`;
  board.innerHTML='';
  puzzle.order.forEach((original,pos)=>{
    const tile=document.createElement('button');
    tile.type='button'; tile.className='puzzle-tile'+(puzzle.selected===pos?' selected':'');
    tile.setAttribute('aria-label',`Puzzelstuk ${pos+1}`);
    tile.style.backgroundImage=`url("${PUZZLE_IMAGE}")`;
    tile.style.backgroundSize=`${size*100}% ${size*100}%`;
    const col=original%size, row=Math.floor(original/size);
    const x=size===1?0:(col/(size-1))*100, y=size===1?0:(row/(size-1))*100;
    tile.style.backgroundPosition=`${x}% ${y}%`;
    tile.onclick=()=>tapPuzzleTile(pos);
    board.appendChild(tile);
  });
  const moves=$('#puzzleMoves'); if(moves) moves.textContent=`${puzzle.moves} ${puzzle.moves===1?'zet':'zetten'}`;
}
function tapPuzzleTile(pos){
  if(puzzle.won) return;
  if(puzzle.selected===null){ puzzle.selected=pos; renderPuzzle(); return; }
  if(puzzle.selected===pos){ puzzle.selected=null; renderPuzzle(); return; }
  const a=puzzle.selected; [puzzle.order[a],puzzle.order[pos]]=[puzzle.order[pos],puzzle.order[a]];
  puzzle.selected=null; puzzle.moves+=1; renderPuzzle();
  if(puzzle.order.every((v,i)=>v===i)) puzzleSolved();
}
function puzzleSolved(){
  puzzle.won=true;
  const box=$('#puzzleWin'); if(!box) return;
  $('#puzzleWinText').textContent=`Je hebt hem opgelost in ${puzzle.moves} ${puzzle.moves===1?'zet':'zetten'}!`;
  const confetti=$('#puzzleConfetti'); confetti.innerHTML='';
  const bits=['⭐','✨','🎉','🟡','🟢','🔵'];
  for(let i=0;i<30;i++){
    const bit=document.createElement('i'); bit.textContent=bits[i%bits.length]; bit.style.left=`${Math.random()*95}%`; bit.style.animationDelay=`${Math.random()*.45}s`; bit.style.animationDuration=`${1.2+Math.random()*.9}s`; confetti.appendChild(bit);
  }
  box.classList.add('show');
  setTimeout(()=>box.scrollIntoView({behavior:'smooth',block:'nearest'}),80);
}

function bindInteractions(){
  $$('.kids-fun-close').forEach(btn=>btn.onclick=()=>closeFunSheet(btn.closest('.sheet')));
  $$('.kids-fun-sheet').forEach(sheet=>sheet.addEventListener('click',e=>{if(e.target===sheet) closeFunSheet(sheet);}));
  $$('.puzzle-levels [data-puzzle-size]').forEach(btn=>btn.onclick=()=>newPuzzle(Number(btn.dataset.puzzleSize)||3));
  $('#puzzleShuffle').onclick=()=>newPuzzle(puzzle.size);
  $('#puzzleAgain').onclick=()=>newPuzzle(puzzle.size);
  $('#puzzleShowPreview').onclick=()=>{const o=$('#puzzlePreview');o.classList.add('show');o.setAttribute('aria-hidden','false');};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeColoringViewer(); const p=$('#puzzlePreview');p?.classList.remove('show');$$('.kids-fun-sheet.show').forEach(closeFunSheet);}});
}

function initKidsFun(){
  if(window.__snazzleKidsFunLoaded) return;
  window.__snazzleKidsFunLoaded=true;
  injectStyles(); ensureSheets(); renderColoringPages(); bindInteractions(); injectMenuButtons();
  const observer=new MutationObserver(()=>injectMenuButtons());
  observer.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initKidsFun,{once:true}); else initKidsFun();

console.info(`Snazzle Kids Fun ${FUN_VERSION} geladen`);
