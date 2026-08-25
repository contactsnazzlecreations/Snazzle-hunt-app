// Snazzle v63 — luisterverhalen met themakaarten en MP3-speler.
// Publiek: knop in het gewone menu + kaarten waarop kinderen kunnen tikken om te luisteren.
// Beheer: hoofdbeheerder kan verhalen klaarzetten met titel, thema, afbeelding-URL en MP3-URL.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp(), auth=getAuth(app), db=getFirestore(app);
const COLLECTION='villages', TYPE='snazzleAudioStory';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let items=[];
let currentUser=null;
let isSuperAdmin=false;
let editingId='';
let unsubscribe=null;

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
  .sn-listen-admin{margin-top:16px;padding:13px;border-radius:17px;background:#e8f1dc;border:2px solid #a4b579;color:#344127}.sn-listen-admin h4{margin:0 0 5px;font-size:16px}.sn-listen-admin-note{font-size:10px;font-weight:760;line-height:1.4;margin-bottom:10px}.sn-listen-admin-list{display:grid;gap:8px;margin:10px 0}.sn-listen-admin-row{padding:10px;border-radius:13px;background:#fffaf0;border:1px solid #bca878}.sn-listen-admin-row strong{display:block}.sn-listen-admin-row small{display:block;color:#6b5b45;margin-top:2px}.sn-listen-admin-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}.sn-listen-admin-actions button{border:0;border-radius:10px;padding:8px;font-weight:900;background:#497c55;color:white}.sn-listen-admin-actions button:last-child{background:#8a5143}
  @media(max-width:360px){.sn-listen-grid{grid-template-columns:1fr}.sn-listen-cover{height:160px}}
  `;
  document.head.appendChild(s);
}

function ensureSheet(){
  if($('#snListenSheet')) return;
  const sheet=document.createElement('div');
  sheet.className='sheet';
  sheet.id='snListenSheet';
  sheet.setAttribute('aria-hidden','true');
  sheet.innerHTML=`<div class="panel sn-listen-panel"><div class="sn-listen-top"><button type="button" id="snListenClose" aria-label="Luisterverhalen sluiten">×</button><h2>Snazzle Luisterverhalen<small>tik • luister • droom mee</small></h2><div></div></div><section class="sn-listen-intro"><strong>🎧 Kies een verhaal</strong><p>Tik op een afbeelding. Daarna begint het luisterverhaal en kun je rustig meeluisteren.</p></section><section class="sn-listen-player" id="snListenPlayer"></section><div class="sn-listen-grid" id="snListenGrid"></div><div class="sn-listen-empty" id="snListenEmpty">De eerste Snazzle luisterverhalen komen hier te staan. 🎙️🦆</div></div>`;
  document.body.appendChild(sheet);
  $('#snListenClose').onclick=closeSheet;
  sheet.addEventListener('click',e=>{ if(e.target===sheet) closeSheet(); });
}

function openSheet(){
  ensureSheet();
  renderStories();
  const s=$('#snListenSheet');
  s.classList.add('show');
  s.setAttribute('aria-hidden','false');
  s.querySelector('.panel').scrollTop=0;
}
function closeSheet(){
  const a=$('#snListenPlayer audio');
  if(a){ try{a.pause();}catch{} }
  const s=$('#snListenSheet');
  s?.classList.remove('show');
  s?.setAttribute('aria-hidden','true');
}

function playStory(item){
  ensureSheet();
  const box=$('#snListenPlayer');
  const image=item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.title)}">`:'';
  box.innerHTML=`${image}<h3>${esc(item.title)}</h3><p>${esc(item.theme||'Snazzle verhaal')}</p><audio id="snListenAudio" controls preload="metadata" src="${esc(item.audioUrl||'')}"></audio><button type="button" class="sn-listen-stop" id="snListenStop">■ Stop verhaal</button>`;
  box.classList.add('show');
  $('#snListenStop').onclick=()=>{const a=$('#snListenAudio');if(a){a.pause();a.currentTime=0;}box.classList.remove('show');};
  const audio=$('#snListenAudio');
  audio?.play?.().catch(()=>{});
  box.scrollIntoView({behavior:'smooth',block:'start'});
}

function renderStories(){
  ensureSheet();
  const grid=$('#snListenGrid'), empty=$('#snListenEmpty');
  grid.innerHTML='';
  const visible=items.filter(x=>x.enabled!==false&&x.audioUrl).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  empty.style.display=visible.length?'none':'block';
  visible.forEach(item=>{
    const b=document.createElement('button');
    b.type='button';b.className='sn-listen-card';b.setAttribute('aria-label',`Luister naar ${item.title||'verhaal'}`);
    b.innerHTML=`<div class="sn-listen-cover">${item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="">`:'🎧'}</div><div class="sn-listen-copy"><small>${esc(item.theme||'Luisterverhaal')}</small><strong>${esc(item.title||'Snazzle verhaal')}</strong><span>▶ Tik om te luisteren</span></div>`;
    b.onclick=()=>playStory(item);
    grid.appendChild(b);
  });
}

function installMenuButton(){
  const list=$('#quickMenuPanel .quick-menu-list');
  if(!list||$('#snListenMenuV63')) return;
  const b=document.createElement('button');
  b.type='button';b.id='snListenMenuV63';
  b.innerHTML='<b>🎧</b><span><strong>Luisterverhalen</strong><small>Kies een verhaal en luister</small></span><i>›</i>';
  b.onclick=e=>{e.preventDefault();e.stopPropagation();try{$('#quickMenuClose')?.click();}catch{}setTimeout(openSheet,70);};
  const game=$('#snazzleGameMenuV62');
  if(game?.nextSibling) list.insertBefore(b,game.nextSibling); else if(game) list.appendChild(b); else list.appendChild(b);
}

function ensureAdminUI(){
  if(!isSuperAdmin) return;
  const host=$('#sn47Admin');
  if(!host||$('#snListenAdminV63')) return;
  const box=document.createElement('details');
  box.id='snListenAdminV63';box.className='sn-listen-admin';
  box.innerHTML=`<summary><strong>🎧 Luisterverhalen</strong></summary><div class="sn-listen-admin-note">Maak hier de kaarten klaar. Voor nu gebruik je een openbare afbeelding-URL en MP3-URL. Rechtstreeks MP3 uploaden vanuit Beheer kan daarna via Firebase Storage worden gekoppeld.</div><div class="sn-listen-admin-list" id="snListenAdminList"></div><button type="button" class="save" id="snListenNew">+ Nieuw luisterverhaal</button><div id="snListenEditor" hidden></div>`;
  host.appendChild(box);
  $('#snListenNew').onclick=()=>openEditor('');
  renderAdmin();
}

function renderAdmin(){
  if(!isSuperAdmin||!$('#snListenAdminList')) return;
  const list=$('#snListenAdminList');list.innerHTML='';
  const real=items.slice().sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  if(!real.length) list.innerHTML='<div class="sn-listen-admin-row"><strong>Nog geen verhalen</strong><small>Voeg het eerste luisterverhaal toe.</small></div>';
  real.forEach(item=>{
    const r=document.createElement('div');r.className='sn-listen-admin-row';
    r.innerHTML=`<strong>${esc(item.title||'Luisterverhaal')}</strong><small>${esc(item.theme||'')} · ${item.enabled===false?'verborgen':'zichtbaar'}</small><div class="sn-listen-admin-actions"><button type="button" data-edit="${item.id}">Bewerken</button><button type="button" data-delete="${item.id}">Verwijderen</button></div>`;
    r.querySelector('[data-edit]').onclick=()=>openEditor(item.id);
    r.querySelector('[data-delete]').onclick=()=>removeItem(item.id);
    list.appendChild(r);
  });
}

function openEditor(id){
  editingId=id;
  const item=items.find(x=>x.id===id)||{};
  const ed=$('#snListenEditor');if(!ed)return;
  ed.hidden=false;
  ed.innerHTML=`<h4>${id?'Luisterverhaal bewerken':'Nieuw luisterverhaal'}</h4><div class="field"><label>Titel</label><input id="snListenTitle" maxlength="100" value="${esc(item.title||'')}"></div><div class="field"><label>Thema</label><input id="snListenTheme" maxlength="60" placeholder="Bijv. Halloween, Middeleeuwen, Kerst" value="${esc(item.theme||'')}"></div><div class="field"><label>Afbeelding URL</label><input id="snListenImageUrl" type="url" placeholder="https://..." value="${esc(item.imageUrl||'')}"></div><div class="field"><label>MP3 URL</label><input id="snListenAudioUrl" type="url" placeholder="https://.../verhaal.mp3" value="${esc(item.audioUrl||'')}"></div><label style="display:flex;gap:8px;align-items:center;margin:10px 0;font-weight:900"><input id="snListenEnabled" type="checkbox" ${item.enabled!==false?'checked':''}> Zichtbaar in de app</label><button type="button" class="save" id="snListenSave">Opslaan</button><button type="button" class="secondary" id="snListenCancel">Annuleren</button>`;
  $('#snListenCancel').onclick=()=>{ed.hidden=true;};
  $('#snListenSave').onclick=saveItem;
  ed.scrollIntoView({behavior:'smooth',block:'nearest'});
}

async function saveItem(){
  if(!isSuperAdmin) return;
  const title=$('#snListenTitle')?.value.trim()||'';
  const audioUrl=$('#snListenAudioUrl')?.value.trim()||'';
  if(title.length<2) return alert('Vul een titel in.');
  if(audioUrl&&!/^https:\/\//i.test(audioUrl)) return alert('Gebruik een geldige https MP3-link.');
  const existing=items.find(x=>x.id===editingId);
  const payload={contentType:TYPE,name:`Luisterverhaal ${title}`,title,theme:$('#snListenTheme')?.value.trim()||'',imageUrl:$('#snListenImageUrl')?.value.trim()||'',audioUrl,enabled:$('#snListenEnabled')?.checked!==false,active:false,order:existing?Number(existing.order)||0:items.length,updatedAt:new Date().toISOString(),createdAt:existing?.createdAt||new Date().toISOString()};
  try{
    $('#snListenSave').disabled=true;
    if(editingId) await updateDoc(doc(db,COLLECTION,editingId),payload); else await addDoc(collection(db,COLLECTION),payload);
    $('#snListenEditor').hidden=true;
  }catch(e){console.error(e);alert('Opslaan lukte niet.');}
  finally{if($('#snListenSave'))$('#snListenSave').disabled=false;}
}
async function removeItem(id){
  if(!isSuperAdmin||!confirm('Dit luisterverhaal verwijderen?')) return;
  try{await deleteDoc(doc(db,COLLECTION,id));}catch(e){console.error(e);alert('Verwijderen lukte niet.');}
}

function startListener(){
  if(unsubscribe) return;
  unsubscribe=onSnapshot(collection(db,COLLECTION),snap=>{
    items=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.contentType===TYPE);
    renderStories();renderAdmin();
  },e=>console.warn('Luisterverhalen laden',e));
}

async function resolveRole(user){
  isSuperAdmin=false;
  if(!user||user.isAnonymous) return;
  try{const s=await getDoc(doc(db,'adminUsers',user.uid));isSuperAdmin=s.exists()&&s.data()?.active===true&&s.data()?.role==='superadmin';}catch(e){console.warn(e);}
}

function observe(){
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;installMenuButton();ensureAdminUI();});
  }).observe(document.body,{childList:true,subtree:true});
}

onAuthStateChanged(auth,async user=>{
  currentUser=user;
  if(!user) return;
  startListener();
  await resolveRole(user);
  ensureAdminUI();renderAdmin();
});

injectStyle();ensureSheet();installMenuButton();observe();
window.SnazzleListenStoriesV63={open:openSheet,render:renderStories};
