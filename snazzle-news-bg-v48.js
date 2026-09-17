// Snazzle Nieuws achtergrond v48.2 — speels nieuws + betrouwbare homekaart-achtergronden.
(function installSnazzleNewsBackgroundV48(){
  const STYLE_ID='snazzleNewsBackgroundV48';

  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .sn-news-overlay{
        background:
          radial-gradient(circle at 15% 12%,rgba(255,220,103,.22),transparent 29%),
          radial-gradient(circle at 88% 22%,rgba(190,164,255,.22),transparent 27%),
          linear-gradient(180deg,#f6edff 0%,#fff7e9 48%,#effaf4 100%)!important;
      }

      .sn-news-shell{
        position:relative;
        isolation:isolate;
        overflow:hidden;
        background:
          radial-gradient(circle at 10% 14%,rgba(255,215,92,.30) 0 72px,transparent 74px),
          radial-gradient(circle at 93% 18%,rgba(192,167,255,.22) 0 105px,transparent 108px),
          radial-gradient(circle at 5% 58%,rgba(151,222,184,.18) 0 110px,transparent 113px),
          radial-gradient(circle at 94% 79%,rgba(255,185,199,.18) 0 120px,transparent 123px),
          linear-gradient(180deg,#fffaf1 0%,#fcf8ff 39%,#f5fff8 100%)!important;
      }

      .sn-news-shell::before{
        content:'';
        position:absolute;
        inset:0;
        z-index:0;
        pointer-events:none;
        opacity:.65;
        background:
          radial-gradient(circle at 18% 9%,rgba(255,255,255,.96) 0 3px,transparent 4px),
          radial-gradient(circle at 77% 13%,rgba(255,234,139,.72) 0 2px,transparent 3px),
          radial-gradient(circle at 83% 47%,rgba(255,255,255,.86) 0 3px,transparent 4px),
          radial-gradient(circle at 20% 71%,rgba(210,190,255,.54) 0 3px,transparent 4px),
          radial-gradient(circle at 69% 91%,rgba(255,224,117,.58) 0 3px,transparent 4px);
      }

      .sn-news-shell::after{
        content:'🦆';
        position:absolute;
        right:-22px;
        top:142px;
        z-index:0;
        pointer-events:none;
        font-size:108px;
        line-height:1;
        opacity:.055;
        transform:rotate(-8deg);
        filter:saturate(.8);
      }

      .sn-news-shell > *{position:relative;z-index:1}
      .sn-news-topbar{background:rgba(255,250,245,.93)!important;border-bottom-color:rgba(105,79,145,.13)!important}
      .sn-news-intro{position:relative}
      .sn-news-intro::after{content:'✦  ✧  ✦';position:absolute;right:18px;top:10px;color:#e2b84c;opacity:.28;letter-spacing:5px;font-size:18px;pointer-events:none}
      .sn-news-feature,.sn-news-card,.sn-news-empty{background:rgba(255,255,255,.95)!important;border-color:rgba(113,84,148,.15)!important;box-shadow:0 10px 28px rgba(63,43,94,.09)!important}
      .sn-news-filter{background:rgba(255,255,255,.88)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .sn-news-filter.on{background:#5b4090!important}

      @media(max-width:520px){
        .sn-news-shell::after{font-size:88px;right:-27px;top:154px;opacity:.05}
        .sn-news-intro::after{right:13px;top:7px;font-size:15px;letter-spacing:3px}
      }
      @media(prefers-reduced-transparency:reduce){
        .sn-news-topbar,.sn-news-feature,.sn-news-card,.sn-news-empty,.sn-news-filter{background:#fff!important}
      }
    `;
    document.head.appendChild(style);
  }

  // De twee kaarten hieronder worden door losse modules later aan de home toegevoegd.
  // Daarom lezen we hun opgeslagen achtergrond rechtstreeks uit dezelfde IndexedDB
  // als Beheer → Afbeeldingen en passen hem opnieuw toe zodra de kaart bestaat.
  const DB_NAME='snazzleVisualAssetsV28';
  const STORE='assets';
  let dbPromise=null;
  let refreshTimer=0;

  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Snazzle beeldopslag kon niet openen'));
    });
    return dbPromise;
  }

  async function readAsset(key){
    try{
      const db=await openDb();
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readonly');
        const req=tx.objectStore(STORE).get(key);
        req.onsuccess=()=>resolve(typeof req.result==='string'?req.result:'');
        req.onerror=()=>reject(req.error);
      });
    }catch(err){
      console.warn('Snazzle kaartachtergrond lezen',key,err);
      return '';
    }
  }

  function setCardBackground(el,src,overlay){
    if(!el||!src||!src.startsWith('data:image/'))return;
    const bg=`${overlay},url("${src}")`;
    if(el.dataset.snStoredBg===src&&el.style.getPropertyValue('background-image'))return;
    el.style.setProperty('background-image',bg,'important');
    el.style.setProperty('background-size','cover','important');
    el.style.setProperty('background-position','center','important');
    el.style.setProperty('background-repeat','no-repeat','important');
    el.dataset.snStoredBg=src;
  }

  async function applyStoredCardBackgrounds(){
    const [newsSrc,collectionSrc]=await Promise.all([
      readAsset('newsCard'),
      readAsset('collectionCard')
    ]);

    const news=document.getElementById('snNewsLaunch');
    if(newsSrc&&news){
      setCardBackground(news,newsSrc,'linear-gradient(180deg,rgba(17,27,47,.10),rgba(20,23,52,.46))');
      const shell=news.closest('.home-card');
      if(shell)setCardBackground(shell,newsSrc,'linear-gradient(180deg,rgba(17,27,47,.03),rgba(20,23,52,.20))');
    }

    const collection=document.getElementById('collectionHomeCard')||document.querySelector('.collection-home-card');
    if(collectionSrc&&collection){
      setCardBackground(collection,collectionSrc,'linear-gradient(180deg,rgba(20,35,52,.08),rgba(11,31,44,.48))');
    }
  }

  function queueRefresh(delay=80){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>applyStoredCardBackgrounds(),delay);
  }

  // Eerst meteen proberen, daarna op laat gebouwde homekaarten reageren.
  queueRefresh(0);
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='childList'&&record.addedNodes.length){queueRefresh(90);break;}
    }
  });
  const startObserver=()=>{
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  };
  if(document.body)startObserver();
  else document.addEventListener('DOMContentLoaded',startObserver,{once:true});

  // Bij uploaden in Beheer wordt IndexedDB iets later bijgewerkt; pak dat zonder herladen mee.
  document.addEventListener('change',event=>{
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.closest('#imagesAdmin'))return;
    setTimeout(()=>applyStoredCardBackgrounds(),250);
    setTimeout(()=>applyStoredCardBackgrounds(),750);
    setTimeout(()=>applyStoredCardBackgrounds(),1500);
  },true);

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')queueRefresh(120);
  });
  document.addEventListener('snazzle:home-ui-ready',()=>queueRefresh(80));

  // Korte opstartcontrole voor centrale beeldsync en modules die later binnenkomen.
  let checks=0;
  const startupCheck=setInterval(()=>{
    applyStoredCardBackgrounds();
    if(++checks>=20)clearInterval(startupCheck);
  },750);
})();
