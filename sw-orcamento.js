// Service worker do app de orçamento: guarda o app no celular para abrir sem internet.
// Ao mudar algum arquivo do app, aumente a versão para os celulares baixarem de novo.
const CACHE = 'pacheco-orcamento-v1';
const ARQUIVOS = [
  'orcamento.html',
  'manifest.webmanifest',
  'js/jspdf.umd.min.js',
  'js/jspdf.plugin.autotable.min.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith('pacheco-orcamento-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const proprio = url.origin === location.origin;
  const fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!proprio && !fonte) return;

  // A página do app: tenta a versão nova pela internet; sem sinal, abre a guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copia = res.clone(); caches.open(CACHE).then((c) => c.put('orcamento.html', copia)); return res; })
        .catch(() => caches.match('orcamento.html'))
    );
    return;
  }

  // Bibliotecas, ícones e fontes: usa o guardado e atualiza por trás.
  e.respondWith(
    caches.match(req).then((guardado) => {
      const rede = fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
        return res;
      }).catch(() => guardado);
      return guardado || rede;
    })
  );
});
