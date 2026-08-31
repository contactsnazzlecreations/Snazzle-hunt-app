// Snazzle AR legacy cleanup v187
// Verwijdert oude AR-beheer/plaatsstudio-lagen die naast v85/v184 in een bestaande PWA-sessie kunnen blijven hangen.

let observer=null;

function removeLegacy(){
  document.querySelectorAll('#snArStudioLaunch90,#snArStudioV90,#snArAdminTab,#snArAdminV83').forEach(el=>el.remove());

  // In AR-beheer mag exact één kaart+camera-knop overblijven: de actuele v184-knop.
  const grid=document.querySelector('#snArAdminV85 .sn-ar-admin-grid');
  if(grid){
    const candidates=[...grid.querySelectorAll('button')].filter(btn=>/Plaats via kaart\s*\+\s*camera/i.test(btn.textContent||''));
    let current=candidates.find(btn=>btn.id==='snArStudioLaunch184')||null;
    if(current){
      candidates.forEach(btn=>{if(btn!==current)btn.remove();});
    }else if(candidates.length>1){
      // Laat tijdelijk één knop staan totdat v184 zichzelf installeert.
      candidates.slice(1).forEach(btn=>btn.remove());
    }
  }

  // Dubbele actuele knoppen mogen door een oude soft-reload ook niet blijven bestaan.
  const currentButtons=[...document.querySelectorAll('#snArStudioLaunch184')];
  currentButtons.slice(1).forEach(btn=>btn.remove());
}

function boot(){
  removeLegacy();
  if(observer||!document.body)return;
  observer=new MutationObserver(removeLegacy);
  observer.observe(document.body,{childList:true,subtree:true});
  [100,300,800,1800,3500,7000].forEach(ms=>setTimeout(removeLegacy,ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SnazzleArLegacyCleanupV187={run:removeLegacy};
