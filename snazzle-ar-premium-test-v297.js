// Snazzle Premium AR proef v297
// Afgeschermde browser-AR proef: echte GLB laden, gedeelde beeldherkenning, beweging, tikken en vondst opslaan.
(async function(){
  const FIREBASE='12.17.1';
  const authMod=await import('https://www.gstatic.com/firebasejs/'+FIREBASE+'/firebase-auth.js');
  const fsMod=await import('https://www.gstatic.com/firebasejs/'+FIREBASE+'/firebase-firestore.js');
  const auth=authMod.getAuth();
  const db=fsMod.getFirestore();
  const TEST_ID='AR-PREMIUM-TEST-001';
  const TEST_NAME='Premium Test Snazzle';
  const TEST_NUMBER='T001';
  const TEST_RARITY='RARE';
  const TEST_VILLAGE='AR Proef';
  const TARGET_B64='./assets/ar-test/card.mind.b64?v=297';
  const MODEL_B64='./assets/ar-test/Duck.glb.b64?v=297';
  const TARGET_PAGE='./ar-test-target.html?v=297';
  const THUMB_URL=new URL('./assets/ar-test/premium-test-thumb.svg?v=297',document.baseURI).href;
  const LOCAL_KEY='snazzleARCollection';
  const $=(s,r=document)=>r.querySelector(s);
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let superAdmin=false;
  let mindar=null,renderer=null,scene=null,camera=null,anchor=null,model=null,holder=null;
  let targetVisible=false,running=false,catching=false,renderStart=0,pointerHandler=null;
  let objectUrls=[];
  let installObserver=null;

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function localItems(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[];}catch{return[];}}
  function alreadyCaught(){return localItems().some(x=>String(x&&x.id||'')===TEST_ID);}
  function setStatus(text,kind){
    const el=$('#snPremiumArStatus');if(!el)return;
    el.textContent=text||'';
    el.classList.toggle('ok',kind==='ok');el.classList.toggle('err',kind==='err');
  }
  function setHud(text){const el=$('#snPremiumArHudText');if(el)el.textContent=text||'';}
  function setCatchVisible(on){
    const b=$('#snPremiumArCatch');if(b)b.classList.toggle('show',!!on);
    const hint=$('#snPremiumArHint');if(hint)hint.classList.toggle('show',!!on);
  }
  async function b64BlobUrl(path,mime){
    const res=await fetch(path,{cache:'force-cache'});if(!res.ok)throw new Error('AR-bestand ontbreekt ('+res.status+').');
    const raw=(await res.text()).replace(/\s+/g,'');const bin=atob(raw),bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([bytes],{type:mime}));objectUrls.push(url);return url;
  }
  function releaseObjectUrls(){objectUrls.forEach(u=>{try{URL.revokeObjectURL(u);}catch{}});objectUrls=[];}
  function testLink(){const u=new URL(location.href);u.searchParams.set('arproef','1');u.hash='';return u.href;}
  async function copyText(value,button){
    try{await navigator.clipboard.writeText(value);if(button){const old=button.textContent;button.textContent='Gekopieerd ✓';setTimeout(()=>button.textContent=old,1300);}}
    catch{prompt('Kopieer deze link:',value);}
  }

  function installStyles(){
    if($('#snPremiumArStyle297'))return;
    const s=document.createElement('style');s.id='snPremiumArStyle297';s.textContent=[
      '#snPremiumArGuide,#snPremiumArResult{position:fixed;inset:0;z-index:2147482500;background:rgba(1,12,8,.9);display:none;align-items:flex-end;padding:15px}',
      '#snPremiumArGuide.show,#snPremiumArResult.show{display:flex}.sn-par-panel{width:min(540px,100%);margin:auto;background:linear-gradient(#fff4ca,#e9c977);color:#2f2316;border:4px solid #764a23;border-radius:27px;padding:18px;box-shadow:0 12px 0 #3f2716,0 28px 70px rgba(0,0,0,.5)}',
      '.sn-par-badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#2b2058;color:#ffe66b;font-size:10px;font-weight:1000;letter-spacing:.6px}.sn-par-panel h2{margin:8px 0;font-size:26px;line-height:1.05}.sn-par-panel p{font-weight:750;line-height:1.42}.sn-par-actions{display:grid;gap:8px;margin-top:12px}.sn-par-actions button,.sn-par-actions a{border:0;border-radius:15px;padding:13px;text-align:center;text-decoration:none;font:inherit;font-weight:1000}.sn-par-primary{background:linear-gradient(#79c948,#438f2d);color:#fff;box-shadow:0 4px 0 #2d6d20}.sn-par-secondary{background:#d8b36a;color:#332313}.sn-par-status{margin-top:11px;padding:10px 11px;border:2px solid #b8965e;border-radius:13px;background:#fff9e8;font-size:12px;font-weight:900}.sn-par-status.ok{background:#e4f4c7;border-color:#8eae4d;color:#315421}.sn-par-status.err{background:#ffe2d9;border-color:#c27056;color:#7b2f22}',
      '#snPremiumArOverlay{position:fixed;inset:0;z-index:2147482600;background:#020805;display:none;overflow:hidden}#snPremiumArOverlay.show{display:block}#snPremiumArCanvas{position:absolute;inset:0;overflow:hidden}#snPremiumArCanvas video,#snPremiumArCanvas canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important}',
      '.sn-par-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.56),transparent 24%,transparent 68%,rgba(0,0,0,.68));z-index:3}.sn-par-hud{position:absolute;z-index:6;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));display:flex;justify-content:space-between;gap:10px}.sn-par-hudbox{max-width:78%;padding:10px 12px;border-radius:15px;background:rgba(9,48,31,.88);border:2px solid rgba(209,249,106,.7);color:#fff;box-shadow:0 5px 18px rgba(0,0,0,.28)}.sn-par-hudbox b{display:block;color:#ddff74;font-size:12px}.sn-par-hudbox small{display:block;margin-top:2px;font-weight:850}.sn-par-close{width:46px;height:46px;border:2px solid rgba(255,255,255,.4);border-radius:14px;background:rgba(0,0,0,.62);color:#fff;font-size:24px;font-weight:1000}',
      '.sn-par-bottom{position:absolute;z-index:7;left:13px;right:13px;bottom:calc(16px + env(safe-area-inset-bottom));display:grid;gap:9px}.sn-par-hint{padding:11px 13px;border-radius:15px;background:rgba(7,38,25,.9);border:2px solid rgba(255,255,255,.28);color:#fff;font-weight:950;text-align:center}.sn-par-hint.show{border-color:#d8ff73;color:#efffd0}.sn-par-catch{display:none;border:0;border-radius:17px;padding:15px;background:linear-gradient(#ffe05d,#f1a92c);color:#35230e;font-size:17px;font-weight:1000;box-shadow:0 5px 0 #925a17}.sn-par-catch.show{display:block}',
      '.sn-par-admin{margin:16px 0;padding:14px;border:3px solid #5b448d;border-radius:18px;background:linear-gradient(145deg,#f5eaff,#e5d2fb);color:#332446}.sn-par-admin h4{margin:0 0 6px;font-size:17px}.sn-par-admin p{margin:0 0 10px;font-size:11px;font-weight:800;line-height:1.4}.sn-par-admin .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sn-par-admin button,.sn-par-admin a{border:0;border-radius:12px;padding:10px;text-decoration:none;text-align:center;font-weight:950;font-size:11px}.sn-par-admin .go{background:#56358f;color:#fff}.sn-par-admin .ref{background:#ead05f;color:#34230d}.sn-par-admin .copy{background:#d6c4ed;color:#3d2957}',
      '#snPremiumArLaunch{margin-top:9px;background:linear-gradient(135deg,#3a246e,#7c49ba)!important;color:#fff!important}.sn-par-result-duck{width:170px;height:170px;margin:4px auto}.sn-par-result-duck img{width:100%;height:100%;object-fit:contain}.sn-par-center{text-align:center}@media(max-width:390px){.sn-par-admin .row{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(s);
  }

  function ensureUi(){
    installStyles();
    if(!$('#snPremiumArGuide')){
      const guide=document.createElement('div');guide.id='snPremiumArGuide';guide.setAttribute('role','dialog');guide.setAttribute('aria-modal','true');
      guide.innerHTML='<div class="sn-par-panel"><span class="sn-par-badge">PREMIUM AR · PROEF</span><h2>3D Snazzle herkennen</h2><p>Gebruik voor deze eerste technische proef de vaste proefkaart. Laat die kaart op een tweede telefoon, tablet of laptop zien en richt daarna de zoekcamera erop.</p><div class="sn-par-status" id="snPremiumArStatus">Klaar voor de proef.</div><div class="sn-par-actions"><button class="sn-par-primary" id="snPremiumArStart">Start 3D AR proef</button><a class="sn-par-secondary" id="snPremiumArTargetLink" href="'+TARGET_PAGE+'" target="_blank" rel="noopener">Open proefkaart</a><button class="sn-par-secondary" id="snPremiumArCopyLink">Kopieer proeflink</button><button class="sn-par-secondary" id="snPremiumArGuideClose">Sluiten</button></div></div>';
      document.body.appendChild(guide);
    }
    if(!$('#snPremiumArOverlay')){
      const ov=document.createElement('div');ov.id='snPremiumArOverlay';
      ov.innerHTML='<div id="snPremiumArCanvas"></div><div class="sn-par-shade"></div><div class="sn-par-hud"><div class="sn-par-hudbox"><b>✨ PREMIUM AR PROEF</b><small id="snPremiumArHudText">AR-engine laden…</small></div><button class="sn-par-close" id="snPremiumArClose" aria-label="Sluiten">×</button></div><div class="sn-par-bottom"><div class="sn-par-hint" id="snPremiumArHint">Richt op de volledige proefkaart.</div><button class="sn-par-catch" id="snPremiumArCatch">Tik op de 3D Snazzle om hem te vangen!</button></div>';
      document.body.appendChild(ov);
    }
    if(!$('#snPremiumArResult')){
      const result=document.createElement('div');result.id='snPremiumArResult';result.setAttribute('role','dialog');result.setAttribute('aria-modal','true');
      result.innerHTML='<div class="sn-par-panel sn-par-center"><span class="sn-par-badge">PREMIUM AR · GEVANGEN</span><div class="sn-par-result-duck"><img src="'+THUMB_URL+'" alt="Premium Test Snazzle"></div><h2>Premium Test Snazzle</h2><p id="snPremiumArResultText">De volledige proef is gelukt en de vondst is opgeslagen.</p><div class="sn-par-actions"><button class="sn-par-primary" id="snPremiumArFindings">Bekijk Mijn vondsten</button><button class="sn-par-secondary" id="snPremiumArDone">Sluiten</button></div></div>';
      document.body.appendChild(result);
    }
    if(!$('#snPremiumArWired')){
      const marker=document.createElement('i');marker.id='snPremiumArWired';marker.hidden=true;document.body.appendChild(marker);
      $('#snPremiumArStart').addEventListener('click',startPremiumAr);
      $('#snPremiumArGuideClose').addEventListener('click',closeGuide);
      $('#snPremiumArCopyLink').addEventListener('click',e=>copyText(testLink(),e.currentTarget));
      $('#snPremiumArClose').addEventListener('click',stopPremiumAr);
      $('#snPremiumArCatch').addEventListener('click',catchPremiumAr);
      $('#snPremiumArDone').addEventListener('click',()=>$('#snPremiumArResult').classList.remove('show'));
      $('#snPremiumArFindings').addEventListener('click',()=>{$('#snPremiumArResult').classList.remove('show');$('#findsBtn')?.click();});
    }
  }

  function openGuide(){ensureUi();$('#snArIntro')?.classList.remove('show');$('#snPremiumArGuide').classList.add('show');setStatus(alreadyCaught()?'Deze proef-Snazzle staat al in jouw vondsten. Je kunt de AR-test opnieuw uitvoeren.':'Klaar voor de proef.',alreadyCaught()?'ok':'');}
  function closeGuide(){$('#snPremiumArGuide')?.classList.remove('show');}

  function installLaunchButtons(){
    ensureUi();
    const allowed=superAdmin||new URLSearchParams(location.search).get('arproef')==='1';
    const panel=$('#snArIntro .sn-ar-panel');
    if(panel){
      let b=$('#snPremiumArLaunch');
      if(!b){b=document.createElement('button');b.id='snPremiumArLaunch';b.className='sn-ar-secondary';b.type='button';b.textContent='🧪 Premium 3D AR proef';b.addEventListener('click',openGuide);const cancel=$('#snArCancel');cancel?cancel.insertAdjacentElement('beforebegin',b):panel.appendChild(b);}
      b.style.display=allowed?'':'none';
    }
    const admin=$('#snArAdminV85');
    if(admin&&superAdmin&&!$('#snPremiumArAdminCard')){
      const card=document.createElement('div');card.id='snPremiumArAdminCard';card.className='sn-par-admin';
      card.innerHTML='<h4>🧪 Premium 3D AR proef</h4><p>Afgeschermde test: echte GLB-eend + visuele targetherkenning + beweging + vangst naar dezelfde Mijn vondsten-opslag. Gewone bezoekers zien deze proef niet.</p><div class="row"><button class="go" id="snPremiumAdminStart">Start proef</button><a class="ref" href="'+TARGET_PAGE+'" target="_blank" rel="noopener">Proefkaart</a><button class="copy" id="snPremiumAdminCopy">Kopieer proeflink</button><button class="copy" id="snPremiumAdminStatus">Status: klaar</button></div>';
      const listHeading=Array.from(admin.querySelectorAll('h3')).find(h=>/Geplaatste Snazzles/i.test(h.textContent||''));
      listHeading?listHeading.insertAdjacentElement('beforebegin',card):admin.appendChild(card);
      $('#snPremiumAdminStart')?.addEventListener('click',openGuide);$('#snPremiumAdminCopy')?.addEventListener('click',e=>copyText(testLink(),e.currentTarget));
      $('#snPremiumAdminStatus')?.addEventListener('click',()=>setStatus('Model, target en vondstopslag zijn ingebouwd. Start proef voor cameracontrole.','ok'));
    }
  }

  async function determineAdmin(user){
    superAdmin=false;
    if(user&&!user.isAnonymous){
      try{const snap=await fsMod.getDoc(fsMod.doc(db,'adminUsers',user.uid));const d=snap.exists()?snap.data():{};superAdmin=d.active===true&&d.role==='superadmin';}catch{}
    }
    installLaunchButtons();
  }

  async function loadThreeStack(){
    setHud('3D-engine laden…');
    const THREE=await import('three');
    const mind=await import('mindar-image-three');
    const loaderMod=await import('three/addons/loaders/GLTFLoader.js');
    return{THREE,MindARThree:mind.MindARThree,GLTFLoader:loaderMod.GLTFLoader};
  }

  function normalizeModel(THREE,obj){
    let box=new THREE.Box3().setFromObject(obj),size=box.getSize(new THREE.Vector3());
    const maxDim=Math.max(size.x,size.y,size.z)||1;obj.scale.setScalar(.7/maxDim);
    box=new THREE.Box3().setFromObject(obj);const center=box.getCenter(new THREE.Vector3());
    obj.position.set(-center.x,-center.y,-center.z);
  }

  function attachPointerCatch(THREE){
    if(!renderer||!model)return;
    const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
    pointerHandler=e=>{
      if(!targetVisible||catching)return;
      const rect=renderer.domElement.getBoundingClientRect();
      mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
      ray.setFromCamera(mouse,camera);if(ray.intersectObject(model,true).length)catchPremiumAr();
    };
    renderer.domElement.addEventListener('pointerup',pointerHandler,{passive:true});
  }

  async function startPremiumAr(){
    if(running)return;running=true;catching=false;targetVisible=false;window.__snazzleArPriority=true;
    closeGuide();ensureUi();const overlay=$('#snPremiumArOverlay'),container=$('#snPremiumArCanvas');overlay.classList.add('show');container.innerHTML='';setCatchVisible(false);setHud('AR-bestanden voorbereiden…');
    try{
      const [{THREE,MindARThree,GLTFLoader},targetUrl,modelUrl]=await Promise.all([loadThreeStack(),b64BlobUrl(TARGET_B64,'application/octet-stream'),b64BlobUrl(MODEL_B64,'model/gltf-binary')]);
      if(!running)throw new Error('Proef gestopt.');
      setHud('Camera en herkenning starten…');
      mindar=new MindARThree({container,imageTargetSrc:targetUrl,maxTrack:1,filterMinCF:.0001,filterBeta:.001});
      renderer=mindar.renderer;scene=mindar.scene;camera=mindar.camera;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
      scene.add(new THREE.HemisphereLight(0xffffff,0x4d3a25,2.2));const dl=new THREE.DirectionalLight(0xffffff,2.4);dl.position.set(1,2,3);scene.add(dl);
      anchor=mindar.addAnchor(0);holder=new THREE.Group();anchor.group.add(holder);
      setHud('3D Snazzle laden…');
      const gltf=await new GLTFLoader().loadAsync(modelUrl);model=gltf.scene;normalizeModel(THREE,model);holder.add(model);holder.position.set(0,0,.12);
      const glow=new THREE.Mesh(new THREE.CircleGeometry(.48,48),new THREE.MeshBasicMaterial({color:0xffdf55,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));glow.position.z=-.06;holder.add(glow);
      anchor.onTargetFound=()=>{targetVisible=true;setHud('✅ Snazzle gevonden! Tik op de 3D-eend.');setCatchVisible(true);try{navigator.vibrate?.(45);}catch{}};
      anchor.onTargetLost=()=>{targetVisible=false;setHud('Proefkaart even kwijt… richt opnieuw op de kaart.');setCatchVisible(false);};
      attachPointerCatch(THREE);
      await mindar.start();renderStart=performance.now();setHud('Zoeken… richt op de volledige proefkaart.');
      renderer.setAnimationLoop(()=>{
        if(!renderer||!scene||!camera)return;
        const t=(performance.now()-renderStart)/1000;
        if(holder){holder.position.y=Math.sin(t*2.4)*.025;holder.rotation.y=Math.sin(t*.85)*.16;}
        renderer.render(scene,camera);
      });
    }catch(err){
      console.error('Premium AR proef',err);await stopPremiumAr({silent:true});
      ensureUi();$('#snPremiumArGuide').classList.add('show');setStatus('⚠️ '+(err&&err.message?err.message:'AR-proef kon niet starten.'),'err');
    }finally{window.__snazzleArPriority=false;}
  }

  async function stopPremiumAr(opts){
    const silent=!!(opts&&opts.silent);running=false;targetVisible=false;setCatchVisible(false);
    try{if(renderer&&pointerHandler)renderer.domElement.removeEventListener('pointerup',pointerHandler);}catch{}
    pointerHandler=null;
    try{renderer?.setAnimationLoop(null);}catch{}
    try{mindar?.stop();}catch{}
    await sleep(20);mindar=null;renderer=null;scene=null;camera=null;anchor=null;model=null;holder=null;
    releaseObjectUrls();const container=$('#snPremiumArCanvas');if(container)container.innerHTML='';$('#snPremiumArOverlay')?.classList.remove('show');window.__snazzleArPriority=false;
    if(!silent)closeGuide();
  }

  async function saveFinding(){
    const caughtAt=new Date().toISOString();
    const item={id:TEST_ID,number:TEST_NUMBER,name:TEST_NAME,rarity:TEST_RARITY,village:TEST_VILLAGE,placeName:'Premium AR technische proef',lat:null,lon:null,caughtAt,edition:'Premium 3D AR Proef',imageUrl:THUMB_URL};
    const list=localItems();if(!list.some(x=>String(x&&x.id||'')===TEST_ID)){list.push(item);localStorage.setItem(LOCAL_KEY,JSON.stringify(list));}
    const user=auth.currentUser;
    if(user){
      try{await fsMod.setDoc(fsMod.doc(db,'users',user.uid),{arCollectionV1:fsMod.arrayUnion(item),arCollectionUpdatedAt:fsMod.serverTimestamp()},{merge:true});}catch(err){console.warn('Premium AR collectie cloudopslag',err);}
      try{await fsMod.setDoc(fsMod.doc(db,'snazzleArFindings',TEST_ID+'_'+user.uid),{pointId:TEST_ID,snazzleName:TEST_NAME,number:TEST_NUMBER,rarity:TEST_RARITY,village:TEST_VILLAGE,foundAt:fsMod.serverTimestamp()});}catch(err){if(!String(err&&err.code||'').includes('permission-denied'))console.warn('Premium AR statistiek',err);}
    }
    try{await window.SnazzleArCollectionBridgeV125?.sync?.();window.SnazzleArCollectionBridgeV125?.render?.();}catch{}
    window.dispatchEvent(new CustomEvent('snazzle:ar-premium-caught',{detail:{id:TEST_ID}}));
    return item;
  }

  async function catchPremiumAr(){
    if(catching||!targetVisible)return;catching=true;setCatchVisible(false);setHud('Vondst veilig opslaan…');
    try{
      await saveFinding();try{navigator.vibrate?.([70,45,110]);}catch{}
      await stopPremiumAr({silent:true});ensureUi();
      const text=$('#snPremiumArResultText');if(text)text.textContent='Gelukt: 3D-model geladen, target herkend, Snazzle aangetikt en de vondst is opgeslagen in Mijn vondsten.';
      $('#snPremiumArResult').classList.add('show');
    }catch(err){console.error('Premium AR vangst',err);setHud('Opslaan mislukt. Probeer opnieuw.');setCatchVisible(true);catching=false;}
  }

  function watchInstall(){
    installLaunchButtons();
    if(installObserver||!document.body)return;
    installObserver=new MutationObserver(()=>installLaunchButtons());installObserver.observe(document.body,{childList:true,subtree:true});
  }

  ensureUi();watchInstall();
  authMod.onAuthStateChanged(auth,determineAdmin);if(auth.currentUser)determineAdmin(auth.currentUser);
  if(new URLSearchParams(location.search).get('arproef')==='1'){
    const openWhenReady=()=>{if($('#snArIntro')){installLaunchButtons();setTimeout(openGuide,250);}else setTimeout(openWhenReady,250);};openWhenReady();
  }
  window.SnazzlePremiumArTestV297={open:openGuide,start:startPremiumAr,stop:stopPremiumAr,caught:alreadyCaught,link:testLink};
})().catch(err=>console.error('Snazzle Premium AR proef kon niet laden',err));
