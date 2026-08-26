// Snazzle AR Admin v85 — permanente AR-Snazzles via de bestaande Hunts-opslag.
// Dit vermijdt afhankelijkheid van nog niet gepubliceerde Firestore-regels voor snazzleAppAssets.
// Het systeemdocument is een draft in een intern dorp en wordt in beheer verborgen.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, getDocs, setDoc, collection } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const auth=getAuth(), db=getFirestore(), storage=getStorage();
const WORLD_ID='__snazzle_ar_world__';
const WORLD_DOC=doc(db,'hunts',WORLD_ID);
const FALLBACK_VILLAGES=['Montfort','Posterholt','Sint Odiliënberg'];
let points=[], superAdmin=false, adminUid='';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const makeId=()=>`ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

function friendlyError(err){
  const code=String(err?.code||'');
  const msg=String(err?.message||'');
  if(code.includes('permission-denied')||/permission/i.test(msg)) return 'AR-opslag heeft nog geen toegang. Log één keer opnieuw in bij Beheer en probeer opnieuw.';
  if(code.includes('unavailable')||/network|offline/i.test(msg)) return 'Geen verbinding met de centrale Snazzle-opslag. Controleer internet en probeer opnieuw.';
  return msg||'Opslaan of laden is mislukt.';
}

function installStyle(){
  if($('#snArAdminV85Style')) return;
  const el=document.createElement('style'); el.id='snArAdminV85Style'; el.textContent=`
  #snArAdminV85{display:none}#snArAdminV85.on{display:block!important}.sn-ar-admin-grid{display:grid;gap:10px}.sn-ar-admin-note{padding:11px 12px;border-radius:14px;background:#fff8e5;border:2px solid #c29b5d;font-size:12px;font-weight:750;line-height:1.4}.sn-ar-admin-card{background:#fff8e6;border:2px solid #bc995f;border-radius:16px;padding:12px;display:grid;grid-template-columns:64px 1fr;gap:11px;align-items:center}.sn-ar-admin-thumb{width:64px;height:64px;border-radius:14px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(145deg,#dff4ff,#a8d9ef);font-size:35px;border:2px solid #9d7b47}.sn-ar-admin-thumb img{width:100%;height:100%;object-fit:contain}.sn-ar-admin-card h4{margin:0 0 4px;font-size:16px}.sn-ar-admin-meta{font-size:11px;font-weight:800;color:#6b5438;line-height:1.35}.sn-ar-admin-card .row{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:8px}.sn-ar-admin-card button{border:0;border-radius:12px;padding:10px;font-weight:950}.sn-ar-toggle{background:#dbe9b0;color:#314c22}.sn-ar-delete{background:#efc0af;color:#7a281e}.sn-ar-gps{background:linear-gradient(#6fbe3f,#438e2c)!important;color:#fff!important}.sn-ar-gps-status{padding:10px 12px;border-radius:13px;background:#f2e5bc;border:2px solid #c19a5c;font-size:12px;font-weight:900}.sn-ar-gps-status.ok{background:#e4f3c6;border-color:#8cae4b;color:#315421}.sn-ar-image-preview{height:120px;border-radius:16px;border:2px dashed #b48d55;background:#fff8e7;display:grid;place-items:center;overflow:hidden;margin-top:8px}.sn-ar-image-preview img{max-width:100%;max-height:100%;object-fit:contain}.sn-ar-empty{padding:14px;text-align:center;background:#fff8e6;border:2px dashed #c4a36c;border-radius:15px;font-weight:850;color:#6a5338}@media(max-width:390px){.sn-ar-admin-card .row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(el);
}

function hideSystemHunt(){
  document.querySelectorAll('#adminHuntList .listitem').forEach(el=>{
    if(el.textContent?.includes('[SYSTEEM] AR-WERELD')) el.style.display='none';
  });
}
let hideObserver;
function startHideGuard(){
  if(hideObserver||!document.body)return;
  hideObserver=new MutationObserver(hideSystemHunt);
  hideObserver.observe(document.body,{childList:true,subtree:true});
  hideSystemHunt();
}

function install(){
  installStyle(); startHideGuard();
  const sheet=$('#adminSheet'), tabs=sheet?.querySelector('.super-only .tabs'), anchor=sheet?.querySelector('.super-only');
  if(!sheet||!tabs||!anchor) return;
  $('#snArAdminTab')?.remove(); $('#snArAdminV83')?.remove();
  if($('#snArAdminTab85')){ applyVisibility(); return; }

  const tab=document.createElement('button'); tab.type='button'; tab.id='snArAdminTab85'; tab.textContent='AR Snazzles'; tabs.appendChild(tab);
  const section=document.createElement('section'); section.className='admin-section'; section.id='snArAdminV85';
  section.innerHTML=`<h3>AR Snazzles 📍</h3><div class="sn-ar-admin-note">Loop naar de plek waar de Snazzle moet blijven staan. Druk daar op <b>“Plaats Snazzle hier”</b>. Alleen het vaste spelpunt wordt centraal bewaard; locaties of routes van kinderen worden niet opgeslagen.</div><div class="sn-ar-admin-grid"><div class="field"><label>Naam Snazzle</label><input id="snArAdminName85" maxlength="50" value="Scout Snazzle"></div><div class="row2"><div class="field"><label>Kaartnummer</label><input id="snArAdminNumber85" maxlength="12" value="001"></div><div class="field"><label>Zeldzaamheid</label><select id="snArAdminRarity85"><option>COMMON</option><option selected>RARE</option><option>GOLD</option><option>PLATINUM</option><option>BLACK</option><option>LEGENDARY</option></select></div></div><div class="row2"><div class="field"><label>Dorp</label><select id="snArAdminVillage85"></select></div><div class="field"><label>Vangzone</label><select id="snArAdminRadius85"><option value="5">5 meter</option><option value="7" selected>7 meter</option><option value="10">10 meter</option><option value="15">15 meter</option></select></div></div><div class="field"><label>Transparante Snazzle-afbeelding (PNG aanbevolen)</label><input id="snArAdminImage85" type="file" accept="image/png,image/webp,image/*"><div class="sn-ar-image-preview" id="snArAdminPreview85">🦆 Optioneel — zonder afbeelding gebruiken we de test-Snazzle.</div></div><div class="sn-ar-gps-status" id="snArAdminStatus85">⏳ AR-opslag controleren…</div><button class="save sn-ar-gps" id="snArAdminPlace85" type="button">📍 Plaats Snazzle hier</button></div><h3 style="margin-top:22px">Geplaatste Snazzles</h3><div class="list" id="snArAdminList85"><div class="sn-ar-empty">AR-punten laden…</div></div>`;
  anchor.appendChild(section);

  tab.addEventListener('click',()=>{ tabs.querySelectorAll('button').forEach(b=>b.classList.remove('on')); sheet.querySelectorAll('.super-only .admin-section').forEach(s=>s.classList.remove('on')); tab.classList.add('on'); section.classList.add('on'); refreshWorld(); });
  tabs.querySelectorAll('button:not(#snArAdminTab85)').forEach(b=>b.addEventListener('click',()=>{tab.classList.remove('on');section.classList.remove('on');}));
  $('#snArAdminImage85')?.addEventListener('change',previewImage);
  $('#snArAdminPlace85')?.addEventListener('click',placeHere);
  populateVillages(); applyVisibility();
}

async function populateVillages(){
  const select=$('#snArAdminVillage85'); if(!select) return; let names=[];
  try{ const snap=await getDocs(collection(db,'villages')); snap.forEach(d=>{const x=d.data();names.push(String(x.name||x.title||d.id));}); }catch{}
  names=[...new Set((names.length?names:FALLBACK_VILLAGES).filter(Boolean))]; const current=localStorage.getItem('snazzleVillage')||'Montfort';
  select.innerHTML=names.map(v=>`<option ${v===current?'selected':''}>${esc(v)}</option>`).join('');
}

function previewImage(e){ const file=e.target.files?.[0],box=$('#snArAdminPreview85'); if(!box)return; if(!file){box.innerHTML='🦆 Optioneel — zonder afbeelding gebruiken we de test-Snazzle.';return;} const url=URL.createObjectURL(file); box.innerHTML=`<img src="${url}" alt="Voorbeeld Snazzle">`; }
function currentPosition(){ return new Promise((resolve,reject)=>{ if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund op dit toestel.')); navigator.geolocation.getCurrentPosition(resolve,err=>reject(new Error(err.code===1?'Locatietoestemming is geweigerd.':'Locatie kon niet worden bepaald.')),{enableHighAccuracy:true,timeout:16000,maximumAge:0}); }); }

async function uploadImage(file,pointId){
  if(!file)return ''; if(file.size>8*1024*1024)throw new Error('Afbeelding is groter dan 8 MB.');
  const safe=(file.name||'snazzle.png').replace(/[^a-zA-Z0-9._-]+/g,'-');
  const target=storageRef(storage,`listen-stories/images/${adminUid}/ar-${pointId}-${safe}`);
  await uploadBytes(target,file,{contentType:file.type||'image/png'}); return getDownloadURL(target);
}
async function readWorld(){ const snap=await getDoc(WORLD_DOC),data=snap.exists()?snap.data():{}; return Array.isArray(data.points)?data.points:[]; }
async function writeWorld(next){
  await setDoc(WORLD_DOC,{_snazzleInternalType:'arWorld',title:'[SYSTEEM] AR-WERELD',village:'__internal__',description:'Interne opslag voor permanente Snazzle AR-punten',rule:'',hint:'',foundMessage:'',imageUrl:'',start:'',end:'',mode:'draft',version:2,points:next,updatedAt:new Date().toISOString(),updatedBy:adminUid},{merge:true});
  points=next; renderList(); hideSystemHunt();
}

async function placeHere(){
  const btn=$('#snArAdminPlace85'),status=$('#snArAdminStatus85'); if(!superAdmin)return status.textContent='⚠️ Alleen de hoofdbeheerder kan AR-punten plaatsen.';
  const name=($('#snArAdminName85')?.value||'').trim(),number=($('#snArAdminNumber85')?.value||'').trim(); if(name.length<2)return status.textContent='⚠️ Vul een naam in.';
  btn.disabled=true; status.classList.remove('ok'); status.textContent='📍 GPS nauwkeurig bepalen…';
  try{
    const pos=await currentPosition(),accuracy=Math.round(pos.coords.accuracy||0); status.textContent=`✅ GPS gevonden (nauwkeurigheid ±${accuracy} m). Opslaan…`;
    const pointId=makeId(),file=$('#snArAdminImage85')?.files?.[0]||null,imageUrl=await uploadImage(file,pointId),existing=await readWorld(),now=new Date().toISOString();
    const point={id:pointId,name,number:number||'—',rarity:$('#snArAdminRarity85')?.value||'COMMON',village:$('#snArAdminVillage85')?.value||'Montfort',radius:Number($('#snArAdminRadius85')?.value||7),lat:Number(pos.coords.latitude),lon:Number(pos.coords.longitude),accuracy,imageUrl,active:true,createdAt:now,updatedAt:now,createdBy:adminUid};
    await writeWorld([...existing,point]); status.classList.add('ok'); status.textContent=`🎉 ${name} staat nu permanent op deze plek · GPS ±${accuracy} m`; try{navigator.vibrate?.([60,40,100]);}catch{}
    $('#snArAdminImage85').value=''; $('#snArAdminPreview85').innerHTML='🦆 Optioneel — zonder afbeelding gebruiken we de test-Snazzle.';
  }catch(err){status.classList.remove('ok');status.textContent='⚠️ '+friendlyError(err);}finally{btn.disabled=false;}
}

async function refreshWorld(){
  if(!superAdmin)return;
  const status=$('#snArAdminStatus85');
  try{points=await readWorld();renderList();if(status){status.classList.add('ok');status.textContent=`✅ AR-beheer verbonden · ${points.length} geplaatste Snazzle${points.length===1?'':'s'}`;}}
  catch(err){const list=$('#snArAdminList85');if(list)list.innerHTML=`<div class="sn-ar-empty">⚠️ ${esc(friendlyError(err))}</div>`;if(status){status.classList.remove('ok');status.textContent='⚠️ '+friendlyError(err);}}
}
function renderList(){
  const list=$('#snArAdminList85');if(!list)return;if(!points.length){list.innerHTML='<div class="sn-ar-empty">Nog geen permanente AR Snazzles geplaatst.</div>';return;}
  list.innerHTML=points.slice().reverse().map(p=>`<article class="sn-ar-admin-card" data-ar-id="${esc(p.id)}"><div class="sn-ar-admin-thumb">${p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}">`:'🦆'}</div><div><h4>${esc(p.name)}</h4><div class="sn-ar-admin-meta">#${esc(p.number)} · ${esc(p.rarity)} · 📍 ${esc(p.village)}<br>${p.active?'🟢 Actief':'⚪ Uitgeschakeld'} · vangzone ${Number(p.radius||7)} m · plaatsing GPS ±${Math.round(Number(p.accuracy||0))} m</div></div><div class="row"><button type="button" class="sn-ar-toggle" data-ar-toggle="${esc(p.id)}">${p.active?'Tijdelijk uitzetten':'Weer activeren'}</button><button type="button" class="sn-ar-delete" data-ar-delete="${esc(p.id)}">Verwijderen</button></div></article>`).join('');
  list.querySelectorAll('[data-ar-toggle]').forEach(b=>b.addEventListener('click',()=>togglePoint(b.dataset.arToggle))); list.querySelectorAll('[data-ar-delete]').forEach(b=>b.addEventListener('click',()=>deletePoint(b.dataset.arDelete)));
}
async function togglePoint(pointId){ if(!superAdmin)return;try{const current=await readWorld();await writeWorld(current.map(p=>p.id===pointId?{...p,active:!p.active,updatedAt:new Date().toISOString()}:p));}catch(err){$('#snArAdminStatus85').textContent='⚠️ '+friendlyError(err);} }
async function deletePoint(pointId){ if(!superAdmin||!confirm('Deze AR Snazzle definitief van deze plek verwijderen?'))return;try{const current=await readWorld();await writeWorld(current.filter(p=>p.id!==pointId));}catch(err){$('#snArAdminStatus85').textContent='⚠️ '+friendlyError(err);} }
function applyVisibility(){const tab=$('#snArAdminTab85'),sec=$('#snArAdminV85');if(tab)tab.style.display=superAdmin?'':'none';if(!superAdmin&&sec)sec.classList.remove('on');}

onAuthStateChanged(auth,async user=>{adminUid=user?.uid||'';superAdmin=false;if(user){try{const snap=await getDoc(doc(db,'adminUsers',user.uid)),p=snap.exists()?snap.data():null;superAdmin=!!(p?.active===true&&p?.role==='superadmin');}catch{}}install();applyVisibility();if(superAdmin)refreshWorld();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();

window.SnazzleArAdminV85={refresh:refreshWorld};
