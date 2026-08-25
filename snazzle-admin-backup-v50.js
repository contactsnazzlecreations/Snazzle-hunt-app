import { initializeApp, deleteApp, getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const mainApp = getApp();
const auth = getAuth(mainApp);
const db = getFirestore(mainApp);

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__backupAdminToast);
  window.__backupAdminToast=setTimeout(()=>el.classList.remove('show'),3600);
}

async function currentIsSuperAdmin(user){
  if(!user || user.isAnonymous) return false;
  try{
    const snap=await getDoc(doc(db,'adminUsers',user.uid));
    return snap.exists() && snap.data()?.active===true && snap.data()?.role==='superadmin';
  }catch(e){
    console.warn('Backup admin status check failed',e);
    return false;
  }
}

function rememberKnownAdminEmail(user){
  if(!user?.email) return;
  try{ localStorage.setItem('snazzleKnownAdminEmail',user.email); }catch{}
}

function prefillKnownAdminEmail(){
  const input=document.getElementById('adminEmail');
  if(!input || input.value) return;
  try{
    const known=localStorage.getItem('snazzleKnownAdminEmail');
    if(known) input.value=known;
  }catch{}
}

function installBackupUI(){
  if(document.getElementById('snazzleBackupAdminBox')) return;
  const adminsSection=document.getElementById('adminsAdmin');
  if(!adminsSection) return;

  const box=document.createElement('div');
  box.id='snazzleBackupAdminBox';
  box.style.marginTop='22px';
  box.style.paddingTop='18px';
  box.style.borderTop='2px dashed #b9955e';
  box.innerHTML=`
    <h3>Nood-beheeraccount 🛟</h3>
    <p>Maak hier één extra hoofdbeheerder aan voor noodgevallen. Gebruik bij voorkeur een ander e-mailadres waar je altijd bij kunt.</p>
    <div class="field"><label>Backup e-mailadres</label><input id="backupAdminEmail" type="email" autocomplete="off"></div>
    <div class="field"><label>Backup wachtwoord</label><input id="backupAdminPassword" type="password" autocomplete="new-password" minlength="8"></div>
    <button class="save" id="createBackupAdminBtn" type="button">Backup hoofdbeheerder aanmaken</button>
    <p id="backupAdminStatus" style="font-size:13px;opacity:.82;margin-top:8px">Alleen een ingelogde hoofdbeheerder kan dit aanmaken.</p>
  `;
  adminsSection.appendChild(box);

  document.getElementById('createBackupAdminBtn').onclick=async()=>{
    const user=auth.currentUser;
    if(!(await currentIsSuperAdmin(user))) return toast('Alleen de hoofdbeheerder kan een backup-account aanmaken');
    const email=String(document.getElementById('backupAdminEmail').value||'').trim();
    const password=String(document.getElementById('backupAdminPassword').value||'');
    if(!email || password.length<8) return toast('Vul een geldig e-mailadres en minimaal 8 tekens wachtwoord in');

    const button=document.getElementById('createBackupAdminBtn');
    button.disabled=true;
    button.textContent='Backup-account wordt aangemaakt…';
    let secondary=null;
    try{
      secondary=initializeApp(mainApp.options,'snazzleBackupAdminCreator');
      const secondaryAuth=getAuth(secondary);
      const cred=await createUserWithEmailAndPassword(secondaryAuth,email,password);
      await setDoc(doc(db,'adminUsers',cred.user.uid),{
        email,
        role:'superadmin',
        active:true,
        backup:true,
        createdBy:user.uid,
        createdAt:new Date().toISOString()
      });
      try{ await signOut(secondaryAuth); }catch{}
      try{ localStorage.setItem('snazzleBackupAdminEmail',email); }catch{}
      document.getElementById('backupAdminPassword').value='';
      document.getElementById('backupAdminStatus').textContent=`Backup hoofdbeheerder actief: ${email}`;
      toast('Backup hoofdbeheerder aangemaakt ✅');
    }catch(err){
      console.error('Backup hoofdbeheerder maken mislukt',err);
      const code=String(err?.code||'');
      if(code.includes('email-already-in-use')) toast('Dit e-mailadres bestaat al in Firebase');
      else if(code.includes('invalid-email')) toast('Dit e-mailadres is niet geldig');
      else if(code.includes('weak-password')) toast('Kies een sterker wachtwoord');
      else toast('Backup-account kon niet worden aangemaakt');
    }finally{
      if(secondary){ try{ await deleteApp(secondary); }catch{} }
      button.disabled=false;
      button.textContent='Backup hoofdbeheerder aanmaken';
    }
  };
}

onAuthStateChanged(auth,async user=>{
  if(await currentIsSuperAdmin(user)) rememberKnownAdminEmail(user);
  prefillKnownAdminEmail();
  installBackupUI();
});

prefillKnownAdminEmail();
installBackupUI();
setTimeout(prefillKnownAdminEmail,700);
setTimeout(installBackupUI,700);
setTimeout(installBackupUI,1800);
