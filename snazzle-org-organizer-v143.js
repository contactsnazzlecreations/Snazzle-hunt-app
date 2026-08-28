// Snazzle Organisatieplatform v143 — tijdelijke organisatie-toegang en plaatsmodus.
import {
  $,esc,state,toast,errorMessage,call,fmtDate,codeDisplay,installStyles,openModal,closeModal,
  geoOnce,here
} from './snazzle-org-shared-v143.js';

let selectedHuntId='',selectedAssetId='',accessDeepLinkHandled=false;
const ORG_FLAG='snazzleOrgAccessUsed143';

function isSessionLive(h){
  const now=Date.now(),s=new Date(h?.accessStartsAt||0).getTime(),e=new Date(h?.accessEndsAt||0).getTime();
  return h?.active===true&&Number.isFinite(s)&&Number.isFinite(e)&&now>=s&&now<=e;
}
function installUi(){
  installStyles();
  if(!$('#snOrgAccess143')){
    document.body.insertAdjacentHTML('beforeend',`
      <div class="sn-org143-modal" id="snOrgAccess143"><div class="sn-org143-shell">
        <div class="sn-org143-head"><h2>Organisatie toegang 🔑</h2><button class="sn-org143-close" id="snOrgAccessClose143" type="button">×</button></div>
        <div class="sn-org143-body">
          <div class="sn-org143-note">Gebruik alleen de tijdelijke code die Snazzle voor jouw stichting, vereniging of evenement heeft aangemaakt. Je krijgt uitsluitend toegang tot je eigen Hunt.</div>
          <div class="sn-org143-field"><label>Tijdelijke organisatiecode</label><input id="snOrgCode143" inputmode="text" maxlength="11" autocomplete="one-time-code" placeholder="ABC-1234567"></div>
          <button class="sn-org143-primary" id="snOrgRedeem143" type="button">Toegang openen</button>
          <div id="snOrgAccessStatus143" class="sn-org143-progress" style="display:none"></div>
        </div>
      </div></div>`);
    $('#snOrgAccessClose143').onclick=()=>closeModal('#snOrgAccess143');
    $('#snOrgRedeem143').onclick=redeemCode;
    $('#snOrgCode143').addEventListener('input',e=>{
      const c=String(e.target.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10);
      e.target.value=codeDisplay(c);
    });
  }
  if(!$('#snOrgOrganizer143')){
    document.body.insertAdjacentHTML('beforeend',`
      <div class="sn-org143-modal" id="snOrgOrganizer143"><div class="sn-org143-shell">
        <div class="sn-org143-head"><h2 id="snOrgOrganizerHead143">Mijn organisatie-Hunt</h2><button class="sn-org143-close" id="snOrgOrganizerClose143" type="button">×</button></div>
        <div class="sn-org143-body" id="snOrgOrganizerBody143"></div>
      </div></div>`);
    $('#snOrgOrganizerClose143').onclick=()=>closeModal('#snOrgOrganizer143');
  }
  if(!$('#snOrgLibrary143')){
    document.body.insertAdjacentHTML('beforeend',`
      <div class="sn-org143-modal" id="snOrgLibrary143"><div class="sn-org143-shell">
        <div class="sn-org143-head"><h2>Kies een Snazzle 🦆</h2><button class="sn-org143-close" id="snOrgLibraryClose143" type="button">×</button></div>
        <div class="sn-org143-body"><div class="sn-org143-library-tools" id="snOrgLibraryCats143"></div><div class="sn-org143-assets" id="snOrgLibraryGrid143"></div></div>
      </div></div>`);
    $('#snOrgLibraryClose143').onclick=()=>closeModal('#snOrgLibrary143');
  }
}
export async function loadSessions(){
  if(!state.user){state.organizerSessions=[];notify();return;}
  try{
    const d=await call('getOrganizerSessions');
    state.organizerSessions=(d.items||[]).filter(isSessionLive);
  }catch{state.organizerSessions=[];}
  notify();
}
function notify(){
  window.dispatchEvent(new CustomEvent('snazzle:org-state-changed'));
}
export function openAccess(){
  installUi();
  if(state.organizerSessions.length===1){openWorkspace(state.organizerSessions[0].id);return;}
  if(state.organizerSessions.length>1){
    const body=$('#snOrgOrganizerBody143');
    $('#snOrgOrganizerHead143').textContent='Kies jouw organisatie-Hunt';
    body.innerHTML=state.organizerSessions.map(h=>`<button class="sn-org143-card" data-org-session="${esc(h.id)}" type="button">
      <strong>${esc(h.title)}</strong><span>${esc(h.organization)} · ${esc(h.village)}</span>
      <small>Plaatsen tot ${esc(fmtDate(h.accessEndsAt))}</small></button>`).join('');
    body.querySelectorAll('[data-org-session]').forEach(b=>b.onclick=()=>openWorkspace(b.dataset.orgSession));
    openModal('#snOrgOrganizer143');
    return;
  }
  openModal('#snOrgAccess143');
  setTimeout(()=>$('#snOrgCode143')?.focus(),120);
}
async function redeemCode(){
  const input=$('#snOrgCode143'),status=$('#snOrgAccessStatus143'),btn=$('#snOrgRedeem143');
  const code=String(input?.value||'').replace(/[^A-Z0-9]/gi,'').toUpperCase();
  if(code.length!==10){status.style.display='block';status.textContent='Vul de volledige code van 10 tekens in.';return;}
  btn.disabled=true;status.style.display='block';status.textContent='🔐 Code veilig controleren…';
  try{
    const data=await call('redeemOrgAccessCode',{code});
    try{localStorage.setItem(ORG_FLAG,'1');}catch{}
    status.textContent='✅ Toegang geopend.';
    await loadSessions();
    closeModal('#snOrgAccess143');
    selectedHuntId=data.hunt?.id||state.organizerSessions[0]?.id||'';
    await openWorkspace(selectedHuntId);
  }catch(err){status.textContent='⚠️ '+errorMessage(err,'Code kon niet worden gecontroleerd.');}
  finally{btn.disabled=false;}
}
async function openWorkspace(huntId){
  selectedHuntId=huntId;
  closeModal('#snOrgAccess143');
  await renderWorkspace();
  openModal('#snOrgOrganizer143');
}
async function loadAssets(){
  if(state.assets.length)return state.assets;
  try{
    const d=await call('listOrgAssets');
    state.assets=Array.isArray(d.items)?d.items:[];
  }catch(err){
    toast(errorMessage(err,'Snazzle Bibliotheek kon niet laden.'));
    state.assets=[];
  }
  return state.assets;
}
async function renderWorkspace(message=''){
  const body=$('#snOrgOrganizerBody143');if(!body)return;
  body.innerHTML='<div class="sn-org143-progress">Organisatie-Hunt laden…</div>';
  try{
    const data=await call('organizerListPoints',{huntId:selectedHuntId});
    const h=data.hunt,points=data.points||[];
    $('#snOrgOrganizerHead143').textContent=h.title||'Mijn organisatie-Hunt';
    const selected=state.assets.find(a=>a.id===selectedAssetId);
    body.innerHTML=`<div class="sn-org143-note"><b>${esc(h.organization)}</b> · 📍 ${esc(h.village)}<br>
      Je kunt alleen deze Hunt aanpassen. Toegang stopt automatisch op <b>${esc(fmtDate(h.accessEndsAt))}</b>.</div>
      ${message?`<div class="sn-org143-progress">${esc(message)}</div>`:''}
      <h3>AR Snazzle plaatsen</h3>
      <div class="sn-org143-field"><label>Snazzle</label><button class="sn-org143-secondary" id="snOrgChooseAsset143" type="button" style="margin:0">${selected?`✅ ${esc(selected.name)}`:'🦆 Kies uit Snazzle Bibliotheek'}</button></div>
      <div class="sn-org143-field"><label>Naam bij dit punt</label><input id="snOrgPointName143" maxlength="50" value="${selected?esc(selected.name):''}" placeholder="Bijv. Bos Snazzle"></div>
      <div class="sn-org143-field"><label>Hint voor kinderen</label><input id="snOrgPointHint143" maxlength="140" placeholder="Bijv. Kijk bij de grote eik"></div>
      <div class="sn-org143-field"><label>Vangzone</label><select id="snOrgPointRadius143"><option value="5">5 meter</option><option value="8" selected>8 meter</option><option value="12">12 meter</option><option value="15">15 meter</option></select></div>
      <button class="sn-org143-primary" id="snOrgPlacePoint143" type="button">📍 Plaats gekozen Snazzle op mijn locatie</button>
      <div id="snOrgPlaceStatus143" class="sn-org143-progress" style="display:none"></div>
      <h3 style="margin-top:20px">Geplaatste Snazzles · ${points.length}</h3>
      <div id="snOrgPointList143">${points.length?points.map(pointHtml).join(''):'<div class="sn-org143-empty">Nog geen AR Snazzles geplaatst.</div>'}</div>`;
    $('#snOrgChooseAsset143').onclick=openAssetPicker;
    $('#snOrgPlacePoint143').onclick=placePoint;
    body.querySelectorAll('[data-point-toggle]').forEach(b=>b.onclick=()=>togglePoint(b.dataset.pointToggle,b.dataset.active!=='1'));
    body.querySelectorAll('[data-point-delete]').forEach(b=>b.onclick=()=>deletePoint(b.dataset.pointDelete));
  }catch(err){
    body.innerHTML=`<div class="sn-org143-empty">⚠️ ${esc(errorMessage(err,'Organisatie-toegang kon niet worden geladen.'))}</div>`;
  }
}
function pointHtml(p){
  return `<article class="sn-org143-point">
    ${p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="${esc(p.assetName||p.name)}" loading="lazy">`:'<div style="font-size:32px">🦆</div>'}
    <div><b>${esc(p.name||p.assetName||'Snazzle')}</b><br><small>${p.active?'🟢 Actief':'⚪ Uit'} · vangzone ${Number(p.radius||8)} m<br>💡 ${esc(p.hint||'Geen hint')}</small></div>
    <div class="sn-org143-point-actions"><button class="sn-org143-secondary" style="margin:0" data-point-toggle="${esc(p.id)}" data-active="${p.active?'1':'0'}">${p.active?'Uitzetten':'Activeren'}</button><button class="sn-org143-danger" data-point-delete="${esc(p.id)}">Verwijderen</button></div>
  </article>`;
}
async function openAssetPicker(){
  await loadAssets();
  renderAssetPicker('all');
  openModal('#snOrgLibrary143');
}
function renderAssetPicker(category){
  const available=state.assets.filter(a=>a.active&&a.allowedForOrg);
  const cats=['all',...new Set(available.map(a=>a.category||'Algemeen'))];
  $('#snOrgLibraryCats143').innerHTML=cats.map(c=>`<button class="sn-org143-chip ${c===category?'on':''}" data-cat="${esc(c)}">${c==='all'?'Alles':esc(c)}</button>`).join('');
  $('#snOrgLibraryCats143').querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>renderAssetPicker(b.dataset.cat));
  const list=available.filter(a=>category==='all'||a.category===category);
  $('#snOrgLibraryGrid143').innerHTML=list.length?list.map(a=>`<button class="sn-org143-asset ${a.id===selectedAssetId?'on':''}" data-asset="${esc(a.id)}" type="button">
    <img src="${esc(a.imageUrl)}" alt="${esc(a.name)}" loading="lazy"><strong>${esc(a.name)}</strong></button>`).join(''):'<div class="sn-org143-empty" style="grid-column:1/-1">Nog geen Snazzles in deze categorie.</div>';
  $('#snOrgLibraryGrid143').querySelectorAll('[data-asset]').forEach(b=>b.onclick=()=>selectAsset(b.dataset.asset));
}
function selectAsset(id){
  selectedAssetId=id;
  const a=state.assets.find(x=>x.id===id);
  closeModal('#snOrgLibrary143');
  renderWorkspace(a?`${a.name} geselecteerd.`:'Snazzle geselecteerd.');
}
async function placePoint(){
  const status=$('#snOrgPlaceStatus143'),btn=$('#snOrgPlacePoint143');
  status.style.display='block';
  if(!selectedAssetId){status.textContent='⚠️ Kies eerst een Snazzle uit de bibliotheek.';return;}
  btn.disabled=true;status.textContent='📍 GPS nauwkeurig bepalen…';
  try{
    const pos=await geoOnce(),g=here(pos);
    status.textContent=`✅ GPS gevonden (±${Math.round(pos.coords.accuracy||0)} m). Opslaan…`;
    await call('organizerPlacePoint',{
      huntId:selectedHuntId,assetId:selectedAssetId,
      name:$('#snOrgPointName143')?.value||'',hint:$('#snOrgPointHint143')?.value||'',
      radius:Number($('#snOrgPointRadius143')?.value||8),lat:g.lat,lon:g.lon,accuracy:Number(pos.coords.accuracy||0)
    });
    await renderWorkspace('🎉 Snazzle staat op deze plek.');
  }catch(err){status.textContent='⚠️ '+errorMessage(err,'Plaatsen lukte niet.');}
  finally{btn.disabled=false;}
}
async function togglePoint(pointId,active){
  try{
    await call('organizerTogglePoint',{huntId:selectedHuntId,pointId,active});
    await renderWorkspace();
  }catch(err){toast(errorMessage(err,'Wijzigen lukte niet.'));}
}
async function deletePoint(pointId){
  if(!confirm('Deze AR Snazzle uit jouw tijdelijke Hunt verwijderen?'))return;
  try{
    await call('organizerDeletePoint',{huntId:selectedHuntId,pointId});
    await renderWorkspace();
  }catch(err){toast(errorMessage(err,'Verwijderen lukte niet.'));}
}
export function maybeOpenDeepLink(){
  if(accessDeepLinkHandled)return;
  if(new URLSearchParams(location.search).get('orgaccess')!=='1')return;
  accessDeepLinkHandled=true;
  setTimeout(openAccess,500);
}

function boot(){installUi();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.SnazzleOrgOrganizerV143={openAccess,loadSessions,maybeOpenDeepLink};
