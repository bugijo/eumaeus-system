import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { logger as appLogger } from './utils/logger';

vi.mock('@prisma/client', () => {
  const createModelMock = () => ({
    findMany: vi.fn(async () => []),
    findFirst: vi.fn(async () => null),
    count: vi.fn(async () => 0),
    create: vi.fn(async ({ data }: { data?: unknown }) => data ?? null),
    update: vi.fn(async ({ data }: { data?: unknown }) => data ?? null),
    delete: vi.fn(async () => ({})),
  });

  class PrismaClientMock {
    $connect = vi.fn(async () => {});
    $disconnect = vi.fn(async () => {});
    $queryRaw = vi.fn(async () => 1);

    constructor() {
      return new Proxy(this, {
        get(target, prop, receiver) {
          if (prop in target) {
            return Reflect.get(target, prop, receiver);
          }

          return createModelMock();
        },
      });
    }
  }

  return { PrismaClient: PrismaClientMock };
});


declare global {
  // Permite que os testes escritos em Jest funcionem com Vitest
  // eslint-disable-next-line no-var
  var jest: typeof vi;
  namespace jest {
    type Mock = ReturnType<typeof vi.fn>;
  }
}

globalThis.jest = vi;
if (typeof globalThis.jest.mock !== 'function') {
  // @ts-ignore
  globalThis.jest.mock = vi.mock;
}

if (appLogger && typeof appLogger.error !== 'function') {
  // noop
} else {
  appLogger.error = vi.fn();
}

// Mock do matchMedia para testes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock do ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock do window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock do fetch
global.fetch = vi.fn();

// Mock do performance.now
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
});

// Mock do navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
    language: 'pt-BR',
    languages: ['pt-BR', 'en'],
    onLine: true,
    cookieEnabled: true,
  },
  writable: true,
});

// Mock do location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn(),
    assign: vi.fn(),
    replace: vi.fn(),
  },
  writable: true,
});

const originalDocumentQuerySelector = document.querySelector.bind(document);
const originalDocumentQuerySelectorAll = document.querySelectorAll.bind(document);

const normalizeSelector = (selector: string) =>
  selector
    .split('.bg-black\\/50')
    .join('[class~="bg-black/50"]')
    .split('.bg-black/50')
    .join('[class~="bg-black/50"]');

document.querySelector = ((selector: string) => {
  if (selector.includes('bg-black\\/50') || selector.includes('bg-black/50')) {
    return originalDocumentQuerySelector(normalizeSelector(selector));
  }
  return originalDocumentQuerySelector(selector);
}) as typeof document.querySelector;

document.querySelectorAll = ((selector: string) => {
  if (selector.includes('bg-black\\/50') || selector.includes('bg-black/50')) {
    return originalDocumentQuerySelectorAll(normalizeSelector(selector));
  }
  return originalDocumentQuerySelectorAll(selector);
}) as typeof document.querySelectorAll;

// Configuração global para testes
beforeEach(() => {
  // Limpar todos os mocks antes de cada teste
  vi.clearAllMocks();
  
  // Resetar localStorage e sessionStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Resetar fetch mock
  (global.fetch as jest.Mock).mockClear();
});

// Configuração para capturar erros de console durante os testes
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Ignorar warnings específicos do React Testing Library
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An invalid form control'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: any[]) => {
    // Ignorar warnings específicos
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Utilitários para testes
export const createMockResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    statusText: status === 200 ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
  } as Response);
};

export const mockFetch = (data: any, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(data, status));
};

export const mockFetchError = (error: Error) => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(error);
};

// Helper para aguardar atualizações assíncronas
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper para simular delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));