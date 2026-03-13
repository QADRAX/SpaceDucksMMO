/**
 * Log level for diagnostic messages.
 */
export type DiagnosticLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Context attached to a diagnostic message (e.g. slotKey, scriptId).
 */
export type DiagnosticContext = Record<string, unknown>;

/**
 * Contract for diagnostic/logging output.
 * Implementations can forward to console, file, UI, or remote services.
 * Subsystems use this instead of console.* for consistent, host-controlled logging.
 */
export interface DiagnosticPort {
  /**
   * Log a message at the given level.
   * @param level - Severity: debug, info, warn, error
   * @param message - Human-readable message
   * @param context - Optional structured context (e.g. { slotKey, scriptId, entityId })
   */
  log(level: DiagnosticLevel, message: string, context?: DiagnosticContext): void;
}
