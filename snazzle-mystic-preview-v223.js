// Snazzle MYSTIC preview v223 — directe atlasweergave zonder canvas/data-URI.
// Hierdoor kan de oude eend-placeholder de echte MYSTIC-afbeelding niet meer vervangen.
const VERSION='223.0-direct-sprite';
const ATLAS='./assets/cards/snazzle-mystic-atlas-v219.jpg?v=223';
let queued=false;

function indexFrom(text){
  const m=String(text||'').toUpperCase().match(/S01-M(\d{2})/);
  if(!m)return -1;
  const i=Number(m[1])-1;
  return i>=0&&i<12?i:-1;
}
function spritePosition(i){
  const col=i%4,row=Math.floor(i/4);
  return `${col*(100/3)}% ${row*50}%`;
}
function installStyle(){
  let s=document.getElementById('snMysticPreviewV223Style');
  if(!s){s=document.createElement('style');s.id='snMysticPreviewV223Style';document.head.appendChild(s);}
  s.textContent=`
    #sc2Grid .sc2-card[data-mystic-v223='1'] .sc2-media,
    #sc2VaultGrid .sc2-card[data-mystic-v223='1'] .sc2-media,
    #sc2List .sc2-row[data-mystic-v223='1'] .sc2-thumb{position:relative!important;overflow:hidden!important;background:#1b1427!important}
    .sn-mystic-v223-sprite{position:absolute!important;inset:0!important;z-index:120!important;display:block!important;opacity:1!important;visibility:visible!important;background-image:url('${ATLAS}')!important;background-repeat:no-repeat!important;background-size:400% 300%!important;background-color:#1b1427!important;pointer-events:none!important;transform-origin:center!important}
    #sc2Grid .sc2-card[data-mystic-v223='1'].unlocked .sn-mystic-v223-sprite,
    #sc2VaultGrid .sc2-card[data-mystic-v223='1'].unlocked .sn-mystic-v223-sprite{filter:none!important;transform:none!important}
    #sc2Grid .sc2-card[data-mystic-v223='1'].locked .sn-mystic-v223-sprite,
    #sc2VaultGrid .sc2-card[data-mystic-v223='1'].locked .sn-mystic-v223-sprite{filter:brightness(.24) saturate(.55) blur(5px)!important;transform:scale(1.09)!important}
    #sc2Grid .sc2-card[data-mystic-v223='1'] .sc2-lock,
    #sc2VaultGrid .sc2-card[data-mystic-v223='1'] .sc2-lock{z-index:130!important;color:#ffe35a!important;text-shadow:0 3px 12px #000!important}
    #sc2Grid .sc2-card[data-mystic-v223='1'] .sc2-rarity,
    #sc2Grid .sc2-card[data-mystic-v223='1'] .sc2-num,
    #sc2VaultGrid .sc2-card[data-mystic-v223='1'] .sc2-rarity,
    #sc2VaultGrid .sc2-card[data-mystic-v223='1'] .sc2-num{z-index:131!important}
    #sc2List .sc2-row[data-mystic-v223='1'] .sn-mystic-v223-sprite{filter:none!important;transform:none!important}
  `;
}
function ensureSprite(box,i){
  if(!box)return false;
  let art=box.querySelector(':scope > .sn-mystic-v223-sprite');
  if(!art){art=document.createElement('div');art.className='sn-mystic-v223-sprite';box.appendChild(art);}
  art.style.setProperty('background-position',spritePosition(i),'important');
  art.dataset.card=`S01-M${String(i+1).padStart(2,'0')}`;
  return true;
}
function repair(){
  installStyle();let count=0;
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const i=indexFrom(card.querySelector('.sc2-num')?.textContent||card.textContent);
    if(i<0)return;
    card.dataset.mysticV223='1';
    if(ensureSprite(card.querySelector('.sc2-media'),i))count++;
  });
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const i=indexFrom(row.querySelector('strong')?.textContent||row.textContent);
    if(i<0)return;
    row.dataset.mysticV223='1';
    if(ensureSprite(row.querySelector('.sc2-thumb'),i))count++;
  });
  window.__snazzleMysticV223LastRepair={count,at:new Date().toISOString()};
  return count;
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{repair()}catch(e){console.error('MYSTIC preview v223 repair',e)}})}

installStyle();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queue()}).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',e=>{if(e.target.closest('#collectionSheet,#adminSheet,[data-seriespick],[data-sc2f],[data-tab],[data-collection-tab]'))[0,60,180,400,900].forEach(ms=>setTimeout(queue,ms));},{passive:true});
document.addEventListener('snazzle:mystic-ready',queue);
document.addEventListener('snazzle:admin-ui-ready',queue);
[0,100,250,600,1200,2400,5000,9000].forEach(ms=>setTimeout(queue,ms));
window.SnazzleMysticPreviewV223={version:VERSION,repair};
console.info(`Snazzle MYSTIC preview ${VERSION} geladen`);
