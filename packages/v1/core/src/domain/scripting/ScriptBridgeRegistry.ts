import type { LuaEngine } from 'wasmoon';
import type { BridgeContext } from './bridge';
import {
    registerInputBridge,
    registerMathBridge,
    registerPhysicsBridge,
    registerSceneBridge,
    registerEditorBridge,
    registerTimeBridge,
    registerTransformBridge,
    registerGizmoBridge,
} from './bridge';
import { CoreLogger } from '../logging/CoreLogger';

/**
 * Manages the registration of all Lua bridge APIs.
 * 
 * @remarks
 * This class is responsible for:
 * - Registering all standard bridges (Transform, Scene, Input, etc.)
 * - Conditionally registering editor-only bridges
 * - Providing access to the Time bridge sync object
 * 
 * Extracted from ScriptSystem to follow Single Responsibility Principle.
 */
export class ScriptBridgeRegistry {
    private timeBridgeSync?: { setDelta: (dt: number) => void; getScale: () => number };

    /**
     * Registers all bridges into the Lua global environment.
     * 
     * @param lua - The Lua engine to register bridges into
     * @param bridgeContext - Context object providing access to entities, components, etc.
     * @param isEditorContext - Whether to register editor-only bridges
     */
    public registerAll(lua: LuaEngine, bridgeContext: BridgeContext, isEditorContext: boolean): void {
        // Standard Bridges (always registered)
        registerTransformBridge(lua, bridgeContext);
        registerSceneBridge(lua, bridgeContext);
        registerMathBridge(lua);
        registerInputBridge(lua);
        registerPhysicsBridge(lua);
        registerGizmoBridge(lua, bridgeContext);

        // Editor-only bridges
        if (isEditorContext) {
            registerEditorBridge(lua, bridgeContext);
        }

        // Time bridge (keep reference for delta sync)
        this.timeBridgeSync = registerTimeBridge(lua);

        CoreLogger.debug("ScriptBridgeRegistry", "All bridges registered");
    }

    /**
     * Gets the Time bridge sync object.
     * Used by lifecycle orchestrator to sync delta time.
     */
    public getTimeBridgeSync(): { setDelta: (dt: number) => void; getScale: () => number } | undefined {
        return this.timeBridgeSync;
    }
}
