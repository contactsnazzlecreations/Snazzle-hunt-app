// Snazzle Cards v200 — maakt 12 echte SPARK-miniaturen uit het originele kaartvel.
// Geen background-position meer: elke kaart krijgt zijn eigen uitgesneden <img>.
const VERSION='200-spark-crop-thumbs';
let thumbs=null,building=null;

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const im=new Image();
    im.onload=()=>resolve(im);
    im.onerror=()=>reject(new Error('SPARK-kaartvel kon niet worden geladen'));
    im.src=src;
  });
}
async function getSheetData(){
  const res=await fetch(`./snazzle-card-force-restore-v134.js?thumbsource=${Date.now()}`,{cache:'no-store'});
  if(!res.ok) throw new Error(`kaartbron ${res.status}`);
  const text=await res.text();
  const m=text.match(/const\s+SPARK\s*=\s*['"](data:image\/jpeg;base64,[^'"]+)['"]/);
  if(!m) throw new Error('SPARK-kaartvel niet gevonden');
  return m[1];
}
async function buildThumbs(){
  if(thumbs) return thumbs;
  if(building) return building;
  building=(async()=>{
    const sheet=await loadImage(await getSheetData());
    const out={};
    for(let i=0;i<12;i++){
      const col=i%6,row=Math.floor(i/6);
      const sx=Math.round(sheet.naturalWidth*col/6);
      const sy=Math.round(sheet.naturalHeight*row/2);
      const sw=Math.round(sheet.naturalWidth/6);
      const sh=Math.round(sheet.naturalHeight/2);
      const c=document.createElement('canvas');
      c.width=84;c.height=168;
      const x=c.getContext('2d');
      x.fillStyle='#171717';x.fillRect(0,0,c.width,c.height);
      x.drawImage(sheet,sx,sy,sw,sh,0,0,c.width,c.height);
      out[`S01-S${String(i+1).padStart(2,'0')}`]=c.toDataURL('image/jpeg',.82);
    }
    thumbs=out;
    window.__snazzleSparkThumbsV200=out;
    return out;
  })().finally(()=>{building=null;});
  return building;
}
function adminNumber(row){
  return String(row.querySelector('strong')?.textContent||'').toUpperCase().match(/S01-S\d{2}/)?.[0]||'';
}
function forceImage(box,num,src){
  if(!box||!src)return;
  box.style.background='#171717';
  box.style.backgroundImage='none';
  let img=box.querySelector('img');
  if(!img){img=document.createElement('img');box.replaceChildren(img);}
  img.src=src;img.alt=num;img.dataset.snThumbV200=num;
  img.style.setProperty('width','100%','important');
  img.style.setProperty('height','100%','important');
  img.style.setProperty('display','block','important');
  img.style.setProperty('object-fit','contain','important');
  img.style.setProperty('opacity','1','important');
  img.style.setProperty('background','#171717','important');
}
async function repair(){
  let map;try{map=await buildThumbs();}catch(err){console.warn('Snazzle Cards v200',err);return;}
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const num=adminNumber(row);if(map[num])forceImage(row.querySelector('.sc2-thumb'),num,map[num]);
  });
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const num=String(card.querySelector('.sc2-num')?.textContent||'').toUpperCase().trim();
    if(map[num])forceImage(card.querySelector('.sc2-media'),num,map[num]);
  });
}
let queued=false;
function queueRepair(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;repair();});
}
function start(){
  repair();
  const obs=new MutationObserver(queueRepair);
  obs.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('#adminSheet,[data-tab="cardsAdmin"],#collectionSheet'))setTimeout(repair,25);
  },{passive:true});
  window.addEventListener('snazzle-card-catalog-restored',()=>setTimeout(repair,25));
  [250,700,1500,3000,6000].forEach(ms=>setTimeout(repair,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.SnazzleCardThumbCropFixV200={version:VERSION,repair};
