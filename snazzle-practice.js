// Practice and camera fallback are personal notes, separate from verified hunt rewards.
const $ = selector => document.querySelector(selector);
function notePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type.startsWith('image/')) return reject(new Error('Kies een afbeelding.'));
    const url = URL.createObjectURL(file), image = new Image();
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Deze foto kan niet worden geopend. Probeer een JPG of PNG.')); };
    image.onload = () => {
      try {
        const scale = Math.min(1, 720 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .7));
      } catch { reject(new Error('Foto verwerken lukt niet. Kies een kleinere foto.')); }
      finally { URL.revokeObjectURL(url); }
    };
    image.src = url;
  });
}
let activeSession;
function openPractice(manual = false) {
  const session=activeSession=Symbol('photo-session');
  let sheet = $('#snPractice');
  if (!sheet) { sheet = document.createElement('div'); sheet.id = 'snPractice'; sheet.className = 'sheet'; document.body.append(sheet); }
  // Do not cover another modal: close it first, allowing the new sheet to receive taps.
  document.querySelectorAll('.sheet.show').forEach(el => el.classList.remove('show'));
  sheet.innerHTML = `<section class="panel"><button class="close" aria-label="Sluiten">×</button><p class="sn-kicker">${manual ? 'MIJN FOTONOTITIE' : 'OEFENHUNT · GEEN ECHTE PRIJS'}</p><h2>${manual ? 'Bewaar je Snazzle-foto' : 'Je eerste Snazzle-avontuur'}</h2><p>${manual ? 'Geen AR beschikbaar? Maak een foto van een echt Snazzle-eendje. Dit is een persoonlijke fotonotitie op dit toestel, zonder AR-beloning of geverifieerde vondst.' : 'Oefen samen thuis: kies een voorwerp als oefen-Snazzle. Laat iemand het veilig verstoppen en ga zoeken. Je hebt geen GPS of echte Snazzle nodig.'}</p><ol><li>${manual ? 'Zet alleen het eendje op de foto.' : 'Zoek het verstopte voorwerp.'}</li><li>Maak een foto of kies er een uit je galerij.</li><li>Bewaar je ${manual ? 'fotonotitie' : 'oefenvondst'} op dit toestel.</li></ol><input id="snPracticeInput" type="file" accept="image/*" capture="environment" hidden><button class="save" id="snPracticePhoto">Foto maken of kiezen</button><img id="snPracticePreview" class="sn-note-preview" alt="Jouw gekozen foto" hidden><button class="secondary" id="snPracticeSave" disabled>Bewaar ${manual ? 'fotonotitie' : 'oefenvondst'}</button><p id="snPracticeStatus" role="status" aria-live="polite"></p><div id="snSavedNote"></div></section>`;
  sheet.classList.add('show'); sheet.querySelector('.close').onclick = () => {activeSession=null;sheet.classList.remove('show');};
  const key = manual ? 'snazzleManualPhotoV1' : 'snazzlePracticePhotoV1';
  let photo = '', processing = false;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved?.photo?.startsWith('data:image/')) {
      const preview = document.createElement('img'); preview.src = saved.photo; preview.className = 'sn-note-preview'; preview.alt = 'Eerder bewaarde foto';
      const label = document.createElement('p'); label.textContent = 'Je laatst bewaarde foto op dit toestel';
      const remove = document.createElement('button'); remove.className = 'secondary'; remove.textContent = 'Bewaarde foto verwijderen';
      remove.onclick = () => { try { localStorage.removeItem(key); $('#snSavedNote').replaceChildren(); } catch { $('#snPracticeStatus').textContent = 'Verwijderen lukt nu niet.'; } };
      $('#snSavedNote').append(label, preview, remove);
    }
  } catch {}
  $('#snPracticePhoto').onclick = () => $('#snPracticeInput').click();
  $('#snPracticeInput').onchange = async event => {
    const file = event.target.files?.[0]; if (!file || processing) return;
    processing = true; $('#snPracticeSave').disabled = true; $('#snPracticePhoto').disabled = true;
    $('#snPracticeStatus').textContent = 'Foto verwerken…';
    try { const decoded = await notePhoto(file); if(activeSession!==session)return; photo=decoded; $('#snPracticePreview').src = photo; $('#snPracticePreview').hidden = false; $('#snPracticeStatus').textContent = 'Foto klaar. Je kunt hem nu bewaren.'; }
    catch (error) { if(activeSession!==session)return; $('#snPracticeStatus').textContent = error.message; }
    finally { if(activeSession!==session)return; processing = false; event.target.value = ''; $('#snPracticePhoto').disabled = false; $('#snPracticeSave').disabled = !photo; }
  };
  $('#snPracticeSave').onclick = () => {
    if (!photo || processing) return;
    try {
      localStorage.setItem(key, JSON.stringify({ photo, savedAt: new Date().toISOString(), practice: !manual }));
      $('#snPracticeStatus').textContent = manual ? 'Fotonotitie bewaard! Open deze pagina opnieuw om hem terug te zien.' : 'Goed gevonden! Je oefenfoto is bewaard. Klaar voor een echte hunt!';
      $('#snPracticeSave').disabled = true;
      sheet.querySelector('.panel').animate?.([{ opacity: .65 }, { opacity: 1 }], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300 });
    } catch { $('#snPracticeStatus').textContent = 'Opslaan lukt niet: de opslag is vol of geblokkeerd. Je foto is nog niet bewaard.'; }
  };
}
document.addEventListener('snazzle:demo-open', () => openPractice());
document.addEventListener('snazzle:manual-photo', () => openPractice(true));
document.addEventListener('click', event => {
  if (event.target.closest?.('[data-demo-open]')) openPractice();
});
