/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";
import { Entity } from "../../../domain/ecs";

function getEntityPosition(scaffold: SceneTestScaffold, id: string) {
    const ent = scaffold.scene.getEntity(id);
    if (!ent) return null;
    const p = ent.transform.localPosition;
    return { x: p.x, y: p.y, z: p.z };
}

describe("builtin://follow_entity.lua", () => {
    it("kinematic follow with offset", async () => {
        const scaffold = new SceneTestScaffold();

        const leader = new Entity("leader");
        scaffold.scene.addEntity(leader);
        leader.transform.setPosition(0, 0, 0);

        scaffold.spawnScriptedEntity("follower", "builtin://follow_entity.lua", {
            targetEntityId: "leader",
            delay: 0.1,
            speed: 10,
            offset: [0, 5, 5]
        });

        await scaffold.wait();
        const p0 = getEntityPosition(scaffold, "follower")!;

        // Move leader and tick
        leader.transform.setPosition(10, 0, 0);
        for (let i = 0; i < 10; i++) scaffold.tick(16);
        const p1 = getEntityPosition(scaffold, "follower")!;

        // Follower should have moved towards leader + offset
        const dist = Math.sqrt(
            (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2 + (p1.z - p0.z) ** 2
        );
        expect(dist).toBeGreaterThan(0.01);
    });
});
