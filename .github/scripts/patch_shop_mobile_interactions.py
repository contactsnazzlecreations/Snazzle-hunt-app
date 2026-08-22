from pathlib import Path

p = Path('shop.js')
s = p.read_text(encoding='utf-8')
marker = '/* SNAZZLE_SHOP_MOBILE_INTERACTIONS_V2 */'
if marker in s:
    print('Shop mobile interactions already patched')
    raise SystemExit(0)

insert = r'''

/* SNAZZLE_SHOP_MOBILE_INTERACTIONS_V2 */
function ensureShopImageViewer(){
  if(document.getElementById('shopImageViewer')) return document.getElementById('shopImageViewer');
  const style=document.createElement('style');
  style.id='shopImageViewerStyles';
  style.textContent=`
    .shop-product-media,.shop-summary-thumb{cursor:zoom-in;touch-action:manipulation}
    [data-shop-product],#shopSubmitOrder{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    #shopImageViewer{position:fixed;inset:0;z-index:10050;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(4,20,10,.90);backdrop-filter:blur(7px)}
    #shopImageViewer.show{display:flex;animation:shopViewerIn .16s ease-out}
    #shopImageViewer .shop-viewer-card{position:relative;width:min(96vw,760px);height:min(90vh,980px);display:flex;align-items:center;justify-content:center;border-radius:24px;overflow:hidden;background:#111;border:3px solid #d2a45f;box-shadow:0 18px 60px rgba(0,0,0,.55)}
    #shopImageViewer img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}
    #shopImageViewer .shop-viewer-close{position:absolute;right:12px;top:12px;z-index:2;width:52px;height:52px;border:0;border-radius:16px;background:#71462b;color:#fff;font-size:31px;font-weight:900;line-height:1;box-shadow:0 4px 14px rgba(0,0,0,.35)}
    #shopImageViewer .shop-viewer-hint{position:absolute;left:14px;right:80px;bottom:13px;color:#fff;background:rgba(0,0,0,.52);padding:8px 11px;border-radius:12px;font-size:12px;font-weight:800}
    @keyframes shopViewerIn{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
  `;
  document.head.appendChild(style);
  const viewer=document.createElement('div');
  viewer.id='shopImageViewer';
  viewer.setAttribute('aria-hidden','true');
  viewer.innerHTML=`<div class="shop-viewer-card"><button type="button" class="shop-viewer-close" aria-label="Sluiten">×</button><img alt="Snazzle product groot"><div class="shop-viewer-hint">Tik op × om de foto te sluiten</div></div>`;
  document.body.appendChild(viewer);
  viewer.addEventListener('click',e=>{ if(e.target===viewer || e.target.closest('.shop-viewer-close')) closeShopImageViewer(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeShopImageViewer(); });
  return viewer;
}
function openShopImageViewer(src,alt='Snazzle product'){
  if(!src) return;
  const viewer=ensureShopImageViewer(), img=viewer.querySelector('img');
  img.src=src; img.alt=alt || 'Snazzle product';
  viewer.classList.add('show'); viewer.setAttribute('aria-hidden','false');
}
function closeShopImageViewer(){
  const viewer=document.getElementById('shopImageViewer'); if(!viewer) return;
  viewer.classList.remove('show'); viewer.setAttribute('aria-hidden','true');
}
function installShopMobileInteractions(){
  if(window.__snazzleShopMobileInteractions) return;
  window.__snazzleShopMobileInteractions=true;
  ensureShopImageViewer();

  // Capture phase makes dynamically rendered shop controls reliable on mobile.
  document.addEventListener('click',async e=>{
    const submit=e.target.closest('#shopSubmitOrder');
    if(submit){
      e.preventDefault(); e.stopImmediatePropagation();
      await submitOrder();
      return;
    }

    const orderButton=e.target.closest('[data-shop-product]');
    if(orderButton && orderButton.closest('#shopSheet')){
      e.preventDefault(); e.stopImmediatePropagation();
      openCheckout(orderButton.dataset.shopProduct);
      return;
    }

    const media=e.target.closest('.shop-product-media,.shop-summary-thumb');
    if(media && media.closest('#shopSheet')){
      const img=media.querySelector('img');
      if(img && img.src){
        e.preventDefault(); e.stopImmediatePropagation();
        openShopImageViewer(img.src,img.alt || 'Snazzle product');
      }
    }
  },true);
}
'''

needle = 'function initShop(){'
if needle not in s:
    raise SystemExit('Could not find initShop() insertion point')
s = s.replace(needle, insert + '\n' + needle, 1)

old = "function initShop(){ injectShopStyles(); ensureShopUI(); ensureShopAdminUI();"
new = "function initShop(){ injectShopStyles(); ensureShopUI(); ensureShopAdminUI(); installShopMobileInteractions();"
if old not in s:
    raise SystemExit('Could not patch initShop()')
s = s.replace(old, new, 1)

# A slightly clearer CTA for families.
s = s.replace('Bestellen / reserveren</button>', 'Bestellen / reserveren 🦆</button>')

p.write_text(s, encoding='utf-8')
print('Patched shop mobile interactions and image viewer')
