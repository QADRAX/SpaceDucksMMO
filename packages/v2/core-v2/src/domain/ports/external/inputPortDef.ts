import { definePort } from '../../subsystems/definePort';
import type { InputPort } from './inputPort';

/** Port id; must match SCRIPTING_BRIDGE_PORT_KEYS.input in scripting-lua. */
export const INPUT_PORT_ID = 'io:input';

/**
 * Definition for the InputPort.
 * Exposes keyboard and mouse state to subsystems and scripting.
 */
export const InputPortDef = definePort<InputPort>(INPUT_PORT_ID)
  .addMethod('isKeyPressed')
  .addMethod('getMouseDelta')
  .addMethod('getMouseButtons')
  .addMethod('getMousePosition')
  .addMethod('getMouseWheelDelta')
  .addMethod('getGamepad')
  .addMethod('getGamepadCount')
  .build();
