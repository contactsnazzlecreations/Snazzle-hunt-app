// Snazzle v150 — luisterverhalenlijst altijd opnieuw uit Firebase laden wanneer het venster opent.
// Voorkomt dat de lege beginstatus zichtbaar blijft terwijl de verhalen wel centraal bestaan.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, getDocs, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
const COLLECTION='villages';
const TYPE='snazzleAudioStory';
let stories=[];
let loaded=false;
let loading=false;
let lastError='';
let unsubscribe=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hasAudio=item=>!!(item?.audioUrl||(item?.audioMode==='firestore'&&item?.audioReady&&Number(item?.audioChunkCount)>0));

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
    empty.innerHTML='🎧 <strong>Luisterverhalen laden…</strong>';
    return;
  }
  if(lastError&&!stories.length){
    empty.style.display='block';
    empty.innerHTML=`<strong>Luisterverhalen konden niet laden.</strong><br><small>${esc(lastError)}</small><br><button type="button" id="snListenListRetry150" class="secondary" style="margin-top:12px">↻ Opnieuw proberen</button>`;
    document.getElementById('snListenListRetry150')?.addEventListener('click',()=>refreshOnce(true));
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
  visible.forEach(item=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='sn-listen-card';
    b.dataset.storyId=item.id;
    b.setAttribute('aria-label',`Luister naar ${item.title||'verhaal'}`);
    b.innerHTML=`<div class="sn-listen-cover">${item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="">`:'🎧'}</div><div class="sn-listen-copy"><small>${esc(item.theme||'Luisterverhaal')}</small><strong>${esc(item.title||'Snazzle verhaal')}</strong><span>▶ Tik om te luisteren</span></div>`;
    grid.appendChild(b);
  });
}

async function refreshOnce(force=false){
  if(loading&&!force)return;
  if(!auth.currentUser){
    loading=true;lastError='';render();
    return;
  }
  loading=true;lastError='';render();
  try{
    const snap=await getDocs(query(collection(db,COLLECTION),where('contentType','==',TYPE)));
    stories=snap.docs.map(d=>({id:d.id,...d.data()}));
    loaded=true;
  }catch(err){
    console.error('Snazzle luisterverhalenlijst v150 laden',err);
    lastError=err?.message||'Firebase reageert niet.';
  }finally{
    loading=false;render();
  }
}

function startRealtime(){
  if(unsubscribe||!auth.currentUser)return;
  const q=query(collection(db,COLLECTION),where('contentType','==',TYPE));
  unsubscribe=onSnapshot(q,snap=>{
    stories=snap.docs.map(d=>({id:d.id,...d.data()}));
    loaded=true;loading=false;lastError='';render();
  },err=>{
    console.warn('Snazzle luisterverhalen realtime v150',err);
    lastError=err?.message||'Firebase reageert niet.';
    loading=false;render();
  });
}

function observeOpen(){
  const attach=()=>{
    const sheet=document.getElementById('snListenSheet');
    if(!sheet||sheet.__snListenObserved150)return false;
    sheet.__snListenObserved150=true;
    new MutationObserver(()=>{
      if(sheet.classList.contains('show'))refreshOnce();
    }).observe(sheet,{attributes:true,attributeFilter:['class']});
    if(sheet.classList.contains('show'))refreshOnce();
    return true;
  };
  if(attach())return;
  let tries=0;
  const timer=setInterval(()=>{tries++;if(attach()||tries>=80)clearInterval(timer);},100);
}

onAuthStateChanged(auth,user=>{
  if(!user){
    if(unsubscribe){try{unsubscribe();}catch{}unsubscribe=null;}
    loaded=false;loading=true;render();
    return;
  }
  startRealtime();
  refreshOnce(true);
});

observeOpen();
console.info('Snazzle luisterverhalenlijst fix 150.0 geladen');
window.SnazzleListenListFixV150={refresh:()=>refreshOnce(true),version:'150.0.0'};
