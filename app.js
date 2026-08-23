// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.

// Presentatielaag: sprookjesachtige Magic Jungle stijl zonder app-logica te wijzigen.
const magicTheme = document.createElement('link');
magicTheme.rel = 'stylesheet';
magicTheme.href = './snazzle-magic-theme.css?v=26';
document.head.appendChild(magicTheme);

// Extra rustige familiefilm-magie: lichtstralen, gloed en rijkere collectiepagina's.
const enchantedTheme = document.createElement('link');
enchantedTheme.rel = 'stylesheet';
enchantedTheme.href = './snazzle-enchanted-layer.css?v=26';
document.head.appendChild(enchantedTheme);

import './app-core.js';
import './shop-compat.js?v=26';
import './kids-fun.js?v=26';
import './snazzle-route.js?v=26';
import './snazzle-collection.js?v=26';
import './snazzle-card-system-v2.js?v=26';
import './snazzle-hunt-code-v2.js?v=26';
import './snazzle-unlock.js?v=26';
import './image-fit.js?v=26';
import './snazzle-world.js?v=26';
import './snazzle-home-magic.js?v=26';
import './snazzle-home-magic-fix.js?v=26';
import './village-access.js?v=26';
import './snazzle-characters.js?v=26';
// Adventure Passport-basis: bestaande functies blijven intact.
import './snazzle-adventure-ui-v28.js?v=31';
// v31: rustige home zonder overlappende tekst.
import './snazzle-clean-home-v31.js?v=31';
// Compatibility guard voorkomt dat het oude v31-beeldbeheer opnieuw wordt opgebouwd.
import './snazzle-v32-guard.js?v=32';
// v32: alle zichtbare beelden beter beheerbaar.
import './snazzle-image-control-v32.js?v=32';
// v33: afbeelding per dorp direct in Dorpen-beheer + duidelijkere eenmalige knipoog.
import './snazzle-village-admin-v33.js?v=33';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

// Load the shop only after Firebase has restored/created a signed-in user.
// This prevents a first-load permission race on mobile browsers.
const auth = getAuth();
let shopLoaded = false;
onAuthStateChanged(auth, user => {
  if (!user || shopLoaded) return;
  shopLoaded = true;
  import('./shop.js?v=26')
    .then(()=>import('./shop-email-settings.js?v=26'))
    .catch(err => console.error('Snazzle shop kon niet laden', err));
});
