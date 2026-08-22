const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');

initializeApp();

const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');

function euro(cents) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format((Number(cents) || 0) / 100);
}

function safe(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function getNotificationEmails(db, fallback) {
  const snap = await db.collection('adminUsers').get();
  const emails = [];
  snap.forEach(docSnap => {
    const data = docSnap.data() || {};
    if (data.active === true && data.role === 'superadmin' && Array.isArray(data.shopNotificationEmails)) {
      for (const email of data.shopNotificationEmails) {
        const normalized = String(email || '').trim().toLowerCase();
        if (normalized && !emails.includes(normalized)) emails.push(normalized);
      }
    }
  });
  if (!emails.length && fallback) emails.push(String(fallback).trim().toLowerCase());
  return emails.slice(0, 2);
}

function addressText(order) {
  if (order.fulfillment !== 'shipping') return 'Afhalen – moment in overleg';
  return `${order.street || ''} ${order.houseNumber || ''}, ${order.postalCode || ''} ${order.city || ''}`.trim();
}

exports.sendShopOrderEmails = onDocumentCreated(
  {
    document: 'shopOrders/{orderId}',
    region: 'europe-west4',
    secrets: [SMTP_USER, SMTP_PASS],
    retry: true
  },
  async event => {
    if (!event.data) return;

    const db = getFirestore();
    const orderRef = event.data.ref;
    const currentSnap = await orderRef.get();
    if (!currentSnap.exists) return;

    const order = currentSnap.data() || {};
    const smtpUser = SMTP_USER.value();
    const smtpPass = SMTP_PASS.value();

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP_USER of SMTP_PASS ontbreekt');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const orderNo = order.orderNo || event.params.orderId;
    const fulfillment = order.fulfillment === 'shipping' ? 'Verzenden' : 'Afhalen';
    const total = euro(order.productTotalCents);
    const ownerEmails = await getNotificationEmails(db, smtpUser);

    if (!order.ownerMailSentAt) {
      const ownerSubject = `🦆 Nieuwe Snazzle reservering – ${orderNo}`;
      const ownerText = [
        'Er is een nieuwe Snazzle-bestelaanvraag binnengekomen.',
        '',
        `Bestelnummer: ${orderNo}`,
        `Product: ${order.quantity || 1}x ${order.productName || 'Snazzle'}`,
        `Producttotaal: ${total}`,
        `Keuze: ${fulfillment}`,
        `Naam: ${order.contactName || '-'}`,
        `E-mail: ${order.email || '-'}`,
        `Telefoon: ${order.phone || '-'}`,
        `Adres / afhalen: ${addressText(order)}`,
        '',
        'Open Snazzle Beheer → Shop → Bestelaanvragen om de bestelling af te handelen.'
      ].join('\n');

      const ownerHtml = `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#2d2116">
          <h2 style="color:#176b3a">🦆 Nieuwe Snazzle reservering</h2>
          <p>Er is een nieuwe bestelaanvraag binnengekomen.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td><b>Bestelnummer</b></td><td>${safe(orderNo)}</td></tr>
            <tr><td><b>Product</b></td><td>${safe(order.quantity || 1)}× ${safe(order.productName || 'Snazzle')}</td></tr>
            <tr><td><b>Producttotaal</b></td><td>${safe(total)}</td></tr>
            <tr><td><b>Keuze</b></td><td>${safe(fulfillment)}</td></tr>
            <tr><td><b>Naam</b></td><td>${safe(order.contactName || '-')}</td></tr>
            <tr><td><b>E-mail</b></td><td>${safe(order.email || '-')}</td></tr>
            <tr><td><b>Telefoon</b></td><td>${safe(order.phone || '-')}</td></tr>
            <tr><td><b>Adres / afhalen</b></td><td>${safe(addressText(order))}</td></tr>
          </table>
          <p style="margin-top:20px">Open <b>Snazzle Beheer → Shop → Bestelaanvragen</b> om deze bestelling af te handelen.</p>
        </div>`;

      await transporter.sendMail({
        from: `Snazzle Creations <${smtpUser}>`,
        to: ownerEmails.join(','),
        replyTo: order.email || smtpUser,
        subject: ownerSubject,
        text: ownerText,
        html: ownerHtml
      });

      await orderRef.update({
        ownerMailSentAt: FieldValue.serverTimestamp(),
        ownerMailRecipients: ownerEmails
      });
    }

    const refreshed = (await orderRef.get()).data() || {};
    if (!refreshed.customerMailSentAt && order.email) {
      const customerSubject = `Snazzle bestelaanvraag ontvangen – ${orderNo}`;
      const customerText = [
        `Hallo ${order.contactName || ''},`,
        '',
        'We hebben je Snazzle-bestelaanvraag goed ontvangen.',
        '',
        `Bestelnummer: ${orderNo}`,
        `Product: ${order.quantity || 1}x ${order.productName || 'Snazzle'}`,
        `Producttotaal: ${total}`,
        `Keuze: ${fulfillment}`,
        '',
        'Er is nog niets betaald.',
        'Snazzle stuurt je apart informatie over de betaling en over verzending of het afhaalmoment.',
        '',
        'Groetjes,',
        'Snazzle Creations'
      ].join('\n');

      const customerHtml = `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#2d2116">
          <h2 style="color:#176b3a">🎉 We hebben je Snazzle-aanvraag ontvangen!</h2>
          <p>Hallo ${safe(order.contactName || '')},</p>
          <p>Je bestelaanvraag is goed bij ons binnengekomen.</p>
          <p><b>Bestelnummer:</b> ${safe(orderNo)}<br>
             <b>Product:</b> ${safe(order.quantity || 1)}× ${safe(order.productName || 'Snazzle')}<br>
             <b>Producttotaal:</b> ${safe(total)}<br>
             <b>Keuze:</b> ${safe(fulfillment)}</p>
          <div style="padding:14px;border-radius:12px;background:#fff4c7">
            <b>Er is nog niets betaald.</b><br>
            Snazzle stuurt je apart informatie over de betaling en over verzending of het afhaalmoment.
          </div>
          <p>Groetjes,<br><b>Snazzle Creations</b></p>
        </div>`;

      await transporter.sendMail({
        from: `Snazzle Creations <${smtpUser}>`,
        to: order.email,
        replyTo: smtpUser,
        subject: customerSubject,
        text: customerText,
        html: customerHtml
      });

      await orderRef.update({
        customerMailSentAt: FieldValue.serverTimestamp(),
        mailNotificationStatus: 'sent',
        mailNotificationSentAt: FieldValue.serverTimestamp()
      });
    }
  }
);
