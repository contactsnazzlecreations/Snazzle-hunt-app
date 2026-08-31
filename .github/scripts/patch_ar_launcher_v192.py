from pathlib import Path
p=Path('app.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// Snazzle Hunt v191 — AR kaart/camera knop direct gekoppeld via capture-bridge.','// Snazzle Hunt v192 — robuuste AR kaartlauncher voor Android/PWA.')
s=s.replace("const runtimeVersion='20260831-v191-ar-click-bridge';","const runtimeVersion='20260831-v192-ar-launcher';")
s=s.replace("safeImport('./snazzle-ar-click-bridge-v191.js'),","safeImport('./snazzle-ar-launcher-v192.js'),")
# Als de oude brug niet meer in app.js staat, voeg de nieuwe launcher direct na de studio toe.
if "./snazzle-ar-launcher-v192.js" not in s:
    needle="safeImport('./snazzle-ar-place-studio-v184.js'),"
    s=s.replace(needle, needle+"\n  safeImport('./snazzle-ar-launcher-v192.js'),",1)
p.write_text(s,encoding='utf-8')
