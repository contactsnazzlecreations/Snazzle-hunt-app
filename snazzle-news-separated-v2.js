// Definitieve Snazzle Nieuws startkaart: afbeelding en tekst fysiek gescheiden.
(function(){
 const ID='sn-news-separated-v2';
 if(document.getElementById(ID))return;
 const style=document.createElement('style');style.id=ID;
 style.textContent=`
 .home-card.sn-news-launch-card{height:242px!important;min-height:242px!important;overflow:hidden!important;border-radius:22px!important}
 .home-card.sn-news-launch-card #snNewsLaunch{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:145px minmax(0,1fr)!important;align-items:stretch!important;justify-content:stretch!important;gap:0!important;padding:0!important;background:#fff8e8!important;text-align:left!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
 #snNewsLaunch .sn-news-picture-v2{display:block!important;position:relative!important;grid-row:1!important;width:100%!important;height:145px!important;overflow:hidden!important;z-index:1!important;background:linear-gradient(135deg,#c9e4bb,#8fbf95)!important}
 #snNewsLaunch .sn-news-picture-v2 img{display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;opacity:1!important;filter:none!important;transform:none!important}
 #snNewsLaunch .sn-news-copy-v2{grid-row:2!important;display:flex!important;flex-direction:column!important;justify-content:center!important;min-width:0!important;position:relative!important;z-index:3!important;padding:11px 54px 12px 16px!important;background:#fff8e8!important;color:#264a34!important}
 #snNewsLaunch .sn-news-copy-v2 strong{display:block!important;font-size:22px!important;line-height:1.12!important;color:#264a34!important;text-shadow:none!important;letter-spacing:0!important}
 #snNewsLaunch .sn-news-copy-v2 small{display:block!important;font-size:12px!important;line-height:1.3!important;margin-top:5px!important;color:#526557!important;font-weight:650!important;text-shadow:none!important;overflow-wrap:anywhere!important}
 #snNewsLaunch .sn-news-arrow-v2{position:absolute!important;right:13px!important;bottom:28px!important;z-index:5!important;display:grid!important;place-items:center!important;width:32px!important;height:32px!important;border-radius:50%!important;background:#357e48!important;color:white!important;font-size:26px!important;line-height:1!important}
#snNewsLaunch{background-image:none!important;background-color:#fff8e8!important;background-size:auto!important} \n #snNewsLaunch>.sn-news-custom-bg-v49,#snNewsLaunch>.sn-news-custom-shade-v49,#snNewsLaunch>.sn-news-launch-icon,#snNewsLaunch>.sn-news-launch-arrow{display:none!important}
 @media(max-width:350px){#snNewsLaunch .sn-news-copy-v2 strong{font-size:19px!important}#snNewsLaunch .sn-news-copy-v2 small{font-size:11px!important}}
 `;
 document.head.appendChild(style);
 function fix(){
  const button=document.getElementById('snNewsLaunch');if(!button)return;
  if(!button.querySelector('.sn-news-picture-v2')){
   const picture=document.createElement('span');picture.className='sn-news-picture-v2';
   const img=document.createElement('img');img.alt='';img.setAttribute('aria-hidden','true');picture.appendChild(img);
   const copy=document.createElement('span');copy.className='sn-news-copy-v2';
   const title=document.createElement('strong');title.textContent='Snazzle Nieuws';
   const subtitle=document.createElement('small');subtitle.textContent='Nieuws, avonturen en leuke weetjes uit Roerdalen';
   copy.append(title,subtitle);
   const arrow=document.createElement('span');arrow.className='sn-news-arrow-v2';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
   button.append(picture,copy,arrow);
  }
  // Verwijder uitsluitend de oude presentatiespans; laat de afbeelding voor synchronisatie staan.
  [...button.children].forEach(node=>{
    if(node.matches?.('.sn-news-launch-icon,.sn-news-launch-arrow'))node.remove();
    else if(node.tagName==='SPAN' && !node.matches('.sn-news-picture-v2,.sn-news-copy-v2,.sn-news-arrow-v2,.sn-news-custom-shade-v49'))node.remove();
  });
  const target=button.querySelector('.sn-news-picture-v2 img');
  const original=button.querySelector(':scope > .sn-news-custom-bg-v49');
  if(original?.getAttribute('src') && target.getAttribute('src')!==original.getAttribute('src'))target.src=original.src;
  else if(!target.getAttribute('src')){
   const bg=getComputedStyle(button).backgroundImage;
   const match=bg.match(/url\\(["']?(.*?)["']?\\)/);
   if(match?.[1])target.src=match[1];
  }
 }
 fix();
 document.addEventListener('snazzle:home-ui-ready',fix);
 const obs=new MutationObserver(()=>{const b=document.getElementById('snNewsLaunch');if(b && !b.querySelector('.sn-news-picture-v2'))fix();});
 if(document.body)obs.observe(document.body,{childList:true,subtree:true});
 let checks=0;const t=setInterval(()=>{fix();if(++checks>=35)clearInterval(t)},400);
 document.addEventListener('snazzle:visual-asset-changed',()=>setTimeout(fix,150));
 window.SnazzleNewsSeparatedV2={refresh:fix};
})();