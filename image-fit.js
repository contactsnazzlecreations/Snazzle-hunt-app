// Snazzle image fitting layer.
// Keeps uploaded images fully visible inside app cards while preserving a filled, polished background.

const IMAGE_FIT_VERSION = '1.0.0';

const frameSelectors = [
  '.photo',
  '.home-card',
  '.preview',
  '.proof-preview',
  '.shop-product-media',
  '.shop-summary-thumb',
  '.shop-image-preview',
  '.shop-admin-product .thumb'
];

function injectImageFitStyles(){
  if(document.getElementById('snazzleImageFitStyles')) return;
  const style=document.createElement('style');
  style.id='snazzleImageFitStyles';
  style.textContent=`
    ${frameSelectors.join(',')}{position:relative;isolation:isolate;background:linear-gradient(135deg,#d7e8b8,#8dbf86)!important}
    ${frameSelectors.map(s=>`${s}.snazzle-fit-frame::before`).join(',')}{
      content:'';position:absolute;inset:-10px;z-index:-1;
      background-image:linear-gradient(rgba(20,55,30,.16),rgba(20,55,30,.16)),var(--snazzle-fit-bg);
      background-position:center;background-size:cover;background-repeat:no-repeat;
      filter:blur(14px) saturate(.9);transform:scale(1.08);opacity:.62;
    }
    ${frameSelectors.map(s=>`${s}>img`).join(',')}{
      width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;
      position:relative;z-index:1;background:transparent!important;
    }
    .home-card .label,.photo>.live,.photo>.placeholder,.preview>span,.proof-preview>*:not(img){position:relative;z-index:2}
    .shop-product-media img,.shop-summary-thumb img,.shop-image-preview img,.shop-admin-product .thumb img{padding:4px}
    .home-card>img,.photo>img,.preview>img{padding:3px}
    .snazzle-fit-frame{overflow:hidden!important}
    .snazzle-fit-frame img{filter:drop-shadow(0 2px 3px rgba(0,0,0,.08))}
  `;
  document.head.appendChild(style);
}

function applyFitToImage(img){
  if(!img || !img.src) return;
  const frame=frameSelectors.map(s=>img.closest(s)).find(Boolean);
  if(!frame) return;
  frame.classList.add('snazzle-fit-frame');
  frame.style.setProperty('--snazzle-fit-bg',`url("${String(img.src).replace(/"/g,'\\"')}")`);
}

function scanImages(root=document){
  frameSelectors.forEach(selector=>{
    root.querySelectorAll?.(`${selector} img`).forEach(img=>{
      if(img.complete && img.src) applyFitToImage(img);
      else img.addEventListener('load',()=>applyFitToImage(img),{once:true});
    });
  });
}

function initImageFit(){
  if(window.__snazzleImageFitLoaded) return;
  window.__snazzleImageFitLoaded=true;
  injectImageFitStyles();
  scanImages();
  document.addEventListener('load',e=>{
    if(e.target instanceof HTMLImageElement) applyFitToImage(e.target);
  },true);
  const observer=new MutationObserver(mutations=>{
    for(const mutation of mutations){
      mutation.addedNodes.forEach(node=>{
        if(node.nodeType!==1) return;
        if(node instanceof HTMLImageElement) applyFitToImage(node);
        scanImages(node);
      });
      if(mutation.type==='attributes' && mutation.target instanceof HTMLImageElement) applyFitToImage(mutation.target);
    }
  });
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initImageFit,{once:true}); else initImageFit();
console.info(`Snazzle image fit ${IMAGE_FIT_VERSION} geladen`);
