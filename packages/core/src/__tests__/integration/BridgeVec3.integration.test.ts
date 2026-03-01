/** @jest-environment node */
jest.unmock('wasmoon');
import { SceneTestScaffold } from "../utils/SceneTestScaffold";
import { Entity } from "../../domain/ecs";

describe("Bridge Vec3 Integration", () => {
    let scaffold: SceneTestScaffold;

    beforeEach(() => {
        scaffold = new SceneTestScaffold();
    });

    it("getPosition returns a proper Vec3 with metatables", async () => {
        const target = new Entity("target");
        scaffold.scene.addEntity(target);
        target.transform.setPosition(7, 14, 21);

        const scriptSource = SceneTestScaffold.loadTestScript("test_bridge_vec3.lua");
        const scaffoldWithScript = new SceneTestScaffold({
            "test://bridge_vec3": scriptSource
        });

        const targetForScript = new Entity("target");
        scaffoldWithScript.scene.addEntity(targetForScript);
        targetForScript.transform.setPosition(7, 14, 21);

        const tester = scaffoldWithScript.spawnScriptedEntity("tester", "test://bridge_vec3", {
            targetEntityId: targetForScript.id,
            offset: [1, 2, 3]
        });
        tester.transform.setPosition(10, 20, 30);

        await scaffoldWithScript.wait();

        const logs = scaffoldWithScript.getLogs();
        console.log("Bridge Vec3 Logs:", logs);

        // Core assertions: all checks must pass
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: getPosition returns non-nil"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: clone() works"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: length() returns number"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: Vec3 + Vec3 works"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: Vec3 - Vec3 works"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: normalize() works"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: distanceTo() returns number"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: getForward returns non-nil"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: getForward is normalized (~1)"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: getRotation returns non-nil"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: getScale returns non-nil"));

        // Cross-entity target assertions
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: target:getPosition returns non-nil"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: target:getPosition():clone() works"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: target pos + vec3 works"));

        // Vec3 property auto-hydration assertions
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: offset property is non-nil"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: offset:clone() works"));
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] PASS: offset + vec3 works"));

        // Final verdict
        expect(logs).toContainEqual(expect.stringContaining("[Vec3Test] ALL PASSED"));

        // Ensure no FAILs
        const failLogs = logs.filter(l => l.includes("[Vec3Test] FAIL"));
        expect(failLogs).toHaveLength(0);
    });

    it("follow_entity.lua: tp:clone() works after Vec3 wrapping", async () => {
        const target = new Entity("target");
        scaffold.scene.addEntity(target);
        target.transform.setPosition(10, 0, 10);

        const follower = scaffold.spawnScriptedEntity("follower", "builtin://follow_entity.lua", {
            targetEntityId: target.id,
            speed: 10,
            delay: 0,
            offset: [0, 5, 5]
        });
        follower.transform.setPosition(0, 0, 0);

        await scaffold.wait();
        scaffold.tick(100);

        const logs = scaffold.getLogs();
        console.log("Follow Entity Vec3 Logs:", logs);

        // Should NOT have any errors about clone or nil
        const errorLogs = logs.filter(l => l.includes("[ERROR]"));
        expect(errorLogs).toHaveLength(0);

        // Follower should have moved
        const pos = follower.transform.localPosition;
        expect(pos.x).toBeGreaterThan(0);
        expect(pos.y).toBeGreaterThan(0);
        expect(pos.z).toBeGreaterThan(0);
    });
});
