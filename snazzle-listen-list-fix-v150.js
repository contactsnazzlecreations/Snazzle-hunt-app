// Snazzle v162 — luisterverhalenlijst via Firestore HTTPS in plaats van vastlopende Web-SDK query.
// De gebruiker blijft via Firebase anoniem ingelogd en Firestore Security Rules blijven gelden.
// Alleen het netwerkpad voor de publieke verhalenlijst is vervangen.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const app=getApp();
const auth=getAuth(app);
const PROJECT_ID='snazzle-hunt';
const API_KEY='AIzaSyB4iVfasVJgRMJ5GcdkG3ZU136H9FdmAy4';
const COLLECTION='villages';
const TYPE='snazzleAudioStory';
const VERSION='162.0.0';
const RUN_QUERY_URL=`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${encodeURIComponent(API_KEY)}`;

let stories=[];
let loaded=false;
let loading=false;
let lastError='';
let lastLoadedAt=0;
let retryTimer=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hasAudio=item=>!!(item?.audioUrl||(item?.audioMode==='firestore'&&item?.audioReady&&Number(item?.audioChunkCount)>0));

function getEls(){
  return {
    sheet:document.getElementById('snListenSheet'),
    grid:document.getElementById('snListenGrid'),
    empty:document.getElementById('snListenEmpty')
  };
}

function decodeValue(v){
  if(!v||typeof v!=='object')return null;
  if('nullValue'in v)return null;
  if('stringValue'in v)return v.stringValue;
  if('booleanValue'in v)return !!v.booleanValue;
  if('integerValue'in v)return Number(v.integerValue);
  if('doubleValue'in v)return Number(v.doubleValue);
  if('timestampValue'in v)return v.timestampValue;
  if('referenceValue'in v)return v.referenceValue;
  if('bytesValue'in v)return v.bytesValue;
  if('geoPointValue'in v)return v.geoPointValue;
  if('arrayValue'in v)return (v.arrayValue?.values||[]).map(decodeValue);
  if('mapValue'in v){
    const out={};
    Object.entries(v.mapValue?.fields||{}).forEach(([k,val])=>out[k]=decodeValue(val));
    return out;
  }
  return null;
}

function decodeDocument(doc){
  const out={};
  Object.entries(doc?.fields||{}).forEach(([k,v])=>out[k]=decodeValue(v));
  out.id=String(doc?.name||'').split('/').pop()||'';
  return out;
}

function render(){
  const {sheet,grid,empty}=getEls();
  if(!sheet||!grid||!empty)return;
  grid.innerHTML='';

  if(loading&&!loaded){
    empty.style.display='block';
    empty.innerHTML='🎧 <strong>Luisterverhalen laden…</strong><br><small>Even de verhalen ophalen.</small>';
    return;
  }

  if(lastError&&!stories.length){
    empty.style.display='block';
    empty.innerHTML=`<strong>Luisterverhalen konden niet laden.</strong><br><small>${esc(lastError)}</small><br><button type="button" id="snListenRetry162" class="secondary" style="margin-top:12px">↻ Opnieuw proberen</button>`;
    document.getElementById('snListenRetry162')?.addEventListener('click',()=>refresh(true));
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

  // Maak de al opgehaalde story-data ook beschikbaar voor de audiospeler,
  // zodat die niet opnieuw de vastlopende lijst-query hoeft te doen.
  window.__snazzleListenStories162=new Map(stories.map(item=>[item.id,item]));
}

async function ensureSignedIn(){
  if(auth.currentUser)return auth.currentUser;
  try{
    const result=await signInAnonymously(auth);
    return result?.user||auth.currentUser;
  }catch(err){
    if(auth.currentUser)return auth.currentUser;
    throw err;
  }
}

async function fetchWithTimeout(url,options={},timeoutMs=18000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    return await fetch(url,{...options,signal:controller.signal,cache:'no-store'});
  }catch(err){
    if(err?.name==='AbortError')throw new Error('De verhalenserver reageert niet op tijd. Probeer opnieuw.');
    throw err;
  }finally{
    clearTimeout(timer);
  }
}

async function queryStoriesViaHttps(forceToken=false){
  const user=await ensureSignedIn();
  const token=await user.getIdToken(forceToken);
  const body={
    structuredQuery:{
      from:[{collectionId:COLLECTION}],
      where:{
        fieldFilter:{
          field:{fieldPath:'contentType'},
          op:'EQUAL',
          value:{stringValue:TYPE}
        }
      }
    }
  };

  const response=await fetchWithTimeout(RUN_QUERY_URL,{
    method:'POST',
    headers:{
      'Authorization':`Bearer ${token}`,
      'Content-Type':'application/json'
    },
    body:JSON.stringify(body)
  });

  if(response.status===401&& !forceToken)return queryStoriesViaHttps(true);
  if(!response.ok){
    let detail='';
    try{detail=(await response.json())?.error?.message||'';}catch{}
    throw new Error(detail||`Verhalenserver gaf fout ${response.status}.`);
  }

  const rows=await response.json();
  return (Array.isArray(rows)?rows:[])
    .filter(row=>row?.document)
    .map(row=>decodeDocument(row.document));
}

async function refresh(force=false){
  if(loading&&!force)return;
  if(!force&&loaded&&Date.now()-lastLoadedAt<60000){render();return;}
  loading=true;
  lastError='';
  render();
  try{
    stories=await queryStoriesViaHttps(false);
    loaded=true;
    lastLoadedAt=Date.now();
    render();
  }catch(err){
    console.error('Snazzle luisterverhalen v162 HTTPS laden',err);
    lastError=err?.message||'De verhalen konden niet worden opgehaald.';
    loaded=false;
    render();
  }finally{
    loading=false;
    render();
  }
}

function observeOpen(){
  const attach=()=>{
    const sheet=document.getElementById('snListenSheet');
    if(!sheet||sheet.__snListenObserved162)return false;
    sheet.__snListenObserved162=true;
    new MutationObserver(()=>{
      if(!sheet.classList.contains('show'))return;
      refresh(false);
    }).observe(sheet,{attributes:true,attributeFilter:['class']});
    if(sheet.classList.contains('show'))refresh(false);
    return true;
  };
  if(attach())return;
  let tries=0;
  retryTimer=setInterval(()=>{
    tries++;
    if(attach()||tries>=80){clearInterval(retryTimer);retryTimer=null;}
  },100);
}

onAuthStateChanged(auth,user=>{
  if(user&&!loaded&&!loading)refresh(false);
});

observeOpen();
console.info(`Snazzle luisterverhalen HTTPS-loader ${VERSION} geladen`);
window.SnazzleListenListFixV150={refresh:()=>refresh(true),version:VERSION};
