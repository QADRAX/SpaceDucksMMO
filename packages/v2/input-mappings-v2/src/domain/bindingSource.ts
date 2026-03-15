import type {
  InputGamepadButton,
  InputGamepadAxis,
} from '@duckengine/core-v2';

/** Binding source: where to read input value from. */
export type BindingSource =
  | { type: 'key'; key: string }
  | { type: 'mouseButton'; button: 'left' | 'right' | 'middle' }
  | { type: 'mouseAxis'; axis: 'deltaX' | 'deltaY' | 'wheel' }
  | {
      type: 'gamepadButton';
      gamepadIndex?: number;
      button: InputGamepadButton;
    }
  | {
      type: 'gamepadAxis';
      gamepadIndex?: number;
      axis: InputGamepadAxis;
      direction: 'positive' | 'negative';
    };
