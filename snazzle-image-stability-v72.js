// Snazzle v72.1 — stabielere afbeeldingen, met extra bescherming voor het ronde logo linksboven.
// Voorkomt vooral dat dezelfde afbeelding opnieuw wordt gezet en daardoor op Android kort knippert.
const V72='72.1.0';

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

installSourceGuard72();
installStyles72();
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
