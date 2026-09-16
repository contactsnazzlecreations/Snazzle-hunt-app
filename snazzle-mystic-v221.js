// Snazzle MYSTIC v236 — artwork + definitieve rarity/event-structuur zonder herhaalde zware localStorage-writes.
const VERSION='236.0-smooth-seed';
const LOCAL_KEY='snazzleCardCatalogV2';
const ATLAS='./assets/cards/snazzle-mystic-atlas-v219.jpg?v=235';
const DEFS=[
  ['S01-M01','Moon Whisper','core'],
  ['S01-M02','Crystal Dream','core'],
  ['S01-M03','Mystic Glow','core'],
  ['S01-M04','Shadow Spell','core'],
  ['S01-M05','Star Oracle','core'],
  ['S01-M06','Dream Keeper','core'],
  ['S01-M07','Phantom Flash','rare'],
  ['S01-M08','Magic Mist','rare'],
  ['S01-M09','Lunar Legend','silver'],
  ['S01-M10','Secret Spirit','silver'],
  ['S01-M11','Mystic Guardian','gold'],
  ['S01-M12','Mystic Master','platinum']
];
let art=[];
let queued=false;
let seeded=false;
let lastRenderAt=0;

function readLocal(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function writeLocal(items){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(items));return true}catch(e){console.warn('MYSTIC localStorage',e);return false}}
function numberIndex(text){const m=String(text||'').toUpperCase().match(/S01-M(\d{2})/);if(!m)return-1;const i=Number(m[1])-1;return i>=0&&i<12?i:-1;}
function cardUiExists(){return !!document.querySelector('#collectionSheet,#sc2Grid,#sc2VaultGrid,#sc2List');}

function loadAtlas(){
  return new Promise((resolve,reject)=>{
    const im=new Image();im.decoding='async';
    im.onload=()=>{
      try{
        const cw=im.naturalWidth/4,ch=im.naturalHeight/3;
        art=DEFS.map((_,i)=>{
          const c=document.createElement('canvas');c.width=240;c.height=320;
          const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
          x.drawImage(im,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,240,320);
          return c.toDataURL('image/jpeg',.82);
        });
        resolve();
      }catch(e){reject(e)}
    };
    im.onerror=()=>reject(new Error('MYSTIC atlas kon niet laden'));
    im.src=ATLAS;
  });
}

function recordsCurrent(byNo){
  return DEFS.every(([number,name,rarity])=>{
    const old=byNo.get(number);
    return !!old&&old.number===number&&old.name===name&&old.rarity===rarity&&old.seriesKey==='mystic'&&old.structureVersion==='1.0.0'&&old.baseCollection===true&&old.active!==false&&!!old.imageData;
  });
}
function seedWithArtwork(){
  if(seeded)return true;
  const before=readLocal(),byNo=new Map(before.map(c=>[String(c.number||'').toUpperCase(),c]));
  if(recordsCurrent(byNo)){seeded=true;window.__snazzleMysticPreseedV226={count:12,images:12,version:VERSION,at:new Date().toISOString(),changed:false};return true;}
  if(art.length!==12)return false;
  const mysticNos=new Set(DEFS.map(x=>x[0]));
  const keep=before.filter(c=>!mysticNos.has(String(c.number||'').toUpperCase()));
  const now=new Date().toISOString();
  const made=DEFS.map(([number,name,rarity],i)=>{
    const old=byNo.get(number)||{};
    return {...old,id:old.id||`seed-mystic-${String(i+1).padStart(2,'0')}`,number,name,
      series:'MYSTIC Series 01',description:'Magie, maanlicht & mysterie',rarity,
      unlockType:'event',huntId:old.huntId||'',threshold:0,active:true,secretName:false,
      baseCollection:true,seriesKey:'mystic',structureVersion:'1.0.0',
      imageData:art[i],createdAt:old.createdAt||now,updatedAt:now};
  });
  if(!writeLocal([...keep,...made]))return false;
  seeded=true;
  window.__snazzleMysticPreseedV226={count:12,images:12,version:VERSION,at:now,changed:true};
  window.dispatchEvent(new CustomEvent('snazzle:mystic-ready',{detail:{version:VERSION,count:12}}));
  return true;
}

function paint(box,i,locked){
  if(!box||!art[i])return false;
  box.style.setProperty('position','relative','important');
  [...box.children].forEach(el=>{
    if(el.tagName==='DIV'&&!el.classList.contains('sn-mystic-v226-art')){
      const txt=(el.textContent||'').trim();
      if(txt==='🦆'||txt.includes('🦆'))el.style.setProperty('display','none','important');
    }
  });
  let img=box.querySelector(':scope > img.sn-mystic-v226-art');
  if(!img){img=document.createElement('img');img.className='sn-mystic-v226-art';box.appendChild(img)}
  if(img.src!==art[i])img.src=art[i];
  img.alt=DEFS[i][0];
  img.style.setProperty('position','absolute','important');img.style.setProperty('inset','0','important');
  img.style.setProperty('width','100%','important');img.style.setProperty('height','100%','important');
  img.style.setProperty('object-fit','cover','important');img.style.setProperty('display','block','important');
  img.style.setProperty('opacity','1','important');img.style.setProperty('visibility','visible','important');
  img.style.setProperty('z-index','80','important');img.style.setProperty('background','#17242e','important');
  if(locked){img.style.setProperty('filter','brightness(.12) saturate(.15) blur(1px)','important');img.style.setProperty('transform','scale(1.04)','important');}
  else{img.style.setProperty('filter','none','important');img.style.setProperty('transform','none','important');}
  return true;
}

function renderArtwork(){
  if(art.length!==12||!cardUiExists())return 0;
  let count=0;
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const i=numberIndex(card.querySelector('.sc2-num')?.textContent||card.textContent);if(i<0)return;
    const box=card.querySelector('.sc2-media'),locked=card.classList.contains('locked');
    if(paint(box,i,locked))count++;
    box?.querySelector('.sc2-lock')?.style.setProperty('z-index','90','important');
    box?.querySelector('.sc2-rarity')?.style.setProperty('z-index','91','important');
    box?.querySelector('.sc2-num')?.style.setProperty('z-index','91','important');
  });
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const i=numberIndex(row.querySelector('strong')?.textContent||row.textContent);if(i<0)return;
    if(paint(row.querySelector('.sc2-thumb'),i,false))count++;
  });
  lastRenderAt=performance.now();
  window.__snazzleMysticV226LastRender={count,at:new Date().toISOString()};
  return count;
}
function repair(){if(!seeded)seedWithArtwork();return renderArtwork()}
function queue(force=false){
  if(queued||!cardUiExists())return;
  const elapsed=performance.now()-lastRenderAt;
  if(!force&&elapsed<100){setTimeout(()=>queue(true),Math.ceil(100-elapsed));return;}
  queued=true;requestAnimationFrame(()=>{queued=false;try{repair()}catch(e){console.error('MYSTIC v236 repair',e)}});
}
function relevantMutation(m){
  const target=m.target instanceof Element?m.target:null;
  if(target?.closest?.('#collectionSheet,#sc2Grid,#sc2VaultGrid,#sc2List'))return true;
  return [...m.addedNodes].some(n=>n instanceof Element&&(n.matches?.('#collectionSheet,#sc2Grid,#sc2VaultGrid,#sc2List,.sc2-card,.sc2-row')||n.querySelector?.('#collectionSheet,#sc2Grid,#sc2VaultGrid,#sc2List,.sc2-card,.sc2-row')));
}

try{await loadAtlas();seedWithArtwork();}catch(e){console.error('MYSTIC v236 artwork kon niet vooraf worden geladen',e)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queue(true),{once:true});else queue(true);
new MutationObserver(ms=>{if(ms.some(relevantMutation))queue()}).observe(document.body,{subtree:true,childList:true});
document.addEventListener('click',e=>{
  if(!e.target.closest('#collectionSheet,[data-seriespick],[data-sc2f],[data-collection-tab]'))return;
  queue();setTimeout(()=>queue(true),260);
},{passive:true});
document.addEventListener('snazzle:admin-ui-ready',()=>queue());
document.addEventListener('snazzle:mystic-ready',()=>queue(true));
setTimeout(()=>queue(true),600);
setTimeout(()=>queue(true),1500);
window.SnazzleMysticV221={version:VERSION,seed:seedWithArtwork,repair,defs:DEFS};
console.info(`Snazzle MYSTIC ${VERSION} geladen`);
