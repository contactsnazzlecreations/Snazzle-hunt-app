// Snazzle v144.4 — Professor Kwak Leesmaatje.
// Veilige lokale reacties na een gelezen boek. Geen vrije chat en geen externe AI-call.
// De standaard browserstem is bewust uitgeschakeld; later kan hier een vaste neural Snazzle-stem komen.

const VERSION='144.4.0';
const $=(s,r=document)=>r.querySelector(s);
let pending=null;

function installStyles(){
  if($('#snBiebBuddyStyles144')) return;
  const style=document.createElement('style');
  style.id='snBiebBuddyStyles144';
  style.textContent=`
    .sn-bieb-buddy144{position:fixed;inset:0;z-index:7950;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(4,18,12,.84);overscroll-behavior:contain}
    .sn-bieb-buddy144.show{display:flex}
    .sn-bieb-buddy-card144{width:min(100%,420px);max-height:88vh;overflow:auto;border:4px solid #8b6235;border-radius:27px;padding:17px;background:linear-gradient(180deg,#fff1bd,#e8cb82);color:#352519;box-shadow:0 15px 42px rgba(0,0,0,.48);position:relative}
    .sn-bieb-buddy-top144{display:grid;grid-template-columns:68px 1fr 42px;gap:11px;align-items:center}
    .sn-bieb-buddy-avatar144{width:68px;height:68px;border:3px solid #7e5a32;border-radius:20px;background:#f7d75f;display:grid;place-items:center;font-size:42px;position:relative;box-shadow:0 4px 0 #8b6235}
    .sn-bieb-buddy-avatar144:after{content:'👓';position:absolute;font-size:29px;left:19px;top:15px}
    .sn-bieb-buddy-top144 small{display:block;font-size:9px;font-weight:1000;letter-spacing:1px;text-transform:uppercase;color:#806038}.sn-bieb-buddy-top144 h2{margin:2px 0 0;font-size:21px;line-height:1.05}
    .sn-bieb-buddy-close144{width:42px;height:42px;border:0;border-radius:13px;background:#704a2f;color:#fff;font-size:23px;font-weight:1000}
    .sn-bieb-buddy-say144{margin-top:14px;padding:14px;border-radius:17px;background:#fff9e5;border:2px solid #cba35c;font-size:14px;line-height:1.48;font-weight:820}
    .sn-bieb-buddy-mission144{margin-top:10px;padding:13px;border-radius:17px;background:linear-gradient(135deg,#315f43,#244a35);color:#fff;border:2px solid #6f955e;box-shadow:0 4px 0 #173a29}
    .sn-bieb-buddy-mission144 small{display:block;color:#f5d979;font-size:9px;font-weight:1000;text-transform:uppercase;letter-spacing:.8px}.sn-bieb-buddy-mission144 strong{display:block;margin-top:4px;font-size:14px;line-height:1.38}
    .sn-bieb-buddy-actions144{display:grid;grid-template-columns:1fr;gap:8px;margin-top:12px}.sn-bieb-buddy-actions144 button{min-height:47px;border:0;border-radius:13px;font-weight:1000;font-size:11px}.sn-bieb-buddy-next144{background:#4f8d4c;color:#fff;box-shadow:0 3px 0 #32632f}
    .sn-bieb-buddy-library144{width:100%;min-height:46px;margin-top:8px;border:2px solid #a87838;border-radius:13px;background:#f3c951;color:#382819;font-weight:1000;font-size:11px;box-shadow:0 3px 0 #a16a2f}
    .sn-bieb-buddy-note144{margin:9px 2px 0;font-size:9px;line-height:1.35;color:#765d3e;font-weight:740;text-align:center}
    @media(max-width:380px){.sn-bieb-buddy-card144{padding:14px}.sn-bieb-buddy-top144{grid-template-columns:58px 1fr 40px}.sn-bieb-buddy-avatar144{width:58px;height:58px;font-size:36px}.sn-bieb-buddy-avatar144:after{font-size:25px;left:16px;top:12px}}
  `;
  document.head.appendChild(style);
}

function ensureUI(){
  installStyles();
  if($('#snBiebBuddy144')) return;
  const overlay=document.createElement('div');
  overlay.id='snBiebBuddy144';
  overlay.className='sn-bieb-buddy144';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`
    <section class="sn-bieb-buddy-card144" role="dialog" aria-modal="true" aria-labelledby="snBiebBuddyTitle144">
      <div class="sn-bieb-buddy-top144">
        <div class="sn-bieb-buddy-avatar144">🦆</div>
        <div><small>Snazzle Leesmaatje</small><h2 id="snBiebBuddyTitle144">Professor Kwak zegt…</h2></div>
        <button class="sn-bieb-buddy-close144" id="snBiebBuddyClose144" type="button" aria-label="Leesmaatje sluiten">×</button>
      </div>
      <div class="sn-bieb-buddy-say144" id="snBiebBuddySay144" aria-live="polite"></div>
      <div class="sn-bieb-buddy-mission144"><small>Jouw volgende missie</small><strong id="snBiebBuddyMission144"></strong></div>
      <div class="sn-bieb-buddy-actions144"><button class="sn-bieb-buddy-next144" id="snBiebBuddyDone144" type="button">👍 Missie onthouden</button></div>
      <button class="sn-bieb-buddy-library144" id="snBiebBuddyLibrary144" type="button">📍 Zoek een Bieb dichtbij</button>
      <div class="sn-bieb-buddy-note144">Geen toets en geen chat — gewoon een vrolijk zetje om verder te lezen en eens naar de echte Bieb te gaan.</div>
    </section>`;
  document.body.appendChild(overlay);
  $('#snBiebBuddyClose144').addEventListener('click',closeBuddy);
  $('#snBiebBuddyDone144').addEventListener('click',closeBuddy);
  $('#snBiebBuddyLibrary144').addEventListener('click',openNearbyLibrary);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeBuddy();});
}

function bookFlavor(book){
  const text=`${book?.title||''} ${book?.reaction||''}`.toLocaleLowerCase('nl-NL');
  const groups=[
    {keys:['spannend','spanning','eng','griezel','mysterie','avontuur'],label:'spannende avonturen'},
    {keys:['grappig','lachen','lach','humor','gek'],label:'grappige verhalen'},
    {keys:['dier','hond','kat','paard','eend','wolf','beer'],label:'verhalen met dieren'},
    {keys:['magie','magisch','toven','draak','fantasie','fantasy'],label:'magische verhalen'},
    {keys:['voetbal','sport','wedstrijd'],label:'sportverhalen'},
    {keys:['vriend','vriendin','samen','familie'],label:'verhalen over vrienden en familie'}
  ];
  return groups.find(group=>group.keys.some(key=>text.includes(key)))?.label||'verhalen die jou verrassen';
}

function buildReaction(book,total){
  const rating=Math.max(1,Math.min(5,Number(book?.rating)||3));
  const flavor=bookFlavor(book);
  const first=rating>=5?'Vijf sterren! Dat boek was duidelijk een schot in de roos. 🌟':rating===4?'Vier sterren! Daar heb je zo te zien behoorlijk van genoten. 📚':rating===3?'Drie sterren. Mooi dat je het hebt uitgelezen en zelf hebt bedacht wat je ervan vond. 👍':'Niet ieder boek hoeft je favoriet te zijn. Juist daardoor ontdek je steeds beter wat jij wél graag leest. 🦆';
  const second=`Ik krijg het idee dat ${flavor} best goed bij jou kunnen passen.`;
  let mission='Ga bij je volgende bezoek aan de Bieb op zoek naar een boek dat je normaal niet meteen zou pakken.';
  if(total===1) mission='Maak van boek nummer 2 een echte Bieb-keuze: loop eens langs de kasten en kies alleen op de kaft.';
  else if(total%5===0) mission='Vraag iemand in de Bieb om één boek aan te raden dat je zelf nooit gekozen zou hebben.';
  else if(total%3===0) mission=`Zoek in de Bieb een ander boek met ${flavor}. Kun je er eentje vinden dat nóg beter scoort?`;
  else if(rating<=2) mission='Ga naar de Bieb en kies iets totaal anders dan dit boek. Misschien ontdek je zo jouw favoriete soort verhaal.';
  else if(rating>=4) mission=`Zoek in de Bieb nog een boek met ${flavor}, maar van een andere schrijver.`;
  return {say:`${first} ${second}`,mission};
}

function closeBuddy(){
  const overlay=$('#snBiebBuddy144');if(!overlay)return;
  overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');pending=null;
}
function showBuddy(detail){
  if(!detail?.book) return;
  if(window.SnazzleBiebSettingsV144?.get?.().showBuddy===false) return;
  ensureUI();pending={book:{title:String(detail.book.title||'').slice(0,80),reaction:String(detail.book.reaction||'').slice(0,180),rating:Number(detail.book.rating)||3},total:Math.max(1,Number(detail.total)||1)};
  const content=buildReaction(pending.book,pending.total);
  $('#snBiebBuddySay144').textContent=content.say;$('#snBiebBuddyMission144').textContent=content.mission;
  const overlay=$('#snBiebBuddy144');overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');$('#snBiebBuddyDone144')?.focus();
}
function showAfterReward(detail){
  const reward=$('#snBiebReward73');
  if(!reward?.classList.contains('show')){setTimeout(()=>showBuddy(detail),380);return;}
  const observer=new MutationObserver(()=>{if(!reward.classList.contains('show')){observer.disconnect();setTimeout(()=>showBuddy(detail),240);}});
  observer.observe(reward,{attributes:true,attributeFilter:['class']});setTimeout(()=>observer.disconnect(),120000);
}
function openNearbyLibrary(){
  closeBuddy();try{window.SnazzleBiebV73?.open?.();}catch{}
  setTimeout(()=>{const near=$('[data-bieb-action="near"]');if(near){near.click();return;}const locations=$('#snBiebLocations77');if(locations){locations.hidden=false;locations.scrollIntoView({behavior:'smooth',block:'start'});}},120);
}

document.addEventListener('snazzle:bieb-book-added',event=>showAfterReward(event.detail));
document.addEventListener('snazzle:bieb-settings',event=>{if(event.detail?.showBuddy===false)closeBuddy();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#snBiebBuddy144')?.classList.contains('show'))closeBuddy();});
ensureUI();
window.SnazzleBiebLeesmaatjeV144={show:showBuddy};
console.info(`Snazzle Leesmaatje ${VERSION} geladen`);