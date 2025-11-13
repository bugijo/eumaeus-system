import { useAuthStore } from '../stores/authStore';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Primitive = string | number | boolean | null | undefined;

type Params = Record<string, Primitive | Primitive[]>;

type HeadersMap = Record<string, string>;

type RequestBody = BodyInit | Record<string, unknown> | undefined;

export interface RequestConfig {
  url?: string;
  method?: Method;
  headers?: HeadersMap;
  params?: Params;
  data?: unknown;
  body?: RequestBody;
  timeout?: number;
  signal?: AbortSignal;
  retry?: number;
  skipAuth?: boolean;
  _retry?: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: HeadersMap;
  config: FinalRequestConfig;
  raw: Response;
}

interface ApiError<T = unknown> extends Error {
  config: FinalRequestConfig;
  response?: ApiResponse<T>;
  status?: number;
}

interface Interceptor<T> {
  onFulfilled?: (value: T) => T | Promise<T>;
  onRejected?: (error: any) => any;
}

class InterceptorManager<T> {
  private handlers: Array<Interceptor<T> | null> = [];

  use(onFulfilled?: Interceptor<T>['onFulfilled'], onRejected?: Interceptor<T>['onRejected']): number {
    this.handlers.push({ onFulfilled, onRejected });
    return this.handlers.length - 1;
  }

  eject(id: number) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  async run(value: T, reverse = false): Promise<T> {
    const handlers = reverse ? [...this.handlers].reverse() : this.handlers;
    let current = value;

    for (const handler of handlers) {
      if (!handler?.onFulfilled) continue;
      current = await handler.onFulfilled(current);
    }

    return current;
  }

  async runError(error: any, reverse = false): Promise<any> {
    const handlers = reverse ? [...this.handlers].reverse() : this.handlers;
    let currentError = error;

    for (const handler of handlers) {
      if (!handler?.onRejected) continue;

      const result = await handler.onRejected(currentError);

      if (result !== undefined) {
        return result;
      }
    }

    throw currentError;
  }
}

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRY = 2;

const DEFAULT_HEADERS: HeadersMap = {
  'Content-Type': 'application/json',
};

const buildSearch = (params?: Params): string => {
  if (!params) return '';

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const isJsonLike = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !(value instanceof FormData) && !(value instanceof URLSearchParams);

const getHeaderValue = (headers: any, key: string): string | undefined => {
  if (!headers) return undefined;

  if (typeof headers.get === 'function') {
    return headers.get(key) ?? undefined;
  }

  if (typeof headers === 'object') {
    const entry = Object.entries(headers).find(([headerKey]) => headerKey.toLowerCase() === key.toLowerCase());
    return entry ? String(entry[1]) : undefined;
  }

  return undefined;
};

const parseResponseBody = async (response: any) => {
  const contentType = getHeaderValue(response?.headers, 'content-type') ?? '';

  if (typeof response?.json === 'function' && (!contentType || contentType.includes('application/json'))) {
    try {
      return await response.json();
    } catch {
      // fall back to text parsing if json parsing falhar
    }
  }

  if (typeof response?.text === 'function') {
    const text = await response.text();
    if (!text) return undefined;
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return text;
  }

  if ('body' in (response ?? {}) && response.body !== undefined) {
    return response.body;
  }

  return undefined;
};

const toHeadersMap = (headers: any): HeadersMap => {
  if (!headers) {
    return {};
  }

  if (typeof headers.forEach === 'function') {
    const result: HeadersMap = {};
    headers.forEach((value: string, key: string) => {
      result[key.toLowerCase()] = value;
    });
    return result;
  }

  if (typeof headers === 'object') {
    return Object.entries(headers).reduce<HeadersMap>((acc, [key, value]) => {
      acc[key.toLowerCase()] = String(value);
      return acc;
    }, {});
  }

  return {};
};

type FinalRequestConfig = Required<Pick<RequestConfig, 'method' | 'url'>> &
  RequestConfig & {
    headers: HeadersMap;
  };

class HttpClient {
  readonly defaults: {
    baseURL: string;
    timeout: number;
    headers: { common: HeadersMap };
    retry: number;
  };

  readonly interceptors = {
    request: new InterceptorManager<FinalRequestConfig>(),
    response: new InterceptorManager<ApiResponse>(),
  };

  constructor(baseURL: string) {
    this.defaults = {
      baseURL: normalizeBaseUrl(baseURL),
      timeout: DEFAULT_TIMEOUT,
      headers: { common: { ...DEFAULT_HEADERS } },
      retry: DEFAULT_RETRY,
    };
  }

  private createConfig(config: RequestConfig): FinalRequestConfig {
    const method = (config.method ?? 'GET').toUpperCase() as Method;
    const url = config.url ?? '/';

    const headers: HeadersMap = {
      ...this.defaults.headers.common,
      ...(config.headers ?? {}),
    };

    return {
      ...config,
      method,
      url,
      headers,
    };
  }

  private resolveUrl(url: string, params?: Params) {
    const base = this.defaults.baseURL;
    const normalized = url.startsWith('http') ? url : `${base}/${url.replace(/^\/+/, '')}`;
    const search = buildSearch(params);

    if (!search) return normalized;

    const [cleanUrl, existingQuery] = normalized.split('?');
    return existingQuery ? `${cleanUrl}?${existingQuery}&${search.slice(1)}` : `${cleanUrl}${search}`;
  }

  private resolveBody(config: FinalRequestConfig): BodyInit | undefined {
    if (config.method === 'GET' || config.method === 'DELETE') {
      return undefined;
    }

    if (config.body instanceof FormData || config.body instanceof URLSearchParams || typeof config.body === 'string') {
      return config.body as BodyInit;
    }

    if (isJsonLike(config.data)) {
      return JSON.stringify(config.data);
    }

    if (config.data !== undefined) {
      return JSON.stringify(config.data);
    }

    if (isJsonLike(config.body)) {
      return JSON.stringify(config.body);
    }

    return config.body as BodyInit | undefined;
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeout: number) {
    if (!timeout || timeout <= 0) {
      return fetch(url, init);
    }

    const effectiveTimeout = Math.min(timeout, 4500);
    const controller = new AbortController();
    const hasExternalSignal = !!init.signal;
    const signal = hasExternalSignal ? init.signal : controller.signal;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        if (!hasExternalSignal) {
          controller.abort();
        }

        const timeoutError = new Error('Request timeout');
        timeoutError.name = 'TimeoutError';
        reject(timeoutError);
      }, effectiveTimeout);
    });

    try {
      return (await Promise.race([
        fetch(url, { ...init, signal }),
        timeoutPromise,
      ])) as Response;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async execute(config: FinalRequestConfig): Promise<ApiResponse> {
    const preparedConfig = await this.interceptors.request.run(config);

    const timeout = preparedConfig.timeout ?? this.defaults.timeout;
    const retry = preparedConfig.retry ?? this.defaults.retry;
    const url = this.resolveUrl(preparedConfig.url, preparedConfig.params);
    const body = this.resolveBody(preparedConfig);

    const headers: HeadersMap = { ...preparedConfig.headers };

    if (body && headers['content-type']?.includes('application/json') && typeof body !== 'string') {
      headers['content-type'] = 'application/json';
    }

    const init: RequestInit = {
      method: preparedConfig.method,
      headers,
      body,
      signal: preparedConfig.signal,
    };

    let attempt = 0;
    let lastError: any;

    while (attempt <= retry) {
      try {
        const rawResponse = await this.fetchWithTimeout(url, init, timeout);

        if (!rawResponse && lastError) {
          throw lastError;
        }

        const fallbackResponse = {
          ok: true,
          status: 204,
          headers: {},
        };

        const responseLike: any = rawResponse ?? fallbackResponse;
        const headersMap = toHeadersMap(responseLike.headers);
        const data = await parseResponseBody(responseLike);
        const status = typeof responseLike.status === 'number' ? responseLike.status : responseLike.ok === false ? 500 : 200;
        const ok = 'ok' in responseLike ? !!responseLike.ok : status >= 200 && status < 300;

        const payload: ApiResponse = {
          data,
          status,
          headers: headersMap,
          config: preparedConfig,
          raw: (rawResponse ?? ({} as Response)),
        };

        if (!ok) {
          const error: ApiError = new Error(responseLike.statusText || 'Request failed');
          error.config = preparedConfig;
          error.response = payload;
          error.status = status;
          throw error;
        }

        return this.interceptors.response.run(payload, true);
      } catch (error) {
        lastError = error;

        const shouldRetry =
          attempt < retry &&
          (!('status' in (error as ApiError)) || ((error as ApiError).status ?? 0) >= 500);

        if (!shouldRetry) {
          return this.handleResponseError(error, preparedConfig);
        }

        attempt += 1;
      }
    }

    throw lastError;
  }

  private async handleResponseError(error: any, config: FinalRequestConfig) {
    if ((error as ApiError)?.response || (error as ApiError)?.status) {
      return this.interceptors.response.runError(error, true);
    }

    const wrappedError: ApiError = error instanceof Error ? error : new Error('Request failed');
    wrappedError.config = config;
    return this.interceptors.response.runError(wrappedError, true);
  }

  request<T = unknown>(config: RequestConfig | string, maybeConfig?: RequestConfig): Promise<ApiResponse<T>> {
    if (typeof config === 'string') {
      return this.execute(this.createConfig({ ...(maybeConfig ?? {}), url: config }));
    }

    return this.execute(this.createConfig(config));
  }

  get<T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request({ ...(config ?? {}), method: 'GET', url });
  }

  delete<T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request({ ...(config ?? {}), method: 'DELETE', url });
  }

  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request({ ...(config ?? {}), method: 'POST', url, data });
  }

  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request({ ...(config ?? {}), method: 'PUT', url, data });
  }

  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request({ ...(config ?? {}), method: 'PATCH', url, data });
  }
}

const baseURL = normalizeBaseUrl(import.meta.env.VITE_API_URL ?? 'http://localhost:3333');
const client = new HttpClient(`${baseURL}/api`);

const apiClient = ((config: RequestConfig | string, maybeConfig?: RequestConfig) =>
  client.request(config as any, maybeConfig)) as unknown as HttpClient &
  ((config: RequestConfig | string, maybeConfig?: RequestConfig) => Promise<ApiResponse>);

apiClient.request = client.request.bind(client);
apiClient.get = client.get.bind(client);
apiClient.post = client.post.bind(client);
apiClient.put = client.put.bind(client);
apiClient.delete = client.delete.bind(client);
apiClient.patch = client.patch.bind(client);
apiClient.defaults = client.defaults;
apiClient.interceptors = client.interceptors;

const getStoredTokens = () => {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  try {
    const store = useAuthStore.getState?.();
    accessToken = store?.token ?? null;
    refreshToken = store?.refreshToken ?? null;
  } catch {
    // ignore store lookup issues
  }

  try {
    accessToken = accessToken ?? localStorage.getItem('token');
  } catch {
    // ignore storage access
  }

  try {
    refreshToken = refreshToken ?? localStorage.getItem('refreshToken');
  } catch {
    // ignore storage access
  }

  if (!accessToken) {
    try {
      const persisted = localStorage.getItem('auth-storage');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        accessToken = parsed?.state?.token ?? accessToken;
        refreshToken = parsed?.state?.refreshToken ?? refreshToken;
      }
    } catch {
      // ignore parse errors
    }
  }

  return { accessToken, refreshToken };
};

apiClient.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }

  const { accessToken } = getStoredTokens();

  if (accessToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }

  return config;
});

const persistTokens = (accessToken: string | null, refreshToken: string | null) => {
  try {
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    } else {
      localStorage.removeItem('token');
    }
  } catch {
    // ignore storage issues
  }

  try {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  } catch {
    // ignore storage issues
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: ApiError) => {
    const originalRequest = error.config ?? {};
    const status = error.response?.status ?? error.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = getStoredTokens();

        if (!refreshToken) {
          useAuthStore.getState?.().logout?.();
          persistTokens(null, null);
          throw error;
        }

        const refreshResponse = await apiClient.post('/auth/refresh', { refreshToken }, { skipAuth: true });
        const data: any = refreshResponse.data ?? {};
        const newAccessToken = data.accessToken ?? data.token ?? null;
        const newRefreshToken = data.refreshToken ?? refreshToken;

        if (newAccessToken) {
          useAuthStore.getState?.().setTokens?.(newAccessToken, newRefreshToken ?? null);
          persistTokens(newAccessToken, newRefreshToken ?? null);

          originalRequest.headers = {
            ...(originalRequest.headers ?? {}),
            Authorization: `Bearer ${newAccessToken}`,
          };

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState?.().logout?.();
        persistTokens(null, null);
        throw refreshError;
      }
    }

    if (status === 401) {
      useAuthStore.getState?.().logout?.();
      persistTokens(null, null);
    }

    if (status === 403) {
      throw error;
    }

    throw error;
  }
);

export { apiClient };
export default apiClient;
