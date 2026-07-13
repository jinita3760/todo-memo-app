// 오프라인에서도 앱 화면(껍데기)이 열리도록 하는 최소 서비스 워커.
// 일정 데이터(/api/schedule)는 항상 네트워크에서 최신 상태로 가져오고,
// 앱의 정적 파일만 캐싱해서 오프라인일 때도 앱은 열리게 한다.
const CACHE_NAME = 'memo-calendar-shell-v3';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 일정 데이터 API는 항상 네트워크 우선 (캐시하지 않음)
  if (url.pathname.startsWith('/api/schedule')) {
    event.respondWith(fetch(event.request).catch(() => new Response(null, { status: 503 })));
    return;
  }

  // 그 외 정적 파일은 캐시 우선, 실패하면 네트워크
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
