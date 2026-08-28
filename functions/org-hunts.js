'use strict';

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const crypto = require('crypto');

const REGION = 'europe-west1';
const CODE_LENGTH = 10;
const MAX_CODE_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_POINTS_PER_HUNT = 60;
const MAX_HUNTS_RETURNED = 40;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const C = Object.freeze({
  hunts: 'snazzleOrgHunts',
  assets: 'snazzleOrgAssets',
  secrets: 'snazzleOrgSecrets',
  sessions: 'snazzleOrgSessions',
  attempts: 'snazzleOrgAccessAttempts',
  finds: 'snazzleOrgFinds'
});

function text(value, max = 120) {
  return String(value ?? '').trim().slice(0, max);
}
function number(value, min, max, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
function requireAuth(request) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Log eerst in bij Snazzle.');
  return uid;
}
async function requireSuperAdmin(request, db) {
  const uid = requireAuth(request);
  if (request.auth?.token?.snazzle_admin_mfa !== true) {
    throw new HttpsError('permission-denied', 'Bevestig eerst de extra beveiligingscode van Beheer.');
  }
  const snap = await db.collection('adminUsers').doc(uid).get();
  const data = snap.exists ? (snap.data() || {}) : {};
  if (data.active !== true || data.role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Alleen de hoofdbeheerder mag dit uitvoeren.');
  }
  return uid;
}
function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const n = new Date(value).getTime();
  return Number.isFinite(n) ? n : 0;
}
function requireIso(value, label) {
  const raw = text(value, 40);
  const ms = new Date(raw).getTime();
  if (!raw || !Number.isFinite(ms)) throw new HttpsError('invalid-argument', `${label} is ongeldig.`);
  return new Date(ms).toISOString();
}
function publicWindowOpen(hunt, now = Date.now()) {
  if (!hunt || hunt.active !== true) return false;
  const start = toMillis(hunt.publicStartsAt);
  const end = toMillis(hunt.publicEndsAt);
  return !!start && !!end && now >= start && now <= end;
}
function accessWindowOpen(hunt, now = Date.now()) {
  if (!hunt || hunt.active !== true) return false;
  const start = toMillis(hunt.accessStartsAt);
  const end = toMillis(hunt.accessEndsAt);
  return !!start && !!end && now >= start && now <= end;
}
function normalizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}
function generateCode() {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  return out;
}
function secureHash(code, saltHex) {
  return crypto.scryptSync(normalizeCode(code), Buffer.from(saltHex, 'hex'), 32).toString('hex');
}
function safeEqualHex(a, b) {
  try {
    const left = Buffer.from(String(a || ''), 'hex');
    const right = Buffer.from(String(b || ''), 'hex');
    return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
  } catch { return false; }
}
function verifyCode(code, secret) {
  return !!secret?.salt && !!secret?.codeHash && safeEqualHex(secureHash(code, secret.salt), secret.codeHash);
}
function safeId(value, prefix = 'item') {
  const raw = text(value, 180).replace(/[^A-Za-z0-9_-]/g, '_');
  return raw || `${prefix}_${Date.now().toString(36)}`;
}
function randomId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(5).toString('hex')}`;
}
function publicHunt(id, h, pointCount = 0) {
  return {
    id,
    organization: text(h.organization, 70),
    title: text(h.title, 70),
    village: text(h.village, 60),
    description: text(h.description, 400),
    publicStartsAt: text(h.publicStartsAt, 40),
    publicEndsAt: text(h.publicEndsAt, 40),
    pointCount: Number(pointCount || h.pointCount || 0)
  };
}
function adminHunt(id, h) {
  return {
    ...publicHunt(id, h, h.pointCount),
    accessStartsAt: text(h.accessStartsAt, 40),
    accessEndsAt: text(h.accessEndsAt, 40),
    active: h.active === true,
    createdAt: text(h.createdAt, 40),
    updatedAt: text(h.updatedAt, 40)
  };
}
function assetPublic(id, a) {
  return {
    id,
    name: text(a.name, 60),
    category: text(a.category, 40) || 'Algemeen',
    imageUrl: text(a.imageUrl, 1000),
    allowedForOrg: a.allowedForOrg === true,
    allowedForPersonal: a.allowedForPersonal === true,
    active: a.active === true
  };
}
function distanceMeters(a, b) {
  const toRad = d => d * Math.PI / 180;
  const R = 6371000;
  const p1 = toRad(a.lat), p2 = toRad(b.lat);
  const dp = toRad(b.lat - a.lat), dl = toRad(b.lon - a.lon);
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
function geoFrom(data) {
  const lat = Number(data?.lat), lon = Number(data?.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new HttpsError('invalid-argument', 'GPS-locatie ontbreekt of is ongeldig.');
  }
  return { lat, lon };
}
async function registerCodeAttempt(db, huntId, uid) {
  const ref = db.collection(C.attempts).doc(safeId(`${huntId}_${uid}`, 'attempt'));
  const now = Date.now();
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const d = snap.exists ? (snap.data() || {}) : {};
    const start = Number(d.windowStartedAt || 0);
    const same = start > 0 && now - start < ATTEMPT_WINDOW_MS;
    const attempts = same ? Number(d.attempts || 0) : 0;
    if (attempts >= MAX_CODE_ATTEMPTS) {
      throw new HttpsError('resource-exhausted', 'Te veel codepogingen. Probeer het later opnieuw.');
    }
    tx.set(ref, {
      huntId, userId: uid, attempts: attempts + 1,
      windowStartedAt: same ? start : now,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
  return ref;
}
async function getHuntOrThrow(db, huntId) {
  const id = safeId(huntId, 'hunt');
  const ref = db.collection(C.hunts).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Deze Special Hunt bestaat niet.');
  return { id, ref, data: snap.data() || {} };
}
async function requireOrganizerSession(db, uid, huntId) {
  const { id, ref: huntRef, data: hunt } = await getHuntOrThrow(db, huntId);
  if (!accessWindowOpen(hunt)) throw new HttpsError('failed-precondition', 'De plaats-toegang voor deze Hunt is niet actief.');
  const sessionId = safeId(`${id}_${uid}`, 'session');
  const snap = await db.collection(C.sessions).doc(sessionId).get();
  const s = snap.exists ? (snap.data() || {}) : {};
  if (!snap.exists || s.active !== true || s.userId !== uid || s.huntId !== id || toMillis(s.expiresAt) < Date.now()) {
    throw new HttpsError('permission-denied', 'Je tijdelijke organisatie-toegang is verlopen of niet geldig.');
  }
  return { huntId: id, huntRef, hunt };
}

const adminListOrgHunts = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  await requireSuperAdmin(request, db);
  const snap = await db.collection(C.hunts).limit(MAX_HUNTS_RETURNED).get();
  const items = snap.docs.map(d => adminHunt(d.id, d.data() || {}))
    .sort((a, b) => String(b.publicStartsAt).localeCompare(String(a.publicStartsAt)));
  return { items };
});

const adminSaveOrgHunt = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = await requireSuperAdmin(request, db);
  const huntId = request.data?.huntId ? safeId(request.data.huntId, 'org') : randomId('org');
  const organization = text(request.data?.organization, 70);
  const title = text(request.data?.title, 70);
  const village = text(request.data?.village, 60);
  const description = text(request.data?.description, 400);
  if (organization.length < 2 || title.length < 2 || village.length < 2) {
    throw new HttpsError('invalid-argument', 'Vul organisatie, Huntnaam en dorp volledig in.');
  }
  const accessStartsAt = requireIso(request.data?.accessStartsAt, 'Start plaats-toegang');
  const accessEndsAt = requireIso(request.data?.accessEndsAt, 'Einde plaats-toegang');
  const publicStartsAt = requireIso(request.data?.publicStartsAt, 'Start publieke Hunt');
  const publicEndsAt = requireIso(request.data?.publicEndsAt, 'Einde publieke Hunt');
  if (new Date(accessEndsAt) <= new Date(accessStartsAt)) throw new HttpsError('invalid-argument', 'De plaats-toegang eindigt vóór hij begint.');
  if (new Date(publicEndsAt) <= new Date(publicStartsAt)) throw new HttpsError('invalid-argument', 'De publieke Hunt eindigt vóór hij begint.');

  const ref = db.collection(C.hunts).doc(huntId);
  const old = await ref.get();
  const previous = old.exists ? (old.data() || {}) : {};
  const now = new Date().toISOString();
  const data = {
    organization, title, village, description,
    accessStartsAt, accessEndsAt, publicStartsAt, publicEndsAt,
    active: request.data?.active !== false,
    pointCount: Number(previous.pointCount || 0),
    createdAt: previous.createdAt || now,
    createdBy: previous.createdBy || uid,
    updatedAt: now,
    updatedBy: uid
  };
  await ref.set(data, { merge: false });
  return { ok: true, hunt: adminHunt(huntId, data) };
});

const adminDeleteOrgHunt = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  await requireSuperAdmin(request, db);
  const { id, ref } = await getHuntOrThrow(db, request.data?.huntId);
  const points = await ref.collection('points').get();
  const batch = db.batch();
  points.forEach(p => batch.delete(p.ref));
  batch.delete(ref);
  batch.delete(db.collection(C.secrets).doc(id));
  await batch.commit();
  return { ok: true };
});

const adminGenerateOrgAccessCode = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = await requireSuperAdmin(request, db);
  const { id, data: hunt } = await getHuntOrThrow(db, request.data?.huntId);
  const code = generateCode();
  const salt = crypto.randomBytes(16).toString('hex');
  await db.collection(C.secrets).doc(id).set({
    codeHash: secureHash(code, salt),
    salt,
    locator: code.slice(0, 3),
    active: true,
    claimedBy: FieldValue.delete(),
    claimedAt: FieldValue.delete(),
    last2: code.slice(-2),
    accessEndsAt: hunt.accessEndsAt,
    updatedBy: uid,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  return { ok: true, code, last2: code.slice(-2), accessEndsAt: hunt.accessEndsAt };
});

const redeemOrgAccessCode = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = requireAuth(request);
  const code = normalizeCode(request.data?.code);
  if (code.length !== CODE_LENGTH) throw new HttpsError('invalid-argument', 'Vul de volledige organisatiecode in.');
  const locator = code.slice(0, 3);
  const secretQuery = await db.collection(C.secrets).where('locator', '==', locator).get();
  let matched = null;
  for (const docSnap of secretQuery.docs) {
    const secret = docSnap.data() || {};
    if (secret.active === true && verifyCode(code, secret)) {
      matched = { huntId: docSnap.id, ref: docSnap.ref, secret };
      break;
    }
  }
  if (!matched) throw new HttpsError('permission-denied', 'De organisatiecode klopt niet.');
  const huntId = matched.huntId;
  const attemptRef = await registerCodeAttempt(db, huntId, uid);
  const { data: hunt } = await getHuntOrThrow(db, huntId);
  if (!accessWindowOpen(hunt)) throw new HttpsError('failed-precondition', 'Deze organisatiecode is nu niet actief.');
  if (matched.secret.claimedBy && matched.secret.claimedBy !== uid) {
    throw new HttpsError('permission-denied', 'Deze organisatiecode is al gekoppeld aan een ander Snazzle-account.');
  }
  const sessionId = safeId(`${huntId}_${uid}`, 'session');
  const expiresAt = Timestamp.fromDate(new Date(hunt.accessEndsAt));
  await db.runTransaction(async tx => {
    tx.set(db.collection(C.sessions).doc(sessionId), {
      huntId, userId: uid, active: true,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt
    }, { merge: true });
    tx.set(matched.ref, {
      claimedBy: uid,
      claimedAt: matched.secret.claimedAt || FieldValue.serverTimestamp()
    }, { merge: true });
  });
  await attemptRef.delete().catch(() => {});
  return { ok: true, hunt: adminHunt(huntId, hunt), expiresAt: hunt.accessEndsAt };
});

const getOrganizerSessions = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = requireAuth(request);
  const snap = await db.collection(C.sessions).where('userId', '==', uid).get();
  const items = [];
  for (const docSnap of snap.docs) {
    const s = docSnap.data() || {};
    if (s.active !== true || toMillis(s.expiresAt) < Date.now()) continue;
    const huntSnap = await db.collection(C.hunts).doc(String(s.huntId || '')).get();
    if (!huntSnap.exists) continue;
    const h = huntSnap.data() || {};
    if (!accessWindowOpen(h)) continue;
    items.push(adminHunt(huntSnap.id, h));
  }
  return { items };
});

const listOrgAssets = onCall({ region: REGION }, async request => {
  requireAuth(request);
  const db = getFirestore();
  const snap = await db.collection(C.assets).get();
  const items = snap.docs.map(d => assetPublic(d.id, d.data() || {}))
    .filter(a => a.active && (a.allowedForOrg || a.allowedForPersonal))
    .sort((a, b) => a.category.localeCompare(b.category, 'nl') || a.name.localeCompare(b.name, 'nl'));
  return { items };
});

const adminListOrgAssets = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  await requireSuperAdmin(request, db);
  const snap = await db.collection(C.assets).get();
  const items = snap.docs.map(d => assetPublic(d.id, d.data() || {}))
    .sort((a, b) => a.category.localeCompare(b.category, 'nl') || a.name.localeCompare(b.name, 'nl'));
  return { items };
});

const adminSaveOrgAsset = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = await requireSuperAdmin(request, db);
  const id = request.data?.assetId ? safeId(request.data.assetId, 'asset') : randomId('asset');
  const name = text(request.data?.name, 60);
  const category = text(request.data?.category, 40) || 'Algemeen';
  const imageUrl = text(request.data?.imageUrl, 1000);
  if (name.length < 2 || !/^https:\/\//i.test(imageUrl)) {
    throw new HttpsError('invalid-argument', 'Naam of Snazzle-afbeelding ontbreekt.');
  }
  const old = await db.collection(C.assets).doc(id).get();
  const previous = old.exists ? (old.data() || {}) : {};
  const now = new Date().toISOString();
  const data = {
    name, category, imageUrl,
    active: request.data?.active !== false,
    allowedForOrg: request.data?.allowedForOrg !== false,
    allowedForPersonal: request.data?.allowedForPersonal === true,
    createdAt: previous.createdAt || now,
    createdBy: previous.createdBy || uid,
    updatedAt: now,
    updatedBy: uid
  };
  await db.collection(C.assets).doc(id).set(data, { merge: false });
  return { ok: true, asset: assetPublic(id, data) };
});

const adminDeleteOrgAsset = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  await requireSuperAdmin(request, db);
  const id = safeId(request.data?.assetId, 'asset');
  await db.collection(C.assets).doc(id).delete();
  return { ok: true };
});

const organizerListPoints = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = requireAuth(request);
  const { huntId, huntRef, hunt } = await requireOrganizerSession(db, uid, request.data?.huntId);
  const snap = await huntRef.collection('points').get();
  const points = snap.docs.map(d => {
    const p = d.data() || {};
    return {
      id: d.id, name: text(p.name, 50), hint: text(p.hint, 140),
      radius: Number(p.radius || 8), active: p.active !== false,
      assetId: text(p.assetId, 180), imageUrl: text(p.imageUrl, 1000),
      assetName: text(p.assetName, 60)
    };
  });
  return { hunt: adminHunt(huntId, hunt), points };
});

const organizerPlacePoint = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = requireAuth(request);
  const { huntId, huntRef } = await requireOrganizerSession(db, uid, request.data?.huntId);
  const current = await huntRef.collection('points').get();
  if (current.size >= MAX_POINTS_PER_HUNT) throw new HttpsError('resource-exhausted', 'Deze Hunt heeft het maximale aantal AR-punten bereikt.');
  const assetId = safeId(request.data?.assetId, 'asset');
  const assetSnap = await db.collection(C.assets).doc(assetId).get();
  const asset = assetSnap.exists ? (assetSnap.data() || {}) : {};
  if (!assetSnap.exists || asset.active !== true || asset.allowedForOrg !== true || !asset.imageUrl) {
    throw new HttpsError('failed-precondition', 'Deze Snazzle staat niet in de toegestane organisatie-bibliotheek.');
  }
  const geo = geoFrom(request.data);
  const accuracy = number(request.data?.accuracy, 0, 100, 0);
  const radius = number(request.data?.radius, 4, 20, 8);
  const name = text(request.data?.name, 50) || text(asset.name, 50) || 'Snazzle';
  const hint = text(request.data?.hint, 140);
  const pointId = randomId('orgar');
  const now = new Date().toISOString();
  await huntRef.collection('points').doc(pointId).set({
    name, hint, radius, lat: geo.lat, lon: geo.lon, accuracy,
    assetId, assetName: text(asset.name, 60), imageUrl: text(asset.imageUrl, 1000),
    active: true, createdAt: now, createdBy: uid, updatedAt: now
  });
  await huntRef.set({ pointCount: current.size + 1, updatedAt: now }, { merge: true });
  return { ok: true, pointId };
});

const organizerTogglePoint = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = requireAuth(request);
  const { huntRef } = await requireOrganizerSession(db, uid, request.data?.huntId);
  const pointId = safeId(request.data?.pointId, 'point');
  const ref = huntRef.collection('points').doc(pointId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'AR-punt niet gevonden.');
  await ref.set({ active: request.data?.active === true, updatedAt: new Date().toISOString() }, { merge: true });
  return { ok: true };
});

const organizerDeletePoint = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = requireAuth(request);
  const { huntRef } = await requireOrganizerSession(db, uid, request.data?.huntId);
  const pointId = safeId(request.data?.pointId, 'point');
  await huntRef.collection('points').doc(pointId).delete();
  const countSnap = await huntRef.collection('points').get();
  await huntRef.set({ pointCount: countSnap.size, updatedAt: new Date().toISOString() }, { merge: true });
  return { ok: true };
});

const listLiveOrgHunts = onCall({ region: REGION }, async request => {
  requireAuth(request);
  const db = getFirestore();
  const snap = await db.collection(C.hunts).where('active', '==', true).limit(MAX_HUNTS_RETURNED).get();
  const items = snap.docs
    .filter(d => publicWindowOpen(d.data() || {}))
    .map(d => publicHunt(d.id, d.data() || {}))
    .sort((a, b) => String(a.publicStartsAt).localeCompare(String(b.publicStartsAt)));
  return { items };
});

const getOrgHuntState = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = requireAuth(request);
  const { id, data: hunt } = await getHuntOrThrow(db, request.data?.huntId);
  if (!publicWindowOpen(hunt)) throw new HttpsError('failed-precondition', 'Deze Special Hunt is nu niet actief.');
  const pointSnap = await db.collection(C.hunts).doc(id).collection('points').where('active', '==', true).get();
  const findSnap = await db.collection(C.finds).where('userId', '==', uid).get();
  const mine = findSnap.docs.map(d => d.data() || {}).filter(f => f.huntId === id);
  return { hunt: publicHunt(id, hunt, pointSnap.size), found: mine.length, total: pointSnap.size };
});

const getNextOrgTarget = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = requireAuth(request);
  const here = geoFrom(request.data);
  const { id, ref: huntRef, data: hunt } = await getHuntOrThrow(db, request.data?.huntId);
  if (!publicWindowOpen(hunt)) throw new HttpsError('failed-precondition', 'Deze Special Hunt is nu niet actief.');
  const pointSnap = await huntRef.collection('points').where('active', '==', true).get();
  if (pointSnap.empty) return { done: true, total: 0, found: 0 };
  const allPoints = pointSnap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
  const findSnap = await db.collection(C.finds).where('userId', '==', uid).get();
  const foundIds = new Set(findSnap.docs.map(d => d.data() || {}).filter(f => f.huntId === id).map(f => f.pointId));
  const remaining = allPoints.filter(p => !foundIds.has(p.id));
  if (!remaining.length) return { done: true, total: allPoints.length, found: allPoints.length };
  remaining.sort((a, b) => distanceMeters(here, { lat: Number(a.lat), lon: Number(a.lon) }) - distanceMeters(here, { lat: Number(b.lat), lon: Number(b.lon) }));
  const p = remaining[0];
  return {
    done: false, total: allPoints.length, found: allPoints.length - remaining.length,
    target: {
      id: p.id, name: text(p.name, 50), hint: text(p.hint, 140),
      radius: number(p.radius, 4, 20, 8), lat: Number(p.lat), lon: Number(p.lon),
      assetId: text(p.assetId, 180), assetName: text(p.assetName, 60),
      imageUrl: text(p.imageUrl, 1000)
    }
  };
});

const claimOrgTarget = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = requireAuth(request);
  const here = geoFrom(request.data);
  const accuracy = number(request.data?.accuracy, 0, 100, 0);
  const { id, ref: huntRef, data: hunt } = await getHuntOrThrow(db, request.data?.huntId);
  if (!publicWindowOpen(hunt)) throw new HttpsError('failed-precondition', 'Deze Special Hunt is nu niet actief.');
  const pointId = safeId(request.data?.pointId, 'point');
  const pointRef = huntRef.collection('points').doc(pointId);
  const pointSnap = await pointRef.get();
  if (!pointSnap.exists) throw new HttpsError('not-found', 'Deze AR-Snazzle bestaat niet meer.');
  const p = pointSnap.data() || {};
  if (p.active === false) throw new HttpsError('failed-precondition', 'Deze AR-Snazzle is uitgeschakeld.');
  const remaining = distanceMeters(here, { lat: Number(p.lat), lon: Number(p.lon) });
  const allowed = number(p.radius, 4, 20, 8) + Math.min(30, accuracy) + 5;
  if (remaining > allowed) throw new HttpsError('failed-precondition', 'Je bent nog niet dicht genoeg bij deze Snazzle.');
  const findingId = safeId(`${id}_${uid}_${pointId}`, 'find');
  const findingRef = db.collection(C.finds).doc(findingId);
  const now = new Date().toISOString();
  await db.runTransaction(async tx => {
    const existing = await tx.get(findingRef);
    if (!existing.exists) {
      tx.create(findingRef, {
        userId: uid, huntId: id, pointId,
        organization: text(hunt.organization, 70), eventTitle: text(hunt.title, 70), village: text(hunt.village, 60),
        assetId: text(p.assetId, 180), assetName: text(p.assetName, 60) || text(p.name, 50),
        imageUrl: text(p.imageUrl, 1000), foundAt: now,
        edition: 'EVENT EDITION'
      });
    }
  });
  return {
    ok: true,
    found: {
      huntId: id, pointId,
      eventTitle: text(hunt.title, 70), organization: text(hunt.organization, 70), village: text(hunt.village, 60),
      assetId: text(p.assetId, 180), assetName: text(p.assetName, 60) || text(p.name, 50),
      imageUrl: text(p.imageUrl, 1000), foundAt: now, edition: 'EVENT EDITION'
    }
  };
});

const listMyOrgFinds = onCall({ region: REGION }, async request => {
  const db = getFirestore();
  const uid = requireAuth(request);
  const snap = await db.collection(C.finds).where('userId', '==', uid).get();
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }))
    .map(f => ({
      id: f.id, huntId: text(f.huntId, 180), pointId: text(f.pointId, 180),
      eventTitle: text(f.eventTitle, 70), organization: text(f.organization, 70), village: text(f.village, 60),
      assetId: text(f.assetId, 180), assetName: text(f.assetName, 60),
      imageUrl: text(f.imageUrl, 1000), foundAt: text(f.foundAt, 40), edition: 'EVENT EDITION'
    }))
    .sort((a, b) => String(b.foundAt).localeCompare(String(a.foundAt)));
  return { items };
});

module.exports = {
  adminListOrgHunts,
  adminSaveOrgHunt,
  adminDeleteOrgHunt,
  adminGenerateOrgAccessCode,
  redeemOrgAccessCode,
  getOrganizerSessions,
  listOrgAssets,
  adminListOrgAssets,
  adminSaveOrgAsset,
  adminDeleteOrgAsset,
  organizerListPoints,
  organizerPlacePoint,
  organizerTogglePoint,
  organizerDeletePoint,
  listLiveOrgHunts,
  getOrgHuntState,
  getNextOrgTarget,
  claimOrgTarget,
  listMyOrgFinds
};
