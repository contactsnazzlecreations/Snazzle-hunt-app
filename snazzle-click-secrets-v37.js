// Snazzle Hunt — 4 subtiele easter eggs op bestaande bediening.
// Niets extra's staat zichtbaar op het scherm totdat een secret daadwerkelijk wordt gevonden.

const V37='37.4.0-four-secrets';
const FOUND_KEY='snazzleSecretsFoundV374';
const q=(s,r=document)=>r.querySelector(s);

const secrets={
  logo:{title:'Niet kietelen! 🦆',text:'Je hebt de Snazzle in het logo wakker gekieteld.'},
  welcome:{title:'Pssst… 👀',text:'Welkom, geheime Snazzler. Jij keek op precies de goede plek.'},
  compass:{title:'Kompasgeheim! 🧭',text:'Het kompas draaide door… er zit blijkbaar meer verstopt in deze app.'},
  home:{title:'Daar gaat-ie! 🦆',text:'Je hebt de verdwaalde mini-Snazzle gevonden.'}
};

function foundSet(){
  try{return new Set(JSON.parse(localStorage.getItem(FOUND_KEY)||'[]'));}
  catch{return new Set();}
}
function saveFound(set){
  try{localStorage.setItem(FOUND_KEY,JSON.stringify([...set]));}catch{}
}
function markFound(id){
  const set=foundSet();
  const wasNew=!set.has(id);
  set.add(id);saveFound(set);
  return {count:set.size,wasNew,complete:set.size>=Object.keys(secrets).length};
}

function ensureStyles(){
  if(q('#snazzleFourSecretsStyles'))return;
  const style=document.createElement('style');
  style.id='snazzleFourSecretsStyles';
  style.textContent=`
    .sn-secret-card{position:fixed;left:50%;bottom:94px;z-index:9998;width:min(330px,88vw);transform:translate(-50%,18px) scale(.96);opacity:0;pointer-events:none;padding:14px 16px;border-radius:21px;background:linear-gradient(150deg,#fff6c9,#efd181);border:3px solid #bf8b37;box-shadow:0 13px 38px rgba(0,0,0,.38),0 5px 0 #6d431e;color:#382616;transition:opacity .2s ease,transform .2s ease}
    .sn-secret-card.show{opacity:1;transform:translate(-50%,0) scale(1)}
    .sn-secret-card strong{display:block;padding-right:30px;font-size:17px;line-height:1.15}.sn-secret-card p{margin:5px 0 0;font-size:12px;line-height:1.38;font-weight:760;color:#654725}.sn-secret-progress{margin-top:8px;font-size:10px;font-weight:1000;letter-spacing:.3px;color:#2f6f39;text-transform:uppercase}
    .sn-secret-pop{animation:snSecretPop .58s ease}.sn-secret-spin{animation:snSecretSpin .85s cubic-bezier(.2,.8,.25,1)}
    .sn-secret-spark{position:fixed;z-index:9997;pointer-events:none;font-size:20px;animation:snSecretSpark .8s ease-out forwards;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}
    .sn-mini-duck{position:fixed;left:-58px;bottom:70px;z-index:9997;font-size:42px;pointer-events:none;filter:drop-shadow(0 4px 4px rgba(0,0,0,.28));animation:snDuckWalk 2.6s linear forwards}
    @keyframes snSecretPop{0%,100%{transform:scale(1) rotate(0)}28%{transform:scale(1.16) rotate(-7deg)}58%{transform:scale(.95) rotate(6deg)}80%{transform:scale(1.06) rotate(-2deg)}}
    @keyframes snSecretSpin{0%{transform:rotate(0) scale(1)}55%{transform:rotate(740deg) scale(1.2)}100%{transform:rotate(720deg) scale(1)}}
    @keyframes snSecretSpark{0%{opacity:0;transform:translate(0,6px) scale(.4) rotate(0)}22%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.15) rotate(130deg)}}
    @keyframes snDuckWalk{0%{left:-58px;transform:translateY(0) rotate(-4deg)}12%{transform:translateY(-8px) rotate(4deg)}24%{transform:translateY(0) rotate(-4deg)}36%{transform:translateY(-8px) rotate(4deg)}48%{transform:translateY(0) rotate(-4deg)}60%{transform:translateY(-8px) rotate(4deg)}72%{transform:translateY(0) rotate(-4deg)}84%{transform:translateY(-8px) rotate(4deg)}100%{left:calc(100% + 58px);transform:translateY(0) rotate(-4deg)}}
    @media(prefers-reduced-motion:reduce){.sn-secret-pop,.sn-secret-spin,.sn-secret-spark,.sn-mini-duck{animation:none!important}.sn-mini-duck{display:none}}
  `;
  document.head.appendChild(style);
}

let audioCtx=null;
function ctx(){
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return null;
  audioCtx ||= new C();
  if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  return audioCtx;
}
function tone(freq=620,dur=.09,type='sine',gain=.035,delay=0){
  const c=ctx();if(!c)return;
  const now=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+dur+.02);
}
function sound(kind){
  if(kind==='squeak'){tone(760,.08,'square',.022);tone(980,.07,'sine',.026,.07);}
  if(kind==='psst'){tone(420,.06,'triangle',.018);tone(310,.09,'triangle',.015,.06);}
  if(kind==='magic'){tone(520,.09,'sine',.028);tone(690,.10,'sine',.027,.08);tone(930,.13,'sine',.025,.16);}
  if(kind==='quack'){tone(470,.10,'sawtooth',.04);tone(260,.17,'square',.025,.08);}
}

function secretCard(id){
  const cfg=secrets[id];if(!cfg)return;
  const state=markFound(id);
  let card=q('#snSecretCard');
  if(!card){
    card=document.createElement('div');card.id='snSecretCard';card.className='sn-secret-card';card.setAttribute('role','status');card.setAttribute('aria-live','polite');document.body.appendChild(card);
  }
  const progress=state.complete?'🏆 Alle 4 gevonden — Secret Master!':`🔐 Secret ${state.count}/4 gevonden`;
  card.innerHTML=`<strong>${cfg.title}</strong><p>${cfg.text}</p><div class="sn-secret-progress">${progress}</div>`;
  card.classList.remove('show');void card.offsetWidth;card.classList.add('show');
  clearTimeout(window.__snSecretCardTimer);window.__snSecretCardTimer=setTimeout(()=>card.classList.remove('show'),3600);
}

function animateOnce(el,cls){
  if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),1000);
}
function sparksAround(el,count=7){
  if(!el)return;const r=el.getBoundingClientRect();
  for(let i=0;i<count;i++){
    const s=document.createElement('span');s.className='sn-secret-spark';s.textContent=i%3===0?'✨':'✦';
    s.style.left=(r.left+r.width/2-8)+'px';s.style.top=(r.top+r.height/2-10)+'px';
    const a=(Math.PI*2*i/count)+(Math.random()*.25);const d=34+Math.random()*42;s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',Math.sin(a)*d+'px');
    document.body.appendChild(s);setTimeout(()=>s.remove(),900);
  }
}

function installLogo(){
  const el=q('.logo');if(!el||el.dataset.snSecretLogo)return;el.dataset.snSecretLogo='1';
  let taps=[];
  el.addEventListener('click',()=>{
    const now=Date.now();taps=taps.filter(t=>now-t<1300);taps.push(now);
    if(taps.length>=3){taps=[];animateOnce(el,'sn-secret-pop');sparksAround(el,5);sound('squeak');secretCard('logo');}
  });
}

function installWelcome(){
  const el=q('#welcomeText');if(!el||el.dataset.snSecretWelcome)return;el.dataset.snSecretWelcome='1';
  let timer=null,fired=false,oldText='';
  const cancel=()=>{clearTimeout(timer);timer=null;};
  el.addEventListener('pointerdown',()=>{
    fired=false;oldText=el.textContent;cancel();
    timer=setTimeout(()=>{
      fired=true;sound('psst');sparksAround(el,5);animateOnce(el,'sn-secret-pop');el.textContent='👀 Pssst… geheime Snazzler!';secretCard('welcome');setTimeout(()=>{if(el.textContent.includes('geheime Snazzler'))el.textContent=oldText;},1900);
    },800);
  });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>el.addEventListener(ev,cancel));
  el.addEventListener('click',e=>{if(fired){e.preventDefault();e.stopPropagation();fired=false;}},true);
}

function installCompass(){
  const el=q('#bigStart .compass');if(!el||el.dataset.snSecretCompass4)return;el.dataset.snSecretCompass4='1';
  let taps=[];
  el.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const now=Date.now();taps=taps.filter(t=>now-t<1450);taps.push(now);
    if(taps.length>=3){taps=[];animateOnce(el,'sn-secret-spin');sparksAround(el,9);sound('magic');secretCard('compass');}
  },true);
}

function installHome(){
  const el=q('.bottom button:first-child');if(!el||el.dataset.snSecretHome)return;el.dataset.snSecretHome='1';
  let taps=[];
  el.addEventListener('click',()=>{
    const now=Date.now();taps=taps.filter(t=>now-t<1800);taps.push(now);
    if(taps.length>=5){
      taps=[];const duck=document.createElement('div');duck.className='sn-mini-duck';duck.textContent='🦆';duck.setAttribute('aria-hidden','true');document.body.appendChild(duck);sound('quack');secretCard('home');setTimeout(()=>duck.remove(),2800);
    }
  },true);
}

function install(){ensureStyles();installLogo();installWelcome();installCompass();installHome();}
function init(){
  if(window.__snazzleV37FourSecrets)return;window.__snazzleV37FourSecrets=true;install();
  const observer=new MutationObserver(()=>{clearTimeout(window.__snSecretInstallTimer);window.__snSecretInstallTimer=setTimeout(install,90);});
  observer.observe(document.body,{childList:true,subtree:true});
  console.info(`Snazzle secrets ${V37} geladen`);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
