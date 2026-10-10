// Snazzle Nieuws: gecontroleerde AI-concepten voor bestaande nieuwsbeheer.
(function(){
 if(window.SnazzleNewsDraftImportV1)return;
 const MAX=12;
 const clean=v=>String(v??'').trim();
 const validUrl=u=>{try{const x=new URL(u);return ['https:','http:'].includes(x.protocol)?x.href:''}catch{return ''}};
 function parse(raw){
  const data=JSON.parse(raw);
  const list=Array.isArray(data)?data:(Array.isArray(data.berichten)?data.berichten:[]);
  if(!list.length||list.length>MAX)throw Error('Gebruik 1 tot 12 nieuwsberichten.');
  return list.map((v,i)=>{
   const title=clean(v.titel||v.title).slice(0,120),body=clean(v.tekst||v.body).slice(0,540);
   const source=validUrl(clean(v.bron||v.url));
   if(!title||!body||!source)throw Error('Bericht '+(i+1)+' mist titel, tekst of geldige bronlink.');
   const cat=clean(v.categorie||v.category).toLowerCase();
   return {title,body:body+'\\nBron: '+source,category:['snazzle','roerdalen','eenden','buiten','weetje'].includes(cat)?cat:'snazzle',source};
  });
 }
 let pending=[];
 function mount(){
  const host=document.getElementById('newsAdmin47');
  if(!host||document.getElementById('snNewsAiDraftV1'))return;
  const panel=document.createElement('section');panel.id='snNewsAiDraftV1';
  panel.style.cssText='margin:14px 0;padding:15px;border:1px solid #d9c6e9;border-radius:16px;background:#fffaf0;color:#36294b';
  const h=document.createElement('h4');h.textContent='✨ AI-nieuwsconcepten controleren';
  const p=document.createElement('p');p.textContent='Plak gecontroleerde nieuwsvoorstellen als JSON. De app zoekt niet zelf online. Ieder bericht wordt apart geopend als ongepubliceerd concept; controleer bron, datum en inhoud voordat je publiceert.';
  const area=document.createElement('textarea');area.rows=7;area.style.cssText='width:100%;box-sizing:border-box;border-radius:10px;padding:10px';area.placeholder='[{"titel":"Nieuwe Snazzle Hunt","tekst":"Korte, gecontroleerde tekst","bron":"https://voorbeeld.nl/bericht","categorie":"snazzle"}]';
  const action=document.createElement('button');action.type='button';action.textContent='Concepten controleren';action.style.cssText='margin-top:9px;padding:12px;border-radius:10px;background:#57418b;color:white;border:0;font-weight:bold';
  const status=document.createElement('p');status.setAttribute('role','status');
  const next=document.createElement('button');next.type='button';next.textContent='Volgend concept';next.hidden=true;next.style.cssText=action.style.cssText;
  function load(){
   if(!pending.length){status.textContent='Alle concepten verwerkt. Publiceer uitsluitend na controle.';next.hidden=true;return;}
   const item=pending.shift();
   document.getElementById('snNewsNewItem')?.click();
   const title=document.getElementById('snNewsTitle47'),body=document.getElementById('snNewsBody47'),cat=document.getElementById('snNewsCategory47'),pub=document.getElementById('snNewsPublished47'),type=document.getElementById('snNewsType47');
   if(!title||!body||!pub){status.textContent='Nieuwsformulier niet beschikbaar.';return;}
   if(type)type.value='card';
   title.value=item.title;body.value=item.body;if(cat)cat.value=item.category;pub.checked=false;
   status.textContent='Concept geopend, niet gepubliceerd. Controleer en sla het op voordat je verdergaat. Nog '+pending.length+' in de wachtrij.';
   next.hidden=!pending.length;
  }
  action.onclick=()=>{try{pending=parse(area.value);load()}catch(e){status.textContent=e.message}};
  next.onclick=()=>{if(confirm('Heb je het vorige concept opgeslagen of bewust overgeslagen?'))load()};
  panel.append(h,p,area,action,next,status);
  host.insertBefore(panel,host.querySelector('#snNewsAdminList47'));
 }
 const observer=new MutationObserver(()=>{if(document.getElementById('newsAdmin47')&&!document.getElementById('snNewsAiDraftV1'))mount()});
 function start(){mount();observer.observe(document.body,{childList:true,subtree:true})}
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
 window.SnazzleNewsDraftImportV1={parse};
})();