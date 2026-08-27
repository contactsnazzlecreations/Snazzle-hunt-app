// Snazzle AR save patch v122 — alleen voor de groene knop in de plaatsstudio.
// De bestaande app/UI blijft ongewijzigd. De patch voorkomt de vastlopende Firebase Storage-upload
// door een kleine WebP-versie rechtstreeks samen met het AR-punt in Firestore te bewaren.

import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
const WORLD_DOC=doc(db,'hunts','snazzle_ar_world_v1');
const $=(s,r=document)=>r.querySelector(s);
let busy=false;

function setStatus(text,type=''){
  const el=$('#snArStudioStatus90');
  if(!el)return;
  el.className='sn-ar-status90'+(type?` ${type}`:'');
  el.textContent=text;
}

function withTimeout(promise,ms,message){
  let timer;
  return Promise.race([
    promise,
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);})
  ]).finally(()=>clearTimeout(timer));
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
  const match=coords.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if(!match)throw new Error('De GPS-positie is niet meer beschikbaar. Ga één keer terug naar Kaart en daarna weer naar Camera.');
  const acc=coords.match(/±\s*(\d+)/);
  const obj=$('#snArPlaceObject90');
  const pct=(value,fallback)=>{
    const n=parseFloat(String(value||''));
    return Number.isFinite(n)?n/100:fallback;
  };
  return {
    lat:Number(match[1]),lon:Number(match[2]),accuracy:acc?Number(acc[1]):0,
    x:pct(obj?.style.left,.5),y:pct(obj?.style.top,.56),size:pct(obj?.style.width,.34),
    rotation:Number($('#snArRotate90')?.value||0)
  };
}

function loadImage(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('De Snazzle-afbeelding kon niet worden voorbereid.'));};
    img.src=url;
  });
}

function canvasBlob(canvas,type,quality){
  return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
}

function blobDataUrl(blob){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('De verkleinde afbeelding kon niet worden gelezen.'));
    reader.readAsDataURL(blob);
  });
}

async function makeSmallImage(file){
  if(!file)return '';
  if(file.size>8*1024*1024)throw new Error('De afbeelding is groter dan 8 MB. Kies een kleinere afbeelding.');
  setStatus('🪄 Snazzle-afbeelding voorbereiden…');
  const img=await loadImage(file);
  const iw=Number(img.naturalWidth||img.width||0),ih=Number(img.naturalHeight||img.height||0);
  if(!iw||!ih)throw new Error('De afbeelding heeft geen geldige afmetingen.');

  const attempts=[
    [420,.68],[360,.60],[320,.54],[280,.48],[240,.44]
  ];
  let best=null;
  for(const [maxSide,quality] of attempts){
    const scale=Math.min(1,maxSide/Math.max(iw,ih));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(iw*scale));
    canvas.height=Math.max(1,Math.round(ih*scale));
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)throw new Error('Afbeelding verkleinen wordt niet ondersteund op dit toestel.');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const blob=await canvasBlob(canvas,'image/webp',quality);
    if(blob)best=blob;
    if(blob&&blob.size<=48*1024)break;
  }
  if(!best)throw new Error('De Snazzle-afbeelding kon niet worden verkleind.');
  if(best.size>70*1024)throw new Error('De afbeelding blijft te groot. Kies een eenvoudiger PNG/WebP-bestand.');
  setStatus(`✅ Afbeelding klaar (${Math.max(1,Math.round(best.size/1024))} KB). Locatie opslaan…`);
  return blobDataUrl(best);
}

function stopStudioCamera(){
  const video=$('#snArPlaceVideo90');
  try{video?.srcObject?.getTracks?.().forEach(t=>t.stop());}catch{}
  if(video)video.srcObject=null;
}

async function readPoints(){
  const snap=await withTimeout(getDoc(WORLD_DOC),15000,'De AR-opslag reageerde niet op tijd.');
  const data=snap.exists()?snap.data():{};
  return Array.isArray(data.points)?data.points:[];
}

function showDone(point){
  const map=$('#snArStudioMap90'),cam=$('#snArStudioCam90'),done=$('#snArStudioDone90');
  if(map)map.hidden=true;if(cam)cam.hidden=true;if(done)done.hidden=false;
  $('#snArStepMap90')?.classList.remove('on');
  $('#snArStepCam90')?.classList.remove('on');
  $('#snArStepSave90')?.classList.add('on');
  const out=$('#snArDoneText90');
  if(out)out.textContent=`${point.name} is opgeslagen op ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}. De camera-positie, grootte en draaiing zijn mee opgeslagen.`;
}

function friendly(err){
  const code=String(err?.code||'').toLowerCase();
  if(navigator.onLine===false)return 'Geen internetverbinding. Zet mobiel internet of wifi aan en probeer opnieuw.';
  if(code.includes('permission-denied'))return 'Opslaan is geweigerd. Sluit Beheer, log opnieuw in en probeer opnieuw.';
  if(code.includes('unavailable'))return 'Firebase is tijdelijk niet bereikbaar. Probeer nog één keer.';
  return String(err?.message||'Opslaan is mislukt.');
}

async function save(btn){
  if(busy)return;
  busy=true;
  const oldText=btn.textContent;
  btn.disabled=true;
  btn.textContent='⏳ Opslaan…';
  try{
    if(!auth.currentUser)throw new Error('Je bent niet meer ingelogd als hoofdbeheerder.');
    const f=formData();
    if(f.name.length<2)throw new Error('Vul eerst een naam voor de Snazzle in.');
    const p=placementData();
    const imageUrl=await makeSmallImage(f.file);
    stopStudioCamera();
    setStatus('📍 Bestaande AR-punten laden…');
    const existing=await readPoints();
    const now=new Date().toISOString();
    const id=`ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
    const point={
      id,name:f.name,number:f.number||'—',rarity:f.rarity,village:f.village,radius:f.radius,
      lat:p.lat,lon:p.lon,accuracy:p.accuracy,imageUrl,active:true,
      placement:{version:1,mode:'camera-composed',x:Number(p.x.toFixed(4)),y:Number(p.y.toFixed(4)),size:Number(p.size.toFixed(4)),rotation:Number(p.rotation.toFixed(1)),placedAt:now},
      createdAt:now,updatedAt:now,createdBy:auth.currentUser.uid
    };
    const points=[...existing,point];
    if(JSON.stringify(points).length>850000)throw new Error('De centrale AR-opslag wordt te groot. Verwijder eerst een oude AR Snazzle.');
    setStatus('💾 Snazzle en GPS-positie opslaan…');
    await withTimeout(setDoc(WORLD_DOC,{
      _snazzleInternalType:'arWorld',title:'[SYSTEEM] AR-WERELD',village:'snazzle-internal',
      description:'Interne opslag voor permanente Snazzle AR-punten',rule:'',hint:'',foundMessage:'',imageUrl:'',start:'',end:'',mode:'draft',
      version:7,points,updatedAt:now,updatedBy:auth.currentUser.uid
    },{merge:true}),20000,'Opslaan duurde te lang. Controleer 4G/wifi en probeer opnieuw.');
    setStatus('✅ Snazzle en locatie zijn opgeslagen.','ok');
    showDone(point);
    window.SnazzleArAdminV85?.refresh?.();
    try{navigator.vibrate?.([60,40,100]);}catch{}
  }catch(err){
    setStatus('⚠️ '+friendly(err),'err');
  }finally{
    btn.disabled=false;
    btn.textContent=oldText;
    busy=false;
  }
}

// Capture-fase: hierdoor krijgt de oude Storage-handler de klik niet meer.
document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#snArSavePlacement90');
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  save(btn);
},true);

window.SnazzleArSaveInlineV122={version:'122-inline-firestore'};
