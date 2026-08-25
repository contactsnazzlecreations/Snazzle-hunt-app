// Snazzle v61 — robuuste mobiele sluiting voor het beheerpaneel.
// Raakt Firebase/auth niet aan; alleen het sluiten van #adminSheet.

const SHEET_ID='adminSheet';

function closeAdmin(){
  const sheet=document.getElementById(SHEET_ID);
  if(!sheet) return;
  const active=document.activeElement;
  try{ active?.blur?.(); }catch{}
  sheet.classList.remove('show');
  sheet.setAttribute('aria-hidden','true');
}

function installStyle(){
  if(document.getElementById('snazzleAdminCloseV61Style')) return;
  const s=document.createElement('style');
  s.id='snazzleAdminCloseV61Style';
  s.textContent=`
    #adminSheet .close[data-close="adminSheet"]{
      position:sticky!important;
      top:0!important;
      float:right!important;
      z-index:2147483647!important;
      pointer-events:auto!important;
      touch-action:manipulation!important;
      -webkit-tap-highlight-color:transparent!important;
      user-select:none!important;
      min-width:52px!important;
      min-height:52px!important;
      display:grid!important;
      place-items:center!important;
    }
    #adminSheet .panel{position:relative!important;isolation:isolate!important;}
  `;
  document.head.appendChild(s);
}

function bindClose(){
  const sheet=document.getElementById(SHEET_ID);
  const btn=sheet?.querySelector('.close[data-close="adminSheet"]');
  if(!sheet||!btn) return;
  if(btn.dataset.sn61Bound==='1') return;
  btn.dataset.sn61Bound='1';
  btn.setAttribute('aria-label','Beheer sluiten');
  btn.setAttribute('type','button');

  const direct=e=>{
    e.preventDefault();
    e.stopPropagation();
    closeAdmin();
  };
  btn.addEventListener('click',direct,true);
  if(window.PointerEvent) btn.addEventListener('pointerup',direct,true);
  else btn.addEventListener('touchend',direct,{capture:true,passive:false});

  // Tik op donkere achtergrond buiten het paneel sluit Beheer ook.
  sheet.addEventListener('click',e=>{
    if(e.target===sheet) closeAdmin();
  },true);
}

function installGlobalSafety(){
  if(window.__snazzleAdminCloseV61) return;
  window.__snazzleAdminCloseV61=true;

  // Capture-fallback als een latere module clickhandlers vervangt.
  document.addEventListener('click',e=>{
    const close=e.target?.closest?.('#adminSheet .close[data-close="adminSheet"]');
    if(close){
      e.preventDefault();
      e.stopImmediatePropagation();
      closeAdmin();
    }
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && document.getElementById(SHEET_ID)?.classList.contains('show')){
      e.preventDefault();
      closeAdmin();
    }
  },true);
}

function init(){
  installStyle();
  bindClose();
  installGlobalSafety();
  new MutationObserver(()=>bindClose()).observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

window.SnazzleAdminCloseV61={close:closeAdmin};
