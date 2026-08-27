// Snazzle v120.1 — alleen echte dorpen tonen in Beheer en nette mobiele kaarten.
import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
let villageDocs=[];
let isSuperAdmin=false;
let adminInstalled=false;

function norm(s){return String(s||'').replace(/^\s*📍\s*/,'').trim();}
function villageNameFromDoc(d){
  const data=d.data()||{};
  return norm(data.name||data.village||d.id);
}
function publicVisible(d){return (d?.data?.()||{}).publicVisible!==false;}
function homeVillageNames(){
  return [...new Set([...document.querySelectorAll('#villages .village')].map(b=>norm(b.textContent)).filter(Boolean))];
}
function docForName(name){return villageDocs.find(d=>villageNameFromDoc(d).toLocaleLowerCase('nl')===name.toLocaleLowerCase('nl'))||null;}
function hiddenNames(){
  return new Set(villageDocs.filter(d=>!publicVisible(d)).map(villageNameFromDoc));
}

function applyPublicVisibility(){
  const hidden=hiddenNames();
  const buttons=[...document.querySelectorAll('#villages .village')];
  if(!buttons.length) return;
  buttons.forEach(btn=>{
    const name=norm(btn.textContent), hide=hidden.has(name);
    btn.style.display=hide?'none':'';
    btn.setAttribute('aria-hidden',hide?'true':'false');
  });
  const shown=buttons.filter(b=>b.style.display!=='none');
  if(!shown.length){buttons.forEach(b=>{b.style.display='';b.setAttribute('aria-hidden','false');});return;}
  const chosen=norm(document.getElementById('chosenVillageLabel')?.textContent||localStorage.getItem('snazzleVillage')||'');
  if(hidden.has(chosen)){
    const next=norm(shown[0].textContent);
    if(next&&next!==chosen){
      try{localStorage.setItem('snazzleVillage',next);}catch{}
      if(!sessionStorage.getItem('snVillageVisibilityReloaded120')){
        sessionStorage.setItem('snVillageVisibilityReloaded120','1');
        location.reload();
      }
    }
  }
}

function toast(text){
  const t=document.getElementById('toast');if(!t)return;
  t.textContent=text;t.classList.add('show');clearTimeout(window.__snVillageToast120);
  window.__snVillageToast120=setTimeout(()=>t.classList.remove('show'),2600);
}

async function setVisible(name,visible){
  if(!isSuperAdmin){toast('Alleen de hoofdbeheerder kan dorpen tonen of verbergen');return;}
  const existing=docForName(name);
  const id=existing?.id || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  try{
    await setDoc(doc(db,'villages',id),{name,publicVisible:visible},{merge:true});
    toast(visible?'Dorp zichtbaar op Home ✅':'Dorp verborgen op Home ✅');
  }catch(err){console.error(err);toast('Opslaan mislukt');}
}

function ensureStyle(){
  if(document.getElementById('snVillageVisibilityStyle120'))return;
  const s=document.createElement('style');s.id='snVillageVisibilityStyle120';
  s.textContent=`
    #snVillageVisibilityAdmin120{overflow:hidden}
    #snVillageVisibilityRows120{display:grid;gap:9px;min-width:0}
    .sn-village-row120{display:grid;grid-template-columns:minmax(0,1fr) 30px;align-items:center;gap:12px;padding:12px 13px;margin:0;border:2px solid #b9955e;border-radius:14px;background:#fff8e8;color:#38281b;min-width:0;overflow:hidden}
    .sn-village-copy120{min-width:0;overflow:hidden}
    .sn-village-copy120 strong{display:block;font-size:16px;line-height:1.22;white-space:normal;overflow-wrap:anywhere;word-break:break-word}
    .sn-village-copy120 small{display:block;margin-top:4px;color:#6d563a;font-size:12px;line-height:1.25;white-space:normal}
    .sn-village-row120 input{width:24px!important;height:24px!important;min-width:24px!important;margin:0!important;padding:0!important;justify-self:end}
  `;
  document.head.appendChild(s);
}

function renderAdminRows(){
  const box=document.getElementById('snVillageVisibilityRows120');if(!box)return;
  ensureStyle();
  const names=homeVillageNames();
  if(!names.length){box.innerHTML='<div style="font-size:12px;color:#6d563a">Nog geen dorpen gevonden.</div>';return;}
  box.innerHTML='';
  names.sort((a,b)=>a.localeCompare(b,'nl')).forEach(name=>{
    const d=docForName(name),checked=d?publicVisible(d):true;
    const row=document.createElement('label');row.className='sn-village-row120';
    const copy=document.createElement('span');copy.className='sn-village-copy120';
    const strong=document.createElement('strong');strong.textContent='📍 '+name;
    const small=document.createElement('small');small.textContent=checked?'Zichtbaar voor spelers':'Verborgen voor spelers';
    copy.append(strong,small);
    const input=document.createElement('input');input.type='checkbox';input.checked=checked;input.disabled=!isSuperAdmin;
    input.addEventListener('change',()=>setVisible(name,input.checked));
    row.append(copy,input);box.appendChild(row);
  });
}

function installAdmin(){
  if(adminInstalled&&document.getElementById('snVillageVisibilityAdmin120'))return;
  const host=document.getElementById('imagesAdmin')||document.querySelector('#adminPanel .panel')||document.querySelector('[data-admin-section="images"]');
  if(!host)return;
  document.getElementById('snVillageVisibilityAdmin120')?.remove();
  adminInstalled=true;ensureStyle();
  const wrap=document.createElement('section');wrap.id='snVillageVisibilityAdmin120';
  wrap.style.cssText='margin:18px 0 8px;padding:14px;border:2px solid #9d7747;border-radius:17px;background:#f8e8b8;color:#352617';
  wrap.innerHTML='<h3 style="margin:0 0 5px">🏘️ Dorpen op Home</h3><p style="margin:0 0 10px;font-size:12px;line-height:1.45">Kies welke dorpen spelers op het hoofdscherm zien. Een verborgen dorp blijft in Beheer bestaan en kun je later weer aanzetten.</p><div id="snVillageVisibilityRows120"></div>';
  host.appendChild(wrap);renderAdminRows();
}
function scheduleApply(){setTimeout(applyPublicVisibility,0);setTimeout(applyPublicVisibility,250);setTimeout(()=>{installAdmin();renderAdminRows();},350);}

onSnapshot(collection(db,'villages'),snap=>{villageDocs=snap.docs;applyPublicVisibility();renderAdminRows();scheduleApply();},err=>console.warn('Dorpzichtbaarheid kon niet laden',err));
onAuthStateChanged(auth,async user=>{
  isSuperAdmin=false;
  if(user&&!user.isAnonymous){try{const s=await getDoc(doc(db,'adminUsers',user.uid));const d=s.data()||{};isSuperAdmin=s.exists()&&d.active===true&&d.role==='superadmin';}catch{}}
  adminInstalled=false;installAdmin();renderAdminRows();
});
document.addEventListener('click',e=>{if(e.target.closest?.('#quickMenuBtn,#adminBtn,.admin,[data-tab]'))scheduleApply();},{passive:true});
setTimeout(scheduleApply,700);setTimeout(scheduleApply,1800);
window.SnazzleVillageVisibilityV120={apply:applyPublicVisibility};
