// Snazzle v58 — veilige beheerroute die wacht op Firebase Auth en mobiel betrouwbaar inlogt.
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  setPersistence, browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const auth=getAuth();
const db=getFirestore();
const qs=new URLSearchParams(location.search);
const safeMode=qs.get('veiligbeheer')==='1';
let busy=false;

const byId=id=>document.getElementById(id);

function clearSafeAdminRoute(){
  try{
    const url=new URL(location.href);
    if(url.searchParams.get('veiligbeheer')!=='1') return;
    url.searchParams.delete('veiligbeheer');
    history.replaceState(history.state,'',url.pathname+(url.searchParams.toString()?`?${url.searchParams}`:'')+url.hash);
  }catch{}
}
function hideSheet(id){
  const el=byId(id); if(!el) return;
  el.classList.remove('show');
  el.setAttribute('aria-hidden','true');
  el.style.removeProperty('display');
  el.style.removeProperty('z-index');
  el.style.removeProperty('pointer-events');
}
function showSheet(id){
  const el=byId(id); if(!el) return false;
  el.classList.add('show');
  el.setAttribute('aria-hidden','false');
  el.style.setProperty('display','flex','important');
  el.style.setProperty('z-index','16050','important');
  el.style.setProperty('pointer-events','auto','important');
  const panel=el.querySelector('.panel');
  if(panel){
    panel.style.setProperty('position','relative','important');
    panel.style.setProperty('z-index','2','important');
    panel.style.setProperty('pointer-events','auto','important');
  }
  return true;
}
function showLogin(){
  hideSheet('adminSheet');
  showSheet('adminLogin');
  makeLoginInteractive();
}
function showAdmin(){
  hideSheet('adminLogin');
  showSheet('adminSheet');
}
async function getAdminProfile(user){
  if(!user || user.isAnonymous) return null;
  try{
    const snap=await getDoc(doc(db,'adminUsers',user.uid));
    if(!snap.exists()) return null;
    const data=snap.data();
    return data?.active===true ? data : null;
  }catch(err){
    console.warn('Snazzle v58 beheerprofiel',err);
    return null;
  }
}
function status(text,ok=false){
  const btn=byId('adminLoginBtn');
  if(btn){
    btn.textContent=text;
    btn.style.opacity=ok?'1':'.82';
  }
}
function makeLoginInteractive(){
  const sheet=byId('adminLogin');
  const btn=byId('adminLoginBtn');
  const email=byId('adminEmail');
  const password=byId('adminPassword');
  [sheet,btn,email,password].forEach(el=>{
    if(!el) return;
    el.style.setProperty('pointer-events','auto','important');
    el.style.setProperty('touch-action','manipulation','important');
  });
  if(btn){
    btn.style.setProperty('position','relative','important');
    btn.style.setProperty('z-index','20','important');
    btn.disabled=false;
  }
}
async function waitForCoreAdmin(maxMs=3500){
  const start=Date.now();
  while(Date.now()-start<maxMs){
    const txt=(byId('adminRole')?.textContent||'').trim();
    if(txt && txt!=='Niet ingelogd') return true;
    await new Promise(r=>setTimeout(r,120));
  }
  return false;
}
async function safeLogin(){
  if(busy) return;
  const email=(byId('adminEmail')?.value||'').trim();
  const password=byId('adminPassword')?.value||'';
  if(!email || !password){ status('Vul e-mail en wachtwoord in'); return; }
  busy=true;
  makeLoginInteractive();
  const btn=byId('adminLoginBtn');
  if(btn) btn.disabled=true;
  status('Even controleren…');
  try{
    try{ await setPersistence(auth,browserLocalPersistence); }catch(err){ console.warn('Snazzle v58 persistence',err); }
    const cred=await signInWithEmailAndPassword(auth,email,password);
    const profile=await getAdminProfile(cred.user);
    if(!profile) throw new Error('geen-beheerrechten');
    try{ localStorage.setItem('snazzleAdminEmail',email); }catch{}
    await waitForCoreAdmin();
    if(byId('adminRole')) byId('adminRole').textContent=profile.role==='superadmin'?'Hoofdbeheerder':`Dorpsbeheerder · ${profile.village||''}`;
    if(byId('adminPassword')) byId('adminPassword').value='';
    showAdmin();
    clearSafeAdminRoute();
  }catch(err){
    console.error('Snazzle v58 login',err);
    showLogin();
    clearSafeAdminRoute();
    status(err?.message==='geen-beheerrechten'?'Geen actieve beheerrechten':'Inloggen mislukt — controleer je gegevens');
  }finally{
    busy=false;
    if(btn) btn.disabled=false;
  }
}
function hitButton(x,y){
  const btn=byId('adminLoginBtn'); if(!btn) return false;
  const r=btn.getBoundingClientRect();
  return x>=r.left-8 && x<=r.right+8 && y>=r.top-8 && y<=r.bottom+8;
}

// Mobiele noodroute: de tik wordt op documentniveau gevangen, zelfs als een transparante laag erboven zit.
document.addEventListener('pointerdown',e=>{
  if(!byId('adminLogin')?.classList.contains('show')) return;
  makeLoginInteractive();
  if(!hitButton(e.clientX,e.clientY)) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  safeLogin();
},true);

document.addEventListener('click',e=>{
  const btn=byId('adminLoginBtn');
  if(!btn || !(e.target===btn || btn.contains(e.target))) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  safeLogin();
},true);

onAuthStateChanged(auth,async user=>{
  if(!safeMode) return;
  makeLoginInteractive();
  const profile=await getAdminProfile(user);
  if(profile){
    await waitForCoreAdmin(2200);
    if(byId('adminRole')) byId('adminRole').textContent=profile.role==='superadmin'?'Hoofdbeheerder':`Dorpsbeheerder · ${profile.village||''}`;
    showAdmin();
  }else{
    showLogin();
  }
  // Directe beheerlink is een eenmalige ingang. Daarna blijft de gewone Home-URL over.
  clearSafeAdminRoute();
});

if(safeMode){
  hideSheet('adminSheet');
  hideSheet('adminLogin');
  setTimeout(makeLoginInteractive,250);
  setTimeout(makeLoginInteractive,900);
}

window.SnazzleSafeAdminV58={login:safeLogin,open:async()=>{
  const profile=await getAdminProfile(auth.currentUser);
  profile?showAdmin():showLogin();
}};
