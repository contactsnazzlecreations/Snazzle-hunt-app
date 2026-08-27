// Snazzle v129 — vijf compacte hoofdgroepen zonder bestaande functies te herschrijven.
// Bestaande menu-knoppen worden alleen verplaatst; hun eigen click-handlers blijven intact.

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

  // Veiligheid en ouderfuncties horen bewust onder Profiel & Ouders: zo blijven er vijf hoofdknoppen.
  if(/ouder|parent|veilig|safety|privacy|toestemming|locatie.*uitleg/.test(text)) return 'profile';
  // Spelen eerst controleren: "luister" bevat de letters "ster" en werd anders foutief als collectie gezien.
  if(/spel|game|bieb|boek|lees|luister|audio|verhaal|story|wereld|world|avontuur|mission|missie/.test(text)) return 'play';
  if(/collect|kaart|card|vondst|finding|badge|beloning|reward|\bster(?:ren)?\b/.test(text)) return 'collection';
  if(/profiel|profile|vriend|friend|shop|winkel|account/.test(text)) return 'profile';
  if(/hunt|zoeken|zoek|\bar\b|camera|route|dorp|village|kaart zoeken|gps/.test(text)) return 'search';
  if(/home|nieuws|news|evenement|event|actie|poster/.test(text)) return 'home';
  return 'home';
}

function injectStyles(){
  if(document.getElementById('snMainMenuV129Style')) return;
  const s=document.createElement('style');
  s.id='snMainMenuV129Style';
  s.textContent=`
    #snMainMenuV129{display:grid;gap:8px}
    #quickMenuPanel .quick-menu-note{margin-bottom:9px}
    #quickMenuPanel .quick-menu-list{display:block!important}
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
    @media(max-width:360px){#quickMenuPanel .sn-main-category{min-height:61px;grid-template-columns:39px 1fr 20px;padding:7px 8px}.sn-main-options{margin-left:17px;padding-left:8px}}
  `;
  document.head.appendChild(s);
}

function makeFallbackSafetyButton(){
  const b=document.createElement('button');
  b.type='button';
  b.id='snSafetyParentsFallbackV129';
  b.innerHTML='<b>🛡️</b><span><strong>Veiligheid & ouders</strong><small>Open de bestaande ouder- en privacy-informatie</small></span><i>›</i>';
  b.addEventListener('click',()=>{
    const candidates=[...document.querySelectorAll('button,a')].filter(el=>el!==b && !el.closest('#snMainMenuV129'));
    const target=candidates.find(el=>/ouder|parent|veilig|privacy/i.test(buttonText(el)));
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

  // Een eventueel eerder gegroepeerd v128-menu eerst terugbrengen naar de bestaande lijst.
  const oldRoot=document.getElementById('snMainMenuV128');
  if(oldRoot){
    oldRoot.querySelectorAll('.sn-main-options>button').forEach(btn=>list.appendChild(btn));
    oldRoot.remove();
  }

  let root=document.getElementById('snMainMenuV129');
  if(!root){
    root=document.createElement('div');
    root.id='snMainMenuV129';
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
    if(!btn || btn.closest('#snMainMenuV129')) return;
    if(btn.classList.contains('quick-menu-admin')) return;
    const key=classifyButton(btn);
    const box=root.querySelector(`[data-options="${key}"]`);
    if(box) box.appendChild(btn);
  };

  [...list.children].forEach(el=>{if(el.tagName==='BUTTON')moveButton(el);});

  // Ook knoppen die door laat ladende modules worden toegevoegd, komen automatisch in de juiste groep.
  if(!list.__snMainObserverV129){
    const obs=new MutationObserver(records=>{
      records.forEach(r=>[...r.addedNodes].forEach(node=>{
        if(node.nodeType===1 && node.tagName==='BUTTON' && node.parentElement===list) moveButton(node);
      }));
      ensureSafetyEntry(root);
    });
    obs.observe(list,{childList:true});
    list.__snMainObserverV129=obs;
  }

  ensureSafetyEntry(root);
  return true;
}

function ensureSafetyEntry(root){
  const box=root?.querySelector('[data-options="profile"]');
  if(!box) return;
  const hasSafety=[...box.querySelectorAll('button,a')].some(el=>/ouder|parent|veilig|safety|privacy/i.test(buttonText(el)));
  if(!hasSafety) box.appendChild(makeFallbackSafetyButton());
}

function boot(){
  if(install()) return;
  let tries=0;
  const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer);},150);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();

window.SnazzleMainMenuV129={install};