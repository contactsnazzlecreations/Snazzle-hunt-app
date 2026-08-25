// Snazzle v71 — vloeiender laden en stabielere animaties zonder de speelse animaties te verwijderen.
const V71='71.0.0';

function installStyles71(){
  if(document.getElementById('snazzleRuntimeStabilityV71Styles')) return;
  const style=document.createElement('style');
  style.id='snazzleRuntimeStabilityV71Styles';
  style.textContent=`
    html,body{overflow-x:clip!important}
    body{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}

    /* Houd bewegende lagen op hun eigen compositorlaag. Dit voorkomt vooral op Android
       dat tekst en randen mee gaan knipperen wanneer een decoratie beweegt. */
    .hero::before,
    .hero::after,
    .main-action::after,
    .go,
    .photo>.live,
    .found.ready,
    .snazzle-duck-logo,
    #v37Moon,
    .sn59-media-shell.sn59-waiting::before{
      backface-visibility:hidden;
      -webkit-backface-visibility:hidden;
      will-change:transform,opacity;
    }

    .hero,.hunt,.main-action,.home-card,.panel,.quick button{
      backface-visibility:hidden;
      -webkit-backface-visibility:hidden;
    }

    /* Tekst blijft op een vaste rasterlaag terwijl omliggende decoraties bewegen. */
    .title-logo,.title-logo span,.hero h1,.hero p,.huntbody h3,.huntbody p,
    .main-action strong,.main-action small,.bottom button{
      -webkit-font-smoothing:antialiased;
      text-rendering:optimizeLegibility;
    }

    /* Afbeeldingen mogen pas na decoding zichtbaar worden zonder layout te veranderen. */
    img{image-rendering:auto}

    /* Geen plotselinge overgang wanneer de browser focus/touchstatus opnieuw tekent. */
    button,a,[role="button"]{-webkit-tap-highlight-color:transparent}

    @media(prefers-reduced-motion:reduce){
      .hero::before,.hero::after,.main-action::after,.go,.photo>.live,.found.ready,
      .snazzle-duck-logo,#v37Moon,.sn59-media-shell.sn59-waiting::before{will-change:auto}
    }
  `;
  document.head.appendChild(style);
}

function prepareImages71(root=document){
  root.querySelectorAll('img').forEach(img=>{
    img.decoding='async';
    img.draggable=false;
    // Alleen niet-kritieke afbeeldingen onder de hoofdsectie lazy laden.
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
  await waitForLocalStyles71();
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  document.documentElement.classList.add('sn-runtime-stable');
  return true;
}

installStyles71();
prepareImages71();

const observer71=new MutationObserver(records=>{
  for(const record of records){
    record.addedNodes.forEach(node=>{
      if(node.nodeType!==1) return;
      if(node.tagName==='IMG') prepareImages71(node.parentElement||document);
      else if(node.querySelector?.('img')) prepareImages71(node);
    });
  }
});
if(document.body) observer71.observe(document.body,{childList:true,subtree:true});
else document.addEventListener('DOMContentLoaded',()=>observer71.observe(document.body,{childList:true,subtree:true}),{once:true});

window.__snazzleRuntimeSettle71=settle71;
console.info(`Snazzle runtime stability ${V71} geladen`);
