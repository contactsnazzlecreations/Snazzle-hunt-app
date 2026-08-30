// Snazzle zone button bridge v176 — maakt alleen de knop; de kaartmodule zet hem om naar een echte link.
function installZoneButtonV176(){
  const start=document.getElementById('snArStart');
  if(!start||document.getElementById('snArZoneOpen')||document.getElementById('snArZoneNativeOpen'))return false;
  if(!document.getElementById('snZoneButtonV176Style')){
    const style=document.createElement('style');
    style.id='snZoneButtonV176Style';
    style.textContent='.sn-ar-zone-btn{display:block;width:100%;margin:10px 0 4px;min-height:48px;border:0;border-radius:15px;padding:11px 14px;background:linear-gradient(135deg,#2d6f4e,#4f8e3d);color:#fff;font-weight:950;font-size:14px;box-shadow:0 4px 0 rgba(25,74,47,.35);text-align:center;text-decoration:none}';
    document.head.appendChild(style);
  }
  const b=document.createElement('button');
  b.type='button';b.id='snArZoneOpen';b.className='sn-ar-zone-btn';b.textContent='🗺️ Bekijk Snazzle-zones';
  start.insertAdjacentElement('afterend',b);
  return true;
}
installZoneButtonV176();
const ob=new MutationObserver(()=>{if(installZoneButtonV176())ob.disconnect();});
if(document.body)ob.observe(document.body,{childList:true,subtree:true});
window.SnazzleZoneButtonV176={install:installZoneButtonV176};
