const CACHE_NAME = "quest-app-v3";
const urlsToCache = [
  "./",
  "./index.html",
  "./styles.css",
  "./scripts.js",
  "./quests.json",  
  "./icon.png",
  "./favicon.ico",
  "./manifest.json"
];

// Install service worker and cache files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch resources - cache-first strategy
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes('quests.json')) {
    event.respondWith(
      // Try the cache first
      caches.match(event.request)
        .then((response) => {
          // Return cache response if available
          if (response) {
            // Also trigger a background update of the cache
            fetch(event.request)
              .then(networkResponse => {
                if (networkResponse && networkResponse.ok) {
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, networkResponse.clone()));
                }
              })
              .catch(() => console.log('Failed to update quests.json cache'));
              
            return response;
          }
          
          // If not in cache, try network
          return fetch(event.request)
            .then(networkResponse => {
              // Clone response to cache it and return it
              if (networkResponse && networkResponse.ok) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, responseToCache));
              }
              return networkResponse;
            });
        })
        .catch(() => {
          // If offline and no cache, return a basic fallback
          const fallbackQuests = [
            {"quest": "Do 20 push-ups", "rank": "E", "time": "10min"},
            {"quest": "Take a 15-minute walk", "rank": "E", "time": "15min"},
            {"quest": "Drink a glass of water", "rank": "E", "time": "5min"},
            {"quest": "Stretch for 5 minutes", "rank": "E", "time": "5min"},
            {"quest": "Practice deep breathing for 3 minutes", "rank": "E", "time": "3min"}
          ];
          
          return new Response(JSON.stringify(fallbackQuests), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  } else {
    // Use the standard fetch handler for other requests
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return the response from the cached version
          if (response) {
            return response;
          }
          
          // Not in cache - fetch and cache
          return fetch(event.request).then(
            (networkResponse) => {
              // Check if we received a valid response
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }

              // Clone the response
              const responseToCache = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return networkResponse;
            }
          ).catch(() => {
            // If both cache and network fail, show an offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
        })
    );
  }
});
