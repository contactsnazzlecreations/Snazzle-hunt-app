// Snazzle Cards v140.2 — veilige vaste basiscollectie + betrouwbare beheer-thumbnails.
// Zet 12 WILD + 12 SPARK kaarten als gewone catalogusrecords klaar.
// Collectie gebruikt de sprite; Beheer krijgt per kaart een echte uitgesneden thumbnail.
import { assets } from './snazzle-card-assets-v133.js';

const KEY='snazzleCardCatalogV2';
const VERSION='140.2-admin-crops';
const PIXEL='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const wild=['Trail Blazer','Jungle Jax','Mud Runner','Storm Scout','Boulder Buddy','Night Tracker','River Rush','Forest Flash','Thunder Trek','Shadow Scout','Wild Guardian','Alpha Snazzle'];
const spark=['Star Sprinkle','Moon Glow','Dream Dancer','Crystal Pop','Bubble Bloom','Glitter Glide','Comet Dash','Rainbow Rush','Starlight Hug','Aurora Whirl','Sparkle Sprout','Nova Shine'];

function read(){
  try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[];}catch{return [];}
}
function make(world,i,name){
  const n=String(i+1).padStart(2,'0');
  return {
    id:`seed-${world}-${n}`,
    number:`S01-${world==='wild'?'W':'S'}${n}`,
    name,
    series:world==='wild'?'WILD Series 01':'SPARK Series 01',
    description:world==='wild'?'Avontuur & actie':'Glans & fantasie',
    rarity:i<8?'core':'rare',
    unlockType:'milestone',
    huntId:'',
    threshold:i+1,
    world,
    active:true,
    secretName:false,
    imageData:PIXEL,
    seedVersion:VERSION
  };
}
const seeds=[...wild.map((n,i)=>make('wild',i,n)),...spark.map((n,i)=>make('spark',i,n))];

try{
  const map=new Map(read().filter(Boolean).map(c=>[c.id,c]));
  for(const s of seeds){
    const old=map.get(s.id);
    map.set(s.id,old?{...s,...old,imageData:old.imageData||PIXEL,active:old.active!==false}:s);
  }
  localStorage.setItem(KEY,JSON.stringify([...map.values()]));
  localStorage.setItem('snazzleCardSeedV140',JSON.stringify({at:new Date().toISOString(),count:seeds.length,version:VERSION}));
}catch(err){console.warn('Snazzle Cards v140 kon catalogus niet lokaal vastleggen',err);}

function spriteInfo(num){
  const m=String(num||'').match(/^S01-([WS])(\d{2})$/);if(!m)return null;
  const i=Number(m[2])-1;if(i<0||i>11)return null;
  if(m[1]==='W')return {key:'wild',src:assets.wild,col:i%4,row:Math.floor(i/4),cols:4,rows:3};
  return {key:'spark',src:assets.spark,col:i%6,row:Math.floor(i/6),cols:6,rows:2};
}
function applySprite(el,num){
  const info=spriteInfo(num);if(!info||!el)return;
  el.classList.add('sn-seed-sprite');
  el.style.backgroundImage=`url(${JSON.stringify(info.src)})`;
  el.style.backgroundSize=`${info.cols*100}% ${info.rows*100}%`;
  const x=info.cols===1?0:(info.col/(info.cols-1))*100;
  const y=info.rows===1?0:(info.row/(info.rows-1))*100;
  el.style.backgroundPosition=`${x}% ${y}%`;
  el.style.backgroundRepeat='no-repeat';
  const img=el.querySelector('img');if(img)img.style.opacity='0';
}

const imageCache=new Map(),cropCache=new Map();
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
async function imageFor(info){
  if(!imageCache.has(info.key))imageCache.set(info.key,loadImage(info.src));
  return imageCache.get(info.key);
}
async function cropFor(num){
  if(cropCache.has(num))return cropCache.get(num);
  const task=(async()=>{
    const info=spriteInfo(num);if(!info)throw new Error('Onbekende kaart');
    const im=await imageFor(info);
    const sx=Math.round(im.naturalWidth*info.col/info.cols),sy=Math.round(im.naturalHeight*info.row/info.rows);
    const sw=Math.max(1,Math.round(im.naturalWidth/info.cols)),sh=Math.max(1,Math.round(im.naturalHeight/info.rows));
    const c=document.createElement('canvas');c.width=180;c.height=225;
    const ctx=c.getContext('2d');ctx.fillStyle='#173d2d';ctx.fillRect(0,0,c.width,c.height);
    ctx.drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);
    return c.toDataURL('image/jpeg',.82);
  })();
  cropCache.set(num,task);return task;
}
function adminThumb(row){
  const text=row.querySelector('strong')?.textContent?.trim()||'';
  const num=text.split('·')[0]?.trim();
  const thumb=row.querySelector('.sc2-thumb');
  if(!thumb||!spriteInfo(num)||thumb.dataset.seedCropNum===num)return;
  thumb.dataset.seedCropNum=num;
  cropFor(num).then(src=>{
    thumb.classList.remove('sn-seed-sprite');
    thumb.classList.add('sn-seed-crop');
    thumb.style.backgroundImage='none';
    let img=thumb.querySelector('img');
    if(!img){img=document.createElement('img');thumb.textContent='';thumb.appendChild(img);}
    img.src=src;img.alt=num;img.style.opacity='1';img.style.display='block';
  }).catch(err=>{
    console.warn('Kaartthumbnail kon niet worden uitgesneden',num,err);
    thumb.dataset.seedCropNum='';
    applySprite(thumb,num);
  });
}
function decorate(){
  const grid=document.getElementById('sc2Grid');
  if(grid){
    grid.querySelectorAll('.sc2-card').forEach(card=>{
      const num=card.querySelector('.sc2-num')?.textContent?.trim();
      applySprite(card.querySelector('.sc2-media'),num);
    });
  }
  const list=document.getElementById('sc2List');
  if(list)list.querySelectorAll('.sc2-row').forEach(adminThumb);
}
function installStyle(){
  if(document.getElementById('snCardSeedV140Style'))return;
  const s=document.createElement('style');s.id='snCardSeedV140Style';
  s.textContent=`.sc2-media.sn-seed-sprite{background-color:#173d2d!important}.sc2-card.locked .sc2-media.sn-seed-sprite:before{content:'';position:absolute;inset:0;background:rgba(4,13,10,.76);z-index:1}.sc2-media.sn-seed-sprite .sc2-lock,.sc2-media.sn-seed-sprite .sc2-rarity,.sc2-media.sn-seed-sprite .sc2-num{z-index:2}.sc2-thumb.sn-seed-crop{background:#173d2d!important}.sc2-thumb.sn-seed-crop img{width:100%!important;height:100%!important;object-fit:cover!important;opacity:1!important;display:block!important}`;
  document.head.appendChild(s);
}
installStyle();

const observer=new MutationObserver(()=>decorate());
function attach(){
  [document.getElementById('sc2Grid'),document.getElementById('sc2List')].filter(Boolean).forEach(el=>{
    if(!el.dataset.seed140Observed){el.dataset.seed140Observed='1';observer.observe(el,{childList:true,subtree:true});}
  });
  decorate();
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-collection-tab],#openCollection,.collection-tabs,[data-tab="cards"],[data-admin-tab="cards"],#adminSheet'))setTimeout(()=>{attach();decorate();},60);
},{passive:true});
setTimeout(attach,500);
setTimeout(attach,1300);
setTimeout(attach,2600);
window.addEventListener('snazzle-card-catalog-restored',()=>setTimeout(()=>{attach();decorate();},30));
window.SnazzleCardSeedV140={version:VERSION,count:seeds.length,decorate,cropFor};
