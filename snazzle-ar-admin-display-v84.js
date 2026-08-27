// Snazzle AR admin display v112 compatibility.
// Houdt het oude v83-paneel verborgen en laadt centraal AR-beheer, player, plaatsstudio en de mobiele kaartfix.
if(!document.getElementById('snArAdminDisplayV85')){
  const s=document.createElement('style');
  s.id='snArAdminDisplayV85';
  s.textContent='#snArAdminV83,#snArAdminTab{display:none!important}#snArAdminV85.on{display:block!important}';
  document.head.appendChild(s);
}

const fresh=window.__snazzleFresh||((p)=>`${p}?v=${Date.now()}`);
Promise.all([
  import(fresh('./snazzle-ar-admin-guard-v85.js')),
  import(fresh('./snazzle-ar-admin-v85.js')),
  import(fresh('./snazzle-ar-world-v85.js')),
  import(fresh('./snazzle-ar-place-studio-v90.js')),
  import(fresh('./snazzle-ar-zone-map-fix-v112.js'))
]).catch(err=>console.warn('Snazzle AR v112 kon niet volledig laden',err));