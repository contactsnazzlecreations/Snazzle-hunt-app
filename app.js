// Snazzle Hunt entrypoint — v92 functional-first boot.
// Belangrijk: de app wordt pas zichtbaar nadat app-core volledig is uitgevoerd.
// Daardoor werken menu, knoppen en sheets meteen wanneer het laadscherm verdwijnt.

const runtimeVersion = '20260826-v92';
const fresh = (path) => `${path}${path.includes('?') ? '&' : '?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion = runtimeVersion;
window.__snazzleFresh = fresh;

function addTheme(id, path) {
  let link = document.getElementById(id);
  if (link) return link;
  link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = fresh(path);
  document.head.appendChild(link);
  return link;
}

// De huidige visuele laag start direct met downloaden.
addTheme('snazzleAdventureThemeV28', './snazzle-reference-layout.css');
addTheme('snazzleCleanHomeV31', './snazzle-clean-home-v31.css');
addTheme('snazzleMagicTheme', './snazzle-magic-theme.css');
addTheme('snazzleEnchantedTheme', './snazzle-enchanted-layer.css');
addTheme('snazzleProfessionalTheme', './snazzle-professional-v53.css');
addTheme('snazzleFinalPolishTheme', './snazzle-final-polish-v59.css');

function cleanVillageName(text) {
  return String(text || '').replace(/^\s*📍\s*/, '').trim();
}

// Lichtgewicht bescherming van de actuele home-structuur.
// app-core blijft eigenaar van alle echte functies en knoppen.
function ensureCurrentHome() {
  try {
    const top = document.querySelector('.top');
    const welcome = document.getElementById('welcomeText');

    if (top && welcome) {
      let passport = document.getElementById('snazzlePassport');
      if (!passport) {
        passport = document.createElement('section');
        passport.id = 'snazzlePassport';
        passport.className = 'snazzle-passport';
        passport.innerHTML = `
          <div class="passport-kicker">Mijn Snazzle paspoort</div>
          <div class="passport-welcome-slot"></div>
          <div class="passport-stats">
            <div class="passport-stat"><strong id="passportFinds">0</strong><small>Snazzles gevonden</small></div>
            <div class="passport-stat"><strong id="passportVillage">—</strong><small>gekozen dorp</small></div>
            <div class="passport-stat"><strong>Explorer</strong><small>klaar voor avontuur</small></div>
          </div>`;
        top.insertAdjacentElement('afterend', passport);
      }
      const slot = passport.querySelector('.passport-welcome-slot');
      if (slot && welcome.parentElement !== slot) slot.appendChild(welcome);
      const village = document.getElementById('passportVillage');
      if (village) village.textContent = cleanVillageName(document.getElementById('chosenVillageLabel')?.textContent) || 'Kies dorp';
    }

    const hero = document.getElementById('hero');
    const start = document.getElementById('bigStart');
    if (hero) {
      let wrap = hero.querySelector('.v31-hero-copy');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'v31-hero-copy';
        if (start && start.parentElement === hero) hero.insertBefore(wrap, start);
        else hero.appendChild(wrap);
      }

      let title = document.getElementById('adventureTitle');
      if (!title) {
        title = document.createElement('h2');
        title.id = 'adventureTitle';
        title.className = 'adventure-title';
      }

      const small = hero.querySelector(':scope > small') || wrap.querySelector(':scope > small');
      const paragraph = hero.querySelector(':scope > p') || wrap.querySelector(':scope > p');
      if (small && small.parentElement !== wrap) wrap.appendChild(small);
      if (title.parentElement !== wrap) wrap.appendChild(title);
      if (paragraph && paragraph.parentElement !== wrap) wrap.appendChild(paragraph);
      if (small) small.textContent = 'Snazzle avontuur';
      title.textContent = 'Klaar voor avontuur?';
      if (paragraph) paragraph.textContent = 'Vind een Snazzle en ontdek jouw dorp.';
      if (start && start.parentElement !== hero) hero.appendChild(start);
    }

    document.querySelectorAll('.village').forEach((button) => {
      if (button.querySelector('.v31-village-label')) return;
      const name = cleanVillageName(button.textContent);
      button.textContent = '';
      const label = document.createElement('span');
      label.className = 'v31-village-label';
      label.textContent = name;
      button.appendChild(label);
    });

    document.documentElement.dataset.snazzleCurrentHome = 'v92';
  } catch (err) {
    console.warn('Snazzle current home', err);
  }
}

let releaseBoot = () => {};
let showBootError = () => {};
(function installBoot() {
  const build = () => {
    if (!document.body || document.getElementById('snV59Boot')) return;

    document.body.classList.add('sn-v59-booting');
    const splash = document.createElement('div');
    splash.id = 'snV59Boot';
    splash.className = 'sn-v59-boot';
    splash.setAttribute('aria-hidden', 'false');
    splash.innerHTML = `
      <div class="sn-v59-boot-inner">
        <div class="sn-v59-boot-mark">🦆</div>
        <h1>Snazzle</h1>
        <p>Samen naar buiten</p>
        <small id="snBootStatus">Je avontuur wordt klaargezet…</small>
        <div class="sn-v59-boot-line"></div>
      </div>`;
    document.body.appendChild(splash);

    try {
      const settings = JSON.parse(localStorage.getItem('snazzleSettings') || '{}');
      const src = String(settings?.introImage || '');
      if (src) {
        const mark = splash.querySelector('.sn-v59-boot-mark');
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Snazzle';
        mark.replaceChildren(img);
      }
    } catch {}

    let released = false;
    releaseBoot = () => {
      if (released) return;
      released = true;
      ensureCurrentHome();
      splash.style.setProperty('display', 'none', 'important');
      splash.style.setProperty('visibility', 'hidden', 'important');
      splash.style.setProperty('pointer-events', 'none', 'important');
      splash.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('sn-v59-booting');
      document.body.classList.add('sn-v59-ready');
      setTimeout(() => splash.remove(), 40);
    };
    window.__snazzleReleaseBoot = releaseBoot;

    showBootError = () => {
      const status = document.getElementById('snBootStatus');
      if (status) status.textContent = 'De verbinding duurt wat langer…';
    };
    // Geen oude/incomplete app meer tonen als internet even traag is.
    setTimeout(showBootError, 7000);
  };

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build, { once: true });
})();

async function safeImport(path) {
  try {
    return await import(fresh(path));
  } catch (err) {
    console.error(`Snazzle module kon niet laden: ${path}`, err);
    return null;
  }
}

function afterPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

void (async () => {
  // DE KRITIEKE FIX VAN v92:
  // app-core bevat alle click-bindings, het snelmenu, bottom-nav, sheets en Firebase-start.
  // We wachten nu echt totdat deze module volledig uitgevoerd is voordat de app zichtbaar wordt.
  const core = await safeImport('./app-core.js');
  if (!core) {
    const status = document.getElementById('snBootStatus');
    if (status) status.textContent = 'Snazzle kon niet verbinden. Vernieuw de pagina.';
    return;
  }

  // app-core heeft nu renderAll() uitgevoerd en ALLE basisknoppen zijn gebonden.
  ensureCurrentHome();

  // De twee actuele home-lagen mogen nog vóór de eerste zichtbare render hun presentatie zetten.
  await Promise.allSettled([
    safeImport('./snazzle-adventure-ui-v28.js'),
    safeImport('./snazzle-clean-home-v31.js')
  ]);

  ensureCurrentHome();
  try { await afterPaint(); } catch {}
  ensureCurrentHome();
  releaseBoot();

  // Nieuwere functies laden daarna rustig door; de app is ondertussen volledig bedienbaar.
  const backgroundModules = [
    './snazzle-runtime-stability-v71.js',
    './snazzle-image-stability-v72.js',
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

  for (const modulePath of backgroundModules) {
    await safeImport(modulePath);
  }

  try { await window.__snazzleRuntimeSettle71?.(); } catch {}
  ensureCurrentHome();

  // Shop gebruikt de auth die app-core inmiddels al heeft gestart.
  try {
    const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    const auth = getAuth();
    let shopLoaded = false;
    onAuthStateChanged(auth, async (user) => {
      if (!user || shopLoaded) return;
      shopLoaded = true;
      await safeImport('./shop.js');
      await safeImport('./shop-email-settings.js');
    });
  } catch (err) {
    console.warn('Snazzle shop later laden', err);
  }
})().catch((err) => {
  console.error('Snazzle startupfout', err);
  const status = document.getElementById('snBootStatus');
  if (status) status.textContent = 'Snazzle kon niet starten. Vernieuw de pagina.';
});
