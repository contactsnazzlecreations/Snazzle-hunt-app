// Snazzle Spotboek v237 — Spotboek-AR voor spelers + mobiel AR-beheer voor hoofdbeheerder.
// Spotboek-vondsten staan volledig los van de vaste 48-kaartenverzameling.
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,doc,getDoc,onSnapshot,setDoc,serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='237.0-spotbook';
const auth=getAuth(),db=getFirestore();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let user=null,superAdmin=false,worldPoints=[],spotbookFinds={},unsubWorld=null,unsubUser=null;
let adminFilter='all',adminSearch='',pendingPublish=null,patching=false;
const nowIso=()=>new Date().toISOString();
const localAr=()=>{try{const x=JSON.parse(localStorage.getItem('snazzleARCollection')||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
const safeId=v=>String(v||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,120);
const pointType=p=>String(p?.collectibleType||'').toLowerCase()==='spotbook'?'spotbook':'wild';
const byPointId=()=>new Map(worldPoints.filter(p=>p?.id).map(p=>[String(p.id),p]));

function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(window.__sn237Toast);window.__sn237Toast=setTimeout(()=>t.classList.remove('show'),3600);}
function fmtDate(v){const d=new Date(v||0);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'});}
function toMs(v){const n=new Date(v||0).getTime();return Number.isNaN(n)?0:n;}
function statusOf(p){
  if(p?.spotbookStatus==='archived')return 'archived';
  if(p?.spotbookStatus==='draft')return 'draft';
  if(p?.spotbookStatus==='paused'||p?.active===false){
    const start=toMs(p?.startAt),end=toMs(p?.endAt),n=Date.now();
    if(start&&start>n)return 'planned';
    if(end&&end<n)return 'expired';
    return 'paused';
  }
  const start=toMs(p?.startAt),end=toMs(p?.endAt),n=Date.now();
  if(start&&start>n)return 'planned';
  if(end&&end<n)return 'expired';
  return 'active';
}
const statusLabel=s=>({active:'🟢 Actief',planned:'🟡 Gepland',draft:'⚪ Concept',paused:'⏸ Gepauzeerd',expired:'🔴 Verlopen',archived:'⚫ Archief'}[s]||'⚪ Onbekend');

function installStyles(){
  if($('#snSpotbook237Style'))return;
  const s=document.createElement('style');s.id='snSpotbook237Style';s.textContent=`
    .sn237-typebox{margin:12px 0;padding:12px;border:2px solid #a98556;border-radius:16px;background:#fff8e8}.sn237-typebox h4{margin:0 0 8px;font-size:15px}.sn237-note{font-size:11px;font-weight:850;line-height:1.4;color:#6a5338;margin-top:7px}.sn237-spot-fields{display:grid;gap:3px}.sn237-spot-fields.off{display:none}.sn237-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    #sn237AdminManager{margin-top:18px}.sn237-admin-head{position:sticky;top:0;z-index:8;background:#efd394f2;padding:8px 0}.sn237-admin-head h3{margin:0 0 8px}.sn237-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:8px}.sn237-stat{padding:8px 4px;border:1.5px solid #b99762;border-radius:11px;background:#fff7e4;text-align:center;font-size:9px;font-weight:900}.sn237-stat b{display:block;font-size:14px}.sn237-search{width:100%;padding:11px 12px;border:2px solid #b9955e;border-radius:13px;background:#fffaf0}.sn237-filters{display:flex;gap:6px;overflow:auto;padding:8px 0;scrollbar-width:none}.sn237-chip{white-space:nowrap;border:1.5px solid #a98655;border-radius:999px;padding:8px 10px;background:#fff7e5;color:#4b3825;font-size:10px;font-weight:950}.sn237-chip.on{background:#49357f;color:#fff;border-color:#49357f}.sn237-list{display:grid;gap:9px}.sn237-card{border:2px solid #b7925b;border-left:6px solid #6a9f46;border-radius:16px;background:#fff8e8;padding:10px;display:grid;grid-template-columns:58px 1fr;gap:10px}.sn237-card.spotbook{border-left-color:#7650b7}.sn237-thumb{width:58px;height:58px;border-radius:12px;background:#e4dbef;display:grid;place-items:center;overflow:hidden;font-size:30px}.sn237-thumb img{width:100%;height:100%;object-fit:contain}.sn237-main h4{margin:0 0 3px;font-size:14px}.sn237-meta{font-size:10px;font-weight:820;line-height:1.45;color:#6b5438}.sn237-actions{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap}.sn237-actions button{border:0;border-radius:10px;padding:9px 10px;font-size:10px;font-weight:950}.sn237-toggle{background:#dceab6;color:#314b24}.sn237-archive{background:#ded5c9;color:#594b3d}.sn237-delete{background:#f0c1b2;color:#742a20}.sn237-empty{padding:15px;border:2px dashed #b79867;border-radius:14px;background:#fff8e7;text-align:center;font-size:12px;font-weight:850;color:#6c573c}#snArAdminList85{display:none!important}
    #snSpotbook237{margin-top:20px;padding-top:16px;border-top:2px dashed rgba(88,62,31,.35)}.sn237-book-head{display:flex;justify-content:space-between;align-items:end;gap:10px;margin-bottom:10px}.sn237-book-head h3{margin:0}.sn237-book-head span{font-size:10px;font-weight:900;color:#6a5338}.sn237-theme{margin:14px 0 7px;font-size:13px;font-weight:1000;color:#50391f}.sn237-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sn237-find{border:3px solid #684b83;border-radius:18px;overflow:hidden;background:linear-gradient(145deg,#f7ecff,#d9c7ef);box-shadow:0 4px 0 #49345c;color:#30213b}.sn237-find-img{aspect-ratio:1/1;background:linear-gradient(135deg,#7562bd,#3d68aa);display:grid;place-items:center;overflow:hidden;font-size:42px}.sn237-find-img img{width:100%;height:100%;object-fit:contain}.sn237-find-info{padding:9px}.sn237-find-info strong{display:block;font-size:13px;line-height:1.15}.sn237-find-info small{display:block;margin-top:4px;font-size:9px;font-weight:800;color:#685477;line-height:1.35}.sn237-book-empty{padding:14px;border:2px dashed #a98fbd;border-radius:14px;background:#fbf6ff;text-align:center;font-size:11px;font-weight:850;color:#6a5678}
    @media(max-width:390px){.sn237-row2{grid-template-columns:1fr}.sn237-stats{grid-template-columns:repeat(2,1fr)}.sn237-grid{grid-template-columns:1fr 1fr}}
  `;document.head.appendChild(s);
}

function ensurePlayerUi(){
  const host=$('#collectionCards');if(!host)return false;
  let pill=$('#collectionSpotbookPill237');
  const stat=$('.collection-statline');
  if(stat&&!pill){pill=document.createElement('span');pill.id='collectionSpotbookPill237';pill.className='collection-pill';stat.appendChild(pill);}
  if(!$('#snSpotbook237')){
    const box=document.createElement('section');box.id='snSpotbook237';box.innerHTML='<div class="sn237-book-head"><h3>Mijn Snazzle Spotboek 📖</h3><span>Jouw bijzondere AR-vondsten</span></div><div id="sn237BookContent"></div>';
    host.appendChild(box);
  }
  return true;
}
function renderSpotbook(){
  if(!ensurePlayerUi())return;
  const items=Object.values(spotbookFinds||{}).filter(Boolean).sort((a,b)=>String(b.foundAt||'').localeCompare(String(a.foundAt||'')));
  const pill=$('#collectionSpotbookPill237');if(pill)pill.textContent=`📖 ${items.length} Spotboek`;
  const host=$('#sn237BookContent');if(!host)return;
  if(!items.length){host.innerHTML='<div class="sn237-book-empty">Nog niets in je Spotboek. Vind een speciale 📖 AR-Snazzle en hij blijft hier voor altijd bewaard.</div>';return;}
  const groups=new Map();for(const item of items){const t=String(item.theme||'Bijzondere Snazzles');if(!groups.has(t))groups.set(t,[]);groups.get(t).push(item);}
  host.innerHTML=[...groups.entries()].map(([theme,list])=>`<div class="sn237-theme">${esc(theme)} · ${list.length} gevonden</div><div class="sn237-grid">${list.map(item=>`<article class="sn237-find"><div class="sn237-find-img">${item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.name)}">`:'🦆'}</div><div class="sn237-find-info"><strong>${esc(item.name||'Snazzle')}</strong><small>${esc(item.edition||theme)}<br>✓ Gevonden ${esc(fmtDate(item.foundAt))}${item.village?` · 📍 ${esc(item.village)}`:''}</small></div></article>`).join('')}</div>`).join('');
}

function patchCatchResult(point,isNew){
  const result=$('#snArResult');if(!result)return;
  const badge=result.querySelector('.sn-ar-badge');if(badge)badge.textContent='📖 SNAZZLE SPOTBOEK';
  const h=result.querySelector('h2');if(h)h.textContent=point.name||'Bijzondere Snazzle';
  const ps=result.querySelectorAll('p');
  if(ps[0])ps[0].textContent=point.theme?`📖 ${point.theme}`:'📖 Spotboek-vondst';
  if(ps[1])ps[1].textContent=isNew?'Toegevoegd aan je Snazzle Spotboek. Deze vondst blijft van jou.':'Deze Snazzle staat al in jouw Spotboek ✓';
}
async function syncSpotbookFromLocal({announce=false}={}){
  if(!user||!worldPoints.length)return false;
  const map=byPointId(),local=localAr();
  const spot=local.filter(x=>pointType(map.get(String(x?.id)))==='spotbook');
  if(!spot.length)return false;
  const next={...(spotbookFinds||{})};let changed=false,lastPoint=null,lastNew=false;
  for(const item of spot){
    const p=map.get(String(item.id));if(!p)continue;
    const sid=safeId(p.spotbookId||`spot_${p.id}`);if(!sid)continue;
    lastPoint=p;
    if(!next[sid]){
      next[sid]={spotbookId:sid,pointId:String(p.id),name:String(p.name||'Snazzle').slice(0,60),theme:String(p.theme||'Bijzondere Snazzles').slice(0,60),edition:String(p.edition||'').slice(0,40),description:String(p.spotbookDescription||'').slice(0,240),imageUrl:String(p.imageUrl||'').slice(0,1200),village:String(p.village||'').slice(0,60),foundAt:String(item.caughtAt||nowIso()),savedAt:nowIso()};
      changed=true;lastNew=true;
    }
  }
  // Spotboek-vondsten horen niet in de gewone AR/WILD-collectie en tellen dus nooit mee voor 48/48 of BLAZE.
  const spotPointIds=new Set(worldPoints.filter(p=>pointType(p)==='spotbook').map(p=>String(p.id)));
  const cleanedLocal=local.filter(x=>!spotPointIds.has(String(x?.id)));
  if(cleanedLocal.length!==local.length)localStorage.setItem('snazzleARCollection',JSON.stringify(cleanedLocal));
  try{
    const uref=doc(db,'users',user.uid),snap=await getDoc(uref),data=snap.exists()?snap.data():{};
    const cloud=Array.isArray(data.arCollectionV1)?data.arCollectionV1:[];
    const cleanedCloud=cloud.filter(x=>!spotPointIds.has(String(x?.id||x?.pointId)));
    const patch={spotbookFindsV1:next,spotbookUpdatedAt:serverTimestamp()};
    if(cleanedCloud.length!==cloud.length)patch.arCollectionV1=cleanedCloud;
    await setDoc(uref,patch,{merge:true});
    spotbookFinds=next;renderSpotbook();
  }catch(err){console.warn('Spotboek opslaan mislukt',err);return false;}
  if(lastPoint){patchCatchResult(lastPoint,lastNew);if(announce)toast(lastNew?`📖 ${lastPoint.name} toegevoegd aan je Spotboek!`:`📖 ${lastPoint.name} staat al in je Spotboek.`);}
  return changed;
}

function adminFormMeta(){
  const type=$('#sn237Type')?.value||'wild';
  return {type,theme:($('#sn237Theme')?.value||'').trim(),edition:($('#sn237Edition')?.value||'').trim(),description:($('#sn237Description')?.value||'').trim(),note:($('#sn237Note')?.value||'').trim(),availability:$('#sn237Availability')?.value||'always',startAt:$('#sn237Start')?.value||'',endAt:$('#sn237End')?.value||''};
}
function validateMeta(meta){
  if(meta.type!=='spotbook')return '';
  if(meta.theme.length<2)return 'Kies of vul een Spotboek-thema in.';
  if(meta.availability==='temporary'){
    if(!meta.startAt||!meta.endAt)return 'Vul een start- én eindmoment in.';
    if(toMs(meta.endAt)<=toMs(meta.startAt))return 'De einddatum moet na de startdatum liggen.';
  }
  return '';
}
function toggleSpotFields(){
  const type=$('#sn237Type')?.value||'wild',spot=$('#sn237SpotFields');spot?.classList.toggle('off',type!=='spotbook');
  const num=$('#snArAdminNumber85')?.closest('.field'),rar=$('#snArAdminRarity85')?.closest('.field');
  if(num)num.style.display=type==='spotbook'?'none':'';if(rar)rar.style.display=type==='spotbook'?'none':'';
  if(type==='spotbook'){if($('#snArAdminNumber85'))$('#snArAdminNumber85').value='SPOT';if($('#snArAdminRarity85'))$('#snArAdminRarity85').value='COMMON';}
  const place=$('#snArAdminPlace85');if(place)place.textContent=type==='spotbook'?'📖 Spotboek-Snazzle publiceren':'🌿 WILD-Snazzle publiceren';
  const note=$('#sn237TypeNote');if(note)note.textContent=type==='spotbook'?'📖 Deze vangst komt alleen in het persoonlijke Spotboek en verandert 48/48 niet.':'🌿 Deze AR-vangst hoort bij de officiële WILD-kaarten.';
  const temp=$('#sn237Temporary');if(temp)temp.style.display=$('#sn237Availability')?.value==='temporary'?'grid':'none';
}
function ensureAdminUi(){
  installStyles();
  const section=$('#snArAdminV85');if(!section)return false;
  const tab=$('#snArAdminTab85');if(tab)tab.textContent='AR-Snazzles beheren';
  const h=section.querySelector('h3');if(h)h.textContent='AR-Snazzles beheren 📍';
  const name=$('#snArAdminName85')?.closest('.field');
  if(name&&!$('#sn237TypeBox')){
    const box=document.createElement('div');box.id='sn237TypeBox';box.className='sn237-typebox';box.innerHTML=`<h4>1 · Type AR-vondst</h4><div class="field"><label>Wat krijgt de vinder?</label><select id="sn237Type"><option value="wild">🌿 WILD-kaart · officiële 48</option><option value="spotbook">📖 Spotboek-Snazzle · souvenir</option></select></div><div class="sn237-note" id="sn237TypeNote"></div><div class="sn237-spot-fields off" id="sn237SpotFields"><div class="field"><label>Thema / map *</label><input id="sn237Theme" maxlength="60" placeholder="bijv. 🎄 Kerst 2026"></div><div class="sn237-row2"><div class="field"><label>Editie / jaar</label><input id="sn237Edition" maxlength="40" placeholder="2026"></div><div class="field"><label>Beschikbaarheid</label><select id="sn237Availability"><option value="always">Altijd actief</option><option value="temporary">Tijdelijk</option></select></div></div><div class="sn237-row2" id="sn237Temporary" style="display:none"><div class="field"><label>Start</label><input id="sn237Start" type="datetime-local"></div><div class="field"><label>Einde</label><input id="sn237End" type="datetime-local"></div></div><div class="field"><label>Korte Spotboek-tekst</label><textarea id="sn237Description" maxlength="240" placeholder="Wat is bijzonder aan deze Snazzle?"></textarea></div><div class="field"><label>Interne beheernotitie</label><input id="sn237Note" maxlength="120" placeholder="Alleen zichtbaar in Beheer"></div></div>`;
    name.insertAdjacentElement('beforebegin',box);
    $('#sn237Type')?.addEventListener('change',toggleSpotFields);$('#sn237Availability')?.addEventListener('change',toggleSpotFields);toggleSpotFields();
  }
  if(!$('#sn237AdminManager')){
    const oldList=$('#snArAdminList85');
    const mgr=document.createElement('div');mgr.id='sn237AdminManager';mgr.innerHTML=`<div class="sn237-admin-head"><h3>Geplaatste AR-Snazzles</h3><div class="sn237-stats" id="sn237Stats"></div><input class="sn237-search" id="sn237Search" placeholder="🔎 Zoek naam, thema of dorp"><div class="sn237-filters" id="sn237Filters"></div></div><div class="sn237-list" id="sn237AdminList"></div>`;
    oldList?.insertAdjacentElement('beforebegin',mgr);
    $('#sn237Search')?.addEventListener('input',e=>{adminSearch=e.target.value.toLowerCase();renderAdminList();});
  }
  renderAdminList();return true;
}
function renderAdminList(){
  const list=$('#sn237AdminList');if(!list)return;
  const stats={active:0,planned:0,draft:0,archived:0};for(const p of worldPoints){const s=statusOf(p);if(s==='active')stats.active++;else if(s==='planned')stats.planned++;else if(s==='draft')stats.draft++;else if(s==='archived')stats.archived++;}
  const stat=$('#sn237Stats');if(stat)stat.innerHTML=`<div class="sn237-stat"><b>${stats.active}</b>🟢 Actief</div><div class="sn237-stat"><b>${stats.planned}</b>🟡 Gepland</div><div class="sn237-stat"><b>${stats.draft}</b>⚪ Concept</div><div class="sn237-stat"><b>${stats.archived}</b>⚫ Archief</div>`;
  const filters=[['all','Alle'],['active','🟢 Actief'],['wild','🌿 WILD'],['spotbook','📖 Spotboek'],['planned','🟡 Gepland'],['paused','⏸ Pauze'],['expired','🔴 Verlopen'],['archived','⚫ Archief']];
  const f=$('#sn237Filters');if(f){f.innerHTML=filters.map(([k,l])=>`<button type="button" class="sn237-chip ${adminFilter===k?'on':''}" data-sn237-filter="${k}">${l}</button>`).join('');f.querySelectorAll('[data-sn237-filter]').forEach(b=>b.addEventListener('click',()=>{adminFilter=b.dataset.sn237Filter;renderAdminList();}));}
  let arr=worldPoints.slice().reverse().filter(p=>{
    const type=pointType(p),s=statusOf(p),hay=`${p.name||''} ${p.theme||''} ${p.village||''}`.toLowerCase();
    const filterOk=adminFilter==='all'||adminFilter===type||adminFilter===s;
    return filterOk&&(!adminSearch||hay.includes(adminSearch));
  });
  if(!arr.length){list.innerHTML='<div class="sn237-empty">Geen AR-Snazzles voor dit filter.</div>';return;}
  list.innerHTML=arr.map(p=>{const type=pointType(p),s=statusOf(p);return `<article class="sn237-card ${type}"><div class="sn237-thumb">${p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}">`:'🦆'}</div><div class="sn237-main"><h4>${esc(p.name||'Snazzle')}</h4><div class="sn237-meta">${type==='spotbook'?`📖 Spotboek · ${esc(p.theme||'Geen thema')}`:`🌿 WILD · #${esc(p.number||'—')}`}<br>${statusLabel(s)} · 📍 ${esc(p.village||'—')} · 🎯 ${Number(p.radius||7)} m${p.startAt?`<br>📅 ${esc(fmtDate(p.startAt))}${p.endAt?` – ${esc(fmtDate(p.endAt))}`:''}`:''}</div></div><div class="sn237-actions"><button class="sn237-toggle" data-sn237-toggle="${esc(p.id)}">${s==='active'?'⏸ Pauzeren':'▶ Activeren'}</button><button class="sn237-archive" data-sn237-archive="${esc(p.id)}">📦 Archiveren</button><button class="sn237-delete" data-sn237-delete="${esc(p.id)}">🗑</button></div></article>`;}).join('');
  list.querySelectorAll('[data-sn237-toggle]').forEach(b=>b.addEventListener('click',()=>togglePoint(b.dataset.sn237Toggle)));
  list.querySelectorAll('[data-sn237-archive]').forEach(b=>b.addEventListener('click',()=>archivePoint(b.dataset.sn237Archive)));
  list.querySelectorAll('[data-sn237-delete]').forEach(b=>b.addEventListener('click',()=>deletePoint(b.dataset.sn237Delete)));
}
async function writePoints(next){if(!superAdmin||patching)return;patching=true;try{await setDoc(WORLD_DOC,{points:next,updatedAt:nowIso(),updatedBy:user?.uid||''},{merge:true});}finally{patching=false;}}
async function togglePoint(id){const next=worldPoints.map(p=>p.id===id?{...p,active:statusOf(p)!=='active',spotbookStatus:statusOf(p)==='active'?'paused':'published',updatedAt:nowIso()}:p);await writePoints(next);}
async function archivePoint(id){if(!confirm('Deze AR-Snazzle archiveren? Vinders houden hem in hun Spotboek.'))return;await writePoints(worldPoints.map(p=>p.id===id?{...p,active:false,spotbookStatus:'archived',updatedAt:nowIso()}:p));}
async function deletePoint(id){if(!confirm('Deze AR-Snazzle definitief van de AR-kaart verwijderen? Bestaande Spotboek-vondsten blijven bij spelers bewaard.'))return;await writePoints(worldPoints.filter(p=>p.id!==id));}

function publishMetaForPoint(p,meta){
  if(meta.type==='wild')return {...p,collectibleType:'wild',spotbookId:'',theme:'',edition:'',spotbookDescription:'',spotbookNote:'',startAt:'',endAt:'',spotbookStatus:'published',active:true,updatedAt:nowIso()};
  const start=meta.availability==='temporary'?new Date(meta.startAt).toISOString():'';
  const end=meta.availability==='temporary'?new Date(meta.endAt).toISOString():'';
  const planned=!!start&&toMs(start)>Date.now(),expired=!!end&&toMs(end)<Date.now();
  return {...p,collectibleType:'spotbook',spotbookId:safeId(p.spotbookId||`spot_${p.id}`),theme:meta.theme,edition:meta.edition,spotbookDescription:meta.description,spotbookNote:meta.note,availability:meta.availability,startAt:start,endAt:end,spotbookStatus:planned?'planned':expired?'expired':'published',active:!(planned||expired),number:'SPOT',rarity:'COMMON',updatedAt:nowIso()};
}
async function patchNewPoint(){
  if(!pendingPublish||!superAdmin)return false;
  try{
    const snap=await getDoc(WORLD_DOC),data=snap.exists()?snap.data():{},points=Array.isArray(data.points)?data.points:[];
    const fresh=points.filter(p=>p?.id&&!pendingPublish.before.has(String(p.id))).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0];
    if(!fresh)return false;
    const next=points.map(p=>p.id===fresh.id?publishMetaForPoint(p,pendingPublish.meta):p);
    await setDoc(WORLD_DOC,{points:next,updatedAt:nowIso(),updatedBy:user?.uid||''},{merge:true});
    const meta=pendingPublish.meta;pendingPublish=null;
    toast(meta.type==='spotbook'?'📖 Spotboek-Snazzle gepubliceerd!':'🌿 WILD-Snazzle gepubliceerd!');
    return true;
  }catch(err){console.warn('AR-type koppelen mislukt',err);return false;}
}
function armPublish(e){
  const trigger=e.target?.closest?.('#snArAdminPlace85,#sn195Save');if(!trigger||!superAdmin)return;
  const meta=adminFormMeta(),err=validateMeta(meta);
  if(err){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toast('⚠️ '+err);return;}
  pendingPublish={meta,before:new Set(worldPoints.map(p=>String(p.id))),at:Date.now()};
  [250,600,1200,2200,4000,7000,11000].forEach(ms=>setTimeout(()=>{if(pendingPublish)patchNewPoint();},ms));
}

function bindUser(u){
  user=u;superAdmin=false;spotbookFinds={};
  try{unsubUser?.();}catch{}unsubUser=null;
  if(!u){renderSpotbook();return;}
  getDoc(doc(db,'adminUsers',u.uid)).then(s=>{const p=s.exists()?s.data():null;superAdmin=!!(p?.active===true&&p?.role==='superadmin');ensureAdminUi();}).catch(()=>{});
  unsubUser=onSnapshot(doc(db,'users',u.uid),snap=>{const d=snap.exists()?snap.data():{};spotbookFinds=d.spotbookFindsV1&&typeof d.spotbookFindsV1==='object'?d.spotbookFindsV1:{};renderSpotbook();},()=>renderSpotbook());
  setTimeout(()=>syncSpotbookFromLocal(),400);
}
function watchWorld(){
  try{unsubWorld?.();}catch{}unsubWorld=null;
  unsubWorld=onSnapshot(WORLD_DOC,snap=>{const d=snap.exists()?snap.data():{};worldPoints=Array.isArray(d.points)?d.points.filter(p=>p?.id):[];ensureAdminUi();renderAdminList();setTimeout(()=>syncSpotbookFromLocal(),80);},err=>console.warn('Spotboek AR-wereld niet beschikbaar',err));
}
function boot(){installStyles();ensurePlayerUi();ensureAdminUi();watchWorld();}

document.addEventListener('click',armPublish,true);
document.addEventListener('click',e=>{if(!e.target?.closest?.('#snArCatchDuck,#snArCatchHint'))return;[70,180,420,900].forEach(ms=>setTimeout(()=>syncSpotbookFromLocal({announce:ms===180}),ms));},true);
window.addEventListener('pageshow',()=>{ensurePlayerUi();renderSpotbook();syncSpotbookFromLocal();});
new MutationObserver(()=>{if(!$('#snSpotbook237'))ensurePlayerUi();if($('#snArAdminV85')&&!$('#sn237TypeBox'))ensureAdminUi();}).observe(document.documentElement,{childList:true,subtree:true});
onAuthStateChanged(auth,bindUser);if(auth.currentUser)bindUser(auth.currentUser);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.SnazzleSpotbookV237={version:VERSION,render:renderSpotbook,sync:syncSpotbookFromLocal,refreshAdmin:renderAdminList};
console.info('Snazzle Spotboek v237 geladen');