import type { IncomingMessage, ServerResponse } from 'http';

type Handler = (req: any, res: any, next?: () => void) => any;

type MiddlewareEntry = {
  path: string | null;
  handler: Handler;
};

type RouteEntry = {
  method: string;
  path: string;
  handler: Handler;
};

type SimulateOptions = {
  body?: unknown;
  headers?: Record<string, string>;
};

interface SimulatedResponse {
  status: number;
  body: unknown;
  text: string;
  headers: Record<string, string>;
}

const createResponseSnapshot = (): SimulatedResponse => ({
  status: 200,
  body: undefined,
  text: '',
  headers: {},
});

const joinPaths = (base: string, path: string) => {
  const sanitizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${sanitizedBase}${sanitizedPath}`.replace(/\/{2,}/g, '/');
};

const cloneResponse = (response: SimulatedResponse): SimulatedResponse => ({
  status: response.status,
  body: response.body,
  text: response.text,
  headers: { ...response.headers },
});

const parseQuery = (inputPath: string) => {
  try {
    const url = new URL(inputPath, 'http://localhost');
    const query: Record<string, string | string[]> = {};

    url.searchParams.forEach((value, key) => {
      if (key in query) {
        const existing = query[key];
        query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        query[key] = value;
      }
    });

    return { pathname: url.pathname || '/', query };
  } catch {
    return { pathname: inputPath, query: {} };
  }
};

const createApplication = (isRouter = false) => {
  const middlewares: MiddlewareEntry[] = [];
  const routes: RouteEntry[] = [];

  const runRequest = async (method: string, inputPath: string, options: SimulateOptions = {}): Promise<SimulatedResponse> => {
    const response = createResponseSnapshot();
    const { pathname, query } = parseQuery(inputPath);

    const req = {
      method,
      url: inputPath,
      path: pathname,
      originalUrl: inputPath,
      headers: options.headers ?? {},
      query,
      params: {},
      body: options.body,
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
    };

    const res = {
      status(code: number) {
        response.status = code;
        return res;
      },
      json(payload: unknown) {
        response.body = payload;
        response.text = JSON.stringify(payload);
        response.headers['content-type'] = 'application/json';
        return res;
      },
      send(payload: unknown) {
        if (typeof payload === 'object' && payload !== null) {
          return res.json(payload);
        }

        response.body = payload;
        response.text = String(payload ?? '');
        return res;
      },
      setHeader(key: string, value: string) {
        response.headers[key.toLowerCase()] = value;
        return res;
      },
      header(key: string, value: string) {
        return res.setHeader(key, value);
      },
      end(payload?: unknown) {
        if (payload !== undefined && response.text === '') {
          response.text = String(payload);
        }
        return res;
      },
    };

    const executeRoute = async () => {
      const key = `${method.toUpperCase()}:${pathname}`;
      const handler = routes.find(route => route.method === method.toUpperCase() && route.path === pathname)?.handler ??
        routes.find(route => route.method === 'ALL' && route.path === pathname)?.handler;

      if (handler) {
        await Promise.resolve(handler(req, res));
      } else if (!response.text && response.body === undefined) {
        response.status = response.status ?? 404;
      }
    };

    const runMiddlewares = async (index: number): Promise<void> => {
      if (index >= middlewares.length) {
        await executeRoute();
        return;
      }

      const current = middlewares[index];

      if (current.path && !pathname.startsWith(current.path)) {
        await runMiddlewares(index + 1);
        return;
      }

      let nextCalled = false;

      await Promise.resolve(
        current.handler(req, res, async () => {
          nextCalled = true;
          await runMiddlewares(index + 1);
        })
      );

      if (!nextCalled && current.handler.length < 3) {
        return;
      }

      if (!nextCalled) {
        await runMiddlewares(index + 1);
      }
    };

    await runMiddlewares(0);

    return cloneResponse(response);
  };

  const app: any = (req?: IncomingMessage, res?: ServerResponse) => {
    if (req && res) {
      app.handle(req, res);
    }

    return app;
  };

  const mountRouter = (basePath: string, router: any) => {
    const routerMiddlewares: MiddlewareEntry[] = router.__middlewares ?? [];
    const routerRoutes: RouteEntry[] = router.__routes ?? [];

    routerMiddlewares.forEach(entry => {
      middlewares.push({
        path: entry.path ? joinPaths(basePath, entry.path) : basePath,
        handler: entry.handler,
      });
    });

    routerRoutes.forEach(route => {
      routes.push({
        method: route.method,
        path: joinPaths(basePath, route.path),
        handler: route.handler,
      });
    });
  };

  app.__isMockExpress = true;
  app.__isRouter = isRouter;
  app.__middlewares = middlewares;
  app.__routes = routes;
  app.__simulate = (method: string, path: string, options?: SimulateOptions) => runRequest(method, path, options);

  app.use = (pathOrHandler: string | Handler | any, maybeHandler?: Handler | any) => {
    if (typeof pathOrHandler === 'string') {
      if (typeof maybeHandler === 'function' && maybeHandler.__isRouter) {
        mountRouter(pathOrHandler, maybeHandler);
      } else if (typeof maybeHandler === 'function') {
        middlewares.push({ path: pathOrHandler, handler: maybeHandler });
      }
      return app;
    }

    if (typeof pathOrHandler === 'function' && pathOrHandler.__isRouter) {
      mountRouter('/', pathOrHandler);
      return app;
    }

    if (typeof pathOrHandler === 'function') {
      middlewares.push({ path: null, handler: pathOrHandler });
    }

    return app;
  };

  const registerRoute = (method: string) => (path: string, handler: Handler) => {
    routes.push({ method, path, handler });
    return app;
  };

  app.get = registerRoute('GET');
  app.post = registerRoute('POST');
  app.put = registerRoute('PUT');
  app.delete = registerRoute('DELETE');
  app.patch = registerRoute('PATCH');
  app.all = registerRoute('ALL');

  app.handle = (req: IncomingMessage, res: ServerResponse) => {
    const method = (req.method ?? 'GET').toUpperCase();
    const urlPath = req.url ?? '/';

    runRequest(method, urlPath, {
      headers: Object.fromEntries(Object.entries(req.headers).map(([key, value]) => [key, String(value ?? '')])),
    }).then(result => {
      res.statusCode = result.status;
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      if (result.text) {
        res.end(result.text);
      } else if (result.body !== undefined) {
        res.end(String(result.body));
      } else {
        res.end();
      }
    });
  };

  app.listen = (_port?: number, _host?: string, callback?: () => void) => {
    callback?.();
    return {
      close: () => undefined,
      on: () => undefined,
      address: () => ({ port: _port ?? 0 }),
      listening: true,
    };
  };

  return app;
};

const createRouter = () => {
  const router = createApplication(true);
  return router;
};

const express = Object.assign(createApplication, {
  Router: createRouter,
  json: () => (_req: unknown, _res: unknown, next?: () => void) => next?.(),
  urlencoded: () => (_req: unknown, _res: unknown, next?: () => void) => next?.(),
});

export const Router = createRouter;
export const json = () => (_req: unknown, _res: unknown, next?: () => void) => next?.();
export const urlencoded = () => (_req: unknown, _res: unknown, next?: () => void) => next?.();

export type MockExpressApp = ReturnType<typeof createApplication>;

export default express;
