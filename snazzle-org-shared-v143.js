// Snazzle Organisatieplatform v143 — gedeelde lichte basis.
import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

const app=getApp();
export const auth=getAuth(app);
export const db=getFirestore(app);
export const functions=getFunctions(app,'europe-west1');
export const storage=getStorage(app);
export const $=(s,r=document)=>r.querySelector(s);
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const CACHE_MS=45000;
export const fresh=window.__snazzleFresh||((p)=>p);
export const state=window.__snazzleOrgState143||(window.__snazzleOrgState143={user:null,superAdmin:false,liveHunts:[],organizerSessions:[],myFinds:[],assets:[],adminAssets:[],adminHunts:[]});

export function toast(message){
  const el=$('#toast');
  if(!el){console.info('[Special Hunts]',message);return;}
  el.textContent=message;el.classList.add('show');
  clearTimeout(window.__snOrgToast143);
  window.__snOrgToast143=setTimeout(()=>el.classList.remove('show'),3500);
}
export function errorMessage(err,fallback='Er ging iets mis.'){
  const msg=String(err?.message||'').replace(/^Firebase:\s*/,'').replace(/\s*\(functions\/[^)]+\)\.?$/,'').trim();
  return msg||fallback;
}
export async function call(name,data={}){
  const result=await httpsCallable(functions,name)(data);
  return result.data||{};
}
export function fmtDate(iso){
  const d=new Date(iso);
  if(!Number.isFinite(d.getTime()))return'—';
  return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(d);
}
export function fmtRange(a,b){return `${fmtDate(a)} – ${fmtDate(b)}`;}
export function codeDisplay(code){
  const c=String(code||'').replace(/[^A-Z0-9]/gi,'').toUpperCase();
  return c.length>3?`${c.slice(0,3)}-${c.slice(3)}`:c;
}
export function openModal(id){$(id)?.classList.add('show');}
export function closeModal(id){$(id)?.classList.remove('show');}
export function closeQuick(){
  try{$('#quickMenuClose')?.click();}catch{}
  $('#quickMenuOverlay')?.classList.remove('show');
}
export function installStyles(){
  if($('#snOrgPlatformStyle143'))return;
  const l=document.createElement('link');
  l.id='snOrgPlatformStyle143';l.rel='stylesheet';l.href=fresh('./snazzle-org-platform-v143.css');
  document.head.appendChild(l);
}
export function geoOnce(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('GPS wordt niet ondersteund op dit toestel.'));
    navigator.geolocation.getCurrentPosition(resolve,e=>reject(new Error(e.code===1?'Locatietoestemming is geweigerd.':'Je locatie kon niet worden bepaald.')),{enableHighAccuracy:true,timeout:16000,maximumAge:0});
  });
}
export function here(pos){return{lat:Number(pos.coords.latitude),lon:Number(pos.coords.longitude)}}
export function distance(a,b){
  const toRad=d=>d*Math.PI/180,R=6371000,p1=toRad(a.lat),p2=toRad(b.lat),dp=toRad(b.lat-a.lat),dl=toRad(b.lon-a.lon);
  const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
export async function camera(){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera wordt niet ondersteund in deze browser.');
  return navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
}
export function localInput(iso){
  const d=new Date(iso);if(!Number.isFinite(d.getTime()))return'';
  const p=n=>String(n).padStart(2,'0');
  return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function inputIso(v){const d=new Date(v);return Number.isFinite(d.getTime())?d.toISOString():'';}
