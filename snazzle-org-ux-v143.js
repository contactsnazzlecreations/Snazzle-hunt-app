// Snazzle Organisatieplatform v143 — kleine UX-laag, alleen geladen in organisatie-modus.
// Doel: grote bibliotheek rustig doorzoekbaar maken en ingevulde puntgegevens behouden bij Snazzle-wissel.

let draft={hint:'',radius:'8',customName:''};
let installed=false;

function $(s,r=document){return r.querySelector(s);}
function text(v){return String(v??'').trim();}
function selectedAssetName(){
  const label=text($('#snOrgChooseAsset143')?.textContent).replace(/^✅\s*/,'');
  return label&&label!=='🦆 Kies uit Snazzle Bibliotheek'?label:'';
}
function captureDraft(){
  const name=text($('#snOrgPointName143')?.value),asset=selectedAssetName();
  draft={
    hint:$('#snOrgPointHint143')?.value||'',
    radius:$('#snOrgPointRadius143')?.value||'8',
    customName:name&&asset&&name!==asset?name:''
  };
}
function restoreDraft(){
  const hint=$('#snOrgPointHint143'),radius=$('#snOrgPointRadius143'),name=$('#snOrgPointName143');
  if(hint&&draft.hint&&!hint.value)hint.value=draft.hint;
  if(radius&&draft.radius)radius.value=draft.radius;
  if(name&&draft.customName)name.value=draft.customName;
}
function ensureLibraryTools(){
  const modal=$('#snOrgLibrary143'),body=modal?.querySelector('.sn-org143-body');
  if(!body)return;
  if(!$('#snOrgLibrarySearch143',body)){
    const wrap=document.createElement('div');
    wrap.id='snOrgLibrarySearchWrap143';
    wrap.className='sn-org143-field';
    wrap.innerHTML=`<label for="snOrgLibrarySearch143">Zoek in Snazzle Bibliotheek</label>
      <input id="snOrgLibrarySearch143" type="search" maxlength="60" autocomplete="off" placeholder="Bijv. ridder, bos, kerst…">
      <small style="display:block;margin-top:5px;font-weight:800;color:#705737">Alleen door Snazzle goedgekeurde afbeeldingen zijn beschikbaar. Zelf uploaden is niet mogelijk.</small>`;
    const cats=$('#snOrgLibraryCats143',body);
    body.insertBefore(wrap,cats||body.firstChild);
    $('#snOrgLibrarySearch143',body)?.addEventListener('input',applyLibrarySearch);
  }
  applyLibrarySearch();
}
function applyLibrarySearch(){
  const q=text($('#snOrgLibrarySearch143')?.value).toLocaleLowerCase('nl-NL');
  const grid=$('#snOrgLibraryGrid143');if(!grid)return;
  let visible=0;
  grid.querySelectorAll('[data-asset]').forEach(card=>{
    const hit=!q||text(card.textContent).toLocaleLowerCase('nl-NL').includes(q);
    card.style.display=hit?'':'none';
    if(hit)visible++;
  });
  let empty=$('#snOrgLibrarySearchEmpty143',grid);
  if(q&&visible===0){
    if(!empty){
      empty=document.createElement('div');empty.id='snOrgLibrarySearchEmpty143';empty.className='sn-org143-empty';empty.style.gridColumn='1/-1';grid.appendChild(empty);
    }
    empty.textContent='Geen Snazzle gevonden met deze zoekterm.';
  }else empty?.remove();
}
function wireClicks(e){
  const choose=e.target.closest?.('#snOrgChooseAsset143');
  if(choose)captureDraft();
  const place=e.target.closest?.('#snOrgPlacePoint143');
  if(place){
    // Na succesvol plaatsen mag een volgende locatie weer schoon beginnen.
    const once=()=>{setTimeout(()=>{if($('#snOrgPlaceStatus143')?.textContent?.includes('Snazzle staat'))draft={hint:'',radius:'8',customName:''};},500)};
    once();
  }
}
function observe(){
  document.addEventListener('click',wireClicks,true);
  const observer=new MutationObserver(mutations=>{
    let libraryChanged=false,workspaceChanged=false;
    for(const m of mutations){
      const el=m.target?.nodeType===1?m.target:m.target?.parentElement;
      if(el?.closest?.('#snOrgLibrary143'))libraryChanged=true;
      if(el?.closest?.('#snOrgOrganizer143'))workspaceChanged=true;
    }
    if(libraryChanged)ensureLibraryTools();
    if(workspaceChanged)setTimeout(restoreDraft,0);
  });
  observer.observe(document.body,{childList:true,subtree:true});
  ensureLibraryTools();
}

export function install(){
  if(installed)return;installed=true;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
}
install();

window.SnazzleOrgUxV143={install};
