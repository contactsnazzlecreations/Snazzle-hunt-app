// Snazzle Cards v207 — directe kaartweergave uit de originele kaartvellen.
// Geen Image->canvas->dataURL omzetting meer: de kaartvellen worden rechtstreeks als CSS-sprite gebruikt.
import sparkSheet from './snazzle-card-sheet-spark-v204.js?v=207-direct';
import wildSheet from './snazzle-card-sheet-wild-v204.js?v=207-direct';

const VERSION='207.0-direct-original-sheet-renderer';
const CARD_RE=/S01-([SW])(\d{2})/i;
let repairQueued=false;

function infoFor(number){
  const m=String(number||'').toUpperCase().match(CARD_RE);
  if(!m)return null;
  const index=Number(m[2])-1;
  if(index<0||index>11)return null;
  if(m[1]==='S')return {
    number:m[0],world:'spark',src:sparkSheet,cols:6,rows:2,
    col:index%6,row:Math.floor(index/6),widthPct:83.333333
  };
  return {
    number:m[0],world:'wild',src:wildSheet,cols:4,rows:3,
    col:index%4,row:Math.floor(index/4),widthPct:100
  };
}

function installStyle(){
  let style=document.getElementById('snCardFixedV205Style');
  if(!style){
    style=document.createElement('style');
    style.id='snCardFixedV205Style';
    document.head.appendChild(style);
  }
  style.textContent=`
    #sc2List .sc2-row{grid-template-columns:72px 1fr!important;column-gap:12px!important}
    #sc2List .sc2-thumb{
      width:72px!important;height:120px!important;position:relative!important;overflow:hidden!important;
      background:#17242e!important;background-image:none!important;border-radius:11px!important
    }
    .sn-fixed-card-v205{
      position:absolute!important;top:0!important;bottom:0!important;left:50%!important;
      transform:translateX(-50%)!important;z-index:1000!important;display:block!important;
      background-color:#17242e!important;background-repeat:no-repeat!important;
      pointer-events:none!important
    }
    #sc2List .sc2-thumb>img{opacity:0!important;visibility:hidden!important}
    #sc2Grid .sc2-media,#sc2VaultGrid .sc2-media{position:relative!important;overflow:hidden!important;background:#17242e!important}
    #sc2Grid .sc2-media>.sn-fixed-card-v205,#sc2VaultGrid .sc2-media>.sn-fixed-card-v205{z-index:20!important}
    #sc2Grid .sc2-lock,#sc2Grid .sc2-rarity,#sc2Grid .sc2-num,
    #sc2VaultGrid .sc2-lock,#sc2VaultGrid .sc2-rarity,#sc2VaultGrid .sc2-num{z-index:30!important}
  `;
}

function numberFromRow(row){
  return String(row?.querySelector('strong')?.textContent||row?.textContent||'').toUpperCase().match(CARD_RE)?.[0]||'';
}

function numberFromCard(card){
  const direct=String(card?.querySelector('.sc2-num')?.textContent||'').toUpperCase().match(CARD_RE)?.[0];
  return direct||String(card?.textContent||'').toUpperCase().match(CARD_RE)?.[0]||'';
}

function putLayer(box,number){
  const info=infoFor(number);
  if(!box||!info)return false;

  let layer=box.querySelector(':scope > .sn-fixed-card-v205');
  if(!layer){
    layer=document.createElement('span');
    layer.className='sn-fixed-card-v205';
    box.appendChild(layer);
  }

  layer.dataset.cardNumber=info.number;
  layer.dataset.cardWorld=info.world;
  layer.style.width=`${info.widthPct}%`;
  layer.style.height='100%';
  layer.style.backgroundImage=`url("${info.src}")`;
  layer.style.backgroundSize=`${info.cols*100}% ${info.rows*100}%`;
  layer.style.backgroundPosition=`${info.cols===1?0:(info.col/(info.cols-1))*100}% ${info.rows===1?0:(info.row/(info.rows-1))*100}%`;
  layer.style.backgroundRepeat='no-repeat';
  layer.style.backgroundColor='#17242e';
  layer.dataset.ready='1';
  return true;
}

function repair(){
  installStyle();
  let count=0;

  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const number=numberFromRow(row);
    if(number&&putLayer(row.querySelector('.sc2-thumb'),number))count++;
  });

  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const number=numberFromCard(card);
    if(number&&putLayer(card.querySelector('.sc2-media'),number))count++;
  });

  return count;
}

function queueRepair(){
  if(repairQueued)return;
  repairQueued=true;
  requestAnimationFrame(()=>{
    repairQueued=false;
    try{repair();}catch(err){console.error('Snazzle Cards v207 repair',err);}
  });
}

function start(){
  installStyle();
  queueRepair();

  if(!window.__snazzleCardV207Observer){
    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.type==='childList'&&m.addedNodes.length))queueRepair();
    });
    observer.observe(document.body,{subtree:true,childList:true});
    window.__snazzleCardV207Observer=observer;
  }

  if(!window.__snazzleCardV207Clicks){
    window.__snazzleCardV207Clicks=true;
    document.addEventListener('click',e=>{
      if(e.target.closest('#adminSheet,#collectionSheet,[data-tab],[data-collection-tab],[data-sc2edit]')){
        [0,50,150,350,700,1200].forEach(ms=>setTimeout(queueRepair,ms));
      }
    },{passive:true});
  }

  [80,220,500,1000,1800,3200,5200].forEach(ms=>setTimeout(queueRepair,ms));
}

window.SnazzleCardFixedV205={version:VERSION,repair,infoFor};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
console.info(`Snazzle Cards ${VERSION} geladen`);
