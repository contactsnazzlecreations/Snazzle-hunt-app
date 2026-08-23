// Small safety patch for Snazzle Home Magic UI layering and first-run state.
(function(){
  function apply(){
    if(!document.getElementById('snazzleHomeMagicFixStyles')){
      const style=document.createElement('style');
      style.id='snazzleHomeMagicFixStyles';
      style.textContent='.bottom{position:fixed!important;left:50%!important;bottom:0!important}.app{position:relative!important;z-index:1}.snazzle-magic-sky{z-index:0!important}';
      document.head.appendChild(style);
    }
    const one=document.querySelector('[data-ducks="1"]');
    const three=document.querySelector('[data-ducks="3"]');
    if(one?.classList.contains('on') && three && !three.dataset.initializedChoice){
      three.dataset.initializedChoice='1';
      three.click();
    }
  }
  document.addEventListener('click',e=>{
    if(!e.target.closest?.('#snazzleHomeHuntHome,[data-home-hunt]')) return;
    setTimeout(()=>{
      const sheet=document.getElementById('snazzleHomeHuntSheet');
      if(!sheet) return;
      sheet.querySelectorAll('.homehunt-stage').forEach(x=>x.classList.remove('on'));
      sheet.querySelector('#homeHuntSetup')?.classList.add('on');
    },30);
  },true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true}); else apply();
})();
