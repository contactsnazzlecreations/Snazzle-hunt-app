// Snazzle Cards v202 — alle 24 kaarten zichtbaar in Beheer.
// SPARK gebruikt het originele volledige 12-kaartenvel uit de werkende v141-versie.
// WILD gebruikt het originele WILD-kaartvel uit de kaart-assets.
// Geen opgeslagen lege imageData en geen oude sprite/background-position meer.
import { assets } from './snazzle-card-assets-v133.js';

const VERSION='202-all-24-real-admin-thumbs';
const ORIGINAL_SPARK_RAW='https://raw.githubusercontent.com/contactsnazzlecreations/Snazzle-hunt-app/8d5d155/snazzle-card-force-restore-v134.js';
const ORIGINAL_SPARK_API='https://api.github.com/repos/contactsnazzlecreations/Snazzle-hunt-app/contents/snazzle-card-force-restore-v134.js?ref=8d5d155';
let mapPromise=null;
let observer=null;
let queued=false;

function installStyle(){
  let s=document.getElementById('snCardThumbFixV202Style');
  if(!s){s=document.createElement('style');s.id='snCardThumbFixV202Style';document.head.appendChild(s);}
  s.textContent=`
    #sc2List .sc2-thumb{background:#17242e!important;background-image:none!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important}
    #sc2List .sc2-thumb>img,#sc2Grid .sc2-media>img,#sc2VaultGrid .sc2-media>img{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;background:#17242e!important}
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
  if(!m)throw new Error('originele SPARK bron niet gevonden');
  return m[1];
}

async function originalSpark(){
  try{
    const r=await fetch(`${ORIGINAL_SPARK_RAW}?v=${encodeURIComponent(VERSION)}`,{cache:'force-cache',mode:'cors'});
    if(r.ok)return extractSpark(await r.text());
  }catch(err){console.warn('Snazzle v202 raw SPARK fallback',err);}
  try{
    const r=await fetch(ORIGINAL_SPARK_API,{cache:'force-cache',headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok)throw new Error(`GitHub ${r.status}`);
    const j=await r.json();
    const text=decodeURIComponent(escape(atob(String(j.content||'').replace(/\s/g,''))));
    return extractSpark(text);
  }catch(err){
    console.warn('Snazzle v202 API SPARK fallback',err);
    return assets.spark;
  }
}

function cropSheet(sheet,cols,rows,prefix){
  const out={};
  for(let i=0;i<cols*rows;i++){
    const col=i%cols,row=Math.floor(i/cols);
    const x0=Math.round(sheet.naturalWidth*col/cols),x1=Math.round(sheet.naturalWidth*(col+1)/cols);
    const y0=Math.round(sheet.naturalHeight*row/rows),y1=Math.round(sheet.naturalHeight*(row+1)/rows);
    const sw=Math.max(1,x1-x0),sh=Math.max(1,y1-y0);
    const h=280,w=Math.max(1,Math.round(h*sw/sh));
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#17242e';ctx.fillRect(0,0,w,h);
    ctx.drawImage(sheet,x0,y0,sw,sh,0,0,w,h);
    out[`${prefix}${String(i+1).padStart(2,'0')}`]=c.toDataURL('image/jpeg',.9);
  }
  return out;
}

async function buildMap(){
  if(mapPromise)return mapPromise;
  mapPromise=(async()=>{
    const [spark,wild]=await Promise.all([loadImage(await originalSpark()),loadImage(assets.wild)]);
    const map={
      ...cropSheet(spark,6,2,'S01-S'),
      ...cropSheet(wild,4,3,'S01-W')
    };
    window.__snazzleCardThumbMapV202=map;
    return map;
  })();
  return mapPromise;
}

function numberFor(el){
  return String(el?.textContent||'').toUpperCase().match(/S01-[SW]\d{2}/)?.[0]||'';
}

function put(box,num,src){
  if(!box||!src)return false;
  box.style.setProperty('background','#17242e','important');
  box.style.setProperty('background-image','none','important');
  box.style.setProperty('background-position','center','important');
  box.style.setProperty('background-size','contain','important');
  box.style.setProperty('overflow','hidden','important');
  let img=box.querySelector(':scope > img');
  if(!img){img=document.createElement('img');box.replaceChildren(img);}
  else if(box.children.length!==1)box.replaceChildren(img);
  if(img.dataset.snThumbV202!==num){img.src=src;img.alt=num;img.dataset.snThumbV202=num;}
  for(const [k,v] of [['display','block'],['visibility','visible'],['opacity','1'],['width','100%'],['height','100%'],['object-fit','contain'],['object-position','center'],['background','#17242e']])img.style.setProperty(k,v,'important');
  return true;
}

async function repair(){
  installStyle();
  let map;try{map=await buildMap();}catch(err){console.error('Snazzle Cards v202',err);return 0;}
  let fixed=0;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{const n=numberFor(row);if(map[n]&&put(row.querySelector('.sc2-thumb'),n,map[n]))fixed++;});
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{const n=numberFor(card);if(map[n]&&put(card.querySelector('.sc2-media'),n,map[n]))fixed++;});
  return fixed;
}

function queueRepair(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;repair();});
}

function watch(){
  if(observer)observer.disconnect();
  observer=new MutationObserver(queueRepair);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','src','class']});
}

function start(){
  installStyle();repair();watch();
  document.addEventListener('click',e=>{
    if(e.target.closest('#adminSheet,[data-tab="cardsAdmin"],[data-tab="cards"],.admin-tab,#collectionSheet'))[0,40,120,300,700,1400].forEach(ms=>setTimeout(repair,ms));
  },{passive:true});
  window.addEventListener('snazzle-card-catalog-restored',()=>[0,60,180,500].forEach(ms=>setTimeout(repair,ms)));
  [100,300,700,1200,2200,4000,7000].forEach(ms=>setTimeout(repair,ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.SnazzleCardThumbFixV202={version:VERSION,repair,buildMap};
