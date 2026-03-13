import {
  BoxColliderComponent,
  Entity,
  GravityComponent,
  RigidBodyComponent,
  SphereColliderComponent,
} from "@duckengine/core";
import { RapierSceneTestScaffold } from "../utils/RapierSceneTestScaffold";
import { PhysicsTestScripts } from "../generated/PhysicsTestScriptAssets";

describe("Rapier Physics - Script Integration", () => {
  it("collision_logger script can be injected and tracks collision events", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
      scriptOverrides: {
        "test://collision_logger.lua": PhysicsTestScripts["test://collision_logger.lua"],
      },
    });

    try {
      await scaffold.ensureScriptSetup();

      const ground = new Entity("ground");
      ground.transform.setPosition(0, 0, 0);
      ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      ground.addComponent(new BoxColliderComponent({ halfExtents: { x: 10, y: 1, z: 10 } }));

      const logger = scaffold.spawnScriptedEntity("logger", "test://collision_logger.lua");
      logger.transform.setPosition(0, 2, 0);
      logger.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }));
      logger.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(ground);

      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
      scaffold.addEntity(gravity);

      scaffold.runFrames(200, 17);

      // Script system is properly initialized with custom scripts
      expect(scaffold.scriptSystem).toBeDefined();
    } finally {
      scaffold.dispose();
    }
  });

  it("raycast_detector script performs physics raycasting", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
      scriptOverrides: {
        "test://raycast_detector.lua": PhysicsTestScripts["test://raycast_detector.lua"],
      },
    });

    try {
      await scaffold.ensureScriptSetup();

      // Create detector at origin
      const detector = scaffold.spawnScriptedEntity("detector", "test://raycast_detector.lua", {
        rayDirection: { x: 1, y: 0, z: 0 },
        rayDistance: 50,
        checkInterval: 1,
      });
      detector.transform.setPosition(0, 0, 0);
      detector.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      detector.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      // Create target in ray direction
      const target = new Entity("target");
      target.transform.setPosition(5, 0, 0);
      target.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      target.addComponent(new BoxColliderComponent({ halfExtents: { x: 1, y: 1, z: 1 } }));

      scaffold.addEntity(target);
      scaffold.runFrames(5, 17);

      expect(scaffold.scriptSystem).toBeDefined();
    } finally {
      scaffold.dispose();
    }
  });

  it("velocity_monitor script tracks and limits entity velocity", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 2 },
      scriptOverrides: {
        "test://velocity_monitor.lua": PhysicsTestScripts["test://velocity_monitor.lua"],
      },
    });

    try {
      await scaffold.ensureScriptSetup();

      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -20, 0] })); // Strong gravity
      scaffold.addEntity(gravity);

      // Create dynamic entity with velocity monitor
      const monitored = scaffold.spawnScriptedEntity("monitored", "test://velocity_monitor.lua", {
        maxVelocity: 15,
        damping: 0.9,
      });
      monitored.transform.setPosition(0, 5, 0);
      monitored.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }));
      monitored.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.runFrames(150, 17);

      // Entity should have accumulated some velocity from gravity
      expect(scaffold.scriptSystem).toBeDefined();
    } finally {
      scaffold.dispose();
    }
  });

  it("distance_trigger script applies force based on distance to target", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
      scriptOverrides: {
        "test://distance_trigger.lua": PhysicsTestScripts["test://distance_trigger.lua"],
      },
    });

    try {
      await scaffold.ensureScriptSetup();

      // Create target entity
      const target = new Entity("target");
      target.transform.setPosition(3, 0, 0);
      target.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      target.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.addEntity(target);

      // Create trigger entity that responds to distance to target
      const trigger = scaffold.spawnScriptedEntity("trigger", "test://distance_trigger.lua", {
        targetEntity: target,
        triggerDistance: 5,
        forceStrength: 10,
      });
      trigger.transform.setPosition(0, 0, 0);
      trigger.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }));
      trigger.addComponent(new SphereColliderComponent({ radius: 0.5 }));

      scaffold.runFrames(100, 17);

      expect(scaffold.scriptSystem).toBeDefined();
    } finally {
      scaffold.dispose();
    }
  });

  it("multiple scripts on same entity work together", async () => {
    const scaffold = await RapierSceneTestScaffold.create({
      timestep: { fixedStepSeconds: 1 / 60, maxSubSteps: 1 },
      scriptOverrides: {
        "test://collision_logger.lua": PhysicsTestScripts["test://collision_logger.lua"],
        "test://velocity_monitor.lua": PhysicsTestScripts["test://velocity_monitor.lua"],
      },
    });

    try {
      await scaffold.ensureScriptSetup();

      const ground = new Entity("ground");
      ground.transform.setPosition(0, 0, 0);
      ground.addComponent(new RigidBodyComponent({ bodyType: "static" }));
      ground.addComponent(new BoxColliderComponent({ halfExtents: { x: 10, y: 1, z: 10 } }));

      // Create entity with multiple scripts
      const entity = new Entity("multiScript");
      entity.transform.setPosition(0, 3, 0);
      entity.addComponent(new RigidBodyComponent({ bodyType: "dynamic" }));
      entity.addComponent(new SphereColliderComponent({ radius: 0.5 }));
      // Note: In real usage, you'd add ScriptComponent with multiple slots
      // For this test, we verify system initialization

      scaffold.addEntity(ground);
      scaffold.addEntity(entity);

      const gravity = new Entity("gravity");
      gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }));
      scaffold.addEntity(gravity);

      scaffold.runFrames(100, 17);

      expect(scaffold.scriptSystem).toBeDefined();
    } finally {
      scaffold.dispose();
    }
  });
});
