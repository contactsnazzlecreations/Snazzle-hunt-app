// Snazzle v161 — betrouwbare Luisterverhalen-loader met eigen Firebase-auth herstel.
// Deze module wacht niet eindeloos meer op de algemene app-login. Als nodig meldt hij
// zelf anoniem aan, haalt de verhalenlijst op en toont bij een fout altijd een retry.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, getDocs, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
const COLLECTION='villages';
const TYPE='snazzleAudioStory';
const VERSION='161.0.0';

let stories=[];
let loaded=false;
let loading=false;
let lastError='';
let unsubscribe=null;
let lastLoadedAt=0;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hasAudio=item=>!!(item?.audioUrl||(item?.audioMode==='firestore'&&item?.audioReady&&Number(item?.audioChunkCount)>0));
const withTimeout=(promise,ms,message)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(message)),ms);
  promise.then(v=>{clearTimeout(timer);resolve(v);},e=>{clearTimeout(timer);reject(e);});
});

function getEls(){
  return {
    sheet:document.getElementById('snListenSheet'),
    grid:document.getElementById('snListenGrid'),
    empty:document.getElementById('snListenEmpty')
  };
}

function render(){
  const {sheet,grid,empty}=getEls();
  if(!sheet||!grid||!empty)return;
  grid.innerHTML='';

  if(loading&&!loaded){
    empty.style.display='block';
    empty.innerHTML='🎧 <strong>Luisterverhalen laden…</strong><br><small>Even verbinding maken.</small>';
    return;
  }

  if(lastError&&!stories.length){
    empty.style.display='block';
    empty.innerHTML=`<strong>Luisterverhalen konden niet laden.</strong><br><small>${esc(lastError)}</small><br><button type="button" id="snListenRetry161" class="secondary" style="margin-top:12px">↻ Opnieuw proberen</button>`;
    document.getElementById('snListenRetry161')?.addEventListener('click',()=>refresh(true));
    return;
  }

  const visible=stories
    .filter(x=>x.enabled!==false&&hasAudio(x))
    .sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));

  if(!visible.length){
    empty.style.display='block';
    empty.innerHTML='<strong>Er staan nu geen luisterverhalen klaar.</strong>';
    return;
  }

  empty.style.display='none';
  visible.forEach((item,index)=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='sn-listen-card';
    b.dataset.storyId=item.id;
    b.setAttribute('aria-label',`Luister naar ${item.title||'verhaal'}`);
    const image=item.imageUrl
      ? `<img src="${esc(item.imageUrl)}" alt="" loading="${index<2?'eager':'lazy'}" decoding="async">`
      : '🎧';
    b.innerHTML=`<div class="sn-listen-cover">${image}</div><div class="sn-listen-copy"><small>${esc(item.theme||'Luisterverhaal')}</small><strong>${esc(item.title||'Snazzle verhaal')}</strong><span>▶ Tik om te luisteren</span></div>`;
    grid.appendChild(b);
  });
}

async function ensureSignedIn(){
  if(auth.currentUser)return auth.currentUser;
  try{
    const result=await withTimeout(signInAnonymously(auth),10000,'Aanmelden bij Snazzle duurt te lang.');
    return result?.user||auth.currentUser;
  }catch(err){
    if(auth.currentUser)return auth.currentUser;
    throw err;
  }
}

function startRealtime(){
  if(unsubscribe||!auth.currentUser)return;
  const q=query(collection(db,COLLECTION),where('contentType','==',TYPE));
  unsubscribe=onSnapshot(q,snap=>{
    stories=snap.docs.map(d=>({id:d.id,...d.data()}));
    loaded=true;
    loading=false;
    lastError='';
    lastLoadedAt=Date.now();
    render();
  },err=>{
    console.warn('Snazzle luisterverhalen realtime v161',err);
    if(!loaded){
      lastError=err?.message||'Firebase reageert niet.';
      loading=false;
      render();
    }
  });
}

async function refresh(force=false){
  if(loading&&!force)return;
  loading=true;
  lastError='';
  render();
  try{
    await ensureSignedIn();
    const q=query(collection(db,COLLECTION),where('contentType','==',TYPE));
    const snap=await withTimeout(getDocs(q),15000,'De verhalenlijst reageert niet. Controleer je internetverbinding en probeer opnieuw.');
    stories=snap.docs.map(d=>({id:d.id,...d.data()}));
    loaded=true;
    lastLoadedAt=Date.now();
    startRealtime();
  }catch(err){
    console.error('Snazzle luisterverhalen v161 laden',err);
    lastError=err?.message||'De verhalen konden niet worden opgehaald.';
  }finally{
    loading=false;
    render();
  }
}

function observeOpen(){
  const attach=()=>{
    const sheet=document.getElementById('snListenSheet');
    if(!sheet||sheet.__snListenObserved161)return false;
    sheet.__snListenObserved161=true;
    new MutationObserver(()=>{
      if(!sheet.classList.contains('show'))return;
      if(!loaded||Date.now()-lastLoadedAt>60000)refresh(false);
      else render();
    }).observe(sheet,{attributes:true,attributeFilter:['class']});
    if(sheet.classList.contains('show'))refresh(false);
    return true;
  };
  if(attach())return;
  let tries=0;
  const timer=setInterval(()=>{tries++;if(attach()||tries>=80)clearInterval(timer);},100);
}

onAuthStateChanged(auth,user=>{
  if(!user)return;
  startRealtime();
  if(!loaded&&!loading)refresh(false);
});

observeOpen();
console.info(`Snazzle luisterverhalen loader ${VERSION} geladen`);
window.SnazzleListenListFixV150={refresh:()=>refresh(true),version:VERSION};
