// Snazzle Magic Unlock — toont direct na een centraal bevestigde vondst
// een verzamelkaart en eventuele Snazzle Nest-mijlpaal.
import { getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { getFirestore, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const app=getApps().length?getApp():null;
const auth=app?getAuth(app):null;
const db=app?getFirestore(app):null;
let user=null, hunts=[], primed=false;
const milestones=new Map([[3,'🥚 Mysterie-ei'],[5,'🌙 Moonlight Snazzle'],[10,'💎 Prisma Snazzle'],[15,'👑 Crownkeeper Snazzle']]);

function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function when(h){const v=h.foundAt||h.start||h.createdAt||h.updatedAt;if(typeof v?.toDate==='function')return v.toDate();const d=new Date(v||0);return Number.isNaN(d.getTime())?new Date(0):d;}
function year(h){return when(h).getFullYear();}
function mine(){const y=new Date().getFullYear();return hunts.filter(h=>h.found===true&&h.foundByUserId===user?.uid&&year(h)===y).sort((a,b)=>when(b)-when(a));}
function cardSvg(h){
  const themes=[['#39b96c','#0b5735','#ffd84b','JUNGLE'],['#6555d9','#25165d','#78dbff','STERREN'],['#ec7a31','#842a20','#ffd05a','VUUR'],['#54758e','#263745','#f1c74e','RIDDER'],['#c68b30','#684018','#ffe261','SCHAT'],['#68cae7','#216c94','#f7f2ce','IJS']];
  const t=themes[hash(h.id||h.title)%themes.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t[0]}"/><stop offset="1" stop-color="${t[1]}"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="14" stdDeviation="13" flood-opacity=".35"/></filter></defs><rect width="800" height="800" rx="70" fill="url(#g)"/><g fill="#fff3a2"><path d="M120 165 l15 34 37 4-28 25 8 36-32-18-33 18 8-36-28-25 38-4z"/><path d="M690 210 l11 25 27 3-20 18 6 27-24-14-24 14 6-27-21-18 28-3z"/></g><g filter="url(#s)"><ellipse cx="355" cy="505" rx="235" ry="175" fill="${t[2]}" stroke="#65401f" stroke-width="17"/><circle cx="545" cy="315" r="125" fill="${t[2]}" stroke="#65401f" stroke-width="17"/><path d="M645 306 780 360 645 419 Q600 360 645 306Z" fill="#ff8938" stroke="#65401f" stroke-width="14"/><circle cx="582" cy="282" r="16" fill="#14251b"/><circle cx="588" cy="277" r="5" fill="#fff"/><path d="M265 493 Q365 387 485 482 Q425 610 300 596 Q245 550 265 493Z" fill="#fff0a0" stroke="#65401f" stroke-width="13"/></g><text x="400" y="710" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="900" fill="#fff8dd" stroke="#54321c" stroke-width="2">${t[3]} SNAZZLE</text><text x="400" y="758" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="800" fill="#fff8dd">NIEUWE VERZAMELKAART</text></svg>`;
}
function url(svg){return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;}
function ensureUi(){
  if(document.getElementById('snazzleUnlockModal'))return;
  const style=document.createElement('style');style.textContent=`#snazzleUnlockModal{position:fixed;inset:0;z-index:7000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,14,8,.9);backdrop-filter:blur(7px)}#snazzleUnlockModal.show{display:flex}.sum-card{width:min(92vw,430px);text-align:center;padding:20px 17px;border-radius:27px;background:radial-gradient(circle at 50% 0,#fff9b9,#ffd24e 55%,#ee9c35);border:4px solid #75461f;color:#4a2f0d;box-shadow:0 20px 60px rgba(0,0,0,.58);position:relative;overflow:hidden}.sum-card:before,.sum-card:after{content:'✨';position:absolute;font-size:42px;animation:sumSpark 1.7s ease-in-out infinite}.sum-card:before{left:12px;top:20px}.sum-card:after{right:12px;top:48px;animation-delay:.45s}.sum-kicker{font-size:11px;font-weight:1000;letter-spacing:1.35px;color:#76501c}.sum-img{width:min(70vw,275px);aspect-ratio:1;margin:10px auto;border-radius:22px;overflow:hidden;border:4px solid #70431f;background:#173725;box-shadow:0 7px 0 #8c5721,0 12px 25px rgba(0,0,0,.2)}.sum-img img{width:100%;height:100%;object-fit:cover;display:block}.sum-card h2{font-size:27px;margin:10px 0 5px}.sum-card p{font-weight:850;line-height:1.4;margin:6px 0}.sum-bonus{display:none;margin:10px 0 2px;padding:10px;border-radius:14px;background:#e4f4b8;border:2px solid #78a54a;font-weight:1000;color:#3e5c26}.sum-bonus.show{display:block}.sum-card button{margin-top:12px;border:0;border-radius:14px;padding:12px 17px;background:#4b9337;color:#fff;font-weight:1000;box-shadow:0 4px 0 #306825}@keyframes sumSpark{0%,100%{transform:scale(.85) rotate(-8deg);opacity:.5}50%{transform:scale(1.2) rotate(8deg);opacity:1}}@media(prefers-reduced-motion:reduce){.sum-card:before,.sum-card:after{animation:none}}`;document.head.appendChild(style);
  const modal=document.createElement('div');modal.id='snazzleUnlockModal';modal.innerHTML='<div class="sum-card"><div class="sum-kicker">✨ MAGISCHE VONDST ✨</div><div class="sum-img"><img id="sumUnlockImg" alt="Nieuwe Snazzle verzamelkaart"></div><h2 id="sumUnlockTitle">Nieuwe Snazzle!</h2><p id="sumUnlockText"></p><div class="sum-bonus" id="sumUnlockBonus"></div><button type="button" id="sumUnlockOpen">Naar mijn Snazzle Wereld ✨</button></div>';document.body.appendChild(modal);
  document.getElementById('sumUnlockOpen').onclick=()=>{modal.classList.remove('show');document.getElementById('collectionHomeCard')?.click();};
}
function seenKey(h){return `snazzleCollectibleSeen:${user.uid}:${h.id}`;}
function prime(){if(!user)return;mine().forEach(h=>localStorage.setItem(seenKey(h),'1'));primed=true;}
function check(){
  if(!user)return;
  if(!primed){prime();return;}
  const wins=mine();const fresh=wins.find(h=>localStorage.getItem(seenKey(h))!=='1');if(!fresh)return;
  localStorage.setItem(seenKey(fresh),'1');ensureUi();
  document.getElementById('sumUnlockImg').src=url(cardSvg(fresh));
  document.getElementById('sumUnlockTitle').textContent='Nieuwe verzamel-Snazzle ontgrendeld!';
  document.getElementById('sumUnlockText').textContent=`Je vond ${fresh.title||'de Snazzle'}. Deze speciale Snazzle staat nu op jouw persoonlijke spaarkaart.`;
  const reward=milestones.get(wins.length),bonus=document.getElementById('sumUnlockBonus');
  if(reward){bonus.textContent=`🎁 NEST-BONUS ONTGRENDELD: ${reward}!`;bonus.classList.add('show');}else bonus.classList.remove('show');
  document.getElementById('snazzleUnlockModal').classList.add('show');
}
function init(){if(!auth||!db)return;ensureUi();onAuthStateChanged(auth,u=>{user=u||null;primed=false;if(hunts.length)check();});onSnapshot(collection(db,'hunts'),snap=>{hunts=snap.docs.map(d=>({id:d.id,...d.data()}));check();},e=>console.warn('Snazzle unlock',e));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
