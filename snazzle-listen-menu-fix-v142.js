// Snazzle v157 — eenvoudige Luisterverhalen-opener zonder globale click/pointer intercepts.
// De zichtbare menuknop wordt in v157 rechtstreeks gekoppeld; dit bestand levert alleen de opener.

const VERSION='157.0.0';

function closeQuickMenuHard(){
  try{document.getElementById('quickMenuClose')?.click();}catch{}
  const overlay=document.getElementById('quickMenuOverlay');
  if(overlay){
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
  }
  document.getElementById('quickMenuBtn')?.setAttribute('aria-expanded','false');
  document.documentElement.style.overflow='';
  document.body.style.overflow='';
}

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__snListenFixToast157);
  window.__snListenFixToast157=setTimeout(()=>el.classList.remove('show'),2600);
}

function forceOpenSheet(){
  const sheet=document.getElementById('snListenSheet');
  if(!sheet) return false;
  sheet.classList.add('show');
  sheet.setAttribute('aria-hidden','false');
  try{sheet.querySelector('.panel')?.scrollTo?.({top:0,behavior:'auto'});}catch{}
  return true;
}

function refreshStories(){
  try{window.SnazzleListenListFixV150?.refresh?.();}catch(err){console.warn('Luisterverhalenlijst vernieuwen',err);}
}

function openListenStories(){
  closeQuickMenuHard();
  const api=window.SnazzleListenStoriesV63;
  if(api?.open){
    try{api.open();refreshStories();return true;}
    catch(err){console.error('Luisterverhalen openen mislukt',err);}
  }
  if(forceOpenSheet()){
    refreshStories();
    return true;
  }
  toast('Luisterverhalen worden nog geladen. Probeer het zo nog eens.');
  return false;
}

console.info(`Snazzle luistermenu helper ${VERSION} geladen`);
window.SnazzleListenMenuFixV142={open:openListenStories,version:VERSION};