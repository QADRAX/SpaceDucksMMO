import type { Entity, ScriptSlot } from "../ecs";
import { CoreLogger } from "../logging/CoreLogger";
import { LuaSelfFactory } from "./LuaSelfFactory";
import type { ScriptRuntime } from "./ScriptRuntime";
import { BuiltInScripts } from "./generated/ScriptAssets";

export interface LuaScriptInstance {
    init?: boolean;
    onEnable?: boolean;
    earlyUpdate?: boolean;
    update?: boolean;
    lateUpdate?: boolean;
    onCollisionEnter?: boolean;
    onCollisionExit?: boolean;
    onDisable?: boolean;
    onDestroy?: boolean;
    onDrawGizmos?: boolean;
    onPropertyChanged?: boolean;
    schema?: any;
}

export class ScriptInstanceManager {
    private instances = new Map<string, LuaScriptInstance>();
    private lastProperties = new Map<string, string>(); // JSON snapshot for change detection

    constructor(
        private runtime: ScriptRuntime,
        private scriptOverrides: Record<string, string> = {},
        private systemScriptOverrides: Record<string, string> = {}
    ) { }

    /**
     * Returns the slotId itself — contexts live in Lua (__Contexts table).
     * The returned value is opaque; callers should only feed it back into the
     * runtime for hook execution.
     */
    public getContext(slotId: string): string | undefined {
        return this.instances.has(slotId) ? slotId : undefined;
    }

    public getInstance(slotId: string): LuaScriptInstance | undefined {
        return this.instances.get(slotId);
    }

    /**
     * Compiles and instantiates a script for a specific slot.
     * 
     * The compile result (hooks + context) is kept entirely in Lua to preserve
     * metatables (__SelfMT, __EntityMT, Vec3, etc.) that wasmoon destroys when
     * serialising Lua tables to JS objects.
     *
     * Two wasmoon limitations are worked around here:
     * 1. pairs() on JS-proxy objects crashes (null initial state in __pairs).
     * 2. Lua→JS→Lua round-trips strip all metatables (TableTypeExtension
     *    deep-copies to plain JS objects / plain Lua tables).
     */
    public compileSlot(entity: Entity, slot: ScriptSlot): LuaScriptInstance | null {
        if (this.instances.has(slot.slotId)) return this.instances.get(slot.slotId)!;

        const source = this.scriptOverrides[slot.scriptId] ||
            this.systemScriptOverrides[slot.scriptId] ||
            BuiltInScripts[slot.scriptId] ||
            `return {} -- Script not found: ${slot.scriptId}`;

        try {
            // Step 1: Compile, wrap, and store entirely in Lua.
            //   __compileResult stays as a native Lua table so pairs() works
            //   and metatables survive the __WrapSelf hydration.
            const rawCtx = LuaSelfFactory.create(entity, slot);
            this.runtime.lua.global.set("__compileRawCtx", rawCtx);

            // The Lua snippet:
            //  - compiles the script source (returns a table of hooks + schema)
            //  - wraps the JS rawCtx with __WrapSelf (entity proxies, Vec3 hydration)
            //  - stores both hook table and wrapped context in __SlotHooks / __Contexts
            const slotId = slot.slotId.replace(/'/g, "\\'");
            this.runtime.lua.doStringSync(`
                local _result = (function()\n${source}\nend)()
                if type(_result) ~= "table" then error("Script must return a table.") end
                local _ctx = __WrapSelf(__compileRawCtx, _result.schema)
                __StoreSlot('${slotId}', _result, _ctx)
                __compileRawCtx = nil
            `);

            // Step 2: Read the compile result from Lua (individual key lookups are safe).
            //   We only need metadata (which hooks exist + schema) on the JS side.
            const result = (this.runtime.lua.global as any).get("__SlotHooks")
                ? (this.runtime.lua.global as any).get("__SlotHooks")[slotId]
                : undefined;

            const instance: LuaScriptInstance = { schema: result?.schema };
            const hooks = [
                'init', 'onEnable', 'earlyUpdate', 'update', 'lateUpdate',
                'onCollisionEnter', 'onCollisionExit', 'onDisable', 'onDestroy',
                'onPropertyChanged'
            ] as const;

            for (const hook of hooks) {
                if (result && typeof result[hook] === 'function') {
                    // Store a truthy marker — actual call goes through __CallHook
                    (instance as any)[hook] = true;
                }
            }

            this.instances.set(slot.slotId, instance);
            this.lastProperties.set(slot.slotId, JSON.stringify(slot.properties));

            return instance;
        } catch (err) {
            try { this.runtime.lua.doStringSync("__compileRawCtx = nil"); } catch (_) { }
            CoreLogger.error("ScriptInstanceManager", `Failed to compile ${slot.scriptId}: ${err}`);
            return null;
        }
    }

    /**
     * Detects property changes and triggers onPropertyChanged.
     */
    public syncProperties(slot: ScriptSlot) {
        const instance = this.instances.get(slot.slotId);
        if (!instance) return;

        const currentProps = JSON.stringify(slot.properties);
        const lastPropsStr = this.lastProperties.get(slot.slotId);

        if (currentProps !== lastPropsStr) {
            const lastProps = lastPropsStr ? JSON.parse(lastPropsStr) : {};

            for (const key of Object.keys(slot.properties)) {
                if (slot.properties[key] !== lastProps[key]) {
                    // Update the Lua-side context properties via __UpdateProperty
                    const propDef = instance.schema?.properties?.[key];
                    try {
                        const updateProp = (this.runtime.lua.global as any).get("__UpdateProperty");
                        if (updateProp) {
                            updateProp(slot.slotId, key, slot.properties[key], propDef ?? undefined);
                        }
                    } catch (_) { /* best-effort update */ }

                    if (instance.onPropertyChanged) {
                        this.runtime.callHook(slot.slotId, "onPropertyChanged", key, slot.properties[key]);
                    }
                }
            }
            this.lastProperties.set(slot.slotId, currentProps);
        }
    }

    public removeSlot(slotId: string) {
        this.instances.delete(slotId);
        this.lastProperties.delete(slotId);
        // Clean up Lua-side storage
        try {
            const removeSlot = (this.runtime.lua.global as any).get("__RemoveSlot");
            if (removeSlot) removeSlot(slotId);
        } catch (_) { /* best-effort cleanup */ }
    }
}
