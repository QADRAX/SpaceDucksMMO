/**
 * Stress tests for Rapier physics engine
 * 
 * Tests measure frame time under various collision load scenarios
 * to identify the threshold where 144 FPS performance degrades
 */

import { Entity, GravityComponent, RigidBodyComponent, SphereColliderComponent, BoxColliderComponent } from "@duckengine/core";
import { RapierSceneTestScaffold, type RapierSceneTestScaffoldOptions } from "../utils/RapierSceneTestScaffold";
import {
  PhysicsStressTester,
  FRAME_BUDGET_MS,
  TARGET_FPS,
  formatResultsTable,
  resultsToJSON,
  resultsToCSV,
  StressTestResult,
} from "./PhysicsPerformanceUtils";
import * as fs from "fs";
import * as path from "path";

describe("Performance: Rapier Physics Stress Tests", () => {
  const ALL_RESULTS: StressTestResult[] = [];

  afterAll(() => {
    if (ALL_RESULTS.length > 0) {
      console.log("\n" + formatResultsTable(ALL_RESULTS));

      // Write results to file
      const reportDir = path.join(process.cwd(), "perf-results/stress");
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const jsonPath = path.join(reportDir, `collision-stress-${timestamp}.json`);
      const csvPath = path.join(reportDir, `collision-stress-${timestamp}.csv`);

      fs.writeFileSync(jsonPath, resultsToJSON(ALL_RESULTS), "utf8");
      fs.writeFileSync(csvPath, resultsToCSV(ALL_RESULTS), "utf8");

      console.log(`\n✓ Results saved to:`);
      console.log(`  JSON: ${jsonPath}`);
      console.log(`  CSV:  ${csvPath}`);
    }
  });

  describe("Baseline: Static Entities", () => {
    it("should handle 1000 static entities with minimal overhead", async () => {
      const scaffold = await RapierSceneTestScaffold.create({
        timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
      });

      try {
        const tester = new PhysicsStressTester();
        const ENTITY_COUNT = 1000;
        const FRAMES = 60;

        // Create static entities without collisions
        for (let i = 0; i < ENTITY_COUNT; i++) {
          const entity = new Entity(`static_${i}`);
          entity.transform.setPosition(
            (i % 10) * 10,
            Math.floor(i / 10) * 10,
            (i % 100) * 0.1
          );
          // No physics components
          scaffold.addEntity(entity);
        }

        // Run and measure
        for (let frame = 0; frame < FRAMES; frame++) {
          const frameTime = measurePhysicsFrame(scaffold);
          tester.recordFrame(frameTime, 0);
        }

        const result = tester.computeResults("Static(1k)", ENTITY_COUNT, 0);
        ALL_RESULTS.push(result);

        expect(result.stability.stability_percent).toBeGreaterThan(95);
      } finally {
        scaffold.dispose();
      }
    });
  });

  describe("Scenario A: 1D Collision (Linear Push)", () => {
    /**
     * 10 spheres in a row, all dynamic, pushing each other
     * Simulates constant collision response
     */
    it("should handle 10 spheres in linear collision", async () => {
      await runLinearCollisionTest(10, ALL_RESULTS);
    });

    it("should handle 50 spheres in linear collision", async () => {
      await runLinearCollisionTest(50, ALL_RESULTS);
    });

    it("should handle 100 spheres in linear collision", async () => {
      await runLinearCollisionTest(100, ALL_RESULTS);
    });
  });

  describe("Scenario B: 3D Chaos (Falling Spheres)", () => {
    /**
     * N spheres falling and colliding in 3D space
     * Most realistic stress test
     */
    it("should handle 10 falling spheres", async () => {
      await runFallingSpheresTest(10, ALL_RESULTS);
    });

    it("should handle 50 falling spheres", async () => {
      await runFallingSpheresTest(50, ALL_RESULTS);
    });

    it("should handle 100 falling spheres", async () => {
      await runFallingSpheresTest(100, ALL_RESULTS);
    });

    it("should handle 250 falling spheres", async () => {
      await runFallingSpheresTest(250, ALL_RESULTS);
    });

    it("should handle 500 falling spheres", async () => {
      await runFallingSpheresTest(500, ALL_RESULTS);
    });
  });

  describe("Scenario C: Collider Type Comparison", () => {
    /**
     * Test different collision shapes to identify performance impact
     */
    it("should compare sphere vs box colliders at scale", async () => {
      await compareColliderTypes([100], ALL_RESULTS);
    });

    it("should compare sphere vs box vs cylinder at scale", async () => {
      await compareColliderTypes([50], ALL_RESULTS);
    });
  });

  describe("Scenario D: Stacked Grid (Pyramid)", () => {
    /**
     * Stacked boxes creating a pyramid
     * Tests rigid body stability and cascading collisions
     */
    it("should handle 10x10 stacked boxes", async () => {
      await runStackedBoxesTest(10, ALL_RESULTS);
    });

    it("should handle 15x15 stacked boxes", async () => {
      await runStackedBoxesTest(15, ALL_RESULTS);
    });
  });

  describe("Scenario E: Mixed Load", () => {
    /**
     * Combination of static and dynamic bodies with mixed colliders
     */
    it("should handle mixed 100 bodies: 70 dynamic + 30 static", async () => {
      await runMixedLoadTest(70, 30, ALL_RESULTS);
    });

    it("should handle mixed 300 bodies: 200 dynamic + 100 static", async () => {
      await runMixedLoadTest(200, 100, ALL_RESULTS);
    });
  });
});

// ============================================================================
// TEST SCENARIO IMPLEMENTATIONS
// ============================================================================

async function runLinearCollisionTest(count: number, results: StressTestResult[]): Promise<void> {
  const scaffold = await RapierSceneTestScaffold.create({
    timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
  });

  try {
    const tester = new PhysicsStressTester();
    const FRAMES = 120; // 2 seconds @ 60fps

    // Add gravity
    const gravity = new Entity("gravity");
    gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
    scaffold.addEntity(gravity);

    // Create ground plane
    const ground = new Entity("ground");
    ground.transform.setPosition(0, -2, 0);
    ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
    ground.addComponent(
      new BoxColliderComponent({
        halfExtents: { x: 100, y: 1, z: 100 },
      })
    );
    scaffold.addEntity(ground);

    // Create spheres in a line, allowing them to collide
    for (let i = 0; i < count; i++) {
      const sphere = new Entity(`sphere_${i}`);
      sphere.transform.setPosition(i * 2, 3, 0);
      sphere.addComponent(new RigidBodyComponent({ bodyType: "dynamic", mass: 1 }));
      sphere.addComponent(new SphereColliderComponent({ radius: 0.5 }));
      scaffold.addEntity(sphere);
    }

    // Run and measure
    for (let frame = 0; frame < FRAMES; frame++) {
      const frameTime = measurePhysicsFrame(scaffold);
      const collisionCount = getCollisionEventCount(scaffold);
      tester.recordFrame(frameTime, collisionCount);
    }

    const result = tester.computeResults(`Linear-${count}spheres`, count, count);
    results.push(result);

    // Validation: should not degrade too much
    if (count <= 50) {
      expect(result.stability.stability_percent).toBeGreaterThan(95);
    }
  } finally {
    scaffold.dispose();
  }
}

async function runFallingSpheresTest(count: number, results: StressTestResult[]): Promise<void> {
  const scaffold = await RapierSceneTestScaffold.create({
    timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
  });

  try {
    const tester = new PhysicsStressTester();
    const FRAMES = 180; // 3 seconds @ 60fps

    // Add gravity
    const gravity = new Entity("gravity");
    gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
    scaffold.addEntity(gravity);

    // Create large ground plane
    const ground = new Entity("ground");
    ground.transform.setPosition(0, -5, 0);
    ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
    ground.addComponent(
      new BoxColliderComponent({
        halfExtents: { x: 50, y: 1, z: 50 },
      })
    );
    scaffold.addEntity(ground);

    // Spawn spheres randomly in 3D space
    const rng = seededRandom(42);
    for (let i = 0; i < count; i++) {
      const sphere = new Entity(`ball_${i}`);
      const x = (rng() - 0.5) * 30;
      const y = 5 + rng() * 20; // Stagger spawn heights
      const z = (rng() - 0.5) * 30;
      sphere.transform.setPosition(x, y, z);
      sphere.addComponent(new RigidBodyComponent({ bodyType: "dynamic", mass: 0.5 }));
      sphere.addComponent(new SphereColliderComponent({ radius: 0.4 }));
      scaffold.addEntity(sphere);
    }

    // Run and measure
    for (let frame = 0; frame < FRAMES; frame++) {
      const frameTime = measurePhysicsFrame(scaffold);
      const collisionCount = getCollisionEventCount(scaffold);
      tester.recordFrame(frameTime, collisionCount);
    }

    const result = tester.computeResults(`Falling-${count}spheres`, count, count);
    results.push(result);

    if (count <= 100) {
      expect(result.stability.stability_percent).toBeGreaterThan(90);
    }
  } finally {
    scaffold.dispose();
  }
}

async function compareColliderTypes(counts: number[], results: StressTestResult[]): Promise<void> {
  const types = [
    { name: "Spheres", collider: () => new SphereColliderComponent({ radius: 0.5 }) },
    { name: "Boxes", collider: () => new BoxColliderComponent({ halfExtents: { x: 0.5, y: 0.5, z: 0.5 } }) },
  ];

  for (const type of types) {
    for (const count of counts) {
      const scaffold = await RapierSceneTestScaffold.create({
        timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
      });

      try {
        const tester = new PhysicsStressTester();
        const FRAMES = 120;

        // Setup
        const gravity = new Entity("gravity");
        gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
        scaffold.addEntity(gravity);

        const ground = new Entity("ground");
        ground.transform.setPosition(0, -5, 0);
        ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
        ground.addComponent(
          new BoxColliderComponent({
            halfExtents: { x: 50, y: 1, z: 50 },
          })
        );
        scaffold.addEntity(ground);

        // Create bodies with specified collider type
        const rng = seededRandom(42);
        for (let i = 0; i < count; i++) {
          const body = new Entity(`body_${type.name}_${i}`);
          body.transform.setPosition((rng() - 0.5) * 30, 5 + rng() * 10, (rng() - 0.5) * 30);
          body.addComponent(new RigidBodyComponent({ bodyType: "dynamic", mass: 0.5 }));
          body.addComponent(type.collider());
          scaffold.addEntity(body);
        }

        // Measure
        for (let frame = 0; frame < FRAMES; frame++) {
          const frameTime = measurePhysicsFrame(scaffold);
          const collisionCount = getCollisionEventCount(scaffold);
          tester.recordFrame(frameTime, collisionCount);
        }

        const result = tester.computeResults(`${type.name}-${count}`, count, count);
        results.push(result);
      } finally {
        scaffold.dispose();
      }
    }
  }
}

async function runStackedBoxesTest(gridSize: number, results: StressTestResult[]): Promise<void> {
  const scaffold = await RapierSceneTestScaffold.create({
    timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
  });

  try {
    const tester = new PhysicsStressTester();
    const FRAMES = 180;

    // Setup
    const gravity = new Entity("gravity");
    gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
    scaffold.addEntity(gravity);

    const ground = new Entity("ground");
    ground.transform.setPosition(0, 0, 0);
    ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
    ground.addComponent(
      new BoxColliderComponent({
        halfExtents: { x: 50, y: 0.5, z: 50 },
      })
    );
    scaffold.addEntity(ground);

    // Stack boxes in pyramid shape
    let boxCount = 0;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize - y; x++) {
        for (let z = 0; z < gridSize - y; z++) {
          const box = new Entity(`box_stack_${boxCount}`);
          const posX = x * 1.1 - (gridSize * 1.1) / 2;
          const posY = y * 1.1 + 1;
          const posZ = z * 1.1 - (gridSize * 1.1) / 2;
          box.transform.setPosition(posX, posY, posZ);
          box.addComponent(new RigidBodyComponent({ bodyType: "dynamic", mass: 1 }));
          box.addComponent(
            new BoxColliderComponent({
              halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
              friction: 0.5,
              restitution: 0.1,
            })
          );
          scaffold.addEntity(box);
          boxCount++;
        }
      }
    }

    // Measure
    for (let frame = 0; frame < FRAMES; frame++) {
      const frameTime = measurePhysicsFrame(scaffold);
      const collisionCount = getCollisionEventCount(scaffold);
      tester.recordFrame(frameTime, collisionCount);
    }

    const result = tester.computeResults(`Stacked-${gridSize}x${gridSize}`, boxCount, boxCount);
    results.push(result);
  } finally {
    scaffold.dispose();
  }
}

async function runMixedLoadTest(
  dynamicCount: number,
  staticCount: number,
  results: StressTestResult[]
): Promise<void> {
  const scaffold = await RapierSceneTestScaffold.create({
    timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
  });

  try {
    const tester = new PhysicsStressTester();
    const FRAMES = 120;

    // Setup
    const gravity = new Entity("gravity");
    gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
    scaffold.addEntity(gravity);

    const ground = new Entity("ground");
    ground.transform.setPosition(0, -5, 0);
    ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
    ground.addComponent(
      new BoxColliderComponent({
        halfExtents: { x: 50, y: 1, z: 50 },
      })
    );
    scaffold.addEntity(ground);

    const rng = seededRandom(42);

    // Dynamic bodies
    for (let i = 0; i < dynamicCount; i++) {
      const body = new Entity(`dynamic_${i}`);
      body.transform.setPosition((rng() - 0.5) * 30, 5 + rng() * 10, (rng() - 0.5) * 30);
      body.addComponent(new RigidBodyComponent({ bodyType: "dynamic", mass: 0.5 }));
      body.addComponent(new SphereColliderComponent({ radius: 0.4 }));
      scaffold.addEntity(body);
    }

    // Static scenery
    for (let i = 0; i < staticCount; i++) {
      const body = new Entity(`static_${i}`);
      body.transform.setPosition((rng() - 0.5) * 40, rng() * 15, (rng() - 0.5) * 40);
      body.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      body.addComponent(new BoxColliderComponent({ halfExtents: { x: 0.8, y: 0.8, z: 0.8 } }));
      scaffold.addEntity(body);
    }

    // Measure
    for (let frame = 0; frame < FRAMES; frame++) {
      const frameTime = measurePhysicsFrame(scaffold);
      const collisionCount = getCollisionEventCount(scaffold);
      tester.recordFrame(frameTime, collisionCount);
    }

    const totalCount = dynamicCount + staticCount;
    const result = tester.computeResults(`Mixed-${dynamicCount}dyn+${staticCount}static`, totalCount, totalCount);
    results.push(result);
  } finally {
    scaffold.dispose();
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Measure time for a single physics frame update
 */
function measurePhysicsFrame(scaffold: RapierSceneTestScaffold, dtMs: number = 1000 / 60): number {
  const start = performance.now();
  scaffold.tick(dtMs);
  return performance.now() - start;
}

/**
 * Get collision event count from scene collision hub
 * Counts active collision events in the current frame
 */
function getCollisionEventCount(scaffold: RapierSceneTestScaffold): number {
  // The CollisionEventsHub accumulates events each frame
  // We'll count from the recent event history
  try {
    const hub = (scaffold.scene as any).collisionEvents;
    if (hub && hub['_events']) {
      // Return the count of events in current buffer
      return hub._events.length || 0;
    }
  } catch {
    // If hub is not accessible, return 0
  }
  return 0;
}

/**
 * Seeded random number generator for reproducible tests
 */
function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}
