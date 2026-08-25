// Snazzle v65 — duidelijk oudergedeelte met centraal bewerkbare teksten.
// Het oudergedeelte gebruikt een verborgen systeemdocument in de bestaande villages-collectie,
// zodat geen nieuwe Firebase-regels of extra technische configuratie nodig zijn.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
const DOC_ID='__snazzle_parent_hub_v65';
const ref=doc(db,'villages',DOC_ID);
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const defaults={
  title:'Voor ouders',
  intro:'Snazzle Hunt is gemaakt om kinderen samen met hun gezin op een leuke manier naar buiten te krijgen. De speurtochten zijn bedoeld als gezamenlijk avontuur, niet als wedstrijd om zo snel mogelijk ergens te komen.',
  safetyTitle:'Samen veilig op pad',
  safetyText:'Blijf bij jonge kinderen in de buurt. Let goed op verkeer en de omgeving. Betreed geen privéterrein en volg altijd aanwijzingen en lokale regels. Een Snazzle ligt nooit op een plek waarvoor gevaarlijk gedrag nodig is.',
  privacyTitle:'Privacy van kinderen',
  privacyText:'Gebruik voor kinderen bij voorkeur alleen een voornaam of nickname. De app is erop ingericht om zo weinig mogelijk persoonlijke gegevens zichtbaar te maken en toont geen woonadres of exacte live locatie aan andere spelers.',
  tipsTitle:'Tips voor ouders',
  tipsText:'Maak van de Hunt een gezamenlijk uitje.\nNeem bij langere Hunts wat drinken mee.\nLaat kinderen zoeken, maar houd zelf zicht op verkeer en water.\nRespecteer natuur, bewoners en eigendommen.',
  contactTitle:'Vragen over Snazzle?',
  contactText:'Neem bij vragen over een Hunt of activiteit contact op met Snazzle Creations via de gebruikelijke Snazzle-kanalen.'
};

let config={...defaults};
let currentUser=null;
let isSuperAdmin=false;
let unsubscribe=null;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(text){const t=$('#toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(window.__snParentToast);window.__snParentToast=setTimeout(()=>t.classList.remove('show'),3300);}
function merged(data){return {...defaults,...(data||{})};}
function tipsHtml(text){return String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join('');}

function styles(){
  if($('#snParentV65Styles'))return;
  const s=document.createElement('style');s.id='snParentV65Styles';s.textContent=`
  #snParentSheet{z-index:188!important}
  #snParentSheet .sn-parent-panel{padding:0 0 28px!important;background:linear-gradient(180deg,#fff1bd,#e8cd8b)!important;color:#302318!important;overflow-x:hidden}
  .sn-parent-top{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:46px 1fr 46px;align-items:center;gap:8px;padding:12px;background:linear-gradient(180deg,#164d3b,#0c382d);color:#fff7de;border-bottom:3px solid #b58b48}
  .sn-parent-top button{width:42px;height:42px;border:0;border-radius:13px;background:#735039;color:#fff;font-size:22px;font-weight:1000}.sn-parent-top h2{margin:0;text-align:center;font-size:19px}.sn-parent-top small{display:block;color:#f3d988;font-size:9px;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
  .sn-parent-hero{margin:14px;padding:16px;border-radius:21px;background:radial-gradient(circle at 88% 5%,rgba(255,232,119,.2),transparent 28%),linear-gradient(135deg,#467b53,#2b6a70 58%,#5b4e92);color:#fff;border:3px solid #c4a35d;box-shadow:0 5px 0 #72502f}.sn-parent-hero strong{display:block;font-size:21px}.sn-parent-hero p{margin:6px 0 0;font-size:12px;line-height:1.5;font-weight:750;color:#f5f4df}
  .sn-parent-cards{display:grid;gap:11px;padding:0 14px}.sn-parent-card{padding:14px;border-radius:18px;background:#fff8e5;border:2px solid #bda06c;box-shadow:0 4px 0 #9d7b4b;color:#38291e}.sn-parent-card h3{margin:0 0 6px;font-size:16px;color:#24553a}.sn-parent-card p{margin:0;font-size:11px;line-height:1.5;font-weight:740;color:#695039}.sn-parent-card ul{margin:6px 0 0;padding-left:20px;color:#695039}.sn-parent-card li{margin:5px 0;font-size:11px;line-height:1.4;font-weight:760}.sn-parent-icon{font-size:24px;display:inline-block;margin-right:5px}
  .sn-parent-entry{width:100%;margin-top:12px;border:2px solid #a78957;border-radius:14px;padding:12px;background:linear-gradient(#edf6c8,#cfe69a);color:#385027;font-weight:950;box-shadow:0 4px 0 #8ea25c;text-align:left}.sn-parent-entry small{display:block;margin-top:3px;font-size:10px;color:#5f7047}
  .sn-parent-admin-note{padding:11px;border-radius:14px;background:#e9f3d8;border:2px solid #a6b77a;color:#40512f;font-size:11px;font-weight:800;line-height:1.45;margin-bottom:10px}
  .sn-parent-status{margin:9px 0;padding:9px 10px;border-radius:12px;background:#f0e0ad;color:#604b2e;font-size:10px;font-weight:850}
  `;document.head.appendChild(s);
}

function ensureSheet(){
  styles();
  if($('#snParentSheet'))return;
  const sheet=document.createElement('div');sheet.className='sheet';sheet.id='snParentSheet';sheet.setAttribute('aria-hidden','true');
  sheet.innerHTML=`<div class="panel sn-parent-panel"><div class="sn-parent-top"><button type="button" id="snParentClose" aria-label="Oudergedeelte sluiten">×</button><h2><span id="snParentTitle">Voor ouders</span><small>veilig samen naar buiten</small></h2><div></div></div><section class="sn-parent-hero"><strong>👨‍👩‍👧 <span id="snParentHeroTitle">Voor ouders</span></strong><p id="snParentIntro"></p></section><div class="sn-parent-cards"><section class="sn-parent-card"><h3><span class="sn-parent-icon">🛡️</span><span id="snParentSafetyTitle"></span></h3><p id="snParentSafetyText"></p></section><section class="sn-parent-card"><h3><span class="sn-parent-icon">🔐</span><span id="snParentPrivacyTitle"></span></h3><p id="snParentPrivacyText"></p></section><section class="sn-parent-card"><h3><span class="sn-parent-icon">🌿</span><span id="snParentTipsTitle"></span></h3><ul id="snParentTips"></ul></section><section class="sn-parent-card"><h3><span class="sn-parent-icon">💬</span><span id="snParentContactTitle"></span></h3><p id="snParentContactText"></p></section></div></div>`;
  document.body.appendChild(sheet);
  $('#snParentClose').onclick=closeSheet;
  sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet();});
  render();
}
function openSheet(){ensureSheet();render();const s=$('#snParentSheet');s.classList.add('show');s.setAttribute('aria-hidden','false');s.querySelector('.panel').scrollTop=0;}
function closeSheet(){const s=$('#snParentSheet');s?.classList.remove('show');s?.setAttribute('aria-hidden','true');}

function render(){
  if(!$('#snParentSheet'))return;
  $('#snParentTitle').textContent=config.title;
  $('#snParentHeroTitle').textContent=config.title;
  $('#snParentIntro').textContent=config.intro;
  $('#snParentSafetyTitle').textContent=config.safetyTitle;
  $('#snParentSafetyText').textContent=config.safetyText;
  $('#snParentPrivacyTitle').textContent=config.privacyTitle;
  $('#snParentPrivacyText').textContent=config.privacyText;
  $('#snParentTipsTitle').textContent=config.tipsTitle;
  $('#snParentTips').innerHTML=tipsHtml(config.tipsText);
  $('#snParentContactTitle').textContent=config.contactTitle;
  $('#snParentContactText').textContent=config.contactText;
}

function installEntries(){
  ensureSheet();
  const profile=$('#profileSheet .panel');
  if(profile&&!$('#snParentProfileBtn')){
    const b=document.createElement('button');b.type='button';b.id='snParentProfileBtn';b.className='sn-parent-entry';b.innerHTML='👨‍👩‍👧 Voor ouders <small>Veiligheid, privacy en tips voor samen zoeken</small>';b.onclick=()=>{try{$('#profileSheet').classList.remove('show');}catch{}setTimeout(openSheet,60);};
    const save=$('#saveName',profile);if(save?.nextSibling)profile.insertBefore(b,save.nextSibling);else profile.appendChild(b);
  }
  const menu=$('#quickMenuPanel .quick-menu-list');
  if(menu&&!$('#snParentMenuV65')){
    const b=document.createElement('button');b.type='button';b.id='snParentMenuV65';b.innerHTML='<b>👨‍👩‍👧</b><span><strong>Voor ouders</strong><small>Veiligheid, privacy en tips</small></span><i>›</i>';b.onclick=e=>{e.preventDefault();e.stopPropagation();try{$('#quickMenuClose')?.click();}catch{}setTimeout(openSheet,70);};menu.appendChild(b);
  }
}

async function verifySuperAdmin(user){
  if(!user||user.isAnonymous)return false;
  try{const snap=await getDoc(doc(db,'adminUsers',user.uid));const data=snap.data()||{};return snap.exists()&&data.active===true&&data.role==='superadmin';}catch{return false;}
}

function fillAdmin(){
  if(!$('#snParentAdminV65'))return;
  const map={Title:'title',Intro:'intro',SafetyTitle:'safetyTitle',SafetyText:'safetyText',PrivacyTitle:'privacyTitle',PrivacyText:'privacyText',TipsTitle:'tipsTitle',TipsText:'tipsText',ContactTitle:'contactTitle',ContactText:'contactText'};
  Object.entries(map).forEach(([id,key])=>{const el=$('#snParent'+id);if(el)el.value=config[key]||'';});
}
function selectAdmin(tab,section){
  $$('#adminSheet .super-only .tabs [data-tab],#adminSheet .super-only .tabs [data-news-tab],#adminSheet .super-only .tabs [data-sn47-tab-admin],#adminSheet .super-only .tabs [data-sn-listen-tab],#adminSheet .super-only .tabs [data-sn-parent-tab]').forEach(b=>b.classList.remove('on'));
  $$('#adminSheet .super-only .admin-section').forEach(s=>s.classList.remove('on'));
  tab.classList.add('on');section.classList.add('on');fillAdmin();
}
function ensureAdmin(){
  if(!isSuperAdmin)return;
  const wrap=$('#adminSheet .super-only'),tabs=$('#adminSheet .super-only .tabs');if(!wrap||!tabs)return;
  if(!$('#snParentAdminV65')){
    const tab=document.createElement('button');tab.type='button';tab.dataset.snParentTab='snParentAdminV65';tab.textContent='Ouders';tabs.appendChild(tab);
    const sec=document.createElement('section');sec.id='snParentAdminV65';sec.className='admin-section';sec.innerHTML=`<h3>👨‍👩‍👧 Oudergedeelte</h3><div class="sn-parent-admin-note">Deze teksten verschijnen voor gewone gebruikers onder <b>Voor ouders</b>. Je kunt ze hier later zelf veranderen zonder GitHub.</div><div class="field"><label>Titel</label><input id="snParentTitleAdmin"></div><div class="field"><label>Intro</label><textarea id="snParentIntroAdmin"></textarea></div><div class="field"><label>Veiligheid — titel</label><input id="snParentSafetyTitleAdmin"></div><div class="field"><label>Veiligheid — tekst</label><textarea id="snParentSafetyTextAdmin"></textarea></div><div class="field"><label>Privacy — titel</label><input id="snParentPrivacyTitleAdmin"></div><div class="field"><label>Privacy — tekst</label><textarea id="snParentPrivacyTextAdmin"></textarea></div><div class="field"><label>Tips — titel</label><input id="snParentTipsTitleAdmin"></div><div class="field"><label>Tips — één tip per regel</label><textarea id="snParentTipsTextAdmin"></textarea></div><div class="field"><label>Contact — titel</label><input id="snParentContactTitleAdmin"></div><div class="field"><label>Contact — tekst</label><textarea id="snParentContactTextAdmin"></textarea></div><button type="button" class="save" id="snParentSaveAdmin">Ouderteksten opslaan</button><div class="sn-parent-status" id="snParentAdminStatus">Centraal bewerkbaar voor alle gebruikers.</div>`;
    wrap.appendChild(sec);tab.onclick=()=>selectAdmin(tab,sec);$('#snParentSaveAdmin').onclick=saveAdmin;
  }
  fillAdmin();
}
async function saveAdmin(){
  if(!isSuperAdmin||!currentUser)return;
  const read=id=>String($('#'+id)?.value||'').trim();
  const next={title:read('snParentTitleAdmin')||defaults.title,intro:read('snParentIntroAdmin')||defaults.intro,safetyTitle:read('snParentSafetyTitleAdmin')||defaults.safetyTitle,safetyText:read('snParentSafetyTextAdmin')||defaults.safetyText,privacyTitle:read('snParentPrivacyTitleAdmin')||defaults.privacyTitle,privacyText:read('snParentPrivacyTextAdmin')||defaults.privacyText,tipsTitle:read('snParentTipsTitleAdmin')||defaults.tipsTitle,tipsText:read('snParentTipsTextAdmin')||defaults.tipsText,contactTitle:read('snParentContactTitleAdmin')||defaults.contactTitle,contactText:read('snParentContactTextAdmin')||defaults.contactText};
  const status=$('#snParentAdminStatus');if(status)status.textContent='Opslaan…';
  try{
    await setDoc(ref,{...next,name:'__Snazzle Parent Hub',active:false,type:'snazzleParentHubV65',updatedAt:new Date().toISOString(),updatedBy:currentUser.uid},{merge:true});
    config=merged(next);render();if(status)status.textContent='Ouderteksten staan centraal online ✅';toast('Oudergedeelte opgeslagen ✅');
  }catch(err){console.error('Snazzle oudergedeelte opslaan',err);if(status)status.textContent='Opslaan is nog niet gelukt.';toast('Ouderteksten opslaan mislukt');}
}

function startListener(){
  if(unsubscribe)unsubscribe();
  unsubscribe=onSnapshot(ref,snap=>{config=merged(snap.exists()?snap.data():{});render();fillAdmin();},err=>{console.warn('Snazzle oudergedeelte laden',err);config={...defaults};render();});
}

const observer=new MutationObserver(()=>{installEntries();ensureAdmin();});observer.observe(document.body,{childList:true,subtree:true});
installEntries();

onAuthStateChanged(auth,async user=>{
  if(!user)return;
  currentUser=user;isSuperAdmin=await verifySuperAdmin(user);startListener();installEntries();ensureAdmin();
});

window.SnazzleParentHubV65={open:openSheet,render};
