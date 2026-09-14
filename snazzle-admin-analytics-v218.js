// Snazzle Beheer v218 — privacyvriendelijke bezoekersstatistieken.
// Meet alleen anonieme app-activiteit: geen naam, e-mail, GPS of IP wordt door deze module opgeslagen.
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,collection,doc,getDoc,getDocs,setDoc,serverTimestamp,query,where,Timestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='218.0';
const PRESENCE='snazzlePresenceV1';
const DAILY='snazzleDailyPresenceV1';
const HEARTBEAT_MS=45_000;
const ONLINE_WINDOW_MS=150_000;
const TZ='Europe/Amsterdam';
const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
let currentUser=null;
let adminRole='';
let heartbeatTimer=null;
let statsTimer=null;
let touching=false;

function amsterdamParts(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const pick=t=>parts.find(p=>p.type===t)?.value||'';
  return {year:Number(pick('year')),month:Number(pick('month')),day:Number(pick('day'))};
}
function dayKey(date=new Date()){
  const p=amsterdamParts(date);
  return `${String(p.year).padStart(4,'0')}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;
}
function recentDays(amount=7){
  const p=amsterdamParts(new Date());
  const base=new Date(Date.UTC(p.year,p.month-1,p.day,12,0,0));
  return Array.from({length:amount},(_,i)=>{
    const d=new Date(base);d.setUTCDate(base.getUTCDate()-i);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  });
}
function dayLabel(key){
  const d=new Date(`${key}T12:00:00Z`);
  return new Intl.DateTimeFormat('nl-NL',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(d).replace('.','');
}
function clearHeartbeat(){if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null;}}

async function detectAdmin(user){
  adminRole='';
  if(!db||!user||user.isAnonymous)return '';
  try{
    const snap=await getDoc(doc(db,'adminUsers',user.uid));
    const p=snap.exists()?snap.data():null;
    if(p?.active===true)adminRole=String(p.role||'');
  }catch(err){console.warn('Snazzle stats admincheck',err);}
  return adminRole;
}

async function touchPresence(){
  if(!db||!currentUser||adminRole||document.visibilityState!=='visible'||touching)return;
  touching=true;
  try{
    const uid=currentUser.uid;
    const today=dayKey();
    await Promise.all([
      setDoc(doc(db,PRESENCE,uid),{userId:uid,lastSeenAt:serverTimestamp()},{merge:true}),
      setDoc(doc(db,DAILY,today,'visitors',uid),{userId:uid,seenAt:serverTimestamp()},{merge:true})
    ]);
  }catch(err){console.warn('Snazzle aanwezigheid kon niet worden bijgewerkt',err);}
  finally{touching=false;}
}
function startHeartbeat(){
  clearHeartbeat();
  if(!currentUser||adminRole)return;
  touchPresence();
  heartbeatTimer=setInterval(touchPresence,HEARTBEAT_MS);
}

function installStyles(){
  if(document.getElementById('snStatsV218Styles'))return;
  const s=document.createElement('style');s.id='snStatsV218Styles';s.textContent=`
    #snStatsAdmin{color:#35261a}.sn-stats-intro{margin:8px 0 12px;padding:11px 12px;border:2px solid #a8bb6b;border-radius:15px;background:#edf6cf;color:#405326;font-size:11px;font-weight:850;line-height:1.45}
    .sn-stats-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 14px}.sn-stat-card{min-width:0;padding:12px 8px;border-radius:17px;border:2px solid #b99a67;background:#fff8e6;text-align:center;box-shadow:0 4px 0 #a4824e}.sn-stat-card.online{background:linear-gradient(145deg,#e5f8ce,#c8ef9d);border-color:#87b653}.sn-stat-card strong{display:block;font-size:28px;line-height:1;color:#2e5c2d}.sn-stat-card span{display:block;margin-top:6px;font-size:10px;font-weight:950;color:#664b2e}.sn-stat-dot{display:inline-block;width:8px;height:8px;margin-right:4px;border-radius:50%;background:#43aa39;box-shadow:0 0 0 4px rgba(67,170,57,.15)}
    .sn-stats-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:13px 2px 7px}.sn-stats-title strong{font-size:15px}.sn-stats-title small{font-size:9px;color:#755a3b;font-weight:800}.sn-days{display:grid;gap:7px}.sn-day{display:grid;grid-template-columns:82px 1fr 36px;align-items:center;gap:8px;padding:9px 10px;border-radius:13px;background:#fff9ea;border:1px solid #ccb184}.sn-day-label{font-size:11px;font-weight:950;text-transform:capitalize}.sn-day-track{height:9px;border-radius:99px;background:#eadfca;overflow:hidden}.sn-day-fill{height:100%;min-width:0;border-radius:99px;background:linear-gradient(90deg,#74bd4b,#3c8d49)}.sn-day-count{text-align:right;font-size:12px;font-weight:1000}.sn-stats-refresh{width:100%;margin-top:12px;border:0;border-radius:13px;padding:11px;background:linear-gradient(#69b93e,#438d2d);color:#fff;font-weight:1000;box-shadow:0 4px 0 #2d6820}.sn-stats-status{margin:9px 2px 0;min-height:18px;font-size:10px;font-weight:800;color:#72583b}.sn-stats-error{padding:12px;border-radius:13px;background:#ffd9d2;color:#7b3027;font-weight:850;font-size:11px;line-height:1.45}
    @media(max-width:390px){.sn-stat-card strong{font-size:23px}.sn-stat-card span{font-size:9px}.sn-day{grid-template-columns:72px 1fr 30px}}
  `;document.head.appendChild(s);
}

function ensureUi(){
  installStyles();
  const wrap=document.querySelector('#adminSheet .super-only');
  const tabs=wrap?.querySelector('.tabs');
  if(!wrap||!tabs)return false;
  let button=document.getElementById('snStatsTabV218');
  if(!button){
    button=document.createElement('button');button.type='button';button.id='snStatsTabV218';button.textContent='Bezoekers';tabs.appendChild(button);
  }
  let section=document.getElementById('snStatsAdmin');
  if(!section){
    section=document.createElement('section');section.id='snStatsAdmin';section.className='admin-section';section.innerHTML=`
      <div class="sn-stats-intro">📊 <strong>Bezoekers Snazzle Hunt</strong><br>Unieke apparaten/spelers worden anoniem geteld. Er worden hiervoor geen naam, e-mail of GPS-gegevens opgeslagen. De historie bouwt vanaf de activering van deze functie op.</div>
      <div class="sn-stats-cards">
        <div class="sn-stat-card online"><strong id="snOnlineNow">–</strong><span><i class="sn-stat-dot"></i>Nu online</span></div>
        <div class="sn-stat-card"><strong id="snTodayUsers">–</strong><span>Vandaag</span></div>
        <div class="sn-stat-card"><strong id="snWeekUsers">–</strong><span>7 dagen uniek</span></div>
      </div>
      <div class="sn-stats-title"><strong>Per dag</strong><small>laatste 7 dagen</small></div>
      <div class="sn-days" id="snStatsDays"><div class="sn-stats-status">Statistieken laden…</div></div>
      <button class="sn-stats-refresh" id="snStatsRefresh" type="button">↻ Vernieuwen</button>
      <div class="sn-stats-status" id="snStatsStatus"></div>`;
    wrap.appendChild(section);
    section.querySelector('#snStatsRefresh').onclick=()=>refreshStats(true);
  }
  button.onclick=()=>{
    tabs.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
    wrap.querySelectorAll('.admin-section').forEach(s=>s.classList.remove('on'));
    button.classList.add('on');section.classList.add('on');
    refreshStats(true);
  };
  return true;
}

async function refreshStats(force=false){
  const section=document.getElementById('snStatsAdmin');
  if(!db||adminRole!=='superadmin'||!section)return;
  if(!force&&!section.classList.contains('on'))return;
  const status=document.getElementById('snStatsStatus');
  if(status)status.textContent='Bezig met verversen…';
  try{
    const keys=recentDays(7);
    const [onlineSnap,...daySnaps]=await Promise.all([
      getDocs(query(collection(db,PRESENCE),where('lastSeenAt','>=',Timestamp.fromMillis(Date.now()-ONLINE_WINDOW_MS)))),
      ...keys.map(k=>getDocs(collection(db,DAILY,k,'visitors')))
    ]);
    const counts=daySnaps.map(s=>s.size);
    const weekIds=new Set();daySnaps.forEach(s=>s.docs.forEach(d=>weekIds.add(d.id)));
    const onlineEl=document.getElementById('snOnlineNow'),todayEl=document.getElementById('snTodayUsers'),weekEl=document.getElementById('snWeekUsers');
    if(onlineEl)onlineEl.textContent=String(onlineSnap.size);
    if(todayEl)todayEl.textContent=String(counts[0]||0);
    if(weekEl)weekEl.textContent=String(weekIds.size);
    const max=Math.max(1,...counts),box=document.getElementById('snStatsDays');
    if(box)box.innerHTML=keys.map((k,i)=>`<div class="sn-day"><span class="sn-day-label">${dayLabel(k)}</span><span class="sn-day-track"><span class="sn-day-fill" style="display:block;width:${Math.round((counts[i]||0)/max*100)}%"></span></span><span class="sn-day-count">${counts[i]||0}</span></div>`).join('');
    if(status)status.textContent=`Bijgewerkt om ${new Intl.DateTimeFormat('nl-NL',{hour:'2-digit',minute:'2-digit',timeZone:TZ}).format(new Date())} · online = actief in de laatste 2½ minuut`;
  }catch(err){
    console.warn('Snazzle bezoekersstatistieken',err);
    const box=document.getElementById('snStatsDays');
    if(box)box.innerHTML='<div class="sn-stats-error">De bezoekersmeting wordt nog geactiveerd of je veilige beheersessie moet opnieuw worden geopend. Probeer over een minuut opnieuw.</div>';
    if(status)status.textContent='Statistieken konden nog niet worden gelezen.';
  }
}

function startStatsTimer(){
  if(statsTimer)clearInterval(statsTimer);
  statsTimer=setInterval(()=>refreshStats(false),60_000);
}

if(auth&&db){
  onAuthStateChanged(auth,async user=>{
    currentUser=user||null;
    clearHeartbeat();
    if(!user)return;
    await detectAdmin(user);
    if(adminRole==='superadmin'){
      let tries=0;const ready=setInterval(()=>{tries++;if(ensureUi()||tries>40)clearInterval(ready);},250);
      ensureUi();startStatsTimer();
    }else if(!adminRole){startHeartbeat();}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      if(adminRole==='superadmin')refreshStats(false);else touchPresence();
    }
  });
}

window.SnazzleAdminAnalyticsV218={version:VERSION,refresh:()=>refreshStats(true)};
console.info(`Snazzle bezoekersstatistieken v${VERSION} geladen`);
