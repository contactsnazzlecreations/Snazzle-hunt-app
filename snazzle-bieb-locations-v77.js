// Snazzle v77 — alleen bibliotheeklocaties in De Bieb.
// Deze module raakt GEEN menu-, navigatie-, opslag- of sluitlogica aan.

const VERSION='77.0.0';

const LOCATIONS=[
  {
    group:'Roerdalen',icon:'🏡',place:'Montfort',name:'Bieb in Dörpshoes Montfort',
    address:'Markt 14, 6065 AW Montfort',
    hours:'Openingstijden: kijk bij het Dörpshoes of de actuele lokale informatie.',
    note:'De bibliotheek in Montfort zit in het Dörpshoes. De oude locatie De Vaert 15 wordt hier bewust niet meer getoond.',
    route:'https://www.google.com/maps/search/?api=1&query=Markt+14+6065+AW+Montfort'
  },
  {
    group:'Roerdalen',icon:'📚',place:'Herkenbosch',name:'Open Bieb',
    address:'Bosscherhof 1, 6075 HE Herkenbosch',
    hours:'Woensdag 14.30 – 17.00 uur · vrijdag 14.30 – 17.00 uur',
    route:'https://www.google.com/maps/search/?api=1&query=Bosscherhof+1+6075+HE+Herkenbosch'
  },
  {
    group:'Roerdalen',icon:'📖',place:'Melick',name:'Aaj Bieb',
    address:'Markt 70, 6074 BB Melick',
    hours:'Vrijdag 14.00 – 15.00 uur',
    note:'Volgens Bibliorura is Melick geen afhaalpunt voor gereserveerde Bibliorura-boeken.',
    route:'https://www.google.com/maps/search/?api=1&query=Markt+70+6074+BB+Melick'
  },
  {
    group:'Roerdalen',icon:'📗',place:'Posterholt',name:'Bieb Postert',
    address:'Nieuw Holsterweg 27, 6061 EG Posterholt',
    hours:'Dinsdag 13.30 – 15.30 uur · donderdag 13.30 – 15.30 uur · laatste zaterdag van de maand 14.00 – 15.00 uur',
    route:'https://www.google.com/maps/search/?api=1&query=Nieuw+Holsterweg+27+6061+EG+Posterholt'
  },
  {
    group:'Roerdalen',icon:'📘',place:'Sint Odiliënberg',name:'Berger Bieb',
    address:'Schaapsweg 24, 6077 CG Sint Odiliënberg',
    hours:'Dinsdag 16.00 – 17.00 uur · donderdag 15.00 – 16.00 uur',
    route:'https://www.google.com/maps/search/?api=1&query=Schaapsweg+24+6077+CG+Sint+Odilienberg'
  },
  {
    group:'Roerdalen',icon:'📙',place:'Vlodrop',name:'Blokhutbib',
    address:'Koebroekweg 3, 6063 AS Vlodrop',
    hours:'Maandag 10.00 – 12.00 uur · woensdag 14.00 – 16.00 uur',
    route:'https://www.google.com/maps/search/?api=1&query=Koebroekweg+3+6063+AS+Vlodrop'
  },
  {
    group:'Dichtbij',icon:'📕',place:'Swalmen',name:'De Laeskamer',
    address:'Markt 3, 6071 JD Swalmen',
    hours:'Maandag 10.00 – 12.00 uur · dinsdag 14.00 – 16.00 uur · woensdag 10.00 – 12.00 uur · donderdag 14.00 – 16.00 uur',
    route:'https://www.google.com/maps/search/?api=1&query=Markt+3+6071+JD+Swalmen'
  },
  {
    group:'Dichtbij',icon:'🏛️',place:'Roermond',name:'Stadsbibliotheek Bibliorura',
    address:'Neerstraat 11-13, 6041 KA Roermond',
    hours:'Ma 13.00 – 18.00 · di 11.00 – 20.00 · wo-vr 11.00 – 18.00 · za 10.00 – 17.00 · zo 13.00 – 17.00',
    route:'https://www.google.com/maps/search/?api=1&query=Neerstraat+11-13+6041+KA+Roermond'
  },
  {
    group:'Dichtbij',icon:'📚',place:'Roermond',name:'Bibliotheek Donderberg',
    address:'Donderbergweg 34a, Roermond',
    hours:'Maandag 13.00 – 17.00 uur · woensdag 09.00 – 17.00 uur · vrijdag 13.00 – 17.00 uur',
    route:'https://www.google.com/maps/search/?api=1&query=Donderbergweg+34a+Roermond'
  }
];

function esc77(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function installStyles77(){
  if(document.getElementById('snBiebLocationsStyles77')) return;
  const style=document.createElement('style');
  style.id='snBiebLocationsStyles77';
  style.textContent=`
    #snBiebLocations77{contain:layout paint}
    .sn-bieb-loc-intro77{margin:0 0 10px;color:#dce8d5;font-size:11px;line-height:1.45;font-weight:760}
    .sn-bieb-loc-group77{margin:12px 2px 7px;color:#ffe185;font-size:12px;font-weight:1000;letter-spacing:.25px}
    .sn-bieb-loc-list77{display:grid;gap:8px}
    .sn-bieb-loc77{border:2px solid rgba(255,225,145,.29);border-radius:16px;background:rgba(255,255,255,.065);overflow:hidden}
    .sn-bieb-loc77 summary{list-style:none;display:grid;grid-template-columns:38px 1fr auto;gap:9px;align-items:center;padding:11px;cursor:pointer;touch-action:manipulation}
    .sn-bieb-loc77 summary::-webkit-details-marker{display:none}
    .sn-bieb-loc77 summary b{font-size:25px;text-align:center}
    .sn-bieb-loc77 summary strong{display:block;color:#ffe083;font-size:13px;line-height:1.2}
    .sn-bieb-loc77 summary span{display:block;color:#d8e7d0;font-size:10px;font-weight:760;margin-top:3px;line-height:1.3}
    .sn-bieb-loc77 summary i{font-style:normal;color:#ffd75e;font-size:18px}
    .sn-bieb-loc-body77{padding:0 12px 12px 58px;color:#eaf0df;font-size:11px;line-height:1.45}
    .sn-bieb-loc-body77 p{margin:5px 0}
    .sn-bieb-loc-note77{color:#bfd1b7;font-size:10px}
    .sn-bieb-loc-route77{display:inline-flex;align-items:center;gap:6px;margin-top:7px;padding:8px 11px;border-radius:11px;background:#f0c653;color:#342416!important;font-weight:950;text-decoration:none!important;touch-action:manipulation}
    .sn-bieb-loc-source77{margin-top:10px;color:#aeca9f;font-size:9px;line-height:1.45}
    .sn-bieb-loc-source77 a{color:#f5d36f;font-weight:900}
  `;
  document.head.appendChild(style);
}

function locationCard77(item){
  return `<details class="sn-bieb-loc77"><summary><b>${esc77(item.icon)}</b><div><strong>${esc77(item.place)} · ${esc77(item.name)}</strong><span>${esc77(item.address)}</span></div><i>⌄</i></summary><div class="sn-bieb-loc-body77"><p><strong>🕒 ${esc77(item.hours)}</strong></p>${item.note?`<p class="sn-bieb-loc-note77">${esc77(item.note)}</p>`:''}<a class="sn-bieb-loc-route77" href="${esc77(item.route)}" target="_blank" rel="noopener noreferrer">📍 Route bekijken</a></div></details>`;
}

function installLocations77(){
  installStyles77();
  const overlay=document.getElementById('snBiebOverlay73');
  if(!overlay) return false;
  if(document.getElementById('snBiebLocations77')) return true;

  const missionBlock=overlay.querySelector('.sn-bieb-missions');
  const anchor=missionBlock?.closest('.sn-bieb-section');
  if(!anchor) return false;

  const local=LOCATIONS.filter(x=>x.group==='Roerdalen').map(locationCard77).join('');
  const nearby=LOCATIONS.filter(x=>x.group==='Dichtbij').map(locationCard77).join('');
  const section=document.createElement('section');
  section.id='snBiebLocations77';
  section.className='sn-bieb-section';
  section.innerHTML=`
    <div class="sn-bieb-section-head"><h2>📍 Waar is een Bieb?</h2><small>Roerdalen & omgeving</small></div>
    <p class="sn-bieb-loc-intro77">Tik op een plaats voor het adres, de openingstijden en een route. Openingstijden kunnen veranderen.</p>
    <div class="sn-bieb-loc-group77">Gemeente Roerdalen</div>
    <div class="sn-bieb-loc-list77">${local}</div>
    <div class="sn-bieb-loc-group77">Ook dichtbij</div>
    <div class="sn-bieb-loc-list77">${nearby}</div>
    <div class="sn-bieb-loc-source77">De Roerdalen-locaties (behalve de actuele verhuizing van Montfort) en openingstijden zijn gebaseerd op Bibliorura. Montfort staat hier op de huidige locatie in het Dörpshoes, Markt 14. <a href="https://bibliorura.nl/service/afhaalpunten-vrijwilligersbibliotheken" target="_blank" rel="noopener noreferrer">Controleer actuele informatie</a>.</div>`;
  anchor.insertAdjacentElement('afterend',section);
  return true;
}

function init77(){
  if(installLocations77()){
    console.info(`Snazzle Bieb locations ${VERSION} geladen`);
    return;
  }
  const observer=new MutationObserver(()=>{
    if(installLocations77()) observer.disconnect();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),12000);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init77,{once:true});
else init77();

window.SnazzleBiebLocationsV77={install:installLocations77};
