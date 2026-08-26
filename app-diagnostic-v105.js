// Snazzle v105 startup diagnostic — cache-proof filename and current module list.
const runtimeVersion='20260826-diagnostic-v105';
const fresh=(path)=>`${path}${path.includes('?')?'&':'?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion=runtimeVersion;
window.__snazzleFresh=fresh;
window.__snazzleDiagnosticV105=true;

function ensureSplash(){
  let splash=document.getElementById('snDiagBoot105');
  if(splash) return splash;
  splash=document.createElement('div');
  splash.id='snDiagBoot105';
  splash.innerHTML=`<div class="sn-diag-card"><div class="sn-diag-mark">🦆</div><div class="sn-diag-version">DIAGNOSE V105</div><h1>Snazzle</h1><p>Samen naar buiten</p><small id="snDiagStage105">Diagnose wordt gestart…</small><div class="sn-diag-line"><i></i></div><em>Deze controle verandert niets aan je Snazzle-gegevens.</em></div>`;
  const style=document.createElement('style');
  style.id='snDiagStyle105';
  style.textContent=`#snDiagBoot105{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:radial-gradient(circle at 50% 28%,rgba(174,236,90,.22),transparent 30%),linear-gradient(180deg,#0d6844,#043a2b);color:#fff8df;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center;padding:22px}#snDiagBoot105 .sn-diag-card{width:min(88vw,390px)}#snDiagBoot105 .sn-diag-mark{width:104px;height:104px;margin:0 auto 10px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#ffe675,#f5b536);border:5px solid #805527;box-shadow:0 8px 0 #4e311b;font-size:48px}#snDiagBoot105 .sn-diag-version{display:inline-block;margin:0 0 10px;padding:5px 9px;border-radius:99px;background:#173f2d;border:1px solid #e7c85d;color:#ffe780;font-size:10px;font-weight:1000;letter-spacing:1px}#snDiagBoot105 h1{margin:0;color:#ffd75a;font-size:42px;line-height:1}#snDiagBoot105 p{margin:13px 0 18px;font-size:20px;font-weight:900;color:#e8f4cf}#snDiagStage105{display:block;min-height:42px;padding:10px 12px;border-radius:13px;background:rgba(0,0,0,.18);border:1px solid rgba(255,231,145,.28);color:#fff0b8;font-size:13px;font-weight:850;line-height:1.35;overflow-wrap:anywhere}#snDiagBoot105 .sn-diag-line{height:6px;margin:17px auto 0;width:230px;max-width:72vw;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}#snDiagBoot105 .sn-diag-line i{display:block;width:38%;height:100%;border-radius:99px;background:#ffe071;animation:snDiag105 1.1s ease-in-out infinite alternate}#snDiagBoot105 em{display:block;margin-top:13px;color:#dce8c9;font-size:10px;font-style:normal;font-weight:700;opacity:.82}@keyframes snDiag105{from{transform:translateX(-15%)}to{transform:translateX(180%)}}`;
  document.head.appendChild(style);
  document.body.appendChild(splash);
  return splash;
}

function stage(label){
  try{localStorage.setItem('snazzleDiagLastStageV105',String(label));}catch{}
  const el=document.getElementById('snDiagStage105');
  if(el) el.textContent=String(label);
}
function nextPaint(){return new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));}
function shortName(path){return String(path).replace(/^\.\//,'').replace(/\.js$/,'');}
async function loadOne(path,index,total){
  stage(`Controle ${index}/${total}: ${shortName(path)}`);
  await nextPaint();
  try{await import(fresh(path));return true;}
  catch(err){console.error('Snazzle diagnose importfout',path,err);stage(`FOUT bij ${shortName(path)} — diagnose gaat verder`);await new Promise(r=>setTimeout(r,400));return false;}
}
function addTheme(path){const link=document.createElement('link');link.rel='stylesheet';link.href=fresh(path);document.head.appendChild(link);}
function finish(){stage('Controle klaar — volledige app is opgebouwd');try{localStorage.setItem('snazzleDiagLastStageV105','KLAAR');}catch{}}

if(document.body) ensureSplash(); else document.addEventListener('DOMContentLoaded',ensureSplash,{once:true});

const modules=[
  './snazzle-runtime-stability-v71.js','./snazzle-image-stability-v72.js','./app-core.js','./snazzle-auto-update-v51.js','./snazzle-privacy-v52.js','./snazzle-parent-hub-v65.js','./snazzle-parent-close-fix-v76.js','./snazzle-central-assets-v48.js','./snazzle-admin-reset-v49.js','./snazzle-admin-backup-v50.js','./shop-compat.js','./kids-fun.js','./snazzle-route.js','./snazzle-collection.js','./snazzle-ar-v80.js','./snazzle-ar-safety-v82b.js','./snazzle-card-system-v2.js','./snazzle-card-worlds-v78.js','./snazzle-card-world-prompt-v79.js','./snazzle-hunt-code-v2.js','./snazzle-unlock.js','./image-fit.js','./snazzle-world.js','./snazzle-home-magic.js','./snazzle-home-magic-fix.js','./village-access.js','./snazzle-characters.js','./snazzle-adventure-ui-v28.js','./snazzle-clean-home-v31.js','./snazzle-v32-guard.js','./snazzle-image-control-v32.js','./snazzle-village-admin-v33.js','./snazzle-secret-characters-v34.js','./snazzle-idle-hunt-duck-v35.js','./snazzle-home-hunt-image-v36.js','./snazzle-click-secrets-v37.js','./snazzle-world-adventure-v38.js','./snazzle-season-theme-v38.js','./snazzle-world-theme-v39.js','./snazzle-news-v46.js','./snazzle-world-hub-v47.js','./snazzle-game-menu-v62.js','./snazzle-listen-stories-v63.js','./snazzle-central-visuals-v54.js','./snazzle-public-visual-publish-v64.js','./snazzle-image-recovery-v60.js','./snazzle-admin-close-v61.js','./snazzle-admin-access-v55.js','./snazzle-professional-v53.js','./snazzle-admin-access-v56.js','./snazzle-safe-admin-v58.js','./snazzle-final-polish-v59.js','./snazzle-star-rewards-v67.js','./snazzle-quiet-psst-v68.js','./snazzle-input-visibility-v69.js','./snazzle-top-stability-v70.js','./snazzle-bieb-v73.js','./snazzle-bieb-cloud-v74.js','./snazzle-bieb-locations-v77.js'
];

addTheme('./snazzle-magic-theme.css');addTheme('./snazzle-enchanted-layer.css');addTheme('./snazzle-professional-v53.css');addTheme('./snazzle-final-polish-v59.css');
for(let i=0;i<modules.length;i++) await loadOne(modules[i],i+1,modules.length);
try{stage('Laatste rendercontrole…');await window.__snazzleRuntimeSettle71?.();}catch{}
finish();