// Snazzle BLAZE v228 — 12 kaarten met artwork, vooraf geladen vóór het kaartensysteem.
const VERSION='228.0';
const LOCAL_KEY='snazzleCardCatalogV2';
const ATLAS='./assets/cards/snazzle-blaze-atlas-v228.jpg?v=228';
const DEFS=[
  ['S01-B01','Flame Runner','core'],
  ['S01-B02','Ember Dash','core'],
  ['S01-B03','Fire Jumper','core'],
  ['S01-B04','Heat Rider','core'],
  ['S01-B05','Lava Leap','core'],
  ['S01-B06','Spark Striker','core'],
  ['S01-B07','Blazing Bolt','core'],
  ['S01-B08','Inferno Rush','core'],
  ['S01-B09','Firestorm Fury','rare'],
  ['S01-B10','Crimson Blaze','rare'],
  ['S01-B11','Flame Guardian','gold'],
  ['S01-B12','Blaze Master','platinum']
];
let art=[];
let queued=false;

function readLocal(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function writeLocal(items){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(items));return true}catch(e){console.warn('BLAZE localStorage',e);return false}}
function numberIndex(text){const m=String(text||'').toUpperCase().match(/S01-B(\d{2})/);if(!m)return-1;const i=Number(m[1])-1;return i>=0&&i<12?i:-1;}

function loadAtlas(){
  return new Promise((resolve,reject)=>{
    const im=new Image();im.decoding='async';
    im.onload=()=>{
      try{
        const cw=im.naturalWidth/4,ch=im.naturalHeight/3;
        art=DEFS.map((_,i)=>{
          const c=document.createElement('canvas');c.width=360;c.height=540;
          const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
          x.fillStyle='#160d08';x.fillRect(0,0,c.width,c.height);
          x.drawImage(im,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,360,540);
          return c.toDataURL('image/jpeg',.86);
        });
        resolve();
      }catch(e){reject(e)}
    };
    im.onerror=()=>reject(new Error('BLAZE atlas kon niet laden'));
    im.src=ATLAS;
  });
}

function seedWithArtwork(){
  if(art.length!==12)return false;
  const before=readLocal(),byNo=new Map(before.map(c=>[String(c.number||'').toUpperCase(),c]));
  const nos=new Set(DEFS.map(x=>x[0]));
  const keep=before.filter(c=>!nos.has(String(c.number||'').toUpperCase()));
  const now=new Date().toISOString();
  const made=DEFS.map(([number,name,rarity],i)=>{
    const old=byNo.get(number)||{};
    return {...old,id:old.id||`seed-blaze-${String(i+1).padStart(2,'0')}`,number,name,
      series:'BLAZE Series 01',description:'Vuur, snelheid & lef',rarity,
      unlockType:'milestone',huntId:'',threshold:i+1,active:true,secretName:false,
      imageData:art[i],createdAt:old.createdAt||now,updatedAt:now};
  });
  writeLocal([...keep,...made]);
  window.__snazzleBlazePreseedV228={count:12,images:12,version:VERSION,at:now};
  window.dispatchEvent(new CustomEvent('snazzle:blaze-ready',{detail:{version:VERSION,count:12}}));
  return true;
}

function paint(box,i,locked,isAdmin=false){
  if(!box||!art[i])return false;
  box.style.setProperty('position','relative','important');
  if(!isAdmin)box.style.setProperty('aspect-ratio','2 / 3','important');
  [...box.children].forEach(el=>{
    if(el.tagName==='DIV'&&!el.classList.contains('sn-blaze-v228-art')){
      const txt=(el.textContent||'').trim();
      if(txt==='🦆'||txt.includes('🦆'))el.style.setProperty('display','none','important');
    }
  });
  let img=box.querySelector(':scope > img.sn-blaze-v228-art');
  if(!img){img=document.createElement('img');img.className='sn-blaze-v228-art';box.appendChild(img)}
  if(img.src!==art[i])img.src=art[i];
  img.alt=DEFS[i][0];
  img.style.setProperty('position','absolute','important');
  img.style.setProperty('inset','0','important');
  img.style.setProperty('width','100%','important');
  img.style.setProperty('height','100%','important');
  img.style.setProperty('object-fit',isAdmin?'contain':'cover','important');
  img.style.setProperty('display','block','important');
  img.style.setProperty('opacity','1','important');
  img.style.setProperty('visibility','visible','important');
  img.style.setProperty('z-index','80','important');
  img.style.setProperty('background','#160d08','important');
  if(locked){
    img.style.setProperty('filter','brightness(.12) saturate(.15) blur(1px)','important');
    img.style.setProperty('transform','scale(1.04)','important');
  }else{
    img.style.setProperty('filter','none','important');
    img.style.setProperty('transform','none','important');
  }
  return true;
}

function renderArtwork(){
  if(art.length!==12)return 0;
  let count=0;
  document.querySelectorAll('#sc2Grid .sc2-card,#sc2VaultGrid .sc2-card').forEach(card=>{
    const i=numberIndex(card.querySelector('.sc2-num')?.textContent||card.textContent);if(i<0)return;
    card.dataset.seriesV228='BLAZE';
    const box=card.querySelector('.sc2-media'),locked=card.classList.contains('locked');
    if(paint(box,i,locked,false))count++;
    box?.querySelector('.sc2-lock')?.style.setProperty('z-index','90','important');
    box?.querySelector('.sc2-rarity')?.style.setProperty('z-index','91','important');
    box?.querySelector('.sc2-num')?.style.setProperty('z-index','91','important');
  });
  document.querySelectorAll('#sc2List .sc2-row').forEach(row=>{
    const i=numberIndex(row.querySelector('strong')?.textContent||row.textContent);if(i<0)return;
    row.dataset.seriesV228='BLAZE';
    if(paint(row.querySelector('.sc2-thumb'),i,false,true))count++;
  });
  window.__snazzleBlazeV228LastRender={count,at:new Date().toISOString()};
  return count;
}
function repair(){seedWithArtwork();return renderArtwork()}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{repair()}catch(e){console.error('BLAZE v228 repair',e)}})}

try{await loadAtlas();seedWithArtwork();}catch(e){console.error('BLAZE v228 artwork kon niet vooraf worden geladen',e)}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))queue()}).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',e=>{if(e.target.closest('#collectionSheet,#adminSheet,[data-seriespick],[data-sc2f],[data-tab],[data-collection-tab]'))[0,60,180,400,900].forEach(ms=>setTimeout(queue,ms))},{passive:true});
document.addEventListener('snazzle:admin-ui-ready',queue);
document.addEventListener('snazzle:blaze-ready',queue);
[0,100,250,600,1200,2400,5000,9000].forEach(ms=>setTimeout(queue,ms));
window.SnazzleBlazeV228={version:VERSION,seed:seedWithArtwork,repair,defs:DEFS};
console.info(`Snazzle BLAZE ${VERSION} geladen`);
