import type { Express } from 'express';
import type { Server } from 'http';
import http from 'http';

export interface TestResponse {
  status: number;
  body: unknown;
  text: string;
  headers: http.IncomingHttpHeaders;
}

type AppLike =
  | Express
  | Server
  | (Express & { __simulate?: (method: string, path: string, options?: { body?: unknown; headers?: Record<string, string> }) => TestResponse });

const isSimulatableApp = (app: AppLike): app is AppLike & {
  __simulate: (method: string, path: string, options?: { body?: unknown; headers?: Record<string, string> }) => TestResponse;
} => typeof (app as any)?.__simulate === 'function';

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
}

const performRequest = (app: AppLike, method: string, path: string, options: RequestOptions = {}): Promise<TestResponse> => {
  if (isSimulatableApp(app)) {
    return Promise.resolve(app.__simulate(method, path, options)).then(result => ({
      status: result.status ?? 200,
      body: result.body,
      text: result.text,
      headers: result.headers,
    }));
  }

  return new Promise((resolve, reject) => {
    let server: Server | null = null;
    let isTemporaryServer = false;

    if ('listen' in app && typeof (app as Server).listen === 'function' && typeof (app as Server).address === 'function') {
      const candidate = app as Server;
      if (candidate.listening) {
        server = candidate;
      } else {
        server = candidate;
        isTemporaryServer = true;
      }
    }

    if (!server) {
      server = http.createServer(app as Express);
      isTemporaryServer = true;
    }

    const finalize = () => {
      if (isTemporaryServer && server) {
        server.close();
      }
    };

    const dispatchRequest = () => {
      const address = server!.address();
      const port = typeof address === 'object' && address ? address.port : 0;

      const requestOptions: http.RequestOptions = {
        method,
        hostname: '127.0.0.1',
        port,
        path,
        headers: options.headers,
      };

      const req = http.request(requestOptions, res => {
        const chunks: Buffer[] = [];

        res.on('data', chunk => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let body: unknown = text;

          try {
            body = text ? JSON.parse(text) : undefined;
          } catch {
            // corpo não é JSON, mantemos como texto
          }

          finalize();
          resolve({
            status: res.statusCode ?? 0,
            body,
            text,
            headers: res.headers,
          });
        });
      });

      req.on('error', error => {
        finalize();
        reject(error);
      });

      if (options.body !== undefined) {
        const payload =
          typeof options.body === 'string' || options.body instanceof Buffer
            ? options.body
            : JSON.stringify(options.body);
        req.write(payload);
      }

      req.end();
    };

    if (isTemporaryServer) {
      server.listen(0, '127.0.0.1', dispatchRequest);
    } else {
      dispatchRequest();
    }
  });
};

class TestRequest {
  private body: unknown;
  private headers: Record<string, string> = {};

  constructor(private readonly app: AppLike, private readonly method: string, private readonly path: string) {}

  send(payload: unknown): TestRequest {
    this.body = payload;
    if (!this.headers['content-type']) {
      this.headers['content-type'] = 'application/json';
    }
    return this;
  }

  set(key: string, value: string): TestRequest {
    this.headers[key.toLowerCase()] = value;
    return this;
  }

  async expect(status: number): Promise<TestResponse> {
    const response = await performRequest(this.app, this.method, this.path, {
      body: this.body,
      headers: this.headers,
    });

    if (response.status !== status) {
      const error = new Error(`Expected status ${status} but received ${response.status}`);
      (error as Error & { response?: TestResponse }).response = response;
      throw error;
    }

    return response;
  }
}

class TestAgent {
  constructor(private readonly app: AppLike) {}

  get(path: string): TestRequest {
    return new TestRequest(this.app, 'GET', path);
  }

  post(path: string): TestRequest {
    return new TestRequest(this.app, 'POST', path);
  }

  put(path: string): TestRequest {
    return new TestRequest(this.app, 'PUT', path);
  }

  delete(path: string): TestRequest {
    return new TestRequest(this.app, 'DELETE', path);
  }

  patch(path: string): TestRequest {
    return new TestRequest(this.app, 'PATCH', path);
  }
}

const request = (app: AppLike) => new TestAgent(app);

export default request;
