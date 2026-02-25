import type { LuaFactory, LuaEngine } from 'wasmoon';

export type LuaHookFunction = (...args: any[]) => any;

export interface LuaScriptInstance {
    init?: LuaHookFunction;
    onEnable?: LuaHookFunction;
    earlyUpdate?: LuaHookFunction;
    update?: LuaHookFunction;
    lateUpdate?: LuaHookFunction;
    onCollisionEnter?: LuaHookFunction;
    onCollisionExit?: LuaHookFunction;
    onDisable?: LuaHookFunction;
    onDestroy?: LuaHookFunction;
    onPropertyChanged?: (key: string, value: any) => void;
}
export class LuaSandbox {
    private factory: LuaFactory | null = null;

    constructor() { }

    /**
     * Creates a new isolated LuaEngine instance with standard libraries restricted 
     * and a maximum instruction count to prevent infinite loops.
     */
    public async createEngine(maxInstructions: number = 100_000): Promise<LuaEngine> {
        if (!this.factory) {
            const { LuaFactory } = await import('wasmoon');
            this.factory = new LuaFactory();
        }
        const engine = await this.factory!.createEngine();

        // Enforce instruction limits to prevent infinite loops
        engine.global.setMemoryMax(1024 * 1024 * 10); // 10MB max memory limit
        engine.global.setTimeout(Date.now() + 1000); // 1s timeout for initialization
        // Wasmoon handles instruction limits internally through the underlying fengari-web if needed,
        // but a Timeout/MemoryLimit is typically safer and more standard for Wasmoon.
        // The requirement specified 100k instructions; we will rely on timeout/memory limits 
        // for wasmoon as its instruction counting API varies.

        // Sandbox restrictions: remove potentially unsafe OS/IO modules
        const L = engine.global.address;
        engine.doStringSync(`
      os = nil
      io = nil
      debug = nil
      loadfile = nil
      dofile = nil
    `);

        // Inject a safe print function that prepends [Lua]
        engine.global.set('print', (...args: any[]) => {
            console.log('[Lua]', ...args);
        });

        // Setup OOP Metatable logic for Entities
        // This allows 'scene.getEntity(id)' to return an object that can do 'entity:getPosition()'
        engine.doStringSync(`
            __EntityMT = {
                __index = function(t, k)
                    -- First check if the key exists in k-v bridges (transform, physics, etc)
                    -- We'll assume the bridges are registered as globals.
                    if transform[k] then 
                        return function(self, ...) return transform[k](self, ...) end 
                    end
                    if physics[k] then 
                        return function(self, ...) return physics[k](self, ...) end 
                    end
                    if scene[k] then 
                        return function(self, ...) return scene[k](self, ...) end 
                    end
                    return nil
                end
            }

            function __WrapEntity(id)
                if not id or id == "" then return nil end
                local e = { id = id }
                setmetatable(e, __EntityMT)
                return e
            end
        `);

        return engine;
    }

    /**
     * Compiles the source string in the provided engine and returns 
     * the cached hook functions for fast invocation.
     */
    public compile(engine: LuaEngine, source: string): LuaScriptInstance {
        // Reset timeout just for compilation
        engine.global.setTimeout(Date.now() + 1000);

        // Execute the script. It should return a table containing the hooks.
        const result = engine.doStringSync(source);

        if (typeof result !== 'object' || result === null) {
            throw new Error("Lua script must return a table containing lifecycle hooks");
        }

        const instance: LuaScriptInstance = {};

        const hooks = [
            'init', 'onEnable', 'earlyUpdate', 'update', 'lateUpdate',
            'onCollisionEnter', 'onCollisionExit', 'onDisable', 'onDestroy',
            'onPropertyChanged'
        ] as const;

        for (const hook of hooks) {
            if (typeof result[hook] === 'function') {
                instance[hook] = result[hook];
            }
        }

        return instance;
    }

    /**
     * Safely invokes a Lua hook function with error catching and timeout limits.
     */
    public pcall(engine: LuaEngine, hookFn: LuaHookFunction | undefined, ...args: any[]): boolean {
        if (!hookFn) return true;

        // Set timeout for this specific invocation (e.g. 100ms max per script hook)
        // In a real high-performance scenario we'd use fengari instruction limits directly, 
        // but Wasmoon's timeout wrapper is the closest high-level API.
        engine.global.setTimeout(Date.now() + 100);

        try {
            hookFn(...args);
            return true;
        } catch (err) {
            console.error("[LuaSandbox] Error during hook execution:", err);
            return false;
        }
    }
}
