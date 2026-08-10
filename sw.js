const CACHE = 'emotionbin-v2';
const LOCAL_URLS = [
  '/', '/index.html',
  '/css/style.css',
  '/js/app.js', '/js/effects.js', '/js/trash-mountain.js',
  '/js/drum-scene.js', '/js/ai.js', '/js/lang.js',
  '/js/supabase-db.js',
  '/manifest.json', '/icon.svg', '/icon-192.png', '/icon-512.png',
  '/privacy.html', '/terms.html', '/disclaimer.html',
  '/about.html', '/contact.html', '/faq.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(LOCAL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 로컬 리소스만 캐시에서 응답, 외부 리소스는 네트워크로
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => new Response('', { status: 503 })))
    );
  } else {
    // 외부 리소스(CDN 등)는 캐시 안 하고 네트워크로
    e.respondWith(fetch(e.request));
  }
});