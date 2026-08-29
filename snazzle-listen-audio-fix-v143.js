// Snazzle v147 — mobiele luisterverhalen zonder vastlopende 75%-loader.
// Firestore-audio wordt nu in één query opgehaald en direct gecontroleerd op ontbrekende delen.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getFirestore, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const db=getFirestore(getApp());
const STORY_COLLECTION='villages';
const STORY_TYPE='snazzleAudioStory';
const CHUNK_TYPE='snazzleAudioChunk';
const LOAD_TIMEOUT_MS=18000;
let activeObjectUrl='';
let activeLoadToken=0;

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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

async function loadFirestoreAudio(item,token){
  const expected=Math.max(0,Number(item.audioChunkCount)||0);
  const version=String(item.audioVersion||'');
  if(!expected||!version)throw new Error('Dit luisterverhaal is niet compleet opgeslagen. Upload de MP3 opnieuw in beheer.');

  updateProgress('🎧 Audio ophalen…');
  const snap=await withTimeout(
    getDocs(query(collection(db,STORY_COLLECTION),where('storyId','==',item.id))),
    LOAD_TIMEOUT_MS,
    'De audio reageert niet. Tik op Opnieuw proberen.'
  );
  if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');

  const chunks=snap.docs
    .map(d=>d.data())
    .filter(data=>data?.contentType===CHUNK_TYPE&&data?.version===version&&data?.bytes&&Number.isInteger(Number(data?.index)))
    .sort((a,b)=>Number(a.index)-Number(b.index));

  if(chunks.length!==expected){
    throw new Error(`De MP3 is niet compleet opgeslagen (${chunks.length} van ${expected} delen). Upload dit verhaal opnieuw in beheer.`);
  }
  for(let i=0;i<expected;i++){
    if(Number(chunks[i]?.index)!==i){
      throw new Error(`Audiodeel ${i+1} ontbreekt. Upload dit verhaal opnieuw in beheer.`);
    }
  }

  updateProgress('🎧 Audio samenvoegen…');
  const parts=[];
  for(let i=0;i<chunks.length;i++){
    if(token!==activeLoadToken)throw new Error('Laden geannuleerd.');
    parts.push(chunks[i].bytes.toUint8Array());
    if(i%3===0)await new Promise(resolve=>setTimeout(resolve,0));
  }

  const blob=new Blob(parts,{type:'audio/mpeg'});
  if(!blob.size)throw new Error('Het audiobestand is leeg. Upload de MP3 opnieuw in beheer.');
  activeObjectUrl=URL.createObjectURL(blob);
  return activeObjectUrl;
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
      installPlayer(item,item.audioUrl);
      return;
    }
    if(item.audioMode!=='firestore')throw new Error('Er is geen geldige MP3 gekoppeld. Upload de MP3 opnieuw in beheer.');
    const src=await loadFirestoreAudio(item,token);
    if(token!==activeLoadToken)return;
    installPlayer(item,src);
  }catch(err){
    if(token!==activeLoadToken)return;
    console.error('Snazzle luisterverhaal v147 laden',err);
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
    console.error('Snazzle luisterverhaal v147 opzoeken',err);
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

if(!window.__snListenAudioFix147){
  window.__snListenAudioFix147=true;
  document.addEventListener('click',interceptCardClick,true);
  document.addEventListener('click',event=>{
    const close=event.target instanceof Element?event.target.closest('#snListenClose'):null;
    if(!close)return;
    activeLoadToken++;
    try{$('#snListenAudio')?.pause();}catch{}
    cleanupObjectUrl();
  },true);
}

console.info('Snazzle luisteraudio fix 147.0 geladen');
window.SnazzleListenAudioFixV147={reload:()=>location.reload(),version:'147.0.0'};
