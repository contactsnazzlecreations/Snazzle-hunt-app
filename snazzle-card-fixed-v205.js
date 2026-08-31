// Snazzle Cards v205 — canonieke weergave van de 24 vaste SPARK/WILD-kaarten.
// Gebruikt rechtstreeks de originele v133 kaartvellen en maakt per kaart een eigen volledige afbeelding.
// De zichtbare laag is een span (geen img), zodat oude thumbnail-code hem niet kan overschrijven.
import { assets } from './snazzle-card-assets-v133.js';

const VERSION='205.0-canonical-card-renderer';
const CARD_RE=/S01-([SW])(\d{2})/i;
const cache=new Map();
const sourceImages=new Map();
let repairQueued=false;

function infoFor(number){
  const m=String(number||'').toUpperCase().match(CARD_RE);
  if(!m)return null;
  const index=Number(m[2])-1;
  if(index<0||index>11)return null;
  if(m[1]==='S')return {number:m[0],world:'spark',src:assets.spark,cols:6,rows:2,col:index%6,row:Math.floor(index/6)};
  return {number:m[0],world:'wild',src:assets.wild,cols:4,rows:3,col:index%4,row:Math.floor(index/4)};
}

function loadSource(info){
  if(sourceImages.has(info.world))return sourceImages.get(info.world);
  const p=new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error(`${info.world} kaartvel kon niet laden`));
    img.src=info.src;
  });
  sourceImages.set(info.world,p);
  return p;
}

async function imageFor(number){
  const info=infoFor(number);
  if(!info)throw new Error('Onbekend vast kaartnummer');
  if(cache.has(info.number))return cache.get(info.number);
  const p=(async()=>{
    const sheet=await loadSource(info);
    const cellW=sheet.naturalWidth/info.cols;
    const cellH=sheet.naturalHeight/info.rows;
    const sx=Math.round(info.col*cellW);
    const sy=Math.round(info.row*cellH);
    const sw=Math.round((info.col+1)*cellW)-sx;
    const sh=Math.round((info.row+1)*cellH)-sy;

    // Eén uniforme portretcanvas. De kaart wordt volledig ingepast; niets wordt afgesneden.
    const outW=180,outH=300;
    const canvas=document.createElement('canvas');
    canvas.width=outW;canvas.height=outH;
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.fillStyle='#17242e';
    ctx.fillRect(0,0,outW,outH);
    const scale=Math.min(outW/sw,outH/sh);
    const dw=Math.round(sw*scale),dh=Math.round(sh*scale);
    const dx=Math.floor((outW-dw)/2),dy=Math.floor((outH-dh)/2);
    ctx.drawImage(sheet,sx,sy,sw,sh,dx,dy,dw,dh);
    return canvas.toDataURL('image/jpeg',0.94);
  })();
  cache.set(info.number,p);
  return p;
}

function installStyle(){
  let style=document.getElementById('snCardFixedV205Style');
  if(!style){style=document.createElement('style');style.id='snCardFixedV205Style';document.head.appendChild(style);}
  style.textContent=`
    #sc2List .sc2-row{grid-template-columns:72px 1fr!important;column-gap:12px!important}
    #sc2List .sc2-thumb{width:72px!important;height:120px!important;position:relative!important;overflow:hidden!important;background:#17242e!important;background-image:none!important;border-radius:11px!important}
    #sc2List .sc2-thumb>.sn-fixed-card-v205{position:absolute!important;inset:0!important;z-index:1000!important;display:block!important;background-color:#17242e!important;background-repeat:no-repeat!important;background-position:center!important;background-size:contain!important;pointer-events:none!important}
    #sc2List .sc2-thumb>img{position:absolute!important;inset:0!important;z-index:1!important}
    #sc2Grid .sc2-media,#sc2VaultGrid .sc2-media{position:relative!important;overflow:hidden!important}
    #sc2Grid .sc2-media>.sn-fixed-card-v205,#sc2VaultGrid .sc2-media>.sn-fixed-card-v205{position:absolute!important;inset:0!important;z-index:20!important;display:block!important;background-color:#17242e!important;background-repeat:no-repeat!important;background-position:center!important;background-size:contain!important;pointer-events:none!important}
    #sc2Grid .sc2-lock,#sc2Grid .sc2-rarity,#sc2Grid .sc2-num,#sc2VaultGrid .sc2-lock,#sc2VaultGrid .sc2-rarity,#sc2VaultGrid .sc2-num{z-index:30!important}
  `;
}

function numberFromRow(row){
  return String(row?.querySelector('strong')?.textContent||row?.textContent||'').toUpperCase().match(CARD_RE)?.[0]||'';
}
function numberFromCard(card){
  const direct=String(card?.querySelector('.sc2-num')?.textContent||'').toUpperCase().match(CARD_RE)?.[0];
  return direct||String(card?.textContent||'').toUpperCase().match(CARD_RE)?.[0]||'';
}

async function putLayer(box,number){
  if(!box||!infoFor(number))return false;
  let layer=box.querySelector(':scope > .sn-fixed-card-v205');
  if(!layer){layer=document.createElement('span');layer.className='sn-fixed-card-v205';box.appendChild(layer);}
  if(layer.dataset.cardNumber===number&&layer.dataset.ready==='1')return true;
  layer.dataset.cardNumber=number;
  const src=await imageFor(number);
  if(!layer.isConnected)return false;
  layer.style.backgroundImage=`url("${src}")`;
  layer.dataset.ready='1';
  return true;
}

async function repair(){
  installStyle();
  const jobs=[];
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const number=numberFromRow(row);
    if(number)jobs.push(putLayer(row.querySelector('.sc2-thumb'),number));
  });
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const number=numberFromCard(card);
    if(number)jobs.push(putLayer(card.querySelector('.sc2-media'),number));
  });
  if(!jobs.length)return 0;
  const done=await Promise.allSettled(jobs);
  return done.filter(x=>x.status==='fulfilled'&&x.value).length;
}

function queueRepair(){
  if(repairQueued)return;
  repairQueued=true;
  requestAnimationFrame(()=>{repairQueued=false;repair().catch(err=>console.error('Snazzle Cards v205 repair',err));});
}

function start(){
  installStyle();
  queueRepair();
  if(!window.__snazzleCardV205Observer){
    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.type==='childList'&&m.addedNodes.length))queueRepair();
    });
    observer.observe(document.body,{subtree:true,childList:true});
    window.__snazzleCardV205Observer=observer;
  }
  if(!window.__snazzleCardV205Clicks){
    window.__snazzleCardV205Clicks=true;
    document.addEventListener('click',e=>{
      if(e.target.closest('#adminSheet,#collectionSheet,[data-tab],[data-collection-tab],[data-sc2edit]')){
        [0,60,180,450,900].forEach(ms=>setTimeout(queueRepair,ms));
      }
    },{passive:true});
  }
  [100,300,700,1400,2800,5000].forEach(ms=>setTimeout(queueRepair,ms));
}

window.SnazzleCardFixedV205={version:VERSION,repair,imageFor};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
console.info(`Snazzle Cards ${VERSION} geladen`);
