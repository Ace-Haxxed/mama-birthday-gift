# How to open this site (works 100% offline)

## The one thing you need to know

**Do not double-click `index.html`.**

The 3D globe is built from JavaScript *ES modules*. For security reasons every
browser (Chrome, Edge, Firefox…) **refuses to load ES modules from the
`file://` protocol** — i.e. when you open an HTML file straight off the disk.
When that happens the globe can't start, and the old code wrongly blamed it on
the internet.

It was never an internet problem. Every asset the globe needs — the Three.js
engine, the camera controls, and all four Earth textures — is stored **locally
in this folder**. It just has to be served over `http://` instead of `file://`.

## The fix — start the local server

Double-click:

```
start-offline.bat
```

That starts a tiny web server **on your own computer** (`http://localhost:8765/`)
and opens the site in your browser. No internet is used at any point.

**You can turn Wi-Fi OFF and the globe still loads and animates.**

Keep the little black window open while you view the site. Close it when done.

### Alternatives (if you prefer)

- **VS Code:** install the *Live Server* extension, right-click `index.html`
  → *Open with Live Server*.
- **Python (manual):** open a terminal in this folder and run
  `python -m http.server 8765`, then visit `http://localhost:8765/`.
- **Node:** `npx http-server -p 8765 -c-1`

## Verified offline

- Served over `http://`, `import("./journey.js")` loads successfully and the
  globe renders — with the network disabled.
- Opened as `file://`, the browser throws
  `TypeError: Failed to fetch dynamically imported module` — this is the
  browser's CORS rule, not a missing file and not the internet.
