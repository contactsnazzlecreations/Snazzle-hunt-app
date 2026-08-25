// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.

// Gebruik de versie uit de app.js-URL als centrale cache-buster voor ALLE lokale bestanden.
// De refresh-pagina geeft bij iedere start een nieuwe waarde mee, zodat nooit een mix van oude en nieuwe modules wordt geladen.
const runtimeVersion = new URL(import.meta.url).searchParams.get('v') || Date.now().toString();
const fresh = (path) => `${path}${path.includes('?') ? '&' : '?'}fresh=${encodeURIComponent(runtimeVersion)}`;

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

// Echte startbeleving vóór de zware modules. v53 gebruikt dezelfde sessievlag en maakt daardoor geen tweede splash.
(function installEarlyBootV59(){
  const build=()=>{
    if(!document.body || document.getElementById('snV59Boot')) return;
    document.body.classList.add('sn-v59-booting');
    if(sessionStorage.getItem('snazzleProSplashSeen')==='1'){
      document.body.classList.remove('sn-v59-booting');
      document.body.classList.add('sn-v59-ready');
      return;
    }
    sessionStorage.setItem('snazzleProSplashSeen','1');
    const splash=document.createElement('div');
    splash.id='snV59Boot';
    splash.className='sn-v59-boot';
    splash.setAttribute('aria-hidden','true');
    splash.innerHTML='<div class="sn-v59-boot-inner"><div class="sn-v59-boot-mark">🦆</div><h1>Snazzle</h1><p>Samen naar buiten</p><small>Je avontuur wordt klaargezet…</small><div class="sn-v59-boot-line"></div></div>';
    document.body.appendChild(splash);
    // Absolute noodrem: een presentatie-effect mag de app nooit blokkeren.
    setTimeout(()=>{
      splash.classList.add('hide');
      document.body.classList.remove('sn-v59-booting');
      document.body.classList.add('sn-v59-ready');
      setTimeout(()=>splash.remove(),350);
    },3200);
  };
  if(document.body) build(); else document.addEventListener('DOMContentLoaded',build,{once:true});
})();

// Belangrijk: lokaal alles met exact dezelfde runtimeVersion laden.
await import(fresh('./app-core.js'));
// v51: controleert automatisch op nieuwe GitHub-versies en vernieuwt veilig zonder oude cache.
await import(fresh('./snazzle-auto-update-v51.js'));
// v52: openbaar privacybeleid + duidelijke privacy- en kindveiligheidslinks in de app.
await import(fresh('./snazzle-privacy-v52.js'));
// v48: logo en hoofdafbeeldingen centraal delen zodat ieder toestel hetzelfde uiterlijk ziet.
await import(fresh('./snazzle-central-assets-v48.js'));
// v49: veilige beheer-wachtwoordreset via Firebase Auth.
await import(fresh('./snazzle-admin-reset-v49.js'));
// v50: veilige tweede hoofdbeheerder voor noodherstel + onthouden beheer-e-mailadres.
await import(fresh('./snazzle-admin-backup-v50.js'));
await import(fresh('./shop-compat.js'));
await import(fresh('./kids-fun.js'));
await import(fresh('./snazzle-route.js'));
await import(fresh('./snazzle-collection.js'));
await import(fresh('./snazzle-card-system-v2.js'));
await import(fresh('./snazzle-hunt-code-v2.js'));
await import(fresh('./snazzle-unlock.js'));
await import(fresh('./image-fit.js'));
await import(fresh('./snazzle-world.js'));
await import(fresh('./snazzle-home-magic.js'));
await import(fresh('./snazzle-home-magic-fix.js'));
await import(fresh('./village-access.js'));
await import(fresh('./snazzle-characters.js'));
// Adventure Passport-basis: bestaande functies blijven intact.
await import(fresh('./snazzle-adventure-ui-v28.js'));
// v31: rustige home zonder overlappende tekst.
await import(fresh('./snazzle-clean-home-v31.js'));
// Compatibility guard voorkomt dat het oude v31-beeldbeheer opnieuw wordt opgebouwd.
await import(fresh('./snazzle-v32-guard.js'));
// v32: alle zichtbare beelden beter beheerbaar.
await import(fresh('./snazzle-image-control-v32.js'));
// v33: afbeelding per dorp direct in Dorpen-beheer + duidelijkere eenmalige knipoog.
await import(fresh('./snazzle-village-admin-v33.js'));
// v34.1: bewegende Snazzle gebruikt standaard de afbeelding van Snazzle gids / menu.
await import(fresh('./snazzle-secret-characters-v34.js'));
// v35: het eendje in 'Nu te vinden' bij geen actieve Hunt is apart vervangbaar.
await import(fresh('./snazzle-idle-hunt-duck-v35.js'));
// v36: eigen afbeelding voor de Snazzle Thuis Hunt-kaart en het Thuis Hunt-menu.
await import(fresh('./snazzle-home-hunt-image-v36.js'));
// v37: klikbare geheime verrassingen — alleen zichtbaar nadat een kind het geheim aantikt.
await import(fresh('./snazzle-click-secrets-v37.js'));
// v38: klikbare Snazzle Wereld met wandelen, natuurkennis, beweegmissie en sterrenprogressie.
await import(fresh('./snazzle-world-adventure-v38.js'));
// v38: seizoenssferen voor Home, inclusief Kerst, Pasen, Halloween en eigen afbeeldingen/kleuren.
await import(fresh('./snazzle-season-theme-v38.js'));
// v39: minder cartooneske 2.5D wereld + aparte afbeeldingen per seizoenthema.
await import(fresh('./snazzle-world-theme-v39.js'));
// v46: Het Snazzle Nieuws — interactieve krant met centraal paginabeheer.
await import(fresh('./snazzle-news-v46.js'));
// v47: één rustige Snazzle Wereld-hub met privé kamer, missies, verhalen, badges, TV, mascotte, geheimen en seizoen.
await import(fresh('./snazzle-world-hub-v47.js'));
// v62: duidelijke ingang naar het Snazzle Spel terug in het gewone menu.
await import(fresh('./snazzle-game-menu-v62.js'));
// v54: alle oudere lokale beeldkeuzes veilig naar centraal beeldbeheer migreren en op elk toestel synchroniseren.
await import(fresh('./snazzle-central-visuals-v54.js'));
// v60: zichtbare herstelhulp voor oude lokale beeldkeuzes; alleen Hoofdbeheer kan naar centraal herstellen.
await import(fresh('./snazzle-image-recovery-v60.js'));
// v61: beheerpaneel altijd betrouwbaar afsluitbaar op mobiel.
await import(fresh('./snazzle-admin-close-v61.js'));
// v55: extra mobiele beheercompatibiliteit.
await import(fresh('./snazzle-admin-access-v55.js'));
// v53: professionele basispolish nadat de bestaande schermen zijn opgebouwd.
await import(fresh('./snazzle-professional-v53.js'));
// v56: volledig onafhankelijke beheer-ingang als laatste compatibiliteitslaag.
await import(fresh('./snazzle-admin-access-v56.js'));
// v58: veilige auth-bewuste beheerroute. Gebruik ?veiligbeheer=1; opent pas nadat Firebase Auth klaar is.
await import(fresh('./snazzle-safe-admin-v58.js'));
// v59: afwerking van de tien professionele punten. Bewust ná v58; raakt auth niet aan.
await import(fresh('./snazzle-final-polish-v59.js'));

// v45 recovery: Samen Buiten, Extra Hints en alle latere mobiele fixlagen zijn tijdelijk uitgeschakeld.
// De bestanden blijven in de repository zodat we ze gecontroleerd één voor één terug kunnen plaatsen.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

// Load the shop only after Firebase has restored/created a signed-in user.
// This prevents a first-load permission race on mobile browsers.
const auth = getAuth();
let shopLoaded = false;
onAuthStateChanged(auth, user => {
  if (!user || shopLoaded) return;
  shopLoaded = true;
  import(fresh('./shop.js'))
    .then(()=>import(fresh('./shop-email-settings.js')))
    .catch(err => console.error('Snazzle shop kon niet laden', err));
});