// Snazzle v93 local shell.
// Geen Firebase of andere externe imports: de hoofdpagina en het menu werken direct.

const q = (s, r=document) => r.querySelector(s);
const qa = (s, r=document) => [...r.querySelectorAll(s)];

function openSheet(id){ q('#'+id)?.classList.add('show'); }
function closeSheet(id){ q('#'+id)?.classList.remove('show'); }
function localSettings(){
  try { return JSON.parse(localStorage.getItem('snazzleSettings') || '{}'); }
  catch { return {}; }
}
function userName(){ return (localStorage.getItem('snazzleName') || '').trim(); }
function selectedVillage(){ return localStorage.getItem('snazzleVillage') || 'Montfort'; }
function cleanVillageName(text){ return String(text || '').replace(/^\s*📍\s*/, '').trim(); }

function setImg(img, fallback, src){
  if(!img) return;
  if(src){
    img.src=src;
    img.style.display='block';
    if(fallback) fallback.style.display='none';
  }else{
    img.removeAttribute('src');
    img.style.display='none';
    if(fallback) fallback.style.display='grid';
  }
}

function applyLocalImages(){
  const s=localSettings();
  setImg(q('#profileLogo'),q('#logoFallback'),s.profileImage||'');
  setImg(q('#homeImg1'),q('#homeEmpty1'),s.homeImage1||'');
  setImg(q('#homeImg2'),q('#homeEmpty2'),s.homeImage2||'');
  if(s.heroImage && q('#hero')){
    q('#hero').style.backgroundImage=`linear-gradient(rgba(7,45,34,.24),rgba(5,42,31,.68)),url("${s.heroImage}")`;
    q('#hero').style.backgroundSize='cover';
    q('#hero').style.backgroundPosition='center top';
  }
}

function ensureCurrentHome(){
  const top=q('.top');
  const welcome=q('#welcomeText');
  if(welcome) welcome.textContent=userName() ? `Hoi ${userName()}!` : 'Hoi!';

  if(top && welcome){
    let passport=q('#snazzlePassport');
    if(!passport){
      passport=document.createElement('section');
      passport.id='snazzlePassport';
      passport.className='snazzle-passport';
      passport.innerHTML=`
        <div class="passport-kicker">Mijn Snazzle paspoort</div>
        <div class="passport-welcome-slot"></div>
        <div class="passport-stats">
          <div class="passport-stat"><strong id="passportFinds">0</strong><small>Snazzles gevonden</small></div>
          <div class="passport-stat"><strong id="passportVillage">${selectedVillage()}</strong><small>gekozen dorp</small></div>
          <div class="passport-stat"><strong>Explorer</strong><small>klaar voor avontuur</small></div>
        </div>`;
      top.insertAdjacentElement('afterend',passport);
    }
    const slot=q('.passport-welcome-slot',passport);
    if(slot && welcome.parentElement!==slot) slot.appendChild(welcome);
    const pv=q('#passportVillage'); if(pv) pv.textContent=selectedVillage();
  }

  const hero=q('#hero');
  const start=q('#bigStart');
  if(hero){
    let wrap=q('.v31-hero-copy',hero);
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='v31-hero-copy';
      if(start && start.parentElement===hero) hero.insertBefore(wrap,start);
      else hero.appendChild(wrap);
    }
    let title=q('#adventureTitle',hero);
    if(!title){
      title=document.createElement('h2');
      title.id='adventureTitle';
      title.className='adventure-title';
    }
    const small=hero.querySelector(':scope > small') || wrap.querySelector(':scope > small');
    const p=hero.querySelector(':scope > p') || wrap.querySelector(':scope > p');
    if(small && small.parentElement!==wrap) wrap.appendChild(small);
    if(title.parentElement!==wrap) wrap.appendChild(title);
    if(p && p.parentElement!==wrap) wrap.appendChild(p);
    if(small) small.textContent='Snazzle avontuur';
    title.textContent='Klaar voor avontuur?';
    if(p) p.textContent='Vind een Snazzle en ontdek jouw dorp.';
  }
  applyLocalImages();
}

function ensureFallbackVillages(){
  const box=q('#villages');
  if(!box || box.children.length) return;
  const names=['Montfort','Posterholt','Sint Odiliënberg'];
  const current=selectedVillage();
  names.forEach(name=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='village'+(name===current?' active':'');
    b.innerHTML=`<span class="v31-village-label">${name}</span>`;
    b.onclick=()=>{
      localStorage.setItem('snazzleVillage',name);
      qa('#villages .village').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const chosen=q('#chosenVillageLabel'); if(chosen) chosen.textContent='📍 '+name;
      const pv=q('#passportVillage'); if(pv) pv.textContent=name;
      const title=q('#villageSheetTitle'); if(title) title.textContent='📍 '+name;
      const txt=q('#villageSheetText'); if(txt) txt.textContent='De actuele hunts worden op de achtergrond opgehaald.';
      openSheet('villageSheet');
    };
    box.appendChild(b);
  });
  const chosen=q('#chosenVillageLabel'); if(chosen) chosen.textContent='📍 '+current;
}

function installShellStyles(){
  if(q('#snazzleShellV93Styles')) return;
  const s=document.createElement('style');
  s.id='snazzleShellV93Styles';
  s.textContent=`
    .quick-menu-btn{width:54px;height:54px;flex:0 0 54px;border-radius:18px;border:3px solid #8a6539;background:linear-gradient(145deg,#4f8f3f,#285e35);color:#fff7df;font-size:29px;font-weight:1000;display:grid;place-items:center;box-shadow:0 5px 0 #4a2e1b,0 8px 18px rgba(0,0,0,.2)}
    .quick-menu-overlay{position:fixed;inset:0;z-index:5000;background:rgba(3,16,8,.68);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:.2s;display:flex;justify-content:flex-end}
    .quick-menu-overlay.show{opacity:1;visibility:visible}
    .quick-menu-panel{width:min(88vw,390px);height:100%;overflow:auto;padding:calc(18px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));background:linear-gradient(180deg,#175e35,#07351f);border-left:4px solid #8c6236;box-shadow:-14px 0 38px rgba(0,0,0,.38);transform:translateX(105%);transition:transform .24s ease;color:#fff7df}
    .quick-menu-overlay.show .quick-menu-panel{transform:translateX(0)}
    .quick-menu-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 1px 16px;border-bottom:2px solid rgba(255,218,112,.22)}
    .quick-menu-brand{display:flex;align-items:center;gap:11px}.quick-menu-duck{width:51px;height:51px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#ffe36a,#ffb82f);border:3px solid #754720;font-size:26px}.quick-menu-brand strong{display:block;color:#ffd348;font-size:22px}.quick-menu-brand small{display:block;margin-top:5px;color:#c9ef8a;font-weight:850}
    .quick-menu-close{width:45px;height:45px;border:0;border-radius:14px;background:#744528;color:white;font-size:27px;font-weight:900}.quick-menu-note{margin:14px 3px 10px;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:1.2px;color:#c9ef8a}
    .quick-menu-list{display:grid;gap:8px}.quick-menu-list button,.quick-menu-admin{width:100%;min-height:63px;border:2px solid rgba(255,224,147,.22);border-radius:17px;background:rgba(255,255,255,.09);color:#fff7df;padding:9px 11px;display:grid;grid-template-columns:42px 1fr 20px;align-items:center;gap:9px;text-align:left}.quick-menu-list b{font-size:23px}.quick-menu-list strong{display:block;font-size:16px}.quick-menu-list small{display:block;margin-top:3px;font-size:11px;color:#d6e8bd}.quick-menu-list i{font-style:normal;font-size:30px;color:#ffd34b}.quick-menu-admin{margin-top:14px;grid-template-columns:42px 1fr;background:#51331f}.quick-menu-footer{text-align:center;color:#a9dc72;font-size:11px;font-weight:900;margin:18px 0 2px}
    body.sn-shell-ready{overflow-x:hidden}
  `;
  document.head.appendChild(s);
}

function installQuickMenu(){
  if(q('#quickMenuPanel')) return;
  const top=q('.top'); if(!top) return;
  const admin=q('#adminBtn'); if(admin) admin.style.display='none';

  const menuBtn=document.createElement('button');
  menuBtn.id='quickMenuBtn';
  menuBtn.className='quick-menu-btn';
  menuBtn.type='button';
  menuBtn.setAttribute('aria-label','Snazzle menu openen');
  menuBtn.innerHTML='☰';
  top.appendChild(menuBtn);

  const overlay=document.createElement('div');
  overlay.id='quickMenuOverlay';
  overlay.className='quick-menu-overlay';
  overlay.innerHTML=`<aside id="quickMenuPanel" class="quick-menu-panel">
    <div class="quick-menu-head"><div class="quick-menu-brand"><span class="quick-menu-duck">🦆</span><div><strong>Snazzle Menu</strong><small id="quickMenuVillage">📍 ${selectedVillage()}</small></div></div><button id="quickMenuClose" class="quick-menu-close" type="button">×</button></div>
    <div class="quick-menu-note">Waar wil je naartoe?</div>
    <nav class="quick-menu-list">
      <button data-shell-target="home"><b>🏠</b><span><strong>Home</strong><small>Terug naar het begin</small></span><i>›</i></button>
      <button data-shell-target="hunt"><b>🔎</b><span><strong>Hunt zoeken</strong><small>Bekijk de actieve Hunt</small></span><i>›</i></button>
      <button data-shell-target="village"><b>📍</b><span><strong>Kies je dorp</strong><small>Ga naar de dorpskeuze</small></span><i>›</i></button>
      <button data-shell-target="friends"><b>👥</b><span><strong>Vrienden</strong><small>Bekijk actieve Snazzlers</small></span><i>›</i></button>
      <button data-shell-target="findings"><b>🏆</b><span><strong>Mijn vondsten</strong><small>Jouw gevonden Hunts</small></span><i>›</i></button>
      <button data-shell-target="shop"><b>🛍️</b><span><strong>Shop</strong><small>Bekijk Snazzle items</small></span><i>›</i></button>
      <button data-shell-target="profile"><b>👤</b><span><strong>Mijn profiel</strong><small>Naam aanpassen</small></span><i>›</i></button>
    </nav>
    <button class="quick-menu-admin" data-shell-target="admin"><b>🔒</b><span><strong>Beheer</strong><small>Voor Snazzle beheerders</small></span></button>
    <div class="quick-menu-footer">Samen naar buiten 🌿</div>
  </aside>`;
  document.body.appendChild(overlay);

  const close=()=>{
    overlay.classList.remove('show');
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
  };
  menuBtn.onclick=()=>{
    const vm=q('#quickMenuVillage'); if(vm) vm.textContent='📍 '+selectedVillage();
    overlay.classList.add('show');
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
  };
  q('#quickMenuClose').onclick=close;
  overlay.onclick=e=>{ if(e.target===overlay) close(); };

  qa('[data-shell-target]',overlay).forEach(btn=>btn.onclick=()=>{
    const target=btn.dataset.shellTarget;
    close();
    if(target==='home'){ window.scrollTo({top:0,behavior:'smooth'}); return; }
    if(target==='village'){ q('.section-head')?.scrollIntoView({behavior:'smooth',block:'center'}); return; }
    const map={hunt:'navHunt',friends:'navFriends',findings:'findsBtn',shop:'navShop',profile:'navProfile',admin:'adminBtn'};
    q('#'+map[target])?.click();
  });
}

function bindBaseControls(){
  qa('[data-close]').forEach(b=>{ b.onclick=()=>closeSheet(b.dataset.close); });

  const profile=()=>openSheet('profileSheet');
  if(q('#profileBtn')) q('#profileBtn').onclick=profile;
  if(q('#navProfile')) q('#navProfile').onclick=profile;
  if(q('#findsBtn')) q('#findsBtn').onclick=()=>openSheet('findsSheet');
  if(q('#navFriends')) q('#navFriends').onclick=()=>openSheet('friendsSheet');
  if(q('#navShop')) q('#navShop').onclick=()=>openSheet('shopSheet');
  if(q('#adminBtn')) q('#adminBtn').onclick=()=>openSheet('adminLogin');

  const hunt=()=>{
    const txt=q('#villageSheetText'); if(txt && !txt.textContent) txt.textContent='De actuele hunts worden op de achtergrond opgehaald.';
    openSheet('villageSheet');
  };
  if(q('#bigStart')) q('#bigStart').onclick=hunt;
  if(q('#navHunt')) q('#navHunt').onclick=hunt;

  const bottomHome=q('.bottom button');
  if(bottomHome) bottomHome.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});

  if(q('#saveName')) q('#saveName').onclick=()=>{
    const n=(q('#nameInput')?.value||'').trim().slice(0,20);
    if(n.length<2) return;
    localStorage.setItem('snazzleName',n);
    closeSheet('profileSheet');
    ensureCurrentHome();
  };
  if(q('#nameInput')) q('#nameInput').value=userName();

  if(q('#finishOnboarding')) q('#finishOnboarding').onclick=()=>{
    const n=(q('#firstNameInput')?.value||'').trim().slice(0,20);
    if(n.length<2) return;
    localStorage.setItem('snazzleName',n);
    q('#onboarding')?.classList.remove('show');
    ensureCurrentHome();
  };
  if(userName()) q('#onboarding')?.classList.remove('show');
}

function initShell(){
  if(window.__snazzleShellV93) return;
  window.__snazzleShellV93=true;
  installShellStyles();
  ensureCurrentHome();
  ensureFallbackVillages();
  bindBaseControls();
  installQuickMenu();
  document.body?.classList.add('sn-shell-ready');
  document.documentElement.dataset.snazzleShell='v93';
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initShell,{once:true});
else initShell();

export { initShell, ensureCurrentHome };
