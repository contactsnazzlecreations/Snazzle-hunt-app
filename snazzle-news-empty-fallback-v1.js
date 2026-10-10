// Fallback voor lege nieuwsfeed. Geen netwerkverzoek of AI-call bij openen.
(()=>{
 const items=[
 ['snazzle','🎃 Snazzle','Snazzlween 2026 is uitverkocht!','Op zaterdag 31 oktober van 18.00 tot 20.30 uur verandert Kasteel Montfort in een spannend Snazzle-avontuur voor kinderen van 5 tot en met 12 jaar. De beschikbare kaarten zijn inmiddels uitverkocht.','https://www.hartvanlimburg.nl/nl/evenement/snazzlween-2026-bij-kasteel-montfort'],
 ['snazzle','🦆 Snazzle','Snazzle Hunt Halloween komt naar Melick','Samen met KVW Melick organiseert Snazzle op zondag 1 november vanaf 12.00 uur een Halloween Hunt in Melick. Een nieuw avontuur om samen naar buiten te gaan.','https://nuactueel.nl/melick/2026-11-01/snazzle-hunt-halloween-ism-kvw-melick'],
 ['snazzle','📺 Snazzle in de media','Snazzle kreeg aandacht bij Omroep Roerstreek','In het programma Wo höbbe veer ’t euver van OR6 werd in januari 2026 aandacht besteed aan de Snazzle-zoekacties in Montfort en de plannen voor andere dorpen.','https://www.or6.nl/index.php/lokaalnieuws/or6-nieuws/whvte-25-januari-2026'],
 ['roerdalen','📍 Roerdalen','Snazzlween op de regionale evenementenagenda','VVV Hart van Limburg heeft Snazzlween opgenomen in de evenementenagenda, met informatie over het programma bij Kasteel Montfort.','https://www.hartvanlimburg.nl/nl/evenement/snazzlween-2026-bij-kasteel-montfort'],
 ['eenden','🦆 Eendenlol','Wist je dit van eenden?','Eenden verzorgen hun veren met vet uit een speciale klier, zodat water er gemakkelijker vanaf glijdt.',''],
 ['buiten','🌳 Buiten-tip','Samen op ontdekkingstocht','Maak een wandeling door je eigen dorp en zoek onderweg drie verschillende bladeren en een bijzondere vogel.',''],
 ['weetje','💡 Wist je dat?','Snazzle verbindt dorpen','In Roerdalen liggen zes dorpen: Montfort, Melick, Herkenbosch, Posterholt, Sint Odiliënberg en Vlodrop.','']
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
  selected.forEach(([key,label,title,body,url])=>{
   const card=document.createElement('article');card.style.cssText='background:#fff;border:1px solid #e8deef;border-radius:20px;padding:18px;box-shadow:0 5px 18px #3c285014';
   const badge=document.createElement('div');badge.style.cssText='font-size:13px;color:#6c5487;font-weight:700;margin-bottom:9px';badge.textContent=label+' · Snazzle weetje';
   const heading=document.createElement('h3');heading.style.cssText='font-size:20px;color:#49346d;margin:0 0 9px';heading.textContent=title;
   const p=document.createElement('p');p.style.cssText='font-size:15px;line-height:1.5;color:#514b5b;margin:0';p.textContent=body;
   card.append(badge,heading,p);if(url){const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Bekijk de bron ↗';link.style.cssText='display:inline-block;margin-top:12px;color:#56418a;font-weight:750;text-decoration:underline';card.append(link)}wrapper.append(card);
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