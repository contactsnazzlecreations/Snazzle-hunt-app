from pathlib import Path

p = Path('app.js')
s = p.read_text(encoding='utf-8')

s = s.replace(
    '// Snazzle Hunt v185 — AR kaarttegels krijgen automatische Android/PWA fallback.',
    '// Snazzle Hunt v186 — Leaflet kaarttegels worden op Android/PWA hard zichtbaar gemaakt.'
)
s = s.replace(
    "const runtimeVersion='20260831-v185-ar-map-tile-rescue';",
    "const runtimeVersion='20260831-v186-ar-map-visible';"
)

needle = "  safeImport('./snazzle-ar-map-tile-rescue-v185.js'),\n"
addition = "  safeImport('./snazzle-ar-map-visibility-fix-v186.js'),\n"
if addition not in s:
    if needle not in s:
        raise SystemExit('AR map rescue import not found in app.js')
    s = s.replace(needle, needle + addition, 1)

p.write_text(s, encoding='utf-8')
