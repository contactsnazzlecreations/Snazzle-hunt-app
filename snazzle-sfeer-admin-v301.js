// Snazzle v301 — robuuste beheerpagina voor Sfeer & seizoen.
// De pagina opent direct en is niet afhankelijk van late achtergrondmodules.

const VERSION='301.0.0';
const KEY='snazzleSeasonThemeV38';
const presets={
  normal:{label:'🌿 Normale Snazzle Jungle',a:'#176c48',b:'#073c31',accent:'#ffd86a'},
  christmas:{label:'🎄 Kerst',a:'#0e5b3e',b:'#083026',accent:'#e33e43'},
  easter:{label:'🐣 Pasen',a:'#78b85a',b:'#377d55',accent:'#ffd75c'},
  halloween:{label:'🎃 Halloween',a:'#38254f',b:'#171325',accent:'#f28a2e'},
  winter:{label:'❄️ Winter',a:'#397a92',b:'#163d55',accent:'#d9f3ff'},
  summer:{label:'☀️ Zomer',a:'#238963',b:'#0b5d58',accent:'#ffd75c'},
  spring:{label:'🌸 Lente',a:'#4b9e67',b:'#276a55',accent:'#ffb5cb'},
  custom:{label:'🎨 Eigen kleuren',a:'#176c48',b:'#073c31',accent:'#ffd86a'}
};
const $=(s,r=document)=>r.querySelector(s);

function settings(){
  try{return {theme:'normal',...presets.normal,...JSON.parse(localStorage.getItem(KEY)||'{}')};}
  catch{return {theme:'normal',...presets.normal};}
}
function save(v){localStorage.setItem(KEY,JSON.stringify(v));}
function toast(text){
  const t=$('#toast');
  if(!t)return;
  t.textContent=text;t.classList.add('show');
  clearTimeout(window.__sn301Toast);
  window.__sn301Toast=setTimeout(()=>t.classList.remove('show'),2200);
}
function styles(){
  if($('#sn301SfeerStyle'))return;
  const s=document.createElement('style');s.id='sn301SfeerStyle';
  s.textContent=`
    #sn272SfeerSection{display:none!important}
    #sn272SfeerSection.on{display:block!important}
    #sn301SfeerControls{margin-top:8px;padding:14px;border:2px solid #bda76f;border-radius:18px;background:#fffaf0;color:#382b1e}
    #sn301SfeerControls h4{margin:0 0 5px;font-size:18px}
    #sn301SfeerControls p{margin:0 0 13px;font-size:11px;line-height:1.45;color:#68543a;font-weight:760}
    .sn301-field{margin:10px 0}.sn301-field label{display:block;margin-bottom:5px;font-size:11px;font-weight:950}
    .sn301-field select{width:100%;min-height:48px;border:2px solid #b9955e;border-radius:12px;background:#fff;color:#2f2419;padding:10px;font-size:15px;font-weight:850}
    .sn301-colors{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:10px}
    .sn301-color{padding:8px;border:1px solid #d4bc8a;border-radius:12px;background:#fff7e7}
    .sn301-color label{display:block;font-size:9px;font-weight:950;min-height:22px}
    .sn301-color input{width:100%;height:44px;border:0;background:transparent;padding:0}
    .sn301-preview{margin:13px 0;padding:15px;border-radius:15px;color:#fff;font-weight:950;text-align:center;box-shadow:inset 0 0 0 2px rgba(255,255,255,.25)}
    .sn301-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .sn301-btn{min-height:48px;border:0;border-radius:12px;padding:11px;font-weight:1000}
    .sn301-save{background:#237455;color:#fff}.sn301-reset{background:#79573e;color:#fff}
    @media(max-width:390px){.sn301-colors,.sn301-row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}
function ensureShell(){
  const sheet=$('#adminSheet'),tabs=sheet?.querySelector('.super-only .tabs'),wrap=sheet?.querySelector('.super-only');
  if(!sheet||!tabs||!wrap)return null;
  let tab=$('#sn272SfeerTab');
  if(!tab){tab=document.createElement('button');tab.type='button';tab.id='sn272SfeerTab';tab.textContent='Sfeer';tabs.appendChild(tab);}
  let section=$('#sn272SfeerSection');
  if(!section){
    section=document.createElement('section');section.id='sn272SfeerSection';section.className='admin-section';
    section.innerHTML='<div style="padding:2px 0 10px"><h3 style="margin:0 0 5px">🎨 Sfeer & seizoen</h3><p style="margin:0;font-size:11px;line-height:1.45;color:#6a5338;font-weight:760">Kies hier de kleuren en seizoenssfeer. Afbeeldingen beheer je apart bij Afbeeldingen.</p></div><div id="sn272SfeerMount"></div>';
    wrap.appendChild(section);
  }
  return {sheet,tabs,wrap,tab,section};
}
function applyPreview(){
  const box=$('#sn301Preview');if(!box)return;
  const a=$('#sn301A')?.value||presets.normal.a,b=$('#sn301B')?.value||presets.normal.b,accent=$('#sn301Accent')?.value||presets.normal.accent;
  box.style.background='linear-gradient(135deg,'+a+','+b+')';
  box.style.borderColor=accent;
  box.textContent='Snazzle sfeer · '+($('#sn301Theme')?.selectedOptions?.[0]?.textContent||'Voorbeeld');
}
function build(){
  const shell=ensureShell();if(!shell)return false;
  const mount=$('#sn272SfeerMount',shell.section);if(!mount)return false;
  const old=$('#v38SeasonAdmin');if(old)old.remove();
  let root=$('#sn301SfeerControls',mount);
  const st=settings();
  if(!root){
    root=document.createElement('div');root.id='sn301SfeerControls';
    root.innerHTML='<h4>🎨 Sfeer instellen</h4><p>Deze instellingen veranderen alleen de kleur en seizoenssfeer van Snazzle. Je gewone afbeeldingen blijven staan.</p><div class="sn301-field"><label>Thema</label><select id="sn301Theme">'+Object.entries(presets).map(([k,v])=>'<option value="'+k+'">'+v.label+'</option>').join('')+'</select></div><div class="sn301-colors"><div class="sn301-color"><label>Hoofdkleur</label><input id="sn301A" type="color"></div><div class="sn301-color"><label>Diepe kleur</label><input id="sn301B" type="color"></div><div class="sn301-color"><label>Accentkleur</label><input id="sn301Accent" type="color"></div></div><div class="sn301-preview" id="sn301Preview">Voorbeeld</div><div class="sn301-row"><button type="button" class="sn301-btn sn301-save" id="sn301Save">Sfeer opslaan</button><button type="button" class="sn301-btn sn301-reset" id="sn301Reset">Normaal herstellen</button></div>';
    mount.replaceChildren(root);
  }
  const select=$('#sn301Theme',root),a=$('#sn301A',root),b=$('#sn301B',root),accent=$('#sn301Accent',root);
  select.value=presets[st.theme]?st.theme:'normal';a.value=st.a||presets.normal.a;b.value=st.b||presets.normal.b;accent.value=st.accent||presets.normal.accent;
  select.onchange=()=>{const p=presets[select.value]||presets.normal;a.value=p.a;b.value=p.b;accent.value=p.accent;applyPreview();};
  [a,b,accent].forEach(el=>el.oninput=applyPreview);
  $('#sn301Save',root).onclick=async()=>{save({theme:select.value,a:a.value,b:b.value,accent:accent.value});applyPreview();try{await import('./snazzle-season-theme-v38.js?fresh=20260926-v301');await window.SnazzleSeasonV38?.apply?.();}catch{}toast('Sfeer opgeslagen ✓');};
  $('#sn301Reset',root).onclick=async()=>{select.value='normal';a.value=presets.normal.a;b.value=presets.normal.b;accent.value=presets.normal.accent;save({theme:'normal',a:a.value,b:b.value,accent:accent.value});applyPreview();try{await import('./snazzle-season-theme-v38.js?fresh=20260926-v301');await window.SnazzleSeasonV38?.apply?.();}catch{}toast('Normale Snazzle-sfeer hersteld');};
  applyPreview();
  return true;
}
function open(){
  const shell=ensureShell();if(!shell)return;
  shell.tabs.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
  shell.sheet.querySelectorAll('.super-only .admin-section').forEach(sec=>sec.classList.remove('on'));
  shell.tab.classList.add('on');shell.section.classList.add('on');
  build();
  try{shell.tab.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});}catch{}
}
function install(){
  styles();ensureShell();build();
  document.addEventListener('click',event=>{
    const tab=event.target?.closest?.('#sn272SfeerTab');if(!tab)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();open();
  },true);
  document.addEventListener('snazzle:admin-ui-ready',()=>setTimeout(()=>{ensureShell();build();},60));
  new MutationObserver(()=>{if(!$('#sn272SfeerTab')||!$('#sn272SfeerSection')){ensureShell();build();}}).observe(document.documentElement,{childList:true,subtree:true});
  console.info('Snazzle Sfeer admin '+VERSION+' geladen');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.SnazzleSfeerAdminV301={open,build,version:VERSION};
