import type { LuaEngine } from "wasmoon";
import type { BridgeContext } from "./BridgeContext";
import type { LuaSelfInstance } from "../LuaSelfFactory";

export function registerTransformBridge(engine: LuaEngine, ctx: BridgeContext) {
    const transformApi = {
        getPosition: (target: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 0, y: 0, z: 0 };
            const p = ent.transform.localPosition;
            return { x: p.x, y: p.y, z: p.z };
        },
        setPosition: (target: any, vec: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (ent && vec) {
                ent.transform.setPosition(vec.x, vec.y, vec.z);
            }
        },
        getRotation: (target: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 0, y: 0, z: 0 };
            const r = ent.transform.localRotation;
            return { x: r.x, y: r.y, z: r.z };
        },
        setRotation: (target: any, vec: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (ent && vec) {
                ent.transform.setRotation(vec.x, vec.y, vec.z);
            }
        },
        getScale: (target: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 1, y: 1, z: 1 };
            const s = ent.transform.localScale;
            return { x: s.x, y: s.y, z: s.z };
        },
        setScale: (target: any, vec: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (ent && vec) {
                ent.transform.setScale(vec.x, vec.y, vec.z);
            }
        },
        lookAt: (target: any, vec: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (ent && vec) {
                ent.transform.lookAt({ x: vec.x, y: vec.y, z: vec.z });
            }
        },
        getForward: (target: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 0, y: 0, z: -1 };
            const f = ent.transform.getForward();
            return { x: f.x, y: f.y, z: f.z };
        },
        getRight: (target: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 1, y: 0, z: 0 };
            const r = ent.transform.getRight();
            return { x: r.x, y: r.y, z: r.z };
        },
        getUp: (target: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 0, y: 1, z: 0 };
            const u = ent.transform.getUp();
            return { x: u.x, y: u.y, z: u.z };
        }
    };
    engine.global.set("transform", transformApi);
}
