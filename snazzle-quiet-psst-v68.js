// Snazzle v68.1 — verwijder de losse 'Psst… tik voor een hint!'-tegel volledig uit de app.
// De onderliggende Hunt-functionaliteit blijft ongemoeid; alleen deze extra launcher wordt verborgen.

const V68='68.1.0';
let timer68=null;

function ensureStyles68(){
  if(document.getElementById('snazzleHidePsstV68Styles')) return;
  const style=document.createElement('style');
  style.id='snazzleHidePsstV68Styles';
  style.textContent=`.sn-hide-psst-v68{display:none!important}`;
  document.head.appendChild(style);
}

function norm68(value){
  return String(value||'').toLowerCase().replace(/…/g,'...').replace(/\s+/g,' ').trim();
}

function isPsstHint68(value){
  const t=norm68(value);
  return t.includes('psst') && (t.includes('tik voor een hint') || t.includes('tik mij'));
}

function hidePsst68(){
  ensureStyles68();
  const selectors='button,a,[role="button"],[onclick],[tabindex],.card,.tile,.launcher,.quick button';
  const candidates=[...document.querySelectorAll(selectors)]
    .filter(el=>!el.closest('#adminSheet,#adminLogin,.sn-magic-star-overlay'))
    .filter(el=>isPsstHint68(el.textContent));

  candidates.forEach(el=>el.classList.add('sn-hide-psst-v68'));

  // Fallback voor het geval de tekst in een gewone container staat.
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    if(!isPsstHint68(node.nodeValue)) return;
    const parent=node.parentElement;
    if(!parent || parent.closest('#adminSheet,#adminLogin,.sn-magic-star-overlay')) return;
    const target=parent.closest('button,a,[role="button"],[onclick],[tabindex],.card,.tile,.launcher') || parent;
    target.classList.add('sn-hide-psst-v68');
  });
}

function queue68(){
  clearTimeout(timer68);
  timer68=setTimeout(hidePsst68,60);
}

function init68(){
  if(window.__snazzleHidePsstV68) return;
  window.__snazzleHidePsstV68=true;
  hidePsst68();
  new MutationObserver(queue68).observe(document.body,{childList:true,subtree:true,characterData:true});
  console.info(`Snazzle Psst-tegel verwijderd ${V68}`);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init68,{once:true}); else init68();
