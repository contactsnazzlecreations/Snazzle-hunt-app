from pathlib import Path
import re

p = Path('shop.js')
s = p.read_text(encoding='utf-8')

# Make checkout opening defensive and force visibility on mobile.
s = re.sub(
    r"function openCheckout\(productId\)\{.*?\n\}",
    '''function openCheckout(productId){
  try{
    const p=shopProducts.find(x=>x.id===productId && x.active!==false);
    if(!p) return showToast('Dit product is niet meer beschikbaar');
    selectedProductId=p.id;
    selectedQuantity=1;
    renderCheckout();
    const browse=$('#shopBrowse'), success=$('#shopSuccess'), checkout=$('#shopCheckout');
    if(browse) browse.style.setProperty('display','none','important');
    if(success) success.classList.remove('show');
    if(!checkout) return showToast('Bestelformulier kon niet worden geopend');
    checkout.classList.add('show');
    checkout.style.setProperty('display','block','important');
    checkout.style.setProperty('visibility','visible','important');
    checkout.style.setProperty('opacity','1','important');
    setTimeout(()=>checkout.scrollIntoView({behavior:'smooth',block:'start'}),20);
  }catch(e){
    console.error('openCheckout',e);
    showToast('Bestelformulier kon niet openen. Probeer opnieuw.');
  }
}''',
    s,
    count=1,
    flags=re.S
)

old = "$$('[data-shop-product]',box).forEach(b=>b.onclick=()=>openCheckout(b.dataset.shopProduct));"
new = """$$('[data-shop-product]',box).forEach(b=>{
    let lastOpen=0;
    const activate=e=>{
      if(e) e.preventDefault();
      const now=Date.now();
      if(now-lastOpen<450) return;
      lastOpen=now;
      openCheckout(b.dataset.shopProduct);
    };
    b.onclick=activate;
    b.onpointerup=activate;
    b.ontouchend=activate;
  });"""
if old in s:
    s=s.replace(old,new,1)

# Direct touch/pointer handling for product images as well.
needle = "box.appendChild(card);\n  });"
replacement = """box.appendChild(card);
    const media=card.querySelector('.shop-product-media');
    if(media){
      let lastZoom=0;
      const zoom=e=>{
        const img=media.querySelector('img');
        if(!img || !img.src) return;
        if(e) e.preventDefault();
        const now=Date.now(); if(now-lastZoom<450) return; lastZoom=now;
        openShopImageViewer(img.src,img.alt||'Snazzle product');
      };
      media.onclick=zoom;
      media.onpointerup=zoom;
      media.ontouchend=zoom;
    }
  });"""
if needle in s and 'media.onpointerup=zoom' not in s:
    s=s.replace(needle,replacement,1)

p.write_text(s,encoding='utf-8')
