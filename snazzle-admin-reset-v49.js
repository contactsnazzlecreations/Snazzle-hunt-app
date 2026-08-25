import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const auth = getAuth(getApp());

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__resetToast);
  window.__resetToast=setTimeout(()=>el.classList.remove('show'),3200);
}

function installResetButton(){
  if(document.getElementById('adminForgotPasswordBtn')) return;
  const loginBtn=document.getElementById('adminLoginBtn');
  const emailInput=document.getElementById('adminEmail');
  if(!loginBtn || !emailInput) return;

  const button=document.createElement('button');
  button.id='adminForgotPasswordBtn';
  button.type='button';
  button.className='secondary';
  button.textContent='Wachtwoord vergeten? 🔑';
  button.style.marginTop='10px';
  button.style.width='100%';
  loginBtn.insertAdjacentElement('afterend',button);

  const help=document.createElement('p');
  help.id='adminForgotPasswordHelp';
  help.textContent='Vul hierboven eerst het e-mailadres van het beheeraccount in. Je ontvangt daarna een beveiligde resetmail.';
  help.style.fontSize='13px';
  help.style.opacity='.82';
  help.style.margin='8px 2px 0';
  button.insertAdjacentElement('afterend',help);

  button.onclick=async()=>{
    const email=String(emailInput.value||'').trim();
    if(!email){
      emailInput.focus();
      toast('Vul eerst het e-mailadres van het beheeraccount in');
      return;
    }
    button.disabled=true;
    const oldText=button.textContent;
    button.textContent='Resetmail wordt verstuurd…';
    try{
      await sendPasswordResetEmail(auth,email);
      toast('Resetmail verstuurd ✅ Controleer ook de spammap.');
      help.textContent='Resetmail verstuurd. Open de mail van Firebase/Google en kies een nieuw wachtwoord.';
    }catch(err){
      console.error('Wachtwoord reset mislukt',err);
      const code=String(err?.code||'');
      if(code.includes('invalid-email')) toast('Dit e-mailadres is niet geldig');
      else if(code.includes('too-many-requests')) toast('Te veel pogingen. Probeer het later opnieuw.');
      else toast('Resetmail kon niet worden verstuurd. Controleer het e-mailadres.');
    }finally{
      button.disabled=false;
      button.textContent=oldText;
    }
  };
}

installResetButton();
setTimeout(installResetButton,600);
setTimeout(installResetButton,1800);
