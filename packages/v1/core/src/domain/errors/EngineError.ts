export type EngineErrorCode =
  | 'invalid-component'
  | 'invalid-reparent'
  | 'scene-not-found'
  | 'scene-not-inspectable'
  | 'operation-not-allowed';

export interface EngineError {
  code: EngineErrorCode;
  message: string;
  details?: unknown;
}

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: EngineError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never>(code: EngineErrorCode, message: string, details?: unknown): Result<T> => ({
  ok: false,
  error: { code, message, details },
});

export default EngineError;
