// Snazzle v71.2 — vloeiender laden, stabielere animaties en direct de gekozen intro-afbeelding.
const V71='71.2.0';

// V100 is alleen de premium hoofdpagina. Het raakt het vaste v98-menu niet aan.
import((window.__snazzleFresh||((p)=>p))('./snazzle-ui-v100.js')).catch(err=>console.warn('Snazzle Home v100 kon niet laden',err));

function readIntro71(){
  try{
    const s=JSON.parse(localStorage.getItem('snazzleSettings')||'{}');
    return String(s?.introImage||s?.profileImage||'');
  }
  catch{return '';}
}
function applyIntro71(root=document){
  const mark=root.querySelector?.('#snV59Boot .sn-v59-boot-mark')||document.querySelector('#snV59Boot .sn-v59-boot-mark');
  if(!mark) return;
  const src=readIntro71();
  if(!src) return;
  if(mark.querySelector('img[data-sn-intro="1"]')) return;
  mark.replaceChildren();
  const img=document.createElement('img');
  img.src=src;
  img.alt='Snazzle intro';
  img.dataset.snIntro='1';
  img.decoding='async';
  img.draggable=false;
  mark.appendChild(img);
}

function installStyles71(){
  if(document.getElementById('snazzleRuntimeStabilityV71Styles')) return;
  const style=document.createElement('style');
  style.id='snazzleRuntimeStabilityV71Styles';
  style.textContent=`
    html,body{overflow-x:clip!important}
    body{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
    .hero::before,.hero::after,.main-action::after,.go,.photo>.live,.found.ready,.snazzle-duck-logo,#v37Moon,.sn59-media-shell.sn59-waiting::before{backface-visibility:hidden;-webkit-backface-visibility:hidden;will-change:transform,opacity}
    .hero,.hunt,.main-action,.home-card,.panel,.quick button{backface-visibility:hidden;-webkit-backface-visibility:hidden}
    .title-logo,.title-logo span,.hero h1,.hero p,.huntbody h3,.huntbody p,.main-action strong,.main-action small,.bottom button{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
    img{image-rendering:auto}
    #snV59Boot .sn-v59-boot-mark img[data-sn-intro="1"]{width:88%;height:88%;object-fit:contain;display:block;border-radius:42%;backface-visibility:hidden;-webkit-backface-visibility:hidden}
    button,a,[role="button"]{-webkit-tap-highlight-color:transparent}
    @media(prefers-reduced-motion:reduce){.hero::before,.hero::after,.main-action::after,.go,.photo>.live,.found.ready,.snazzle-duck-logo,#v37Moon,.sn59-media-shell.sn59-waiting::before{will-change:auto}}
  `;
  document.head.appendChild(style);
}

function prepareImages71(root=document){
  root.querySelectorAll('img').forEach(img=>{
    img.decoding='async';
    img.draggable=false;
    if(img.closest('.home-images,.list,.friends-list,.sn-news-page,.shop-product')) img.loading='lazy';
  });
}

function waitForLocalStyles71(maxWait=1100){
  const links=[...document.querySelectorAll('link[rel="stylesheet"][href]')].filter(link=>{
    try{return new URL(link.href,location.href).origin===location.origin;}catch{return false;}
  });
  if(!links.length) return Promise.resolve();
  return Promise.all(links.map(link=>{
    try{if(link.sheet) return Promise.resolve();}catch{}
    return new Promise(resolve=>{
      let done=false;
      const finish=()=>{if(done)return;done=true;resolve();};
      link.addEventListener('load',finish,{once:true});
      link.addEventListener('error',finish,{once:true});
      setTimeout(finish,maxWait);
    });
  }));
}

async function settle71(){
  installStyles71();
  prepareImages71();
  applyIntro71();
  await waitForLocalStyles71();
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  document.documentElement.classList.add('sn-runtime-stable');
  window.SnazzleHomeV100?.restore?.();
  return true;
}

installStyles71();
prepareImages71();
applyIntro71();

const observer71=new MutationObserver(records=>{
  for(const record of records){
    record.addedNodes.forEach(node=>{
      if(node.nodeType!==1) return;
      if(node.tagName==='IMG') prepareImages71(node.parentElement||document);
      else if(node.querySelector?.('img')) prepareImages71(node);
      if(node.id==='snV59Boot'||node.querySelector?.('#snV59Boot')) applyIntro71(node.parentElement||document);
    });
  }
});
if(document.body) observer71.observe(document.body,{childList:true,subtree:true});
else document.addEventListener('DOMContentLoaded',()=>observer71.observe(document.body,{childList:true,subtree:true}),{once:true});

window.__snazzleRuntimeSettle71=settle71;
console.info(`Snazzle runtime stability ${V71} geladen`);
