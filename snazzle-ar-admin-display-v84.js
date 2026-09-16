// Snazzle AR admin display v245 compatibility.
// Houdt alleen de oude v83 beheer-UI weg en laadt de veilige beheer-guard + anonieme statistieken.
// Camera, GPS, werelddata en plaatsing worden uitsluitend door de centrale AR-runtime geladen.
if(!document.getElementById('snArAdminDisplayV85')){
  const s=document.createElement('style');
  s.id='snArAdminDisplayV85';
  s.textContent='#snArAdminV83,#snArAdminTab{display:none!important}#snArAdminV85.on{display:block!important}';
  document.head.appendChild(s);
}

const fresh=window.__snazzleFresh||((p)=>`${p}?v=${Date.now()}`);
Promise.all([
  import(fresh('./snazzle-ar-admin-guard-v85.js')),
  import(fresh('./snazzle-ar-stats-v113.js'))
]).catch(err=>console.warn('Snazzle AR beheer-compatibiliteit kon niet volledig laden',err));

window.SnazzleArAdminDisplayV245={ready:true};
