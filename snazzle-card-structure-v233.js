// Snazzle Cards v234 — canonieke structuur voor de 48 basiskaarten.
// Dit bestand is de vaste bron voor series, rarities, verdienmechanismen en beloningen.

export const CARD_STRUCTURE_VERSION='1.0.0';
export const BASE_COLLECTION_SIZE=48;
export const SERIES_SIZE=12;

export const RARITY_BY_POSITION={
  1:'core',2:'core',3:'core',4:'core',5:'core',6:'core',
  7:'rare',8:'rare',9:'silver',10:'silver',11:'gold',12:'platinum'
};

export const BLAZE_CHALLENGES=[
  {id:'blaze-01',label:'Eerste vonk',minHunts:1,minAr:0},
  {id:'blaze-02',label:'Dubbele sprint',minHunts:2,minAr:0},
  {id:'blaze-03',label:'AR-ontsteking',minHunts:0,minAr:1},
  {id:'blaze-04',label:'Hete reeks',minHunts:4,minAr:0},
  {id:'blaze-05',label:'Dubbele AR-vangst',minHunts:0,minAr:2},
  {id:'blaze-06',label:'Zes op rij',minHunts:6,minAr:0},
  {id:'blaze-07',label:'Drievoudige AR',minHunts:0,minAr:3},
  {id:'blaze-08',label:'Acht Hunts',minHunts:8,minAr:0},
  {id:'blaze-09',label:'Vier AR-vangsten',minHunts:0,minAr:4},
  {id:'blaze-10',label:'Tien Hunts',minHunts:10,minAr:0},
  {id:'blaze-11',label:'Vuurproef',minHunts:10,minAr:5},
  {id:'blaze-12',label:'Blaze Master',minHunts:12,minAr:6}
];

const makeSeries=(key,prefix,label,icon,earnType,names)=>({
  key,prefix,label,icon,earnType,size:SERIES_SIZE,
  cards:names.map((name,i)=>({
    index:i+1,
    number:`S01-${prefix}${String(i+1).padStart(2,'0')}`,
    name,
    rarity:RARITY_BY_POSITION[i+1],
    ...(key==='blaze'?{challengeId:BLAZE_CHALLENGES[i].id,challenge:BLAZE_CHALLENGES[i]}:{})
  }))
});

export const SERIES={
  wild:makeSeries('wild','W','WILD','🌿','ar',[
    'Trail Blazer','Jungle Jax','Mud Runner','Storm Scout','Boulder Buddy','Night Tracker',
    'River Rush','Forest Flash','Thunder Trek','Shadow Scout','Wild Guardian','Alpha Snazzle'
  ]),
  spark:makeSeries('spark','S','SPARK','✨','hunt',[
    'Star Sprinkle','Moon Glow','Dream Dancer','Crystal Pop','Bubble Bloom','Glitter Glide',
    'Comet Dash','Rainbow Rush','Starlight Hug','Aurora Whirl','Sparkle Sprout','Nova Shine'
  ]),
  mystic:makeSeries('mystic','M','MYSTIC','🔮','event',[
    'Moon Whisper','Crystal Dream','Mystic Glow','Shadow Spell','Star Oracle','Dream Keeper',
    'Phantom Flash','Magic Mist','Lunar Legend','Secret Spirit','Mystic Guardian','Mystic Master'
  ]),
  blaze:makeSeries('blaze','B','BLAZE','🔥','challenge',[
    'Flame Runner','Ember Dash','Fire Jumper','Heat Rider','Lava Leap','Spark Striker',
    'Blazing Bolt','Inferno Rush','Firestorm Fury','Crimson Blaze','Flame Guardian','Blaze Master'
  ])
};

export const BASE_CARDS=Object.values(SERIES).flatMap(s=>s.cards.map(c=>({
  ...c,seriesKey:s.key,series:`${s.label} Series 01`,earnType:s.earnType
})));

export const REWARDS={
  halfSeries:{at:6,idTemplate:'series_<seriesKey>_6',kind:'series_half_badge',label:'Halverwege-badge'},
  fullSeries:{at:12,idTemplate:'series_<seriesKey>_12',kind:'series_master',label:'Series Master',vaultKey:true},
  masterCollector:{at:48,id:'master_collector_48',kind:'master_collector',label:'Snazzle Master Collector',profileFrame:true,vaultCard:true}
};

export const PERMANENT_UNLOCK_SCHEMA={
  collection:'userCardUnlocks',
  idTemplate:'<uid>_<cardNumber>',
  requiredFields:['userId','cardNumber','seriesKey','unlockedAt','sourceType','sourceId','structureVersion'],
  immutableForPlayer:true,
  serverAwardOnly:true
};

export function rarityForPosition(position){return RARITY_BY_POSITION[Number(position)]||'core';}
export function seriesForCardNumber(number){
  const n=String(number||'').toUpperCase();
  return Object.values(SERIES).find(s=>n.startsWith(`S01-${s.prefix}`))||null;
}
export function cardDefinition(number){
  const n=String(number||'').toUpperCase();
  return BASE_CARDS.find(c=>c.number===n)||null;
}

window.SnazzleCardStructureV233={
  version:CARD_STRUCTURE_VERSION,
  baseCollectionSize:BASE_COLLECTION_SIZE,
  seriesSize:SERIES_SIZE,
  rarityByPosition:RARITY_BY_POSITION,
  blazeChallenges:BLAZE_CHALLENGES,
  series:SERIES,
  cards:BASE_CARDS,
  rewards:REWARDS,
  permanentUnlock:PERMANENT_UNLOCK_SCHEMA,
  rarityForPosition,seriesForCardNumber,cardDefinition
};

console.info(`Snazzle Cards structuur ${CARD_STRUCTURE_VERSION}: ${BASE_CARDS.length} basiskaarten vastgelegd`);
