// Snazzle Card Worlds v78 — profielkeuze WILD / SPARK / MIX en wereldgerichte kaartbeloningen.
import { getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='78.0.0';
const LOCAL_KEY='snazzleCardWorldPreference';
const CARD_LOCAL_KEY='snazzleCardCatalogV2';
const VALID=['wild','spark','mix'];
const WORLD_LABELS={all:'🌍 Universeel',wild:'🟢 WILD',spark:'✨ SPARK'};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;

let user=null;
let cards=[];
let hunts=[];
let pendingWorldByNumber=new Map();
let applying=false;

function storedPreference(){
  const v=localStorage.getItem(LOCAL_KEY);
  return VALID.includes(v)?v:null;
}
function preference(){ return storedPreference()||'mix'; }
function normalizeWorld(v){ return ['wild','spark'].includes(v)?v:'all'; }
function toast(message){
  const t=$('#toast');
  if(!t) return;
  t.textContent=message;
  t.classList.add('show');
  clearTimeout(window.__snCardWorldToast);
  window.__snCardWorldToast=setTimeout(()=>t.classList.remove('show'),2800);
}
function hash(text){
  let h=2166136261;
  for(let i=0;i<text.length;i++){
    h^=text.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}
function rewardKey(c){
  const type=c.unlockType||'hunt';
  if((type==='hunt'||type==='event')&&c.huntId) return `${type}:hunt:${c.huntId}`;
  if(type==='milestone'&&Number(c.threshold)>0) return `${type}:threshold:${Number(c.threshold)}`;
  if(type==='special'){
    if(c.huntId) return `special:hunt:${c.huntId}`;
    if(Number(c.threshold)>0) return `special:threshold:${Number(c.threshold)}`;
  }
  return '';
}
function mixedWorldForGroup(key){
  if(!key) return null;
  const group=cards.filter(c=>c.active!==false&&rewardKey(c)===key);
  const hasWild=group.some(c=>normalizeWorld(c.world)==='wild');
  const hasSpark=group.some(c=>normalizeWorld(c.world)==='spark');
  if(!hasWild||!hasSpark) return null;
  return hash(`${user?.uid||'snazzle'}|${key}`)%2===0?'wild':'spark';
}
function cardVisible(c){
  if(c.active===false) return false;
  const world=normalizeWorld(c.world);
  if(world==='all') return true;
  const pref=preference();
  if(pref==='wild'||pref==='spark') return world===pref;
  const chosen=mixedWorldForGroup(rewardKey(c));
  return chosen?world===chosen:true;
}
function won(){ return user?hunts.filter(h=>h.found===true&&h.foundByUserId===user.uid):[]; }
function unlocked(c){
  if(!user) return false;
  const w=won();
  const ids=new Set(w.map(h=>h.id));
  const type=c.unlockType||'hunt';
  if(type==='hunt'||type==='event') return !!c.huntId&&ids.has(c.huntId);
  if(type==='milestone') return w.length>=(Number(c.threshold)||1);
  if(type==='special') return (!!c.huntId&&ids.has(c.huntId))||(Number(c.threshold)>0&&w.length>=Number(c.threshold));
  return false;
}
function cardByNumber(number){
  const n=String(number||'').trim().toUpperCase();
  return cards.find(c=>String(c.number||'').trim().toUpperCase()===n)||null;
}

async function setPreference(value,{sync=true,announce=true}={}){
  if(!VALID.includes(value)) return;
  localStorage.setItem(LOCAL_KEY,value);
  paintChoices();
  applyCardWorlds();
  window.dispatchEvent(new CustomEvent('snazzle-card-world-change',{detail:{preference:value}}));
  if(sync&&db&&user){
    try{
      await setDoc(doc(db,'users',user.uid),{
        cardWorldPreference:value,
        updatedAt:new Date().toISOString()
      },{merge:true});
    }catch(e){ console.warn('Card world profile sync',e); }
  }
  if(announce) toast(value==='wild'?'🟢 WILD gekozen':value==='spark'?'✨ SPARK gekozen':'🌀 MIX gekozen');
}

function choiceMarkup(context){
  return `<div class="sn-card-world-choice" data-sn-world-context="${context}">
    <div class="sn-card-world-title">Welke Snazzle-wereld kies jij?</div>
    <div class="sn-card-world-sub">Je kiest een kaartstijl, niet of je een jongen of meisje bent. Je kunt dit later altijd aanpassen.</div>
    <div class="sn-card-world-buttons" role="group" aria-label="Kies je Snazzle-kaartwereld">
      <button type="button" data-sn-world="wild"><b>🟢</b><strong>WILD</strong><small>Avontuur & actie</small></button>
      <button type="button" data-sn-world="spark"><b>✨</b><strong>SPARK</strong><small>Glans & fantasie</small></button>
      <button type="button" data-sn-world="mix"><b>🌀</b><strong>MIX</strong><small>Van beide werelden</small></button>
    </div>
  </div>`;
}
function installStyles(){
  if($('#snCardWorldStyles')) return;
  const s=document.createElement('style');
  s.id='snCardWorldStyles';
  s.textContent=`
    .sn-card-world-choice{margin:14px 0 16px;padding:14px;border-radius:19px;background:linear-gradient(145deg,#fff7df,#f4dfaa);border:2px solid #b79154;color:#382719;box-shadow:0 4px 0 rgba(103,70,37,.22)}
    .onboard .sn-card-world-choice{background:linear-gradient(145deg,rgba(255,248,218,.98),rgba(238,219,158,.98));text-align:left}
    .sn-card-world-title{font-size:16px;font-weight:1000;line-height:1.2}.sn-card-world-sub{font-size:10px;font-weight:760;line-height:1.4;color:#705538;margin-top:5px}
    .sn-card-world-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}.sn-card-world-buttons button{min-width:0;border:2px solid #b59361;border-radius:15px;padding:10px 5px;background:#fffaf0;color:#3b2a1c;box-shadow:0 3px 0 #a28254;text-align:center}.sn-card-world-buttons button b{display:block;font-size:22px}.sn-card-world-buttons button strong{display:block;font-size:12px;margin-top:3px}.sn-card-world-buttons button small{display:block;font-size:8px;line-height:1.2;margin-top:3px;color:#745b3e;font-weight:800}.sn-card-world-buttons button.on{border-color:#3f8247;background:linear-gradient(#efffc7,#c9ee83);box-shadow:0 3px 0 #5c853e,0 0 0 3px rgba(104,170,73,.14);transform:translateY(-1px)}
    .sn-card-world-current{margin:7px 0 0;font-size:10px;font-weight:900;color:#526d2f}
    .sn-card-world-badge{display:inline-block;margin-left:6px;padding:3px 6px;border-radius:99px;background:#e9ddbb;color:#5d4328;font-size:8px;font-weight:1000;vertical-align:middle}
    .sn-world-hidden{display:none!important}
    @media(max-width:390px){.sn-card-world-buttons{gap:5px}.sn-card-world-buttons button{padding:9px 3px}.sn-card-world-buttons button strong{font-size:11px}.sn-card-world-buttons button small{font-size:7px}}
  `;
  document.head.appendChild(s);
}
function bindChoice(root){
  if(!root||root.dataset.snWorldBound==='1') return;
  root.dataset.snWorldBound='1';
  $$('[data-sn-world]',root).forEach(btn=>btn.addEventListener('click',()=>setPreference(btn.dataset.snWorld)));
}
function injectChoices(){
  const onboarding=$('#onboarding .onboard');
  if(onboarding&&!$('[data-sn-world-context="onboarding"]',onboarding)){
    const input=$('#firstNameInput',onboarding);
    const finish=$('#finishOnboarding',onboarding);
    const box=document.createElement('div');
    box.innerHTML=choiceMarkup('onboarding');
    const el=box.firstElementChild;
    if(finish) onboarding.insertBefore(el,finish); else input?.after(el);
    bindChoice(el);
  }
  const profile=$('#profileSheet .panel');
  if(profile&&!$('[data-sn-world-context="profile"]',profile)){
    const save=$('#saveName',profile);
    const box=document.createElement('div');
    box.innerHTML=choiceMarkup('profile');
    const el=box.firstElementChild;
    if(save) profile.insertBefore(el,save); else profile.appendChild(el);
    bindChoice(el);
    if(save) save.textContent='Profiel opslaan';
  }
  paintChoices();
}
function paintChoices(){
  const p=preference();
  $$('.sn-card-world-choice').forEach(root=>{
    $$('[data-sn-world]',root).forEach(btn=>btn.classList.toggle('on',btn.dataset.snWorld===p));
  });
}
function guardOnboarding(){
  const btn=$('#finishOnboarding');
  if(!btn||btn.dataset.snWorldGuard==='1') return;
  btn.dataset.snWorldGuard='1';
  btn.addEventListener('click',e=>{
    if(!storedPreference()){
      e.preventDefault();
      e.stopImmediatePropagation();
      toast('Kies eerst WILD, SPARK of MIX ✨');
      $('.sn-card-world-choice[data-sn-world-context="onboarding"]')?.scrollIntoView({behavior:'smooth',block:'center'});
    }
  },true);
}

function applyCardWorlds(){
  if(applying) return;
  applying=true;
  try{
    $$('.sc2-card').forEach(el=>{
      const number=$('.sc2-num',el)?.textContent||'';
      const card=cardByNumber(number);
      const visible=!card||cardVisible(card);
      el.classList.toggle('sn-world-hidden',!visible);
    });
    const normal=cards.filter(c=>c.active!==false&&c.unlockType!=='special'&&cardVisible(c));
    const unlockedNormal=normal.filter(unlocked).length;
    const count=$('#sc2SummaryCount');
    const text=$('#sc2SummaryText');
    if(count) count.textContent=`${unlockedNormal}/${normal.length}`;
    if(text) text.textContent=normal.length?`${Math.round(unlockedNormal/normal.length*100)||0}% van je collectie ontdekt`:'Nog geen kaarten in jouw wereld';
    const home=$('#collectionHomeStatus');
    const all=cards.filter(c=>c.active!==false&&cardVisible(c));
    const discovered=all.filter(unlocked).length;
    if(home) home.textContent=all.length?`${discovered} van ${all.length} Snazzles ontdekt`:'Ontdek je magische Snazzle Cards';
    annotateAdminRows();
  }finally{ applying=false; }
}

function injectAdminWorldField(){
  const editor=$('#sc2Editor');
  if(!editor||$('#snCardWorldAdmin',editor)) return;
  const series=$('#sc2Series',editor)?.closest('.field');
  const field=document.createElement('div');
  field.className='field';
  field.innerHTML='<label>Kaartwereld</label><select id="snCardWorldAdmin"><option value="all">🌍 Universeel — voor iedereen</option><option value="wild">🟢 WILD</option><option value="spark">✨ SPARK</option></select><small style="display:block;margin-top:5px;font-weight:750;color:#745b3e">Maak voor dezelfde Hunt een WILD- en SPARK-kaart. MIX krijgt automatisch één van beide.</small>';
  if(series) series.after(field); else editor.appendChild(field);
}
function setAdminWorldFromEditor(){
  injectAdminWorldField();
  const number=$('#sc2Number')?.value||'';
  const card=cardByNumber(number);
  const select=$('#snCardWorldAdmin');
  if(select) select.value=normalizeWorld(card?.world);
}
function patchLocalCardWorld(number,world){
  try{
    const list=JSON.parse(localStorage.getItem(CARD_LOCAL_KEY)||'[]');
    if(!Array.isArray(list)) return;
    let changed=false;
    const next=list.map(c=>{
      if(String(c.number||'').trim().toUpperCase()!==String(number||'').trim().toUpperCase()) return c;
      if(normalizeWorld(c.world)===world&&c.world===world) return c;
      changed=true;
      return {...c,world};
    });
    if(changed) localStorage.setItem(CARD_LOCAL_KEY,JSON.stringify(next));
  }catch(e){ console.warn('Local card world patch',e); }
}
async function flushPendingWorlds(){
  if(!db||!pendingWorldByNumber.size) return;
  for(const [number,world] of [...pendingWorldByNumber]){
    const card=cardByNumber(number);
    if(!card) continue;
    patchLocalCardWorld(number,world);
    if(normalizeWorld(card.world)===world&&card.world===world){
      pendingWorldByNumber.delete(number);
      continue;
    }
    try{
      await setDoc(doc(db,'snazzleCards',card.id),{world,updatedAt:new Date().toISOString()},{merge:true});
      pendingWorldByNumber.delete(number);
    }catch(e){ console.warn('Central card world patch',e); }
  }
}
function bindAdmin(){
  injectAdminWorldField();
  if(document.documentElement.dataset.snCardWorldAdminBound==='1') return;
  document.documentElement.dataset.snCardWorldAdminBound='1';
  document.addEventListener('click',e=>{
    const target=e.target.closest?.('button');
    if(!target) return;
    if(target.id==='sc2New') setTimeout(()=>{injectAdminWorldField();const s=$('#snCardWorldAdmin');if(s)s.value='all';},0);
    if(target.matches('[data-sc2edit]')) setTimeout(setAdminWorldFromEditor,0);
    if(target.id==='sc2Save'){
      const number=String($('#sc2Number')?.value||'').trim().toUpperCase();
      const world=normalizeWorld($('#snCardWorldAdmin')?.value);
      if(number){
        pendingWorldByNumber.set(number,world);
        setTimeout(()=>patchLocalCardWorld(number,world),0);
        setTimeout(()=>flushPendingWorlds(),350);
        setTimeout(()=>flushPendingWorlds(),1200);
      }
    }
  },true);
}
function annotateAdminRows(){
  $$('.sc2-row').forEach(row=>{
    const strong=$('strong',row);
    if(!strong) return;
    const number=strong.textContent.split('·')[0].trim();
    const card=cardByNumber(number);
    if(!card) return;
    let badge=$('.sn-card-world-badge',row);
    if(!badge){badge=document.createElement('span');badge.className='sn-card-world-badge';strong.appendChild(badge);}
    badge.textContent=WORLD_LABELS[normalizeWorld(card.world)]||WORLD_LABELS.all;
  });
}

function observeUI(){
  const observer=new MutationObserver(()=>{
    injectChoices();
    guardOnboarding();
    bindAdmin();
    applyCardWorlds();
  });
  observer.observe(document.body,{childList:true,subtree:true});
}
function subscribeData(){
  if(!db||!user) return;
  onSnapshot(collection(db,'snazzleCards'),snap=>{
    cards=snap.docs.map(d=>({id:d.id,...d.data()}));
    applyCardWorlds();
    flushPendingWorlds();
  },e=>console.warn('Card worlds cards read',e));
  onSnapshot(collection(db,'hunts'),snap=>{
    hunts=snap.docs.map(d=>({id:d.id,...d.data()}));
    applyCardWorlds();
  },e=>console.warn('Card worlds hunts read',e));
}
async function loadProfilePreference(u){
  if(!db||!u) return;
  try{
    const snap=await getDoc(doc(db,'users',u.uid));
    const remote=snap.exists()?snap.data().cardWorldPreference:null;
    const local=storedPreference();
    if(VALID.includes(remote)) await setPreference(remote,{sync:false,announce:false});
    else if(local) await setPreference(local,{sync:true,announce:false});
    else { paintChoices(); applyCardWorlds(); }
  }catch(e){ console.warn('Card world profile read',e); }
}
function init(){
  if(window.__snazzleCardWorldsV78) return;
  window.__snazzleCardWorldsV78=true;
  installStyles();
  injectChoices();
  guardOnboarding();
  bindAdmin();
  observeUI();
  if(auth) onAuthStateChanged(auth,async u=>{
    user=u||null;
    if(!u) return;
    await loadProfilePreference(u);
    subscribeData();
  });
  applyCardWorlds();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
console.info(`Snazzle Card Worlds ${VERSION} geladen`);
