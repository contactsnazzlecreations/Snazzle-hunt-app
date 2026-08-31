from pathlib import Path

p=Path('app.js')
s=p.read_text(encoding='utf-8')

s=s.replace('// Snazzle Hunt v184 — AR kaart direct zichtbaar; GPS verfijnt daarna op de achtergrond.',
            '// Snazzle Hunt v185 — AR kaarttegels krijgen automatische Android/PWA fallback.')
s=s.replace("const runtimeVersion='20260831-v184-ar-map-immediate';",
            "const runtimeVersion='20260831-v185-ar-map-tile-rescue';")
needle="  safeImport('./snazzle-ar-place-studio-v184.js'),"
replacement="  safeImport('./snazzle-ar-place-studio-v184.js'),\n  safeImport('./snazzle-ar-map-tile-rescue-v185.js'),"
if "snazzle-ar-map-tile-rescue-v185.js" not in s:
    if needle not in s:
        raise SystemExit('AR place studio import not found; refusing unsafe patch')
    s=s.replace(needle,replacement,1)

p.write_text(s,encoding='utf-8')
print('Patched app.js for v185 AR map tile rescue')
