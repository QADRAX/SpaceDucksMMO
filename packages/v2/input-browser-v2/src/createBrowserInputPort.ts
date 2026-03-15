import type {
  InputPort,
  InputMouseButtons,
  InputMousePosition,
  InputGamepadState,
  InputGamepadButton,
  InputGamepadAxis,
} from '@duckengine/core-v2';

const GAMEPAD_BUTTON_NAMES: InputGamepadButton[] = [
  'a',
  'b',
  'x',
  'y',
  'leftBumper',
  'rightBumper',
  'leftTrigger',
  'rightTrigger',
  'select',
  'start',
  'leftStick',
  'rightStick',
  'dpadUp',
  'dpadDown',
  'dpadLeft',
  'dpadRight',
];

const GAMEPAD_AXIS_NAMES: InputGamepadAxis[] = [
  'leftStickX',
  'leftStickY',
  'rightStickX',
  'rightStickY',
];

function normalizeKey(e: KeyboardEvent): string {
  if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Space') return 'space';
  if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight')
    return 'shift';
  if (e.key === 'Control' || e.key === 'ControlLeft' || e.key === 'ControlRight')
    return 'control';
  if (e.key === 'Alt' || e.key === 'AltLeft' || e.key === 'AltRight') return 'alt';
  if (e.key === 'Escape') return 'escape';
  if (/^F\d{1,2}$/i.test(e.key)) return e.key.toLowerCase();
  if (e.key.length === 1) return e.key.toLowerCase();
  return e.key.toLowerCase();
}

function isEditableEventTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement & { isContentEditable?: boolean }).isContentEditable)
    return true;
  return false;
}

function mapMouseButton(b: number): 'left' | 'middle' | 'right' | null {
  if (b === 0) return 'left';
  if (b === 1) return 'middle';
  if (b === 2) return 'right';
  return null;
}

function toGamepadState(gp: Gamepad | null): InputGamepadState | null {
  if (!gp || !gp.connected) return null;

  const buttons: Record<InputGamepadButton, boolean> = {
    a: false,
    b: false,
    x: false,
    y: false,
    leftBumper: false,
    rightBumper: false,
    leftTrigger: false,
    rightTrigger: false,
    select: false,
    start: false,
    leftStick: false,
    rightStick: false,
    dpadUp: false,
    dpadDown: false,
    dpadLeft: false,
    dpadRight: false,
  };

  for (let i = 0; i < GAMEPAD_BUTTON_NAMES.length && i < gp.buttons.length; i++) {
    const name = GAMEPAD_BUTTON_NAMES[i];
    if (name) buttons[name] = gp.buttons[i]?.pressed ?? false;
  }

  const axes: Record<InputGamepadAxis, number> = {
    leftStickX: 0,
    leftStickY: 0,
    rightStickX: 0,
    rightStickY: 0,
  };
  for (let i = 0; i < GAMEPAD_AXIS_NAMES.length && i < gp.axes.length; i++) {
    const name = GAMEPAD_AXIS_NAMES[i];
    if (name) axes[name] = gp.axes[i] ?? 0;
  }

  return { connected: true, buttons, axes };
}

export interface CreateBrowserInputPortOptions {
  /** Elemento para pointer lock (típicamente el canvas del viewport). */
  targetElement: HTMLElement | null;
  /** Si true, ignora key events cuando el target es input/textarea. Default: true. */
  ignoreEditableTargets?: boolean;
}

export interface BrowserInputPortResult {
  port: InputPort;
  dispose(): void;
}

/**
 * Creates an InputPort that reads from DOM and Gamepad API.
 * For browser environments only.
 * Call dispose() when unmounting to remove event listeners.
 */
export function createBrowserInputPort(
  options: CreateBrowserInputPortOptions,
): BrowserInputPortResult {
  const { targetElement, ignoreEditableTargets = true } = options;

  const pressed = new Set<string>();
  const buttons: InputMouseButtons = {
    left: false,
    right: false,
    middle: false,
  };
  let position: InputMousePosition = { x: 0, y: 0 };
  let deltaX = 0;
  let deltaY = 0;
  let wheelDelta = 0;
  let locked = false;
  let lastExitTime = 0;
  let lastRequestTime = 0;

  const keydown = (e: KeyboardEvent) => {
    if (ignoreEditableTargets && isEditableEventTarget(e.target)) return;
    pressed.add(normalizeKey(e));
  };

  const keyup = (e: KeyboardEvent) => {
    if (ignoreEditableTargets && isEditableEventTarget(e.target)) return;
    pressed.delete(normalizeKey(e));
  };

  const mousemove = (e: MouseEvent) => {
    const ev = e as MouseEvent & { movementX?: number; movementY?: number };
    if (locked) {
      deltaX += ev.movementX ?? 0;
      deltaY += ev.movementY ?? 0;
    } else {
      position = { x: e.screenX, y: e.screenY };
    }
  };

  const mousedown = (e: MouseEvent) => {
    const m = mapMouseButton(e.button);
    if (m) buttons[m] = true;
  };

  const mouseup = (e: MouseEvent) => {
    const m = mapMouseButton(e.button);
    if (m) buttons[m] = false;
  };

  const wheel = (e: WheelEvent) => {
    wheelDelta += e.deltaY;
  };

  const pointerLockChange = () => {
    locked = !!(typeof document !== 'undefined' && document.pointerLockElement);
    if (!locked) lastExitTime = Date.now();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mousedown', mousedown);
    document.addEventListener('mouseup', mouseup);
    document.addEventListener('wheel', wheel, { passive: true });
    document.addEventListener('pointerlockchange', pointerLockChange);
  }

  const port: InputPort = {
    isKeyPressed: (key) => pressed.has(String(key).toLowerCase()),

    getMouseDelta: () => ({ x: deltaX, y: deltaY }),
    getMouseButtons: () => ({ ...buttons }),
    getMousePosition: () => ({ ...position }),
    getMouseWheelDelta: () => wheelDelta,

    getGamepad: (index) => {
      if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
      const pads = navigator.getGamepads();
      return toGamepadState(pads[index] ?? null);
    },
    getGamepadCount: () => {
      if (typeof navigator === 'undefined' || !navigator.getGamepads) return 0;
      const pads = navigator.getGamepads();
      return pads.filter((p) => p?.connected).length;
    },

    requestPointerLock: () => {
      const el = targetElement;
      if (!el) return;
      const now = Date.now();
      if (now - lastExitTime < 1200) return;
      if (now - lastRequestTime < 100) return;
      lastRequestTime = now;
      if (typeof document !== 'undefined' && document.pointerLockElement === el)
        return;
      try {
        const p = (el as HTMLCanvasElement).requestPointerLock?.();
        if (p?.catch) p.catch(() => {});
      } catch {
        // ignore
      }
    },

    exitPointerLock: () => {
      if (typeof document === 'undefined') return;
      if (!document.pointerLockElement) return;
      document.exitPointerLock?.();
      lastExitTime = Date.now();
    },

    isPointerLocked: () => locked,

    beginFrame: () => {
      deltaX = 0;
      deltaY = 0;
      wheelDelta = 0;
    },
  };

  const dispose = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mousedown', mousedown);
      document.removeEventListener('mouseup', mouseup);
      document.removeEventListener('wheel', wheel);
      document.removeEventListener('pointerlockchange', pointerLockChange);
    }
  };

  return { port, dispose };
}
