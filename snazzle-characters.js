// Snazzle character layer — central place for custom Snazzle mascots.
// Upload custom character art via ChatGPT; the image data can then be placed in CHARACTER_ASSETS.
// Until an asset is configured, the existing emoji remains as a safe fallback.

const CHARACTER_VERSION='1.0.0';

// These four slots are intentionally empty until Marvin supplies the final Snazzle artwork.
// Recommended input: transparent PNG/WebP, square canvas, character fully visible.
const CHARACTER_ASSETS={
  guide:'',       // friendly guide / menu / welcome moments
  secret:'',      // hidden surprise / magic visitor
  nature:'',      // nature book / discovery moments
  celebration:''  // reward / found / winner moments
};

const $ch=(s,r=document)=>r.querySelector(s);
const $$ch=(s,r=document)=>[...r.querySelectorAll(s)];

function injectCharacterStyles(){
  if($ch('#snazzleCharacterStyles')) return;
  const style=document.createElement('style');
  style.id='snazzleCharacterStyles';
  style.textContent=`
    .snazzle-character-img{display:block;object-fit:contain;object-position:center;filter:drop-shadow(0 4px 5px rgba(0,0,0,.22));pointer-events:none}
    .snazzle-character-guide{width:100%;height:100%;padding:3px}
    .snazzle-character-secret{width:42px;height:42px}
    .snazzle-character-magic{width:88px;height:88px;margin:0 auto}
    .snazzle-character-inline{width:34px;height:34px}
    .snazzle-character-nature{width:52px;height:52px}
    .snazzle-character-celebration{width:86px;height:86px;margin:0 auto}
    #snazzleVisitor.has-custom-character b{display:none}
    #snazzleVisitor .snazzle-character-secret{flex:0 0 42px}
    .magic-card.has-custom-character #magicBig,.home-magic-card.has-custom-character .big{font-size:0!important}
    .quick-menu-duck.has-custom-character{font-size:0!important;overflow:hidden}
    .quick-menu-duck.has-custom-character img{width:100%;height:100%;object-fit:contain;padding:3px}
  `;
  document.head.appendChild(style);
}

function makeImg(src,cls,alt='Snazzle'){
  const img=document.createElement('img');
  img.src=src; img.alt=alt; img.className='snazzle-character-img '+cls;
  return img;
}

function setGuide(){
  const src=CHARACTER_ASSETS.guide;if(!src)return;
  const menu=$ch('.quick-menu-duck');
  if(menu&&!menu.querySelector('img')){menu.classList.add('has-custom-character');menu.appendChild(makeImg(src,'snazzle-character-guide','Snazzle gids'));}
}

function setSecret(){
  const src=CHARACTER_ASSETS.secret;if(!src)return;
  const visitor=$ch('#snazzleVisitor');
  if(visitor&&!visitor.querySelector('.snazzle-character-secret')){
    visitor.classList.add('has-custom-character');
    visitor.insertBefore(makeImg(src,'snazzle-character-secret','Geheime Snazzle'),visitor.firstChild);
  }
  const magic=$ch('.magic-card');
  const big=$ch('#magicBig');
  if(magic&&big&&!magic.querySelector('.snazzle-character-magic')){
    magic.classList.add('has-custom-character');
    big.insertAdjacentElement('afterend',makeImg(src,'snazzle-character-magic','Magische Snazzle'));
  }
}

function setNature(){
  const src=CHARACTER_ASSETS.nature;if(!src)return;
  const hero=$ch('.nature-hero');
  if(hero&&!hero.querySelector('.snazzle-character-nature')){
    const img=makeImg(src,'snazzle-character-nature','Natuur Snazzle');
    img.style.position='absolute';img.style.right='14px';img.style.bottom='10px';img.style.zIndex='2';
    hero.appendChild(img);
  }
}

function setCelebration(){
  const src=CHARACTER_ASSETS.celebration;if(!src)return;
  $$ch('.home-magic-card').forEach(card=>{
    const big=card.querySelector('.big');
    if(big&&!card.querySelector('.snazzle-character-celebration')){
      card.classList.add('has-custom-character');
      big.insertAdjacentElement('afterend',makeImg(src,'snazzle-character-celebration','Feest Snazzle'));
    }
  });
}

function applyCharacters(){setGuide();setSecret();setNature();setCelebration();}

function initCharacters(){
  if(window.__snazzleCharactersLoaded)return;
  window.__snazzleCharactersLoaded=true;
  injectCharacterStyles();applyCharacters();
  const obs=new MutationObserver(applyCharacters);obs.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCharacters,{once:true});else initCharacters();
console.info(`Snazzle characters ${CHARACTER_VERSION} geladen`);
