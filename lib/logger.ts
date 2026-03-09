export const logger = {
  info(message: string, metadata?: unknown) {
    console.info(`[movrr-app] ${message}`, metadata ?? "");
  },
  warn(message: string, metadata?: unknown) {
    console.warn(`[movrr-app] ${message}`, metadata ?? "");
  },
  error(message: string, metadata?: unknown) {
    console.error(`[movrr-app] ${message}`, metadata ?? "");
  },
};
