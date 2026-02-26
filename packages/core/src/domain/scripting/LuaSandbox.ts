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

    public async createEngine(): Promise<LuaEngine> {
        if (!this.factory) {
            const { LuaFactory } = await import('wasmoon');
            this.factory = new LuaFactory();
        }
        const engine = await this.factory!.createEngine();

        engine.global.setMemoryMax(1024 * 1024 * 10);
        engine.global.setTimeout(Date.now() + 1000);

        engine.doStringSync(`
            os = nil
            io = nil
            debug = nil
            loadfile = nil
            dofile = nil
        `);

        engine.global.set('print', (...args: any[]) => {
            console.log('[Lua]', ...args);
        });

        // Setup OOP Metatable logic for Entities and Components
        engine.doStringSync(`
            __ComponentMT = {
                __index = function(t, k)
                    return scene.getComponentProperty(t.entityId, t.type, k)
                end,
                __newindex = function(t, k, v)
                    scene.setComponentProperty(t.entityId, t.type, k, v)
                end
            }

            function __WrapComponent(entityId, type)
                local c = { entityId = entityId, type = type }
                setmetatable(c, __ComponentMT)
                return c
            end

            __EntityMT = {
                __index = function(t, k)
                    -- 1. Helper methods
                    if k == "isValid" then
                        return function(self) return scene.exists(self.id) end
                    end
                    if k == "addComponent" then
                        return function(self, type, params) return scene.addComponent(self.id, type, params) end
                    end
                    if k == "removeComponent" then
                        return function(self, type) return scene.removeComponent(self.id, type) end
                    end
                    if k == "applyMaterial" then
                        return function(self, key, overrides) 
                            return scene.applyResource(self.id, key, "standardMaterial", overrides) 
                        end
                    end
                    if k == "applyGeometry" then
                        -- We use "boxGeometry" or similar as a generic kin, but asset resolver defines the specific kind.
                        -- For now let's just use it as a generic resource but we can expand filter logic.
                        return function(self, key, overrides) 
                            return scene.applyResource(self.id, key, nil, overrides) 
                        end
                    end
                    if k == "applyResource" then
                        return function(self, key, overrides) return scene.applyResource(self.id, key, nil, overrides) end
                    end

                    -- 2. Transform / Physics explicit bridge helpers
                    if transform[k] then 
                        return function(self, ...) return transform[k](self, ...) end 
                    end
                    if physics[k] then 
                        return function(self, ...) return physics[k](self, ...) end 
                    end
                    if scene[k] then 
                        return function(self, ...) return scene[k](self, ...) end 
                    end

                    -- 3. Dynamic Component Access (UCA)
                    -- If we reach here, we check if the entity has the component
                    -- Note: This is slightly expensive to do in every frame if done carelessly in Lua,
                    -- but for scripting it's the "solid" way.
                    return __WrapComponent(t.id, k)
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

    public compile(engine: LuaEngine, source: string): LuaScriptInstance {
        engine.global.setTimeout(Date.now() + 1000);
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

    public pcall(engine: LuaEngine, hookFn: LuaHookFunction | undefined, ...args: any[]): boolean {
        if (!hookFn) return true;
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
