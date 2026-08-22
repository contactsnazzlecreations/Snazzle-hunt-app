from pathlib import Path

path = Path('app.js')
text = path.read_text(encoding='utf-8')

helper = r'''
function renderDuckLogoFallback(){
  const fallback=$('#logoFallback');
  if(!fallback) return;
  if(localSettings.profileImage){
    fallback.innerHTML='';
    fallback.removeAttribute('aria-label');
    return;
  }
  fallback.setAttribute('aria-label','Blauw Snazzle badeendje');
  fallback.innerHTML=`<svg class="snazzle-duck-logo" viewBox="0 0 100 100" role="img" aria-hidden="true">
    <g class="duck-shape">
      <ellipse cx="45" cy="62" rx="30" ry="21"></ellipse>
      <circle cx="67" cy="39" r="15"></circle>
      <path d="M80 35 L96 42 L80 49 Z"></path>
      <path d="M20 55 L7 44 L12 64 Z"></path>
    </g>
  </svg>`;
  if(!$('#duckLogoStyles')){
    const style=document.createElement('style');
    style.id='duckLogoStyles';
    style.textContent=`
      #logoFallback{width:100%;height:100%;display:grid;place-items:center}
      .snazzle-duck-logo{width:52px;height:52px;overflow:visible;transform-origin:50% 70%;filter:drop-shadow(0 3px 2px rgba(0,0,0,.22));animation:duckLogoBob 3.2s ease-in-out infinite}
      .snazzle-duck-logo .duck-shape{fill:#2fa9e8}
      @keyframes duckLogoBob{0%,100%{transform:translateY(1px) rotate(-2deg)}50%{transform:translateY(-3px) rotate(2deg)}}
      @media(prefers-reduced-motion:reduce){.snazzle-duck-logo{animation:none}}
    `;
    document.head.appendChild(style);
  }
}
'''.strip() + '\n'

if 'function renderDuckLogoFallback()' not in text:
    needle = 'function compressFile(file, max=720, quality=.68){'
    if needle not in text:
        raise SystemExit('Could not find insertion point for duck logo helper')
    text = text.replace(needle, helper + needle, 1)

call = "  renderDuckLogoFallback();\n"
anchor = "  setImg($('#profileLogo'), $('#logoFallback'), localSettings.profileImage);\n"
if call not in text:
    if anchor not in text:
        raise SystemExit('Could not find profile logo render line')
    text = text.replace(anchor, anchor + call, 1)

path.write_text(text, encoding='utf-8')
