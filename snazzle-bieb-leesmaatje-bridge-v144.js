// Snazzle v144.2 — fail-safe brug tussen bestaand Bieb-formulier en Professor Kwak.
// Leest alleen het formulier en wacht op een echte verhoging van het boekaantal.
// Raakt de bestaande opslaglogica niet aan.

const VERSION='144.2.0';
let watchToken=0;

function numberFrom(id){
  const n=Number(document.getElementById(id)?.textContent||0);
  return Number.isFinite(n)&&n>=0?n:0;
}

function captureCandidate(){
  const title=String(document.getElementById('snBiebTitle73')?.value||'').trim().replace(/\s+/g,' ').slice(0,80);
  const reaction=String(document.getElementById('snBiebReaction73')?.value||'').trim().replace(/\s+/g,' ').slice(0,180);
  const rating=Number(document.getElementById('snBiebRating73')?.value||0);
  const before=numberFrom('snBiebBookCount73');
  if(title.length<2||reaction.length<3||!Number.isInteger(rating)||rating<1||rating>5) return null;
  return {book:{title,reaction,rating},before};
}

function waitForSaved(candidate){
  const token=++watchToken;
  const started=Date.now();
  const poll=()=>{
    if(token!==watchToken) return;
    const current=numberFrom('snBiebBookCount73');
    if(current>candidate.before){
      document.dispatchEvent(new CustomEvent('snazzle:bieb-book-added',{detail:{book:candidate.book,total:current}}));
      return;
    }
    if(Date.now()-started<12000) setTimeout(poll,180);
  };
  setTimeout(poll,250);
}

// Document-capture draait vóór de bestaande submit-handler op het formulier.
document.addEventListener('submit',event=>{
  if(event.target?.id!=='snBiebForm73') return;
  const candidate=captureCandidate();
  if(candidate) waitForSaved(candidate);
},true);

console.info(`Snazzle Leesmaatje bridge ${VERSION} geladen`);