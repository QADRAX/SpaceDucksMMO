import type { SceneEventBus } from '@duckengine/core-v2';
import type { BridgeDeclaration, TimeState } from './types';
import { createSceneBridgeDeclaration } from './sceneBridge';
import { createTimeBridgeDeclaration, createTimeState } from './timeBridge';
import { transformBridge } from './transformBridge';
import { scriptsBridge } from './scriptsBridge';
import { componentBridge } from './componentBridge';
import { physicsBridge } from './physicsBridge';
import { inputBridge } from './inputBridge';
import { gizmoBridge } from './gizmoBridge';

export interface ScriptingBridges {
  readonly bridges: ReadonlyArray<BridgeDeclaration>;
  readonly timeState: TimeState;
}

/**
 * Returns the default set of bridges for the scripting engine.
 * Event bus is provided by core's SceneEventBusProviderPort.
 */
export function createDefaultScriptingBridges(eventBus: SceneEventBus): ScriptingBridges {
  const timeState = createTimeState();

  const bridges = [
    transformBridge,
    createSceneBridgeDeclaration(eventBus),
    scriptsBridge,
    componentBridge,
    physicsBridge,
    inputBridge,
    createTimeBridgeDeclaration(timeState),
    gizmoBridge,
  ];

  return { bridges, timeState };
}
