import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

type ServiceWorkerHandler = (event: Record<string, unknown>) => void;

const serviceWorkerSource = readFileSync(
  resolve(process.cwd(), 'public/sw.js'),
  'utf8'
);

function loadServiceWorker(
  cachesMock: Record<string, unknown>,
  fetchMock: ReturnType<typeof vi.fn>
) {
  const listeners = new Map<string, ServiceWorkerHandler>();
  const worker = {
    addEventListener: vi.fn((type: string, handler: ServiceWorkerHandler) => {
      listeners.set(type, handler);
    }),
    clients: {
      claim: vi.fn().mockResolvedValue(undefined),
      matchAll: vi.fn().mockResolvedValue([])
    },
    registration: {
      sync: {
        register: vi.fn().mockResolvedValue(undefined)
      }
    },
    skipWaiting: vi.fn().mockResolvedValue(undefined)
  };

  runInNewContext(serviceWorkerSource, {
    URL,
    caches: cachesMock,
    console: {
      error: vi.fn(),
      log: vi.fn()
    },
    fetch: fetchMock,
    self: worker,
    setInterval: vi.fn()
  });

  return { listeners, worker };
}

describe('service worker API cache policy', () => {
  it('uses network-only for API requests and never falls back to Cache Storage', async () => {
    const networkError = new Error('network unavailable');
    const fetchMock = vi.fn().mockRejectedValue(networkError);
    const cachesMock = {
      delete: vi.fn(),
      keys: vi.fn(),
      match: vi.fn(),
      open: vi.fn()
    };
    const { listeners } = loadServiceWorker(cachesMock, fetchMock);
    const fetchHandler = listeners.get('fetch');
    let responsePromise: Promise<unknown> | undefined;

    fetchHandler?.({
      request: {
        method: 'GET',
        url: 'https://app.example.test/api/tutors?page=1'
      },
      respondWith: (promise: Promise<unknown>) => {
        responsePromise = promise;
      }
    });

    expect(responsePromise).toBeDefined();
    await expect(responsePromise).rejects.toBe(networkError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cachesMock.open).not.toHaveBeenCalled();
    expect(cachesMock.match).not.toHaveBeenCalled();
  });

  it('purges legacy API caches and residual API entries during activation', async () => {
    const currentCacheEntries = new Map([
      [
        'eumaeus-v2.0',
        [
          'https://app.example.test/api/dashboard/stats',
          'https://app.example.test/index.html'
        ]
      ],
      [
        'eumaeus-static-v2.0',
        [
          'https://app.example.test/api/pets',
          'https://app.example.test/assets/app.js'
        ]
      ]
    ]);
    const deletedEntries: string[] = [];
    const cachesMock = {
      keys: vi.fn().mockResolvedValue([
        'eumaeus-api-v1.0',
        'eumaeus-api-v2.0',
        'eumaeus-v1.0',
        'eumaeus-v2.0',
        'eumaeus-static-v2.0',
        'third-party-cache'
      ]),
      delete: vi.fn().mockResolvedValue(true),
      open: vi.fn(async (cacheName: string) => ({
        delete: vi.fn(async (request: { url: string }) => {
          deletedEntries.push(request.url);
          return true;
        }),
        keys: vi.fn().mockResolvedValue(
          (currentCacheEntries.get(cacheName) ?? []).map(url => ({ url }))
        )
      }))
    };
    const { listeners, worker } = loadServiceWorker(cachesMock, vi.fn());
    const activateHandler = listeners.get('activate');
    let activationPromise: Promise<unknown> | undefined;

    activateHandler?.({
      waitUntil: (promise: Promise<unknown>) => {
        activationPromise = promise;
      }
    });

    expect(activationPromise).toBeDefined();
    await activationPromise;

    expect(cachesMock.delete).toHaveBeenCalledWith('eumaeus-api-v1.0');
    expect(cachesMock.delete).toHaveBeenCalledWith('eumaeus-api-v2.0');
    expect(cachesMock.delete).toHaveBeenCalledWith('eumaeus-v1.0');
    expect(cachesMock.delete).not.toHaveBeenCalledWith('third-party-cache');
    expect(deletedEntries).toHaveLength(2);
    expect(deletedEntries).toEqual(expect.arrayContaining([
      'https://app.example.test/api/dashboard/stats',
      'https://app.example.test/api/pets'
    ]));
    expect(worker.clients.claim).toHaveBeenCalledTimes(1);
  });
});
