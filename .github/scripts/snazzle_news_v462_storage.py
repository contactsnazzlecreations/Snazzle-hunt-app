from pathlib import Path

news = Path('snazzle-news-v46.js')
text = news.read_text(encoding='utf-8')

text = text.replace(
    "const NEWS_COLLECTION = 'snazzleNewsPages';\nconst MAX_IMAGES = 3;",
    "// Gebruik verborgen, inactieve systeemdocumenten in de bestaande villages-collectie.\n// Die collectie heeft al productie-rechten in de app; active:false houdt deze documenten\n// volledig buiten de dorpenlijsten. Zo werkt de krant zonder een extra Firebase-deploy.\nconst NEWS_COLLECTION = 'villages';\nconst NEWS_KIND = 'snazzleNewsPage';\nconst MAX_IMAGES = 3;"
)

old_payload = """  const payload = {
    kicker: $('#snNewsKicker').value.trim(),
    title,"""
new_payload = """  const payload = {
    active: false,
    contentType: NEWS_KIND,
    name: 'Snazzle Nieuws systeempagina',
    kicker: $('#snNewsKicker').value.trim(),
    title,"""
if old_payload not in text:
    raise SystemExit('payload anchor not found')
text = text.replace(old_payload, new_payload)

old_listener = """function startNewsListener(){
  if(unsubscribeNews) return;
  const q = query(collection(db,NEWS_COLLECTION), orderBy('order','asc'));
  unsubscribeNews = onSnapshot(q, snap=>{
    pages = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order??0)-(b.order??0));"""
new_listener = """function startNewsListener(){
  if(unsubscribeNews) return;
  unsubscribeNews = onSnapshot(collection(db,NEWS_COLLECTION), snap=>{
    pages = snap.docs
      .map(d=>({id:d.id,...d.data()}))
      .filter(page=>page.contentType===NEWS_KIND)
      .sort((a,b)=>(a.order??0)-(b.order??0));"""
if old_listener not in text:
    raise SystemExit('listener anchor not found')
text = text.replace(old_listener, new_listener)

news.write_text(text, encoding='utf-8')

app = Path('app.js')
text = app.read_text(encoding='utf-8').replace("snazzle-news-v46.js?v=461", "snazzle-news-v46.js?v=462")
app.write_text(text, encoding='utf-8')

index = Path('index.html')
text = index.read_text(encoding='utf-8').replace('app.js?v=461', 'app.js?v=462')
index.write_text(text, encoding='utf-8')
