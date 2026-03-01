/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";
import { Entity } from "../../../domain/ecs";
import { ScriptComponent } from "../../../domain/ecs/components/scripting/ScriptComponent";

function getEntityPosition(scaffold: SceneTestScaffold, id: string) {
    const ent = scaffold.scene.getEntity(id);
    if (!ent) return null;
    const p = ent.transform.localPosition;
    return { x: p.x, y: p.y, z: p.z };
}

/**
 * Helper: spawns an entity with both waypoint_path and move_to_point scripts.
 * waypoint_path drives move_to_point via cross-script property changes.
 */
function spawnWaypointEntity(
    scaffold: SceneTestScaffold,
    id: string,
    waypointProps: Record<string, any>
): Entity {
    const entity = new Entity(id);
    const comp = new ScriptComponent();

    // Slot 0 — waypoint_path (orchestrator)
    comp.addSlot({
        slotId: `slot_${id}_wp`,
        scriptId: "builtin://waypoint_path.lua",
        enabled: true,
        properties: waypointProps,
        executionOrder: 0
    });

    // Slot 1 — move_to_point (motion driver)
    comp.addSlot({
        slotId: `slot_${id}_mtp`,
        scriptId: "builtin://move_to_point.lua",
        enabled: true,
        properties: {
            targetPoint: [0, 0, 0],
            duration: 1,
            easing: "cubicInOut",
            delay: 0
        },
        executionOrder: 1
    });

    entity.addComponent(comp as any);
    scaffold.scene.addEntity(entity);
    scaffold.scriptSystem.registerEntity(entity);
    return entity;
}

describe("builtin://waypoint_path.lua", () => {
    it("follows waypoints by driving move_to_point", async () => {
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

        spawnWaypointEntity(scaffold, "walker", {
            speed: 10,
            loop: false,
            waypoints: ["wp1", "wp2", "wp3"],
            easing: "linear",
            arrivalThreshold: 0.15
        });

        await scaffold.wait();

        const p0 = getEntityPosition(scaffold, "walker")!;

        // Tick 30 frames × 50ms = 1.5s of simulation
        for (let i = 0; i < 30; i++) scaffold.tick(50);

        const p1 = getEntityPosition(scaffold, "walker")!;

        // Should have moved from origin towards wp2
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

        spawnWaypointEntity(scaffold, "looper", {
            speed: 100,
            loop: true,
            waypoints: ["wpa", "wpb"],
            easing: "linear",
            arrivalThreshold: 0.15
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
