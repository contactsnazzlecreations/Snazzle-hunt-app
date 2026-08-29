// Snazzle v146 — robuuste mobiele luisterverhalen-loader.
// Firestore-audio wordt per blok geladen in plaats van per drie tegelijk.
// Elk blok krijgt een eigen timeout + retry, zodat mobiel laden niet stil op 75% blijft hangen.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getFirestore, collection, doc, getDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const db=getFirestore(getApp());
const STORY_COLLECTION='villages';
const STORY_TYPE='snazzleAudioStory';
const CHUNK_TYPE='snazzleAudioChunk';
const CHUNK_TIMEOUT_MS=12000;
const CHUNK_RETRIES=2;
let activeObjectUrl='';
let activeLoadToken=0;

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function cleanupObjectUrl(){
  if(!activeObjectUrl)return;
  try{URL.revokeObjectURL(activeObjectUrl);}catch{}
  activeObjectUrl='';
}

function playerBox(){return $('#snListenPlayer');}

function showLoading(item,text){
  const box=playerBox();
  if(!box)return;
  cleanupObjectUrl();
  const image=item?.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.title||'Luisterverhaal')}">`:'';
  box.classList.add('show');
  box.innerHTML=`${image}<h3>${esc(item?.title||'Snazzle verhaal')}</h3><p>${esc(item?.theme||'Snazzle verhaal')}</p><div class="sn-listen-loading" id="snListenMobileProgress">${esc(text)}</div>`;
  box.scrollIntoView({behavior:'smooth',block:'start'});
}

function updateProgress(text){
  const el=$('#snListenMobileProgress');
  if(el)el.textContent=text;
}

function showError(item,message,retry){
  const box=playerBox();
  if(!box)return;
  const image=item?.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.title||'Luisterverhaal')}">`:'';
  box.classList.add('show');
  box.innerHTML=`${image}<h3>${esc(item?.title||'Snazzle verhaal')}</h3><div class="sn-listen-loading">${esc(message)}</div>${retry?'<button type="button" class="sn-listen-stop" id="snListenRetry">↻ Opnieuw proberen</button>':''}`;
  if(retry)$('#snListenRetry').onclick=retry;
}

function installPlayer(item,src){
  const box=playerBox();
  if(!box)return;
  const image=item?.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.title||'Luisterverhaal')}">`:'';
  box.classList.add('show');
  box.innerHTML=`${image}<h3>${esc(item.title||'Snazzle verhaal')}</h3><p>${esc(item.theme||'Snazzle verhaal')}</p><audio id="snListenAudio" controls preload="metadata" src="${esc(src)}"></audio><button type="button" class="sn-listen-stop" id="snListenStop">■ Stop verhaal</button>`;
  const audio=$('#snListenAudio');
  $('#snListenStop').onclick=()=>{
    try{audio?.pause();if(audio)audio.currentTime=0;}catch{}
    box.classList.remove('show');
    cleanupObjectUrl();
  };
  audio?.play?.().catch(()=>{});
}

function withTimeout(promise,ms,message){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error(message)),ms);
    promise.then(value=>{clearTimeout(timer);resolve(value);},err=>{clearTimeout(timer);reject(err);});
  });
}

function validateChunkSnap(snap,item,version,index){
  if(!snap.exists())throw new Error(`Audiodeel ${index+1} ontbreekt.`);
  const data=snap.data();
  if(data?.contentType!==CHUNK_TYPE||data?.storyId!==item.id||data?.version!==version||!data?.bytes){
    throw new Error(`Audiodeel ${index+1} klopt niet meer.`);
  }
  return data.bytes.toUint8Array();
}

async function readChunk(item,version,index,token){
  let lastError=null;
  for(let attempt=0;attempt<=CHUNK_RETRIES;attempt++){
    if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
    if(attempt>0){
      updateProgress(`🎧 Audio laden… ${Math.round(index/Math.max(1,Number(item.audioChunkCount))*100)}% · opnieuw proberen`);
      await wait(250*attempt);
    }
    try{
      const snap=await withTimeout(
        getDoc(doc(db,STORY_COLLECTION,`${item.id}_${version}_${index}`)),
        CHUNK_TIMEOUT_MS,
        `Audiodeel ${index+1} reageert niet.`
      );
      if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
      return validateChunkSnap(snap,item,version,index);
    }catch(err){
      lastError=err;
      if(/ontbreekt|klopt niet meer/i.test(String(err?.message||'')))break;
    }
  }
  throw lastError||new Error(`Audiodeel ${index+1} kon niet worden geladen.`);
}

async function recoverChunksByQuery(item,version,count,token){
  updateProgress('🎧 Audio herstellen…');
  const snap=await withTimeout(
    getDocs(query(collection(db,STORY_COLLECTION),where('storyId','==',item.id))),
    15000,
    'Het herstellen duurt te lang.'
  );
  if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
  const chunks=snap.docs
    .map(d=>d.data())
    .filter(data=>data?.contentType===CHUNK_TYPE&&data?.version===version&&Number.isInteger(Number(data?.index))&&data?.bytes)
    .sort((a,b)=>Number(a.index)-Number(b.index));
  if(chunks.length!==count)throw new Error(`Het MP3-bestand is niet compleet opgeslagen (${chunks.length} van ${count} delen). Upload dit verhaal opnieuw in beheer.`);
  for(let i=0;i<count;i++){
    if(Number(chunks[i]?.index)!==i)throw new Error(`Audiodeel ${i+1} ontbreekt. Upload dit verhaal opnieuw in beheer.`);
  }
  return chunks.map(data=>data.bytes.toUint8Array());
}

async function loadFirestoreAudio(item,token){
  const count=Math.max(0,Number(item.audioChunkCount)||0);
  const version=String(item.audioVersion||'');
  if(!count||!version)throw new Error('Dit luisterverhaal is nog niet compleet opgeslagen.');

  const parts=[];
  try{
    for(let i=0;i<count;i++){
      updateProgress(`🎧 Audio laden… ${Math.round(i/count*100)}%`);
      parts.push(await readChunk(item,version,i,token));
      updateProgress(`🎧 Audio laden… ${Math.round((i+1)/count*100)}%`);
      await wait(0);
    }
  }catch(firstError){
    if(token!==activeLoadToken)throw firstError;
    console.warn('Snazzle directe audioblokken laden mislukt; herstelpoging',firstError);
    parts.length=0;
    parts.push(...await recoverChunksByQuery(item,version,count,token));
    updateProgress('🎧 Audio laden… 100%');
  }

  if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
  updateProgress('🎧 Audio starten…');
  const blob=new Blob(parts,{type:'audio/mpeg'});
  if(!blob.size)throw new Error('Het audiobestand is leeg.');
  activeObjectUrl=URL.createObjectURL(blob);
  return activeObjectUrl;
}

async function findStoryForCard(card){
  const title=(card.querySelector('.sn-listen-copy strong')?.textContent||'').trim();
  if(!title)throw new Error('Verhaal kon niet worden herkend.');
  const snap=await getDocs(query(collection(db,STORY_COLLECTION),where('contentType','==',STORY_TYPE)));
  const stories=snap.docs.map(d=>({id:d.id,...d.data()}));
  return stories.find(x=>(x.title||'').trim()===title)||null;
}

async function playKnownItem(item){
  const token=++activeLoadToken;
  try{
    showLoading(item,'🎧 Verhaal wordt klaargezet…');
    if(item.audioUrl){
      installPlayer(item,item.audioUrl);
      return;
    }
    if(item.audioMode!=='firestore')throw new Error('Er is geen geldig MP3-bestand gekoppeld.');
    const src=await loadFirestoreAudio(item,token);
    if(token!==activeLoadToken)return;
    installPlayer(item,src);
  }catch(err){
    if(token!==activeLoadToken)return;
    console.error('Snazzle luisterverhaal v146 laden',err);
    const message=err?.message||'Dit verhaal kon niet worden geladen. Probeer het nog eens.';
    showError(item,message,()=>playKnownItem(item));
  }
}

async function openCard(card){
  const token=++activeLoadToken;
  let item=null;
  try{
    showLoading({title:(card.querySelector('.sn-listen-copy strong')?.textContent||'Luisterverhaal').trim()},'🎧 Verhaal wordt opgezocht…');
    item=await findStoryForCard(card);
    if(!item)throw new Error('Dit luisterverhaal kon niet worden gevonden.');
    if(token!==activeLoadToken)return;
    // playKnownItem gebruikt bewust een nieuw token en annuleert deze zoekactie.
    await playKnownItem(item);
  }catch(err){
    if(item&&token!==activeLoadToken)return;
    if(!item&&token!==activeLoadToken)return;
    console.error('Snazzle luisterverhaal v146 opzoeken',err);
    const message=err?.message||'Dit verhaal kon niet worden geladen. Probeer het nog eens.';
    showError(item,message,()=>openCard(card));
  }
}

function interceptCardClick(event){
  const card=event.target instanceof Element?event.target.closest('.sn-listen-card'):null;
  if(!card||!card.closest('#snListenSheet'))return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
  openCard(card);
}

if(!window.__snListenAudioFix143){
  window.__snListenAudioFix143=true;
  document.addEventListener('click',interceptCardClick,true);
  document.addEventListener('click',event=>{
    const close=event.target instanceof Element?event.target.closest('#snListenClose'):null;
    if(!close)return;
    activeLoadToken++;
    try{$('#snListenAudio')?.pause();}catch{}
    cleanupObjectUrl();
  },true);
}

console.info('Snazzle luisteraudio fix 146.0 geladen');
window.SnazzleListenAudioFixV143={reload:()=>location.reload(),version:'146.0.0'};
