// Snazzle AR admin display v85 compatibility.
// Houdt het oude v83-paneel verborgen en laadt de centrale AR-beheer/player-laag v85.
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
  import(fresh('./snazzle-ar-world-v85.js'))
]).catch(err=>console.warn('Snazzle AR v85 kon niet volledig laden',err));
