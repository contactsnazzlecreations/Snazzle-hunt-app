from pathlib import Path

# v59: Leaflet-tegels zijn technische kaartafbeeldingen en mogen nooit door de
# algemene Snazzle media-polish worden behandeld.
p59 = Path('snazzle-final-polish-v59.js')
s59 = p59.read_text(encoding='utf-8')
needle59 = "function markImage(img){\n  if(!img||img.dataset.sn59Media==='1') return;"
replacement59 = """function isLeafletMedia59(img){
  return !!img?.matches?.('.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow') || !!img?.closest?.('.leaflet-container');
}
function cleanLeafletMedia59(root=document){
  root.querySelectorAll?.('.leaflet-container img').forEach(img=>{
    img.classList.remove('sn59-media','sn59-loading','sn59-loaded');
    delete img.dataset.sn59Media;
  });
  root.querySelectorAll?.('.leaflet-container .sn59-media-shell').forEach(el=>{
    el.classList.remove('sn59-media-shell','sn59-waiting');
  });
}
function markImage(img){
  if(!img||isLeafletMedia59(img)||img.dataset.sn59Media==='1') return;"""
if needle59 not in s59:
    raise SystemExit('v59 markImage anker niet gevonden')
s59 = s59.replace(needle59, replacement59, 1)
needle_install = "function installMediaPolish(){\n  qa('img').forEach(markImage);"
replacement_install = "function installMediaPolish(){\n  cleanLeafletMedia59();\n  qa('img').forEach(markImage);"
if needle_install not in s59:
    raise SystemExit('v59 installMediaPolish anker niet gevonden')
s59 = s59.replace(needle_install, replacement_install, 1)
p59.write_text(s59, encoding='utf-8')

# v59 CSS: extra harde bescherming voor Leaflet, ook als een oude sessie nog
# per ongeluk sn59-klassen op een kaartcontainer heeft gezet.\pcss = Path('snazzle-final-polish-v59.css')
css = pcss.read_text(encoding='utf-8')
protect_css = """

/* v189 — Leaflet-kaart volledig buiten de algemene image-polish houden. */
.leaflet-container .leaflet-tile-container{
  position:absolute!important;
  overflow:visible!important;
}
.leaflet-container img.leaflet-tile,
.leaflet-container img.leaflet-marker-icon,
.leaflet-container img.leaflet-marker-shadow{
  opacity:1!important;
  visibility:visible!important;
  filter:none!important;
  transition:none!important;
  max-width:none!important;
  max-height:none!important;
}
.leaflet-container .sn59-media-shell,
.leaflet-container .sn59-media-shell.sn59-waiting{
  overflow:visible!important;
}
.leaflet-container .sn59-media-shell.sn59-waiting:before{
  display:none!important;
  content:none!important;
}
"""
if 'v189 — Leaflet-kaart volledig buiten de algemene image-polish houden.' not in css:
    css += protect_css
pcss.write_text(css, encoding='utf-8')

# v72: laat Leaflet rechtstreeks met native HTMLImageElement.src/setAttribute
# werken en sla de algemene image-stabilisatie voor kaarttegels over.
p72 = Path('snazzle-image-stability-v72.js')
s72 = p72.read_text(encoding='utf-8')
anchor72 = "function installSourceGuard72(){"
helper72 = """function isLeafletImage72(img){
  return !!img?.matches?.('.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow') || !!img?.closest?.('.leaflet-container');
}

"""
if 'function isLeafletImage72(img)' not in s72:
    if anchor72 not in s72:
        raise SystemExit('v72 source guard anker niet gevonden')
    s72 = s72.replace(anchor72, helper72 + anchor72, 1)

old_setter = """      set(value){
        if(sameImageSource72(this,value)) return;
        srcDescriptor.set.call(this,value);
      }"""
new_setter = """      set(value){
        if(isLeafletImage72(this)){
          srcDescriptor.set.call(this,value);
          return;
        }
        if(sameImageSource72(this,value)) return;
        srcDescriptor.set.call(this,value);
      }"""
if old_setter not in s72:
    raise SystemExit('v72 src setter anker niet gevonden')
s72 = s72.replace(old_setter, new_setter, 1)

old_attr = """  proto.setAttribute=function(name,value){
    if(String(name).toLowerCase()==='src'&&sameImageSource72(this,value)) return;
    return nativeSetAttribute.call(this,name,value);
  };"""
new_attr = """  proto.setAttribute=function(name,value){
    if(String(name).toLowerCase()==='src'&&isLeafletImage72(this)) return nativeSetAttribute.call(this,name,value);
    if(String(name).toLowerCase()==='src'&&sameImageSource72(this,value)) return;
    return nativeSetAttribute.call(this,name,value);
  };"""
if old_attr not in s72:
    raise SystemExit('v72 setAttribute anker niet gevonden')
s72 = s72.replace(old_attr, new_attr, 1)

old_prepare = """  root.querySelectorAll?.('img').forEach(img=>{
    img.decoding='async';"""
new_prepare = """  root.querySelectorAll?.('img').forEach(img=>{
    if(isLeafletImage72(img)) return;
    img.decoding='async';"""
if old_prepare not in s72:
    raise SystemExit('v72 prepareExisting anker niet gevonden')
s72 = s72.replace(old_prepare, new_prepare, 1)

# Verminder onnodige globale style/class-observaties; kaartzoomen verandert veel styles.
s72 = s72.replace("observer72.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class','style']});", "observer72.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});")
s72 = s72.replace("const V72='72.1.0';", "const V72='72.2.0-leaflet-isolated';")
p72.write_text(s72, encoding='utf-8')

# Cache-bust: forceer een nieuwe appstart met de gerepareerde v59/v72-bestanden.
app = Path('app.js')
a = app.read_text(encoding='utf-8')
a = a.replace('// Snazzle Hunt v188 — stabiele directe AR-kaartlaag zonder zoom-rescue.', '// Snazzle Hunt v189 — Leaflet geïsoleerd van algemene afbeeldingslagen.')
a = a.replace("const runtimeVersion='20260831-v188-ar-map-smooth';", "const runtimeVersion='20260831-v189-leaflet-image-isolation';")
app.write_text(a, encoding='utf-8')
