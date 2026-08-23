// Snazzle dorpsbeheer snelkoppeling.
// Hoofdbeheerder kan vanuit Dorpen direct een uniek dorpsbeheeraccount instellen.

const VA_VERSION='1.0.0';
const $v=(s,r=document)=>r.querySelector(s);
const $$v=(s,r=document)=>[...r.querySelectorAll(s)];

function injectStyles(){
  if($v('#villageAccessStyles')) return;
  const style=document.createElement('style');
  style.id='villageAccessStyles';
  style.textContent=`
    #adminVillageList .listitem.village-access-card{cursor:pointer;position:relative;padding-right:50px;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
    #adminVillageList .listitem.village-access-card:after{content:'›';position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:34px;font-weight:900;color:#5e9539}
    #adminVillageList .listitem.village-access-card:active{transform:scale(.985)}
    #adminVillageList .listitem.village-access-card small{display:block;color:#5f7a3d;font-weight:900;font-size:11px;margin-top:2px}
    .village-access-flash{animation:villageAccessFlash .75s ease}
    @keyframes villageAccessFlash{0%,100%{box-shadow:none}40%{box-shadow:0 0 0 5px rgba(104,170,62,.25)}}
  `;
  document.head.appendChild(style);
}

function switchToAdmins(village){
  const tab=$v('[data-tab="adminsAdmin"]');
  const section=$v('#adminsAdmin');
  if(!tab||!section) return;
  $$v('[data-tab]').forEach(x=>x.classList.remove('on'));
  $$v('.admin-section').forEach(x=>x.classList.remove('on'));
  tab.classList.add('on');
  section.classList.add('on');
  const select=$v('#adminUserVillage');
  if(select){
    const option=[...select.options].find(o=>o.value===village);
    if(option) select.value=village;
  }
  section.classList.remove('village-access-flash');
  void section.offsetWidth;
  section.classList.add('village-access-flash');
  setTimeout(()=>{
    section.scrollIntoView({behavior:'smooth',block:'start'});
    $v('#adminUserEmail')?.focus({preventScroll:true});
  },80);
  const toast=$v('#toast');
  if(toast){
    toast.textContent=`🔐 Maak nu de unieke toegang voor ${village}`;
    toast.classList.add('show');
    clearTimeout(window.__villageAccessToast);
    window.__villageAccessToast=setTimeout(()=>toast.classList.remove('show'),3000);
  }
}

function enhanceVillageCards(){
  const list=$v('#adminVillageList');
  if(!list) return;
  [...list.children].forEach(card=>{
    if(card.dataset.villageAccessBound==='1') return;
    const strong=card.querySelector('strong');
    if(!strong) return;
    const village=strong.textContent.replace(/^\s*📍\s*/,'').trim();
    if(!village) return;
    card.dataset.villageAccessBound='1';
    card.classList.add('village-access-card');
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label',`Beheer toegang instellen voor ${village}`);
    const existing=card.querySelector('span');
    if(existing) existing.textContent='Dorpspagina actief · tik voor unieke beheer-toegang.';
    const small=document.createElement('small');
    small.textContent='🔐 Eigen e-mail + wachtwoord · alleen toegang tot dit dorp';
    card.appendChild(small);
    const open=()=>switchToAdmins(village);
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
}

function initVillageAccess(){
  if(window.__villageAccessLoaded) return;
  window.__villageAccessLoaded=true;
  injectStyles();
  enhanceVillageCards();
  const observer=new MutationObserver(enhanceVillageCards);
  observer.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initVillageAccess,{once:true}); else initVillageAccess();
console.info(`Snazzle village access ${VA_VERSION} geladen`);
