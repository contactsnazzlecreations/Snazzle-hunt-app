// Snazzle Core Performance v248.1 — voorkomt dubbele sessie-listeners en onnodige UI-activiteit.
import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,signOut } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const VERSION='248.1';
const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
let logoutBusy=false;

function showToast(message){
  const toast=document.getElementById('toast');
  if(!toast)return;
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(window.__snPerfToast);
  window.__snPerfToast=setTimeout(()=>toast.classList.remove('show'),2600);
}

// app-core zet zelf na signOut de anonieme sessie terug aan. We resetten hier bewust
// niet zijn listener-vlag en starten ook geen tweede anonieme login: zo blijft er één
// Firestore-luisterlaag actief, ook na meerdere beheer-login/logout-cycli.
function installSafeAdminLogout(){
  const button=document.getElementById('adminLogoutBtn');
  if(!button||button.dataset.snPerf248==='1'||!auth)return false;
  button.dataset.snPerf248='1';
  button.onclick=async event=>{
    event?.preventDefault?.();
    if(logoutBusy)return;
    logoutBusy=true;
    button.disabled=true;
    try{
      await signOut(auth);
      document.getElementById('adminSheet')?.classList.remove('show');
      showToast('Beheer uitgelogd');
    }catch(err){
      console.error('Snazzle veilig uitloggen',err);
      showToast('Uitloggen mislukt');
    }finally{
      button.disabled=false;
      logoutBusy=false;
    }
  };
  return true;
}

function releaseStaleScrollLock(){
  if(document.visibilityState!=='visible')return;
  const activeOverlay=document.querySelector('.sheet.show,.quick-menu-overlay.show,.event-poster-overlay.show,#snArIntro.show,#snArOverlay.show,#snArResult.show');
  if(activeOverlay)return;
  document.documentElement.style.overflow='';
  document.body.style.overflow='';
}

function installInteractionGuards(){
  document.documentElement.style.setProperty('touch-action','manipulation');
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')requestAnimationFrame(releaseStaleScrollLock);
  },{passive:true});
  window.addEventListener('pageshow',()=>requestAnimationFrame(releaseStaleScrollLock),{passive:true});
}

installInteractionGuards();
if(!installSafeAdminLogout()){
  const observer=new MutationObserver(()=>{if(installSafeAdminLogout())observer.disconnect();});
  observer.observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(()=>observer.disconnect(),10000);
}

window.SnazzleCorePerformanceV248={version:VERSION,repair(){installSafeAdminLogout();releaseStaleScrollLock();}};
console.info(`Snazzle core performance v${VERSION} geladen`);
