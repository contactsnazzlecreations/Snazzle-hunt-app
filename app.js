// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.

// Presentatielaag: sprookjesachtige Magic Jungle stijl zonder app-logica te wijzigen.
const magicTheme = document.createElement('link');
magicTheme.rel = 'stylesheet';
magicTheme.href = './snazzle-magic-theme.css?v=24';
document.head.appendChild(magicTheme);

// Extra rustige familiefilm-magie: lichtstralen, gloed en rijkere collectiepagina's.
const enchantedTheme = document.createElement('link');
enchantedTheme.rel = 'stylesheet';
enchantedTheme.href = './snazzle-enchanted-layer.css?v=24';
document.head.appendChild(enchantedTheme);

import './app-core.js';
import './shop-compat.js?v=24';
import './kids-fun.js?v=24';
import './snazzle-route.js?v=24';
import './snazzle-collection.js?v=24';
import './snazzle-card-system-v2.js?v=24';
import './snazzle-hunt-code.js?v=24';
import './snazzle-unlock.js?v=24';
import './image-fit.js?v=24';
import './snazzle-world.js?v=24';
import './snazzle-home-magic.js?v=24';
import './snazzle-home-magic-fix.js?v=24';
import './village-access.js?v=24';
import './snazzle-characters.js?v=24';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

// Load the shop only after Firebase has restored/created a signed-in user.
// This prevents a first-load permission race on mobile browsers.
const auth = getAuth();
let shopLoaded = false;
onAuthStateChanged(auth, user => {
  if (!user || shopLoaded) return;
  shopLoaded = true;
  import('./shop.js?v=24')
    .then(()=>import('./shop-email-settings.js?v=24'))
    .catch(err => console.error('Snazzle shop kon niet laden', err));
});
