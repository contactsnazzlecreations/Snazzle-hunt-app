// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.

// Presentatielaag: sprookjesachtige Magic Jungle stijl zonder app-logica te wijzigen.
const magicTheme = document.createElement('link');
magicTheme.rel = 'stylesheet';
magicTheme.href = './snazzle-magic-theme.css?v=23';
document.head.appendChild(magicTheme);

// Extra rustige familiefilm-magie: lichtstralen, gloed en rijkere collectiepagina's.
const enchantedTheme = document.createElement('link');
enchantedTheme.rel = 'stylesheet';
enchantedTheme.href = './snazzle-enchanted-layer.css?v=23';
document.head.appendChild(enchantedTheme);

import './app-core.js';
import './shop-compat.js?v=23';
import './kids-fun.js?v=23';
import './snazzle-route.js?v=23';
import './snazzle-collection.js?v=23';
import './snazzle-card-system-v2.js?v=23';
import './snazzle-unlock.js?v=23';
import './image-fit.js?v=23';
import './snazzle-world.js?v=23';
import './snazzle-home-magic.js?v=23';
import './snazzle-home-magic-fix.js?v=23';
import './village-access.js?v=23';
import './snazzle-characters.js?v=23';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

// Load the shop only after Firebase has restored/created a signed-in user.
// This prevents a first-load permission race on mobile browsers.
const auth = getAuth();
let shopLoaded = false;
onAuthStateChanged(auth, user => {
  if (!user || shopLoaded) return;
  shopLoaded = true;
  import('./shop.js?v=23')
    .then(()=>import('./shop-email-settings.js?v=23'))
    .catch(err => console.error('Snazzle shop kon niet laden', err));
});
