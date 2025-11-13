import type { IncomingMessage, ServerResponse } from 'http';

type Handler = (req: any, res: any, next?: () => void) => void;

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

const createApp = () => {
  const middlewares: Array<{ path: string | null; handler: Handler }> = [];
  const routes = new Map<string, Handler>();

  const runRequest = async (method: string, path: string): Promise<SimulatedResponse> => {
    const response = createResponseSnapshot();

    const req = {
      method,
      url: path,
      path,
      originalUrl: path,
      headers: {},
      query: {},
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

    const dispatch = async () => {
      const key = `${method.toUpperCase()}:${path}`;
      const handler = routes.get(key) ?? routes.get(`ALL:${path}`);

      if (handler) {
        await Promise.resolve(handler(req, res));
      } else if (!response.text) {
        response.status = response.status ?? 404;
      }
    };

    const runMiddlewares = async (index: number): Promise<void> => {
      if (index >= middlewares.length) {
        await dispatch();
        return;
      }

      const current = middlewares[index];

      if (current.path && !path.startsWith(current.path)) {
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
        // Middleware finalizou a requisição sem chamar next
        return;
      }
    };

    await runMiddlewares(0);

    return response;
  };

  const app: any = (req?: IncomingMessage, res?: ServerResponse) => {
    if (req && res) {
      app.handle(req, res);
    }

    return app;
  };

  app.__isMockExpress = true;
  app.__simulate = (method: string, path: string) => runRequest(method, path);

  app.use = (pathOrHandler: string | Handler, maybeHandler?: Handler) => {
    if (typeof pathOrHandler === 'function') {
      middlewares.push({ path: null, handler: pathOrHandler });
    } else if (maybeHandler) {
      middlewares.push({ path: pathOrHandler, handler: maybeHandler });
    }

    return app;
  };

  const registerRoute = (method: string) => (path: string, handler: Handler) => {
    routes.set(`${method}:${path}`, handler);
    return app;
  };

  app.get = registerRoute('GET');
  app.post = registerRoute('POST');
  app.put = registerRoute('PUT');
  app.delete = registerRoute('DELETE');
  app.patch = registerRoute('PATCH');
  app.all = registerRoute('ALL');

  app.handle = (req: IncomingMessage, res: ServerResponse) => {
    const method = req.method ?? 'GET';
    const urlPath = (req.url ?? '/').split('?')[0] ?? '/';

    runRequest(method, urlPath).then(result => {
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
  const router: any = (_req: unknown, _res: unknown, next?: () => void) => {
    next?.();
  };

  ['use', 'get', 'post', 'put', 'delete', 'patch', 'all'].forEach(method => {
    router[method] = () => router;
  });

  return router;
};

createApp.Router = createRouter;
createApp.json = () => (_req: unknown, _res: unknown, next?: () => void) => next?.();
createApp.urlencoded = () => (_req: unknown, _res: unknown, next?: () => void) => next?.();

export type MockExpressApp = ReturnType<typeof createApp>;

export default createApp;
export { createRouter as Router };
