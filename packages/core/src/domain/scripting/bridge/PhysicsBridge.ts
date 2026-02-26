import type { LuaEngine } from "wasmoon";
import { getPhysicsServices, type Vec3Like } from "../../ecs";
import type { LuaSelfInstance } from "../LuaSelfFactory";

export function registerPhysicsBridge(engine: LuaEngine) {
    const physicsApi = {
        applyImpulse: (target: any, vec: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            if (id && vec) {
                getPhysicsServices().applyImpulse(id, { x: vec.x, y: vec.y, z: vec.z });
            }
        },
        applyForce: (target: any, vec: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            if (id && vec) {
                getPhysicsServices().applyForce(id, { x: vec.x, y: vec.y, z: vec.z });
            }
        },
        getLinearVelocity: (target: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            if (!id) return { x: 0, y: 0, z: 0 };
            const v = getPhysicsServices().getLinearVelocity(id);
            return v ? { x: v.x, y: v.y, z: v.z } : { x: 0, y: 0, z: 0 };
        },
        raycast: (originVec: any, dirVec: any, maxDist?: number) => {
            if (!originVec || !dirVec) return null;
            const hit = getPhysicsServices().raycast({
                origin: { x: originVec.x, y: originVec.y, z: originVec.z },
                direction: { x: dirVec.x, y: dirVec.y, z: dirVec.z },
                maxDistance: maxDist
            });
            if (hit) {
                return { entityId: hit.entityId, point: hit.point, normal: hit.normal, distance: hit.distance };
            }
            return null;
        }
    };
    engine.global.set("physics", physicsApi);
}
