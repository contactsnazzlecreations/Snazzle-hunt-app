// Snazzle v69 — invoertekst voor nieuwe gebruikers en profielnaam altijd goed zichtbaar.
// Fix voor toestellen/thema's waarbij getypte letters wit op een lichte invoerbalk verschenen.

const V69='69.0.0';

function installInputVisibility69(){
  if(document.getElementById('snazzleInputVisibilityV69')) return;
  const style=document.createElement('style');
  style.id='snazzleInputVisibilityV69';
  style.textContent=`
    #firstNameInput,
    #nameInput,
    .onboard input,
    #profileSheet .field input{
      color:#2d2117!important;
      -webkit-text-fill-color:#2d2117!important;
      caret-color:#2d2117!important;
      background:#fffaf0!important;
      opacity:1!important;
      color-scheme:light!important;
    }
    #firstNameInput::placeholder,
    #nameInput::placeholder,
    .onboard input::placeholder,
    #profileSheet .field input::placeholder{
      color:#786a58!important;
      -webkit-text-fill-color:#786a58!important;
      opacity:1!important;
    }
    #firstNameInput:-webkit-autofill,
    #nameInput:-webkit-autofill{
      -webkit-text-fill-color:#2d2117!important;
      caret-color:#2d2117!important;
      box-shadow:0 0 0 1000px #fffaf0 inset!important;
    }
    #firstNameInput:focus,
    #nameInput:focus{
      border-color:#4f8f39!important;
      box-shadow:0 0 0 3px rgba(79,143,57,.18)!important;
      outline:none!important;
    }
  `;
  document.head.appendChild(style);
  console.info(`Snazzle input visibility ${V69} geladen`);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installInputVisibility69,{once:true});
else installInputVisibility69();
