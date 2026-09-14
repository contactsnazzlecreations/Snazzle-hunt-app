// Snazzle MYSTIC v220 — controleert de 12 kaarten en zorgt dat hun eigen artwork zichtbaar blijft.
const VERSION='220.0';
const LOCAL_KEY='snazzleCardCatalogV2';
const EXPECTED=[
  ['S01-M01','Moon Whisper','core'],
  ['S01-M02','Crystal Dream','core'],
  ['S01-M03','Mystic Glow','core'],
  ['S01-M04','Shadow Spell','core'],
  ['S01-M05','Star Oracle','core'],
  ['S01-M06','Dream Keeper','core'],
  ['S01-M07','Phantom Flash','core'],
  ['S01-M08','Magic Mist','core'],
  ['S01-M09','Lunar Legend','rare'],
  ['S01-M10','Secret Spirit','rare'],
  ['S01-M11','Mystic Guardian','gold'],
  ['S01-M12','Mystic Master','platinum']
];

function localCards(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function verify(){
  const cards=localCards();
  const result=EXPECTED.map(([number,name,rarity])=>{
    const c=cards.find(x=>String(x.number||'').toUpperCase()===number);
    return {number,name,rarity,present:!!c,nameOk:c?.name===name,seriesOk:c?.series==='MYSTIC Series 01',rarityOk:c?.rarity===rarity,imageOk:typeof c?.imageData==='string'&&c.imageData.startsWith('data:image/')&&c.imageData.length>200};
  });
  const ok=result.every(x=>x.present&&x.nameOk&&x.seriesOk&&x.rarityOk&&x.imageOk);
  window.__snazzleMysticV220Check={ok,count:result.filter(x=>x.present).length,images:result.filter(x=>x.imageOk).length,result,checkedAt:new Date().toISOString()};
  return window.__snazzleMysticV220Check;
}

function revealMysticArtwork(){
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const text=(row.querySelector('strong')?.textContent||row.textContent||'').toUpperCase();
    if(!/S01-M\d{2}/.test(text))return;
    row.dataset.mysticV220='1';
    row.querySelectorAll('.sc2-thumb > img:not(.sn-card-atlas-v217)').forEach(img=>{
      img.style.setProperty('opacity','1','important');
      img.style.setProperty('visibility','visible','important');
      img.style.setProperty('display','block','important');
      img.style.setProperty('width','100%','important');
      img.style.setProperty('height','100%','important');
      img.style.setProperty('object-fit','contain','important');
    });
  });
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const number=(card.querySelector('.sc2-num')?.textContent||'').toUpperCase();
    if(!/^S01-M\d{2}$/.test(number))return;
    card.dataset.mysticV220='1';
    card.querySelectorAll('.sc2-media > img:not(.sn-card-atlas-v217)').forEach(img=>{
      img.style.setProperty('opacity','1','important');
      img.style.setProperty('visibility','visible','important');
      img.style.setProperty('display','block','important');
      img.style.setProperty('width','100%','important');
      img.style.setProperty('height','100%','important');
      img.style.setProperty('object-fit','contain','important');
    });
  });
}

let queued=false;
function repair(){
  verify();
  revealMysticArtwork();
  return window.__snazzleMysticV220Check;
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
const observer=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queue()});
observer.observe(document.documentElement,{subtree:true,childList:true});
[100,300,700,1400,2600,5000].forEach(ms=>setTimeout(queue,ms));
document.addEventListener('snazzle:mystic-ready',queue);
window.SnazzleMysticVerifyV220={version:VERSION,verify,repair,expected:EXPECTED};
console.info(`Snazzle MYSTIC controle ${VERSION} geladen`);
