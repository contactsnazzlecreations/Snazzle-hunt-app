// Snazzle v63 — luisterverhalen met directe MP3- en afbeeldingsupload.
// Publiek: duidelijke knop in het gewone menu + themakaarten met audiospeler.
// Beheer: hoofdbeheerder kiest rechtstreeks een afbeelding en MP3 vanaf telefoon/computer.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import {
  getStorage, ref as storageRef, uploadBytes, uploadBytesResumable,
  getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const app=getApp(), auth=getAuth(app), db=getFirestore(app), storage=getStorage(app);
const COLLECTION='villages', TYPE='snazzleAudioStory';
const MAX_AUDIO_BYTES=60*1024*1024;
const MAX_IMAGE_BYTES=8*1024*1024;
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
  .sn-listen-player.show{display:block}.sn-listen-player img{width:100%;max-height:210px;object-fit:cover;border-radius:15px;margin-bottom:10px}.sn-listen-player h3{margin:0 0 4px;font-size:20px}.sn-listen-player p{margin:0 0 10px;color:#705337;font-size:11px;font-weight:750}.sn-listen-player audio{width:100%}.sn-listen-player .sn-listen-stop{width:100%;margin-top:10px;border:0;border-radius:13px;padding:11px;background:#6c5038;color:white;font-weight:950}
  .sn-listen-admin{margin-top:14px;padding:13px;border-radius:17px;background:#e8f1dc;border:2px solid #a4b579;color:#344127}.sn-listen-admin h3,.sn-listen-admin h4{margin:0 0 6px}.sn-listen-admin-note{font-size:10px;font-weight:760;line-height:1.45;margin-bottom:10px}.sn-listen-admin-list{display:grid;gap:8px;margin:10px 0}.sn-listen-admin-row{padding:10px;border-radius:13px;background:#fffaf0;border:1px solid #bca878}.sn-listen-admin-row strong{display:block}.sn-listen-admin-row small{display:block;color:#6b5b45;margin-top:2px}.sn-listen-admin-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}.sn-listen-admin-actions button{border:0;border-radius:10px;padding:8px;font-weight:900;background:#497c55;color:white}.sn-listen-admin-actions button:last-child{background:#8a5143}
  .sn-listen-file{display:block;margin:10px 0;padding:11px;border-radius:13px;background:#fffaf0;border:1px solid #bda77c}.sn-listen-file b{display:block;margin-bottom:5px}.sn-listen-file input{width:100%;font-size:12px}.sn-listen-current{display:flex;align-items:center;gap:9px;margin-top:7px;font-size:10px;font-weight:800;color:#5d543f}.sn-listen-current img{width:54px;height:54px;object-fit:cover;border-radius:10px;border:1px solid #aa9569}.sn-listen-progress{min-height:34px;margin:10px 0;padding:9px 10px;border-radius:11px;background:#dceccf;color:#34502e;font-size:10px;font-weight:850;line-height:1.35}.sn-listen-progress.error{background:#ffd7cf;color:#842d24}.sn-listen-editor-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sn-listen-editor-actions button{min-height:44px}.sn-listen-clear{margin-top:7px!important}
  @media(max-width:360px){.sn-listen-grid{grid-template-columns:1fr}.sn-listen-cover{height:160px}.sn-listen-editor-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function ensureSheet(){
  if($('#snListenSheet')) return;
  const sheet=document.createElement('div');
  sheet.className='sheet';
  sheet.id='snListenSheet';
  sheet.setAttribute('aria-hidden','true');
  sheet.innerHTML=`<div class="panel sn-listen-panel"><div class="sn-listen-top"><button type="button" id="snListenClose" aria-label="Luisterverhalen sluiten">×</button><h2>Snazzle Luisterverhalen<small>tik • luister • droom mee</small></h2><div></div></div><section class="sn-listen-intro"><strong>🎧 Kies een verhaal</strong><p>Tik op een afbeelding en luister naar het avontuur. Pauzeren en verder luisteren kan met de speler.</p></section><section class="sn-listen-player" id="snListenPlayer"></section><div class="sn-listen-grid" id="snListenGrid"></div><div class="sn-listen-empty" id="snListenEmpty">De eerste Snazzle luisterverhalen komen hier te staan. 🎙️🦆</div></div>`;
  document.body.appendChild(sheet);
  $('#snListenClose').onclick=closeSheet;
  sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet();});
}

function openSheet(){
  ensureSheet();renderStories();
  const s=$('#snListenSheet');s.classList.add('show');s.setAttribute('aria-hidden','false');
  s.querySelector('.panel').scrollTop=0;
}
function closeSheet(){
  const a=$('#snListenPlayer audio');if(a){try{a.pause();}catch{}}
  const s=$('#snListenSheet');s?.classList.remove('show');s?.setAttribute('aria-hidden','true');
}
function playStory(item){
  ensureSheet();
  const box=$('#snListenPlayer');
  const image=item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.title)}">`:'';
  box.innerHTML=`${image}<h3>${esc(item.title)}</h3><p>${esc(item.theme||'Snazzle verhaal')}</p><audio id="snListenAudio" controls preload="metadata" src="${esc(item.audioUrl||'')}"></audio><button type="button" class="sn-listen-stop" id="snListenStop">■ Stop verhaal</button>`;
  box.classList.add('show');
  $('#snListenStop').onclick=()=>{const a=$('#snListenAudio');if(a){a.pause();a.currentTime=0;}box.classList.remove('show');};
  $('#snListenAudio')?.play?.().catch(()=>{});
  box.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderStories(){
  ensureSheet();
  const grid=$('#snListenGrid'),empty=$('#snListenEmpty');grid.innerHTML='';
  const visible=items.filter(x=>x.enabled!==false&&x.audioUrl).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  empty.style.display=visible.length?'none':'block';
  visible.forEach(item=>{
    const b=document.createElement('button');b.type='button';b.className='sn-listen-card';b.setAttribute('aria-label',`Luister naar ${item.title||'verhaal'}`);
    b.innerHTML=`<div class="sn-listen-cover">${item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="">`:'🎧'}</div><div class="sn-listen-copy"><small>${esc(item.theme||'Luisterverhaal')}</small><strong>${esc(item.title||'Snazzle verhaal')}</strong><span>▶ Tik om te luisteren</span></div>`;
    b.onclick=()=>playStory(item);grid.appendChild(b);
  });
}

function installMenuButton(){
  const list=$('#quickMenuPanel .quick-menu-list');if(!list||$('#snListenMenuV63'))return;
  const b=document.createElement('button');b.type='button';b.id='snListenMenuV63';
  b.innerHTML='<b>🎧</b><span><strong>Luisterverhalen</strong><small>Kies een verhaal en luister</small></span><i>›</i>';
  b.onclick=e=>{e.preventDefault();e.stopPropagation();try{$('#quickMenuClose')?.click();}catch{}setTimeout(openSheet,70);};
  const game=$('#snazzleGameMenuV62');if(game?.nextSibling)list.insertBefore(b,game.nextSibling);else if(game)list.appendChild(b);else list.appendChild(b);
}

function adminSectionMarkup(){
  return `<h3>🎧 Snazzle Luisterverhalen</h3><div class="sn-listen-admin-note">Voeg hier zelf luisterverhalen toe. Kies een afbeelding en een MP3 rechtstreeks vanaf je telefoon of computer; Snazzle slaat ze centraal op.</div><div class="sn-listen-admin-list" id="snListenAdminList"></div><button type="button" class="save" id="snListenNew">+ Nieuw luisterverhaal</button><div id="snListenEditor" hidden></div>`;
}
function selectAdminSection(tab,section){
  $$('#adminSheet [data-tab],#adminSheet [data-news-tab],#adminSheet [data-sn47-tab-admin],#adminSheet [data-sn-listen-tab]').forEach(b=>b.classList.remove('on'));
  $$('#adminSheet .admin-section').forEach(s=>s.classList.remove('on'));
  tab.classList.add('on');section.classList.add('on');renderAdmin();
}
function ensureAdminUI(){
  if(!isSuperAdmin||$('#snListenAdminV63'))return;
  const superOnly=$('#adminSheet .super-only'),tabs=$('#adminSheet .super-only .tabs');
  if(superOnly&&tabs){
    const tab=document.createElement('button');tab.type='button';tab.dataset.snListenTab='snListenAdminV63';tab.textContent='Luister 🎧';tabs.appendChild(tab);
    const section=document.createElement('section');section.className='admin-section sn-listen-admin';section.id='snListenAdminV63';section.innerHTML=adminSectionMarkup();superOnly.appendChild(section);
    tab.onclick=()=>selectAdminSection(tab,section);
  }else{
    const host=$('#sn47Admin');if(!host)return;
    const section=document.createElement('section');section.className='sn-listen-admin';section.id='snListenAdminV63';section.innerHTML=adminSectionMarkup();host.appendChild(section);
  }
  $('#snListenNew').onclick=()=>openEditor('');renderAdmin();
}
function renderAdmin(){
  if(!isSuperAdmin||!$('#snListenAdminList'))return;
  const list=$('#snListenAdminList');list.innerHTML='';
  const real=items.slice().sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  if(!real.length)list.innerHTML='<div class="sn-listen-admin-row"><strong>Nog geen verhalen</strong><small>Tik op “Nieuw luisterverhaal” om te beginnen.</small></div>';
  real.forEach(item=>{
    const r=document.createElement('div');r.className='sn-listen-admin-row';
    r.innerHTML=`<strong>${esc(item.title||'Luisterverhaal')}</strong><small>${esc(item.theme||'Geen thema')} · ${item.enabled===false?'verborgen':'zichtbaar'} · ${item.audioUrl?'MP3 klaar':'geen MP3'}</small><div class="sn-listen-admin-actions"><button type="button" data-edit="${item.id}">Bewerken</button><button type="button" data-delete="${item.id}">Verwijderen</button></div>`;
    r.querySelector('[data-edit]').onclick=()=>openEditor(item.id);r.querySelector('[data-delete]').onclick=()=>removeItem(item.id);list.appendChild(r);
  });
}

function setEditorProgress(text,error=false){
  const p=$('#snListenProgress');if(!p)return;p.textContent=text;p.classList.toggle('error',error);
}
function openEditor(id){
  editingId=id;pendingImageFile=null;pendingAudioFile=null;removeCurrentImage=false;
  const item=items.find(x=>x.id===id)||{},ed=$('#snListenEditor');if(!ed)return;
  ed.hidden=false;
  const currentImage=item.imageUrl?`<div class="sn-listen-current" id="snListenCurrentImage"><img src="${esc(item.imageUrl)}" alt=""><span>Huidige afbeelding blijft staan als je geen nieuwe kiest.</span></div><button type="button" class="secondary sn-listen-clear" id="snListenRemoveImage">Huidige afbeelding verwijderen</button>`:'<div class="sn-listen-current" id="snListenCurrentImage"><span>Nog geen afbeelding.</span></div>';
  const currentAudio=item.audioUrl?'<div class="sn-listen-current"><span>✓ Huidige MP3 blijft staan als je geen nieuwe kiest.</span></div>':'<div class="sn-listen-current"><span>Nog geen MP3 gekozen.</span></div>';
  ed.innerHTML=`<h4>${id?'Luisterverhaal bewerken':'Nieuw luisterverhaal'}</h4><div class="field"><label>Titel</label><input id="snListenTitle" maxlength="100" value="${esc(item.title||'')}"></div><div class="field"><label>Thema</label><input id="snListenTheme" maxlength="60" placeholder="Bijv. Halloween, Middeleeuwen, Kerst" value="${esc(item.theme||'')}"></div><label class="sn-listen-file"><b>🖼️ Afbeelding kiezen</b><input id="snListenImageFile" type="file" accept="image/*">${currentImage}</label><label class="sn-listen-file"><b>🎧 MP3 kiezen</b><input id="snListenAudioFile" type="file" accept=".mp3,audio/mpeg,audio/mp3">${currentAudio}</label><label style="display:flex;gap:8px;align-items:center;margin:10px 0;font-weight:900"><input id="snListenEnabled" type="checkbox" ${item.enabled!==false?'checked':''}> Zichtbaar in de app</label><div id="snListenProgress" class="sn-listen-progress">${id?'Kies alleen nieuwe bestanden als je ze wilt vervangen.':'Kies een MP3; een afbeelding is optioneel.'}</div><div class="sn-listen-editor-actions"><button type="button" class="save" id="snListenSave">Opslaan</button><button type="button" class="secondary" id="snListenCancel">Annuleren</button></div>`;
  $('#snListenImageFile').onchange=e=>{const f=e.target.files?.[0]||null;pendingImageFile=f;removeCurrentImage=false;if(f)setEditorProgress(`Afbeelding gekozen: ${f.name}`);};
  $('#snListenAudioFile').onchange=e=>{const f=e.target.files?.[0]||null;pendingAudioFile=f;if(f)setEditorProgress(`MP3 gekozen: ${f.name}`);};
  if($('#snListenRemoveImage'))$('#snListenRemoveImage').onclick=e=>{e.preventDefault();removeCurrentImage=true;pendingImageFile=null;$('#snListenImageFile').value='';const c=$('#snListenCurrentImage');if(c)c.innerHTML='<span>Afbeelding wordt verwijderd bij opslaan.</span>';setEditorProgress('Huidige afbeelding wordt verwijderd.');};
  $('#snListenCancel').onclick=()=>{ed.hidden=true;};$('#snListenSave').onclick=saveItem;ed.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function extensionOf(file,fallback){
  const m=String(file?.name||'').toLowerCase().match(/\.([a-z0-9]{2,5})$/);return (m?.[1]||fallback).replace(/[^a-z0-9]/g,'');
}
function uniquePath(kind,file,fallbackExt){
  const ext=extensionOf(file,fallbackExt);const id=`${Date.now()}-${Math.random().toString(36).slice(2,9)}`;return `listen-stories/${kind}/${currentUser.uid}/${id}.${ext}`;
}
function validateImage(file){
  if(!file)return;if(!file.type?.startsWith('image/'))throw new Error('Kies een geldige afbeelding.');if(file.size>MAX_IMAGE_BYTES)throw new Error('De afbeelding is te groot. Maximaal 8 MB.');
}
function validateAudio(file){
  if(!file)return;const mp3=/\.mp3$/i.test(file.name||'')||['audio/mpeg','audio/mp3'].includes(file.type);if(!mp3)throw new Error('Kies een MP3-bestand.');if(file.size>MAX_AUDIO_BYTES)throw new Error('De MP3 is te groot. Maximaal 60 MB.');
}
async function uploadImage(file){
  validateImage(file);const path=uniquePath('images',file,'jpg');const ref=storageRef(storage,path);const snap=await uploadBytes(ref,file,{contentType:file.type||'image/jpeg',cacheControl:'public,max-age=3600'});return{path,url:await getDownloadURL(snap.ref)};
}
function uploadAudio(file,onProgress){
  validateAudio(file);const path=uniquePath('audio',file,'mp3');const ref=storageRef(storage,path);
  return new Promise((resolve,reject)=>{
    const task=uploadBytesResumable(ref,file,{contentType:'audio/mpeg',cacheControl:'public,max-age=3600'});
    task.on('state_changed',snap=>{const pct=snap.totalBytes?Math.round(snap.bytesTransferred/snap.totalBytes*100):0;onProgress?.(pct);},reject,async()=>{try{resolve({path,url:await getDownloadURL(task.snapshot.ref)});}catch(e){reject(e);}});
  });
}
async function deleteStoragePath(path){
  if(!path)return;try{await deleteObject(storageRef(storage,path));}catch(e){if(e?.code!=='storage/object-not-found')console.warn('Snazzle luisterbestand verwijderen',e);}
}

async function saveItem(){
  if(!isSuperAdmin||!currentUser)return;
  const title=$('#snListenTitle')?.value.trim()||'';if(title.length<2)return setEditorProgress('Vul eerst een titel in.',true);
  const existing=items.find(x=>x.id===editingId)||null;
  if(!existing?.audioUrl&&!pendingAudioFile)return setEditorProgress('Kies eerst een MP3-bestand.',true);
  try{validateImage(pendingImageFile);validateAudio(pendingAudioFile);}catch(e){return setEditorProgress(e.message,true);}

  const save=$('#snListenSave');save.disabled=true;save.textContent='Bezig…';
  let newImage=null,newAudio=null;
  try{
    if(pendingImageFile){setEditorProgress('Afbeelding uploaden…');newImage=await uploadImage(pendingImageFile);}
    if(pendingAudioFile){setEditorProgress('MP3 uploaden… 0%');newAudio=await uploadAudio(pendingAudioFile,p=>setEditorProgress(`MP3 uploaden… ${p}%`));}

    const payload={
      contentType:TYPE,name:`Luisterverhaal ${title}`,title,
      theme:$('#snListenTheme')?.value.trim()||'',
      imageUrl:newImage?.url||(removeCurrentImage?'':existing?.imageUrl||''),
      imagePath:newImage?.path||(removeCurrentImage?'':existing?.imagePath||''),
      audioUrl:newAudio?.url||existing?.audioUrl||'',
      audioPath:newAudio?.path||existing?.audioPath||'',
      enabled:$('#snListenEnabled')?.checked!==false,active:false,
      order:existing?Number(existing.order)||0:items.length,
      updatedAt:new Date().toISOString(),createdAt:existing?.createdAt||new Date().toISOString()
    };
    if(editingId)await updateDoc(doc(db,COLLECTION,editingId),payload);else await addDoc(collection(db,COLLECTION),payload);

    if(newImage&&existing?.imagePath&&existing.imagePath!==newImage.path)await deleteStoragePath(existing.imagePath);
    if((newImage||removeCurrentImage)&&removeCurrentImage&&existing?.imagePath)await deleteStoragePath(existing.imagePath);
    if(newAudio&&existing?.audioPath&&existing.audioPath!==newAudio.path)await deleteStoragePath(existing.audioPath);

    setEditorProgress('Luisterverhaal opgeslagen ✓');setTimeout(()=>{if($('#snListenEditor'))$('#snListenEditor').hidden=true;},450);
  }catch(e){
    console.error('Snazzle luisterverhaal opslaan',e);
    if(newImage?.path)await deleteStoragePath(newImage.path);if(newAudio?.path)await deleteStoragePath(newAudio.path);
    const message=/storage\/unauthorized|permission/i.test(String(e?.code||e?.message||''))?'Upload nog niet toegestaan door Firebase Storage. Probeer over een minuut opnieuw.':(e?.message||'Opslaan lukte niet.');
    setEditorProgress(message,true);
  }finally{if(save){save.disabled=false;save.textContent='Opslaan';}}
}
async function removeItem(id){
  if(!isSuperAdmin||!confirm('Dit luisterverhaal verwijderen?'))return;
  const item=items.find(x=>x.id===id);
  try{await deleteDoc(doc(db,COLLECTION,id));await Promise.all([deleteStoragePath(item?.audioPath),deleteStoragePath(item?.imagePath)]);}catch(e){console.error(e);alert('Verwijderen lukte niet.');}
}

function startListener(){
  if(unsubscribe)return;
  unsubscribe=onSnapshot(collection(db,COLLECTION),snap=>{items=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.contentType===TYPE);renderStories();renderAdmin();},e=>console.warn('Snazzle luisterverhalen laden',e));
}
async function resolveRole(user){
  isSuperAdmin=false;if(!user||user.isAnonymous)return;
  try{const s=await getDoc(doc(db,'adminUsers',user.uid));isSuperAdmin=s.exists()&&s.data()?.active===true&&s.data()?.role==='superadmin';}catch(e){console.warn('Snazzle luister beheerrol',e);}
}
function observeMounts(){
  let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;installMenuButton();ensureAdminUI();});}).observe(document.body,{childList:true,subtree:true});
}

onAuthStateChanged(auth,async user=>{currentUser=user;if(!user)return;startListener();await resolveRole(user);ensureAdminUI();renderAdmin();});
injectStyle();ensureSheet();installMenuButton();observeMounts();

window.SnazzleListenStoriesV63={open:openSheet};
