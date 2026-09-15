// Snazzle MYSTIC v225 — zet de 12 kaarten inclusief echte artwork klaar vóór het kaartensysteem.
// Geen aparte DOM-overlay meer: MYSTIC gebruikt nu exact dezelfde img + locked-blur als de andere kaarten.
const VERSION='225.0-native-card-image';
const LOCAL_KEY='snazzleCardCatalogV2';
const ATLAS='./assets/cards/snazzle-mystic-atlas-v219.jpg?v=225';
const DEFS=[
  ['S01-M01','Moon Whisper','core'],
  ['S01-M02','Crystal Dream','core'],
  ['S01-M03','Mystic Glow','core'],
  ['S01-M04','Shadow Spell','core'],
  ['S01-M05','Star Oracle','core'],
  ['S01-M06','Dream Keeper','core'],
  ['S01-M07','Phantom Flash','core'],
  ['S01-M08','Magic Mist','core'],
  ['S01-M09','Lunar Legend','rare'],
  ['S01-M10','Secret Spirit','rare'],
  ['S01-M11','Mystic Guardian','gold'],
  ['S01-M12','Mystic Master','platinum']
];
let art=[];

function readLocal(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function writeLocal(items){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(items));return true}catch(e){console.warn('MYSTIC localStorage',e);return false}}

function loadAtlas(){
  return new Promise((resolve,reject)=>{
    const im=new Image();im.decoding='async';
    im.onload=()=>{
      try{
        const cw=im.naturalWidth/4,ch=im.naturalHeight/3;
        art=DEFS.map((_,i)=>{
          const c=document.createElement('canvas');c.width=240;c.height=320;
          const x=c.getContext('2d');
          x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
          x.drawImage(im,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,240,320);
          return c.toDataURL('image/jpeg',.84);
        });
        resolve();
      }catch(e){reject(e)}
    };
    im.onerror=reject;im.src=ATLAS;
  });
}

function seedWithArtwork(){
  if(art.length!==12)return false;
  const before=readLocal();
  const byNo=new Map(before.map(c=>[String(c.number||'').toUpperCase(),c]));
  const mysticNos=new Set(DEFS.map(x=>x[0]));
  const keep=before.filter(c=>!mysticNos.has(String(c.number||'').toUpperCase()));
  const now=new Date().toISOString();
  const made=DEFS.map(([number,name,rarity],i)=>{
    const old=byNo.get(number)||{};
    return {
      ...old,
      id:old.id||`seed-mystic-${String(i+1).padStart(2,'0')}`,
      number,name,series:'MYSTIC Series 01',description:'Magie, maanlicht & mysterie',rarity,
      unlockType:'milestone',huntId:'',threshold:i+1,active:true,secretName:false,
      imageData:art[i],createdAt:old.createdAt||now,updatedAt:now
    };
  });
  const ok=writeLocal([...keep,...made]);
  window.__snazzleMysticPreseedV221={count:12,images:12,version:VERSION,at:now};
  document.dispatchEvent(new CustomEvent('snazzle:mystic-preseeded',{detail:{version:VERSION,count:12,images:12}}));
  return ok;
}

// Dit is bewust top-level await: app.js wacht hierop voordat snazzle-card-system-v2.js wordt geladen.
// Daardoor bevat cardHTML vanaf de allereerste render al een echte <img> voor MYSTIC.
try{
  await loadAtlas();
  seedWithArtwork();
}catch(e){
  console.error('MYSTIC v225 artwork kon niet vooraf worden geladen',e);
}

function repair(){
  const ok=seedWithArtwork();
  document.dispatchEvent(new CustomEvent('snazzle:mystic-ready',{detail:{version:VERSION,count:12,images:art.length}}));
  return ok;
}
window.SnazzleMysticV221={version:VERSION,seed:seedWithArtwork,repair,defs:DEFS};
console.info(`Snazzle MYSTIC ${VERSION} geladen`);
