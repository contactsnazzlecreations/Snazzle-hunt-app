// Snazzle AR Stats v113 — anonieme, centrale teller voor unieke AR-vondsten.
// Per account telt dezelfde AR-Snazzle maximaal één keer mee. Geen naam, e-mail of gebruikerslocatie wordt opgeslagen.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth(),db=getFirestore();
const FINDINGS='snazzleArFindings';
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let adminScope=null,installObserver=null,refreshBusy=false;

function waitForUser(){
  if(auth.currentUser)return Promise.resolve(auth.currentUser);
  return new Promise(resolve=>{
    const off=onAuthStateChanged(auth,u=>{if(u){off();resolve(u);}});
    setTimeout(()=>{try{off();}catch{}resolve(auth.currentUser);},5000);
  });
}
function caughtList(){
  try{const x=JSON.parse(localStorage.getItem('snazzleARCollection')||'[]');return Array.isArray(x)?x:[];}catch{return[];}
}
function cleanPointId(id){return String(id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,120);}
async function submitFinding(item){
  try{
    const user=await waitForUser();if(!user||!item?.id)return;
    const pointId=cleanPointId(item.id);if(!pointId)return;
    const findingId=`${pointId}_${user.uid}`;
    await setDoc(doc(db,FINDINGS,findingId),{
      pointId,
      snazzleName:String(item.name||'Snazzle').slice(0,60),
      number:String(item.number||'—').slice(0,20),
      rarity:String(item.rarity||'COMMON').toUpperCase().slice(0,20),
      village:String(item.village||localStorage.getItem('snazzleVillage')||'Onbekend').slice(0,60),
      foundAt:String(item.caughtAt||new Date().toISOString()).slice(0,40)
    });
  }catch(err){
    // create-only beveiliging weigert een tweede telling van dezelfde speler; dat is normaal.
    if(!String(err?.code||'').includes('permission-denied'))console.warn('AR-vondststatistiek kon niet worden opgeslagen',err);
  }
}
async function syncLocalCollection(){
  const list=caughtList().slice(-80);
  for(const item of list){await submitFinding(item);}
}

// De bestaande AR-speler stopt click-propagation zodra een vangst slaagt.
// Daarom onthouden we vóór de tik de lokale collectie en controleren we kort erna of er echt een nieuwe vangst bij is gekomen.
document.addEventListener('click',e=>{
  const trigger=e.target?.closest?.('#snArCatchDuck,#snArCatchHint');if(!trigger)return;
  const before=new Set(caughtList().map(x=>String(x?.id||'')));
  setTimeout(()=>{
    const after=caughtList();
    after.filter(x=>x?.id&&!before.has(String(x.id))).forEach(submitFinding);
  },180);
},true);

function installStyles(){
  if($('#snArStatsStyle113'))return;
  const s=document.createElement('style');s.id='snArStatsStyle113';s.textContent=`
  .sn-ar-stats113{margin-top:22px;padding:14px;border:2px solid #9e7d4d;border-radius:18px;background:#fff9e8}.sn-ar-stats113 h3{margin:0 0 5px}.sn-ar-stats-note{font-size:11px;font-weight:800;line-height:1.4;color:#6a5437;margin:0 0 11px}.sn-ar-stat-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.sn-ar-stat-card{padding:10px 6px;border-radius:14px;background:#eaf2d3;border:2px solid #9bb463;text-align:center}.sn-ar-stat-card b{display:block;font-size:22px;color:#2f572c}.sn-ar-stat-card span{display:block;font-size:9px;font-weight:950;color:#566044;margin-top:2px}.sn-ar-stat-head{display:flex;gap:8px;align-items:center;margin:13px 0 8px}.sn-ar-stat-head strong{flex:1}.sn-ar-stat-refresh{border:0;border-radius:11px;padding:8px 10px;background:#315d39;color:#fff;font-weight:950}.sn-ar-stat-list{display:grid;gap:8px}.sn-ar-stat-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:10px;border-radius:14px;background:#fff;border:1px solid #d5bf91}.sn-ar-stat-row b{font-size:14px}.sn-ar-stat-meta{display:block;margin-top:3px;font-size:10px;font-weight:800;color:#6f5c42}.sn-ar-stat-count{font-size:19px;font-weight:1000;color:#315d39;text-align:right}.sn-ar-stat-sub{display:block;font-size:9px;color:#6b5a42;font-weight:850;margin-top:2px}.sn-ar-stat-empty{padding:12px;border:2px dashed #c8a96f;border-radius:13px;text-align:center;font-size:11px;font-weight:850;color:#6c573b}@media(max-width:390px){.sn-ar-stat-cards{grid-template-columns:1fr 1fr}.sn-ar-stat-card:last-child{grid-column:1/-1}}
  `;document.head.appendChild(s);
}
async function getScope(){
  if(adminScope)return adminScope;
  const user=await waitForUser();if(!user)return null;
  try{
    const snap=await getDoc(doc(db,'adminUsers',user.uid));if(!snap.exists())return null;
    const d=snap.data()||{};if(d.active!==true)return null;
    if(d.role==='superadmin')adminScope={role:'superadmin',village:''};
    else if(d.role==='village_admin')adminScope={role:'village_admin',village:String(d.village||'')};
    return adminScope;
  }catch{return null;}
}
function installAdminUi(){
  installStyles();const section=$('#snArAdminV85');if(!section)return false;
  if($('#snArStats113'))return true;
  const box=document.createElement('section');box.id='snArStats113';box.className='sn-ar-stats113';box.innerHTML=`
    <h3>AR statistieken 📊</h3>
    <p class="sn-ar-stats-note">Anonieme teller: geen namen of gebruikerslocaties. Dezelfde speler telt per Snazzle maximaal één keer mee.</p>
    <div class="sn-ar-stat-cards"><div class="sn-ar-stat-card"><b id="snArStatTotal113">—</b><span>TOTAAL GEVONDEN</span></div><div class="sn-ar-stat-card"><b id="snArStatToday113">—</b><span>VANDAAG</span></div><div class="sn-ar-stat-card"><b id="snArStatWeek113">—</b><span>AFGELOPEN 7 DAGEN</span></div></div>
    <div class="sn-ar-stat-head"><strong>Per virtuele Snazzle</strong><button type="button" class="sn-ar-stat-refresh" id="snArStatRefresh113">↻ Vernieuw</button></div>
    <div class="sn-ar-stat-list" id="snArStatList113"><div class="sn-ar-stat-empty">Statistieken laden…</div></div>`;
  section.appendChild(box);
  $('#snArStatRefresh113')?.addEventListener('click',refreshStats);
  const tab=$('#snArAdminTab85');if(tab&&!tab.dataset.stats113){tab.dataset.stats113='1';tab.addEventListener('click',()=>setTimeout(refreshStats,120));}
  refreshStats();return true;
}
function watchInstall(){
  if(installAdminUi())return;
  if(installObserver||!document.body)return;
  installObserver=new MutationObserver(()=>{if(installAdminUi()){installObserver.disconnect();installObserver=null;}});
  installObserver.observe(document.body,{childList:true,subtree:true});
}
function startOfToday(){const d=new Date();d.setHours(0,0,0,0);return d.getTime();}
function parseTime(v){const n=new Date(v||0).getTime();return Number.isFinite(n)?n:0;}
async function refreshStats(){
  if(refreshBusy||!$('#snArStatList113'))return;refreshBusy=true;
  const list=$('#snArStatList113');if(list)list.innerHTML='<div class="sn-ar-stat-empty">Statistieken laden…</div>';
  try{
    const scope=await getScope();if(!scope){if(list)list.innerHTML='<div class="sn-ar-stat-empty">Alleen beheer kan deze statistieken zien.</div>';return;}
    let ref=collection(db,FINDINGS);
    if(scope.role==='village_admin')ref=query(ref,where('village','==',scope.village));
    const [snap,worldSnap]=await Promise.all([getDocs(ref),getDoc(WORLD_DOC)]);
    const rows=[];snap.forEach(d=>rows.push(d.data()||{}));
    const worldData=worldSnap.exists()?worldSnap.data():{};const world=Array.isArray(worldData.points)?worldData.points:[];
    const current=new Map(world.map(p=>[String(p.id||''),p]));
    const today=startOfToday(),week=Date.now()-7*24*60*60*1000;
    const total=rows.length,todayN=rows.filter(x=>parseTime(x.foundAt)>=today).length,weekN=rows.filter(x=>parseTime(x.foundAt)>=week).length;
    const t=$('#snArStatTotal113'),td=$('#snArStatToday113'),w=$('#snArStatWeek113');if(t)t.textContent=String(total);if(td)td.textContent=String(todayN);if(w)w.textContent=String(weekN);
    const groups=new Map();
    rows.forEach(x=>{
      const id=String(x.pointId||'onbekend');if(!groups.has(id))groups.set(id,{id,all:0,today:0,week:0,sample:x});
      const g=groups.get(id),time=parseTime(x.foundAt);g.all++;if(time>=today)g.today++;if(time>=week)g.week++;
    });
    const sorted=[...groups.values()].sort((a,b)=>b.all-a.all||String(a.sample?.snazzleName||'').localeCompare(String(b.sample?.snazzleName||''),'nl'));
    if(!sorted.length){if(list)list.innerHTML='<div class="sn-ar-stat-empty">Nog geen centrale AR-vondsten. Vanaf nu verschijnt elke unieke vondst hier automatisch.</div>';return;}
    if(list)list.innerHTML=sorted.map(g=>{
      const p=current.get(g.id)||{},x=g.sample||{};
      const name=p.name||x.snazzleName||'Snazzle',number=p.number||x.number||'—',rarity=p.rarity||x.rarity||'COMMON',village=p.village||x.village||'—';
      return `<div class="sn-ar-stat-row"><div><b>${esc(name)}</b><span class="sn-ar-stat-meta">#${esc(number)} · ${esc(rarity)} · 📍 ${esc(village)}</span><span class="sn-ar-stat-sub">Vandaag ${g.today} · 7 dagen ${g.week}</span></div><div class="sn-ar-stat-count">${g.all}×</div></div>`;
    }).join('');
  }catch(err){if(list)list.innerHTML=`<div class="sn-ar-stat-empty">⚠️ Statistieken konden niet worden geladen. ${esc(err?.message||'')}</div>`;}
  finally{refreshBusy=false;}
}

onAuthStateChanged(auth,u=>{if(u){syncLocalCollection();watchInstall();}});
if(auth.currentUser){syncLocalCollection();watchInstall();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchInstall,{once:true});else watchInstall();

window.SnazzleArStatsV113={refresh:refreshStats,sync:syncLocalCollection};
