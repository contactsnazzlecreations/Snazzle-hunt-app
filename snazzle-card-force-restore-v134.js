// Snazzle Cards v134 — harde herstel-laag: kaarten blijven zichtbaar, ook als localStorage vol is.
import { assets } from './snazzle-card-assets-v133.js';
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,doc,getDoc,setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='134-force-restore';
const WILD=['Trail Blazer','Jungle Jax','Mud Runner','Storm Scout','Boulder Buddy','Night Tracker','River Rush','Forest Flash','Thunder Trek','Shadow Scout','Wild Guardian','Alpha Snazzle'];
const SPARK=['Star Sprinkle','Moon Glow','Dream Dancer','Crystal Pop','Bubble Bloom','Glitter Glide','Comet Dash','Rainbow Rush','Starlight Hug','Aurora Whirl','Sparkle Sprout','Nova Shine'];
const $=(s,r=document)=>r.querySelector(s);
let cards=[],syncStarted=false;

function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
const imageCache=new Map();
async function imageFor(key){if(!imageCache.has(key))imageCache.set(key,loadImage(assets[key]));return imageCache.get(key);}
async function crop(key,col,row,cols,rows){
  const im=await imageFor(key);
  const sx=Math.round(im.naturalWidth*col/cols),sy=Math.round(im.naturalHeight*row/rows),sw=Math.round(im.naturalWidth/cols),sh=Math.round(im.naturalHeight/rows);
  const c=document.createElement('canvas');c.width=240;c.height=300;
  const x=c.getContext('2d');x.fillStyle='#173d31';x.fillRect(0,0,c.width,c.height);x.drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);
  return c.toDataURL('image/jpeg',.76);
}
function makeCard(i,world,imageData){
  const n=i+1,names=world==='wild'?WILD:SPARK,prefix=world==='wild'?'W':'S';
  return {
    id:`seed-${world}-${String(n).padStart(2,'0')}`,
    number:`S01-${prefix}${String(n).padStart(2,'0')}`,
    name:names[i],
    series:world==='wild'?'WILD Series 01':'SPARK Series 01',
    description:world==='wild'?'Avontuur & actie':'Glans & fantasie',
    rarity:i<8?'core':'rare',unlockType:'milestone',huntId:'',threshold:n,world,
    active:true,secretName:false,imageData,seedVersion:VERSION,
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
  };
}
async function build(){
  const out=[];
  for(let i=0;i<12;i++)out.push(makeCard(i,'wild',await crop('wild',i%4,Math.floor(i/4),4,3)));
  for(let i=0;i<12;i++)out.push(makeCard(i,'spark',await crop('spark',i%6,Math.floor(i/6),6,2)));
  return out;
}
function installStyles(){
  if($('#snCardForce134Styles'))return;
  const s=document.createElement('style');s.id='snCardForce134Styles';s.textContent=`
  .sn134-wrap{margin:10px 0 14px}.sn134-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 2px 9px;color:#432e1c}.sn134-head strong{font-size:16px}.sn134-head span{font-size:10px;font-weight:900;background:#e4f4c5;border:1px solid #9db866;padding:5px 8px;border-radius:999px}.sn134-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sn134-card{border-radius:18px;padding:5px;background:linear-gradient(145deg,#f5dc8d,#785528);box-shadow:0 5px 0 #513824,0 10px 20px rgba(0,0,0,.14)}.sn134-card.rare{background:linear-gradient(145deg,#7dd9e5,#2b6688)}.sn134-inner{overflow:hidden;border-radius:14px;background:#fff7e7;border:2px solid rgba(255,255,255,.75)}.sn134-img{aspect-ratio:4/5;position:relative;overflow:hidden;background:#173d31}.sn134-img img{width:100%;height:100%;object-fit:cover;display:block}.sn134-badge{position:absolute;left:7px;top:7px;padding:4px 6px;border-radius:999px;background:rgba(15,24,20,.8);color:#fff;font-size:8px;font-weight:1000}.sn134-no{position:absolute;right:7px;top:7px;padding:4px 6px;border-radius:999px;background:rgba(255,247,220,.94);color:#49341f;font-size:8px;font-weight:1000}.sn134-info{padding:8px;color:#39291c}.sn134-info strong{display:block;font-size:11px}.sn134-info small{display:block;margin-top:3px;font-size:8px;font-weight:800;color:#765a3c}.sn134-note{margin:7px 0 0;font-size:9px;font-weight:800;color:#5c472e}.sn134-admin{margin:10px 0;padding:10px;border:2px solid #8aae58;border-radius:14px;background:#eef7ce;color:#3f5526;font-size:11px;font-weight:850}.sn134-admin-thumbs{display:flex;gap:5px;overflow:auto;margin-top:8px}.sn134-admin-thumbs img{width:46px;height:58px;object-fit:cover;border-radius:8px;border:2px solid #a48150;flex:0 0 auto}
  `;document.head.appendChild(s);
}
function cardHtml(c){return `<article class="sn134-card ${c.rarity==='rare'?'rare':''}"><div class="sn134-inner"><div class="sn134-img"><img src="${c.imageData}" alt="${c.name}"><span class="sn134-badge">${c.rarity==='rare'?'RARE':'CORE'}</span><span class="sn134-no">${c.number}</span></div><div class="sn134-info"><strong>${c.name}</strong><small>${c.series}</small></div></div></article>`;}
function nativeHasCards(){return !!document.querySelector('#sc2Grid .sc2-card');}
function renderPublic(){
  if(!cards.length||nativeHasCards()){document.getElementById('snazzleForcedCardsV134')?.remove();return;}
  const host=$('#collectionCards');if(!host)return;
  let box=$('#snazzleForcedCardsV134');if(!box){box=document.createElement('div');box.id='snazzleForcedCardsV134';box.className='sn134-wrap';host.prepend(box);}
  box.innerHTML=`<div class="sn134-head"><strong>Mijn Snazzle Cards</strong><span>24 kaarten hersteld</span></div><div class="sn134-grid">${cards.map(cardHtml).join('')}</div><div class="sn134-note">Deze kaarten zijn veilig teruggezet. De normale Hunt-ontgrendeling blijft gekoppeld zodra de centrale synchronisatie klaar is.</div>`;
  const status=$('#collectionHomeStatus');if(status&&!/24/.test(status.textContent||''))status.textContent='24 Snazzle Cards teruggezet';
}
function renderAdmin(){
  if(!cards.length)return;
  const section=$('#cardsAdmin');if(!section)return;
  let box=$('#snV134AdminRecovery');if(!box){box=document.createElement('div');box.id='snV134AdminRecovery';box.className='sn134-admin';section.prepend(box);}
  box.innerHTML=`✅ <strong>24 herstelkaarten geladen</strong><br>12 WILD + 12 SPARK zijn terug in de app.<div class="sn134-admin-thumbs">${cards.slice(0,24).map(c=>`<img src="${c.imageData}" alt="${c.name}">`).join('')}</div>`;
}
function render(){installStyles();renderPublic();renderAdmin();}
function watchUi(){render();const o=new MutationObserver(()=>render());o.observe(document.body,{childList:true,subtree:true});setTimeout(()=>o.disconnect(),30000);setInterval(render,1500);}
async function syncCentral(){
  if(syncStarted||!cards.length)return;syncStarted=true;
  const app=getApps().length?getApp():null;if(!app)return;
  const auth=getAuth(app),db=getFirestore(app);
  onAuthStateChanged(auth,async user=>{
    if(!user||user.isAnonymous)return;
    try{
      const a=await getDoc(doc(db,'adminUsers',user.uid)),p=a.exists()?a.data():null;
      if(p?.active!==true||p?.role!=='superadmin')return;
      for(const c of cards)await setDoc(doc(db,'snazzleCards',c.id),c,{merge:true});
      console.info('Snazzle Cards v134: 24 kaarten centraal teruggezet.');
      setTimeout(render,500);
    }catch(err){console.warn('Snazzle Cards v134 centrale sync',err);}
  });
}

try{cards=await build();window.SnazzleCardForceRestoreV134={version:VERSION,count:cards.length};watchUi();syncCentral();console.info(`Snazzle Cards v134: ${cards.length} kaarten geforceerd beschikbaar.`);}catch(err){console.error('Snazzle Cards v134 kon herstelafbeeldingen niet laden',err);}
