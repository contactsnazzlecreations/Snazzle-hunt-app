import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyB4iVfasVJgRMJ5GcdkG3ZU136H9FdmAy4',
  authDomain: 'snazzle-hunt.firebaseapp.com',
  projectId: 'snazzle-hunt',
  storageBucket: 'snazzle-hunt.firebasestorage.app',
  messagingSenderId: '647665502495',
  appId: '1:647665502495:web:686488b53db468e887482a',
  measurementId: 'G-55G5DE19DL'
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro = cents => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format((Number(cents)||0)/100);

let shopUser = null;
let shopIsSuperAdmin = false;
let shopProducts = [];
let shopOrders = [];
let selectedProductId = null;
let selectedQuantity = 1;
let editingProductId = null;
let productImageDraft = '';
let unsubscribeProducts = null;
let unsubscribeOrders = null;

function showToast(message){
  const t=$('#toast');
  if(!t){ alert(message); return; }
  t.textContent=message;
  t.classList.add('show');
  clearTimeout(window.__shopToast);
  window.__shopToast=setTimeout(()=>t.classList.remove('show'),2800);
}

function injectShopStyles(){
  if($('#snazzleShopStyles')) return;
  const style=document.createElement('style');
  style.id='snazzleShopStyles';
  style.textContent=`
    #shopSheet .panel{background:linear-gradient(180deg,#fff1b8 0%,#efd391 100%)}
    .shop-intro{margin:7px 0 14px;padding:13px 14px;border-radius:17px;background:linear-gradient(135deg,#e9f8b6,#cfea83);border:2px solid #8eb54a;color:#29421e;font-weight:850;line-height:1.42}
    .shop-intro strong{display:block;font-size:16px;margin-bottom:3px}
    .shop-pay-note{margin:10px 0 14px;padding:11px 12px;border-radius:14px;background:#fff8df;border:2px solid #d6b770;color:#5d421f;font-size:12px;font-weight:800;line-height:1.4}
    .shop-products{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:12px}
    .shop-product{border:3px solid #805127;border-radius:20px;overflow:hidden;background:#fff8df;color:#342318;box-shadow:0 5px 0 #6b431f,0 8px 18px rgba(0,0,0,.16);display:flex;flex-direction:column;min-width:0}
    .shop-product-media{height:132px;background:linear-gradient(145deg,#71c76f,#2d8a55);display:grid;place-items:center;overflow:hidden;position:relative}
    .shop-product-media img{width:100%;height:100%;object-fit:cover;display:block}
    .shop-product-placeholder{font-size:45px;filter:drop-shadow(0 4px 2px rgba(0,0,0,.18))}
    .shop-product-body{padding:11px;display:flex;flex-direction:column;gap:6px;flex:1}
    .shop-product h3{font-size:16px;line-height:1.1;margin:0;color:#2d2116}
    .shop-product p{font-size:11px;line-height:1.35;margin:0;color:#725434;font-weight:650;min-height:30px}
    .shop-price{font-size:19px;font-weight:1000;color:#16703e;margin-top:auto}
    .shop-product button{border:0;border-radius:13px;padding:10px;background:linear-gradient(#70c93f,#40942b);color:#fff;font-weight:1000;box-shadow:0 3px 0 #2c6f21;margin-top:3px}
    .shop-empty{padding:22px 15px;border-radius:18px;background:#fff8df;border:2px dashed #b9955c;color:#684d2e;text-align:center;font-weight:850;line-height:1.5;grid-column:1/-1}
    .shop-error{background:#ffe0d8;border-color:#ca735d;color:#773b2f}
    .shop-checkout{display:none;margin-top:10px}.shop-checkout.show{display:block;animation:shopPop .2s ease-out}
    .shop-back{border:0;background:none;color:#5c3c20;font-weight:950;padding:5px 0 11px}
    .shop-summary{display:flex;gap:12px;align-items:center;padding:12px;border-radius:17px;background:#fff8df;border:2px solid #c6a365;color:#332318}
    .shop-summary-thumb{width:72px;height:72px;flex:0 0 72px;border-radius:15px;overflow:hidden;background:linear-gradient(145deg,#62c78e,#39986b);display:grid;place-items:center;font-size:32px}
    .shop-summary-thumb img{width:100%;height:100%;object-fit:cover}.shop-summary strong{display:block;font-size:17px}.shop-summary small{display:block;color:#735637;font-weight:750;margin-top:3px}.shop-summary .price{font-weight:1000;color:#16703e;margin-top:5px}
    .shop-step-title{font-size:14px;font-weight:1000;margin:17px 0 8px;color:#3c2a19}
    .shop-qty{display:flex;align-items:center;gap:10px}.shop-qty button{width:42px;height:42px;border:0;border-radius:13px;background:#70472b;color:#fff;font-size:24px;font-weight:1000}.shop-qty output{min-width:48px;text-align:center;font-size:20px;font-weight:1000;color:#322318}
    .shop-methods{display:grid;grid-template-columns:1fr 1fr;gap:9px}.shop-method{position:relative}.shop-method input{position:absolute;opacity:0;pointer-events:none}.shop-method label{display:block;padding:12px 9px;border-radius:15px;background:#fff8df;border:3px solid #c6a365;color:#4f3923;font-weight:950;text-align:center;line-height:1.25}.shop-method input:checked+label{background:linear-gradient(145deg,#dff59d,#bfe66c);border-color:#70a83b;color:#27471f;box-shadow:0 3px 0 #759242}
    .shop-fields{display:grid;gap:10px}.shop-fields label{display:block;font-size:11px;font-weight:950;color:#4b351f}.shop-fields input{width:100%;margin-top:4px;border:2px solid #b99760;border-radius:12px;background:#fffdf3;color:#2d2116;padding:11px 12px;outline:none}.shop-fields input:focus{border-color:#5d9f44;box-shadow:0 0 0 3px rgba(93,159,68,.15)}
    .shop-address{display:none;grid-template-columns:1fr 95px;gap:9px}.shop-address.show{display:grid}.shop-address .wide{grid-column:1/-1}.shop-address .city{grid-column:1/-1}
    .shop-check{display:flex;align-items:flex-start;gap:9px;margin-top:11px;padding:11px;border-radius:13px;background:#fff8df;border:1px solid #d1b57c;color:#543d25;font-size:11px;font-weight:750;line-height:1.35}.shop-check input{margin-top:2px;transform:scale(1.18)}
    .shop-total{margin:13px 0;padding:13px 14px;border-radius:15px;background:linear-gradient(135deg,#4e9c3c,#297c42);color:#fff;display:flex;justify-content:space-between;gap:10px;align-items:center}.shop-total small{font-weight:750}.shop-total strong{font-size:20px}
    .shop-submit{width:100%;border:0;border-radius:16px;padding:15px;background:linear-gradient(#ffcf45,#f29c23);color:#35230f;font-weight:1000;box-shadow:0 4px 0 #9f6218;font-size:15px}
    .shop-success{display:none;text-align:center;padding:22px 14px}.shop-success.show{display:block}.shop-success .icon{font-size:55px}.shop-success h3{font-size:23px;margin:5px 0;color:#2e4b20}.shop-success p{color:#5c4329;line-height:1.45;font-weight:750}.shop-order-no{display:inline-block;padding:9px 12px;border-radius:99px;background:#fff8df;border:2px solid #c5a466;color:#4d3822;font-weight:1000;margin:7px 0 13px}.shop-success button{border:0;border-radius:14px;padding:12px 15px;background:#4b9338;color:white;font-weight:1000}
    .shop-admin-wrap{display:grid;gap:14px}.shop-admin-box{padding:13px;border-radius:17px;background:#fff8e4;border:2px solid #c6a268;color:#342318}.shop-admin-box h3{margin:0 0 10px}.shop-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.shop-admin-grid .wide{grid-column:1/-1}.shop-admin-grid label{font-size:11px;font-weight:950}.shop-admin-grid input,.shop-admin-grid textarea{width:100%;margin-top:4px;border:2px solid #b99760;border-radius:11px;padding:9px;background:#fff;color:#2d2116;-webkit-text-fill-color:#2d2116;caret-color:#2d2116}.shop-admin-grid input::placeholder,.shop-admin-grid textarea::placeholder{color:#7a6652;-webkit-text-fill-color:#7a6652;opacity:1}.shop-admin-grid textarea{min-height:70px;resize:vertical}.shop-admin-check{display:flex;gap:8px;align-items:center;font-weight:900;margin:10px 0}.shop-image-preview{height:135px;border-radius:14px;background:#e7d3a7;overflow:hidden;display:grid;place-items:center;color:#7b603a;font-weight:850}.shop-image-preview img{width:100%;height:100%;object-fit:cover}.shop-admin-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.shop-admin-actions button{border:0;border-radius:12px;padding:10px 12px;font-weight:950}.shop-admin-save{background:#4b9638;color:white}.shop-admin-cancel{background:#d7c29a;color:#4b3520}.shop-admin-product-list,.shop-order-list{display:grid;gap:9px}.shop-admin-product,.shop-order-card{padding:11px;border-radius:15px;background:#fffdf4;border:2px solid #c9a66a;color:#382719}.shop-admin-product{display:grid;grid-template-columns:54px 1fr;gap:9px;align-items:center}.shop-admin-product .thumb{width:54px;height:54px;border-radius:12px;background:#78bd75;overflow:hidden;display:grid;place-items:center;font-size:25px}.shop-admin-product .thumb img{width:100%;height:100%;object-fit:cover}.shop-admin-product strong{display:block}.shop-admin-product small{display:block;color:#735735;font-weight:750}.shop-admin-product .buttons{grid-column:1/-1;display:flex;gap:7px}.shop-admin-product button{border:0;border-radius:10px;padding:8px 10px;font-weight:900;background:#e0c99e;color:#432e1c}.shop-admin-product button.danger{background:#efb2a4;color:#692e23}
    .shop-order-card strong{display:block;font-size:15px}.shop-order-card .meta{display:block;margin:4px 0;color:#735538;font-size:11px;font-weight:750}.shop-order-card .customer{margin:8px 0;padding:8px;border-radius:10px;background:#f3e5c5;font-size:11px;line-height:1.45}.shop-order-card select{width:100%;border:2px solid #b89961;border-radius:10px;padding:8px;background:white;margin:7px 0}.shop-order-actions{display:flex;gap:7px;flex-wrap:wrap}.shop-order-actions button{border:0;border-radius:10px;padding:8px 10px;font-weight:900;background:#4b9338;color:#fff}.shop-order-actions button.mail{background:#3183b9}.shop-badge{display:inline-block;padding:4px 7px;border-radius:99px;background:#e4d09e;color:#5e4629;font-size:10px;font-weight:1000;margin-left:5px}
    @keyframes shopPop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:390px){.shop-products{grid-template-columns:1fr}.shop-product-media{height:170px}}
  `;
  document.head.appendChild(style);
}

function ensureShopUI(){
  const panel=$('#shopSheet .panel');
  if(!panel || $('#shopRoot')) return;
  const title=$('h2',panel); if(title) title.textContent='Snazzle Shop 🛍️';
  const intro=$('p',panel); if(intro) intro.remove();
  const root=document.createElement('div');
  root.id='shopRoot';
  root.innerHTML=`<div id="shopBrowse"><div class="shop-intro"><strong>🦆 Kies je Snazzle</strong>Bestellen doe je samen met een ouder of verzorger.</div><div class="shop-pay-note">💡 <strong>Je betaalt nog niet in de app.</strong> Je stuurt eerst een bestelaanvraag. Snazzle neemt daarna contact op over betaling en afhalen of verzending.</div><div class="shop-products" id="shopProducts"><div class="shop-empty">Shop wordt geladen…</div></div></div><div class="shop-checkout" id="shopCheckout"></div><div class="shop-success" id="shopSuccess"></div>`;
  panel.appendChild(root);
  renderShop();
}

function activeProducts(){ return shopProducts.filter(p=>p.active!==false).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'nl')); }
function renderShop(){
  ensureShopUI();
  const box=$('#shopProducts'); if(!box) return;
  const visible=activeProducts(); box.innerHTML='';
  if(!visible.length){ box.innerHTML='<div class="shop-empty">🛍️ Er staan nog geen producten in de Snazzle Shop.<br><small>De beheerder kan ze straks toevoegen.</small></div>'; return; }
  visible.forEach(p=>{
    const card=document.createElement('article'); card.className='shop-product';
    card.innerHTML=`<div class="shop-product-media">${p.imageData?`<img src="${p.imageData}" alt="${esc(p.name)}">`:'<span class="shop-product-placeholder">🦆</span>'}</div><div class="shop-product-body"><h3>${esc(p.name||'Snazzle')}</h3><p>${esc(p.description||'Een bijzondere Snazzle.')}</p><div class="shop-price">${euro(p.priceCents)}</div><button type="button" data-shop-product="${esc(p.id)}">Bestellen / reserveren 🦆</button></div>`;
    box.appendChild(card);
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
  });
  $$('[data-shop-product]',box).forEach(b=>{
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
  });
}
function selectedProduct(){ return shopProducts.find(p=>p.id===selectedProductId) || null; }
function openCheckout(productId){
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
}
function renderCheckout(){
  const p=selectedProduct(), box=$('#shopCheckout'); if(!box || !p) return;
  box.innerHTML=`<button type="button" class="shop-back" id="shopBack">‹ Terug naar de shop</button><div class="shop-summary"><div class="shop-summary-thumb">${p.imageData?`<img src="${p.imageData}" alt="${esc(p.name)}">`:'🦆'}</div><div><strong>${esc(p.name)}</strong><small>${esc(p.description||'')}</small><div class="price">${euro(p.priceCents)}</div></div></div><div class="shop-step-title">1. Hoeveel wil je?</div><div class="shop-qty"><button type="button" id="shopMinus" aria-label="Aantal verlagen">−</button><output id="shopQty">${selectedQuantity}</output><button type="button" id="shopPlus" aria-label="Aantal verhogen">+</button></div><div class="shop-step-title">2. Afhalen of verzenden?</div><div class="shop-methods"><div class="shop-method"><input type="radio" name="shopMethod" id="shopPickup" value="pickup" checked><label for="shopPickup">📍 Afhalen<br><small>moment in overleg</small></label></div><div class="shop-method"><input type="radio" name="shopMethod" id="shopShipping" value="shipping"><label for="shopShipping">📦 Verzenden<br><small>kosten in overleg</small></label></div></div><div class="shop-step-title">3. Gegevens ouder / verzorger</div><div class="shop-fields"><label>Naam ouder/verzorger<input id="shopContactName" maxlength="60" autocomplete="name" placeholder="Voor- en achternaam"></label><label>E-mailadres<input id="shopEmail" type="email" maxlength="120" autocomplete="email" placeholder="naam@email.nl"></label><label>Telefoonnummer <small>(optioneel)</small><input id="shopPhone" type="tel" maxlength="30" autocomplete="tel" placeholder="06…"></label></div><div class="shop-address" id="shopAddress"><label>Straat<input id="shopStreet" maxlength="80" autocomplete="street-address"></label><label>Huisnr.<input id="shopHouseNumber" maxlength="15"></label><label class="wide">Postcode<input id="shopPostalCode" maxlength="12" autocomplete="postal-code" placeholder="1234 AB"></label><label class="city">Woonplaats<input id="shopCity" maxlength="60" autocomplete="address-level2"></label></div><label class="shop-check"><input id="shopAdult" type="checkbox"><span>Ik plaats deze aanvraag als ouder/verzorger of als volwassene.</span></label><label class="shop-check"><input id="shopPrivacy" type="checkbox"><span>Ik begrijp dat Snazzle deze gegevens alleen gebruikt om deze bestelaanvraag af te handelen en hierover contact op te nemen.</span></label><div class="shop-total"><span><small>Producttotaal</small><br><span id="shopTotalNote">Afhalen · nog geen betaling</span></span><strong id="shopTotal">${euro((p.priceCents||0)*selectedQuantity)}</strong></div><button class="shop-submit" id="shopSubmitOrder" type="button">Bestelaanvraag versturen 🦆</button>`;
  $('#shopBack').onclick=backToShop; $('#shopMinus').onclick=()=>changeQuantity(-1); $('#shopPlus').onclick=()=>changeQuantity(1); $$('input[name="shopMethod"]',box).forEach(r=>r.onchange=updateCheckoutMethod); $('#shopSubmitOrder').onclick=submitOrder; updateCheckoutMethod();
}
function changeQuantity(delta){ selectedQuantity=Math.max(1,Math.min(10,selectedQuantity+delta)); const p=selectedProduct(); if($('#shopQty')) $('#shopQty').textContent=String(selectedQuantity); if($('#shopTotal') && p) $('#shopTotal').textContent=euro((p.priceCents||0)*selectedQuantity); }
function updateCheckoutMethod(){ const method=$('input[name="shopMethod"]:checked','#shopCheckout')?.value || 'pickup'; $('#shopAddress')?.classList.toggle('show',method==='shipping'); if($('#shopTotalNote')) $('#shopTotalNote').textContent=method==='shipping'?'Verzending · kosten worden afgestemd':'Afhalen · nog geen betaling'; }
function backToShop(){ selectedProductId=null; $('#shopCheckout')?.classList.remove('show'); if($('#shopCheckout')) $('#shopCheckout').innerHTML=''; $('#shopSuccess')?.classList.remove('show'); if($('#shopBrowse')) $('#shopBrowse').style.display='block'; }
function makeOrderNo(){ const d=new Date(), y=String(d.getFullYear()), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0'), rnd=Math.random().toString(36).slice(2,6).toUpperCase(); return `SNA-${y}${m}${day}-${rnd}`; }
function validEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
async function submitOrder(){
  const p=selectedProduct(); if(!p || !shopUser) return showToast('De shop is nog niet klaar. Probeer het zo opnieuw.');
  const method=$('input[name="shopMethod"]:checked','#shopCheckout')?.value || 'pickup', contactName=$('#shopContactName')?.value.trim() || '', email=$('#shopEmail')?.value.trim().toLowerCase() || '', phone=$('#shopPhone')?.value.trim() || '', street=$('#shopStreet')?.value.trim() || '', houseNumber=$('#shopHouseNumber')?.value.trim() || '', postalCode=$('#shopPostalCode')?.value.trim().toUpperCase() || '', city=$('#shopCity')?.value.trim() || '', adultConfirmed=!!$('#shopAdult')?.checked, privacyAcknowledged=!!$('#shopPrivacy')?.checked;
  if(contactName.length<2) return showToast('Vul de naam van ouder/verzorger in'); if(!validEmail(email)) return showToast('Vul een geldig e-mailadres in'); if(method==='shipping' && (!street || !houseNumber || !postalCode || !city)) return showToast('Vul het volledige verzendadres in'); if(!adultConfirmed) return showToast('Bevestig dat een volwassene/ouder de aanvraag plaatst'); if(!privacyAcknowledged) return showToast('Bevestig de informatie over het gebruik van je gegevens');
  const order={userId:shopUser.uid,orderNo:makeOrderNo(),productId:p.id,productName:p.name,unitPriceCents:Number(p.priceCents)||0,quantity:selectedQuantity,productTotalCents:(Number(p.priceCents)||0)*selectedQuantity,fulfillment:method,contactName,email,phone,street:method==='shipping'?street:'',houseNumber:method==='shipping'?houseNumber:'',postalCode:method==='shipping'?postalCode:'',city:method==='shipping'?city:'',adultConfirmed:true,privacyAcknowledged:true,status:'new',createdAt:new Date().toISOString()};
  const button=$('#shopSubmitOrder'); if(button){button.disabled=true;button.textContent='Even versturen…';}
  try{ await addDoc(collection(db,'shopOrders'),order); showOrderSuccess(order); }catch(e){ console.error('shop order',e); if(button){button.disabled=false;button.textContent='Bestelaanvraag versturen 🦆';} showToast('Bestelling kon nog niet worden verstuurd. Firebase moet de shop nog toestemming geven.'); }
}
function showOrderSuccess(order){ $('#shopCheckout')?.classList.remove('show'); if($('#shopBrowse')) $('#shopBrowse').style.display='none'; const box=$('#shopSuccess'); if(!box) return; box.innerHTML=`<div class="icon">🎉</div><h3>Aanvraag ontvangen!</h3><div class="shop-order-no">${esc(order.orderNo)}</div><p><strong>${esc(order.quantity)}× ${esc(order.productName)}</strong><br>${order.fulfillment==='pickup'?'📍 Je hebt gekozen voor afhalen.':'📦 Je hebt gekozen voor verzending.'}</p><p>Er is nog niets betaald. Snazzle neemt contact op via <strong>${esc(order.email)}</strong> over betaling en het vervolg.</p><button type="button" id="shopContinue">Verder kijken in de shop</button>`; box.classList.add('show'); $('#shopContinue').onclick=backToShop; box.scrollIntoView({behavior:'smooth',block:'start'}); }

async function compressProductImage(file){
  if(!file || !file.type.startsWith('image/')) throw new Error('Kies een afbeelding');
  return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>{ const image=new Image(); image.onload=()=>{ const max=520, scale=Math.min(1,max/Math.max(image.width,image.height)), canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(image.width*scale)); canvas.height=Math.max(1,Math.round(image.height*scale)); canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height); const out=canvas.toDataURL('image/jpeg',.58); if(out.length>600000) reject(new Error('Afbeelding is te groot')); else resolve(out); }; image.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen')); image.src=reader.result; }; reader.onerror=()=>reject(new Error('Bestand kon niet worden gelezen')); reader.readAsDataURL(file); });
}
function ensureShopAdminUI(){
  const superOnly=$('#adminSheet .super-only'), tabs=$('#adminSheet .tabs'); if(!superOnly || !tabs || $('#shopAdmin')) return;
  const tab=document.createElement('button'); tab.type='button'; tab.id='shopAdminTab'; tab.textContent='Shop'; tabs.appendChild(tab);
  const section=document.createElement('section'); section.className='admin-section'; section.id='shopAdmin'; section.innerHTML=`<div class="shop-admin-wrap"><div class="shop-admin-box"><h3>🛍️ Product toevoegen / bewerken</h3><div class="shop-admin-grid"><label class="wide">Productnaam<input id="shopProductName" maxlength="80" placeholder="Bijv. Snazzle eendje"></label><label class="wide">Omschrijving<textarea id="shopProductDescription" maxlength="300" placeholder="Korte omschrijving"></textarea></label><label>Prijs (€)<input id="shopProductPrice" inputmode="decimal" placeholder="9,95"></label><label>Foto<input id="shopProductImage" type="file" accept="image/*"></label><div class="wide shop-image-preview" id="shopProductPreview">Nog geen foto</div></div><label class="shop-admin-check"><input id="shopProductActive" type="checkbox" checked> Product zichtbaar in de shop</label><div class="shop-admin-actions"><button class="shop-admin-save" id="shopSaveProduct" type="button">Product opslaan</button><button class="shop-admin-cancel" id="shopResetProduct" type="button">Nieuw / leegmaken</button></div></div><div class="shop-admin-box"><h3>Producten</h3><div class="shop-admin-product-list" id="shopAdminProducts"></div></div><div class="shop-admin-box"><h3>📦 Bestelaanvragen</h3><div class="shop-order-list" id="shopAdminOrders"></div></div></div>`; superOnly.appendChild(section);
  tab.onclick=()=>{ $$('#adminSheet .tabs button').forEach(b=>b.classList.remove('on')); $$('#adminSheet .admin-section').forEach(s=>s.classList.remove('on')); tab.classList.add('on'); section.classList.add('on'); renderAdminShop(); };
  $('#shopProductImage').onchange=async e=>{ try{productImageDraft=await compressProductImage(e.target.files[0]);renderProductPreview();}catch(err){showToast(err.message);} }; $('#shopSaveProduct').onclick=saveProduct; $('#shopResetProduct').onclick=resetProductEditor; renderAdminShop();
}
function parsePriceCents(value){ const n=Number(String(value||'').trim().replace(/\s/g,'').replace(',','.')); if(!Number.isFinite(n)||n<0) return null; return Math.round(n*100); }
function renderProductPreview(){ const box=$('#shopProductPreview'); if(box) box.innerHTML=productImageDraft?`<img src="${productImageDraft}" alt="Productfoto">`:'Nog geen foto'; }
function resetProductEditor(){ editingProductId=null; productImageDraft=''; if($('#shopProductName')) $('#shopProductName').value=''; if($('#shopProductDescription')) $('#shopProductDescription').value=''; if($('#shopProductPrice')) $('#shopProductPrice').value=''; if($('#shopProductImage')) $('#shopProductImage').value=''; if($('#shopProductActive')) $('#shopProductActive').checked=true; renderProductPreview(); }
function editProduct(id){ const p=shopProducts.find(x=>x.id===id); if(!p) return; editingProductId=id; productImageDraft=p.imageData||''; $('#shopProductName').value=p.name||''; $('#shopProductDescription').value=p.description||''; $('#shopProductPrice').value=((Number(p.priceCents)||0)/100).toFixed(2).replace('.',','); $('#shopProductActive').checked=p.active!==false; renderProductPreview(); $('#shopAdmin')?.scrollIntoView({behavior:'smooth',block:'start'}); }
async function saveProduct(){ if(!shopIsSuperAdmin) return showToast('Alleen de hoofdbeheerder kan producten aanpassen'); const name=$('#shopProductName')?.value.trim()||'', description=$('#shopProductDescription')?.value.trim()||'', priceCents=parsePriceCents($('#shopProductPrice')?.value), active=!!$('#shopProductActive')?.checked; if(name.length<2) return showToast('Vul een productnaam in'); if(priceCents===null) return showToast('Vul een geldige prijs in'); const data={name,description,priceCents,imageData:productImageDraft,active,updatedAt:new Date().toISOString()}; try{ if(editingProductId) await updateDoc(doc(db,'shopProducts',editingProductId),data); else await addDoc(collection(db,'shopProducts'),{...data,createdAt:new Date().toISOString()}); resetProductEditor(); showToast('Product opgeslagen ✅'); }catch(e){console.error('save product',e);showToast('Product kon niet worden opgeslagen');} }
async function removeProduct(id){ if(!shopIsSuperAdmin) return; const p=shopProducts.find(x=>x.id===id); if(!p || !confirm(`Product “${p.name}” verwijderen?`)) return; try{await deleteDoc(doc(db,'shopProducts',id));showToast('Product verwijderd');}catch(e){console.error(e);showToast('Verwijderen mislukt');} }
const statusLabels={new:'Nieuw',contacted:'Contact opgenomen',ready_pickup:'Klaar voor afhalen',shipped:'Verzonden',completed:'Afgerond',cancelled:'Geannuleerd'};
function renderAdminShop(){
  ensureShopAdminUI(); const pbox=$('#shopAdminProducts');
  if(pbox){ pbox.innerHTML=''; if(!shopProducts.length) pbox.innerHTML='<div class="shop-empty">Nog geen producten.</div>'; shopProducts.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'nl')).forEach(p=>{ const row=document.createElement('div'); row.className='shop-admin-product'; row.innerHTML=`<div class="thumb">${p.imageData?`<img src="${p.imageData}" alt="">`:'🦆'}</div><div><strong>${esc(p.name)}</strong><small>${euro(p.priceCents)} · ${p.active!==false?'Zichtbaar':'Verborgen'}</small></div><div class="buttons"><button type="button" data-shop-edit="${esc(p.id)}">Bewerken</button><button type="button" class="danger" data-shop-delete="${esc(p.id)}">Verwijderen</button></div>`; pbox.appendChild(row); }); $$('[data-shop-edit]',pbox).forEach(b=>b.onclick=()=>editProduct(b.dataset.shopEdit)); $$('[data-shop-delete]',pbox).forEach(b=>b.onclick=()=>removeProduct(b.dataset.shopDelete)); }
  const obox=$('#shopAdminOrders');
  if(obox){ obox.innerHTML=''; if(!shopOrders.length) obox.innerHTML='<div class="shop-empty">Nog geen bestelaanvragen.</div>'; shopOrders.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).forEach(o=>{ const card=document.createElement('div'); card.className='shop-order-card'; const address=o.fulfillment==='shipping'?`${esc(o.street)} ${esc(o.houseNumber)}, ${esc(o.postalCode)} ${esc(o.city)}`:'Afhalen in overleg'; const options=Object.entries(statusLabels).map(([v,l])=>`<option value="${v}"${o.status===v?' selected':''}>${l}</option>`).join(''); card.innerHTML=`<strong>${esc(o.orderNo)} <span class="shop-badge">${esc(statusLabels[o.status]||o.status)}</span></strong><span class="meta">${esc(o.quantity)}× ${esc(o.productName)} · ${euro(o.productTotalCents)} · ${o.fulfillment==='shipping'?'📦 Verzenden':'📍 Afhalen'}</span><div class="customer"><strong>${esc(o.contactName)}</strong>${esc(o.email)}${o.phone?`<br>${esc(o.phone)}`:''}<br>${address}</div><select data-order-status="${esc(o.id)}">${options}</select><div class="shop-order-actions"><button type="button" class="mail" data-order-mail="${esc(o.id)}">✉️ Mail klant</button></div>`; obox.appendChild(card); }); $$('[data-order-status]',obox).forEach(sel=>sel.onchange=()=>updateOrderStatus(sel.dataset.orderStatus,sel.value)); $$('[data-order-mail]',obox).forEach(b=>b.onclick=()=>mailOrder(b.dataset.orderMail)); }
}
async function updateOrderStatus(id,status){ if(!shopIsSuperAdmin || !statusLabels[status]) return; try{await updateDoc(doc(db,'shopOrders',id),{status,updatedAt:new Date().toISOString()});showToast('Status bijgewerkt ✅');}catch(e){console.error(e);showToast('Status kon niet worden aangepast');} }
function mailOrder(id){ const o=shopOrders.find(x=>x.id===id); if(!o?.email) return; const status=o.status||'new'; let extra='We nemen contact met je op over betaling en het vervolg.'; if(status==='ready_pickup') extra='Je Snazzle-bestelling staat klaar om af te halen. Neem gerust contact op om het afhaalmoment af te stemmen.'; if(status==='shipped') extra='Je Snazzle-bestelling is verzonden.'; if(status==='completed') extra='Bedankt voor je bestelling bij Snazzle!'; if(status==='cancelled') extra='Je bestelaanvraag is geannuleerd. Neem contact met ons op als je vragen hebt.'; const subject=`Snazzle bestelling ${o.orderNo}`, body=`Hallo ${o.contactName},\n\nWe hebben je Snazzle-bestelaanvraag ontvangen.\n\n${o.quantity}x ${o.productName}\nProducttotaal: ${euro(o.productTotalCents)}\n${o.fulfillment==='shipping'?'Verzenden':'Afhalen'}\n\n${extra}\n\nGroetjes,\nSnazzle Creations`; window.location.href=`mailto:${encodeURIComponent(o.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; }
function startProductsListener(){ if(unsubscribeProducts) return; unsubscribeProducts=onSnapshot(collection(db,'shopProducts'),snap=>{shopProducts=snap.docs.map(d=>({id:d.id,...d.data()}));renderShop();renderAdminShop();},e=>{console.warn('shop products listener',e);const box=$('#shopProducts');if(box) box.innerHTML='<div class="shop-empty shop-error">De shop is gebouwd, maar Firebase moet de shopcollecties nog toestemming geven.</div>';}); }
function startOrdersListener(){ if(!shopIsSuperAdmin){if(unsubscribeOrders){unsubscribeOrders();unsubscribeOrders=null;}shopOrders=[];renderAdminShop();return;} if(unsubscribeOrders) return; unsubscribeOrders=onSnapshot(collection(db,'shopOrders'),snap=>{shopOrders=snap.docs.map(d=>({id:d.id,...d.data()}));renderAdminShop();},e=>console.warn('shop orders listener',e)); }
async function refreshShopAdmin(user){ shopIsSuperAdmin=false; if(!user || user.isAnonymous) return; try{const snap=await getDoc(doc(db,'adminUsers',user.uid));shopIsSuperAdmin=snap.exists()&&snap.data().active===true&&snap.data().role==='superadmin';}catch(e){console.warn('shop admin check',e);} }


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

function initShop(){ injectShopStyles(); ensureShopUI(); ensureShopAdminUI(); installShopMobileInteractions(); const close=$('#shopSheet [data-close="shopSheet"]'); if(close) close.addEventListener('click',()=>backToShop()); onAuthStateChanged(auth,async user=>{shopUser=user;await refreshShopAdmin(user);startProductsListener();startOrdersListener();ensureShopAdminUI();renderAdminShop();}); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initShop,{once:true}); else initShop();
