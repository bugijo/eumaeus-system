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
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    location: { origin: 'https://app.example.test' }
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
  it('never intercepts API requests, so data always comes from the server', () => {
    const fetchMock = vi.fn();
    const cachesMock = { delete: vi.fn(), keys: vi.fn(), match: vi.fn(), open: vi.fn() };
    const { listeners } = loadServiceWorker(cachesMock, fetchMock);
    const respondWith = vi.fn();

    listeners.get('fetch')?.({ request: { method: 'GET', mode: 'cors', url: 'https://app.example.test/api/tutors?page=1' }, respondWith });
    listeners.get('fetch')?.({ request: { method: 'POST', mode: 'cors', url: 'https://app.example.test/api/sales' }, respondWith });

    expect(respondWith).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cachesMock.open).not.toHaveBeenCalled();
    expect(cachesMock.match).not.toHaveBeenCalled();
  });

  it('purges every legacy Eumaeus cache during activation and keeps third-party caches', async () => {
    const cachesMock = {
      keys: vi.fn().mockResolvedValue(['eumaeus-api-v1.0', 'eumaeus-api-v2.0', 'eumaeus-v1.0', 'eumaeus-v2.0', 'eumaeus-static-v2.0', 'eumaeus-v3', 'third-party-cache']),
      delete: vi.fn().mockResolvedValue(true),
      open: vi.fn(),
    };
    const { listeners, worker } = loadServiceWorker(cachesMock, vi.fn());
    let activationPromise: Promise<unknown> | undefined;
    listeners.get('activate')?.({ waitUntil: (promise: Promise<unknown>) => { activationPromise = promise; } });
    await activationPromise;

    for (const legacy of ['eumaeus-api-v1.0', 'eumaeus-api-v2.0', 'eumaeus-v1.0', 'eumaeus-v2.0', 'eumaeus-static-v2.0']) {
      expect(cachesMock.delete).toHaveBeenCalledWith(legacy);
    }
    expect(cachesMock.delete).not.toHaveBeenCalledWith('eumaeus-v3');
    expect(cachesMock.delete).not.toHaveBeenCalledWith('third-party-cache');
    expect(worker.clients.claim).toHaveBeenCalledTimes(1);
  });

  it('falls back to the cached app shell when navigation has no network', async () => {
    const shell = { ok: true, shell: true };
    const cachesMock = { keys: vi.fn(), delete: vi.fn(), open: vi.fn(), match: vi.fn().mockResolvedValue(shell) };
    const { listeners } = loadServiceWorker(cachesMock, vi.fn().mockRejectedValue(new Error('offline')));
    let responsePromise: Promise<unknown> | undefined;
    listeners.get('fetch')?.({ request: { method: 'GET', mode: 'navigate', url: 'https://app.example.test/caixa' }, respondWith: (promise: Promise<unknown>) => { responsePromise = promise; } });
    await expect(responsePromise).resolves.toBe(shell);
    expect(cachesMock.match).toHaveBeenCalledWith('/');
  });
});
