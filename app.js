// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.
import './app-core.js';
import './shop-compat.js?v=16';
import './kids-fun.js?v=16';
import './snazzle-route.js?v=16';
import './snazzle-collection.js?v=16';
import './snazzle-unlock.js?v=16';
import './image-fit.js?v=16';
import './snazzle-world.js?v=16';
import './snazzle-home-magic.js?v=16';
import './snazzle-home-magic-fix.js?v=16';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

// Load the shop only after Firebase has restored/created a signed-in user.
// This prevents a first-load permission race on mobile browsers.
const auth = getAuth();
let shopLoaded = false;
onAuthStateChanged(auth, user => {
  if (!user || shopLoaded) return;
  shopLoaded = true;
  import('./shop.js?v=16')
    .then(()=>import('./shop-email-settings.js?v=16'))
    .catch(err => console.error('Snazzle shop kon niet laden', err));
});
