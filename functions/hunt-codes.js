const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

const MIN_CODE_LENGTH = 8;
const MAX_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_PHOTO_BYTES = 600 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function normalizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}
function legacyHash(value) {
  return crypto.createHash('sha256').update(normalizeCode(value), 'utf8').digest('hex');
}
function secureHash(value, saltHex) {
  return crypto.scryptSync(normalizeCode(value), Buffer.from(saltHex, 'hex'), 32).toString('hex');
}
function safeEqualHex(a, b) {
  try {
    const left = Buffer.from(String(a || ''), 'hex');
    const right = Buffer.from(String(b || ''), 'hex');
    return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}
function verifyStoredCode(code, secret) {
  if (secret.salt && secret.codeHash) return safeEqualHex(secureHash(code, secret.salt), secret.codeHash);
  if (secret.codeHash) return safeEqualHex(legacyHash(code), secret.codeHash);
  return false;
}
async function requireSuperAdmin(db, uid) {
  if (!uid) throw new HttpsError('unauthenticated', 'Log eerst in als beheerder.');
  const snap = await db.collection('adminUsers').doc(uid).get();
  const data = snap.exists ? (snap.data() || {}) : {};
  if (data.active !== true || data.role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Alleen de hoofdbeheerder mag Hunt-codes beheren.');
  }
}
function hasValidImageSignature(buffer, mime) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  if (mime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mime === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}
function validatePhoto(photoData) {
  const photo = String(photoData || '').trim();
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo);
  if (!match || !ALLOWED_PHOTO_TYPES.has(match[1])) {
    throw new HttpsError('invalid-argument', 'Gebruik een geldige JPG-, PNG- of WebP-vondstfoto.');
  }

  let buffer;
  try {
    buffer = Buffer.from(match[2], 'base64');
  } catch {
    throw new HttpsError('invalid-argument', 'De vondstfoto is ongeldig.');
  }
  if (!buffer.length || buffer.length > MAX_PHOTO_BYTES) {
    throw new HttpsError('invalid-argument', 'De vondstfoto is te groot of leeg.');
  }
  if (!hasValidImageSignature(buffer, match[1])) {
    throw new HttpsError('invalid-argument', 'De vondstfoto heeft geen geldig afbeeldingsformaat.');
  }

  // Sla uitsluitend een genormaliseerde data-URL op; zo kunnen extra attributen of scripts
  // nooit via dit veld in later gerenderde HTML terechtkomen.
  return `data:${match[1]};base64,${buffer.toString('base64')}`;
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
function attemptId(huntId, uid) {
  return `${huntId}_${uid}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 240);
}
async function registerAttempt(db, huntId, uid) {
  const ref = db.collection('huntCodeAttempts').doc(attemptId(huntId, uid));
  const now = Date.now();
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const data = snap.exists ? (snap.data() || {}) : {};
    const windowStartedAt = Number(data.windowStartedAt || 0);
    const sameWindow = windowStartedAt > 0 && now - windowStartedAt < ATTEMPT_WINDOW_MS;
    const attempts = sameWindow ? Number(data.attempts || 0) : 0;
    if (attempts >= MAX_ATTEMPTS) {
      throw new HttpsError('resource-exhausted', 'Te veel codepogingen. Probeer het over enkele minuten opnieuw.');
    }
    tx.set(ref, {
      huntId,
      userId: uid,
      attempts: attempts + 1,
      windowStartedAt: sameWindow ? windowStartedAt : now,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
  return ref;
}

const saveHuntCode = onCall({ region: 'europe-west1' }, async request => {
  const db = getFirestore();
  await requireSuperAdmin(db, request.auth?.uid);
  const huntId = String(request.data?.huntId || '').trim();
  const code = normalizeCode(request.data?.code);
  if (!huntId) throw new HttpsError('invalid-argument', 'Hunt ontbreekt.');
  if (code.length < MIN_CODE_LENGTH) throw new HttpsError('invalid-argument', `Gebruik minimaal ${MIN_CODE_LENGTH} tekens voor de geheime code.`);
  const huntSnap = await db.collection('hunts').doc(huntId).get();
  if (!huntSnap.exists) throw new HttpsError('not-found', 'Deze Hunt bestaat niet.');
  const salt = crypto.randomBytes(16).toString('hex');
  await db.collection('huntSecrets').doc(huntId).set({
    codeHash: secureHash(code, salt),
    salt,
    algorithm: 'scrypt-v1',
    last2: code.slice(-2),
    active: true,
    updatedBy: request.auth.uid,
    updatedAt: FieldValue.serverTimestamp(),
    usedAt: FieldValue.delete(),
    usedBy: FieldValue.delete()
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
  if (!huntId || code.length < MIN_CODE_LENGTH) throw new HttpsError('invalid-argument', 'Vul de volledige vindcode in.');

  const db = getFirestore();
  const attemptRef = await registerAttempt(db, huntId, uid);
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
    if (!verifyStoredCode(code, secret)) throw new HttpsError('permission-denied', 'De ingevoerde code klopt niet.');

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

  await attemptRef.delete().catch(() => {});
  return result;
});

module.exports = { saveHuntCode, getHuntCodeState, verifyHuntCode };
