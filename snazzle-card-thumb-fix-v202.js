// Snazzle Cards v204 — definitieve zichtbare kaartweergave voor alle 24 vaste kaarten.
// Gebruikt uitsluitend de originele SPARK- en WILD-kaartvellen; opgeslagen kapotte imageData wordt niet gebruikt voor deze 24 kaarten.
import sparkSheetSrc from './snazzle-card-sheet-spark-v204.js';
import wildSheetSrc from './snazzle-card-sheet-wild-v204.js';

const VERSION='204-original-sheets-final';
let mapPromise=null,observer=null,queued=false;

function installStyle(){
  let s=document.getElementById('snCardThumbFixV204Style');
  if(!s){s=document.createElement('style');s.id='snCardThumbFixV204Style';document.head.appendChild(s);}
  s.textContent=`
    #sc2List .sc2-thumb,#sc2Grid .sc2-media,#sc2VaultGrid .sc2-media,#sc2Preview{
      background:#17242e!important;background-image:none!important;overflow:hidden!important
    }
    #sc2List .sc2-thumb>img,#sc2Grid .sc2-media>img,#sc2VaultGrid .sc2-media>img,#sc2Preview>img{
      display:block!important;visibility:visible!important;opacity:1!important;
      width:100%!important;height:100%!important;object-fit:contain!important;
      object-position:center!important;background:#17242e!important
    }
    #sc2List .sc2-thumb>img{transform:none!important;filter:none!important}
    #sc2Grid .sc2-card.unlocked .sc2-media>img,#sc2VaultGrid .sc2-card.unlocked .sc2-media>img{transform:none!important}
  `;
}

function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('origineel kaartvel kon niet laden'));im.src=src;});}
function crop(sheet,cols,rows,prefix){
  const out={};
  for(let i=0;i<cols*rows;i++){
    const col=i%cols,row=Math.floor(i/cols);
    const x0=Math.round(sheet.naturalWidth*col/cols),x1=Math.round(sheet.naturalWidth*(col+1)/cols);
    const y0=Math.round(sheet.naturalHeight*row/rows),y1=Math.round(sheet.naturalHeight*(row+1)/rows);
    const sw=Math.max(1,x1-x0),sh=Math.max(1,y1-y0);
    const h=220,w=Math.max(1,Math.round(h*sw/sh));
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.fillStyle='#17242e';ctx.fillRect(0,0,w,h);ctx.drawImage(sheet,x0,y0,sw,sh,0,0,w,h);
    out[`${prefix}${String(i+1).padStart(2,'0')}`]=c.toDataURL('image/jpeg',.9);
  }
  return out;
}
async function buildMap(){
  if(mapPromise)return mapPromise;
  mapPromise=(async()=>{
    const [spark,wild]=await Promise.all([loadImage(sparkSheetSrc),loadImage(wildSheetSrc)]);
    const map={...crop(spark,6,2,'S01-S'),...crop(wild,4,3,'S01-W')};
    window.__snazzleCardFixedImagesV204=map;
    return map;
  })();
  return mapPromise;
}
function numberFrom(el){return String(el?.textContent||'').toUpperCase().match(/S01-[SW]\d{2}/)?.[0]||'';}
function put(box,num,src){
  if(!box||!num||!src)return false;
  let img=box.querySelector(':scope > img');
  if(!img){img=document.createElement('img');box.replaceChildren(img);}
  else if(box.children.length!==1)box.replaceChildren(img);
  if(img.dataset.snFixedV204!==num||img.getAttribute('src')!==src){img.src=src;img.alt=num;img.dataset.snFixedV204=num;}
  return true;
}
function repairPreview(map){
  const editor=document.getElementById('sc2Editor');
  if(!editor?.classList.contains('show'))return;
  const num=String(document.getElementById('sc2Number')?.value||'').toUpperCase().trim();
  if(map[num])put(document.getElementById('sc2Preview'),num,map[num]);
}
async function repair(){
  installStyle();
  let map;try{map=await buildMap();}catch(err){console.error('Snazzle Cards v204:',err);return 0;}
  let fixed=0;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{const n=numberFrom(row);if(map[n]&&put(row.querySelector('.sc2-thumb'),n,map[n]))fixed++;});
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{const n=numberFrom(card);if(map[n]&&put(card.querySelector('.sc2-media'),n,map[n]))fixed++;});
  repairPreview(map);
  return fixed;
}
function queueRepair(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair();});}
function watch(){
  if(observer)return;
  observer=new MutationObserver(muts=>{if(muts.some(m=>m.type==='childList'&&m.addedNodes.length))queueRepair();});
  observer.observe(document.body,{subtree:true,childList:true});
}
function start(){
  installStyle();repair();watch();
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-sc2edit],#adminSheet,[data-tab="cardsAdmin"],[data-tab="cards"],.admin-tab,#collectionSheet,[data-collection-tab]')){
      [0,40,120,300,700].forEach(ms=>setTimeout(repair,ms));
    }
  },{passive:true});
  document.addEventListener('input',e=>{if(e.target?.id==='sc2Number')setTimeout(repair,0);},{passive:true});
  [80,250,600,1200,2400,5000].forEach(ms=>setTimeout(repair,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.SnazzleCardThumbFixV204={version:VERSION,repair,buildMap};
window.SnazzleCardThumbFixV202=window.SnazzleCardThumbFixV204;
console.info('Snazzle Cards v204: 24 originele kaartafbeeldingen actief.');
