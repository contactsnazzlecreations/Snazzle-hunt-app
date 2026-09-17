// Snazzle v75 — één betrouwbare beheerder voor alle homekaart-achtergronden.
// Leest/schrijft dezelfde IndexedDB als Beheer → Afbeeldingen en past achtergronden opnieuw toe
// wanneer losse modules (Bieb, Mijn Snazzles, Nieuws) hun kaart later aan de home toevoegen.

const VERSION75='75.0.0';
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
const LABEL_TO_KEY75=new Map(Object.entries(CARDS75).map(([key,value])=>[value.label,key]));
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
async function write75(key,value){
  const db=await db75();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE75,'readwrite');
    tx.objectStore(STORE75).put(value,key);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error||new Error('Afbeelding opslaan mislukt'));
  });
  cache75.set(key,value||'');
}
async function delete75(key){
  const db=await db75();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE75,'readwrite');
    tx.objectStore(STORE75).delete(key);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error||new Error('Afbeelding verwijderen mislukt'));
  });
  cache75.set(key,'');
}

function isImage75(file){
  if(!file)return false;
  if(String(file.type||'').toLowerCase().startsWith('image/'))return true;
  return /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(String(file.name||''));
}
function compress75(file,max=1500,quality=.87){
  return new Promise((resolve,reject)=>{
    if(!isImage75(file))return reject(new Error('Kies een PNG, JPG of WebP-afbeelding'));
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen'));
    reader.onload=()=>{
      const image=new Image();
      image.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));
      image.onload=()=>{
        try{
          const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
          if(!width||!height)throw new Error('Afbeelding heeft geen geldige afmetingen');
          const scale=Math.min(1,max/Math.max(width,height));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(width*scale));
          canvas.height=Math.max(1,Math.round(height*scale));
          const ctx=canvas.getContext('2d');
          if(!ctx)throw new Error('Afbeelding verwerken lukt niet op dit toestel');
          ctx.drawImage(image,0,0,canvas.width,canvas.height);
          let out=canvas.toDataURL('image/webp',quality);
          if(!out.startsWith('data:image/webp'))out=canvas.toDataURL('image/jpeg',quality);
          if(!out.startsWith('data:image/'))throw new Error('Afbeelding kon niet worden omgezet');
          resolve(out);
        }catch(err){reject(err);}
      };
      image.src=String(reader.result||'');
    };
    reader.readAsDataURL(file);
  });
}

function toast75(text){
  const toast=document.getElementById('toast');
  if(!toast){console.info('[Snazzle v75]',text);return;}
  toast.textContent=text;
  toast.classList.add('show');
  clearTimeout(window.__snazzleV75Toast);
  window.__snazzleV75Toast=setTimeout(()=>toast.classList.remove('show'),3000);
}
function labelForItem75(item){return item?.querySelector('strong')?.textContent?.trim()||'';}
function keyForItem75(item){return LABEL_TO_KEY75.get(labelForItem75(item))||'';}

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

function updatePreview75(item,src){
  const preview=item?.querySelector('.v31-image-preview,.v32-image-preview');
  if(!preview)return;
  preview.innerHTML=src?`<img src="${src}" alt="Voorbeeld">`:'Geen afbeelding';
}

function syncSave75(key,data){
  let attempts=0;
  const run=()=>{
    const api=window.SnazzleVisualSyncV54;
    if(api?.markDirty)api.markDirty(key);
    if(api?.saveKey){
      Promise.resolve(api.saveKey(key,data)).catch(err=>console.warn('Snazzle centrale achtergrond opslaan',key,err));
      return;
    }
    if(api?.push){
      Promise.resolve(api.push()).catch(err=>console.warn('Snazzle centrale beeldsync',err));
      return;
    }
    if(++attempts<120)setTimeout(run,500);
  };
  run();
}
function syncDelete75(key){
  let attempts=0;
  const run=()=>{
    const api=window.SnazzleVisualSyncV54;
    if(api?.markDirty)api.markDirty(key);
    if(api?.clear){
      Promise.resolve(api.clear(key)).catch(err=>console.warn('Snazzle centrale achtergrond verwijderen',key,err));
      return;
    }
    if(++attempts<120)setTimeout(run,500);
  };
  run();
}

async function handleUpload75(input,item,key){
  const file=input.files?.[0];
  if(!file)return;
  const preview=item?.querySelector('.v31-image-preview,.v32-image-preview');
  const old=preview?.innerHTML||'';
  if(preview)preview.textContent='Afbeelding verwerken…';
  try{
    window.SnazzleVisualSyncV54?.markDirty?.(key);
    const data=await compress75(file,key==='arCard'?1600:1500,.87);
    await write75(key,data);
    input.value='';
    updatePreview75(item,data);
    await applyKey75(key,{fresh:true});
    document.dispatchEvent(new CustomEvent('snazzle:visual-asset-changed',{detail:{key,source:'v75'}}));
    syncSave75(key,data);
    toast75(`${CARDS75[key].label} aangepast ✓`);
  }catch(err){
    console.error('Snazzle v75 upload',key,err);
    if(preview)preview.innerHTML=old;
    toast75(err?.message||'Afbeelding opslaan mislukt');
  }
}
async function handleDelete75(item,key){
  try{
    window.SnazzleVisualSyncV54?.markDirty?.(key);
    await delete75(key);
    updatePreview75(item,'');
    await applyKey75(key,{fresh:true});
    document.dispatchEvent(new CustomEvent('snazzle:visual-asset-changed',{detail:{key,source:'v75',deleted:true}}));
    syncDelete75(key);
    toast75(`${CARDS75[key].label} verwijderd`);
  }catch(err){
    console.error('Snazzle v75 verwijderen',key,err);
    toast75('Afbeelding verwijderen mislukt');
  }
}

function installAdminInterceptors75(){
  if(window.__snazzleV75AdminInterceptors)return;
  window.__snazzleV75AdminInterceptors=true;

  document.addEventListener('change',event=>{
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||input.type!=='file')return;
    const item=input.closest('.v31-image-item,.v32-image-item');
    const key=keyForItem75(item);
    if(!key)return;
    // v75 is voor deze zeven achtergronden de enige schrijver; voorkom dubbele oudere handlers.
    event.preventDefault();
    event.stopImmediatePropagation();
    handleUpload75(input,item,key);
  },true);

  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('.v31-image-item button,.v32-image-item button');
    if(!button)return;
    const item=button.closest('.v31-image-item,.v32-image-item');
    const key=keyForItem75(item);
    if(!key)return;
    if(!/verwijder|standaard|terug/i.test(button.textContent||''))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    handleDelete75(item,key);
  },true);
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
      if(relevant){queueRefresh75(40);break;}
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
  installAdminInterceptors75();
  if(document.body)installObserver75();
  else document.addEventListener('DOMContentLoaded',installObserver75,{once:true});

  document.addEventListener('snazzle:home-ui-ready',()=>queueRefresh75(30,true));
  document.addEventListener('snazzle:visual-assets-updated',()=>queueRefresh75(20,true));
  document.addEventListener('snazzle:visual-asset-changed',event=>{
    const key=String(event.detail?.key||'');
    if(CARDS75[key])applyKey75(key,{fresh:true});
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
