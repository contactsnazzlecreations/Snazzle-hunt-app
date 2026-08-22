from pathlib import Path

p = Path('app.js')
s = p.read_text(encoding='utf-8')
marker = "const $$ = s => [...document.querySelectorAll(s)];\n"
insert = """const $$ = s => [...document.querySelectorAll(s)];

// Hide empty hunt metadata pills completely (prevents an empty yellow bubble).
if (!document.getElementById('emptyPillFix')) {
  const style = document.createElement('style');
  style.id = 'emptyPillFix';
  style.textContent = '.meta .pill:empty{display:none!important}';
  document.head.appendChild(style);
}
"""
if "emptyPillFix" not in s:
    if marker not in s:
        raise SystemExit('marker not found')
    s = s.replace(marker, insert, 1)

# Also explicitly toggle the optional rule pill when a live hunt is rendered.
old = "$('#huntRule').textContent=h.rule ? '👨‍👩‍👧 '+h.rule : '';"
new = "$('#huntRule').textContent=h.rule ? '👨‍👩‍👧 '+h.rule : ''; $('#huntRule').style.display=h.rule ? '' : 'none';"
if old in s:
    s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
