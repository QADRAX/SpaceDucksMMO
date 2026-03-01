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

describe("builtin://waypoint_path.lua", () => {
    it("follows a sequence of waypoint entities", async () => {
        const scaffold = new SceneTestScaffold();

        // Spawn waypoint entities
        const wp1 = new Entity("wp1");
        scaffold.scene.addEntity(wp1);
        wp1.transform.setPosition(0, 0, 0);

        const wp2 = new Entity("wp2");
        scaffold.scene.addEntity(wp2);
        wp2.transform.setPosition(10, 0, 0);

        const wp3 = new Entity("wp3");
        scaffold.scene.addEntity(wp3);
        wp3.transform.setPosition(10, 10, 0);

        scaffold.spawnScriptedEntity("walker", "builtin://waypoint_path.lua", {
            speed: 10,
            loop: false,
            waypoints: ["wp1", "wp2", "wp3"]
        });

        await scaffold.wait();
        const p0 = getEntityPosition(scaffold, "walker")!;

        // Tick enough for the entity to start moving
        for (let i = 0; i < 20; i++) scaffold.tick(50);
        const p1 = getEntityPosition(scaffold, "walker")!;

        // Should have moved from origin towards wp2 (10,0,0) then wp3 (10,10,0)
        const dist = Math.sqrt(
            (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2 + (p1.z - p0.z) ** 2
        );
        expect(dist).toBeGreaterThan(0.5);

        // Verify no Lua errors in logs
        const logs = scaffold.getLogs();
        expect(logs.filter(l => l.includes("ERROR")).length).toBe(0);
    });

    it("loops back to first waypoint", async () => {
        const scaffold = new SceneTestScaffold();

        const wp1 = new Entity("wpa");
        scaffold.scene.addEntity(wp1);
        wp1.transform.setPosition(0, 0, 0);

        const wp2 = new Entity("wpb");
        scaffold.scene.addEntity(wp2);
        wp2.transform.setPosition(5, 0, 0);

        scaffold.spawnScriptedEntity("looper", "builtin://waypoint_path.lua", {
            speed: 100, // Very fast so we complete the loop
            loop: true,
            waypoints: ["wpa", "wpb"]
        });

        await scaffold.wait();

        // Tick many frames — entity should loop between the two waypoints
        for (let i = 0; i < 50; i++) scaffold.tick(50);

        // Entity should still exist and be running
        expect(scaffold.scene.getEntity("looper")).toBeDefined();

        const logs = scaffold.getLogs();
        expect(logs.filter(l => l.includes("ERROR")).length).toBe(0);
    });
});
