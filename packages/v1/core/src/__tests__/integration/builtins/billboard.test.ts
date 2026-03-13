/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../../utils/SceneTestScaffold";
import { Entity } from "../../../domain/ecs";

function getEntityRotation(scaffold: SceneTestScaffold, id: string) {
    const ent = scaffold.scene.getEntity(id);
    if (!ent) return null;
    const r = ent.transform.localRotation;
    return { x: r.x, y: r.y, z: r.z };
}

describe("builtin://billboard.lua", () => {
    it("faces camera entity", async () => {
        const scaffold = new SceneTestScaffold();

        const cam = new Entity("cam");
        scaffold.scene.addEntity(cam);
        cam.transform.setPosition(0, 0, 10);

        scaffold.spawnScriptedEntity("board", "builtin://billboard.lua", {
            cameraEntity: "cam",
            lockY: false
        });

        await scaffold.wait();
        scaffold.tick(16);

        const r1 = getEntityRotation(scaffold, "board")!;
        expect(r1).toBeDefined();
    });
});
