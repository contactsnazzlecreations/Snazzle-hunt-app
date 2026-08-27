// Snazzle v120 — alleen in Beheer geselecteerde dorpen zichtbaar op de publieke home.
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
function publicVisible(d){
  const data=d.data()||{};
  return data.publicVisible!==false;
}
function visibleNames(){return villageDocs.filter(publicVisible).map(villageNameFromDoc).filter(Boolean);}
function hiddenNames(){return new Set(villageDocs.filter(d=>!publicVisible(d)).map(villageNameFromDoc));}

function applyPublicVisibility(){
  const hidden=hiddenNames();
  const buttons=[...document.querySelectorAll('#villages .village')];
  if(!buttons.length) return;
  buttons.forEach(btn=>{
    const name=norm(btn.textContent);
    btn.style.display=hidden.has(name)?'none':'';
    btn.setAttribute('aria-hidden',hidden.has(name)?'true':'false');
  });

  const shown=buttons.filter(b=>b.style.display!=='none');
  if(!shown.length){
    buttons.forEach(b=>{b.style.display='';b.setAttribute('aria-hidden','false');});
    return;
  }

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
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=text;t.classList.add('show');
  clearTimeout(window.__snVillageToast120);
  window.__snVillageToast120=setTimeout(()=>t.classList.remove('show'),2600);
}

async function setVisible(id,visible){
  if(!isSuperAdmin){toast('Alleen de hoofdbeheerder kan dorpen tonen of verbergen');return;}
  try{
    await setDoc(doc(db,'villages',id),{publicVisible:visible},{merge:true});
    toast(visible?'Dorp zichtbaar op Home ✅':'Dorp verborgen op Home ✅');
  }catch(err){
    console.error(err);toast('Opslaan mislukt');
  }
}

function renderAdminRows(){
  const box=document.getElementById('snVillageVisibilityRows120');
  if(!box) return;
  if(!villageDocs.length){
    box.innerHTML='<div style="font-size:12px;color:#6d563a">Nog geen dorpen gevonden.</div>';
    return;
  }
  box.innerHTML='';
  villageDocs
    .filter(d=>!String(d.id).startsWith('__'))
    .sort((a,b)=>villageNameFromDoc(a).localeCompare(villageNameFromDoc(b),'nl'))
    .forEach(d=>{
      const name=villageNameFromDoc(d), checked=publicVisible(d);
      const row=document.createElement('label');
      row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;margin:8px 0;border:2px solid #b9955e;border-radius:14px;background:#fff8e8;color:#38281b';
      row.innerHTML=`<span><strong style="display:block">📍 ${name}</strong><small style="display:block;margin-top:2px;color:#6d563a">${checked?'Zichtbaar voor spelers':'Verborgen voor spelers'}</small></span><input type="checkbox" ${checked?'checked':''} style="width:24px;height:24px;flex:0 0 24px">`;
      const input=row.querySelector('input');
      input.disabled=!isSuperAdmin;
      input.addEventListener('change',()=>setVisible(d.id,input.checked));
      box.appendChild(row);
    });
}

function installAdmin(){
  if(adminInstalled) return;
  const host=document.getElementById('imagesAdmin') || document.querySelector('#adminPanel .panel') || document.querySelector('[data-admin-section="images"]');
  if(!host) return;
  adminInstalled=true;
  const wrap=document.createElement('section');
  wrap.id='snVillageVisibilityAdmin120';
  wrap.style.cssText='margin:18px 0 8px;padding:14px;border:2px solid #9d7747;border-radius:17px;background:#f8e8b8;color:#352617';
  wrap.innerHTML=`<h3 style="margin:0 0 5px">🏘️ Dorpen op Home</h3><p style="margin:0 0 10px;font-size:12px;line-height:1.45">Kies welke dorpen spelers op het hoofdscherm zien. Een verborgen dorp blijft in Beheer bestaan en kun je later weer aanzetten.</p><div id="snVillageVisibilityRows120"></div>`;
  host.appendChild(wrap);
  renderAdminRows();
}

function scheduleApply(){setTimeout(applyPublicVisibility,0);setTimeout(applyPublicVisibility,250);setTimeout(installAdmin,350);}

onSnapshot(collection(db,'villages'),snap=>{
  villageDocs=snap.docs;
  applyPublicVisibility();
  renderAdminRows();
  scheduleApply();
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
  adminInstalled=false;
  installAdmin();
  renderAdminRows();
});

document.addEventListener('click',e=>{
  if(e.target.closest?.('#quickMenuBtn,#adminBtn,.admin,[data-tab]')) scheduleApply();
},{passive:true});

setTimeout(scheduleApply,700);
setTimeout(scheduleApply,1800);
window.SnazzleVillageVisibilityV120={apply:applyPublicVisibility};
