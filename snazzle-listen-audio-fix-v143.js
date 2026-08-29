// Snazzle v162 — audiospeler zonder vastlopende Firestore Web-SDK.
// Verhaaldata komt uit de HTTPS-lijstcache. Oude Firestore-MP3-blokken worden rechtstreeks
// via de Firestore REST/HTTPS-interface opgehaald en tijdens het luisteren gestreamd.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const auth=getAuth(getApp());
const PROJECT_ID='snazzle-hunt';
const API_KEY='AIzaSyB4iVfasVJgRMJ5GcdkG3ZU136H9FdmAy4';
const COLLECTION='villages';
const CHUNK_TYPE='snazzleAudioChunk';
const VERSION='162.0.0';
const CHUNK_TIMEOUT_MS=15000;
const CHUNK_RETRIES=2;

let activeObjectUrl='';
let activeLoadToken=0;
let activeMediaSource=null;

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function cleanupObjectUrl(){
  try{if(activeMediaSource?.readyState==='open')activeMediaSource.endOfStream();}catch{}
  activeMediaSource=null;
  if(activeObjectUrl){try{URL.revokeObjectURL(activeObjectUrl);}catch{}activeObjectUrl='';}
}

function playerBox(){return $('#snListenPlayer');}

function imageMarkup(item){
  return item?.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.title||'Luisterverhaal')}" loading="lazy" decoding="async">`:'';
}

function showLoading(item,text){
  const box=playerBox();if(!box)return;
  cleanupObjectUrl();
  box.classList.add('show');
  box.innerHTML=`${imageMarkup(item)}<h3>${esc(item?.title||'Snazzle verhaal')}</h3><p>${esc(item?.theme||'Snazzle verhaal')}</p><div class="sn-listen-loading" id="snListenMobileProgress">${esc(text)}</div>`;
  box.scrollIntoView({behavior:'smooth',block:'start'});
}

function updateProgress(text){const el=$('#snListenMobileProgress');if(el)el.textContent=text;}

function showError(item,message,retry){
  const box=playerBox();if(!box)return;
  cleanupObjectUrl();
  box.classList.add('show');
  box.innerHTML=`${imageMarkup(item)}<h3>${esc(item?.title||'Snazzle verhaal')}</h3><div class="sn-listen-loading">${esc(message)}</div>${retry?'<button type="button" class="sn-listen-stop" id="snListenRetryAudio162">↻ Opnieuw proberen</button>':''}`;
  if(retry)$('#snListenRetryAudio162').onclick=retry;
}

function installPlayer(item,src){
  const box=playerBox();if(!box)return null;
  box.classList.add('show');
  box.innerHTML=`${imageMarkup(item)}<h3>${esc(item.title||'Snazzle verhaal')}</h3><p>${esc(item.theme||'Snazzle verhaal')}</p><audio id="snListenAudio" controls preload="metadata" src="${esc(src)}"></audio><div class="sn-listen-loading" id="snListenMobileProgress">🎧 Starten…</div><button type="button" class="sn-listen-stop" id="snListenStop">■ Stop verhaal</button>`;
  const audio=$('#snListenAudio');
  $('#snListenStop').onclick=()=>{
    activeLoadToken++;
    try{audio?.pause();if(audio)audio.currentTime=0;}catch{}
    box.classList.remove('show');cleanupObjectUrl();
  };
  return audio;
}

function bytesFromBase64(value){
  const raw=atob(String(value||''));
  const out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}

function fieldString(fields,name){return fields?.[name]?.stringValue??'';}
function fieldNumber(fields,name){
  const v=fields?.[name];
  if(!v)return NaN;
  if('integerValue'in v)return Number(v.integerValue);
  if('doubleValue'in v)return Number(v.doubleValue);
  return NaN;
}

async function fetchWithTimeout(url,options={},timeoutMs=CHUNK_TIMEOUT_MS){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(url,{...options,signal:controller.signal,cache:'no-store'});}
  catch(err){if(err?.name==='AbortError')throw new Error('Een audiodeel reageert niet.');throw err;}
  finally{clearTimeout(timer);}
}

async function authToken(force=false){
  const user=auth.currentUser;
  if(!user)throw new Error('Snazzle is nog niet verbonden. Sluit dit scherm en probeer opnieuw.');
  return user.getIdToken(force);
}

async function fetchChunk(item,version,index,token){
  let lastError=null;
  const docId=`${item.id}_${version}_${index}`;
  const url=`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(docId)}?key=${encodeURIComponent(API_KEY)}`;

  for(let attempt=0;attempt<=CHUNK_RETRIES;attempt++){
    if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
    try{
      let bearer=await authToken(attempt>0);
      let response=await fetchWithTimeout(url,{headers:{Authorization:`Bearer ${bearer}`}});
      if(response.status===401&&attempt<CHUNK_RETRIES){await wait(200);continue;}
      if(response.status===404)throw new Error(`Audiodeel ${index+1} ontbreekt.`);
      if(!response.ok)throw new Error(`Audiodeel ${index+1} kon niet worden opgehaald.`);
      const data=await response.json();
      const fields=data?.fields||{};
      if(fieldString(fields,'contentType')!==CHUNK_TYPE||fieldString(fields,'storyId')!==item.id||fieldString(fields,'version')!==version){
        throw new Error(`Audiodeel ${index+1} klopt niet meer.`);
      }
      const bytes=fields?.bytes?.bytesValue;
      if(!bytes)throw new Error(`Audiodeel ${index+1} is leeg.`);
      return bytesFromBase64(bytes);
    }catch(err){
      lastError=err;
      if(/ontbreekt|klopt niet meer|is leeg/i.test(String(err?.message||'')))break;
      if(attempt<CHUNK_RETRIES)await wait(300*(attempt+1));
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

async function streamChunkedAudio(item,token){
  const count=Math.max(0,Number(item.audioChunkCount)||0);
  const version=String(item.audioVersion||'');
  if(!count||!version)throw new Error('Dit luisterverhaal is niet compleet opgeslagen.');

  const mediaSource=new MediaSource();
  activeMediaSource=mediaSource;
  activeObjectUrl=URL.createObjectURL(mediaSource);
  const audio=installPlayer(item,activeObjectUrl);
  if(!audio)throw new Error('De audiospeler kon niet worden geopend.');
  updateProgress('🎧 Eerste stukje laden…');

  await sourceOpen(mediaSource);
  if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');

  let sourceBuffer;
  try{
    sourceBuffer=mediaSource.addSourceBuffer('audio/mpeg');
    try{sourceBuffer.mode='sequence';}catch{}
  }catch{throw new Error('Deze browser kan dit MP3-bestand niet direct streamen.');}

  for(let i=0;i<count;i++){
    if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
    const bytes=await fetchChunk(item,version,i,token);
    await appendChunk(sourceBuffer,bytes);
    if(i===0){
      updateProgress('▶ Klaar — de rest laadt tijdens het luisteren');
      try{await audio.play();}catch{}
    }else{
      updateProgress(`🎧 Speelt · ${Math.round((i+1)/count*100)}% geladen`);
    }
    await wait(0);
  }
  if(sourceBuffer.updating)await new Promise(resolve=>sourceBuffer.addEventListener('updateend',resolve,{once:true}));
  try{if(mediaSource.readyState==='open')mediaSource.endOfStream();}catch{}
  updateProgress('✓ Verhaal volledig geladen');
}

async function loadChunkedAudioFull(item,token){
  const count=Math.max(0,Number(item.audioChunkCount)||0);
  const version=String(item.audioVersion||'');
  if(!count||!version)throw new Error('Dit luisterverhaal is niet compleet opgeslagen.');
  const parts=[];
  for(let i=0;i<count;i++){
    if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
    updateProgress(`🎧 Audio ophalen · ${Math.round(i/count*100)}%`);
    parts.push(await fetchChunk(item,version,i,token));
  }
  const blob=new Blob(parts,{type:'audio/mpeg'});
  if(!blob.size)throw new Error('Het audiobestand is leeg.');
  activeObjectUrl=URL.createObjectURL(blob);
  const audio=installPlayer(item,activeObjectUrl);
  updateProgress('▶ Klaar om te luisteren');
  try{await audio?.play?.();}catch{}
}

function findStoryForCard(card){
  const id=card?.dataset?.storyId||'';
  const map=window.__snazzleListenStories162;
  if(id&&map?.get){
    const byId=map.get(id);
    if(byId)return byId;
  }
  const title=(card?.querySelector('.sn-listen-copy strong')?.textContent||'').trim();
  if(map?.values&&title){
    for(const item of map.values())if(String(item?.title||'').trim()===title)return item;
  }
  return null;
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
    if(item.audioMode!=='firestore')throw new Error('Er is geen geldige MP3 gekoppeld.');
    if(mediaSourceSupported())await streamChunkedAudio(item,token);
    else await loadChunkedAudioFull(item,token);
  }catch(err){
    if(token!==activeLoadToken)return;
    console.error('Snazzle luisterverhaal v162 laden',err);
    showError(item,err?.message||'Dit verhaal kon niet worden geladen.',()=>playKnownItem(item));
  }
}

function openCard(card){
  const item=findStoryForCard(card);
  if(!item){
    showError({title:(card?.querySelector('.sn-listen-copy strong')?.textContent||'Luisterverhaal').trim()},'Dit luisterverhaal kon niet worden gevonden. Sluit het scherm en open Luisterverhalen opnieuw.',null);
    return;
  }
  playKnownItem(item);
}

function interceptCardClick(event){
  const card=event.target instanceof Element?event.target.closest('.sn-listen-card'):null;
  if(!card||!card.closest('#snListenSheet'))return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
  openCard(card);
}

if(!window.__snListenAudioFix162){
  window.__snListenAudioFix162=true;
  document.addEventListener('click',interceptCardClick,true);
  document.addEventListener('click',event=>{
    const close=event.target instanceof Element?event.target.closest('#snListenClose'):null;
    if(!close)return;
    activeLoadToken++;
    try{$('#snListenAudio')?.pause();}catch{}
    cleanupObjectUrl();
  },true);
}

console.info(`Snazzle luisteraudio HTTPS ${VERSION} geladen`);
window.SnazzleListenAudioFixV148={version:VERSION};
