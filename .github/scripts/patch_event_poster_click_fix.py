from pathlib import Path

path = Path('app.js')
text = path.read_text(encoding='utf-8')
marker = 'function bindEventPosterClicks()'
if marker in text:
    print('Event poster click fix already present')
    raise SystemExit(0)

insert_before = 'function renderHome(){'
if insert_before not in text:
    raise SystemExit('renderHome marker not found')

code = r'''
function openEventPoster(){
  ensureEventPosterViewer();
  const image=$('#homeImg2');
  const src=(image && (image.currentSrc || image.getAttribute('src'))) || localSettings.homeImage2 || '';
  if(!src) return toast('Er is nog geen actie- of evenementposter geplaatst');
  const poster=$('#eventPosterImage');
  const overlay=$('#eventPosterOverlay');
  if(!poster || !overlay) return;
  poster.src=src;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow='hidden';
  document.body.style.overflow='hidden';
}

function closeEventPoster(){
  const overlay=$('#eventPosterOverlay');
  if(!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  $('#eventPosterImage')?.removeAttribute('src');
  document.documentElement.style.overflow='';
  document.body.style.overflow='';
}

function bindEventPosterClicks(){
  if(document.documentElement.dataset.eventPosterBound==='1') return;
  document.documentElement.dataset.eventPosterBound='1';

  document.addEventListener('click',e=>{
    const close=e.target.closest?.('#eventPosterClose');
    if(close){ e.preventDefault(); e.stopPropagation(); closeEventPoster(); return; }

    const overlay=e.target.closest?.('#eventPosterOverlay');
    if(overlay && e.target===overlay){ closeEventPoster(); return; }

    const card=e.target.closest?.('.home-card');
    if(card && card.querySelector('#homeImg2')){
      e.preventDefault();
      openEventPoster();
    }
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && $('#eventPosterOverlay')?.classList.contains('show')) closeEventPoster();
  });
}

'''

text = text.replace(insert_before, code + insert_before, 1)
text = text.replace(
    "function renderHome(){ applyName(); renderLocalImages(); renderVillages(); renderActive(); renderFindings(); renderFriends(); renderAdmin(); ensureEventPosterViewer(); }",
    "function renderHome(){ applyName(); renderLocalImages(); renderVillages(); renderActive(); renderFindings(); renderFriends(); renderAdmin(); ensureEventPosterViewer(); bindEventPosterClicks(); }",
    1
)

old_css = ".event-poster-overlay{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,12,8,.9);backdrop-filter:blur(5px)}"
new_css = ".event-poster-overlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:8px;background:rgba(3,12,8,.94);backdrop-filter:blur(6px);touch-action:manipulation}"
text = text.replace(old_css, new_css, 1)
old_frame = ".event-poster-frame{position:relative;width:min(560px,100%);max-height:92vh;display:flex;align-items:center;justify-content:center;padding:12px;border-radius:24px;background:linear-gradient(145deg,#3f2819,#1e1711);border:4px solid #9b6936;box-shadow:0 18px 50px rgba(0,0,0,.55)}"
new_frame = ".event-poster-frame{position:relative;width:min(96vw,760px);height:min(94dvh,1000px);display:flex;align-items:center;justify-content:center;padding:8px;border-radius:20px;background:#15110e;border:3px solid #9b6936;box-shadow:0 18px 50px rgba(0,0,0,.65)}"
text = text.replace(old_frame, new_frame, 1)
old_img = ".event-poster-frame img{display:block;width:100%;height:auto;max-height:86vh;object-fit:contain;border-radius:15px;background:#111}"
new_img = ".event-poster-frame img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;border-radius:12px;background:#111}"
text = text.replace(old_img, new_img, 1)
old_close = ".event-poster-close{position:absolute;right:8px;top:8px;z-index:2;width:50px;height:50px;border:3px solid rgba(255,255,255,.55);border-radius:16px;background:#70472b;color:white;font-size:32px;font-weight:900;line-height:1;box-shadow:0 5px 12px rgba(0,0,0,.28)}"
new_close = ".event-poster-close{position:absolute;right:10px;top:10px;z-index:5;width:54px;height:54px;border:3px solid rgba(255,255,255,.7);border-radius:17px;background:#70472b;color:white;font-size:34px;font-weight:900;line-height:1;box-shadow:0 5px 14px rgba(0,0,0,.38);touch-action:manipulation}"
text = text.replace(old_close, new_close, 1)

path.write_text(text, encoding='utf-8')
print('Fixed event poster click and fullscreen sizing')
