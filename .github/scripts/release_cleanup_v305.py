from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing expected pattern: {label}')
    return text.replace(old, new, 1)

# 1) app-core: no direct client-side finding write anymore.
p = Path('app-core.js')
s = read(p)
pattern = re.compile(r"async function markFound\(\)\{.*?\n\}\n\n// UI bindings", re.S)
replacement = r"""async function markFound(){
  const h=activeHunt(); if(!h || !currentUser) return;
  if(findings.some(f=>f.huntId===h.id)) return toast('Deze hunt staat al bij je vondsten');
  if(!proofPhoto) return toast('Maak eerst een foto');

  // De app schrijft een gewone Hunt-vondst nooit meer rechtstreeks naar Firestore.
  // Alleen de beveiligde foto + geheime vindcode-flow mag een Hunt afsluiten.
  const btn=$('#foundBtn');
  if(btn?.dataset.codeVerification==='1'){
    btn.click();
    return;
  }

  toast('🔐 Beveiligde vindcode wordt geopend…');
  try{
    if(typeof window.__snazzleImport==='function') await window.__snazzleImport('./snazzle-hunt-code-v2.js');
    else await import('./snazzle-hunt-code-v2.js?v=305');
    await new Promise(resolve=>setTimeout(resolve,0));
    if(btn?.dataset.codeVerification==='1'){
      btn.click();
      return;
    }
  }catch(e){ console.error('Beveiligde vondstmodule laden',e); }
  toast('Beveiligde vondstcontrole kon niet openen. Controleer internet en probeer opnieuw.');
}

// UI bindings"""
if not pattern.search(s):
    raise SystemExit('Could not locate markFound block in app-core.js')
s = pattern.sub(replacement, s, count=1)
s = must_replace(
    s,
    "$('#navShop').onclick=()=>openSheet('shopSheet');",
    "$('#navShop').onclick=e=>{ e?.preventDefault?.(); location.assign('https://www.snazzle.nl/shop/'); };",
    'legacy shop onclick'
)
write(p, s)

# 2) Runtime: load secure Hunt-code flow early, before the later feature bundles.
p = Path('app-runtime-v245.js')
s = read(p)
s = s.replace("const runtimeVersion='20260926-v304-sfeer-colors';", "const runtimeVersion='20261002-v305-release-ready';", 1)
s = s.replace("safeImport('./snazzle-sfeer-admin-v301.js?v=304')", "safeImport('./snazzle-sfeer-admin-v301.js?v=305')", 1)
needle = "await safeImport('./snazzle-special-findings-v294.js');"
insert = needle + "\nawait safeImport('./snazzle-hunt-code-v2.js');"
if "await safeImport('./snazzle-hunt-code-v2.js');" not in s:
    s = must_replace(s, needle, insert, 'early Hunt-code import')
write(p, s)

# 3) Public loader/cache busting.
p = Path('app.js')
s = read(p).replace('Snazzle Hunt v304', 'Snazzle Hunt v305', 1).replace('v=304', 'v=305')
write(p, s)

p = Path('index.html')
s = read(p).replace('v=304', 'v=305')
write(p, s)

p = Path('manifest.json')
s = read(p).replace('./?v=304', './?v=305')
write(p, s)

# 4) Sfeer: publish as v305 and give a precise message if an old/fallback admin session lacks MFA.
p = Path('snazzle-sfeer-admin-v301.js')
s = read(p)
s = s.replace("const VERSION='304.0.0';", "const VERSION='305.0.0';", 1)
s = s.replace("./snazzle-season-theme-v38.js?fresh=20260926-v304", "./snazzle-season-theme-v38.js?fresh=20261002-v305", 1)
s = s.replace(
    "catch(err){console.error('Centrale sfeer opslaan',err);toast('Opslaan online mislukt');return;}",
    "catch(err){console.error('Centrale sfeer opslaan',err);const denied=String(err?.code||'').includes('permission-denied');toast(denied?'Log opnieuw beveiligd in bij Beheer en probeer nogmaals':'Opslaan online mislukt');return;}",
    1
)
s = s.replace(
    "catch(err){console.error('Centrale sfeer herstellen',err);toast('Herstellen online mislukt');return;}",
    "catch(err){console.error('Centrale sfeer herstellen',err);const denied=String(err?.code||'').includes('permission-denied');toast(denied?'Log opnieuw beveiligd in bij Beheer en probeer nogmaals':'Herstellen online mislukt');return;}",
    1
)
write(p, s)

# 5) Update validation to the current stabilized GPS design and add release gates.
p = Path('.github/workflows/validate-snazzle-world-v47.yml')
s = read(p)
s = s.replace(
    'for f in app.js app-runtime-v245.js app-core.js snazzle-admin-mfa-v141.js snazzle-admin-shell-v268.js snazzle-ar-admin-display-v84.js snazzle-ar-admin-v245.js snazzle-ar-engine-v245.js snazzle-ar-placement-v245.js; do',
    'for f in app.js app-runtime-v245.js app-core.js snazzle-admin-mfa-v141.js snazzle-admin-shell-v268.js snazzle-ar-admin-display-v84.js snazzle-ar-admin-v245.js snazzle-ar-engine-v245.js snazzle-ar-placement-v245.js snazzle-hunt-code-v2.js snazzle-sfeer-admin-v301.js snazzle-season-theme-v38.js; do',
    1
)
s = must_replace(s, 'grep -q "maximumAge:8000" snazzle-ar-engine-v245.js', 'grep -q "maximumAge:0" snazzle-ar-engine-v245.js\n          grep -q "MIN_STABLE_SAMPLES=3" snazzle-ar-engine-v245.js\n          grep -q "MAX_STABILITY_SPREAD_M=16" snazzle-ar-engine-v245.js\n          grep -q "REVEAL_MAX_ACCURACY_M=20" snazzle-ar-engine-v245.js', 'old AR maximumAge validation')
release_step = """

      - name: Check v305 release-critical flows
        shell: bash
        run: |
          ! grep -q "batch.set(doc(db,'findings'" app-core.js
          grep -q "Beveiligde vindcode wordt geopend" app-core.js
          grep -q "await safeImport('./snazzle-hunt-code-v2.js')" app-runtime-v245.js
          grep -q "verifyHuntCode" snazzle-hunt-code-v2.js
          grep -q "HUNT_HINT_DELAY_MS=60\*60\*1000" app-core.js
          grep -q "HUNT_HINT_DISTANCE_M=200" app-core.js
          grep -q "https://www.snazzle.nl/shop/" app.js
          grep -q "https://www.snazzle.nl/shop/" app-core.js
          grep -q "const VERSION='305.0.0'" snazzle-sfeer-admin-v301.js
          grep -q "Sfeer opgeslagen voor iedereen" snazzle-sfeer-admin-v301.js
          grep -q "Normale Snazzle-sfeer hersteld voor iedereen" snazzle-sfeer-admin-v301.js
          grep -q '"start_url": "./?v=305"' manifest.json
          grep -Eq 'src="./app\\.js\\?v=305"' index.html
          node --check functions/bootstrap.js
          node --check functions/hunt-codes.js
          node --check functions/admin-mfa.js
"""
if 'Check v305 release-critical flows' not in s:
    s += release_step
write(p, s)

# 6) Force one clean Firebase security/functions redeploy on the v305 release commit.
p = Path('functions/bootstrap.js')
s = read(p)
trigger = '// Release v305 redeploy trigger: secure Hunt claim, MFA and Sfeer readiness.\n'
if trigger not in s:
    s = s.rstrip() + '\n' + trigger
write(p, s)

print('Snazzle v305 release cleanup applied.')
