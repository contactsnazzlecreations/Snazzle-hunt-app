// Snazzle Hunt v95 — ultra-light stable shell.
// Doel: eerst een volledig scrollbare, klikbare home + menu op Android.
// Firebase en alle zware uitbreidingsmodules zijn tijdelijk uit het opstartpad gehaald.

const runtimeVersion='20260826-v95';
const fresh=(path)=>`${path}${path.includes('?')?'&':'?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion=runtimeVersion;
window.__snazzleFresh=fresh;
window.__snazzleSafeMode='v95';

// Android-safe performance guard: de oude index bevat veel oneindige animaties.
// Die kosten op sommige mobiele browsers zoveel compositor/main-thread tijd dat scroll en taps vastlopen.
const perfStyle=document.createElement('style');
perfStyle.id='snazzleV95PerfGuard';
perfStyle.textContent=`
  *,*::before,*::after{
    animation:none!important;
    transition:none!important;
    scroll-behavior:auto!important;
  }
  html,body{
    overscroll-behavior:auto!important;
    touch-action:pan-y pinch-zoom!important;
  }
  body{
    overflow-x:hidden!important;
  }
  .app{
    contain:layout style!important;
  }
  .bottom{
    transform:translateX(-50%) translateZ(0)!important;
  }
`;
document.head.appendChild(perfStyle);

let releaseBoot=()=>{};
(function installBoot(){
  const build=()=>{
    if(!document.body||document.getElementById('snV95Boot'))return;
    const splash=document.createElement('div');
    splash.id='snV95Boot';
    splash.setAttribute('aria-hidden','true');
    splash.style.cssText='position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:linear-gradient(180deg,#0d6944,#043b2c);color:#fff7df;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif';
    splash.innerHTML='<div style="padding:24px"><div style="width:104px;height:104px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;background:#ffd15c;border:5px solid #775026;font-size:50px">🦆</div><div style="font-size:42px;font-weight:1000;color:#ffd35e">Snazzle</div><div style="margin-top:10px;font-size:19px;font-weight:900">Samen naar buiten</div></div>';
    document.body.appendChild(splash);
    let done=false;
    releaseBoot=()=>{
      if(done)return;
      done=true;
      splash.remove();
      document.body.classList.remove('sn-v59-booting');
      document.body.classList.add('sn-v59-ready','sn-v95-ready');
    };
    window.__snazzleReleaseBoot=releaseBoot;
    setTimeout(releaseBoot,2200);
  };
  if(document.body)build();else document.addEventListener('DOMContentLoaded',build,{once:true});
})();

async function safeImport(path){
  try{return await import(fresh(path));}
  catch(err){console.warn('Snazzle safe shell kon niet laden:',path,err);return null;}
}

// Alleen de lokale shell. Geen Firebase, geen AR, geen kaartwereld, geen observers uit extra modules.
const shell=await safeImport('./snazzle-shell-v93.js');
try{
  shell?.initShell?.();
  shell?.ensureCurrentHome?.();
}catch(err){
  console.warn('Snazzle v95 shell init',err);
}

// Extra harde fallback: als de shell om welke reden ook geen menuknop plaatste,
// maak hier een simpele knop die rechtstreeks de bestaande sheets opent.
if(!document.getElementById('quickMenuBtn')){
  const top=document.querySelector('.top');
  if(top){
    const oldAdmin=document.getElementById('adminBtn');
    if(oldAdmin)oldAdmin.style.display='none';
    const btn=document.createElement('button');
    btn.id='quickMenuBtn';
    btn.type='button';
    btn.textContent='☰';
    btn.setAttribute('aria-label','Menu openen');
    btn.style.cssText='width:54px;height:54px;border-radius:16px;border:3px solid #8a6539;background:#285e35;color:white;font-size:28px;font-weight:900;position:relative;z-index:10001';
    top.appendChild(btn);

    const menu=document.createElement('div');
    menu.id='snV95FallbackMenu';
    menu.style.cssText='position:fixed;inset:0;z-index:10000;background:rgba(2,16,9,.72);display:none;align-items:flex-start;justify-content:flex-end';
    menu.innerHTML='<div style="width:min(88vw,380px);height:100%;overflow:auto;background:#0b4c31;color:#fff;padding:22px 16px"><button id="snV95Close" style="float:right;width:44px;height:44px;border:0;border-radius:12px;font-size:24px">×</button><h2 style="margin:8px 0 22px;color:#ffd45a">Snazzle Menu</h2><div id="snV95Items" style="display:grid;gap:10px"></div></div>';
    document.body.appendChild(menu);
    const items=[['🏠 Home','home'],['🔎 Hunt','villageSheet'],['👥 Vrienden','friendsSheet'],['🏆 Mijn vondsten','findsSheet'],['🛍️ Shop','shopSheet'],['👤 Profiel','profileSheet'],['🔒 Beheer','adminLogin']];
    const box=document.getElementById('snV95Items');
    items.forEach(([label,target])=>{
      const b=document.createElement('button');
      b.type='button';
      b.textContent=label;
      b.style.cssText='width:100%;min-height:58px;border:1px solid rgba(255,255,255,.25);border-radius:14px;background:rgba(255,255,255,.1);color:#fff;text-align:left;padding:12px;font-size:16px;font-weight:800';
      b.onclick=()=>{
        menu.style.display='none';
        document.body.style.overflow='';
        if(target==='home'){window.scrollTo(0,0);return;}
        document.getElementById(target)?.classList.add('show');
      };
      box.appendChild(b);
    });
    const open=()=>{menu.style.display='flex';document.body.style.overflow='hidden';};
    btn.onclick=open;
    btn.addEventListener('touchend',e=>{e.preventDefault();open();},{passive:false});
    document.getElementById('snV95Close').onclick=()=>{menu.style.display='none';document.body.style.overflow='';};
  }
}

// Zorg dat bestaande sluitknoppen werken, zelfs zonder app-core.
document.querySelectorAll('[data-close]').forEach(btn=>{
  btn.onclick=()=>document.getElementById(btn.dataset.close)?.classList.remove('show');
});

releaseBoot();

// Bewust GEEN app-core/Firebase/extra modules in v95.
// Eerst bevestigen dat scrollen en menu stabiel zijn; daarna functies gefaseerd terugzetten.
