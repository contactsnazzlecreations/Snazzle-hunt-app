# Snazzle UX regression tests

Run with Node 22 or newer:

```sh
npm ci --prefix tests
npm test --prefix tests
```

The tests run the current UI handlers in JSDOM with mocked Firebase, GPS,
camera, and image decoding. They verify onboarding persistence and skip,
legacy module interactions, empty hunts, isolated practice photos, collection
progress, hunt photo reset, admin preview escaping, and AR error/cancel paths.
They never connect to Firebase or write live hunt data.

Before publishing, additionally check the mobile layout and a real hunt on
Android Chrome and iPhone Safari: camera/file picker, verified photo retrieval,
denied permissions, an AR point nearby, no points nearby, cancellation, and
returning after a reload. JSDOM cannot validate rendering or physical GPS
accuracy. This change was not visually verified in a real browser because
Chromium could not launch in the execution environment (socket permission).

Practice photos and manual photo notes are stored only on the current device,
are removable from their screen, and do not grant verified hunt or AR rewards.
