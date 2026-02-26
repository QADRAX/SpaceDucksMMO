import type { InputServices, MouseApi, KeyboardApi, MouseState } from '@duckengine/ecs';

class EditorMouseInputService implements MouseApi {
  private state: MouseState = {
    locked: false,
    buttons: { left: false, middle: false, right: false },
    screenX: 0,
    screenY: 0,
    deltaX: 0,
    deltaY: 0,
    wheelDelta: 0,
  };

  isPointerLockCooldownActive(): boolean {
    const now = Date.now();
    return (now - this.lastExitTime < 1200);
  }

  private targetElement: HTMLElement | null = null;
  private lastRequestTime = 0;
  private lastExitTime = 0;

  private mouseMoveListener = (e: MouseEvent) => this.onMouseMove(e);
  private mouseDownListener = (e: MouseEvent) => this.onMouseDown(e);
  private mouseUpListener = (e: MouseEvent) => this.onMouseUp(e);
  private wheelListener = (e: WheelEvent) => this.onWheel(e);
  private pointerLockChangeListener = () => this.onPointerLockChange();

  constructor() {
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('mousemove', this.mouseMoveListener);
      document.addEventListener('mousedown', this.mouseDownListener);
      document.addEventListener('mouseup', this.mouseUpListener);
      document.addEventListener('wheel', this.wheelListener as any, { passive: true } as any);
      document.addEventListener('pointerlockchange', this.pointerLockChangeListener);
    }
  }

  beginFrame(): void {
    this.state.deltaX = 0;
    this.state.deltaY = 0;
    this.state.wheelDelta = 0;
  }

  setTargetElement(el: HTMLElement | null): void {
    this.targetElement = el;
  }

  // ECS components call this each frame (cooperative intent), but for the editor
  // we keep pointer lock as a user-initiated action (click to lock, Esc to exit).
  setPointerLockWanted(_v: boolean): void { }

  requestPointerLock(): void {
    if (!this.targetElement) return;

    const now = Date.now();
    // Browser enforced cooldown after user exit is usually ~1s
    if (now - this.lastExitTime < 1200) return;
    if (now - this.lastRequestTime < 100) return;
    this.lastRequestTime = now;

    try {
      if (document.pointerLockElement === this.targetElement) return;

      const promise = (this.targetElement as any).requestPointerLock?.();
      // Modern browsers return a promise that might reject with SecurityError
      if (promise && typeof promise.catch === 'function') {
        promise.catch((err: any) => {
          // Suppress noise, especially "The user has exited the lock..."
          if (err.name !== 'SecurityError') {
            console.warn('[EditorMouseInputService] pointer lock request failed', err);
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }

  exitPointerLock(): void {
    try {
      if (!document.pointerLockElement) return;
      document.exitPointerLock?.();
      this.lastExitTime = Date.now();
    } catch {
      // ignore
    }
  }

  getState(): MouseState {
    return { ...this.state, buttons: { ...this.state.buttons } };
  }

  dispose(): void {
    if (typeof document !== 'undefined' && document.removeEventListener) {
      document.removeEventListener('mousemove', this.mouseMoveListener);
      document.removeEventListener('mousedown', this.mouseDownListener);
      document.removeEventListener('mouseup', this.mouseUpListener);
      document.removeEventListener('wheel', this.wheelListener as any);
      document.removeEventListener('pointerlockchange', this.pointerLockChangeListener);
    }
    this.targetElement = null;
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.state.locked) {
      const mx = (e as any).movementX ?? 0;
      const my = (e as any).movementY ?? 0;
      this.state.deltaX += mx;
      this.state.deltaY += my;
    } else {
      this.state.screenX = e.screenX;
      this.state.screenY = e.screenY;
    }
  }

  private mapButton(b: number): 'left' | 'middle' | 'right' | null {
    if (b === 0) return 'left';
    if (b === 1) return 'middle';
    if (b === 2) return 'right';
    return null;
  }

  private onMouseDown(e: MouseEvent): void {
    const m = this.mapButton(e.button);
    if (m) (this.state.buttons as any)[m] = true;
  }

  private onMouseUp(e: MouseEvent): void {
    const m = this.mapButton(e.button);
    if (m) (this.state.buttons as any)[m] = false;
  }

  private onWheel(e: WheelEvent): void {
    this.state.wheelDelta += e.deltaY;
  }

  private onPointerLockChange(): void {
    try {
      const wasLocked = this.state.locked;
      const isLocked = !!(document && (document as any).pointerLockElement);
      this.state.locked = isLocked;

      if (wasLocked && !isLocked) {
        this.lastExitTime = Date.now();
      }
    } catch {
      this.state.locked = false;
    }
  }
}

class EditorKeyboardInputService implements KeyboardApi {
  private pressed = new Set<string>();
  private downHandlers = new Map<string, Set<() => void>>();
  private upHandlers = new Map<string, Set<() => void>>();

  private enabled = false;

  private keydownListener = (e: KeyboardEvent) => this.handleKeyDown(e);
  private keyupListener = (e: KeyboardEvent) => this.handleKeyUp(e);

  constructor() {
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', this.keydownListener);
      window.addEventListener('keyup', this.keyupListener);
    }
  }

  isKeyPressed(key: string): boolean {
    if (!this.enabled) return false;
    return this.pressed.has(String(key).toLowerCase());
  }

  setEnabled(v: boolean): void {
    const next = !!v;
    if (this.enabled === next) return;
    this.enabled = next;
    if (!this.enabled) {
      // avoid "stuck keys" when leaving the viewport
      this.pressed.clear();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  onKeyDown(key: string, cb: () => void): void {
    const k = String(key).toLowerCase();
    let set = this.downHandlers.get(k);
    if (!set) {
      set = new Set();
      this.downHandlers.set(k, set);
    }
    set.add(cb);
  }

  onKeyUp(key: string, cb: () => void): void {
    const k = String(key).toLowerCase();
    let set = this.upHandlers.get(k);
    if (!set) {
      set = new Set();
      this.upHandlers.set(k, set);
    }
    set.add(cb);
  }

  dispose(): void {
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('keydown', this.keydownListener);
      window.removeEventListener('keyup', this.keyupListener);
    }
    this.pressed.clear();
    this.downHandlers.clear();
    this.upHandlers.clear();
  }

  private normalizeKey(e: KeyboardEvent): string {
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Space') return 'space';
    if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') return 'shift';
    if (e.key === 'Control' || e.key === 'ControlLeft' || e.key === 'ControlRight') return 'control';
    if (e.key === 'Escape') return 'escape';
    if (/^F\d{1,2}$/i.test(e.key)) return e.key.toLowerCase();
    if (e.key.length === 1) return e.key.toLowerCase();
    return e.key.toLowerCase();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;
    if (isEditableEventTarget(e.target)) return;
    const k = this.normalizeKey(e);

    this.pressed.add(k);
    const set = this.downHandlers.get(k);
    if (set) for (const h of Array.from(set)) h();
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (!this.enabled) return;
    if (isEditableEventTarget(e.target)) return;
    const k = this.normalizeKey(e);
    this.pressed.delete(k);
    const set = this.upHandlers.get(k);
    if (set) for (const h of Array.from(set)) h();
  }
}

function isEditableEventTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as any).isContentEditable) return true;
  return false;
}

export type EditorInputServices = InputServices & {
  keyboard: KeyboardApi & { setEnabled: (v: boolean) => void; isEnabled: () => boolean };
  dispose: () => void;
};

export function createEditorInputServices(): EditorInputServices {
  const mouse = new EditorMouseInputService();
  const keyboard = new EditorKeyboardInputService();

  return {
    mouse,
    keyboard,
    dispose: () => {
      try {
        mouse.dispose();
      } catch {
        // ignore
      }
      try {
        keyboard.dispose();
      } catch {
        // ignore
      }
    },
  };
}
