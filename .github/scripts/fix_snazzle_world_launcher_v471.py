from pathlib import Path
import re

css_path = Path('snazzle-world-hub-v47.css')
js_path = Path('snazzle-world-hub-v47.js')
app_path = Path('app.js')
index_path = Path('index.html')

# 1) Verberg het oude launcher-label altijd, ook wanneer een oudere JS-versie
# nog vanuit de mobiele browsercache wordt uitgevoerd.
css = css_path.read_text(encoding='utf-8')
if re.search(r'\.sn47-launch-chip\{[^}]*\}', css):
    css = re.sub(r'\.sn47-launch-chip\{[^}]*\}', '.sn47-launch-chip{display:none!important}', css, count=1)
else:
    css = '.sn47-launch-chip{display:none!important}\n' + css
css_path.write_text(css, encoding='utf-8')

# 2) Nieuwe module verwijdert elk bestaand oud label uit de DOM.
js = js_path.read_text(encoding='utf-8')
pattern = r"function refreshLauncher\(\)\{.*?\}\nfunction openHub\(\)"
replacement = (
    "function refreshLauncher(){"
    "$$('.sn47-launch-chip').forEach(el=>el.remove());"
    "const entry=$('.v38-world-entry');if(!entry)return;"
    "entry.classList.add('sn47-hub-launcher');"
    "entry.setAttribute('aria-label','Open Mijn Snazzle Wereld');"
    "}\nfunction openHub()"
)
js_new, n_js = re.subn(pattern, replacement, js, count=1, flags=re.S)
if n_js != 1:
    raise SystemExit('Kon refreshLauncher niet eenduidig vinden')
js_new = re.sub(r"snazzle-world-hub-v47\.css\?v=\d+", 'snazzle-world-hub-v47.css?v=472', js_new, count=1)
js_path.write_text(js_new, encoding='utf-8')

# 3) Bust de modulecache zodat telefoons beslist de nieuwe code laden.
app = app_path.read_text(encoding='utf-8')
app_new, n_app = re.subn(r"snazzle-world-hub-v47\.js\?v=\d+", 'snazzle-world-hub-v47.js?v=472', app, count=1)
if n_app != 1:
    raise SystemExit('Kon Snazzle Wereld import in app.js niet vinden')
app_path.write_text(app_new, encoding='utf-8')

# 4) Zet ook direct in index.html een harde CSS-regel. Daardoor kan zelfs een
# oud gecachet script het label niet meer zichtbaar over de andere tekst zetten.
index = index_path.read_text(encoding='utf-8')
inline_fix = '.sn47-launch-chip{display:none!important}/* snazzle-world-launcher-v472 */'
if 'snazzle-world-launcher-v472' not in index:
    index = index.replace('</style>', inline_fix + '\n</style>', 1)
index_new, n_index = re.subn(
    r'(<script type="module" src="\./app\.js\?v=)[^"]+("[^>]*></script>)',
    r'\g<1>472\g<2>',
    index,
    count=1,
)
if n_index != 1:
    raise SystemExit('Kon app.js cacheversie in index.html niet vinden')
index_path.write_text(index_new, encoding='utf-8')

print('Snazzle Wereld launcher overlap v47.2 definitief verwijderd')
