import type { SceneEventBus } from '@duckengine/core-v2';
import {
    createSceneBridgeDeclaration,
    createTimeBridgeDeclaration,
    createTimeState,
    gizmoBridge,
    inputBridge,
    physicsBridge,
    scriptsBridge,
    transformBridge,
    type BridgeDeclaration,
} from '../bridges';
import type { TimeState } from '../bridges';

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
        physicsBridge,
        inputBridge,
        createTimeBridgeDeclaration(timeState),
        gizmoBridge,
    ];

    return { bridges, timeState };
}
