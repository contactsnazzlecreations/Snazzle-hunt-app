from pathlib import Path

news = Path('snazzle-news-v46.js')
text = news.read_text(encoding='utf-8')
old = """  const logout = $('#adminLogoutBtn');
  if(logout) superOnly.insertBefore(section, logout);
  else superOnly.appendChild(section);"""
new = """  // De nieuwssectie hoort binnen het hoofdbeheerblok zelf.
  superOnly.appendChild(section);"""
if old in text:
    text = text.replace(old, new)
elif new not in text:
    raise SystemExit('Nieuws admin anchor niet gevonden')
news.write_text(text, encoding='utf-8')

app = Path('app.js')
text = app.read_text(encoding='utf-8')
text = text.replace("snazzle-news-v46.js?v=46", "snazzle-news-v46.js?v=461")
app.write_text(text, encoding='utf-8')

index = Path('index.html')
text = index.read_text(encoding='utf-8')
text = text.replace('app.js?v=46', 'app.js?v=461')
index.write_text(text, encoding='utf-8')
