const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');

const REGION='europe-west1';
const PREFIX_TO_SERIES={W:'wild',S:'spark',M:'mystic',B:'blaze'};
const BASE_RE=/^S01-([WSMB])(0[1-9]|1[0-2])$/;

const getCardProgressState=onCall({region:REGION},async request=>{
  const uid=request.auth?.uid;
  if(!uid)throw new HttpsError('unauthenticated','Log eerst in om je kaartcollectie te bekijken.');
  const db=getFirestore();
  const [unlockSnap,rewardSnap]=await Promise.all([
    db.collection('userCardUnlocks').where('userId','==',uid).get(),
    db.collection('userCardRewards').where('userId','==',uid).get()
  ]);
  const unlockedCards=[];
  const counts={wild:0,spark:0,mystic:0,blaze:0,total:0};
  unlockSnap.forEach(docSnap=>{
    const data=docSnap.data()||{};
    const number=String(data.cardNumber||'').toUpperCase();
    const match=BASE_RE.exec(number);
    if(!match)return;
    unlockedCards.push(number);
    const seriesKey=PREFIX_TO_SERIES[match[1]];
    counts[seriesKey]++;
    counts.total++;
  });
  unlockedCards.sort();
  const rewardIds=[];
  rewardSnap.forEach(docSnap=>{
    const data=docSnap.data()||{};
    rewardIds.push(String(data.rewardId||docSnap.id));
  });
  rewardIds.sort();
  return {
    ok:true,
    structureVersion:'1.0.0',
    baseCollectionSize:48,
    unlockedCards,
    rewardIds,
    counts
  };
});

module.exports={getCardProgressState};
