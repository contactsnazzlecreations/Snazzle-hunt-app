// Snazzle v296 — eenmalige, MFA-bewuste beheerroute na de losse loginpagina.
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
const params=new URLSearchParams(location.search);
const safeRoute=params.get('veiligbeheer')==='1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function cleanRoute(){
  try{
    const url=new URL(location.href);
    url.searchParams.delete('veiligbeheer');
    if(url.searchParams.get('v')==='296')url.searchParams.delete('v');
    history.replaceState(history.state,'',url.pathname+(url.searchParams.toString()?('?'+url.searchParams.toString()):'')+url.hash);
  }catch{}
}
async function waitForAdminUi(){
  if(document.getElementById('adminSheet')&&document.getElementById('adminRole'))return true;
  try{
    await Promise.race([
      window.__snazzleAdminUiReady||Promise.resolve(false),
      sleep(6500)
    ]);
  }catch{}
  for(let i=0;i<40;i++){
    if(document.getElementById('adminSheet')&&document.getElementById('adminRole'))return true;
    await sleep(100);
  }
  return false;
}
async function activeAdmin(user){
  if(!user||user.isAnonymous)return null;
  const token=await user.getIdTokenResult(false);
  if(token.claims?.snazzle_admin_mfa!==true)return null;
  const snap=await getDoc(doc(db,'adminUsers',user.uid));
  const data=snap.exists()?snap.data():null;
  return data?.active===true&&['superadmin','village_admin'].includes(data.role)?data:null;
}
function openSheet(profile){
  const login=document.getElementById('adminLogin');
  const sheet=document.getElementById('adminSheet');
  const role=document.getElementById('adminRole');
  if(login){
    login.classList.remove('show');
    login.setAttribute('aria-hidden','true');
    login.style.removeProperty('display');
  }
  if(role)role.textContent=profile.role==='superadmin'?'Hoofdbeheerder':('Dorpsbeheerder · '+(profile.village||''));
  if(sheet){
    sheet.classList.add('show');
    sheet.setAttribute('aria-hidden','false');
    sheet.style.setProperty('display','flex','important');
    sheet.style.setProperty('z-index','2147482500','important');
  }
  window.SnazzleAdminShellV268?.sync?.();
  cleanRoute();
}
async function run(){
  if(!safeRoute)return;
  let user=auth.currentUser;
  for(let i=0;i<35&&(!user||user.isAnonymous);i++){
    await sleep(120);
    user=auth.currentUser;
  }
  let profile=null;
  try{profile=await activeAdmin(user);}catch(err){console.warn('Snazzle veilige beheerroute',err);}
  if(!profile){
    location.replace('./beheer.html?v=296');
    return;
  }
  if(!(await waitForAdminUi())){
    location.replace('./beheer.html?v=296');
    return;
  }
  openSheet(profile);
}
function redirectLegacyInlineLogin(){
  if(safeRoute)return;
  const sheet=document.getElementById('adminLogin');
  if(!sheet)return;
  const user=auth.currentUser;
  const alreadyAdmin=!!user&&!user.isAnonymous;
  if(sheet.classList.contains('show')&&!alreadyAdmin){
    location.assign('./beheer.html?v=296');
  }
}
function watchLegacyInlineLogin(){
  const sheet=document.getElementById('adminLogin');
  if(sheet&&!sheet.dataset.snRoute296){
    sheet.dataset.snRoute296='1';
    new MutationObserver(redirectLegacyInlineLogin).observe(sheet,{attributes:true,attributeFilter:['class']});
    redirectLegacyInlineLogin();
    return;
  }
  const ob=new MutationObserver(()=>{
    const found=document.getElementById('adminLogin');
    if(found){ob.disconnect();watchLegacyInlineLogin();}
  });
  if(document.body)ob.observe(document.body,{childList:true,subtree:true});
}
run();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchLegacyInlineLogin,{once:true});
else watchLegacyInlineLogin();
window.SnazzleAdminRouteV296={open:run};
