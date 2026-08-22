import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
let currentUser=null;

function toast(message){
  const t=document.querySelector('#toast');
  if(!t){ alert(message); return; }
  t.textContent=message;
  t.classList.add('show');
  clearTimeout(window.__mailSetupToast);
  window.__mailSetupToast=setTimeout(()=>t.classList.remove('show'),3000);
}

function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim()); }

async function readConfig(){
  try{
    const snap=await getDoc(doc(db,'shopMailConfig','current'));
    return snap.exists()?snap.data():{};
  }catch{ return {}; }
}

function ensureUI(){
  const box=document.querySelector('#shopEmailSettings');
  if(!box || document.querySelector('#shopActivateAutomaticMail')) return;
  const status=box.querySelector('.shop-email-settings-status');
  if(status) status.innerHTML='📨 <strong>Automatische mail</strong><br>Na de eenmalige Firebase-mailkoppeling kun je hieronder de automatische bestelmail activeren.';
  const btn=document.createElement('button');
  btn.type='button';
  btn.id='shopActivateAutomaticMail';
  btn.className='shop-admin-save';
  btn.style.cssText='width:100%;margin-top:10px;padding:12px;border:0;border-radius:12px;font-weight:950';
  btn.textContent='Automatische bestelmail activeren';
  btn.addEventListener('click',activateMail);
  box.appendChild(btn);
  refreshStatus();
}

async function refreshStatus(){
  const btn=document.querySelector('#shopActivateAutomaticMail');
  const status=document.querySelector('#shopEmailSettings .shop-email-settings-status');
  if(!btn || !status) return;
  const config=await readConfig();
  if(config.active===true){
    btn.textContent='✅ Automatische bestelmail actief';
    status.innerHTML='✅ <strong>Mailwachtrij actief.</strong><br>Nieuwe bestellingen worden klaargezet voor een mail naar jullie én een ontvangstbevestiging naar de klant.';
  }
}

async function activateMail(){
  if(!currentUser || currentUser.isAnonymous) return toast('Log eerst in als hoofdbeheerder');
  const button=document.querySelector('#shopActivateAutomaticMail');
  if(button){button.disabled=true;button.textContent='Even instellen…';}
  try{
    const adminSnap=await getDoc(doc(db,'adminUsers',currentUser.uid));
    if(!adminSnap.exists()) throw new Error('Geen beheeraccount');
    const admin=adminSnap.data();
    if(admin.role!=='superadmin' || admin.active!==true) throw new Error('Geen hoofdbeheerder');
    const emails=(Array.isArray(admin.shopNotificationEmails)?admin.shopNotificationEmails:[]).map(x=>String(x||'').trim().toLowerCase()).filter(Boolean);
    if(!emails.length || emails.some(e=>!validEmail(e))) throw new Error('Sla eerst geldige e-mailadressen op');

    const recipientUids=[];
    await setDoc(doc(db,'mailUsers','snazzle-owner-1'),{email:emails[0],name:'Snazzle beheer 1',updatedAt:new Date().toISOString()},{merge:true});
    recipientUids.push('snazzle-owner-1');
    if(emails[1]){
      await setDoc(doc(db,'mailUsers','snazzle-owner-2'),{email:emails[1],name:'Snazzle beheer 2',updatedAt:new Date().toISOString()},{merge:true});
      recipientUids.push('snazzle-owner-2');
    }else{
      try{ await deleteDoc(doc(db,'mailUsers','snazzle-owner-2')); }catch{}
    }

    await setDoc(doc(db,'mailTemplates','shop-owner-order'),{
      subject:'🦆 Nieuwe Snazzle reservering – {{orderNo}}',
      text:'Nieuwe Snazzle reservering\n\nBestelnummer: {{orderNo}}\nProduct: {{quantity}}x {{productName}}\nProducttotaal: {{totalText}}\nKeuze: {{fulfillmentText}}\n\nKlant: {{contactName}}\nE-mail: {{email}}\nTelefoon: {{phone}}\n{{addressLine}}\n\nOpen Snazzle Beheer om de bestelling af te handelen.',
      html:'<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h2>🦆 Nieuwe Snazzle reservering</h2><p><b>Bestelnummer:</b> {{orderNo}}</p><p><b>Product:</b> {{quantity}}× {{productName}}<br><b>Producttotaal:</b> {{totalText}}<br><b>Keuze:</b> {{fulfillmentText}}</p><hr><p><b>Klant:</b> {{contactName}}<br><b>E-mail:</b> {{email}}<br><b>Telefoon:</b> {{phone}}<br>{{addressLine}}</p><p>Open <b>Snazzle Beheer → Shop → Bestelaanvragen</b> om deze aanvraag af te handelen.</p></div>',
      updatedAt:new Date().toISOString()
    },{merge:true});

    await setDoc(doc(db,'mailTemplates','shop-customer-confirmation'),{
      subject:'Snazzle aanvraag ontvangen – {{orderNo}}',
      text:'Hallo {{contactName}},\n\nWe hebben je Snazzle-bestelaanvraag ontvangen.\n\nBestelnummer: {{orderNo}}\nProduct: {{quantity}}x {{productName}}\nProducttotaal: {{totalText}}\nKeuze: {{fulfillmentText}}\n\nEr is nog niets online betaald. Snazzle stuurt je nog een e-mail met informatie over betaling en over levering of het afhaalmoment.\n\nGroetjes,\nSnazzle Creations',
      html:'<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h2>🎉 Je Snazzle-aanvraag is ontvangen!</h2><p>Hallo {{contactName}},</p><p>We hebben je bestelaanvraag goed ontvangen.</p><p><b>Bestelnummer:</b> {{orderNo}}<br><b>Product:</b> {{quantity}}× {{productName}}<br><b>Producttotaal:</b> {{totalText}}<br><b>Keuze:</b> {{fulfillmentText}}</p><p><b>Er is nog niets online betaald.</b> Snazzle stuurt je nog een e-mail met informatie over betaling en over levering of het afhaalmoment.</p><p>Groetjes,<br><b>Snazzle Creations</b></p></div>',
      updatedAt:new Date().toISOString()
    },{merge:true});

    await setDoc(doc(db,'shopMailConfig','current'),{
      active:true,
      recipientUids,
      updatedAt:new Date().toISOString()
    },{merge:true});

    toast('Automatische bestelmail staat klaar ✅');
    await refreshStatus();
  }catch(err){
    console.error('activate mail',err);
    toast(err?.message || 'Automatische mail kon nog niet worden geactiveerd');
  }finally{
    if(button) button.disabled=false;
  }
}

let scheduled=false;
const observer=new MutationObserver(()=>{
  if(scheduled) return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;ensureUI();});
});
observer.observe(document.documentElement,{childList:true,subtree:true});

onAuthStateChanged(auth,user=>{ currentUser=user; ensureUI(); });
ensureUI();
