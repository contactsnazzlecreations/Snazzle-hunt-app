// Snazzle v94 local shell.
// Menu en hoofdpagina werken zonder Firebase en zonder :scope-selectors.

const q=(s,r=document)=>r?.querySelector?.(s)||null;
const qa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];

function openSheet(id){ q('#'+id)?.classList.add('show'); }
function closeSheet(id){ q('#'+id)?.classList.remove('show'); }
function localSettings(){ try{return JSON.parse(localStorage.getItem('snazzleSettings')||'{}');}catch{return{};} }
function userName(){ return (localStorage.getItem('snazzleName')||'').trim(); }
function selectedVillage(){ return localStorage.getItem('snazzleVillage')||'Montfort'; }

function setImg(img,fallback,src){
  if(!img) return;
  if(src){img.src=src;img.style.display='block';if(fallback)fallback.style.display='none';}
  else{img.removeAttribute('src');img.style.display='none';if(fallback)fallback.style.display='grid';}
}

function applyLocalImages(){
  const s=localSettings();
  setImg(q('#profileLogo'),q('#logoFallback'),s.profileImage||'');
  setImg(q('#homeImg1'),q('#homeEmpty1'),s.homeImage1||'');
  setImg(q('#homeImg2'),q('#homeEmpty2'),s.homeImage2||'');
  if(s.heroImage&&q('#hero')){
    q('#hero').style.backgroundImage=`linear-gradient(rgba(7,45,34,.24),rgba(5,42,31,.68)),url("${s.heroImage}")`;
    q('#hero').style.backgroundSize='cover';
    q('#hero').style.backgroundPosition='center top';
  }
}

function installShellStyles(){
  if(q('#snazzleShellV94Styles')) return;
  const s=document.createElement('style');
  s.id='snazzleShellV94Styles';
  s.textContent=`
    #quickMenuBtn{width:54px!important;height:54px!important;flex:0 0 54px!important;border-radius:18px!important;border:3px solid #8a6539!important;background:linear-gradient(145deg,#4f8f3f,#285e35)!important;color:#fff7df!important;font-size:29px!important;font-weight:1000!important;display:grid!important;place-items:center!important;box-shadow:0 5px 0 #4a2e1b,0 8px 18px rgba(0,0,0,.2)!important;position:relative!important;z-index:10002!important;pointer-events:auto!important;touch-action:manipulation!important}
    #quickMenuOverlay{position:fixed!important;inset:0!important;z-index:10001!important;background:rgba(3,16,8,.72)!important;display:none!important;justify-content:flex-end!important;pointer-events:auto!important}
    #quickMenuOverlay.show{display:flex!important;visibility:visible!important;opacity:1!important}
    #quickMenuPanel{width:min(88vw,390px)!important;height:100%!important;overflow:auto!important;padding:calc(18px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))!important;background:linear-gradient(180deg,#175e35,#07351f)!important;border-left:4px solid #8c6236!important;box-shadow:-14px 0 38px rgba(0,0,0,.38)!important;color:#fff7df!important;transform:none!important;pointer-events:auto!important}
    .quick-menu-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 1px 16px;border-bottom:2px solid rgba(255,218,112,.22)}
    .quick-menu-brand{display:flex;align-items:center;gap:11px}.quick-menu-duck{width:51px;height:51px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#ffe36a,#ffb82f);border:3px solid #754720;font-size:26px}.quick-menu-brand strong{display:block;color:#ffd348;font-size:22px}.quick-menu-brand small{display:block;margin-top:5px;color:#c9ef8a;font-weight:850}
    #quickMenuClose{width:45px;height:45px;border:0;border-radius:14px;background:#744528;color:white;font-size:27px;font-weight:900;pointer-events:auto!important}.quick-menu-note{margin:14px 3px 10px;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:1.2px;color:#c9ef8a}
    .quick-menu-list{display:grid;gap:8px}.quick-menu-list button,.quick-menu-admin{width:100%;min-height:63px;border:2px solid rgba(255,224,147,.22);border-radius:17px;background:rgba(255,255,255,.09);color:#fff7df;padding:9px 11px;display:grid;grid-template-columns:42px 1fr 20px;align-items:center;gap:9px;text-align:left;pointer-events:auto!important}.quick-menu-list b{font-size:23px}.quick-menu-list strong{display:block;font-size:16px}.quick-menu-list small{display:block;margin-top:3px;font-size:11px;color:#d6e8bd}.quick-menu-list i{font-style:normal;font-size:30px;color:#ffd34b}.quick-menu-admin{margin-top:14px;grid-template-columns:42px 1fr;background:#51331f}.quick-menu-footer{text-align:center;color:#a9dc72;font-size:11px;font-weight:900;margin:18px 0 2px}
    .snazzle-passport{margin:8px 0 14px;padding:15px 16px;border-radius:24px;background:linear-gradient(145deg,#f5e9c6,#ead199);color:#173d35;border:3px solid #b98f4f;box-shadow:0 5px 0 #6a4a2c,0 12px 24px rgba(0,0,0,.18)}
    .passport-kicker{font-size:9px;letter-spacing:1.4px;text-transform:uppercase;font-weight:1000;color:#8b6835}.passport-stats{display:grid;grid-template-columns:1fr 1fr 1.1fr;border-top:1px dashed rgba(84,66,37,.28);padding-top:9px}.passport-stat{padding:0 8px;border-right:1px solid rgba(84,66,37,.2)}.passport-stat:last-child{border-right:0}.passport-stat strong{display:block;font-size:15px;color:#123f35}.passport-stat small{display:block;font-size:9px;color:#765d38}
  `;
  document.head.appendChild(s);
}

function ensureCurrentHome(){
  try{
    const top=q('.top');
    const welcome=q('#welcomeText');
    if(welcome) welcome.textContent=userName()?`Hoi ${userName()}!`:'Hoi!';

    if(top&&welcome){
      let passport=q('#snazzlePassport');
      if(!passport){
        passport=document.createElement('section');
        passport.id='snazzlePassport';
        passport.className='snazzle-passport';
        passport.innerHTML=`<div class="passport-kicker">Mijn Snazzle paspoort</div><div class="passport-welcome-slot"></div><div class="passport-stats"><div class="passport-stat"><strong id="passportFinds">0</strong><small>Snazzles gevonden</small></div><div class="passport-stat"><strong id="passportVillage">${selectedVillage()}</strong><small>gekozen dorp</small></div><div class="passport-stat"><strong>Explorer</strong><small>klaar voor avontuur</small></div></div>`;
        top.insertAdjacentElement('afterend',passport);
      }
      const slot=q('.passport-welcome-slot',passport);
      if(slot&&welcome.parentElement!==slot) slot.appendChild(welcome);
      const pv=q('#passportVillage');if(pv)pv.textContent=selectedVillage();
    }

    const hero=q('#hero');
    const start=q('#bigStart');
    if(hero){
      let wrap=q('.v31-hero-copy',hero);
      if(!wrap){
        wrap=document.createElement('div');
        wrap.className='v31-hero-copy';
        hero.insertBefore(wrap,hero.firstChild||null);
      }
      let title=q('#adventureTitle',hero);
      if(!title){title=document.createElement('h2');title.id='adventureTitle';title.className='adventure-title';}
      const direct=[...hero.children].filter(el=>el!==wrap&&el!==start);
      const small=direct.find(el=>el.tagName==='SMALL')||q('small',wrap);
      const p=direct.find(el=>el.tagName==='P')||q('p',wrap);
      if(small&&small.parentElement!==wrap)wrap.appendChild(small);
      if(title.parentElement!==wrap)wrap.appendChild(title);
      if(p&&p.parentElement!==wrap)wrap.appendChild(p);
      if(small)small.textContent='Snazzle avontuur';
      title.textContent='Klaar voor avontuur?';
      if(p)p.textContent='Vind een Snazzle en ontdek jouw dorp.';
    }
    applyLocalImages();
    document.documentElement.dataset.snazzleCurrentHome='v94';
  }catch(err){console.warn('Snazzle v94 home',err);}
}

function ensureFallbackVillages(){
  try{
    const box=q('#villages');if(!box||box.children.length)return;
    const current=selectedVillage();
    ['Montfort','Posterholt','Sint Odiliënberg'].forEach(name=>{
      const b=document.createElement('button');b.type='button';b.className='village'+(name===current?' active':'');b.innerHTML=`<span class="v31-village-label">${name}</span>`;
      b.addEventListener('click',()=>{
        localStorage.setItem('snazzleVillage',name);
        qa('#villages .village').forEach(x=>x.classList.remove('active'));b.classList.add('active');
        if(q('#chosenVillageLabel'))q('#chosenVillageLabel').textContent='📍 '+name;
        if(q('#passportVillage'))q('#passportVillage').textContent=name;
        if(q('#villageSheetTitle'))q('#villageSheetTitle').textContent='📍 '+name;
        if(q('#villageSheetText'))q('#villageSheetText').textContent='De actuele hunts worden op de achtergrond opgehaald.';
        openSheet('villageSheet');
      });
      box.appendChild(b);
    });
    if(q('#chosenVillageLabel'))q('#chosenVillageLabel').textContent='📍 '+current;
  }catch(err){console.warn('Snazzle v94 villages',err);}
}

function closeQuickMenu(){
  const overlay=q('#quickMenuOverlay');
  if(!overlay)return;
  overlay.classList.remove('show');
  overlay.style.setProperty('display','none','important');
  document.documentElement.style.overflow='';document.body.style.overflow='';
}
function openQuickMenu(){
  const overlay=q('#quickMenuOverlay');
  if(!overlay)return;
  const vm=q('#quickMenuVillage');if(vm)vm.textContent='📍 '+selectedVillage();
  overlay.classList.add('show');
  overlay.style.setProperty('display','flex','important');
  overlay.style.setProperty('visibility','visible','important');
  overlay.style.setProperty('opacity','1','important');
  document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';
}

function installQuickMenu(){
  try{
    q('#quickMenuOverlay')?.remove();
    q('#quickMenuBtn')?.remove();
    const top=q('.top');if(!top)return;
    const admin=q('#adminBtn');if(admin)admin.style.display='none';

    const menuBtn=document.createElement('button');
    menuBtn.id='quickMenuBtn';menuBtn.className='quick-menu-btn';menuBtn.type='button';menuBtn.setAttribute('aria-label','Snazzle menu openen');menuBtn.textContent='☰';
    top.appendChild(menuBtn);

    const overlay=document.createElement('div');
    overlay.id='quickMenuOverlay';overlay.className='quick-menu-overlay';
    overlay.innerHTML=`<aside id="quickMenuPanel" class="quick-menu-panel"><div class="quick-menu-head"><div class="quick-menu-brand"><span class="quick-menu-duck">🦆</span><div><strong>Snazzle Menu</strong><small id="quickMenuVillage">📍 ${selectedVillage()}</small></div></div><button id="quickMenuClose" class="quick-menu-close" type="button">×</button></div><div class="quick-menu-note">Waar wil je naartoe?</div><nav class="quick-menu-list"><button type="button" data-shell-target="home"><b>🏠</b><span><strong>Home</strong><small>Terug naar het begin</small></span><i>›</i></button><button type="button" data-shell-target="hunt"><b>🔎</b><span><strong>Hunt zoeken</strong><small>Bekijk de actieve Hunt</small></span><i>›</i></button><button type="button" data-shell-target="village"><b>📍</b><span><strong>Kies je dorp</strong><small>Ga naar de dorpskeuze</small></span><i>›</i></button><button type="button" data-shell-target="friends"><b>👥</b><span><strong>Vrienden</strong><small>Bekijk actieve Snazzlers</small></span><i>›</i></button><button type="button" data-shell-target="findings"><b>🏆</b><span><strong>Mijn vondsten</strong><small>Jouw gevonden Hunts</small></span><i>›</i></button><button type="button" data-shell-target="shop"><b>🛍️</b><span><strong>Shop</strong><small>Bekijk Snazzle items</small></span><i>›</i></button><button type="button" data-shell-target="profile"><b>👤</b><span><strong>Mijn profiel</strong><small>Naam aanpassen</small></span><i>›</i></button></nav><button type="button" class="quick-menu-admin" data-shell-target="admin"><b>🔒</b><span><strong>Beheer</strong><small>Voor Snazzle beheerders</small></span></button><div class="quick-menu-footer">Samen naar buiten 🌿</div></aside>`;
    document.body.appendChild(overlay);

    menuBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openQuickMenu();},{capture:true});
    q('#quickMenuClose')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeQuickMenu();},{capture:true});
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeQuickMenu();});

    qa('[data-shell-target]',overlay).forEach(btn=>btn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const target=btn.dataset.shellTarget;closeQuickMenu();
      if(target==='home'){window.scrollTo({top:0,behavior:'smooth'});return;}
      if(target==='village'){q('.section-head')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
      const map={hunt:'navHunt',friends:'navFriends',findings:'findsBtn',shop:'navShop',profile:'navProfile',admin:'adminBtn'};
      const el=q('#'+map[target]);
      if(el){el.click();return;}
      const sheetMap={hunt:'villageSheet',friends:'friendsSheet',findings:'findsSheet',shop:'shopSheet',profile:'profileSheet',admin:'adminLogin'};
      if(sheetMap[target])openSheet(sheetMap[target]);
    },{capture:true}));

    // Android/in-app-browser fallback: documentbrede capture-handler.
    if(!window.__snazzleMenuCaptureV94){
      window.__snazzleMenuCaptureV94=true;
      document.addEventListener('click',e=>{
        const b=e.target?.closest?.('#quickMenuBtn');
        if(b){e.preventDefault();e.stopPropagation();openQuickMenu();}
      },true);
    }
  }catch(err){console.error('Snazzle v94 menu',err);}
}

function bindBaseControls(){
  try{
    qa('[data-close]').forEach(b=>b.addEventListener('click',()=>closeSheet(b.dataset.close)));
    const bind=(id,fn)=>{const el=q(id);if(el)el.addEventListener('click',fn);};
    bind('#profileBtn',()=>openSheet('profileSheet'));bind('#navProfile',()=>openSheet('profileSheet'));bind('#findsBtn',()=>openSheet('findsSheet'));bind('#navFriends',()=>openSheet('friendsSheet'));bind('#navShop',()=>openSheet('shopSheet'));bind('#adminBtn',()=>openSheet('adminLogin'));
    const hunt=()=>openSheet('villageSheet');bind('#bigStart',hunt);bind('#navHunt',hunt);
    const bottomHome=q('.bottom button');if(bottomHome)bottomHome.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    if(q('#nameInput'))q('#nameInput').value=userName();
    bind('#saveName',()=>{const n=(q('#nameInput')?.value||'').trim().slice(0,20);if(n.length<2)return;localStorage.setItem('snazzleName',n);closeSheet('profileSheet');ensureCurrentHome();});
    bind('#finishOnboarding',()=>{const n=(q('#firstNameInput')?.value||'').trim().slice(0,20);if(n.length<2)return;localStorage.setItem('snazzleName',n);q('#onboarding')?.classList.remove('show');ensureCurrentHome();});
    if(userName())q('#onboarding')?.classList.remove('show');
  }catch(err){console.warn('Snazzle v94 controls',err);}
}

function initShell(){
  if(window.__snazzleShellV94Ready)return;
  // Menu eerst. Zelfs als een home-transformatie faalt blijft de bediening werken.
  installShellStyles();
  installQuickMenu();
  bindBaseControls();
  ensureFallbackVillages();
  ensureCurrentHome();
  document.body?.classList.add('sn-shell-ready');
  document.documentElement.dataset.snazzleShell='v94';
  window.__snazzleShellV94Ready=true;
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initShell,{once:true});else initShell();

export {initShell,ensureCurrentHome,openQuickMenu};
