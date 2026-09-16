// Snazzle AR dorpselectie v242 — uitsluitend relevante keuzes.
// Houdt de lijst schoon, ook wanneer oudere code de villages-collectie later opnieuw inlaadt.

const SELECT_ID='snArAdminVillage85';
const OPTIONS=[
  {value:'Algemeen',label:'🌍 Algemeen / overal'},
  {value:'Montfort',label:'Montfort'},
  {value:'Posterholt',label:'Posterholt'},
  {value:'Sint Odiliënberg',label:'Sint Odiliënberg'}
];

let selectObserver=null;
let observedSelect=null;
let bodyObserver=null;
let repairing=false;

function isAlreadyClean(select){
  const opts=[...select.options];
  if(opts.length!==OPTIONS.length)return false;
  return OPTIONS.every((wanted,i)=>opts[i]?.value===wanted.value&&opts[i]?.textContent===wanted.label);
}

function renderCleanSelect(select=document.getElementById(SELECT_ID)){
  if(!select||repairing)return false;
  if(isAlreadyClean(select))return true;

  repairing=true;
  try{
    const previous=select.value;
    const fragment=document.createDocumentFragment();
    for(const item of OPTIONS){
      const option=document.createElement('option');
      option.value=item.value;
      option.textContent=item.label;
      fragment.appendChild(option);
    }
    select.replaceChildren(fragment);

    const valid=OPTIONS.some(x=>x.value===previous);
    select.value=valid?previous:'Montfort';
    select.dataset.snazzleVillageSelector='v242';

    const field=select.closest('.field');
    if(field){
      let help=field.querySelector('.sn-ar-village-v242-help');
      if(!help){
        help=document.createElement('small');
        help.className='sn-ar-village-v242-help';
        help.style.cssText='display:block;margin-top:6px;font-weight:800;line-height:1.35;color:#6b5438';
        field.appendChild(help);
      }
      help.textContent='Algemeen / overal gebruik je voor een AR-Snazzle buiten de vaste dorpen.';
    }
    return true;
  }finally{
    repairing=false;
  }
}

function observeSelect(){
  const select=document.getElementById(SELECT_ID);
  if(!select)return false;
  renderCleanSelect(select);
  if(observedSelect!==select){
    selectObserver?.disconnect();
    observedSelect=select;
    selectObserver=new MutationObserver(()=>queueMicrotask(()=>renderCleanSelect(select)));
    selectObserver.observe(select,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['value']});
  }
  return true;
}

function install(){
  observeSelect();
  if(!bodyObserver&&document.body){
    bodyObserver=new MutationObserver(()=>observeSelect());
    bodyObserver.observe(document.body,{childList:true,subtree:true});
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();

// Oudere AR-code vult de lijst asynchroon; controleer daarom ook na de bekende laadmomenten.
[0,80,200,500,900,1500,2500,4000,7000,12000].forEach(ms=>setTimeout(observeSelect,ms));
document.addEventListener('snazzle:admin-ui-ready',()=>setTimeout(observeSelect,0));
document.addEventListener('pointerdown',e=>{if(e.target?.closest?.('#snArAdminVillage85,#snArAdminTab85'))observeSelect();},true);
document.addEventListener('focusin',e=>{if(e.target?.id===SELECT_ID)observeSelect();},true);

window.SnazzleArVillageSelectV242={repair:observeSelect,options:OPTIONS.map(x=>({...x}))};
