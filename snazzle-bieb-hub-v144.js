// Snazzle v144 — rustige Bieb-hub.
// Ordening bovenop de bestaande Bieb: Mijn boeken, Luisterverhalen en Bieb in de buurt.
// Bestaande opslag, luisterverhalen en locatiegegevens blijven onaangeraakt.

const VERSION='144.0.0';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function installStyles(){
  if($('#snBiebHubStyles144')) return;
  const style=document.createElement('style');
  style.id='snBiebHubStyles144';
  style.textContent=`
    .sn-bieb-hub144{margin:14px 0 4px;padding:12px;border:2px solid rgba(255,225,145,.34);border-radius:21px;background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(247,204,91,.06));box-shadow:0 5px 0 rgba(5,20,13,.34)}
    .sn-bieb-hub-title144{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 1px 10px}
    .sn-bieb-hub-title144 strong{font-size:15px;color:#ffe287}.sn-bieb-hub-title144 span{font-size:10px;color:#cde1c3;font-weight:800;text-align:right}
    .sn-bieb-hub-grid144{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .sn-bieb-hub-btn144{min-width:0;min-height:105px;border:2px solid rgba(255,230,164,.42);border-radius:17px;padding:10px 7px;background:linear-gradient(180deg,#315f43,#244a35);color:#fff;text-align:center;box-shadow:0 4px 0 #153526;touch-action:manipulation}
    .sn-bieb-hub-btn144:active{transform:translateY(2px);box-shadow:0 2px 0 #153526}
    .sn-bieb-hub-btn144 b{display:block;font-size:31px;line-height:1}.sn-bieb-hub-btn144 strong{display:block;margin-top:7px;font-size:12px;line-height:1.12;color:#ffe287}.sn-bieb-hub-btn144 small{display:block;margin-top:4px;font-size:9px;line-height:1.25;color:#dcebd5;font-weight:760}
    .sn-bieb-hub-btn144[data-bieb-action="listen"]{background:linear-gradient(180deg,#6654a8,#483a84);box-shadow:0 4px 0 #30275d}
    .sn-bieb-hub-btn144[data-bieb-action="near"]{background:linear-gradient(180deg,#8a6337,#684827);box-shadow:0 4px 0 #432f1d}
    .sn-bieb-hub-badge144{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;margin-top:6px;padding:0 6px;border-radius:999px;background:#f6d05d;color:#3a2818;font-size:10px;font-weight:1000}
    .sn-bieb-more144{width:100%;margin-top:9px;border:1px solid rgba(255,230,164,.28);border-radius:13px;padding:9px 11px;background:rgba(255,255,255,.06);color:#e6f0df;font-size:10px;font-weight:900;text-align:left;display:flex;justify-content:space-between;gap:8px;align-items:center}
    .sn-bieb-more144 i{font-style:normal;color:#ffd96a;font-size:16px}
    .sn-bieb-hub144-note{margin:8px 2px 0;color:#abc4a3;font-size:9px;line-height:1.35;font-weight:740}
    .sn-bieb-section[hidden]{display:none!important}
    .sn-bieb-hub144-ready #quickMenuPanel #snListenMenuV63{display:none!important}
    .sn-bieb-focus144{animation:snBiebFocus144 .7s ease}
    @keyframes snBiebFocus144{0%{box-shadow:0 0 0 0 rgba(255,216,94,.0)}40%{box-shadow:0 0 0 5px rgba(255,216,94,.28)}100%{box-shadow:0 0 0 0 rgba(255,216,94,.0)}}
    @media(max-width:380px){.sn-bieb-hub-grid144{gap:6px}.sn-bieb-hub-btn144{min-height:101px;padding:9px 5px}.sn-bieb-hub-btn144 b{font-size:28px}.sn-bieb-hub-btn144 strong{font-size:11px}.sn-bieb-hub-btn144 small{font-size:8px}}
    @media(prefers-reduced-motion:reduce){.sn-bieb-focus144{animation:none}.sn-bieb-hub-btn144:active{transform:none}}
  `;
  document.head.appendChild(style);
}

function sectionByTitle(fragment){
  return $$('.sn-bieb-section').find(section=>{
    const title=section.querySelector('.sn-bieb-section-head h2')?.textContent||'';
    return title.toLowerCase().includes(String(fragment).toLowerCase());
  })||null;
}

function pulse(section){
  if(!section) return;
  section.classList.remove('sn-bieb-focus144');
  requestAnimationFrame(()=>section.classList.add('sn-bieb-focus144'));
  setTimeout(()=>section.classList.remove('sn-bieb-focus144'),850);
}

function scrollToSection(section){
  if(!section) return;
  section.hidden=false;
  section.scrollIntoView({behavior:'smooth',block:'start'});
  pulse(section);
}

function updateBookCount(){
  const count=$('#snBiebBookCount73')?.textContent?.trim()||'0';
  const badge=$('#snBiebHubBookCount144');
  if(badge) badge.textContent=`${count} boek${count==='1'?'':'en'}`;
}

function openListenStories(){
  try{$('#snBiebClose73')?.click();}catch{}
  setTimeout(()=>{
    if(window.SnazzleListenStoriesV63?.open){
      window.SnazzleListenStoriesV63.open();
      return;
    }
    const fallback=$('#snListenMenuV63');
    if(fallback) fallback.click();
  },90);
}

function revealLocations(button){
  const section=$('#snBiebLocations77')||sectionByTitle('Waar is een Bieb');
  if(!section){
    button?.setAttribute('aria-busy','true');
    setTimeout(()=>{button?.removeAttribute('aria-busy');const retry=$('#snBiebLocations77')||sectionByTitle('Waar is een Bieb');if(retry)scrollToSection(retry);},260);
    return;
  }
  scrollToSection(section);
}

function toggleExtras(button){
  const facts=sectionByTitle('Waarom lezen');
  const missions=sectionByTitle('Leesmissies');
  const shouldOpen=!!((facts&&facts.hidden)||(missions&&missions.hidden));
  if(facts) facts.hidden=!shouldOpen;
  if(missions) missions.hidden=!shouldOpen;
  button?.setAttribute('aria-expanded',shouldOpen?'true':'false');
  const label=button?.querySelector('span');
  const icon=button?.querySelector('i');
  if(label) label.textContent=shouldOpen?'Minder extra’s tonen':'Meer leesplezier: waarom lezen + missies';
  if(icon) icon.textContent=shouldOpen?'⌃':'⌄';
  if(shouldOpen) scrollToSection(facts||missions);
}

function simplifyLongSections(){
  const facts=sectionByTitle('Waarom lezen');
  const missions=sectionByTitle('Leesmissies');
  const locations=$('#snBiebLocations77')||sectionByTitle('Waar is een Bieb');
  if(facts&&!facts.dataset.snBieb144Managed){facts.hidden=true;facts.dataset.snBieb144Managed='1';}
  if(missions&&!missions.dataset.snBieb144Managed){missions.hidden=true;missions.dataset.snBieb144Managed='1';}
  if(locations&&!locations.dataset.snBieb144Managed){locations.hidden=true;locations.dataset.snBieb144Managed='1';}
}

function updateEntryCopy(){
  const home=$('#snBiebHome73 small');
  if(home) home.textContent='Jouw boeken, luisterverhalen en een Bieb bij jou in de buurt.';
  const menu=$('#snBiebMenu73 small');
  if(menu) menu.textContent='Lezen, luisteren en Bieb in de buurt';
}

function buildHub(overlay){
  if($('#snBiebHub144',overlay)) return true;
  const hero=$('.sn-bieb-hero',overlay);
  if(!hero) return false;

  const hub=document.createElement('section');
  hub.id='snBiebHub144';
  hub.className='sn-bieb-hub144';
  hub.setAttribute('aria-label','Kies wat je in De Bieb wilt doen');
  hub.innerHTML=`
    <div class="sn-bieb-hub-title144"><strong>Wat wil je doen?</strong><span>Alles van De Bieb op één plek</span></div>
    <div class="sn-bieb-hub-grid144">
      <button class="sn-bieb-hub-btn144" type="button" data-bieb-action="books"><b>📚</b><strong>Mijn boeken</strong><small>Leeshoek en boekenkast</small><span class="sn-bieb-hub-badge144" id="snBiebHubBookCount144">0 boeken</span></button>
      <button class="sn-bieb-hub-btn144" type="button" data-bieb-action="listen"><b>🎧</b><strong>Luister</strong><small>Snazzle luisterverhalen</small></button>
      <button class="sn-bieb-hub-btn144" type="button" data-bieb-action="near"><b>📍</b><strong>Bieb dichtbij</strong><small>Adressen en routes</small></button>
    </div>
    <button class="sn-bieb-more144" id="snBiebMore144" type="button" aria-expanded="false"><span>Meer leesplezier: waarom lezen + missies</span><i>⌄</i></button>
    <div class="sn-bieb-hub144-note">Geen extra hoofdmenu’s nodig: lezen, luisteren en lokale bibliotheken zitten voortaan bij elkaar.</div>`;
  hero.insertAdjacentElement('afterend',hub);

  hub.querySelector('[data-bieb-action="books"]')?.addEventListener('click',()=>scrollToSection(sectionByTitle('Mijn leeshoek')||sectionByTitle('Mijn boekenkast')));
  hub.querySelector('[data-bieb-action="listen"]')?.addEventListener('click',openListenStories);
  hub.querySelector('[data-bieb-action="near"]')?.addEventListener('click',e=>revealLocations(e.currentTarget));
  $('#snBiebMore144',hub)?.addEventListener('click',e=>toggleExtras(e.currentTarget));

  const count=$('#snBiebBookCount73');
  if(count&&!count.dataset.snBieb144Watch){
    count.dataset.snBieb144Watch='1';
    new MutationObserver(updateBookCount).observe(count,{childList:true,characterData:true,subtree:true});
  }
  updateBookCount();
  return true;
}

function enhance(){
  installStyles();
  const overlay=$('#snBiebOverlay73');
  if(!overlay) return false;
  if(!buildHub(overlay)) return false;
  simplifyLongSections();
  updateEntryCopy();
  document.body.classList.add('sn-bieb-hub144-ready');
  return true;
}

function init(){
  if(enhance()) console.info(`Snazzle Bieb hub ${VERSION} geladen`);
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      enhance();
    });
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),15000);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

window.SnazzleBiebHubV144={enhance};
