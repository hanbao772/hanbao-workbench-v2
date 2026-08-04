const CACHE_NAME = 'workbench-v5';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.png',
];

// 安装时缓存核心资源，并立即激活新版 SW
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 激活时：清理所有旧缓存（workbench-v3 及更早），并接管所有页面
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 网络优先；index.html 永远不缓存、不回退旧版，保证最新模块立即生效
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isIndex = url.pathname.endsWith('/index.html') || url.pathname.endsWith('/') || url.pathname.endsWith('/hanbao-workbench-v2/');
  if (isIndex) {
    // 直接走网络，绝不读缓存
    e.respondWith(fetch(e.request).catch(() => fetch('./index.html?t=' + Date.now())));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});