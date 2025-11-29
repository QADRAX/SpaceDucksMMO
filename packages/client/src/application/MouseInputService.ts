/**
 * Centralized mouse input service.
 * Tracks pointer lock, buttons, cursor position, per-frame deltas and wheel.
 */
export interface MouseState {
  locked: boolean;
  buttons: { left: boolean; middle: boolean; right: boolean };
  screenX: number;
  screenY: number;
  deltaX: number;
  deltaY: number;
  wheelDelta: number;
}

export class MouseInputService {
  private state: MouseState = {
    locked: false,
    buttons: { left: false, middle: false, right: false },
    screenX: 0,
    screenY: 0,
    deltaX: 0,
    deltaY: 0,
    wheelDelta: 0,
  };

  // cooperative pointer lock flag (reset each frame by beginFrame())
  private pointerLockWanted = false;
  private targetElement: HTMLElement | null = null;

  private mouseMoveListener = (e: MouseEvent) => this.onMouseMove(e);
  private mouseDownListener = (e: MouseEvent) => this.onMouseDown(e);
  private mouseUpListener = (e: MouseEvent) => this.onMouseUp(e);
  private wheelListener = (e: WheelEvent) => this.onWheel(e);
  private pointerLockChangeListener = () => this.onPointerLockChange();

  constructor() {
    if (typeof document !== "undefined" && document.addEventListener) {
      // Use document listeners for mouse events; more robust for pointer lock
      document.addEventListener("mousemove", this.mouseMoveListener);
      document.addEventListener("mousedown", this.mouseDownListener);
      document.addEventListener("mouseup", this.mouseUpListener);
      document.addEventListener(
        "wheel",
        this.wheelListener as any,
        { passive: true } as any
      );

      document.addEventListener(
        "pointerlockchange",
        this.pointerLockChangeListener
      );
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.state.locked) {
      // movementX/Y available when pointer is locked
      // use any cast because TS lib.dom sometimes defines these
      const mx = (e as any).movementX ?? 0;
      const my = (e as any).movementY ?? 0;
      this.state.deltaX += mx;
      this.state.deltaY += my;
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.debug(
          "[MouseInputService] deltaX:",
          this.state.deltaX,
          "deltaY:",
          this.state.deltaY
        );
      }
    } else {
      this.state.screenX = e.screenX;
      this.state.screenY = e.screenY;
    }
  }

  private mapButton(b: number): "left" | "middle" | "right" | null {
    if (b === 0) return "left";
    if (b === 1) return "middle";
    if (b === 2) return "right";
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
      // Consider pointer locked whenever pointerLockElement is present (any element).
      // This avoids missing the lock if it happens on a different element
      // or if the target element reference changes.
      const prev = this.state.locked;
      this.state.locked = !!(document && (document as any).pointerLockElement);
      if (
        process.env.NODE_ENV === "development" &&
        prev !== this.state.locked
      ) {
        // eslint-disable-next-line no-console
        console.debug("[MouseInputService] locked changed:", this.state.locked);
      }
    } catch {
      // ignore in non-browser environments
    }
  }

  /**
   * Reset per-frame deltas (called by the game loop at frame start).
   * Also resets the cooperative pointerLockWanted flag so components must re-assert.
   */
  beginFrame(): void {
    this.state.deltaX = 0;
    this.state.deltaY = 0;
    this.state.wheelDelta = 0;
    this.pointerLockWanted = false;
  }

  setTargetElement(el: HTMLElement | null): void {
    this.targetElement = el;
  }

  setPointerLockWanted(wanted: boolean): void {
    this.pointerLockWanted = !!wanted;
  }

  markPointerLockWanted(): void {
    this.pointerLockWanted = true;
  }

  requestPointerLock(): void {
    // Request pointer lock on the configured target element unconditionally.
    // Components still indicate intent via `pointerLockWanted`, but clicking
    // the canvas should reliably request the lock (helps debugging).
    if (!this.targetElement) return;
    try {
      (this.targetElement as any).requestPointerLock();
    } catch {
      // ignore
    }
  }

  exitPointerLock(): void {
    try {
      if (document.exitPointerLock) document.exitPointerLock();
    } catch {}
  }

  getState(): MouseState {
    return { ...this.state, buttons: { ...this.state.buttons } };
  }

  dispose(): void {
    if (typeof document !== "undefined" && document.removeEventListener) {
      document.removeEventListener("mousemove", this.mouseMoveListener);
      document.removeEventListener("mousedown", this.mouseDownListener);
      document.removeEventListener("mouseup", this.mouseUpListener);
      document.removeEventListener("wheel", this.wheelListener as any);
      document.removeEventListener(
        "pointerlockchange",
        this.pointerLockChangeListener
      );
    }
  }
}

export default MouseInputService;
