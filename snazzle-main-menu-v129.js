// Snazzle v129.2 — vijf compacte hoofdgroepen, zonder bestaande menu-functies te verplaatsen.
// Belangrijk: originele quick-menu knoppen blijven directe kinderen van .quick-menu-list.
// Daardoor kunnen laat ladende modules (AR, Route, Bieb, Spel, kaarten, beloningen, enz.)
// hun bestaande knoppen veilig blijven invoegen. In de vijf hoofdgroepen tonen we klikbare spiegels.

const GROUPS=[
  {key:'home',icon:'🏠',title:'Home',sub:'Nieuws, dorp en acties'},
  {key:'search',icon:'🔎',title:'Zoeken',sub:'Hunt, AR en route'},
  {key:'play',icon:'🎮',title:'Spelen',sub:'Spel, Bieb en verhalen'},
  {key:'collection',icon:'🃏',title:'Mijn Snazzles',sub:'Kaarten, vondsten en beloningen'},
  {key:'profile',icon:'👤',title:'Profiel & Ouders',sub:'Profiel, vrienden, shop en veiligheid'}
];

const norm=v=>String(v||'').toLowerCase().replace(/\s+/g,' ').trim();

function buttonText(btn){
  return norm(`${btn?.id||''} ${btn?.className||''} ${btn?.dataset?.quickAction||''} ${btn?.getAttribute?.('aria-label')||''} ${btn?.textContent||''}`);
}

function classifyButton(btn){
  const text=buttonText(btn);

  // Veiligheid en ouderfuncties horen bewust onder Profiel & Ouders.
  if(/ouder|parent|veilig|safety|privacy|toestemming|locatie.*uitleg/.test(text)) return 'profile';
  // Spelen eerst controleren: "luister" bevat de letters "ster" en werd anders foutief als collectie gezien.
  if(/spel|game|bieb|boek|lees|luister|audio|verhaal|story|wereld|world|avontuur|mission|missie/.test(text)) return 'play';
  if(/collect|kaart|card|vondst|finding|badge|beloning|reward|\bster(?:ren)?\b/.test(text)) return 'collection';
  if(/profiel|profile|vriend|friend|shop|winkel|account/.test(text)) return 'profile';
  if(/hunt|zoeken|zoek|\bar\b|camera|route|speurtocht|dorp|village|kaart zoeken|gps/.test(text)) return 'search';
  if(/home|nieuws|news|evenement|event|actie|poster/.test(text)) return 'home';
  return 'home';
}

function optionRank(btn){
  const text=buttonText(btn);
  if(/home/.test(text)) return 10;
  if(/nieuws|news/.test(text)) return 20;
  if(/event|evenement|actie|poster/.test(text)) return 30;

  if(/hunt/.test(text)) return 10;
  if(/\bar\b|camera|real life/.test(text)) return 20;
  if(/route|speurtocht|gps/.test(text)) return 30;
  if(/dorp|village/.test(text)) return 40;

  if(/snazzle spel|spelletjes|\bgame\b/.test(text)) return 10;
  if(/bieb|boek|lees/.test(text)) return 20;
  if(/luister|audio|verhaal|story/.test(text)) return 30;
  if(/wereld|world|avontuur|mission|missie/.test(text)) return 40;

  if(/collect|kaart|card/.test(text)) return 10;
  if(/vondst|finding/.test(text)) return 20;
  if(/beloning|reward|badge|\bster(?:ren)?\b/.test(text)) return 30;

  if(/profiel|profile|account/.test(text)) return 10;
  if(/vriend|friend/.test(text)) return 20;
  if(/shop|winkel/.test(text)) return 30;
  if(/ouder|parent|veilig|safety|privacy|toestemming/.test(text)) return 40;
  return 90;
}

function injectStyles(){
  if(document.getElementById('snMainMenuV129Style')) return;
  const s=document.createElement('style');
  s.id='snMainMenuV129Style';
  s.textContent=`
    #snMainMenuV129{display:grid;gap:8px}
    #quickMenuPanel .quick-menu-note{margin-bottom:9px}
    #quickMenuPanel .quick-menu-list{display:block!important}
    #quickMenuPanel .sn-main-source{display:none!important}
    .sn-main-group{margin:0 0 8px}
    #quickMenuPanel .sn-main-category{width:100%;min-height:64px;border:2px solid rgba(255,224,147,.28);border-radius:17px;background:linear-gradient(135deg,rgba(255,255,255,.15),rgba(255,255,255,.07));color:#fff7df;padding:8px 10px;display:grid;grid-template-columns:42px 1fr 22px;align-items:center;gap:9px;text-align:left;box-shadow:0 4px 10px rgba(0,0,0,.13)}
    #quickMenuPanel .sn-main-category>b{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:rgba(255,216,91,.16);font-size:23px}
    #quickMenuPanel .sn-main-category span{min-width:0}
    #quickMenuPanel .sn-main-category strong{display:block;font-size:15.5px;line-height:1.08}
    #quickMenuPanel .sn-main-category small{display:block;margin-top:3px;font-size:10px;color:#d7ebbd;font-weight:760;line-height:1.22}
    #quickMenuPanel .sn-main-category i{font-style:normal;font-size:23px;color:#ffd34b;text-align:center;transition:transform .18s ease}
    #quickMenuPanel .sn-main-group.open>.sn-main-category{background:linear-gradient(135deg,rgba(255,211,75,.25),rgba(93,167,70,.18));border-color:rgba(255,220,111,.48)}
    #quickMenuPanel .sn-main-group.open>.sn-main-category i{transform:rotate(90deg)}
    .sn-main-options{display:none;padding:7px 0 1px 11px;margin-left:20px;border-left:2px solid rgba(255,215,92,.28)}
    .sn-main-group.open>.sn-main-options{display:grid;gap:6px}
    #quickMenuPanel .sn-main-options>button{min-height:54px!important;border-radius:14px!important;padding:7px 9px!important;grid-template-columns:36px 1fr 18px!important;background:linear-gradient(135deg,rgba(255,255,255,.09),rgba(255,255,255,.035))!important}
    #quickMenuPanel .sn-main-options>button>b{width:36px!important;height:36px!important;font-size:19px!important}
    #quickMenuPanel .sn-main-options>button strong{font-size:13.5px!important}
    #quickMenuPanel .sn-main-options>button small{font-size:9.8px!important}
    #quickMenuPanel .sn-main-options>button.sn-main-fallback{opacity:.9}
    @media(max-width:360px){#quickMenuPanel .sn-main-category{min-height:61px;grid-template-columns:39px 1fr 20px;padding:7px 8px}.sn-main-options{margin-left:17px;padding-left:8px}}
  `;
  document.head.appendChild(s);
}

function makeFallbackSafetyButton(){
  const b=document.createElement('button');
  b.type='button';
  b.id='snSafetyParentsFallbackV129';
  b.className='sn-main-fallback';
  b.innerHTML='<b>🛡️</b><span><strong>Veiligheid & ouders</strong><small>Ouder- en privacy-informatie</small></span><i>›</i>';
  b.addEventListener('click',()=>{
    const candidates=[...document.querySelectorAll('#quickMenuPanel .sn-main-source, button, a')]
      .filter(el=>el!==b && !el.closest('#snMainMenuV129'));
    const target=candidates.find(el=>/ouder|parent|veilig|privacy/i.test(buttonText(el)));
    if(target){ document.getElementById('quickMenuClose')?.click(); setTimeout(()=>target.click(),70); return; }
    const toast=document.getElementById('toast');
    if(toast){toast.textContent='Veiligheids- en ouderinformatie wordt geladen.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400);}
  });
  return b;
}

function createRoot(list){
  const root=document.createElement('div');
  root.id='snMainMenuV129';
  root.dataset.mode='mirror';
  root.setAttribute('aria-label','Snazzle hoofdmenu');

  GROUPS.forEach(g=>{
    const section=document.createElement('section');
    section.className='sn-main-group';
    section.dataset.group=g.key;
    section.innerHTML=`<button type="button" class="sn-main-category" aria-expanded="false"><b>${g.icon}</b><span><strong>${g.title}</strong><small>${g.sub}</small></span><i>›</i></button><div class="sn-main-options" data-options="${g.key}"></div>`;
    const head=section.querySelector('.sn-main-category');
    head.addEventListener('click',()=>{
      const willOpen=!section.classList.contains('open');
      root.querySelectorAll('.sn-main-group').forEach(x=>{
        x.classList.remove('open');
        x.querySelector('.sn-main-category')?.setAttribute('aria-expanded','false');
      });
      if(willOpen){
        section.classList.add('open');
        head.setAttribute('aria-expanded','true');
      }
    });
    root.appendChild(section);
  });

  list.prepend(root);
  return root;
}

function migrateOldGroupedMenu(list){
  const oldRoot=document.getElementById('snMainMenuV129') || document.getElementById('snMainMenuV128');
  if(!oldRoot) return;
  if(oldRoot.dataset?.mode==='mirror') return;

  [...oldRoot.querySelectorAll('.sn-main-options>button')].forEach(btn=>{
    if(btn.id==='snSafetyParentsFallbackV129') btn.remove();
    else list.appendChild(btn);
  });
  oldRoot.remove();
}

function makeProxy(source){
  const proxy=document.createElement('button');
  proxy.type='button';
  proxy.className='sn-main-proxy';
  proxy.dataset.sourceKey=source.__snMainKey;
  if(source.getAttribute('aria-label')) proxy.setAttribute('aria-label',source.getAttribute('aria-label'));
  proxy.innerHTML=source.innerHTML;
  proxy.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    if(!source.isConnected) return;
    source.click();
  });
  return proxy;
}

function placeProxy(source,root){
  if(!source || !root || !source.isConnected) return;
  if(!source.__snMainKey) source.__snMainKey=`sn-src-${Math.random().toString(36).slice(2)}-${Date.now()}`;

  const key=classifyButton(source);
  const box=root.querySelector(`[data-options="${key}"]`);
  if(!box) return;

  let proxy=root.querySelector(`.sn-main-proxy[data-source-key="${source.__snMainKey}"]`);
  if(!proxy){
    proxy=makeProxy(source);
  }
  proxy.dataset.rank=String(optionRank(source));

  const rank=Number(proxy.dataset.rank||90);
  const before=[...box.querySelectorAll('.sn-main-proxy')]
    .find(p=>p!==proxy && Number(p.dataset.rank||90)>rank);
  if(before) box.insertBefore(proxy,before); else box.appendChild(proxy);
}

function syncSources(list,root){
  const sources=[...list.children].filter(el=>
    el.tagName==='BUTTON' &&
    !el.classList.contains('quick-menu-admin') &&
    !el.classList.contains('sn-main-category') &&
    !el.classList.contains('sn-main-proxy')
  );

  const liveKeys=new Set();
  sources.forEach(source=>{
    source.classList.add('sn-main-source');
    placeProxy(source,root);
    if(source.__snMainKey) liveKeys.add(source.__snMainKey);
  });

  root.querySelectorAll('.sn-main-proxy').forEach(proxy=>{
    if(!liveKeys.has(proxy.dataset.sourceKey)) proxy.remove();
  });
  ensureSafetyEntry(root);
}

function ensureSafetyEntry(root){
  const box=root?.querySelector('[data-options="profile"]');
  if(!box) return;
  const hasSafety=[...box.querySelectorAll('.sn-main-proxy')].some(el=>/ouder|parent|veilig|safety|privacy/i.test(buttonText(el)));
  const fallback=box.querySelector('#snSafetyParentsFallbackV129');
  if(hasSafety){ fallback?.remove(); return; }
  if(!fallback) box.appendChild(makeFallbackSafetyButton());
}

function install(){
  const list=document.querySelector('#quickMenuPanel .quick-menu-list');
  if(!list) return false;
  injectStyles();
  migrateOldGroupedMenu(list);

  let root=document.getElementById('snMainMenuV129');
  if(!root) root=createRoot(list);

  syncSources(list,root);

  if(!list.__snMainObserverV129){
    let queued=false;
    const queueSync=()=>{
      if(queued) return;
      queued=true;
      queueMicrotask(()=>{queued=false;syncSources(list,root);});
    };
    const obs=new MutationObserver(queueSync);
    obs.observe(list,{childList:true,subtree:false});
    list.__snMainObserverV129=obs;
  }

  return true;
}

function boot(){
  if(install()) return;
  let tries=0;
  const timer=setInterval(()=>{tries++;if(install()||tries>60)clearInterval(timer);},150);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();

window.SnazzleMainMenuV129={install};
