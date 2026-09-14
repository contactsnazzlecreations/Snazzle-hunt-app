// Snazzle MYSTIC Series 01 v219 — 12 kaarten, artwork en serie-mappen.
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,collection,doc,getDoc,getDocs,writeBatch } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='219.0';
const LOCAL_KEY='snazzleCardCatalogV2';
const MARKER='snazzleMysticV219Seeded';
const ATLAS='./assets/cards/snazzle-mystic-atlas-v219.jpg?v=219';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
const defs=[
  ['Moon Whisper','core'],['Crystal Dream','core'],['Mystic Glow','core'],['Shadow Spell','core'],
  ['Star Oracle','core'],['Dream Keeper','core'],['Phantom Flash','core'],['Magic Mist','core'],
  ['Lunar Legend','rare'],['Secret Spirit','rare'],['Mystic Guardian','gold'],['Mystic Master','platinum']
];
let art=[];
let selectedSeries='ALL';
let grouping=false;
let syncBusy=false;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cardNo(i){return `S01-M${String(i+1).padStart(2,'0')}`;}
function cardId(i){return `seed-mystic-${String(i+1).padStart(2,'0')}`;}
function canonical(i,id=cardId(i)){
  const [name,rarity]=defs[i];
  return {id,number:cardNo(i),name,series:'MYSTIC Series 01',description:'Magie, maanlicht & mysterie',rarity,unlockType:'milestone',huntId:'',threshold:i+1,imageData:art[i]||'',active:true,secretName:false};
}
function loadAtlas(){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{try{art=defs.map((_,i)=>{const c=document.createElement('canvas');c.width=64;c.height=85;const x=c.getContext('2d');x.drawImage(im,(i%4)*64,Math.floor(i/4)*85,64,85,0,0,64,85);return c.toDataURL('image/jpeg',.84)});resolve()}catch(e){reject(e)}};im.onerror=reject;im.src=ATLAS;});}
function loadLocal(){try{const a=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(a)?a:[]}catch{return[]}}
function seedLocal(){if(!art.length)return false;const before=loadLocal(), byNo=new Map(before.map(c=>[String(c.number||'').toUpperCase(),c]));const mysticNos=new Set(defs.map((_,i)=>cardNo(i)));const keep=before.filter(c=>!mysticNos.has(String(c.number||'').toUpperCase()));const made=defs.map((_,i)=>{const old=byNo.get(cardNo(i))||{};return {...old,...canonical(i,old.id||cardId(i)),createdAt:old.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()}});localStorage.setItem(LOCAL_KEY,JSON.stringify([...keep,...made]));return true;}
async function isSuperAdmin(u){if(!u||!db)return false;try{const s=await getDoc(doc(db,'adminUsers',u.uid));return s.exists()&&s.data().active===true&&s.data().role==='superadmin'}catch{return false}}
async function syncCentral(u){if(syncBusy||!art.length||!(await isSuperAdmin(u)))return;syncBusy=true;try{const snap=await getDocs(collection(db,'snazzleCards'));const byNo=new Map(snap.docs.map(d=>[String(d.data().number||'').toUpperCase(),d]));const batch=writeBatch(db);const now=new Date().toISOString();defs.forEach((_,i)=>{const found=byNo.get(cardNo(i));const id=found?.id||cardId(i);const old=found?.data?.()||{};batch.set(doc(db,'snazzleCards',id),{...canonical(i,id),createdAt:old.createdAt||now,updatedAt:now},{merge:true});});await batch.commit();window.dispatchEvent(new CustomEvent('snazzle:mystic-ready',{detail:{version:VERSION,count:12}}));}catch(e){console.warn('MYSTIC centrale sync wacht op beheerrechten',e)}finally{syncBusy=false}}

function addStyles(){if($('#mysticV219Styles'))return;const s=document.createElement('style');s.id='mysticV219Styles';s.textContent=`
.sc-series-folders{display:flex;gap:7px;overflow:auto;padding:8px 1px 10px;scrollbar-width:none}.sc-series-folders::-webkit-scrollbar{display:none}.sc-series-pill{white-space:nowrap;border:2px solid #9e825d;border-radius:999px;background:#fff7dd;color:#533c27;padding:8px 11px;font-size:10px;font-weight:1000;box-shadow:0 2px 0 #b49a72}.sc-series-pill.on{background:linear-gradient(145deg,#392052,#6d3c88);border-color:#d4a9ef;color:#fff;box-shadow:0 2px 0 #3b234b,0 0 14px rgba(155,92,207,.2)}
.sc-folder{border:2px solid #bea06d;border-radius:16px;background:#fff9e9;overflow:hidden;margin-bottom:10px}.sc-folder>summary{cursor:pointer;list-style:none;padding:12px 13px;font-weight:1000;color:#3e2b20;display:flex;justify-content:space-between;align-items:center}.sc-folder>summary::-webkit-details-marker{display:none}.sc-folder>summary:after{content:'▾';font-size:15px}.sc-folder:not([open])>summary:after{content:'▸'}.sc-folder-body{display:grid;gap:8px;padding:0 8px 9px}.sc-folder.mystic{border-color:#8a62ad;background:linear-gradient(#faf4ff,#f5eaff)}.sc-folder.mystic>summary{color:#553069;background:linear-gradient(90deg,rgba(118,64,148,.12),rgba(184,139,216,.08))}.sc-folder-count{font-size:10px;color:#7b654c;font-weight:900;margin-left:auto;margin-right:8px}.sc-folder.mystic .sc-folder-count{color:#76508e}.sc-folder .sc2-row{margin:0}.sc2-card[data-series-v219='MYSTIC'] .sc2-media{background:#20132e}.sc2-card[data-series-v219='MYSTIC'] .sc2-media img,.sc-folder.mystic .sc2-thumb img{object-fit:contain;background:#20132e}
`;document.head.appendChild(s);}
function seriesFromRow(row){const t=(row?.textContent||'').toUpperCase();if(t.includes('MYSTIC SERIES'))return'MYSTIC';if(t.includes('WILD SERIES'))return'WILD';if(t.includes('SPARK SERIES'))return'SPARK';if(t.includes('BLAZE SERIES'))return'BLAZE';return'OVERIG';}
function seriesFromCard(card){const n=(card?.querySelector('.sc2-num')?.textContent||'').toUpperCase();if(/-M\d/.test(n))return'MYSTIC';if(/-W\d/.test(n))return'WILD';if(/-S\d/.test(n))return'SPARK';if(/-B\d/.test(n))return'BLAZE';return'OVERIG';}
function ensureSeriesPills(){const filters=$('#sc2Filters');if(!filters)return;let wrap=$('#sc2SeriesFolders');if(!wrap){wrap=document.createElement('div');wrap.id='sc2SeriesFolders';wrap.className='sc-series-folders';filters.parentNode?.insertBefore(wrap,filters)}const items=[['ALL','Alle series'],['WILD','🌿 WILD'],['SPARK','✨ SPARK'],['MYSTIC','🔮 MYSTIC'],['BLAZE','🔥 BLAZE']];wrap.innerHTML=items.map(([k,l])=>`<button type="button" class="sc-series-pill ${selectedSeries===k?'on':''}" data-seriespick="${k}">${l}</button>`).join('');$$('[data-seriespick]',wrap).forEach(b=>b.onclick=()=>{selectedSeries=b.dataset.seriespick;ensureSeriesPills();applyCollectionFilter()});}
function applyCollectionFilter(){const g=$('#sc2Grid');if(!g)return;$$(':scope > .sc2-card',g).forEach(c=>{const s=seriesFromCard(c);c.dataset.seriesV219=s;c.style.display=(selectedSeries==='ALL'||selectedSeries===s)?'':'';if(selectedSeries!=='ALL'&&selectedSeries!==s)c.style.display='none';});}
function groupAdmin(){if(grouping)return;const list=$('#sc2List');if(!list)return;const rows=$$(':scope > .sc2-row',list);if(!rows.length)return;grouping=true;try{const groups={WILD:[],SPARK:[],MYSTIC:[],BLAZE:[],OVERIG:[]};rows.forEach(r=>groups[seriesFromRow(r)].push(r));const labels={WILD:'🌿 WILD',SPARK:'✨ SPARK',MYSTIC:'🔮 MYSTIC',BLAZE:'🔥 BLAZE',OVERIG:'🃏 Overige kaarten'};list.innerHTML='';Object.entries(groups).forEach(([k,rs])=>{if(!rs.length)return;const d=document.createElement('details');d.className=`sc-folder ${k.toLowerCase()}`;d.open=k==='MYSTIC';const s=document.createElement('summary');s.innerHTML=`<span>${labels[k]}</span><span class="sc-folder-count">${rs.length} kaart${rs.length===1?'':'en'}</span>`;const b=document.createElement('div');b.className='sc-folder-body';rs.forEach(r=>b.appendChild(r));d.append(s,b);list.appendChild(d)})}finally{grouping=false}}
function repairUI(){addStyles();ensureSeriesPills();applyCollectionFilter();groupAdmin();}
let uiTimer=0;function scheduleUI(){clearTimeout(uiTimer);uiTimer=setTimeout(repairUI,60)}
const obs=new MutationObserver(scheduleUI);obs.observe(document.documentElement,{subtree:true,childList:true});
[0,250,700,1500,3000].forEach(ms=>setTimeout(repairUI,ms));

(async()=>{try{await loadAtlas();const first=localStorage.getItem(MARKER)!=='1';seedLocal();localStorage.setItem(MARKER,'1');if(first){setTimeout(()=>location.reload(),180);return}repairUI();if(auth)onAuthStateChanged(auth,u=>{if(u)syncCentral(u)})}catch(e){console.error('MYSTIC Series 01 v219 kon niet laden',e)}})();
window.SnazzleMysticV219={version:VERSION,repair:repairUI};
