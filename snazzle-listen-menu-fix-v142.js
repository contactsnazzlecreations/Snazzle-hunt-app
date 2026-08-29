// Snazzle v151 — directe mobiele koppeling tussen het compacte menu en Luisterverhalen.
// Op sommige Android-browsers kwam na een tik geen bruikbare click meer door.
// Daarom opent Luisterverhalen nu al op pointerup, met click als reserve en zonder dubbele activatie.

const VERSION='151.0.0';

function isListenMenuButton(button){
  if(!(button instanceof Element)) return false;
  if(!button.closest('#quickMenuPanel')) return false;
  const text=`${button.id||''} ${button.getAttribute('aria-label')||''} ${button.textContent||''}`.toLowerCase();
  return /luisterverhalen|luister verhalen|snlistenmenuv63/.test(text);
}

function closeQuickMenu(){
  try{document.getElementById('quickMenuClose')?.click();}catch{}
}

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__snListenFixToast151);
  window.__snListenFixToast151=setTimeout(()=>el.classList.remove('show'),2600);
}

function forceOpenSheet(){
  const sheet=document.getElementById('snListenSheet');
  if(!sheet)return false;
  sheet.classList.add('show');
  sheet.setAttribute('aria-hidden','false');
  try{sheet.querySelector('.panel')?.scrollTo?.({top:0,behavior:'auto'});}catch{}
  return true;
}

function refreshStories(){
  try{window.SnazzleListenListFixV150?.refresh?.();}catch(err){console.warn('Luisterverhalenlijst vernieuwen',err);}
}

function openListenStories(){
  closeQuickMenu();
  let tries=0;
  const attempt=()=>{
    const api=window.SnazzleListenStoriesV63;
    if(api?.open){
      try{api.open();refreshStories();}
      catch(err){
        console.error('Luisterverhalen openen mislukt',err);
        if(forceOpenSheet())refreshStories();
        else toast('Luisterverhalen konden niet openen. Probeer het nog eens.');
      }
      return;
    }
    if(forceOpenSheet()){
      refreshStories();
      return;
    }
    tries++;
    if(tries>=50){
      toast('Luisterverhalen worden nog geladen. Probeer het zo nog eens.');
      return;
    }
    setTimeout(attempt,80);
  };
  setTimeout(attempt,40);
}

let lastActivation=0;
function activate(event){
  const button=event.target instanceof Element ? event.target.closest('button') : null;
  if(!isListenMenuButton(button)) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();

  const now=Date.now();
  if(now-lastActivation<650)return;
  lastActivation=now;
  openListenStories();
}

if(!window.__snListenMenuFix151){
  window.__snListenMenuFix151=true;
  // pointerup is de primaire route op telefoon; click blijft fallback voor muis/toetsenbord.
  document.addEventListener('pointerup',activate,true);
  document.addEventListener('click',activate,true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    activate(event);
  },true);
}

console.info(`Snazzle luistermenu fix ${VERSION} geladen`);
window.SnazzleListenMenuFixV142={open:openListenStories,version:VERSION};