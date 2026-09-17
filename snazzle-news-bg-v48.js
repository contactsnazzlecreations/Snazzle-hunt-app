// Snazzle Nieuws achtergrond v48 — speels, zacht en goed leesbaar.
(function installSnazzleNewsBackgroundV48(){
  const STYLE_ID='snazzleNewsBackgroundV48';
  if(document.getElementById(STYLE_ID)) return;

  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .sn-news-overlay{
      background:
        radial-gradient(circle at 15% 12%,rgba(255,220,103,.22),transparent 29%),
        radial-gradient(circle at 88% 22%,rgba(190,164,255,.22),transparent 27%),
        linear-gradient(180deg,#f6edff 0%,#fff7e9 48%,#effaf4 100%)!important;
    }

    .sn-news-shell{
      position:relative;
      isolation:isolate;
      overflow:hidden;
      background:
        radial-gradient(circle at 10% 14%,rgba(255,215,92,.30) 0 72px,transparent 74px),
        radial-gradient(circle at 93% 18%,rgba(192,167,255,.22) 0 105px,transparent 108px),
        radial-gradient(circle at 5% 58%,rgba(151,222,184,.18) 0 110px,transparent 113px),
        radial-gradient(circle at 94% 79%,rgba(255,185,199,.18) 0 120px,transparent 123px),
        linear-gradient(180deg,#fffaf1 0%,#fcf8ff 39%,#f5fff8 100%)!important;
    }

    .sn-news-shell::before{
      content:'';
      position:absolute;
      inset:0;
      z-index:0;
      pointer-events:none;
      opacity:.65;
      background:
        radial-gradient(circle at 18% 9%,rgba(255,255,255,.96) 0 3px,transparent 4px),
        radial-gradient(circle at 77% 13%,rgba(255,234,139,.72) 0 2px,transparent 3px),
        radial-gradient(circle at 83% 47%,rgba(255,255,255,.86) 0 3px,transparent 4px),
        radial-gradient(circle at 20% 71%,rgba(210,190,255,.54) 0 3px,transparent 4px),
        radial-gradient(circle at 69% 91%,rgba(255,224,117,.58) 0 3px,transparent 4px);
    }

    .sn-news-shell::after{
      content:'🦆';
      position:absolute;
      right:-22px;
      top:142px;
      z-index:0;
      pointer-events:none;
      font-size:108px;
      line-height:1;
      opacity:.055;
      transform:rotate(-8deg);
      filter:saturate(.8);
    }

    .sn-news-shell > *{
      position:relative;
      z-index:1;
    }

    .sn-news-topbar{
      background:rgba(255,250,245,.93)!important;
      border-bottom-color:rgba(105,79,145,.13)!important;
    }

    .sn-news-intro{
      position:relative;
    }

    .sn-news-intro::after{
      content:'✦  ✧  ✦';
      position:absolute;
      right:18px;
      top:10px;
      color:#e2b84c;
      opacity:.28;
      letter-spacing:5px;
      font-size:18px;
      pointer-events:none;
    }

    .sn-news-feature,
    .sn-news-card,
    .sn-news-empty{
      background:rgba(255,255,255,.95)!important;
      border-color:rgba(113,84,148,.15)!important;
      box-shadow:0 10px 28px rgba(63,43,94,.09)!important;
    }

    .sn-news-filter{
      background:rgba(255,255,255,.88)!important;
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
    }

    .sn-news-filter.on{
      background:#5b4090!important;
    }

    @media(max-width:520px){
      .sn-news-shell::after{font-size:88px;right:-27px;top:154px;opacity:.05}
      .sn-news-intro::after{right:13px;top:7px;font-size:15px;letter-spacing:3px}
    }

    @media(prefers-reduced-transparency:reduce){
      .sn-news-topbar,.sn-news-feature,.sn-news-card,.sn-news-empty,.sn-news-filter{background:#fff!important}
    }
  `;
  document.head.appendChild(style);
})();
