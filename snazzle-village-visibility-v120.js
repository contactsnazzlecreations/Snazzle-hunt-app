// Snazzle v120.5 — dorpzichtbaarheid direct in Dorpen-beheer + centrale Home-filter.
import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
let villageDocs=[];
let isSuperAdmin=false;
let stopVillageListener=null;

function norm(s){return String(s||'').replace(/^\s*📍\s*/,'').trim();}
function keyName(s){return norm(s).toLocaleLowerCase('nl');}
function villageNameFromDoc(d){const data=d.data()||{};return norm(data.name||data.village||d.id);}
function publicVisible(d){return (d?.data?.()||{}).publicVisible!==false;}
function docForName(name){return villageDocs.find(d=>keyName(villageNameFromDoc(d))===keyName(name))||null;}
function hiddenKeys(){return new Set(villageDocs.filter(d=>!publicVisible(d)).map(d=>keyName(villageNameFromDoc(d))));}

function toast(text){const t=document.getElementById('toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(window.__snVillageToast120);window.__snVillageToast120=setTimeout(()=>t.classList.remove('show'),2600);}

// Home is in verschillende lagen opgebouwd. Daarom zoeken we de dorpsknoppen niet
// alleen onder #villages, maar centraal op de publieke Home. Admin-kaarten vallen af.
function homeVillageButtons(){
  return [...document.querySelectorAll('.village')].filter(btn=>
    !btn.closest('#adminSheet,#adminVillageList,.admin-sheet,.sheet.admin') &&
    (btn.closest('#villages') || btn.querySelector('.v31-village-label') || btn.matches('[data-village]'))
  );
}
function buttonVillageName(btn){return norm(btn.querySelector('.v31-village-label')?.textContent||btn.getAttribute('data-village')||btn.textContent||'');}

function applyPublicVisibility(){
  const hidden=hiddenKeys();
  const buttons=homeVillageButtons();
  if(!buttons.length)return;
  buttons.forEach(btn=>{
    const hide=hidden.has(keyName(buttonVillageName(btn)));
    btn.classList.toggle('sn-village-hidden120',hide);
    btn.hidden=hide;
    btn.setAttribute('aria-hidden',hide?'true':'false');
    if(hide){btn.style.setProperty('display','none','important');btn.style.setProperty('visibility','hidden','important');btn.style.setProperty('pointer-events','none','important');}
    else{btn.style.removeProperty('display');btn.style.removeProperty('visibility');btn.style.removeProperty('pointer-events');}
  });
  const shown=buttons.filter(b=>!b.hidden);
  if(!shown.length)return;
  const chosen=norm(document.getElementById('chosenVillageLabel')?.textContent||localStorage.getItem('snazzleVillage')||'');
  if(hidden.has(keyName(chosen))){
    const next=buttonVillageName(shown[0]);
    if(next&&next!==chosen){try{localStorage.setItem('snazzleVillage',next);}catch{} const label=document.getElementById('chosenVillageLabel');if(label)label.textContent='📍 '+next;}
  }
}

async function setVisible(name,visible){
  if(!isSuperAdmin){toast('Alleen de hoofdbeheerder kan dit aanpassen');return false;}
  const existing=docForName(name);
  const id=existing?.id||name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  try{await setDoc(doc(db,'villages',id),{name,publicVisible:visible},{merge:true});toast(visible?'Dorp zichtbaar op Home ✅':'Dorp verborgen op Home ✅');return true;}
  catch(err){console.error(err);toast('Opslaan mislukt');return false;}
}

function ensureStyle(){
  if(document.getElementById('snVillageVisibilityStyle120'))return;
  const s=document.createElement('style');s.id='snVillageVisibilityStyle120';s.textContent=`
    #snVillageVisibilityAdmin120{display:none!important}
    .village.sn-village-hidden120{display:none!important;visibility:hidden!important;pointer-events:none!important}
    .sn-village-home-toggle120{margin:13px 0 2px;padding:11px 12px;border:1.5px solid #ccb17c;border-radius:14px;background:#fffaf0;color:#3b2b1f;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;min-width:0}
    .sn-village-home-toggle120 .sn-copy{min-width:0}.sn-village-home-toggle120 strong{display:block!important;font-size:13px!important;line-height:1.25!important;color:#315d34!important;margin:0!important;white-space:normal!important;overflow-wrap:break-word!important}.sn-village-home-toggle120 small{display:block;margin-top:3px;color:#755f41;font-size:11px;line-height:1.3;font-weight:700;white-space:normal}
    .sn-switch120{position:relative;display:inline-block;width:52px;height:30px;flex:0 0 52px}.sn-switch120 input{position:absolute;opacity:0;width:1px!important;height:1px!important;pointer-events:none}.sn-switch120 span{position:absolute;inset:0;border-radius:999px;background:#a78e69;box-shadow:inset 0 0 0 2px rgba(91,66,37,.18);transition:.18s ease}.sn-switch120 span:after{content:'';position:absolute;width:22px;height:22px;left:4px;top:4px;border-radius:50%;background:#fffdf6;box-shadow:0 2px 5px rgba(0,0,0,.28);transition:.18s ease}.sn-switch120 input:checked+span{background:#4b984e}.sn-switch120 input:checked+span:after{transform:translateX(22px)}.sn-switch120 input:disabled+span{opacity:.55}
  `;document.head.appendChild(s);
}
function cardVillageName(card){const candidates=[...card.querySelectorAll('strong')];const top=candidates.find(el=>/^\s*📍/.test(el.textContent||''))||candidates[0];return norm(top?.textContent||'');}
function syncAdminCards(){
  ensureStyle();document.getElementById('snVillageVisibilityAdmin120')?.remove();const list=document.getElementById('adminVillageList');if(!list)return;
  [...list.children].forEach(card=>{const name=cardVillageName(card);if(!name)return;const d=docForName(name),checked=d?publicVisible(d):true;let row=card.querySelector(':scope > .sn-village-home-toggle120');
    if(!row){row=document.createElement('div');row.className='sn-village-home-toggle120';row.innerHTML='<div class="sn-copy"><strong>👁️ Tonen op Home</strong><small></small></div><label class="sn-switch120"><input type="checkbox"><span></span></label>';const imageAdmin=card.querySelector(':scope > .v33-village-image-admin');if(imageAdmin)card.insertBefore(row,imageAdmin);else card.appendChild(row);['click','pointerdown','touchstart','keydown'].forEach(type=>row.addEventListener(type,e=>e.stopPropagation()));const input=row.querySelector('input');input.addEventListener('change',async()=>{const wanted=input.checked;input.disabled=true;const ok=await setVisible(name,wanted);if(!ok)input.checked=!wanted;input.disabled=!isSuperAdmin;setTimeout(applyPublicVisibility,0);setTimeout(applyPublicVisibility,250);});}
    const input=row.querySelector('input'),small=row.querySelector('small');input.checked=checked;input.disabled=!isSuperAdmin;small.textContent=checked?'Dit dorp is zichtbaar voor spelers op het hoofdscherm.':'Dit dorp blijft in Beheer, maar is verborgen op het hoofdscherm.';
  });
}
function syncAll(){applyPublicVisibility();syncAdminCards();}
function startVillageListener(){stopVillageListener?.();stopVillageListener=onSnapshot(collection(db,'villages'),snap=>{villageDocs=snap.docs;syncAll();setTimeout(applyPublicVisibility,150);setTimeout(applyPublicVisibility,600);},err=>console.warn('Dorpzichtbaarheid kon niet laden',err));}
onAuthStateChanged(auth,async user=>{isSuperAdmin=false;if(!user){stopVillageListener?.();stopVillageListener=null;return;}startVillageListener();if(!user.isAnonymous){try{const s=await getDoc(doc(db,'adminUsers',user.uid));const d=s.data()||{};isSuperAdmin=s.exists()&&d.active===true&&d.role==='superadmin';}catch{}}syncAdminCards();});

// Bewaak de hele publieke DOM, omdat v31 en latere lagen de dorpenbalk opnieuw kunnen maken.
let queued=false;
const observer=new MutationObserver(()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;syncAdminCards();applyPublicVisibility();},80);});
function beginObserve(){observer.observe(document.body,{childList:true,subtree:true});}
if(document.body)beginObserve();else document.addEventListener('DOMContentLoaded',beginObserve,{once:true});
document.addEventListener('click',e=>{if(e.target.closest?.('#quickMenuBtn,#adminBtn,.admin,[data-tab],#homeBtn,.village'))setTimeout(syncAll,120);},{passive:true});
setInterval(applyPublicVisibility,1200);
setTimeout(syncAll,400);setTimeout(syncAll,1200);setTimeout(applyPublicVisibility,2400);
window.SnazzleVillageVisibilityV120={apply:applyPublicVisibility,sync:syncAdminCards};
