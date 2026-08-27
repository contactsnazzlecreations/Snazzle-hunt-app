// v52: privacy + family safety layer for Snazzle Hunt.
const PRIVACY_URL='./privacy.html';

function openPrivacy(){
  window.open(PRIVACY_URL,'_blank','noopener,noreferrer');
}

function makePrivacyButton(){
  const b=document.createElement('button');
  b.type='button';
  b.id='snazzlePrivacyMenuBtn';
  b.innerHTML='<b>🛡️</b><span><strong>Privacy & veiligheid</strong><small>Voor ouders, verzorgers en kinderen</small></span><i>›</i>';
  b.onclick=openPrivacy;
  return b;
}

function installMenuLink(){
  const list=document.querySelector('#quickMenuPanel .quick-menu-list');
  if(!list || document.getElementById('snazzlePrivacyMenuBtn')) return;
  list.appendChild(makePrivacyButton());
}

function installSafetyBadge(){
  const panel=document.querySelector('#quickMenuPanel .panel');
  if(!panel || document.getElementById('snazzleChildSafetyBadge')) return;
  const badge=document.createElement('button');
  badge.type='button';
  badge.id='snazzleChildSafetyBadge';
  badge.className='snazzle-child-safety-badge';
  badge.setAttribute('aria-label','Lees meer over privacy en veilig spelen');
  badge.innerHTML=`<span class="snazzle-safety-shield">🛡️</span><span class="snazzle-safety-copy"><strong>ONTWORPEN VOOR VEILIG SPELEN</strong><small>Met aandacht voor kinderen &amp; privacy</small></span><span class="snazzle-safety-check">✓</span>`;
  badge.onclick=openPrivacy;
  panel.appendChild(badge);
}

function installProfileBox(){
  const panel=document.querySelector('#profileSheet .panel');
  if(!panel || document.getElementById('snazzlePrivacyProfileBox')) return;
  const box=document.createElement('div');
  box.id='snazzlePrivacyProfileBox';
  box.className='snazzle-privacy-box';
  box.innerHTML=`<strong>🛡️ Privacy & veilig spelen</strong>
    <p>Gebruik voor kinderen liefst een nickname. Deel geen adres, school of andere privégegevens.</p>
    <button type="button" id="snazzlePrivacyProfileBtn">Bekijk privacybeleid</button>`;
  panel.appendChild(box);
  box.querySelector('#snazzlePrivacyProfileBtn').onclick=openPrivacy;
}

function installPhotoNotice(){
  const proof=document.querySelector('#proofBox');
  if(!proof || document.getElementById('snazzlePhotoSafety')) return;
  const note=document.createElement('div');
  note.id='snazzlePhotoSafety';
  note.className='snazzle-photo-safety';
  note.innerHTML='📷 <strong>Veilige vondstfoto:</strong> fotografeer liefst alleen de gevonden Snazzle of het voorwerp. Upload geen herkenbare gezichten van kinderen of anderen. <button type="button">Privacy</button>';
  proof.appendChild(note);
  note.querySelector('button').onclick=openPrivacy;
}

function installOnboardingNotice(){
  const onboarding=document.querySelector('#onboarding');
  if(!onboarding || document.getElementById('snazzleFamilyPrivacyNotice')) return;
  const target=onboarding.querySelector('.panel') || onboarding.firstElementChild || onboarding;
  const note=document.createElement('div');
  note.id='snazzleFamilyPrivacyNotice';
  note.className='snazzle-family-notice';
  note.innerHTML='👨‍👩‍👧 <strong>Voor gezinnen:</strong> kies voor kinderen bij voorkeur een nickname en gebruik Snazzle samen met een ouder/verzorger. <button type="button">Privacybeleid</button>';
  target.appendChild(note);
  note.querySelector('button').onclick=openPrivacy;
}

function installShopPrivacyLink(){
  const input=document.querySelector('#shopPrivacy');
  if(!input) return;
  const label=input.closest('label');
  const span=label?.querySelector('span');
  if(!span || span.querySelector('[data-snazzle-privacy-link]')) return;
  span.append(' ');
  const a=document.createElement('a');
  a.href=PRIVACY_URL;
  a.target='_blank';
  a.rel='noopener noreferrer';
  a.dataset.snazzlePrivacyLink='1';
  a.textContent='Bekijk het privacybeleid.';
  a.onclick=e=>e.stopPropagation();
  span.appendChild(a);
}

function installStyles(){
  if(document.getElementById('snazzlePrivacyStyles')) return;
  const s=document.createElement('style');
  s.id='snazzlePrivacyStyles';
  s.textContent=`
    .snazzle-privacy-box{margin:16px 0 3px;padding:13px;border-radius:16px;background:#eef7d1;border:2px solid #a8c56f;color:#30431f;line-height:1.42}
    .snazzle-privacy-box>strong{font-size:15px}.snazzle-privacy-box p{font-size:12px;margin:6px 0 10px!important;color:#4f5d38!important;font-weight:730}
    .snazzle-privacy-box button{width:100%;border:0;border-radius:12px;padding:11px;background:#356f43;color:#fff;font-weight:950;box-shadow:0 3px 0 #214d2e}
    .snazzle-photo-safety{margin-top:10px;padding:10px 11px;border-radius:13px;background:#fff4c9;border:1px solid #d6bc64;color:#5b471e;font-size:11px;font-weight:720;line-height:1.42}
    .snazzle-photo-safety button,.snazzle-family-notice button{border:0;background:none;padding:0;color:#24613a;text-decoration:underline;font-weight:950}
    .snazzle-family-notice{margin:12px 0 2px;padding:11px 12px;border-radius:14px;background:#eef7d1;border:1px solid #a8c56f;color:#354525;font-size:11px;font-weight:720;line-height:1.4}
    [data-snazzle-privacy-link]{color:#24613a;font-weight:950;text-decoration:underline}
    .snazzle-child-safety-badge{width:100%;margin:18px 0 5px;padding:12px 13px;border:1px solid rgba(104,220,126,.38);border-radius:17px;background:linear-gradient(135deg,#17243a,#162c2d);color:#fff;display:grid;grid-template-columns:48px 1fr 35px;align-items:center;gap:10px;text-align:left;box-shadow:0 7px 18px rgba(0,0,0,.18)}
    .snazzle-safety-shield{width:45px;height:45px;display:grid;place-items:center;border-radius:14px;background:rgba(80,211,104,.13);font-size:27px}
    .snazzle-safety-copy{min-width:0}.snazzle-safety-copy strong{display:block;color:#58d875;font-size:13px;line-height:1.18;letter-spacing:.15px}.snazzle-safety-copy small{display:block;color:#e7eee8;font-size:10px;font-weight:720;margin-top:4px;line-height:1.25}
    .snazzle-safety-check{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#55d675;color:#12351d;font-size:20px;font-weight:1000}
  `;
  document.head.appendChild(s);
}

function installPrivacyLayer(){
  installStyles();
  installMenuLink();
  installSafetyBadge();
  installProfileBox();
  installPhotoNotice();
  installOnboardingNotice();
  installShopPrivacyLink();
}

installPrivacyLayer();
const observer=new MutationObserver(()=>installPrivacyLayer());
observer.observe(document.body,{childList:true,subtree:true});
setTimeout(installPrivacyLayer,500);
setTimeout(installPrivacyLayer,1800);

window.SnazzlePrivacy={open:openPrivacy,url:PRIVACY_URL};
