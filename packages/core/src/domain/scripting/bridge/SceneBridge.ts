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
            const match = ctx.getAllEntities().find(e => {
                const nameComp = e.getComponent<any>("name");
                return nameComp?.value === name || e.displayName === name;
            });
            return match ? (engine.global as any).get('__WrapEntity')(match.id) : null;
        },
        getEntity: (idOrSelf: any) => {
            const id = typeof idOrSelf === 'string' ? idOrSelf : (idOrSelf?.id);
            if (!id) return null;
            return (engine.global as any).get('__WrapEntity')(id);
        },
        exists: (idOrObject: any) => {
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
        }
    };
    engine.global.set("scene", sceneApi);
}
