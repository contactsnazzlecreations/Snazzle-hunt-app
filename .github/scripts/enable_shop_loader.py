from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
loader = '<script type="module" src="./shop.js"></script>'
if loader not in s:
    needle = '<script type="module" src="./app.js"></script>'
    if needle not in s:
        raise SystemExit('app.js script tag not found')
    s = s.replace(needle, needle + '\n' + loader, 1)
    p.write_text(s, encoding='utf-8')
    print('shop.js loader added')
else:
    print('shop.js loader already present')
