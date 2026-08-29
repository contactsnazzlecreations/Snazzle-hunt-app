// Snazzle v148 — luisterverhalen starten terwijl de rest van de MP3 nog wordt geladen.
// Oude MP3's staan als Firestore-blokken opgeslagen. In plaats van eerst het hele bestand
// binnen te halen, streamt deze versie de blokken direct naar de audiospeler via MediaSource.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getFirestore, collection, doc, getDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const db=getFirestore(getApp());
const STORY_COLLECTION='villages';
const STORY_TYPE='snazzleAudioStory';
const CHUNK_TYPE='snazzleAudioChunk';
const CHUNK_TIMEOUT_MS=12000;
const CHUNK_RETRIES=2;
const FULL_LOAD_TIMEOUT_MS=30000;
let activeObjectUrl='';
let activeLoadToken=0;
let activeMediaSource=null;

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function cleanupObjectUrl(){
  try{
    if(activeMediaSource?.readyState==='open')activeMediaSource.endOfStream();
  }catch{}
  activeMediaSource=null;
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
  cleanupObjectUrl();
  const image=item?.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.title||'Luisterverhaal')}">`:'';
  box.classList.add('show');
  box.innerHTML=`${image}<h3>${esc(item?.title||'Snazzle verhaal')}</h3><div class="sn-listen-loading">${esc(message)}</div>${retry?'<button type="button" class="sn-listen-stop" id="snListenRetry">↻ Opnieuw proberen</button>':''}`;
  if(retry)$('#snListenRetry').onclick=retry;
}

function installPlayer(item,src){
  const box=playerBox();
  if(!box)return null;
  const image=item?.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.title||'Luisterverhaal')}">`:'';
  box.classList.add('show');
  box.innerHTML=`${image}<h3>${esc(item.title||'Snazzle verhaal')}</h3><p>${esc(item.theme||'Snazzle verhaal')}</p><audio id="snListenAudio" controls preload="metadata" src="${esc(src)}"></audio><div class="sn-listen-loading" id="snListenMobileProgress">🎧 Starten…</div><button type="button" class="sn-listen-stop" id="snListenStop">■ Stop verhaal</button>`;
  const audio=$('#snListenAudio');
  $('#snListenStop').onclick=()=>{
    activeLoadToken++;
    try{audio?.pause();if(audio)audio.currentTime=0;}catch{}
    box.classList.remove('show');
    cleanupObjectUrl();
  };
  return audio;
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
    try{
      return validateChunkSnap(
        await withTimeout(
          getDoc(doc(db,STORY_COLLECTION,`${item.id}_${version}_${index}`)),
          CHUNK_TIMEOUT_MS,
          `Audiodeel ${index+1} reageert niet.`
        ),
        item,version,index
      );
    }catch(err){
      lastError=err;
      if(/ontbreekt|klopt niet meer/i.test(String(err?.message||'')))break;
      if(attempt<CHUNK_RETRIES)await wait(250*(attempt+1));
    }
  }
  throw lastError||new Error(`Audiodeel ${index+1} kon niet worden geladen.`);
}

function sourceOpen(mediaSource){
  if(mediaSource.readyState==='open')return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const ok=()=>{cleanup();resolve();};
    const bad=()=>{cleanup();reject(new Error('De audiospeler kon niet starten.'));};
    const cleanup=()=>{mediaSource.removeEventListener('sourceopen',ok);mediaSource.removeEventListener('sourceclose',bad);mediaSource.removeEventListener('error',bad);};
    mediaSource.addEventListener('sourceopen',ok,{once:true});
    mediaSource.addEventListener('sourceclose',bad,{once:true});
    mediaSource.addEventListener('error',bad,{once:true});
  });
}

function appendChunk(sourceBuffer,bytes){
  return new Promise((resolve,reject)=>{
    const ok=()=>{cleanup();resolve();};
    const bad=()=>{cleanup();reject(new Error('Een audiodeel kon niet worden afgespeeld.'));};
    const cleanup=()=>{sourceBuffer.removeEventListener('updateend',ok);sourceBuffer.removeEventListener('error',bad);};
    sourceBuffer.addEventListener('updateend',ok,{once:true});
    sourceBuffer.addEventListener('error',bad,{once:true});
    try{sourceBuffer.appendBuffer(bytes);}catch(err){cleanup();reject(err);}
  });
}

function mediaSourceSupported(){
  try{return !!window.MediaSource&&MediaSource.isTypeSupported('audio/mpeg');}
  catch{return false;}
}

async function streamFirestoreAudio(item,token){
  const count=Math.max(0,Number(item.audioChunkCount)||0);
  const version=String(item.audioVersion||'');
  if(!count||!version)throw new Error('Dit luisterverhaal is niet compleet opgeslagen. Upload de MP3 opnieuw in beheer.');

  const mediaSource=new MediaSource();
  activeMediaSource=mediaSource;
  activeObjectUrl=URL.createObjectURL(mediaSource);
  const audio=installPlayer(item,activeObjectUrl);
  if(!audio)throw new Error('De audiospeler kon niet worden geopend.');
  updateProgress('🎧 Even laden…');

  await sourceOpen(mediaSource);
  if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');

  let sourceBuffer;
  try{
    sourceBuffer=mediaSource.addSourceBuffer('audio/mpeg');
    try{sourceBuffer.mode='sequence';}catch{}
  }catch{
    throw new Error('Deze browser kan dit verhaal niet direct streamen.');
  }

  for(let i=0;i<count;i++){
    if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
    if(i===0)updateProgress('🎧 Eerste stukje laden…');
    else updateProgress(`🎧 Speelt · ${Math.round(i/count*100)}% geladen`);
    const bytes=await readChunk(item,version,i,token);
    await appendChunk(sourceBuffer,bytes);

    if(i===0){
      updateProgress('▶ Klaar — de rest laadt tijdens het luisteren');
      try{await audio.play();}catch{}
    }
    await wait(0);
  }

  if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
  if(sourceBuffer.updating)await new Promise(resolve=>sourceBuffer.addEventListener('updateend',resolve,{once:true}));
  try{if(mediaSource.readyState==='open')mediaSource.endOfStream();}catch{}
  updateProgress('✓ Verhaal volledig geladen');
}

async function loadFirestoreAudioFull(item,token){
  const expected=Math.max(0,Number(item.audioChunkCount)||0);
  const version=String(item.audioVersion||'');
  if(!expected||!version)throw new Error('Dit luisterverhaal is niet compleet opgeslagen. Upload de MP3 opnieuw in beheer.');

  updateProgress('🎧 Audio ophalen…');
  const snap=await withTimeout(
    getDocs(query(collection(db,STORY_COLLECTION),where('storyId','==',item.id))),
    FULL_LOAD_TIMEOUT_MS,
    'De audio reageert niet. Tik op Opnieuw proberen.'
  );
  if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');

  const chunks=snap.docs
    .map(d=>d.data())
    .filter(data=>data?.contentType===CHUNK_TYPE&&data?.version===version&&data?.bytes&&Number.isInteger(Number(data?.index)))
    .sort((a,b)=>Number(a.index)-Number(b.index));

  if(chunks.length!==expected)throw new Error(`De MP3 is niet compleet opgeslagen (${chunks.length} van ${expected} delen). Upload dit verhaal opnieuw in beheer.`);
  for(let i=0;i<expected;i++)if(Number(chunks[i]?.index)!==i)throw new Error(`Audiodeel ${i+1} ontbreekt. Upload dit verhaal opnieuw in beheer.`);

  const blob=new Blob(chunks.map(x=>x.bytes.toUint8Array()),{type:'audio/mpeg'});
  if(!blob.size)throw new Error('Het audiobestand is leeg. Upload de MP3 opnieuw in beheer.');
  activeObjectUrl=URL.createObjectURL(blob);
  const audio=installPlayer(item,activeObjectUrl);
  updateProgress('✓ Verhaal geladen');
  try{await audio?.play?.();}catch{}
}

async function findStoryForCard(card){
  const title=(card.querySelector('.sn-listen-copy strong')?.textContent||'').trim();
  if(!title)throw new Error('Verhaal kon niet worden herkend.');
  const snap=await withTimeout(
    getDocs(query(collection(db,STORY_COLLECTION),where('contentType','==',STORY_TYPE))),
    12000,
    'De verhalenlijst reageert niet. Probeer opnieuw.'
  );
  const stories=snap.docs.map(d=>({id:d.id,...d.data()}));
  return stories.find(x=>(x.title||'').trim()===title)||null;
}

async function playKnownItem(item){
  const token=++activeLoadToken;
  try{
    showLoading(item,'🎧 Verhaal wordt klaargezet…');
    if(item.audioUrl){
      const audio=installPlayer(item,item.audioUrl);
      updateProgress('▶ Klaar om te luisteren');
      try{await audio?.play?.();}catch{}
      return;
    }
    if(item.audioMode!=='firestore')throw new Error('Er is geen geldige MP3 gekoppeld. Upload de MP3 opnieuw in beheer.');
    if(mediaSourceSupported())await streamFirestoreAudio(item,token);
    else await loadFirestoreAudioFull(item,token);
  }catch(err){
    if(token!==activeLoadToken)return;
    console.error('Snazzle luisterverhaal v148 laden',err);
    showError(item,err?.message||'Dit verhaal kon niet worden geladen.',()=>playKnownItem(item));
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
    playKnownItem(item);
  }catch(err){
    if(token!==activeLoadToken)return;
    console.error('Snazzle luisterverhaal v148 opzoeken',err);
    showError(item,err?.message||'Dit verhaal kon niet worden geladen.',()=>openCard(card));
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

if(!window.__snListenAudioFix148){
  window.__snListenAudioFix148=true;
  document.addEventListener('click',interceptCardClick,true);
  document.addEventListener('click',event=>{
    const close=event.target instanceof Element?event.target.closest('#snListenClose'):null;
    if(!close)return;
    activeLoadToken++;
    try{$('#snListenAudio')?.pause();}catch{}
    cleanupObjectUrl();
  },true);
}

console.info('Snazzle luisteraudio fix 148.0 geladen');
window.SnazzleListenAudioFixV148={reload:()=>location.reload(),version:'148.0.0'};
