// Narrow compatibility guard for v31/v32 image managers.
// Prevents the legacy v31 manager from being removed/recreated in a MutationObserver loop.

if(!window.__snazzleV32Guard){
  window.__snazzleV32Guard=true;
  const nativeRemove=Element.prototype.remove;
  Element.prototype.remove=function(){
    if(this?.id==='v31ImageManager'){
      this.style.display='none';
      this.setAttribute('aria-hidden','true');
      return;
    }
    return nativeRemove.call(this);
  };

  const markManagedCharacters=()=>{
    document.querySelectorAll('#ui28Runner img,#ui28Peeker img,#snazzleVisitor img,#magicBig img,.quick-menu-duck img').forEach(img=>{
      img.dataset.ui28Character='1';
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',markManagedCharacters,{once:true});
  else markManagedCharacters();
  new MutationObserver(markManagedCharacters).observe(document.documentElement,{childList:true,subtree:true});
}