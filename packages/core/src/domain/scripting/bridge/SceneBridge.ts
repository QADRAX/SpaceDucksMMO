import type { LuaEngine } from "wasmoon";
import type { BridgeContext } from "./BridgeContext";
import type { ComponentType } from "@duckengine/ecs";

export function registerSceneBridge(engine: LuaEngine, ctx: BridgeContext) {
    const sceneApi = {
        fireEvent: (eventName: string, data?: any) => {
            ctx.getEventBus().fire(eventName, data || {});
        },
        onEvent: (self: any, eventName: string, listener: any) => {
            ctx.getEventBus().subscribe(eventName, self.slotId, (payload) => {
                try {
                    listener(payload);
                } catch (e) {
                    console.error(`[Lua error in event ${eventName}]`, e);
                }
            });
        },
        findEntityByName: (name: string) => {
            if (ctx.mode !== 'editor') {
                throw new Error("[Security] scene.findEntityByName is only available in Editor mode. Use schema-managed references instead.");
            }
            const match = ctx.getAllEntities().find(e => {
                const nameComp = e.getComponent<any>("name");
                return nameComp?.value === name || e.displayName === name;
            });
            return match ? (engine.global as any).get('__WrapEntity')(match.id) : null;
        },
        getEntity: (idOrSelf: any) => {
            if (ctx.mode !== 'editor') {
                throw new Error("[Security] scene.getEntity is only available in Editor mode. Use schema-managed references instead.");
            }
            const id = typeof idOrSelf === 'string' ? idOrSelf : (idOrSelf?.id);
            if (!id) return null;
            return (engine.global as any).get('__WrapEntity')(id);
        },
        exists: (idOrObject: any) => {
            if (ctx.mode !== 'editor') {
                throw new Error("[Security] scene.exists is only available in Editor mode. Use entity:isValid() on managed references instead.");
            }
            const id = typeof idOrObject === 'string' ? idOrObject : idOrObject?.id;
            return !!ctx.getEntity(id);
        },
        addComponent: (entityId: string, type: string, params?: any) => {
            const ent = ctx.getEntity(entityId);
            if (!ent) return null;
            const comp = ctx.componentFactory.create(type as ComponentType, params);
            ent.addComponent(comp);
            return true;
        },
        removeComponent: (entityId: string, type: string) => {
            const ent = ctx.getEntity(entityId);
            if (!ent) return false;
            ent.removeComponent(type as ComponentType);
            return true;
        },
        getComponentProperty: (entityId: string, type: string, key: string) => {
            const ent = ctx.getEntity(entityId);
            if (!ent) return null;
            const comp = ent.getComponent<any>(type as ComponentType);
            if (!comp) return null;

            const field = comp.metadata?.inspector?.fields?.find((f: any) => f.key === key);
            if (field) return field.get(comp);
            return comp[key];
        },
        setComponentProperty: (entityId: string, type: string, key: string, value: any) => {
            const ent = ctx.getEntity(entityId);
            if (!ent) return;
            const comp = ent.getComponent<any>(type as ComponentType);
            if (!comp) return;

            const field = comp.metadata?.inspector?.fields?.find((f: any) => f.key === key);
            if (field) {
                field.set(comp, value);
            } else {
                comp[key] = value;
                if (typeof comp.notifyChanged === 'function') comp.notifyChanged();
            }
        },
        applyResource: async (entityId: string, key: string, kind?: string, overrides?: any) => {
            if (!ctx.assetResolver) {
                console.warn("[SceneBridge] No AssetResolver provided to applyResource");
                return;
            }

            const res = await ctx.assetResolver.resolve(key);
            if (!res) {
                // In Lua, async errors might need to be handled carefully but for now let's just log
                console.error(`[Lua] Failed to resolve resource: ${key}`);
                return;
            }

            if (kind && res.kind !== kind) {
                console.error(`[Lua] Resource type mismatch. Expected ${kind}, got ${res.kind}`);
                return;
            }

            const ent = ctx.getEntity(entityId);
            if (!ent) return;

            const finalData = { ...res.data, ...overrides };
            const comp = ctx.componentFactory.create(res.kind as ComponentType, finalData);
            ent.addComponent(comp);
        },

        // ── Cross-script property access (Phase 12) ────────────
        getScriptSlotNames: (entityId: string): string[] => {
            if (!ctx.getScriptSlots) return [];
            return ctx.getScriptSlots(entityId).map(s => s.scriptId);
        },
        getScriptSlotProperty: (entityId: string, scriptId: string, key: string): unknown => {
            if (!ctx.getSlotProperty) return null;
            return ctx.getSlotProperty(entityId, scriptId, key);
        },
        setScriptSlotProperty: (entityId: string, scriptId: string, key: string, value: unknown): void => {
            if (!ctx.setSlotProperty) return;
            ctx.setSlotProperty(entityId, scriptId, key, value);
        },

        // ── Prefab support (Phase 13) ──────────────────────────
        instantiatePrefab: (key: string, overrides?: any): any => {
            if (!ctx.prefabRegistry) {
                console.warn("[SceneBridge] No PrefabRegistry provided to instantiatePrefab");
                return null;
            }

            const entities = ctx.prefabRegistry.instantiate(key, overrides);
            if (entities.length === 0) return null;

            // Return the first root entity wrapped for Lua
            const wrap = (engine.global as any).get("__WrapEntity");
            return wrap ? wrap(entities[0].id) : null;
        },

        // ── Internal methods (Phase 17) ──────────────────────────
        // These are used by metatables and not documented in scene.d.lua
        __exists: (id: string) => !!ctx.getEntity(id),
        __getEntity: (id: string) => {
            const ent = ctx.getEntity(id);
            return ent ? (engine.global as any).get('__WrapEntity')(ent.id) : null;
        }
    };
    engine.global.set("scene", sceneApi);
}
