// Snazzle v67 — maakt het gouden sterretje in de header functioneel.
// De ster opent een kindvriendelijke beloningenkaart. 1 gevonden Snazzle = 1 ster.

const STAR_VERSION='67.0.0';
const q67=(s,r=document)=>r.querySelector(s);
const qa67=(s,r=document)=>[...r.querySelectorAll(s)];
let launcher67=null;
let countObserver67=null;

function ensureStyles67(){
  if(q67('#snazzleStarRewardsV67Styles')) return;
  const style=document.createElement('style');
  style.id='snazzleStarRewardsV67Styles';
  style.textContent=`
    .sn-star-clickable{cursor:pointer;touch-action:manipulation}
    .sn-star-clickable:focus-visible{outline:3px solid #ffe682!important;outline-offset:4px!important;border-radius:12px}
    .sn-star-fallback{
      position:absolute;right:112px;top:18px;z-index:12;width:50px;height:50px;border:0;padding:0;
      display:grid;place-items:center;background:transparent;color:#ffe274;font-size:31px;line-height:1;
      text-shadow:0 0 10px rgba(255,234,140,.75),0 3px 4px rgba(72,46,18,.35);
      filter:drop-shadow(0 2px 2px rgba(0,0,0,.22));animation:snStarTwinkle67 2.5s ease-in-out infinite;
    }
    .sn-star-fallback:active{transform:scale(.88)}
    .sn-star-fallback .sn-star-badge{
      position:absolute;right:1px;top:2px;min-width:18px;height:18px;padding:0 4px;border-radius:99px;
      display:none;place-items:center;background:#0b5b43;color:#fff8d9;border:2px solid #f3cf68;
      font:900 9px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-shadow:none;box-shadow:0 2px 5px rgba(0,0,0,.22)
    }
    .sn-star-fallback.has-stars .sn-star-badge{display:grid}
    .sn-star-overlay{
      position:fixed;inset:0;z-index:12050;display:flex;align-items:flex-end;justify-content:center;
      background:rgba(2,25,18,.76);backdrop-filter:blur(6px);opacity:0;visibility:hidden;
      transition:opacity .2s ease,visibility .2s ease;
    }
    .sn-star-overlay.show{opacity:1;visibility:visible}
    .sn-star-panel{
      width:min(560px,100%);max-height:88dvh;overflow:auto;padding:15px 17px calc(24px + env(safe-area-inset-bottom));
      border-radius:29px 29px 0 0;background:linear-gradient(180deg,#fff4c9 0%,#eed69b 100%);color:#2c271e;
      border:4px solid #b7893e;border-bottom:0;box-shadow:0 -17px 42px rgba(0,0,0,.34);
      transform:translateY(18px);transition:transform .22s cubic-bezier(.2,.8,.2,1);
    }
    .sn-star-overlay.show .sn-star-panel{transform:translateY(0)}
    .sn-star-handle{width:48px;height:5px;border-radius:99px;background:#a88855;margin:0 auto 12px}
    .sn-star-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .sn-star-head h2{margin:0;color:#0d513f;font:1000 24px/1.05 system-ui,-apple-system,"Segoe UI",sans-serif}
    .sn-star-head p{margin:4px 0 0;color:#77613f;font-size:11px;font-weight:780}
    .sn-star-close{width:44px;height:44px;flex:0 0 44px;border:0;border-radius:14px;background:#68452c;color:white;font-size:25px;font-weight:900;box-shadow:0 4px 0 #452c1c}
    .sn-star-hero{
      margin:14px 0 12px;padding:17px;border-radius:22px;text-align:center;position:relative;overflow:hidden;
      background:radial-gradient(circle at 50% 15%,rgba(255,255,255,.75),transparent 29%),linear-gradient(145deg,#fff1a2,#f6bd42);
      border:3px solid #d39327;box-shadow:0 5px 0 #9b672a,0 10px 20px rgba(83,58,22,.17)
    }
    .sn-star-big{font-size:58px;line-height:1;filter:drop-shadow(0 4px 3px rgba(107,69,18,.23));animation:snStarFloat67 2.8s ease-in-out infinite}
    .sn-star-total{margin-top:4px;color:#16513f;font-size:15px;font-weight:900}
    .sn-star-total strong{display:block;margin-top:1px;font-size:42px;line-height:1;color:#684413}
    .sn-star-rule{margin:9px 0 0;font-size:11px;font-weight:800;color:#76521f}
    .sn-star-progress-card{padding:13px;border-radius:18px;background:#fff9e8;border:2px solid #cfb477}
    .sn-star-progress-top{display:flex;justify-content:space-between;gap:9px;align-items:end;font-size:11px;font-weight:900;color:#55442c}
    .sn-star-progress-top strong{color:#15523f;font-size:14px}
    .sn-star-track{height:10px;margin-top:9px;border-radius:99px;background:#d8ccb0;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.13)}
    .sn-star-fill{height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#2f8f57,#76be4e);transition:width .35s ease}
    .sn-star-levels{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}
    .sn-star-level{padding:9px 5px;border-radius:14px;text-align:center;background:#eadfc3;border:1px solid #cbb889;color:#7f6b4a;font-size:9px;font-weight:850;line-height:1.22}
    .sn-star-level b{display:block;font-size:21px;line-height:1.1;margin-bottom:3px;filter:grayscale(1);opacity:.52}
    .sn-star-level.done{background:#e6f1c8;border-color:#9ab66c;color:#31532c}.sn-star-level.done b{filter:none;opacity:1}
    .sn-star-action{width:100%;margin-top:12px;border:0;border-radius:16px;padding:14px 12px;background:linear-gradient(180deg,#17674d,#0b513d);color:#fff8e5;font-weight:950;box-shadow:0 4px 0 #073b2e;min-height:50px}
    .sn-star-note{margin:10px 3px 0;text-align:center;color:#806b49;font-size:10px;font-weight:750;line-height:1.35}
    @keyframes snStarTwinkle67{0%,100%{opacity:.72;transform:scale(.94) rotate(-2deg)}50%{opacity:1;transform:scale(1.08) rotate(2deg)}}
    @keyframes snStarFloat67{0%,100%{transform:translateY(1px) rotate(-3deg)}50%{transform:translateY(-5px) rotate(3deg)}}
    @media(max-width:390px){.sn-star-fallback{right:99px;top:16px;width:46px;height:46px;font-size:28px}.sn-star-levels{gap:5px}.sn-star-level{font-size:8px;padding:8px 3px}}
    @media(prefers-reduced-motion:reduce){.sn-star-fallback,.sn-star-big{animation:none!important}.sn-star-overlay,.sn-star-panel,.sn-star-fill{transition:none!important}}
  `;
  document.head.appendChild(style);
}

function findsCount67(){
  const passport=q67('#passportFinds');
  if(passport){
    const n=parseInt(String(passport.textContent||'').replace(/\D/g,''),10);
    if(Number.isFinite(n)) return n;
  }
  const list=q67('#findsList');
  if(!list) return 0;
  const rows=qa67('.listitem',list);
  if(rows.length===1&&/nog niets gevonden/i.test(rows[0].textContent||'')) return 0;
  return rows.length;
}

function rank67(count){
  if(count>=10) return {name:'Super Snazzler',from:10,to:10,next:'Alle badges verdiend!',progress:100};
  if(count>=5) return {name:'Avonturier',from:5,to:10,next:'Super Snazzler bij 10 sterren',progress:((count-5)/5)*100};
  if(count>=3) return {name:'Speurneus',from:3,to:5,next:'Avonturier bij 5 sterren',progress:((count-3)/2)*100};
  if(count>=1) return {name:'Explorer',from:1,to:3,next:'Speurneus bij 3 sterren',progress:((count-1)/2)*100};
  return {name:'Starter',from:0,to:1,next:'Explorer bij je eerste ster',progress:0};
}

function ensureOverlay67(){
  let overlay=q67('#snStarRewardsOverlay');
  if(overlay) return overlay;
  overlay=document.createElement('div');
  overlay.id='snStarRewardsOverlay';overlay.className='sn-star-overlay';overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`<section class="sn-star-panel" role="dialog" aria-modal="true" aria-labelledby="snStarTitle">
    <div class="sn-star-handle"></div>
    <div class="sn-star-head"><div><h2 id="snStarTitle">Mijn Snazzle Sterren</h2><p>Beloningen voor jouw buitenavonturen</p></div><button type="button" class="sn-star-close" id="snStarClose" aria-label="Sluiten">×</button></div>
    <div class="sn-star-hero"><div class="sn-star-big">⭐</div><div class="sn-star-total">Jij hebt<strong id="snStarCount">0</strong>Snazzle sterren</div><div class="sn-star-rule">Elke gevonden Snazzle levert 1 ster op.</div></div>
    <div class="sn-star-progress-card"><div class="sn-star-progress-top"><strong id="snStarRank">Starter</strong><span id="snStarNext">Explorer bij je eerste ster</span></div><div class="sn-star-track"><div class="sn-star-fill" id="snStarFill"></div></div><div class="sn-star-levels"><div class="sn-star-level" data-min="1"><b>⭐</b>Explorer<br>1 ster</div><div class="sn-star-level" data-min="3"><b>🧭</b>Speurneus<br>3 sterren</div><div class="sn-star-level" data-min="5"><b>🏕️</b>Avonturier<br>5 sterren</div><div class="sn-star-level" data-min="10"><b>👑</b>Super Snazzler<br>10 sterren</div></div></div>
    <button type="button" class="sn-star-action" id="snStarFinds">🏆 Bekijk mijn vondsten</button>
    <div class="sn-star-note">Blijf lekker buiten zoeken. Nieuwe vondsten worden automatisch bij je sterren opgeteld.</div>
  </section>`;
  document.body.appendChild(overlay);
  q67('#snStarClose',overlay).addEventListener('click',close67);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close67();});
  q67('#snStarFinds',overlay).addEventListener('click',()=>{
    close67();
    const sheet=q67('#findsSheet');
    if(sheet){sheet.classList.add('show');return;}
    const quick=qa67('[data-quick-action="findings"]')[0];
    quick?.click();
  });
  return overlay;
}

function render67(){
  const count=findsCount67(),r=rank67(count);
  const countEl=q67('#snStarCount'),rankEl=q67('#snStarRank'),nextEl=q67('#snStarNext'),fill=q67('#snStarFill');
  if(countEl)countEl.textContent=String(count);
  if(rankEl)rankEl.textContent=r.name;
  if(nextEl)nextEl.textContent=r.next;
  if(fill)fill.style.width=`${Math.max(0,Math.min(100,r.progress))}%`;
  qa67('.sn-star-level').forEach(el=>el.classList.toggle('done',count>=Number(el.dataset.min||0)));
  const fallback=q67('#snStarFallback');
  if(fallback){
    fallback.classList.toggle('has-stars',count>0);
    const badge=q67('.sn-star-badge',fallback);if(badge)badge.textContent=count>99?'99+':String(count);
  }
}

function open67(){
  const overlay=ensureOverlay67();render67();overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');
  setTimeout(()=>q67('#snStarClose',overlay)?.focus({preventScroll:true}),60);
}
function close67(){
  const overlay=q67('#snStarRewardsOverlay');if(!overlay)return;overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');
  setTimeout(()=>launcher67?.focus?.({preventScroll:true}),60);
}

function pseudoHasStar67(el){
  try{
    return ['::before','::after'].some(p=>/[✦✧★⭐✨]/.test(String(getComputedStyle(el,p).content||'').replace(/["']/g,'')));
  }catch{return false;}
}

function bindExistingStar67(){
  const top=q67('.top');if(!top)return false;
  const candidates=[...qa67('*',top),top];
  const owner=candidates.find(el=>pseudoHasStar67(el));
  if(!owner)return false;
  launcher67=owner;owner.classList.add('sn-star-clickable');owner.setAttribute('role','button');owner.setAttribute('tabindex','0');owner.setAttribute('aria-label','Open Mijn Snazzle Sterren');
  owner.addEventListener('click',e=>{
    if(owner===top&&e.target!==owner)return;
    if(e.target.closest?.('button')&&e.target.closest('button')!==owner)return;
    open67();
  });
  owner.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open67();}});
  return true;
}

function installFallbackStar67(){
  const top=q67('.top');if(!top||q67('#snStarFallback',top))return;
  const b=document.createElement('button');b.type='button';b.id='snStarFallback';b.className='sn-star-fallback';b.setAttribute('aria-label','Open Mijn Snazzle Sterren');b.innerHTML='<span aria-hidden="true">✦</span><small class="sn-star-badge">0</small>';
  b.addEventListener('click',open67);top.appendChild(b);launcher67=b;
}

function watchCount67(){
  const target=q67('#passportFinds')||q67('#findsList');
  if(!target||target.dataset.snStarWatch67==='1')return;
  target.dataset.snStarWatch67='1';
  countObserver67?.disconnect();countObserver67=new MutationObserver(render67);countObserver67.observe(target,{childList:true,subtree:true,characterData:true});
  render67();
}

function init67(){
  if(window.__snazzleStarRewardsV67)return;window.__snazzleStarRewardsV67=true;ensureStyles67();ensureOverlay67();
  if(!bindExistingStar67())installFallbackStar67();
  watchCount67();
  const obs=new MutationObserver(()=>{if(!launcher67){if(!bindExistingStar67())installFallbackStar67();}watchCount67();});
  obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&q67('#snStarRewardsOverlay')?.classList.contains('show'))close67();});
  console.info(`Snazzle sterren ${STAR_VERSION} geladen`);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init67,{once:true});else init67();
