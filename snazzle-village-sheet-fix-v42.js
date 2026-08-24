// Snazzle Hunt v42 — robuuste mobiele bediening voor dorpsvenster.
// Vangt taps in capture-phase op zodat latere overlays/handlers de X en 'Gebruik dit dorp' niet kunnen blokkeren.

const qs42=(s,r=document)=>r.querySelector(s);

function closeVillage42(){
  const sheet=qs42('#villageSheet');
  if(!sheet) return;
  sheet.classList.remove('show');
  sheet.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow='';
  document.body.style.overflow='';
}

function useVillage42(){
  const sheet=qs42('#villageSheet');
  const title=(qs42('#villageSheetTitle')?.textContent||'').replace(/^📍\s*/,'').trim();
  if(title){
    localStorage.setItem('snazzleVillage',title);
    const chosen=qs42('#chosenVillageLabel');
    if(chosen) chosen.textContent='📍 '+title;
    qs42('#villages')?.querySelectorAll('.village').forEach(b=>{
      const name=(b.textContent||'').replace(/^📍\s*/,'').trim();
      b.classList.toggle('active',name===title);
    });
  }
  closeVillage42();
  window.setTimeout(()=>{
    const hunt=qs42('.hunt');
    if(hunt) hunt.scrollIntoView({behavior:'smooth',block:'start'});
  },80);
}

function bindVillageFix42(){
  if(document.documentElement.dataset.v42VillageFix==='1') return;
  document.documentElement.dataset.v42VillageFix='1';

  // Capture click before any later bubbling handler can swallow it.
  document.addEventListener('click',e=>{
    const close=e.target.closest?.('#villageSheet [data-close="villageSheet"], #villageSheet .close');
    if(close){
      e.preventDefault();
      e.stopImmediatePropagation();
      closeVillage42();
      return;
    }
    const use=e.target.closest?.('#useVillageBtn');
    if(use){
      e.preventDefault();
      e.stopImmediatePropagation();
      useVillage42();
      return;
    }
    const sheet=e.target.closest?.('#villageSheet');
    if(sheet && e.target===sheet){
      e.preventDefault();
      closeVillage42();
    }
  },true);

  // Extra bescherming tegen onbedoeld 'dode' controls door overlays.
  const style=document.createElement('style');
  style.id='v42VillageFixStyles';
  style.textContent=`
    #villageSheet .close,#useVillageBtn{position:relative!important;z-index:25!important;pointer-events:auto!important;touch-action:manipulation!important}
    #villageSheet .panel{position:relative!important;pointer-events:auto!important}
    #villageSheet.show{pointer-events:auto!important}
  `;
  document.head.appendChild(style);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bindVillageFix42,{once:true});
else bindVillageFix42();

console.info('Snazzle village controls v42 geladen');
