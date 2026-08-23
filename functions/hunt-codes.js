const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

function normalizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}
function hashCode(value) {
  return crypto.createHash('sha256').update(normalizeCode(value), 'utf8').digest('hex');
}
async function requireSuperAdmin(db, uid) {
  if (!uid) throw new HttpsError('unauthenticated', 'Log eerst in als beheerder.');
  const snap = await db.collection('adminUsers').doc(uid).get();
  const data = snap.exists ? (snap.data() || {}) : {};
  if (data.active !== true || data.role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Alleen de hoofdbeheerder mag Hunt-codes beheren.');
  }
}
function validatePhoto(photoData) {
  const photo = String(photoData || '');
  if (!photo.startsWith('data:image/')) throw new HttpsError('invalid-argument', 'Maak eerst een vondstfoto.');
  if (photo.length > 800000) throw new HttpsError('invalid-argument', 'De vondstfoto is te groot.');
  return photo;
}
function huntIsClaimable(hunt) {
  if (!hunt || hunt.found === true || hunt.mode === 'draft') return false;
  const now = Date.now();
  const start = hunt.start ? new Date(hunt.start).getTime() : 0;
  const end = hunt.end ? new Date(hunt.end).getTime() : Infinity;
  if (Number.isFinite(start) && start && now < start) return false;
  if (Number.isFinite(end) && end && now > end) return false;
  return true;
}

const saveHuntCode = onCall({ region: 'europe-west1' }, async request => {
  const db = getFirestore();
  await requireSuperAdmin(db, request.auth?.uid);
  const huntId = String(request.data?.huntId || '').trim();
  const code = normalizeCode(request.data?.code);
  if (!huntId) throw new HttpsError('invalid-argument', 'Hunt ontbreekt.');
  if (code.length < 6) throw new HttpsError('invalid-argument', 'Gebruik minimaal 6 tekens voor de geheime code.');
  const huntSnap = await db.collection('hunts').doc(huntId).get();
  if (!huntSnap.exists) throw new HttpsError('not-found', 'Deze Hunt bestaat niet.');
  await db.collection('huntSecrets').doc(huntId).set({
    codeHash: hashCode(code),
    last2: code.slice(-2),
    active: true,
    updatedBy: request.auth.uid,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  return { ok: true, configured: true, last2: code.slice(-2) };
});

const getHuntCodeState = onCall({ region: 'europe-west1' }, async request => {
  const db = getFirestore();
  await requireSuperAdmin(db, request.auth?.uid);
  const huntId = String(request.data?.huntId || '').trim();
  if (!huntId) throw new HttpsError('invalid-argument', 'Hunt ontbreekt.');
  const snap = await db.collection('huntSecrets').doc(huntId).get();
  if (!snap.exists) return { configured: false, last2: '' };
  const data = snap.data() || {};
  return { configured: data.active === true && !!data.codeHash, last2: String(data.last2 || '') };
});

const verifyHuntCode = onCall({ region: 'europe-west1' }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Log eerst in om een vondst te bevestigen.');
  const huntId = String(request.data?.huntId || '').trim();
  const code = normalizeCode(request.data?.code);
  const nickname = String(request.data?.nickname || 'Snazzle-speler').trim().slice(0, 20) || 'Snazzle-speler';
  const photoData = validatePhoto(request.data?.photoData);
  if (!huntId || code.length < 6) throw new HttpsError('invalid-argument', 'Vul de volledige vindcode in.');

  const db = getFirestore();
  const huntRef = db.collection('hunts').doc(huntId);
  const secretRef = db.collection('huntSecrets').doc(huntId);
  const findingRef = db.collection('findings').doc(huntId);

  const result = await db.runTransaction(async tx => {
    const [huntSnap, secretSnap, findingSnap] = await Promise.all([
      tx.get(huntRef), tx.get(secretRef), tx.get(findingRef)
    ]);
    if (!huntSnap.exists) throw new HttpsError('not-found', 'Deze Hunt bestaat niet meer.');
    const hunt = huntSnap.data() || {};
    if (hunt.found === true || findingSnap.exists) {
      throw new HttpsError('failed-precondition', 'Deze Snazzle is al gevonden.');
    }
    if (!huntIsClaimable(hunt)) throw new HttpsError('failed-precondition', 'Deze Hunt is niet actief.');
    if (!secretSnap.exists) throw new HttpsError('not-found', 'Voor deze Hunt is nog geen geheime code ingesteld.');
    const secret = secretSnap.data() || {};
    if (secret.active !== true || !secret.codeHash) throw new HttpsError('not-found', 'De geheime code is niet actief.');
    if (hashCode(code) !== secret.codeHash) throw new HttpsError('permission-denied', 'De ingevoerde code klopt niet.');

    const now = new Date().toISOString();
    const item = {
      userId: uid,
      nickname,
      huntId,
      title: hunt.title || 'Snazzle Hunt',
      village: hunt.village || '',
      photoData,
      dateLabel: new Date().toLocaleDateString('nl-NL'),
      createdAt: now,
      verifiedByCode: true
    };
    tx.set(findingRef, item);
    tx.update(huntRef, {
      found: true,
      foundAt: now,
      foundByUserId: uid,
      foundByNickname: nickname,
      foundVerifiedByCode: true
    });
    tx.update(secretRef, {
      active: false,
      usedAt: FieldValue.serverTimestamp(),
      usedBy: uid
    });
    return {
      ok: true,
      title: hunt.title || 'Snazzle',
      foundMessage: hunt.foundMessage || 'Gefeliciteerd! Je hebt de Snazzle gevonden!'
    };
  });
  return result;
});

module.exports = { saveHuntCode, getHuntCodeState, verifyHuntCode };
