// Snazzle v144 — Bieb instellingen + compact hoofdbeheer.
// Publieke instellingen worden uit één klein Firestore-document gelezen.
// Alleen superadmin + geldige admin-MFA kan opslaan; regels blijven server-side leidend.

import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged, getIdTokenResult } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='144.1.0';
const app=getApp();
const auth=getAuth(app);
const db=getFirestore(app);
const CONFIG_REF=doc(db,'snazzleBiebConfig','main');
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const DEFAULTS={
  enabled:true,
  introTitle:'Jouw verhalen. Jouw kast.',
  introText:'Maak een foto van de kaft als je een boek uit hebt. Om de twee boeken verdien je een Leesveer en groeit jouw eigen leeshoek.',
  showListen:true,
  showLocations:true,
  showExtras:true
};

let settings={...DEFAULTS};
let currentUser=null;
let isSuperAdmin=false;
let hasAdminMfa=false;
let stopConfig=null;
let saving=false;

function cleanText(value,max,fallback){
  const text=String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
  return text||fallback;
}
function normalize(raw={}){
  return {
    enabled:raw.enabled!==false,
    introTitle:cleanText(raw.introTitle,70,DEFAULTS.introTitle),
    introText:cleanText(raw.introText,240,DEFAULTS.introText),
    showListen:raw.showListen!==false,
    showLocations:raw.showLocations!==false,
    showExtras:raw.showExtras!==false
  };
}
function toast(message){
  const el=$('#toast');
  if(!el){console.info(message);return;}
  el.textContent=message;el.classList.add('show');
  clearTimeout(window.__snBiebSettingsToast144);
  window.__snBiebSettingsToast144=setTimeout(()=>el.classList.remove('show'),3200);
}

function installStyles(){
  if($('#snBiebSettingsStyles144')) return;
  const style=document.createElement('style');
  style.id='snBiebSettingsStyles144';
  style.textContent=`
    .sn-bieb-disabled144 #snBiebHome73,.sn-bieb-disabled144 #snBiebMenu73{display:none!important}
    .sn-bieb-settings-hide144{display:none!important}
    .sn-bieb-admin144{padding:13px;border-radius:18px;background:#edf3df;border:2px solid #9bad7d;color:#344127}
    .sn-bieb-admin144 h3{margin:0 0 5px;font-size:18px}.sn-bieb-admin144>p{margin:0 0 12px;font-size:10px;line-height:1.45;font-weight:760;color:#596449}
    .sn-bieb-admin-grid144{display:grid;gap:9px}.sn-bieb-admin-field144{padding:10px;border-radius:13px;background:#fffaf0;border:1px solid #bca878}
    .sn-bieb-admin-field144 label{display:block;font-size:10px;font-weight:950;margin-bottom:5px}.sn-bieb-admin-field144 input[type="text"],.sn-bieb-admin-field144 textarea{width:100%;box-sizing:border-box;border:1px solid #bca878;border-radius:10px;background:white;padding:9px;font-size:14px;color:#30271d}.sn-bieb-admin-field144 textarea{min-height:78px;resize:vertical}
    .sn-bieb-switch144{display:flex;align-items:flex-start;gap:9px;font-size:11px;font-weight:900;line-height:1.3}.sn-bieb-switch144 input{margin-top:2px;transform:scale(1.15)}.sn-bieb-switch144 small{display:block;color:#6a725e;font-size:9px;font-weight:720;margin-top:2px}
    .sn-bieb-admin-actions144{display:grid;grid-template-columns:1.2fr 1fr;gap:8px;margin-top:11px}.sn-bieb-admin-actions144 button{min-height:44px;border:0;border-radius:12px;font-weight:950}.sn-bieb-admin-save144{background:#4f8a4e;color:white;box-shadow:0 3px 0 #326431}.sn-bieb-admin-preview144{background:#d9c18d;color:#3b2d20}
    .sn-bieb-admin-secondary144{width:100%;min-height:42px;margin-top:8px;border:1px solid #8c7351;border-radius:11px;background:#fff5d9;color:#4b3b27;font-weight:950}
    .sn-bieb-admin-state144{margin-top:9px;padding:8px 9px;border-radius:10px;background:#dfead1;color:#3d5534;font-size:9px;font-weight:850;line-height:1.4}.sn-bieb-admin-state144.warn{background:#ffe4b8;color:#744714}
    @media(max-width:380px){.sn-bieb-admin-actions144{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function applySettings(){
  document.body.classList.toggle('sn-bieb-disabled144',settings.enabled===false);
  const overlay=$('#snBiebOverlay73');
  if(overlay){
    const title=$('.sn-bieb-hero h1',overlay);if(title)title.textContent=settings.introTitle;
    const intro=$('.sn-bieb-hero p',overlay);if(intro)intro.textContent=settings.introText;
    const listen=$('[data-bieb-action="listen"]',overlay);if(listen)listen.classList.toggle('sn-bieb-settings-hide144',!settings.showListen);
    const near=$('[data-bieb-action="near"]',overlay);if(near)near.classList.toggle('sn-bieb-settings-hide144',!settings.showLocations);
    const more=$('#snBiebMore144',overlay);if(more)more.classList.toggle('sn-bieb-settings-hide144',!settings.showExtras);
    const locations=$('#snBiebLocations77',overlay);if(locations&&!settings.showLocations)locations.hidden=true;
    if(!settings.showExtras){
      $$('.sn-bieb-section',overlay).forEach(section=>{
        const t=section.querySelector('.sn-bieb-section-head h2')?.textContent?.toLowerCase()||'';
        if(t.includes('waarom lezen')||t.includes('leesmissies')) section.hidden=true;
      });
    }
  }
  document.dispatchEvent(new CustomEvent('snazzle:bieb-settings',{detail:{...settings}}));
  fillAdminForm();
}

function startConfigListener(user){
  try{stopConfig?.();}catch{}
  stopConfig=null;settings={...DEFAULTS};applySettings();
  if(!user) return;
  stopConfig=onSnapshot(CONFIG_REF,snap=>{
    settings=normalize(snap.exists()?snap.data():DEFAULTS);
    applySettings();
  },err=>console.warn('Snazzle Bieb instellingen laden',err));
}

async function resolveAdmin(user){
  isSuperAdmin=false;hasAdminMfa=false;
  if(!user||user.isAnonymous) return;
  try{
    const [adminSnap,token]=await Promise.all([getDoc(doc(db,'adminUsers',user.uid)),getIdTokenResult(user)]);
    isSuperAdmin=adminSnap.exists()&&adminSnap.data()?.active===true&&adminSnap.data()?.role==='superadmin';
    hasAdminMfa=token?.claims?.snazzle_admin_mfa===true;
  }catch(err){console.warn('Snazzle Bieb beheerrol',err);}
}

function fillAdminForm(){
  const root=$('#snBiebAdmin144');if(!root)return;
  const setCheck=(id,val)=>{const el=$(`#${id}`);if(el)el.checked=!!val;};
  const title=$('#snBiebAdminTitle144');if(title&&document.activeElement!==title)title.value=settings.introTitle;
  const intro=$('#snBiebAdminIntro144');if(intro&&document.activeElement!==intro)intro.value=settings.introText;
  setCheck('snBiebEnabled144',settings.enabled);setCheck('snBiebListen144',settings.showListen);setCheck('snBiebLocations144',settings.showLocations);setCheck('snBiebExtras144',settings.showExtras);
  const state=$('#snBiebAdminState144');if(state){state.classList.toggle('warn',!hasAdminMfa);state.textContent=hasAdminMfa?'✓ Beheer beveiligd met admin-MFA. Wijzigingen mogen worden opgeslagen.':'🔒 Open eerst het beveiligde hoofdbeheer/MFA om wijzigingen op te slaan.';}
}

function openListenAdmin(){
  const tab=$('#adminSheet [data-sn-listen-tab]');
  if(tab){tab.click();return;}
  toast('Luisterbeheer wordt nog geladen. Probeer over een paar seconden opnieuw.');
}
function previewBieb(){
  try{$('#adminClose')?.click();}catch{}
  setTimeout(()=>window.SnazzleBiebV73?.open?.(),80);
}

async function saveSettings(){
  if(saving||!currentUser||!isSuperAdmin) return;
  if(!hasAdminMfa) return toast('Bevestig eerst het beveiligde hoofdbeheer met MFA');
  const payload=normalize({
    enabled:$('#snBiebEnabled144')?.checked!==false,
    introTitle:$('#snBiebAdminTitle144')?.value,
    introText:$('#snBiebAdminIntro144')?.value,
    showListen:$('#snBiebListen144')?.checked!==false,
    showLocations:$('#snBiebLocations144')?.checked!==false,
    showExtras:$('#snBiebExtras144')?.checked!==false
  });
  const btn=$('#snBiebAdminSave144');saving=true;if(btn){btn.disabled=true;btn.textContent='Opslaan…';}
  try{
    await setDoc(CONFIG_REF,{...payload,updatedAt:new Date().toISOString(),updatedBy:currentUser.uid},{merge:true});
    settings=payload;applySettings();toast('Bieb-instellingen opgeslagen ✓');
  }catch(err){console.error('Snazzle Bieb instellingen opslaan',err);toast('Opslaan lukte niet — controleer het beveiligde beheer');}
  finally{saving=false;if(btn){btn.disabled=false;btn.textContent='Instellingen opslaan';}}
}

function selectAdminSection(tab,section){
  $$('#adminSheet [data-tab],#adminSheet [data-news-tab],#adminSheet [data-sn47-tab-admin],#adminSheet [data-sn-listen-tab],#adminSheet [data-sn-bieb-tab]').forEach(b=>b.classList.remove('on'));
  $$('#adminSheet .admin-section').forEach(s=>s.classList.remove('on'));
  tab.classList.add('on');section.classList.add('on');fillAdminForm();
}

function ensureAdminUI(){
  if(!isSuperAdmin||$('#snBiebAdmin144')) return;
  const superOnly=$('#adminSheet .super-only'),tabs=$('#adminSheet .super-only .tabs');
  if(!superOnly||!tabs) return;
  const tab=document.createElement('button');tab.type='button';tab.dataset.snBiebTab='snBiebAdmin144';tab.textContent='Bieb 📚';tabs.appendChild(tab);
  const section=document.createElement('section');section.className='admin-section sn-bieb-admin144';section.id='snBiebAdmin144';section.innerHTML=`
    <h3>📚 De Bieb beheren</h3><p>Houd De Bieb rustig: bepaal welke onderdelen kinderen zien en pas alleen de belangrijkste introductietekst aan.</p>
    <div class="sn-bieb-admin-grid144">
      <div class="sn-bieb-admin-field144"><label class="sn-bieb-switch144"><input id="snBiebEnabled144" type="checkbox"><span>De Bieb zichtbaar<small>Zet alleen uit als De Bieb tijdelijk helemaal niet gebruikt moet worden.</small></span></label></div>
      <div class="sn-bieb-admin-field144"><label>Titel bovenaan</label><input id="snBiebAdminTitle144" type="text" maxlength="70"></div>
      <div class="sn-bieb-admin-field144"><label>Korte uitleg</label><textarea id="snBiebAdminIntro144" maxlength="240"></textarea></div>
      <div class="sn-bieb-admin-field144"><label class="sn-bieb-switch144"><input id="snBiebListen144" type="checkbox"><span>🎧 Luisterverhalen tonen<small>De verhalen zelf beheer je met de knop hieronder.</small></span></label></div>
      <div class="sn-bieb-admin-field144"><label class="sn-bieb-switch144"><input id="snBiebLocations144" type="checkbox"><span>📍 Bieb dichtbij tonen<small>Laat adressen en routes naar bibliotheken zien.</small></span></label></div>
      <div class="sn-bieb-admin-field144"><label class="sn-bieb-switch144"><input id="snBiebExtras144" type="checkbox"><span>🧭 Leesplezier & missies tonen<small>Waarom lezen en de kleine leesmissies blijven onder één knop.</small></span></label></div>
    </div>
    <div class="sn-bieb-admin-actions144"><button class="sn-bieb-admin-save144" id="snBiebAdminSave144" type="button">Instellingen opslaan</button><button class="sn-bieb-admin-preview144" id="snBiebAdminPreview144" type="button">Bieb bekijken</button></div>
    <button class="sn-bieb-admin-secondary144" id="snBiebAdminListen144" type="button">🎧 Luisterverhalen toevoegen / bewerken</button>
    <div class="sn-bieb-admin-state144" id="snBiebAdminState144"></div>`;
  superOnly.appendChild(section);
  tab.addEventListener('click',()=>selectAdminSection(tab,section));
  $('#snBiebAdminSave144',section)?.addEventListener('click',saveSettings);
  $('#snBiebAdminPreview144',section)?.addEventListener('click',previewBieb);
  $('#snBiebAdminListen144',section)?.addEventListener('click',openListenAdmin);
  fillAdminForm();
}

function observeMounts(){
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;applySettings();ensureAdminUI();});
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),18000);
}

installStyles();
observeMounts();
onAuthStateChanged(auth,async user=>{
  currentUser=user||null;
  startConfigListener(currentUser);
  await resolveAdmin(currentUser);
  ensureAdminUI();fillAdminForm();
});

window.SnazzleBiebSettingsV144={get:()=>({...settings}),apply:applySettings};
console.info(`Snazzle Bieb settings ${VERSION} geladen`);