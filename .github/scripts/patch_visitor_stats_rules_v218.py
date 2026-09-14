from pathlib import Path

path = Path('firestore.rules')
text = path.read_text(encoding='utf-8')
marker = '// Snazzle bezoekersstatistieken v218'
if marker in text:
    print('Visitor stats rules already present.')
    raise SystemExit(0)

needle = '    match /{document=**} {'
if needle not in text:
    raise SystemExit('Catch-all Firestore rule not found; refusing to patch.')

snippet = r'''    // Snazzle bezoekersstatistieken v218.
    // Alleen anonieme UID + servertijd; geen naam, e-mail, GPS of IP in deze documenten.
    match /snazzlePresenceV1/{uid} {
      allow read: if isSuperAdmin();
      allow create, update: if signedIn() && request.auth.uid == uid &&
        request.resource.data.keys().hasOnly(["userId", "lastSeenAt"]) &&
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.lastSeenAt == request.time;
      allow delete: if isSuperAdmin() || (signedIn() && request.auth.uid == uid);
    }

    match /snazzleDailyPresenceV1/{day}/visitors/{uid} {
      allow read: if isSuperAdmin();
      allow create, update: if signedIn() && request.auth.uid == uid &&
        request.resource.data.keys().hasOnly(["userId", "seenAt"]) &&
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.seenAt == request.time;
      allow delete: if isSuperAdmin() || (signedIn() && request.auth.uid == uid);
    }

'''
text = text.replace(needle, snippet + needle, 1)
path.write_text(text, encoding='utf-8')
print('Inserted Snazzle visitor stats Firestore rules v218.')
