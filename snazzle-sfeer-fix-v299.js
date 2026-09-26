// Snazzle v299 — repareert het lege Beheer > Sfeer-scherm.
// Laadt de bestaande seizoensmodule pas wanneer nodig en houdt afbeeldingen
// uitsluitend onder Beheer > Afbeeldingen.

const FIX_VERSION='299.0.0';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let loadPromise=null;
let mountObserver=null;

function q(s,r=document){return r.querySelector(s);}

function installStyle(){
  if(q('#snazzleSfeerFixV299Style'))return;
  const s=document.createElement('style');
  s.id='snazzleSfeerFixV299Style';
  s.textContent=`
    #sn272SfeerMount .v38-season-grid{display:none!important}
    #sn272SfeerMount .v38-season-admin{margin-top:8px!important}
    #sn272SfeerMount .v38-season-admin>h4{font-size:17px!important}
    #sn272SfeerMount .v38-season-admin>p{font-size:11px!important}
    #sn272SfeerMount .sn299-sfeer-loading,
    #sn272SfeerMount .sn299-sfeer-error{
      margin:10px 0;padding:13px 14px;border:2px solid #bda76f;border-radius:14px;
      background:#fffaf0;color:#4b3b28;font-size:12px;font-weight:850;line-height:1.45
    }
    #sn272SfeerMount .sn299-sfeer-error{border-color:#c88974;background:#fff0e9;color:#7a3427}
  `;
  document.head.appendChild(s);
}

function cleanSfeer(){
  const mount=q('#sn272SfeerMount');
  if(!mount)return false;
  const admin=q('#v38SeasonAdmin');
  if(admin&&admin.parentElement!==mount)mount.appendChild(admin);
  const owned=q('#v38SeasonAdmin',mount);
  owned?.querySelector('.v38-season-grid')?.remove();
  mount.querySelectorAll('.sn299-sfeer-loading').forEach(el=>el.remove());
  return !!owned;
}

function watchMount(){
  const mount=q('#sn272SfeerMount');
  if(!mount||mountObserver)return;
  mountObserver=new MutationObserver(()=>cleanSfeer());
  mountObserver.observe(mount,{childList:true,subtree:true});
}

async function loadSeason(){
  if(window.__snazzleSeasonV38)return true;
  if(!loadPromise){
    loadPromise=import('./snazzle-season-theme-v38.js?v=299')
      .then(()=>true)
      .catch(err=>{loadPromise=null;throw err;});
  }
  return loadPromise;
}

async function ensureSfeer(){
  installStyle();
  const mount=q('#sn272SfeerMount');
  if(!mount)return;
  watchMount();
  if(!q('#v38SeasonAdmin',mount)){
    mount.innerHTML='<div class="sn299-sfeer-loading">Sfeerinstellingen laden…</div>';
  }
  try{
    await loadSeason();
    document.dispatchEvent(new CustomEvent('snazzle:sfeer-admin-open'));
    for(let i=0;i<16&&!cleanSfeer();i++)await sleep(100);
    if(!cleanSfeer()){
      mount.innerHTML='<div class="sn299-sfeer-error">De sfeerinstellingen konden niet worden opgebouwd. Sluit Beheer en open Sfeer opnieuw.</div>';
    }
  }catch(err){
    console.error('Snazzle Sfeer fix v299',err);
    mount.innerHTML='<div class="sn299-sfeer-error">Sfeerinstellingen konden niet laden. Probeer Beheer opnieuw te openen.</div>';
  }
}

function install(){
  installStyle();
  document.addEventListener('click',event=>{
    const tab=event.target?.closest?.('#sn272SfeerTab');
    if(tab)setTimeout(ensureSfeer,0);
  },true);
  document.addEventListener('snazzle:sfeer-admin-open',()=>setTimeout(()=>{cleanSfeer();watchMount();},0));
  document.addEventListener('snazzle:admin-ui-ready',()=>{
    setTimeout(()=>{
      if(q('#sn272SfeerTab.on')||q('#sn272SfeerSection.on'))ensureSfeer();
    },80);
  });
  new MutationObserver(()=>{
    if(q('#sn272SfeerMount')){watchMount();if(q('#sn272SfeerTab.on')||q('#sn272SfeerSection.on'))ensureSfeer();}
  }).observe(document.documentElement,{childList:true,subtree:true});
  if(q('#sn272SfeerTab.on')||q('#sn272SfeerSection.on'))ensureSfeer();
  console.info('Snazzle Sfeer fix '+FIX_VERSION+' geladen');
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();

window.SnazzleSfeerFixV299={ensure:ensureSfeer,version:FIX_VERSION};
