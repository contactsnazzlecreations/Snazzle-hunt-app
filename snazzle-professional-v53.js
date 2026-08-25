// Snazzle Professional Polish v53
// Centrale kwaliteitslaag: performance, toegankelijkheid, micro-interacties,
// oudercentrum, offline-status, hunt-flow, nieuwspolish en optionele geluiden.

const VERSION = '53';
const q = (s, root=document) => root.querySelector(s);
const qa = (s, root=document) => [...root.querySelectorAll(s)];
const pref = (key, fallback='') => localStorage.getItem(key) ?? fallback;
const setPref = (key, value) => localStorage.setItem(key, String(value));

let installQueued = false;
let netTimer = null;
let audioContext = null;
let foundCelebratePending = false;

function queueInstall(){
  if(installQueued) return;
  installQueued = true;
  requestAnimationFrame(()=>{
    installQueued = false;
    installA11y();
    installParentEntryPoints();
    installHuntJourney();
    installNewsPolish();
    optimizeImages();
    installFooter();
  });
}

function installMetaAndPerformance(){
  const head = document.head;
  const addLink = (rel, href, crossOrigin=false)=>{
    if(head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link=document.createElement('link'); link.rel=rel; link.href=href;
    if(crossOrigin) link.crossOrigin='anonymous';
    head.appendChild(link);
  };
  addLink('preconnect','https://www.gstatic.com',true);
  addLink('preconnect','https://firestore.googleapis.com',true);

  if(!head.querySelector('meta[name="description"]')){
    const m=document.createElement('meta');
    m.name='description';
    m.content='Snazzle Hunt — samen naar buiten voor magische speurtochten, verhalen en avonturen.';
    head.appendChild(m);
  }
  if(!head.querySelector('meta[name="mobile-web-app-capable"]')){
    const m=document.createElement('meta'); m.name='mobile-web-app-capable'; m.content='yes'; head.appendChild(m);
  }
  document.documentElement.dataset.snazzleProfessionalVersion=VERSION;
}

function installSplash(){
  if(sessionStorage.getItem('snazzleProSplashSeen')==='1') return;
  sessionStorage.setItem('snazzleProSplashSeen','1');
  const splash=document.createElement('div');
  splash.className='sn-pro-splash';
  splash.setAttribute('aria-hidden','true');
  splash.innerHTML=`<div class="sn-pro-splash-inner">
    <div class="sn-pro-splash-mark">🦆</div>
    <h1>Snazzle</h1>
    <p>Samen naar buiten</p>
    <div class="sn-pro-splash-stars">✦ ✧ ✦</div>
  </div>`;
  document.body.appendChild(splash);
  const remove=()=>{
    splash.classList.add('hide');
    setTimeout(()=>splash.remove(),420);
  };
  // Kort houden: een splash is sfeer, geen wachtscherm.
  setTimeout(remove,760);
}

function installNetworkBanner(){
  if(q('#snNetBanner')) return;
  const banner=document.createElement('div');
  banner.id='snNetBanner';
  banner.className='sn-net-banner';
  banner.setAttribute('role','status');
  banner.setAttribute('aria-live','polite');
  document.body.appendChild(banner);

  const show=(message, online=false, linger=3200)=>{
    clearTimeout(netTimer);
    banner.textContent=message;
    banner.classList.toggle('online',online);
    banner.classList.add('show');
    if(linger) netTimer=setTimeout(()=>banner.classList.remove('show'),linger);
  };
  const offline=()=>show('🌿 Geen internet. Reeds geladen inhoud blijft waar mogelijk zichtbaar; nieuwe gegevens kunnen even wachten.',false,0);
  const online=()=>show('✓ Verbinding hersteld — Snazzle is weer online.',true,2600);
  window.addEventListener('offline',offline);
  window.addEventListener('online',online);
  if(!navigator.onLine) offline();
  window.SnazzleNetworkStatus={show,offline,online};
}

function applyPreferences(){
  document.documentElement.classList.toggle('sn-reduced-motion',pref('snazzleReducedMotion','0')==='1');
  document.documentElement.classList.toggle('sn-large-text',pref('snazzleLargeText','0')==='1');
}

function openPrivacy(){
  if(window.SnazzlePrivacy?.open) return window.SnazzlePrivacy.open();
  window.open('./privacy.html','_blank','noopener,noreferrer');
}

function makeParentCenter(){
  if(q('#snParentOverlay')) return;
  const overlay=document.createElement('div');
  overlay.id='snParentOverlay';
  overlay.className='sn-parent-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`
    <section class="sn-parent-panel" role="dialog" aria-modal="true" aria-labelledby="snParentTitle">
      <div class="sn-parent-handle"></div>
      <div class="sn-parent-head">
        <div><h2 id="snParentTitle">Ouder & veiligheid</h2><p>Transparant, rustig en gezinsvriendelijk</p></div>
        <button type="button" class="sn-parent-close" id="snParentClose" aria-label="Sluiten">×</button>
      </div>
      <div class="sn-parent-hero">
        <strong>🛡️ Zo is Snazzle ontworpen</strong>
        We vragen gewone spelers niet om een e-mailadres, tonen geen advertenties en gebruiken geen exacte GPS-locatie. Gebruik voor kinderen liefst een nickname en speel samen met een ouder of verzorger.
      </div>
      <div class="sn-parent-grid">
        <div class="sn-parent-card"><b>📍 Locatie</b><span>Geen live GPS-tracking. Een gekozen dorp is geen exacte locatie.</span></div>
        <div class="sn-parent-card"><b>📷 Foto's</b><span>Alleen vrijwillig bij een vondst. Fotografeer liefst alleen de Snazzle, zonder herkenbare gezichten.</span></div>
        <div class="sn-parent-card"><b>🛍️ Shop</b><span>Een aanvraag is voor een ouder/verzorger. Betaling gebeurt niet rechtstreeks in de app.</span></div>
        <div class="sn-parent-card"><b>🌐 Internet</b><span>Bij wegvallend internet blijft reeds geladen inhoud waar mogelijk staan; nieuwe gegevens hebben verbinding nodig.</span></div>
      </div>

      <div class="sn-parent-title">Comfort</div>
      <div class="sn-parent-setting">
        <div><strong>✨ Minder beweging</strong><small>Schakelt vrijwel alle decoratieve animaties uit.</small></div>
        <label class="sn-parent-toggle" aria-label="Minder beweging"><input id="snParentMotion" type="checkbox"><span></span></label>
      </div>
      <div class="sn-parent-setting">
        <div><strong>🔎 Grotere tekst</strong><small>Maakt belangrijke teksten beter leesbaar.</small></div>
        <label class="sn-parent-toggle" aria-label="Grotere tekst"><input id="snParentText" type="checkbox"><span></span></label>
      </div>
      <div class="sn-parent-setting">
        <div><strong>🔔 Subtiele geluiden</strong><small>Staat standaard uit. Alleen korte interfacegeluiden na een tik.</small></div>
        <label class="sn-parent-toggle" aria-label="Subtiele geluiden"><input id="snParentSound" type="checkbox"><span></span></label>
      </div>

      <div class="sn-parent-title">Privacy & hulp</div>
      <div class="sn-parent-actions">
        <button type="button" class="primary-action" id="snParentPrivacy">Privacybeleid bekijken</button>
        <a class="soft-action" href="mailto:contact.snazzlecreations@gmail.com?subject=Privacyverzoek%20Snazzle%20Hunt">Gegevens inzien of laten verwijderen</a>
      </div>
      <div class="sn-parent-version">Snazzle Hunt · professionele weblaag v${VERSION} · privacy-instellingen gelden op dit toestel</div>
    </section>`;
  document.body.appendChild(overlay);

  const close=()=>{
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
  };
  const open=()=>{
    const motion=q('#snParentMotion'), text=q('#snParentText'), sound=q('#snParentSound');
    if(motion) motion.checked=pref('snazzleReducedMotion','0')==='1';
    if(text) text.checked=pref('snazzleLargeText','0')==='1';
    if(sound) sound.checked=pref('snazzleSound','0')==='1';
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
    setTimeout(()=>q('#snParentClose')?.focus(),30);
  };
  q('#snParentClose').onclick=close;
  overlay.addEventListener('click',e=>{if(e.target===overlay) close();});
  q('#snParentPrivacy').onclick=openPrivacy;
  q('#snParentMotion').onchange=e=>{setPref('snazzleReducedMotion',e.target.checked?'1':'0');applyPreferences();};
  q('#snParentText').onchange=e=>{setPref('snazzleLargeText',e.target.checked?'1':'0');applyPreferences();};
  q('#snParentSound').onchange=e=>{setPref('snazzleSound',e.target.checked?'1':'0'); if(e.target.checked) playTone('confirm');};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('show')) close();});
  window.SnazzleParentCenter={open,close};
}

function parentMenuButton(){
  const b=document.createElement('button');
  b.type='button';
  b.id='snParentMenuBtn';
  b.innerHTML='<b>👨‍👩‍👧</b><span><strong>Ouder & veiligheid</strong><small>Privacy, leesbaarheid en gezinsinstellingen</small></span><i>›</i>';
  b.onclick=()=>window.SnazzleParentCenter?.open();
  return b;
}

function installParentEntryPoints(){
  makeParentCenter();
  const list=q('#quickMenuPanel .quick-menu-list');
  if(list&&!q('#snParentMenuBtn')){
    const privacy=q('#snazzlePrivacyMenuBtn');
    const b=parentMenuButton();
    if(privacy) list.insertBefore(b,privacy); else list.appendChild(b);
  }

  const profile=q('#profileSheet .panel');
  if(profile&&!q('#snParentProfileLink')){
    const b=document.createElement('button');
    b.id='snParentProfileLink'; b.type='button'; b.className='secondary';
    b.textContent='👨‍👩‍👧 Ouder & veiligheid';
    b.onclick=()=>window.SnazzleParentCenter?.open();
    const privacyBox=q('#snazzlePrivacyProfileBox',profile);
    if(privacyBox) privacyBox.insertAdjacentElement('beforebegin',b); else profile.appendChild(b);
  }
}

function installA11y(){
  const toast=q('#toast');
  if(toast){toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.setAttribute('aria-atomic','true');}
  q('.bottom')?.setAttribute('aria-label','Hoofdnavigatie');
  q('.quick-menu-list')?.setAttribute('aria-label','Snazzle onderdelen');
  qa('button:not([type])').forEach(b=>b.setAttribute('type','button'));
  qa('img').forEach(img=>{if(!img.hasAttribute('alt')) img.alt='';});
}

function optimizeImages(){
  qa('img').forEach(img=>{
    img.decoding='async';
    if(!img.closest('.top,.hero,.sn-news-page,.proof-preview')&&!img.hasAttribute('loading')) img.loading='lazy';
  });
}

function installHuntJourney(){
  const body=q('.huntbody');
  if(!body) return;
  if(!q('#snHuntJourney',body)){
    const journey=document.createElement('div');
    journey.id='snHuntJourney';
    journey.className='sn-hunt-journey';
    journey.innerHTML=`
      <div class="sn-hunt-journey-title"><span>Jouw avontuur</span><span id="snHuntJourneyState">Klaar?</span></div>
      <div class="sn-hunt-steps">
        <div class="sn-hunt-step" data-sn-step="1"><b>1</b>Kies de Hunt</div>
        <div class="sn-hunt-step" data-sn-step="2"><b>2</b>Ga zoeken</div>
        <div class="sn-hunt-step" data-sn-step="3"><b>3</b>Vind & bevestig</div>
      </div>
      <div class="sn-hunt-safety">🌿 Ga veilig samen op pad en let goed op verkeer, water en privéterrein.</div>`;
    const proof=q('#proofBox',body);
    if(proof) body.insertBefore(journey,proof); else body.appendChild(journey);
  }
  updateHuntJourney();
}

function updateHuntJourney(){
  const journey=q('#snHuntJourney'); if(!journey) return;
  const start=q('#startBtn'), found=q('#foundBtn');
  const active=!!start&&!start.disabled;
  const joined=active&&(String(start.textContent).includes('✅')||String(start.textContent).toLowerCase().includes('zoek mee'));
  const ready=!!found&&found.classList.contains('ready');
  const done=!!found&&found.classList.contains('done');
  const s1=q('[data-sn-step="1"]',journey),s2=q('[data-sn-step="2"]',journey),s3=q('[data-sn-step="3"]',journey);
  [s1,s2,s3].forEach(s=>s?.classList.remove('active','done'));
  if(!active){q('#snHuntJourneyState').textContent='Nog geen actieve Hunt';return;}
  if(done){s1?.classList.add('done');s2?.classList.add('done');s3?.classList.add('done');q('#snHuntJourneyState').textContent='Gevonden! 🏆';return;}
  if(ready){s1?.classList.add('done');s2?.classList.add('done');s3?.classList.add('active');q('#snHuntJourneyState').textContent='Bevestig je vondst';return;}
  if(joined){s1?.classList.add('done');s2?.classList.add('active');q('#snHuntJourneyState').textContent='Veel succes!';return;}
  s1?.classList.add('active');q('#snHuntJourneyState').textContent='Start wanneer je wilt';
}

function celebrateFound(){
  if(q('.sn-celebrate')) return;
  const layer=document.createElement('div');layer.className='sn-celebrate';layer.setAttribute('aria-hidden','true');
  const bits=[['✨','-118px','-125px','-26deg','.02s'],['⭐','-70px','-170px','18deg','.08s'],['🌟','10px','-185px','34deg','.03s'],['✨','88px','-145px','-18deg','.11s'],['🏆','122px','-80px','20deg','.06s'],['⭐','-132px','-50px','-35deg','.13s'],['✨','70px','-68px','27deg','.16s']];
  layer.innerHTML=bits.map(([c,x,y,r,d])=>`<i style="--x:${x};--y:${y};--r:${r};--d:${d}">${c}</i>`).join('');
  document.body.appendChild(layer);
  playTone('success');
  setTimeout(()=>layer.remove(),1300);
}

function installFoundCelebration(){
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('#foundBtn');
    if(!btn||btn.disabled||foundCelebratePending) return;
    foundCelebratePending=true;
    const check=(attempt=0)=>{
      const now=q('#foundBtn');
      if(now?.classList.contains('done')){celebrateFound();foundCelebratePending=false;updateHuntJourney();return;}
      if(attempt<4) setTimeout(()=>check(attempt+1),450);
      else foundCelebratePending=false;
    };
    setTimeout(()=>check(),350);
  },true);
}

function installNewsPolish(){
  const shell=q('.sn-news-shell');
  if(!shell) return;
  if(!q('#snNewsProgressTrack',shell)){
    const track=document.createElement('div');track.id='snNewsProgressTrack';track.className='sn-news-progress-track';track.innerHTML='<div id="snNewsProgressFill" class="sn-news-progress-fill"></div>';
    const top=q('.sn-news-topbar',shell); top?.insertAdjacentElement('afterend',track);
  }
  const counter=q('#snNewsCounter');
  if(counter&&!counter.dataset.proObserved){
    counter.dataset.proObserved='1';counter.setAttribute('aria-live','polite');
    const update=()=>{
      const nums=(counter.textContent.match(/\d+/g)||[]).map(Number);
      const current=nums[0]||1,total=nums[1]||Math.max(1,current);
      const fill=q('#snNewsProgressFill');if(fill) fill.style.width=`${Math.max(4,Math.min(100,(current/total)*100))}%`;
    };
    new MutationObserver(update).observe(counter,{childList:true,subtree:true,characterData:true});update();
  }
  const overlay=q('#snNewsOverlay');
  if(overlay&&!overlay.dataset.proHintBound){
    overlay.dataset.proHintBound='1';
    new MutationObserver(()=>{
      if(!overlay.classList.contains('show')) return;
      if(localStorage.getItem('snazzleNewsSwipeHintSeen')==='1') return;
      localStorage.setItem('snazzleNewsSwipeHintSeen','1');
      const stage=q('#snNewsStage');if(!stage) return;
      const hint=document.createElement('div');hint.className='sn-news-gesture-hint';hint.textContent='← Veeg om door de krant te bladeren →';stage.appendChild(hint);setTimeout(()=>hint.remove(),2900);
    }).observe(overlay,{attributes:true,attributeFilter:['class']});
  }
}

function installFooter(){
  const app=q('.app'); if(!app||q('#snProFooter')) return;
  const footer=document.createElement('footer');
  footer.id='snProFooter';footer.className='sn-pro-footer';
  footer.innerHTML=`<span class="sn-pro-tagline">🦆 Snazzle · Samen naar buiten</span>
    Veilig, speels en gemaakt voor gezinnen<br>
    <button type="button" id="snFooterParent">Ouder & veiligheid</button> · <button type="button" id="snFooterPrivacy">Privacy</button> · v${VERSION}`;
  app.appendChild(footer);
  q('#snFooterParent').onclick=()=>window.SnazzleParentCenter?.open();
  q('#snFooterPrivacy').onclick=openPrivacy;
}

function playTone(kind='tap'){
  if(pref('snazzleSound','0')!=='1') return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC) return;
    audioContext=audioContext||new AC();
    if(audioContext.state==='suspended') audioContext.resume();
    const now=audioContext.currentTime;
    const tones=kind==='success'?[659,784,988]:kind==='confirm'?[523,659]:[440];
    tones.forEach((freq,i)=>{
      const o=audioContext.createOscillator(),g=audioContext.createGain();
      o.type='sine';o.frequency.setValueAtTime(freq,now+i*.07);
      g.gain.setValueAtTime(.0001,now+i*.07);g.gain.exponentialRampToValueAtTime(.025,now+i*.07+.012);g.gain.exponentialRampToValueAtTime(.0001,now+i*.07+.11);
      o.connect(g);g.connect(audioContext.destination);o.start(now+i*.07);o.stop(now+i*.07+.12);
    });
  }catch(e){console.debug('Snazzle geluid niet beschikbaar',e);}
}

function installSoundHooks(){
  document.addEventListener('click',e=>{
    const target=e.target.closest?.('#snNewsLaunch,.main-action,[data-quick-action],#startBtn,#snParentMenuBtn,#snParentProfileLink');
    if(target&&!target.disabled) playTone('tap');
  },true);
}

function installRuntimeGuard(){
  // Geen technische foutcodes aan kinderen tonen. We loggen wel voor diagnose.
  window.addEventListener('unhandledrejection',event=>{
    const message=String(event.reason?.message||event.reason||'');
    if(/network|offline|unavailable|failed to fetch/i.test(message)&&!navigator.onLine){
      window.SnazzleNetworkStatus?.offline?.();
    }
  });
}

function start(){
  installMetaAndPerformance();
  applyPreferences();
  installSplash();
  installNetworkBanner();
  makeParentCenter();
  installFoundCelebration();
  installSoundHooks();
  installRuntimeGuard();
  queueInstall();

  const observer=new MutationObserver(queueInstall);
  observer.observe(document.body,{childList:true,subtree:true});
  // Status- en knopteksten veranderen zonder altijd nieuwe elementen te maken.
  const huntObserver=new MutationObserver(()=>updateHuntJourney());
  const hunt=q('.hunt'); if(hunt) huntObserver.observe(hunt,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled','style']});

  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){queueInstall();updateHuntJourney();}});
  window.addEventListener('pageshow',()=>{queueInstall();updateHuntJourney();});
}

start();

window.SnazzleProfessional={version:VERSION,parent:()=>window.SnazzleParentCenter?.open(),celebrate:celebrateFound,refresh:queueInstall};
