'use strict';

// Extra toegangswacht voor organisatiecodes.
// Deze export staat NA org-hunts in bootstrap en vervangt uitsluitend redeemOrgAccessCode.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const crypto = require('crypto');

const REGION='europe-west1';
const CODE_LENGTH=10;
const MAX_ATTEMPTS=8;
const WINDOW_MS=10*60*1000;
const ALPHABET_RE=/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/;

function normalizeCode(value){
  return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,16);
}
function safeId(value){return String(value||'').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,220);}
function hash(code,saltHex){return crypto.scryptSync(code,Buffer.from(saltHex,'hex'),32).toString('hex');}
function safeEqualHex(a,b){
  try{
    const left=Buffer.from(String(a||''),'hex'),right=Buffer.from(String(b||''),'hex');
    return left.length>0&&left.length===right.length&&crypto.timingSafeEqual(left,right);
  }catch{return false;}
}
function validSecret(code,secret){
  return secret?.active===true&&!!secret.salt&&!!secret.codeHash&&safeEqualHex(hash(code,secret.salt),secret.codeHash);
}
function millis(value){
  if(!value)return 0;
  if(typeof value?.toMillis==='function')return value.toMillis();
  const n=new Date(value).getTime();return Number.isFinite(n)?n:0;
}
function accessOpen(hunt){
  if(!hunt||hunt.active!==true)return false;
  const now=Date.now(),start=millis(hunt.accessStartsAt),end=millis(hunt.accessEndsAt);
  return !!start&&!!end&&now>=start&&now<=end;
}
function adminHunt(id,h){
  return {
    id,
    organization:String(h.organization||'').slice(0,70),
    title:String(h.title||'').slice(0,70),
    village:String(h.village||'').slice(0,60),
    description:String(h.description||'').slice(0,400),
    accessStartsAt:String(h.accessStartsAt||'').slice(0,40),
    accessEndsAt:String(h.accessEndsAt||'').slice(0,40),
    publicStartsAt:String(h.publicStartsAt||'').slice(0,40),
    publicEndsAt:String(h.publicEndsAt||'').slice(0,40),
    active:h.active===true,
    pointCount:Number(h.pointCount||0)
  };
}
async function registerAttempt(db,uid){
  const ref=db.collection('snazzleOrgAccessAttempts').doc(safeId(`global_${uid}`));
  const now=Date.now();
  await db.runTransaction(async tx=>{
    const snap=await tx.get(ref),d=snap.exists?(snap.data()||{}):{};
    const start=Number(d.windowStartedAt||0),same=start>0&&now-start<WINDOW_MS;
    const attempts=same?Number(d.attempts||0):0;
    if(attempts>=MAX_ATTEMPTS)throw new HttpsError('resource-exhausted','Te veel codepogingen. Probeer het over enkele minuten opnieuw.');
    tx.set(ref,{userId:uid,attempts:attempts+1,windowStartedAt:same?start:now,updatedAt:FieldValue.serverTimestamp()},{merge:true});
  });
  return ref;
}

const redeemOrgAccessCode=onCall({region:REGION},async request=>{
  const uid=request.auth?.uid;
  if(!uid)throw new HttpsError('unauthenticated','Log eerst in bij Snazzle.');
  const code=normalizeCode(request.data?.code);
  if(code.length!==CODE_LENGTH||!ALPHABET_RE.test(code))throw new HttpsError('invalid-argument','Vul de volledige organisatiecode in.');

  const db=getFirestore();
  // Beperk pogingen voordat we prijsgeven of een locator/code bestaat.
  const attemptRef=await registerAttempt(db,uid);
  const locator=code.slice(0,3);
  const query=await db.collection('snazzleOrgSecrets').where('locator','==',locator).get();
  let match=null;
  for(const snap of query.docs){
    const secret=snap.data()||{};
    if(validSecret(code,secret)){match={huntId:snap.id,ref:snap.ref,secret};break;}
  }
  if(!match)throw new HttpsError('permission-denied','De organisatiecode klopt niet.');

  const huntRef=db.collection('snazzleOrgHunts').doc(match.huntId);
  const huntSnap=await huntRef.get();
  if(!huntSnap.exists)throw new HttpsError('not-found','Deze Special Hunt bestaat niet meer.');
  const hunt=huntSnap.data()||{};
  if(!accessOpen(hunt))throw new HttpsError('failed-precondition','Deze organisatiecode is nu niet actief.');
  if(match.secret.claimedBy&&match.secret.claimedBy!==uid){
    throw new HttpsError('permission-denied','Deze organisatiecode is al gekoppeld aan een ander Snazzle-account.');
  }

  const sessionId=safeId(`${match.huntId}_${uid}`);
  const expiresAt=Timestamp.fromDate(new Date(hunt.accessEndsAt));
  await db.runTransaction(async tx=>{
    tx.set(db.collection('snazzleOrgSessions').doc(sessionId),{
      huntId:match.huntId,userId:uid,active:true,
      createdAt:FieldValue.serverTimestamp(),expiresAt
    },{merge:true});
    tx.set(match.ref,{
      claimedBy:uid,
      claimedAt:match.secret.claimedAt||FieldValue.serverTimestamp()
    },{merge:true});
  });

  await attemptRef.delete().catch(()=>{});
  return {ok:true,hunt:adminHunt(match.huntId,hunt),expiresAt:hunt.accessEndsAt};
});

module.exports={redeemOrgAccessCode};
