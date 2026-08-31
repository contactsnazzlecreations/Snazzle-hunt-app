// Snazzle Cards v203 — bronherstel voor alle 24 SPARK- en WILD-kaarten.
// Deze module wordt vanuit de bestaande rescue-loader met ?fresh=Date.now() geladen,
// zodat juist deze reparatie niet door een oude app-cache kan blijven hangen.
import { assets } from './snazzle-card-assets-v133.js';
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,doc,getDoc,setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='203-source-reset-all-24';
const TARGET_KEY='snazzleCardCatalogV2';
const ORIGINAL_COMMIT='8d5d155f4e7df3d11bb1340c5b43baeaf7c68575';
const SPARK_RAW=`https://raw.githubusercontent.com/contactsnazzlecreations/Snazzle-hunt-app/${ORIGINAL_COMMIT}/snazzle-card-force-restore-v134.js`;
const SPARK_API=`https://api.github.com/repos/contactsnazzlecreations/Snazzle-hunt-app/contents/snazzle-card-force-restore-v134.js?ref=${ORIGINAL_COMMIT}`;

let mapPromise=null;
let observer=null;
let queued=false;
let localDone=false;
let cloudStarted=false;

function installStyle(){
  document.getElementById('snCardThumbFixV201Style')?.remove();
  let s=document.getElementById('snCardThumbFixV203Style');
  if(!s){s=document.createElement('style');s.id='snCardThumbFixV203Style';document.head.appendChild(s);}
  s.textContent=`
    #sc2List .sc2-thumb,#sc2Grid .sc2-media,#sc2VaultGrid .sc2-media{
      background:#17242e!important;background-image:none!important;
      overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important
    }
    #sc2List .sc2-thumb>img,#sc2Grid .sc2-media>img,#sc2VaultGrid .sc2-media>img{
      display:block!important;visibility:visible!important;opacity:1!important;
      width:100%!important;height:100%!important;object-fit:contain!important;
      object-position:center!important;background:#17242e!important
    }
  `;
}

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const im=new Image();
    im.onload=()=>resolve(im);
    im.onerror=()=>reject(new Error('kaartvel kon niet laden'));
    im.src=src;
  });
}

function extractSpark(text){
  const m=String(text||'').match(/const\s+SPARK\s*=\s*['\"](data:image\/(?:jpeg|jpg|png|webp);base64,[^'\"]+)['\"]/);
  if(!m)throw new Error('volledige SPARK-bron niet gevonden');
  return m[1];
}

async function getOriginalSpark(){
  try{
    const r=await fetch(`${SPARK_RAW}?v=${Date.now()}`,{cache:'no-store',mode:'cors'});
    if(r.ok)return extractSpark(await r.text());
  }catch(err){console.warn('Snazzle v203 SPARK raw',err);}
  try{
    const r=await fetch(`${SPARK_API}&v=${Date.now()}`,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok)throw new Error(`GitHub ${r.status}`);
    const j=await r.json();
    const bytes=atob(String(j.content||'').replace(/\s/g,''));
    const arr=Uint8Array.from(bytes,c=>c.charCodeAt(0));
    return extractSpark(new TextDecoder().decode(arr));
  }catch(err){
    console.warn('Snazzle v203 SPARK API; lokale asset fallback',err);
    return assets.spark;
  }
}

function cropSheet(sheet,cols,rows,prefix){
  const out={};
  for(let i=0;i<cols*rows;i++){
    const col=i%cols,row=Math.floor(i/cols);
    const x0=Math.round(sheet.naturalWidth*col/cols);
    const x1=Math.round(sheet.naturalWidth*(col+1)/cols);
    const y0=Math.round(sheet.naturalHeight*row/rows);
    const y1=Math.round(sheet.naturalHeight*(row+1)/rows);
    const sw=Math.max(1,x1-x0),sh=Math.max(1,y1-y0);
    const h=300,w=Math.max(1,Math.round(h*sw/sh));
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d',{alpha:false});
    ctx.fillStyle='#17242e';ctx.fillRect(0,0,w,h);
    ctx.drawImage(sheet,x0,y0,sw,sh,0,0,w,h);
    out[`${prefix}${String(i+1).padStart(2,'0')}`]=c.toDataURL('image/jpeg',.88);
  }
  return out;
}

async function buildMap(){
  if(mapPromise)return mapPromise;
  mapPromise=(async()=>{
    const [spark,wild]=await Promise.all([
      loadImage(await getOriginalSpark()),
      loadImage(assets.wild)
    ]);
    const result={
      ...cropSheet(spark,6,2,'S01-S'),
      ...cropSheet(wild,4,3,'S01-W')
    };
    if(Object.keys(result).length!==24)throw new Error('kaartmap is niet compleet');
    window.__snazzleCardThumbMapV203=result;
    return result;
  })();
  return mapPromise;
}

function cardNumber(el){
  return String(el?.textContent||'').toUpperCase().match(/S01-[SW]\d{2}/)?.[0]||'';
}

function putImage(box,num,src){
  if(!box||!src)return false;
  box.style.setProperty('background','#17242e','important');
  box.style.setProperty('background-image','none','important');
  box.style.setProperty('overflow','hidden','important');
  let img=box.querySelector(':scope > img');
  if(!img){img=document.createElement('img');box.replaceChildren(img);}
  else if(box.children.length!==1)box.replaceChildren(img);
  if(img.dataset.snV203!==num||img.src!==src){img.src=src;img.alt=num;img.dataset.snV203=num;}
  img.style.setProperty('display','block','important');
  img.style.setProperty('visibility','visible','important');
  img.style.setProperty('opacity','1','important');
  img.style.setProperty('width','100%','important');
  img.style.setProperty('height','100%','important');
  img.style.setProperty('object-fit','contain','important');
  img.style.setProperty('object-position','center','important');
  return true;
}

async function replaceStoredImages(map){
  if(localDone)return;
  try{
    const cards=JSON.parse(localStorage.getItem(TARGET_KEY)||'[]');
    if(Array.isArray(cards)){
      let changed=0;
      for(const card of cards){
        const num=String(card?.number||'').toUpperCase();
        if(map[num]){
          // Altijd vervangen: de oude code liet bestaande kapotte imageData juist staan.
          card.imageData=map[num];
          card.seedVersion=VERSION;
          card.updatedAt=new Date().toISOString();
          changed++;
        }
      }
      localStorage.setItem(TARGET_KEY,JSON.stringify(cards));
      localStorage.setItem('snazzleCardImagesV203',JSON.stringify({version:VERSION,count:changed,at:new Date().toISOString()}));
      localDone=true;
      window.dispatchEvent(new CustomEvent('snazzle-card-catalog-restored',{detail:{count:changed,version:VERSION}}));
    }
  }catch(err){console.warn('Snazzle v203 lokale kaartbeelden',err);}
}

async function syncCloud(map){
  if(cloudStarted||!getApps().length)return;
  cloudStarted=true;
  try{
    const app=getApp(),auth=getAuth(app),db=getFirestore(app);
    onAuthStateChanged(auth,async user=>{
      if(!user||user.isAnonymous)return;
      try{
        const admin=await getDoc(doc(db,'adminUsers',user.uid));
        const profile=admin.exists()?admin.data():null;
        if(profile?.active!==true||profile?.role!=='superadmin')return;
        for(let i=1;i<=12;i++){
          const n=String(i).padStart(2,'0');
          await setDoc(doc(db,'snazzleCards',`seed-spark-${n}`),{number:`S01-S${n}`,imageData:map[`S01-S${n}`],seedVersion:VERSION,updatedAt:new Date().toISOString()},{merge:true});
          await setDoc(doc(db,'snazzleCards',`seed-wild-${n}`),{number:`S01-W${n}`,imageData:map[`S01-W${n}`],seedVersion:VERSION,updatedAt:new Date().toISOString()},{merge:true});
        }
        try{localStorage.setItem('snazzleCardImagesV203Central',JSON.stringify({version:VERSION,count:24,at:new Date().toISOString()}));}catch{}
        window.dispatchEvent(new CustomEvent('snazzle-card-catalog-restored',{detail:{count:24,version:VERSION,central:true}}));
      }catch(err){console.warn('Snazzle v203 centrale kaartbeelden',err);}
    });
  }catch(err){console.warn('Snazzle v203 cloud init',err);}
}

async function repair(){
  installStyle();
  let map;
  try{map=await buildMap();}catch(err){console.error('Snazzle Cards v203',err);return 0;}
  await replaceStoredImages(map);
  syncCloud(map);
  let fixed=0;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const num=cardNumber(row);
    if(map[num]&&putImage(row.querySelector('.sc2-thumb'),num,map[num]))fixed++;
  });
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const num=cardNumber(card);
    if(map[num]&&putImage(card.querySelector('.sc2-media'),num,map[num]))fixed++;
  });
  return fixed;
}

function queueRepair(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;repair();});
}

function start(){
  installStyle();
  repair();
  observer?.disconnect();
  observer=new MutationObserver(queueRepair);
  observer.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('#adminSheet,[data-tab="cardsAdmin"],[data-tab="cards"],.admin-tab,#collectionSheet')){
      [0,40,120,300,700,1400,2600].forEach(ms=>setTimeout(repair,ms));
    }
  },{passive:true});
  [80,250,600,1200,2200,4000,7000].forEach(ms=>setTimeout(repair,ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

window.SnazzleCardAdminThumbFix={version:VERSION,repair,buildMap};
window.SnazzleCardThumbFixV203={version:VERSION,repair,buildMap};
console.info('Snazzle Cards v203: bronherstel voor 24 kaarten actief.');