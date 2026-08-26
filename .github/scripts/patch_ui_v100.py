from pathlib import Path

# v100.1: keep this patch idempotent so later app updates cannot silently restore the old home.
path = Path('app.js')
text = path.read_text(encoding='utf-8')

# 1) Make the splash show the user's real Snazzle image when available.
old = """  splash.innerHTML = '<div style=\"padding:24px;font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,.28)\"><div style=\"width:104px;height:104px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;background:#ffd35e;border:5px solid #76502d;box-shadow:0 8px 0 #4a2b18;font-size:52px\">🦆</div><div style=\"font-size:44px;font-weight:1000;color:#ffd35e\">Snazzle</div><div style=\"margin-top:12px;font-size:20px\">Samen naar buiten</div><div style=\"margin-top:18px;font-size:14px\">Je avontuur wordt klaargezet…</div></div>';
"""
new = """  let bootSnazzle='';
  try{ const bootSettings=JSON.parse(localStorage.getItem('snazzleSettings')||'{}'); bootSnazzle=bootSettings.introImage||bootSettings.profileImage||''; }catch{}
  const bootVisual=bootSnazzle
    ? `<div style=\"width:112px;height:112px;margin:0 auto 18px;border-radius:50%;overflow:hidden;background:#ffd35e;border:5px solid #76502d;box-shadow:0 8px 0 #4a2b18\"><img src=\"${bootSnazzle}\" alt=\"Snazzle\" style=\"width:100%;height:100%;object-fit:cover;display:block\"></div>`
    : '<div style=\"width:104px;height:104px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;background:#ffd35e;border:5px solid #76502d;box-shadow:0 8px 0 #4a2b18;font-size:52px\">🦆</div>';
  splash.innerHTML = `<div style=\"padding:24px;font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,.28)\">${bootVisual}<div style=\"font-size:44px;font-weight:1000;color:#ffd35e\">Snazzle</div><div style=\"margin-top:12px;font-size:20px\">Samen naar buiten</div><div style=\"margin-top:18px;font-size:14px\">Je avontuur wordt klaargezet…</div></div>`;
"""
if old in text:
    text = text.replace(old, new, 1)

# 2) Load the premium Home restore immediately after the core, BEFORE the splash is released.
old_then = """  .then(mod=>{
    window.__snazzleCoreReady=true;
    document.documentElement.dataset.snazzleCore='ready';
    ensurePremiumMenu();
    releaseBoot();
    return mod;
  })
"""
new_then = """  .then(async mod=>{
    window.__snazzleCoreReady=true;
    document.documentElement.dataset.snazzleCore='ready';
    try{ await loadModule('./snazzle-ui-v100.js',2600); }catch(err){ console.warn('premium home v100',err); }
    ensurePremiumMenu();
    window.SnazzleHomeV100?.restore?.();
    releaseBoot();
    return mod;
  })
"""
if old_then in text:
    text = text.replace(old_then, new_then, 1)
elif "snazzle-ui-v100.js" not in text:
    raise SystemExit('core .then marker not found')

# 3) Mark runtime version for diagnostics, once.
if "window.__snazzleHomeVersion = 'v100';" not in text:
    text = text.replace("window.__snazzleMenuVersion = 'v98';", "window.__snazzleMenuVersion = 'v98';\nwindow.__snazzleHomeVersion = 'v100';", 1)

path.write_text(text, encoding='utf-8')
print('Patched app.js with premium Home v100 + Snazzle splash')
