// Snazzle Cards — centrale verzamelkaarten, Hunt-unlocks en beheer met eigen afbeeldingen.
// De Hunt blijft leidend: kaarten zijn een beloning achter de hoofdbeleving.

import { getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, setDoc, deleteDoc, onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const CARD_VERSION='1.0.0';
const LOCAL_KEY='snazzleCardCatalogV1';
const $s=(s,r=document)=>r.querySelector(s);
const $$s=(s,r=document)=>[...r.querySelectorAll(s)];
const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;

let currentUser=null;
let isSuperAdmin=false;
let cards=[];
let hunts=[];
let centralCards=[];
let localCards=loadLocalCards();
let cardsCentralReady=false;
let cardImageDraft='';
let editingCardId=null;
let rarityFilter='all';
let unsubCards=null;
let unsubHunts=null;

const RARITIES={
  core:{label:'CORE',rank:1},
  rare:{label:'RARE',rank:2},
  silver:{label:'SILVER',rank:3},
  gold:{label:'GOLD',rank:4},
  platinum:{label:'PLATINUM',rank:5}
};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function slug(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function toast(message){
  const t=$s('#toast');
  if(!t){console.info(message);return;}
  t.textContent=message;t.classList.add('show');clearTimeout(window.__cardToast);
  window.__cardToast=setTimeout(()=>t.classList.remove('show'),3000);
}
function loadLocalCards(){
  try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[];}catch{return [];}
}
function saveLocalCards(){localStorage.setItem(LOCAL_KEY,JSON.stringify(localCards));}
function mergeCards(){
  const map=new Map();
  localCards.forEach(c=>map.set(c.id,c));
  centralCards.forEach(c=>map.set(c.id,c));
  cards=[...map.values()].sort((a,b)=>{
    const sa=String(a.series||'').localeCompare(String(b.series||''),'nl');
    if(sa) return sa;
    return String(a.number||'').localeCompare(String(b.number||''),'nl',{numeric:true});
  });
  renderEverywhere();
}
function rarityLabel(v){return RARITIES[v]?.label||'CORE';}
function sourceLabel(c){
  const type=c.unlockType||'hunt';
  if(type==='hunt') return '🔎 Hunt';
  if(type==='event') return '🎪 Event';
  if(type==='shop') return '🛍️ Fysieke kaart / Shop';
  if(type==='milestone') return `🏆 ${Number(c.threshold)||1} vondsten`;
  return '🔐 Special Vault';
}
function activeCards(){return cards.filter(c=>c.active!==false);}
function wonHunts(){
  if(!currentUser) return [];
  return hunts.filter(h=>h.found===true&&h.foundByUserId===currentUser.uid);
}
function isUnlocked(c){
  if(!currentUser) return false;
  const won=wonHunts();
  const ids=new Set(won.map(h=>h.id));
  const type=c.unlockType||'hunt';
  if(type==='hunt') return !!c.huntId&&ids.has(c.huntId);
  if(type==='event') return !!c.huntId&&ids.has(c.huntId);
  if(type==='milestone') return won.length>=(Number(c.threshold)||1);
  return false;
}
function unlockedCount(){return activeCards().filter(isUnlocked).length;}

function injectStyles(){
  if($s('#snazzleCardSystemStyles')) return;
  const st=document.createElement('style');st.id='snazzleCardSystemStyles';st.textContent=`
    .collection-tabs{grid-template-columns:repeat(4,1fr)!important}
    .sc-catalog-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:4px 2px 10px}.sc-catalog-head h3{margin:0;color:#3d2a18}.sc-catalog-head small{font-weight:900;color:#6d5230;text-align:right}
    .sc-summary{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px 13px;margin-bottom:10px;border-radius:17px;background:linear-gradient(135deg,#143d31,#1d684d 55%,#425c78);border:2px solid #e2bd67;color:#fff8de;box-shadow:0 5px 0 #50371f,0 10px 22px rgba(0,0,0,.15);position:relative;overflow:hidden}.sc-summary:after{content:'✦';position:absolute;right:58px;top:8px;color:#ffe990;text-shadow:0 0 10px #ffe891;animation:scTwinkle 2.4s ease-in-out infinite}.sc-summary strong{display:block;font-size:17px}.sc-summary span{display:block;font-size:11px;font-weight:800;color:#dff6d4;margin-top:3px}.sc-summary b{font-size:22px;color:#ffe06a}
    .sc-filters{display:flex;gap:6px;overflow:auto;padding:2px 1px 8px}.sc-filter{white-space:nowrap;border:2px solid #b18c55;border-radius:99px;background:#fff6d5;color:#60431f;padding:7px 10px;font-size:10px;font-weight:1000}.sc-filter.on{background:linear-gradient(#7ccf5d,#40954a);border-color:#39783e;color:#fff}
    .sc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sc-card{position:relative;border-radius:19px;padding:5px;background:#7d5a36;box-shadow:0 5px 0 #563a23,0 10px 22px rgba(0,0,0,.16);overflow:hidden}.sc-card.core{background:linear-gradient(145deg,#8a775e,#584735)}.sc-card.rare{background:linear-gradient(145deg,#49a7b8,#296780)}.sc-card.silver{background:linear-gradient(145deg,#f1f4f6,#9ba8b2 58%,#dce4e8)}.sc-card.gold{background:linear-gradient(145deg,#fff0a0,#e5a52f 55%,#fff1a6)}.sc-card.platinum{background:linear-gradient(135deg,#f8f5ff,#9be7df 34%,#a9a6ef 68%,#fff0bb);box-shadow:0 5px 0 #665a78,0 0 21px rgba(199,244,234,.33),0 13px 26px rgba(0,0,0,.18)}
    .sc-card-inner{height:100%;border-radius:15px;overflow:hidden;background:#fff8e7;color:#35251a;border:2px solid rgba(255,255,255,.6);position:relative}.sc-media{aspect-ratio:4/5;background:radial-gradient(circle at 50% 22%,#4d8e67,#143c2d 68%);overflow:hidden;position:relative}.sc-media img{width:100%;height:100%;object-fit:cover;display:block}.sc-card.locked .sc-media img{filter:brightness(.13) saturate(.2) blur(1px);transform:scale(1.04)}.sc-lock{position:absolute;inset:0;display:grid;place-items:center;font-size:44px;color:#ffe482;text-shadow:0 3px 9px #000}.sc-card:not(.locked) .sc-lock{display:none}.sc-rarity{position:absolute;left:7px;top:7px;border-radius:99px;padding:5px 7px;background:rgba(20,27,24,.82);color:#fff;font-size:8px;font-weight:1000;letter-spacing:.7px;border:1px solid rgba(255,255,255,.6)}.sc-number{position:absolute;right:7px;top:7px;border-radius:99px;padding:5px 7px;background:rgba(255,248,220,.9);color:#4c351f;font-size:8px;font-weight:1000}.sc-info{padding:8px}.sc-info strong{display:block;font-size:12px;line-height:1.15}.sc-info small{display:block;font-size:9px;font-weight:750;color:#765a3d;margin-top:3px;line-height:1.25}.sc-source{margin-top:6px;display:inline-block;padding:4px 6px;border-radius:99px;background:#efe0b8;color:#5d4328;font-size:8px;font-weight:950}.sc-card.unlocked:after{content:'ONTDEKT';position:absolute;right:-21px;bottom:17px;transform:rotate(-12deg);background:#3f9a4b;color:#fff;border:2px solid #eaffd3;padding:5px 23px;font-size:8px;font-weight:1000;box-shadow:0 2px 7px rgba(0,0,0,.22)}
    .sc-empty{grid-column:1/-1;padding:18px;border-radius:16px;background:#fff7df;border:2px dashed #b28e59;color:#684c2e;text-align:center;font-weight:850;line-height:1.45}
    #snazzleCardVault .sc-vault-intro{padding:14px;margin-bottom:11px;border-radius:19px;background:radial-gradient(circle at 75% 0,rgba(255,225,113,.16),transparent 25%),linear-gradient(145deg,#18253b,#271d4a 58%,#153d39);border:3px solid #a98ad0;color:#fff5da;box-shadow:0 5px 0 #4b365a}.sc-vault-intro strong{display:block;font-size:18px;color:#ffe485}.sc-vault-intro small{display:block;margin-top:4px;font-weight:760;color:#ded8f7;line-height:1.4}
    .sc-admin-note{padding:10px 11px;border-radius:14px;background:#edf7c9;border:2px solid #9db855;color:#3e5424;font-size:11px;font-weight:850;line-height:1.4;margin-bottom:10px}.sc-editor{display:none;margin-top:13px;padding-top:8px;border-top:2px dashed #b6935e}.sc-editor.show{display:block}.sc-admin-preview{height:190px;border-radius:17px;background:#213e32;display:grid;place-items:center;overflow:hidden;border:3px solid #bf9856;margin:8px 0;color:#f7e7bd;font-weight:900}.sc-admin-preview img{width:100%;height:100%;object-fit:contain;background:radial-gradient(circle,#356d50,#173d2d)}.sc-admin-list{display:grid;gap:8px;margin-top:12px}.sc-admin-row{display:grid;grid-template-columns:56px 1fr;gap:10px;align-items:center;padding:9px;border-radius:14px;background:#fff9e9;border:2px solid #bea06d;color:#39291c}.sc-admin-thumb{width:56px;height:68px;border-radius:10px;background:#264d3a;overflow:hidden;display:grid;place-items:center;font-size:25px}.sc-admin-thumb img{width:100%;height:100%;object-fit:cover}.sc-admin-row strong{display:block}.sc-admin-row small{display:block;font-size:10px;color:#75593a;font-weight:750;margin-top:2px}.sc-admin-buttons{grid-column:1/-1;display:flex;gap:7px}.sc-admin-buttons button{border:0;border-radius:10px;padding:8px 10px;font-weight:950;background:#dbc49b;color:#432f1d}.sc-admin-buttons .danger{background:#efb5aa;color:#6b2d24}
    .sc-sync{font-size:10px;font-weight:850;color:#6c5534;margin:7px 1px}
    @keyframes scTwinkle{0%,100%{opacity:.4;transform:scale(.8) rotate(-8deg)}50%{opacity:1;transform:scale(1.15) rotate(7deg)}}
    @media(max-width:400px){.collection-tabs{grid-template-columns:repeat(2,1fr)!important}.sc-grid{gap:8px}.sc-info strong{font-size:11px}}
    @media(prefers-reduced-motion:reduce){.sc-summary:after{animation:none}}
  `;document.head.appendChild(st);
}

function compressImage(file){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type?.startsWith('image/')) return reject(new Error('Kies een afbeelding.'));
    const reader=new FileReader();
    reader.onload=()=>{const im=new Image();im.onload=()=>{
      const max=560,scale=Math.min(1,max/Math.max(im.width,im.height));
      const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));
      const ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(im,0,0,c.width,c.height);
      let out=c.toDataURL('image/jpeg',.72);
      if(out.length>520000) out=c.toDataURL('image/jpeg',.52);
      if(out.length>760000) return reject(new Error('Afbeelding is nog te groot. Kies een kleinere foto.'));
      resolve(out);
    };im.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen.'));im.src=reader.result;};
    reader.onerror=()=>reject(new Error('Bestand kon niet worden gelezen.'));reader.readAsDataURL(file);
  });
}

function ensureCollectionExtension(){
  const sheet=$s('#collectionSheet');
  if(!sheet) return;
  const cardsSection=$s('#collectionCards',sheet);
  if(cardsSection&&!$s('#snazzleCardCatalogBlock')){
    const block=document.createElement('div');block.id='snazzleCardCatalogBlock';
    block.innerHTML=`<div class="sc-catalog-head"><h3>Mijn Snazzle Cards</h3><small>Hunt → vind → ontgrendel</small></div><div class="sc-summary"><div><strong id="scSummaryTitle">Mijn verzameling</strong><span id="scSummaryText">Nog geen kaarten actief</span></div><b id="scSummaryCount">0/0</b></div><div class="sc-filters" id="scFilters"></div><div class="sc-grid" id="snazzleCardGrid"></div>`;
    cardsSection.prepend(block);
  }
  const tabs=$s('.collection-tabs',sheet);
  if(tabs&&!$s('[data-collection-tab="vault"]',tabs)){
    const b=document.createElement('button');b.type='button';b.dataset.collectionTab='vault';b.textContent='🔐 Vault';tabs.appendChild(b);
    b.onclick=()=>{
      $$s('[data-collection-tab]',sheet).forEach(x=>x.classList.remove('on'));b.classList.add('on');
      $$s('.collection-section',sheet).forEach(x=>x.classList.remove('on'));
      $s('#snazzleCardVault',sheet)?.classList.add('on');renderVault();
    };
  }
  if(!$s('#snazzleCardVault',sheet)){
    const sec=document.createElement('section');sec.className='collection-section';sec.id='snazzleCardVault';
    sec.innerHTML='<div class="sc-vault-intro"><strong>🔐 Special Vault</strong><small>Hier slapen de zeldzaamste Snazzles. Sommige verschijnen alleen bij een speciale Hunt, event of geheime mijlpaal.</small></div><div class="sc-grid" id="snazzleVaultGrid"></div>';
    $s('.collection-panel',sheet)?.appendChild(sec);
  }
  renderCatalog();renderVault();updateHomeStatus();
}

function cardHtml(c,forceLocked=false){
  const unlocked=!forceLocked&&isUnlocked(c);
  const locked=!unlocked;
  const image=c.imageData||'';
  return `<article class="sc-card ${esc(c.rarity||'core')} ${locked?'locked':'unlocked'}"><div class="sc-card-inner"><div class="sc-media">${image?`<img src="${image}" alt="${esc(c.name||'Snazzle')}">`:'<div style="height:100%;display:grid;place-items:center;font-size:48px">🦆</div>'}<span class="sc-lock">?</span><span class="sc-rarity">${rarityLabel(c.rarity)}</span><span class="sc-number">${esc(c.number||'SNZ')}</span></div><div class="sc-info"><strong>${locked&&c.secretName!==false?'Mysterie Snazzle':esc(c.name||'Snazzle')}</strong><small>${esc(c.series||'Snazzle Series')}</small><span class="sc-source">${sourceLabel(c)}</span></div></div></article>`;
}
function renderCatalog(){
  const grid=$s('#snazzleCardGrid');if(!grid) return;
  const visible=activeCards().filter(c=>c.unlockType!=='special').filter(c=>rarityFilter==='all'||c.rarity===rarityFilter);
  grid.innerHTML=visible.length?visible.map(c=>cardHtml(c)).join(''):'<div class="sc-empty">✨ Nog geen Snazzle Cards in deze categorie.<br><small>De beheerder kan ze toevoegen.</small></div>';
  const filters=$s('#scFilters');
  if(filters){
    const items=[['all','Alle'],...Object.entries(RARITIES).map(([k,v])=>[k,v.label])];
    filters.innerHTML=items.map(([k,l])=>`<button type="button" class="sc-filter ${rarityFilter===k?'on':''}" data-rarity-filter="${k}">${l}</button>`).join('');
    $$s('[data-rarity-filter]',filters).forEach(b=>b.onclick=()=>{rarityFilter=b.dataset.rarityFilter;renderCatalog();});
  }
  const active=activeCards().filter(c=>c.unlockType!=='special');
  const found=active.filter(isUnlocked).length;
  if($s('#scSummaryCount')) $s('#scSummaryCount').textContent=`${found}/${active.length}`;
  if($s('#scSummaryText')) $s('#scSummaryText').textContent=active.length?`${Math.round((found/active.length)*100)||0}% van je gewone collectie ontdekt`:'De eerste serie kan worden klaargezet in Beheer';
  const legacy=$s('#collectorGrid');
  if(legacy){legacy.style.display=active.length?'none':'';const title=legacy.previousElementSibling;if(title?.classList?.contains('collection-section-title')) title.style.display=active.length?'none':'';}
}
function renderVault(){
  const grid=$s('#snazzleVaultGrid');if(!grid) return;
  const specials=activeCards().filter(c=>c.unlockType==='special');
  grid.innerHTML=specials.length?specials.map(c=>cardHtml(c,!isUnlocked(c))).join(''):'<div class="sc-empty">🔐 De Vault is nog gesloten.<br><small>Voeg later Special Snazzles toe voor events en geheime beloningen.</small></div>';
}
function updateHomeStatus(){
  const status=$s('#collectionHomeStatus');if(!status) return;
  const active=activeCards();
  status.textContent=active.length?`${unlockedCount()} van ${active.length} Snazzles ontdekt`:'Ontdek je magische Snazzle Cards';
  const strong=$s('#collectionHomeCard strong');if(strong) strong.textContent='Mijn Snazzles';
}

function ensureAdminUI(){
  const wrap=$s('#adminSheet .super-only');if(!wrap) return;
  const tabs=$s('.tabs',wrap);if(!tabs) return;
  if(!$s('[data-tab="cardsAdmin"]',tabs)){
    const b=document.createElement('button');b.type='button';b.dataset.tab='cardsAdmin';b.textContent='Kaarten';tabs.appendChild(b);
    b.onclick=()=>{
      $$s('[data-tab]',tabs).forEach(x=>x.classList.remove('on'));b.classList.add('on');
      $$s('.admin-section',wrap).forEach(x=>x.classList.remove('on'));
      $s('#cardsAdmin')?.classList.add('on');renderAdminCards();
    };
  }
  if(!$s('#cardsAdmin',wrap)){
    const sec=document.createElement('section');sec.className='admin-section';sec.id='cardsAdmin';
    sec.innerHTML=`<div class="sc-admin-note">🃏 <strong>Snazzle Cards</strong><br>Upload alleen je Snazzle-afbeelding. De app maakt automatisch de kaart, rarity-rand en verzamelstatus.</div><button class="save" id="newSnazzleCardBtn" type="button">+ Nieuwe Snazzle Card</button><div class="sc-sync" id="scSyncState">Kaartensysteem wordt geladen…</div><div class="sc-admin-list" id="scAdminList"></div><div class="sc-editor" id="scEditor"><h3 id="scEditorTitle">Nieuwe kaart</h3><div class="row2"><div class="field"><label>Kaartnummer</label><input id="scNumber" placeholder="SNZ-001"></div><div class="field"><label>Zeldzaamheid</label><select id="scRarity"><option value="core">Core</option><option value="rare">Rare</option><option value="silver">Silver</option><option value="gold">Gold</option><option value="platinum">Platinum</option></select></div></div><div class="field"><label>Naam Snazzle</label><input id="scName" placeholder="Bijv. Jungle Jack"></div><div class="field"><label>Serie</label><input id="scSeries" placeholder="Bijv. Jungle Series 01"></div><div class="field"><label>Korte tekst</label><textarea id="scDescription" placeholder="Een korte omschrijving van deze Snazzle."></textarea></div><div class="field"><label>Hoe ontgrendelen?</label><select id="scUnlockType"><option value="hunt">Via een Hunt</option><option value="event">Via een Event Hunt</option><option value="shop">Fysieke kaart / Shop (QR volgt)</option><option value="milestone">Na aantal Hunt-vondsten</option><option value="special">Special Vault</option></select></div><div class="field" id="scHuntField"><label>Koppel aan Hunt</label><select id="scHuntId"><option value="">Kies Hunt…</option></select></div><div class="field" id="scThresholdField" style="display:none"><label>Ontgrendelen na aantal vondsten</label><input id="scThreshold" type="number" min="1" max="100" value="5"></div><div class="field"><label>Snazzle-afbeelding</label><input id="scImage" type="file" accept="image/*"></div><div class="sc-admin-preview" id="scPreview">Eigen Snazzle-afbeelding</div><div class="field"><label><input id="scActive" type="checkbox" checked> Kaart actief in collectie</label></div><button class="save" id="scSave" type="button">Kaart opslaan</button><button class="secondary" id="scCancel" type="button">Annuleren</button></div>`;
    wrap.appendChild(sec);
    $s('#newSnazzleCardBtn').onclick=()=>openEditor();
    $s('#scCancel').onclick=closeEditor;
    $s('#scSave').onclick=saveCard;
    $s('#scUnlockType').onchange=toggleUnlockFields;
    $s('#scImage').onchange=async e=>{try{cardImageDraft=await compressImage(e.target.files[0]);renderPreview();}catch(err){toast(err.message);}};
  }
  renderAdminCards();populateHuntSelect();
}
function nextNumber(){
  const nums=cards.map(c=>Number(String(c.number||'').match(/\d+/)?.[0]||0));
  return `SNZ-${String(Math.max(0,...nums)+1).padStart(3,'0')}`;
}
function populateHuntSelect(){
  const sel=$s('#scHuntId');if(!sel)return;
  const current=sel.value;
  const sorted=hunts.slice().sort((a,b)=>String(b.start||'').localeCompare(String(a.start||'')));
  sel.innerHTML='<option value="">Kies Hunt…</option>'+sorted.map(h=>`<option value="${esc(h.id)}">${esc(h.title||'Hunt')} · ${esc(h.village||'')}</option>`).join('');
  if([...sel.options].some(o=>o.value===current)) sel.value=current;
}
function toggleUnlockFields(){
  const type=$s('#scUnlockType')?.value||'hunt';
  const huntField=$s('#scHuntField'),threshold=$s('#scThresholdField');
  if(huntField) huntField.style.display=(type==='hunt'||type==='event')?'':'none';
  if(threshold) threshold.style.display=type==='milestone'?'':'none';
}
function renderPreview(){
  const p=$s('#scPreview');if(!p)return;
  p.innerHTML=cardImageDraft?`<img src="${cardImageDraft}" alt="Voorbeeld">`:'Eigen Snazzle-afbeelding';
}
function openEditor(card=null){
  editingCardId=card?.id||null;cardImageDraft=card?.imageData||'';
  $s('#scEditor')?.classList.add('show');
  $s('#scEditorTitle').textContent=card?'Kaart bewerken':'Nieuwe Snazzle Card';
  $s('#scNumber').value=card?.number||nextNumber();
  $s('#scName').value=card?.name||'';
  $s('#scSeries').value=card?.series||'Snazzle Series 01';
  $s('#scDescription').value=card?.description||'';
  $s('#scRarity').value=card?.rarity||'core';
  $s('#scUnlockType').value=card?.unlockType||'hunt';
  populateHuntSelect();$s('#scHuntId').value=card?.huntId||'';
  $s('#scThreshold').value=Number(card?.threshold)||5;
  $s('#scActive').checked=card?.active!==false;
  toggleUnlockFields();renderPreview();
  $s('#scEditor').scrollIntoView({behavior:'smooth',block:'start'});
}
function closeEditor(){editingCardId=null;cardImageDraft='';$s('#scEditor')?.classList.remove('show');const f=$s('#scImage');if(f)f.value='';}
async function saveCard(){
  if(!isSuperAdmin){toast('Alleen de hoofdbeheerder kan kaarten opslaan.');return;}
  const number=$s('#scNumber').value.trim().toUpperCase();
  const name=$s('#scName').value.trim();
  const series=$s('#scSeries').value.trim();
  const rarity=$s('#scRarity').value;
  const unlockType=$s('#scUnlockType').value;
  const huntId=$s('#scHuntId').value||'';
  const threshold=Math.max(1,Number($s('#scThreshold').value)||1);
  if(!number||!name||!series){toast('Vul nummer, naam en serie in.');return;}
  if(!cardImageDraft){toast('Voeg eerst je Snazzle-afbeelding toe.');return;}
  if((unlockType==='hunt'||unlockType==='event')&&!huntId){toast('Koppel deze kaart aan een Hunt.');return;}
  const duplicate=cards.find(c=>String(c.number).toUpperCase()===number&&c.id!==editingCardId);
  if(duplicate){toast('Dit kaartnummer bestaat al.');return;}
  const id=editingCardId||`${slug(number)}-${Math.random().toString(36).slice(2,7)}`;
  const old=cards.find(c=>c.id===id)||{};
  const card={...old,id,number,name,series,description:$s('#scDescription').value.trim(),rarity,unlockType,huntId:(unlockType==='hunt'||unlockType==='event')?huntId:'',threshold:unlockType==='milestone'?threshold:0,imageData:cardImageDraft,active:$s('#scActive').checked,updatedAt:new Date().toISOString(),createdAt:old.createdAt||new Date().toISOString()};
  localCards=localCards.filter(c=>c.id!==id).concat(card);saveLocalCards();mergeCards();
  let central=false;
  if(db){try{await setDoc(doc(db,'snazzleCards',id),card,{merge:true});central=true;}catch(err){console.warn('Snazzle card central save pending',err);}}
  closeEditor();renderAdminCards();toast(central?'Snazzle Card centraal opgeslagen ✨':'Kaart opgeslagen op dit toestel. Centrale synchronisatie volgt.');
}
async function removeCard(id){
  const c=cards.find(x=>x.id===id);if(!c)return;
  if(!confirm(`Kaart ${c.number} – ${c.name} verwijderen?`))return;
  localCards=localCards.filter(x=>x.id!==id);saveLocalCards();centralCards=centralCards.filter(x=>x.id!==id);mergeCards();
  if(db&&isSuperAdmin){try{await deleteDoc(doc(db,'snazzleCards',id));}catch(err){console.warn('Central delete pending',err);}}
  renderAdminCards();toast('Kaart verwijderd');
}
function renderAdminCards(){
  const list=$s('#scAdminList');if(!list)return;
  const sync=$s('#scSyncState');if(sync) sync.textContent=cardsCentralReady?'☁️ Centrale kaartensynchronisatie actief':'📱 Lokale kaartweergave actief; centrale Firebase-regel wordt voorbereid';
  list.innerHTML=cards.length?cards.map(c=>`<div class="sc-admin-row"><div class="sc-admin-thumb">${c.imageData?`<img src="${c.imageData}" alt="">`:'🦆'}</div><div><strong>${esc(c.number)} · ${esc(c.name)}</strong><small>${rarityLabel(c.rarity)} · ${esc(c.series)} · ${sourceLabel(c)}</small></div><div class="sc-admin-buttons"><button type="button" data-sc-edit="${esc(c.id)}">Bewerken</button><button type="button" class="danger" data-sc-delete="${esc(c.id)}">Verwijderen</button></div></div>`).join(''):'<div class="sc-empty">Nog geen kaarten. Maak de eerste Snazzle Card.</div>';
  $$s('[data-sc-edit]',list).forEach(b=>b.onclick=()=>openEditor(cards.find(c=>c.id===b.dataset.scEdit)));
  $$s('[data-sc-delete]',list).forEach(b=>b.onclick=()=>removeCard(b.dataset.scDelete));
}

function renderEverywhere(){ensureCollectionExtension();renderCatalog();renderVault();updateHomeStatus();renderAdminCards();}
function watchDom(){
  ensureCollectionExtension();ensureAdminUI();
  const obs=new MutationObserver(()=>{ensureCollectionExtension();if(isSuperAdmin)ensureAdminUI();updateHomeStatus();});
  obs.observe(document.body,{childList:true,subtree:true});
}
function subscribeData(){
  if(!db||!currentUser)return;
  if(unsubHunts)unsubHunts();
  unsubHunts=onSnapshot(collection(db,'hunts'),snap=>{hunts=snap.docs.map(d=>({id:d.id,...d.data()}));populateHuntSelect();renderEverywhere();},err=>console.warn('Cards: hunts konden niet worden gelezen',err));
  if(unsubCards)unsubCards();
  unsubCards=onSnapshot(collection(db,'snazzleCards'),snap=>{cardsCentralReady=true;centralCards=snap.docs.map(d=>({id:d.id,...d.data()}));mergeCards();},err=>{cardsCentralReady=false;centralCards=[];mergeCards();console.warn('Snazzle Cards wachten op Firestore-regel',err);});
}
async function checkAdmin(user){
  isSuperAdmin=false;
  if(!user||!db)return;
  try{const s=await getDoc(doc(db,'adminUsers',user.uid));isSuperAdmin=s.exists()&&s.data().active===true&&s.data().role==='superadmin';}catch{}
  if(isSuperAdmin)ensureAdminUI();
}
function init(){
  if(window.__snazzleCardSystemLoaded)return;window.__snazzleCardSystemLoaded=true;
  injectStyles();watchDom();mergeCards();
  if(auth)onAuthStateChanged(auth,async user=>{currentUser=user||null;await checkAdmin(user);subscribeData();renderEverywhere();});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
console.info(`Snazzle Cards ${CARD_VERSION} geladen`);
