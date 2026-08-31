// Snazzle Cards v208 — directe <img>-weergave uit de originele kaartvellen.
// Geen canvas en geen CSS-background meer. Elke kaart gebruikt het originele kaartvel
// als echte IMG binnen een exact uitgesneden viewport.
import sparkSheet from './snazzle-card-sheet-spark-v204.js';
import wildSheet from './snazzle-card-sheet-wild-v204.js';

const VERSION='208.0-direct-img-sheet-renderer';
const CARD_RE=/S01-([SW])(\d{2})/i;
let repairQueued=false;

function infoFor(number){
  const m=String(number||'').toUpperCase().match(CARD_RE);
  if(!m)return null;
  const index=Number(m[2])-1;
  if(index<0||index>11)return null;
  if(m[1]==='S')return {number:m[0],world:'spark',src:sparkSheet,cols:6,rows:2,col:index%6,row:Math.floor(index/6)};
  return {number:m[0],world:'wild',src:wildSheet,cols:4,rows:3,col:index%4,row:Math.floor(index/4)};
}

function installStyle(){
  let style=document.getElementById('snCardFixedV205Style');
  if(!style){style=document.createElement('style');style.id='snCardFixedV205Style';document.head.appendChild(style);}
  style.textContent=`
    #sc2List .sc2-row{grid-template-columns:72px 1fr!important;column-gap:12px!important}
    #sc2List .sc2-thumb{width:72px!important;height:120px!important;position:relative!important;overflow:hidden!important;border-radius:11px!important}

    .sn-card-viewport-v208{position:absolute!important;top:0!important;bottom:0!important;left:50%!important;transform:translateX(-50%)!important;overflow:hidden!important;z-index:1000!important;display:block!important;pointer-events:none!important;background:transparent!important}
    #sc2List .sn-card-viewport-v208[data-world="spark"]{width:83.333333%!important}
    #sc2List .sn-card-viewport-v208[data-world="wild"]{width:100%!important}
    #sc2Grid .sn-card-viewport-v208[data-world="spark"],#sc2VaultGrid .sn-card-viewport-v208[data-world="spark"]{width:62.5%!important}
    #sc2Grid .sn-card-viewport-v208[data-world="wild"],#sc2VaultGrid .sn-card-viewport-v208[data-world="wild"]{width:75%!important}

    .sn-card-sheet-v208{position:absolute!important;display:block!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;object-fit:fill!important;opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important;width:var(--sn-sheet-w)!important;height:var(--sn-sheet-h)!important;left:var(--sn-sheet-x)!important;top:var(--sn-sheet-y)!important}

    #sc2Grid .sc2-media,#sc2VaultGrid .sc2-media{position:relative!important;overflow:hidden!important}
    #sc2Grid .sc2-lock,#sc2Grid .sc2-rarity,#sc2Grid .sc2-num,#sc2VaultGrid .sc2-lock,#sc2VaultGrid .sc2-rarity,#sc2VaultGrid .sc2-num{z-index:1100!important}
  `;
}

function numberFromRow(row){
  return String(row?.querySelector('strong')?.textContent||row?.textContent||'').toUpperCase().match(CARD_RE)?.[0]||'';
}
function numberFromCard(card){
  const direct=String(card?.querySelector('.sc2-num')?.textContent||'').toUpperCase().match(CARD_RE)?.[0];
  return direct||String(card?.textContent||'').toUpperCase().match(CARD_RE)?.[0]||'';
}

function putViewport(box,number){
  const info=infoFor(number);
  if(!box||!info)return false;

  // Verwijder alle eerdere reparatielagen zodat niets de echte IMG kan afdekken.
  box.querySelectorAll(':scope > .sn-fixed-card-v205,:scope > .sn-card-viewport-v208').forEach(el=>el.remove());

  const viewport=document.createElement('span');
  viewport.className='sn-card-viewport-v208';
  viewport.dataset.cardNumber=info.number;
  viewport.dataset.world=info.world;
  viewport.style.setProperty('--sn-sheet-w',`${info.cols*100}%`);
  viewport.style.setProperty('--sn-sheet-h',`${info.rows*100}%`);
  viewport.style.setProperty('--sn-sheet-x',`${-info.col*100}%`);
  viewport.style.setProperty('--sn-sheet-y',`${-info.row*100}%`);

  const img=document.createElement('img');
  img.className='sn-card-sheet-v208';
  img.alt='';
  img.decoding='async';
  img.src=info.src;
  img.addEventListener('load',()=>{viewport.dataset.ready='1';},{once:true});
  img.addEventListener('error',()=>{viewport.dataset.error='1';console.error('Snazzle kaartvel kon niet laden',info.number,info.world);},{once:true});
  viewport.appendChild(img);
  box.appendChild(viewport);
  return true;
}

function repair(){
  installStyle();
  let count=0;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const number=numberFromRow(row);
    const box=row.querySelector('.sc2-thumb');
    const existing=box?.querySelector(':scope > .sn-card-viewport-v208');
    if(existing?.dataset.cardNumber===number)return;
    if(number&&putViewport(box,number))count++;
  });
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const number=numberFromCard(card);
    const box=card.querySelector('.sc2-media');
    const existing=box?.querySelector(':scope > .sn-card-viewport-v208');
    if(existing?.dataset.cardNumber===number)return;
    if(number&&putViewport(box,number))count++;
  });
  return count;
}

function queueRepair(){
  if(repairQueued)return;
  repairQueued=true;
  requestAnimationFrame(()=>{repairQueued=false;try{repair();}catch(err){console.error('Snazzle Cards v208 repair',err);}});
}

function start(){
  installStyle();
  queueRepair();
  if(!window.__snazzleCardV208Observer){
    const observer=new MutationObserver(mutations=>{
      // Alleen reageren als rijen/kaarten worden toegevoegd of opnieuw opgebouwd.
      if(mutations.some(m=>m.type==='childList'&&[...m.addedNodes].some(n=>n.nodeType===1)))queueRepair();
    });
    observer.observe(document.body,{subtree:true,childList:true});
    window.__snazzleCardV208Observer=observer;
  }
  if(!window.__snazzleCardV208Clicks){
    window.__snazzleCardV208Clicks=true;
    document.addEventListener('click',e=>{
      if(e.target.closest('#adminSheet,#collectionSheet,[data-tab],[data-collection-tab],[data-sc2edit]'))[0,50,150,350,700,1200].forEach(ms=>setTimeout(queueRepair,ms));
    },{passive:true});
  }
  [80,220,500,1000,1800,3200,5200].forEach(ms=>setTimeout(queueRepair,ms));
}

window.SnazzleCardFixedV205={version:VERSION,repair,infoFor};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
console.info(`Snazzle Cards ${VERSION} geladen`);
