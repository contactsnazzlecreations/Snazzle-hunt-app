// Snazzle Final Polish v59
// Laatste UX-/kwaliteitslaag. Raakt geen Firebase-auth, beheerrechten of opslagregels aan.

const V59='59';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const safeJSON=(raw,fallback=null)=>{try{return JSON.parse(raw)}catch{return fallback}};
const text=(el)=>String(el?.textContent||'').trim();

let bootDone=false;
let offlineTimer=null;
let mediaObserver=null;

function finishBoot(){
  if(bootDone) return;
  bootDone=true;
  document.body?.classList.remove('sn-v59-booting');
  document.body?.classList.add('sn-v59-ready');
  const splash=q('#snV59Boot');
  if(splash){
    splash.classList.add('hide');
    setTimeout(()=>splash.remove(),340);
  }
}

function installMeta(){
  const ensureMeta=(name,content)=>{
    if(document.head.querySelector(`meta[name="${name}"]`)) return;
    const m=document.createElement('meta');m.name=name;m.content=content;document.head.appendChild(m);
  };
  ensureMeta('application-name','Snazzle Hunt');
  ensureMeta('format-detection','telephone=no');
  ensureMeta('color-scheme','light dark');
  document.documentElement.dataset.snazzleFinalPolish=V59;
}

function friendlyMessage(raw){
  const original=String(raw||'').trim();
  if(!original) return original;
  if(/permission-denied|missing or insufficient permissions|firestore.*permission/i.test(original)){
    return 'Dat lukt nu even niet. Probeer het nog eens; als het blijft gebeuren kan Beheer de instelling controleren.';
  }
  if(/network|failed to fetch|offline|unavailable|network-request-failed/i.test(original)){
    return 'De verbinding is even weg. Reeds geladen informatie blijft waar mogelijk zichtbaar.';
  }
  if(/auth\/invalid|invalid-credential|wrong-password|user-not-found/i.test(original)){
    return 'Inloggen lukt niet. Controleer het e-mailadres en wachtwoord.';
  }
  if(/quota|resource-exhausted/i.test(original)){
    return 'Snazzle is tijdelijk erg druk. Probeer het over een moment opnieuw.';
  }
  return original;
}

function installFriendlyErrors(){
  const toast=q('#toast');
  if(!toast||toast.dataset.sn59Errors==='1') return;
  toast.dataset.sn59Errors='1';
  let rewriting=false;
  const normalize=()=>{
    if(rewriting) return;
    const before=text(toast),after=friendlyMessage(before);
    if(after&&after!==before){
      rewriting=true;toast.textContent=after;rewriting=false;
    }
  };
  new MutationObserver(normalize).observe(toast,{childList:true,subtree:true,characterData:true});
  normalize();
}

function mediaShell(img){
  return img.closest('.photo,.home-card,.sn-news-photos,.logo,.proof-preview,.image-preview,.sn-character-card')||img.parentElement;
}
function markImage(img){
  if(!img||img.dataset.sn59Media==='1') return;
  img.dataset.sn59Media='1';
  img.classList.add('sn59-media');
  img.decoding='async';
  const shell=mediaShell(img);
  const loading=()=>{
    if(!img.getAttribute('src')) return;
    img.classList.remove('sn59-loaded');img.classList.add('sn59-loading');
    shell?.classList.add('sn59-media-shell','sn59-waiting');
  };
  const loaded=()=>{
    img.classList.remove('sn59-loading');img.classList.add('sn59-loaded');
    shell?.classList.remove('sn59-waiting');
  };
  img.addEventListener('load',loaded,{passive:true});
  img.addEventListener('error',loaded,{passive:true});
  if(img.complete&&img.naturalWidth>0) loaded(); else loading();
  new MutationObserver(()=>{if(img.getAttribute('src')) loading();else loaded();}).observe(img,{attributes:true,attributeFilter:['src']});
}
function installMediaPolish(){
  qa('img').forEach(markImage);
  if(mediaObserver) return;
  mediaObserver=new MutationObserver(records=>{
    for(const r of records){
      r.addedNodes.forEach(n=>{
        if(n.nodeType!==1) return;
        if(n.matches?.('img')) markImage(n);
        qa('img',n).forEach(markImage);
      });
    }
  });
  mediaObserver.observe(document.body,{childList:true,subtree:true});
}

const SHEET_NAV={huntSheet:'navHunt',villageSheet:'navHunt',friendsSheet:'navFriends',shopSheet:'navShop',profileSheet:'navProfile',findsSheet:'navProfile'};
function updateNavigation(){
  const buttons=qa('.bottom button');
  buttons.forEach(b=>{b.classList.remove('sn59-nav-active');b.removeAttribute('aria-current');});
  let activeId='navHome';
  for(const [sheetId,navId] of Object.entries(SHEET_NAV)){
    if(q('#'+sheetId)?.classList.contains('show')){activeId=navId;break;}
  }
  const active=q('#'+activeId);
  if(active){active.classList.add('sn59-nav-active');active.setAttribute('aria-current','page');}
}
function installNavigationState(){
  const sheets=qa('.sheet');
  sheets.forEach(s=>{
    if(s.dataset.sn59Nav==='1') return;
    s.dataset.sn59Nav='1';
    new MutationObserver(updateNavigation).observe(s,{attributes:true,attributeFilter:['class']});
  });
  qa('.bottom button').forEach(b=>{
    if(b.dataset.sn59NavClick==='1') return;b.dataset.sn59NavClick='1';
    b.addEventListener('click',()=>setTimeout(updateNavigation,30),{passive:true});
  });
  updateNavigation();
}

function huntState(){
  const start=q('#startBtn'),found=q('#foundBtn');
  const active=!!start&&!start.disabled;
  if(!active) return {key:'idle',label:'Geen actieve Hunt',mini:'Kies een dorp of kijk later nog eens'};
  if(found?.classList.contains('done')) return {key:'done',label:'Gevonden',mini:'Avontuur voltooid'};
  if(found?.classList.contains('ready')) return {key:'ready',label:'Foto klaar',mini:'Bevestig de vondst'};
  const joined=/✅|zoek mee/i.test(text(start));
  if(joined) return {key:'searching',label:'Je zoekt mee',mini:'Veel succes buiten'};
  return {key:'live',label:'Hunt is live',mini:'Start wanneer je wilt'};
}
function ensureHuntStatus(){
  const body=q('.huntbody');if(!body) return;
  if(!q('#sn59HuntStatus',body)){
    const row=document.createElement('div');row.id='sn59HuntStatus';row.className='sn59-hunt-status-row';
    row.innerHTML='<span id="sn59HuntBadge" class="sn59-hunt-badge">Hunt</span><span id="sn59HuntMini" class="sn59-hunt-mini"></span>';
    const title=q('h3',body); if(title) title.insertAdjacentElement('beforebegin',row); else body.prepend(row);
  }
  updateHuntStatus();
}
function updateHuntStatus(){
  const state=huntState(),badge=q('#sn59HuntBadge'),mini=q('#sn59HuntMini');
  if(!badge) return;
  badge.className='sn59-hunt-badge '+state.key;badge.textContent=state.label;
  if(mini) mini.textContent=state.mini;
}
function flashAdventure(){
  const hunt=q('.hunt');if(!hunt) return;
  hunt.classList.remove('sn59-adventure-flash');void hunt.offsetWidth;hunt.classList.add('sn59-adventure-flash');
  setTimeout(()=>hunt.classList.remove('sn59-adventure-flash'),760);
}
function installHuntPolish(){
  ensureHuntStatus();
  ['#startBtn','#foundBtn','#huntTitle','#proofPreview'].forEach(sel=>{
    const el=q(sel);if(!el||el.dataset.sn59HuntObserved==='1') return;
    el.dataset.sn59HuntObserved='1';
    new MutationObserver(()=>{updateHuntStatus();saveOfflineSnapshot();}).observe(el,{attributes:true,childList:true,subtree:true,characterData:true});
  });
  const start=q('#startBtn');
  if(start&&start.dataset.sn59StartClick!=='1'){
    start.dataset.sn59StartClick='1';start.addEventListener('click',()=>setTimeout(()=>{updateHuntStatus();flashAdventure();},120),{passive:true});
  }
  const proof=q('#proofInput');
  if(proof&&proof.dataset.sn59Proof!=='1'){
    proof.dataset.sn59Proof='1';proof.addEventListener('change',()=>setTimeout(updateHuntStatus,180),{passive:true});
  }
}

function parentStatusText(){
  const secure=location.protocol==='https:';
  const online=navigator.onLine;
  return {secure,online};
}
function installParentExtras(){
  const panel=q('.sn-parent-panel');if(!panel) return;
  if(!q('#sn59ParentSafety',panel)){
    const box=document.createElement('div');box.id='sn59ParentSafety';box.className='sn59-parent-safety';
    box.innerHTML=`<h3>Veilige speelafspraken</h3>
      <div class="sn59-parent-check"><b>✓</b><span>Ga met jonge kinderen samen op pad en blijf op openbare, veilige plekken.</span></div>
      <div class="sn59-parent-check"><b>✓</b><span>Upload bij een vondst liefst alleen de Snazzle en geen herkenbare gezichten.</span></div>
      <div class="sn59-parent-check"><b>✓</b><span>Bestellingen en privacyverzoeken horen bij een ouder of verzorger.</span></div>
      <div class="sn59-tech-status" id="sn59TechStatus"></div>`;
    const privacyTitle=qa('.sn-parent-title',panel).find(el=>/privacy/i.test(text(el)));
    if(privacyTitle) privacyTitle.insertAdjacentElement('beforebegin',box); else panel.appendChild(box);
  }
  const s=parentStatusText(),status=q('#sn59TechStatus');
  if(status) status.innerHTML=`
    <div class="sn59-tech-chip"><b>${s.secure?'✓ HTTPS':'!'}</b>Beveiligde verbinding</div>
    <div class="sn59-tech-chip"><b>${s.online?'✓ Online':'○ Offline'}</b>Verbindingsstatus</div>
    <div class="sn59-tech-chip"><b>v${V59}</b>Final polish</div>`;
}

function newsReadTime(){
  const page=q('#snNewsPage'),node=q('#sn59NewsReadTime');if(!page||!node) return;
  const words=text(page).split(/\s+/).filter(Boolean).length;
  const mins=Math.max(1,Math.ceil(words/190));
  node.textContent=`± ${mins} min lezen`;
}
function installNewsReadingPolish(){
  const top=q('.sn-news-topbar');
  if(top&&!q('#sn59NewsReadTime',top)){
    const t=document.createElement('span');t.id='sn59NewsReadTime';t.className='sn-news-readtime';t.textContent='± 1 min lezen';
    const close=q('#snNewsClose',top);if(close) top.insertBefore(t,close);else top.appendChild(t);
  }
  const page=q('#snNewsPage');
  if(page&&page.dataset.sn59Read!=='1'){
    page.dataset.sn59Read='1';page.tabIndex=0;page.classList.add('sn59-page-focus');
    page.setAttribute('aria-label','Krantenpagina');
    new MutationObserver(newsReadTime).observe(page,{childList:true,subtree:true,characterData:true});
  }
  const overlay=q('#snNewsOverlay');
  if(overlay&&overlay.dataset.sn59Focus!=='1'){
    overlay.dataset.sn59Focus='1';
    new MutationObserver(()=>{
      if(overlay.classList.contains('show')) setTimeout(()=>{newsReadTime();q('#snNewsPage')?.focus({preventScroll:true});},140);
    }).observe(overlay,{attributes:true,attributeFilter:['class']});
  }
  newsReadTime();
}

function currentHuntSnapshot(){
  const title=text(q('#huntTitle'));
  const village=text(q('#huntVillage'))||text(q('#chosenVillageLabel'));
  const description=text(q('#huntDescription'));
  const hint=text(q('#hintBox'));
  if(!title||/binnenkort|geen actieve|geen hunt/i.test(title)) return null;
  return {title,village,description,hint,savedAt:new Date().toISOString()};
}
function saveOfflineSnapshot(){
  if(!navigator.onLine) return;
  const snap=currentHuntSnapshot();if(!snap) return;
  try{localStorage.setItem('snazzleLastReadableHunt',JSON.stringify(snap));}catch{}
}
function cachedSnapshot(){
  try{return safeJSON(localStorage.getItem('snazzleLastReadableHunt'),null)}catch{return null}
}
function formatSaved(iso){
  try{return new Intl.DateTimeFormat('nl-NL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));}catch{return ''}
}
function renderOfflineSnapshot(){
  clearTimeout(offlineTimer);
  const existing=q('#sn59OfflineCard');
  if(navigator.onLine){existing?.remove();return;}
  const snap=cachedSnapshot();if(!snap||existing) return;
  const hunt=q('.hunt');if(!hunt) return;
  const card=document.createElement('section');card.id='sn59OfflineCard';card.className='sn59-offline-card';card.setAttribute('role','status');
  const clean=s=>String(s||'').replace(/[<>]/g,'');
  card.innerHTML=`<div class="sn59-offline-top"><strong>📴 Offline noodweergave</strong><span class="stamp">Laatst bewaard ${formatSaved(snap.savedAt)}</span></div>
    <h3>${clean(snap.title)}</h3><p>${clean(snap.village)}</p><p>${clean(snap.description)}</p>${snap.hint?`<p>${clean(snap.hint)}</p>`:''}
    <small>Dit is alleen de laatst opgeslagen informatie op dit toestel. Starten, bevestigen en nieuwe gegevens ophalen kan pas weer met internet.</small>`;
  hunt.insertAdjacentElement('beforebegin',card);
}
function installOfflineSupport(){
  saveOfflineSnapshot();renderOfflineSnapshot();
  window.addEventListener('online',()=>{saveOfflineSnapshot();renderOfflineSnapshot();installParentExtras();},{passive:true});
  window.addEventListener('offline',()=>{renderOfflineSnapshot();installParentExtras();},{passive:true});
  const hunt=q('.hunt');
  if(hunt&&hunt.dataset.sn59Cache!=='1'){
    hunt.dataset.sn59Cache='1';
    new MutationObserver(()=>{clearTimeout(offlineTimer);offlineTimer=setTimeout(()=>{saveOfflineSnapshot();renderOfflineSnapshot();},120);}).observe(hunt,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','src']});
  }
}

function installQualitySignals(){
  // Geen extra analytics of tracking: alleen lokale UX-status.
  const allButtons=qa('button');
  allButtons.forEach(b=>{
    if(!b.hasAttribute('type')) b.type='button';
    if(!b.disabled&&b.getBoundingClientRect().height>0&&b.getBoundingClientRect().height<40) b.classList.add('sn59-small-target');
  });
  const live=q('#toast');if(live){live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');}
}

let installQueued=false;
function installAll(){
  if(installQueued) return;installQueued=true;
  requestAnimationFrame(()=>{
    installQueued=false;
    installFriendlyErrors();
    installMediaPolish();
    installNavigationState();
    installHuntPolish();
    installParentExtras();
    installNewsReadingPolish();
    installOfflineSupport();
    installQualitySignals();
  });
}

function start(){
  installMeta();
  installAll();
  const bodyObserver=new MutationObserver(installAll);
  bodyObserver.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')installAll();});
  window.addEventListener('pageshow',installAll,{passive:true});

  // Laat minimaal heel kort de merkintro zien, maar nooit als blokkade.
  setTimeout(finishBoot,520);
  setTimeout(finishBoot,1800);
}

start();
window.SnazzleFinalPolishV59={version:V59,refresh:installAll,finishBoot};
