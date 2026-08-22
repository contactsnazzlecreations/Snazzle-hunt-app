import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
let currentUser=null;
let processing=false;

function euro(cents){
  return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format((Number(cents)||0)/100);
}

async function mailActive(){
  try{
    const snap=await getDoc(doc(db,'shopMailConfig','current'));
    return snap.exists() && snap.data().active===true ? snap.data() : null;
  }catch{ return null; }
}

async function findOwnOrder(orderNo){
  if(!currentUser || !orderNo) return null;
  const q=query(collection(db,'shopOrders'),where('userId','==',currentUser.uid));
  const snap=await getDocs(q);
  const hit=snap.docs.find(d=>String(d.data().orderNo||'')===orderNo);
  return hit?{id:hit.id,...hit.data()}:null;
}

async function queueMailForOrder(order){
  const config=await mailActive();
  if(!config || !Array.isArray(config.recipientUids) || !config.recipientUids.length) return false;

  const addressLine=order.fulfillment==='shipping'
    ? `Adres: ${order.street||''} ${order.houseNumber||''}, ${order.postalCode||''} ${order.city||''}`.trim()
    : 'Afhalen: moment in overleg';
  const fulfillmentText=order.fulfillment==='shipping'?'Verzenden':'Afhalen';
  const data={
    orderNo:order.orderNo,
    productName:order.productName,
    quantity:order.quantity,
    totalText:euro(order.productTotalCents),
    fulfillmentText,
    contactName:order.contactName,
    email:order.email,
    phone:order.phone||'-',
    addressLine
  };

  const batch=writeBatch(db);
  batch.set(doc(db,'mail',`${order.id}-owners`),{
    orderId:order.id,
    kind:'owner',
    toUids:config.recipientUids,
    replyTo:order.email,
    template:{name:'shop-owner-order',data}
  });
  batch.set(doc(db,'mail',`${order.id}-customer`),{
    orderId:order.id,
    kind:'customer',
    to:[order.email],
    template:{name:'shop-customer-confirmation',data:{
      orderNo:order.orderNo,
      productName:order.productName,
      quantity:order.quantity,
      totalText:euro(order.productTotalCents),
      fulfillmentText,
      contactName:order.contactName
    }}
  });
  await batch.commit();
  localStorage.setItem(`snazzleMailQueued:${order.id}`,'1');
  return true;
}

async function processSuccess(){
  if(processing || !currentUser) return;
  const success=document.querySelector('#shopSuccess.show');
  const orderNo=success?.querySelector('.shop-order-no')?.textContent?.trim();
  if(!orderNo) return;
  processing=true;
  try{
    const order=await findOwnOrder(orderNo);
    if(!order) return;
    if(localStorage.getItem(`snazzleMailQueued:${order.id}`)==='1') return;
    await queueMailForOrder(order);
  }catch(err){
    console.warn('Snazzle mail queue',err);
  }finally{
    processing=false;
  }
}

let scheduled=false;
const observer=new MutationObserver(()=>{
  if(scheduled) return;
  scheduled=true;
  requestAnimationFrame(async()=>{scheduled=false;await processSuccess();});
});
observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

onAuthStateChanged(auth,user=>{currentUser=user;processSuccess();});
processSuccess();
