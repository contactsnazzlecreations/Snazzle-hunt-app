// Snazzle v72 — stabielere afbeeldingen zonder de speelse app-animaties te verwijderen.
// Voorkomt vooral dat dezelfde afbeelding opnieuw wordt gezet en daardoor op Android kort knippert.
const V72='72.0.0';

function sameImageSource72(img,next){
  const value=String(next??'');
  const current=img.getAttribute('src')||'';
  if(current===value) return true;
  if(!current||!value) return false;
  if(current.startsWith('data:')||value.startsWith('data:')) return current===value;
  try{return new URL(current,document.baseURI).href===new URL(value,document.baseURI).href;}catch{return false;}
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
    /* Een reeds zichtbare afbeelding blijft zichtbaar wanneer oudere polish-lagen
       opnieuw een loading-status zetten. Alleen de afbeeldingsovergang wordt rustiger;
       de overige Snazzle-animaties blijven intact. */
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

    /* Houd de belangrijkste beeldvlakken op een stabiele compositorlaag. */
    .photo img,.home-card img,.logo img,.preview img,.round-preview img,
    .proof-preview img,.sn-character-card img,.sn-news-page img,.shop-product img,
    #snV59Boot img{
      backface-visibility:hidden;
      -webkit-backface-visibility:hidden;
      transform:translateZ(0);
    }
  `;
  document.head.appendChild(style);
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
}

installSourceGuard72();
installStyles72();
if(document.body) prepareExisting72();
else document.addEventListener('DOMContentLoaded',()=>prepareExisting72(),{once:true});

const observer72=new MutationObserver(records=>{
  for(const record of records){
    record.addedNodes.forEach(node=>{
      if(node.nodeType!==1) return;
      if(node.tagName==='IMG') prepareExisting72(node.parentElement||document);
      else if(node.querySelector?.('img')) prepareExisting72(node);
    });
  }
});
if(document.body) observer72.observe(document.body,{childList:true,subtree:true});
else document.addEventListener('DOMContentLoaded',()=>observer72.observe(document.body,{childList:true,subtree:true}),{once:true});

console.info(`Snazzle image stability ${V72} geladen`);
