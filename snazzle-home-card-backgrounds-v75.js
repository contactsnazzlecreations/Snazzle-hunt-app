// Snazzle v75.1 — één betrouwbare toepasser voor alle homekaart-achtergronden.
// Uploaden en verwijderen gebeurt uitsluitend in snazzle-clean-home-v31.
// Deze module leest dezelfde IndexedDB en past achtergronden opnieuw toe wanneer losse modules
// (Bieb, Mijn Snazzles, Nieuws) hun kaart later aan de home toevoegen.

const VERSION75='75.1.0';
const DB75='snazzleVisualAssetsV28';
const STORE75='assets';
let dbPromise75=null;
let refreshTimer75=0;
let observer75=null;

const CARDS75={
  mainStartCard:{label:'Achtergrond Start een Hunt',selectors:['#bigStart'],overlay:'linear-gradient(180deg,rgba(20,28,18,.06),rgba(32,28,15,.34))'},
  arCard:{label:'Achtergrond Snazzle AR',selectors:['#snArLaunch'],overlay:'linear-gradient(180deg,rgba(5,45,35,.08),rgba(3,36,29,.48))'},
  quickFinds:{label:'Achtergrond Mijn vondsten',selectors:['#findsBtn','.finds'],overlay:'linear-gradient(180deg,rgba(10,45,62,.03),rgba(5,40,53,.38))'},
  quickProfile:{label:'Achtergrond Mijn profiel',selectors:['#profileBtn','.profile'],overlay:'linear-gradient(180deg,rgba(10,45,62,.03),rgba(5,40,53,.38))'},
  biebCard:{label:'Achtergrond De Bieb',selectors:['#snBiebHome73','.sn-bieb-home'],overlay:'linear-gradient(180deg,rgba(38,29,14,.06),rgba(32,35,20,.34))'},
  collectionCard:{label:'Achtergrond Mijn Snazzles',selectors:['#collectionHomeCard','.collection-home-card'],overlay:'linear-gradient(180deg,rgba(15,25,55,.05),rgba(12,37,45,.42))'},
  newsCard:{label:'Achtergrond Snazzle Nieuws',selectors:['#snNewsLaunch','.sn-news-launch'],overlay:'linear-gradient(180deg,rgba(37,23,63,.04),rgba(30,20,55,.40))'}
};
const cache75=new Map();

function db75(){
  if(dbPromise75)return dbPromise75;
  dbPromise75=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB75,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE75))req.result.createObjectStore(STORE75);};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Beeldopslag kon niet openen'));
  });
  return dbPromise75;
}
async function read75(key,{fresh=false}={}){
  if(!fresh&&cache75.has(key))return cache75.get(key)||'';
  try{
    const db=await db75();
    const value=await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE75,'readonly');
      const req=tx.objectStore(STORE75).get(key);
      req.onsuccess=()=>resolve(typeof req.result==='string'?req.result:'');
      req.onerror=()=>reject(req.error);
    });
    cache75.set(key,value||'');
    return value||'';
  }catch(err){console.warn('Snazzle v75 lezen',key,err);return '';}
}

function targets75(key){
  const card=CARDS75[key];
  if(!card)return [];
  const found=[];
  for(const selector of card.selectors){
    document.querySelectorAll(selector).forEach(el=>{if(!found.includes(el))found.push(el);});
  }
  if(key==='newsCard'){
    document.querySelectorAll('.home-card.sn-news-launch-card').forEach(el=>{if(!found.includes(el))found.push(el);});
  }
  return found;
}
function applyToElement75(el,key,src){
  if(!el)return;
  const card=CARDS75[key];
  if(src&&src.startsWith('data:image/')){
    const overlay=card?.overlay||'linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.34))';
    el.style.setProperty('background-image',`${overlay},url("${src}")`,'important');
    el.style.setProperty('background-size','cover','important');
    el.style.setProperty('background-position','center','important');
    el.style.setProperty('background-repeat','no-repeat','important');
    el.dataset.snV75BgKey=key;
    el.dataset.snV75Bg='1';
  }else if(el.dataset.snV75BgKey===key||el.dataset.snV75Bg==='1'){
    el.style.removeProperty('background-image');
    el.style.removeProperty('background-size');
    el.style.removeProperty('background-position');
    el.style.removeProperty('background-repeat');
    delete el.dataset.snV75BgKey;
    delete el.dataset.snV75Bg;
  }
}
async function applyKey75(key,{fresh=false}={}){
  const src=await read75(key,{fresh});
  for(const el of targets75(key))applyToElement75(el,key,src);
  return src;
}
async function refresh75({fresh=false}={}){
  await Promise.all(Object.keys(CARDS75).map(key=>applyKey75(key,{fresh})));
}
function queueRefresh75(delay=90,fresh=false){
  clearTimeout(refreshTimer75);
  refreshTimer75=setTimeout(()=>refresh75({fresh}).catch(err=>console.warn('Snazzle v75 refresh',err)),delay);
}

function installObserver75(){
  if(observer75||!document.body)return;
  observer75=new MutationObserver(records=>{
    for(const record of records){
      if(record.type!=='childList'||!record.addedNodes.length)continue;
      let relevant=false;
      for(const node of record.addedNodes){
        if(node.nodeType!==1)continue;
        const el=node;
        if(el.matches?.('#snBiebHome73,#collectionHomeCard,#snNewsLaunch,.sn-bieb-home,.collection-home-card,.sn-news-launch,.home-card')||el.querySelector?.('#snBiebHome73,#collectionHomeCard,#snNewsLaunch,.sn-bieb-home,.collection-home-card,.sn-news-launch')){relevant=true;break;}
      }
      if(relevant){queueRefresh75(40,true);break;}
    }
  });
  observer75.observe(document.body,{childList:true,subtree:true});
}

function init75(){
  if(window.SnazzleHomeCardBackgroundsV75)return;
  window.SnazzleHomeCardBackgroundsV75={
    version:VERSION75,
    refresh:(fresh=true)=>refresh75({fresh}),
    applyKey:(key,fresh=true)=>applyKey75(key,{fresh}),
    read:(key)=>read75(key,{fresh:true})
  };
  if(document.body)installObserver75();
  else document.addEventListener('DOMContentLoaded',installObserver75,{once:true});

  document.addEventListener('snazzle:home-ui-ready',()=>queueRefresh75(30,true));
  document.addEventListener('snazzle:visual-assets-updated',()=>queueRefresh75(20,true));
  document.addEventListener('snazzle:visual-asset-changed',event=>{
    const key=String(event.detail?.key||'');
    if(CARDS75[key]){
      cache75.delete(key);
      applyKey75(key,{fresh:true});
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')queueRefresh75(80,true);});

  refresh75({fresh:true});
  let checks=0;
  const bootCheck=setInterval(()=>{
    refresh75({fresh:true});
    if(++checks>=24)clearInterval(bootCheck);
  },500);
  console.info(`Snazzle home backgrounds ${VERSION75} geladen`);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init75,{once:true});
else init75();
