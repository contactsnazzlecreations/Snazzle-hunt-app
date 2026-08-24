// v40.1 — maakt Treffpunten als duidelijke vijfde Beheer-tab zichtbaar.
const q401=(s,r=document)=>r.querySelector(s);
let t401=null;
function wire401(){
  const tabs=q401('#adminSheet .super-only .tabs');
  const section=q401('#v40MeetupsAdmin');
  if(!tabs||!section)return false;
  let btn=q401('#v40MeetupsTab',tabs);
  if(!btn){
    btn=document.createElement('button');
    btn.id='v40MeetupsTab';
    btn.type='button';
    btn.textContent='Treffpunten';
    tabs.appendChild(btn);
  }
  if(!btn.dataset.bound401){
    btn.dataset.bound401='1';
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      [...tabs.querySelectorAll('button')].forEach(x=>x.classList.remove('on'));
      [...q401('#adminSheet .super-only').querySelectorAll('.admin-section')].forEach(x=>x.classList.remove('on'));
      btn.classList.add('on');section.classList.add('on');
      section.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
  tabs.style.gridTemplateColumns='repeat(5,1fr)';
  return true;
}
function queue401(){clearTimeout(t401);t401=setTimeout(wire401,100);}
function init401(){
  if(window.__snazzleSamenBuitenV401)return;window.__snazzleSamenBuitenV401=true;
  wire401();
  new MutationObserver(queue401).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('.admin,[data-tab]'))setTimeout(wire401,100);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init401,{once:true});else init401();
