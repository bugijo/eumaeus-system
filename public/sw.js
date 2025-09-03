// Service Worker v2 - Cache inteligente e sincronização avançada
const CACHE_NAME = 'eumaeus-v2.0';
const API_CACHE_NAME = 'eumaeus-api-v2.0';
const STATIC_CACHE_NAME = 'eumaeus-static-v2.0';
const DYNAMIC_CACHE_NAME = 'eumaeus-dynamic-v2.0';

// Estratégias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Configuração de rotas e estratégias
const ROUTE_STRATEGIES = [
  {
    pattern: /\.(js|css|woff2?|ttf|eot)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: STATIC_CACHE_NAME,
    maxAge: 365 * 24 * 60 * 60 * 1000 // 1 ano
  },
  {
    pattern: /\.(png|jpg|jpeg|gif|svg|webp|avif)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: STATIC_CACHE_NAME,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
  },
  {
    pattern: /\/api\/dashboard\//,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: API_CACHE_NAME,
    maxAge: 5 * 60 * 1000 // 5 minutos
  },
  {
    pattern: /\/api\/(tutors|pets|appointments)$/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: API_CACHE_NAME,
    maxAge: 2 * 60 * 1000 // 2 minutos
  },
  {
    pattern: /\/api\//,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: API_CACHE_NAME,
    maxAge: 1 * 60 * 1000 // 1 minuto
  }
];

// URLs para pré-cache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Fila de sincronização em background
let syncQueue = [];
let isOnline = true;

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW v2] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Pré-cache de recursos críticos
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(PRECACHE_URLS)),
      
      // Configurar background sync
      self.registration.sync?.register('background-sync')
    ])
    .then(() => {
      console.log('[SW v2] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW v2] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      cleanOldCaches(),
      
      // Reivindicar controle de todas as abas
      self.clients.claim(),
      
      // Inicializar monitoramento
      initializeMonitoring()
    ])
    .then(() => {
      console.log('[SW v2] Activation complete');
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Encontrar estratégia para a rota
  const routeConfig = findRouteStrategy(url.pathname);
  
  if (routeConfig) {
    event.respondWith(handleRequest(request, routeConfig));
  }
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// Monitorar status online/offline
self.addEventListener('online', () => {
  isOnline = true;
  console.log('[SW v2] Back online - processing sync queue');
  processSyncQueue();
});

self.addEventListener('offline', () => {
  isOnline = false;
  console.log('[SW v2] Gone offline - queuing requests');
});

// Encontrar estratégia de cache para rota
function findRouteStrategy(pathname) {
  return ROUTE_STRATEGIES.find(route => route.pattern.test(pathname));
}

// Lidar com requisições baseado na estratégia
async function handleRequest(request, config) {
  const { strategy, cacheName, maxAge } = config;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request);
    
    default:
      return fetch(request);
  }
}

// Estratégia Cache First
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, addTimestamp(responseClone));
    }
    
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      console.log('[SW v2] Network failed, serving stale cache');
      return cachedResponse;
    }
    throw error;
  }
}

// Estratégia Network First
async function networkFirst(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      await cache.put(request, addTimestamp(responseClone));
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW v2] Network failed, trying cache');
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Buscar da rede em background
  const networkPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        const responseClone = response.clone();
        cache.put(request, addTimestamp(responseClone));
      }
      return response;
    })
    .catch(error => {
      console.log('[SW v2] Background update failed:', error);
    });
  
  // Retornar cache imediatamente se disponível
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Aguardar rede se não há cache
  return networkPromise;
}

// Adicionar timestamp à resposta
function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Verificar se resposta expirou
function isExpired(response, maxAge) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return true;
  
  const age = Date.now() - parseInt(cachedAt);
  return age > maxAge;
}

// Limpar caches antigos
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  
  return Promise.all(
    cacheNames.map(cacheName => {
      if (!validCaches.includes(cacheName)) {
        console.log('[SW v2] Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
}

// Processar fila de sincronização
async function processSyncQueue() {
  if (!isOnline || syncQueue.length === 0) {
    return;
  }
  
  console.log(`[SW v2] Processing ${syncQueue.length} queued requests`);
  
  const processedItems = [];
  
  for (const item of syncQueue) {
    try {
      const response = await fetch(item.request);
      
      if (response.ok) {
        processedItems.push(item);
        
        // Notificar cliente sobre sucesso
        notifyClients({
          type: 'SYNC_SUCCESS',
          data: { id: item.id, response: await response.json() }
        });
      }
    } catch (error) {
      console.log('[SW v2] Sync failed for item:', item.id, error);
    }
  }
  
  // Remover itens processados da fila
  syncQueue = syncQueue.filter(item => !processedItems.includes(item));
  
  console.log(`[SW v2] Processed ${processedItems.length} items, ${syncQueue.length} remaining`);
}

// Inicializar monitoramento
function initializeMonitoring() {
  // Monitorar performance
  if ('PerformanceObserver' in self) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          console.log('[SW v2] Navigation timing:', {
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            firstPaint: entry.responseEnd - entry.requestStart
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation'] });
  }
  
  // Limpeza automática de cache a cada hora
  setInterval(cleanExpiredCache, 60 * 60 * 1000);
}

// Limpar cache expirado
async function cleanExpiredCache() {
  const cacheNames = [API_CACHE_NAME, DYNAMIC_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        
        if (response) {
          const routeConfig = findRouteStrategy(new URL(request.url).pathname);
          const maxAge = routeConfig?.maxAge || 60 * 60 * 1000; // 1 hora padrão
          
          if (isExpired(response, maxAge)) {
            await cache.delete(request);
            console.log('[SW v2] Cleaned expired cache for:', request.url);
          }
        }
      }
    } catch (error) {
      console.error('[SW v2] Error cleaning cache:', error);
    }
  }
}

// Notificar clientes
function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Lidar com mensagens dos clientes
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'QUEUE_SYNC':
      syncQueue.push({
        id: data.id,
        request: new Request(data.url, data.options),
        timestamp: Date.now()
      });
      
      if (isOnline) {
        processSyncQueue();
      }
      break;
    
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage(stats);
      });
      break;
    
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    
    case 'FORCE_UPDATE':
      self.skipWaiting();
      break;
  }
});

// Obter estatísticas de cache
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    stats[cacheName] = {
      entries: requests.length,
      size: await calculateCacheSize(cache, requests)
    };
  }
  
  return {
    caches: stats,
    syncQueue: syncQueue.length,
    isOnline,
    version: '2.0'
  };
}

// Calcular tamanho do cache
async function calculateCacheSize(cache, requests) {
  let totalSize = 0;
  
  for (const request of requests.slice(0, 10)) { // Limitar para performance
    try {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    } catch (error) {
      // Ignorar erros
    }
  }
  
  return totalSize;
}

// Limpar todos os caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map(name => caches.delete(name)));
}

console.log('[SW v2] Service Worker loaded with advanced caching strategies');