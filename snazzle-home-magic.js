// Snazzle Home Magic — magical polish + indoor family hunt.
// Keeps the real outdoor Hunt central while grouping extra experiences in one clear world zone.

const HOME_MAGIC_VERSION='1.0.0';
const $m=(s,r=document)=>r.querySelector(s);
const $$m=(s,r=document)=>[...r.querySelectorAll(s)];

const movementMissions=[
  '🐥 Loop 6 piepkleine eendenstapjes voordat je verder zoekt.',
  '🌿 Doe 5 jungle-sprongen op je plek.',
  '🦆 Wieg 10 seconden als een supertrots Snazzle-eendje.',
  '🧭 Draai één rustige speurdersronde en wijs daarna je nieuwe zoekrichting aan.',
  '🐸 Doe 4 kikkersprongen en ga daarna weer op speurtocht.',
  '🕵️ Sluip 8 stappen zo stil mogelijk door de kamer.',
  '⭐ Maak met je armen een grote ster en tel langzaam tot 5.',
  '🏆 Geef je medespeurder een high-five en zoek verder.'
];

const findMessages=[
  ['✨🦆','MAGISCHE VONDST!','Deze Snazzle dacht dat niemand hem zou vinden. Mis!'],
  ['🌟🦆','SNAZZLE GESPOT!','Je speurdersogen werken uitstekend.'],
  ['👑🦆','KONINKLIJKE VONDST!','Zelfs de Snazzle-kroon is onder de indruk.'],
  ['🌿🦆','JUNGLE-SPEURDER!','Daar zat er eentje stilletjes verstopt.'],
  ['🥚✨','HET NEST JUICHT!','Nog een Snazzle veilig teruggevonden.'],
  ['🧭💫','KOMPAS-MAGIE!','Je zat precies in de goede zoekrichting.']
];

let targetDucks=3;
let foundDucks=0;
let hideSeconds=45;
let hideTimer=null;
let huntStartedAt=0;
let elapsedTimer=null;

function injectMagicPolish(){
  if($m('#snazzleHomeMagicStyles')) return;
  const style=document.createElement('style');
  style.id='snazzleHomeMagicStyles';
  style.textContent=`
    /* Slightly easier secret stars: still hidden, but discoverable. */
    .magic-hotspot{width:48px!important;height:48px!important;color:rgba(255,244,145,.72)!important}
    .magic-hotspot:after{font-size:18px!important;text-shadow:0 0 8px rgba(255,237,88,.9),0 0 16px rgba(255,216,65,.45)}
    .magic-hotspot.one{right:1px!important}.magic-hotspot.two{left:1px!important}.magic-hotspot.three{right:1px!important}

    /* Own Snazzle fairytale polish: richer, but not a copy of another brand. */
    .hero{border-color:#9c6b32!important;box-shadow:0 8px 0 #442918,0 0 0 2px rgba(255,224,101,.15),0 16px 34px rgba(0,0,0,.3)!important}
    .hero h1{letter-spacing:.7px}.main-action{box-shadow:0 7px 0 #70431f,0 0 0 2px rgba(255,244,177,.18),0 13px 28px rgba(0,0,0,.27)!important}
    .section-head h2:before{content:'✦ ';color:#ffd952;text-shadow:0 0 8px rgba(255,215,70,.45);font-size:.72em}
    .hunt{box-shadow:0 8px 0 #3d2416,0 0 0 2px rgba(255,221,115,.12),0 16px 32px rgba(0,0,0,.3)!important}

    .snazzle-world-heading{margin:24px 3px 10px;padding:13px 14px;border-radius:19px;background:linear-gradient(135deg,rgba(64,63,153,.82),rgba(21,119,92,.86));border:2px solid rgba(255,226,112,.45);box-shadow:0 5px 0 rgba(52,39,83,.65),0 9px 20px rgba(0,0,0,.17);color:#fff;position:relative;overflow:hidden}
    .snazzle-world-heading:after{content:'✨';position:absolute;right:12px;top:8px;font-size:29px;animation:snazzleHeadingSpark 2.8s ease-in-out infinite}
    .snazzle-world-heading strong{display:block;font-size:19px;color:#fff3a5;text-shadow:0 2px rgba(0,0,0,.2)}
    .snazzle-world-heading small{display:block;margin-top:3px;padding-right:42px;color:#eaf6df;font-weight:760;line-height:1.3}
    .snazzle-world-links{margin-top:0!important}
    .snazzle-home-link{grid-column:1/-1;background:linear-gradient(135deg,#8d58cb,#5b43b6 45%,#287a9b)!important;min-height:92px!important;display:grid!important;grid-template-columns:52px 1fr!important;align-items:center!important;column-gap:10px!important}
    .snazzle-home-link>b{grid-row:1/3;font-size:37px!important;align-self:center}.snazzle-home-link strong,.snazzle-home-link small{grid-column:2}.snazzle-home-link:before{content:'THUISAVONTUUR';position:absolute;right:10px;bottom:8px;font-size:9px;font-weight:1000;letter-spacing:1px;color:rgba(255,255,255,.55)}

    #snazzleHomeHuntSheet{z-index:88}.homehunt-panel{background:radial-gradient(circle at 85% 0%,rgba(255,239,117,.58),transparent 25%),linear-gradient(180deg,#fff2b5,#edcf89)!important}
    .homehunt-hero{padding:18px;border-radius:23px;background:radial-gradient(circle at 88% 5%,rgba(255,236,116,.25),transparent 28%),linear-gradient(135deg,#704cc6,#4353b8 52%,#19846a);color:#fff;border:3px solid #533b92;box-shadow:0 5px 0 #42306e;position:relative;overflow:hidden}
    .homehunt-hero:after{content:'🏠🦆';position:absolute;right:10px;bottom:-7px;font-size:69px;opacity:.22;transform:rotate(-5deg)}
    .homehunt-hero small{font-size:10px;font-weight:1000;letter-spacing:1.3px;color:#ffea80}.homehunt-hero h3{margin:5px 0;font-size:26px}.homehunt-hero p{margin:0;max-width:82%;font-weight:760;line-height:1.4}
    .homehunt-card{margin-top:12px;padding:14px;border-radius:18px;background:#fff9e8;border:2px solid #bd9a62;color:#3d2a17;box-shadow:0 4px 0 #9f7c49}
    .homehunt-card h4{margin:0 0 8px;font-size:17px}.homehunt-card p{margin:5px 0;font-size:12px;font-weight:760;line-height:1.45;color:#654b2d}
    .duck-choice{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:9px}.duck-choice button{border:2px solid #b58d51;border-radius:14px;padding:11px 5px;background:#f7e5b9;color:#4b351e;font-weight:1000}.duck-choice button.on{background:linear-gradient(#ffdf62,#f5b936);border-color:#92631f;box-shadow:0 3px 0 #8b5a20;transform:translateY(-1px)}
    .homehunt-start,.homehunt-found,.homehunt-reset,.homehunt-ready{width:100%;border:0;border-radius:16px;padding:14px;font-weight:1000;margin-top:11px;box-shadow:0 4px 0 rgba(74,45,25,.48)}
    .homehunt-start{background:linear-gradient(#6bc447,#3c9238);color:#fff}.homehunt-ready{background:linear-gradient(#ffda54,#ee9f28);color:#3a270f}.homehunt-found{background:linear-gradient(#6b5bd1,#405ab8);color:#fff;font-size:16px}.homehunt-reset{background:#d7bd86;color:#4a351f}
    .homehunt-stage{display:none}.homehunt-stage.on{display:block;animation:homeHuntPop .22s ease-out}
    .hide-count{text-align:center;font-size:64px;line-height:1;font-weight:1000;color:#6442b2;text-shadow:0 3px #fff1a7;margin:15px 0 8px}.hide-note{text-align:center;font-weight:900;color:#5d4328;line-height:1.4}
    .hunt-score{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:11px 0}.hunt-score>div{padding:11px;border-radius:15px;background:#eaf3be;border:2px solid #9ab25f;text-align:center}.hunt-score strong{display:block;font-size:22px;color:#2d612f}.hunt-score small{font-size:10px;font-weight:900;color:#5b653a}
    .movement-spell{padding:13px;border-radius:16px;background:linear-gradient(135deg,#e9e2ff,#d3f1d4);border:2px dashed #8972ba;color:#493a68;font-weight:850;line-height:1.4;text-align:center;min-height:63px;display:grid;place-items:center}
    .homehunt-finish{text-align:center;padding:18px 11px}.homehunt-finish .big{font-size:72px;animation:homeHuntFloat 2s ease-in-out infinite}.homehunt-finish h3{font-size:25px;margin:5px 0;color:#4f3795}.homehunt-finish p{font-weight:800;line-height:1.45;color:#62492f}
    .homehunt-safety{margin-top:12px;padding:10px 11px;border-radius:14px;background:#e5f2c5;border:2px solid #92ad5a;color:#3d552c;font-size:10px;font-weight:850;line-height:1.45}

    #homeMagicBurst{position:fixed;inset:0;z-index:9100;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(6,18,12,.78);backdrop-filter:blur(4px)}#homeMagicBurst.show{display:flex}.home-magic-card{width:min(390px,94vw);padding:23px 18px;border-radius:27px;text-align:center;background:radial-gradient(circle at 50% 0%,#fff7a3,#f5cd68 45%,#d99c49);border:4px solid #795127;color:#38250f;box-shadow:0 20px 65px rgba(0,0,0,.5);animation:homeHuntPop .28s ease-out}.home-magic-card .big{font-size:68px}.home-magic-card h3{font-size:24px;margin:6px 0}.home-magic-card p{font-weight:800;line-height:1.4}.home-magic-card button{border:0;border-radius:14px;padding:12px 16px;background:#428f3b;color:#fff;font-weight:1000;box-shadow:0 4px 0 #2b682b}

    .snazzle-magic-sky{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}.snazzle-magic-sky i{position:absolute;font-style:normal;color:#ffe77d;opacity:.14;font-size:12px;animation:skyTwinkle 5s ease-in-out infinite}.app,.bottom{position:relative}.app{z-index:1}.bottom{z-index:20}
    @keyframes snazzleHeadingSpark{0%,100%{transform:scale(.85) rotate(-8deg);opacity:.45}50%{transform:scale(1.12) rotate(9deg);opacity:1}}
    @keyframes homeHuntPop{from{opacity:.4;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
    @keyframes homeHuntFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6px) rotate(4deg)}}
    @keyframes skyTwinkle{0%,100%{opacity:.08;transform:scale(.7)}50%{opacity:.28;transform:scale(1.2)}}
    @media(max-width:390px){.homehunt-hero h3{font-size:23px}.snazzle-home-link{grid-template-columns:47px 1fr!important}.duck-choice button{font-size:12px}.hide-count{font-size:55px}}
    @media(prefers-reduced-motion:reduce){.snazzle-world-heading:after,.homehunt-finish .big,.snazzle-magic-sky i{animation:none!important}}
  `;
  document.head.appendChild(style);
}

function ensureMagicSky(){
  if($m('.snazzle-magic-sky')) return;
  const sky=document.createElement('div');sky.className='snazzle-magic-sky';
  const spots=[[8,12],[83,9],[23,32],[91,42],[6,58],[74,68],[36,82],[92,89]];
  spots.forEach(([x,y],i)=>{const s=document.createElement('i');s.textContent=i%3===0?'✦':'·';s.style.left=x+'%';s.style.top=y+'%';s.style.animationDelay=(i*.55)+'s';sky.appendChild(s);});
  document.body.prepend(sky);
}

function ensureWorldGrouping(){
  const links=$m('.snazzle-world-links');
  if(!links) return false;
  if(!$m('#snazzleWorldHeading')){
    const h=document.createElement('div');h.id='snazzleWorldHeading';h.className='snazzle-world-heading';h.innerHTML='<strong>✨ Ontdek de Snazzle Wereld</strong><small>Meer beleven als je even niet op Hunt bent: kijken, leren, bewegen en thuis zoeken.</small>';
    links.parentNode.insertBefore(h,links);
  }
  if(!$m('#snazzleHomeHuntHome')){
    const b=document.createElement('button');b.id='snazzleHomeHuntHome';b.type='button';b.className='snazzle-world-link snazzle-home-link';b.innerHTML='<b>🏠🦆</b><strong>Snazzle Thuis Hunt</strong><small>Verstop eendjes binnen, laat iemand zoeken en ontgrendel grappige beweegmissies.</small>';
    links.appendChild(b);b.onclick=openHomeHunt;
  }
  return true;
}

function injectHomeMenu(){
  const nav=$m('.quick-menu-list');if(!nav||nav.querySelector('[data-home-hunt]'))return false;
  const b=document.createElement('button');b.type='button';b.dataset.homeHunt='1';b.innerHTML='<b>🏠</b><span><strong>Thuis Hunt</strong><small>Verstop, zoek & beweeg binnen</small></span><i>›</i>';
  const before=nav.querySelector('[data-quick-action="profile"]');if(before)nav.insertBefore(b,before);else nav.appendChild(b);
  b.onclick=()=>{closeQuickMenu();openHomeHunt();};return true;
}

function closeQuickMenu(){
  const overlay=$m('#quickMenuOverlay');if(overlay){overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');}
  $m('#quickMenuBtn')?.setAttribute('aria-expanded','false');document.documentElement.style.overflow='';document.body.style.overflow='';
}

function ensureHomeHuntUI(){
  if($m('#snazzleHomeHuntSheet')) return;
  const sheet=document.createElement('div');sheet.id='snazzleHomeHuntSheet';sheet.className='sheet';sheet.innerHTML=`
    <div class="panel homehunt-panel"><button class="close" id="homeHuntClose" type="button">×</button><div class="handle"></div>
      <div class="homehunt-hero"><small>SNAZZLE MAGIE VOOR THUIS</small><h3>Snazzle Thuis Hunt 🏠</h3><p>Geen buiten-Hunt vandaag? Maak thuis je eigen mini-avontuur met echte Snazzles of andere veilige kleine speeltjes.</p></div>
      <section class="homehunt-stage on" id="homeHuntSetup">
        <div class="homehunt-card"><h4>1. Hoeveel Snazzles gaan zich verstoppen?</h4><p>Eén persoon verstopt ze. De speurder kijkt niet mee.</p><div class="duck-choice"><button class="on" data-ducks="1">🦆 1</button><button data-ducks="3">🦆🦆🦆 3</button><button data-ducks="5">✨ 5</button></div></div>
        <div class="homehunt-card"><h4>2. Verstop-tijd</h4><p>De zoeker doet de ogen dicht. Je krijgt 45 seconden, maar je mag ook eerder op “Klaar” drukken.</p><button class="homehunt-start" id="homeHuntStart">Start verstoppen 🙈</button></div>
        <div class="homehunt-safety">🌿 Verstop alleen op veilige, bereikbare plekken. Niet bij stopcontacten, ovens, water, breekbare spullen of op hoge plekken waar geklommen moet worden.</div>
      </section>
      <section class="homehunt-stage" id="homeHuntHide"><div class="homehunt-card"><h4>🙈 Zoeker: ogen dicht!</h4><div class="hide-count" id="homeHideCount">45</div><div class="hide-note">De Snazzles zoeken nu hun geheime plek…</div><button class="homehunt-ready" id="homeHideReady">Alles verstopt — start zoeken! 🔎</button></div></section>
      <section class="homehunt-stage" id="homeHuntSearch"><div class="homehunt-card"><h4>🔎 De Thuis Hunt is begonnen!</h4><div class="hunt-score"><div><strong id="homeFoundScore">0 / 3</strong><small>SNAZZLES GEVONDEN</small></div><div><strong id="homeElapsed">00:00</strong><small>SPEURTIJD</small></div></div><div class="movement-spell" id="homeMovement">✨ Zoek goed… na je eerste vondst krijg je een geheime beweegmissie.</div><button class="homehunt-found" id="homeFoundBtn">🦆 Ik heb er één gevonden!</button><button class="homehunt-reset" id="homeAbortBtn">Stop deze Thuis Hunt</button></div></section>
      <section class="homehunt-stage" id="homeHuntFinish"><div class="homehunt-finish"><div class="big">👑🦆✨</div><h3>THUIS SNAZZLE MASTER!</h3><p id="homeFinishText">Alle Snazzles zijn gevonden.</p><div class="movement-spell" id="homeFinalMission"></div><button class="homehunt-start" id="homeAgainBtn">Nog een Thuis Hunt!</button></div></section>
    </div>`;
  document.body.appendChild(sheet);
  $m('#homeHuntClose').onclick=closeHomeHunt;sheet.addEventListener('click',e=>{if(e.target===sheet)closeHomeHunt();});
  $$m('[data-ducks]',sheet).forEach(b=>b.onclick=()=>{$$m('[data-ducks]',sheet).forEach(x=>x.classList.remove('on'));b.classList.add('on');targetDucks=Number(b.dataset.ducks)||1;updateScore();});
  $m('#homeHuntStart').onclick=startHiding;$m('#homeHideReady').onclick=startSearching;$m('#homeFoundBtn').onclick=registerHomeFind;$m('#homeAbortBtn').onclick=resetHomeHunt;$m('#homeAgainBtn').onclick=resetHomeHunt;
}

function openHomeHunt(){
  ensureHomeHuntUI();resetHomeHunt(false);const s=$m('#snazzleHomeHuntSheet');s.classList.add('show');s.querySelector('.panel').scrollTop=0;
}
function closeHomeHunt(){
  clearTimers();$m('#snazzleHomeHuntSheet')?.classList.remove('show');
}
function setStage(id){
  $$m('#snazzleHomeHuntSheet .homehunt-stage').forEach(x=>x.classList.remove('on'));$m('#'+id)?.classList.add('on');
}
function clearTimers(){
  if(hideTimer){clearInterval(hideTimer);hideTimer=null;}if(elapsedTimer){clearInterval(elapsedTimer);elapsedTimer=null;}
}
function resetHomeHunt(switchStage=true){
  clearTimers();foundDucks=0;hideSeconds=45;huntStartedAt=0;updateScore();const c=$m('#homeHideCount');if(c)c.textContent='45';const e=$m('#homeElapsed');if(e)e.textContent='00:00';const mv=$m('#homeMovement');if(mv)mv.textContent='✨ Zoek goed… na je eerste vondst krijg je een geheime beweegmissie.';if(switchStage)setStage('homeHuntSetup');
}
function startHiding(){
  clearTimers();hideSeconds=45;setStage('homeHuntHide');$m('#homeHideCount').textContent=hideSeconds;
  hideTimer=setInterval(()=>{hideSeconds--;const el=$m('#homeHideCount');if(el)el.textContent=Math.max(0,hideSeconds);if(hideSeconds<=0)startSearching();},1000);
}
function startSearching(){
  if(hideTimer){clearInterval(hideTimer);hideTimer=null;}foundDucks=0;huntStartedAt=Date.now();setStage('homeHuntSearch');updateScore();updateElapsed();elapsedTimer=setInterval(updateElapsed,1000);
}
function updateElapsed(){
  if(!huntStartedAt)return;const total=Math.floor((Date.now()-huntStartedAt)/1000),m=Math.floor(total/60),s=total%60;const el=$m('#homeElapsed');if(el)el.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function updateScore(){
  const el=$m('#homeFoundScore');if(el)el.textContent=`${foundDucks} / ${targetDucks}`;
}
function registerHomeFind(){
  if(foundDucks>=targetDucks)return;foundDucks++;updateScore();const mission=movementMissions[Math.floor(Math.random()*movementMissions.length)];const mv=$m('#homeMovement');if(mv)mv.textContent='✨ Beweegspreuk: '+mission;showHomeFindMagic(mission);if(foundDucks>=targetDucks)setTimeout(finishHomeHunt,650);
}
function finishHomeHunt(){
  if(elapsedTimer){clearInterval(elapsedTimer);elapsedTimer=null;}const secs=Math.max(1,Math.floor((Date.now()-huntStartedAt)/1000)),m=Math.floor(secs/60),s=secs%60;$m('#homeFinishText').textContent=`Jullie vonden ${targetDucks} Snazzle${targetDucks===1?'':'s'} in ${m?m+' min ':''}${s} sec. De woonkamer is officieel Snazzle-terrein.`;$m('#homeFinalMission').textContent='🏆 Eindmissie: bedenk samen de allergrappigste verstopplek voor de volgende ronde — wel veilig natuurlijk!';setStage('homeHuntFinish');
}

function ensureHomeBurst(){
  if($m('#homeMagicBurst'))return;const o=document.createElement('div');o.id='homeMagicBurst';o.innerHTML='<div class="home-magic-card"><div class="big" id="homeBurstIcon">✨🦆</div><h3 id="homeBurstTitle">Magische vondst!</h3><p id="homeBurstText"></p><p id="homeBurstMission"></p><button type="button" id="homeBurstClose">Verder zoeken! 🔎</button></div>';document.body.appendChild(o);$m('#homeBurstClose').onclick=()=>o.classList.remove('show');o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show');});
}
function showHomeFindMagic(mission){
  ensureHomeBurst();const msg=findMessages[Math.floor(Math.random()*findMessages.length)];$m('#homeBurstIcon').textContent=msg[0];$m('#homeBurstTitle').textContent=msg[1];$m('#homeBurstText').textContent=msg[2];$m('#homeBurstMission').textContent='Beweegspreuk: '+mission;const o=$m('#homeMagicBurst');o.classList.add('show');if(navigator.vibrate)navigator.vibrate(20);
}

function initHomeMagic(){
  if(window.__snazzleHomeMagicLoaded)return;window.__snazzleHomeMagicLoaded=true;injectMagicPolish();ensureMagicSky();ensureHomeHuntUI();ensureWorldGrouping();injectHomeMenu();
  const obs=new MutationObserver(()=>{ensureWorldGrouping();injectHomeMenu();});obs.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initHomeMagic,{once:true});else initHomeMagic();
console.info(`Snazzle Home Magic ${HOME_MAGIC_VERSION} geladen`);
