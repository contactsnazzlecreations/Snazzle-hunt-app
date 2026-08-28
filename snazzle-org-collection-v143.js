// Snazzle Organisatieplatform v143 — blijvende Event Collecties in Mijn Snazzles.
import {$,esc,CACHE_MS,state,call,installStyles,openModal,closeModal} from './snazzle-org-shared-v143.js';

let observer=null;

function installUi(){
  installStyles();
  if(!$('#snOrgFindsModal143')){
    document.body.insertAdjacentHTML('beforeend',`
      <div class="sn-org143-modal" id="snOrgFindsModal143"><div class="sn-org143-shell">
        <div class="sn-org143-head"><h2 id="snOrgFindsHead143">Event Collectie</h2><button class="sn-org143-close" id="snOrgFindsClose143" type="button">×</button></div>
        <div class="sn-org143-body" id="snOrgFindsBody143"></div>
      </div></div>`);
    $('#snOrgFindsClose143').onclick=()=>closeModal('#snOrgFindsModal143');
  }
}
export async function loadMyFinds(force=false){
  installUi();
  if(!state.user){state.myFinds=[];render();return;}
  const key='snOrgMyFinds143';
  if(!force){
    try{
      const c=JSON.parse(sessionStorage.getItem(key)||'null');
      if(c&&Date.now()-c.at<CACHE_MS&&Array.isArray(c.items)){state.myFinds=c.items;render();return;}
    }catch{}
  }
  try{
    const d=await call('listMyOrgFinds');
    state.myFinds=d.items||[];
    try{sessionStorage.setItem(key,JSON.stringify({at:Date.now(),items:state.myFinds}));}catch{}
  }catch(err){
    console.warn('Event Collecties laden',err);
    state.myFinds=[];
  }
  render();
}
function render(){
  const host=$('#collectionCards');if(!host)return;
  let sec=$('#snOrgEventCollections143');
  if(!state.myFinds.length){sec?.remove();return;}
  if(!sec){sec=document.createElement('section');sec.id='snOrgEventCollections143';host.appendChild(sec);}
  const groups=new Map();
  state.myFinds.forEach(f=>{
    const k=f.huntId||'event';
    if(!groups.has(k))groups.set(k,{huntId:k,title:f.eventTitle||'Speciale Hunt',organization:f.organization||'',village:f.village||'',items:[]});
    groups.get(k).items.push(f);
  });
  sec.innerHTML='<div class="collection-section-title"><h3>🎪 Event Collecties</h3><span>Blijven van jou na de Hunt</span></div>'+ 
    [...groups.values()].map(g=>`<button class="sn-org143-folder" data-find-folder="${esc(g.huntId)}" type="button">
      <b>🎪</b><span><strong>${esc(g.title)}</strong><small>${esc(g.organization)} · ${esc(g.village)} · ${g.items.length} gevonden</small></span><i>›</i>
    </button>`).join('');
  sec.querySelectorAll('[data-find-folder]').forEach(b=>b.onclick=()=>openFolder(b.dataset.findFolder));
}
function openFolder(huntId){
  installUi();
  const items=state.myFinds.filter(f=>f.huntId===huntId),first=items[0]||{};
  $('#snOrgFindsHead143').textContent=first.eventTitle||'Event Collectie';
  $('#snOrgFindsBody143').innerHTML=`<div class="sn-org143-note">🎪 <b>EVENT EDITION</b><br>${esc(first.organization||'')} · 📍 ${esc(first.village||'')}<br>
    Deze gevonden Snazzles blijven in jouw collectie staan, ook nadat het evenement is afgelopen.</div>
    <div class="sn-org143-findgrid">${items.map(f=>`<article class="sn-org143-findcard">
      <img src="${esc(f.imageUrl)}" alt="${esc(f.assetName||'Snazzle')}" loading="lazy">
      <div><strong>${esc(f.assetName||'Snazzle')}</strong><small>EVENT EDITION · ${esc(safeDate(f.foundAt))}</small></div>
    </article>`).join('')}</div>`;
  openModal('#snOrgFindsModal143');
}
function safeDate(value){
  const d=new Date(value);
  return Number.isFinite(d.getTime())?d.toLocaleDateString('nl-NL'):'';
}
function watch(){
  render();
  if(observer||!document.body)return;
  observer=new MutationObserver(()=>render());
  observer.observe(document.body,{childList:true,subtree:true});
}
function boot(){
  installUi();watch();
  window.addEventListener('snazzle:org-find-added',()=>loadMyFinds(true));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.SnazzleOrgCollectionV143={load:loadMyFinds,render};
