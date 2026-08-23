// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.
import './app-core.js';
import './shop-compat.js?v=11';
import './kids-fun.js?v=11';
import './snazzle-route.js?v=11';
import './snazzle-collection.js?v=11';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

// Load the shop only after Firebase has restored/created a signed-in user.
// This prevents a first-load permission race on mobile browsers.
const auth = getAuth();
let shopLoaded = false;
onAuthStateChanged(auth, user => {
  if (!user || shopLoaded) return;
  shopLoaded = true;
  import('./shop.js?v=11')
    .then(()=>import('./shop-email-settings.js?v=11'))
    .catch(err => console.error('Snazzle shop kon niet laden', err));
});
