/** @jest-environment node */
jest.unmock('wasmoon');
import { SceneTestScaffold } from "../utils/SceneTestScaffold";
import { Entity } from "../../domain/ecs";
import { BuiltInScripts } from "../../domain/scripting/generated/ScriptAssets";

describe("Builtin Scripts Integration", () => {
    let scaffold: SceneTestScaffold;

    beforeEach(() => {
        scaffold = new SceneTestScaffold();
    });

    it("follow_entity.lua: moves entity towards target with offset", async () => {
        const target = new Entity("target");
        scaffold.scene.addEntity(target);
        target.transform.setPosition(10, 0, 10);

        const follower = scaffold.spawnScriptedEntity("follower", "builtin://follow_entity.lua", {
            targetEntityId: target.id,
            speed: 10,
            delay: 0, // No delay for test
            offset: [0, 5, 5]
        });

        follower.transform.setPosition(0, 0, 0);
        console.log("Follower components:", (follower as any).components.keys());

        // Wait for wasmoon async init and tick

        await scaffold.wait();

        const entities = (scaffold.scene as any).entities;
        console.log("Scene entities count:", entities.size);
        console.log("Entity 'target' present:", entities.has("target"));

        // One tick might not be enough depending on threshold
        scaffold.tick(100);


        const pos = follower.transform.localPosition;
        const logs = scaffold.getLogs();
        console.log("Follow Entity Logs:", logs);

        // Should move towards (10, 5, 10 + 5) = (10, 5, 15)
        expect(pos.x).toBeGreaterThan(0.1);

        expect(pos.y).toBeGreaterThan(0);
        expect(pos.z).toBeGreaterThan(0);
    });

    it("look_at_entity.lua: rotates entity to face target", async () => {
        const target = new Entity("target");
        scaffold.scene.addEntity(target);
        // Move to the side (X+) to require rotation
        target.transform.setPosition(10, 0, 0);


        const looker = scaffold.spawnScriptedEntity("looker", "builtin://look_at_entity.lua", {
            targetEntityId: "target",
            lookAtOffset: [0, 0, 0]
        });

        await scaffold.wait();
        scaffold.tick(16);

        const rot = looker.transform.localRotation;
        const logs = scaffold.getLogs();
        console.log("LookAt Logs:", logs);
        // Looking at (10, 0, 0) from (0,0,0) with forward Z+ 
        // should be roughly 90 degrees (PI/2 radians)
        expect(Math.abs(rot.y)).toBeGreaterThan(0.5);

    });
});
