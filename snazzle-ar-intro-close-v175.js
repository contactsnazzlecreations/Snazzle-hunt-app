// Snazzle AR intro close v175 — vaste, zichtbare X-sluitknop voor de AR-intro.

function installArIntroCloseV175(){
  const intro=document.getElementById('snArIntro');
  const panel=intro?.querySelector('.sn-ar-panel');
  if(!intro||!panel)return false;

  if(!document.getElementById('snArIntroCloseV175Style')){
    const style=document.createElement('style');
    style.id='snArIntroCloseV175Style';
    style.textContent=`
      #snArIntro .sn-ar-panel{position:relative!important}
      #snArIntroCloseV175{
        position:absolute!important;
        top:12px!important;
        right:12px!important;
        width:48px!important;
        height:48px!important;
        min-width:48px!important;
        min-height:48px!important;
        margin:0!important;
        padding:0!important;
        border:2px solid rgba(255,255,255,.8)!important;
        border-radius:15px!important;
        background:#70472b!important;
        color:#fff!important;
        box-shadow:0 4px 0 #4b2d1c,0 8px 18px rgba(0,0,0,.24)!important;
        font-size:32px!important;
        font-weight:1000!important;
        line-height:1!important;
        display:grid!important;
        place-items:center!important;
        z-index:999!important;
        cursor:pointer!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }
      #snArIntroCloseV175:active{transform:scale(.94)!important}
      #snArIntro .sn-ar-badge{max-width:calc(100% - 62px)}
    `;
    document.head.appendChild(style);
  }

  let close=document.getElementById('snArIntroCloseV175');
  if(!close){
    close=document.createElement('button');
    close.type='button';
    close.id='snArIntroCloseV175';
    close.textContent='×';
    close.setAttribute('aria-label','Sluit Snazzle AR');
    close.setAttribute('title','Sluiten');
    panel.prepend(close);

    let closing=false;
    const doClose=e=>{
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if(closing)return;
      closing=true;
      intro.classList.remove('show');
      setTimeout(()=>{closing=false;},180);
    };
    close.addEventListener('pointerup',doClose,{capture:true});
    close.addEventListener('click',doClose,{capture:true});
    close.addEventListener('touchend',doClose,{capture:true,passive:false});
  }
  return true;
}

installArIntroCloseV175();
const observer=new MutationObserver(()=>installArIntroCloseV175());
if(document.body)observer.observe(document.body,{childList:true,subtree:true});
else document.addEventListener('DOMContentLoaded',()=>{
  installArIntroCloseV175();
  observer.observe(document.body,{childList:true,subtree:true});
},{once:true});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape')document.getElementById('snArIntro')?.classList.remove('show');
});

window.SnazzleArIntroCloseV175={install:installArIntroCloseV175};
