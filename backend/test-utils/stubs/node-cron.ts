interface CronTask {
  start: () => void;
  stop: () => void;
  destroy: () => void;
}

const schedule = (_expression: string, handler: () => void): CronTask => {
  return {
    start: () => handler(),
    stop: () => undefined,
    destroy: () => undefined,
  };
};

export { schedule };
export default { schedule };
