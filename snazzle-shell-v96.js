// Snazzle v96 — complete, lightweight launcher shell.
// Alle zichtbare onderdelen staan meteen in menu/home; zware functies laden pas als de gebruiker ze opent.

const q=(s,r=document)=>r?.querySelector?.(s)||null;
const qa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
const fresh=window.__snazzleFresh||((p)=>p);
const loaded=new Map();
let corePromise=null;

function selectedVillage(){return localStorage.getItem('snazzleVillage')||'Montfort';}
function userName(){return (localStorage.getItem('snazzleName')||'').trim();}
function settings(){try{return JSON.parse(localStorage.getItem('snazzleSettings')||'{}');}catch{return{};}}
function openSheet(id){q('#'+id)?.classList.add('show');}
function closeSheet(id){q('#'+id)?.classList.remove('show');}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function loadModule(path){
  if(loaded.has(path)) return loaded.get(path);
  const p=import(fresh(path)).catch(err=>{loaded.delete(path);console.warn('Snazzle onderdeel kon niet laden',path,err);throw err;});
  loaded.set(path,p);
  return p;
}
async function ensureCore(){
  if(!corePromise) corePromise=loadModule('./app-core.js');
  return corePromise;
}

function installStyles(){
  if(q('#snV96Styles'))return;
  const s=document.createElement('style');s.id='snV96Styles';s.textContent=`
  #quickMenuBtn{width:54px;height:54px;border-radius:17px;border:3px solid #8a6539;background:#285e35;color:white;font-size:29px;font-weight:1000;display:grid;place-items:center;position:relative;z-index:10002;touch-action:manipulation}
  #quickMenuOverlay{position:fixed;inset:0;z-index:10001;background:rgba(3,16,8,.74);display:none;justify-content:flex-end}
  #quickMenuOverlay.show{display:flex!important}
  #quickMenuPanel{width:min(91vw,405px);height:100%;overflow:auto;-webkit-overflow-scrolling:touch;background:linear-gradient(180deg,#175e35,#07351f);color:#fff7df;padding:calc(16px + env(safe-area-inset-top)) 14px calc(24px + env(safe-area-inset-bottom));border-left:3px solid #8c6236}
  .sn96-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:13px;border-bottom:1px solid rgba(255,225,147,.25)}.sn96-brand{display:flex;align-items:center;gap:10px}.sn96-duck{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:#ffd45b;border:3px solid #76502d;font-size:25px}.sn96-brand strong{display:block;color:#ffd45b;font-size:21px}.sn96-brand small{display:block;margin-top:3px;color:#d9edbd;font-weight:800}.sn96-close{width:44px;height:44px;border:0;border-radius:13px;background:#70452b;color:white;font-size:25px}.sn96-note{margin:13px 2px 9px;color:#c9ef8a;font-size:11px;font-weight:1000;text-transform:uppercase;letter-spacing:1px}
  .sn96-menu{display:grid;gap:7px}.sn96-menu button,.sn96-admin{width:100%;min-height:59px;border:1px solid rgba(255,224,147,.25);border-radius:15px;background:rgba(255,255,255,.085);color:#fff7df;padding:8px 10px;display:grid;grid-template-columns:40px 1fr 20px;align-items:center;gap:8px;text-align:left;touch-action:manipulation}.sn96-menu b{font-size:23px}.sn96-menu strong{display:block;font-size:15px}.sn96-menu small{display:block;margin-top:2px;font-size:10px;color:#d9e8c7}.sn96-menu i{font-style:normal;font-size:27px;color:#ffd45b}.sn96-admin{margin-top:10px;background:#51331f;grid-template-columns:40px 1fr}
  .sn96-features{margin:17px 0 2px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.sn96-feature{min-height:112px;border:3px solid #6c4826;border-radius:20px;padding:13px;color:white;text-align:left;box-shadow:0 5px 0 #3f2919;background:linear-gradient(145deg,#4f7351,#24533a);touch-action:manipulation}.sn96-feature:nth-child(2){background:linear-gradient(145deg,#6557b9,#394c95)}.sn96-feature:nth-child(3){background:linear-gradient(145deg,#8a5d35,#4c633a)}.sn96-feature:nth-child(4){background:linear-gradient(145deg,#6d559f,#2e7080)}.sn96-feature:nth-child(5){background:linear-gradient(145deg,#744cb4,#3d296f)}.sn96-feature:nth-child(6){background:linear-gradient(145deg,#2f7550,#174b35)}.sn96-feature b{display:block;font-size:28px}.sn96-feature strong{display:block;margin-top:6px;font-size:15px}.sn96-feature small{display:block;margin-top:3px;font-size:10px;color:#f1f2dc;line-height:1.3}
  .sn96-busy{position:fixed;inset:0;z-index:16000;background:rgba(3,19,12,.82);display:none;place-items:center;padding:20px}.sn96-busy.show{display:grid}.sn96-busy-card{width:min(88vw,360px);border-radius:22px;background:#fff1bd;color:#352719;border:3px solid #8d6837;padding:20px;text-align:center;box-shadow:0 12px 35px rgba(0,0,0,.35)}.sn96-busy-card b{display:block;font-size:20px}.sn96-busy-card small{display:block;margin-top:8px;color:#6b5135;font-weight:800;line-height:1.4}.sn96-busy-dot{font-size:34px;margin-bottom:8px}
  .snazzle-passport{margin:8px 0 14px;padding:15px 16px;border-radius:24px;background:linear-gradient(145deg,#f5e9c6,#ead199);color:#173d35;border:3px solid #b98f4f;box-shadow:0 5px 0 #6a4a2c,0 12px 24px rgba(0,0,0,.18)}.passport-kicker{font-size:9px;letter-spacing:1.4px;text-transform:uppercase;font-weight:1000;color:#8b6835}.passport-stats{display:grid;grid-template-columns:1fr 1fr 1.1fr;border-top:1px dashed rgba(84,66,37,.28);padding-top:9px}.passport-stat{padding:0 8px;border-right:1px solid rgba(84,66,37,.2)}.passport-stat:last-child{border-right:0}.passport-stat strong{display:block;font-size:15px;color:#123f35}.passport-stat small{display:block;font-size:9px;color:#765d38}
  @media(max-width:360px){.sn96-features{grid-template-columns:1fr}.sn96-feature{min-height:86px}}
  `;document.head.appendChild(s);
}

function ensureHome(){
  const top=q('.top'),welcome=q('#welcomeText');
  if(welcome)welcome.textContent=userName()?`Hoi ${userName()}!`:'Hoi!';
  if(top&&welcome&&!q('#snazzlePassport')){
    const p=document.createElement('section');p.id='snazzlePassport';p.className='snazzle-passport';p.innerHTML=`<div class="passport-kicker">Mijn Snazzle paspoort</div><div class="passport-welcome-slot"></div><div class="passport-stats"><div class="passport-stat"><strong id="passportFinds">0</strong><small>Snazzles gevonden</small></div><div class="passport-stat"><strong id="passportVillage">${selectedVillage()}</strong><small>gekozen dorp</small></div><div class="passport-stat"><strong>Explorer</strong><small>klaar voor avontuur</small></div></div>`;top.insertAdjacentElement('afterend',p);p.querySelector('.passport-welcome-slot')?.appendChild(welcome);
  }
  const hero=q('#hero');if(hero){let title=q('#adventureTitle');if(!title){title=document.createElement('h2');title.id='adventureTitle';title.className='adventure-title';title.textContent='Klaar voor avontuur?';hero.appendChild(title);}const sm=hero.querySelector('small');if(sm)sm.textContent='Snazzle avontuur';const para=hero.querySelector('p');if(para)para.textContent='Vind een Snazzle en ontdek jouw dorp.';}
  const st=settings();if(st.profileImage&&q('#profileLogo')){q('#profileLogo').src=st.profileImage;q('#profileLogo').style.display='block';if(q('#logoFallback'))q('#logoFallback').style.display='none';}
  if(st.heroImage&&hero){hero.style.backgroundImage=`linear-gradient(rgba(7,45,34,.24),rgba(5,42,31,.68)),url("${st.heroImage}")`;hero.style.backgroundSize='cover';hero.style.backgroundPosition='center top';}
}

function ensureVillages(){
  const box=q('#villages');if(!box||box.children.length)return;const cur=selectedVillage();
  ['Montfort','Posterholt','Sint Odiliënberg'].forEach(name=>{const b=document.createElement('button');b.type='button';b.className='village'+(name===cur?' active':'');b.textContent=name;b.onclick=()=>{localStorage.setItem('snazzleVillage',name);qa('#villages .village').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(q('#chosenVillageLabel'))q('#chosenVillageLabel').textContent='📍 '+name;if(q('#passportVillage'))q('#passportVillage').textContent=name;openSheet('villageSheet');};box.appendChild(b);});if(q('#chosenVillageLabel'))q('#chosenVillageLabel').textContent='📍 '+cur;
}

function ensureBusy(){if(q('#sn96Busy'))return;const d=document.createElement('div');d.id='sn96Busy';d.className='sn96-busy';d.innerHTML='<div class="sn96-busy-card"><div class="sn96-busy-dot">🦆</div><b id="sn96BusyTitle">Onderdeel laden…</b><small>Alleen dit onderdeel wordt nu klaargezet. De rest van de app blijft licht.</small></div>';document.body.appendChild(d);}
async function withBusy(label,fn){ensureBusy();const b=q('#sn96Busy'),t=q('#sn96BusyTitle');if(t)t.textContent=label;b?.classList.add('show');try{return await fn();}catch(err){console.error(err);alert('Dit onderdeel kon nu niet worden geopend. Probeer het nog eens.');}finally{b?.classList.remove('show');}}

async function openHunt(){await withBusy('Hunt laden…',async()=>{await ensureCore();await sleep(80);q('#navHunt')?.click();if(!q('#villageSheet.show'))openSheet('villageSheet');});}
async function openGame(){await withBusy('Snazzle Spel laden…',async()=>{await ensureCore();for(const p of ['./snazzle-world-adventure-v38.js','./snazzle-world-hub-v47.js','./snazzle-game-menu-v62.js'])await loadModule(p);await sleep(80);window.SnazzleGameMenuV62?.open?.();});}
async function openListen(){await withBusy('Luisterverhalen laden…',async()=>{await ensureCore();await loadModule('./snazzle-listen-stories-v63.js');await sleep(60);window.SnazzleListenStoriesV63?.open?.();});}
async function openBieb(){await withBusy('De Bieb laden…',async()=>{await ensureCore();await loadModule('./snazzle-bieb-v73.js');await loadModule('./snazzle-bieb-cloud-v74.js');await loadModule('./snazzle-bieb-locations-v77.js');await sleep(60);window.SnazzleBiebV73?.open?.();const n=q('#snBiebHome73');if(n)n.style.display='none';});}
async function openCollection(){await withBusy('Collectie laden…',async()=>{await ensureCore();await loadModule('./snazzle-collection.js');await loadModule('./snazzle-card-system-v2.js');await loadModule('./snazzle-card-worlds-v78.js');await loadModule('./snazzle-card-world-prompt-v79.js');await sleep(120);const native=q('[data-snazzle-collection]')||q('#collectionHomeCard');native?.click();if(q('#collectionHomeCard'))q('#collectionHomeCard').style.display='none';});}
async function openAR(){await withBusy('Snazzle AR laden…',async()=>{await loadModule('./snazzle-ar-v80.js');await loadModule('./snazzle-ar-safety-v82.js');await sleep(80);q('#snArLaunch')?.click();if(q('#snArLaunch'))q('#snArLaunch').style.display='none';});}
async function openNews(){await withBusy('Snazzle Nieuws laden…',async()=>{await ensureCore();await loadModule('./snazzle-news-v46.js');await sleep(80);q('#snNewsLaunch')?.click();});}
async function openParents(){await withBusy('Oudergedeelte laden…',async()=>{await ensureCore();await loadModule('./snazzle-parent-hub-v65.js');await loadModule('./snazzle-parent-close-fix-v76.js');await sleep(60);window.SnazzleParentHubV65?.open?.();});}
async function openFindings(){await withBusy('Vondsten laden…',async()=>{await ensureCore();await sleep(60);q('#findsBtn')?.click();if(!q('#findsSheet.show'))openSheet('findsSheet');});}
async function openShop(){await withBusy('Shop laden…',async()=>{await ensureCore();await loadModule('./shop-compat.js');await sleep(60);openSheet('shopSheet');});}
async function openAdmin(){await withBusy('Beheer laden…',async()=>{await ensureCore();await sleep(60);openSheet('adminLogin');});}

const actions={home:()=>window.scrollTo(0,0),hunt:openHunt,village:()=>q('.villages')?.scrollIntoView({block:'center'}),game:openGame,listen:openListen,bieb:openBieb,collection:openCollection,ar:openAR,news:openNews,friends:()=>openSheet('friendsSheet'),findings:openFindings,shop:openShop,profile:()=>openSheet('profileSheet'),parents:openParents,admin:openAdmin};

const menuItems=[
 ['🏠','Home','Terug naar het begin','home'],['🔎','Hunt zoeken','Bekijk de actieve Hunt','hunt'],['📍','Kies je dorp','Montfort en andere dorpen','village'],['🎮','Snazzle Spel','Open de Snazzle Wereld','game'],['🎧','Luisterverhalen','Kies een verhaal en luister','listen'],['📚','De Bieb','Jouw boeken en leeshoek','bieb'],['✨','Mijn Snazzle Collectie','Spaarkaart, Nest, kaarten & jaarstand','collection'],['📷','Snazzle AR','Zoek Snazzles met camera en GPS','ar'],['🗞️','Het Snazzle Nieuws','Lees nieuws uit de Snazzle Wereld','news'],['👥','Vrienden','Bekijk actieve Snazzlers','friends'],['🏆','Mijn vondsten','Jouw gevonden Hunts','findings'],['🛍️','Shop','Bekijk Snazzle items','shop'],['👤','Mijn profiel','Naam of nickname aanpassen','profile'],['👨‍👩‍👧','Voor ouders','Veiligheid, privacy en tips','parents']
];

function closeMenu(){const o=q('#quickMenuOverlay');o?.classList.remove('show');document.body.style.overflow='';document.documentElement.style.overflow='';}
function openMenu(){const o=q('#quickMenuOverlay');if(!o)return;const v=q('#quickMenuVillage');if(v)v.textContent='📍 '+selectedVillage();o.classList.add('show');document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';}
function installMenu(){q('#quickMenuBtn')?.remove();q('#quickMenuOverlay')?.remove();const top=q('.top');if(!top)return;const old=q('#adminBtn');if(old)old.style.display='none';const btn=document.createElement('button');btn.id='quickMenuBtn';btn.type='button';btn.textContent='☰';btn.setAttribute('aria-label','Snazzle menu openen');top.appendChild(btn);const o=document.createElement('div');o.id='quickMenuOverlay';o.innerHTML=`<aside id="quickMenuPanel"><div class="sn96-head"><div class="sn96-brand"><span class="sn96-duck">🦆</span><div><strong>Snazzle Menu</strong><small id="quickMenuVillage">📍 ${selectedVillage()}</small></div></div><button class="sn96-close" id="quickMenuClose" type="button">×</button></div><div class="sn96-note">Alles van Snazzle</div><nav class="sn96-menu quick-menu-list"></nav><button class="sn96-admin" type="button" data-v96="admin"><b>🔒</b><span><strong>Beheer</strong><small>Voor Snazzle beheerders</small></span></button></aside>`;document.body.appendChild(o);const list=q('.sn96-menu',o);menuItems.forEach(([ic,title,sub,key])=>{const b=document.createElement('button');b.type='button';b.dataset.v96=key;b.innerHTML=`<b>${ic}</b><span><strong>${title}</strong><small>${sub}</small></span><i>›</i>`;list.appendChild(b);});
  const invoke=(key)=>{closeMenu();setTimeout(()=>actions[key]?.(),20);};btn.onclick=e=>{e.preventDefault();openMenu();};q('#quickMenuClose')?.addEventListener('click',e=>{e.preventDefault();closeMenu();});o.addEventListener('click',e=>{if(e.target===o)closeMenu();});qa('[data-v96]',o).forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();invoke(b.dataset.v96);});
  document.addEventListener('pointerup',e=>{if(e.target?.closest?.('#quickMenuBtn'))openMenu();},{capture:true});
}

function installFeatureHome(){if(q('#snV96Features'))return;const quick=q('.quick');if(!quick)return;const sec=document.createElement('section');sec.id='snV96Features';sec.className='sn96-features';const features=[['🎮','Snazzle Spel','Jouw Snazzle Wereld','game'],['✨','Mijn Collectie','Kaarten, Nest & jaarstand','collection'],['📚','De Bieb','Lezen en je leeshoek bouwen','bieb'],['🎧','Luisterverhalen','Luister naar Snazzle verhalen','listen'],['📷','Snazzle AR','Zoek met camera en GPS','ar'],['🗞️','Snazzle Nieuws','Nieuws en verhalen','news']];features.forEach(([ic,t,s,key])=>{const b=document.createElement('button');b.type='button';b.className='sn96-feature';b.dataset.v96home=key;b.innerHTML=`<b>${ic}</b><strong>${t}</strong><small>${s}</small>`;b.onclick=()=>actions[key]?.();sec.appendChild(b);});quick.insertAdjacentElement('afterend',sec);}

function bindBase(){qa('[data-close]').forEach(b=>b.onclick=()=>closeSheet(b.dataset.close));if(q('#profileBtn'))q('#profileBtn').onclick=()=>openSheet('profileSheet');if(q('#navProfile'))q('#navProfile').onclick=()=>openSheet('profileSheet');if(q('#navFriends'))q('#navFriends').onclick=()=>openSheet('friendsSheet');if(q('#navShop'))q('#navShop').onclick=openShop;if(q('#findsBtn'))q('#findsBtn').onclick=openFindings;if(q('#navHunt'))q('#navHunt').onclick=openHunt;if(q('#bigStart'))q('#bigStart').onclick=openHunt;if(q('#adminBtn'))q('#adminBtn').onclick=openAdmin;if(q('#saveName'))q('#saveName').onclick=()=>{const n=(q('#nameInput')?.value||'').trim().slice(0,20);if(n.length>=2){localStorage.setItem('snazzleName',n);closeSheet('profileSheet');ensureHome();}};if(q('#nameInput'))q('#nameInput').value=userName();}

function init(){if(window.__snazzleShellV96)return;window.__snazzleShellV96=true;installStyles();ensureHome();ensureVillages();ensureBusy();installMenu();installFeatureHome();bindBase();document.documentElement.dataset.snazzleShell='v96';}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

window.SnazzleShellV96={init,openMenu,actions,ensureCore};
export {init,openMenu,actions,ensureCore};
