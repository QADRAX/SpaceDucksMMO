import type { LogEntry } from '../../domain';
import type { LogSink } from '../createLogStackDiagnosticPort';

/**
 * Creates a LogSink that forwards entries to console.debug/info/warn/error.
 * Works in both Node and browser (console is available in both).
 */
export function createConsoleSink(): LogSink {
  return (entry: LogEntry) => {
    const prefix =
      entry.context && Object.keys(entry.context).length > 0
        ? `[${JSON.stringify(entry.context)}] `
        : '';
    const fullMessage = `${prefix}${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(fullMessage);
        break;
      case 'info':
        console.info(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'error':
        console.error(fullMessage);
        break;
    }
  };
}
