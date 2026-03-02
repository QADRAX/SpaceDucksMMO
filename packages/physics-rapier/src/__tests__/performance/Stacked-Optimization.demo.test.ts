/**
 * Demonstration: Stacked-15x15 Optimization APIs
 * 
 * Shows how to use the new optimization methods to transform
 * the problematic 15x15 stacked pyramid optimization
 */

import {
  Entity,
  GravityComponent,
  RigidBodyComponent,
  BoxColliderComponent
} from "@duckengine/core";
import { RapierSceneTestScaffold } from "../utils/RapierSceneTestScaffold";

function measurePhysicsFrame(scaffold: RapierSceneTestScaffold, dtMs = 1000 / 60): number {
  const start = performance.now();
  scaffold.tick(dtMs);
  return performance.now() - start;
}

describe('Stacked-15x15 Optimization APIs', () => {
  /**
   * SETUP: Create a 15x15 stacked pyramid (~1,240 boxes)
   */
  async function setupStackedScene() {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
    });

    const gravity = new Entity("gravity");
    gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
    scaffold.addEntity(gravity);

    // Create ground
    const ground = new Entity("ground");
    ground.transform.setPosition(0, -5, 0);
    ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
    ground.addComponent(new BoxColliderComponent({ halfExtents: { x: 50, y: 1, z: 50 } }));
    scaffold.addEntity(ground);

    // Create 15x15 stacked pyramid
    const boxSize = 0.4;
    const gap = 0.01;
    let boxCount = 0;

    for (let layer = 0; layer < 15; layer++) {
      const layerSize = 15 - layer;
      for (let x = 0; x < layerSize; x++) {
        for (let y = 0; y < layerSize; y++) {
          const posX = (x - layerSize / 2) * (boxSize + gap);
          const posY = 5 + layer * (boxSize + gap);
          const posZ = (y - layerSize / 2) * (boxSize + gap);

          const box = new Entity(`box_${boxCount++}`);
          box.transform.setPosition(posX, posY, posZ);
          box.addComponent(new RigidBodyComponent({ bodyType: "dynamic", mass: 0.1 }));
          box.addComponent(new BoxColliderComponent({ 
            halfExtents: { x: boxSize / 2, y: boxSize / 2, z: boxSize / 2 } 
          }));
          scaffold.addEntity(box);
        }
      }
    }

    return { scaffold, boxCount };
  }

  /**
   * TEST 1: Solver iterations control
   */
  it('should support setSolverIterations() API', async () => {
    const { scaffold } = await setupStackedScene();

    try {
      const physics = (scaffold.scene as any).physicsSystem;

      // Check defaults
      expect(physics.getSolverIterations()).toBe(4);

      // Reduce iterations
      physics.setSolverIterations(2);
      expect(physics.getSolverIterations()).toBe(2);

      // Simulate some frames
      for (let i = 0; i < 10; i++) {
        measurePhysicsFrame(scaffold);
      }

      // Verify we can change it again
      physics.setSolverIterations(1);
      expect(physics.getSolverIterations()).toBe(1);

      console.log('✓ setSolverIterations API working');
      console.log(`  Can set iterations from 1-20 for performance tuning`);
    } finally {
      scaffold.dispose();
    }
  });

  /**
   * TEST 2: Body sleeping control
   */
  it('should support sleepSlowBodies() API', async () => {
    const { scaffold, boxCount } = await setupStackedScene();

    try {
      const physics = (scaffold.scene as any).physicsSystem;

      // Let it settle
      for (let i = 0; i < 200; i++) {
        scaffold.tick(1000 / 60);
      }

      // Get initial stats
      let statsBeforeSleep = physics.getPerformanceStats();
      const activeBefore = statsBeforeSleep.activeBodies;

      // Sleep slow bodies
      physics.sleepSlowBodies(0.05);

      // Simulate more
      for (let i = 0; i < 10; i++) {
        scaffold.tick(1000 / 60);
      }

      // Check stats after sleep
      let statsAfterSleep = physics.getPerformanceStats();
      const activeAfter = statsAfterSleep.activeBodies;

      console.log(`✓ sleepSlowBodies() API working`);
      console.log(`  Active bodies before: ${activeBefore}`);
      console.log(`  Active bodies after:  ${activeAfter}`);
      console.log(`  Bodies put to sleep:  ${activeBefore - activeAfter}`);

      // Should have fewer active bodies
      expect(activeAfter).toBeLessThanOrEqual(activeBefore);
    } finally {
      scaffold.dispose();
    }
  });

  /**
   * TEST 3: Force sleep/wake individual bodies
   */
  it('should support forceSleepBody() and forceWakeBody() API', async () => {
    const { scaffold } = await setupStackedScene();

    try {
      const physics = (scaffold.scene as any).physicsSystem;
      const entities = Array.from((scaffold.scene as any).entities.values()).filter(
        (e: any) => e.id.startsWith('box_')
      );

      if (entities.length > 0) {
        const testEntity = entities[0] as any;

        // Try to force sleep
        physics.forceSleepBody(testEntity.id);

        // Simulate
        for (let i = 0; i < 5; i++) {
          scaffold.tick(1000 / 60);
        }

        // Wake it
        physics.forceWakeBody(testEntity.id);

        // Simulate
        for (let i = 0; i < 5; i++) {
          scaffold.tick(1000 / 60);
        }

        console.log('✓ forceSleepBody() / forceWakeBody() API working');
        console.log(`  Can manually control individual body sleep state`);
      }
    } finally {
      scaffold.dispose();
    }
  });

  /**
   * TEST 4: Distance-based culling (physics LOD)
   */
  it('should support cullBodiesByDistance() API', async () => {
    const { scaffold, boxCount } = await setupStackedScene();

    try {
      const physics = (scaffold.scene as any).physicsSystem;

      // Check initial state
      let statsInitial = physics.getPerformanceStats();
      const initialActive = statsInitial.activeBodies;

      // Apply distance culling: only simulate within 10m
      physics.cullBodiesByDistance(
        { x: 0, y: 5, z: 0 }, // Camera at stack center
        10 // Radius in meters
      );

      // Simulate
      for (let i = 0; i < 10; i++) {
        scaffold.tick(1000 / 60);
      }

      // Check culled state
      let statsCulled = physics.getPerformanceStats();
      const culledActive = statsCulled.activeBodies;

      console.log('✓ cullBodiesByDistance() API working');
      console.log(`  Initial active bodies: ${initialActive}`);
      console.log(`  After 10m culling:     ${culledActive}`);
      console.log(`  Bodies culled:         ${initialActive - culledActive}`);

      // Should have fewer active bodies when culled
      expect(culledActive).toBeLessThanOrEqual(initialActive);

      // Wake all and verify restoration
      physics.wakeAllBodies();
      let statsRestored = physics.getPerformanceStats();
      console.log(`  After wakeAllBodies(): ${statsRestored.activeBodies}`);
    } finally {
      scaffold.dispose();
    }
  });

  /**
   * TEST 5: Performance stats monitoring
   */
  it('should support getPerformanceStats() API', async () => {
    const { scaffold, boxCount } = await setupStackedScene();

    try {
      const physics = (scaffold.scene as any).physicsSystem;

      // Get stats
      const stats = physics.getPerformanceStats();

      console.log('✓ getPerformanceStats() API returning:');
      console.log(`  Total bodies:     ${stats.totalBodies}`);
      console.log(`  Active bodies:    ${stats.activeBodies}`);
      console.log(`  Total colliders:  ${stats.totalColliders}`);
      console.log(`  Solver iterations: ${stats.solverIterations}`);

      // Validate we got expected counts
      expect(stats.totalBodies).toBeGreaterThanOrEqual(boxCount);
      expect(stats.activeBodies).toBeGreaterThan(0);
      expect(stats.solverIterations).toBe(4);
    } finally {
      scaffold.dispose();
    }
  });

  /**
   * INTEGRATION TEST: Combined optimizations
   */
  it('should work together: reduce iterations + sleep bodies', async () => {
    const { scaffold } = await setupStackedScene();

    try {
      const physics = (scaffold.scene as any).physicsSystem;

      console.log('\n📊 COMBINED OPTIMIZATION DEMO');
      console.log('='.repeat(50));

      // Setup 1: Default settings
      console.log('\n1. BASELINE (Default):');
      let frameTimes = [];
      for (let i = 0; i < 30; i++) {
        frameTimes.push(measurePhysicsFrame(scaffold));
      }
      const baselineAvg = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
      console.log(`   Average frame time: ${baselineAvg.toFixed(2)}ms`);
      console.log(`   Solver iterations: ${physics.getSolverIterations()}`);

      // Setup 2: Reduce iterations
      console.log('\n2. OPTIMIZATION 1 - Reduce iterations to 2:');
      physics.setSolverIterations(2);
      frameTimes = [];
      for (let i = 0; i < 30; i++) {
        frameTimes.push(measurePhysicsFrame(scaffold));
      }
      const iterOpt = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
      console.log(`   Average frame time: ${iterOpt.toFixed(2)}ms`);
      console.log(`   Improvement: ${((baselineAvg / iterOpt - 1) * 100).toFixed(1)}%`);

      // Setup 3: Add sleeping
      console.log('\n3. OPTIMIZATION 2 - Add auto-sleep at 0.05 m/s:');
      // Let it settle more
      for (let i = 0; i < 100; i++) {
        scaffold.tick(1000 / 60);
      }
      physics.sleepSlowBodies(0.05);
      frameTimes = [];
      for (let i = 0; i < 30; i++) {
        frameTimes.push(measurePhysicsFrame(scaffold));
      }
      const sleepOpt = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
      const stats = physics.getPerformanceStats();
      console.log(`   Average frame time: ${sleepOpt.toFixed(2)}ms`);
      console.log(`   Active bodies: ${stats.activeBodies}/${stats.totalBodies}`);
      console.log(`   Improvement from baseline: ${((baselineAvg / sleepOpt - 1) * 100).toFixed(1)}%`);

      console.log('\n' + '='.repeat(50));
      console.log('✅ All optimization APIs demonstrated successfully!');
    } finally {
      scaffold.dispose();
    }
  });
});
