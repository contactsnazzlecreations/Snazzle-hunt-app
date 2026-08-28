// Snazzle Organisatieplatform v143 — publieke Special Hunts + AR.
import {$,esc,CACHE_MS,state,toast,errorMessage,call,fmtRange,installStyles,openModal,closeModal,closeQuick,geoOnce,here,distance,camera} from './snazzle-org-shared-v143.js';

let selectedHuntId='',latestPos=null,target=null,watchId=null,cameraStream=null,cameraBusy=false,menuObserver=null;

function installUi(){
  installStyles();
  const big=$('#bigStart');
  if(big&&!$('#snOrgHome143')){
    const b=document.createElement('button');b.id='snOrgHome143';b.type='button';b.innerHTML='<b>🎪</b><span><strong>Speciale Hunt</strong><small>Tijdelijke Hunt van een organisatie</small></span><i>›</i>';
    b.addEventListener('click',openSpecialHunts);big.insertAdjacentElement('afterend',b);
  }
  if(!$('#snOrgSelector143')){
    document.body.insertAdjacentHTML('beforeend','<div class="sn-org143-modal" id="snOrgSelector143"><div class="sn-org143-shell"><div class="sn-org143-head"><h2>Speciale Hunts 🎪</h2><button class="sn-org143-close" id="snOrgSelectorClose143" type="button">×</button></div><div class="sn-org143-body" id="snOrgSelectorBody143"></div></div></div>');
    $('#snOrgSelectorClose143').onclick=()=>closeModal('#snOrgSelector143');$('#snOrgSelector143').addEventListener('click',e=>{if(e.target===$('#snOrgSelector143'))closeModal('#snOrgSelector143');});
  }
  if(!$('#snOrgEvent143')){
    document.body.insertAdjacentHTML('beforeend','<div class="sn-org143-modal" id="snOrgEvent143"><div class="sn-org143-shell"><div class="sn-org143-head"><h2 id="snOrgEventHead143">Speciale Hunt</h2><button class="sn-org143-close" id="snOrgEventClose143" type="button">×</button></div><div class="sn-org143-body" id="snOrgEventBody143"></div></div></div>');
    $('#snOrgEventClose143').onclick=()=>{stopAr();closeModal('#snOrgEvent143');};
  }
  if(!$('#snOrgTracker143')){
    const t=document.createElement('div');t.id='snOrgTracker143';t.innerHTML='<button class="sn-org143-floatclose" id="snOrgTrackerClose143" type="button">×</button><div style="font-size:62px">📍</div><h2 id="snOrgTrackTitle143">Snazzle-signaal zoeken…</h2><div id="snOrgDistance143">GPS…</div><div class="sn-org143-track-copy" id="snOrgTrackHint143">Loop rustig. De camera blijft uit tot je bij de Snazzle bent.</div><div style="margin-top:12px;font-size:11px;font-weight:800;color:#cfe3d5">🔒 Je route wordt niet opgeslagen.</div>';document.body.appendChild(t);$('#snOrgTrackerClose143').onclick=()=>{stopAr();renderEvent();openModal('#snOrgEvent143');};
  }
  if(!$('#snOrgCamera143')){
    const c=document.createElement('div');c.id='snOrgCamera143';c.innerHTML='<video id="snOrgVideo143" playsinline muted></video><div class="sn-org143-shade"></div><div class="sn-org143-camera-head" id="snOrgCameraHead143">Kijk goed om je heen…</div><button class="sn-org143-floatclose" id="snOrgCameraClose143" type="button">×</button><button class="sn-org143-duck" id="snOrgDuck143" type="button"></button><div class="sn-org143-catch">Tik op de Snazzle als je hem gevonden hebt ✨</div>';document.body.appendChild(c);$('#snOrgCameraClose143').onclick=()=>{stopAr();renderEvent();openModal('#snOrgEvent143');};$('#snOrgDuck143').onclick=claimTarget;
  }
  renderHome();
}
function renderHome(){const b=$('#snOrgHome143');if(!b)return;b.classList.toggle('on',state.liveHunts.length>0);if(!state.liveHunts.length)return;const strong=b.querySelector('strong'),small=b.querySelector('small');if(strong)strong.textContent=state.liveHunts.length===1?(state.liveHunts[0].title||'Speciale Hunt'):`${state.liveHunts.length} Speciale Hunts vandaag`;if(small)small.textContent=state.liveHunts.length===1?`${state.liveHunts[0].organization} · ${state.liveHunts[0].village}`:'Kies organisatie en locatie';}
function syncQuick(){
  const list=$('#quickMenuPanel .quick-menu-list');if(!list)return false;let b=$('#snOrgQuick143');
  if(state.liveHunts.length){if(!b){b=document.createElement('button');b.id='snOrgQuick143';b.type='button';b.className='quick-menu-btn';b.addEventListener('click',()=>{closeQuick();openSpecialHunts();});list.appendChild(b);}b.innerHTML=`<b>🎪</b><span><strong>${state.liveHunts.length===1?'Speciale Hunt':`Speciale Hunts (${state.liveHunts.length})`}</strong><small>${state.liveHunts.length===1?esc(`${state.liveHunts[0].organization} · ${state.liveHunts[0].village}`):'Kies de Hunt die nu actief is'}</small></span><i>›</i>`;}else b?.remove();
  let org=$('#snOrgAccessQuick143');const showOrg=state.organizerSessions.length>0||new URLSearchParams(location.search).get('orgaccess')==='1';
  if(showOrg){if(!org){org=document.createElement('button');org.id='snOrgAccessQuick143';org.type='button';org.className='quick-menu-btn';org.addEventListener('click',()=>{closeQuick();window.SnazzleOrgOrganizerV143?.openAccess?.();});list.appendChild(org);}org.innerHTML='<b>🔑</b><span><strong>Organisatie toegang</strong><small>Plaats Snazzles voor jouw tijdelijke Hunt</small></span><i>›</i>';}else org?.remove();
  window.SnazzleMainMenuV129?.install?.();return true;
}
function watchMenu(){if(syncQuick())return;if(menuObserver||!document.body)return;menuObserver=new MutationObserver(()=>{if(syncQuick()){menuObserver.disconnect();menuObserver=null;}});menuObserver.observe(document.body,{childList:true,subtree:true});}
export async function refreshLiveHunts(force=false){
  installUi();if(!state.user){state.liveHunts=[];renderHome();syncQuick();return;}const key='snOrgLiveCache143';
  if(!force){try{const c=JSON.parse(sessionStorage.getItem(key)||'null');if(c&&Date.now()-c.at<CACHE_MS&&Array.isArray(c.items)){state.liveHunts=c.items;renderHome();syncQuick();return;}}catch{}}
  try{const data=await call('listLiveOrgHunts');state.liveHunts=Array.isArray(data.items)?data.items:[];try{sessionStorage.setItem(key,JSON.stringify({at:Date.now(),items:state.liveHunts}));}catch{}}catch(err){console.warn('Special Hunts tijdelijk niet beschikbaar',err);state.liveHunts=[];}renderHome();syncQuick();
}
export function openSpecialHunts(){
  installUi();const box=$('#snOrgSelectorBody143');if(!box)return;
  if(!state.liveHunts.length)box.innerHTML='<div class="sn-org143-empty">Er is op dit moment geen Speciale Hunt actief.</div>';else{box.innerHTML=state.liveHunts.map(h=>`<button class="sn-org143-card" type="button" data-org-hunt="${esc(h.id)}"><strong>🎯 ${esc(h.title)}</strong><span>${esc(h.organization)} · 📍 ${esc(h.village)}</span><small>${esc(fmtRange(h.publicStartsAt,h.publicEndsAt))} · ${Number(h.pointCount||0)} AR Snazzle${Number(h.pointCount||0)===1?'':'s'}</small><span class="sn-org143-go">START / BEKIJK HUNT ›</span></button>`).join('');box.querySelectorAll('[data-org-hunt]').forEach(b=>b.onclick=()=>openEvent(b.dataset.orgHunt));}
  box.insertAdjacentHTML('beforeend','<button class="sn-org143-secondary" id="snOrgHaveCode143" type="button">🔑 Organisatiecode gekregen?</button>');$('#snOrgHaveCode143').onclick=()=>{closeModal('#snOrgSelector143');window.SnazzleOrgOrganizerV143?.openAccess?.();};openModal('#snOrgSelector143');
}
async function openEvent(id){closeModal('#snOrgSelector143');selectedHuntId=id;await renderEvent();openModal('#snOrgEvent143');}
async function renderEvent(message=''){
  const h=state.liveHunts.find(x=>x.id===selectedHuntId),body=$('#snOrgEventBody143');if(!body)return;if(!h){body.innerHTML='<div class="sn-org143-empty">Deze Speciale Hunt is niet meer actief.</div>';return;}$('#snOrgEventHead143').textContent=h.title||'Speciale Hunt';let progress={found:0,total:Number(h.pointCount||0)};try{progress=await call('getOrgHuntState',{huntId:h.id});}catch(err){if(!message)message=errorMessage(err,'Voortgang kon niet worden geladen.');}
  const total=Number(progress.total||0),found=Number(progress.found||0),done=total>0&&found>=total;
  body.innerHTML=`<h3 style="margin:0 0 6px;font-size:24px">${done?'🎉 Hunt voltooid!':'🎪 '+esc(h.title)}</h3><div class="sn-org143-pills"><span class="sn-org143-pill">🏢 ${esc(h.organization)}</span><span class="sn-org143-pill">📍 ${esc(h.village)}</span><span class="sn-org143-pill">🦆 ${found}/${total} gevonden</span></div>${h.description?`<p style="font-weight:780;line-height:1.5">${esc(h.description)}</p>`:''}<div class="sn-org143-progress">${message?esc(message)+'<br>':''}${done?'Goed gedaan! Deze Event Collectie blijft in Mijn Snazzles staan.':total?`Nog <b>${Math.max(0,total-found)}</b> Snazzle${total-found===1?'':'s'} te vinden. De camera gaat pas aan als je bij het volgende AR-punt bent.`:'De organisatie heeft nog geen AR-Snazzles geplaatst.'}</div>${!done&&total?'<button class="sn-org143-primary" id="snOrgStartSearch143" type="button">🔎 Zoek volgende AR Snazzle</button>':''}<button class="sn-org143-secondary" id="snOrgBackHunts143" type="button">Terug naar Speciale Hunts</button>`;$('#snOrgStartSearch143')?.addEventListener('click',startAr);$('#snOrgBackHunts143')?.addEventListener('click',()=>{closeModal('#snOrgEvent143');openSpecialHunts();});
}
async function startAr(){const h=state.liveHunts.find(x=>x.id===selectedHuntId);if(!h)return;const b=$('#snOrgStartSearch143');if(b)b.disabled=true;try{const pos=await geoOnce();latestPos=pos;const g=here(pos),data=await call('getNextOrgTarget',{huntId:h.id,lat:g.lat,lon:g.lon});if(data.done){await renderEvent('Alle Snazzles zijn gevonden 🎉');return;}target=data.target;closeModal('#snOrgEvent143');$('#snOrgTrackTitle143').textContent=`Zoek: ${target.name||target.assetName||'Snazzle'}`;$('#snOrgTrackHint143').textContent=target.hint?`💡 Hint: ${target.hint}`:'Loop rustig richting het Snazzle-signaal.';openModal('#snOrgTracker143');updateTracking(pos);startWatch();}catch(err){await renderEvent('⚠️ '+errorMessage(err,'AR kon niet starten.'));}finally{if(b)b.disabled=false;}}
function startWatch(){if(watchId!==null)navigator.geolocation?.clearWatch(watchId);watchId=navigator.geolocation.watchPosition(updateTracking,()=>{const d=$('#snOrgDistance143');if(d)d.textContent='GPS even kwijt…';},{enableHighAccuracy:true,timeout:16000,maximumAge:1000});}
async function updateTracking(pos){latestPos=pos;if(!target||cameraBusy)return;const d=Math.round(distance(here(pos),{lat:Number(target.lat),lon:Number(target.lon)})),el=$('#snOrgDistance143');if(el)el.textContent=d<=3?'Je bent er!':`± ${Math.max(0,d)} meter`;if(d<=Math.max(4,Number(target.radius||8)))await openCamera();}
async function openCamera(){if(cameraBusy||!target)return;cameraBusy=true;try{if(watchId!==null){navigator.geolocation?.clearWatch(watchId);watchId=null;}cameraStream=await camera();const v=$('#snOrgVideo143');if(v){v.srcObject=cameraStream;await v.play().catch(()=>{});}const duck=$('#snOrgDuck143');if(duck)duck.innerHTML=target.imageUrl?`<img src="${esc(target.imageUrl)}" alt="${esc(target.assetName||target.name||'Snazzle')}">`:'🦆';$('#snOrgCameraHead143').textContent=`${target.assetName||target.name||'Snazzle'} is hier ergens…`;closeModal('#snOrgTracker143');openModal('#snOrgCamera143');}catch(err){cameraBusy=false;stopAr();await renderEvent('⚠️ '+errorMessage(err,'Camera kon niet starten.'));openModal('#snOrgEvent143');}}
export function stopAr(){if(watchId!==null){navigator.geolocation?.clearWatch(watchId);watchId=null;}if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;}const video=$('#snOrgVideo143');if(video)video.srcObject=null;closeModal('#snOrgTracker143');closeModal('#snOrgCamera143');target=null;latestPos=null;cameraBusy=false;}
async function claimTarget(){if(!target||!latestPos||!selectedHuntId)return;const duck=$('#snOrgDuck143');if(duck)duck.disabled=true;try{const g=here(latestPos),result=await call('claimOrgTarget',{huntId:selectedHuntId,pointId:target.id,lat:g.lat,lon:g.lon,accuracy:Number(latestPos.coords.accuracy||0)}),name=result.found?.assetName||target.assetName||target.name||'Snazzle';try{navigator.vibrate?.([80,45,120]);}catch{}stopAr();window.dispatchEvent(new CustomEvent('snazzle:org-find-added',{detail:result.found||{}}));await renderEvent(`✅ ${name} gevonden! Hij staat nu blijvend in Mijn Snazzles.`);openModal('#snOrgEvent143');}catch(err){toast('⚠️ '+errorMessage(err,'Vondst kon niet worden opgeslagen.'));}finally{if(duck)duck.disabled=false;}}
export function stateChanged(){renderHome();syncQuick();}
function boot(){installUi();watchMenu();window.addEventListener('pagehide',stopAr);window.addEventListener('snazzle:org-state-changed',stateChanged);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SnazzleOrgPublicV143={open:openSpecialHunts,refresh:refreshLiveHunts,stop:stopAr,stateChanged};
