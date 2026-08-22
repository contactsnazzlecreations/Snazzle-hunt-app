from pathlib import Path

path = Path('app.js')
text = path.read_text(encoding='utf-8')

old1 = "    $('#huntRule').textContent='';"
new1 = "    $('#huntRule').textContent=''; $('#huntRule').style.display='none';"

old2 = "  $('#huntRule').textContent=h.rule ? '👨‍👩‍👧 '+h.rule : '';"
new2 = "  $('#huntRule').textContent=h.rule ? '👨‍👩‍👧 '+h.rule : ''; $('#huntRule').style.display=h.rule ? '' : 'none';"

if old1 not in text:
    raise SystemExit('Could not find empty huntRule line')
if old2 not in text:
    raise SystemExit('Could not find active huntRule line')

text = text.replace(old1, new1, 1)
text = text.replace(old2, new2, 1)
path.write_text(text, encoding='utf-8')
print('Empty hunt rule pill will now stay hidden.')
