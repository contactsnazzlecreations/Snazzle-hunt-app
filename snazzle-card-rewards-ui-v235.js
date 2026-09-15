// Snazzle Cards Rewards UI v235 — zichtbare serie- en Master Collector-beloningen.
const VERSION='235.0';
const SERIES={wild:{label:'WILD',icon:'🌿'},spark:{label:'SPARK',icon:'✨'},mystic:{label:'MYSTIC',icon:'🔮'},blaze:{label:'BLAZE',icon:'🔥'}};
let queued=false,painting=false;

function engine(){return window.SnazzleCardProgressV234||null;}
function installStyle(){
  if(document.getElementById('snCardRewards235Style'))return;
  const s=document.createElement('style');s.id='snCardRewards235Style';s.textContent=`
    .sn235-reward-strip{margin:8px 0 4px;display:flex;gap:6px;overflow:auto;scrollbar-width:none}.sn235-reward-strip::-webkit-scrollbar{display:none}.sn235-badge{white-space:nowrap;padding:6px 8px;border-radius:999px;border:1.5px solid #b89053;background:#fff8df;color:#5c4127;font-size:9px;font-weight:1000}.sn235-badge.earned{background:linear-gradient(145deg,#e9d06f,#fff1a0);border-color:#9b7128;color:#5a3d12;box-shadow:0 2px 0 #8e682e}.sn235-badge.master{background:linear-gradient(145deg,#493078,#7850a0);border-color:#cfabe9;color:#fff7d8}
    .sn235-vault-reward{position:relative;padding:5px;border-radius:19px;background:linear-gradient(145deg,#e2b94c,#795320);box-shadow:0 5px 0 #513824,0 11px 23px rgba(0,0,0,.16);overflow:hidden}.sn235-vault-reward.master48{background:linear-gradient(135deg,#fff,#9ce9df 32%,#aaa7ef 68%,#fff0bb)}.sn235-vault-inner{height:100%;min-height:245px;border-radius:15px;overflow:hidden;background:linear-gradient(160deg,#21183e,#41245b 58%,#153f38);color:#fff7dc;border:2px solid rgba(255,255,255,.7);display:flex;flex-direction:column}.sn235-vault-art{min-height:170px;display:grid;place-items:center;font-size:62px;background:radial-gradient(circle at 50% 36%,rgba(255,225,106,.32),transparent 35%),linear-gradient(145deg,#241b46,#183d38)}.sn235-vault-info{padding:9px}.sn235-vault-info strong{display:block;font-size:12px}.sn235-vault-info small{display:block;margin-top:3px;font-size:9px;color:#e6dabb;font-weight:800}.sn235-vault-source{display:inline-block;margin-top:6px;padding:4px 7px;border-radius:99px;background:#f0d97f;color:#523a1d;font-size:8px;font-weight:1000}.sn235-vault-rarity{position:absolute;top:12px;left:12px;padding:5px 7px;border-radius:99px;background:rgba(20,26,23,.84);color:#fff;border:1px solid rgba(255,255,255,.6);font-size:8px;font-weight:1000}
  `;document.head.appendChild(s);
}
function badgeStrip(c){
  const progress=document.getElementById('snCardProgress234');if(!progress)return;
  let strip=document.getElementById('snCardRewards235');
  if(!strip){strip=document.createElement('div');strip.id='snCardRewards235';strip.className='sn235-reward-strip';progress.insertAdjacentElement('afterend',strip);}
  const parts=[];
  Object.entries(SERIES).forEach(([key,s])=>{
    if(c[key]>=12)parts.push(`<span class="sn235-badge master">${s.icon} ${s.label} MASTER 🔑</span>`);
    else if(c[key]>=6)parts.push(`<span class="sn235-badge earned">${s.icon} ${s.label} 6/12 🏅</span>`);
  });
  if(c.total>=48)parts.push('<span class="sn235-badge master">🏆 MASTER COLLECTOR 48/48</span>');
  strip.innerHTML=parts.join('');
  strip.style.display=parts.length?'flex':'none';
}
function rewardCard(title,subtitle,icon,master=false){
  const el=document.createElement('article');el.className=`sn235-vault-reward${master?' master48':''}`;el.dataset.sn235Reward='1';
  el.innerHTML=`<div class="sn235-vault-inner"><div class="sn235-vault-art">${icon}</div><div class="sn235-vault-info"><strong>${title}</strong><small>${subtitle}</small><span class="sn235-vault-source">${master?'🏆 Exclusieve Vault Card':'🔑 Vault Key verdiend'}</span></div></div><span class="sn235-vault-rarity">${master?'MASTER':'SERIES MASTER'}</span>`;
  return el;
}
function vaultRewards(c){
  const grid=document.getElementById('sc2VaultGrid');if(!grid)return;
  grid.querySelectorAll('[data-sn235-reward="1"]').forEach(el=>el.remove());
  Object.entries(SERIES).forEach(([key,s])=>{
    if(c[key]>=12)grid.appendChild(rewardCard(`${s.label} Series Master`,`${s.label} Series 01 compleet · 12/12`,`${s.icon} 🔑`));
  });
  if(c.total>=48)grid.appendChild(rewardCard('Snazzle Master Collector','Alle 48 basiskaarten verzameld','🏆✨',true));
}
function render(){
  if(painting)return 0;
  const e=engine();if(!e?.ready?.())return 0;
  painting=true;
  try{
    installStyle();const c=e.counts();badgeStrip(c);vaultRewards(c);
    window.__snazzleCardRewardsV235={counts:c,at:new Date().toISOString()};
    return c.total;
  }finally{painting=false;}
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{render()}catch(e){console.warn('Cards rewards v235',e)}})}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
new MutationObserver(ms=>{if(!painting&&ms.some(m=>m.type==='childList'&&m.addedNodes.length))queue()}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest('#collectionSheet,[data-collection-tab],[data-seriespick]'))[0,80,240,650].forEach(ms=>setTimeout(queue,ms))},{passive:true});
[300,900,1800,4000,8000].forEach(ms=>setTimeout(queue,ms));
window.SnazzleCardRewardsV235={version:VERSION,render};
console.info(`Snazzle Cards Rewards UI ${VERSION} geladen`);
