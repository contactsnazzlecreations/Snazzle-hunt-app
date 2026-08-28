const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');

const CODE_TTL_MS = 10 * 60 * 1000;
const MIN_RESEND_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 6;

function hashCode(code, salt) {
  return crypto.scryptSync(String(code), Buffer.from(salt, 'hex'), 32).toString('hex');
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

function maskEmail(email) {
  const value = String(email || '').trim();
  const at = value.indexOf('@');
  if (at <= 1) return value;
  return `${value[0]}***${value.slice(at)}`;
}

async function getActiveAdmin(db, uid) {
  if (!uid) throw new HttpsError('unauthenticated', 'Log eerst in met je beheerdersaccount.');
  const snap = await db.collection('adminUsers').doc(uid).get();
  const data = snap.exists ? (snap.data() || {}) : {};
  if (data.active !== true || !['superadmin', 'village_admin'].includes(data.role)) {
    throw new HttpsError('permission-denied', 'Dit account heeft geen actieve beheerdersrechten.');
  }
  return data;
}

const requestAdminLoginCode = onCall(
  {
    region: 'europe-west1',
    secrets: [SMTP_USER, SMTP_PASS]
  },
  async request => {
    const uid = request.auth?.uid;
    const email = String(request.auth?.token?.email || '').trim().toLowerCase();
    if (!uid || !email) {
      throw new HttpsError('unauthenticated', 'Log eerst in met e-mail en wachtwoord.');
    }

    const db = getFirestore();
    await getActiveAdmin(db, uid);

    const ref = db.collection('adminMfaChallenges').doc(uid);
    const current = await ref.get();
    const now = Date.now();
    if (current.exists) {
      const data = current.data() || {};
      const requestedAtMs = Number(data.requestedAtMs || 0);
      if (requestedAtMs && now - requestedAtMs < MIN_RESEND_MS) {
        throw new HttpsError('resource-exhausted', 'Er is net al een beveiligingscode verstuurd.');
      }
    }

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const salt = crypto.randomBytes(16).toString('hex');
    const smtpUser = SMTP_USER.value();
    const smtpPass = SMTP_PASS.value();
    if (!smtpUser || !smtpPass) throw new HttpsError('internal', 'E-mailbeveiliging is niet geconfigureerd.');

    await ref.set({
      codeHash: hashCode(code, salt),
      salt,
      attempts: 0,
      requestedAtMs: now,
      expiresAt: Timestamp.fromMillis(now + CODE_TTL_MS),
      createdAt: FieldValue.serverTimestamp()
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass }
    });

    await transporter.sendMail({
      from: `Snazzle Beveiliging <${smtpUser}>`,
      to: email,
      subject: 'Snazzle beheer – beveiligingscode',
      text: `Je Snazzle beveiligingscode is: ${code}\n\nDeze code is 10 minuten geldig. Heb jij niet geprobeerd in te loggen? Dan kun je deze e-mail negeren.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2d2116"><h2 style="color:#176b3a">🔐 Snazzle beheer</h2><p>Gebruik deze eenmalige beveiligingscode om Beheer te openen:</p><div style="font-size:34px;font-weight:800;letter-spacing:8px;padding:18px;border-radius:14px;background:#fff4c7;text-align:center">${code}</div><p>De code is <b>10 minuten</b> geldig.</p><p style="font-size:12px;color:#6b5a48">Heb jij niet geprobeerd in te loggen? Dan kun je deze e-mail negeren.</p></div>`
    });

    return { ok: true, maskedEmail: maskEmail(email), expiresInSeconds: CODE_TTL_MS / 1000 };
  }
);

const verifyAdminLoginCode = onCall({ region: 'europe-west1' }, async request => {
  const uid = request.auth?.uid;
  const code = String(request.data?.code || '').replace(/\D/g, '').slice(0, 6);
  if (!uid) throw new HttpsError('unauthenticated', 'Log eerst in met je beheerdersaccount.');
  if (code.length !== 6) throw new HttpsError('invalid-argument', 'Vul de volledige 6-cijferige code in.');

  const db = getFirestore();
  const admin = await getActiveAdmin(db, uid);
  const ref = db.collection('adminMfaChallenges').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('failed-precondition', 'Vraag eerst een nieuwe beveiligingscode aan.');

  const challenge = snap.data() || {};
  const expiresAtMs = challenge.expiresAt?.toMillis?.() || 0;
  if (!expiresAtMs || Date.now() > expiresAtMs) {
    await ref.delete().catch(() => {});
    throw new HttpsError('deadline-exceeded', 'Deze beveiligingscode is verlopen. Vraag een nieuwe aan.');
  }

  const attempts = Number(challenge.attempts || 0);
  if (attempts >= MAX_VERIFY_ATTEMPTS) {
    await ref.delete().catch(() => {});
    throw new HttpsError('resource-exhausted', 'Te veel verkeerde pogingen. Vraag een nieuwe code aan.');
  }

  const candidateHash = hashCode(code, String(challenge.salt || ''));
  if (!safeEqualHex(candidateHash, challenge.codeHash)) {
    await ref.update({ attempts: FieldValue.increment(1), lastAttemptAt: FieldValue.serverTimestamp() });
    throw new HttpsError('permission-denied', 'De beveiligingscode klopt niet.');
  }

  await ref.delete();

  const customToken = await getAuth().createCustomToken(uid, {
    snazzle_admin_mfa: true,
    snazzle_admin_role: admin.role,
    snazzle_admin_village: String(admin.village || '').slice(0, 60)
  });

  return { ok: true, customToken, role: admin.role };
});

module.exports = { requestAdminLoginCode, verifyAdminLoginCode };
