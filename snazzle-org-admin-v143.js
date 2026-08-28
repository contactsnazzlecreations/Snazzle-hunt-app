// Snazzle Organisatieplatform v143 — hoofdbeheer voor Special Hunts en Snazzle Bibliotheek.
import { getDocs, collection, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';
import {
  $,esc,state,db,storage,toast,errorMessage,call,fmtDate,fmtRange,codeDisplay,
  localInput,inputIso,installStyles
} from './snazzle-org-shared-v143.js';

let selectedHuntId='',adminObserver=null,villages=[];

export async function checkRole(){
  state.superAdmin=false;
  if(!state.user)return false;
  try{
    const snap=await getDoc(doc(db,'adminUsers',state.user.uid));
    const p=snap.exists()?snap.data():null;
    state.superAdmin=!!(p?.active===true&&p?.role==='superadmin');
  }catch{}
  installAdminUi();
  return state.superAdmin;
}
async function loadVillages(){
  if(villages.length)return villages;
  try{
    const snap=await getDocs(collection(db,'villages'));
    snap.forEach(d=>{const x=d.data()||{};if(x.active!==false)villages.push(String(x.name||x.title||d.id));});
  }catch{}
  villages=[...new Set([...villages,localStorage.getItem('snazzleVillage')||'', 'Montfort','Posterholt','Sint Odiliënberg'].filter(Boolean))];
  return villages;
}
function installAdminUi(){
  installStyles();
  const sheet=$('#adminSheet'),tabs=sheet?.querySelector('.super-only .tabs'),anchor=sheet?.querySelector('.super-only');
  if(!sheet||!tabs||!anchor)return false;
  if(!$('#snOrgAdminTab143')){
    const tab=document.createElement('button');
    tab.id='snOrgAdminTab143';tab.type='button';tab.textContent='Special Hunts';
    tabs.appendChild(tab);
    const sec=document.createElement('section');
    sec.id='snOrgAdmin143';sec.className='admin-section';
    sec.innerHTML=`
      <h3>Special Hunts & Bibliotheek 🎪</h3>
      <div class="sn-org143-note">Tijdelijke Hunts staan los van de gewone Snazzle-app. Organisaties krijgen nooit jouw Beheer: alleen een tijdelijke plaatscode voor hun eigen Hunt.</div>
      <div class="sn-org143-subtabs"><button class="on" data-org-admin-sub="hunts">Special Hunts</button><button data-org-admin-sub="library">Snazzle Bibliotheek</button></div>
      <div class="sn-org143-subsection on" id="snOrgAdminHunts143">
        <button class="save" id="snOrgAdminNew143" type="button">+ Nieuwe Special Hunt</button>
        <div id="snOrgAdminHuntList143" style="margin-top:10px"></div>
        <div id="snOrgAdminEditor143" style="display:none;margin-top:16px"></div>
      </div>
      <div class="sn-org143-subsection" id="snOrgAdminLibrary143">
        <button class="save" id="snOrgAdminNewAsset143" type="button">+ Snazzle toevoegen aan Bibliotheek</button>
        <div id="snOrgAdminAssetEditor143" style="display:none;margin-top:14px"></div>
        <div id="snOrgAdminAssetList143" style="margin-top:10px"></div>
      </div>`;
    anchor.appendChild(sec);
    tab.onclick=()=>openAdminTab(tab,sec);
    tabs.querySelectorAll('button:not(#snOrgAdminTab143)').forEach(b=>b.addEventListener('click',()=>{tab.classList.remove('on');sec.classList.remove('on');}));
    sec.querySelectorAll('[data-org-admin-sub]').forEach(b=>b.onclick=()=>switchSub(b.dataset.orgAdminSub));
    $('#snOrgAdminNew143').onclick=()=>openHuntEditor();
    $('#snOrgAdminNewAsset143').onclick=()=>openAssetEditor();
  }
  const tab=$('#snOrgAdminTab143'),sec=$('#snOrgAdmin143');
  if(tab)tab.style.display=state.superAdmin?'':'none';
  if(!state.superAdmin)sec?.classList.remove('on');
  return true;
}
export function watchAdminUi(){
  if(installAdminUi())return;
  if(adminObserver||!document.body)return;
  adminObserver=new MutationObserver(()=>{if(installAdminUi()){adminObserver.disconnect();adminObserver=null;}});
  adminObserver.observe(document.body,{childList:true,subtree:true});
}
async function openAdminTab(tab,sec){
  if(!state.superAdmin)return;
  const sheet=$('#adminSheet'),tabs=sheet?.querySelector('.super-only .tabs');
  tabs?.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
  sheet?.querySelectorAll('.super-only .admin-section').forEach(s=>s.classList.remove('on'));
  tab.classList.add('on');sec.classList.add('on');
  switchSub('hunts');
  await Promise.all([loadVillages(),refreshHunts()]);
}
function switchSub(name){
  $('#snOrgAdmin143')?.querySelectorAll('[data-org-admin-sub]').forEach(b=>b.classList.toggle('on',b.dataset.orgAdminSub===name));
  $('#snOrgAdminHunts143')?.classList.toggle('on',name==='hunts');
  $('#snOrgAdminLibrary143')?.classList.toggle('on',name==='library');
  if(name==='library')refreshAssets();
}
async function refreshHunts(){
  const box=$('#snOrgAdminHuntList143');if(!box||!state.superAdmin)return;
  box.innerHTML='<div class="sn-org143-progress">Special Hunts laden…</div>';
  try{
    const d=await call('adminListOrgHunts');
    state.adminHunts=d.items||[];
    renderHunts();
  }catch(err){box.innerHTML=`<div class="sn-org143-empty">⚠️ ${esc(errorMessage(err))}</div>`;}
}
function renderHunts(){
  const box=$('#snOrgAdminHuntList143');if(!box)return;
  if(!state.adminHunts.length){box.innerHTML='<div class="sn-org143-empty">Nog geen Special Hunts aangemaakt.</div>';return;}
  box.innerHTML=state.adminHunts.map(h=>`<article class="sn-org143-admin-card">
    <h4>${esc(h.title)}</h4>
    <small>🏢 ${esc(h.organization)} · 📍 ${esc(h.village)}<br>
      🔑 Plaatsen: ${esc(fmtRange(h.accessStartsAt,h.accessEndsAt))}<br>
      🎪 Publiek: ${esc(fmtRange(h.publicStartsAt,h.publicEndsAt))}<br>
      ${h.active?'🟢 Ingeschakeld':'⚪ Uitgeschakeld'} · ${Number(h.pointCount||0)} AR-punten
    </small>
    <div class="sn-org143-admin-actions">
      <button class="sn-org143-secondary" style="margin:0" data-admin-edit="${esc(h.id)}">Bewerken</button>
      <button class="sn-org143-primary" data-admin-code="${esc(h.id)}">🔑 Nieuwe toegangscode</button>
      <button class="sn-org143-danger" data-admin-delete="${esc(h.id)}">Verwijderen</button>
    </div>
  </article>`).join('');
  box.querySelectorAll('[data-admin-edit]').forEach(b=>b.onclick=()=>openHuntEditor(b.dataset.adminEdit));
  box.querySelectorAll('[data-admin-code]').forEach(b=>b.onclick=()=>generateCode(b.dataset.adminCode));
  box.querySelectorAll('[data-admin-delete]').forEach(b=>b.onclick=()=>deleteHunt(b.dataset.adminDelete));
}
function villageOptions(selected){
  return [...new Set([selected,...villages].filter(Boolean))].map(v=>`<option ${v===selected?'selected':''}>${esc(v)}</option>`).join('');
}
async function openHuntEditor(id=''){
  selectedHuntId=id;
  await loadVillages();
  const h=state.adminHunts.find(x=>x.id===id)||{},ed=$('#snOrgAdminEditor143');
  if(!ed)return;
  ed.style.display='block';
  ed.innerHTML=`<h3>${id?'Special Hunt bewerken':'Nieuwe Special Hunt'}</h3>
    <div class="sn-org143-field"><label>Stichting / organisatie</label><input id="snOrgAdmOrg143" maxlength="70" value="${esc(h.organization||'')}"></div>
    <div class="sn-org143-field"><label>Naam Hunt / evenement</label><input id="snOrgAdmTitle143" maxlength="70" value="${esc(h.title||'')}"></div>
    <div class="sn-org143-field"><label>Dorp</label><select id="snOrgAdmVillage143">${villageOptions(h.village||localStorage.getItem('snazzleVillage')||'Montfort')}</select></div>
    <div class="sn-org143-field"><label>Korte uitleg</label><textarea id="snOrgAdmDesc143" maxlength="400">${esc(h.description||'')}</textarea></div>
    <h4>Wanneer mag de organisatie Snazzles plaatsen?</h4>
    <div class="sn-org143-row2">
      <div class="sn-org143-field"><label>Vanaf</label><input id="snOrgAdmAccessStart143" type="datetime-local" value="${esc(localInput(h.accessStartsAt))}"></div>
      <div class="sn-org143-field"><label>Tot</label><input id="snOrgAdmAccessEnd143" type="datetime-local" value="${esc(localInput(h.accessEndsAt))}"></div>
    </div>
    <h4>Wanneer zien kinderen de Hunt?</h4>
    <div class="sn-org143-row2">
      <div class="sn-org143-field"><label>Vanaf</label><input id="snOrgAdmPublicStart143" type="datetime-local" value="${esc(localInput(h.publicStartsAt))}"></div>
      <div class="sn-org143-field"><label>Tot</label><input id="snOrgAdmPublicEnd143" type="datetime-local" value="${esc(localInput(h.publicEndsAt))}"></div>
    </div>
    <div class="sn-org143-field"><label>Status</label><select id="snOrgAdmActive143"><option value="true"${h.active!==false?' selected':''}>Ingeschakeld</option><option value="false"${h.active===false?' selected':''}>Uitgeschakeld</option></select></div>
    <button class="sn-org143-primary" id="snOrgAdmSave143" type="button">Hunt opslaan</button>
    <button class="sn-org143-secondary" id="snOrgAdmCancel143" type="button">Annuleren</button>`;
  $('#snOrgAdmSave143').onclick=saveHunt;
  $('#snOrgAdmCancel143').onclick=()=>{ed.style.display='none';selectedHuntId='';};
  ed.scrollIntoView({behavior:'smooth',block:'start'});
}
async function saveHunt(){
  const btn=$('#snOrgAdmSave143');btn.disabled=true;
  try{
    const payload={
      huntId:selectedHuntId||undefined,
      organization:$('#snOrgAdmOrg143').value,
      title:$('#snOrgAdmTitle143').value,
      village:$('#snOrgAdmVillage143').value,
      description:$('#snOrgAdmDesc143').value,
      accessStartsAt:inputIso($('#snOrgAdmAccessStart143').value),
      accessEndsAt:inputIso($('#snOrgAdmAccessEnd143').value),
      publicStartsAt:inputIso($('#snOrgAdmPublicStart143').value),
      publicEndsAt:inputIso($('#snOrgAdmPublicEnd143').value),
      active:$('#snOrgAdmActive143').value==='true'
    };
    await call('adminSaveOrgHunt',payload);
    toast('Special Hunt opgeslagen ✅');
    $('#snOrgAdminEditor143').style.display='none';selectedHuntId='';
    await refreshHunts();
  }catch(err){toast('⚠️ '+errorMessage(err,'Opslaan lukte niet.'));}
  finally{btn.disabled=false;}
}
async function generateCode(id){
  const h=state.adminHunts.find(x=>x.id===id);if(!h)return;
  try{
    const d=await call('adminGenerateOrgAccessCode',{huntId:id});
    const code=codeDisplay(d.code);
    const basePath=location.pathname.replace(/[^/]*$/,'');
    const link=`${location.origin}${basePath}?orgaccess=1`;
    const copy=`Organisatiecode: ${code}\nPlaatsen tot: ${fmtDate(h.accessEndsAt)}\nOpen Snazzle via ${link}`;
    await navigator.clipboard?.writeText(copy).catch(()=>{});
    alert(`TIJDELIJKE ORGANISATIECODE\n\n${code}\n\n${h.organization}\n${h.title}\n\nPlaatsen tot ${fmtDate(h.accessEndsAt)}.\n\nDe code is aan één Snazzle-account te koppelen en stopt automatisch. De gegevens zijn indien toegestaan ook naar je klembord gekopieerd.`);
  }catch(err){toast('⚠️ '+errorMessage(err,'Code maken lukte niet.'));}
}
async function deleteHunt(id){
  const h=state.adminHunts.find(x=>x.id===id);
  if(!h||!confirm(`“${h.title}” definitief verwijderen?`))return;
  try{
    await call('adminDeleteOrgHunt',{huntId:id});
    toast('Special Hunt verwijderd.');
    await refreshHunts();
  }catch(err){toast(errorMessage(err,'Verwijderen lukte niet.'));}
}

async function refreshAssets(){
  const box=$('#snOrgAdminAssetList143');if(!box||!state.superAdmin)return;
  box.innerHTML='<div class="sn-org143-progress">Bibliotheek laden…</div>';
  try{
    const d=await call('adminListOrgAssets');
    state.adminAssets=d.items||[];
    renderAssets();
  }catch(err){box.innerHTML=`<div class="sn-org143-empty">⚠️ ${esc(errorMessage(err))}</div>`;}
}
function renderAssets(){
  const box=$('#snOrgAdminAssetList143');if(!box)return;
  if(!state.adminAssets.length){box.innerHTML='<div class="sn-org143-empty">Nog geen Snazzles in de centrale Bibliotheek.</div>';return;}
  box.innerHTML=`<div class="sn-org143-assets">${state.adminAssets.map(a=>`<button class="sn-org143-asset" data-admin-asset="${esc(a.id)}" type="button">
    <img src="${esc(a.imageUrl)}" alt="${esc(a.name)}" loading="lazy"><strong>${esc(a.name)}</strong>
    <small>${esc(a.category)}${a.allowedForOrg?' · Organisatie':''}${a.allowedForPersonal?' · Persoonlijk':''}${a.active?'':' · UIT'}</small>
  </button>`).join('')}</div>`;
  box.querySelectorAll('[data-admin-asset]').forEach(b=>b.onclick=()=>openAssetEditor(b.dataset.adminAsset));
}
function openAssetEditor(id=''){
  const a=state.adminAssets.find(x=>x.id===id)||{},ed=$('#snOrgAdminAssetEditor143');
  ed.style.display='block';ed.dataset.assetId=id;
  ed.innerHTML=`<h3>${id?'Snazzle aanpassen':'Snazzle toevoegen'}</h3>
    <div class="sn-org143-field"><label>Naam</label><input id="snOrgAssetName143" maxlength="60" value="${esc(a.name||'')}"></div>
    <div class="sn-org143-field"><label>Categorie</label><input id="snOrgAssetCategory143" maxlength="40" value="${esc(a.category||'Algemeen')}" placeholder="Bijv. Avontuur"></div>
    <div class="sn-org143-field"><label>Transparante PNG / WebP</label><input id="snOrgAssetFile143" type="file" accept="image/png,image/webp,image/*"></div>
    ${a.imageUrl?`<div style="height:130px;display:grid;place-items:center"><img src="${esc(a.imageUrl)}" style="max-width:100%;max-height:120px;object-fit:contain"></div>`:''}
    <div class="sn-org143-field"><label><input id="snOrgAssetOrg143" type="checkbox"${a.allowedForOrg!==false?' checked':''}> Beschikbaar voor organisaties</label></div>
    <div class="sn-org143-field"><label><input id="snOrgAssetPersonal143" type="checkbox"${a.allowedForPersonal===true?' checked':''}> Beschikbaar voor persoonlijke Hunts</label></div>
    <div class="sn-org143-field"><label><input id="snOrgAssetActive143" type="checkbox"${a.active!==false?' checked':''}> Actief in Bibliotheek</label></div>
    <button class="sn-org143-primary" id="snOrgAssetSave143" type="button">Snazzle opslaan</button>
    ${id?'<button class="sn-org143-secondary sn-org143-danger" id="snOrgAssetDelete143" type="button">Uit Bibliotheek verwijderen</button>':''}
    <button class="sn-org143-secondary" id="snOrgAssetCancel143" type="button">Annuleren</button>`;
  $('#snOrgAssetSave143').onclick=saveAsset;
  $('#snOrgAssetCancel143').onclick=()=>ed.style.display='none';
  if(id)$('#snOrgAssetDelete143').onclick=()=>deleteAsset(id);
  ed.scrollIntoView({behavior:'smooth',block:'start'});
}
async function uploadAsset(file,assetId){
  if(!file)return'';
  if(file.size>8*1024*1024)throw new Error('Afbeelding is groter dan 8 MB.');
  const safeName=(file.name||'snazzle.png').replace(/[^a-zA-Z0-9._-]+/g,'-');
  const ref=storageRef(storage,`snazzle-org-assets/${state.user.uid}/${assetId||Date.now()}-${safeName}`);
  await uploadBytes(ref,file,{contentType:file.type||'image/png'});
  return getDownloadURL(ref);
}
async function saveAsset(){
  const ed=$('#snOrgAdminAssetEditor143'),id=ed.dataset.assetId||'',existing=state.adminAssets.find(x=>x.id===id),btn=$('#snOrgAssetSave143');
  btn.disabled=true;
  try{
    const file=$('#snOrgAssetFile143').files?.[0]||null;
    const imageUrl=file?await uploadAsset(file,id||'new'):existing?.imageUrl||'';
    await call('adminSaveOrgAsset',{
      assetId:id||undefined,
      name:$('#snOrgAssetName143').value,
      category:$('#snOrgAssetCategory143').value,
      imageUrl,
      allowedForOrg:$('#snOrgAssetOrg143').checked,
      allowedForPersonal:$('#snOrgAssetPersonal143').checked,
      active:$('#snOrgAssetActive143').checked
    });
    state.assets=[];
    toast('Snazzle Bibliotheek bijgewerkt ✅');
    ed.style.display='none';
    await refreshAssets();
  }catch(err){toast('⚠️ '+errorMessage(err,'Snazzle opslaan lukte niet.'));}
  finally{btn.disabled=false;}
}
async function deleteAsset(id){
  if(!confirm('Deze Snazzle uit de centrale Bibliotheek verwijderen? Bestaande vondsten blijven zichtbaar.'))return;
  try{
    await call('adminDeleteOrgAsset',{assetId:id});
    state.assets=[];
    $('#snOrgAdminAssetEditor143').style.display='none';
    await refreshAssets();
  }catch(err){toast(errorMessage(err,'Verwijderen lukte niet.'));}
}
function boot(){watchAdminUi();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.SnazzleOrgAdminV143={checkRole,watch:watchAdminUi,refreshHunts,refreshAssets};
