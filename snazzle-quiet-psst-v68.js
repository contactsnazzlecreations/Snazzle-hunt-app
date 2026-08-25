// Snazzle v68 — rustigere 'Psst… tik mij!'-knop op mobiel.
// Doel: één duidelijke Snazzle, minder rand/schaduw en betere leesbaarheid zonder de bestaande klikactie te veranderen.

const V68='68.0.0';
const q68=(s,r=document)=>r.querySelector(s);
let timer68=null;

function ensureStyles68(){
  if(q68('#snazzleQuietPsstV68Styles')) return;
  const style=document.createElement('style');
  style.id='snazzleQuietPsstV68Styles';
  style.textContent=`
    .sn-quiet-psst-v68{
      min-height:70px!important;
      width:100%!important;
      max-width:100%!important;
      padding:9px 42px 9px 11px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
      gap:12px!important;
      position:relative!important;
      overflow:hidden!important;
      border:2px solid #9a6a37!important;
      border-radius:22px!important;
      background:#fff8e8!important;
      color:#2e241a!important;
      box-shadow:0 4px 12px rgba(66,45,25,.13)!important;
      text-shadow:none!important;
      font-size:16px!important;
      font-weight:850!important;
      line-height:1.2!important;
      letter-spacing:0!important;
      text-align:left!important;
      transform:none!important;
    }
    .sn-quiet-psst-v68::after{
      content:'›';
      position:absolute;
      right:15px;
      top:50%;
      transform:translateY(-52%);
      font-size:29px;
      line-height:1;
      font-weight:800;
      color:#8a6034;
      opacity:.9;
      pointer-events:none;
    }
    .sn-quiet-psst-v68 img.sn-quiet-psst-duck-v68{
      display:block!important;
      width:58px!important;
      height:58px!important;
      min-width:58px!important;
      max-width:58px!important;
      flex:0 0 58px!important;
      object-fit:cover!important;
      object-position:left center!important;
      border:0!important;
      border-radius:14px!important;
      box-shadow:none!important;
      filter:none!important;
      transform:none!important;
      margin:0!important;
      padding:0!important;
      background:transparent!important;
    }
    .sn-quiet-psst-v68 .sn-quiet-psst-hidden-v68{display:none!important}
    .sn-quiet-psst-v68 *{text-shadow:none!important}
    .sn-quiet-psst-v68:active{transform:scale(.985)!important}
    @media(max-width:380px){
      .sn-quiet-psst-v68{min-height:64px!important;padding:8px 38px 8px 9px!important;gap:9px!important;font-size:15px!important}
      .sn-quiet-psst-v68 img.sn-quiet-psst-duck-v68{width:52px!important;height:52px!important;min-width:52px!important;max-width:52px!important;flex-basis:52px!important}
    }
    @media(prefers-reduced-motion:reduce){.sn-quiet-psst-v68{transition:none!important}}
  `;
  document.head.appendChild(style);
}

function normalized68(text){
  return String(text||'').toLowerCase().replace(/…/g,'...').replace(/\s+/g,' ').trim();
}
function isTargetText68(text){
  const t=normalized68(text);
  return t.includes('psst') && (t.includes('tik mij') || t.includes('tik voor een hint'));
}
function replacePromptText68(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    if(!isTargetText68(node.nodeValue)) return;
    node.nodeValue=String(node.nodeValue).replace(/psst\s*(?:\.{3}|…)?\s*tik\s+mij!?/ig,'Psst… tik voor een hint!');
  });
}
function smallestTarget68(){
  const selectors='button,a,[role="button"],[onclick],[tabindex],.card,.tile,.launcher,.quick button';
  const candidates=[...document.querySelectorAll(selectors)]
    .filter(el=>!el.closest('#adminSheet,#adminLogin,.sn-magic-star-overlay'))
    .filter(el=>isTargetText68(el.textContent));
  if(candidates.length){
    return candidates.sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0];
  }
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    const node=walker.currentNode;
    if(!isTargetText68(node.nodeValue)) continue;
    const p=node.parentElement;
    if(!p || p.closest('#adminSheet,#adminLogin,.sn-magic-star-overlay')) continue;
    return p.closest('button,a,[role="button"],[onclick],[tabindex]') || p;
  }
  return null;
}
function apply68(){
  ensureStyles68();
  const target=smallestTarget68();
  if(!target) return false;
  target.classList.add('sn-quiet-psst-v68');
  replacePromptText68(target);
  const imgs=[...target.querySelectorAll('img')].filter(img=>!img.closest('[hidden]'));
  if(imgs.length){
    imgs[0].classList.add('sn-quiet-psst-duck-v68');
    imgs.slice(1).forEach(img=>img.classList.add('sn-quiet-psst-hidden-v68'));
  }
  target.querySelectorAll('svg').forEach((svg,i)=>{if(imgs.length || i>0) svg.classList.add('sn-quiet-psst-hidden-v68');});
  return true;
}
function queue68(){clearTimeout(timer68);timer68=setTimeout(apply68,90);}
function init68(){
  if(window.__snazzleQuietPsstV68) return;
  window.__snazzleQuietPsstV68=true;
  apply68();
  new MutationObserver(queue68).observe(document.body,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',()=>setTimeout(queue68,80),true);
  console.info(`Snazzle rustige Psst-knop ${V68} geladen`);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init68,{once:true}); else init68();
