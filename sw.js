// Offline cache for Card → WhatsApp.
// Everything the page needs (including the OCR engine and language data) is
// stored on the phone on the first visit, so later visits need no network.
// Bump VERSION whenever any cached file changes.
const VERSION = 'c2w-v6';
const SCOPE_PATH = new URL('./', self.location).pathname;

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'vendor/fonts/inter-latin-400-normal.woff2',
  'vendor/fonts/inter-latin-500-normal.woff2',
  'vendor/fonts/inter-latin-600-normal.woff2',
  'vendor/fonts/fraunces-latin-500-normal.woff2',
  'vendor/fonts/fraunces-latin-600-normal.woff2',
  'vendor/tesseract/tesseract.min.js',
  'vendor/tesseract/worker.min.js',
  'vendor/lang/eng.traineddata.gz',
];

// Tesseract picks the SIMD or plain wasm core per device; only fetch the one
// this phone will use (each is ~4 MB). Same check as wasm-feature-detect.
function coreFile() {
  let simd = false;
  try {
    simd = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
  } catch (e) { /* no wasm SIMD */ }
  return simd
    ? 'vendor/tesseract-core/tesseract-core-simd-lstm.wasm.js'
    : 'vendor/tesseract-core/tesseract-core-lstm.wasm.js';
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll([...SHELL, coreFile()]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((c) => c.postMessage('c2w-cached'));
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // The app page: try the network first so edits (like the message) show up
  // right away, but give up after a few seconds on a weak signal and use the
  // saved copy. Other pages (e.g. PDFs) are left alone.
  const isAppPage = url.pathname === SCOPE_PATH || url.pathname === SCOPE_PATH + 'index.html';
  if (req.mode === 'navigate' && isAppPage) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const fresh = fetch(req, { cache: 'no-cache' }).then((res) => {
        if (res.ok) cache.put('index.html', res.clone());
        return res;
      });
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 4000));
      try {
        const res = await Promise.race([fresh, timeout]);
        if (res && res.ok) return res;
      } catch (e) { /* offline */ }
      event.waitUntil(fresh.catch(() => null));
      return (await cache.match('index.html')) || fresh;
    })());
    return;
  }
  if (req.mode === 'navigate') return;

  // Everything else: cache first, and keep a copy of anything new.
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  })());
});
