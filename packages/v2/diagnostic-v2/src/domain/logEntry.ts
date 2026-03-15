import type { DiagnosticLevel, DiagnosticContext } from '@duckengine/core-v2';

/**
 * A single log entry stored in the engine's log stack.
 * Runtime-agnostic; can be consumed by console, file, UI, etc.
 */
export interface LogEntry {
  /** Severity level */
  readonly level: DiagnosticLevel;
  /** Human-readable message */
  readonly message: string;
  /** Optional structured context (e.g. slotKey, scriptId, entityId) */
  readonly context?: DiagnosticContext;
  /** Unix timestamp (ms) when the entry was logged */
  readonly timestamp: number;
}
