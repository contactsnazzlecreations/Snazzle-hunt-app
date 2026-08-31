// Snazzle Leaflet isolation v190
// Houdt Leaflet-kaarttegels volledig buiten de algemene Snazzle-afbeeldingspolish.

const STYLE_ID='snazzleLeafletIsolationV190';

function installLeafletIsolationStyles190(){
  if(document.getElementById(STYLE_ID)) return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    /* v59 mag Leaflet tile-containers nooit als gewone media-shell behandelen. */
    .leaflet-container .sn59-media-shell,
    .leaflet-container .leaflet-tile-container.sn59-media-shell{
      position:absolute!important;
      overflow:visible!important;
    }
    .leaflet-container .sn59-media-shell.sn59-waiting::before{
      display:none!important;
      content:none!important;
      animation:none!important;
    }

    /* Kaarttegels blijven altijd zichtbaar; Leaflet zelf beheert positie en transform. */
    .leaflet-container img.sn59-media,
    .leaflet-container img.sn59-media.sn59-loading,
    .leaflet-container img.sn59-media.sn59-loaded,
    .leaflet-container img.leaflet-tile{
      opacity:1!important;
      filter:none!important;
      transition:none!important;
      max-width:none!important;
      max-height:none!important;
    }
  `;
  document.head.appendChild(style);
}

function isLeafletImage190(img){
  return !!(img && img.tagName==='IMG' && (
    img.classList.contains('leaflet-tile') ||
    img.classList.contains('leaflet-marker-icon') ||
    img.classList.contains('leaflet-marker-shadow') ||
    img.closest?.('.leaflet-container')
  ));
}

function cleanLeafletImage190(img){
  if(!isLeafletImage190(img)) return;

  // Laat dataset.sn59Media bewust staan wanneer v59 hem al gezet heeft:
  // daardoor probeert v59 dezelfde Leaflet-afbeelding niet opnieuw te polijsten.
  img.classList.remove('sn59-media','sn59-loading','sn59-loaded');

  const parent=img.parentElement;
  if(parent?.closest?.('.leaflet-container')){
    parent.classList.remove('sn59-media-shell','sn59-waiting');
  }
}

function cleanLeafletTree190(root=document){
  if(root?.nodeType===1 && root.matches?.('img')) cleanLeafletImage190(root);
  root?.querySelectorAll?.('.leaflet-container img,img.leaflet-tile,img.leaflet-marker-icon,img.leaflet-marker-shadow')
    .forEach(cleanLeafletImage190);
  root?.querySelectorAll?.('.leaflet-container .sn59-media-shell')
    .forEach(el=>el.classList.remove('sn59-media-shell','sn59-waiting'));
}

installLeafletIsolationStyles190();

function startLeafletIsolation190(){
  cleanLeafletTree190(document);

  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='attributes'){
        const target=record.target;
        if(target?.tagName==='IMG') cleanLeafletImage190(target);
        if(target?.classList?.contains('sn59-media-shell') && target.closest?.('.leaflet-container')){
          target.classList.remove('sn59-media-shell','sn59-waiting');
        }
        continue;
      }
      record.addedNodes?.forEach(node=>{
        if(node.nodeType===1) cleanLeafletTree190(node);
      });
    }
  });

  observer.observe(document.body,{
    subtree:true,
    childList:true,
    attributes:true,
    attributeFilter:['class','src']
  });

  // Extra cleanup nadat latere polish-modules zijn geladen.
  setTimeout(()=>cleanLeafletTree190(document),1200);
  setTimeout(()=>cleanLeafletTree190(document),4200);
}

if(document.body) startLeafletIsolation190();
else document.addEventListener('DOMContentLoaded',startLeafletIsolation190,{once:true});

console.info('Snazzle Leaflet isolation v190 geladen');
