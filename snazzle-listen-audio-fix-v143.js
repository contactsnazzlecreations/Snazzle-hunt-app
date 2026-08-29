// Snazzle v143 — mobiele luisterverhalen laden zonder vastlopen.
// Oude verhalen kunnen als losse Firestore-audioblokken zijn opgeslagen. De v63-loader
// haalde alle blokken tegelijk op; op mobiele verbindingen kan dat lang blijven hangen.
// Deze patch onderschept alleen verhaalkaarten en laadt de blokken in kleine batches met voortgang.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getFirestore, collection, doc, getDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const db=getFirestore(getApp());
const STORY_COLLECTION='villages';
const STORY_TYPE='snazzleAudioStory';
const CHUNK_TYPE='snazzleAudioChunk';
const BATCH_SIZE=3;
const BATCH_TIMEOUT_MS=25000;
let activeObjectUrl='';
let activeLoadToken=0;

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

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

function showError(item,message){
  const box=playerBox();
  if(!box)return;
  const image=item?.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.title||'Luisterverhaal')}">`:'';
  box.classList.add('show');
  box.innerHTML=`${image}<h3>${esc(item?.title||'Snazzle verhaal')}</h3><div class="sn-listen-loading">${esc(message)}</div>`;
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

function timeoutPromise(ms,label){
  return new Promise((_,reject)=>setTimeout(()=>reject(new Error(label)),ms));
}

async function loadChunkBatch(item,version,start,end,token){
  const reads=[];
  for(let i=start;i<end;i++){
    reads.push(getDoc(doc(db,STORY_COLLECTION,`${item.id}_${version}_${i}`)));
  }
  const snaps=await Promise.race([
    Promise.all(reads),
    timeoutPromise(BATCH_TIMEOUT_MS,'Het laden duurt te lang. Controleer je verbinding en probeer opnieuw.')
  ]);
  if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
  return snaps.map((snap,offset)=>{
    const index=start+offset;
    if(!snap.exists())throw new Error(`Audiodeel ${index+1} ontbreekt.`);
    const data=snap.data();
    if(data?.contentType!==CHUNK_TYPE||data?.storyId!==item.id||data?.version!==version||!data?.bytes){
      throw new Error('Een audiodeel klopt niet meer. Upload dit verhaal opnieuw in beheer.');
    }
    return data.bytes.toUint8Array();
  });
}

async function loadFirestoreAudio(item,token){
  const count=Math.max(0,Number(item.audioChunkCount)||0);
  const version=String(item.audioVersion||'');
  if(!count||!version)throw new Error('Dit luisterverhaal is nog niet compleet opgeslagen.');

  const parts=[];
  for(let start=0;start<count;start+=BATCH_SIZE){
    const end=Math.min(count,start+BATCH_SIZE);
    updateProgress(`🎧 Audio laden… ${Math.round(start/count*100)}%`);
    const batch=await loadChunkBatch(item,version,start,end,token);
    parts.push(...batch);
    updateProgress(`🎧 Audio laden… ${Math.round(end/count*100)}%`);
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
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
  return stories.find(x=>(x.title||'').trim()===title) || null;
}

async function openCard(card){
  const token=++activeLoadToken;
  let item=null;
  try{
    showLoading({title:(card.querySelector('.sn-listen-copy strong')?.textContent||'Luisterverhaal').trim()},'🎧 Verhaal wordt opgezocht…');
    item=await findStoryForCard(card);
    if(!item)throw new Error('Dit luisterverhaal kon niet worden gevonden.');
    if(token!==activeLoadToken)return;
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
    console.error('Snazzle luisterverhaal v143 laden',err);
    showError(item,{toString(){return err?.message||'Dit verhaal kon niet worden geladen. Probeer het nog eens.';}}.toString());
  }
}

function interceptCardClick(event){
  const card=event.target instanceof Element ? event.target.closest('.sn-listen-card') : null;
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
    const close=event.target instanceof Element ? event.target.closest('#snListenClose') : null;
    if(!close)return;
    activeLoadToken++;
    try{$('#snListenAudio')?.pause();}catch{}
    cleanupObjectUrl();
  },true);
}

console.info('Snazzle luisteraudio fix 143.1 geladen');
window.SnazzleListenAudioFixV143={reload:()=>location.reload()};
