import type { LuaEngine } from "wasmoon";
import { getPhysicsServices } from "@duckengine/ecs";
import type { LuaSelfInstance } from "../LuaSelfFactory";

export function registerPhysicsBridge(engine: LuaEngine) {
    const physicsApi = {
        applyImpulse: (target: any, x: number, y: number, z: number) => {
            const id = typeof target === 'string' ? target : target?.id;
            if (id) getPhysicsServices().applyImpulse(id, { x, y, z });
        },
        applyForce: (target: any, x: number, y: number, z: number) => {
            const id = typeof target === 'string' ? target : target?.id;
            if (id) getPhysicsServices().applyForce(id, { x, y, z });
        },
        getLinearVelocity: (target: any) => {
            const id = typeof target === 'string' ? target : target?.id;
            if (!id) return { x: 0, y: 0, z: 0 };
            const v = getPhysicsServices().getLinearVelocity(id);
            return v ? { x: v.x, y: v.y, z: v.z } : { x: 0, y: 0, z: 0 };
        },
        raycast: (ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxDist?: number) => {
            const hit = getPhysicsServices().raycast({
                origin: { x: ox, y: oy, z: oz },
                direction: { x: dx, y: dy, z: dz },
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
