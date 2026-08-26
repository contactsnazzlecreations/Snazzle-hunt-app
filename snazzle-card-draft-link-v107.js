// Snazzle Cards v107 — kaarten vooraf invoeren en later pas aan een Hunt koppelen.
// Voegt een veilige beheeroptie toe zonder de bestaande Hunt-beloningen te wijzigen.

const $=(s,r=document)=>r.querySelector(s);

function installDraftOption(){
  const select=$('#sc2Unlock');
  if(!select) return false;
  if(!select.querySelector('option[value="draft"]')){
    const option=document.createElement('option');
    option.value='draft';
    option.textContent='⏳ Later koppelen aan Hunt';
    const hunt=select.querySelector('option[value="hunt"]');
    if(hunt) hunt.after(option); else select.appendChild(option);
  }

  const editor=$('#sc2Editor');
  if(editor && !$('#snCardDraftHelp',editor)){
    const help=document.createElement('div');
    help.id='snCardDraftHelp';
    help.style.cssText='display:none;margin:-2px 0 10px;padding:9px 10px;border-radius:12px;background:#fff3c9;border:2px solid #d5aa47;color:#5c421f;font-size:10px;font-weight:850;line-height:1.4';
    help.textContent='⏳ Deze kaart wordt nu al opgeslagen. Je kunt hem later bewerken en dan aan de juiste Hunt koppelen.';
    const unlockField=select.closest('.field');
    unlockField?.after(help);
  }
  paintDraftState();
  return true;
}

function paintDraftState(){
  const select=$('#sc2Unlock');
  const help=$('#snCardDraftHelp');
  const huntField=$('#sc2HuntField');
  if(!select) return;
  const draft=select.value==='draft';
  if(help) help.style.display=draft?'block':'none';
  if(draft && huntField) huntField.style.display='none';
}

function bind(){
  if(document.documentElement.dataset.snCardDraft107==='1') return;
  document.documentElement.dataset.snCardDraft107='1';
  document.addEventListener('change',e=>{
    if(e.target?.id==='sc2Unlock') setTimeout(paintDraftState,0);
  });
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('button');
    if(!b) return;
    if(b.id==='sc2New'||b.matches('[data-sc2edit]')) setTimeout(()=>{installDraftOption();paintDraftState();},0);
  });
}

function init(){
  bind();
  let tries=0;
  const timer=setInterval(()=>{
    installDraftOption();
    tries++;
    if(tries>80) clearInterval(timer);
  },250);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

console.info('Snazzle Card draft-link v107 geladen');
