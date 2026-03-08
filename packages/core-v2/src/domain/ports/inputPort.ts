/** Mouse delta payload. */
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

/** Query-only input contract for subsystems and scripting runtimes. */
export interface InputPort {
  isKeyPressed(key: string): boolean;
  getMouseDelta(): InputMouseDelta;
  getMouseButtons(): InputMouseButtons;
}
