const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function source(file){return fs.readFileSync(path.join(root,file),'utf8').replace(/^import [\s\S]*?;\n/gm,'').replace(/export (?=const |function )/g,'');}
async function setup(stored={},core=true){
  const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://snazzle.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
  const w=dom.window;
  for(const [key,value] of Object.entries(stored))w.localStorage.setItem(key,value);
  Object.assign(w,{initializeApp:()=>({}),getApps:()=>[],getApp:()=>({}),getAuth:()=>({currentUser:{uid:'test',isAnonymous:true}}),getFirestore:()=>({}),collection:()=>({}),doc:()=>({}),onAuthStateChanged:()=>()=>{},onSnapshot:()=>()=>{},getDoc:async()=>({exists:()=>false}),getDocs:async()=>({docs:[]}),setDoc:async()=>{},setInterval:()=>0,matchMedia:()=>({matches:true})});
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.eval(`(()=>{${source('snazzle-welcome.js')};window.welcome={profileStorage,onboardingComplete,finishWelcome,selectWorld};})();`);
  await tick();
  if(core)w.eval(`(()=>{const {profileStorage,onboardingComplete,finishWelcome}=window.welcome;${source('app-core.js')};window.coreTest={renderActive,checkOnboarding,setHunts:items=>{hunts=items;renderAll();},getProof:()=>proofPhoto};})();`);
  return dom;
}
test('each style survives start, reload, and navigation without showing welcome',async()=>{
  for(const style of ['wild','spark','mix']){
    const dom=await setup(),w=dom.window,d=w.document;
    assert.ok(d.querySelector('#onboarding').classList.contains('show'));
    d.querySelector('#firstNameInput').value='DuckMaster';d.querySelector(`[data-sn-world="${style}"]`).click();d.querySelector('#finishOnboarding').click();
    assert.equal(w.localStorage.getItem('snazzleCardWorldPreference'),style);
    assert.equal(w.localStorage.getItem('snazzleName'),'DuckMaster');
    for(const id of ['navProfile','navFriends','navHunt','navHome']){d.querySelector('#'+id).click();w.coreTest.checkOnboarding();assert.ok(!d.querySelector('#onboarding').classList.contains('show'));}
    const next=await setup(Object.fromEntries(Object.keys(w.localStorage).map(key=>[key,w.localStorage.getItem(key)])));
    assert.ok(!next.window.document.querySelector('#onboarding').classList.contains('show'));
    next.window.close();w.close();
  }
});
test('skip persists without inventing a nickname; existing profiles migrate',async()=>{
  const dom=await setup(),w=dom.window;w.document.querySelector('#skipOnboarding').click();
  assert.equal(w.localStorage.getItem('snazzleName'),null);assert.equal(w.localStorage.getItem('snazzleWelcomeCompleteV1'),'1');
  const next=await setup({snazzleWelcomeCompleteV1:'1'});assert.ok(!next.window.document.querySelector('#onboarding').classList.contains('show'));
  const existing=await setup({snazzleName:'Marvin',snazzleCardWorldPreference:'spark'});assert.ok(existing.window.welcome.onboardingComplete());assert.equal(existing.window.localStorage.getItem('snazzleCardWorldPreference'),'spark');
  w.close();next.window.close();existing.window.close();
});
test('invalid name stays on welcome; blocked storage still lets this session start',async()=>{
  const dom=await setup(),w=dom.window;w.document.querySelector('#firstNameInput').value='A';w.document.querySelector('#finishOnboarding').click();assert.ok(!w.welcome.onboardingComplete());
  w.Storage.prototype.setItem=()=>{throw new Error('blocked')};w.welcome.finishWelcome('Marvin');w.coreTest.checkOnboarding();assert.equal(w.welcome.profileStorage.getItem('snazzleName'),'Marvin');assert.ok(!w.document.querySelector('#onboarding').classList.contains('show'));w.close();
});
test('empty hunt opens practice; practice photo saves separately and can be deleted',async()=>{
  const dom=await setup({snazzleWelcomeCompleteV1:'1'}),w=dom.window,d=w.document;
  w.eval(`(()=>{${source('snazzle-practice.js')}})()`);
  d.querySelector('#startBtn').click();assert.ok(d.querySelector('#snPractice').classList.contains('show'));assert.ok(!d.querySelector('#startBtn').disabled);
  // Simulate image decoding/canvas only; exercise the actual file input and storage handlers.
  w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
  w.Image=class{set src(value){this.width=100;this.height=100;queueMicrotask(()=>this.onload());}};
  w.HTMLCanvasElement.prototype.getContext=()=>({drawImage:()=>{}});w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,ZmFrZQ==';
  const input=d.querySelector('#snPracticeInput');Object.defineProperty(input,'files',{value:[new w.File(['test'],'duck.jpg',{type:'image/jpeg'})]});input.dispatchEvent(new w.Event('change'));await tick();
  assert.equal(d.querySelector('#snPracticeSave').disabled,false);d.querySelector('#snPracticeSave').click();assert.ok(JSON.parse(w.localStorage.getItem('snazzlePracticePhotoV1')).photo);
  assert.equal(w.localStorage.getItem('snazzleARCollection'),null);assert.equal(JSON.parse(w.localStorage.getItem('snazzleHuntFindingsV296')).length,0);
  d.querySelector('#snPractice .close').click();d.querySelector('#startBtn').click();assert.equal(d.querySelectorAll('#snSavedNote img').length,1);d.querySelector('#snSavedNote button').click();assert.equal(w.localStorage.getItem('snazzlePracticePhotoV1'),null);w.close();
});
test('switching hunts clears an old proof photo and preview escapes text',async()=>{
  const dom=await setup({snazzleWelcomeCompleteV1:'1'}),w=dom.window,d=w.document;
  w.coreTest.setHunts([{id:'one',village:'Montfort',mode:'live',title:'One'}]);d.querySelector('#proofImg').src='data:image/jpeg;base64,abc';d.querySelector('#proofPreview').style.display='block';
  w.coreTest.setHunts([{id:'two',village:'Montfort',mode:'live',title:'Two'}]);assert.equal(d.querySelector('#proofImg').getAttribute('src'),null);assert.equal(d.querySelector('#foundBtn').disabled,true);
  d.querySelector('#huntTitleEdit').value='<img onerror=alert(1)>';d.querySelector('#previewHuntBtn').click();assert.equal(d.querySelector('#snAdminPreview h2').textContent,'<img onerror=alert(1)>');assert.equal(d.querySelectorAll('#snAdminPreview h2 img').length,0);w.close();
});
test('AR explains permissions, handles no points and denied GPS before opening camera',async()=>{
  for(const mode of ['empty','gps-denied','camera-denied','cancel-camera']){
    const dom=await setup({},false),w=dom.window,d=w.document;let cameraCalls=0,stopped=0,resolveCamera;
    d.body.insertAdjacentHTML('beforeend','<div id="snArIntro" class="show"><div class="sn-ar-panel"><p></p><button id="snArStart">Start</button><p id="snArStatus"></p></div></div><div id="snArOverlay"><video id="snArCamera"></video><div id="snArDuck"><button id="snArCatchDuck">Duck</button></div><button id="snArClose">Close</button><div id="snArHudText"></div><div id="snArDistance"></div></div>');
    w.getDoc=async()=>({exists:()=>true,data:()=>({points:mode==='empty'?[]:[{id:'duck',lat:51,lon:6,active:true}]})});
    Object.defineProperty(w,'isSecureContext',{value:true});Object.defineProperty(w.navigator,'geolocation',{value:{getCurrentPosition:(_ok,fail)=>fail({code:1}),clearWatch:()=>{},watchPosition:()=>0}});
    if(!['empty','gps-denied'].includes(mode))w.navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:51,longitude:6,accuracy:5}});
    Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:()=>{cameraCalls++;if(mode==='cancel-camera')return new Promise(resolve=>resolveCamera=resolve);return Promise.reject(Object.assign(new Error('denied'),{name:'NotAllowedError'}));}}});
    w.eval(`(()=>{${source('snazzle-ar-engine-v245.js')};window.arTest={startAr,stopSession};})();`);
    await tick();assert.ok(d.querySelector('#snArHelp').textContent.includes('toestemming'));
    const task=w.arTest.startAr();await tick();
    if(mode==='cancel-camera'){w.arTest.stopSession();resolveCamera({getTracks:()=>[{stop:()=>stopped++}]});}
    await task;
    if(mode==='empty')assert.equal(cameraCalls,0);
    if(mode==='gps-denied'){assert.equal(cameraCalls,0);assert.match(d.querySelector('#snArStatus').textContent,/Locatietoestemming/);}
    if(mode==='camera-denied')assert.match(d.querySelector('#snArStatus').textContent,/Cameratoestemming/);
    if(mode==='cancel-camera')assert.equal(stopped,1);
    assert.ok(!d.querySelector('#snArOverlay').classList.contains('show'));w.close();
  }
});
test('late profile and world modules preserve a completed local choice',async()=>{
  const dom=await setup({snazzleName:'Marvin',snazzleCardWorldPreference:'wild'}),w=dom.window;
  w.eval(`(()=>{const {onboardingComplete,profileStorage}=window.welcome;${source('snazzle-onboarding-stability-v208.js')}})()`);
  w.getApps=()=>[{}];
  w.getDoc=async()=>({exists:()=>true,data:()=>({cardWorldPreference:'spark'})});
  w.eval(`(()=>{const {profileStorage}=window.welcome;${source('snazzle-card-worlds-v78.js')};window.loadRemotePreference=loadProfilePreference;})();`);
  await w.loadRemotePreference({uid:'test'});
  assert.equal(w.localStorage.getItem('snazzleCardWorldPreference'),'wild');
  assert.ok(!w.document.querySelector('#onboarding').classList.contains('show'));w.close();
});
test('collection has an accessible progress meter and a starting point for empty collections',async()=>{
  const dom=await setup({snazzleWelcomeCompleteV1:'1'},false),w=dom.window;
  w.document.body.insertAdjacentHTML('beforeend','<div id="collectionSheet"><div class="collection-panel"><div id="collectionCards"></div></div></div>');
  w.eval(`(()=>{${source('snazzle-card-system-v2.js')}})()`);
  assert.equal(w.document.querySelector('#snCardMeter').value,0);
  assert.ok(w.document.querySelector('#snCollectionProgress [data-demo-open]'));w.close();
});
test('the code verification module keeps the no-hunt explanation reachable',async()=>{
  const dom=await setup({snazzleWelcomeCompleteV1:'1'}),w=dom.window;
  Object.assign(w,{getFunctions:()=>({}),httpsCallable:()=>async()=>({data:{}})});
  w.eval(`(()=>{${source('snazzle-hunt-code-v2.js')}})()`);
  w.document.querySelector('#foundBtn').click();
  assert.ok(w.document.querySelector('#villageSheet').classList.contains('show'));
  w.close();
});
