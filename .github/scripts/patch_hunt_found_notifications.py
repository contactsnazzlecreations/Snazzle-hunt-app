from pathlib import Path

path = Path('app.js')
s = path.read_text(encoding='utf-8')


def replace_once(old, new, label):
    global s
    if new in s:
        print(f'{label}: already patched')
        return
    if old not in s:
        raise SystemExit(f'{label}: anchor not found')
    s = s.replace(old, new, 1)
    print(f'{label}: patched')

replace_once(
    "  onSnapshot, query, where, serverTimestamp\n",
    "  onSnapshot, query, where, serverTimestamp, writeBatch\n",
    'Firestore batch import'
)

replace_once(
    "let centralReady = false;\n",
    "let centralReady = false;\nlet joinedHunts = [];\nlet seenFoundHunts = [];\n",
    'Participation state'
)

replace_once(
    "function statusOf(h){\n  if(h.mode==='draft') return 'draft';",
    "function statusOf(h){\n  if(h.found===true) return 'ended';\n  if(h.mode==='draft') return 'draft';",
    'Found hunts end automatically'
)

replace_once(
    "    $('#foundBtn').disabled=true; $('#foundBtn').textContent='Geen hunt'; return;",
    "    $('#startBtn').disabled=true; $('#startBtn').textContent='Geen hunt';\n    $('#foundBtn').disabled=true; $('#foundBtn').textContent='Geen hunt'; return;",
    'No hunt start button'
)

replace_once(
    "  setImg($('#sheetImg'),$('#sheetPlaceholder'),h.imageUrl||'');\n  updateFoundButton();",
    "  setImg($('#sheetImg'),$('#sheetPlaceholder'),h.imageUrl||'');\n  $('#startBtn').disabled=false;\n  $('#startBtn').textContent=joinedHunts.includes(h.id) ? 'Ik zoek mee ✅' : 'Ik ga zoeken! 🔎';\n  updateFoundButton();",
    'Joined hunt button state'
)

old_sync = """async function syncNickname(){
  if(!currentUser || !userName() || adminProfile) return;
  try { await setDoc(doc(db,'users',currentUser.uid),{nickname:userName(),updatedAt:new Date().toISOString()},{merge:true}); } catch(e){ console.warn(e); }
}
async function loadOwnFindings(){"""
new_sync = """async function syncNickname(){
  if(!currentUser || !userName() || adminProfile) return;
  try { await setDoc(doc(db,'users',currentUser.uid),{nickname:userName(),updatedAt:new Date().toISOString()},{merge:true}); } catch(e){ console.warn(e); }
}
async function loadUserParticipation(){
  joinedHunts=[]; seenFoundHunts=[];
  if(!currentUser || adminProfile) return;
  try {
    const snap=await getDoc(doc(db,'users',currentUser.uid));
    if(snap.exists()){
      const data=snap.data();
      joinedHunts=Array.isArray(data.joinedHunts) ? data.joinedHunts : [];
      seenFoundHunts=Array.isArray(data.seenFoundHunts) ? data.seenFoundHunts : [];
    }
  } catch(e){ console.warn('participation',e); }
}
async function saveUserParticipation(){
  if(!currentUser || adminProfile) return;
  try {
    await setDoc(doc(db,'users',currentUser.uid),{
      nickname:userName()||'Snazzle-speler', joinedHunts, seenFoundHunts, updatedAt:new Date().toISOString()
    },{merge:true});
  } catch(e){ console.warn('participation save',e); }
}
async function requestHuntNotificationPermission(){
  if(!('Notification' in window) || Notification.permission!=='default') return;
  try { await Notification.requestPermission(); } catch(e){ console.warn('notifications',e); }
}
async function joinActiveHunt(){
  const h=activeHunt();
  if(!h || !currentUser) return toast('Er is nu geen actieve hunt');
  if(h.found===true) return toast('Deze Snazzle is al gevonden');
  await requestHuntNotificationPermission();
  if(!joinedHunts.includes(h.id)){
    joinedHunts=[...joinedHunts,h.id];
    await saveUserParticipation();
    toast(`Je zoekt nu mee naar ${h.title} 🔎`);
  } else {
    toast(`Je zoekt al mee naar ${h.title} ✅`);
  }
  renderActive();
  openSheet('huntSheet');
}
async function showFoundNotification(h){
  if(seenFoundHunts.includes(h.id)) return;
  seenFoundHunts=[...seenFoundHunts,h.id];
  await saveUserParticipation();
  const body=`${h.title} in ${h.village} is gevonden. Je hoeft niet meer te zoeken.`;
  toast('🏆 Snazzle gevonden! '+body);
  if('Notification' in window && Notification.permission==='granted'){
    try { new Notification('Snazzle gevonden! 🏆',{body,tag:`snazzle-found-${h.id}`}); } catch(e){ console.warn('notification display',e); }
  }
}
async function checkFoundHunts(nextHunts){
  if(!currentUser || adminProfile || !joinedHunts.length) return;
  for(const h of nextHunts){
    if(h.found===true && joinedHunts.includes(h.id) && !seenFoundHunts.includes(h.id) && h.foundByUserId!==currentUser.uid){
      await showFoundNotification(h);
    }
  }
}
async function loadOwnFindings(){"""
replace_once(old_sync, new_sync, 'Participation and notification functions')

old_listener = """  onSnapshot(collection(db,'hunts'),snap=>{
    const arr=snap.docs.map(d=>({id:d.id,...d.data()}));
    if(arr.length) hunts=arr; else {
      const legacy=loadLegacyHunts();
      hunts=legacy.map(h=>({...h,id:h.id||('hunt-'+Date.now()),imageUrl:h.imageUrl||h.image||''}));
    }
    centralReady=true; renderAll();
  },e=>console.warn('hunts listener',e));"""
new_listener = """  onSnapshot(collection(db,'hunts'),async snap=>{
    const arr=snap.docs.map(d=>({id:d.id,...d.data()}));
    let nextHunts;
    if(arr.length) nextHunts=arr; else {
      const legacy=loadLegacyHunts();
      nextHunts=legacy.map(h=>({...h,id:h.id||('hunt-'+Date.now()),imageUrl:h.imageUrl||h.image||''}));
    }
    await checkFoundHunts(nextHunts);
    hunts=nextHunts;
    centralReady=true; renderAll();
  },e=>console.warn('hunts listener',e));"""
replace_once(old_listener, new_listener, 'Found hunt listener')

replace_once(
    "    await refreshAdminProfile();\n    startCentralListeners();\n    await syncNickname();\n    await loadOwnFindings();",
    "    await refreshAdminProfile();\n    await syncNickname();\n    await loadUserParticipation();\n    startCentralListeners();\n    await loadOwnFindings();",
    'Load participation before listeners'
)

old_found = """async function markFound(){
  const h=activeHunt(); if(!h || !currentUser) return;
  if(findings.some(f=>f.huntId===h.id)) return toast('Deze hunt staat al bij je vondsten');
  if(!proofPhoto) return toast('Maak eerst een foto');
  const item={userId:currentUser.uid,nickname:userName()||'Snazzle-speler',huntId:h.id,title:h.title,village:h.village,photoData:proofPhoto,dateLabel:new Date().toLocaleDateString('nl-NL'),createdAt:new Date().toISOString()};
  try { const ref=await addDoc(collection(db,'findings'),item); findings.unshift({id:ref.id,...item}); proofPhoto=''; resetProof(); renderFindings(); toast(h.foundMessage||'Gevonden! 🏆'); }
  catch(e){ console.error(e); toast('Vondst opslaan mislukt'); }
}"""
new_found = """async function markFound(){
  const h=activeHunt(); if(!h || !currentUser) return;
  if(findings.some(f=>f.huntId===h.id)) return toast('Deze hunt staat al bij je vondsten');
  if(!proofPhoto) return toast('Maak eerst een foto');
  const now=new Date().toISOString();
  const item={userId:currentUser.uid,nickname:userName()||'Snazzle-speler',huntId:h.id,title:h.title,village:h.village,photoData:proofPhoto,dateLabel:new Date().toLocaleDateString('nl-NL'),createdAt:now};
  try {
    const batch=writeBatch(db);
    batch.set(doc(db,'findings',h.id),item);
    batch.update(doc(db,'hunts',h.id),{found:true,foundAt:now,foundByUserId:currentUser.uid,foundByNickname:item.nickname});
    await batch.commit();
    findings.unshift({id:h.id,...item});
    proofPhoto=''; resetProof(); renderFindings();
    toast(h.foundMessage||'Gevonden! 🏆');
  }
  catch(e){ console.error(e); toast('Vondst kon niet worden bevestigd'); }
}"""
replace_once(old_found, new_found, 'Atomic find and close hunt')

replace_once(
    "$('#bigStart').onclick=$('#startBtn').onclick=$('#navHunt').onclick=()=>{ if(activeHunt()) openSheet('huntSheet'); else { renderVillagePage(selectedVillage); openSheet('villageSheet'); } };",
    "$('#bigStart').onclick=$('#navHunt').onclick=()=>{ if(activeHunt()) openSheet('huntSheet'); else { renderVillagePage(selectedVillage); openSheet('villageSheet'); } };\n$('#startBtn').onclick=joinActiveHunt;",
    'Join hunt binding'
)

path.write_text(s, encoding='utf-8')
print('Snazzle hunt found notification patch complete')
