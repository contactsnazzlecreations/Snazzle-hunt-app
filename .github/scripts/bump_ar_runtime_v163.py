from pathlib import Path

p = Path('app.js')
s = p.read_text(encoding='utf-8')

old_version = "const runtimeVersion = '20260830-v162-listen-https';"
new_version = "const runtimeVersion = '20260830-v163-ar-smooth';"

if new_version in s:
    print('AR v163 runtime already active')
else:
    if old_version not in s:
        raise SystemExit('Expected v162 runtime marker not found')
    s = s.replace(old_version, new_version, 1)
    s = s.replace(
        '// Snazzle Hunt v162 — Luisterverhalen via betrouwbare Firestore HTTPS-route.',
        '// Snazzle Hunt v163 — vloeiende Snazzle AR flow + luisterverhalen HTTPS.',
        1,
    )
    p.write_text(s, encoding='utf-8')
    print('Bumped runtime to v163')
