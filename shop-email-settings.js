import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth = getAuth();
const db = getFirestore();
let currentUser = null;
let settingsLoadedFor = '';

function toast(message){
  const t=document.querySelector('#toast');
  if(!t){ alert(message); return; }
  t.textContent=message;
  t.classList.add('show');
  clearTimeout(window.__shopEmailToast);
  window.__shopEmailToast=setTimeout(()=>t.classList.remove('show'),2800);
}

function validEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());
}

function ensureStyles(){
  if(document.querySelector('#shopEmailSettingsStyles')) return;
  const style=document.createElement('style');
  style.id='shopEmailSettingsStyles';
  style.textContent=`
    .shop-email-info{margin:13px 0;padding:13px 14px;border-radius:15px;background:linear-gradient(135deg,#e8f6ff,#d7efff);border:2px solid #78aeca;color:#23445a;font-size:12px;font-weight:800;line-height:1.45}
    .shop-email-info strong{display:block;font-size:13px;margin-bottom:3px;color:#18394e}
    .shop-email-settings-help{margin:0 0 10px;color:#6b4b2a;font-size:11px;font-weight:750;line-height:1.45}
    .shop-email-settings-status{margin-top:9px;padding:9px 10px;border-radius:11px;background:#f3e5c5;color:#5c4329;font-size:11px;font-weight:800;line-height:1.4}
  `;
  document.head.appendChild(style);
}

function ensureCheckoutInfo(){
  const checkout=document.querySelector('#shopCheckout');
  if(!checkout || !checkout.innerHTML || document.querySelector('#shopEmailInfo')) return;
  const info=document.createElement('div');
  info.id='shopEmailInfo';
  info.className='shop-email-info';
  info.innerHTML='<strong>📧 Wat gebeurt er na je aanvraag?</strong>Na het versturen ontvang je van Snazzle een e-mail met informatie over de betaling en over de levering of het afhaalmoment. Er wordt nu nog niets online betaald.';
  const firstCheck=checkout.querySelector('.shop-check');
  if(firstCheck) checkout.insertBefore(info,firstCheck);
  else checkout.appendChild(info);
}

async function loadSettings(user){
  if(!user || settingsLoadedFor===user.uid) return;
  const box=document.querySelector('#shopEmailSettings');
  if(!box) return;
  try{
    const snap=await getDoc(doc(db,'adminUsers',user.uid));
    const data=snap.exists()?snap.data():{};
    if(data.role!=='superadmin' || data.active!==true){
      box.style.display='none';
      return;
    }
    box.style.display='block';
    const emails=Array.isArray(data.shopNotificationEmails)?data.shopNotificationEmails:[];
    const e1=document.querySelector('#shopNotifyEmail1');
    const e2=document.querySelector('#shopNotifyEmail2');
    if(e1) e1.value=emails[0]||'';
    if(e2) e2.value=emails[1]||'';
    settingsLoadedFor=user.uid;
  }catch(err){
    console.error('shop notification settings',err);
  }
}

function ensureAdminSettings(){
  ensureStyles();
  const wrap=document.querySelector('#shopAdmin .shop-admin-wrap');
  if(!wrap || document.querySelector('#shopEmailSettings')) return;

  const box=document.createElement('div');
  box.className='shop-admin-box';
  box.id='shopEmailSettings';
  box.innerHTML=`
    <h3>📧 E-mailmeldingen</h3>
    <p class="shop-email-settings-help">Vul hier maximaal twee e-mailadressen in die straks een melding moeten krijgen zodra iemand een Snazzle reserveert. De adressen worden in het afgeschermde beheerdersdocument in Firebase opgeslagen en niet in de openbare app-code.</p>
    <div class="shop-admin-grid">
      <label class="wide">E-mailadres 1<input id="shopNotifyEmail1" type="email" autocomplete="email" placeholder="jouw@email.nl"></label>
      <label class="wide">E-mailadres 2<input id="shopNotifyEmail2" type="email" autocomplete="email" placeholder="tweede@email.nl"></label>
    </div>
    <div class="shop-admin-actions"><button class="shop-admin-save" id="shopSaveNotifyEmails" type="button">E-mailadressen opslaan</button></div>
    <div class="shop-email-settings-status">🔧 Voorbereiding: de adressen worden nu veilig opgeslagen. In de volgende stap koppelen we hier de automatische maildienst aan, zodat jullie allebei direct een nieuwe-bestelling-mail ontvangen.</div>`;

  const orderBox=[...wrap.children].find(el=>el.querySelector && el.querySelector('#shopAdminOrders'));
  if(orderBox) wrap.insertBefore(box,orderBox);
  else wrap.appendChild(box);

  document.querySelector('#shopSaveNotifyEmails')?.addEventListener('click',async()=>{
    if(!currentUser) return toast('Log eerst in als hoofdbeheerder');
    const v1=document.querySelector('#shopNotifyEmail1')?.value.trim().toLowerCase()||'';
    const v2=document.querySelector('#shopNotifyEmail2')?.value.trim().toLowerCase()||'';
    const emails=[v1,v2].filter(Boolean);
    if(emails.some(e=>!validEmail(e))) return toast('Controleer de e-mailadressen');
    if(new Set(emails).size!==emails.length) return toast('Gebruik twee verschillende e-mailadressen');
    try{
      await updateDoc(doc(db,'adminUsers',currentUser.uid),{
        shopNotificationEmails:emails,
        shopNotificationEmailsUpdatedAt:new Date().toISOString()
      });
      toast('E-mailadressen opgeslagen ✅');
      settingsLoadedFor='';
      await loadSettings(currentUser);
    }catch(err){
      console.error('save notification emails',err);
      toast('E-mailadressen konden niet worden opgeslagen');
    }
  });

  loadSettings(currentUser);
}

function syncUI(){
  ensureStyles();
  ensureCheckoutInfo();
  ensureAdminSettings();
  if(currentUser) loadSettings(currentUser);
}

let scheduled=false;
const observer=new MutationObserver(()=>{
  if(scheduled) return;
  scheduled=true;
  requestAnimationFrame(()=>{ scheduled=false; syncUI(); });
});
observer.observe(document.documentElement,{childList:true,subtree:true});

onAuthStateChanged(auth,user=>{
  currentUser=user;
  settingsLoadedFor='';
  syncUI();
});

syncUI();
