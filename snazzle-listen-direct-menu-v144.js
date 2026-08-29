// Snazzle v149 — precies één Luisterverhalen-keuze in het compacte menu.
// De v129-hoofdmenu-module maakt zelf een klikbare spiegel van de verborgen bronknop.
// Een extra vaste Luisterverhalen-knop is daarom niet meer nodig en veroorzaakte dubbelen.
// De bestaande v142-clickfix opent de luistermodule rechtstreeks wanneer op de spiegel wordt getikt.

const VERSION='149.0.0';

function textOf(el){
  return String(`${el?.id||''} ${el?.getAttribute?.('aria-label')||''} ${el?.textContent||''}`).toLowerCase();
}

function isListen(el){
  return /luisterverhalen|luister verhalen|snlistenmenuv63/.test(textOf(el));
}

function dedupe(){
  // Verwijder de oude extra vaste knop uit eerdere versies.
  document.getElementById('snListenDirectMenuV144')?.remove();

  const root=document.getElementById('snMainMenuV129');
  const play=root?.querySelector('[data-options="play"]');
  if(!play)return false;

  // Laat precies één door v129 gemaakte spiegelknop staan.
  const listenProxies=[...play.querySelectorAll('.sn-main-proxy')].filter(isListen);
  listenProxies.slice(1).forEach(el=>el.remove());
  return true;
}

function boot(){
  let tries=0;
  const tryInstall=()=>{
    tries++;
    if(dedupe()||tries>=50)return;
    setTimeout(tryInstall,120);
  };
  tryInstall();

  // Laat laat geladen menu-items toe, maar verwijder alleen echte duplicaten.
  const root=document.getElementById('snMainMenuV129');
  const play=root?.querySelector('[data-options="play"]');
  if(play&&!play.__snListenDedupe149){
    let queued=false;
    const obs=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      queueMicrotask(()=>{queued=false;dedupe();});
    });
    obs.observe(play,{childList:true});
    play.__snListenDedupe149=obs;
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

console.info(`Snazzle luistermenu dedupe ${VERSION} geladen`);
window.SnazzleListenDirectMenuV144={install:dedupe,version:VERSION};
