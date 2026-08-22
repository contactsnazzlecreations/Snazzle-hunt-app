from pathlib import Path

path = Path('app.js')
text = path.read_text(encoding='utf-8')
marker = 'function ensureQuickMenu()'
if marker in text:
    print('Quick menu already present')
    raise SystemExit(0)

insert_before = 'function renderHome(){'
if insert_before not in text:
    raise SystemExit('renderHome marker not found')

code = r'''
function ensureQuickMenu(){
  const existing=$('#quickMenuPanel');
  if(existing){
    const village=$('#quickMenuVillage');
    if(village) village.textContent='📍 '+selectedVillage;
    return;
  }

  // Replace the separate admin lock in the header with one clear menu button.
  const oldAdmin=$('#adminBtn');
  if(oldAdmin) oldAdmin.style.display='none';

  const top=document.querySelector('.top');
  if(!top) return;

  const menuBtn=document.createElement('button');
  menuBtn.id='quickMenuBtn';
  menuBtn.className='quick-menu-btn';
  menuBtn.type='button';
  menuBtn.setAttribute('aria-label','Snelmenu openen');
  menuBtn.setAttribute('aria-expanded','false');
  menuBtn.innerHTML='<span aria-hidden="true">☰</span>';
  top.appendChild(menuBtn);

  const overlay=document.createElement('div');
  overlay.id='quickMenuOverlay';
  overlay.className='quick-menu-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`
    <aside id="quickMenuPanel" class="quick-menu-panel" role="dialog" aria-modal="true" aria-label="Snazzle snelmenu">
      <div class="quick-menu-head">
        <div class="quick-menu-brand"><span class="quick-menu-duck">🦆</span><div><strong>Snazzle Menu</strong><small id="quickMenuVillage">📍 ${esc(selectedVillage)}</small></div></div>
        <button id="quickMenuClose" class="quick-menu-close" type="button" aria-label="Menu sluiten">×</button>
      </div>
      <div class="quick-menu-note">Waar wil je naartoe?</div>
      <nav class="quick-menu-list" aria-label="Snelmenu">
        <button type="button" data-quick-action="home"><b>🏠</b><span><strong>Home</strong><small>Terug naar het begin</small></span><i>›</i></button>
        <button type="button" data-quick-action="hunt"><b>🔎</b><span><strong>Hunt zoeken</strong><small>Bekijk de actieve Snazzle Hunt</small></span><i>›</i></button>
        <button type="button" data-quick-action="village"><b>📍</b><span><strong>Kies je dorp</strong><small>Ga snel naar de dorpskeuze</small></span><i>›</i></button>
        <button type="button" data-quick-action="friends"><b>👥</b><span><strong>Vrienden</strong><small>Bekijk actieve Snazzlers</small></span><i>›</i></button>
        <button type="button" data-quick-action="findings"><b>🏆</b><span><strong>Mijn vondsten</strong><small>Jouw gevonden hunts</small></span><i>›</i></button>
        <button type="button" data-quick-action="event"><b>🎉</b><span><strong>Actie & evenement</strong><small>Open de actuele poster</small></span><i>›</i></button>
        <button type="button" data-quick-action="shop"><b>🛍️</b><span><strong>Shop</strong><small>Bekijk Snazzle items</small></span><i>›</i></button>
        <button type="button" data-quick-action="profile"><b>👤</b><span><strong>Mijn profiel</strong><small>Naam of nickname aanpassen</small></span><i>›</i></button>
      </nav>
      <button type="button" class="quick-menu-admin" data-quick-action="admin"><span>🔒</span><strong>Beheer</strong><small>Voor Snazzle beheerders</small></button>
      <div class="quick-menu-footer">Samen naar buiten 🌿</div>
    </aside>`;
  document.body.appendChild(overlay);

  const style=document.createElement('style');
  style.id='quickMenuStyles';
  style.textContent=`
    .quick-menu-btn{width:54px;height:54px;flex:0 0 54px;border-radius:18px;border:3px solid #8a6539;background:linear-gradient(145deg,#4f8f3f,#285e35);color:#fff7df;font-size:29px;font-weight:1000;display:grid;place-items:center;box-shadow:0 5px 0 #4a2e1b,0 8px 18px rgba(0,0,0,.2);position:relative;overflow:hidden}
    .quick-menu-btn:after{content:"";position:absolute;inset:-40%;background:linear-gradient(110deg,transparent 42%,rgba(255,255,255,.25) 50%,transparent 58%);transform:translateX(-70%);animation:quickMenuShine 5s ease-in-out infinite;pointer-events:none}
    .quick-menu-overlay{position:fixed;inset:0;z-index:5000;background:rgba(3,16,8,.68);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .22s ease,visibility .22s ease;display:flex;justify-content:flex-end}
    .quick-menu-overlay.show{opacity:1;visibility:visible}
    .quick-menu-panel{width:min(88vw,390px);height:100%;overflow:auto;padding:calc(18px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));background:linear-gradient(180deg,#175e35 0%,#0b472b 58%,#07351f 100%);border-left:4px solid #8c6236;box-shadow:-14px 0 38px rgba(0,0,0,.38);transform:translateX(105%);transition:transform .26s cubic-bezier(.2,.8,.2,1);color:#fff7df}
    .quick-menu-overlay.show .quick-menu-panel{transform:translateX(0)}
    .quick-menu-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 1px 16px;border-bottom:2px solid rgba(255,218,112,.22)}
    .quick-menu-brand{display:flex;align-items:center;gap:11px;min-width:0}.quick-menu-duck{width:51px;height:51px;flex:0 0 51px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#ffe36a,#ffb82f);border:3px solid #754720;font-size:26px;box-shadow:0 4px 0 #4a2b17}
    .quick-menu-brand strong{display:block;color:#ffd348;font-size:22px;line-height:1.05;text-shadow:0 2px rgba(0,0,0,.25)}.quick-menu-brand small{display:block;margin-top:5px;color:#c9ef8a;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:205px}
    .quick-menu-close{width:45px;height:45px;flex:0 0 45px;border:0;border-radius:14px;background:#744528;color:white;font-size:27px;font-weight:900;box-shadow:0 4px 0 #432618}
    .quick-menu-note{margin:14px 3px 10px;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:1.2px;color:#c9ef8a}
    .quick-menu-list{display:grid;gap:8px}.quick-menu-list button{width:100%;min-height:67px;border:2px solid rgba(255,224,147,.22);border-radius:17px;background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.055));color:#fff7df;padding:9px 11px;display:grid;grid-template-columns:42px 1fr 20px;align-items:center;gap:9px;text-align:left;box-shadow:0 4px 9px rgba(0,0,0,.12)}
    .quick-menu-list button>b{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:rgba(255,223,116,.13);font-size:23px}.quick-menu-list button span{min-width:0}.quick-menu-list button strong{display:block;font-size:16px;line-height:1.12}.quick-menu-list button small{display:block;margin-top:3px;font-size:11px;color:#d6e8bd;font-weight:720;line-height:1.25}.quick-menu-list button>i{font-style:normal;font-size:30px;color:#ffd34b;font-weight:500;text-align:center}
    .quick-menu-list button:active{background:rgba(255,211,75,.18)}
    .quick-menu-admin{width:100%;margin-top:14px;border:2px solid #9b7144;border-radius:17px;background:linear-gradient(135deg,#6b4329,#4b2d1d);color:#fff2d4;padding:12px;display:grid;grid-template-columns:42px 1fr;column-gap:8px;text-align:left;box-shadow:0 4px 0 #352117}.quick-menu-admin>span{grid-row:1/3;font-size:24px;align-self:center}.quick-menu-admin strong{font-size:15px}.quick-menu-admin small{font-size:10px;color:#dfc7a5;font-weight:700}
    .quick-menu-footer{text-align:center;color:#a9dc72;font-size:11px;font-weight:900;margin:18px 0 2px;letter-spacing:.4px}
    @keyframes quickMenuShine{0%,65%,100%{transform:translateX(-75%)}78%{transform:translateX(75%)}}
    @media(prefers-reduced-motion:reduce){.quick-menu-btn:after{animation:none}.quick-menu-panel,.quick-menu-overlay{transition:none}}
  `;
  document.head.appendChild(style);

  const openMenu=()=>{
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    menuBtn.setAttribute('aria-expanded','true');
    const village=$('#quickMenuVillage'); if(village) village.textContent='📍 '+selectedVillage;
    document.documentElement.style.overflow='hidden'; document.body.style.overflow='hidden';
  };
  const closeMenu=()=>{
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-expanded','false');
    document.documentElement.style.overflow=''; document.body.style.overflow='';
  };
  menuBtn.onclick=openMenu;
  $('#quickMenuClose').onclick=closeMenu;
  overlay.addEventListener('click',e=>{ if(e.target===overlay) closeMenu(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && overlay.classList.contains('show')) closeMenu(); });

  $$('#quickMenuPanel [data-quick-action]').forEach(btn=>btn.onclick=async()=>{
    const action=btn.dataset.quickAction;
    closeMenu();
    if(action==='home'){ window.scrollTo({top:0,behavior:'smooth'}); return; }
    if(action==='hunt'){
      if(activeHunt()) openSheet('huntSheet');
      else { renderVillagePage(selectedVillage); openSheet('villageSheet'); }
      return;
    }
    if(action==='village'){
      const target=document.querySelector('.villages') || document.querySelector('.section-head');
      if(target) setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'center'}),80);
      return;
    }
    if(action==='friends'){ await touchPublicProfile(); renderFriends(); openSheet('friendsSheet'); return; }
    if(action==='findings'){ renderFindings(); openSheet('findsSheet'); return; }
    if(action==='event'){ setTimeout(()=>openEventPoster(),80); return; }
    if(action==='shop'){ openSheet('shopSheet'); return; }
    if(action==='profile'){ openSheet('profileSheet'); return; }
    if(action==='admin'){ if(adminProfile) openSheet('adminSheet'); else openSheet('adminLogin'); }
  });
}

'''

text = text.replace(insert_before, code + insert_before, 1)
old = "function renderHome(){ applyName(); renderLocalImages(); renderVillages(); renderActive(); renderFindings(); renderFriends(); renderAdmin(); ensureEventPosterViewer(); bindEventPosterClicks(); }"
new = "function renderHome(){ applyName(); renderLocalImages(); renderVillages(); renderActive(); renderFindings(); renderFriends(); renderAdmin(); ensureEventPosterViewer(); bindEventPosterClicks(); ensureQuickMenu(); }"
if old not in text:
    raise SystemExit('Current renderHome signature not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('Added Snazzle quick menu')
