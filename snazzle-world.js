// Snazzle World — magical ambient surprises, Snazzle TV and nature knowledge.
// Keeps the Hunt central: surprises never block or interrupt an active hunt flow.

const WORLD_VERSION = '1.0.0';
const $w=(s,r=document)=>r.querySelector(s);
const $$w=(s,r=document)=>[...r.querySelectorAll(s)];

// Replace this with the exact Snazzle channel URL once supplied.
const SNAZZLE_YOUTUBE_URL='https://www.youtube.com/results?search_query=Snazzle+Creations';

const natureAnimals=[
  {icon:'🦌',name:'Ree',where:'Bosranden, rustige velden en open plekken.',fact:'Reeën zijn vooral vroeg in de ochtend en tegen de avond actief.',look:'Kijk naar smalle hoefafdrukken en afgeknabbelde jonge takken.'},
  {icon:'🦊',name:'Vos',where:'Bos, weilanden en rustige randen van het dorp.',fact:'Een vos hoort piepkleine geluiden van prooidieren onder gras en bladeren.',look:'Let op pootafdrukken die bijna in één rechte lijn lopen.'},
  {icon:'🦡',name:'Das',where:'Rustige boshellingen, houtwallen en akkers.',fact:'Dassen wonen samen in grote ondergrondse burchten met meerdere gangen.',look:'Zoek alleen naar sporen; blijf uit de buurt van een dassenburcht.'},
  {icon:'🐿️',name:'Eekhoorn',where:'Bossen, parken en plekken met oude bomen.',fact:'Eekhoorns verstoppen voedsel en vergeten soms waar alles ligt — zo helpen ze nieuwe bomen groeien.',look:'Kijk hoog in bomen en zoek aangevreten dennenappels.'},
  {icon:'🐦',name:'Grote bonte specht',where:'Bossen, lanen en oude bomen.',fact:'Een specht gebruikt zijn sterke snavel om insecten uit hout te halen en om te roffelen.',look:'Luister naar het snelle roffelen op een boomstam.'},
  {icon:'🦅',name:'Buizerd',where:'Boven velden, bosranden en langs wegen.',fact:'Buizerds zweven vaak in brede cirkels op warme opstijgende lucht.',look:'Kijk omhoog naar een brede roofvogel met ronde vleugels.'},
  {icon:'💙',name:'IJsvogel',where:'Langs rustige beken, plassen en helder water.',fact:'De ijsvogel duikt razendsnel vanaf een tak het water in om kleine visjes te vangen.',look:'Let op een plotselinge felblauwe flits boven het water.'},
  {icon:'🐸',name:'Gewone pad',where:'Tuinen, vochtige bosgrond en in het voorjaar bij water.',fact:'Padden trekken in het voorjaar vaak terug naar hetzelfde water om zich voort te planten.',look:'Kijk bij vochtig weer op paden, maar raak dieren liever niet aan.'}
];

const naturePlants=[
  {icon:'🌳',name:'Zomereik',where:'Bossen, lanen en houtwallen.',fact:'Eikels zijn belangrijk voedsel voor onder andere gaaien, muizen en wilde dieren.',look:'Herken hem aan gelobde bladeren en natuurlijk de eikels.'},
  {icon:'🍃',name:'Berk',where:'Bosranden, open terreinen en zandige grond.',fact:'De lichte bast helpt een berk zonlicht terug te kaatsen.',look:'De witte of zilverige stam valt vaak al van ver op.'},
  {icon:'🌲',name:'Beuk',where:'Oudere bossen en lanen.',fact:'Een dicht bladerdak van beuken laat in de zomer weinig licht op de bosbodem vallen.',look:'Voel met je ogen: de stam ziet er opvallend glad en grijs uit.'},
  {icon:'🌰',name:'Hazelaar',where:'Bosranden, struweel en houtwallen.',fact:'Hazelaars bloeien al heel vroeg in het jaar met lange hangende katjes.',look:'In nazomer en herfst kun je hazelnoten aan de struik zien.'},
  {icon:'🫐',name:'Braam',where:'Bosranden, ruigtes en langs paden.',fact:'Bramen bieden voedsel én schuilplaatsen voor veel dieren.',look:'Kijk naar lange stekelige ranken. Pluk alleen waar dat toegestaan en veilig is.'},
  {icon:'🌿',name:'Brandnetel',where:'Voedselrijke grond, bermen en bosranden.',fact:'Brandnetels zijn een belangrijke waardplant voor rupsen van verschillende vlinders.',look:'Herken de gekartelde bladeren — niet aanraken met blote handen.'},
  {icon:'💛',name:'Gele lis',where:'Langs sloten, poelen en natte oevers.',fact:'De gele lis houdt van natte voeten en bloeit opvallend geel.',look:'Kijk vanaf het pad naar lange zwaardvormige bladeren bij water.'},
  {icon:'💜',name:'Struikhei',where:'Droge, zonnige heide- en zandgronden.',fact:'Struikhei is belangrijk voor bijen en andere insecten wanneer hij bloeit.',look:'In de bloeitijd zie je lage paars-roze bloeiende struikjes.'}
];

const natureMissions=[
  '👂 Blijf 20 seconden stil. Hoeveel verschillende vogelgeluiden hoor je?',
  '🍂 Zoek drie verschillend gevormde bladeren zonder ze van een plant af te trekken.',
  '👣 Vind een dierenspoor: een pootafdruk, veer, aangevreten noot of gangetje.',
  '🌳 Zoek de dikste boom die je vanaf het pad kunt vinden. Hoeveel kinderen passen er denkbeeldig omheen?',
  '🐦 Kijk één minuut omhoog. Zie je een vogel vliegen, zitten of zweven?',
  '🎨 Vind buiten vijf natuurlijke kleuren zonder iets te plukken.',
  '💧 Zoek water. Welke dieren zouden hier kunnen drinken of leven?',
  '🔎 Zoek iets piepkleins in de natuur dat je normaal voorbij zou lopen.'
];

const magicMessages=[
  {icon:'🦆✨',title:'Pssst… een Snazzle!',text:'Je hebt een verborgen magische plek ontdekt. Alleen echte Snazzle-speurders vinden deze.'},
  {icon:'🌟🦆',title:'Sterrenstof gevonden!',text:'De Snazzle Wereld heeft je gezien. Neem buiten drie extra speurdersstappen.'},
  {icon:'🌿✨',title:'Het bos fluistert…',text:'Kijk straks buiten eens omhoog. Misschien zie je iets dat je gisteren nog niet zag.'},
  {icon:'🥚💫',title:'Een vreemd ei…',text:'Heel even bewoog het. Zou hier ooit een geheime Snazzle uitkomen?'},
  {icon:'👑🦆',title:'Zeldzame bezoeker!',text:'Een Crown Snazzle kwam heel even kijken. En weg was hij weer…'},
  {icon:'🧭✨',title:'Magisch kompas!',text:'Het wijst niet naar het noorden. Het wijst naar je volgende avontuur.'}
];

function injectWorldStyles(){
  if($w('#snazzleWorldStyles')) return;
  const style=document.createElement('style'); style.id='snazzleWorldStyles';
  style.textContent=`
    .snazzle-world-links{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
    .snazzle-world-link{border:3px solid rgba(80,48,24,.75);border-radius:20px;padding:13px 11px;min-height:100px;text-align:left;color:#fff;box-shadow:0 5px 0 rgba(60,35,18,.7),0 8px 18px rgba(0,0,0,.18);position:relative;overflow:hidden}
    .snazzle-world-link:after{content:'✦';position:absolute;right:9px;top:5px;font-size:22px;opacity:.6;animation:worldTwinkle 2.5s ease-in-out infinite}.snazzle-world-link b{display:block;font-size:31px}.snazzle-world-link strong{display:block;font-size:16px;margin-top:5px}.snazzle-world-link small{display:block;font-weight:730;line-height:1.25;color:#fff8df;margin-top:3px}
    .snazzle-tv-link{background:linear-gradient(145deg,#e45a52,#a92845)}.snazzle-nature-link{background:linear-gradient(145deg,#48a95a,#176b43)}
    #snazzleTvSheet,#snazzleNatureSheet{z-index:86}.world-panel{background:radial-gradient(circle at 90% 0%,rgba(255,239,117,.55),transparent 24%),linear-gradient(180deg,#fff2b7,#edd18b)!important}
    .tv-hero,.nature-hero{padding:18px;border-radius:22px;color:white;border:3px solid rgba(82,46,25,.65);box-shadow:0 5px 0 #60401f;margin-bottom:13px;position:relative;overflow:hidden}.tv-hero{background:linear-gradient(135deg,#e75c53,#9d2444)}.nature-hero{background:linear-gradient(135deg,#4cb861,#14623f)}.tv-hero:after{content:'🎬';position:absolute;right:13px;bottom:-8px;font-size:76px;opacity:.23}.nature-hero:after{content:'🌿';position:absolute;right:8px;bottom:-12px;font-size:88px;opacity:.24}.tv-hero h3,.nature-hero h3{margin:0 0 5px;font-size:25px}.tv-hero p,.nature-hero p{margin:0;max-width:80%;font-weight:760;line-height:1.4}
    .tv-open{width:100%;border:0;border-radius:17px;padding:15px;background:linear-gradient(#ffcf48,#f19b25);color:#38240d;font-weight:1000;box-shadow:0 4px 0 #a96718;font-size:16px}.tv-note{margin-top:12px;padding:11px;border-radius:14px;background:#fff8df;border:2px dashed #bd975c;color:#644826;font-size:12px;font-weight:800;line-height:1.4}
    .nature-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.nature-tabs button{border:2px solid #b7945c;border-radius:12px;padding:10px 4px;background:#fff5d8;color:#50381f;font-weight:950;font-size:11px}.nature-tabs button.on{background:linear-gradient(#74c34a,#3d9637);color:#fff;border-color:#397d31;box-shadow:0 3px 0 #2d6a28}.nature-section{display:none}.nature-section.on{display:block}.nature-grid{display:grid;gap:9px}.nature-card{display:grid;grid-template-columns:58px 1fr;gap:10px;padding:12px;border-radius:17px;background:#fff9e8;border:2px solid #b89661;color:#342418;box-shadow:0 4px 0 #9b7744}.nature-icon{width:55px;height:55px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(145deg,#dff3a8,#96cf69);font-size:32px;border:2px solid #7da351}.nature-card strong{font-size:16px}.nature-card p{margin:4px 0 0;font-size:12px;font-weight:720;line-height:1.38;color:#644b2e}.nature-card .where{display:block;margin-top:5px;font-size:10px;font-weight:900;color:#39733d}.nature-look{display:block;margin-top:5px;padding-top:5px;border-top:1px dashed #cfb37d;font-size:10px;font-weight:850;color:#76552f}.nature-safety{margin:12px 0;padding:11px 12px;border-radius:14px;background:#e7f4c7;border:2px solid #8dac57;color:#345225;font-size:11px;font-weight:850;line-height:1.4}.mission-card{padding:15px;border-radius:18px;background:linear-gradient(135deg,#7561d5,#3f75c0);border:3px solid #564498;color:#fff;box-shadow:0 5px 0 #443877;text-align:center}.mission-card .mission-icon{font-size:45px}.mission-card strong{display:block;font-size:19px;margin:4px 0}.mission-card p{font-weight:780;line-height:1.45;margin:5px 0 12px}.mission-card button{border:0;border-radius:13px;padding:11px 14px;background:#ffd44b;color:#3e290e;font-weight:1000;box-shadow:0 3px 0 #a96d19}
    .magic-hotspot{position:absolute;width:38px;height:38px;border:0;background:transparent;color:rgba(255,245,168,.42);font-size:12px;z-index:4;display:grid;place-items:center;padding:0}.magic-hotspot:after{content:'✦';filter:drop-shadow(0 0 5px rgba(255,238,107,.8));animation:worldTwinkle 2.7s ease-in-out infinite}.magic-hotspot.one{right:-4px;top:355px}.magic-hotspot.two{left:-5px;top:930px}.magic-hotspot.three{right:-4px;top:1540px}
    #snazzleMagicOverlay{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;padding:22px;background:radial-gradient(circle,rgba(55,72,122,.4),rgba(3,17,10,.91));backdrop-filter:blur(5px)}#snazzleMagicOverlay.show{display:flex}.magic-card{width:min(410px,94vw);padding:25px 20px 21px;text-align:center;border-radius:28px;background:radial-gradient(circle at 50% 0%,#fff7a6,#f6cc69 42%,#d79c49 100%);border:4px solid #775026;color:#34220e;box-shadow:0 20px 70px rgba(0,0,0,.55);position:relative;overflow:hidden;animation:magicPop .35s ease-out}.magic-card:before,.magic-card:after{content:'✨';position:absolute;font-size:47px;animation:magicFloat 2s ease-in-out infinite}.magic-card:before{left:12px;top:14px}.magic-card:after{right:12px;top:36px;animation-delay:.5s}.magic-big{font-size:74px;filter:drop-shadow(0 6px 4px rgba(0,0,0,.18));animation:magicFloat 2.2s ease-in-out infinite}.magic-card h2{font-size:25px;margin:7px 0}.magic-card p{font-weight:800;line-height:1.45;margin:0 0 15px}.magic-card button{border:0;border-radius:14px;padding:12px 16px;background:linear-gradient(#5eb647,#318a38);color:#fff;font-weight:1000;box-shadow:0 4px 0 #26682c}.magic-dust{position:absolute;inset:0;pointer-events:none;overflow:hidden}.magic-dust i{position:absolute;font-style:normal;top:-30px;animation:magicFall 2.4s ease-in forwards}
    #snazzleVisitor{position:fixed;right:12px;bottom:96px;z-index:3500;display:none;border:3px solid #734820;border-radius:999px;padding:8px 12px 8px 8px;background:linear-gradient(#fff0a2,#ffc748);color:#3b260e;box-shadow:0 6px 0 #74451e,0 10px 25px rgba(0,0,0,.25);font-weight:1000;align-items:center;gap:8px;animation:visitorIn .35s ease-out}#snazzleVisitor.show{display:flex}#snazzleVisitor b{font-size:31px}#snazzleVisitor span{font-size:12px}
    @keyframes worldTwinkle{0%,100%{opacity:.35;transform:scale(.8) rotate(-10deg)}50%{opacity:1;transform:scale(1.25) rotate(12deg)}}@keyframes magicPop{from{transform:scale(.75) rotate(-3deg);opacity:0}to{transform:scale(1);opacity:1}}@keyframes magicFloat{0%,100%{transform:translateY(1px) rotate(-6deg)}50%{transform:translateY(-7px) rotate(7deg)}}@keyframes magicFall{to{transform:translateY(700px) rotate(540deg);opacity:0}}@keyframes visitorIn{from{transform:translateX(130%)}to{transform:translateX(0)}}
    @media(max-width:390px){.snazzle-world-links{grid-template-columns:1fr 1fr}.snazzle-world-link{min-height:94px;padding:11px 9px}.snazzle-world-link strong{font-size:14px}.snazzle-world-link small{font-size:10px}.nature-card{grid-template-columns:50px 1fr}.nature-icon{width:48px;height:48px;font-size:28px}}
    @media(prefers-reduced-motion:reduce){.snazzle-world-link:after,.magic-hotspot:after,.magic-card:before,.magic-card:after,.magic-big,.magic-dust i{animation:none}}
  `; document.head.appendChild(style);
}

function ensureWorldSheets(){
  if(!$w('#snazzleTvSheet')){
    const s=document.createElement('div'); s.className='sheet'; s.id='snazzleTvSheet';
    s.innerHTML=`<div class="panel world-panel"><button class="close" id="snazzleTvClose" type="button">×</button><div class="handle"></div><h2>Snazzle TV 🎬</h2><div class="tv-hero"><h3>Welkom bij Snazzle TV!</h3><p>Korte filmpjes, avonturen, nieuwe Snazzles en gekke momenten uit de Snazzle Wereld.</p></div><button class="tv-open" id="snazzleYoutubeOpen" type="button">▶️ Bekijk Snazzle op YouTube</button><div class="tv-note">Nieuwe filmpjes kunnen hier later ook rechtstreeks als kaartjes in de app verschijnen.</div></div>`;
    document.body.appendChild(s); $w('#snazzleTvClose').onclick=()=>s.classList.remove('show'); s.addEventListener('click',e=>{if(e.target===s)s.classList.remove('show');});
    $w('#snazzleYoutubeOpen').onclick=()=>window.open(SNAZZLE_YOUTUBE_URL,'_blank','noopener');
  }
  if(!$w('#snazzleNatureSheet')){
    const s=document.createElement('div'); s.className='sheet'; s.id='snazzleNatureSheet';
    s.innerHTML=`<div class="panel world-panel"><button class="close" id="snazzleNatureClose" type="button">×</button><div class="handle"></div><h2>Snazzle Natuurboek 🌿</h2><div class="nature-hero"><h3>Wat leeft er om ons heen?</h3><p>Ontdek dieren, planten en sporen die je in Midden-Limburg tijdens een wandeling kunt tegenkomen.</p></div><div class="nature-tabs"><button class="on" data-nature-tab="animals">🦌 Dieren</button><button data-nature-tab="plants">🌱 Planten</button><button data-nature-tab="missions">🧭 Missies</button></div><section class="nature-section on" id="natureAnimals"><div class="nature-grid" id="natureAnimalGrid"></div></section><section class="nature-section" id="naturePlants"><div class="nature-grid" id="naturePlantGrid"></div></section><section class="nature-section" id="natureMissions"><div class="mission-card"><div class="mission-icon">🧭🌿</div><strong>Snazzle Buitenmissie</strong><p id="natureMissionText"></p><button type="button" id="newNatureMission">Geef mij een nieuwe missie ✨</button></div><div class="nature-safety">🌿 <b>Snazzle-regel:</b> kijk, luister en ontdek — maar laat dieren met rust en trek geen planten uit de natuur.</div></section><div class="nature-safety">👀 Soorten kunnen per plek en seizoen verschillen. Zie dit boek als speurhulp voor dieren en planten die in onze streek veel voorkomen.</div></div>`;
    document.body.appendChild(s); $w('#snazzleNatureClose').onclick=()=>s.classList.remove('show'); s.addEventListener('click',e=>{if(e.target===s)s.classList.remove('show');});
    renderNature();
    $$w('[data-nature-tab]',s).forEach(b=>b.onclick=()=>switchNatureTab(b.dataset.natureTab));
    $w('#newNatureMission').onclick=showRandomMission;
  }
}

function natureCard(x){return `<article class="nature-card"><div class="nature-icon">${x.icon}</div><div><strong>${x.name}</strong><span class="where">📍 ${x.where}</span><p>${x.fact}</p><span class="nature-look">🔎 ${x.look}</span></div></article>`;}
function renderNature(){ $w('#natureAnimalGrid').innerHTML=natureAnimals.map(natureCard).join(''); $w('#naturePlantGrid').innerHTML=naturePlants.map(natureCard).join(''); showRandomMission(); }
function switchNatureTab(tab){ const map={animals:'natureAnimals',plants:'naturePlants',missions:'natureMissions'}; $$w('[data-nature-tab]').forEach(b=>b.classList.toggle('on',b.dataset.natureTab===tab)); $$w('.nature-section').forEach(s=>s.classList.remove('on')); $w('#'+map[tab])?.classList.add('on'); }
function showRandomMission(){ const el=$w('#natureMissionText'); if(el) el.textContent=natureMissions[Math.floor(Math.random()*natureMissions.length)]; }

function closeQuick(){ const o=$w('#quickMenuOverlay'); if(o){o.classList.remove('show');o.setAttribute('aria-hidden','true');} $w('#quickMenuBtn')?.setAttribute('aria-expanded','false'); document.documentElement.style.overflow='';document.body.style.overflow=''; }
function openSheetWorld(id){ closeQuick(); ensureWorldSheets(); const s=$w('#'+id); if(s){s.classList.add('show');s.querySelector('.panel').scrollTop=0;} }

function injectWorldNavigation(){
  const nav=$w('.quick-menu-list');
  if(nav && !nav.querySelector('[data-snazzle-tv]')){
    const tv=document.createElement('button'); tv.type='button'; tv.dataset.snazzleTv='1'; tv.innerHTML='<b>🎬</b><span><strong>Snazzle TV</strong><small>Korte Snazzle filmpjes</small></span><i>›</i>';
    const nat=document.createElement('button'); nat.type='button'; nat.dataset.snazzleNature='1'; nat.innerHTML='<b>🌿</b><span><strong>Natuurboek</strong><small>Dieren, planten & buitenmissies</small></span><i>›</i>';
    const before=nav.querySelector('[data-quick-action="shop"]')||nav.querySelector('[data-quick-action="profile"]'); if(before){nav.insertBefore(tv,before);nav.insertBefore(nat,before);}else nav.append(tv,nat);
    tv.onclick=()=>openSheetWorld('snazzleTvSheet'); nat.onclick=()=>openSheetWorld('snazzleNatureSheet');
  }
  const homeImages=$w('.home-images');
  if(homeImages && !$w('#snazzleWorldLinks')){
    const block=document.createElement('section'); block.id='snazzleWorldLinks'; block.className='snazzle-world-links';
    block.innerHTML='<button class="snazzle-world-link snazzle-tv-link" id="snazzleTvHome" type="button"><b>🎬</b><strong>Snazzle TV</strong><small>Kijk korte Snazzle filmpjes</small></button><button class="snazzle-world-link snazzle-nature-link" id="snazzleNatureHome" type="button"><b>🌿</b><strong>Natuurboek</strong><small>Ontdek wat buiten leeft</small></button>';
    homeImages.insertAdjacentElement('afterend',block); $w('#snazzleTvHome').onclick=()=>openSheetWorld('snazzleTvSheet'); $w('#snazzleNatureHome').onclick=()=>openSheetWorld('snazzleNatureSheet');
  }
}

function ensureMagic(){
  const app=$w('.app'); if(app && !app.querySelector('.magic-hotspot')){
    ['one','two','three'].forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='magic-hotspot '+c;b.setAttribute('aria-label','Geheime Snazzle magie');b.onclick=()=>showMagic(i===2);app.appendChild(b);});
  }
  if(!$w('#snazzleMagicOverlay')){
    const o=document.createElement('div');o.id='snazzleMagicOverlay';o.setAttribute('aria-hidden','true');o.innerHTML='<div class="magic-card"><div class="magic-dust" id="magicDust"></div><div class="magic-big" id="magicBig">🦆✨</div><h2 id="magicTitle">Geheime Snazzle!</h2><p id="magicText"></p><button type="button" id="magicClose">Terug naar het avontuur ✨</button></div>';document.body.appendChild(o);$w('#magicClose').onclick=hideMagic;o.addEventListener('click',e=>{if(e.target===o)hideMagic();});
  }
  if(!$w('#snazzleVisitor')){
    const v=document.createElement('button');v.type='button';v.id='snazzleVisitor';v.innerHTML='<b>🦆</b><span>Psst… tik mij!</span>';document.body.appendChild(v);v.onclick=()=>{v.classList.remove('show');showMagic(true);};
  }
  bindLogoSecret(); scheduleVisitor();
}
function showMagic(rare=false){
  const pool=rare?magicMessages.slice(3):magicMessages; const m=pool[Math.floor(Math.random()*pool.length)]; const o=$w('#snazzleMagicOverlay'); if(!o)return;
  $w('#magicBig').textContent=m.icon;$w('#magicTitle').textContent=m.title;$w('#magicText').textContent=m.text;const d=$w('#magicDust');d.innerHTML='';const bits=['✨','⭐','✦','💫','🟡'];for(let i=0;i<24;i++){const x=document.createElement('i');x.textContent=bits[i%bits.length];x.style.left=(Math.random()*96)+'%';x.style.animationDelay=(Math.random()*.7)+'s';x.style.animationDuration=(1.6+Math.random()*1.2)+'s';d.appendChild(x);}o.classList.add('show');o.setAttribute('aria-hidden','false'); if(navigator.vibrate) navigator.vibrate(25);
}
function hideMagic(){const o=$w('#snazzleMagicOverlay');if(o){o.classList.remove('show');o.setAttribute('aria-hidden','true');}}
function bindLogoSecret(){const logo=$w('.logo');if(!logo||logo.dataset.magicBound)return;logo.dataset.magicBound='1';let taps=[];logo.style.cursor='pointer';logo.addEventListener('click',()=>{const now=Date.now();taps=taps.filter(t=>now-t<1400);taps.push(now);if(taps.length>=3){taps=[];showMagic(true);}});}
let visitorTimer=null;
function scheduleVisitor(){ if(visitorTimer)return; const schedule=()=>{const delay=65000+Math.random()*55000;visitorTimer=setTimeout(()=>{visitorTimer=null;if(!document.hidden&&!$w('.sheet.show')&&!$w('#snazzleMagicOverlay.show')){const v=$w('#snazzleVisitor');v?.classList.add('show');setTimeout(()=>v?.classList.remove('show'),11000);}schedule();},delay);};schedule(); }

function initWorld(){
  if(window.__snazzleWorldLoaded)return;window.__snazzleWorldLoaded=true;injectWorldStyles();ensureWorldSheets();injectWorldNavigation();ensureMagic();
  const obs=new MutationObserver(()=>{injectWorldNavigation();ensureMagic();});obs.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initWorld,{once:true});else initWorld();
console.info(`Snazzle World ${WORLD_VERSION} geladen`);
