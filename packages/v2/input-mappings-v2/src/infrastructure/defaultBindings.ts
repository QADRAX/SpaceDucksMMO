import { INPUT_ACTION_NAMES } from '@duckengine/core-v2';
import type { InputBindingsConfig } from '../domain';

export const defaultBindings: InputBindingsConfig = {
  bindings: [
    {
      action: INPUT_ACTION_NAMES.moveForward,
      sources: [
        { type: 'key', key: 'w' },
        { type: 'gamepadAxis', axis: 'leftStickY', direction: 'negative' },
        { type: 'gamepadButton', button: 'dpadUp' },
      ],
    },
    {
      action: INPUT_ACTION_NAMES.moveBackward,
      sources: [
        { type: 'key', key: 's' },
        { type: 'gamepadAxis', axis: 'leftStickY', direction: 'positive' },
        { type: 'gamepadButton', button: 'dpadDown' },
      ],
    },
    {
      action: INPUT_ACTION_NAMES.moveLeft,
      sources: [
        { type: 'key', key: 'a' },
        { type: 'gamepadAxis', axis: 'leftStickX', direction: 'negative' },
        { type: 'gamepadButton', button: 'dpadLeft' },
      ],
    },
    {
      action: INPUT_ACTION_NAMES.moveRight,
      sources: [
        { type: 'key', key: 'd' },
        { type: 'gamepadAxis', axis: 'leftStickX', direction: 'positive' },
        { type: 'gamepadButton', button: 'dpadRight' },
      ],
    },
    {
      action: INPUT_ACTION_NAMES.jump,
      sources: [
        { type: 'key', key: 'space' },
        { type: 'gamepadButton', button: 'a' },
      ],
    },
    {
      action: INPUT_ACTION_NAMES.lookHorizontal,
      sources: [
        { type: 'mouseAxis', axis: 'deltaX' },
        { type: 'gamepadAxis', axis: 'rightStickX', direction: 'positive' },
      ],
    },
    {
      action: INPUT_ACTION_NAMES.lookVertical,
      sources: [
        { type: 'mouseAxis', axis: 'deltaY' },
        { type: 'gamepadAxis', axis: 'rightStickY', direction: 'negative' },
      ],
    },
    {
      action: 'sprint',
      sources: [
        { type: 'key', key: 'shift' },
        { type: 'gamepadButton', button: 'leftStick' },
      ],
    },
    {
      action: INPUT_ACTION_NAMES.flyDown,
      sources: [
        { type: 'key', key: 'control' },
        { type: 'key', key: 'c' },
        { type: 'gamepadButton', button: 'b' },
      ],
    },
  ],
  sensitivity: {
    [INPUT_ACTION_NAMES.lookHorizontal]: 0.002,
    [INPUT_ACTION_NAMES.lookVertical]: 0.002,
  },
};
