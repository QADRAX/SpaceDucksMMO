/** @jest-environment node */
jest.unmock('wasmoon');

import { SceneTestScaffold } from "../utils/SceneTestScaffold";
import { Entity } from "../../domain/ecs";

/**
 * E2E integration tests for bridge functionality NOT covered by builtins.
 * Uses Lua test scripts injected via scriptOverrides to exercise:
 * - Vec3 extended methods (lerp, reflect, project, angleTo, min, max, etc.)
 * - math.ext functions (inverseLerp, remap, sign, moveTowards, pingPong, etc.)
 * - Time API (getDelta, getElapsed, getFrameCount, getScale, setScale)
 * - Scene events (fireEvent, onEvent)
 * - Entity destroy (self:destroy())
 * - Vec3 core (existing test_bridge_vec3 baseline)
 */

// ── Helpers ──────────────────────────────────────────────────────────

function logsContain(logs: string[], text: string): boolean {
    return logs.some(l => l.includes(text));
}

function logsContainAll(logs: string[], ...texts: string[]): boolean {
    return texts.every(t => logsContain(logs, t));
}

function countFailures(logs: string[]): number {
    return logs.filter(l => l.includes("] FAIL:")).length;
}

// ─────────────────────────────────────────────────────────────────────
// Vec3 Core (baseline)
// ─────────────────────────────────────────────────────────────────────

describe("Bridge E2E – Vec3 Core", () => {
    it("test_bridge_vec3: full Vec3 marshalling and operators", async () => {
        const src = SceneTestScaffold.loadTestScript("test_bridge_vec3.lua");
        const scaffold = new SceneTestScaffold({
            "test://vec3core": src
        });

        // Spawn target entity at (5, 3, 1) for cross-entity tests
        const target = new Entity("tgt");
        scaffold.scene.addEntity(target);
        target.transform.setPosition(5, 3, 1);

        scaffold.spawnScriptedEntity("v3test", "test://vec3core", {
            targetEntityId: "tgt",
            offset: [1, 2, 3]
        });

        await scaffold.wait();
        const logs = scaffold.getLogs();

        expect(logsContain(logs, "[Vec3Test] ALL PASSED")).toBe(true);
        expect(countFailures(logs)).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────
// Vec3 Extended Methods (Phase 3)
// ─────────────────────────────────────────────────────────────────────

describe("Bridge E2E – Vec3 Extended", () => {
    it("test_vec3_extended: lerp, reflect, project, angleTo, min, max, abs, floor, ceil, set, toArray, lengthSq", async () => {
        const src = SceneTestScaffold.loadTestScript("test_vec3_extended.lua");
        const scaffold = new SceneTestScaffold({
            "test://vec3ext": src
        });

        scaffold.spawnScriptedEntity("v3ext", "test://vec3ext");
        await scaffold.wait();

        const logs = scaffold.getLogs();
        expect(logsContain(logs, "[Vec3Ext] ALL PASSED")).toBe(true);
        expect(countFailures(logs)).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────
// Math.ext Functions (Phase 3)
// ─────────────────────────────────────────────────────────────────────

describe("Bridge E2E – Math Ext", () => {
    it("test_math_ext: lerp, clamp, inverseLerp, remap, sign, moveTowards, pingPong, wrapRepeat, easing", async () => {
        const src = SceneTestScaffold.loadTestScript("test_math_ext.lua");
        const scaffold = new SceneTestScaffold({
            "test://mathext": src
        });

        scaffold.spawnScriptedEntity("mext", "test://mathext");
        await scaffold.wait();

        const logs = scaffold.getLogs();
        expect(logsContain(logs, "[MathExt] ALL PASSED")).toBe(true);
        expect(countFailures(logs)).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────
// Time API (Phase 3)
// ─────────────────────────────────────────────────────────────────────

describe("Bridge E2E – Time API", () => {
    it("test_time_api: getDelta, getElapsed, getFrameCount, getScale, setScale", async () => {
        const src = SceneTestScaffold.loadTestScript("test_time_api.lua");
        const scaffold = new SceneTestScaffold({
            "test://timeapi": src
        });

        scaffold.spawnScriptedEntity("tapi", "test://timeapi");
        await scaffold.wait();

        // Init checks
        let logs = scaffold.getLogs();
        expect(logsContain(logs, "[TimeAPI] INIT DONE")).toBe(true);

        // Frame 1
        scaffold.tick(16);
        logs = scaffold.getLogs();
        expect(logsContain(logs, "[TimeAPI] FRAME1 DONE")).toBe(true);

        // Frame 2
        scaffold.tick(16);
        logs = scaffold.getLogs();
        expect(logsContain(logs, "[TimeAPI] FRAME2 DONE")).toBe(true);
        expect(logsContain(logs, "[TimeAPI] ALL PASSED")).toBe(true);
        expect(countFailures(logs)).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────
// Scene Events
// ─────────────────────────────────────────────────────────────────────

describe("Bridge E2E – Scene Events", () => {
    it("test_events: fireEvent and onEvent round-trip", async () => {
        const src = SceneTestScaffold.loadTestScript("test_events.lua");
        const scaffold = new SceneTestScaffold({
            "test://events": src
        });

        scaffold.spawnScriptedEntity("evt", "test://events");
        await scaffold.wait();

        // Fire + receive on first tick
        scaffold.tick(16);
        // The handler runs synchronously during fireEvent, which is in the same update
        scaffold.tick(16);

        const logs = scaffold.getLogs();
        expect(logsContain(logs, "[Events] ALL PASSED")).toBe(true);
        expect(countFailures(logs)).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────
// Entity Destroy
// ─────────────────────────────────────────────────────────────────────

describe("Bridge E2E – Entity Destroy", () => {
    it("test_scene_destroy: self:destroy() removes entity from scene", async () => {
        const src = SceneTestScaffold.loadTestScript("test_scene_destroy.lua");
        const scaffold = new SceneTestScaffold({
            "test://destroy": src
        });

        scaffold.spawnScriptedEntity("doomed", "test://destroy");
        await scaffold.wait();

        // Entity should exist after init
        expect(scaffold.scene.getEntity("doomed")).toBeDefined();

        const logs0 = scaffold.getLogs();
        expect(logsContain(logs0, "[Destroy] init called for doomed")).toBe(true);

        // Frame 1: no destroy yet
        scaffold.tick(16);
        expect(scaffold.scene.getEntity("doomed")).toBeDefined();

        // Frame 2: destroy fires
        scaffold.tick(16);

        const logs = scaffold.getLogs();
        expect(logsContain(logs, "[Destroy] calling self:destroy()")).toBe(true);
        expect(logsContain(logs, "[Destroy] onDestroy called for doomed")).toBe(true);

        // Entity should be removed from scene
        expect(scaffold.scene.getEntity("doomed")).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────
// Lifecycle Hooks (existing)
// ─────────────────────────────────────────────────────────────────────

describe("Bridge E2E – Lifecycle", () => {
    it("test_lifecycle: init and update hooks execute correctly", async () => {
        const src = SceneTestScaffold.loadTestScript("test_lifecycle.lua");
        const scaffold = new SceneTestScaffold({
            "test://lifecycle": src
        });

        scaffold.spawnScriptedEntity("lc", "test://lifecycle");
        await scaffold.wait();

        const logs = scaffold.getLogs();
        expect(logsContain(logs, "[Test] init called, state type: table")).toBe(true);

        scaffold.tick(16);
        expect(logsContain(scaffold.getLogs(), "[Test] first update")).toBe(true);
    });
});
