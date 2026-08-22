from pathlib import Path

index = Path('index.html')
s = index.read_text(encoding='utf-8')
s = s.replace('\n<script type="module" src="./shop.js"></script>', '')
index.write_text(s, encoding='utf-8')

app = Path('app.js')
a = app.read_text(encoding='utf-8')
a = a.replace("import('./shop.js')", "import('./shop.js?v=3')")
app.write_text(a, encoding='utf-8')
