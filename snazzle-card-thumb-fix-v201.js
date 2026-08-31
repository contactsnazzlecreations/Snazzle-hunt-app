// Snazzle Cards v201 — definitieve SPARK-miniaturen in Beheer.
// Maakt voor S01-S01 t/m S01-S12 een eigen afbeelding en laat de oude sprite-methode buiten spel.
import { assets } from './snazzle-card-assets-v133.js';

const VERSION='201-spark-individual-thumbs';
let thumbMap=null;
let buildPromise=null;
let observer=null;
let queued=false;

function installStyle(){
  if(document.getElementById('snCardThumbFixV201Style'))return;
  const s=document.createElement('style');
  s.id='snCardThumbFixV201Style';
  s.textContent=`
    #sc2List .sc2-thumb{background:#18242f!important;background-image:none!important;display:grid!important;place-items:center!important;overflow:hidden!important}
    #sc2List .sc2-thumb img{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;background:#18242f!important}
  `;
  document.head.appendChild(s);
}

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const im=new Image();
    im.onload=()=>resolve(im);
    im.onerror=()=>reject(new Error('SPARK-kaartvel kon niet laden'));
    im.src=src;
  });
}

async function buildThumbs(){
  if(thumbMap)return thumbMap;
  if(buildPromise)return buildPromise;
  buildPromise=(async()=>{
    const sheet=await loadImage(assets.spark);
    if(!sheet.naturalWidth||!sheet.naturalHeight)throw new Error('SPARK-kaartvel is leeg');
    const map={};
    for(let i=0;i<12;i++){
      const col=i%6,row=Math.floor(i/6);
      const left=Math.round(sheet.naturalWidth*col/6);
      const right=Math.round(sheet.naturalWidth*(col+1)/6);
      const top=Math.round(sheet.naturalHeight*row/2);
      const bottom=Math.round(sheet.naturalHeight*(row+1)/2);
      const c=document.createElement('canvas');
      c.width=120;c.height=240;
      const ctx=c.getContext('2d');
      ctx.fillStyle='#18242f';ctx.fillRect(0,0,c.width,c.height);
      ctx.drawImage(sheet,left,top,Math.max(1,right-left),Math.max(1,bottom-top),0,0,c.width,c.height);
      map[`S01-S${String(i+1).padStart(2,'0')}`]=c.toDataURL('image/jpeg',.86);
    }
    thumbMap=map;
    window.__snazzleSparkThumbsV201=map;
    return map;
  })().finally(()=>{buildPromise=null;});
  return buildPromise;
}

function numberFor(row){
  return String(row.querySelector('strong')?.textContent||'').toUpperCase().match(/S01-S\d{2}/)?.[0]||'';
}

function putImage(box,num,src){
  if(!box||!src)return;
  box.style.setProperty('background','#18242f','important');
  box.style.setProperty('background-image','none','important');
  let img=box.querySelector('img');
  if(!img){img=document.createElement('img');box.replaceChildren(img);}
  if(img.dataset.snV201!==num||img.src!==src)img.src=src;
  img.alt=num;
  img.dataset.snV201=num;
  img.style.setProperty('display','block','important');
  img.style.setProperty('visibility','visible','important');
  img.style.setProperty('opacity','1','important');
  img.style.setProperty('width','100%','important');
  img.style.setProperty('height','100%','important');
  img.style.setProperty('object-fit','contain','important');
  img.style.setProperty('object-position','center','important');
}

async function repair(){
  installStyle();
  let map;
  try{map=await buildThumbs();}catch(err){console.warn('Snazzle Cards v201:',err);return false;}
  let fixed=0;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const num=numberFor(row);
    if(map[num]){putImage(row.querySelector('.sc2-thumb'),num,map[num]);fixed++;}
  });
  return fixed>0;
}

function queueRepair(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;repair();});
}

function watchList(){
  const list=document.getElementById('sc2List');
  if(!list||list.dataset.snV201Watch)return;
  list.dataset.snV201Watch='1';
  observer=new MutationObserver(queueRepair);
  observer.observe(list,{childList:true,subtree:true});
}

function start(){
  installStyle();
  repair().then(watchList);
  document.addEventListener('click',e=>{
    if(e.target.closest('#adminSheet,[data-tab="cardsAdmin"],[data-tab="cards"],.admin-tab')){
      setTimeout(()=>{watchList();repair();},30);
    }
  },{passive:true});
  window.addEventListener('snazzle-card-catalog-restored',()=>setTimeout(()=>{watchList();repair();},30));
  [120,350,800,1500,3000,6000].forEach(ms=>setTimeout(()=>{watchList();repair();},ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.SnazzleCardThumbFixV201={version:VERSION,repair};
