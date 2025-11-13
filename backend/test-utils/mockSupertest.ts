import type { Express } from 'express';
import type { Server } from 'http';
import http from 'http';

export interface TestResponse {
  status: number;
  body: unknown;
  text: string;
  headers: http.IncomingHttpHeaders;
}

type AppLike = Express | Server | (Express & { __simulate?: (method: string, path: string) => TestResponse });

const isSimulatableApp = (app: AppLike): app is AppLike & { __simulate: (method: string, path: string) => TestResponse } =>
  typeof (app as any)?.__simulate === 'function';

const performRequest = (app: AppLike, method: string, path: string): Promise<TestResponse> => {
  if (isSimulatableApp(app)) {
    return Promise.resolve(app.__simulate(method, path)).then(result => ({
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

      const options: http.RequestOptions = {
        method,
        hostname: '127.0.0.1',
        port,
        path,
      };

      const req = http.request(options, res => {
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
  constructor(private readonly app: AppLike, private readonly method: string, private readonly path: string) {}

  async expect(status: number): Promise<TestResponse> {
    const response = await performRequest(this.app, this.method, this.path);

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
}

const request = (app: AppLike) => new TestAgent(app);

export default request;
