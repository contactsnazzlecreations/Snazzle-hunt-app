// Snazzle BLAZE v236 — metadata volgens definitieve 48-kaartenstructuur, zonder herhaalde localStorage-writes.
const VERSION='236.0-idempotent';
const LOCAL_KEY='snazzleCardCatalogV2';
const DEFS=[
  ['S01-B01','Flame Runner','core'],['S01-B02','Ember Dash','core'],['S01-B03','Fire Jumper','core'],['S01-B04','Heat Rider','core'],
  ['S01-B05','Lava Leap','core'],['S01-B06','Spark Striker','core'],['S01-B07','Blazing Bolt','rare'],['S01-B08','Inferno Rush','rare'],
  ['S01-B09','Firestorm Fury','silver'],['S01-B10','Crimson Blaze','silver'],['S01-B11','Flame Guardian','gold'],['S01-B12','Blaze Master','platinum']
];
let seeded=false;

function readLocal(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function isCurrent(old,number,name,rarity,i){
  return !!old&&old.number===number&&old.name===name&&old.rarity===rarity&&old.seriesKey==='blaze'&&old.structureVersion==='1.0.0'&&old.challengeId===`blaze-${String(i+1).padStart(2,'0')}`&&old.baseCollection===true&&old.active!==false;
}
function seed(){
  const before=readLocal();
  const byNo=new Map(before.map(c=>[String(c.number||'').toUpperCase(),c]));
  const alreadyCurrent=DEFS.every(([number,name,rarity],i)=>isCurrent(byNo.get(number),number,name,rarity,i));
  if(alreadyCurrent){seeded=true;window.__snazzleBlazePreseedV229={count:12,version:VERSION,at:new Date().toISOString(),changed:false};return true;}

  const nums=new Set(DEFS.map(d=>d[0]));
  const keep=before.filter(c=>!nums.has(String(c.number||'').toUpperCase()));
  const now=new Date().toISOString();
  const made=DEFS.map(([number,name,rarity],i)=>{
    const old=byNo.get(number)||{};
    return {...old,id:old.id||`seed-blaze-${String(i+1).padStart(2,'0')}`,number,name,
      series:'BLAZE Series 01',description:'Vuur, snelheid & lef',rarity,
      unlockType:'challenge',challengeId:`blaze-${String(i+1).padStart(2,'0')}`,huntId:'',threshold:0,
      active:true,secretName:false,baseCollection:true,seriesKey:'blaze',structureVersion:'1.0.0',
      imageData:old.imageData||'',createdAt:old.createdAt||now,updatedAt:now};
  });
  try{localStorage.setItem(LOCAL_KEY,JSON.stringify([...keep,...made]));}catch(err){console.warn('BLAZE localStorage',err);return false;}
  seeded=true;
  window.__snazzleBlazePreseedV229={count:12,version:VERSION,at:now,changed:true};
  window.dispatchEvent(new CustomEvent('snazzle:blaze-ready',{detail:{version:VERSION,count:12}}));
  return true;
}
function repair(){if(seeded)return true;return seed();}
seed();
window.SnazzleBlazeV229={version:VERSION,seed,repair,defs:DEFS};
console.info(`Snazzle BLAZE ${VERSION} metadata geladen`);
