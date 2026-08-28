// Snazzle Cards safety stop v140.
// Deze tijdelijke force-renderer is bewust uitgeschakeld omdat hij via een
// MutationObserver en periodieke hertekening de bediening van de app kon blokkeren.
// Kaarten worden voortaan alleen via het normale Snazzle Card-systeem hersteld.

window.SnazzleCardForceRestoreV137={
  version:'140-disabled',
  count:0,
  disabled:true
};

console.info('Snazzle Cards: tijdelijke force-renderer veilig uitgeschakeld.');
