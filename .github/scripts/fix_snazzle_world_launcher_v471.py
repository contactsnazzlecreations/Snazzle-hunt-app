from pathlib import Path
import re

js_path = Path('snazzle-world-hub-v47.js')
app_path = Path('app.js')
index_path = Path('index.html')

js = js_path.read_text(encoding='utf-8')

stories_block = r'''const FALLBACK_STORIES=[
{id:'fallback-story-1',contentType:TYPE_STORY,title:'De poort van het Ontdekkersbos',text:'Op een stille ochtend ziet Snazzle Gids tussen de bladeren een klein gouden licht knipperen. Eerst denkt hij dat het een zonnestraal is, maar wanneer hij dichterbij komt, ontdekt hij een oude houten poort die er gisteren nog niet stond. Op de poort staan kleine afdrukken van eendenpootjes en in het midden zit een slot zonder sleutelgat.\n\nDan hoort hij vanuit het bos een zacht gefluister: Alleen echte ontdekkers vinden de weg. Snazzle Gids roept zijn vrienden erbij. Samen zoeken ze rondom de poort en ontdekken ze drie aanwijzingen: een veertje dat glanst, een blad in de vorm van een ster en een piepklein spoor dat tussen de varens verdwijnt.\n\nWanneer ze de drie vondsten naast elkaar leggen, begint de poort langzaam te gloeien. Met een zachte kraak gaat hij open. Achter de poort ligt een pad dat niemand van hen ooit eerder heeft gezien. Het eerste echte Snazzle-avontuur kan beginnen.',image:'',unlockStars:0,order:0,enabled:true},
{id:'fallback-story-2',contentType:TYPE_STORY,title:'Het verdwenen gouden veertje',text:'De volgende ochtend is er onrust in de Snazzle Wereld. Het gouden veertje dat boven de poort hing, is verdwenen. Zonder dat veertje wordt het licht van het Ontdekkersbos iedere minuut zwakker. Snazzle Gids ziet op de grond een dun spoor van glinsterend stof en besluit het te volgen.\n\nHet spoor loopt langs hoge grassprieten, onder een omgevallen boom door en eindigt bij een beekje. Daar vinden de Snazzles kleine pootafdrukken in de modder. Ze verdenken eerst een geheimzinnige bezoeker, maar dan horen ze boven zich een zenuwachtig gepiep. In een lage tak zit een jonge ekster met het gouden veertje naast haar nest. Ze had het meegenomen omdat het zo mooi schitterde.\n\nDe Snazzles worden niet boos. Samen zoeken ze een ander glanzend cadeautje voor de ekster: een glad steentje dat fonkelt in de zon. De ekster geeft het gouden veertje terug. Zodra het weer op zijn plek zit, licht het hele bos op. Snazzle Gids glimlacht: soms los je een raadsel niet op door sneller te zoeken, maar door goed te kijken en vriendelijk te blijven.',image:'',unlockStars:5,order:1,enabled:true},
{id:'fallback-story-3',contentType:TYPE_STORY,title:'De fluisterende boom',text:'Diep achter in het Ontdekkersbos staat een enorme oude boom. Zijn stam is zo breed dat drie Snazzles elkaar de vleugels moeten geven om eromheen te komen. Volgens een oude Snazzle-legende kan deze boom praten, maar alleen tegen ontdekkers die kunnen luisteren zonder zelf geluid te maken.\n\nDe vrienden gaan in het gras zitten. Eerst horen ze niets behalve vogels, bladeren en een tak die kraakt. Dan klinkt er heel zacht een stem uit de stam: Het bos onthoudt wie goed voor buiten zorgt. De boom vertelt dat er ergens tussen zijn wortels een kleine houten kist ligt. De kist opent alleen wanneer de Snazzles eerst drie goede dingen voor de natuur doen.\n\nZe ruimen een stukje afval op, zetten een omgevallen tak van het wandelpad en laten een slak rustig oversteken. Meteen verschijnt tussen de wortels een klein deurtje. In de kist ligt geen goud, maar een kaart met nieuwe paden, geheime plekken en één zin: De grootste schat is wat je samen ontdekt. Vanaf dat moment weten de Snazzles dat hun wereld nog veel groter is dan ze dachten.',image:'',unlockStars:10,order:2,enabled:true}];'''

missions_block = r'''const FALLBACK_MISSIONS=[
{id:'fallback-mission-1',contentType:TYPE_MISSION,title:'Drie verschillende blaadjes',text:'Zoek buiten drie verschillende blaadjes. Laat ze liggen waar ze horen en maak één foto van jouw vondst.',image:'',category:'Natuur',needPhoto:true,stars:2,order:0,enabled:true},
{id:'fallback-mission-2',contentType:TYPE_MISSION,title:'Vind iets geels',text:'Zoek buiten iets geels dat bij de natuur hoort. Maak er een foto van zonder iets kapot te maken.',image:'',category:'Kijken',needPhoto:true,stars:2,order:1,enabled:true},
{id:'fallback-mission-3',contentType:TYPE_MISSION,title:'Tien minuten samen wandelen',text:'Ga samen met een ouder, verzorger of familielid tien minuten naar buiten. Geen snelheid nodig — gewoon samen op pad.',image:'',category:'Samen',needPhoto:false,stars:2,order:2,enabled:true},
{id:'fallback-mission-4',contentType:TYPE_MISSION,title:'Luister naar buiten',text:'Sta één minuut stil en probeer drie verschillende geluiden te horen. Vertel daarna aan elkaar wat je hoorde.',image:'',category:'Ontdekken',needPhoto:false,stars:1,order:3,enabled:true},
{id:'fallback-mission-5',contentType:TYPE_MISSION,title:'De Snazzle kleurenjacht',text:'Zoek buiten vier verschillende kleuren uit de natuur. Kies daarna jouw mooiste kleur en maak daar één leuke foto van.',image:'',category:'Kijken',needPhoto:true,stars:2,order:4,enabled:true},
{id:'fallback-mission-6',contentType:TYPE_MISSION,title:'Maak een gekke schaduw',text:'Ga naar buiten als de zon schijnt en maak samen met je handen of lichaam een grappige dierenschaduw. Maak een foto van alleen de schaduw.',image:'',category:'Samen',needPhoto:true,stars:3,order:5,enabled:true},
{id:'fallback-mission-7',contentType:TYPE_MISSION,title:'Snazzle speurneus',text:'Zoek tijdens een wandeling iets ronds, iets zachts en iets dat lekker ruikt. Je hoeft niets mee te nemen — wijs de drie vondsten aan elkaar aan.',image:'',category:'Ontdekken',needPhoto:false,stars:2,order:6,enabled:true}];'''

js_new, n_stories = re.subn(r"const FALLBACK_STORIES=\[.*?\];\nconst FALLBACK_MISSIONS=", stories_block + "\nconst FALLBACK_MISSIONS=", js, count=1, flags=re.S)
if n_stories != 1:
    raise SystemExit('Kon standaard Snazzle-verhalen niet vinden')

js_new, n_missions = re.subn(r"const FALLBACK_MISSIONS=\[.*?\];\nconst FALLBACK_TV=", missions_block + "\nconst FALLBACK_TV=", js_new, count=1, flags=re.S)
if n_missions != 1:
    raise SystemExit('Kon standaard Snazzle-missies niet vinden')

# Nieuwe cacheversie voor de Wereld-module en stylesheet.
js_new = re.sub(r"snazzle-world-hub-v47\.css\?v=\d+", 'snazzle-world-hub-v47.css?v=473', js_new, count=1)
js_path.write_text(js_new, encoding='utf-8')

app = app_path.read_text(encoding='utf-8')
app_new, n_app = re.subn(r"snazzle-world-hub-v47\.js\?v=\d+", 'snazzle-world-hub-v47.js?v=473', app, count=1)
if n_app != 1:
    raise SystemExit('Kon Snazzle Wereld import in app.js niet vinden')
app_path.write_text(app_new, encoding='utf-8')

index = index_path.read_text(encoding='utf-8')
index_new, n_index = re.subn(
    r'(<script type="module" src="\./app\.js\?v=)[^"]+("[^>]*></script>)',
    r'\g<1>473\g<2>',
    index,
    count=1,
)
if n_index != 1:
    raise SystemExit('Kon app.js cacheversie in index.html niet vinden')
index_path.write_text(index_new, encoding='utf-8')

print('Snazzle Wereld v47.3: 3 nieuwe avonturen en langere verhalen toegevoegd')
