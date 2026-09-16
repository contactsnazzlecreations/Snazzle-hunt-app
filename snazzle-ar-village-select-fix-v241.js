// Snazzle AR dorpselectie v241 — toon alleen echte dorpen + Algemeen / overal.
// Interne assets in de villages-collectie (zoals __snazzle_visual_...) horen nooit in deze keuzelijst.

const SELECT_ID='snArAdminVillage85';
const GENERAL_VALUE='Algemeen';
const GENERAL_LABEL='🌍 Algemeen / overal';
let selectObserver=null;
let bodyObserver=null;
let repairing=false;

function isInternalVillage(value,label){
  const text=String(value||label||'').trim();
  if(!text)return true;
  return /^__/.test(text)
    || /^snazzle[_-](?:visual|main|public|internal|asset)/i.test(text)
    || /^\[SYSTEEM\]/i.test(text)
    || text==='snazzle-internal';
}

function repairSelect(){
  const select=document.getElementById(SELECT_ID);
  if(!select||repairing)return false;
  repairing=true;
  if(selectObserver)selectObserver.disconnect();
  try{
    const oldValue=select.value;
    const seen=new Set();
    const villages=[];

    [...select.options].forEach(option=>{
      const value=String(option.value||option.textContent||'').trim();
      const label=String(option.textContent||value).trim();
      if(value===GENERAL_VALUE||label===GENERAL_LABEL)return;
      if(isInternalVillage(value,label))return;
      const key=value.toLocaleLowerCase('nl-NL');
      if(seen.has(key))return;
      seen.add(key);
      villages.push({value,label});
    });

    villages.sort((a,b)=>a.label.localeCompare(b.label,'nl',{sensitivity:'base'}));
    select.replaceChildren();

    const general=document.createElement('option');
    general.value=GENERAL_VALUE;
    general.textContent=GENERAL_LABEL;
    select.appendChild(general);

    villages.forEach(v=>{
      const option=document.createElement('option');
      option.value=v.value;
      option.textContent=v.label;
      select.appendChild(option);
    });

    const canRestore=[...select.options].some(o=>o.value===oldValue&&!isInternalVillage(o.value,o.textContent));
    if(canRestore)select.value=oldValue;
    else if([...select.options].some(o=>o.value==='Montfort'))select.value='Montfort';
    else select.value=GENERAL_VALUE;

    select.dataset.snVillageClean='241';

    const field=select.closest('.field');
    if(field&&!field.querySelector('.sn-ar-village-clean-help')){
      const help=document.createElement('small');
      help.className='sn-ar-village-clean-help';
      help.style.cssText='display:block;margin-top:6px;font-weight:800;line-height:1.35;color:#6b5438';
      help.textContent='Algemeen / overal = voor een AR-Snazzle buiten een aangemeld dorp. Alleen echte dorpen worden hier getoond.';
      field.appendChild(help);
    }

    if(!selectObserver)selectObserver=new MutationObserver(()=>queueMicrotask(repairSelect));
    selectObserver.observe(select,{childList:true});
    return true;
  }finally{
    repairing=false;
  }
}

function install(){
  if(repairSelect()){
    bodyObserver?.disconnect();
    bodyObserver=null;
    return;
  }
  if(bodyObserver||!document.body)return;
  bodyObserver=new MutationObserver(()=>repairSelect());
  bodyObserver.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
[80,250,700,1500,3000,6000].forEach(ms=>setTimeout(repairSelect,ms));
document.addEventListener('snazzle:admin-ui-ready',()=>setTimeout(repairSelect,50));
document.addEventListener('click',e=>{
  if(e.target?.closest?.('#snArAdminTab85'))setTimeout(repairSelect,30);
});

window.SnazzleArVillageSelectFixV241={repair:repairSelect};
