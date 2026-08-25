from pathlib import Path
import re

css_path = Path('snazzle-world-hub-v47.css')
js_path = Path('snazzle-world-hub-v47.js')
app_path = Path('app.js')
index_path = Path('index.html')

css = css_path.read_text(encoding='utf-8')
css_new, n_css = re.subn(
    r'\.sn47-launch-chip\{[^}]*\}',
    '.sn47-launch-chip{display:none!important}',
    css,
    count=1,
)
if n_css != 1:
    raise SystemExit('Kon sn47-launch-chip CSS niet eenduidig vinden')
css_path.write_text(css_new, encoding='utf-8')

js = js_path.read_text(encoding='utf-8')
pattern = r"function refreshLauncher\(\)\{.*?\}\nfunction openHub\(\)"
replacement = "function refreshLauncher(){const entry=$('.v38-world-entry');if(!entry)return;entry.classList.add('sn47-hub-launcher');entry.setAttribute('aria-label','Open Mijn Snazzle Wereld');entry.querySelector('.sn47-launch-chip')?.remove();}\nfunction openHub()"
js_new, n_js = re.subn(pattern, replacement, js, count=1, flags=re.S)
if n_js != 1:
    raise SystemExit('Kon refreshLauncher niet eenduidig vinden')
js_new = js_new.replace("./snazzle-world-hub-v47.css?v=47", "./snazzle-world-hub-v47.css?v=471")
js_path.write_text(js_new, encoding='utf-8')

app = app_path.read_text(encoding='utf-8')
app_new = app.replace("./snazzle-world-hub-v47.js?v=47", "./snazzle-world-hub-v47.js?v=471")
if app_new == app:
    raise SystemExit('Kon v47 import in app.js niet vinden')
app_path.write_text(app_new, encoding='utf-8')

index = index_path.read_text(encoding='utf-8')
index_new = re.sub(r'(<script type="module" src="\./app\.js\?v=)[^"]+("[^>]*></script>)', r'\g<1>471\g<2>', index, count=1)
if index_new == index:
    raise SystemExit('Kon app.js cacheversie in index.html niet vinden')
index_path.write_text(index_new, encoding='utf-8')

print('Snazzle Wereld launcher overlap v47.1 opgelost')
