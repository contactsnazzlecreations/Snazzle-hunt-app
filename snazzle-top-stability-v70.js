// Snazzle v70 — stabiele bovenbalk op mobiel.
// Zet alleen de kostbare/bewegende effecten rond SNAZZLE HUNT stil; functies en klikbare geheimpjes blijven werken.

const V70='70.0.0';

function installTopStability70(){
  if(document.getElementById('snazzleTopStabilityV70Styles')) return;
  const style=document.createElement('style');
  style.id='snazzleTopStabilityV70Styles';
  style.textContent=`
    /* De geanimeerde pagina-achtergrond kan op sommige Android-toestellen micro-jitter veroorzaken. */
    body{
      animation:none!important;
      background-position:0 0,100% 0,50% 100%,0 0!important;
    }

    /* De complete merkbalk blijft optisch volledig stabiel. */
    .top,
    .top *,
    .top *::before,
    .top *::after{
      animation:none!important;
      transition:none!important;
    }

    .top{
      transform:none!important;
      backface-visibility:hidden;
    }

    .top .brand,
    .top .logo,
    .top .logo::after,
    .top .title-logo,
    .top .title-logo span,
    #v37Leaf,
    #v37CodeStar{
      transform:none!important;
    }

    /* Voorkomt dat een tik op een element de hele kop even laat verspringen. */
    .top button:active,
    .top .logo:active{
      transform:none!important;
    }
  `;
  document.head.appendChild(style);
  console.info(`Snazzle top stability ${V70} geladen`);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',installTopStability70,{once:true});
}else{
  installTopStability70();
}
