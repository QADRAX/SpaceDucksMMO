import { Entity, ComponentType, ScriptSlot } from "../ecs";

export interface LuaSelfInstance {
    id: string; // Entity ID
    slotId: string; // The ID of the specific script slot
    state: Record<string, any>; // Persistent state table for the script
    getComponent: (type: string) => any; // Bridge to access component data
    scripts: Record<string, Record<string, any>>; // Cross-script property access proxy
    [key: string]: any; // Dynamic component access (UCA) / Hydrated properties
}


export class LuaSelfFactory {
    /**
     * Creates the `self` object injected into Lua scripts.
     * This object encapsulates entity identity, slot persistent state, and property parameters.
     */
    public static create(entity: Entity, slot: ScriptSlot): LuaSelfInstance {
        // We create a fresh state object for each script instance.
        // In the future this state might be serialized/deserialized if hot-reloading is supported.
        const state: Record<string, any> = {};

        // In Lua, these are handled by metatables defined in sandbox_init.lua.
        // We provide these stubs here for better TypeScript typing of the 'ctx' object
        // and to ensure they exist on the object passed to Wasmoon.
        const scripts: Record<string, Record<string, any>> = {};

        return {
            id: entity.id,
            slotId: slot.slotId,
            state,
            scripts,


            getComponent: (type: string) => {
                const comp = entity.getComponent(type as ComponentType);
                if (!comp) return null;

                // Return a safe, static snapshot of the component's primitive properties
                // This prevents Lua from mutating the raw JS class or leaking memory via proxies.
                const snapshot: Record<string, any> = {};
                for (const key of Object.keys(comp)) {
                    // Ignore internal component fields and methods
                    if (key === 'type' || key === 'metadata' || key === 'entity' || key === 'isDisposed') continue;

                    const val = (comp as any)[key];
                    // Only pass safe primitives or plain objects
                    const t = typeof val;
                    if (t === 'string' || t === 'number' || t === 'boolean') {
                        snapshot[key] = val;
                    } else if (val && typeof val === 'object' && !Array.isArray(val) && val.constructor === Object) {
                        // Shallow copy plain objects (e.g. { x, y, z } vectors)
                        snapshot[key] = { ...val };
                    }
                }
                return snapshot;
            }
        };
    }
}
