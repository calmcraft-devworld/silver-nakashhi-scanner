# Card → WhatsApp

A one-page tool for the exhibition stall: photograph a visitor's visiting card,
confirm the phone number it reads off the card, and open WhatsApp with a
thank-you message already filled in.

## Works without internet

Everything the page needs lives in this repo — the OCR engine (Tesseract.js),
its English language data, and the fonts. There are no CDN or Google Fonts
calls. On the **first** visit (with internet), a service worker saves all of it
on the phone (about 7 MB). After that the page opens and reads cards with no
network at all; the footer shows **“✓ Saved on this phone — works without
internet.”** once that's done.

Only the final step — WhatsApp actually sending the message — needs signal, and
WhatsApp queues the message until it has some.

Tip: open the page once on good Wi-Fi before the exhibition, then use the
browser's **Add to Home screen** so it opens like an app.

## Hosting on GitHub Pages

1. Pages on a **private** repo needs a paid GitHub plan. On a free account,
   make the repo public first (Settings → General → Danger Zone → Change
   visibility). Nothing secret is in here.
2. Settings → Pages → *Build and deployment* → Source: **Deploy from a
   branch**, pick the branch that has these files (e.g. `main`) and folder
   **/ (root)**, then Save.
3. After a minute the site is at
   `https://calmcraft-devworld.github.io/silver-nakashhi-scanner/`.

## Updating

When you change any file, bump `VERSION` in `sw.js` (e.g. `c2w-v2`) so phones
pick up the new copy. Phones load the saved version instantly and fetch the
update in the background; it shows on the next open.

## Files

- `index.html` — the whole app (HTML/CSS/JS, no build step)
- `sw.js` — offline cache
- `manifest.webmanifest`, `icon*` — home-screen install
- `vendor/` — Tesseract.js 5.1.1, tesseract.js-core 5.1.1 (LSTM wasm builds),
  `eng` best_int language data, Inter and Fraunces fonts. Licenses in
  `vendor/licenses/` (Apache-2.0 for Tesseract, SIL OFL 1.1 for the fonts).
