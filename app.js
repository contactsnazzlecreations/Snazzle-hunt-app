// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.

// Gebruik de versie uit de app.js-URL als centrale cache-buster voor ALLE lokale bestanden.
// De refresh-pagina geeft bij iedere start een nieuwe waarde mee, zodat nooit een mix van oude en nieuwe modules wordt geladen.
const runtimeVersion = new URL(import.meta.url).searchParams.get('v') || Date.now().toString();
const fresh = (path) => `${path}${path.includes('?') ? '&' : '?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion = runtimeVersion;
window.__snazzleFresh = fresh;

// Sommige oudere presentatiemodules voegen zelf CSS toe met een vast ?v= nummer.
// Op andere telefoons kon daardoor alsnog een oude stylesheet blijven hangen, terwijl app.js al nieuw was.
// Iedere lokale stylesheet krijgt daarom dezelfde unieke runtime-versie als de JavaScript-modules.
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

// Een optionele extra module mag nooit meer verhinderen dat alle nieuwere lagen daarna laden.
// Op een schoon toestel kon één fout anders de laadketen halverwege stoppen en precies de oude paspoort-layout achterlaten.
async function safeImport(path){
  try{
    return await import(fresh(path));
  }catch(err){
    console.error(`Snazzle module kon niet laden: ${path}`,err);
    return null;
  }
}

// v71 + v72 worden vroeg geladen: compositor-optimalisatie, beelddecoding en bronbewaking zijn actief vóór app-core.
await safeImport('./snazzle-runtime-stability-v71.js');
await safeImport('./snazzle-image-stability-v72.js');

// Presentatielaag: sprookjesachtige Magic Jungle stijl zonder app-logica te wijzigen.
const magicTheme = document.createElement('link');
magicTheme.rel = 'stylesheet';
magicTheme.href = fresh('./snazzle-magic-theme.css');
document.head.appendChild(magicTheme);

// Extra rustige familiefilm-magie: lichtstralen, gloed en rijkere collectiepagina's.
const enchantedTheme = document.createElement('link');
enchantedTheme.rel = 'stylesheet';
enchantedTheme.href = fresh('./snazzle-enchanted-layer.css');
document.head.appendChild(enchantedTheme);

// v53: centrale premium afwerking voor consistentie, toegankelijkheid en gezinsgebruik.
const professionalTheme = document.createElement('link');
professionalTheme.rel = 'stylesheet';
professionalTheme.href = fresh('./snazzle-professional-v53.css');
document.head.appendChild(professionalTheme);

// v59: laatste gecontroleerde kwaliteitslaag. Deze CSS staat vroeg zodat ook de echte bootervaring direct klopt.
const finalPolishTheme = document.createElement('link');
finalPolishTheme.rel = 'stylesheet';
finalPolishTheme.href = fresh('./snazzle-final-polish-v59.css');
document.head.appendChild(finalPolishTheme);
refreshLocalStyles();

// Rustige laadlaag bij iedere start. De app wordt pas zichtbaar als de modules en lokale stylesheets zijn gezet.
// Hierdoor ziet de gebruiker geen tussenstappen waarin kaarten, kleuren of knoppen nog verspringen.
(function installEarlyBootV59(){
  const build=()=>{
    if(!document.body || document.getElementById('snV59Boot')) return;
    document.body.classList.add('sn-v59-booting');
    const seen=sessionStorage.getItem('snazzleProSplashSeen')==='1';
    sessionStorage.setItem('snazzleProSplashSeen','1');
    const splash=document.createElement('div');
    splash.id='snV59Boot';
    splash.className='sn-v59-boot';
    splash.setAttribute('aria-hidden','true');
    splash.innerHTML='<div class="sn-v59-boot-inner"><div class="sn-v59-boot-mark">🦆</div><h1>Snazzle</h1><p>Samen naar buiten</p><small>Je avontuur wordt klaargezet…</small><div class="sn-v59-boot-line"></div></div>';
    document.body.appendChild(splash);
    const born=performance.now();
    let released=false;
    window.__snazzleReleaseBoot=()=>{
      if(released) return;
      released=true;
      const minVisible=seen ? 180 : 480;
      const wait=Math.max(0,minVisible-(performance.now()-born));
      setTimeout(()=>{
        splash.classList.add('hide');
        document.body.classList.remove('sn-v59-booting');
        document.body.classList.add('sn-v59-ready');
        setTimeout(()=>splash.remove(),350);
      },wait);
    };
    // Absolute noodrem: een presentatie-effect mag de app nooit blokkeren.
    setTimeout(()=>window.__snazzleReleaseBoot?.(),5200);
  };
  if(document.body) build(); else document.addEventListener('DOMContentLoaded',build,{once:true});
})();

// app-core is de enige kritieke module: zonder deze kern is er geen werkende Hunt-app.
await import(fresh('./app-core.js'));

// Alle aanvullende lagen worden geïsoleerd geladen. Eén toestel-specifieke fout kan de rest niet meer blokkeren.
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
  './snazzle-card-system-v2.js',
  './snazzle-card-worlds-v78.js',
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
for(const modulePath of optionalModules){
  await safeImport(modulePath);
  refreshLocalStyles();
}

// Wacht één korte rendercyclus op de definitieve stylesheets voordat de laadlaag verdwijnt.
// Animaties blijven behouden; de gebruiker ziet alleen niet meer hoe tientallen modules één voor één opbouwen.
try{ await window.__snazzleRuntimeSettle71?.(); }catch(err){ console.warn('Snazzle settle v71',err); }
window.__snazzleReleaseBoot?.();

// v45 recovery: Samen Buiten, Extra Hints en alle latere mobiele fixlagen zijn tijdelijk uitgeschakeld.
// De bestanden blijven in de repository zodat we ze gecontroleerd één voor één terug kunnen plaatsen.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

// Load the shop only after Firebase has restored/created a signed-in user.
// This prevents a first-load permission race on mobile browsers.
const auth = getAuth();
let shopLoaded = false;
onAuthStateChanged(auth, async user => {
  if (!user || shopLoaded) return;
  shopLoaded = true;
  await safeImport('./shop.js');
  await safeImport('./shop-email-settings.js');
  refreshLocalStyles();
});

// Laat de observer nog even actief voor laat toegevoegde thema-CSS; daarna is de UI opgebouwd.
setTimeout(()=>{refreshLocalStyles();headObserver.disconnect();},12000);
