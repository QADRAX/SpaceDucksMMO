/** Error codes for engine operations that return Result. */
export type EngineErrorCode =
  | 'invalid-component'
  | 'invalid-reparent'
  | 'not-found'
  | 'validation'
  | 'scene-not-found'
  | 'scene-not-inspectable'
  | 'operation-not-allowed'
  | 'network-error';

/** Structured error returned by fallible engine operations. */
export interface EngineError {
  /** Machine-readable error code. */
  code: EngineErrorCode;
  /** Human-readable description of what went wrong. */
  message: string;
  /** Optional payload with additional context. */
  details?: unknown;
}

/** Discriminated union representing either a success value or an error. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: EngineError };
