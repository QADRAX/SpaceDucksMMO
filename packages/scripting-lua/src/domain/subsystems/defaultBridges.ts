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
import { createScriptEventBus } from '../events';
import type { ScriptEventBus } from '../events';
import type { TimeState } from '../bridges';

export interface ScriptingBridges {
    readonly bridges: ReadonlyArray<BridgeDeclaration>;
    readonly eventBus: ScriptEventBus;
    readonly timeState: TimeState;
}

/**
 * Returns the default set of bridges for the scripting engine.
 */
export function createDefaultScriptingBridges(): ScriptingBridges {
    const eventBus = createScriptEventBus();
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

    return { bridges, eventBus, timeState };
}
