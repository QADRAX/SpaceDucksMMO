import type { EngineErrorCode, Result } from './types';

/** Creates a successful Result wrapping the given value. */
export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

/** Creates a failed Result with the given error code and message. */
export function err<T = never>(
  code: EngineErrorCode,
  message: string,
  details?: unknown,
): Result<T> {
  return { ok: false, error: { code, message, details } };
}
