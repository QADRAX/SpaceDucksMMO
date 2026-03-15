/** Mouse delta payload (movimiento acumulado desde último frame). */
export interface InputMouseDelta {
  x: number;
  y: number;
}

/** Mouse button snapshot payload. */
export interface InputMouseButtons {
  left: boolean;
  right: boolean;
  middle: boolean;
}

/** Mouse position (pantalla o viewport). Solo útil sin pointer lock. */
export interface InputMousePosition {
  x: number;
  y: number;
}

/** Wheel delta acumulado (zoom, scroll). */
export type InputWheelDelta = number;

/** Gamepad buttons (standard mapping Xbox/PS). */
export type InputGamepadButton =
  | 'a'
  | 'b'
  | 'x'
  | 'y'
  | 'leftBumper'
  | 'rightBumper'
  | 'leftTrigger'
  | 'rightTrigger'
  | 'select'
  | 'start'
  | 'leftStick'
  | 'rightStick'
  | 'dpadUp'
  | 'dpadDown'
  | 'dpadLeft'
  | 'dpadRight';

/** Gamepad axes (standard mapping). */
export type InputGamepadAxis =
  | 'leftStickX'
  | 'leftStickY'
  | 'rightStickX'
  | 'rightStickY';

/**
 * Gamepad state normalizado.
 * Usa nombres semánticos del standard mapping (Xbox/PS layout).
 */
export interface InputGamepadState {
  readonly connected: boolean;
  readonly buttons: Readonly<Record<InputGamepadButton, boolean>>;
  readonly axes: Readonly<Record<InputGamepadAxis, number>>;
}

/**
 * Query-only input contract for subsystems and scripting runtimes.
 * Implementaciones: browser (DOM + Gamepad API), node (noop/mock).
 */
export interface InputPort {
  // --- Keyboard ---
  isKeyPressed(key: string): boolean;

  // --- Mouse ---
  getMouseDelta(): InputMouseDelta;
  getMouseButtons(): InputMouseButtons;
  getMousePosition(): InputMousePosition;
  getMouseWheelDelta(): InputWheelDelta;

  // --- Gamepad ---
  getGamepad(index: number): InputGamepadState | null;
  getGamepadCount(): number;

  // --- Pointer lock (opcional, solo browser) ---
  requestPointerLock?(): void;
  exitPointerLock?(): void;
  isPointerLocked?(): boolean;

  // --- Frame lifecycle (opcional) ---
  /** Llamar al inicio de cada frame para resetear deltas (mouse, wheel). */
  beginFrame?(): void;

  // --- Action API (opcional; añadido por input-mappings-v2 al envolver el raw port) ---
  getAction?(action: string): number;
  getAction2?(actionX: string, actionY: string): { x: number; y: number };
  isActionPressed?(action: string): boolean;
}
