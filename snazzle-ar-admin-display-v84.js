// Snazzle AR admin display v84 — small compatibility layer for the existing admin tab CSS.
if(!document.getElementById('snArAdminDisplayV84')){
  const s=document.createElement('style');
  s.id='snArAdminDisplayV84';
  s.textContent='#snArAdminV83{display:none}#snArAdminV83.on{display:block!important}';
  document.head.appendChild(s);
}
