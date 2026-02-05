/**
 * Simple Logger Utility
 * Wrapper untuk console.log dengan format yang lebih rapi
 * 
 * Di production bisa diganti dengan library logging seperti Winston/Pino
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  const levelStr = level.toUpperCase().padEnd(5);
  return `[${timestamp}] ${levelStr} ${message}`;
}

export const logger = {
  info(message: string, ...args: any[]): void {
    console.log(formatMessage('info', message), ...args);
  },

  warn(message: string, ...args: any[]): void {
    console.warn(formatMessage('warn', message), ...args);
  },

  error(message: string, ...args: any[]): void {
    console.error(formatMessage('error', message), ...args);
  },

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message), ...args);
    }
  },
};
