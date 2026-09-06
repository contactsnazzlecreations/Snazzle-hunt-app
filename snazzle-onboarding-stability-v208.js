// Snazzle Onboarding Stability v208 — voorkomt vastlopen op MIX en herstelt profielgegevens na lokale opslagproblemen.
import { getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='208.0.0';
const NAME_KEY='snazzleName';
const WORLD_KEY='snazzleCardWorldPreference';
const NAME_COOKIE='snazzle_name_v208';
const WORLD_COOKIE='snazzle_world_v208';
const VALID_WORLDS=['wild','spark','mix'];

const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;

function readLocal(key){
  try{return localStorage.getItem(key)||'';}catch{return '';}
}
function writeLocal(key,value){
  try{localStorage.setItem(key,value);}catch{}
}
function readCookie(name){
  try{
    const prefix=name+'=';
    const row=document.cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith(prefix));
    return row?decodeURIComponent(row.slice(prefix.length)):'';
  }catch{return '';}
}
function writeCookie(name,value){
  if(!value)return;
  try{
    document.cookie=`${name}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  }catch{}
}
function cleanName(value){return String(value||'').trim().slice(0,20);}
function validWorld(value){return VALID_WORLDS.includes(value)?value:'';}

function currentName(){return cleanName(readLocal(NAME_KEY));}
function currentWorld(){return validWorld(readLocal(WORLD_KEY));}

function ensureWorldPreference(){
  let world=currentWorld();
  if(!world) world=validWorld(readCookie(WORLD_COOKIE));
  if(!world) world='mix';
  writeLocal(WORLD_KEY,world);
  writeCookie(WORLD_COOKIE,world);
  return world;
}

function applyNameToUi(name){
  name=cleanName(name);
  if(name.length<2)return;
  const first=document.getElementById('firstNameInput');
  const profile=document.getElementById('nameInput');
  const welcome=document.getElementById('welcomeText');
  if(first && !cleanName(first.value)) first.value=name;
  if(profile) profile.value=name;
  if(welcome) welcome.textContent=`Welkom, ${name}!`;
  document.getElementById('onboarding')?.classList.remove('show');
}

function restoreFromCookie(){
  let name=currentName();
  if(name.length<2){
    name=cleanName(readCookie(NAME_COOKIE));
    if(name.length>=2) writeLocal(NAME_KEY,name);
  }
  if(name.length>=2){
    writeCookie(NAME_COOKIE,name);
    applyNameToUi(name);
  }
  ensureWorldPreference();
}
restoreFromCookie();

function persistVisibleProfile(){
  const onboardingName=cleanName(document.getElementById('firstNameInput')?.value);
  const profileName=cleanName(document.getElementById('nameInput')?.value);
  const name=onboardingName||profileName||currentName();
  if(name.length>=2){
    writeLocal(NAME_KEY,name);
    writeCookie(NAME_COOKIE,name);
  }
  const world=ensureWorldPreference();
  writeCookie(WORLD_COOKIE,world);
}

document.addEventListener('click',event=>{
  const button=event.target?.closest?.('button');
  if(!button)return;
  if(button.id==='finishOnboarding'||button.id==='saveName') persistVisibleProfile();
},true);

document.addEventListener('snazzle-card-world-change',event=>{
  const world=validWorld(event.detail?.preference)||currentWorld()||'mix';
  writeLocal(WORLD_KEY,world);
  writeCookie(WORLD_COOKIE,world);
});
window.addEventListener('snazzle-card-world-change',event=>{
  const world=validWorld(event.detail?.preference)||currentWorld()||'mix';
  writeLocal(WORLD_KEY,world);
  writeCookie(WORLD_COOKIE,world);
});

const onboarding=document.getElementById('onboarding');
if(onboarding){
  const observer=new MutationObserver(()=>{
    const name=currentName();
    if(name.length>=2 && onboarding.classList.contains('show')){
      applyNameToUi(name);
    }
  });
  observer.observe(onboarding,{attributes:true,attributeFilter:['class']});
}

async function restoreFromCloud(user){
  if(!db||!user)return;
  let data={};
  try{
    const snap=await getDoc(doc(db,'users',user.uid));
    if(snap.exists()) data=snap.data()||{};
  }catch(err){
    console.warn('Snazzle v208 profielherstel kon cloudprofiel niet lezen',err);
  }

  let name=currentName();
  if(name.length<2){
    const cloudName=cleanName(data.nickname);
    if(cloudName.length>=2){
      name=cloudName;
      writeLocal(NAME_KEY,name);
      writeCookie(NAME_COOKIE,name);
    }
  }
  if(name.length>=2){
    writeCookie(NAME_COOKIE,name);
    applyNameToUi(name);
  }

  let world=currentWorld();
  if(!world){
    world=validWorld(data.cardWorldPreference)||validWorld(readCookie(WORLD_COOKIE))||'mix';
    writeLocal(WORLD_KEY,world);
  }
  writeCookie(WORLD_COOKIE,world);

  // Houd Firebase als extra herstelpunt bij, zonder het starten van de app ervan afhankelijk te maken.
  const patch={updatedAt:new Date().toISOString()};
  let shouldWrite=false;
  if(name.length>=2 && cleanName(data.nickname)!==name){patch.nickname=name;shouldWrite=true;}
  if(validWorld(data.cardWorldPreference)!==world){patch.cardWorldPreference=world;shouldWrite=true;}
  if(shouldWrite){
    try{await setDoc(doc(db,'users',user.uid),patch,{merge:true});}
    catch(err){console.warn('Snazzle v208 profielherstel kon cloudprofiel niet bijwerken',err);}
  }
}

if(auth){
  onAuthStateChanged(auth,user=>{
    if(user) restoreFromCloud(user);
  });
}

console.info(`Snazzle Onboarding Stability ${VERSION} geladen`);
