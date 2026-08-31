// Snazzle Cards v203 compatibility loader.
// De oude v133 rescue schreef bij iedere start opnieuw verouderde/kapotte imageData
// naar localStorage en Firestore. Dat was de reden dat gerepareerde kaarten later
// weer half, grijs of wit verschenen.
//
// Kaartrecords bestaan inmiddels centraal; vanaf nu doet deze legacy entrypoint
// alleen nog het bronherstel v203 laden. Er wordt hier niets meer opnieuw geseed.
const VERSION='203-legacy-rescue-disabled';

async function loadCurrentCardRepair(){
  try{
    await import(`./snazzle-card-force-restore-v134.js?fresh=${Date.now()}`);
    setTimeout(()=>window.SnazzleCardThumbFixV203?.repair?.(),30);
  }catch(err){
    console.error('Snazzle Cards v203 kon niet laden',err);
  }
}

window.SnazzleCardRestoreV133={version:VERSION,count:0,disabled:true};
loadCurrentCardRepair();
