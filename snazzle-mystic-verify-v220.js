// Snazzle MYSTIC v236 — controleert de 12 kaarten zonder globale verificatielus.
const VERSION='236.0-smooth-verify';
const LOCAL_KEY='snazzleCardCatalogV2';
const EXPECTED=[
  ['S01-M01','Moon Whisper','core'],['S01-M02','Crystal Dream','core'],['S01-M03','Mystic Glow','core'],['S01-M04','Shadow Spell','core'],
  ['S01-M05','Star Oracle','core'],['S01-M06','Dream Keeper','core'],['S01-M07','Phantom Flash','rare'],['S01-M08','Magic Mist','rare'],
  ['S01-M09','Lunar Legend','silver'],['S01-M10','Secret Spirit','silver'],['S01-M11','Mystic Guardian','gold'],['S01-M12','Mystic Master','platinum']
];
let queued=false,lastRepairAt=0,lastCheck=null;

function localCards(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function verify(force=false){
  if(lastCheck&&!force&&Date.now()-Date.parse(lastCheck.checkedAt)<1200)return lastCheck;
  const cards=localCards();
  const byNo=new Map(cards.map(c=>[String(c.number||'').toUpperCase(),c]));
  const result=EXPECTED.map(([number,name,rarity])=>{
    const c=byNo.get(number);
    return {number,name,rarity,present:!!c,nameOk:c?.name===name,seriesOk:c?.series==='MYSTIC Series 01',rarityOk:c?.rarity===rarity,imageOk:typeof c?.imageData==='string'&&c.imageData.startsWith('data:image/')&&c.imageData.length>200};
  });
  const ok=result.every(x=>x.present&&x.nameOk&&x.seriesOk&&x.rarityOk&&x.imageOk);
  lastCheck={ok,count:result.filter(x=>x.present).length,images:result.filter(x=>x.imageOk).length,result,checkedAt:new Date().toISOString()};
  window.__snazzleMysticV220Check=lastCheck;
  return lastCheck;
}
function cardUiExists(){return !!document.querySelector('#collectionSheet,#sc2List,#sc2Grid,#sc2VaultGrid');}
function revealMysticArtwork(){
  if(!cardUiExists())return;
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const text=(row.querySelector('strong')?.textContent||row.textContent||'').toUpperCase();
    if(!/S01-M\d{2}/.test(text))return;
    row.dataset.mysticV220='1';
    row.querySelectorAll('.sc2-thumb > img:not(.sn-card-atlas-v217)').forEach(img=>{
      img.style.setProperty('opacity','1','important');img.style.setProperty('visibility','visible','important');img.style.setProperty('display','block','important');img.style.setProperty('width','100%','important');img.style.setProperty('height','100%','important');img.style.setProperty('object-fit','contain','important');
    });
  });
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const number=(card.querySelector('.sc2-num')?.textContent||'').toUpperCase();
    if(!/^S01-M\d{2}$/.test(number))return;
    card.dataset.mysticV220='1';
    card.querySelectorAll('.sc2-media > img:not(.sn-card-atlas-v217)').forEach(img=>{
      img.style.setProperty('opacity','1','important');img.style.setProperty('visibility','visible','important');img.style.setProperty('display','block','important');img.style.setProperty('width','100%','important');img.style.setProperty('height','100%','important');img.style.setProperty('object-fit','contain','important');
    });
  });
}
function repair(force=false){verify(force);revealMysticArtwork();lastRepairAt=performance.now();return window.__snazzleMysticV220Check;}
function queue(force=false){
  if(queued)return;
  const elapsed=performance.now()-lastRepairAt;
  if(!force&&elapsed<120){setTimeout(()=>queue(true),Math.ceil(120-elapsed));return;}
  queued=true;requestAnimationFrame(()=>{queued=false;repair(force)});
}
function relevantMutation(m){
  const target=m.target instanceof Element?m.target:null;
  if(target?.closest?.('#collectionSheet,#sc2List,#sc2Grid,#sc2VaultGrid'))return true;
  return [...m.addedNodes].some(n=>n instanceof Element&&(n.matches?.('#collectionSheet,#sc2List,#sc2Grid,#sc2VaultGrid,.sc2-row,.sc2-card')||n.querySelector?.('#collectionSheet,#sc2List,#sc2Grid,#sc2VaultGrid,.sc2-row,.sc2-card')));
}

verify(true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queue(true),{once:true});else queue(true);
const observer=new MutationObserver(ms=>{if(ms.some(relevantMutation))queue()});
observer.observe(document.body,{subtree:true,childList:true});
setTimeout(()=>queue(true),650);
setTimeout(()=>queue(true),1600);
document.addEventListener('snazzle:mystic-ready',()=>{lastCheck=null;queue(true)});
window.SnazzleMysticVerifyV220={version:VERSION,verify:()=>verify(true),repair:()=>repair(true),expected:EXPECTED};
console.info(`Snazzle MYSTIC controle ${VERSION} geladen`);
