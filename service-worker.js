// Service Worker for Torn Browser

const CACHE_NAME = 'torn-browser-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/sidebar.css',
  '/css/modals.css',
  '/css/forms.css',
  '/css/userscripts.css',
  '/js/utils.js',
  '/js/ui-manager.js',
  '/js/profile-manager.js',
  '/js/userscript-manager.js',
  '/js/api-client.js',
  '/js/browser-controls.js',
  '/js/app.js',
  '/templates/sidebar.html',
  '/templates/modals/profile-modal.html',
  '/templates/modals/userscript-modal.html',
  '/templates/modals/settings-modal.html'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // For API requests, go straight to network
  if (event.request.url.includes('api.torn.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - return the cached response
      if (response) {
        return response;
      }
      
      // Clone the request to avoid consuming it
      const fetchRequest = event.request.clone();
      
      return fetch(fetchRequest).then(response => {
        // Check valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response to cache and return it
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          // Only cache HTML, CSS, JS and template files
          const url = event.request.url;
          if (url.endsWith('.html') || 
              url.endsWith('.css') || 
              url.endsWith('.js') || 
              url.includes('/templates/')) {
            cache.put(event.request, responseToCache);
          }
        });
        
        return response;
      });
    })
  );
});

// Handle offline page - show friendly offline message
self.addEventListener('fetch', event => {
  // Only handle HTML requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
  }
});
