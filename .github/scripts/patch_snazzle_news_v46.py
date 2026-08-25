from pathlib import Path
import re

APP = Path('app.js')
INDEX = Path('index.html')
RULES = Path('firestore.rules')

# 1) Load the newspaper module after the existing stable feature layers.
app = APP.read_text(encoding='utf-8')
news_import = "import './snazzle-news-v46.js?v=46';"
if news_import not in app:
    anchor = "import './snazzle-world-theme-v39.js?v=39';"
    if anchor not in app:
        raise SystemExit('app.js anchor not found')
    app = app.replace(anchor, anchor + "\n// v46: Het Snazzle Nieuws — interactieve krant met centraal paginabeheer.\n" + news_import)
    APP.write_text(app, encoding='utf-8')

# 2) Force phones to pick up the new app.js instead of an older cached copy.
index = INDEX.read_text(encoding='utf-8')
new_index = re.sub(r'app\.js\?v=\d+', 'app.js?v=46', index)
if new_index == index and 'app.js?v=46' not in index:
    raise SystemExit('index.html app.js cache marker not found')
if new_index != index:
    INDEX.write_text(new_index, encoding='utf-8')

# 3) Central newspaper pages: every signed-in app visitor can read; only superadmin can edit.
rules = RULES.read_text(encoding='utf-8')
news_rules = '''
    // Het Snazzle Nieuws: openbare krant voor ingelogde/anonime appgebruikers.
    // Alleen de hoofdbeheerder kan pagina's toevoegen, wijzigen, ordenen of verwijderen.
    match /snazzleNewsPages/{pageId} {
      allow read: if signedIn();
      allow create, update, delete: if isSuperAdmin();
    }

'''
if 'match /snazzleNewsPages/{pageId}' not in rules:
    anchor = '    match /snazzleCards/{cardId} {'
    if anchor not in rules:
        raise SystemExit('firestore.rules anchor not found')
    rules = rules.replace(anchor, news_rules + anchor)
    RULES.write_text(rules, encoding='utf-8')
