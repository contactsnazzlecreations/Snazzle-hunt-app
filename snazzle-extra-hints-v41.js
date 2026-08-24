// Snazzle Hunt v41 — extra hint na echte speurtijd + geverifieerde beweging.
// Privacy: exacte GPS-coordinaten worden NIET naar Firebase gestuurd of opgeslagen.
// Alleen starttijd, totaal geverifieerde meters en het moment waarop de extra hint is geopend worden centraal bewaard.

import { getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, onSnapshot, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const V41='41.0.0';
const q41=(s,r=document)=>r.querySelector(s);
const qa41=(s,r=document)=>[...r.querySelectorAll(s)];

let app41=null,auth41=null,db41=null,user41=null,admin41=null;
let hunts41=new Map();
let sessions41=new Map();
let unsubHunts41=null,unsubSessions41=null;
let geoWatch41=null,lastFix41=null;
let geoState41='idle';
let pendingMeters41=new Map();
let flushing41=new Set();
let renderTimer41=null;

function toast41(text){
  const t=q41('#toast');
  if(!t){ console.info(text); return; }
  t.textContent=text; t.classList.add('show');
  clearTimeout(window.__v41Toast);
  window.__v41Toast=setTimeout(()=>t.classList.remove('show'),2600);
}
function esc41(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function status41(h){
  if(!h) return 'ended';
  if(h.found===true) return 'ended';
  if(h.mode==='draft') return 'draft';
  const now=Date.now(),start=h.start?new Date(h.start).getTime():0,end=h.end?new Date(h.end).getTime():Infinity;
  if(h.mode==='live'&&!h.start) return now>end?'ended':'live';
  if(now<start) return 'planned';
  if(now>=start&&now<=end) return 'live';
  return 'ended';
}
function currentHunt41(){
  const village=localStorage.getItem('snazzleVillage')||'Montfort';
  return [...hunts41.values()].filter(h=>h.village===village&&status41(h)==='live').sort((a,b)=>new Date(b.start||0)-new Date(a.start||0))[0]||null;
}
function sessionId41(huntId,uid=user41?.uid){return uid&&huntId?`${huntId}_${uid}`:'';}
function tsMs41(v){
  if(!v) return 0;
  if(typeof v.toMillis==='function') return v.toMillis();
  if(v.seconds) return Number(v.seconds)*1000;
  const x=Date.parse(v); return Number.isFinite(x)?x:0;
}
function config41(h){
  return {
    enabled:h?.extraHintEnabled===true,
    text:String(h?.extraHintText||''),
    delay:Math.max(5,Math.min(240,Number(h?.extraHintDelayMinutes)||60)),
    meters:Math.max(0,Math.min(3000,Number(h?.extraHintMinMeters)||400))
  };
}
function eligibleSessions41(){
  return [...sessions41.values()].filter(s=>{
    const h=hunts41.get(s.huntId),c=config41(h);
    return h&&c.enabled&&status41(h)==='live'&&!s.hintOpenedAt;
  });
}

function injectStyles41(){
  if(q41('#snazzleExtraHintV41Styles')) return;
  const s=document.createElement('style'); s.id='snazzleExtraHintV41Styles';
  s.textContent=`
  .v41-extra{margin-top:14px;padding:13px;border-radius:17px;background:linear-gradient(145deg,#f8edc1,#e7cf8d);border:2px solid #b58e4e;color:#3c2a18;box-shadow:0 4px 0 #8d6939}
  .v41-extra-head{display:flex;align-items:center;gap:9px}.v41-extra-head b{font-size:26px}.v41-extra-head strong{display:block;font-size:15px}.v41-extra-head small{display:block;margin-top:2px;font-size:9px;color:#705334;font-weight:800}
  .v41-extra-status{margin:10px 0;padding:9px 10px;border-radius:12px;background:#fff8df;border:1px solid #c8aa72;font-size:10px;line-height:1.42;font-weight:800;color:#60482e}.v41-extra-status.ready{background:#e3f3c7;border-color:#82a955;color:#345227}.v41-extra-status.warn{background:#fff0cf;border-color:#d8a458;color:#715128}
  .v41-extra-btn{width:100%;border:0;border-radius:13px;padding:12px;font-weight:1000;background:linear-gradient(#ffd85b,#efa72f);color:#3b2914;box-shadow:0 4px 0 #a66b21}.v41-extra-btn:disabled{background:#cfc2a3;color:#766b59;box-shadow:none;opacity:.86}
  .v41-extra-reveal{margin-top:10px;padding:12px;border-radius:13px;background:linear-gradient(135deg,#fff4a5,#ffd45d);border:2px solid #c68b28;color:#3b2a11;font-size:12px;line-height:1.5;font-weight:900;animation:v41Pop .25s ease-out}
  .v41-privacy{display:block;margin-top:8px;font-size:8px;line-height:1.35;color:#765e42;font-weight:760}
  .v41-admin-tab{font-size:9px!important}.tabs.v41-five-tabs{grid-template-columns:repeat(5,1fr)!important}.v41-admin{padding:12px;border-radius:16px;background:#f3efd9;border:2px solid #b9a66e;color:#3d3425}.v41-admin h3{margin:0 0 5px}.v41-admin>p{font-size:10px;line-height:1.45;color:#665943;font-weight:770}.v41-admin-note{padding:10px;border-radius:12px;background:#e7f1d0;border:1px solid #99ad69;font-size:9px;line-height:1.4;color:#40532e;font-weight:800}.v41-admin .field{margin:10px 0}.v41-admin .row2{align-items:end}.v41-toggle{display:flex;gap:9px;align-items:flex-start;padding:10px;border-radius:12px;background:#fff9e8;border:1px solid #c7ad77;font-size:10px;font-weight:850}.v41-toggle input{width:21px;height:21px;flex:0 0 21px}.v41-save{width:100%;border:0;border-radius:12px;padding:12px;background:#478f3a;color:#fff;font-weight:950;box-shadow:0 3px 0 #326c2d}
  @keyframes v41Pop{from{transform:scale(.96);opacity:.45}to{transform:scale(1);opacity:1}}
  @media(max-width:420px){.tabs.v41-five-tabs{grid-template-columns:repeat(3,1fr)!important}.v41-admin .row2{grid-template-columns:1fr 1fr}}
  @media(prefers-reduced-motion:reduce){.v41-extra-reveal{animation:none!important}}
  `;
  document.head.appendChild(s);
}

function ensureExtraBox41(){
  const panel=q41('#huntSheet .panel');
  if(!panel) return null;
  let box=q41('#v41ExtraHintBox',panel);
  if(box) return box;
  box=document.createElement('section'); box.id='v41ExtraHintBox'; box.className='v41-extra';
  box.innerHTML=`<div class="v41-extra-head"><b>💡</b><div><strong>Extra Hint</strong><small>Snazzle helpt pas nadat je echt een tijdje hebt gespeurd.</small></div></div><div class="v41-extra-status" id="v41ExtraStatus"></div><button type="button" class="v41-extra-btn" id="v41ExtraBtn">Extra hint 🔒</button><div class="v41-extra-reveal" id="v41ExtraReveal" hidden></div><span class="v41-privacy">🔒 Voor de bewegingscontrole worden geen exacte GPS-locaties of wandelroutes centraal opgeslagen.</span>`;
  const anchor=q41('#sheetHint',panel);
  if(anchor) anchor.insertAdjacentElement('afterend',box); else panel.appendChild(box);
  q41('#v41ExtraBtn',box).addEventListener('click',openExtraHint41);
  return box;
}

function renderExtra41(){
  const box=ensureExtraBox41(); if(!box) return;
  const h=currentHunt41(),c=config41(h);
  if(!h||!c.enabled||!c.text){box.style.display='none';return;}
  box.style.display='block';
  const sid=sessionId41(h.id),s=sessions41.get(sid);
  const status=q41('#v41ExtraStatus',box),btn=q41('#v41ExtraBtn',box),reveal=q41('#v41ExtraReveal',box);
  if(!s){
    status.className='v41-extra-status'; status.textContent='Start eerst deze Hunt. Vanaf dat moment telt de speurtijd.';
    btn.disabled=true; btn.textContent='Start eerst de Hunt 🔒'; reveal.hidden=true; return;
  }
  if(s.hintOpenedAt){
    status.className='v41-extra-status ready'; status.textContent='Extra hint ontgrendeld ✓';
    btn.disabled=true; btn.textContent='Extra hint geopend ✓'; reveal.hidden=false; reveal.textContent='💡 '+c.text; return;
  }
  reveal.hidden=true;
  const started=tsMs41(s.startedAt),timeOk=started>0&&Date.now()>=started+c.delay*60000,meters=Number(s.meters)||0,moveOk=meters>=c.meters;
  if(timeOk&&moveOk){
    status.className='v41-extra-status ready'; status.textContent='Goed gezocht! Snazzle kan je nu een extra aanwijzing geven.';
    btn.disabled=false; btn.textContent='Extra hint openen 💡';
  } else {
    btn.disabled=true; btn.textContent='Extra hint nog vergrendeld 🔒';
    status.className='v41-extra-status'+(geoState41==='denied'?' warn':'');
    if(geoState41==='denied') status.textContent='Locatie staat uit. Zet locatie alleen tijdens het speuren aan; Snazzle bewaart geen wandelroute.';
    else if(timeOk&&!moveOk) status.textContent='Je bent al een tijd aan het zoeken. Blijf nog even actief speuren door het dorp.';
    else if(!timeOk&&moveOk) status.textContent='Goed bezig! Snazzle vindt dat je eerst nog even zelf mag speuren.';
    else status.textContent='Blijf goed zoeken en bewegen. Snazzle laat vanzelf weten wanneer de extra hint beschikbaar is.';
  }
}

async function openExtraHint41(){
  const h=currentHunt41(),c=config41(h); if(!h||!c.enabled||!user41) return;
  const sid=sessionId41(h.id),s=sessions41.get(sid); if(!s) return toast41('Start eerst deze Hunt');
  if(s.hintOpenedAt){renderExtra41();return;}
  try{
    await updateDoc(doc(db41,'snazzleHuntSessions',sid),{hintOpenedAt:serverTimestamp()});
    toast41('Extra hint ontgrendeld 💡');
  }catch(e){
    console.warn('extra hint unlock',e);
    toast41('Nog niet vrij: blijf nog even echt speuren 🔒');
    try{const fresh=await getDoc(doc(db41,'snazzleHuntSessions',sid));if(fresh.exists())sessions41.set(sid,{id:sid,...fresh.data()});}catch{}
    renderExtra41();
  }
}

function haversine41(a,b){
  const R=6371000,toRad=x=>x*Math.PI/180,dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon),la1=toRad(a.lat),la2=toRad(b.lat);
  const x=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));
}
function stopGeo41(){if(geoWatch41!==null&&navigator.geolocation){navigator.geolocation.clearWatch(geoWatch41);}geoWatch41=null;lastFix41=null;}
function shouldTrack41(){return !!user41&&eligibleSessions41().length>0&&document.visibilityState!=='hidden';}
function ensureGeo41(){
  if(!shouldTrack41()){stopGeo41();return;}
  if(geoWatch41!==null) return;
  if(!navigator.geolocation){geoState41='unsupported';renderExtra41();return;}
  geoState41='asking'; renderExtra41();
  geoWatch41=navigator.geolocation.watchPosition(position=>{
    geoState41='active';
    const c=position.coords,fix={lat:c.latitude,lon:c.longitude,accuracy:Number(c.accuracy)||9999,time:Date.now()};
    if(fix.accuracy>65){lastFix41=fix;renderExtra41();return;}
    if(!lastFix41||lastFix41.accuracy>65){lastFix41=fix;renderExtra41();return;}
    const dt=(fix.time-lastFix41.time)/1000,dist=haversine41(lastFix41,fix),speed=dt>0?dist/dt:999;
    lastFix41=fix;
    // GPS-drift, autoritten en onrealistische sprongen tellen niet mee.
    if(dt<3||dist<6||dist>120||speed>5.5) return;
    eligibleSessions41().forEach(s=>pendingMeters41.set(s.id,(pendingMeters41.get(s.id)||0)+dist));
    flushAll41();
  },err=>{
    console.warn('Snazzle beweging',err);
    geoState41=err?.code===1?'denied':'error'; stopGeo41(); renderExtra41();
  },{enableHighAccuracy:true,maximumAge:8000,timeout:18000});
}
function canFlush41(s){const last=tsMs41(s.lastMoveAt);return !last||Date.now()-last>=24000;}
async function flushSession41(s){
  if(!s||flushing41.has(s.id)) return;
  const pending=pendingMeters41.get(s.id)||0; if(pending<10||!canFlush41(s)) return;
  const add=Math.min(80,Math.floor(pending)); if(add<1)return;
  flushing41.add(s.id);
  try{
    const next=(Number(s.meters)||0)+add;
    await updateDoc(doc(db41,'snazzleHuntSessions',s.id),{meters:next,lastMoveAt:serverTimestamp()});
    pendingMeters41.set(s.id,Math.max(0,pending-add));
    s.meters=next; s.lastMoveAt={toMillis:()=>Date.now()}; sessions41.set(s.id,s); renderExtra41();
  }catch(e){console.warn('bewegingsmeter opslaan',e);}finally{flushing41.delete(s.id);}
}
function flushAll41(){eligibleSessions41().forEach(flushSession41);}

async function createSession41(h){
  if(!user41||!h) return null;
  const sid=sessionId41(h.id),ref=doc(db41,'snazzleHuntSessions',sid);
  const existing=await getDoc(ref);
  if(existing.exists()){const s={id:sid,...existing.data()};sessions41.set(sid,s);ensureGeo41();renderExtra41();return s;}
  await setDoc(ref,{userId:user41.uid,huntId:h.id,startedAt:serverTimestamp(),meters:0,lastMoveAt:serverTimestamp(),hintOpenedAt:null});
  const fresh=await getDoc(ref),s={id:sid,...fresh.data()}; sessions41.set(sid,s); ensureGeo41();renderExtra41();return s;
}

function bindStart41(){
  const b=q41('#startBtn'); if(!b||b.dataset.v41Bound)return;
  b.dataset.v41Bound='1';
  b.addEventListener('click',async e=>{
    const h=currentHunt41(),c=config41(h);
    if(!h||!c.enabled||!c.text||!user41) return;
    const sid=sessionId41(h.id);
    if(sessions41.has(sid)){ensureGeo41();return;}
    e.preventDefault();e.stopImmediatePropagation();
    const originalText=b.textContent;b.disabled=true;b.textContent='Hunt starten…';
    try{
      await createSession41(h);
      toast41('Hunt gestart ✓ Beweging telt alleen tijdens het speuren; je route wordt niet opgeslagen.');
      b.disabled=false;b.textContent=originalText;
      if(typeof b.onclick==='function') await b.onclick.call(b);
    }catch(err){
      console.error('hunt session start',err);b.disabled=false;b.textContent=originalText;
      toast41('Hunt kon niet centraal starten. Probeer opnieuw.');
    }
  },true);
}

function ensureAdmin41(){
  if(admin41?.role!=='superadmin') return;
  const superBox=q41('#adminSheet .super-only'),tabs=superBox?.querySelector('.tabs');
  if(!superBox||!tabs) return;
  tabs.classList.add('v41-five-tabs');
  let tab=q41('[data-v41-tab="v41ExtraHintsAdmin"]',tabs);
  if(!tab){tab=document.createElement('button');tab.type='button';tab.className='v41-admin-tab';tab.dataset.v41Tab='v41ExtraHintsAdmin';tab.textContent='Extra hints';tabs.appendChild(tab);}
  let section=q41('#v41ExtraHintsAdmin',superBox);
  if(!section){
    section=document.createElement('section');section.id='v41ExtraHintsAdmin';section.className='admin-section v41-admin';
    section.innerHTML=`<h3>💡 Extra hints na echt speuren</h3><p>De timer begint centraal zodra een gezin op “Ik ga zoeken” drukt. De extra hint komt pas vrij na de ingestelde tijd én voldoende echte beweging.</p><div class="v41-admin-note">🔒 Privacy: de app bewaart centraal alleen de starttijd en het totaal aantal geverifieerde meters. Exacte GPS-locaties en wandelroutes worden niet naar Firebase gestuurd.</div><div class="field"><label>Hunt</label><select id="v41AdminHunt"></select></div><label class="v41-toggle"><input id="v41AdminEnabled" type="checkbox"><span><b>Extra hint inschakelen</b><br>Gebruik dit alleen voor Hunts waarbij je na lang zoeken extra hulp wilt geven.</span></label><div class="field"><label>Extra hint</label><textarea id="v41AdminText" maxlength="500" placeholder="Bijv. Kijk eens in de buurt van een plek waar je even kunt uitrusten…"></textarea></div><div class="row2"><div class="field"><label>Minimaal aantal minuten</label><input id="v41AdminDelay" type="number" min="5" max="240" step="5" value="60"></div><div class="field"><label>Minimaal actief bewogen</label><select id="v41AdminMeters"><option value="200">200 meter</option><option value="300">300 meter</option><option value="400" selected>400 meter</option><option value="500">500 meter</option><option value="750">750 meter</option><option value="1000">1 kilometer</option></select></div></div><button type="button" class="v41-save" id="v41AdminSave">Extra hint opslaan</button>`;
    superBox.appendChild(section);
  }
  const openTab=()=>{
    qa41('[data-tab], [data-v41-tab]',tabs).forEach(x=>x.classList.remove('on'));
    qa41('.admin-section',superBox).forEach(x=>x.classList.remove('on'));
    tab.classList.add('on');section.classList.add('on');fillAdminSelect41();loadAdminForm41();
  };
  if(!tab.dataset.bound41){tab.dataset.bound41='1';tab.addEventListener('click',openTab);}
  qa41('[data-tab]',tabs).forEach(x=>{if(!x.dataset.v41Clean){x.dataset.v41Clean='1';x.addEventListener('click',()=>tab.classList.remove('on'));}});
  const select=q41('#v41AdminHunt');if(select&&!select.dataset.bound41){select.dataset.bound41='1';select.addEventListener('change',loadAdminForm41);}
  const save=q41('#v41AdminSave');if(save&&!save.dataset.bound41){save.dataset.bound41='1';save.addEventListener('click',saveAdmin41);}
  fillAdminSelect41();
}
function fillAdminSelect41(){
  const sel=q41('#v41AdminHunt');if(!sel)return;const old=sel.value;sel.innerHTML='';
  [...hunts41.values()].sort((a,b)=>`${a.village} ${a.title}`.localeCompare(`${b.village} ${b.title}`,'nl')).forEach(h=>sel.add(new Option(`${h.village} — ${h.title}`,h.id)));
  if([...sel.options].some(o=>o.value===old))sel.value=old;else if(sel.options.length)sel.selectedIndex=0;
}
function loadAdminForm41(){
  const id=q41('#v41AdminHunt')?.value,h=hunts41.get(id);if(!h)return;const c=config41(h);
  q41('#v41AdminEnabled').checked=c.enabled;q41('#v41AdminText').value=c.text;q41('#v41AdminDelay').value=String(c.delay);
  const m=q41('#v41AdminMeters');if(m){if(![...m.options].some(o=>Number(o.value)===c.meters)){m.add(new Option(`${c.meters} meter`,String(c.meters)));}m.value=String(c.meters);}
}
async function saveAdmin41(){
  if(admin41?.role!=='superadmin')return;const id=q41('#v41AdminHunt')?.value;if(!id)return toast41('Kies een Hunt');
  const enabled=!!q41('#v41AdminEnabled')?.checked,text=q41('#v41AdminText')?.value.trim()||'',delay=Math.max(5,Math.min(240,Number(q41('#v41AdminDelay')?.value)||60)),meters=Math.max(0,Math.min(3000,Number(q41('#v41AdminMeters')?.value)||400));
  if(enabled&&text.length<3)return toast41('Vul eerst de extra hint in');
  try{await updateDoc(doc(db41,'hunts',id),{extraHintEnabled:enabled,extraHintText:text,extraHintDelayMinutes:delay,extraHintMinMeters:meters});toast41('Extra hint centraal opgeslagen ✓');}
  catch(e){console.error(e);toast41('Extra hint opslaan mislukt');}
}

function subscribe41(){
  if(!db41||!user41)return;
  unsubHunts41?.();unsubSessions41?.();
  unsubHunts41=onSnapshot(collection(db41,'hunts'),snap=>{
    hunts41=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
    fillAdminSelect41();renderExtra41();ensureGeo41();
  },e=>console.warn('v41 hunts',e));
  const own=query(collection(db41,'snazzleHuntSessions'),where('userId','==',user41.uid));
  unsubSessions41=onSnapshot(own,snap=>{
    sessions41=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
    renderExtra41();ensureGeo41();
  },e=>console.warn('v41 sessions',e));
}
async function refreshAdmin41(){
  admin41=null;if(!user41||user41.isAnonymous)return;
  try{const s=await getDoc(doc(db41,'adminUsers',user41.uid));if(s.exists()&&s.data().active===true)admin41={uid:user41.uid,...s.data()};}catch(e){console.warn('v41 admin',e);}
  ensureAdmin41();
}
function init41(){
  if(window.__snazzleExtraHintV41)return;window.__snazzleExtraHintV41=true;injectStyles41();
  const apps=getApps();if(!apps.length){setTimeout(init41,250);window.__snazzleExtraHintV41=false;return;}
  app41=getApp();auth41=getAuth(app41);db41=getFirestore(app41);
  onAuthStateChanged(auth41,async u=>{user41=u;stopGeo41();sessions41.clear();if(!u)return;await refreshAdmin41();subscribe41();bindStart41();renderExtra41();});
  const obs=new MutationObserver(()=>{bindStart41();ensureExtraBox41();ensureAdmin41();renderExtra41();});obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stopGeo41();else ensureGeo41();});
  renderTimer41=setInterval(()=>{renderExtra41();flushAll41();ensureGeo41();},12000);
  bindStart41();ensureExtraBox41();
  console.info(`Snazzle Extra Hint ${V41} geladen`);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init41,{once:true});else init41();
