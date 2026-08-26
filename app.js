// Snazzle Hunt entrypoint — v90 critical current-home boot.
// De oude index.html is alleen nog de technische basis. De actuele home wordt nu DIRECT opgebouwd
// voordat het laadscherm verdwijnt. Zware extra modules laden pas daarna op de achtergrond.

const runtimeVersion='20260826-v90';
const fresh=(path)=>`${path}${path.includes('?')?'&':'?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion=runtimeVersion;
window.__snazzleFresh=fresh;

const optionalModules=[
  './snazzle-auto-update-v51.js',
  './snazzle-privacy-v52.js',
  './snazzle-parent-hub-v65.js',
  './snazzle-parent-close-fix-v76.js',
  './snazzle-central-assets-v48.js',
  './snazzle-admin-reset-v49.js',
  './snazzle-admin-backup-v50.js',
  './shop-compat.js',
  './kids-fun.js',
  './snazzle-route.js',
  './snazzle-collection.js',
  './snazzle-ar-v80.js',
  './snazzle-ar-safety-v82.js',
  './snazzle-card-system-v2.js',
  './snazzle-card-worlds-v78.js',
  './snazzle-card-world-prompt-v79.js',
  './snazzle-hunt-code-v2.js',
  './snazzle-unlock.js',
  './image-fit.js',
  './snazzle-world.js',
  './snazzle-home-magic.js',
  './snazzle-home-magic-fix.js',
  './village-access.js',
  './snazzle-characters.js',
  './snazzle-adventure-ui-v28.js',
  './snazzle-clean-home-v31.js',
  './snazzle-v32-guard.js',
  './snazzle-image-control-v32.js',
  './snazzle-village-admin-v33.js',
  './snazzle-secret-characters-v34.js',
  './snazzle-idle-hunt-duck-v35.js',
  './snazzle-home-hunt-image-v36.js',
  './snazzle-click-secrets-v37.js',
  './snazzle-world-adventure-v38.js',
  './snazzle-season-theme-v38.js',
  './snazzle-world-theme-v39.js',
  './snazzle-news-v46.js',
  './snazzle-world-hub-v47.js',
  './snazzle-game-menu-v62.js',
  './snazzle-listen-stories-v63.js',
  './snazzle-central-visuals-v54.js',
  './snazzle-public-visual-publish-v64.js',
  './snazzle-image-recovery-v60.js',
  './snazzle-admin-close-v61.js',
  './snazzle-admin-access-v55.js',
  './snazzle-professional-v53.js',
  './snazzle-admin-access-v56.js',
  './snazzle-safe-admin-v58.js',
  './snazzle-final-polish-v59.js',
  './snazzle-star-rewards-v67.js',
  './snazzle-quiet-psst-v68.js',
  './snazzle-input-visibility-v69.js',
  './snazzle-top-stability-v70.js',
  './snazzle-bieb-v73.js',
  './snazzle-bieb-cloud-v74.js',
  './snazzle-bieb-locations-v77.js'
];

function addStyleLink(id,path){
  let link=document.getElementById(id);
  if(link) return link;
  link=document.createElement('link');
  link.id=id;
  link.rel='stylesheet';
  link.href=fresh(path);
  document.head.appendChild(link);
  return link;
}

// Kleine ingebouwde veiligheidsstijl. Zo kan nooit meer de oude basis-layout zichtbaar worden
// alleen omdat een externe stylesheet op 4G nog een fractie later binnenkomt.
(function installCriticalFallback(){
  if(document.getElementById('snazzleCriticalV90')) return;
  const s=document.createElement('style');
  s.id='snazzleCriticalV90';
  s.textContent=`
    body{background:linear-gradient(180deg,#17684c 0%,#0d523f 42%,#083a31 100%)!important;animation:none!important}
    .app{max-width:560px!important;padding:10px 14px 112px!important}
    .snazzle-passport{margin:2px 0 14px!important;padding:15px 16px 13px!important;border-radius:24px!important;background:linear-gradient(145deg,#f5e9c6,#ead199)!important;color:#173d35!important;border:3px solid #b98f4f!important;box-shadow:0 5px 0 #6a4a2c,0 12px 24px rgba(0,0,0,.18)!important;position:relative!important;overflow:hidden!important}
    .passport-kicker{font-size:9px!important;letter-spacing:1.4px!important;text-transform:uppercase!important;font-weight:1000!important;color:#8b6835!important}
    .snazzle-passport #welcomeText{margin:3px 0 10px!important;color:#0e4a3b!important;font-size:29px!important;line-height:1.05!important;text-shadow:none!important;text-transform:none!important}
    .passport-stats{display:grid!important;grid-template-columns:1fr 1fr 1.1fr!important;border-top:1px dashed rgba(84,66,37,.28)!important;padding-top:9px!important}
    .passport-stat{padding:0 8px!important;border-right:1px solid rgba(84,66,37,.2)!important}.passport-stat:last-child{border-right:0!important}
    .passport-stat strong{display:block!important;font-size:15px!important;color:#123f35!important}.passport-stat small{display:block!important;font-size:9px!important;color:#765d38!important}
    .hero{min-height:390px!important;padding:185px 14px 14px!important;margin:0 0 16px!important;border-radius:26px!important;border:3px solid #d0ae67!important;justify-content:flex-end!important;gap:10px!important;overflow:hidden!important;box-shadow:0 6px 0 #4d3824,0 14px 28px rgba(0,0,0,.22)!important}
    .v31-hero-copy{position:relative!important;z-index:4!important;width:100%!important;padding:13px 14px 12px!important;border-radius:18px!important;background:rgba(7,50,39,.84)!important;border:1px solid rgba(244,220,153,.34)!important}
    .v31-hero-copy>small{display:block!important;margin:0 0 5px!important;padding:0!important;background:none!important;border:0!important;font-size:9px!important;letter-spacing:1.5px!important;color:#eed696!important}
    .v31-hero-copy .adventure-title{margin:0!important;font-size:27px!important;line-height:1.05!important;color:#fff8e5!important;text-shadow:none!important}
    .v31-hero-copy>p{margin:6px 0 0!important;font-size:13px!important;line-height:1.42!important;color:#f7f2e6!important;text-shadow:none!important}
    .hero .main-action{position:relative!important;z-index:5!important;width:100%!important;min-height:66px!important;margin:0!important;padding:9px 11px!important;border-radius:18px!important;border:2px solid #f6d07a!important;background:linear-gradient(180deg,#ffb342,#f28c1e)!important;color:#fff!important;box-shadow:0 4px 0 #9a5918,0 7px 14px rgba(0,0,0,.18)!important}
    .hero .main-action strong{font-size:21px!important}.hero .main-action small{color:#fff4d3!important}.hero .main-action .go{background:#f7d36d!important;color:#594019!important}
    .village{position:relative!important;flex:0 0 155px!important;width:155px!important;height:105px!important;padding:0!important;border-radius:18px!important;border:2px solid #c7a35d!important;overflow:hidden!important;display:flex!important;align-items:flex-end!important;justify-content:flex-start!important;background:#1c654c!important;color:#fff!important;font-size:0!important}
    .village .v31-village-label{position:relative!important;z-index:2!important;display:block!important;padding:10px 11px!important;font-size:14px!important;font-weight:950!important}
    .bottom{background:rgba(6,51,41,.97)!important;border-top:1px solid rgba(232,205,135,.35)!important;box-shadow:0 -7px 22px rgba(0,0,0,.18)!important}
    #snV59Boot{position:fixed!important;inset:0!important;z-index:99999!important;display:grid!important;place-items:center!important;background:linear-gradient(180deg,#0d6944,#043b2c)!important;color:#fff7df!important;text-align:center!important;font-family:system-ui,-apple-system,"Segoe UI",sans-serif!important}
    #snV59Boot .sn-v59-boot-inner{width:min(86vw,360px)!important;padding:24px!important}
    #snV59Boot .sn-v59-boot-mark{width:118px!important;height:118px!important;margin:0 auto 18px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:#ffd15c!important;border:6px solid #775026!important;box-shadow:0 9px 0 #4f321d!important;font-size:58px!important;overflow:hidden!important}
    #snV59Boot .sn-v59-boot-mark img{width:100%!important;height:100%!important;object-fit:contain!important;display:block!important}
    #snV59Boot h1{margin:0!important;font-size:46px!important;color:#ffd35e!important}#snV59Boot p{font-size:21px!important;font-weight:900!important;margin:16px 0!important}#snV59Boot small{font-size:15px!important;font-weight:750!important}
    #snV59Boot .sn-v59-boot-line{width:225px!important;max-width:72vw!important;height:6px!important;margin:25px auto 0!important;border-radius:99px!important;background:rgba(255,255,255,.22)!important;overflow:hidden!important}
    #snV59Boot .sn-v59-boot-line:after{content:""!important;display:block!important;width:42%!important;height:100%!important;border-radius:99px!important;background:#ffd969!important;animation:snV90Load 1.15s ease-in-out infinite alternate!important}
    @keyframes snV90Load{from{transform:translateX(0)}to{transform:translateX(138%)}}
  `;
  document.head.appendChild(s);
})();

// Dit zijn de twee stijlen die de ACTUELE rustige home bepalen. Ze krijgen voorrang boven alle zware functies.
const adventureCss=addStyleLink('snazzleAdventureThemeV28','./snazzle-reference-layout.css');
const cleanHomeCss=addStyleLink('snazzleCleanHomeV31','./snazzle-clean-home-v31.css');
addStyleLink('snazzleMagicTheme','./snazzle-magic-theme.css');
addStyleLink('snazzleEnchantedTheme','./snazzle-enchanted-layer.css');
addStyleLink('snazzleProfessionalTheme','./snazzle-professional-v53.css');
addStyleLink('snazzleFinalPolishTheme','./snazzle-final-polish-v59.css');

function refreshLocalStyles(){
  document.querySelectorAll('link[rel="stylesheet"][href]').forEach(link=>{
    try{
      const url=new URL(link.getAttribute('href'),location.href);
      if(url.origin!==location.origin) return;
      if(!url.pathname.includes('/Snazzle-hunt-app/')) return;
      if(url.searchParams.get('fresh')===runtimeVersion) return;
      url.searchParams.set('fresh',runtimeVersion);
      link.href=url.href;
    }catch{}
  });
}
const headObserver=new MutationObserver(refreshLocalStyles);
headObserver.observe(document.head,{childList:true,subtree:true});
refreshLocalStyles();

function cleanVillageName(text){return String(text||'').replace(/^\s*📍\s*/,'').trim();}
function currentVillageName(){return cleanVillageName(document.getElementById('chosenVillageLabel')?.textContent)||'Kies een dorp';}
function currentFindCount(){
  const rows=[...document.querySelectorAll('#findsList .listitem')];
  if(!rows.length) return 0;
  if(rows.length===1&&/nog niets gevonden/i.test(rows[0].textContent||'')) return 0;
  return rows.length;
}

// Lichtgewicht versie van v28/v31: alleen de zichtbare actuele home-structuur.
// Geen IndexedDB, beheerpanelen of cloudwerk in het kritieke opstartpad.
function applyCriticalCurrentHome(){
  try{
    const top=document.querySelector('.top');
    const welcome=document.getElementById('welcomeText');
    if(top&&welcome){
      let passport=document.getElementById('snazzlePassport');
      if(!passport){
        passport=document.createElement('section');
        passport.id='snazzlePassport';
        passport.className='snazzle-passport';
        passport.innerHTML='<div class="passport-kicker">Mijn Snazzle paspoort</div><div class="passport-welcome-slot"></div><div class="passport-stats"><div class="passport-stat"><strong id="passportFinds">0</strong><small>Snazzles gevonden</small></div><div class="passport-stat"><strong id="passportVillage">—</strong><small>gekozen dorp</small></div><div class="passport-stat"><strong>Explorer</strong><small>klaar voor avontuur</small></div></div>';
        top.insertAdjacentElement('afterend',passport);
      }
      const slot=passport.querySelector('.passport-welcome-slot');
      if(slot&&welcome.parentElement!==slot) slot.appendChild(welcome);
      const pf=document.getElementById('passportFinds');
      const pv=document.getElementById('passportVillage');
      if(pf) pf.textContent=String(currentFindCount());
      if(pv) pv.textContent=currentVillageName();
    }

    const hero=document.getElementById('hero');
    const start=document.getElementById('bigStart');
    if(hero){
      let title=document.getElementById('adventureTitle');
      if(!title){
        title=document.createElement('h2');
        title.id='adventureTitle';
        title.className='adventure-title';
      }
      let wrap=hero.querySelector('.v31-hero-copy');
      if(!wrap){
        wrap=document.createElement('div');
        wrap.className='v31-hero-copy';
        if(start&&start.parentElement===hero) hero.insertBefore(wrap,start); else hero.appendChild(wrap);
      }
      const small=hero.querySelector(':scope > small')||wrap.querySelector(':scope > small');
      const p=hero.querySelector(':scope > p')||wrap.querySelector(':scope > p');
      if(small&&small.parentElement!==wrap) wrap.appendChild(small);
      if(title.parentElement!==wrap) wrap.appendChild(title);
      if(p&&p.parentElement!==wrap) wrap.appendChild(p);
      if(small) small.textContent='Snazzle avontuur';
      title.textContent='Klaar voor avontuur?';
      if(p) p.textContent='Vind een Snazzle en ontdek jouw dorp.';
      if(start&&start.parentElement!==hero) hero.appendChild(start);
    }

    document.querySelectorAll('.village').forEach(btn=>{
      if(btn.querySelector('.v31-village-label')) return;
      const name=cleanVillageName(btn.textContent);
      btn.textContent='';
      const span=document.createElement('span');
      span.className='v31-village-label';
      span.textContent=name;
      btn.appendChild(span);
    });
    document.documentElement.dataset.snazzleCurrentHome='v90';
  }catch(err){console.warn('Snazzle critical home',err);}
}

let releaseBootNow=()=>{};
(function installBoot(){
  const build=()=>{
    if(!document.body||document.getElementById('snV59Boot')) return;
    document.body.classList.add('sn-v59-booting');
    const splash=document.createElement('div');
    splash.id='snV59Boot';splash.className='sn-v59-boot';splash.setAttribute('aria-hidden','true');
    splash.innerHTML='<div class="sn-v59-boot-inner"><div class="sn-v59-boot-mark">🦆</div><h1>Snazzle</h1><p>Samen naar buiten</p><small>Je avontuur wordt klaargezet…</small><div class="sn-v59-boot-line"></div></div>';
    document.body.appendChild(splash);
    try{
      const src=String(JSON.parse(localStorage.getItem('snazzleSettings')||'{}')?.introImage||'');
      if(src){const mark=splash.querySelector('.sn-v59-boot-mark');const img=document.createElement('img');img.src=src;img.alt='Snazzle';mark.replaceChildren(img);}
    }catch{}
    let released=false;
    const release=()=>{
      if(released) return;
      released=true;
      applyCriticalCurrentHome();
      splash.style.setProperty('display','none','important');
      splash.style.setProperty('visibility','hidden','important');
      splash.style.setProperty('pointer-events','none','important');
      document.body.classList.remove('sn-v59-booting');
      document.body.classList.add('sn-v59-ready');
      setTimeout(()=>splash.remove(),30);
    };
    releaseBootNow=release;
    window.__snazzleReleaseBoot=release;
    // Zelfs als Firebase tijdelijk traag is: toon na 6,5 s de ACTUELE shell, nooit meer de oude index-home.
    setTimeout(release,6500);
  };
  if(document.body) build(); else document.addEventListener('DOMContentLoaded',build,{once:true});
})();

async function safeImport(path){
  try{return await import(fresh(path));}
  catch(err){console.error(`Snazzle module kon niet laden: ${path}`,err);return null;}
}
function waitStyle(link,maxWait=1300){
  try{if(link?.sheet) return Promise.resolve();}catch{}
  return new Promise(resolve=>{
    if(!link) return resolve();
    let done=false;const finish=()=>{if(done)return;done=true;resolve();};
    link.addEventListener('load',finish,{once:true});link.addEventListener('error',finish,{once:true});setTimeout(finish,maxWait);
  });
}

// Cruciaal: bouw de huidige home al achter het laadscherm, vóór Firebase en vóór alle extra functies.
applyCriticalCurrentHome();

// Alleen de werkende Hunt-kern is blokkerend. We starten NIET meer vijftig downloads tegelijk op 4G.
try{
  await import(fresh('./app-core.js'));
}catch(err){
  console.error('Snazzle app-core kon niet laden',err);
}

// app-core kan dorpknoppen opnieuw hebben opgebouwd; zet de actuele structuur daarom nog één keer vast.
applyCriticalCurrentHome();
await Promise.allSettled([waitStyle(adventureCss),waitStyle(cleanHomeCss)]);
try{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}catch{}
applyCriticalCurrentHome();
releaseBootNow();

// Houd de lichte actuele structuur tijdens de eerste renderseconden intact wanneer Firebase inhoud vernieuwt.
let shellTicks=0;
const shellTimer=setInterval(()=>{
  applyCriticalCurrentHome();
  shellTicks++;
  if(shellTicks>=16) clearInterval(shellTimer);
},500);

// Alle extra functies laden NU pas op de achtergrond, in de bewezen bestaande volgorde.
// Dit blokkeert de zichtbare home niet meer. v28/v31 herkennen de reeds gemaakte structuur en vullen
// alleen de volledige beeld-/beheerfuncties aan.
(async()=>{
  for(const modulePath of optionalModules){
    await safeImport(modulePath);
    refreshLocalStyles();
  }
  try{await window.__snazzleRuntimeSettle71?.();}catch(err){console.warn('Snazzle settle v71',err);}
})().catch(err=>console.warn('Snazzle achtergrondmodules',err));

// Shop blijft gekoppeld aan de bestaande Firebase-auth, maar ook dit is geen onderdeel van de zichtbare boot.
(async()=>{
  try{
    const {getAuth,onAuthStateChanged}=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    const auth=getAuth();
    let shopLoaded=false;
    onAuthStateChanged(auth,async user=>{
      if(!user||shopLoaded) return;
      shopLoaded=true;
      await safeImport('./shop.js');
      await safeImport('./shop-email-settings.js');
      refreshLocalStyles();
    });
  }catch(err){console.warn('Snazzle shop later laden',err);}
})();

setTimeout(()=>{refreshLocalStyles();headObserver.disconnect();},15000);
