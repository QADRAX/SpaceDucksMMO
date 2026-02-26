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

            -- Cross-script property proxy: entity.scripts.scriptName.propKey
            __ScriptSlotMT = {
                __index = function(t, k)
                    return scene.getScriptSlotProperty(t.entityId, t.scriptId, k)
                end,
                __newindex = function(t, k, v)
                    scene.setScriptSlotProperty(t.entityId, t.scriptId, k, v)
                end
            }

            function __WrapScriptSlot(entityId, scriptId)
                local s = { entityId = entityId, scriptId = scriptId }
                setmetatable(s, __ScriptSlotMT)
                return s
            end

            __ScriptsProxyMT = {
                __index = function(t, scriptId)
                    return __WrapScriptSlot(t.entityId, scriptId)
                end
            }

            function __WrapScriptsProxy(entityId)
                local p = { entityId = entityId }
                setmetatable(p, __ScriptsProxyMT)
                return p
            end

            -- Prefabs: prefab:instantiate(overrides)
            __PrefabMT = {
                __index = {
                    instantiate = function(t, overrides)
                        return scene.instantiatePrefab(t.key, overrides)
                    end
                }
            }

            function __WrapPrefab(key)
                local p = { key = key }
                setmetatable(p, __PrefabMT)
                return p
            end

            __EntityMT = {
                __index = function(t, k)
                    -- 0. Cross-script access: entity.scripts
                    if k == "scripts" then
                        return __WrapScriptsProxy(t.id)
                    end

                    -- 1. Helper methods
                    if k == "isValid" then
                        return function(self) return scene.__exists(self.id) end
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
