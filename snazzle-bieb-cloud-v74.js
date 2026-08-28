// Snazzle v74 — betrouwbare cloudopslag voor De Bieb zonder extra Firebase Storage-rechten.
// Boeken + sterk verkleinde privé-kaftminiaturen worden in het eigen users/{uid}-document bewaard.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, onSnapshot, runTransaction } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='74.0.0';
const MAX_BOOKS=60;
const MAX_BIEB_DOC_CHARS=820000;
const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);

let currentUser=null;
let books=[];
let stopUserDoc=null;
let saving=false;
let rendering=false;
let lastShelfSignature='';
let lastPreviewKey='';
let lastPreviewData='';

const REWARDS=[
  {at:2,icon:'🌱',name:'Verhalenplant'},
  {at:4,icon:'💡',name:'Leeslamp'},
  {at:6,icon:'🪑',name:'Voorleesstoel'},
  {at:8,icon:'🗝️',name:'Geheime Bieb-lade'},
  {at:10,icon:'🦆',name:'Gouden Lees-Snazzle'},
  {at:12,icon:'🧸',name:'Knuffelhoek'},
  {at:14,icon:'🌟',name:'Sterrenplafond'},
  {at:16,icon:'🗺️',name:'Verhalenkaart'},
  {at:18,icon:'🔭',name:'Droomkijker'},
  {at:20,icon:'👑',name:'Biebmeester-kroon'}
];

function esc(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
}
function today(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatDate(value){
  if(!value) return '';
  try{
    const [y,m,d]=String(value).slice(0,10).split('-').map(Number);
    if(!y||!m||!d) return String(value);
    return new Intl.DateTimeFormat('nl-NL',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(y,m-1,d));
  }catch{return String(value);}
}
function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__snBiebToast74);
  window.__snBiebToast74=setTimeout(()=>el.classList.remove('show'),3300);
}
function bookId(){
  try{return crypto.randomUUID().replace(/[^a-zA-Z0-9_-]/g,'');}
  catch{return `${Date.now()}_${Math.random().toString(36).slice(2,10)}`;}
}
function rewardFor(total){
  return REWARDS.find(r=>r.at===total)||{at:total,icon:'🪶',name:`Nieuwe Leesveer ${Math.floor(total/2)}`};
}
function nextReward(total){
  const exact=REWARDS.find(r=>r.at>total);
  if(exact) return exact;
  const at=total%2===0?total+2:total+1;
  return {at,icon:'🪶',name:`Leesveer ${Math.floor(at/2)}`};
}

function installStyles(){
  if(document.getElementById('snBiebCloud74Styles')) return;
  const style=document.createElement('style');
  style.id='snBiebCloud74Styles';
  style.textContent=`
    #snBiebShelf73 .sn-bieb-cover{position:relative!important}
    #snBiebShelf73 .sn-bieb-cover img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:contain!important;opacity:1!important;filter:none!important;transition:none!important}
    #snBiebShelf73 .sn-bieb-cover-placeholder{position:relative;z-index:0}
    #snBiebCoverImg73{opacity:1!important;filter:none!important;transition:none!important}
  `;
  document.head.appendChild(style);
}

function fileToImage(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Deze afbeelding kon niet worden gelezen'));};
    img.src=url;
  });
}
function canvasToBlob(canvas,type,quality){
  return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
}
function blobToDataUrl(blob){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('Afbeelding kon niet worden voorbereid'));
    reader.readAsDataURL(blob);
  });
}
async function compressCover(file){
  if(!file||!String(file.type||'').startsWith('image/')) throw new Error('Kies een foto van een boekkaft');
  if(file.size>15*1024*1024) throw new Error('Deze foto is te groot; kies een kleinere foto');
  const key=`${file.name}|${file.size}|${file.lastModified}`;
  if(key===lastPreviewKey&&lastPreviewData) return lastPreviewData;
  const source=await fileToImage(file);
  const w=source.naturalWidth||source.width,h=source.naturalHeight||source.height;
  let maxSide=320,quality=.64,dataUrl='';
  for(let attempt=0;attempt<9;attempt++){
    const scale=Math.min(1,maxSide/Math.max(w,h));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(w*scale));
    canvas.height=Math.max(1,Math.round(h*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);
    let blob=await canvasToBlob(canvas,'image/webp',quality);
    if(!blob) blob=await canvasToBlob(canvas,'image/jpeg',quality);
    if(blob){dataUrl=await blobToDataUrl(blob);if(dataUrl.length<=11500) break;}
    maxSide=Math.max(130,Math.round(maxSide*.82));
    quality=Math.max(.34,quality-.045);
  }
  if(!dataUrl||dataUrl.length>11500) throw new Error('De kaftfoto blijft te groot; maak de foto iets dichterbij');
  lastPreviewKey=key;lastPreviewData=dataUrl;
  return dataUrl;
}

function normalizeBooks(raw){
  if(!Array.isArray(raw)) return [];
  return raw.filter(item=>item&&typeof item==='object'&&String(item.id||'')&&String(item.title||''))
    .map(item=>({
      id:String(item.id),
      title:String(item.title||'').slice(0,80),
      question:String(item.question||'').slice(0,120),
      reaction:String(item.reaction||'').slice(0,180),
      rating:Math.max(1,Math.min(5,Number(item.rating)||1)),
      readAt:String(item.readAt||'').slice(0,10),
      coverData:String(item.coverData||'').slice(0,14000),
      createdAt:String(item.createdAt||''),
      version:Number(item.version)||1
    }))
    .sort((a,b)=>String(b.readAt||b.createdAt||'').localeCompare(String(a.readAt||a.createdAt||'')));
}
function validCover(book){
  const src=String(book?.coverData||'');
  return src.startsWith('data:image/')&&src.length<=14000?src:'';
}

async function deleteBook(id){
  const book=books.find(b=>b.id===id);
  if(!book||!currentUser) return;
  if(!window.confirm(`Wil je “${book.title}” echt uit je Bieb verwijderen?`)) return;
  try{
    const userRef=doc(db,'users',currentUser.uid);
    await runTransaction(db,async tx=>{
      const snap=await tx.get(userRef);
      const current=Array.isArray(snap.data()?.biebBooks)?snap.data().biebBooks:[];
      const next=current.filter(item=>String(item?.id||'')!==String(id));
      tx.set(userRef,{biebBooks:next,biebUpdatedAt:new Date().toISOString()},{merge:true});
    });
    toast('Boek uit je Bieb verwijderd');
  }catch(err){
    console.error('Snazzle Bieb v74 verwijderen',err);
    toast('Verwijderen lukte niet');
  }
}

function renderShelf(force=false){
  const shelf=document.getElementById('snBiebShelf73');
  if(!shelf||rendering) return;
  const signature=JSON.stringify(books.map(b=>[b.id,b.title,b.readAt,b.rating,b.reaction,b.coverData.length,b.coverData.slice(-24)]));
  if(!force&&signature===lastShelfSignature&&shelf.querySelector('[data-bieb-v74="1"]')) return;
  lastShelfSignature=signature;
  rendering=true;
  try{
    if(!books.length){
      shelf.innerHTML='<div class="sn-bieb-empty" data-bieb-v74="1">Je kast is nog leeg. Zet je eerste uitgelezen boek erin en begin je eigen Snazzle-Bieb.</div>';
      return;
    }
    shelf.innerHTML=books.map(book=>{
      const cover=validCover(book);
      return `<article class="sn-bieb-book" data-bieb-v74="1">
        <div class="sn-bieb-cover"><span class="sn-bieb-cover-placeholder">📖 ${cover?'Kaft':'Geen kaft'}</span>${cover?`<img src="${esc(cover)}" alt="Kaft van ${esc(book.title)}" loading="lazy" decoding="async">`:''}</div>
        <div class="sn-bieb-book-body"><h3>${esc(book.title)}</h3><div class="sn-bieb-book-meta">Uitgelezen ${esc(formatDate(book.readAt))}</div><div class="sn-bieb-stars" aria-label="${book.rating} van 5 sterren">${'⭐'.repeat(book.rating)}</div><div class="sn-bieb-reaction">“${esc(book.reaction)}”</div><button class="sn-bieb-delete" type="button" data-bieb-v74-delete="${esc(book.id)}">Uit mijn kast verwijderen</button></div>
      </article>`;
    }).join('');
    shelf.querySelectorAll('[data-bieb-v74-delete]').forEach(btn=>btn.addEventListener('click',()=>deleteBook(btn.dataset.biebV74Delete)));
  }finally{rendering=false;}
}
function renderStats(){
  const total=books.length,next=nextReward(total);
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=String(value);};
  set('snBiebBookCount73',total);set('snBiebFeatherCount73',Math.floor(total/2));set('snBiebNextCount73',next.at);set('snBiebShelfCount73',`${total} gelezen`);
}
function renderAll(force=false){renderStats();renderShelf(force);}

function showReward(total){
  const overlay=document.getElementById('snBiebReward73');
  if(!overlay) return;
  const reward=rewardFor(total);
  const icon=document.getElementById('snBiebRewardIcon73'),title=document.getElementById('snBiebRewardTitle73'),text=document.getElementById('snBiebRewardText73');
  if(icon)icon.textContent=reward.icon;
  if(title)title.textContent=`${reward.name} ontgrendeld!`;
  if(text)text.textContent=`Je hebt ${total} boeken in je Bieb. Dat is Leesveer ${Math.floor(total/2)} — en je leeshoek is weer een stukje rijker.`;
  overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');
}

async function handleCoverChange(event){
  if(event.target?.id!=='snBiebCoverInput73') return;
  event.stopImmediatePropagation();
  const file=event.target.files?.[0];
  lastPreviewKey='';lastPreviewData='';
  if(!file) return;
  const preview=document.getElementById('snBiebCoverPreview73');
  preview?.setAttribute('aria-busy','true');
  try{
    const data=await compressCover(file);
    const img=document.getElementById('snBiebCoverImg73'),empty=document.getElementById('snBiebCoverEmpty73');
    if(img){img.src=data;img.style.display='block';}
    if(empty)empty.style.display='none';
  }catch(err){
    event.target.value='';
    toast(err?.message||'De foto kon niet worden gebruikt');
  }finally{preview?.removeAttribute('aria-busy');}
}

async function saveBook(event){
  if(event.target?.id!=='snBiebForm73') return;
  event.preventDefault();event.stopImmediatePropagation();
  if(saving) return;
  if(!currentUser) return toast('Je Snazzle-profiel is nog niet klaar');
  const title=String(document.getElementById('snBiebTitle73')?.value||'').trim().replace(/\s+/g,' ').slice(0,80);
  const reaction=String(document.getElementById('snBiebReaction73')?.value||'').trim().replace(/\s+/g,' ').slice(0,180);
  const rating=Number(document.getElementById('snBiebRating73')?.value||0);
  const readAt=String(document.getElementById('snBiebReadAt73')?.value||today()).slice(0,10);
  const question=String(document.getElementById('snBiebQuestion')?.textContent||'Wat vond je van dit boek?').trim().slice(0,120);
  const file=document.getElementById('snBiebCoverInput73')?.files?.[0];
  if(title.length<2) return toast('Vul de titel van het boek in');
  if(books.some(b=>b.title.trim().toLocaleLowerCase('nl-NL')===title.toLocaleLowerCase('nl-NL'))) return toast('Dit boek staat al in jouw Bieb 📚');
  if(books.length>=MAX_BOOKS) return toast(`Je Bieb zit vol met ${MAX_BOOKS} boeken. Wat een leesprestatie!`);
  if(!file) return toast('Kies eerst een foto van de boekkaft');
  if(!Number.isInteger(rating)||rating<1||rating>5) return toast('Kies hoeveel sterren je het boek geeft');
  if(reaction.length<3) return toast('Vertel in een paar woorden iets over het boek');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(readAt)||readAt>today()) return toast('Kies een geldige datum die niet in de toekomst ligt');

  saving=true;
  const btn=document.getElementById('snBiebSave73');
  if(btn){btn.disabled=true;btn.textContent='Boek wordt in je kast gezet…';}
  try{
    const coverData=await compressCover(file);
    let beforeCount=books.length;
    const metadata={id:bookId(),title,question,reaction,rating,readAt,coverData,createdAt:new Date().toISOString(),version:2};
    const userRef=doc(db,'users',currentUser.uid);
    await runTransaction(db,async tx=>{
      const snap=await tx.get(userRef);
      const current=Array.isArray(snap.data()?.biebBooks)?snap.data().biebBooks.filter(x=>x&&typeof x==='object'):[];
      if(current.length>=MAX_BOOKS) throw new Error('BIEB_MAX_BOOKS');
      if(current.some(b=>String(b.title||'').trim().toLocaleLowerCase('nl-NL')===title.toLocaleLowerCase('nl-NL'))) throw new Error('BIEB_DUPLICATE');
      const next=[...current,metadata];
      if(JSON.stringify(next).length>MAX_BIEB_DOC_CHARS) throw new Error('BIEB_STORAGE_FULL');
      beforeCount=current.length;
      tx.set(userRef,{biebBooks:next,biebUpdatedAt:new Date().toISOString()},{merge:true});
    });
    const newCount=beforeCount+1;
    document.getElementById('snBiebCancel73')?.click();
    lastPreviewKey='';lastPreviewData='';
    toast('Boek staat in je Bieb 📚');
    document.dispatchEvent(new CustomEvent('snazzle:bieb-book-added',{detail:{book:{id:metadata.id,title:metadata.title,reaction:metadata.reaction,rating:metadata.rating},total:newCount}}));
    if(newCount%2===0) setTimeout(()=>showReward(newCount),220);
  }catch(err){
    console.error('Snazzle Bieb v74 opslaan',err);
    if(err?.message==='BIEB_DUPLICATE') toast('Dit boek staat al in jouw Bieb 📚');
    else if(err?.message==='BIEB_MAX_BOOKS') toast(`Je Bieb zit vol met ${MAX_BOOKS} boeken. Wat een leesprestatie!`);
    else if(err?.message==='BIEB_STORAGE_FULL') toast('Je boekenkast is heel groot geworden. Verwijder eerst een oud of verkeerd boek.');
    else toast('Het boek kon nog niet worden opgeslagen. Probeer het opnieuw.');
  }finally{
    saving=false;
    if(btn){btn.disabled=false;btn.textContent='Boek in mijn kast ✓';}
  }
}

function installBridge(){
  installStyles();
  const form=document.getElementById('snBiebForm73');
  if(form&&!form.dataset.snBiebV74){
    form.dataset.snBiebV74='1';
    form.addEventListener('submit',saveBook,true);
  }
  const input=document.getElementById('snBiebCoverInput73');
  if(input&&!input.dataset.snBiebV74){
    input.dataset.snBiebV74='1';
    input.addEventListener('change',handleCoverChange,true);
  }
  const date=document.getElementById('snBiebReadAt73');
  if(date){date.max=today();if(!date.value)date.value=today();}
  const overlay=document.getElementById('snBiebOverlay73');
  if(overlay&&!overlay.dataset.snBiebV74Watch){
    overlay.dataset.snBiebV74Watch='1';
    new MutationObserver(()=>{if(overlay.classList.contains('show'))setTimeout(()=>renderAll(true),30);}).observe(overlay,{attributes:true,attributeFilter:['class']});
  }
}

function watchUser(user){
  try{stopUserDoc?.();}catch{}
  stopUserDoc=null;books=[];lastShelfSignature='';renderAll(true);
  if(!user) return;
  stopUserDoc=onSnapshot(doc(db,'users',user.uid),snap=>{
    books=normalizeBooks(snap.data()?.biebBooks);
    setTimeout(()=>renderAll(true),35);
  },err=>console.warn('Snazzle Bieb v74 laden',err));
}

function init(){
  installStyles();installBridge();
  const observer=new MutationObserver(()=>installBridge());
  observer.observe(document.body,{childList:true,subtree:true});
  onAuthStateChanged(auth,user=>{currentUser=user||null;watchUser(currentUser);});
  console.info(`Snazzle Bieb cloud ${VERSION} geladen`);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
