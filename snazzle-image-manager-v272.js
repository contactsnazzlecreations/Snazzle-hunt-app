// Snazzle Image Manager v272 — één overzichtelijk beheer voor alle publieke app-afbeeldingen.
// Vaste appbeelden worden centraal gepubliceerd; contentbeelden worden rechtstreeks in hun eigen Firebase-document bijgewerkt.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, runTransaction } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const VERSION='272.0.0';
const app=getApp(),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
const VISUAL_DB='snazzleVisualAssetsV28',VISUAL_STORE='assets',VISUAL_PURPOSE='snazzleVisualAssetV54';
const MAX_VISUAL=620000,MAX_MAIN=620000;
const ROOT_ID='snImageManager272';
let superAdmin=false,visualDbPromise=null,rendering=false,lastRender=0;

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const groups=[
  {id:'home',title:'🏠 Home & startscherm',desc:'Logo, laadscherm, grote Hunt-afbeelding en de belangrijkste blokken op Home.',items:[
    ['main','profileImage','Logo linksboven','Rond Snazzle-logo bovenaan'],
    ['main','introImage','Afbeelding laadscherm','Verschijnt terwijl de app opent'],
    ['main','heroImage','Grote Hunt-afbeelding','Grote afbeelding bovenaan Home'],
    ['main','homeImage2','Actie / evenement','Afbeelding voor actie of evenement'],
    ['visual','mainStartCard','Achtergrond Start een Hunt','Grote startknop'],
    ['visual','mainStartIcon','Icoon Start een Hunt','Icoon in de startknop'],
    ['visual','arCard','Achtergrond Snazzle AR','AR-tegel op Home'],
    ['visual','arTileIcon','Icoon Snazzle AR','Icoon in de AR-tegel'],
    ['visual','biebCard','Achtergrond De Bieb','De Bieb-tegel'],
    ['visual','biebTileIcon','Icoon De Bieb','Icoon in De Bieb'],
    ['visual','collectionCard','Achtergrond Mijn Snazzles','Verzameling-tegel'],
    ['visual','collectionTileIcon','Icoon Mijn Snazzles','Icoon in verzameling'],
    ['visual','newsCard','Snazzle Nieuws afbeelding','Achtergrond van de Snazzle Nieuws-tegel'],
    ['visual','newsTileIcon','Icoon Snazzle Nieuws','Icoon van Snazzle Nieuws'],
    ['visual','quickFinds','Achtergrond Mijn vondsten','Vondsten-tegel'],
    ['visual','quickFindsIcon','Icoon Mijn vondsten','Icoon van vondsten'],
    ['visual','quickProfile','Achtergrond Mijn profiel','Profiel-tegel'],
    ['visual','quickProfileIcon','Icoon Mijn profiel','Icoon van profiel']
  ]},
  {id:'menu',title:'📱 Ondermenu',desc:'De vijf vaste iconen onderaan de app.',items:[
    ['visual','navHome','Home','Icoon onderaan'],
    ['visual','navHunt','Hunt','Icoon onderaan'],
    ['visual','navFriends','Vrienden','Icoon onderaan'],
    ['visual','navShop','Shop','Icoon onderaan'],
    ['visual','navProfile','Profiel','Icoon onderaan']
  ]},
  {id:'characters',title:'🦆 Snazzles & personages',desc:'Vaste figuren die in de app terugkomen.',items:[
    ['visual','guideCharacter','Snazzle gids','Gids in menu en uitleg'],
    ['visual','secretCharacter','Geheime Snazzle','Verborgen bewegende Snazzle'],
    ['visual','natureCharacter','Natuur Snazzle','Natuurmomenten'],
    ['visual','celebrationCharacter','Beloning / feest Snazzle','Beloningsmomenten']
  ]},
  {id:'forest',title:'🌍 Ontdekkersbos',desc:'Achtergrond, wandelende Snazzle en de zes ontdekplekken.',items:[
    ['visual','worldSceneBackground','Achtergrond Ontdekkersbos','Volledige wereldkaart'],
    ['visual','worldPlayerCharacter','Wandelende Snazzle','Figuur die over de kaart beweegt'],
    ['visual','worldStageBospoort','De Bospoort','Afbeelding ontdekplek'],
    ['visual','worldStageSporenpad','Het Sporenpad','Afbeelding ontdekplek'],
    ['visual','worldStageWaterkant','De Waterkant','Afbeelding ontdekplek'],
    ['visual','worldStageBloemenweide','De Bloemenweide','Afbeelding ontdekplek'],
    ['visual','worldStageBeweegbrug','De Beweegbrug','Afbeelding ontdekplek'],
    ['visual','worldStageUitzicht','De Uitzichtboom','Afbeelding ontdekplek']
  ]},
  {id:'season',title:'🎄 Seizoensbeelden',desc:'Alleen de afbeeldingen van de seizoenssfeer. Kleuren en thema-keuze blijven apart van het afbeeldingsbeheer.',items:[
    ['visual','seasonBackdropImage','Seizoensachtergrond app','Sfeer over de hele app'],
    ['visual','seasonTopImage','Seizoensafbeelding bovenaan','Decoratie bij logo en menu'],
    ['visual','seasonHuntImage','Seizoensafbeelding avonturenvak','Seizoensbeeld in groot Home-vak']
  ]}
];

function toast(message,ms=3300){
  const t=$('#toast');
  if(!t){console.info('[Snazzle Afbeeldingen]',message);return;}
  t.textContent=message;t.classList.add('show');
  clearTimeout(window.__snImageManager272Toast);
  window.__snImageManager272Toast=setTimeout(()=>t.classList.remove('show'),ms);
}
function style(){
  if($('#snImageManager272Style'))return;
  const s=document.createElement('style');s.id='snImageManager272Style';
  s.textContent=[
    '#imagesAdmin.sn272-owned>*:not(#'+ROOT_ID+'){display:none!important}',
    '#'+ROOT_ID+'{display:block!important;color:#342619;padding-bottom:28px}',
    '.sn272-head{padding:15px;border:2px solid #b79255;border-radius:19px;background:#fff8e5;box-shadow:0 4px 12px rgba(71,47,24,.10)}',
    '.sn272-head h3{margin:0 0 5px;font-size:21px}.sn272-head p{margin:0;font-size:12px;line-height:1.45;color:#675135;font-weight:760}',
    '.sn272-online{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:7px 10px;border-radius:999px;background:#e3f4d7;color:#285c35;font-size:10px;font-weight:950}',
    '.sn272-tools{position:sticky;top:0;z-index:12;margin:12px 0 10px;padding:9px;background:rgba(246,222,166,.97);border:1px solid rgba(166,125,70,.35);border-radius:15px;box-shadow:0 5px 12px rgba(77,52,25,.08)}',
    '.sn272-tools input{width:100%;border:2px solid #b9955e;border-radius:12px;padding:11px;background:#fffaf0;color:#342619;font-size:14px;outline:none}',
    '.sn272-jumps{display:flex;gap:7px;overflow:auto;margin-top:8px;padding-bottom:2px;scrollbar-width:none}.sn272-jumps::-webkit-scrollbar{display:none}.sn272-jumps button{flex:0 0 auto;border:0;border-radius:999px;padding:8px 10px;background:#d8ba7a;color:#382719;font-size:10px;font-weight:950}',
    '.sn272-section{margin-top:13px;border:1px solid #c7a56d;border-radius:18px;background:rgba(255,249,233,.82);overflow:hidden}',
    '.sn272-section>summary{list-style:none;cursor:pointer;padding:13px 14px;background:#f9e8b8;font-size:15px;font-weight:1000;display:flex;justify-content:space-between;gap:10px}.sn272-section>summary::-webkit-details-marker{display:none}',
    '.sn272-section>summary small{font-size:10px;color:#6d5637;font-weight:850}.sn272-desc{padding:0 14px 10px;margin:-3px 0 0;background:#f9e8b8;color:#71593b;font-size:10px;line-height:1.35;font-weight:750}',
    '.sn272-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:11px}',
    '.sn272-card{display:flex;flex-direction:column;min-width:0;padding:10px;border:2px solid #b8945d;border-radius:16px;background:#fffaf0;box-shadow:0 3px 8px rgba(80,50,20,.07)}',
    '.sn272-card strong{font-size:11px;line-height:1.3}.sn272-card small{display:block;margin-top:3px;min-height:28px;color:#786044;font-size:9px;line-height:1.35;font-weight:760}',
    '.sn272-preview{height:105px;margin:8px 0;border-radius:12px;background:#e5ddc8;display:grid;place-items:center;overflow:hidden;color:#7d6d55;font-size:9px;font-weight:850;text-align:center;padding:5px}',
    '.sn272-preview img{width:100%;height:100%;object-fit:contain;display:block}.sn272-card.cover .sn272-preview img{object-fit:cover}',
    '.sn272-pick{display:block;border-radius:11px;padding:10px;background:#3d8248;color:#fff;text-align:center;font-size:10px;font-weight:1000;cursor:pointer}.sn272-pick input{display:none!important}',
    '.sn272-remove{width:100%;margin-top:6px;border:0;border-radius:10px;padding:8px;background:#79573e;color:#fff;font-size:9px;font-weight:950}.sn272-remove:disabled{opacity:.45}',
    '.sn272-state{min-height:16px;margin-top:6px;font-size:9px;font-weight:900;color:#52603c}.sn272-state.error{color:#942f26}',
    '.sn272-empty{margin:10px 11px 12px;padding:13px;border:2px dashed #bea16f;border-radius:14px;text-align:center;color:#70593e;font-size:10px;font-weight:800}',
    '.sn272-refresh{width:calc(100% - 22px);margin:0 11px 11px;border:0;border-radius:12px;padding:11px;background:#2c6c55;color:#fff;font-weight:950;font-size:10px}',
    '.sn272-hidden{display:none!important}',
    '@media(max-width:430px){.sn272-grid{grid-template-columns:1fr}.sn272-card small{min-height:0}.sn272-preview{height:120px}}'
  ].join('');
  document.head.appendChild(s);
}
function visualDb(){
  if(visualDbPromise)return visualDbPromise;
  visualDbPromise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(VISUAL_DB,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(VISUAL_STORE))r.result.createObjectStore(VISUAL_STORE);};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Lokale beeldopslag kon niet openen'));
  });
  return visualDbPromise;
}
async function localVisualGet(key){
  try{const d=await visualDb();return await new Promise((resolve,reject)=>{const tx=d.transaction(VISUAL_STORE,'readonly'),r=tx.objectStore(VISUAL_STORE).get(key);r.onsuccess=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error);});}
  catch{return'';}
}
async function localVisualSet(key,value){
  const d=await visualDb();await new Promise((resolve,reject)=>{const tx=d.transaction(VISUAL_STORE,'readwrite');tx.objectStore(VISUAL_STORE).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
}
async function localVisualDelete(key){
  try{const d=await visualDb();await new Promise((resolve,reject)=>{const tx=d.transaction(VISUAL_STORE,'readwrite');tx.objectStore(VISUAL_STORE).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}catch{}
}
async function localVisualAll(){
  try{const d=await visualDb();return await new Promise((resolve,reject)=>{const tx=d.transaction(VISUAL_STORE,'readonly'),st=tx.objectStore(VISUAL_STORE),kr=st.getAllKeys(),vr=st.getAll();tx.oncomplete=()=>{const out=[];const keys=kr.result||[],vals=vr.result||[];keys.forEach((k,i)=>out.push([String(k),String(vals[i]||'')]));resolve(out);};tx.onerror=()=>reject(tx.error);});}catch{return[];}
}
function toB64Url(text){
  const bytes=new TextEncoder().encode(String(text));let binary='';
  for(const b of bytes)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
const visualRef=key=>doc(db,'villages','__snazzle_visual_'+toB64Url(key));
const mainRef=key=>doc(db,'villages','__snazzle_main_asset_'+key);

async function fileData(file,max=1200,quality=.82,maxChars=MAX_VISUAL){
  if(!file||!String(file.type||'').startsWith('image/'))throw new Error('Kies een geldige afbeelding');
  const raw=await new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Bestand kon niet worden gelezen'));r.onload=()=>resolve(String(r.result||''));r.readAsDataURL(file);});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Afbeelding kon niet worden geopend'));i.src=raw;});
  let limit=max,q=quality;
  for(let a=0;a<8;a++){
    const scale=Math.min(1,limit/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));c.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
    const ctx=c.getContext('2d');if(!ctx)throw new Error('Afbeelding verwerken lukt niet');
    ctx.drawImage(img,0,0,c.width,c.height);
    let out=c.toDataURL('image/webp',q);if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/jpeg',q);
    if(out.length<=maxChars)return out;
    limit=Math.max(420,Math.round(limit*.82));q=Math.max(.42,q-.07);
  }
  throw new Error('Afbeelding blijft te groot. Kies een iets kleinere foto');
}
function settings(){
  try{return JSON.parse(localStorage.getItem('snazzleSettings')||'{}')||{};}catch{return{};}
}
function saveSetting(key,value){
  const s=settings();s[key]=value||'';localStorage.setItem('snazzleSettings',JSON.stringify(s));
}
function applyMainLocal(key,src){
  saveSetting(key,src);
  if(key==='profileImage'){
    [['profileLogo','logoFallback'],['profilePreview','profilePreviewFallback']].forEach(([id,fid])=>{const img=$('#'+id),fb=$('#'+fid);if(!img)return;if(src){img.src=src;img.style.display='block';if(fb)fb.style.display='none';}else{img.removeAttribute('src');img.style.display='none';if(fb)fb.style.display='grid';}});
  }
  if(key==='heroImage'){
    const hero=$('#hero');if(hero){if(src){hero.style.setProperty('background-image','linear-gradient(rgba(10,45,30,.28),rgba(6,34,24,.58)),url("'+src+'")','important');hero.style.backgroundSize='cover';hero.style.backgroundPosition='center';}else hero.style.removeProperty('background-image');}
  }
  if(key==='homeImage2'){
    const img=$('#homeImg2'),fb=$('#homeEmpty2');if(img){if(src){img.src=src;img.style.display='block';if(fb)fb.style.display='none';}else{img.removeAttribute('src');img.style.display='none';if(fb)fb.style.display='grid';}}
  }
  try{window.SnazzleCentralAssets?.reapply?.();}catch{}
}
async function readMain(key){
  try{const snap=await getDoc(mainRef(key));const d=snap.data()||{};if(snap.exists()){if(d.cleared===true)return'';const remote=String(d.dataUrl||'');if(remote)return remote;}}catch{}
  return String(settings()[key]||'');
}
async function saveMain(key,data){
  const user=auth.currentUser;if(!superAdmin||!user)throw new Error('Geen beheerdersrechten');
  await setDoc(mainRef(key),{active:false,system:true,purpose:'snazzleAppAsset',key,dataUrl:data,cleared:false,updatedAt:new Date().toISOString(),updatedBy:user.uid},{merge:true});
  const check=await getDoc(mainRef(key));if(!check.exists()||String(check.data()?.dataUrl||'')!==data||check.data()?.cleared===true)throw new Error('Centrale opslag kon niet worden bevestigd');
  applyMainLocal(key,data);return true;
}
async function clearMain(key){
  const user=auth.currentUser;if(!superAdmin||!user)throw new Error('Geen beheerdersrechten');
  await setDoc(mainRef(key),{active:false,system:true,purpose:'snazzleAppAsset',key,dataUrl:'',cleared:true,updatedAt:new Date().toISOString(),updatedBy:user.uid},{merge:true});
  const check=await getDoc(mainRef(key));if(!check.exists()||check.data()?.cleared!==true)throw new Error('Verwijderen kon niet worden bevestigd');
  applyMainLocal(key,'');return true;
}
async function readVisual(key){
  try{const snap=await getDoc(visualRef(key));const d=snap.data()||{};if(snap.exists()){if(d.cleared===true)return'';const remote=String(d.dataUrl||'');if(remote){await localVisualSet(key,remote);return remote;}}}catch{}
  return localVisualGet(key);
}
async function saveVisual(key,data){
  const user=auth.currentUser;if(!superAdmin||!user)throw new Error('Geen beheerdersrechten');
  await setDoc(visualRef(key),{active:false,system:true,purpose:VISUAL_PURPOSE,key,dataUrl:data,cleared:false,updatedAt:new Date().toISOString(),updatedBy:user.uid},{merge:true});
  const check=await getDoc(visualRef(key));if(!check.exists()||String(check.data()?.dataUrl||'')!==data||check.data()?.cleared===true)throw new Error('Centrale opslag kon niet worden bevestigd');
  await localVisualSet(key,data);
  document.dispatchEvent(new CustomEvent('snazzle:visual-asset-changed',{detail:{key,source:'manager272'}}));
  document.dispatchEvent(new CustomEvent('snazzle:visual-assets-updated'));
  try{window.SnazzleHomeCardBackgroundsV75?.refresh?.(true);}catch{}
  return true;
}
async function clearVisual(key){
  const user=auth.currentUser;if(!superAdmin||!user)throw new Error('Geen beheerdersrechten');
  await setDoc(visualRef(key),{active:false,system:true,purpose:VISUAL_PURPOSE,key,dataUrl:'',cleared:true,updatedAt:new Date().toISOString(),updatedBy:user.uid},{merge:true});
  const check=await getDoc(visualRef(key));if(!check.exists()||check.data()?.cleared!==true)throw new Error('Verwijderen kon niet worden bevestigd');
  await localVisualDelete(key);
  document.dispatchEvent(new CustomEvent('snazzle:visual-asset-changed',{detail:{key,source:'manager272',deleted:true}}));
  document.dispatchEvent(new CustomEvent('snazzle:visual-assets-updated'));
  try{window.SnazzleHomeCardBackgroundsV75?.refresh?.(true);}catch{}
  return true;
}
async function saveField(ref,field,data,merge=false){
  if(merge)await setDoc(ref,{[field]:data,updatedAt:new Date().toISOString()},{merge:true});
  else await updateDoc(ref,{[field]:data,updatedAt:new Date().toISOString()});
  const check=await getDoc(ref);if(!check.exists()||String(check.data()?.[field]||'')!==data)throw new Error('Opslag kon niet worden bevestigd');
}
async function clearField(ref,field,merge=false){return saveField(ref,field,'',merge);}

function cardNode(item){
  const card=document.createElement('article');card.className='sn272-card'+(item.cover?' cover':'');card.dataset.search=(item.label+' '+item.note+' '+item.group).toLowerCase();
  card.innerHTML='<strong>'+esc(item.label)+'</strong><small>'+esc(item.note||'')+'</small><div class="sn272-preview">Laden…</div><label class="sn272-pick">Afbeelding wijzigen<input type="file" accept="image/*"></label><button type="button" class="sn272-remove">Afbeelding verwijderen</button><div class="sn272-state"></div>';
  const preview=$('.sn272-preview',card),input=$('input',card),remove=$('.sn272-remove',card),state=$('.sn272-state',card);
  const show=src=>{item.current=String(src||'');preview.innerHTML=item.current?'<img src="'+esc(item.current)+'" alt="Voorbeeld">':'Geen afbeelding ingesteld';remove.disabled=!item.current;};
  Promise.resolve(item.read()).then(show).catch(()=>show(''));
  input.onchange=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    state.classList.remove('error');state.textContent='Afbeelding verwerken…';input.disabled=true;remove.disabled=true;
    try{
      const data=item.rawFile?file:await fileData(file,item.max||1200,item.quality||.82,item.maxChars||MAX_VISUAL);
      state.textContent='Centraal opslaan en controleren…';
      const saved=await item.save(data,file);
      show(saved===true?(item.rawFile?item.current:data):(typeof saved==='string'?saved:data));
      state.textContent='ONLINE ✓ zichtbaar in de app';
      toast(item.label+' staat online ✓');
    }catch(err){state.classList.add('error');state.textContent=err?.message||'Opslaan mislukt';toast('Opslaan mislukt: '+(err?.message||'onbekende fout'),4500);}
    finally{input.value='';input.disabled=false;remove.disabled=!item.current;}
  };
  remove.onclick=async()=>{
    if(!item.current)return;
    state.classList.remove('error');state.textContent='Verwijderen en controleren…';remove.disabled=true;input.disabled=true;
    try{await item.clear();show('');state.textContent='Verwijderd voor iedereen ✓';toast(item.label+' verwijderd');}
    catch(err){state.classList.add('error');state.textContent=err?.message||'Verwijderen mislukt';}
    finally{input.disabled=false;remove.disabled=!item.current;}
  };
  return card;
}
function fixedItem(tuple,group){
  const [kind,key,label,note]=tuple;
  return {group,label,note,cover:/Achtergrond|Grote Hunt|Actie|Nieuws afbeelding|Seizoensachtergrond/i.test(label),read:()=>kind==='main'?readMain(key):readVisual(key),save:async data=>{if(kind==='main')await saveMain(key,data);else await saveVisual(key,data);return data;},clear:()=>kind==='main'?clearMain(key):clearVisual(key)};
}
function sectionNode(id,title,desc,items,open=false){
  const d=document.createElement('details');d.className='sn272-section';d.id='sn272-'+id;d.open=open;
  d.innerHTML='<summary><span>'+esc(title)+'</span><small>'+items.length+' afbeeldingen</small></summary><div class="sn272-desc">'+esc(desc||'')+'</div><div class="sn272-grid"></div>';
  const grid=$('.sn272-grid',d);items.forEach(item=>grid.appendChild(cardNode(item)));
  return d;
}
async function villageItems(){
  let snaps=[];
  try{const q=query(collection(db,'villages'),where('active','==',true));const s=await getDocs(q);snaps=s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>String(x.name||'').trim());}catch{}
  return snaps.sort((a,b)=>String(a.name).localeCompare(String(b.name),'nl')).map(v=>{
    const key='village:'+slug(v.name);
    return {group:'Dorpen',label:'Dorpkaart '+v.name,note:'Achtergrond in de dorpskeuze',cover:true,read:()=>readVisual(key),save:async data=>{await saveVisual(key,data);return data;},clear:()=>clearVisual(key)};
  });
}
async function dynamicData(){
  const out={hunts:[],news:[],cards:[],world:[],ar:[]};
  const tasks=[];
  tasks.push(getDocs(collection(db,'hunts')).then(s=>{
    const docs=s.docs.map(d=>({id:d.id,...d.data()}));
    out.hunts=docs.filter(x=>x.id!=='snazzle_ar_world_v1'&&!String(x.title||'').includes('[SYSTEEM]')).map(x=>({
      group:'Hunts',label:x.title||'Hunt',note:'📍 '+(x.village||'Algemeen'),cover:true,current:String(x.imageUrl||''),read:()=>String(x.imageUrl||''),max:900,quality:.72,maxChars:520000,
      save:async data=>{await saveField(doc(db,'hunts',x.id),'imageUrl',data);return data;},clear:()=>clearField(doc(db,'hunts',x.id),'imageUrl')
    }));
    const ar=docs.find(x=>x.id==='snazzle_ar_world_v1');
    const points=Array.isArray(ar?.points)?ar.points:[];
    out.ar=points.map(p=>({
      group:'AR Snazzles',label:p.name||'AR Snazzle',note:'📍 '+(p.village||'Algemeen')+' · #'+(p.number||'—'),current:String(p.imageUrl||''),read:()=>String(p.imageUrl||''),rawFile:true,
      save:async(_data,file)=>{
        if(!file)throw new Error('Kies een afbeelding');
        if(file.size>8*1024*1024)throw new Error('Afbeelding is groter dan 8 MB');
        const uid=auth.currentUser?.uid;if(!uid)throw new Error('Niet ingelogd');
        const safe=(file.name||'snazzle.png').replace(/[^a-zA-Z0-9._-]+/g,'-');
        const target=storageRef(storage,'listen-stories/images/'+uid+'/ar-edit-'+String(p.id||Date.now())+'-'+Date.now()+'-'+safe);
        await uploadBytes(target,file,{contentType:file.type||'image/png'});
        const url=await getDownloadURL(target);
        const worldRef=doc(db,'hunts','snazzle_ar_world_v1');
        await runTransaction(db,async tx=>{const snap=await tx.get(worldRef),d=snap.data()||{},arr=Array.isArray(d.points)?d.points:[];tx.update(worldRef,{points:arr.map(point=>point.id===p.id?{...point,imageUrl:url,updatedAt:new Date().toISOString()}:point),updatedAt:new Date().toISOString()});});
        p.imageUrl=url;try{window.SnazzleArEngineV245?.reload?.(true);}catch{}return url;
      },
      clear:async()=>{const worldRef=doc(db,'hunts','snazzle_ar_world_v1');await runTransaction(db,async tx=>{const snap=await tx.get(worldRef),d=snap.data()||{},arr=Array.isArray(d.points)?d.points:[];tx.update(worldRef,{points:arr.map(point=>point.id===p.id?{...point,imageUrl:'',updatedAt:new Date().toISOString()}:point),updatedAt:new Date().toISOString()});});p.imageUrl='';try{window.SnazzleArEngineV245?.reload?.(true);}catch{}}
    }));
  }).catch(()=>{}));
  tasks.push(getDocs(query(collection(db,'villages'),where('contentType','==','snazzleNewsItem'))).then(s=>{
    out.news=s.docs.map(d=>({id:d.id,...d.data()})).map(x=>({
      group:'Snazzle Nieuws',label:x.title||'Nieuwsafbeelding',note:(x.category||'Nieuws')+(x.type==='poster'?' · poster':''),cover:true,current:String(x.image||''),read:()=>String(x.image||''),max:1300,quality:.8,maxChars:600000,
      save:async data=>{await saveField(doc(db,'villages',x.id),'image',data);return data;},clear:()=>clearField(doc(db,'villages',x.id),'image')
    }));
  }).catch(()=>{}));
  tasks.push(getDocs(collection(db,'snazzleCards')).then(s=>{
    out.cards=s.docs.map(d=>({id:d.id,...d.data()})).map(x=>({
      group:'Snazzle Cards',label:(x.number?x.number+' · ':'')+(x.name||'Snazzle Card'),note:x.series||'Kaart',current:String(x.imageData||''),read:()=>String(x.imageData||''),max:620,quality:.72,maxChars:500000,
      save:async data=>{await saveField(doc(db,'snazzleCards',x.id),'imageData',data);return data;},clear:()=>clearField(doc(db,'snazzleCards',x.id),'imageData')
    }));
  }).catch(()=>{}));
  tasks.push(Promise.all([
    getDoc(doc(db,'villages','snazzle-world-v47-config')),
    getDocs(query(collection(db,'villages'),where('contentType','in',['snazzleWorldStory','snazzleWorldMission','snazzleWorldTv','snazzleWorldBadge'])))
  ]).then(([cfgSnap,itemSnap])=>{
    const cfg=cfgSnap.exists()?cfgSnap.data()||{}:{};
    const fields=[
      ['heroImage','Snazzle Wereld — afbeelding bovenaan'],
      ['roomBgImage','Snazzle Wereld — kamerachtergrond'],
      ['mascotImage','Snazzle Wereld — mascotte'],
      ['seasonImage','Snazzle Wereld — seizoensafbeelding'],
      ['secretImage','Snazzle Wereld — geheime afbeelding']
    ];
    const cfgRef=doc(db,'villages','snazzle-world-v47-config');
    out.world=fields.map(([field,label])=>({
      group:'Mijn Snazzle Wereld',label,note:'Vaste afbeelding in Snazzle Wereld',cover:/achtergrond|bovenaan|seizoen/i.test(label),current:String(cfg[field]||''),read:()=>String(cfg[field]||''),max:900,quality:.68,maxChars:160000,
      save:async data=>{await saveField(cfgRef,field,data,true);cfg[field]=data;return data;},clear:async()=>{await clearField(cfgRef,field,true);cfg[field]='';}
    }));
    itemSnap.docs.forEach(d=>{const x={id:d.id,...d.data()};out.world.push({
      group:'Mijn Snazzle Wereld',label:x.title||'Wereld-item',note:({snazzleWorldStory:'Verhaal',snazzleWorldMission:'Opdracht',snazzleWorldTv:'TV',snazzleWorldBadge:'Badge'})[x.contentType]||'Onderdeel',cover:true,current:String(x.image||''),read:()=>String(x.image||''),max:900,quality:.68,maxChars:160000,
      save:async data=>{await saveField(doc(db,'villages',x.id),'image',data);return data;},clear:()=>clearField(doc(db,'villages',x.id),'image')
    });});
  }).catch(()=>{}));
  await Promise.all(tasks);
  return out;
}
async function overrideItems(){
  const all=await localVisualAll();
  return all.filter(([key,val])=>key.startsWith('override:')&&val.startsWith('data:image/')).map(([key,val])=>({
    group:'Overige pagina’s',label:key.replace(/^override:/,'').replace(/[:_-]+/g,' ').slice(0,70),note:'Extra pagina-afbeelding',cover:true,current:val,read:()=>readVisual(key),save:async data=>{await saveVisual(key,data);return data;},clear:()=>clearVisual(key)
  }));
}
function setupSearch(root){
  const input=$('#sn272Search',root);if(!input)return;
  input.oninput=()=>{const term=input.value.trim().toLowerCase();root.querySelectorAll('.sn272-card').forEach(card=>card.classList.toggle('sn272-hidden',!!term&&!card.dataset.search.includes(term)));};
}
async function render(){
  if(!superAdmin||rendering)return;
  const admin=$('#imagesAdmin');if(!admin)return;
  const now=Date.now();if(now-lastRender<500)return;lastRender=now;rendering=true;style();admin.classList.add('sn272-owned');
  let root=$('#'+ROOT_ID,admin);
  if(!root){root=document.createElement('div');root.id=ROOT_ID;admin.appendChild(root);}
  root.innerHTML='<div class="sn272-head"><h3>🖼️ Alle afbeeldingen van de app</h3><p>Hier verander je de publieke Snazzle-afbeeldingen. Na upload wordt iedere wijziging centraal opgeslagen én teruggelezen ter controle. Pas na die controle krijg je <b>ONLINE ✓</b>.</p><span class="sn272-online">● Centrale opslag verbonden</span></div><div class="sn272-tools"><input id="sn272Search" type="search" placeholder="Zoek bijvoorbeeld Nieuws, Hunt, logo, AR…"><div class="sn272-jumps" id="sn272Jumps"></div></div><div id="sn272Sections"><div class="sn272-empty">Afbeeldingen en actuele inhoud laden…</div></div>';
  setupSearch(root);
  try{
    const [villages,dynamic,overrides]=await Promise.all([villageItems(),dynamicData(),overrideItems()]);
    const sections=[];
    groups.forEach((g,i)=>sections.push({id:g.id,title:g.title,desc:g.desc,items:g.items.map(t=>fixedItem(t,g.title)),open:i===0}));
    if(villages.length)sections.push({id:'villages',title:'📍 Dorpen',desc:'Achtergrond van ieder zichtbaar dorp in de dorpskeuze.',items:villages});
    sections.push({id:'hunts',title:'🔎 Hunts',desc:'De afbeelding die bij iedere Hunt zichtbaar is.',items:dynamic.hunts});
    sections.push({id:'news',title:'📰 Snazzle Nieuws',desc:'Afbeeldingen en posters die in Snazzle Nieuws staan.',items:dynamic.news});
    sections.push({id:'cards',title:'🃏 Snazzle Cards',desc:'De afbeelding op iedere Snazzle Card.',items:dynamic.cards});
    sections.push({id:'world',title:'✨ Mijn Snazzle Wereld',desc:'Vaste Wereld-beelden plus afbeeldingen van verhalen, opdrachten, TV en badges.',items:dynamic.world});
    sections.push({id:'ar',title:'📍 AR Snazzles',desc:'De afbeelding van iedere geplaatste AR-Snazzle.',items:dynamic.ar});
    if(overrides.length)sections.push({id:'other',title:'🧩 Overige pagina-afbeeldingen',desc:'Extra beelden die door andere app-pagina’s zijn geregistreerd.',items:overrides});
    const host=$('#sn272Sections',root);host.replaceChildren();
    const jumps=$('#sn272Jumps',root);jumps.replaceChildren();
    sections.forEach((sec,i)=>{
      const b=document.createElement('button');b.type='button';b.textContent=sec.title.replace(/^[^\p{L}\p{N}]+/u,'');b.onclick=()=>{const el=$('#sn272-'+sec.id);if(el){el.open=true;el.scrollIntoView({behavior:'smooth',block:'start'});}};jumps.appendChild(b);
      if(sec.items.length)host.appendChild(sectionNode(sec.id,sec.title,sec.desc,sec.items,sec.open));
      else{const d=document.createElement('details');d.className='sn272-section';d.id='sn272-'+sec.id;d.innerHTML='<summary><span>'+esc(sec.title)+'</span><small>0 afbeeldingen</small></summary><div class="sn272-desc">'+esc(sec.desc)+'</div><div class="sn272-empty">Hier staat op dit moment geen eigen afbeelding om te beheren.</div>';host.appendChild(d);}
    });
    const refresh=document.createElement('button');refresh.type='button';refresh.className='sn272-refresh';refresh.textContent='🔄 Overzicht opnieuw laden';refresh.onclick=()=>{lastRender=0;render();};host.appendChild(refresh);
    setupSearch(root);
  }catch(err){
    const host=$('#sn272Sections',root);if(host)host.innerHTML='<div class="sn272-empty">⚠️ Overzicht kon niet volledig laden. Sluit Beheer, log opnieuw in en probeer nogmaals.</div>';
    console.error('Snazzle Image Manager v272',err);
  }finally{rendering=false;}
}
function installWatch(){
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('#adminSheet .tabs button');
    if(!b)return;
    const isImages=b.dataset.tab==='imagesAdmin'||/afbeeldingen/i.test(b.textContent||'');
    if(isImages)setTimeout(()=>{lastRender=0;render();},40);
  },true);
  document.addEventListener('snazzle:admin-ui-ready',()=>setTimeout(()=>{if(superAdmin)render();},80));
  const mo=new MutationObserver(()=>{if(!superAdmin)return;const admin=$('#imagesAdmin');if(admin&&!$('#'+ROOT_ID,admin))setTimeout(()=>{lastRender=0;render();},60);});
  mo.observe(document.documentElement,{childList:true,subtree:true});
}
onAuthStateChanged(auth,async user=>{
  superAdmin=false;
  if(user&&!user.isAnonymous){
    try{const snap=await getDoc(doc(db,'adminUsers',user.uid)),d=snap.data()||{};superAdmin=snap.exists()&&d.active===true&&d.role==='superadmin';}catch{}
  }
  const admin=$('#imagesAdmin');
  if(!superAdmin){admin?.classList.remove('sn272-owned');$('#'+ROOT_ID)?.remove();return;}
  setTimeout(()=>{lastRender=0;render();},120);
});
style();installWatch();
window.SnazzleImageManagerV272={render:()=>{lastRender=0;return render();},version:VERSION};
