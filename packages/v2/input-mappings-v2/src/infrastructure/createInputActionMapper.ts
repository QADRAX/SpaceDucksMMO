import type {
  InputPort,
  InputMouseDelta,
  InputMouseButtons,
  InputMousePosition,
} from '@duckengine/core-v2';
import type { BindingSource, InputBindingsConfig } from '../domain';

/** InputActionPort extends InputPort with action-based API. */
export interface InputActionPort extends InputPort {
  getAction(action: string): number;
  getAction2(actionX: string, actionY: string): { x: number; y: number };
  isActionPressed(action: string): boolean;
  rebindAction(action: string, sources: BindingSource[]): void;
  getBindings(): InputBindingsConfig;
  loadBindings(config: InputBindingsConfig): void;
}

const ZERO_POS: InputMousePosition = { x: 0, y: 0 };
const ZERO_DELTA: InputMouseDelta = { x: 0, y: 0 };
const ZERO_BUTTONS: InputMouseButtons = {
  left: false,
  right: false,
  middle: false,
};

function evaluateSource(
  raw: InputPort,
  source: BindingSource,
  sensitivity: Record<string, number>,
  action: string,
): number {
  const sens = sensitivity[action] ?? 1;

  switch (source.type) {
    case 'key': {
      const pressed = raw.isKeyPressed(source.key);
      return pressed ? 1 : 0;
    }
    case 'mouseButton': {
      const buttons = raw.getMouseButtons?.() ?? ZERO_BUTTONS;
      const pressed = buttons[source.button];
      return pressed ? 1 : 0;
    }
    case 'mouseAxis': {
      if (source.axis === 'wheel') {
        return (raw.getMouseWheelDelta?.() ?? 0) * sens;
      }
      const delta = raw.getMouseDelta?.() ?? ZERO_DELTA;
      let v = 0;
      if (source.axis === 'deltaX') v = delta.x;
      else if (source.axis === 'deltaY') v = delta.y;
      return v * sens;
    }
    case 'gamepadButton': {
      const idx = source.gamepadIndex ?? 0;
      const pad = raw.getGamepad?.(idx);
      if (!pad?.connected) return 0;
      const pressed = pad.buttons[source.button];
      return pressed ? 1 : 0;
    }
    case 'gamepadAxis': {
      const idx = source.gamepadIndex ?? 0;
      const pad = raw.getGamepad?.(idx);
      if (!pad?.connected) return 0;
      const axisVal = pad.axes[source.axis] ?? 0;
      const deadzone = 0.15;
      if (Math.abs(axisVal) < deadzone) return 0;
      if (source.direction === 'positive') {
        return axisVal > 0 ? axisVal : 0;
      }
      return axisVal < 0 ? -axisVal : 0;
    }
    default:
      return 0;
  }
}

function getActionValue(
  raw: InputPort,
  config: InputBindingsConfig,
  action: string,
): number {
  const binding = config.bindings.find((b) => b.action === action);
  if (!binding) return 0;

  const sensitivity = config.sensitivity ?? {};
  let maxVal = 0;
  for (const source of binding.sources) {
    const v = evaluateSource(raw, source, sensitivity, action);
    const abs = Math.abs(v);
    if (abs > Math.abs(maxVal)) maxVal = v;
  }
  return maxVal;
}

/**
 * Creates an InputActionPort that maps raw input to semantic actions.
 */
export function createInputActionMapper(
  rawPort: InputPort,
  initialBindings?: InputBindingsConfig,
): InputActionPort {
  let config: InputBindingsConfig = initialBindings ?? { bindings: [] };

  const port: InputActionPort = {
    // Delegate raw InputPort methods
    isKeyPressed: (key) => rawPort.isKeyPressed(key),
    getMouseDelta: () => rawPort.getMouseDelta?.() ?? ZERO_DELTA,
    getMouseButtons: () => rawPort.getMouseButtons?.() ?? ZERO_BUTTONS,
    getMousePosition: () => rawPort.getMousePosition?.() ?? ZERO_POS,
    getMouseWheelDelta: () => rawPort.getMouseWheelDelta?.() ?? 0,
    getGamepad: (i) => rawPort.getGamepad?.(i) ?? null,
    getGamepadCount: () => rawPort.getGamepadCount?.() ?? 0,
    requestPointerLock: () => rawPort.requestPointerLock?.(),
    exitPointerLock: () => rawPort.exitPointerLock?.(),
    isPointerLocked: () => rawPort.isPointerLocked?.() ?? false,
    beginFrame: () => rawPort.beginFrame?.(),

    getAction(action: string): number {
      return getActionValue(rawPort, config, action);
    },

    getAction2(actionX: string, actionY: string): { x: number; y: number } {
      return {
        x: getActionValue(rawPort, config, actionX),
        y: getActionValue(rawPort, config, actionY),
      };
    },

    isActionPressed(action: string): boolean {
      return getActionValue(rawPort, config, action) > 0;
    },

    rebindAction(action: string, sources: BindingSource[]): void {
      const existing = config.bindings.findIndex((b) => b.action === action);
      const newBinding = { action, sources };
      const bindings = [...config.bindings];
      if (existing >= 0) {
        bindings[existing] = newBinding;
      } else {
        bindings.push(newBinding);
      }
      config = { ...config, bindings };
    },

    getBindings(): InputBindingsConfig {
      return { ...config, bindings: [...config.bindings] };
    },

    loadBindings(newConfig: InputBindingsConfig): void {
      config = {
        bindings: [...newConfig.bindings],
        sensitivity: newConfig.sensitivity
          ? { ...newConfig.sensitivity }
          : undefined,
      };
    },
  };

  return port;
}
