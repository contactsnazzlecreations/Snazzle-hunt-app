from pathlib import Path

p = Path('app.js')
s = p.read_text(encoding='utf-8')

s = s.replace(
    '// Snazzle Hunt v186 — Leaflet kaarttegels worden op Android/PWA hard zichtbaar gemaakt.',
    '// Snazzle Hunt v187 — oude AR-kaartlagen verwijderd; alleen v85/v184 blijft actief.'
)
s = s.replace(
    "const runtimeVersion='20260831-v186-ar-map-visible';",
    "const runtimeVersion='20260831-v187-ar-single-studio';"
)

needle = "  safeImport('./snazzle-ar-place-studio-v184.js'),\n"
addition = "  safeImport('./snazzle-ar-legacy-cleanup-v187.js'),\n"
if addition not in s:
    if needle not in s:
        raise SystemExit('v184 studio import not found')
    s = s.replace(needle, needle + addition, 1)

# Oude AR-beheerlaag en oude v90-opslagpatch niet meer laat opnieuw importeren.
s = s.replace("    safeImport('./snazzle-ar-admin-v83.js');\n", '')
s = s.replace("    safeImport('./snazzle-ar-save-inline-v122.js?patch=20260827-1803');\n", '')

p.write_text(s, encoding='utf-8')
