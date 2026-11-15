// Local welcome state is available before Firebase and the optional card modules.
const memory = new Map();
export const profileStorage = {
  getItem(key) { try { return memory.get(key) ?? localStorage.getItem(key) ?? null; } catch { return memory.get(key) ?? null; } },
  setItem(key, value) { try { localStorage.setItem(key, String(value)); memory.delete(key); return true; } catch { memory.set(key, String(value)); return false; } },
  removeItem(key) { memory.delete(key); try { localStorage.removeItem(key); } catch {} }
};
const COMPLETE = 'snazzleWelcomeCompleteV1';
const WORLD = 'snazzleCardWorldPreference';
export function onboardingComplete() {
  return profileStorage.getItem(COMPLETE) === '1' || (profileStorage.getItem('snazzleName') || '').trim().length >= 2;
}
export function selectWorld(world) {
  if (!['wild', 'spark', 'mix'].includes(world)) return;
  profileStorage.setItem(WORLD, world);
  document.querySelectorAll('#onboarding [data-sn-world]').forEach(button => {
    const selected = button.dataset.snWorld === world;
    button.classList.toggle('on', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  window.dispatchEvent(new CustomEvent('snazzle-card-world-change', { detail: { preference: world } }));
}
export function finishWelcome(name = '') {
  if (name) profileStorage.setItem('snazzleName', name.trim().slice(0, 20));
  if (!['wild', 'spark', 'mix'].includes(profileStorage.getItem(WORLD))) selectWorld('mix');
  profileStorage.setItem(COMPLETE, '1');
  document.getElementById('onboarding')?.classList.remove('show');
  document.getElementById('snWorldPrompt79')?.remove();
}
function init() {
  const welcome = document.getElementById('onboarding');
  if (!welcome) return;
  if (onboardingComplete()) { finishWelcome(); return; }
  selectWorld(profileStorage.getItem(WORLD) || 'mix');
  welcome.classList.add('show');
  document.getElementById('finishOnboarding').onclick = () => {
    const name = document.getElementById('firstNameInput').value.trim();
    if (name.length < 2) { document.getElementById('firstNameInput').reportValidity(); return; }
    finishWelcome(name);
  };
  document.getElementById('skipOnboarding').onclick = () => finishWelcome();
}
document.addEventListener('click', event => {
  const button = event.target.closest?.('#onboarding [data-sn-world]');
  if (button) selectWorld(button.dataset.snWorld);
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
