// Snazzle Hunt — Adventure Passport UI v27
// Additive UI only: existing hunt, menu, admin and navigation logic stays intact.

const ADVENTURE_UI_VERSION = '27.0.0';
const $a = (s, r = document) => r.querySelector(s);
const $$a = (s, r = document) => [...r.querySelectorAll(s)];

const DB_NAME = 'snazzleVisualAssetsV27';
const STORE = 'assets';
const cache = new Map();
let dbPromise = null;
let refreshQueued = false;
let runnerTimer = null;
let peekerTimer = null;

const EXTRA_ASSETS = [
  ['quickFinds', 'Kaart Mijn vondsten', 'Achtergrond voor Mijn vondsten'],
  ['quickProfile', 'Kaart Mijn profiel', 'Achtergrond voor Mijn profiel'],
  ['guideCharacter', 'Snazzle gids', 'Snazzle voor gids- en menumomenten'],
  ['secretCharacter', 'Geheime Snazzle', 'Snazzle die onverwacht door beeld beweegt'],
  ['natureCharacter', 'Natuur Snazzle', 'Snazzle voor de natuurwereld'],
  ['celebrationCharacter', 'Feest / beloning Snazzle', 'Snazzle voor beloningen en vondsten']
];

function ensureTheme() {
  if ($a('#snazzleAdventureThemeV27')) return;
  const link = document.createElement('link');
  link.id = 'snazzleAdventureThemeV27';
  link.rel = 'stylesheet';
  link.href = './snazzle-reference-layout.css?v=27';
  document.head.appendChild(link);
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Afbeeldingenopslag kon niet worden geopend'));
  });
  return dbPromise;
}

async function assetGet(key) {
  if (cache.has(key)) return cache.get(key) || '';
  try {
    const db = await openDb();
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result || '');
      req.onerror = () => reject(req.error);
    });
    cache.set(key, value || '');
    return value || '';
  } catch (err) {
    console.warn('Snazzle afbeelding lezen mislukt', err);
    return '';
  }
}

async function assetSet(key, value) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  cache.set(key, value || '');
}

async function assetDelete(key) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  cache.set(key, '');
}

function compressImage(file, max = 1200, quality = .82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) return reject(new Error('Kies een afbeelding.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Afbeelding kon niet worden gelezen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Afbeelding kon niet worden geopend.'));
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const scale = Math.min(1, max / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let out = canvas.toDataURL('image/webp', quality);
        if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/png');
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function toast(message) {
  const t = $a('#toast');
  if (!t) return console.info(message);
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(window.__adventureToast);
  window.__adventureToast = setTimeout(() => t.classList.remove('show'), 2600);
}

function cleanVillageName(text) {
  return String(text || '').replace(/^\s*📍\s*/, '').trim();
}

function villageSlug(name) {
  return String(name || '').trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function selectedVillage() {
  return cleanVillageName($a('#chosenVillageLabel')?.textContent) || 'Kies een dorp';
}

function findingsCount() {
  const list = $a('#findsList');
  if (!list) return 0;
  const items = $$a('.listitem', list);
  if (items.length === 1 && /nog niets gevonden/i.test(items[0].textContent || '')) return 0;
  return items.length;
}

function ensurePassport() {
  const top = $a('.top');
  const welcome = $a('#welcomeText');
  if (!top || !welcome) return;

  let passport = $a('#snazzlePassport');
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
  const slot = $a('.passport-welcome-slot', passport);
  if (slot && welcome.parentElement !== slot) slot.appendChild(welcome);
  updatePassport();
}

function updatePassport() {
  const finds = $a('#passportFinds');
  const village = $a('#passportVillage');
  if (finds) finds.textContent = String(findingsCount());
  if (village) village.textContent = selectedVillage();
}

function ensureAdventureHero() {
  const hero = $a('#hero');
  const start = $a('#bigStart');
  if (!hero || !start) return;

  const kicker = hero.querySelector(':scope > small');
  if (kicker) kicker.textContent = 'Snazzle avontuur';

  if (!$a('#adventureTitle', hero)) {
    const title = document.createElement('h2');
    title.id = 'adventureTitle';
    title.className = 'adventure-title';
    title.textContent = 'Klaar voor avontuur?';
    const p = hero.querySelector(':scope > p');
    if (p) hero.insertBefore(title, p);
    else hero.appendChild(title);
  }

  if (!$a('.adventure-route', hero)) {
    const route = document.createElement('div');
    route.className = 'adventure-route';
    route.setAttribute('aria-hidden', 'true');
    route.innerHTML = '<span class="route-mark one">?</span><span class="route-mark two">✦</span><span class="route-mark three">?</span><span class="route-duck">🦆</span>';
    hero.insertBefore(route, hero.firstChild);
  }

  if (start.parentElement !== hero) hero.appendChild(start);
}

function relabelImageAdmin() {
  const images = $a('#imagesAdmin');
  if (!images) return;
  $$a('h3', images).forEach(h => {
    const text = (h.textContent || '').trim();
    if (text === 'Profielfoto / logo') h.textContent = 'Snazzle logo / profielfoto';
    if (text === 'Welkomstafbeelding') h.textContent = 'Grote Hunt-kaart / avontuur-afbeelding';
    if (text === 'Extra afbeelding 1') h.textContent = 'Snazzle nieuws-afbeelding';
    if (text === 'Extra afbeelding 2') h.textContent = 'Actie / evenement-afbeelding';
  });
  const intro = images.querySelector(':scope > p');
  if (intro && !intro.dataset.adventureRelabeled) {
    intro.dataset.adventureRelabeled = '1';
    intro.textContent = 'De bestaande algemene afbeeldingen kun je hier blijven vervangen. Daaronder staan extra afbeeldingsvakken voor de nieuwe avonturenlayout.';
  }
}

function previewContent(src) {
  return src ? `<img src="${src}" alt="Voorbeeld">` : 'Nog geen afbeelding';
}

function updatePreview(container, src) {
  const preview = container?.querySelector('.reference-asset-preview');
  if (preview) preview.innerHTML = previewContent(src);
}

async function ensureExtraAssetAdmin() {
  const images = $a('#imagesAdmin');
  if (!images || $a('#referenceAssets', images)) return;

  const wrap = document.createElement('div');
  wrap.id = 'referenceAssets';
  wrap.className = 'reference-assets';
  wrap.innerHTML = `
    <h3>✨ Thema-afbeeldingen & Snazzle-personages</h3>
    <p>Deze nieuwe afbeeldingsvakken zijn van jou: je kunt ze op ieder moment vervangen. Ze worden op dit toestel bewaard.</p>
    <div class="reference-asset-grid" id="referenceAssetGrid"></div>
    <h3 style="margin-top:17px">🏘️ Afbeeldingen per dorp</h3>
    <p>Geef ieder dorpkaartje zijn eigen foto.</p>
    <div class="reference-village-assets" id="referenceVillageAssets"></div>`;
  images.appendChild(wrap);

  const grid = $a('#referenceAssetGrid', wrap);
  for (const [key, label, hint] of EXTRA_ASSETS) {
    const src = await assetGet(key);
    const card = document.createElement('div');
    card.className = 'reference-asset-card';
    card.dataset.assetKey = key;
    card.innerHTML = `
      <strong>${label}</strong>
      <div class="reference-asset-preview" title="${hint}">${previewContent(src)}</div>
      <input type="file" accept="image/*">
      <button type="button">Afbeelding verwijderen</button>`;
    const input = card.querySelector('input');
    const remove = card.querySelector('button');
    input.onchange = async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const isCharacter = key.endsWith('Character');
        const data = await compressImage(file, isCharacter ? 900 : 1200, isCharacter ? .86 : .80);
        await assetSet(key, data);
        input.value = '';
        updatePreview(card, data);
        await applyAssets();
        toast('Afbeelding opgeslagen ✨');
      } catch (err) {
        toast(err.message || 'Opslaan mislukt');
      }
    };
    remove.onclick = async () => {
      await assetDelete(key);
      updatePreview(card, '');
      await applyAssets();
      toast('Afbeelding verwijderd');
    };
    grid.appendChild(card);
  }
  await syncVillageAdmin();
}

async function syncVillageAdmin() {
  const box = $a('#referenceVillageAssets');
  if (!box) return;
  const names = [...new Set($$a('.village').map(b => cleanVillageName(b.textContent)).filter(Boolean))];

  for (const name of names) {
    const slug = villageSlug(name);
    if (box.querySelector(`[data-village-asset="${slug}"]`)) continue;
    const key = `village:${slug}`;
    const src = await assetGet(key);
    const row = document.createElement('div');
    row.className = 'reference-village-row';
    row.dataset.villageAsset = slug;
    row.innerHTML = `
      <div class="reference-asset-preview">${previewContent(src)}</div>
      <div><strong>${name}</strong><input type="file" accept="image/*"><button type="button">Verwijderen</button></div>`;
    const input = row.querySelector('input');
    const remove = row.querySelector('button');
    input.onchange = async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const data = await compressImage(file, 1200, .80);
        await assetSet(key, data);
        input.value = '';
        updatePreview(row, data);
        await applyVillageImages();
        toast(`${name} aangepast ✨`);
      } catch (err) {
        toast(err.message || 'Opslaan mislukt');
      }
    };
    remove.onclick = async () => {
      await assetDelete(key);
      updatePreview(row, '');
      await applyVillageImages();
      toast(`${name} afbeelding verwijderd`);
    };
    box.appendChild(row);
  }
}

function setBackground(el, src, overlay) {
  if (!el) return;
  if (!src) {
    el.style.removeProperty('background-image');
    el.style.removeProperty('background-size');
    el.style.removeProperty('background-position');
    return;
  }
  el.style.setProperty('background-image', `${overlay},url("${src}")`, 'important');
  el.style.setProperty('background-size', 'cover', 'important');
  el.style.setProperty('background-position', 'center', 'important');
}

async function applyVillageImages() {
  for (const button of $$a('.village')) {
    const name = cleanVillageName(button.textContent);
    const src = await assetGet(`village:${villageSlug(name)}`);
    setBackground(button, src, 'linear-gradient(180deg,rgba(5,49,37,.05),rgba(3,37,29,.68))');
  }
}

function replaceWithImage(el, src, alt) {
  if (!el) return;
  if (!el.dataset.adventureOriginalHtml) el.dataset.adventureOriginalHtml = el.innerHTML;
  if (!src) {
    if (el.dataset.adventureOriginalHtml != null) el.innerHTML = el.dataset.adventureOriginalHtml;
    return;
  }
  const img = el.querySelector(':scope > img[data-adventure-character]');
  if (img && img.getAttribute('src') === src) return;
  el.innerHTML = `<img data-adventure-character="1" src="${src}" alt="${alt}" style="width:100%;height:100%;object-fit:contain;display:block">`;
}

async function applyCharacters() {
  const guide = await assetGet('guideCharacter');
  const secret = await assetGet('secretCharacter');
  const nature = await assetGet('natureCharacter');
  const celebration = await assetGet('celebrationCharacter');

  const menuDuck = $a('.quick-menu-duck');
  if (menuDuck) replaceWithImage(menuDuck, guide, 'Snazzle gids');

  const visitorIcon = $a('#snazzleVisitor b');
  if (visitorIcon) {
    visitorIcon.style.width = '42px';
    visitorIcon.style.height = '42px';
    replaceWithImage(visitorIcon, secret, 'Geheime Snazzle');
  }

  const natureHero = $a('.nature-hero');
  let natureImg = natureHero?.querySelector('.adventure-nature-character');
  if (natureHero && nature) {
    if (!natureImg) {
      natureImg = document.createElement('img');
      natureImg.className = 'adventure-nature-character';
      natureImg.alt = 'Natuur Snazzle';
      natureImg.style.cssText = 'position:absolute;right:10px;bottom:8px;width:72px;height:72px;object-fit:contain;z-index:3;filter:drop-shadow(0 4px 3px rgba(0,0,0,.25))';
      natureHero.appendChild(natureImg);
    }
    natureImg.src = nature;
  } else if (natureImg) natureImg.remove();

  if (celebration) {
    $$a('.home-magic-card .big').forEach(big => {
      replaceWithImage(big, celebration, 'Feest Snazzle');
      big.style.width = '90px';
      big.style.height = '90px';
      big.style.margin = '0 auto';
    });
  }
}

async function applyAssets() {
  const finds = await assetGet('quickFinds');
  const profile = await assetGet('quickProfile');
  setBackground($a('.finds'), finds, 'linear-gradient(180deg,rgba(10,86,66,.06),rgba(4,51,41,.72))');
  setBackground($a('.profile'), profile, 'linear-gradient(180deg,rgba(20,91,101,.06),rgba(4,47,56,.72))');
  await applyVillageImages();
  await applyCharacters();
}

function ensureFireflies() {
  if ($a('.reference-fireflies')) return;
  const layer = document.createElement('div');
  layer.className = 'reference-fireflies';
  layer.setAttribute('aria-hidden', 'true');
  const points = [[7,15],[20,36],[88,21],[74,45],[13,68],[92,72],[35,88],[63,12],[52,62],[81,89],[29,7],[4,48]];
  points.forEach(([x,y], i) => {
    const dot = document.createElement('i');
    dot.className = 'reference-firefly';
    dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
    dot.style.animationDelay = `${i * .62}s`;
    dot.style.animationDuration = `${6.5 + (i % 4) * 1.2}s`;
    layer.appendChild(dot);
  });
  document.body.prepend(layer);
}

function ensureExtraHotspots() {
  const app = $a('.app');
  if (!app || $a('.extra-magic-hotspot.four', app)) return;
  ['four','five'].forEach(cls => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `extra-magic-hotspot ${cls}`;
    b.setAttribute('aria-label', 'Geheime Snazzle ster');
    b.onclick = e => {
      e.stopPropagation();
      const r = b.getBoundingClientRect();
      triggerMagic(r.left + r.width / 2, r.top + r.height / 2);
    };
    app.appendChild(b);
  });
}

function secretAllowed() {
  return !document.hidden && !$a('.sheet.show') && !$a('.onboarding.show') && !$a('#snazzleMagicOverlay.show') && !$a('.secret-runner.show') && !$a('.secret-peeker.show');
}

function sparkle(x, y) {
  const bits = ['✦','✨','★','·','💫'];
  for (let i = 0; i < 11; i++) {
    const s = document.createElement('i');
    s.className = 'secret-spark';
    s.textContent = bits[i % bits.length];
    s.style.left = `${x - 8 + (Math.random() * 32 - 16)}px`;
    s.style.top = `${y - 8 + (Math.random() * 24 - 12)}px`;
    s.style.animationDelay = `${Math.random() * .14}s`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1200);
  }
}

function triggerMagic(x = innerWidth / 2, y = innerHeight / 2) {
  sparkle(x, y);
  if (navigator.vibrate) navigator.vibrate(22);
  const visitor = $a('#snazzleVisitor');
  if (visitor) return visitor.click();
  const hotspot = $a('.magic-hotspot');
  if (hotspot) return hotspot.click();
  toast('✨ Je hebt een geheime Snazzle ontdekt!');
}

async function fillSecretButton(button) {
  const src = await assetGet('secretCharacter');
  button.innerHTML = src ? `<img src="${src}" alt="Geheime Snazzle">` : '<span class="secret-emoji">🦆</span>';
}

async function showRunner() {
  if (!secretAllowed()) return;
  let b = $a('#adventureSecretRunner');
  if (!b) {
    b = document.createElement('button');
    b.id = 'adventureSecretRunner';
    b.type = 'button';
    b.className = 'secret-runner';
    b.setAttribute('aria-label', 'Geheime bewegende Snazzle');
    document.body.appendChild(b);
  }
  await fillSecretButton(b);
  const fromLeft = Math.random() > .5;
  const y = Math.round(innerHeight * (.27 + Math.random() * .39));
  b.style.top = `${y}px`;
  b.style.left = `${fromLeft ? -82 : innerWidth + 8}px`;
  b.classList.add('show');
  const distance = innerWidth + 170;
  const dir = fromLeft ? 1 : -1;
  const anim = b.animate([
    {transform:'translateX(0) translateY(0) rotate(-4deg)'},
    {offset:.30, transform:`translateX(${dir * distance * .30}px) translateY(-9px) rotate(4deg)`},
    {offset:.62, transform:`translateX(${dir * distance * .62}px) translateY(7px) rotate(-5deg)`},
    {transform:`translateX(${dir * distance}px) translateY(-3px) rotate(5deg)`}
  ], {duration: 9000 + Math.random() * 2400, easing:'linear'});

  b.onclick = e => {
    e.preventDefault();
    e.stopPropagation();
    const r = b.getBoundingClientRect();
    anim.cancel();
    b.classList.remove('show');
    triggerMagic(r.left + r.width / 2, r.top + r.height / 2);
  };
  anim.onfinish = () => b.classList.remove('show');
  anim.oncancel = () => b.classList.remove('show');
}

async function showPeeker() {
  if (!secretAllowed()) return;
  let b = $a('#adventureSecretPeeker');
  if (!b) {
    b = document.createElement('button');
    b.id = 'adventureSecretPeeker';
    b.type = 'button';
    b.className = 'secret-peeker';
    b.setAttribute('aria-label', 'Geheime Snazzle kijkt mee');
    document.body.appendChild(b);
  }
  await fillSecretButton(b);
  const right = Math.random() > .5;
  b.style.top = `${Math.round(innerHeight * (.35 + Math.random() * .34))}px`;
  b.style.left = right ? 'auto' : '-14px';
  b.style.right = right ? '-14px' : 'auto';
  b.style.transform = right ? 'rotate(-12deg)' : 'scaleX(-1) rotate(-12deg)';
  b.classList.add('show');
  clearTimeout(b.__hideTimer);
  b.__hideTimer = setTimeout(() => b.classList.remove('show'), 8500);
  b.onclick = e => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(b.__hideTimer);
    const r = b.getBoundingClientRect();
    b.classList.remove('show');
    triggerMagic(r.left + r.width / 2, r.top + r.height / 2);
  };
}

function scheduleSecrets() {
  clearTimeout(runnerTimer);
  clearTimeout(peekerTimer);
  runnerTimer = setTimeout(async function run() {
    await showRunner();
    runnerTimer = setTimeout(run, 65000 + Math.random() * 65000);
  }, 18000 + Math.random() * 10000);
  peekerTimer = setTimeout(async function peek() {
    await showPeeker();
    peekerTimer = setTimeout(peek, 60000 + Math.random() * 65000);
  }, 34000 + Math.random() * 14000);
}

async function refreshUi() {
  ensurePassport();
  ensureAdventureHero();
  relabelImageAdmin();
  ensureExtraHotspots();
  updatePassport();
  await ensureExtraAssetAdmin();
  await syncVillageAdmin();
  await applyAssets();
}

function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  setTimeout(async () => {
    refreshQueued = false;
    try { await refreshUi(); } catch (err) { console.warn('Snazzle UI refresh', err); }
  }, 80);
}

function observeDynamicUi() {
  const obs = new MutationObserver(queueRefresh);
  obs.observe(document.body, {childList:true, subtree:true});
}

async function initAdventureUi() {
  if (window.__snazzleAdventureUiV27) return;
  window.__snazzleAdventureUiV27 = true;
  ensureTheme();
  ensureFireflies();
  await refreshUi();
  observeDynamicUi();
  scheduleSecrets();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      queueRefresh();
      scheduleSecrets();
    }
  });
  console.info(`Snazzle Adventure Passport UI ${ADVENTURE_UI_VERSION} geladen`);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAdventureUi, {once:true});
else initAdventureUi();
