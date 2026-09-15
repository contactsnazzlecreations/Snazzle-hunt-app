// Snazzle BLAZE v235 — metadata volgens definitieve 48-kaartenstructuur.
const VERSION='235.0-final-48';
const LOCAL_KEY='snazzleCardCatalogV2';
const DEFS=[
  ['S01-B01','Flame Runner','core'],['S01-B02','Ember Dash','core'],['S01-B03','Fire Jumper','core'],['S01-B04','Heat Rider','core'],
  ['S01-B05','Lava Leap','core'],['S01-B06','Spark Striker','core'],['S01-B07','Blazing Bolt','rare'],['S01-B08','Inferno Rush','rare'],
  ['S01-B09','Firestorm Fury','silver'],['S01-B10','Crimson Blaze','silver'],['S01-B11','Flame Guardian','gold'],['S01-B12','Blaze Master','platinum']
];
function readLocal(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function seed(){
  const before=readLocal();
  const byNo=new Map(before.map(c=>[String(c.number||'').toUpperCase(),c]));
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
  localStorage.setItem(LOCAL_KEY,JSON.stringify([...keep,...made]));
  window.__snazzleBlazePreseedV229={count:12,version:VERSION,at:now};
  window.dispatchEvent(new CustomEvent('snazzle:blaze-ready',{detail:{version:VERSION,count:12}}));
  return true;
}
seed();
window.SnazzleBlazeV229={version:VERSION,seed,repair:seed,defs:DEFS};
console.info(`Snazzle BLAZE ${VERSION} metadata geladen`);
