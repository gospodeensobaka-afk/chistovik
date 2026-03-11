/* ========================================================
   ================= SERVICE WORKER ========================
   Перехватывает все запросы к медиафайлам и отдаёт из
   CacheStorage (kzn-tour-v1) если файл там есть.
   Если нет — идёт в сеть как обычно.
   ======================================================== */

const CACHE_NAME = 'kzn-tour-v1';

// Устанавливаем SW — ничего не кэшируем сами,
// кэш заполняет preload.html
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Перехватываем все fetch-запросы
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Обрабатываем только медиафайлы нашего домена
    if (!url.includes('gospodeensobaka-afk.github.io/chistovik/')) {
        return; // всё остальное — не трогаем
    }

    const isMedia = /\.(mp3|m4a|mp4|jpg|jpeg|png|webp)$/i.test(url.split('?')[0]);
    if (!isMedia) return;

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cached = await cache.match(event.request);
            if (cached) {
                return cached; // отдаём из кэша
            }
            // Нет в кэше — идём в сеть
            return fetch(event.request);
        })
    );
});