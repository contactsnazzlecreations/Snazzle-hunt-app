const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');

const MAX_MEETUPS_PER_REQUEST = 30;

function cleanMeetupIds(value) {
  if (!Array.isArray(value)) return [];
  const ids = [];
  for (const raw of value) {
    const id = String(raw || '').trim();
    if (!id || id.length > 160 || !/^[A-Za-z0-9_-]+$/.test(id)) continue;
    if (!ids.includes(id)) ids.push(id);
    if (ids.length >= MAX_MEETUPS_PER_REQUEST) break;
  }
  return ids;
}

const getMeetupCounts = onCall({ region: 'europe-west1' }, async request => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Log eerst in om Treffpunten te bekijken.');
  }

  const meetupIds = cleanMeetupIds(request.data?.meetupIds);
  if (!meetupIds.length) return { counts: {} };

  const db = getFirestore();
  const counts = {};

  await Promise.all(meetupIds.map(async meetupId => {
    const meetupSnap = await db.collection('snazzleMeetups').doc(meetupId).get();
    if (!meetupSnap.exists) return;

    const aggregate = await db.collection('snazzleMeetupJoins')
      .where('meetupId', '==', meetupId)
      .where('adultConfirmed', '==', true)
      .count()
      .get();

    counts[meetupId] = Number(aggregate.data().count || 0);
  }));

  return { counts };
});

module.exports = { getMeetupCounts };
