// Snazzle AR Card Unlock v127
// AR toont alleen de transparante geplaatste Snazzle. De bijbehorende kaart blijft een aparte kaart-afbeelding
// en wordt pas ontgrendeld nadat dezelfde Snazzle via AR is gevangen.

import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,collection,doc,getDoc,getDocs,onSnapshot,setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const WORLD_DOC=db?doc(db,'hunts','snazzle_ar_world_v1'):null;
let user=null,cards=[],hunts=[],cloudAr=[],world=[],unsubCards=null,unsubHunts=null,unsubUser=null,observer=null,adminObserver=null,patchBusy=false;

function localAr(){try{const x=JSON.parse(localStorage.getItem('snazzleARCollection')||'[]');return Array.isArray(x)?x.filter(v=>v?.id):[]}catch{return[]}}
function keyName(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').trim();}
function keyNumber(v){const s=String(v||'').toUpperCase();const d=s.match(/\d+/g);return d?.join('')||s.replace(/[^A-Z0-9]/g,'');}
function isWild(c){return /\bwild\b/i.test(String(c?.series||''))||/^WC[-_ ]?/i.test(String(c?.number||''))||/wild\s*card/i.test(String(c?.description||''));}
function arRelevant(c){return c?.unlockType==='ar'||isWild(c);}
function mergedAr(){const m=new Map();[...cloudAr,...localAr()].forEach(x=>{if(x?.id)m.set(String(x.id),x)});return [...m.values()];}
function matchesAr(c,item){
  if(!c||!item)return false;
  if(c.arPointId&&String(c.arPointId)===String(item.id))return true;
  const cn=keyNumber(c.number),inr=keyNumber(item.number);
  if(cn&&inr&&cn===inr)return true;
  const a=keyName(c.name),b=keyName(item.name);
  return !!a&&a===b;
}
function arUnlocked(c){return mergedAr().some(item=>matchesAr(c,item));}
function wonHunts(){return user?hunts.filter(h=>h.found===true&&h.foundByUserId===user.uid):[];}
function fullyUnlocked(c){
  if(!user)return false;
  if(arRelevant(c))return arUnlocked(c);
  const w=wonHunts(),ids=new Set(w.map(h=>h.id)),type=c.unlockType||'hunt';
  if(type==='hunt'||type==='event')return !!c.huntId&&ids.has(c.huntId);
  if(type==='milestone')return w.length>=(Number(c.threshold)||1);
  if(type==='special')return (!!c.huntId&&ids.has(c.huntId))||(Number(c.threshold)>0&&w.length>=Number(c.threshold));
  return false;
}
function byNumber(n){return cards.find(c=>String(c.number||'').toUpperCase()===String(n||'').toUpperCase());}

function patchCardEl(el){
  const num=el.querySelector('.sc2-num')?.textContent||'';
  const c=byNumber(num);if(!c)return;
  const u=fullyUnlocked(c);
  el.classList.toggle('unlocked',u);el.classList.toggle('locked',!u);
  const lock=el.querySelector('.sc2-lock');if(lock)lock.style.display=u?'none':'';
  const src=el.querySelector('.sc2-source');if(src&&arRelevant(c))src.textContent=u?'📷 AR gevonden ✓':'📷 Vind deze Snazzle in AR';
  const name=el.querySelector('.sc2-info strong');
  if(name&&arRelevant(c))name.textContent=u?(c.name||'Snazzle'):'Mysterie Snazzle';
}
function patchSummary(){
  const active=cards.filter(c=>c.active!==false&&c.unlockType!=='special');
  if(!active.length)return;
  const n=active.filter(fullyUnlocked).length;
  const count=$('#sc2SummaryCount');if(count)count.textContent=`${n}/${active.length}`;
  const txt=$('#sc2SummaryText');if(txt)txt.textContent=`${Math.round(n/active.length*100)||0}% van je collectie ontdekt`;
  const home=$('#collectionHomeStatus');if(home)home.textContent=`${n} van ${active.length} Snazzles ontdekt`;
  let pill=$('#sc2ArProgress127');
  if(!pill&&$('#sc2Block .sc2-summary')){pill=document.createElement('div');pill.id='sc2ArProgress127';pill.style.cssText='grid-column:1/-1;margin-top:7px;font-size:10px;font-weight:900;color:#eaffc8';$('#sc2Block .sc2-summary').appendChild(pill);}
  if(pill){const a=active.filter(arRelevant),au=a.filter(fullyUnlocked).length;pill.textContent=a.length?`📷 AR/Wild Cards: ${au}/${a.length} gevonden`:'';}
}
function patchUi(){
  if(patchBusy)return;patchBusy=true;
  try{$$('.sc2-card').forEach(patchCardEl);patchSummary();ensureAdminArUi();}finally{patchBusy=false;}
}
function schedulePatch(ms=30){setTimeout(patchUi,ms);}

async function loadWorld(){
  if(!db||!WORLD_DOC)return;
  try{const s=await getDoc(WORLD_DOC),d=s.exists()?s.data():{};world=Array.isArray(d.points)?d.points.filter(p=>p?.id):[];}catch(e){console.warn('AR-kaartkoppeling: AR-punten niet geladen',e)}
  fillArOptions();
}
function arLabel(p){return `${p.number||'—'} · ${p.name||'Snazzle'} · ${p.village||''}`;}
function fillArOptions(){
  const s=$('#sc2ArPoint127');if(!s)return;const cur=s.value;
  s.innerHTML='<option value="">Automatisch koppelen op nummer/naam</option>'+world.map(p=>`<option value="${String(p.id).replace(/"/g,'&quot;')}">${arLabel(p).replace(/</g,'&lt;')}</option>`).join('');
  if([...s.options].some(o=>o.value===cur))s.value=cur;
}
function currentEditorCard(){return byNumber($('#sc2Number')?.value||'');}
function toggleArField(){
  const f=$('#sc2ArField127'),type=$('#sc2Unlock')?.value;
  if(f)f.style.display=type==='ar'?'':'none';
}
function syncEditor(){
  const sel=$('#sc2Unlock');if(!sel)return;
  if(![...sel.options].some(o=>o.value==='ar')){const o=document.createElement('option');o.value='ar';o.textContent='📷 Via AR Snazzle';sel.appendChild(o);}
  let f=$('#sc2ArField127');
  if(!f){
    f=document.createElement('div');f.className='field';f.id='sc2ArField127';f.style.display='none';
    f.innerHTML='<label>Koppel aan AR Snazzle</label><select id="sc2ArPoint127"><option value="">Automatisch koppelen op nummer/naam</option></select><small style="display:block;margin-top:5px;font-weight:800;color:#6b5437">In AR blijft alleen de transparante Snazzle zichtbaar. Deze koppeling ontgrendelt daarna de aparte kaart.</small>';
    const unlockField=sel.closest('.field');unlockField?.insertAdjacentElement('afterend',f);fillArOptions();
  }
  if(!sel.dataset.ar127){sel.dataset.ar127='1';sel.addEventListener('change',toggleArField);}
  const c=currentEditorCard();
  if(c&&c.unlockType==='ar')sel.value='ar';
  toggleArField();
  const arSel=$('#sc2ArPoint127');if(arSel&&c?.arPointId)arSel.value=String(c.arPointId);
}
function ensureAdminArUi(){
  const editor=$('#sc2Editor');if(!editor)return false;syncEditor();
  if(!editor.dataset.ar127){editor.dataset.ar127='1';adminObserver=new MutationObserver(()=>{if(editor.classList.contains('show'))setTimeout(syncEditor,20);});adminObserver.observe(editor,{attributes:true,attributeFilter:['class']});}
  const save=$('#sc2Save');
  if(save&&!save.dataset.ar127){
    save.dataset.ar127='1';
    save.addEventListener('click',()=>{
      const type=$('#sc2Unlock')?.value,number=$('#sc2Number')?.value.trim().toUpperCase(),arPointId=$('#sc2ArPoint127')?.value||'';
      if(type!=='ar'||!number||!db)return;
      const persist=async()=>{
        try{
          const snap=await getDocs(collection(db,'snazzleCards'));let hit=null;snap.forEach(d=>{const x=d.data()||{};if(String(x.number||'').toUpperCase()===number)hit={id:d.id,...x};});
          if(hit)await setDoc(doc(db,'snazzleCards',hit.id),{unlockType:'ar',arPointId,updatedAt:new Date().toISOString()},{merge:true});
        }catch(e){console.warn('AR-kaartkoppeling opslaan mislukt',e)}
      };
      setTimeout(persist,800);setTimeout(persist,1800);
    },true);
  }
  return true;
}

function startObservers(){
  if(observer||!document.body)return;
  observer=new MutationObserver(()=>schedulePatch(20));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  schedulePatch(0);
}
function bindUser(u){
  user=u;try{unsubUser?.();}catch{}unsubUser=null;cloudAr=[];
  if(u&&db){unsubUser=onSnapshot(doc(db,'users',u.uid),s=>{const d=s.exists()?s.data():{};cloudAr=Array.isArray(d.arCollectionV1)?d.arCollectionV1:[];schedulePatch(0);},()=>schedulePatch());}
  schedulePatch(0);
}

if(db){
  unsubCards=onSnapshot(collection(db,'snazzleCards'),s=>{cards=s.docs.map(d=>({id:d.id,...d.data()}));schedulePatch(0);},()=>{});
  unsubHunts=onSnapshot(collection(db,'hunts'),s=>{hunts=s.docs.map(d=>({id:d.id,...d.data()}));schedulePatch(0);},()=>{});
  loadWorld();
}
if(auth){onAuthStateChanged(auth,bindUser);if(auth.currentUser)bindUser(auth.currentUser);}
window.addEventListener('storage',e=>{if(e.key==='snazzleARCollection')schedulePatch(0);});
document.addEventListener('click',e=>{if(e.target?.closest?.('#snArCatchDuck,#snArCatchHint'))schedulePatch(450);},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObservers,{once:true});else startObservers();

window.SnazzleArCardUnlockV127={refresh:patchUi,reloadWorld:loadWorld};
