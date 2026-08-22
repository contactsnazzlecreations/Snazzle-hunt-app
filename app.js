import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword,
  signOut, createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, serverTimestamp, writeBatch
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyB4iVfasVJgRMJ5GcdkG3ZU136H9FdmAy4',
  authDomain: 'snazzle-hunt.firebaseapp.com',
  projectId: 'snazzle-hunt',
  storageBucket: 'snazzle-hunt.firebasestorage.app',
  messagingSenderId: '647665502495',
  appId: '1:647665502495:web:686488b53db468e887482a',
  measurementId: 'G-55G5DE19DL'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const fallbackVillages = ['Montfort', 'Posterholt', 'Sint Odiliënberg'];
const localDefaults = { profileImage:'', heroImage:'', homeImage1:'', homeImage2:'' };
let localSettings = loadLocalSettings();
let villages = [...fallbackVillages];
let hunts = [];
let findings = [];
let selectedVillage = localStorage.getItem('snazzleVillage') || 'Montfort';
let proofPhoto = '';
let currentUser = null;
let adminProfile = null;
let listenersStarted = false;
let editingHuntId = null;
let editingHuntImage = '';
let centralReady = false;
let joinedHunts = [];
let seenFoundHunts = [];

function loadLocalSettings(){
  try { return {...localDefaults, ...JSON.parse(localStorage.getItem('snazzleSettings') || '{}')}; }
  catch { return {...localDefaults}; }
}
function loadLegacyHunts(){
  try { return JSON.parse(localStorage.getItem('snazzleHunts') || '[]'); }
  catch { return []; }
}
function userName(){ return (localStorage.getItem('snazzleName') || '').trim(); }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function slug(s){ return String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.remove('show'),2600); }
function openSheet(id){ $('#'+id)?.classList.add('show'); }
function closeSheet(id){ $('#'+id)?.classList.remove('show'); }
function setImg(img, fallback, src){
  if(!img) return;
  if(src){ img.src=src; img.style.display='block'; if(fallback) fallback.style.display='none'; }
  else { img.removeAttribute('src'); img.style.display='none'; if(fallback) fallback.style.display='grid'; }
}
function compressFile(file, max=720, quality=.68){
  return new Promise((resolve,reject)=>{
    if(!file || !file.type.startsWith('image/')) return reject(new Error('Kies een afbeelding'));
    const r=new FileReader();
    r.onload=()=>{ const im=new Image(); im.onload=()=>{
      const scale=Math.min(1,max/Math.max(im.width,im.height));
      const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(im.width*scale)); c.height=Math.max(1,Math.round(im.height*scale));
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      const out=c.toDataURL('image/jpeg',quality);
      if(out.length>850000) reject(new Error('Afbeelding is te groot')); else resolve(out);
    }; im.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen')); im.src=r.result; };
    r.onerror=()=>reject(new Error('Bestand kon niet worden gelezen')); r.readAsDataURL(file);
  });
}
function statusOf(h){
  if(h.found===true) return 'ended';
  if(h.mode==='draft') return 'draft';
  const now=Date.now(), start=h.start ? new Date(h.start).getTime() : 0, end=h.end ? new Date(h.end).getTime() : Infinity;
  if(h.mode==='live' && !h.start) return now>end ? 'ended' : 'live';
  if(now<start) return 'planned';
  if(now>=start && now<=end) return 'live';
  return 'ended';
}
function liveForVillage(v){ return hunts.filter(h=>h.village===v && statusOf(h)==='live').sort((a,b)=>new Date(b.start||0)-new Date(a.start||0)); }
function activeHunt(){ return liveForVillage(selectedVillage)[0] || null; }

function applyName(){
  const n=userName();
  $('#welcomeText').textContent=n ? `Welkom, ${n}!` : 'Welkom!';
  $('#nameInput').value=n;
}
function renderLocalImages(){
  setImg($('#profileLogo'), $('#logoFallback'), localSettings.profileImage);
  setImg($('#profilePreview'), $('#profilePreviewFallback'), localSettings.profileImage);
  if(localSettings.heroImage){
    $('#hero').style.backgroundImage=`linear-gradient(rgba(15,55,28,.38),rgba(10,40,20,.67)),url(${localSettings.heroImage})`;
    setImg($('#heroPreview'), $('#heroPreviewFallback'), localSettings.heroImage);
  } else {
    $('#hero').style.backgroundImage='linear-gradient(rgba(15,55,28,.48),rgba(10,40,20,.72)),linear-gradient(135deg,#2d6a35,#173e23)';
    setImg($('#heroPreview'), $('#heroPreviewFallback'), '');
  }
  setImg($('#homeImg1'), $('#homeEmpty1'), localSettings.homeImage1);
  setImg($('#home1Preview'), $('#home1PreviewFallback'), localSettings.homeImage1);
  setImg($('#homeImg2'), $('#homeEmpty2'), localSettings.homeImage2);
  setImg($('#home2Preview'), $('#home2PreviewFallback'), localSettings.homeImage2);
}
function renderVillages(){
  if(!villages.length) villages=[...fallbackVillages];
  if(!villages.includes(selectedVillage)) selectedVillage=villages[0];
  localStorage.setItem('snazzleVillage',selectedVillage);
  const box=$('#villages'); box.innerHTML='';
  villages.forEach(v=>{
    const b=document.createElement('button'); b.className='village'+(v===selectedVillage?' active':''); b.textContent='📍 '+v;
    b.onclick=()=>{ selectedVillage=v; localStorage.setItem('snazzleVillage',v); renderAll(); renderVillagePage(v); openSheet('villageSheet'); };
    box.appendChild(b);
  });
  $('#chosenVillageLabel').textContent='📍 '+selectedVillage;
}
function renderVillagePage(v){
  const live=liveForVillage(v), planned=hunts.filter(h=>h.village===v && statusOf(h)==='planned');
  $('#villageSheetTitle').textContent='📍 '+v;
  $('#villageSheetText').textContent=live.length ? `${live.length===1?'Er is':'Er zijn'} nu ${live.length} actieve hunt${live.length===1?'':'s'} in ${v}.` : planned.length ? `Er is nu geen live hunt in ${v}, maar er staat wel een hunt ingepland.` : `Er is op dit moment geen actieve hunt in ${v}.`;
  const list=$('#villageHunts'); list.innerHTML='';
  if(!live.length) list.innerHTML='<div class="listitem"><strong>Binnenkort meer avontuur 🌿</strong><span>Kom later nog eens kijken.</span></div>';
  live.forEach(h=>{ const d=document.createElement('div'); d.className='listitem'; d.innerHTML=`<strong>🔎 ${esc(h.title)}</strong><span>${esc(h.description||'')}</span>`; list.appendChild(d); });
  $('#useVillageBtn').onclick=()=>{ selectedVillage=v; localStorage.setItem('snazzleVillage',v); closeSheet('villageSheet'); renderAll(); document.querySelector('.hunt').scrollIntoView({behavior:'smooth',block:'start'}); };
}
function renderActive(){
  const h=activeHunt();
  $('#startSubtitle').textContent='Bekijk de hunt in '+selectedVillage;
  if(!h){
    $('#activeStatus').textContent='Geen hunt in '+selectedVillage;
    $('#huntTitle').textContent='Binnenkort in '+selectedVillage;
    $('#huntVillage').textContent='📍 '+selectedVillage;
    $('#huntRule').textContent='';
    $('#huntDescription').textContent='Op dit moment is hier geen actieve Snazzle Hunt.';
    $('#hintBox').classList.remove('show');
    $('#proofBox').style.display='none';
    setImg($('#huntImg'),$('#huntPlaceholder'),''); $('#huntPlaceholder').textContent='Geen actieve hunt in '+selectedVillage;
    $('#startBtn').disabled=true; $('#startBtn').textContent='Geen hunt';
    $('#foundBtn').disabled=true; $('#foundBtn').textContent='Geen hunt'; return;
  }
  $('#proofBox').style.display='block';
  $('#activeStatus').textContent='Actief in '+selectedVillage;
  $('#huntTitle').textContent=h.title;
  $('#huntVillage').textContent='📍 '+h.village;
  $('#huntRule').textContent=h.rule ? '👨‍👩‍👧 '+h.rule : '';
  $('#huntDescription').textContent=h.description||'';
  $('#hintBox').textContent=h.hint ? '💡 Hint: '+h.hint : '';
  $('#hintBox').classList.toggle('show',!!h.hint);
  setImg($('#huntImg'),$('#huntPlaceholder'),h.imageUrl||'');
  $('#sheetTitle').textContent=h.title;
  $('#sheetDescription').textContent=(h.description||'')+(h.rule?' Regel: '+h.rule+'.':'');
  $('#sheetHint').textContent=h.hint ? '💡 Hint: '+h.hint : 'De hint verschijnt zodra de beheerder hem vrijgeeft.';
  setImg($('#sheetImg'),$('#sheetPlaceholder'),h.imageUrl||'');
  $('#startBtn').disabled=false;
  $('#startBtn').textContent=joinedHunts.includes(h.id) ? 'Ik zoek mee ✅' : 'Ik ga zoeken! 🔎';
  updateFoundButton();
}
function resetProof(){ proofPhoto=''; $('#proofPreview').style.display='none'; $('#proofImg').removeAttribute('src'); updateFoundButton(); }
function updateFoundButton(){
  const h=activeHunt(), b=$('#foundBtn'); if(!h) return;
  const already=findings.some(f=>f.huntId===h.id);
  if(already){ b.disabled=false; b.className='found done'; b.textContent='Gevonden ✅'; }
  else if(proofPhoto){ b.disabled=false; b.className='found ready'; b.textContent='Bevestig gevonden 🏆'; }
  else { b.disabled=true; b.className='found'; b.textContent='Foto nodig 📸'; }
}
function renderFindings(){
  const list=$('#findsList'); list.innerHTML='';
  if(!findings.length){ list.innerHTML='<div class="listitem"><strong>Nog niets gevonden</strong></div>'; return; }
  findings.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).forEach(f=>{
    const d=document.createElement('div'); d.className='listitem';
    d.innerHTML=`<strong>🏆 ${esc(f.title)}</strong><span>📍 ${esc(f.village)} · ${esc(f.dateLabel||'')}</span>${f.photoData?`<img src="${f.photoData}" alt="Vondstfoto">`:''}`;
    list.appendChild(d);
  });
}
function renderHome(){ applyName(); renderLocalImages(); renderVillages(); renderActive(); renderFindings(); renderAdmin(); }
function renderAll(){ renderHome(); }

async function syncNickname(){
  if(!currentUser || !userName() || adminProfile) return;
  try { await setDoc(doc(db,'users',currentUser.uid),{nickname:userName(),updatedAt:new Date().toISOString()},{merge:true}); } catch(e){ console.warn(e); }
}
async function loadUserParticipation(){
  joinedHunts=[]; seenFoundHunts=[];
  if(!currentUser || adminProfile) return;
  try {
    const snap=await getDoc(doc(db,'users',currentUser.uid));
    if(snap.exists()){
      const data=snap.data();
      joinedHunts=Array.isArray(data.joinedHunts) ? data.joinedHunts : [];
      seenFoundHunts=Array.isArray(data.seenFoundHunts) ? data.seenFoundHunts : [];
    }
  } catch(e){ console.warn('participation',e); }
}
async function saveUserParticipation(){
  if(!currentUser || adminProfile) return;
  try {
    await setDoc(doc(db,'users',currentUser.uid),{
      nickname:userName()||'Snazzle-speler', joinedHunts, seenFoundHunts, updatedAt:new Date().toISOString()
    },{merge:true});
  } catch(e){ console.warn('participation save',e); }
}
async function requestHuntNotificationPermission(){
  if(!('Notification' in window) || Notification.permission!=='default') return;
  try { await Notification.requestPermission(); } catch(e){ console.warn('notifications',e); }
}
async function joinActiveHunt(){
  const h=activeHunt();
  if(!h || !currentUser) return toast('Er is nu geen actieve hunt');
  if(h.found===true) return toast('Deze Snazzle is al gevonden');
  await requestHuntNotificationPermission();
  if(!joinedHunts.includes(h.id)){
    joinedHunts=[...joinedHunts,h.id];
    await saveUserParticipation();
    toast(`Je zoekt nu mee naar ${h.title} 🔎`);
  } else {
    toast(`Je zoekt al mee naar ${h.title} ✅`);
  }
  renderActive();
  openSheet('huntSheet');
}
async function showFoundNotification(h){
  if(seenFoundHunts.includes(h.id)) return;
  seenFoundHunts=[...seenFoundHunts,h.id];
  await saveUserParticipation();
  const body=`${h.title} in ${h.village} is gevonden. Je hoeft niet meer te zoeken.`;
  toast('🏆 Snazzle gevonden! '+body);
  if('Notification' in window && Notification.permission==='granted'){
    try { new Notification('Snazzle gevonden! 🏆',{body,tag:`snazzle-found-${h.id}`}); } catch(e){ console.warn('notification display',e); }
  }
}
async function checkFoundHunts(nextHunts){
  if(!currentUser || adminProfile || !joinedHunts.length) return;
  for(const h of nextHunts){
    if(h.found===true && joinedHunts.includes(h.id) && !seenFoundHunts.includes(h.id) && h.foundByUserId!==currentUser.uid){
      await showFoundNotification(h);
    }
  }
}
async function loadOwnFindings(){
  if(!currentUser) return;
  try {
    const snap=await getDocs(query(collection(db,'findings'),where('userId','==',currentUser.uid)));
    findings=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderFindings(); updateFoundButton();
  } catch(e){ console.warn('findings',e); }
}
function startCentralListeners(){
  if(listenersStarted || !currentUser) return; listenersStarted=true;
  onSnapshot(collection(db,'villages'),snap=>{
    const arr=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false).map(x=>x.name).filter(Boolean).sort((a,b)=>a.localeCompare(b,'nl'));
    if(arr.length) villages=arr; else villages=(localSettings.villages?.length?localSettings.villages:fallbackVillages);
    centralReady=true; renderAll();
  },e=>console.warn('villages listener',e));
  onSnapshot(collection(db,'hunts'),async snap=>{
    const arr=snap.docs.map(d=>({id:d.id,...d.data()}));
    let nextHunts;
    if(arr.length) nextHunts=arr; else {
      const legacy=loadLegacyHunts();
      nextHunts=legacy.map(h=>({...h,id:h.id||('hunt-'+Date.now()),imageUrl:h.imageUrl||h.image||''}));
    }
    await checkFoundHunts(nextHunts);
    hunts=nextHunts;
    centralReady=true; renderAll();
  },e=>console.warn('hunts listener',e));
}
async function ensureAuth(){
  onAuthStateChanged(auth,async user=>{
    currentUser=user;
    if(!user){ try{ await signInAnonymously(auth); }catch(e){ toast('Verbinding met Firebase lukt niet'); console.error(e); } return; }
    await refreshAdminProfile();
    await syncNickname();
    await loadUserParticipation();
    startCentralListeners();
    await loadOwnFindings();
    checkOnboarding();
    renderAll();
  });
}
async function refreshAdminProfile(){
  adminProfile=null;
  if(!currentUser || currentUser.isAnonymous) return;
  try { const s=await getDoc(doc(db,'adminUsers',currentUser.uid)); if(s.exists() && s.data().active===true) adminProfile={uid:currentUser.uid,...s.data()}; }
  catch(e){ console.warn(e); }
}
function checkOnboarding(){ if(!userName() && (!adminProfile || currentUser?.isAnonymous)) $('#onboarding').classList.add('show'); else $('#onboarding').classList.remove('show'); }

async function seedCentralIfEmpty(){
  if(adminProfile?.role!=='superadmin') return;
  const vSnap=await getDocs(collection(db,'villages'));
  if(vSnap.empty){
    const list=localSettings.villages?.length ? localSettings.villages : fallbackVillages;
    for(const name of list) await setDoc(doc(db,'villages',slug(name)),{name,active:true,createdAt:new Date().toISOString()});
  }
  const hSnap=await getDocs(collection(db,'hunts'));
  if(hSnap.empty){
    let legacy=loadLegacyHunts();
    if(!legacy.length) legacy=[{title:'De Gouden Snazzle',village:'Montfort',description:'Bekijk de Snazzle goed en ga daarna buiten op zoek.',rule:'één Snazzle per gezin',hint:'',image:'',start:'',end:'',mode:'live'}];
    for(const h of legacy){
      await addDoc(collection(db,'hunts'),{
        title:h.title||'Nieuwe Snazzle Hunt', village:h.village||'Montfort', description:h.description||'', rule:h.rule||'', hint:h.hint||'',
        imageUrl:h.imageUrl||h.image||'', foundMessage:h.foundMessage||'Gefeliciteerd! Je hebt de Snazzle gevonden!', start:h.start||'', end:h.end||'', mode:h.mode||'draft', createdAt:new Date().toISOString()
      });
    }
  }
}

async function adminLogin(){
  const email=$('#adminEmail').value.trim(), password=$('#adminPassword').value;
  if(!email || !password) return toast('Vul e-mail en wachtwoord in');
  try {
    await signInWithEmailAndPassword(auth,email,password);
    currentUser=auth.currentUser; await refreshAdminProfile();
    if(!adminProfile){ await signOut(auth); await signInAnonymously(auth); return toast('Dit account heeft geen beheerdersrechten'); }
    if(adminProfile.role==='superadmin') await seedCentralIfEmpty();
    $('#adminPassword').value=''; closeSheet('adminLogin'); openSheet('adminSheet'); renderAdmin(); toast('Beheer geopend ✅');
  } catch(e){ console.error(e); toast('Inloggen mislukt. Controleer e-mail/wachtwoord.'); }
}
async function adminLogout(){
  try { await signOut(auth); adminProfile=null; listenersStarted=false; await signInAnonymously(auth); closeSheet('adminSheet'); toast('Beheer uitgelogd'); }
  catch(e){ console.error(e); }
}

function renderAdmin(){
  if(!$('#adminRole')) return;
  $('#adminRole').textContent=adminProfile ? (adminProfile.role==='superadmin'?'Hoofdbeheerder':`Dorpsbeheerder · ${adminProfile.village||''}`) : 'Niet ingelogd';
  const superAdmin=adminProfile?.role==='superadmin';
  $$('.super-only').forEach(x=>x.style.display=superAdmin?'':'none');
  $$('.village-admin-only').forEach(x=>x.style.display=adminProfile?.role==='village_admin'?'':'none');
  renderAdminHunts(); renderAdminVillages(); renderVillageAdminPanel(); renderAdminUsers();
}
function renderAdminHunts(){
  const box=$('#adminHuntList'); if(!box) return; box.innerHTML='';
  const visible=adminProfile?.role==='village_admin' ? hunts.filter(h=>h.village===adminProfile.village) : hunts;
  visible.slice().sort((a,b)=>String(b.start||'').localeCompare(String(a.start||''))).forEach(h=>{
    const st=statusOf(h), card=document.createElement('div'); card.className='listitem';
    card.innerHTML=`<strong>${esc(h.title)}</strong><span>📍 ${esc(h.village)}</span><span class="badge ${st}">${({live:'LIVE',planned:'INGEPLAND',draft:'CONCEPT',ended:'AFGELOPEN'}[st])}</span><button class="secondary" data-edit-hunt="${h.id}">Bewerken</button>`;
    box.appendChild(card);
  });
  $$('[data-edit-hunt]').forEach(b=>b.onclick=()=>openHuntEditor(b.dataset.editHunt));
}
function renderAdminVillages(){
  const box=$('#adminVillageList'); if(!box) return; box.innerHTML='';
  villages.forEach(v=>{ const d=document.createElement('div'); d.className='listitem'; d.innerHTML=`<strong>📍 ${esc(v)}</strong><span>Knop en dorpspagina worden automatisch gemaakt.</span>`; box.appendChild(d); });
  const sel=$('#adminUserVillage'); if(sel){ sel.innerHTML=''; villages.forEach(v=>sel.add(new Option(v,v))); }
  const huntSel=$('#huntVillageEdit'); if(huntSel){ const val=huntSel.value; huntSel.innerHTML=''; villages.forEach(v=>huntSel.add(new Option(v,v))); if(villages.includes(val)) huntSel.value=val; }
}
function renderVillageAdminPanel(){
  if(adminProfile?.role!=='village_admin') return;
  $('#villageAdminTitle').textContent='Beheer '+adminProfile.village;
  const box=$('#villageAdminHunts'); box.innerHTML='';
  hunts.filter(h=>h.village===adminProfile.village).forEach(h=>{
    const d=document.createElement('div'); d.className='listitem'; d.innerHTML=`<strong>${esc(h.title)}</strong><button class="secondary" data-village-edit="${h.id}">Foto, hint en melding aanpassen</button>`; box.appendChild(d);
  });
  $$('[data-village-edit]').forEach(b=>b.onclick=()=>openVillageEdit(b.dataset.villageEdit));
}
async function renderAdminUsers(){
  const box=$('#adminUsersList'); if(!box || adminProfile?.role!=='superadmin') return; box.innerHTML='';
  try { const snap=await getDocs(collection(db,'adminUsers')); snap.docs.forEach(d=>{ const a=d.data(); const row=document.createElement('div'); row.className='listitem'; row.innerHTML=`<strong>${a.role==='superadmin'?'Hoofdbeheerder':'Dorpsbeheerder'}</strong><span>${esc(a.village||'Alle dorpen')}</span><small>${esc(d.id)}</small>`; box.appendChild(row); }); }
  catch(e){ console.warn(e); }
}

function openHuntEditor(id=null){
  if(adminProfile?.role!=='superadmin') return;
  editingHuntId=id; const h=id ? hunts.find(x=>x.id===id) : null; editingHuntImage=h?.imageUrl||'';
  $('#huntEditor').style.display='block';
  $('#huntTitleEdit').value=h?.title||''; $('#huntVillageEdit').value=h?.village||selectedVillage; $('#huntDescEdit').value=h?.description||'';
  $('#huntRuleEdit').value=h?.rule||'één Snazzle per gezin'; $('#huntHintEdit').value=h?.hint||''; $('#huntFoundMessageEdit').value=h?.foundMessage||'Gefeliciteerd! Je hebt de Snazzle gevonden!';
  $('#huntStartEdit').value=h?.start||''; $('#huntEndEdit').value=h?.end||''; $('#huntModeEdit').value=h?.mode||'draft';
  setImg($('#huntImagePreview'),$('#huntImageFallback'),editingHuntImage);
}
async function saveHunt(){
  if(adminProfile?.role!=='superadmin') return;
  const mode=$('#huntModeEdit').value, start=$('#huntStartEdit').value;
  if(mode==='planned' && !start) return toast('Kies datum en tijd');
  const data={
    title:$('#huntTitleEdit').value.trim()||'Nieuwe Snazzle Hunt', village:$('#huntVillageEdit').value,
    description:$('#huntDescEdit').value.trim(), rule:$('#huntRuleEdit').value.trim()||'één Snazzle per gezin', hint:$('#huntHintEdit').value.trim(),
    foundMessage:$('#huntFoundMessageEdit').value.trim()||'Gefeliciteerd! Je hebt de Snazzle gevonden!', imageUrl:editingHuntImage,
    start, end:$('#huntEndEdit').value, mode, updatedAt:new Date().toISOString()
  };
  try {
    if(editingHuntId) await updateDoc(doc(db,'hunts',editingHuntId),data); else await addDoc(collection(db,'hunts'),{...data,createdAt:new Date().toISOString()});
    $('#huntEditor').style.display='none'; toast('Hunt centraal opgeslagen ✅');
  } catch(e){ console.error(e); toast('Hunt opslaan mislukt'); }
}
function openVillageEdit(id){
  const h=hunts.find(x=>x.id===id); if(!h) return;
  editingHuntId=id; editingHuntImage=h.imageUrl||'';
  $('#villageEditTitle').textContent=h.title; $('#villageHintEdit').value=h.hint||''; $('#villageFoundMessageEdit').value=h.foundMessage||'';
  setImg($('#villageImagePreview'),$('#villageImageFallback'),editingHuntImage); $('#villageEditBox').style.display='block';
}
async function saveVillageLimited(){
  if(adminProfile?.role!=='village_admin' || !editingHuntId) return;
  try { await updateDoc(doc(db,'hunts',editingHuntId),{hint:$('#villageHintEdit').value.trim(),foundMessage:$('#villageFoundMessageEdit').value.trim(),imageUrl:editingHuntImage}); $('#villageEditBox').style.display='none'; toast('Wijzigingen opgeslagen ✅'); }
  catch(e){ console.error(e); toast('Opslaan geweigerd of mislukt'); }
}
async function addVillage(){
  if(adminProfile?.role!=='superadmin') return;
  const name=$('#newVillageName').value.trim(); if(name.length<2) return toast('Vul een dorpsnaam in');
  try { await setDoc(doc(db,'villages',slug(name)),{name,active:true,createdAt:new Date().toISOString()},{merge:true}); $('#newVillageName').value=''; toast('Dorp toegevoegd ✅'); }
  catch(e){ console.error(e); toast('Dorp toevoegen mislukt'); }
}
async function createVillageAdmin(){
  if(adminProfile?.role!=='superadmin') return;
  const email=$('#adminUserEmail').value.trim(), pass=$('#adminUserPassword').value, village=$('#adminUserVillage').value;
  if(!email || pass.length<6 || !village) return toast('Vul e-mail, wachtwoord (min. 6) en dorp in');
  let secondary;
  try {
    secondary=initializeApp(firebaseConfig,'secondary-'+Date.now()); const a=getAuth(secondary); const cred=await createUserWithEmailAndPassword(a,email,pass);
    await setDoc(doc(db,'adminUsers',cred.user.uid),{role:'village_admin',village,active:true,email,createdAt:new Date().toISOString()});
    await signOut(a); await deleteApp(secondary); $('#adminUserEmail').value=''; $('#adminUserPassword').value=''; toast('Dorpsbeheerder aangemaakt ✅'); renderAdminUsers();
  } catch(e){ console.error(e); if(secondary) try{await deleteApp(secondary)}catch{} toast('Account maken mislukt'); }
}

async function saveLocalImage(key,file){
  try { const src=await compressFile(file,800,.68); localSettings[key]=src; localStorage.setItem('snazzleSettings',JSON.stringify(localSettings)); renderLocalImages(); toast('Afbeelding opgeslagen ✅'); }
  catch(e){ toast(e.message); }
}

async function markFound(){
  const h=activeHunt(); if(!h || !currentUser) return;
  if(findings.some(f=>f.huntId===h.id)) return toast('Deze hunt staat al bij je vondsten');
  if(!proofPhoto) return toast('Maak eerst een foto');
  const now=new Date().toISOString();
  const item={userId:currentUser.uid,nickname:userName()||'Snazzle-speler',huntId:h.id,title:h.title,village:h.village,photoData:proofPhoto,dateLabel:new Date().toLocaleDateString('nl-NL'),createdAt:now};
  try {
    const batch=writeBatch(db);
    batch.set(doc(db,'findings',h.id),item);
    batch.update(doc(db,'hunts',h.id),{found:true,foundAt:now,foundByUserId:currentUser.uid,foundByNickname:item.nickname});
    await batch.commit();
    findings.unshift({id:h.id,...item});
    proofPhoto=''; resetProof(); renderFindings();
    toast(h.foundMessage||'Gevonden! 🏆');
  }
  catch(e){ console.error(e); toast('Vondst kon niet worden bevestigd'); }
}

// UI bindings
$$('[data-close]').forEach(b=>b.onclick=()=>closeSheet(b.dataset.close));
$('#finishOnboarding').onclick=async()=>{ const n=$('#firstNameInput').value.trim().slice(0,20); if(n.length<2) return toast('Vul een voornaam of nickname in'); localStorage.setItem('snazzleName',n); $('#onboarding').classList.remove('show'); applyName(); await syncNickname(); };
$('#saveName').onclick=async()=>{ const n=$('#nameInput').value.trim().slice(0,20); if(n.length<2) return toast('Vul minimaal 2 tekens in'); localStorage.setItem('snazzleName',n); await syncNickname(); closeSheet('profileSheet'); renderAll(); };
$('#profileBtn').onclick=$('#navProfile').onclick=()=>openSheet('profileSheet');
$('#findsBtn').onclick=()=>{ renderFindings(); openSheet('findsSheet'); };
$('#navFriends').onclick=()=>openSheet('friendsSheet'); $('#navShop').onclick=()=>openSheet('shopSheet');
$('#bigStart').onclick=$('#navHunt').onclick=()=>{ if(activeHunt()) openSheet('huntSheet'); else { renderVillagePage(selectedVillage); openSheet('villageSheet'); } };
$('#startBtn').onclick=joinActiveHunt;
$('#proofBtn').onclick=()=>$('#proofInput').click();
$('#proofInput').onchange=async e=>{ try{ proofPhoto=await compressFile(e.target.files[0],520,.6); $('#proofImg').src=proofPhoto; $('#proofPreview').style.display='block'; updateFoundButton(); toast('Foto toegevoegd ✅'); } catch(err){ toast(err.message); } };
$('#foundBtn').onclick=markFound;
$('#adminBtn').onclick=()=>{ if(adminProfile) openSheet('adminSheet'); else openSheet('adminLogin'); };
$('#adminLoginBtn').onclick=adminLogin; $('#adminLogoutBtn').onclick=adminLogout;
$('#newHuntBtn').onclick=()=>openHuntEditor(null); $('#cancelHuntEditor').onclick=()=>$('#huntEditor').style.display='none'; $('#saveHuntBtn').onclick=saveHunt;
$('#huntImageInput').onchange=async e=>{ try{ editingHuntImage=await compressFile(e.target.files[0],720,.65); setImg($('#huntImagePreview'),$('#huntImageFallback'),editingHuntImage); }catch(err){toast(err.message);} };
$('#addVillageBtn').onclick=addVillage; $('#createVillageAdminBtn').onclick=createVillageAdmin;
$('#villageImageInput').onchange=async e=>{ try{ editingHuntImage=await compressFile(e.target.files[0],720,.65); setImg($('#villageImagePreview'),$('#villageImageFallback'),editingHuntImage); }catch(err){toast(err.message);} };
$('#saveVillageLimitedBtn').onclick=saveVillageLimited;
[['profileImageInput','profileImage'],['heroImageInput','heroImage'],['home1Input','homeImage1'],['home2Input','homeImage2']].forEach(([id,key])=>$('#'+id).onchange=e=>saveLocalImage(key,e.target.files[0]));
$$('[data-remove-local-image]').forEach(b=>b.onclick=()=>{ localSettings[b.dataset.removeLocalImage]=''; localStorage.setItem('snazzleSettings',JSON.stringify(localSettings)); renderLocalImages(); toast('Afbeelding verwijderd'); });
$$('[data-tab]').forEach(b=>b.onclick=()=>{ $$('[data-tab]').forEach(x=>x.classList.remove('on')); $$('.admin-section').forEach(x=>x.classList.remove('on')); b.classList.add('on'); $('#'+b.dataset.tab).classList.add('on'); });

setInterval(()=>{ renderActive(); },30000);
renderAll();
ensureAuth();
