// Snazzle Cards v132 — herstel oudere/lokale kaartuploads en zet ze veilig klaar voor V2.
// Doel: kaartuploads niet kwijtraken bij versiewissels. Alleen kaartachtige records worden meegenomen.

import { getApps,getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth,onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore,doc,getDoc,setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION='132-card-rescue';
const TARGET_KEY='snazzleCardCatalogV2';
const KNOWN_KEYS=['snazzleCardCatalogV1','snazzleCardCatalogV2'];

function readJson(key){
  try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}
}
function stableHash(value){
  let h=2166136261;
  for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  return (h>>>0).toString(36);
}
function slug(value){
  return String(value||'snazzle').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'snazzle';
}
function looksLikeUploadedCard(c){
  if(!c||typeof c!=='object'||Array.isArray(c)) return false;
  const hasImage=typeof c.imageData==='string'&&c.imageData.length>40;
  const signals=[c.number,c.name,c.series,c.rarity,c.unlockType].filter(v=>typeof v==='string'&&v.trim()).length;
  return hasImage&&signals>=2;
}
function arraysFrom(value){
  const out=[];
  if(Array.isArray(value)) out.push(value);
  if(value&&typeof value==='object'){
    for(const k of ['cards','catalog','items','snazzleCards']) if(Array.isArray(value[k])) out.push(value[k]);
  }
  return out;
}
function normalize(c,index,sourceKey){
  const x={...c};
  x.number=String(x.number||`SNZ-${index+1}`).trim().toUpperCase();
  x.name=String(x.name||'Snazzle Card').trim();
  x.series=String(x.series||'Snazzle Series 01').trim();
  x.rarity=['core','rare','silver','gold','platinum'].includes(String(x.rarity||'').toLowerCase())?String(x.rarity).toLowerCase():'core';
  x.unlockType=['hunt','event','shop','milestone','special','draft'].includes(x.unlockType)?x.unlockType:'draft';
  x.huntId=String(x.huntId||'');
  x.threshold=Math.max(0,Number(x.threshold)||0);
  x.active=x.active!==false;
  x.id=String(x.id||`rescue-${slug(x.number||x.name)}-${stableHash(`${x.number}|${x.name}|${x.series}|${sourceKey}|${index}`)}`);
  x.updatedAt=x.updatedAt||new Date().toISOString();
  x.createdAt=x.createdAt||x.updatedAt;
  return x;
}
function identity(c){
  if(c.id) return `id:${c.id}`;
  return `card:${String(c.number||'').toUpperCase()}|${String(c.name||'').toLowerCase()}|${String(c.series||'').toLowerCase()}`;
}
function collect(){
  const keys=new Set(KNOWN_KEYS);
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(key&&/snazzle/i.test(key)&&/card/i.test(key)) keys.add(key);
  }
  const map=new Map();
  const sources=[];
  for(const key of keys){
    const value=readJson(key);
    let count=0;
    for(const arr of arraysFrom(value)){
      arr.forEach((raw,index)=>{
        if(!looksLikeUploadedCard(raw)) return;
        const c=normalize(raw,index,key);
        map.set(identity(c),c);
        count++;
      });
    }
    if(count) sources.push({key,count});
  }
  return {cards:[...map.values()],sources};
}

const recovered=collect();
if(recovered.cards.length){
  try{
    const current=readJson(TARGET_KEY);
    const map=new Map();
    (Array.isArray(current)?current:[]).forEach(c=>{if(c&&typeof c==='object')map.set(identity(c),c)});
    recovered.cards.forEach(c=>map.set(identity(c),c));
    const merged=[...map.values()];
    localStorage.setItem(TARGET_KEY,JSON.stringify(merged));
    localStorage.setItem('snazzleCardRescueV132',JSON.stringify({version:VERSION,at:new Date().toISOString(),count:merged.length,sources:recovered.sources}));
    recovered.cards=merged;
    console.info(`Snazzle Cards rescue: ${merged.length} lokale kaart(en) klaar voor V2.`);
  }catch(err){console.warn('Snazzle Cards rescue lokaal mislukt',err);}
}

window.SnazzleCardRescueV132={version:VERSION,count:recovered.cards.length,sources:recovered.sources};

const app=getApps().length?getApp():null;
if(app&&recovered.cards.length){
  const auth=getAuth(app),db=getFirestore(app);
  let synced=false;
  onAuthStateChanged(auth,async user=>{
    if(!user||user.isAnonymous||synced) return;
    try{
      const adminSnap=await getDoc(doc(db,'adminUsers',user.uid));
      const profile=adminSnap.exists()?adminSnap.data():null;
      if(profile?.active!==true||profile?.role!=='superadmin') return;
      for(const card of recovered.cards) await setDoc(doc(db,'snazzleCards',card.id),card,{merge:true});
      synced=true;
      localStorage.setItem('snazzleCardRescueV132Central',JSON.stringify({version:VERSION,at:new Date().toISOString(),count:recovered.cards.length}));
      console.info(`Snazzle Cards rescue: ${recovered.cards.length} kaart(en) centraal veiliggesteld.`);
    }catch(err){console.warn('Snazzle Cards rescue centrale sync wacht op beheerlogin/rechten',err);}
  });
}
