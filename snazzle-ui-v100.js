// Snazzle UI v100 — herstelt alleen de premium hoofdpagina.
// Het v98-menu blijft eigenaar van het menu; deze module raakt het menu niet aan.

const $v100=(s,r=document)=>r?.querySelector?.(s)||null;
const $$v100=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];

function v100Name(){ return (localStorage.getItem('snazzleName')||'').trim(); }
function v100Village(){ return localStorage.getItem('snazzleVillage')||'Montfort'; }

function installV100Styles(){
  if($v100('#snazzleHomeV100Styles')) return;
  const s=document.createElement('style');
  s.id='snazzleHomeV100Styles';
  s.textContent=`
    #snazzlePassportV100{margin:10px 0 16px;padding:20px 20px 17px;border-radius:27px;background:linear-gradient(145deg,#f6ebc7,#ead29a);color:#173d35;border:4px solid #b88f50;box-shadow:0 7px 0 #6a482a,0 14px 28px rgba(0,0,0,.20);overflow:hidden}
    #snazzlePassportV100 .sn-pass-kicker{font-size:10px;letter-spacing:1.7px;text-transform:uppercase;font-weight:1000;color:#8b6835;margin-bottom:9px}
    #snazzlePassportV100 #welcomeText{margin:0 0 16px!important;color:#17493f!important;text-shadow:none!important;font-size:35px!important;line-height:1.04!important;text-transform:none!important;font-weight:900!important}
    #snazzlePassportV100 .sn-pass-stats{display:grid;grid-template-columns:.85fr 1.1fr 1.15fr;border-top:1px dashed rgba(84,66,37,.30);padding-top:12px}
    #snazzlePassportV100 .sn-pass-stat{padding:0 10px;border-right:1px solid rgba(84,66,37,.20);min-width:0}.sn-pass-stat:first-child{padding-left:0}.sn-pass-stat:last-child{border-right:0;padding-right:0}
    #snazzlePassportV100 .sn-pass-stat strong{display:block;font-size:16px;color:#123f35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sn-pass-stat small{display:block;margin-top:2px;font-size:10px;color:#765d38;line-height:1.2}
    #hero.sn-v100-hero{min-height:360px!important;padding:26px 22px!important;justify-content:flex-end!important;border-color:#77502d!important;box-shadow:0 8px 0 #442918,0 14px 30px rgba(0,0,0,.26)!important}
    #hero.sn-v100-hero small{font-size:12px!important;letter-spacing:1.8px!important;color:#ffe899!important;margin-bottom:4px!important}
    #hero.sn-v100-hero p{font-size:20px!important;font-weight:850!important;line-height:1.35!important;max-width:420px!important;margin:0 0 20px!important;color:#fff!important;text-shadow:0 2px 5px rgba(0,0,0,.5)!important}
    #hero.sn-v100-hero #adventureTitleV100{font-size:32px!important;line-height:1.05!important;margin:0!important;color:#fff!important;text-shadow:0 3px 9px rgba(0,0,0,.55)!important}
    #snHomeFeaturesV100{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:11px!important;margin:18px 0 5px!important;width:100%!important}
    #snHomeFeaturesV100 .sn-home-card-v100{min-height:126px!important;border:4px solid #704824!important;border-radius:22px!important;padding:15px!important;color:#fff!important;text-align:left!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-end!important;box-shadow:0 6px 0 #432918,0 12px 22px rgba(0,0,0,.19)!important;appearance:none!important;-webkit-appearance:none!important;overflow:hidden!important;position:relative!important}
    #snHomeFeaturesV100 .sn-home-card-v100:nth-child(1){background:linear-gradient(145deg,#4f7351,#24533a)!important}#snHomeFeaturesV100 .sn-home-card-v100:nth-child(2){background:linear-gradient(145deg,#6557b9,#394c95)!important}#snHomeFeaturesV100 .sn-home-card-v100:nth-child(3){background:linear-gradient(145deg,#8a6940,#59623c)!important}#snHomeFeaturesV100 .sn-home-card-v100:nth-child(4){background:linear-gradient(145deg,#7259a7,#3f7285)!important}#snHomeFeaturesV100 .sn-home-card-v100:nth-child(5){background:linear-gradient(145deg,#744cb4,#3d296f)!important}#snHomeFeaturesV100 .sn-home-card-v100:nth-child(6){background:linear-gradient(145deg,#2f7550,#174b35)!important}
    #snHomeFeaturesV100 .sn-home-icon-v100{font-size:30px!important;line-height:1!important;margin-bottom:8px!important}#snHomeFeaturesV100 strong{display:block!important;font-size:17px!important;line-height:1.12!important}#snHomeFeaturesV100 small{display:block!important;margin-top:5px!important;color:#f3f2e0!important;font-size:11px!important;font-weight:700!important;line-height:1.3!important}
    @media(max-width:350px){#snHomeFeaturesV100{grid-template-columns:1fr!important}#snHomeFeaturesV100 .sn-home-card-v100{min-height:96px!important}}
  `;
  document.head.appendChild(s);
}

function updatePassportCountV100(){
  const target=$v100('#passportFindsV100'); if(!target) return;
  const rows=$$v100('#findsList .listitem');
  const valid=rows.filter(x=>!x.textContent.includes('Nog niets gevonden'));
  target.textContent=String(valid.length);
}

function invokeV100(action){
  const menuButton=$v100(`#snV98MenuList [data-sn-action="${action}"]`);
  if(menuButton){ menuButton.click(); return; }
  const fallback={hunt:'#navHunt',friends:'#navFriends',findings:'#findsBtn',shop:'#navShop',profile:'#navProfile'}[action];
  if(fallback) $v100(fallback)?.click();
}

function restorePremiumHomeV100(){
  installV100Styles();
  const top=$v100('.top');
  const welcome=$v100('#welcomeText');
  if(!top||!welcome) return;

  // Oude losse feature-lagen verwijderen zodat Home maar één duidelijke tegelset heeft.
  $v100('#snHomeFeaturesV99')?.remove();
  $v100('#snV96Features')?.remove();

  let passport=$v100('#snazzlePassportV100');
  if(!passport){
    passport=document.createElement('section');
    passport.id='snazzlePassportV100';
    passport.innerHTML=`<div class="sn-pass-kicker">Mijn Snazzle paspoort</div><div class="sn-pass-welcome"></div><div class="sn-pass-stats"><div class="sn-pass-stat"><strong id="passportFindsV100">0</strong><small>Snazzles gevonden</small></div><div class="sn-pass-stat"><strong id="passportVillageV100"></strong><small>gekozen dorp</small></div><div class="sn-pass-stat"><strong>Explorer</strong><small>klaar voor avontuur</small></div></div>`;
    top.insertAdjacentElement('afterend',passport);
  }
  const slot=$v100('.sn-pass-welcome',passport);
  if(slot && welcome.parentElement!==slot) slot.appendChild(welcome);
  const name=v100Name();
  welcome.textContent=name?`Hoi ${name}!`:'Hoi!';
  const village=$v100('#passportVillageV100'); if(village) village.textContent=v100Village();
  updatePassportCountV100();

  const hero=$v100('#hero');
  if(hero){
    hero.classList.add('sn-v100-hero');
    const kicker=hero.querySelector('small'); if(kicker) kicker.textContent='Snazzle avontuur';
    const para=hero.querySelector('p'); if(para) para.textContent='Vind een Snazzle en ontdek jouw dorp.';
    let title=$v100('#adventureTitleV100',hero);
    if(!title){ title=document.createElement('h2'); title.id='adventureTitleV100'; hero.appendChild(title); }
    title.textContent='Klaar voor avontuur?';
  }

  const quick=$v100('.quick');
  if(quick&&!$v100('#snHomeFeaturesV100')){
    const sec=document.createElement('section'); sec.id='snHomeFeaturesV100';
    const features=[
      ['🎮','Snazzle Spel','Jouw Snazzle Wereld','game'],
      ['✨','Mijn Collectie','Kaarten, Nest & jaarstand','collection'],
      ['📚','De Bieb','Lezen en je leeshoek bouwen','bieb'],
      ['🎧','Luisterverhalen','Luister naar Snazzle verhalen','listen'],
      ['📷','Snazzle AR','Zoek met camera en GPS','ar'],
      ['🗞️','Snazzle Nieuws','Nieuws en verhalen','news']
    ];
    for(const [icon,title,sub,action] of features){
      const b=document.createElement('button'); b.type='button'; b.className='sn-home-card-v100'; b.dataset.homeActionV100=action;
      b.innerHTML=`<span class="sn-home-icon-v100">${icon}</span><strong>${title}</strong><small>${sub}</small>`;
      b.onclick=()=>invokeV100(action); sec.appendChild(b);
    }
    quick.insertAdjacentElement('afterend',sec);
  }
  document.documentElement.dataset.snazzleHome='v100';
}

let v100Timer;
function scheduleV100(){ clearTimeout(v100Timer); v100Timer=setTimeout(restorePremiumHomeV100,70); }
function initV100(){
  if(window.__snazzleHomeV100) return;
  window.__snazzleHomeV100=true;
  restorePremiumHomeV100();
  const app=$v100('.app');
  if(app){ new MutationObserver(scheduleV100).observe(app,{childList:true,subtree:true,characterData:true}); }
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') scheduleV100(); });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initV100,{once:true}); else initV100();
window.SnazzleHomeV100={restore:restorePremiumHomeV100};
export {restorePremiumHomeV100};
