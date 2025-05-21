// Cache names
const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';
const IMMUTABLE_CACHE_NAME = 'immutable-cache-v1';

// Assets to cache immediately during installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/static/css/main.css',
  '/static/js/main.js'
];

// Third-party resources that won't change (can be cached longer)
const IMMUTABLE_ASSETS = [
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap',
  'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmEU9fBBc4.woff2'
];

// Install event - cache core static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing');
  
  self.skipWaiting(); // Activate immediately
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache immutable third-party assets
      caches.open(IMMUTABLE_CACHE_NAME).then((cache) => {
        console.log('[ServiceWorker] Caching immutable assets');
        return cache.addAll(IMMUTABLE_ASSETS);
      })
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating');
  
  // Take control of all clients immediately
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DYNAMIC_CACHE_NAME &&
            cacheName !== DATA_CACHE_NAME &&
            cacheName !== IMMUTABLE_CACHE_NAME
          ) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Helper function to determine if a request is for an API call
function isApiRequest(url) {
  return url.hostname === 'carauto01-production-8b0b.up.railway.app' &&
         url.pathname.startsWith('/api/');
}

// Helper function to determine if a request is for static assets
function isStaticAsset(url) {
  return url.pathname.startsWith('/static/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico');
}

// Network first with cache fallback for API requests
async function networkFirstWithCache(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, clone and cache response
    if (networkResponse.ok) {
      const clonedResponse = networkResponse.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, clonedResponse);
      });
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try from cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, throw error
    throw error;
  }
}

// Cache first with network fallback for static assets
async function cacheFirstWithNetwork(request, cacheName) {
  // Try from cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, get from network
  try {
    const networkResponse = await fetch(request);
    
    // Cache the fetched response
    if (networkResponse.ok) {
      const clonedResponse = networkResponse.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, clonedResponse);
      });
    }
    
    return networkResponse;
  } catch (error) {
    // If static asset request fails and it's an HTML request, return the offline page
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Stale-while-revalidate for dynamic content
async function staleWhileRevalidate(request, cacheName) {
  // Check the cache first
  const cachedResponse = await caches.match(request);
  
  // Clone the request because it's a stream that can only be consumed once
  const fetchPromise = fetch(request.clone())
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const clonedResponse = networkResponse.clone();
        caches.open(cacheName).then((cache) => {
          cache.put(request, clonedResponse);
        });
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('[ServiceWorker] Fetch failed:', error);
      throw error;
    });
  
  // Return the cached response immediately or wait for the network
  return cachedResponse || fetchPromise;
}

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (requestUrl.origin !== location.origin && 
      !requestUrl.hostname.includes('carauto01-production-8b0b.up.railway.app')) {
    return;
  }
  
  // Handle different types of requests
  if (isApiRequest(requestUrl)) {
    // API requests - network first with cache fallback
    event.respondWith(networkFirstWithCache(event.request, DATA_CACHE_NAME));
  } else if (isStaticAsset(requestUrl)) {
    // Static assets - cache first with network fallback
    event.respondWith(cacheFirstWithNetwork(event.request, STATIC_CACHE_NAME));
  } else if (requestUrl.pathname === '/' || requestUrl.pathname.endsWith('.html')) {
    // HTML - always fetch from network, fallback to cache
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
    );
  } else {
    // All other requests - stale-while-revalidate
    event.respondWith(staleWhileRevalidate(event.request, DYNAMIC_CACHE_NAME));
  }
});

// Handle message events (e.g., from main thread)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLEAR_CACHES') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

// Mock implementation - in real app, would use IndexedDB
async function syncPendingRequests() {
  // Here you would implement your offline sync logic
  console.log('[ServiceWorker] Syncing pending requests');
}
