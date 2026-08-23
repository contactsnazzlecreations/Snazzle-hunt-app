// Snazzle Hunt Code — geheime server-verificatie per Hunt + persoonlijke vondstfoto.
// De geheime code wordt nooit in publieke Hunt-data opgeslagen.
import { getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, getDocs, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js';

const VERSION='1.0.0';
const $=(s,r=document)=>r.querySelector(s);
const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
const functions=app?getFunctions(app,'europe-west1'):null;
const verifyCode=functions?httpsCallable(functions,'verifyHuntCode'):null;
const saveCode=functions?httpsCallable(functions,'saveHuntCode'):null;
const getCodeState=functions?httpsCallable(functions,'getHuntCodeState'):null;

let currentUser=null;
let hunts=[];
let editingHuntId=null;
let secretConfigured=false;
let secretLast2='';
let saveTimer=null;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(window.__huntCodeToast);window.__huntCodeToast=setTimeout(()=>t.classList.remove('show'),3000);}
function statusOf(h){
  if(h?.found===true)return'ended';
  if(h?.mode==='draft')return'draft';
  const now=Date.now(),start=h?.start?new Date(h.start).getTime():0,end=h?.end?new Date(h.end).getTime():Infinity;
  if(h?.mode==='live'&&!h?.start)return now>end?'ended':'live';
  if(now<start)return'planned';
  if(now>=start&&now<=end)return'live';
  return'ended';
}
function activeHunt(){
  const village=localStorage.getItem('snazzleVillage')||'Montfort';
  return hunts.filter(h=>h.village===village&&statusOf(h)==='live').sort((a,b)=>new Date(b.start||0)-new Date(a.start||0))[0]||null;
}
function cleanCode(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,16);}
function displayCode(v){const x=cleanCode(v);return x.length>3?x.match(/.{1,3}/g).join('-'):x;}
function generateCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes=new Uint32Array(6);crypto.getRandomValues(bytes);
  return Array.from(bytes,n=>chars[n%chars.length]).join('');
}

function injectStyles(){if($('#huntCodeStyles'))return;const s=document.createElement('style');s.id='huntCodeStyles';s.textContent=`
  .hunt-secret-box{margin:14px 0;padding:13px;border-radius:17px;background:linear-gradient(145deg,#202d28,#163c31);border:2px solid #c7a45f;color:#fff6dc;box-shadow:0 4px 0 #554126}.hunt-secret-box label{display:block;font-size:12px;font-weight:1000;color:#ffe27d;margin-bottom:6px}.hunt-secret-row{display:grid;grid-template-columns:1fr auto;gap:7px}.hunt-secret-row input{min-width:0;border:2px solid #b9955e;border-radius:12px;padding:11px;background:#fffaf0;color:#2d2117;font-weight:900;letter-spacing:1.3px;text-transform:uppercase}.hunt-secret-row button{border:0;border-radius:12px;padding:9px 12px;background:linear-gradient(#ffe26d,#eaa431);color:#412b12;font-weight:1000;box-shadow:0 3px 0 #875519}.hunt-secret-help{display:block;font-size:10px;line-height:1.4;color:#dfead7;font-weight:750;margin-top:7px}.hunt-secret-status{margin-top:8px;font-size:10px;font-weight:950;color:#bfe895}.hunt-secret-status.warn{color:#ffd092}
  .hunt-target-mini{margin:11px 0 3px;padding:9px 10px;border-radius:15px;background:linear-gradient(135deg,rgba(255,235,159,.13),rgba(126,219,172,.10));border:1px solid rgba(255,225,144,.4);display:grid;grid-template-columns:52px 1fr;gap:9px;align-items:center}.hunt-target-mini img{width:52px;height:52px;border-radius:13px;object-fit:cover;border:2px solid #e5c06a;background:#24523c}.hunt-target-mini b{display:block;color:#ffe27b;font-size:10px;text-transform:uppercase;letter-spacing:.7px}.hunt-target-mini strong{display:block;color:#fff8df;font-size:14px;margin-top:2px}.hunt-target-mini small{display:block;color:#d9eed4;font-size:10px;font-weight:750;margin-top:2px}
  #huntCodeModal{position:fixed;inset:0;z-index:7600;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,17,12,.9);backdrop-filter:blur(8px)}#huntCodeModal.show{display:flex}.hunt-code-dialog{width:min(94vw,430px);padding:18px;border-radius:25px;background:radial-gradient(circle at 80% 0,rgba(255,230,124,.3),transparent 28%),linear-gradient(180deg,#fff2bd,#e9c77e);border:4px solid #88602e;color:#332318;box-shadow:0 20px 55px rgba(0,0,0,.5);position:relative}.hunt-code-close{position:absolute;right:12px;top:12px;width:42px;height:42px;border:0;border-radius:13px;background:#70472b;color:#fff;font-size:23px;font-weight:900}.hunt-code-kicker{font-size:10px;font-weight:1000;letter-spacing:1.2px;color:#4d7c31}.hunt-code-dialog h2{margin:4px 50px 5px 0;font-size:24px}.hunt-code-dialog p{font-size:12px;font-weight:760;line-height:1.45;color:#654a2c}.hunt-code-target{display:grid;grid-template-columns:70px 1fr;gap:10px;align-items:center;padding:10px;border-radius:17px;background:#fff8e5;border:2px solid #c29d62;margin:12px 0}.hunt-code-target img{width:70px;height:70px;border-radius:13px;object-fit:cover;background:#28513c}.hunt-code-target strong{display:block;font-size:16px}.hunt-code-target small{display:block;margin-top:3px;color:#765837;font-size:10px;font-weight:800}.hunt-code-input{width:100%;border:3px solid #b78d4c;border-radius:15px;padding:14px;text-align:center;background:#fffdf5;color:#2d2117;font-size:23px;font-weight:1000;letter-spacing:3px;text-transform:uppercase}.hunt-code-submit{width:100%;margin-top:10px;border:0;border-radius:15px;padding:14px;background:linear-gradient(#71c34b,#3d9145);color:#fff;font-weight:1000;box-shadow:0 4px 0 #286836}.hunt-code-submit:disabled{opacity:.55;box-shadow:none}.hunt-code-msg{min-height:20px;margin-top:9px;text-align:center;font-size:11px;font-weight:900}.hunt-code-success{text-align:center;padding:12px 5px}.hunt-code-success .big{font-size:66px}.hunt-code-success h2{margin:5px 0;color:#2f642d}.hunt-code-success p{font-size:13px;color:#5b4228}
`;document.head.appendChild(s);}

function ensureAdminField(){
  const editor=$('#huntEditor'),save=$('#saveHuntBtn');if(!editor||!save||$('#huntSecretWrap'))return;
  const box=document.createElement('div');box.id='huntSecretWrap';box.className='hunt-secret-box';box.innerHTML=`<label>🔐 Geheime vindcode voor deze Hunt</label><div class="hunt-secret-row"><input id="huntSecretCode" maxlength="24" inputmode="text" autocomplete="off" placeholder="Bijv. J7K-4P9"><button id="huntSecretGenerate" type="button">🎲 Code</button></div><small class="hunt-secret-help">Deze code staat alleen op/in de echte Snazzle. Spelers kunnen de ingestelde code nergens in de app bekijken. Vul bij een bestaande Hunt alleen iets in als je de code wilt vervangen.</small><div class="hunt-secret-status" id="huntSecretStatus">Nog geen code ingesteld</div>`;
  save.insertAdjacentElement('beforebegin',box);
  $('#huntSecretGenerate').onclick=()=>{const c=generateCode();$('#huntSecretCode').value=displayCode(c);$('#huntSecretCode').focus();updateSecretStatus('Nieuwe code klaar. Schrijf hem op de fysieke Snazzle.',false);};
  $('#huntSecretCode').addEventListener('input',e=>{e.target.value=displayCode(e.target.value);});
}
function updateSecretStatus(text,warn=false){const el=$('#huntSecretStatus');if(!el)return;el.textContent=text;el.classList.toggle('warn',warn);}
async function loadSecretState(id){
  ensureAdminField();secretConfigured=false;secretLast2='';const input=$('#huntSecretCode');if(input)input.value='';
  if(!id||!getCodeState){updateSecretStatus('Nieuwe Hunt: stel een geheime code in.',true);return;}
  updateSecretStatus('Beveiligde code wordt gecontroleerd…');
  try{const r=await getCodeState({huntId:id});secretConfigured=!!r.data?.configured;secretLast2=r.data?.last2||'';updateSecretStatus(secretConfigured?`Code is ingesteld${secretLast2?' · eindigt op '+secretLast2:''}. Vul alleen een nieuwe code in om hem te vervangen.`:'Nog geen geheime code ingesteld',!secretConfigured);}catch(e){console.warn('hunt code state',e);updateSecretStatus('Code-status kan pas worden gelezen zodra de beveiligde Firebase-functie online staat.',true);}
}
async function persistCodeForHunt(huntId,raw){
  const code=cleanCode(raw);if(!huntId||!code)return;
  if(code.length<6){toast('Vindcode moet minimaal 6 tekens hebben');return;}
  try{await saveCode({huntId,code});secretConfigured=true;secretLast2=code.slice(-2);const input=$('#huntSecretCode');if(input)input.value='';updateSecretStatus(`Code veilig opgeslagen · eindigt op ${secretLast2}`);toast('Geheime vindcode veilig opgeslagen 🔐');}catch(e){console.error('save hunt code',e);toast('Vindcode kon nog niet centraal worden opgeslagen');updateSecretStatus('Beveiligde codefunctie is nog niet online.',true);}
}
async function findNewHuntId(beforeIds,fingerprint){
  for(let attempt=0;attempt<7;attempt++){
    await new Promise(r=>setTimeout(r,450+attempt*180));
    try{const snap=await getDocs(collection(db,'hunts'));const docs=snap.docs.map(d=>({id:d.id,...d.data()}));const fresh=docs.filter(h=>!beforeIds.has(h.id));if(fresh.length===1)return fresh[0].id;const match=fresh.find(h=>String(h.title||'')===fingerprint.title&&String(h.village||'')===fingerprint.village&&String(h.start||'')===fingerprint.start);if(match)return match.id;}catch(e){console.warn('find new hunt',e);}
  }
  return null;
}
function prepareCodeSave(){
  ensureAdminField();const raw=$('#huntSecretCode')?.value||'';const code=cleanCode(raw);if(!code)return;
  if(code.length<6){toast('Vindcode moet minimaal 6 tekens hebben');return;}
  const targetId=editingHuntId;const beforeIds=new Set(hunts.map(h=>h.id));const fingerprint={title:$('#huntTitleEdit')?.value.trim()||'Nieuwe Snazzle Hunt',village:$('#huntVillageEdit')?.value||'',start:$('#huntStartEdit')?.value||''};
  clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{const id=targetId||await findNewHuntId(beforeIds,fingerprint);if(id)await persistCodeForHunt(id,code);else{toast('Hunt is opgeslagen, maar de code kon nog niet worden gekoppeld');updateSecretStatus('Open deze Hunt opnieuw en vul de code nogmaals in.',true);}},650);
}

function ensureModal(){if($('#huntCodeModal'))return;const m=document.createElement('div');m.id='huntCodeModal';m.innerHTML=`<div class="hunt-code-dialog" role="dialog" aria-modal="true"><button class="hunt-code-close" id="huntCodeClose" type="button">×</button><div id="huntCodeBody"></div></div>`;document.body.appendChild(m);$('#huntCodeClose').onclick=closeModal;m.addEventListener('click',e=>{if(e.target===m)closeModal();});}
function closeModal(){$('#huntCodeModal')?.classList.remove('show');}
function renderTarget(h){
  const body=$('#huntCodeBody');if(!body)return;
  body.innerHTML=`<div class="hunt-code-kicker">SNAZZLE GEVONDEN?</div><h2>Bewijs het met de geheime code 🔐</h2><p>Maak eerst je vondstfoto. Vul daarna de code in die op of in de echte Snazzle staat. Alleen een juiste code sluit de Hunt af.</p><div class="hunt-code-target">${h.imageUrl?`<img src="${h.imageUrl}" alt="${esc(h.title)}">`:'<div style="width:70px;height:70px;border-radius:13px;background:#28513c;display:grid;place-items:center;font-size:35px">🦆</div>'}<div><strong>${esc(h.title||'Snazzle')}</strong><small>📍 ${esc(h.village||'')}</small></div></div><input id="huntFinderCode" class="hunt-code-input" maxlength="24" autocomplete="off" placeholder="XXX-XXX"><button id="huntCodeSubmit" class="hunt-code-submit" type="button">Code controleren & Hunt claimen 🏆</button><div id="huntCodeMsg" class="hunt-code-msg"></div>`;
  const input=$('#huntFinderCode');input.addEventListener('input',e=>e.target.value=displayCode(e.target.value));input.addEventListener('keydown',e=>{if(e.key==='Enter')submitFinderCode(h)});$('#huntCodeSubmit').onclick=()=>submitFinderCode(h);setTimeout(()=>input.focus(),80);
}
function openFinderCode(){
  const h=activeHunt();if(!h)return toast('Deze Hunt is niet meer actief');
  const img=$('#proofImg');const photo=img?.getAttribute('src')||'';if(!photo.startsWith('data:image/'))return toast('Maak eerst een vondstfoto 📸');
  ensureModal();renderTarget(h);$('#huntCodeModal').classList.add('show');
}
async function submitFinderCode(h){
  const code=cleanCode($('#huntFinderCode')?.value||''),btn=$('#huntCodeSubmit'),msg=$('#huntCodeMsg');
  if(code.length<6){msg.textContent='Vul de volledige code van de Snazzle in.';return;}
  if(!verifyCode||!currentUser){msg.textContent='De beveiligde controle is nog niet beschikbaar.';return;}
  const photo=$('#proofImg')?.getAttribute('src')||'';if(!photo.startsWith('data:image/')){msg.textContent='Je vondstfoto ontbreekt.';return;}
  btn.disabled=true;msg.textContent='🔐 Code veilig controleren…';
  try{
    const r=await verifyCode({huntId:h.id,code,photoData:photo,nickname:(localStorage.getItem('snazzleName')||'Snazzle-speler').trim().slice(0,20)});
    if(!r.data?.ok)throw new Error('Geen geldige bevestiging');
    const body=$('#huntCodeBody');body.innerHTML=`<div class="hunt-code-success"><div class="big">🏆✨</div><h2>${esc(r.data.title||h.title)} gevonden!</h2><p>De code klopt. De Hunt is nu voor alle andere zoekers afgesloten, jouw foto is opgeslagen en je digitale beloning kan worden ontgrendeld.</p></div>`;
    setTimeout(()=>location.reload(),2200);
  }catch(e){console.warn('verify hunt code',e);btn.disabled=false;const codeName=String(e?.code||'');if(codeName.includes('permission-denied'))msg.textContent='❌ Deze code klopt niet. Kijk nog eens goed op de Snazzle.';else if(codeName.includes('failed-precondition'))msg.textContent='🏆 Deze Snazzle is inmiddels al door iemand anders gevonden.';else if(codeName.includes('not-found'))msg.textContent='Deze Hunt of code is niet meer beschikbaar.';else msg.textContent='Controle lukte niet. Probeer de code nogmaals.';}
}
function replaceFoundHandler(){const b=$('#foundBtn');if(!b||b.dataset.codeVerification==='1')return;b.dataset.codeVerification='1';b.onclick=openFinderCode;}
function renderHuntTarget(){
  const h=activeHunt(),body=$('.huntbody');if(!body)return;let el=$('#huntTargetMini');if(!h){el?.remove();return;}if(!el){el=document.createElement('div');el.id='huntTargetMini';el.className='hunt-target-mini';const desc=$('#huntDescription');desc?.insertAdjacentElement('afterend',el);}el.innerHTML=`${h.imageUrl?`<img src="${h.imageUrl}" alt="${esc(h.title)}">`:'<div style="width:52px;height:52px;border-radius:13px;background:#24523c;display:grid;place-items:center;font-size:27px">🦆</div>'}<div><b>Deze Snazzle zoek je</b><strong>${esc(h.title||'Snazzle')}</strong><small>Vind hem, maak een foto en voer de geheime code in.</small></div>`;
}

function bindAdminTracking(){
  document.addEventListener('click',e=>{
    const edit=e.target.closest?.('[data-edit-hunt]');if(edit){editingHuntId=edit.dataset.editHunt;setTimeout(()=>loadSecretState(editingHuntId),70);return;}
    if(e.target.closest?.('#newHuntBtn')){editingHuntId=null;setTimeout(()=>loadSecretState(null),70);return;}
    if(e.target.closest?.('#saveHuntBtn')){prepareCodeSave();return;}
    if(e.target.closest?.('#cancelHuntEditor')){editingHuntId=null;}
  },true);
}
function init(){
  if(window.__snazzleHuntCodeLoaded)return;window.__snazzleHuntCodeLoaded=true;injectStyles();ensureAdminField();ensureModal();bindAdminTracking();replaceFoundHandler();
  if(auth)onAuthStateChanged(auth,u=>{currentUser=u;replaceFoundHandler();});
  if(db)onSnapshot(collection(db,'hunts'),snap=>{hunts=snap.docs.map(d=>({id:d.id,...d.data()}));renderHuntTarget();replaceFoundHandler();},e=>console.warn('hunt code hunts',e));
  const obs=new MutationObserver(()=>{ensureAdminField();replaceFoundHandler();renderHuntTarget();});obs.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
console.info(`Snazzle Hunt Code ${VERSION} geladen`);
