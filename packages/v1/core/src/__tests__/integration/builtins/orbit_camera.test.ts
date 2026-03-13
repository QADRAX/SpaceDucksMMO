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

describe("builtin://orbit_camera.lua", () => {
    it("orbits around target entity", async () => {
        const scaffold = new SceneTestScaffold();

        const center = new Entity("center");
        scaffold.scene.addEntity(center);
        center.transform.setPosition(0, 0, 0);

        scaffold.spawnScriptedEntity("orbiter", "builtin://orbit_camera.lua", {
            targetEntityId: "center",
            altitudeFromSurface: 5,
            speed: 2,
            orbitPlane: "xz",
            initialAngle: 0
        });

        await scaffold.wait();
        scaffold.tick(16);
        const p0 = getEntityPosition(scaffold, "orbiter")!;

        scaffold.tick(500);
        const p1 = getEntityPosition(scaffold, "orbiter")!;

        // Position should have changed (orbiting)
        const dist = Math.sqrt(
            (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2 + (p1.z - p0.z) ** 2
        );
        expect(dist).toBeGreaterThan(0.01);
    });
});
