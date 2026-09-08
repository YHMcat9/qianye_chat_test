/* Sprout shell service worker
 *
 * Bump CACHE every time you edit app.html, or the old copy will keep
 * being served and you will spend an evening debugging a file that is
 * already correct.
 *
 * Deliberately narrow: it caches the shell and static assets, and it
 * never touches cross-origin requests. Figma streams from figma.com and
 * Chiba talks to the Vercel proxy — both must always go to the network.
 */

const CACHE = "sprout-v8";

const PRECACHE = [
  "./app.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // a missing icon must not block install
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.method !== "GET") return;                     // never touch API posts
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // never touch Figma or the proxy

  const isPage = req.mode === "navigate" || /\.html?$/.test(url.pathname);

  if (isPage) {
    // Network first: you always see the version you just pushed.
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match("./app.html")))
    );
    return;
  }

  // Images, fonts, scripts: cache first, they rarely change.
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
