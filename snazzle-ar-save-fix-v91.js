// Snazzle AR save fix v91 — alleen de beheerknop 'Snazzle hier vastzetten'.
// Omzeilt de Firebase Storage-upload die op sommige Android-toestellen blijft hangen.
// De Snazzle-afbeelding wordt klein gemaakt en samen met het AR-punt in Firestore opgeslagen.

import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth(),db=getFirestore();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function timeout(promise,ms,message){
  let timer;
  return Promise.race([
    promise,
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);})
  ]).finally(()=>clearTimeout(timer));
}

function setStatus(text,type=''){
  const el=$('#snArStudioStatus90');
  if(!el)return;
  el.className='sn-ar-status90'+(type?` ${type}`:'');
  el.textContent=text;
}

function friendly(err){
  const code=String(err?.code||'').toLowerCase();
  const msg=String(err?.message||'');
  if(navigator.onLine===false)return 'Geen internetverbinding. Zet mobiel internet of wifi aan en probeer opnieuw.';
  if(code.includes('permission-denied')||code.includes('unauthorized'))return 'Opslaan is geweigerd. Log opnieuw in als hoofdbeheerder en probeer opnieuw.';
  if(code.includes('unavailable')||code.includes('network')||/timeout|reageerde niet/i.test(msg))return 'De verbinding met Firebase haperde. Probeer opnieuw met stabiele 4G of wifi.';
  return msg||'Opslaan is mislukt. Probeer opnieuw.';
}

function formData(){
  return {
    name:($('#snArAdminName85')?.value||'Scout Snazzle').trim(),
    number:($('#snArAdminNumber85')?.value||'001').trim(),
    rarity:$('#snArAdminRarity85')?.value||'RARE',
    village:$('#snArAdminVillage85')?.value||'Montfort',
    radius:Number($('#snArAdminRadius85')?.value||7),
    file:$('#snArAdminImage85')?.files?.[0]||null
  };
}

function placementData(){
  const coords=String($('#snArCoords90')?.textContent||'');
  const m=coords.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if(!m)throw new Error('De GPS-locatie kon niet worden gelezen. Ga één keer terug naar Kaart en probeer opnieuw.');
  const acc=coords.match(/±\s*(\d+)/);
  const obj=$('#snArPlaceObject90');
  const pct=(value,fallback)=>{const n=parseFloat(String(value||''));return Number.isFinite(n)?n/100:fallback;};
  return {
    lat:Number(m[1]),lon:Number(m[2]),accuracy:acc?Number(acc[1]):0,
    x:pct(obj?.style.left,.5),y:pct(obj?.style.top,.56),size:pct(obj?.style.width,.34),
    rotation:Number($('#snArRotate90')?.value||0)
  };
}

function stopCamera(){
  const video=$('#snArPlaceVideo90');
  try{video?.srcObject?.getTracks?.().forEach(t=>t.stop());}catch{}
  if(video)video.srcObject=null;
}

function blobFromCanvas(canvas,type,quality){return new Promise(resolve=>canvas.toBlob(resolve,type,quality));}
function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Afbeelding kon niet worden gelezen.'));r.readAsDataURL(blob);});}

async function loadImage(file){
  if('createImageBitmap' in window){try{return await createImageBitmap(file);}catch{}}
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Afbeelding kon niet worden voorbereid.'));};
    img.src=url;
  });
}

async function makeWebp(image,maxSide,quality){
  const iw=Number(image.width||image.naturalWidth||0),ih=Number(image.height||image.naturalHeight||0);
  if(!iw||!ih)throw new Error('Ongeldige afbeelding.');
  const scale=Math.min(1,maxSide/Math.max(iw,ih));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(iw*scale));canvas.height=Math.max(1,Math.round(ih*scale));
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)throw new Error('Afbeelding verkleinen wordt niet ondersteund op dit toestel.');
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
  return blobFromCanvas(canvas,'image/webp',quality);
}

async function inlineImage(file){
  if(!file)return '';
  if(file.size>8*1024*1024)throw new Error('Afbeelding is groter dan 8 MB. Kies een kleinere afbeelding.');
  setStatus('🪄 Snazzle-afbeelding voorbereiden…');
  const image=await loadImage(file);
  try{
    let blob=await makeWebp(image,380,.58);
    if(!blob)throw new Error('Afbeelding kon niet worden verkleind.');
    if(blob.size>50*1024)blob=await makeWebp(image,320,.48)||blob;
    if(blob.size>65*1024)throw new Error('De afbeelding blijft te groot. Kies een eenvoudiger PNG/WebP-bestand.');
    setStatus(`✅ Afbeelding klaar (${Math.max(1,Math.round(blob.size/1024))} KB). Locatie opslaan…`);
    return await blobToDataUrl(blob);
  }finally{try{image.close?.();}catch{}}
}

async function readWorld(){
  const snap=await timeout(getDoc(WORLD_DOC),15000,'De AR-wereld reageerde niet op tijd.');
  const data=snap.exists()?snap.data():{};
  return Array.isArray(data.points)?data.points:[];
}

async function writeWorld(payload){
  return timeout(setDoc(WORLD_DOC,payload,{merge:true}),18000,'Firebase reageerde niet op het opslaan.');
}

function showDone(point){
  const map=$('#snArStudioMap90'),cam=$('#snArStudioCam90'),done=$('#snArStudioDone90');
  if(map)map.hidden=true;if(cam)cam.hidden=true;if(done)done.hidden=false;
  $('#snArStepMap90')?.classList.remove('on');$('#snArStepCam90')?.classList.remove('on');$('#snArStepSave90')?.classList.add('on');
  const out=$('#snArDoneText90');
  if(out)out.innerHTML=`<b>${esc(point.name)}</b> is opgeslagen op ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}.<br>Afbeelding, positie, grootte en draaiing zijn opgeslagen.`;
}

async function save(btn){
  if(btn.dataset.snSaveBusy==='1')return;
  const f=formData(),p=placementData();
  if(!auth.currentUser)throw new Error('Je bent niet meer ingelogd als beheerder.');
  if(f.name.length<2)throw new Error('Vul eerst een naam voor de Snazzle in.');
  if(navigator.onLine===false)throw new Error('Geen internetverbinding.');

  btn.dataset.snSaveBusy='1';
  const old=btn.textContent;
  btn.disabled=true;btn.textContent='⏳ Opslaan…';
  try{
    stopCamera();
    const imageUrl=await inlineImage(f.file);
    setStatus('📍 Bestaande AR-punten laden…');
    const existing=await readWorld();
    const id=`ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
    const now=new Date().toISOString();
    const point={
      id,name:f.name,number:f.number||'—',rarity:f.rarity,village:f.village,radius:f.radius,
      lat:p.lat,lon:p.lon,accuracy:p.accuracy,imageUrl,active:true,
      placement:{version:1,mode:'camera-composed',x:Number(p.x.toFixed(4)),y:Number(p.y.toFixed(4)),size:Number(p.size.toFixed(4)),rotation:Number(p.rotation.toFixed(1)),placedAt:now},
      createdAt:now,updatedAt:now,createdBy:auth.currentUser.uid
    };
    const next=[...existing,point];
    if(JSON.stringify(next).length>850000)throw new Error('De AR-opslag wordt te groot. Verwijder eerst een oude geplaatste Snazzle.');
    setStatus('💾 Snazzle en GPS-locatie opslaan…');
    await writeWorld({_snazzleInternalType:'arWorld',title:'[SYSTEEM] AR-WERELD',village:'snazzle-internal',description:'Interne opslag voor permanente Snazzle AR-punten',rule:'',hint:'',foundMessage:'',imageUrl:'',start:'',end:'',mode:'draft',version:5,points:next,updatedAt:now,updatedBy:auth.currentUser.uid});
    setStatus('✅ Snazzle en locatie zijn opgeslagen.','ok');
    showDone(point);
    window.SnazzleArAdminV85?.refresh?.();
    try{navigator.vibrate?.([60,40,100]);}catch{}
  }catch(err){
    setStatus('⚠️ '+friendly(err),'err');
  }finally{
    delete btn.dataset.snSaveBusy;btn.disabled=false;btn.textContent=old;
  }
}

document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#snArSavePlacement90');
  if(!btn)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  save(btn);
},true);

window.SnazzleArSaveFixV91={version:'91-isolated-mobile'};
