from pathlib import Path

studio = Path('snazzle-ar-place-studio-v184.js')
s = studio.read_text(encoding='utf-8')

old_tiles = """function addTiles(L){
  tileErrors=0;usingFallbackTiles=false;
  tileLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap'}).addTo(map);
  tileLayer.on('tileerror',()=>{tileErrors++;if(tileErrors>=4&&!usingFallbackTiles){usingFallbackTiles=true;try{tileLayer.remove();}catch{}tileLayer=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd',attribution:'© OpenStreetMap © CARTO'}).addTo(map);const c=$('#snArCoords184');if(c)c.textContent='🗺️ Alternatieve kaartlaag geladen · GPS wordt bepaald…';}});
}
"""
new_tiles = """function addTiles(L){
  tileErrors=0;usingFallbackTiles=false;
  // Android/PWA v188: gebruik rechtstreeks de kaartserver die op het toestel stabiel laadt.
  // Geen tegel-omschakeling tijdens zoomen; daardoor geen grijs/wegvallend kaartbeeld meer.
  tileLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{
    maxZoom:19,
    attribution:'Tiles © Esri',
    updateWhenIdle:true,
    updateWhenZooming:false,
    updateInterval:250,
    keepBuffer:5
  }).addTo(map);
  tileLayer.on('tileerror',()=>{
    tileErrors++;
    const c=$('#snArCoords184');
    if(c&&tileErrors>=3)c.textContent='⚠️ Een deel van de kaart kon niet laden · probeer één stap uit/in te zoomen';
  });
}
"""
if old_tiles not in s:
    raise SystemExit('oude addTiles-functie niet gevonden')
s = s.replace(old_tiles, new_tiles, 1)

old_map = "map=L.map('snArMap184',{zoomControl:true,attributionControl:true}).setView([state.lat,state.lon],18);"
new_map = "map=L.map('snArMap184',{zoomControl:true,attributionControl:true,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false,zoomSnap:1,zoomDelta:1}).setView([state.lat,state.lon],18);"
if old_map not in s:
    raise SystemExit('oude Leaflet map-config niet gevonden')
s = s.replace(old_map, new_map, 1)

s = s.replace('// Snazzle AR Place Studio v184 — kaart direct zichtbaar, GPS daarna verfijnen.', '// Snazzle AR Place Studio v188 — stabiele directe kaartlaag voor Android/PWA.')
s = s.replace('// De kaart gebruikt OpenStreetMap/Leaflet zonder betaalde Maps API-key.', '// Leaflet gebruikt direct een stabiele Esri-kaartlaag; geen tegel-rescue tijdens zoomen.')
studio.write_text(s, encoding='utf-8')

app = Path('app.js')
a = app.read_text(encoding='utf-8')
a = a.replace('// Snazzle Hunt v187 — oude AR-kaartlagen verwijderd; alleen v85/v184 blijft actief.', '// Snazzle Hunt v188 — stabiele directe AR-kaartlaag zonder zoom-rescue.')
a = a.replace("const runtimeVersion='20260831-v187-ar-single-studio';", "const runtimeVersion='20260831-v188-ar-map-smooth';")
a = a.replace("  safeImport('./snazzle-ar-map-tile-rescue-v185.js'),\n", '')
a = a.replace("  safeImport('./snazzle-ar-map-visibility-fix-v186.js'),\n", '')
app.write_text(a, encoding='utf-8')
