import type { LuaEngine } from "wasmoon";
import { SystemScripts } from "../generated/ScriptAssets";
import { CoreLogger } from "../../logging/CoreLogger";
import type { BridgeContext } from "./BridgeContext";
import { Vec3Like, EulerLike } from "../../ecs";

type EntityTarget = string | { id: string };

export function registerTransformBridge(engine: LuaEngine, ctx: BridgeContext) {
    const transformApi = {
        getPosition: (target: EntityTarget) => {
            const id = typeof target === 'string' ? target : (target as any)?.id;
            const ent = ctx.getEntity(id);
            if (!ent) {
                CoreLogger.warn("TransformBridge", `getPosition: Entity '${id}' not found. Target type: ${typeof target}`);
                return { x: 0, y: 0, z: 0 };
            }
            const p = ent.transform.localPosition;
            return { x: p.x, y: p.y, z: p.z };
        },

        setPosition: (target: EntityTarget, vec: Vec3Like) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (ent && vec) {
                ent.transform.setPosition(vec.x, vec.y, vec.z);
            }
        },
        getRotation: (target: EntityTarget) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 0, y: 0, z: 0 };
            const r = ent.transform.localRotation;
            return { x: r.x, y: r.y, z: r.z };
        },
        setRotation: (target: EntityTarget, vec: EulerLike) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (ent && vec) {
                ent.transform.setRotation(vec.x, vec.y, vec.z);
            }
        },
        getScale: (target: EntityTarget) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 1, y: 1, z: 1 };
            const s = ent.transform.localScale;
            return { x: s.x, y: s.y, z: s.z };
        },
        setScale: (target: EntityTarget, vec: Vec3Like) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (ent && vec) {
                ent.transform.setScale(vec.x, vec.y, vec.z);
            }
        },
        lookAt: (target: EntityTarget, vec: Vec3Like) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (ent && vec) {
                ent.transform.lookAt({ x: vec.x, y: vec.y, z: vec.z });
            }
        },
        getForward: (target: EntityTarget) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 0, y: 0, z: -1 };
            const f = ent.transform.getForward();
            return { x: f.x, y: f.y, z: f.z };
        },
        getRight: (target: EntityTarget) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 1, y: 0, z: 0 };
            const r = ent.transform.getRight();
            return { x: r.x, y: r.y, z: r.z };
        },
        getUp: (target: EntityTarget) => {
            const id = typeof target === 'string' ? target : target?.id;
            const ent = ctx.getEntity(id);
            if (!ent) return { x: 0, y: 1, z: 0 };
            const u = ent.transform.getUp();
            return { x: u.x, y: u.y, z: u.z };
        }
    };
    engine.global.set("Transform", transformApi);
    engine.global.set("transform", transformApi);
}

