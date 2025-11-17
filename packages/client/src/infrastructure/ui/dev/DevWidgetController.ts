// Generic change payload for dev widgets. Each widget can define its
// own change shape via the generic parameter `T`. As a minimum most
// widgets should include `visible?: boolean`.
export type DevWidgetChange<T extends Record<string, any>> = Partial<T>;

// Default shape for widgets that only publish visibility changes.
export interface VisibilityChange {
  visible?: boolean;
}

// Common FPS change shape exported here so controllers/widgets can reuse it
export interface FpsChange {
  visible?: boolean;
  running?: boolean;
  fps?: number;
}

export interface DevWidgetController<T extends Record<string, any> = VisibilityChange> {
  show(): void;
  hide(): void;
  isVisible(): boolean;
  onChange(listener: (change: DevWidgetChange<T>) => void): () => void;
}
