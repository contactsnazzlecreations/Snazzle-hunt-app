// Snazzle v268 — stabiele schermvullende beheeromgeving op mobiel en desktop.
// Houdt de gewone app-navigatie uit beeld zolang Beheer open is en maakt
// de groeiende beheertab-balk horizontaal, sticky en zonder overlap.

const STYLE_ID='snazzleAdminShellV268Style';
const OPEN_CLASS='sn-admin-sheet-open';
let observer=null;

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    html.${OPEN_CLASS},body.${OPEN_CLASS}{
      overflow:hidden!important;
      overscroll-behavior:none!important;
      touch-action:manipulation;
    }

    body.${OPEN_CLASS} .bottom,
    body.${OPEN_CLASS} #quickMenuBtn,
    body.${OPEN_CLASS} #quickMenuOverlay{
      opacity:0!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }

    #adminSheet.sheet{
      z-index:2147482500!important;
      padding:0!important;
      align-items:stretch!important;
      justify-content:center!important;
      background:#0a3828!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
      overflow:hidden!important;
    }
    #adminSheet.sheet.show{display:flex!important}

    #adminSheet>.panel{
      position:relative!important;
      isolation:isolate!important;
      width:min(680px,100vw)!important;
      height:100dvh!important;
      min-height:100dvh!important;
      max-height:100dvh!important;
      margin:0 auto!important;
      padding:calc(env(safe-area-inset-top) + 12px) 14px calc(env(safe-area-inset-bottom) + 28px)!important;
      border:0!important;
      border-radius:0!important;
      overflow-y:auto!important;
      overflow-x:hidden!important;
      overscroll-behavior:contain!important;
      -webkit-overflow-scrolling:touch!important;
      background:linear-gradient(180deg,#fff0ba 0%,#f4dda5 42%,#efd394 100%)!important;
      box-shadow:none!important;
      scroll-padding-top:78px!important;
    }

    #adminSheet>.panel>.handle{display:none!important}

    #adminSheet .close[data-close="adminSheet"]{
      position:sticky!important;
      top:6px!important;
      float:right!important;
      z-index:2147483600!important;
      min-width:52px!important;
      min-height:52px!important;
      margin:0 0 4px 8px!important;
      display:grid!important;
      place-items:center!important;
      pointer-events:auto!important;
      touch-action:manipulation!important;
      box-shadow:0 4px 0 #4c2e1d,0 7px 16px rgba(0,0,0,.2)!important;
    }

    #adminSheet .super-only>.tabs{
      position:sticky!important;
      top:0!important;
      z-index:2147482400!important;
      display:flex!important;
      grid-template-columns:none!important;
      gap:8px!important;
      width:auto!important;
      max-width:none!important;
      margin:12px -4px 14px!important;
      padding:9px 62px 10px 4px!important;
      overflow-x:auto!important;
      overflow-y:hidden!important;
      white-space:nowrap!important;
      scrollbar-width:none!important;
      -webkit-overflow-scrolling:touch!important;
      background:linear-gradient(180deg,rgba(255,240,186,.99),rgba(246,221,165,.97))!important;
      border-bottom:1px solid rgba(130,87,46,.28)!important;
      box-shadow:0 7px 14px rgba(81,55,27,.08)!important;
    }
    #adminSheet .super-only>.tabs::-webkit-scrollbar{display:none!important}
    #adminSheet .super-only>.tabs>button{
      flex:0 0 auto!important;
      min-width:104px!important;
      min-height:44px!important;
      padding:10px 12px!important;
      border-radius:12px!important;
      font-size:11px!important;
      line-height:1.15!important;
      white-space:nowrap!important;
    }

    #adminSheet .admin-section{
      position:relative!important;
      z-index:1!important;
      scroll-margin-top:78px!important;
    }

    #adminSheet .statusbar{
      clear:both!important;
      margin-top:4px!important;
    }

    #adminSheet #adminLogoutBtn{
      margin-bottom:calc(env(safe-area-inset-bottom) + 8px)!important;
    }

    @media(min-width:701px){
      #adminSheet.sheet{
        padding:18px!important;
        background:rgba(3,16,8,.92)!important;
      }
      #adminSheet>.panel{
        height:calc(100dvh - 36px)!important;
        min-height:0!important;
        max-height:calc(100dvh - 36px)!important;
        border:4px solid #82572e!important;
        border-radius:28px!important;
        box-shadow:0 18px 48px rgba(0,0,0,.34)!important;
      }
    }
  `;
  document.head.appendChild(style);
}

function adminSheet(){
  return document.getElementById('adminSheet');
}

function normalizeTabs(){
  const tabs=document.querySelector('#adminSheet .super-only>.tabs');
  if(!tabs)return;
  tabs.setAttribute('role','tablist');
  tabs.setAttribute('aria-label','Beheeronderdelen');
  tabs.querySelectorAll(':scope>button').forEach(button=>{
    button.setAttribute('role','tab');
    button.setAttribute('aria-selected',button.classList.contains('on')?'true':'false');
  });
}

function syncOpenState(){
  const sheet=adminSheet();
  const open=!!sheet?.classList.contains('show');
  document.documentElement.classList.toggle(OPEN_CLASS,open);
  document.body?.classList.toggle(OPEN_CLASS,open);
  if(sheet)sheet.setAttribute('aria-hidden',open?'false':'true');
  normalizeTabs();
}

function installObserver(){
  const sheet=adminSheet();
  if(!sheet||observer)return;
  observer=new MutationObserver(records=>{
    let tabsChanged=false;
    for(const record of records){
      if(record.type==='attributes'&&record.target===sheet)syncOpenState();
      if(record.type==='childList')tabsChanged=true;
      if(record.type==='attributes'&&record.target?.closest?.('#adminSheet .tabs'))tabsChanged=true;
    }
    if(tabsChanged)normalizeTabs();
  });
  observer.observe(sheet,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
}

function bindTabState(){
  document.addEventListener('click',event=>{
    const tab=event.target?.closest?.('#adminSheet .super-only>.tabs>button');
    if(!tab)return;
    requestAnimationFrame(()=>{
      normalizeTabs();
      try{tab.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});}catch{}
    });
  },true);
}

function init(){
  installStyles();
  installObserver();
  bindTabState();
  syncOpenState();
  document.addEventListener('snazzle:admin-ui-ready',()=>{installObserver();syncOpenState();});
  window.addEventListener('pageshow',()=>{installObserver();syncOpenState();});
  window.addEventListener('pagehide',()=>{
    document.documentElement.classList.remove(OPEN_CLASS);
    document.body?.classList.remove(OPEN_CLASS);
  });
  console.info('Snazzle admin shell v268 geladen');
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

window.SnazzleAdminShellV268={sync:syncOpenState,normalizeTabs};
