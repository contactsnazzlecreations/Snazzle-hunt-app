// Snazzle v120.2 — dorpzichtbaarheid direct in het bestaande Dorpen-beheer.
import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
let villageDocs=[];
let isSuperAdmin=false;

function norm(s){return String(s||'').replace(/^\s*📍\s*/,'').trim();}
function keyName(s){return norm(s).toLocaleLowerCase('nl');}
function villageNameFromDoc(d){const data=d.data()||{};return norm(data.name||data.village||d.id);}
function publicVisible(d){return (d?.data?.()||{}).publicVisible!==false;}
function docForName(name){return villageDocs.find(d=>keyName(villageNameFromDoc(d))===keyName(name))||null;}
function hiddenKeys(){return new Set(villageDocs.filter(d=>!publicVisible(d)).map(d=>keyName(villageNameFromDoc(d))));}

function toast(text){
  const t=document.getElementById('toast');if(!t)return;
  t.textContent=text;t.classList.add('show');clearTimeout(window.__snVillageToast120);
  window.__snVillageToast120=setTimeout(()=>t.classList.remove('show'),2600);
}

function applyPublicVisibility(){
  const hidden=hiddenKeys();
  const buttons=[...document.querySelectorAll('#villages .village')];
  if(!buttons.length)return;
  buttons.forEach(btn=>{
    const label=btn.querySelector('.v31-village-label')?.textContent||btn.textContent;
    const hide=hidden.has(keyName(label));
    btn.style.display=hide?'none':'';
    btn.setAttribute('aria-hidden',hide?'true':'false');
  });
  const shown=buttons.filter(b=>b.style.display!=='none');
  if(!shown.length){
    buttons.forEach(b=>{b.style.display='';b.setAttribute('aria-hidden','false');});
    return;
  }
  const chosen=norm(document.getElementById('chosenVillageLabel')?.textContent||localStorage.getItem('snazzleVillage')||'');
  if(hidden.has(keyName(chosen))){
    const first=shown[0];
    const next=norm(first.querySelector('.v31-village-label')?.textContent||first.textContent);
    if(next&&next!==chosen){
      try{localStorage.setItem('snazzleVillage',next);}catch{}
      if(!sessionStorage.getItem('snVillageVisibilityReloaded120')){
        sessionStorage.setItem('snVillageVisibilityReloaded120','1');
        location.reload();
      }
    }
  }
}

async function setVisible(name,visible){
  if(!isSuperAdmin){toast('Alleen de hoofdbeheerder kan dit aanpassen');return false;}
  const existing=docForName(name);
  const id=existing?.id||name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  try{
    await setDoc(doc(db,'villages',id),{name,publicVisible:visible},{merge:true});
    toast(visible?'Dorp zichtbaar op Home ✅':'Dorp verborgen op Home ✅');
    return true;
  }catch(err){console.error(err);toast('Opslaan mislukt');return false;}
}

function ensureStyle(){
  if(document.getElementById('snVillageVisibilityStyle120'))return;
  const s=document.createElement('style');s.id='snVillageVisibilityStyle120';
  s.textContent=`
    #snVillageVisibilityAdmin120{display:none!important}
    .sn-village-home-toggle120{margin:13px 0 2px;padding:11px 12px;border:1.5px solid #ccb17c;border-radius:14px;background:#fffaf0;color:#3b2b1f;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;min-width:0}
    .sn-village-home-toggle120 .sn-copy{min-width:0}
    .sn-village-home-toggle120 strong{display:block!important;font-size:13px!important;line-height:1.25!important;color:#315d34!important;margin:0!important;white-space:normal!important;overflow-wrap:break-word!important}
    .sn-village-home-toggle120 small{display:block;margin-top:3px;color:#755f41;font-size:11px;line-height:1.3;font-weight:700;white-space:normal}
    .sn-switch120{position:relative;display:inline-block;width:52px;height:30px;flex:0 0 52px}
    .sn-switch120 input{position:absolute;opacity:0;width:1px!important;height:1px!important;pointer-events:none}
    .sn-switch120 span{position:absolute;inset:0;border-radius:999px;background:#a78e69;box-shadow:inset 0 0 0 2px rgba(91,66,37,.18);transition:.18s ease}
    .sn-switch120 span:after{content:'';position:absolute;width:22px;height:22px;left:4px;top:4px;border-radius:50%;background:#fffdf6;box-shadow:0 2px 5px rgba(0,0,0,.28);transition:.18s ease}
    .sn-switch120 input:checked+span{background:#4b984e}
    .sn-switch120 input:checked+span:after{transform:translateX(22px)}
    .sn-switch120 input:disabled+span{opacity:.55}
  `;
  document.head.appendChild(s);
}

function cardVillageName(card){
  const candidates=[...card.querySelectorAll('strong')];
  const top=candidates.find(el=>/^\s*📍/.test(el.textContent||''))||candidates[0];
  return norm(top?.textContent||'');
}

function syncAdminCards(){
  ensureStyle();
  document.getElementById('snVillageVisibilityAdmin120')?.remove();
  const list=document.getElementById('adminVillageList');
  if(!list)return;
  [...list.children].forEach(card=>{
    const name=cardVillageName(card);if(!name)return;
    const d=docForName(name),checked=d?publicVisible(d):true;
    let row=card.querySelector(':scope > .sn-village-home-toggle120');
    if(!row){
      row=document.createElement('div');row.className='sn-village-home-toggle120';
      row.innerHTML='<div class="sn-copy"><strong>👁️ Tonen op Home</strong><small></small></div><label class="sn-switch120"><input type="checkbox"><span></span></label>';
      const imageAdmin=card.querySelector(':scope > .v33-village-image-admin');
      if(imageAdmin)card.insertBefore(row,imageAdmin);else card.appendChild(row);
      ['click','pointerdown','touchstart','keydown'].forEach(type=>row.addEventListener(type,e=>e.stopPropagation()));
      const input=row.querySelector('input');
      input.addEventListener('change',async()=>{
        const wanted=input.checked;
        input.disabled=true;
        const ok=await setVisible(name,wanted);
        if(!ok)input.checked=!wanted;
        input.disabled=!isSuperAdmin;
      });
    }
    const input=row.querySelector('input');
    const small=row.querySelector('small');
    input.checked=checked;
    input.disabled=!isSuperAdmin;
    small.textContent=checked?'Dit dorp is zichtbaar voor spelers op het hoofdscherm.':'Dit dorp blijft in Beheer, maar is verborgen op het hoofdscherm.';
  });
}

function syncAll(){applyPublicVisibility();syncAdminCards();}

onSnapshot(collection(db,'villages'),snap=>{
  villageDocs=snap.docs;
  syncAll();
},err=>console.warn('Dorpzichtbaarheid kon niet laden',err));

onAuthStateChanged(auth,async user=>{
  isSuperAdmin=false;
  if(user&&!user.isAnonymous){
    try{
      const s=await getDoc(doc(db,'adminUsers',user.uid));
      const d=s.data()||{};
      isSuperAdmin=s.exists()&&d.active===true&&d.role==='superadmin';
    }catch{}
  }
  syncAdminCards();
});

let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;queued=true;
  setTimeout(()=>{queued=false;syncAll();},120);
});
if(document.body)observer.observe(document.body,{childList:true,subtree:true});
else document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});

document.addEventListener('click',e=>{
  if(e.target.closest?.('#quickMenuBtn,#adminBtn,.admin,[data-tab]'))setTimeout(syncAll,180);
},{passive:true});

setTimeout(syncAll,600);setTimeout(syncAll,1600);
window.SnazzleVillageVisibilityV120={apply:applyPublicVisibility,sync:syncAdminCards};
