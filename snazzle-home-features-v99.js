// Snazzle Home Features v99 — vaste premium tegels op de hoofdpagina.
// Deze laag verandert het hoofdmenu niet; hij geeft alleen de belangrijkste Snazzle-onderdelen weer op Home.

const HOME_FEATURES_V99 = [
  ['🎮','Snazzle Spel','Jouw Snazzle Wereld','game','game'],
  ['✨','Mijn Collectie','Kaarten, Nest & jaarstand','collection','collection'],
  ['📚','De Bieb','Lezen en je leeshoek bouwen','bieb','bieb'],
  ['🎧','Luisterverhalen','Luister naar Snazzle verhalen','listen','listen'],
  ['📷','Snazzle AR','Zoek met camera en GPS','ar','ar'],
  ['🗞️','Snazzle Nieuws','Nieuws en verhalen','news','news']
];

function installHomeFeatureStylesV99(){
  if(document.getElementById('snHomeFeaturesV99Styles')) return;
  const style=document.createElement('style');
  style.id='snHomeFeaturesV99Styles';
  style.textContent=`
    #snHomeFeaturesV99{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:12px!important;
      margin:18px 0 4px!important;
      width:100%!important;
    }
    #snHomeFeaturesV99 .sn-home-v99-card{
      position:relative!important;
      min-width:0!important;
      min-height:132px!important;
      padding:17px 16px 15px!important;
      border:4px solid #76502d!important;
      border-radius:23px!important;
      color:#fff!important;
      text-align:left!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:flex-start!important;
      justify-content:flex-end!important;
      overflow:hidden!important;
      box-shadow:0 7px 0 #4b2d1b,0 13px 24px rgba(0,0,0,.20)!important;
      appearance:none!important;
      -webkit-appearance:none!important;
      touch-action:manipulation!important;
      text-shadow:0 1px 2px rgba(0,0,0,.25)!important;
      transform:none!important;
    }
    #snHomeFeaturesV99 .sn-home-v99-card::after{
      content:"";
      position:absolute;
      inset:0;
      background:linear-gradient(115deg,rgba(255,255,255,.18),transparent 36%,transparent 70%,rgba(0,0,0,.10));
      pointer-events:none;
    }
    #snHomeFeaturesV99 .sn-home-v99-card[data-tone="game"]{background:linear-gradient(145deg,#397750,#28613f)!important}
    #snHomeFeaturesV99 .sn-home-v99-card[data-tone="collection"]{background:linear-gradient(145deg,#5754bd,#404a9c)!important}
    #snHomeFeaturesV99 .sn-home-v99-card[data-tone="bieb"]{background:linear-gradient(145deg,#8b7945,#716533)!important}
    #snHomeFeaturesV99 .sn-home-v99-card[data-tone="listen"]{background:linear-gradient(145deg,#587da8,#42688f)!important}
    #snHomeFeaturesV99 .sn-home-v99-card[data-tone="ar"]{background:linear-gradient(145deg,#7f53bb,#59378e)!important}
    #snHomeFeaturesV99 .sn-home-v99-card[data-tone="news"]{background:linear-gradient(145deg,#357951,#24643e)!important}
    #snHomeFeaturesV99 .sn-home-v99-icon{
      position:absolute!important;
      left:17px!important;
      top:15px!important;
      z-index:1!important;
      font-size:31px!important;
      line-height:1!important;
      filter:drop-shadow(0 3px 2px rgba(0,0,0,.20))!important;
    }
    #snHomeFeaturesV99 .sn-home-v99-card strong{
      position:relative!important;
      z-index:1!important;
      display:block!important;
      margin-top:38px!important;
      color:#fff!important;
      font-size:20px!important;
      font-weight:900!important;
      line-height:1.08!important;
      letter-spacing:0!important;
    }
    #snHomeFeaturesV99 .sn-home-v99-card small{
      position:relative!important;
      z-index:1!important;
      display:block!important;
      margin-top:7px!important;
      color:#f5f2df!important;
      font-size:13px!important;
      font-weight:650!important;
      line-height:1.28!important;
    }
    #snHomeFeaturesV99 .sn-home-v99-card:active{
      transform:translateY(3px)!important;
      box-shadow:0 4px 0 #4b2d1b,0 8px 16px rgba(0,0,0,.18)!important;
    }
    @media(max-width:370px){
      #snHomeFeaturesV99{gap:9px!important}
      #snHomeFeaturesV99 .sn-home-v99-card{min-height:124px!important;padding:14px 12px!important}
      #snHomeFeaturesV99 .sn-home-v99-card strong{font-size:17px!important}
      #snHomeFeaturesV99 .sn-home-v99-card small{font-size:11px!important}
    }
  `;
  document.head.appendChild(style);
}

function runHomeFeatureV99(action){
  // Gebruik exact dezelfde actie als het vaste v98-menu. Zo hebben Home en Menu altijd dezelfde werking.
  const menuAction=document.querySelector(`#quickMenuPanel [data-sn-action="${action}"]`);
  if(menuAction){ menuAction.click(); return; }

  // Fallbacks voor het geval Home sneller zichtbaar is dan het menu.
  if(action==='ar'){ document.getElementById('snArLaunch')?.click(); return; }
  if(action==='news'){ document.getElementById('snNewsLaunch')?.click(); return; }
  if(action==='collection'){ document.getElementById('collectionHomeCard')?.click(); return; }
}

function ensureHomeFeaturesV99(){
  installHomeFeatureStylesV99();
  const quick=document.querySelector('.quick');
  if(!quick) return false;

  let section=document.getElementById('snHomeFeaturesV99');
  if(!section){
    section=document.createElement('section');
    section.id='snHomeFeaturesV99';
    section.setAttribute('aria-label','Ontdek meer van Snazzle');
    HOME_FEATURES_V99.forEach(([icon,title,sub,action,tone])=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='sn-home-v99-card';
      button.dataset.tone=tone;
      button.dataset.homeAction=action;
      button.innerHTML=`<span class="sn-home-v99-icon" aria-hidden="true">${icon}</span><strong>${title}</strong><small>${sub}</small>`;
      button.addEventListener('click',()=>runHomeFeatureV99(action));
      section.appendChild(button);
    });
  }

  // Altijd direct onder Mijn vondsten / Mijn profiel houden, zoals in de mooie eerdere Home-versie.
  if(quick.nextElementSibling!==section) quick.insertAdjacentElement('afterend',section);
  return true;
}

function bootHomeFeaturesV99(){
  ensureHomeFeaturesV99();
  setTimeout(ensureHomeFeaturesV99,700);
  setTimeout(ensureHomeFeaturesV99,2200);
  setTimeout(ensureHomeFeaturesV99,5000);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bootHomeFeaturesV99,{once:true});
else bootHomeFeaturesV99();

window.SnazzleHomeFeaturesV99={ensure:ensureHomeFeaturesV99};
