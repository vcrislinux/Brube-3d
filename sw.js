const CACHE = "brube3d-v22";
const ASSETS = [
  "index.html",
  "calculadora.html",
  "orcamento.html",
  "orcamento-manual.html",
  "catalogo.html",
  "manual-atualizacao.html",
  "manual-config.html",
  "manual-calculadora.html",
  "manual-catalogo.html",
  "manual-orcamento.html",
  "css/estilo.css",
  "css/manual-ilustrado.css",
  "js/config.js",
  "js/formatadores.js",
  "js/calculadora.js",
  "js/dashboard.js",
  "js/orcamento.js",
  "js/orcamento-manual.js",
  "js/impressoras.js",
  "js/catalogo.js",
  "js/catalogo-storage.js",
  "js/foto-crop.js",
  "js/perfil.js",
  "js/settings.js",
  "js/pdf.js",
  "js/splash.js",
  "js/vendor/jspdf.umd.min.js",
  "js/pwa.js",
  "js/voltar-android.js",
  "js/manuais-config.js",
  "js/manuais.js",
  "js/licenca-config.js",
  "js/ativacao.js",
  "img/icon.png",
  "ico/apple-touch-icon.png",
  "ico/android-chrome-192x192.png",
  "ico/android-chrome-512x512.png",
  "manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(
        ASSETS.map((url) => c.add(url).catch(() => null))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return (
        cached ||
        fetch(e.request)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return resp;
          })
          .catch(() => caches.match("index.html"))
      );
    })
  );
});
