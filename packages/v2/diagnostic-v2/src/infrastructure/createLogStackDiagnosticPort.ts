import type { DiagnosticPort, DiagnosticLevel, DiagnosticContext } from '@duckengine/core-v2';
import type { LogEntry, LogStack } from '../domain';
import { createLogStack } from '../domain';

/**
 * Sink called for each log entry.
 * Implement to forward logs to console, file, UI, etc.
 * Runtime-agnostic: you provide the implementation for Node or browser.
 */
export type LogSink = (entry: LogEntry) => void;

/**
 * Options for creating the log-stack diagnostic port.
 */
export interface CreateLogStackDiagnosticPortOptions {
  /**
   * Log stack to append entries to.
   * If omitted, a new stack is created (use the returned object to access it).
   */
  logStack?: LogStack;

  /**
   * Optional sinks to call for each log (e.g. console, file, UI).
   * Sinks run after the entry is pushed to the stack.
   */
  sinks?: LogSink[];
}

/**
 * Result of createLogStackDiagnosticPort.
 */
export interface LogStackDiagnosticPortResult {
  /** The DiagnosticPort (used internally by createWebEngineClient) */
  port: DiagnosticPort;
  /** The log stack (either provided or created) */
  logStack: LogStack;
}

/**
 * Creates a DiagnosticPort that stores logs in a stack and optionally forwards to sinks.
 *
 * Runtime-agnostic: works in Node and browser.
 * The stack can be consumed for console.log, file export, UI rendering, etc.
 *
 * @example
 * ```ts
 * const client = await createWebEngineClient({
 *   resourceLoader,
 *   sinks: [(e) => console.log(`[${e.level}]`, e.message)],
 * });
 * // logStack is on the client
 * const entries = client.logStack.getEntries();
 * ```
 */
export function createLogStackDiagnosticPort(
  options: CreateLogStackDiagnosticPortOptions = {},
): LogStackDiagnosticPortResult {
  const logStack = options.logStack ?? createLogStack();
  const sinks = options.sinks ?? [];

  const port: DiagnosticPort = {
    log(level: DiagnosticLevel, message: string, context?: DiagnosticContext) {
      const entry: LogEntry = {
        level,
        message,
        context,
        timestamp: Date.now(),
      };
      logStack.push(entry);
      for (const sink of sinks) {
        sink(entry);
      }
    },
  };

  return { port, logStack };
}
