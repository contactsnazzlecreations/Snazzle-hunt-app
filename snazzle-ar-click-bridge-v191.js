// Snazzle AR click bridge v191
// Zorgt dat de knop 'Plaats via kaart + camera' altijd rechtstreeks de actuele v184-studio opent.

const BUTTON_SELECTOR='#snArStudioLaunch184,.sn-ar-studio-launch184';
let opening=false;

async function openStudio191(){
  if(opening) return;
  opening=true;
  try{
    const api=window.SnazzleArPlaceStudioV184;
    if(api?.open){
      await api.open();
      return;
    }

    // De knop kan een fractie eerder zichtbaar zijn dan de module-export.
    for(let i=0;i<30;i++){
      await new Promise(r=>setTimeout(r,50));
      if(window.SnazzleArPlaceStudioV184?.open){
        await window.SnazzleArPlaceStudioV184.open();
        return;
      }
    }
    console.error('AR plaatsstudio v184 is niet beschikbaar.');
  }catch(err){
    console.error('AR plaatsstudio kon niet openen',err);
  }finally{
    opening=false;
  }
}

function isLaunchTarget191(target){
  return !!target?.closest?.(BUTTON_SELECTOR);
}

// Capture-fase: oude beheerlisteners kunnen deze klik dan niet wegvangen.
document.addEventListener('click',event=>{
  if(!isLaunchTarget191(event.target)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openStudio191();
},true);

// Pointer fallback voor Android/PWA wanneer een click-event niet wordt afgegeven.
document.addEventListener('pointerup',event=>{
  if(!isLaunchTarget191(event.target)) return;
  setTimeout(()=>{
    const modal=document.getElementById('snArStudioV184');
    if(!modal?.classList.contains('show')) openStudio191();
  },35);
},true);

window.SnazzleArClickBridgeV191={open:openStudio191};
console.info('Snazzle AR click bridge v191 geladen');