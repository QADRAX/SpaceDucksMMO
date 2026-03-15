import type { LogEntry } from './logEntry';

/**
 * In-memory stack of log entries.
 * Runtime-agnostic; works in Node and browser.
 *
 * Use for:
 * - Inspecting engine logs programmatically
 * - Feeding console.log, file writers, or UI consoles
 * - Debugging and diagnostics
 */
export interface LogStack {
  /** Append an entry to the stack */
  push(entry: LogEntry): void;

  /** Get a copy of all entries (newest last) */
  getEntries(): readonly LogEntry[];

  /** Clear all entries */
  clear(): void;

  /** Current number of entries */
  readonly size: number;
}

/**
 * Creates a mutable LogStack instance.
 */
export function createLogStack(): LogStack {
  const entries: LogEntry[] = [];

  return {
    push(entry: LogEntry) {
      entries.push(entry);
    },

    getEntries() {
      return [...entries];
    },

    clear() {
      entries.length = 0;
    },

    get size() {
      return entries.length;
    },
  };
}
