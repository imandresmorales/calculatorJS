/**
 * sw.js — Service Worker (Improvement #37)
 * Strategy: Cache-First for static assets, Network-First for everything else.
 * Provides full offline support after the first visit.
 */

// Cambia la versión en cada despliegue para que los usuarios reciban los archivos nuevos
const CACHE_NAME = 'calc-premium-v16';

/** Archivos estáticos que se guardan al instalar (deben coincidir con index.html) */
const PRECACHE_URLS = [
    './',
    'index.html',
    'css/themes.css',
    'css/style.css',
    'css/toast.css',
    'js/sw-register.js',
    'js/db.js',
    'js/worker-manager.js',
    'js/toast.js',
    'js/script.js',
    'js/matrices.js',
    'js/history.js',
    'js/math-parser.js',
    'js/grapher.js',
    'js/programmer.js',
    'js/fractions.js',
    'js/stats.js',
    'js/favorites.js',
    'js/finance.js',
    'js/equations.js',
    'js/datetime.js',
    'js/health.js',
    'js/tips.js',
    'js/random.js',
    'js/themes.js',
    'js/scratchpad.js',
    'js/i18n.js',
    'js/backup.js',
    'js/keyboard-sounds.js',
    'js/gestures.js',
    'js/easter-eggs.js',
    'js/onboarding.js',
    'js/clock.js',
    'js/clipboard.js',
    'js/memory.js',
    'js/percentage.js',
    'js/sparkline.js',
    'js/exam-mode.js',
    'js/pdf-export.js',
    'js/geometry.js',
    'js/ieee754.js',
    'js/sci-notation.js',
    'js/presentation.js',
    'js/calc-worker.js',
    'manifest.json',
];

/* ── Install: pre-cache all static assets ─────────────────────────────────── */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

/* ── Activate: remove old caches ──────────────────────────────────────────── */
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

/* ── Fetch: Cache-First for same-origin, passthrough for external ─────────── */
self.addEventListener('fetch', event => {
    const { request } = event;

    // Only handle same-origin GET requests
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(request, { ignoreSearch: true }).then(cached => {
            if (cached) return cached;

            // Not cached → fetch and store
            return fetch(request).then(response => {
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
                return response;
            });
        })
    );
});
