const CACHE = 'emotionbin-v1';
const URLS = [
  '/', '/index.html',
  '/css/style.css',
  '/js/app.js', '/js/effects.js', '/js/firebase-db.js',
  '/js/trash-mountain.js',
  '/manifest.json', '/icon.svg',
  '/privacy.html', '/terms.html', '/disclaimer.html',
  '/about.html', '/contact.html', '/faq.html',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => new Response('', { status: 503 })))
  );
});
