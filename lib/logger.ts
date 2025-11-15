export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.info(JSON.stringify({ level: 'info', message, ...meta }));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ level: 'error', message, ...meta }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify({ level: "warn", message, ...meta }));
  }
};
