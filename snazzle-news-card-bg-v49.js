// Snazzle Nieuws card background v49 — toont de in Beheer gekozen newsCard altijd zichtbaar.
// Deze laag staat als echte <img> in de knop en kan daardoor niet door de paarse CSS-achtergrond worden afgedekt.
(function installSnazzleNewsCardBackgroundV49(){
  if(window.SnazzleNewsCardBackgroundV49)return;

  const DB_NAME='snazzleVisualAssetsV28';
  const STORE='assets';
  const KEY='newsCard';
  const STYLE_ID='snazzleNewsCardBackgroundV49Styles';
  let dbPromise=null;
  let timer=0;

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #snNewsLaunch,.sn-news-launch{overflow:hidden!important;isolation:isolate!important}
      #snNewsLaunch>.sn-news-custom-bg-v49,.sn-news-launch>.sn-news-custom-bg-v49{
        display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
        object-fit:cover!important;object-position:center!important;z-index:0!important;pointer-events:none!important;
        opacity:1!important;filter:none!important;transform:none!important;border-radius:inherit!important;
      }
      #snNewsLaunch>.sn-news-custom-shade-v49,.sn-news-launch>.sn-news-custom-shade-v49{
        display:block!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;
        background:linear-gradient(90deg,rgba(28,20,52,.18),rgba(28,20,52,.08) 52%,rgba(28,20,52,.34))!important;
      }
      #snNewsLaunch>span:not(.sn-news-custom-shade-v49),.sn-news-launch>span:not(.sn-news-custom-shade-v49){position:relative!important;z-index:2!important}
    `;
    document.head.appendChild(style);
  }

  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Beeldopslag kon niet openen'));
    });
    return dbPromise;
  }

  async function readNewsCard(){
    try{
      const db=await openDb();
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).get(KEY);
        req.onsuccess=()=>resolve(typeof req.result==='string'?req.result:'');
        req.onerror=()=>reject(req.error);
      });
    }catch(err){
      console.warn('Snazzle Nieuws achtergrond lezen',err);
      return '';
    }
  }

  function launcher(){return document.getElementById('snNewsLaunch')||document.querySelector('.sn-news-launch');}

  async function apply(){
    installStyles();
    const src=await readNewsCard();
    const button=launcher();
    if(!button)return false;

    let img=button.querySelector(':scope > .sn-news-custom-bg-v49');
    let shade=button.querySelector(':scope > .sn-news-custom-shade-v49');

    if(!src||!src.startsWith('data:image/')){
      img?.remove();
      shade?.remove();
      delete button.dataset.snNewsCustomBgV49;
      return false;
    }

    if(!img){
      img=document.createElement('img');
      img.className='sn-news-custom-bg-v49';
      img.alt='';
      img.setAttribute('aria-hidden','true');
      button.prepend(img);
    }
    if(img.getAttribute('src')!==src)img.setAttribute('src',src);

    if(!shade){
      shade=document.createElement('span');
      shade.className='sn-news-custom-shade-v49';
      shade.setAttribute('aria-hidden','true');
      img.insertAdjacentElement('afterend',shade);
    }

    button.dataset.snNewsCustomBgV49='1';
    const shell=button.closest('.home-card');
    if(shell){
      shell.style.setProperty('background-image',`linear-gradient(180deg,rgba(20,23,52,.08),rgba(20,23,52,.20)),url("${src}")`,'important');
      shell.style.setProperty('background-size','cover','important');
      shell.style.setProperty('background-position','center','important');
    }
    return true;
  }

  function queue(delay=60){clearTimeout(timer);timer=setTimeout(()=>apply().catch(err=>console.warn('Snazzle Nieuws achtergrond toepassen',err)),delay);}

  installStyles();
  queue(0);

  const startObserver=()=>{
    if(!document.body)return;
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type!=='childList'||!record.addedNodes.length)continue;
        for(const node of record.addedNodes){
          if(node.nodeType!==1)continue;
          if(node.matches?.('#snNewsLaunch,.sn-news-launch,.sn-news-launch-card')||node.querySelector?.('#snNewsLaunch,.sn-news-launch')){queue(25);return;}
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  };
  if(document.body)startObserver();else document.addEventListener('DOMContentLoaded',startObserver,{once:true});

  document.addEventListener('snazzle:visual-asset-changed',event=>{if(String(event.detail?.key||'')===KEY)queue(10);});
  document.addEventListener('snazzle:visual-assets-updated',()=>queue(30));
  document.addEventListener('snazzle:home-ui-ready',()=>queue(30));
  document.addEventListener('change',event=>{
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.closest('#imagesAdmin'))return;
    setTimeout(()=>queue(0),120);
    setTimeout(()=>queue(0),500);
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')queue(50);});
  window.addEventListener('snazzle:visual-sync-ready',()=>{queue(20);setTimeout(()=>queue(0),220);setTimeout(()=>queue(0),700);});

  let checks=0;
  const boot=setInterval(()=>{apply();if(++checks>=24)clearInterval(boot);},500);

  window.SnazzleNewsCardBackgroundV49={refresh:apply};
})();
