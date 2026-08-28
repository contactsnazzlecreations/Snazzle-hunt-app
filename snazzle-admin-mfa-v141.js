// Snazzle v141 — server-side afgedwongen 2-stapsverificatie voor Beheer.
import { getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInAnonymously,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js';

const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
const fn=app?getFunctions(app,'europe-west1'):null;
const requestCode=fn?httpsCallable(fn,'requestAdminLoginCode'):null;
const verifyCode=fn?httpsCallable(fn,'verifyAdminLoginCode'):null;
const $=s=>document.querySelector(s);
let maskedEmail='';
let busy=false;

function toast(message){
  const el=$('#toast');
  if(!el){console.info(message);return;}
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__snazzleMfaToast);
  window.__snazzleMfaToast=setTimeout(()=>el.classList.remove('show'),3000);
}

function styles(){
  if($('#snazzleMfaStyles'))return;
  const s=document.createElement('style');
  s.id='snazzleMfaStyles';
  s.textContent=`
    #snazzleMfaOverlay{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,17,12,.91);backdrop-filter:blur(7px)}
    #snazzleMfaOverlay.show{display:flex}
    .sn-mfa-card{width:min(94vw,430px);padding:20px;border-radius:26px;background:linear-gradient(180deg,#fff2bd,#e9c77e);border:4px solid #88602e;color:#332318;box-shadow:0 20px 55px rgba(0,0,0,.5);position:relative;text-align:center}
    .sn-mfa-lock{font-size:54px;line-height:1}.sn-mfa-card h2{margin:8px 0 6px;font-size:24px}.sn-mfa-card p{font-size:12px;font-weight:760;line-height:1.5;color:#62492e}
    .sn-mfa-code{width:100%;margin-top:8px;border:3px solid #b78d4c;border-radius:15px;padding:14px;text-align:center;background:#fffdf5;color:#2d2117;font-size:28px;font-weight:1000;letter-spacing:8px}
    .sn-mfa-submit{width:100%;margin-top:10px;border:0;border-radius:15px;padding:14px;background:linear-gradient(#71c34b,#3d9145);color:#fff;font-weight:1000;box-shadow:0 4px 0 #286836}
    .sn-mfa-submit:disabled{opacity:.55;box-shadow:none}.sn-mfa-secondary{width:100%;margin-top:8px;border:0;border-radius:13px;padding:11px;background:#79583e;color:#fff;font-weight:900}.sn-mfa-message{min-height:20px;margin-top:10px;font-size:11px;font-weight:900}.sn-mfa-email{font-weight:1000;color:#285f37}
  `;
  document.head.appendChild(s);
}

function ensureOverlay(){
  if($('#snazzleMfaOverlay'))return;
  const o=document.createElement('div');
  o.id='snazzleMfaOverlay';
  o.innerHTML=`<div class="sn-mfa-card" role="dialog" aria-modal="true" aria-labelledby="snMfaTitle"><div class="sn-mfa-lock">🔐</div><h2 id="snMfaTitle">Extra beveiligingscode</h2><p>We hebben een eenmalige 6-cijferige code gestuurd naar <span class="sn-mfa-email" id="snMfaEmail">je beheerdersmail</span>.</p><input id="snMfaCode" class="sn-mfa-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"><button id="snMfaVerify" type="button" class="sn-mfa-submit">Beheer veilig openen</button><button id="snMfaResend" type="button" class="sn-mfa-secondary">Nieuwe code sturen</button><button id="snMfaCancel" type="button" class="sn-mfa-secondary">Annuleren</button><div id="snMfaMessage" class="sn-mfa-message"></div></div>`;
  document.body.appendChild(o);
  $('#snMfaCode').addEventListener('input',e=>e.target.value=String(e.target.value||'').replace(/\D/g,'').slice(0,6));
  $('#snMfaCode').addEventListener('keydown',e=>{if(e.key==='Enter')completeMfa();});
  $('#snMfaVerify').onclick=completeMfa;
  $('#snMfaResend').onclick=resendCode;
  $('#snMfaCancel').onclick=cancelMfa;
}

function showOverlay(){
  ensureOverlay();
  $('#snMfaEmail').textContent=maskedEmail||'je beheerdersmail';
  $('#snMfaCode').value='';
  $('#snMfaMessage').textContent='';
  $('#snazzleMfaOverlay').classList.add('show');
  document.documentElement.dataset.snazzleMfaPending='1';
  setTimeout(()=>$('#snMfaCode')?.focus(),80);
}

function hideOverlay(){
  $('#snazzleMfaOverlay')?.classList.remove('show');
  delete document.documentElement.dataset.snazzleMfaPending;
}

async function restoreAnonymous(){
  try{await signOut(auth);}catch{}
  try{await signInAnonymously(auth);}catch{}
}

async function checkAdmin(uid){
  if(!db||!uid)return null;
  const snap=await getDoc(doc(db,'adminUsers',uid));
  const data=snap.exists()?(snap.data()||{}):{};
  return data.active===true&&['superadmin','village_admin'].includes(data.role)?data:null;
}

async function loginWithMfa(){
  if(busy||!auth||!requestCode)return;
  const email=$('#adminEmail')?.value.trim()||'';
  const password=$('#adminPassword')?.value||'';
  if(!email||!password)return toast('Vul e-mail en wachtwoord in');
  busy=true;
  const btn=$('#adminLoginBtn');if(btn)btn.disabled=true;
  try{
    const credential=await signInWithEmailAndPassword(auth,email,password);
    const admin=await checkAdmin(credential.user.uid);
    if(!admin){await restoreAnonymous();throw new Error('geen-beheer');}
    const result=await requestCode({});
    maskedEmail=result.data?.maskedEmail||email;
    if($('#adminPassword'))$('#adminPassword').value='';
    $('#adminLogin')?.classList.remove('show');
    showOverlay();
    toast('Extra beveiligingscode verstuurd 🔐');
  }catch(e){
    console.warn('Snazzle MFA login',e);
    if(String(e?.code||'').includes('resource-exhausted')) toast('Er is net al een code verstuurd. Controleer je e-mail.');
    else if(String(e?.message||'').includes('geen-beheer')) toast('Dit account heeft geen beheerdersrechten');
    else toast('Inloggen mislukt. Controleer e-mail en wachtwoord.');
  }finally{
    busy=false;if(btn)btn.disabled=false;
  }
}

async function resendCode(){
  if(busy||!requestCode||!auth?.currentUser)return;
  busy=true;
  try{
    const result=await requestCode({});
    maskedEmail=result.data?.maskedEmail||maskedEmail;
    $('#snMfaEmail').textContent=maskedEmail||'je beheerdersmail';
    $('#snMfaMessage').textContent='Nieuwe code verstuurd.';
  }catch(e){
    $('#snMfaMessage').textContent=String(e?.code||'').includes('resource-exhausted')?'Er is net al een code verstuurd. Probeer het over een minuut opnieuw.':'Nieuwe code versturen lukte niet.';
  }finally{busy=false;}
}

async function waitForAdminRender(){
  for(let i=0;i<30;i++){
    const role=$('#adminRole')?.textContent||'';
    if(role&&role!=='Niet ingelogd')return true;
    await new Promise(r=>setTimeout(r,100));
  }
  return false;
}

async function completeMfa(){
  if(busy||!verifyCode||!auth?.currentUser)return;
  const code=String($('#snMfaCode')?.value||'').replace(/\D/g,'').slice(0,6);
  if(code.length!==6){$('#snMfaMessage').textContent='Vul alle 6 cijfers in.';return;}
  busy=true;
  const btn=$('#snMfaVerify');if(btn)btn.disabled=true;
  $('#snMfaMessage').textContent='🔐 Beveiliging controleren…';
  try{
    const result=await verifyCode({code});
    const customToken=result.data?.customToken;
    if(!customToken)throw new Error('Geen beveiligde beheertoken ontvangen');
    const credential=await signInWithCustomToken(auth,customToken);
    const tokenResult=await credential.user.getIdTokenResult(true);
    if(tokenResult.claims?.snazzle_admin_mfa!==true)throw new Error('MFA-claim ontbreekt');
    hideOverlay();
    await waitForAdminRender();
    $('#adminSheet')?.classList.add('show');
    toast('Beheer veilig geopend ✅');
  }catch(e){
    console.warn('Snazzle MFA verify',e);
    const c=String(e?.code||'');
    $('#snMfaMessage').textContent=c.includes('permission-denied')?'De code klopt niet.':c.includes('deadline-exceeded')?'Deze code is verlopen. Vraag een nieuwe aan.':c.includes('resource-exhausted')?'Te veel verkeerde pogingen. Vraag een nieuwe code aan.':'Controle lukte niet. Probeer opnieuw.';
  }finally{busy=false;if(btn)btn.disabled=false;}
}

async function cancelMfa(){
  hideOverlay();
  await restoreAnonymous();
  toast('Beheerlogin geannuleerd');
}

function bind(){
  styles();ensureOverlay();
  const btn=$('#adminLoginBtn');
  if(btn){btn.onclick=loginWithMfa;btn.dataset.snazzleMfa='1';}
  const input=$('#adminPassword');
  if(input&&!input.dataset.snazzleMfaEnter){
    input.dataset.snazzleMfaEnter='1';
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loginWithMfa();}});
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
console.info('Snazzle admin 2-stapsverificatie v141 geladen');
