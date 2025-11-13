interface CorsOptions {
  origin?: unknown;
  methods?: unknown;
  credentials?: unknown;
}

const createCors = (_options?: CorsOptions) => (_req: unknown, _res: unknown, next?: () => void) => next?.();

export default createCors;
