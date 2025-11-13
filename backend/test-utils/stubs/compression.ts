const createCompression = () => (_req: unknown, _res: unknown, next?: () => void) => next?.();

export default createCompression;
