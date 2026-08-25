// Snazzle v63 — luisterverhalen met directe MP3- en afbeeldingsupload.
// Firebase Storage is de voorkeursopslag. Als Storage nog niet is geactiveerd,
// valt de app automatisch terug op een reeds beveiligde Firestore-opslagroute.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, writeBatch, Bytes
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import {
  getStorage, ref as storageRef, uploadBytes, uploadBytesResumable,
  getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const app=getApp(), auth=getAuth(app), db=getFirestore(app), storage=getStorage(app);
const COLLECTION='villages', TYPE='snazzleAudioStory';
// Deze bestaande, afgeschermde collectie wordt uitsluitend als fallback voor audioblokken gebruikt.
// Zo werkt uploaden direct, ook zolang de Storage-regels nog niet via CI kunnen worden uitgerold.
const CHUNK_COLLECTION='shopMailConfig', CHUNK_TYPE='snazzleAudioChunk';
const MAX_AUDIO_BYTES=60*1024*1024;
const MAX_FALLBACK_AUDIO_BYTES=30*1024*1024;
const MAX_IMAGE_BYTES=8*1024*1024;
const AUDIO_CHUNK_BYTES=640*1024;
const STORAGE_STALL_TIMEOUT_MS=20000;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let items=[];
let currentUser=null;
let isSuperAdmin=false;
let editingId='';
let unsubscribe=null;
let pendingImageFile=null;
let pendingAudioFile=null;
let removeCurrentImage=false;
let activeAudioObjectUrl='';

function injectStyle(){
  if($('#snListenV63Style')) return;
  const s=document.createElement('style');
  s.id='snListenV63Style';
  s.textContent=`
  #snListenSheet{z-index:185!important}
  #snListenSheet .sn-listen-panel{padding:0 0 28px!important;background:linear-gradient(180deg,#fff0bd,#e7c777)!important;color:#302317!important}
  .sn-listen-top{position:sticky;top:0;z-index:8;display:grid;grid-template-columns:48px 1fr 48px;align-items:center;gap:8px;padding:12px 13px;background:linear-gradient(180deg,#164d3b,#0d392e);color:#fff7de;border-bottom:3px solid #b88b43}
  .sn-listen-top button{width:44px;height:44px;border:0;border-radius:13px;background:#765039;color:white;font-size:23px;font-weight:1000}
  .sn-listen-top h2{margin:0;text-align:center;font-size:18px}.sn-listen-top small{display:block;color:#f4dd94;font-size:9px;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
  .sn-listen-intro{margin:14px;padding:15px 16px;border-radius:20px;background:linear-gradient(135deg,#6f59b9,#348474);color:white;border:3px solid #c9a65b;box-shadow:0 5px 0 #73502f}
  .sn-listen-intro strong{display:block;font-size:20px}.sn-listen-intro p{margin:5px 0 0;font-size:12px;line-height:1.45;font-weight:760}
  .sn-listen-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;padding:0 14px 14px}
  .sn-listen-card{border:0;border-radius:20px;overflow:hidden;background:#fff8e5;color:#392819;text-align:left;box-shadow:0 5px 0 #9d794c,0 8px 18px rgba(0,0,0,.12);padding:0;min-width:0}
  .sn-listen-cover{height:138px;background:linear-gradient(145deg,#65aa72,#4d77a5);display:grid;place-items:center;overflow:hidden;font-size:52px}
  .sn-listen-cover img{width:100%;height:100%;object-fit:cover;display:block}
  .sn-listen-copy{padding:11px}.sn-listen-copy small{display:block;color:#7d5e39;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.6px}.sn-listen-copy strong{display:block;margin-top:4px;font-size:14px;line-height:1.2}.sn-listen-copy span{display:block;margin-top:7px;color:#2c715a;font-size:10px;font-weight:1000}
  .sn-listen-empty{margin:0 14px;padding:22px;border-radius:18px;background:#fff8e8;border:2px dashed #b99660;text-align:center;font-weight:850;color:#674a2c}
  .sn-listen-player{display:none;margin:0 14px 15px;padding:14px;border-radius:20px;background:#fff9ea;border:3px solid #b98e53;box-shadow:0 5px 0 #8a663d}
  .sn-listen-player.show{display:block}.sn-listen-player img{width:100%;max-height:210px;object-fit:cover;border-radius:15px;margin-bottom:10px}.sn-listen-player h3{margin:0 0 4px;font-size:20px}.sn-listen-player p{margin:0 0 10px;color:#705337;font-size:11px;font-weight:750}.sn-listen-player audio{width:100%}.sn-listen-player .sn-listen-stop{width:100%;margin-top:10px;border:0;border-radius:13px;padding:11px;background:#6c5038;color:white;font-weight:950}.sn-listen-loading{padding:14px;border-radius:13px;background:#e8f0d8;color:#405b32;font-size:11px;font-weight:900;text-align:center}
  .sn-listen-admin{margin-top:14px;padding:13px;border-radius:17px;background:#e8f1dc;border:2px solid #a4b579;color:#344127}.sn-listen-admin h3,.sn-listen-admin h4{margin:0 0 6px}.sn-listen-admin-note{font-size:10px;font-weight:760;line-height:1.45;margin-bottom:10px}.sn-listen-admin-list{display:grid;gap:8px;margin:10px 0}.sn-listen-admin-row{padding:10px;border-radius:13px;background:#fffaf0;border:1px solid #bca878}.sn-listen-admin-row strong{display:block}.sn-listen-admin-row small{display:block;color:#6b5b45;margin-top:2px}.sn-listen-admin-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}.sn-listen-admin-actions button{border:0;border-radius:10px;padding:8px;font-weight:900;background:#497c55;color:white}.sn-listen-admin-actions button:last-child{background:#8a5143}
  .sn-listen-file{display:block;margin:10px 0;padding:11px;border-radius:13px;background:#fffaf0;border:1px solid #bda77c}.sn-listen-file b{display:block;margin-bottom:5px}.sn-listen-file input{width:100%;font-size:12px}.sn-listen-current{display:flex;align-items:center;gap:9px;margin-top:7px;font-size:10px;font-weight:800;color:#5d543f}.sn-listen-current img{width:54px;height:54px;object-fit:cover;border-radius:10px;border:1px solid #aa9569}.sn-listen-progress{min-height:34px;margin:10px 0;padding:9px 10px;border-radius:11px;background:#dceccf;color:#34502e;font-size:10px;font-weight:850;line-height:1.35}.sn-listen-progress.error{background:#ffd7cf;color:#842d24}.sn-listen-editor-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sn-listen-editor-actions button{min-height:44px}.sn-listen-clear{margin-top:7px!important}
  @media(max-width:360px){.sn-listen-grid{grid-template-columns:1fr}.sn-listen-cover{height:160px}.sn-listen-editor-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function ensureSheet(){
  if($('#snListenSheet')) return;
  const sheet=document.createElement('div');
  sheet.className='sheet';sheet.id='snListenSheet';sheet.setAttribute('aria-hidden','true');
  sheet.innerHTML=`<div class="panel sn-listen-panel"><div class="sn-listen-top"><button type="button" id="snListenClose" aria-label="Luisterverhalen sluiten">×</button><h2>Snazzle Luisterverhalen<small>tik • luister • droom mee</small></h2><div></div></div><section class="sn-listen-intro"><strong>🎧 Kies een verhaal</strong><p>Tik op een afbeelding en luister naar het avontuur. Pauzeren en verder luisteren kan met de speler.</p></section><section class="sn-listen-player" id="snListenPlayer"></section><div class="sn-listen-grid" id="snListenGrid"></div><div class="sn-listen-empty" id="snListenEmpty">De eerste Snazzle luisterverhalen komen hier te staan. 🎙️🦆</div></div>`;
  document.body.appendChild(sheet);$('#snListenClose').onclick=closeSheet;sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet();});
}
function revokeAudioObjectUrl(){if(activeAudioObjectUrl){try{URL.revokeObjectURL(activeAudioObjectUrl);}catch{}activeAudioObjectUrl='';}}
function openSheet(){ensureSheet();renderStories();const s=$('#snListenSheet');s.classList.add('show');s.setAttribute('aria-hidden','false');s.querySelector('.panel').scrollTop=0;}
function closeSheet(){const a=$('#snListenPlayer audio');if(a){try{a.pause();}catch{}}revokeAudioObjectUrl();const s=$('#snListenSheet');s?.classList.remove('show');s?.setAttribute('aria-hidden','true');}
function hasAudio(item){return !!(item?.audioUrl||(item?.audioMode==='firestore'&&item?.audioReady&&Number(item?.audioChunkCount)>0));}

async function loadFallbackAudio(item){
  const count=Math.max(0,Number(item.audioChunkCount)||0),version=String(item.audioVersion||'');
  if(!count||!version)throw new Error('Dit luisterverhaal is nog niet compleet opgeslagen.');
  const reads=[];
  for(let i=0;i<count;i++)reads.push(getDoc(doc(db,CHUNK_COLLECTION,`${item.id}_${version}_${i}`)));
  const snaps=await Promise.all(reads),parts=[];
  snaps.forEach((s,i)=>{if(!s.exists())throw new Error(`Audiodeel ${i+1} ontbreekt.`);const data=s.data();if(data.contentType!==CHUNK_TYPE||data.storyId!==item.id||data.version!==version)throw new Error('Audiobestand klopt niet meer.');parts.push(data.bytes.toUint8Array());});
  return new Blob(parts,{type:'audio/mpeg'});
}
async function playStory(item){
  ensureSheet();revokeAudioObjectUrl();
  const box=$('#snListenPlayer'),image=item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.title)}">`:'';
  box.classList.add('show');box.innerHTML=`${image}<h3>${esc(item.title)}</h3><p>${esc(item.theme||'Snazzle verhaal')}</p><div class="sn-listen-loading">🎧 Verhaal wordt klaargezet…</div>`;box.scrollIntoView({behavior:'smooth',block:'start'});
  try{
    let src=item.audioUrl||'';
    if(!src&&item.audioMode==='firestore'){
      const blob=await loadFallbackAudio(item);activeAudioObjectUrl=URL.createObjectURL(blob);src=activeAudioObjectUrl;
    }
    if(!src)throw new Error('Er is nog geen MP3 gekoppeld.');
    box.innerHTML=`${image}<h3>${esc(item.title)}</h3><p>${esc(item.theme||'Snazzle verhaal')}</p><audio id="snListenAudio" controls preload="metadata" src="${esc(src)}"></audio><button type="button" class="sn-listen-stop" id="snListenStop">■ Stop verhaal</button>`;
    $('#snListenStop').onclick=()=>{const a=$('#snListenAudio');if(a){a.pause();a.currentTime=0;}box.classList.remove('show');revokeAudioObjectUrl();};
    $('#snListenAudio')?.play?.().catch(()=>{});
  }catch(e){console.error('Snazzle luisterverhaal laden',e);box.innerHTML=`${image}<h3>${esc(item.title)}</h3><div class="sn-listen-loading">Dit verhaal kon niet worden geladen. Probeer het nog eens.</div>`;}
}
function renderStories(){
  ensureSheet();const grid=$('#snListenGrid'),empty=$('#snListenEmpty');grid.innerHTML='';
  const visible=items.filter(x=>x.enabled!==false&&hasAudio(x)).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));empty.style.display=visible.length?'none':'block';
  visible.forEach(item=>{const b=document.createElement('button');b.type='button';b.className='sn-listen-card';b.setAttribute('aria-label',`Luister naar ${item.title||'verhaal'}`);b.innerHTML=`<div class="sn-listen-cover">${item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="">`:'🎧'}</div><div class="sn-listen-copy"><small>${esc(item.theme||'Luisterverhaal')}</small><strong>${esc(item.title||'Snazzle verhaal')}</strong><span>▶ Tik om te luisteren</span></div>`;b.onclick=()=>playStory(item);grid.appendChild(b);});
}

function installMenuButton(){
  const list=$('#quickMenuPanel .quick-menu-list');if(!list||$('#snListenMenuV63'))return;
  const b=document.createElement('button');b.type='button';b.id='snListenMenuV63';b.innerHTML='<b>🎧</b><span><strong>Luisterverhalen</strong><small>Kies een verhaal en luister</small></span><i>›</i>';b.onclick=e=>{e.preventDefault();e.stopPropagation();try{$('#quickMenuClose')?.click();}catch{}setTimeout(openSheet,70);};
  const game=$('#snazzleGameMenuV62');if(game?.nextSibling)list.insertBefore(b,game.nextSibling);else if(game)list.appendChild(b);else list.appendChild(b);
}

function adminSectionMarkup(){return `<h3>🎧 Snazzle Luisterverhalen</h3><div class="sn-listen-admin-note">Voeg hier zelf luisterverhalen toe. Kies een afbeelding en een MP3 rechtstreeks vanaf je telefoon of computer en druk op Opslaan.</div><div class="sn-listen-admin-list" id="snListenAdminList"></div><button type="button" class="save" id="snListenNew">+ Nieuw luisterverhaal</button><div id="snListenEditor" hidden></div>`;}
function selectAdminSection(tab,section){$$('#adminSheet [data-tab],#adminSheet [data-news-tab],#adminSheet [data-sn47-tab-admin],#adminSheet [data-sn-listen-tab]').forEach(b=>b.classList.remove('on'));$$('#adminSheet .admin-section').forEach(s=>s.classList.remove('on'));tab.classList.add('on');section.classList.add('on');renderAdmin();}
function ensureAdminUI(){
  if(!isSuperAdmin||$('#snListenAdminV63'))return;const superOnly=$('#adminSheet .super-only'),tabs=$('#adminSheet .super-only .tabs');
  if(superOnly&&tabs){const tab=document.createElement('button');tab.type='button';tab.dataset.snListenTab='snListenAdminV63';tab.textContent='Luister 🎧';tabs.appendChild(tab);const section=document.createElement('section');section.className='admin-section sn-listen-admin';section.id='snListenAdminV63';section.innerHTML=adminSectionMarkup();superOnly.appendChild(section);tab.onclick=()=>selectAdminSection(tab,section);}else{const host=$('#sn47Admin');if(!host)return;const section=document.createElement('section');section.className='sn-listen-admin';section.id='snListenAdminV63';section.innerHTML=adminSectionMarkup();host.appendChild(section);}
  $('#snListenNew').onclick=()=>openEditor('');renderAdmin();
}
function renderAdmin(){
  if(!isSuperAdmin||!$('#snListenAdminList'))return;const list=$('#snListenAdminList');list.innerHTML='';const real=items.slice().sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  if(!real.length)list.innerHTML='<div class="sn-listen-admin-row"><strong>Nog geen verhalen</strong><small>Tik op “Nieuw luisterverhaal” om te beginnen.</small></div>';
  real.forEach(item=>{const r=document.createElement('div');r.className='sn-listen-admin-row';r.innerHTML=`<strong>${esc(item.title||'Luisterverhaal')}</strong><small>${esc(item.theme||'Geen thema')} · ${item.enabled===false?'verborgen':'zichtbaar'} · ${hasAudio(item)?'MP3 klaar':'geen MP3'}</small><div class="sn-listen-admin-actions"><button type="button" data-edit="${item.id}">Bewerken</button><button type="button" data-delete="${item.id}">Verwijderen</button></div>`;r.querySelector('[data-edit]').onclick=()=>openEditor(item.id);r.querySelector('[data-delete]').onclick=()=>removeItem(item.id);list.appendChild(r);});
}
function setEditorProgress(text,error=false){const p=$('#snListenProgress');if(!p)return;p.textContent=text;p.classList.toggle('error',error);}
function openEditor(id){
  editingId=id;pendingImageFile=null;pendingAudioFile=null;removeCurrentImage=false;const item=items.find(x=>x.id===id)||{},ed=$('#snListenEditor');if(!ed)return;ed.hidden=false;
  const currentImage=item.imageUrl?`<div class="sn-listen-current" id="snListenCurrentImage"><img src="${esc(item.imageUrl)}" alt=""><span>Huidige afbeelding blijft staan als je geen nieuwe kiest.</span></div><button type="button" class="secondary sn-listen-clear" id="snListenRemoveImage">Huidige afbeelding verwijderen</button>`:'<div class="sn-listen-current" id="snListenCurrentImage"><span>Nog geen afbeelding.</span></div>';
  const currentAudio=hasAudio(item)?'<div class="sn-listen-current"><span>✓ Huidige MP3 blijft staan als je geen nieuwe kiest.</span></div>':'<div class="sn-listen-current"><span>Nog geen MP3 gekozen.</span></div>';
  ed.innerHTML=`<h4>${id?'Luisterverhaal bewerken':'Nieuw luisterverhaal'}</h4><div class="field"><label>Titel</label><input id="snListenTitle" maxlength="100" value="${esc(item.title||'')}"></div><div class="field"><label>Thema</label><input id="snListenTheme" maxlength="60" placeholder="Bijv. Halloween, Middeleeuwen, Kerst" value="${esc(item.theme||'')}"></div><label class="sn-listen-file"><b>🖼️ Afbeelding kiezen</b><input id="snListenImageFile" type="file" accept="image/*">${currentImage}</label><label class="sn-listen-file"><b>🎧 MP3 kiezen</b><input id="snListenAudioFile" type="file" accept=".mp3,audio/mpeg,audio/mp3">${currentAudio}</label><label style="display:flex;gap:8px;align-items:center;margin:10px 0;font-weight:900"><input id="snListenEnabled" type="checkbox" ${item.enabled!==false?'checked':''}> Zichtbaar in de app</label><div id="snListenProgress" class="sn-listen-progress">${id?'Kies alleen nieuwe bestanden als je ze wilt vervangen.':'Kies een MP3; een afbeelding is optioneel.'}</div><div class="sn-listen-editor-actions"><button type="button" class="save" id="snListenSave">Opslaan</button><button type="button" class="secondary" id="snListenCancel">Annuleren</button></div>`;
  $('#snListenImageFile').onchange=e=>{pendingImageFile=e.target.files?.[0]||null;removeCurrentImage=false;if(pendingImageFile)setEditorProgress(`Afbeelding gekozen: ${pendingImageFile.name}`);};$('#snListenAudioFile').onchange=e=>{pendingAudioFile=e.target.files?.[0]||null;if(pendingAudioFile)setEditorProgress(`MP3 gekozen: ${pendingAudioFile.name}`);};
  if($('#snListenRemoveImage'))$('#snListenRemoveImage').onclick=e=>{e.preventDefault();removeCurrentImage=true;pendingImageFile=null;$('#snListenImageFile').value='';const c=$('#snListenCurrentImage');if(c)c.innerHTML='<span>Afbeelding wordt verwijderd bij opslaan.</span>';setEditorProgress('Huidige afbeelding wordt verwijderd.');};
  $('#snListenCancel').onclick=()=>{ed.hidden=true;};$('#snListenSave').onclick=saveItem;ed.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function extensionOf(file,fallback){const m=String(file?.name||'').toLowerCase().match(/\.([a-z0-9]{2,5})$/);return(m?.[1]||fallback).replace(/[^a-z0-9]/g,'');}
function uniquePath(kind,file,fallbackExt){const ext=extensionOf(file,fallbackExt),id=`${Date.now()}-${Math.random().toString(36).slice(2,9)}`;return`listen-stories/${kind}/${currentUser.uid}/${id}.${ext}`;}
function validateImage(file){if(!file)return;if(!file.type?.startsWith('image/'))throw new Error('Kies een geldige afbeelding.');if(file.size>MAX_IMAGE_BYTES)throw new Error('De afbeelding is te groot. Maximaal 8 MB.');}
function validateAudio(file){if(!file)return;const mp3=/\.mp3$/i.test(file.name||'')||['audio/mpeg','audio/mp3'].includes(file.type);if(!mp3)throw new Error('Kies een MP3-bestand.');if(file.size>MAX_AUDIO_BYTES)throw new Error('De MP3 is te groot. Maximaal 60 MB.');}
async function uploadImageStorage(file){validateImage(file);const path=uniquePath('images',file,'jpg'),ref=storageRef(storage,path),snap=await uploadBytes(ref,file,{contentType:file.type||'image/jpeg',cacheControl:'public,max-age=3600'});return{mode:'storage',path,url:await getDownloadURL(snap.ref)};}
function uploadAudioStorage(file,onProgress){
  validateAudio(file);
  const path=uniquePath('audio',file,'mp3'),ref=storageRef(storage,path);
  return new Promise((resolve,reject)=>{
    const task=uploadBytesResumable(ref,file,{contentType:'audio/mpeg',cacheControl:'public,max-age=3600'});
    let settled=false,lastActivity=Date.now();
    const stopWatchdog=()=>clearInterval(watchdog);
    const finish=(fn,value)=>{if(settled)return;settled=true;stopWatchdog();fn(value);};
    const watchdog=setInterval(()=>{
      if(settled)return;
      if(Date.now()-lastActivity<STORAGE_STALL_TIMEOUT_MS)return;
      try{task.cancel();}catch{}
      const err=new Error('De Firebase-upload bleef hangen. De app schakelt over op reserve-opslag.');
      err.code='storage/upload-timeout';
      finish(reject,err);
    },2000);
    task.on('state_changed',snap=>{
      lastActivity=Date.now();
      const pct=snap.totalBytes?Math.round(snap.bytesTransferred/snap.totalBytes*100):0;
      onProgress?.(pct);
    },err=>finish(reject,err),async()=>{
      try{finish(resolve,{mode:'storage',path,url:await getDownloadURL(task.snapshot.ref)});}
      catch(e){finish(reject,e);}
    });
  });
}
async function deleteStoragePath(path){if(!path)return;try{await deleteObject(storageRef(storage,path));}catch(e){if(e?.code!=='storage/object-not-found')console.warn('Snazzle luisterbestand verwijderen',e);}}

async function compressImageFallback(file,max=760,quality=.7,maxChars=190000){
  validateImage(file);const data=await new Promise((res,rej)=>{const r=new FileReader();r.onerror=()=>rej(new Error('Afbeelding kon niet worden gelezen.'));r.onload=()=>res(r.result);r.readAsDataURL(file);});const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Afbeelding kon niet worden geopend.'));i.src=data;});let limit=max,q=quality;
  for(let n=0;n<7;n++){const scale=Math.min(1,limit/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);const out=c.toDataURL('image/jpeg',q);if(out.length<=maxChars)return out;limit=Math.round(limit*.82);q=Math.max(.35,q-.07);}throw new Error('De afbeelding blijft te groot. Kies een andere afbeelding.');
}
function fallbackChunkId(storyId,version,index){return`${storyId}_${version}_${index}`;}
async function uploadAudioFallback(file,storyId,onProgress){
  validateAudio(file);if(file.size>MAX_FALLBACK_AUDIO_BYTES)throw new Error('Deze MP3 is groter dan 30 MB. Kies voorlopig een kleinere MP3.');
  const version=`v${Date.now()}${Math.random().toString(36).slice(2,7)}`,bytes=new Uint8Array(await file.arrayBuffer()),count=Math.ceil(bytes.length/AUDIO_CHUNK_BYTES);let done=0;
  for(let start=0;start<count;start+=8){const batch=writeBatch(db),end=Math.min(count,start+8);for(let i=start;i<end;i++){const a=i*AUDIO_CHUNK_BYTES,b=Math.min(bytes.length,a+AUDIO_CHUNK_BYTES),part=bytes.slice(a,b);batch.set(doc(db,CHUNK_COLLECTION,fallbackChunkId(storyId,version,i)),{contentType:CHUNK_TYPE,storyId,version,index:i,bytes:Bytes.fromUint8Array(part),createdAt:new Date().toISOString()});}await batch.commit();done=end;onProgress?.(Math.round(done/count*100));}
  return{mode:'firestore',version,chunkCount:count,size:file.size};
}
async function deleteFallbackAudio(storyId,version,count){
  if(!storyId||!version)return;let total=Math.max(0,Number(count)||0);
  if(!total){try{const snap=await getDocs(query(collection(db,CHUNK_COLLECTION),where('storyId','==',storyId)));const docs=snap.docs.filter(d=>d.data()?.contentType===CHUNK_TYPE&&d.data()?.version===version);for(let i=0;i<docs.length;i+=100){const batch=writeBatch(db);docs.slice(i,i+100).forEach(d=>batch.delete(d.ref));await batch.commit();}}catch(e){console.warn('oude luisterblokken verwijderen',e);}return;}
  for(let start=0;start<total;start+=100){const batch=writeBatch(db),end=Math.min(total,start+100);for(let i=start;i<end;i++)batch.delete(doc(db,CHUNK_COLLECTION,fallbackChunkId(storyId,version,i)));try{await batch.commit();}catch(e){console.warn('oude luisterblokken verwijderen',e);}}
}
function storageUnavailable(err){return String(err?.code||err?.message||'').toLowerCase().includes('storage/');}

async function saveItem(){
  if(!isSuperAdmin||!currentUser)return;const title=$('#snListenTitle')?.value.trim()||'';if(title.length<2)return setEditorProgress('Vul eerst een titel in.',true);const existing=items.find(x=>x.id===editingId)||null;if(!hasAudio(existing)&&!pendingAudioFile)return setEditorProgress('Kies eerst een MP3-bestand.',true);
  try{validateImage(pendingImageFile);validateAudio(pendingAudioFile);}catch(e){return setEditorProgress(e.message,true);}
  const storyId=editingId||doc(collection(db,COLLECTION)).id,save=$('#snListenSave');save.disabled=true;save.textContent='Bezig…';let newImage=null,newAudio=null;
  try{
    if(pendingImageFile){setEditorProgress('Afbeelding uploaden…');try{newImage=await uploadImageStorage(pendingImageFile);}catch(e){if(!storageUnavailable(e))throw e;setEditorProgress('Afbeelding wordt centraal opgeslagen…');newImage={mode:'firestore',path:'',url:await compressImageFallback(pendingImageFile)};}}
    if(pendingAudioFile){setEditorProgress('MP3 uploaden… 0%');try{newAudio=await uploadAudioStorage(pendingAudioFile,p=>setEditorProgress(`MP3 uploaden… ${p}%`));}catch(e){if(!storageUnavailable(e))throw e;setEditorProgress('MP3 wordt centraal opgeslagen… 0%');newAudio=await uploadAudioFallback(pendingAudioFile,storyId,p=>setEditorProgress(`MP3 wordt centraal opgeslagen… ${p}%`));}}

    const newMode=newAudio?.mode||existing?.audioMode||(existing?.audioUrl?'storage':'');
    const payload={contentType:TYPE,name:`Luisterverhaal ${title}`,title,theme:$('#snListenTheme')?.value.trim()||'',imageUrl:newImage?.url||(removeCurrentImage?'':existing?.imageUrl||''),imagePath:newImage?.path||(removeCurrentImage?'':existing?.imagePath||''),audioMode:newMode,audioReady:newAudio?true:(existing?.audioReady!==false),audioUrl:newAudio?.mode==='storage'?newAudio.url:(newAudio?.mode==='firestore'?'':existing?.audioUrl||''),audioPath:newAudio?.mode==='storage'?newAudio.path:(newAudio?.mode==='firestore'?'':existing?.audioPath||''),audioVersion:newAudio?.mode==='firestore'?newAudio.version:(newAudio?.mode==='storage'?'':existing?.audioVersion||''),audioChunkCount:newAudio?.mode==='firestore'?newAudio.chunkCount:(newAudio?.mode==='storage'?0:Number(existing?.audioChunkCount)||0),audioSize:newAudio?.size||pendingAudioFile?.size||Number(existing?.audioSize)||0,enabled:$('#snListenEnabled')?.checked!==false,active:false,order:existing?Number(existing.order)||0:items.length,updatedAt:new Date().toISOString(),createdAt:existing?.createdAt||new Date().toISOString()};
    await setDoc(doc(db,COLLECTION,storyId),payload,{merge:false});

    if((newImage||removeCurrentImage)&&existing?.imagePath)await deleteStoragePath(existing.imagePath);
    if(newAudio&&existing?.audioPath)await deleteStoragePath(existing.audioPath);
    if(newAudio&&existing?.audioMode==='firestore'&&existing?.audioVersion)await deleteFallbackAudio(existing.id,existing.audioVersion,existing.audioChunkCount);
    setEditorProgress('Luisterverhaal opgeslagen ✓');setTimeout(()=>{if($('#snListenEditor'))$('#snListenEditor').hidden=true;},450);
  }catch(e){
    console.error('Snazzle luisterverhaal opslaan',e);if(newImage?.mode==='storage'&&newImage.path)await deleteStoragePath(newImage.path);if(newAudio?.mode==='storage'&&newAudio.path)await deleteStoragePath(newAudio.path);if(newAudio?.mode==='firestore')await deleteFallbackAudio(storyId,newAudio.version,newAudio.chunkCount);setEditorProgress(e?.message||'Opslaan lukte niet.',true);
  }finally{if(save){save.disabled=false;save.textContent='Opslaan';}}
}
async function removeItem(id){
  if(!isSuperAdmin||!confirm('Dit luisterverhaal verwijderen?'))return;const item=items.find(x=>x.id===id);try{await deleteDoc(doc(db,COLLECTION,id));await deleteStoragePath(item?.audioPath);await deleteStoragePath(item?.imagePath);if(item?.audioMode==='firestore')await deleteFallbackAudio(id,item.audioVersion,item.audioChunkCount);}catch(e){console.error(e);alert('Verwijderen lukte niet.');}
}

function startListener(){if(unsubscribe)return;unsubscribe=onSnapshot(query(collection(db,COLLECTION),where('contentType','==',TYPE)),snap=>{items=snap.docs.map(d=>({id:d.id,...d.data()}));renderStories();renderAdmin();},e=>console.warn('Snazzle luisterverhalen laden',e));}
async function resolveRole(user){isSuperAdmin=false;if(!user||user.isAnonymous)return;try{const s=await getDoc(doc(db,'adminUsers',user.uid));isSuperAdmin=s.exists()&&s.data()?.active===true&&s.data()?.role==='superadmin';}catch(e){console.warn('Snazzle luister beheerrol',e);}}
function observeMounts(){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;installMenuButton();ensureAdminUI();});}).observe(document.body,{childList:true,subtree:true});}

onAuthStateChanged(auth,async user=>{currentUser=user;if(!user)return;startListener();await resolveRole(user);ensureAdminUI();renderAdmin();});
injectStyle();ensureSheet();installMenuButton();observeMounts();
window.SnazzleListenStoriesV63={open:openSheet};