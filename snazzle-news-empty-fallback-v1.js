// Fallback voor lege nieuwsfeed. Geen netwerkverzoek of AI-call bij openen.
(()=>{
 const items=[
 ['snazzle','✨ Snazzle','Samen op Snazzle-avontuur','Ga samen naar buiten, kijk goed om je heen en ontdek hoeveel leuke plekken er in je eigen dorp zijn.'],
 ['roerdalen','📍 Roerdalen','Zes dorpen om te ontdekken','Montfort, Melick, Herkenbosch, Posterholt, Sint Odiliënberg en Vlodrop hebben allemaal bijzondere plekjes.'],
 ['eenden','🦆 Eendenlol','Wist je dit van eenden?','Eenden verzorgen hun veren met vet uit een speciale klier, zodat water er gemakkelijker vanaf glijdt.'],
 ['buiten','🌳 Buiten-tip','Een kleine speurtocht in je buurt','Zoek tijdens een wandeling drie verschillende bladeren, een bijzondere steen en een vogel.'],
 ['weetje','💡 Wist je dat?','Ontdek de natuur dichtbij','Zelfs een korte wandeling kan vol ontdekkingen zitten. Kijk eens hoeveel soorten vogels je hoort.']
 ];
 let active='all';
 function update(){
  const overlay=document.getElementById('snNewsOverlay');
  const root=document.getElementById('snNewsContent');
  if(!overlay||!root||!overlay.classList.contains('show'))return;
  const empty=root.querySelector('.sn-news-empty');
  const fallback=root.querySelector('[data-sn-news-fallback]');
  if(!empty&&!fallback)return;
  const selected=items.filter(x=>active==='all'||x[0]===active);
  const wrapper=document.createElement('div');wrapper.dataset.snNewsFallback='true';
  wrapper.style.cssText='display:grid;gap:14px;padding:2px 0 25px';
  selected.forEach(([key,label,title,body])=>{
   const card=document.createElement('article');card.style.cssText='background:#fff;border:1px solid #e8deef;border-radius:20px;padding:18px;box-shadow:0 5px 18px #3c285014';
   const badge=document.createElement('div');badge.style.cssText='font-size:13px;color:#6c5487;font-weight:700;margin-bottom:9px';badge.textContent=label+' · Snazzle weetje';
   const heading=document.createElement('h3');heading.style.cssText='font-size:20px;color:#49346d;margin:0 0 9px';heading.textContent=title;
   const p=document.createElement('p');p.style.cssText='font-size:15px;line-height:1.5;color:#514b5b;margin:0';p.textContent=body;
   card.append(badge,heading,p);wrapper.append(card);
  });
  root.replaceChildren(wrapper);
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-news-filter]');
  if(b){active=b.dataset.newsFilter||'all';setTimeout(update,80)}
  else if(e.target.closest?.('#snNewsLaunch,[data-open-news],.sn-news-launch')){active='all';setTimeout(update,180)}
 },true);
 const observer=new MutationObserver(()=>{if(document.getElementById('snNewsOverlay')?.classList.contains('show')){if(document.querySelector('#snNewsContent .sn-news-empty'))update()}});
 function start(){observer.observe(document.body,{subtree:true,childList:true});setTimeout(update,100)}
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();