// Snazzle v72.3 — stabielere afbeeldingen + robuuste Android-afbeeldingsuploads.
// Voorkomt vooral dat dezelfde afbeelding opnieuw wordt gezet en herstelt ontbrekende MIME-types van beeldbestanden.
const V72='72.3.0';

function sameImageSource72(img,next){
  const value=String(next??'');
  const current=img.getAttribute('src')||'';
  if(current===value) return true;
  if(!current||!value) return false;
  if(current.startsWith('data:')||value.startsWith('data:')) return current===value;
  try{return new URL(current,document.baseURI).href===new URL(value,document.baseURI).href;}catch{return false;}
}

function cachedProfile72(){
  try{return String(JSON.parse(localStorage.getItem('snazzleSettings')||'{}')?.profileImage||'');}
  catch{return '';}
}

function installSourceGuard72(){
  if(window.__snazzleImageSourceGuard72) return;
  window.__snazzleImageSourceGuard72=true;

  const proto=HTMLImageElement.prototype;
  const srcDescriptor=Object.getOwnPropertyDescriptor(proto,'src');
  if(srcDescriptor?.get&&srcDescriptor?.set){
    Object.defineProperty(proto,'src',{
      configurable:srcDescriptor.configurable,
      enumerable:srcDescriptor.enumerable,
      get:srcDescriptor.get,
      set(value){
        if(sameImageSource72(this,value)) return;
        srcDescriptor.set.call(this,value);
      }
    });
  }

  const nativeSetAttribute=proto.setAttribute;
  proto.setAttribute=function(name,value){
    if(String(name).toLowerCase()==='src'&&sameImageSource72(this,value)) return;
    return nativeSetAttribute.call(this,name,value);
  };
}

function installStyles72(){
  if(document.getElementById('snazzleImageStabilityV72Styles')) return;
  const style=document.createElement('style');
  style.id='snazzleImageStabilityV72Styles';
  style.textContent=`
    img.sn59-media,
    img.sn59-media.sn59-loading,
    img.sn59-media.sn59-loaded{
      opacity:1!important;
      filter:none!important;
      transition:none!important;
    }
    .sn59-media-shell.sn59-waiting::before{
      opacity:0!important;
      animation:none!important;
    }

    .photo img,.home-card img,.logo img,.preview img,.round-preview img,
    .proof-preview img,.sn-character-card img,.sn-news-page img,.shop-product img,
    #snV59Boot img{
      backface-visibility:hidden;
      -webkit-backface-visibility:hidden;
      transform:translateZ(0);
    }

    /* Specifiek het ronde Snazzle-logo linksboven: geen fade, blur of hertekening. */
    .top .logo{
      isolation:isolate!important;
      contain:paint!important;
      backface-visibility:hidden!important;
      -webkit-backface-visibility:hidden!important;
    }
    #profileLogo{
      opacity:1!important;
      filter:none!important;
      transition:none!important;
      animation:none!important;
      backface-visibility:hidden!important;
      -webkit-backface-visibility:hidden!important;
      transform:none!important;
    }
    #profileLogo.sn59-loading,#profileLogo.sn59-loaded{
      opacity:1!important;
      filter:none!important;
    }
    .logo.sn59-media-shell.sn59-waiting::before{
      display:none!important;
      content:none!important;
    }
  `;
  document.head.appendChild(style);
}

function stabilizeProfileLogo72(){
  const img=document.getElementById('profileLogo');
  const fallback=document.getElementById('logoFallback');
  if(!img) return;

  const cached=cachedProfile72();
  if(cached&&!img.getAttribute('src')) img.src=cached;

  const hasSource=!!img.getAttribute('src');
  if(hasSource){
    img.style.display='block';
    img.style.opacity='1';
    img.classList.remove('sn59-loading');
    img.classList.add('sn59-loaded');
    img.closest('.sn59-media-shell')?.classList.remove('sn59-waiting');
    if(fallback) fallback.style.display='none';
  }else if(fallback){
    fallback.style.display='grid';
  }
}

function prepareExisting72(root=document){
  root.querySelectorAll?.('img').forEach(img=>{
    img.decoding='async';
    img.draggable=false;
    if(img.complete&&img.naturalWidth>0){
      img.classList.remove('sn59-loading');
      img.classList.add('sn59-loaded');
      img.closest('.sn59-media-shell')?.classList.remove('sn59-waiting');
    }
  });
  stabilizeProfileLogo72();
}

/*
 * Android upload repair.
 * Sommige Android/Xiaomi-bestandskiezers leveren een geldige PNG/JPG/WebP met een leeg of generiek
 * MIME-type. De oudere beeldbeheerder controleert file.type en stopte daardoor vóór preview en opslag.
 * Herstel daarom het MIME-type voor ALLE beeldkaarten vóór hun bestaande onchange-handler draait.
 */
function imageMimeFromName72(name){
  const n=String(name||'').toLowerCase();
  if(/\.png$/.test(n))return 'image/png';
  if(/\.jpe?g$/.test(n))return 'image/jpeg';
  if(/\.webp$/.test(n))return 'image/webp';
  if(/\.gif$/.test(n))return 'image/gif';
  if(/\.bmp$/.test(n))return 'image/bmp';
  if(/\.avif$/.test(n))return 'image/avif';
  return '';
}
function isManagedImageInput72(input){
  return input instanceof HTMLInputElement&&input.type==='file'&&!!input.closest('.v31-image-item,.v32-image-item,#imagesAdmin');
}
function repairManagedImageMime72(input){
  if(!isManagedImageInput72(input))return false;
  const file=input.files?.[0];
  if(!file)return false;
  if(String(file.type||'').toLowerCase().startsWith('image/'))return true;
  const mime=imageMimeFromName72(file.name);
  if(!mime)return false;
  try{
    const repaired=new File([file],file.name,{type:mime,lastModified:file.lastModified||Date.now()});
    const transfer=new DataTransfer();
    transfer.items.add(repaired);
    input.files=transfer.files;
    return true;
  }catch(err){
    console.warn('Snazzle Android MIME-herstel kon bestand niet vervangen',err);
    return false;
  }
}
function installManagedUploadMimeRepair72(){
  if(window.__snazzleManagedUploadMimeRepair72)return;
  window.__snazzleManagedUploadMimeRepair72=true;
  // Capture: dit moet vóór de bestaande input.onchange-handlers lopen.
  document.addEventListener('change',event=>{
    const input=event.target;
    if(!isManagedImageInput72(input))return;
    repairManagedImageMime72(input);
  },true);
}

/*
 * Snazzle AR upload rescue.
 * Extra vangnet voor de AR-kaart. Deze blijft ook werken als een Android-provider het bestandstype
 * niet netjes doorgeeft of DataTransfer op een toestel niet beschikbaar is.
 */
const AR_VISUAL_DB72='snazzleVisualAssetsV28';
const AR_VISUAL_STORE72='assets';
const AR_VISUAL_KEY72='arCard';

function toastArUpload72(text){
  const toast=document.getElementById('toast');
  if(!toast){console.info(text);return;}
  toast.textContent=text;
  toast.classList.add('show');
  clearTimeout(window.__snArUploadToast72);
  window.__snArUploadToast72=setTimeout(()=>toast.classList.remove('show'),3600);
}

function isImageFile72(file){
  if(!file) return false;
  if(String(file.type||'').toLowerCase().startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(String(file.name||''));
}

function isArBackgroundInput72(input){
  if(!(input instanceof HTMLInputElement)||input.type!=='file') return false;
  const card=input.closest('.v31-image-item,.v32-image-item');
  const label=card?.querySelector('strong')?.textContent?.trim()||'';
  return label==='Achtergrond Snazzle AR';
}

function compressArBackground72(file,max=1600,quality=.86){
  return new Promise((resolve,reject)=>{
    if(!isImageFile72(file)) return reject(new Error('Kies een PNG, JPG of WebP-afbeelding'));
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('Het bestand kon niet worden gelezen'));
    reader.onload=()=>{
      const image=new Image();
      image.onerror=()=>reject(new Error('De afbeelding kon niet worden geopend'));
      image.onload=()=>{
        try{
          const width=image.naturalWidth||image.width;
          const height=image.naturalHeight||image.height;
          if(!width||!height) throw new Error('De afbeelding heeft geen geldige afmetingen');
          const scale=Math.min(1,max/Math.max(width,height));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(width*scale));
          canvas.height=Math.max(1,Math.round(height*scale));
          const context=canvas.getContext('2d');
          if(!context) throw new Error('Afbeelding verwerken lukt niet op dit toestel');
          context.drawImage(image,0,0,canvas.width,canvas.height);
          let data=canvas.toDataURL('image/webp',quality);
          if(!data.startsWith('data:image/webp')) data=canvas.toDataURL('image/jpeg',quality);
          if(!data.startsWith('data:image/')) throw new Error('Afbeelding kon niet worden omgezet');
          resolve(data);
        }catch(err){reject(err instanceof Error?err:new Error('Afbeelding verwerken mislukt'));}
      };
      image.src=String(reader.result||'');
    };
    reader.readAsDataURL(file);
  });
}

function saveArBackground72(data){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(AR_VISUAL_DB72);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains(AR_VISUAL_STORE72)) request.result.createObjectStore(AR_VISUAL_STORE72);
    };
    request.onerror=()=>reject(request.error||new Error('Beeldopslag kon niet worden geopend'));
    request.onsuccess=()=>{
      const db=request.result;
      let tx;
      try{tx=db.transaction(AR_VISUAL_STORE72,'readwrite');}
      catch(err){db.close();reject(err);return;}
      tx.objectStore(AR_VISUAL_STORE72).put(data,AR_VISUAL_KEY72);
      tx.oncomplete=()=>{db.close();resolve(true);};
      tx.onerror=()=>{const err=tx.error||new Error('Afbeelding opslaan mislukt');db.close();reject(err);};
      tx.onabort=()=>{const err=tx.error||new Error('Afbeelding opslaan afgebroken');db.close();reject(err);};
    };
  });
}

function applyArBackground72(data){
  const launcher=document.getElementById('snArLaunch');
  if(!launcher||!data) return;
  launcher.style.setProperty('background-image',`linear-gradient(180deg,rgba(5,45,35,.10),rgba(3,36,29,.56)),url("${data}")`,'important');
  launcher.style.setProperty('background-size','cover','important');
  launcher.style.setProperty('background-position','center','important');
  launcher.dataset.v31Bg='1';
  launcher.dataset.v31BgSrc=data;
}

function queueArCloudSync72(){
  let tries=0;
  const run=()=>{
    const api=window.SnazzleVisualSyncV54;
    if(api?.push){
      Promise.resolve(api.push()).catch(err=>console.warn('Snazzle AR centrale beeldsync',err));
      return;
    }
    if(++tries<40) setTimeout(run,500);
  };
  setTimeout(run,180);
}

async function handleArBackgroundUpload72(input){
  const file=input.files?.[0];
  if(!file) return;
  const card=input.closest('.v31-image-item,.v32-image-item');
  const preview=card?.querySelector('.v31-image-preview,.v32-image-preview');
  const previous=preview?.innerHTML||'';
  if(preview) preview.textContent='Afbeelding verwerken…';
  try{
    const data=await compressArBackground72(file);
    await saveArBackground72(data);
    if(preview) preview.innerHTML=`<img src="${data}" alt="Voorbeeld">`;
    input.value='';
    applyArBackground72(data);
    queueArCloudSync72();
    toastArUpload72('Snazzle AR-achtergrond aangepast ✓');
  }catch(err){
    console.error('Snazzle AR-achtergrondupload',err);
    if(preview) preview.innerHTML=previous;
    toastArUpload72(`Opslaan mislukt: ${err?.message||'probeer de afbeelding opnieuw'}`);
  }
}

function installArUploadRescue72(){
  if(window.__snazzleArUploadRescue72) return;
  window.__snazzleArUploadRescue72=true;
  document.addEventListener('change',event=>{
    const input=event.target;
    if(!isArBackgroundInput72(input)) return;
    // Voorkom dat de oudere handler dezelfde upload nogmaals verwerkt of op Android afwijst.
    event.stopImmediatePropagation();
    handleArBackgroundUpload72(input);
  },true);
}

installSourceGuard72();
installStyles72();
installManagedUploadMimeRepair72();
installArUploadRescue72();
if(document.body) prepareExisting72();
else document.addEventListener('DOMContentLoaded',()=>prepareExisting72(),{once:true});

const observer72=new MutationObserver(records=>{
  let touchLogo=false;
  for(const record of records){
    if(record.type==='attributes'&&record.target?.id==='profileLogo') touchLogo=true;
    record.addedNodes?.forEach(node=>{
      if(node.nodeType!==1) return;
      if(node.tagName==='IMG') prepareExisting72(node.parentElement||document);
      else if(node.querySelector?.('img')) prepareExisting72(node);
    });
  }
  if(touchLogo) requestAnimationFrame(stabilizeProfileLogo72);
});

function startObserver72(){
  observer72.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class','style']});
  stabilizeProfileLogo72();
  const logo=document.getElementById('profileLogo');
  if(logo&&!logo.dataset.sn72Stable){
    logo.dataset.sn72Stable='1';
    logo.addEventListener('load',stabilizeProfileLogo72,{passive:true});
  }
}
if(document.body) startObserver72();
else document.addEventListener('DOMContentLoaded',startObserver72,{once:true});

console.info(`Snazzle image stability ${V72} geladen`);
