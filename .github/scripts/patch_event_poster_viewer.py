from pathlib import Path

path = Path('app.js')
text = path.read_text(encoding='utf-8')
marker = 'function ensureEventPosterViewer()'
if marker in text:
    print('Poster viewer already present')
    raise SystemExit(0)

insert_before = 'function renderHome(){'
if insert_before not in text:
    raise SystemExit('renderHome marker not found')

code = r'''
function ensureEventPosterViewer(){
  if($('#eventPosterOverlay')) return;

  const overlay=document.createElement('div');
  overlay.id='eventPosterOverlay';
  overlay.className='event-poster-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`
    <div class="event-poster-frame" role="dialog" aria-modal="true" aria-label="Actie of evenement poster">
      <button class="event-poster-close" id="eventPosterClose" aria-label="Poster sluiten">×</button>
      <img id="eventPosterImage" alt="Actie of evenement poster">
    </div>`;
  document.body.appendChild(overlay);

  const style=document.createElement('style');
  style.id='eventPosterStyles';
  style.textContent=`
    .event-poster-overlay{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,12,8,.9);backdrop-filter:blur(5px)}
    .event-poster-overlay.show{display:flex;animation:eventPosterFade .2s ease-out}
    .event-poster-frame{position:relative;width:min(560px,100%);max-height:92vh;display:flex;align-items:center;justify-content:center;padding:12px;border-radius:24px;background:linear-gradient(145deg,#3f2819,#1e1711);border:4px solid #9b6936;box-shadow:0 18px 50px rgba(0,0,0,.55)}
    .event-poster-frame img{display:block;width:100%;height:auto;max-height:86vh;object-fit:contain;border-radius:15px;background:#111}
    .event-poster-close{position:absolute;right:8px;top:8px;z-index:2;width:50px;height:50px;border:3px solid rgba(255,255,255,.55);border-radius:16px;background:#70472b;color:white;font-size:32px;font-weight:900;line-height:1;box-shadow:0 5px 12px rgba(0,0,0,.28)}
    .event-poster-close:active{transform:scale(.94)}
    #homeImg2{cursor:zoom-in}
    #homeImg2+.empty,.home-card:has(#homeImg2){cursor:pointer}
    @keyframes eventPosterFade{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:scale(1)}}
  `;
  document.head.appendChild(style);

  const close=()=>{
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
    $('#eventPosterImage').removeAttribute('src');
  };
  $('#eventPosterClose').onclick=close;
  overlay.addEventListener('click',e=>{ if(e.target===overlay) close(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && overlay.classList.contains('show')) close(); });

  const card=$('#homeImg2')?.closest('.home-card');
  if(card){
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label','Actie of evenement poster openen');
    const openPoster=()=>{
      const src=localSettings.homeImage2 || $('#homeImg2')?.getAttribute('src') || '';
      if(!src) return toast('Er is nog geen actie- of evenementposter geplaatst');
      $('#eventPosterImage').src=src;
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden','false');
    };
    card.onclick=openPoster;
    card.onkeydown=e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openPoster(); } };
  }
}

'''

text = text.replace(insert_before, code + insert_before, 1)
text = text.replace(
    "function renderHome(){ applyName(); renderLocalImages(); renderVillages(); renderActive(); renderFindings(); renderFriends(); renderAdmin(); }",
    "function renderHome(){ applyName(); renderLocalImages(); renderVillages(); renderActive(); renderFindings(); renderFriends(); renderAdmin(); ensureEventPosterViewer(); }",
    1
)
path.write_text(text, encoding='utf-8')
print('Added event poster viewer')
