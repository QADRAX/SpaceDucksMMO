
export type MouseState = {
  locked: boolean;
  buttons: { left: boolean; middle: boolean; right: boolean };
  screenX: number;
  screenY: number;
  deltaX: number;
  deltaY: number;
  wheelDelta: number;
};

export interface MouseApi {
  beginFrame: () => void;
  setTargetElement: (el: HTMLElement | null) => void;
  setPointerLockWanted: (v: boolean) => void;
  requestPointerLock: () => void;
  exitPointerLock: () => void;
  isPointerLockCooldownActive: () => boolean;
  getState: () => MouseState;
  dispose: () => void;
}

export interface KeyboardApi {
  isKeyPressed: (key: string) => boolean;
  onKeyDown: (key: string, cb: () => void) => void;
  onKeyUp: (key: string, cb: () => void) => void;
}

export interface InputServices {
  mouse: MouseApi;
  keyboard: KeyboardApi;
}

const noopMouse: MouseApi = {
  beginFrame: () => { },
  setTargetElement: () => { },
  setPointerLockWanted: () => { },
  requestPointerLock: () => { },
  exitPointerLock: () => { },
  isPointerLockCooldownActive: () => false,
  getState: () => ({ locked: false, buttons: { left: false, middle: false, right: false }, screenX: 0, screenY: 0, deltaX: 0, deltaY: 0, wheelDelta: 0 }),
  dispose: () => { },
};

const noopKeyboard: KeyboardApi = {
  isKeyPressed: () => false,
  onKeyDown: () => { },
  onKeyUp: () => { },
};

const INPUT_SERVICES_KEY = Symbol.for('@duckengine/core.inputServices');

function getGlobalStore(): any {
  return globalThis as any;
}

export function setInputServices(s: Partial<InputServices> | null): void {
  // Merge provided services with no-op defaults so domain code can rely on
  // `getInputServices()` always returning fully-populated APIs.
  const base = { mouse: noopMouse, keyboard: noopKeyboard };
  getGlobalStore()[INPUT_SERVICES_KEY] = Object.assign(base, s || {});
}

export function getInputServices(): InputServices {
  const services = getGlobalStore()[INPUT_SERVICES_KEY] as InputServices | null | undefined;
  if (!services) return { mouse: noopMouse, keyboard: noopKeyboard };
  return services;
}
