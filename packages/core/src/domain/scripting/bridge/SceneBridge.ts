import type { LuaEngine } from "wasmoon";
import type { BridgeContext } from "./BridgeContext";
import type { LuaSelfInstance } from "../LuaSelfFactory";
import type { LuaHookFunction } from "../LuaSandbox";

export function registerSceneBridge(engine: LuaEngine, ctx: BridgeContext) {
    const sceneApi = {
        fireEvent: (eventName: string, data?: any) => {
            ctx.getEventBus().fire(eventName, data || {});
        },
        onEvent: (self: LuaSelfInstance, eventName: string, listener: LuaHookFunction) => {
            ctx.getEventBus().subscribe(eventName, self.slotId, (payload) => {
                try {
                    listener(payload);
                } catch (e) {
                    console.error(`[Lua error in event ${eventName}]`, e);
                }
            });
        },
        findEntityByName: (name: string) => {
            const match = ctx.getAllEntities().find(e => e.displayName === name);
            return match ? match.id : null;
        },
        getEntity: (idOrSelf: any) => {
            const id = typeof idOrSelf === 'string' ? idOrSelf : (idOrSelf?.id);
            if (!id) return null;

            // Call the global Lua helper defined in LuaSandbox to wrap the ID
            return (engine.global as any).get('__WrapEntity')(id);
        }
    };
    engine.global.set("scene", sceneApi);
}
