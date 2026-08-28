// Snazzle Cards v136 — zet de 24 herstelkaarten exact in het bestaande Mijn Snazzle Cards-vak.
import { assets } from './snazzle-card-assets-v133.js';
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,collection,doc,getDoc,setDoc,onSnapshot } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='136-native-place';
const WILD=['Trail Blazer','Jungle Jax','Mud Runner','Storm Scout','Boulder Buddy','Night Tracker','River Rush','Forest Flash','Thunder Trek','Shadow Scout','Wild Guardian','Alpha Snazzle'];
const SPARK=['Star Sprinkle','Moon Glow','Dream Dancer','Crystal Pop','Bubble Bloom','Glitter Glide','Comet Dash','Rainbow Rush','Starlight Hug','Aurora Whirl','Sparkle Sprout','Nova Shine'];
let cards=[],user=null,hunts=[],syncStarted=false,unsubHunts=null;
const $=(s,r=document)=>r.querySelector(s);

function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
const imageCache=new Map();
async function imageFor(key){if(!imageCache.has(key))imageCache.set(key,loadImage(assets[key]));return imageCache.get(key);}
async function crop(key,col,row,cols,rows){
  const im=await imageFor(key),sx=Math.round(im.naturalWidth*col/cols),sy=Math.round(im.naturalHeight*row/rows),sw=Math.round(im.naturalWidth/cols),sh=Math.round(im.naturalHeight/rows);
  const c=document.createElement('canvas');c.width=240;c.height=300;
  const x=c.getContext('2d');x.fillStyle='#173d31';x.fillRect(0,0,c.width,c.height);x.drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);
  return c.toDataURL('image/jpeg',.76);
}
function makeCard(i,world,imageData){
  const n=i+1,names=world==='wild'?WILD:SPARK,prefix=world==='wild'?'W':'S',now=new Date().toISOString();
  return {id:`seed-${world}-${String(n).padStart(2,'0')}`,number:`S01-${prefix}${String(n).padStart(2,'0')}`,name:names[i],series:world==='wild'?'WILD Series 01':'SPARK Series 01',description:world==='wild'?'Avontuur & actie':'Glans & fantasie',rarity:i<8?'core':'rare',unlockType:'milestone',huntId:'',threshold:n,world,active:true,secretName:false,imageData,seedVersion:VERSION,createdAt:now,updatedAt:now};
}
async function build(){
  const out=[];
  for(let i=0;i<12;i++)out.push(makeCard(i,'wild',await crop('wild',i%4,Math.floor(i/4),4,3)));
  for(let i=0;i<12;i++)out.push(makeCard(i,'spark',await crop('spark',i%6,Math.floor(i/6),6,2)));
  return out;
}
function myWins(){return user?hunts.filter(h=>h.found===true&&h.foundByUserId===user.uid).length:0;}
function unlocked(c){return myWins()>=(Number(c.threshold)||1);}
function cardHtml(c){
  const open=unlocked(c),locked=!open;
  return `<article class="sc2-card ${c.rarity} ${locked?'locked':'unlocked'}" data-sn136-card="${c.id}"><div class="sc2-inner"><div class="sc2-media"><img src="${c.imageData}" alt="${c.name}"><span class="sc2-lock">?</span><span class="sc2-rarity">${c.rarity==='rare'?'RARE':'CORE'}</span><span class="sc2-num">${c.number}</span></div><div class="sc2-info"><strong>${c.name}</strong><small>${c.series}</small><span class="sc2-source">🏆 ${c.threshold} vondst${c.threshold===1?'':'en'}</span></div></div></article>`;
}
function selectedFilter(){return $('#sc2Filters .sc2-filter.on')?.dataset?.sc2f||'all';}
function nativeRealCards(grid){return [...grid.querySelectorAll('.sc2-card')].filter(el=>!el.hasAttribute('data-sn136-card'));}
function renderCollection(){
  if(!cards.length)return;
  const grid=$('#sc2Grid');if(!grid)return;
  if(nativeRealCards(grid).length){grid.removeAttribute('data-sn136-sig');return;}
  const filter=selectedFilter(),shown=cards.filter(c=>filter==='all'||c.rarity===filter),wins=myWins(),opened=cards.filter(unlocked).length;
  const sig=`${filter}|${wins}|${shown.length}`;
  if(grid.dataset.sn136Sig!==sig||!grid.querySelector('[data-sn136-card]')){
    grid.innerHTML=shown.length?shown.map(cardHtml).join(''):'<div class="sc2-empty">✨ Nog geen Snazzle Cards in deze categorie.</div>';
    grid.dataset.sn136Sig=sig;
  }
  const count=$('#sc2SummaryCount'),text=$('#sc2SummaryText');
  if(count)count.textContent=`${opened}/${cards.length}`;
  if(text)text.textContent=`${Math.round(opened/cards.length*100)||0}% van je collectie ontdekt`;
  const old=$('#snazzleForcedCardsV134');if(old)old.remove();
}
function renderAdmin(){
  if(!cards.length)return;
  const list=$('#sc2List');if(!list)return;
  const hasReal=[...list.querySelectorAll('.sc2-row')].some(el=>!el.hasAttribute('data-sn136-admin'));
  if(hasReal)return;
  const sig=`${cards.length}`;
  if(list.dataset.sn136Sig===sig&&list.querySelector('[data-sn136-admin]'))return;
  list.innerHTML=cards.map(c=>`<div class="sc2-row" data-sn136-admin="${c.id}"><div class="sc2-thumb"><img src="${c.imageData}" alt=""></div><div><strong>${c.number} · ${c.name}</strong><small>${c.rarity==='rare'?'RARE':'CORE'} · ${c.series} · herstelkaart</small></div></div>`).join('');
  list.dataset.sn136Sig=sig;
}
function render(){renderCollection();renderAdmin();}
function watchUi(){
  render();
  const o=new MutationObserver(()=>queueMicrotask(render));o.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-sc2f],[data-collection-tab="cards"]'))setTimeout(render,0);},true);
  setInterval(render,1800);
}
function subscribeHunts(db){
  if(unsubHunts)unsubHunts();
  unsubHunts=onSnapshot(collection(db,'hunts'),s=>{hunts=s.docs.map(d=>({id:d.id,...d.data()}));render();},()=>{});
}
async function syncCentral(db){
  if(syncStarted||!cards.length||!user||user.isAnonymous)return;syncStarted=true;
  try{
    const a=await getDoc(doc(db,'adminUsers',user.uid)),p=a.exists()?a.data():null;
    if(p?.active!==true||p?.role!=='superadmin'){syncStarted=false;return;}
    for(const c of cards)await setDoc(doc(db,'snazzleCards',c.id),c,{merge:true});
    console.info('Snazzle Cards v136: 24 kaarten centraal teruggezet.');
  }catch(err){syncStarted=false;console.warn('Snazzle Cards v136 centrale sync',err);}
}

try{
  cards=await build();
  window.SnazzleCardForceRestoreV136={version:VERSION,count:cards.length,cards};
  watchUi();
  const app=getApps().length?getApp():null;
  if(app){const auth=getAuth(app),db=getFirestore(app);onAuthStateChanged(auth,u=>{user=u||null;subscribeHunts(db);syncCentral(db);render();});}
  console.info(`Snazzle Cards v136: ${cards.length} kaarten op de vaste collectieplek geladen.`);
}catch(err){console.error('Snazzle Cards v136 kon herstelafbeeldingen niet laden',err);}
