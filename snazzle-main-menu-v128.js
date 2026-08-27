// Snazzle v128 — zes rustige hoofdgroepen zonder bestaande functies te herschrijven.
// Bestaande menu-knoppen worden alleen verplaatst; hun eigen click-handlers blijven intact.

const GROUPS=[
  {key:'home',icon:'🏠',title:'Home',sub:'Nieuws, dorp en acties'},
  {key:'search',icon:'🔎',title:'Zoeken',sub:'Hunt, AR en route'},
  {key:'play',icon:'🎮',title:'Spelen',sub:'Spel, Bieb en verhalen'},
  {key:'collection',icon:'🃏',title:'Mijn Snazzles',sub:'Kaarten, vondsten en beloningen'},
  {key:'profile',icon:'👤',title:'Profiel',sub:'Profiel, vrienden en shop'},
  {key:'safety',icon:'🛡️',title:'Veiligheid & Ouders',sub:'Veilig zoeken, privacy en ouders'}
];

const norm=v=>String(v||'').toLowerCase().replace(/\s+/g,' ').trim();

function classifyButton(btn){
  const text=norm(`${btn.id||''} ${btn.className||''} ${btn.dataset?.quickAction||''} ${btn.getAttribute('aria-label')||''} ${btn.textContent||''}`);

  if(/ouder|parent|veilig|safety|privacy|toestemming|locatie.*uitleg/.test(text)) return 'safety';
  if(/collect|kaart|card|vondst|finding|badge|beloning|reward|ster/.test(text)) return 'collection';
  if(/spel|game|bieb|boek|lees|luister|audio|verhaal|story|wereld|world|avontuur|mission|missie/.test(text)) return 'play';
  if(/profiel|profile|vriend|friend|shop|winkel|account/.test(text)) return 'profile';
  if(/hunt|zoeken|zoek|\bar\b|camera|route|dorp|village|kaart zoeken|gps/.test(text)) return 'search';
  if(/home|nieuws|news|evenement|event|actie|poster/.test(text)) return 'home';
  return 'home';
}

function injectStyles(){
  if(document.getElementById('snMainMenuV128Style')) return;
  const s=document.createElement('style');
  s.id='snMainMenuV128Style';
  s.textContent=`
    #snMainMenuV128{display:grid;gap:9px}
    #quickMenuPanel .quick-menu-note{margin-bottom:10px}
    #quickMenuPanel .quick-menu-list{display:block!important}
    .sn-main-group{margin:0 0 9px}
    #quickMenuPanel .sn-main-category{width:100%;min-height:70px;border:2px solid rgba(255,224,147,.28);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.15),rgba(255,255,255,.07));color:#fff7df;padding:10px 11px;display:grid;grid-template-columns:44px 1fr 24px;align-items:center;gap:10px;text-align:left;box-shadow:0 4px 10px rgba(0,0,0,.13)}
    #quickMenuPanel .sn-main-category>b{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:rgba(255,216,91,.16);font-size:24px}
    #quickMenuPanel .sn-main-category span{min-width:0}
    #quickMenuPanel .sn-main-category strong{display:block;font-size:16px;line-height:1.08}
    #quickMenuPanel .sn-main-category small{display:block;margin-top:4px;font-size:10.5px;color:#d7ebbd;font-weight:760;line-height:1.25}
    #quickMenuPanel .sn-main-category i{font-style:normal;font-size:24px;color:#ffd34b;text-align:center;transition:transform .18s ease}
    #quickMenuPanel .sn-main-group.open>.sn-main-category{background:linear-gradient(135deg,rgba(255,211,75,.25),rgba(93,167,70,.18));border-color:rgba(255,220,111,.48)}
    #quickMenuPanel .sn-main-group.open>.sn-main-category i{transform:rotate(90deg)}
    .sn-main-options{display:none;padding:8px 0 1px 12px;margin-left:21px;border-left:2px solid rgba(255,215,92,.28)}
    .sn-main-group.open>.sn-main-options{display:grid;gap:7px}
    #quickMenuPanel .sn-main-options>button{min-height:57px!important;border-radius:15px!important;padding:8px 10px!important;grid-template-columns:38px 1fr 18px!important;background:linear-gradient(135deg,rgba(255,255,255,.09),rgba(255,255,255,.035))!important}
    #quickMenuPanel .sn-main-options>button>b{width:38px!important;height:38px!important;font-size:20px!important}
    #quickMenuPanel .sn-main-options>button strong{font-size:14px!important}
    #quickMenuPanel .sn-main-options>button small{font-size:10px!important}
    .sn-main-empty{display:none}
    @media(max-width:360px){#quickMenuPanel .sn-main-category{min-height:65px;grid-template-columns:40px 1fr 20px;padding:8px 9px}.sn-main-options{margin-left:18px;padding-left:9px}}
  `;
  document.head.appendChild(s);
}

function makeFallbackSafetyButton(){
  const b=document.createElement('button');
  b.type='button';
  b.id='snSafetyParentsFallbackV128';
  b.innerHTML='<b>🛡️</b><span><strong>Veiligheid & ouders</strong><small>Open de bestaande ouder- en privacy-informatie</small></span><i>›</i>';
  b.addEventListener('click',()=>{
    const candidates=[...document.querySelectorAll('button,a')].filter(el=>el!==b && !el.closest('#snMainMenuV128'));
    const target=candidates.find(el=>/ouder|parent|veilig|privacy/i.test(`${el.id||''} ${el.className||''} ${el.getAttribute('aria-label')||''} ${el.textContent||''}`));
    if(target){ document.getElementById('quickMenuClose')?.click(); setTimeout(()=>target.click(),70); return; }
    const world=document.querySelector('.v38-world-entry');
    if(world){ document.getElementById('quickMenuClose')?.click(); setTimeout(()=>world.click(),70); return; }
    const toast=document.getElementById('toast');
    if(toast){toast.textContent='Veiligheids- en ouderinformatie wordt hier verzameld.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600);}
  });
  return b;
}

function install(){
  const list=document.querySelector('#quickMenuPanel .quick-menu-list');
  if(!list) return false;
  injectStyles();

  let root=document.getElementById('snMainMenuV128');
  if(!root){
    root=document.createElement('div');
    root.id='snMainMenuV128';
    root.setAttribute('aria-label','Snazzle hoofdmenu');
    GROUPS.forEach(g=>{
      const section=document.createElement('section');
      section.className='sn-main-group';section.dataset.group=g.key;
      section.innerHTML=`<button type="button" class="sn-main-category" aria-expanded="false"><b>${g.icon}</b><span><strong>${g.title}</strong><small>${g.sub}</small></span><i>›</i></button><div class="sn-main-options" data-options="${g.key}"></div>`;
      const head=section.querySelector('.sn-main-category');
      head.addEventListener('click',()=>{
        const willOpen=!section.classList.contains('open');
        root.querySelectorAll('.sn-main-group').forEach(x=>{x.classList.remove('open');x.querySelector('.sn-main-category')?.setAttribute('aria-expanded','false');});
        if(willOpen){section.classList.add('open');head.setAttribute('aria-expanded','true');}
      });
      root.appendChild(section);
    });
    list.prepend(root);
  }

  const moveButton=btn=>{
    if(!btn || btn.closest('#snMainMenuV128')) return;
    if(btn.classList.contains('quick-menu-admin')) return;
    const key=classifyButton(btn);
    const box=root.querySelector(`[data-options="${key}"]`);
    if(box) box.appendChild(btn);
  };

  [...list.children].forEach(el=>{if(el.tagName==='BUTTON')moveButton(el);});

  // Ook knoppen die door laat ladende modules worden toegevoegd, komen automatisch in de juiste groep.
  if(!list.__snMainObserverV128){
    const obs=new MutationObserver(records=>{
      records.forEach(r=>[...r.addedNodes].forEach(node=>{
        if(node.nodeType===1 && node.tagName==='BUTTON' && node.parentElement===list) moveButton(node);
      }));
      ensureSafetyEntry(root);
    });
    obs.observe(list,{childList:true});
    list.__snMainObserverV128=obs;
  }

  ensureSafetyEntry(root);
  return true;
}

function ensureSafetyEntry(root){
  const box=root?.querySelector('[data-options="safety"]');
  if(!box || box.children.length) return;
  box.appendChild(makeFallbackSafetyButton());
}

function boot(){
  if(install()) return;
  let tries=0;
  const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer);},150);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();

window.SnazzleMainMenuV128={install};
