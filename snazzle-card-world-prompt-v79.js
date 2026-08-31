import './snazzle-card-draft-link-v107.js';
import './snazzle-card-thumb-crop-fix-v200.js';

// Snazzle Card World Prompt v79 — bestaande spelers krijgen één keer duidelijk de WILD / SPARK / MIX-keuze.
const VERSION='79.0.1-thumbfix';
const PREF_KEY='snazzleCardWorldPreference';
const NAME_KEY='snazzleName';
const VALID=['wild','spark','mix'];

function currentPreference(){
  const value=localStorage.getItem(PREF_KEY);
  return VALID.includes(value)?value:'';
}
function hasExistingProfile(){
  return String(localStorage.getItem(NAME_KEY)||'').trim().length>=2;
}
function onboardingVisible(){
  return document.getElementById('onboarding')?.classList.contains('show');
}
function closePrompt(){
  const overlay=document.getElementById('snWorldPrompt79');
  if(!overlay) return;
  overlay.classList.add('closing');
  setTimeout(()=>overlay.remove(),180);
}
function chooseWorld(value){
  if(!VALID.includes(value)) return;
  // Gebruik bij voorkeur v78 zodat lokale opslag, profiel-sync en kaartfiltering samen worden bijgewerkt.
  const source=[...document.querySelectorAll(`[data-sn-world="${value}"]`)]
    .find(button=>!button.closest('#snWorldPrompt79'));
  if(source){
    source.click();
  }else{
    localStorage.setItem(PREF_KEY,value);
    window.dispatchEvent(new CustomEvent('snazzle-card-world-change',{detail:{preference:value}}));
  }
  closePrompt();
}
function installPrompt(){
  if(document.getElementById('snWorldPrompt79')) return;
  if(currentPreference() || !hasExistingProfile() || onboardingVisible()) return;

  const overlay=document.createElement('div');
  overlay.id='snWorldPrompt79';
  overlay.className='sn-world79-overlay';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-labelledby','snWorld79Title');
  overlay.innerHTML=`
    <section class="sn-world79-card">
      <div class="sn-world79-duck" aria-hidden="true">🦆✨</div>
      <div class="sn-world79-kicker">JOUW SNAZZLE CARDS</div>
      <h2 id="snWorld79Title">Welke Snazzle-wereld kies jij?</h2>
      <p>Kies de kaartstijl die jij het leukste vindt. Dit zegt niets over jongen of meisje en je kunt later altijd wisselen in je profiel.</p>
      <div class="sn-world79-options">
        <button type="button" data-sn79-world="wild"><b>🟢</b><strong>WILD</strong><small>Avontuur & actie</small></button>
        <button type="button" data-sn79-world="spark"><b>✨</b><strong>SPARK</strong><small>Glans & fantasie</small></button>
        <button type="button" data-sn79-world="mix"><b>🌀</b><strong>MIX</strong><small>Van beide werelden</small></button>
      </div>
      <button type="button" class="sn-world79-later" id="snWorld79Later">Later kiezen</button>
    </section>`;
  document.body.appendChild(overlay);

  if(!document.getElementById('snWorld79Styles')){
    const style=document.createElement('style');
    style.id='snWorld79Styles';
    style.textContent=`
      .sn-world79-overlay{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:18px;background:rgba(2,18,10,.82);backdrop-filter:blur(7px);animation:snWorld79Fade .22s ease-out}
      .sn-world79-overlay.closing{opacity:0;transition:opacity .18s ease}
      .sn-world79-card{width:min(440px,100%);max-height:92dvh;overflow:auto;padding:22px 17px 17px;border-radius:28px;background:radial-gradient(circle at 85% 2%,rgba(255,224,91,.34),transparent 24%),linear-gradient(155deg,#fff7df,#f2d998);border:4px solid #8c6236;color:#352419;text-align:center;box-shadow:0 10px 0 #4a2d1b,0 25px 55px rgba(0,0,0,.45)}
      .sn-world79-duck{font-size:48px;line-height:1;margin-bottom:8px;filter:drop-shadow(0 4px 4px rgba(0,0,0,.18))}
      .sn-world79-kicker{font-size:10px;font-weight:1000;letter-spacing:1.5px;color:#547536}
      .sn-world79-card h2{margin:7px 0 8px;font-size:25px;line-height:1.08;color:#2f4f2c}
      .sn-world79-card p{margin:0 auto 15px;max-width:370px;font-size:12px;line-height:1.45;font-weight:760;color:#6d5236}
      .sn-world79-options{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      .sn-world79-options button{min-width:0;min-height:116px;padding:12px 5px 10px;border:3px solid #b58d52;border-radius:19px;background:#fffaf0;color:#352419;box-shadow:0 5px 0 #9a743f;text-align:center}
      .sn-world79-options button:active{transform:translateY(3px);box-shadow:0 2px 0 #9a743f}
      .sn-world79-options b{display:block;font-size:29px;line-height:1}.sn-world79-options strong{display:block;margin-top:8px;font-size:14px}.sn-world79-options small{display:block;margin-top:5px;font-size:9px;line-height:1.25;font-weight:850;color:#74593d}
      .sn-world79-options [data-sn79-world="wild"]{background:linear-gradient(160deg,#f8ffe7,#d8efad)}
      .sn-world79-options [data-sn79-world="spark"]{background:linear-gradient(160deg,#fff8ee,#f5d9f1)}
      .sn-world79-options [data-sn79-world="mix"]{background:linear-gradient(160deg,#fff9df,#d9e9f7)}
      .sn-world79-later{margin-top:14px;border:0;background:transparent;color:#765a3c;text-decoration:underline;font-size:11px;font-weight:850;padding:8px 14px}
      @keyframes snWorld79Fade{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:scale(1)}}
      @media(max-width:360px){.sn-world79-options{gap:5px}.sn-world79-options button{min-height:105px;padding-inline:3px}.sn-world79-options strong{font-size:12px}.sn-world79-options small{font-size:8px}}
      @media(prefers-reduced-motion:reduce){.sn-world79-overlay{animation:none}}
    `;
    document.head.appendChild(style);
  }

  overlay.querySelectorAll('[data-sn79-world]').forEach(button=>{
    button.addEventListener('click',()=>chooseWorld(button.dataset.sn79World));
  });
  document.getElementById('snWorld79Later')?.addEventListener('click',closePrompt);
}

function maybeInstall(){
  if(currentPreference()) return;
  if(!hasExistingProfile()) return;
  if(onboardingVisible()) return;
  installPrompt();
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>setTimeout(maybeInstall,650),{once:true});
}else{
  setTimeout(maybeInstall,650);
}
// Een tweede controle vangt een tragere Firebase/onboarding-start op zonder dubbel venster.
setTimeout(maybeInstall,1800);
console.info(`Snazzle Card World Prompt ${VERSION} geladen`);
