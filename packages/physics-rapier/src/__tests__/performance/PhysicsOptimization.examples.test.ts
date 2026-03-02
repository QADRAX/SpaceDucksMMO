/**
 * Performance optimization examples for Rapier Physics System
 * 
 * Demonstrates how to configure the engine for different scenarios
 */

import { Entity, GravityComponent, RigidBodyComponent, SphereColliderComponent, BoxColliderComponent, IPhysicsPerformanceProfile } from "@duckengine/core";
import { RapierSceneTestScaffold } from "../utils/RapierSceneTestScaffold";

describe("Physics Performance Optimization", () => {
  /**
   * Example 1: High-load scenario with solver iteration tuning
   * Useful for: Anything with many collisions at once (explosions, debris, etc)
   */
  it("should optimize high-load scene by reducing solver iterations", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
    });

    try {
      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
      scaffold.addEntity(gravity);

      // Create ground
      const ground = new Entity("ground");
      ground.transform.setPosition(0, -5, 0);
      ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      ground.addComponent(new BoxColliderComponent({ halfExtents: { x: 50, y: 1, z: 50 } }));
      scaffold.addEntity(ground);

      // Create 250 falling spheres
      const rng = seededRandom(42);
      for (let i = 0; i < 250; i++) {
        const sphere = new Entity(`sphere_${i}`);
        sphere.transform.setPosition(
          (rng() - 0.5) * 30,
          5 + rng() * 20,
          (rng() - 0.5) * 30
        );
        sphere.addComponent(new RigidBodyComponent({ bodyType: "dynamic", mass: 0.5 }));
        sphere.addComponent(new SphereColliderComponent({ radius: 0.4 }));
        scaffold.addEntity(sphere);
      }

      // Get reference to physics system
      const physics = (scaffold.scene as any).physicsSystem;

      // ✨ OPTIMIZATION 1: Reduce solver iterations for better performance
      console.log(`Before optimization:`);
      console.log(`  Solver iterations: ${physics.getSolverIterations()}`); // 4 (default)

      physics.setSolverIterations(2); // Reduce to 2 for 50% improvement

      console.log(`After optimization:`);
      console.log(`  Solver iterations: ${physics.getSolverIterations()}`); // 2

      // Simulate
      scaffold.runFrames(120, 17);

      // Get stats
      const stats = physics.getPerformanceStats();
      console.log(`Simulation stats:`, stats);

      expect(stats.totalBodies).toBe(251); // 1 ground + 250 spheres
    } finally {
      scaffold.dispose();
    }
  });

  /**
   * Example 2: Automatic sleeping for performance
   * Useful for: Realistic physics scenes where objects come to rest
   */
  it("should optimize by sleeping inactive bodies", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
    });

    try {
      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
      scaffold.addEntity(gravity);

      const ground = new Entity("ground");
      ground.transform.setPosition(0, -2, 0);
      ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      ground.addComponent(new BoxColliderComponent({ halfExtents: { x: 50, y: 1, z: 50 } }));
      scaffold.addEntity(ground);

      // Create 100 spheres - they'll fall and come to rest
      for (let i = 0; i < 100; i++) {
        const sphere = new Entity(`ball_${i}`);
        sphere.transform.setPosition((i % 10) * 2, 10 + Math.floor(i / 10) * 2, 0);
        sphere.addComponent(new RigidBodyComponent({ bodyType: "dynamic", mass: 1 }));
        sphere.addComponent(new SphereColliderComponent({ radius: 0.5 }));
        scaffold.addEntity(sphere);
      }

      const physics = (scaffold.scene as any).physicsSystem;

      // Simulate until objects settle
      scaffold.runFrames(300, 17); // 5 seconds

      // ✨ OPTIMIZATION 2: Force sleep on slow bodies
      const before = physics.getPerformanceStats();
      console.log(`Before sleepSlowBodies: ${before.activeBodies} active bodies`);

      physics.sleepSlowBodies(0.05); // Sleep bodies slower than 0.05 m/s

      const after = physics.getPerformanceStats();
      console.log(`After sleepSlowBodies: ${after.activeBodies} active bodies`);

      expect(after.activeBodies).toBeLessThan(before.activeBodies);
    } finally {
      scaffold.dispose();
    }
  });

  /**
   * Example 3: Distance-based culling (Physics LOD)
   * Useful for: Open-world games where you only simulate near the camera
   */
  it("should optimize by culling distant bodies", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
    });

    try {
      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
      scaffold.addEntity(gravity);

      const ground = new Entity("ground");
      ground.transform.setPosition(0, -5, 0);
      ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      ground.addComponent(new BoxColliderComponent({ halfExtents: { x: 500, y: 1, z: 500 } }));
      scaffold.addEntity(ground);

      // Create sphere cloud spread across large area
      for (let i = 0; i < 150; i++) {
        const sphere = new Entity(`sphere_${i}`);
        const angle = (i / 150) * Math.PI * 2;
        const distance = 20 + (i % 5) * 30; // Spread from 20m to 140m away
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        sphere.transform.setPosition(x, 20, z);
        sphere.addComponent(new RigidBodyComponent({ bodyType: "dynamic", mass: 0.5 }));
        sphere.addComponent(new SphereColliderComponent({ radius: 0.4 }));
        scaffold.addEntity(sphere);
      }

      const physics = (scaffold.scene as any).physicsSystem;

      // Simulate a bit
      scaffold.runFrames(60, 17);

      // ✨ OPTIMIZATION 3: Cull bodies outside a range
      const cameraPos = { x: 0, y: 10, z: 0 };
      console.log(`Culling with range 50m around camera at ${JSON.stringify(cameraPos)}`);

      const cullResult = physics.cullBodiesByDistance(cameraPos, 50);
      console.log(`Active bodies: ${cullResult.activeCount}, Culled: ${cullResult.culledCount}`);

      // Bodies within 50m stay active, others are slept
      expect(cullResult.activeCount).toBeGreaterThan(0);
      expect(cullResult.culledCount).toBeGreaterThan(0);
    } finally {
      scaffold.dispose();
    }
  });

  /**
   * Example 4: Optimizing stacked structures
   * Demonstrates best practices for high-performance stacks
   */
  it("should optimize stacks with combined techniques", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
    });

    try {
      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
      scaffold.addEntity(gravity);

      const ground = new Entity("ground");
      ground.transform.setPosition(0, 0, 0);
      ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      ground.addComponent(
        new BoxColliderComponent({
          halfExtents: { x: 50, y: 0.5, z: 50 },
          friction: 0.8,      // High friction = settle faster
          restitution: 0.05,  // Low bounce = fewer iterations
        })
      );
      scaffold.addEntity(ground);

      const physics = (scaffold.scene as any).physicsSystem;

      // ✨ TECHNIQUE 1: Reduce solver iterations for stacks
      physics.setSolverIterations(2);

      // ✨ TECHNIQUE 2: Build stack with static base + dynamic top
      const gridSize = 10;
      const staticLayers = 6; // Bottom 6 layers = static

      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize - y; x++) {
          for (let z = 0; z < gridSize - y; z++) {
            const box = new Entity(`box_${y}_${x}_${z}`);
            const posX = x * 1.1 - (gridSize * 1.1) / 2;
            const posY = y * 1.1 + 1;
            const posZ = z * 1.1 - (gridSize * 1.1) / 2;
            box.transform.setPosition(posX, posY, posZ);

            const isStatic = y < staticLayers;
            box.addComponent(
              new RigidBodyComponent({
                bodyType: isStatic ? "static" : "dynamic",
                mass: isStatic ? 0 : 1,
              })
            );
            box.addComponent(
              new BoxColliderComponent({
                halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
                friction: 0.8,
                restitution: 0.05,
              })
            );
            scaffold.addEntity(box);
          }
        }
      }

      // Run and measure
      scaffold.runFrames(180, 17);

      // Verify optimization worked
      const stats = physics.getPerformanceStats();
      expect(stats.solverIterations).toBe(2);
      console.log(`Stack optimization complete:`, stats);
    } finally {
      scaffold.dispose();
    }
  });

  /**
   * Example 4: Profile-based optimization (NEW API)
   * Shows how to apply complete performance profiles atomically
   * Useful for: Dynamic adaptation based on scene load
   */
  it("should apply performance profiles atomically", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
    });

    try {
      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
      scaffold.addEntity(gravity);

      // Create ground
      const ground = new Entity("ground");
      ground.transform.setPosition(0, -5, 0);
      ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      ground.addComponent(new BoxColliderComponent({ halfExtents: { x: 50, y: 1, z: 50 } }));
      scaffold.addEntity(ground);

      // Create some dynamic bodies
      const rng = seededRandom(42);
      for (let i = 0; i < 100; i++) {
        const sphere = new Entity(`sphere_${i}`);
        sphere.transform.setPosition(
          (rng() - 0.5) * 30,
          5 + rng() * 20,
          (rng() - 0.5) * 30
        );
        sphere.addComponent(new RigidBodyComponent({ bodyType: "dynamic", mass: 0.5 }));
        sphere.addComponent(new SphereColliderComponent({ radius: 0.4 }));
        scaffold.addEntity(sphere);
      }

      // Get reference to physics system
      const physics = (scaffold.scene as any).physicsSystem;

      // ✨ NEW: Check available profiles
      const availableProfiles = physics.getAvailableProfiles();
      expect(availableProfiles.length).toBe(6); // STABLE, BALANCED, PERFORMANCE, STACKED, EXTREME, OPEN_WORLD
      console.log(`Available profiles: ${availableProfiles.map((p: IPhysicsPerformanceProfile) => p.name).join(", ")}`);

      // ✨ NEW: Apply STABLE profile (highest quality)
      const stableProfile = availableProfiles.find((p: IPhysicsPerformanceProfile) => p.name === "Stable");
      expect(stableProfile).toBeDefined();
      physics.applyPerformanceProfile(stableProfile!);
      
      let currentProfile = physics.getCurrentProfile();
      expect(currentProfile).toBe(stableProfile);
      expect(physics.getSolverIterations()).toBe(4); // Stable = 4 iterations
      console.log(`Applied profile: ${currentProfile.name}`);

      scaffold.runFrames(60, 17);

      // ✨ NEW: Switch to PERFORMANCE profile (lower quality, higher speed)
      const perfProfile = availableProfiles.find((p: IPhysicsPerformanceProfile) => p.name === "Performance");
      expect(perfProfile).toBeDefined();
      physics.applyPerformanceProfile(perfProfile!);
      
      currentProfile = physics.getCurrentProfile();
      expect(currentProfile).toBe(perfProfile);
      expect(physics.getSolverIterations()).toBe(2); // Performance = 2 iterations
      console.log(`Switched to profile: ${currentProfile.name}`);

      scaffold.runFrames(120, 17);

      // ✨ NEW: Check final stats
      const stats = physics.getPerformanceStats();
      expect(stats.solverIterations).toBe(2); // Should match current profile
      console.log(`Final stats with Performance profile:`, stats);
    } finally {
      scaffold.dispose();
    }
  });
});

function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}
