import { BaseScene } from "@duckengine/rendering-three";
import type { IRenderingEngine } from "@duckengine/rendering-three";
import type { SettingsService } from "@client/application/SettingsService";
import SceneId from "@client/domain/scene/SceneId";

import {
  Entity,
  AmbientLightComponent,
  PlaneGeometryComponent,
  BoxGeometryComponent,
  SphereGeometryComponent,
  CylinderGeometryComponent,
  StandardMaterialComponent,
  CameraViewComponent,
  MouseLookComponent,
  PointLightComponent,
  RigidBodyComponent,
  GravityComponent,
  BoxColliderComponent,
  CapsuleColliderComponent,
  SphereColliderComponent,
  quatFromEulerYXZ,
  applyQuatToVec,
  getInputServices,
} from "@duckengine/rendering-three";

export class SoccerFpsScene extends BaseScene {
  readonly id = SceneId.SoccerFps;

  private playerId = "player";
  private playerColliderId = "player-collider";
  private cameraId = "player-camera";

  private ballId = "ball";
  private goalLeftSensorId = "goal-left-sensor";
  private goalRightSensorId = "goal-right-sensor";

  private groundedContacts = new Set<string>();
  private jumpRequested = false;

  private scoreLeft = 0;
  private scoreRight = 0;
  private lastScoreLogMs = 0;

  private readonly respawnY = -20;
  private lastRespawnMs = 0;

  private unsubGoalLeft?: () => void;
  private unsubGoalRight?: () => void;
  private unsubGroundEnter?: () => void;
  private unsubGroundExit?: () => void;

  constructor(settingsService: SettingsService) {
    super(settingsService);
  }

  setup(engine: IRenderingEngine, renderScene: any): void {
    super.setup(engine, renderScene);

    // Opt-in gravity for this scene.
    const gravity = new Entity("world-gravity");
    gravity.addComponent(new GravityComponent({ gravity: [0, -9.81, 0] }) as any);
    this.addEntity(gravity);

    // Lights.
    const ambient = new Entity("light-ambient").addComponent(
      new AmbientLightComponent({ color: 0xffffff, intensity: 0.25 })
    );
    this.addEntity(ambient);

    // Stadium lights (replace directional): point lights around the stands.
    // These are placed outside the play area and elevated to mimic floodlights.
    const addStadiumLights = () => {
      const poleMat = new StandardMaterialComponent({
        color: "#9ca3af",
        metalness: 0.1,
        roughness: 0.7,
      }) as any;

      const lightColor = "#ffffff";
      const intensity = 2.2;
      const distance = 35;
      const decay = 2;

      const poleHeight = 8;
      const poleRadius = 0.12;

      const mkLightPole = (id: string, x: number, z: number) => {
        const pole = new Entity(id + "-pole");
        pole.addComponent(
          new CylinderGeometryComponent({
            radiusTop: poleRadius,
            radiusBottom: poleRadius,
            height: poleHeight,
            radialSegments: 10,
          }) as any
        );
        pole.addComponent(poleMat);
        pole.transform.setPosition(x, poleHeight / 2, z);
        this.addEntity(pole);

        const light = new Entity(id);
        light.addComponent(
          new PointLightComponent({
            color: lightColor,
            intensity,
            distance,
            decay,
          }) as any
        );
        light.transform.setPosition(x, poleHeight, z);
        this.addEntity(light);

        // Small emissive "lamp" mesh for visual feedback.
        const lamp = new Entity(id + "-lamp");
        lamp.addComponent(new SphereGeometryComponent({ radius: 0.18, widthSegments: 12, heightSegments: 10 }) as any);
        lamp.addComponent(
          new StandardMaterialComponent({ emissive: "#ffffff", emissiveIntensity: 1.5, color: "#111827", metalness: 0, roughness: 1 }) as any
        );
        lamp.transform.setPosition(x, poleHeight, z);
        this.addEntity(lamp);
      };

      // Poles around the field (field is 50x30). Place them slightly outside walls.
      const zOuter = 19;
      const xOuter = 29;
      const xs = [-20, -10, 0, 10, 20];
      for (const x of xs) {
        mkLightPole(`stadium-light-n-${x}`, x, -zOuter);
        mkLightPole(`stadium-light-s-${x}`, x, zOuter);
      }
      mkLightPole("stadium-light-w", -xOuter, 0);
      mkLightPole("stadium-light-e", xOuter, 0);
    };

    addStadiumLights();

    // Field: visual plane is rotated; physics slab must NOT be rotated.
    // If we rotate the entity for rendering, the collider rotates too and becomes a vertical wall.
    const fieldVisual = new Entity("field");
    fieldVisual.addComponent(new PlaneGeometryComponent({ width: 50, height: 30 }) as any);
    fieldVisual.addComponent(
      new StandardMaterialComponent({ color: "#2b8a3e", roughness: 1.0, metalness: 0.0 }) as any
    );
    fieldVisual.transform.setRotation(-Math.PI / 2, 0, 0);
    fieldVisual.transform.setPosition(0, 0, 0);
    this.addEntity(fieldVisual);

    const fieldCollider = new Entity("field-collider");
    // Center slightly below y=0 so the top surface sits at y=0.
    fieldCollider.transform.setPosition(0, -0.25, 0);
    fieldCollider.addComponent(new RigidBodyComponent({ bodyType: "static" }) as any);
    fieldCollider.addComponent(
      new BoxColliderComponent({
        halfExtents: { x: 25, y: 0.25, z: 15 },
        friction: 1.0,
        restitution: 0.0,
        isSensor: false,
      }) as any
    );
    this.addEntity(fieldCollider);

    // Simple side walls to keep ball in play.
    const wallMat = new StandardMaterialComponent({ color: "#1f2937", roughness: 1.0, metalness: 0.0 }) as any;

    const makeWall = (id: string, x: number, z: number, w: number, h: number, d: number) => {
      const e = new Entity(id);
      e.addComponent(new BoxGeometryComponent({ width: w, height: h, depth: d }) as any);
      e.addComponent(wallMat);
      e.transform.setPosition(x, h / 2, z);
      e.addComponent(new RigidBodyComponent({ bodyType: "static" }) as any);
      e.addComponent(
        new BoxColliderComponent({ halfExtents: { x: w / 2, y: h / 2, z: d / 2 }, friction: 1.0 }) as any
      );
      this.addEntity(e);
    };

    // Long walls along the sides (z).
    makeWall("wall-north", 0, -15.5, 52, 2, 1);
    makeWall("wall-south", 0, 15.5, 52, 2, 1);

    // Back walls behind goals (x).
    makeWall("wall-west", -25.5, 0, 1, 2, 32);
    makeWall("wall-east", 25.5, 0, 1, 2, 32);

    // Player (dynamic rigidbody) with capsule collider on a child.
    const player = new Entity(this.playerId);
    // Put the rigidbody origin at the capsule center to keep contacts stable.
    // Capsule center height should be (halfHeight + radius).
    player.transform.setPosition(0, 0.9, 8);
    player.addComponent(
      new RigidBodyComponent({
        bodyType: "dynamic",
        // We handle horizontal braking ourselves; keep damping modest.
        linearDamping: 0.5,
        // High angular damping to reduce unintended tumbling from contacts.
        angularDamping: 20.0,
      }) as any
    );
    this.addEntity(player);

    const playerCollider = new Entity(this.playerColliderId);
    // Collider centered on the rigidbody.
    playerCollider.transform.setPosition(0, 0, 0);
    playerCollider.addComponent(
      new CapsuleColliderComponent({
        radius: 0.35,
        halfHeight: 0.55,
        friction: 2.0,
        restitution: 0.0,
        isSensor: false,
      }) as any
    );
    player.addChild(playerCollider);
    this.addEntity(playerCollider);

    // Ball.
    const ball = new Entity(this.ballId);
    ball.transform.setPosition(0, 1.0, 0);
    ball.addComponent(new SphereGeometryComponent({ radius: 0.35, widthSegments: 24, heightSegments: 16 }) as any);
    ball.addComponent(
      // Textured ball (reuse an existing texture set from the Sandbox).
      new StandardMaterialComponent({
        color: "#ffffff",
        metalness: 0,
        roughness: 1,
        texture: "materials/concrete-muddy/basecolor",
        normalMap: "materials/concrete-muddy/normal",
        aoMap: "materials/concrete-muddy/ambientOcclusion",
        roughnessMap: "materials/concrete-muddy/roughness",
      }) as any
    );
    ball.addComponent(new RigidBodyComponent({ bodyType: "dynamic", linearDamping: 0.3, angularDamping: 0.2 }) as any);
    ball.addComponent(new SphereColliderComponent({ radius: 0.35, friction: 0.6, restitution: 0.4 }) as any);
    this.addEntity(ball);

    // Goals (sensor volumes).
    const makeGoalSensor = (id: string, x: number, label: "LEFT" | "RIGHT") => {
      const e = new Entity(id);
      e.transform.setPosition(x, 1.0, 0);
      e.addComponent(new BoxGeometryComponent({ width: 2.5, height: 2.0, depth: 8.0 }) as any);
      e.addComponent(
        new StandardMaterialComponent({
          color: label === "LEFT" ? "#60a5fa" : "#f87171",
          roughness: 1.0,
          metalness: 0.0,
          transparent: true,
          opacity: 0.15,
        }) as any
      );
      e.addComponent(new RigidBodyComponent({ bodyType: "static" }) as any);
      e.addComponent(
        new BoxColliderComponent({ halfExtents: { x: 1.25, y: 1.0, z: 4.0 }, isSensor: true }) as any
      );
      this.addEntity(e);
    };

    makeGoalSensor(this.goalLeftSensorId, -23.5, "LEFT");
    makeGoalSensor(this.goalRightSensorId, 23.5, "RIGHT");

    // White goal frames (posts + crossbar) on each side.
    const addGoalFrame = (idPrefix: string, x: number) => {
      const whitePostMat = new StandardMaterialComponent({
        color: "#ffffff",
        metalness: 0,
        roughness: 0.35,
      }) as any;

      const postRadius = 0.08;
      const postHeight = 2.0;
      const goalHalfWidth = 4.0;
      const yMid = postHeight / 2;

      const mkUpright = (id: string, z: number) => {
        const e = new Entity(id);
        e.addComponent(
          new CylinderGeometryComponent({ radiusTop: postRadius, radiusBottom: postRadius, height: postHeight, radialSegments: 14 }) as any
        );
        e.addComponent(whitePostMat);
        e.transform.setPosition(x, yMid, z);
        this.addEntity(e);
      };

      const crossbar = new Entity(idPrefix + "-crossbar");
      crossbar.addComponent(
        new CylinderGeometryComponent({ radiusTop: postRadius, radiusBottom: postRadius, height: goalHalfWidth * 2, radialSegments: 14 }) as any
      );
      crossbar.addComponent(whitePostMat);
      // Cylinder is along Y by default; rotate to span Z.
      crossbar.transform.setRotation(Math.PI / 2, 0, 0);
      crossbar.transform.setPosition(x, postHeight, 0);
      this.addEntity(crossbar);

      mkUpright(idPrefix + "-post-front", -goalHalfWidth);
      mkUpright(idPrefix + "-post-back", goalHalfWidth);
    };

    addGoalFrame("goal-left", -23.5);
    addGoalFrame("goal-right", 23.5);

    // Camera (visual only) with mouse look.
    const camera = new Entity(this.cameraId);
    camera.addComponent(new CameraViewComponent({ fov: 70, near: 0.1, far: 2000 }) as any);
    camera.addComponent(new MouseLookComponent({}) as any);
    camera.transform.setPosition(0, 1.65, 10);
    this.addEntity(camera);
    this.setActiveCamera(this.cameraId);

    // Input: jump as edge-trigger.
    try {
      const input = getInputServices();
      input.keyboard.onKeyDown("space", () => {
        this.jumpRequested = true;
      });
    } catch {}

    // Grounding: consider the player grounded if its collider is touching ANY non-sensor collider.
    this.unsubGroundEnter = this.collisionEvents.onColliderEnter(this.playerColliderId, (ev) => {
      const otherId = ev.other;
      if (!otherId) return;
      const other = this.getEntity(otherId);
      if (!other) return;
      const otherCollider = other.getComponent<any>("boxCollider") || other.getComponent<any>("sphereCollider") || other.getComponent<any>("capsuleCollider") || other.getComponent<any>("cylinderCollider") || other.getComponent<any>("coneCollider") || other.getComponent<any>("terrainCollider");
      if (!otherCollider) return;
      if (otherCollider.isSensor) return;
      this.groundedContacts.add(otherId);
    });

    this.unsubGroundExit = this.collisionEvents.onColliderExit(this.playerColliderId, (ev) => {
      const otherId = ev.other;
      if (!otherId) return;
      this.groundedContacts.delete(otherId);
    });

    // Scoring: ball enters sensor.
    this.unsubGoalLeft = this.collisionEvents.onColliderEnter(this.goalLeftSensorId, (ev) => {
      if (ev.otherBody === this.ballId || ev.other === this.ballId) {
        this.scoreRight += 1;
        this.onGoalScored();
      }
    });

    this.unsubGoalRight = this.collisionEvents.onColliderEnter(this.goalRightSensorId, (ev) => {
      if (ev.otherBody === this.ballId || ev.other === this.ballId) {
        this.scoreLeft += 1;
        this.onGoalScored();
      }
    });

    console.log("[SoccerFpsScene] Ready. WASD=move, Space=jump, run into ball to kick.");
  }

  teardown(engine: IRenderingEngine, renderScene: any): void {
    try {
      this.unsubGoalLeft?.();
      this.unsubGoalRight?.();
      this.unsubGroundEnter?.();
      this.unsubGroundExit?.();
    } catch {}
    this.unsubGoalLeft = undefined;
    this.unsubGoalRight = undefined;
    this.unsubGroundEnter = undefined;
    this.unsubGroundExit = undefined;

    super.teardown(engine, renderScene);
  }

  update(dt: number): void {
    // 1) ECS components (mouse look, etc.)
    for (const ent of this.entities.values()) {
      ent.update(dt);
    }

    // 2) Gameplay -> physics impulses BEFORE stepping.
    this.updatePlayerControls(dt);

    // 3) Physics step.
    if (this.physicsSystem) {
      try {
        this.physicsSystem.update(dt);
      } catch {}
    }

    // 4) Camera follow AFTER physics write-back.
    this.updateCameraFollow();

    // 4.5) Failsafe: respawn if something falls out of the world.
    this.checkAndRespawnFallen();

    // 5) Render sync.
    if (this.renderSyncSystem) {
      this.renderSyncSystem.update(dt);
    }
  }

  private checkAndRespawnFallen(): void {
    const now = Date.now();
    if (now - this.lastRespawnMs < 500) return;

    const player = this.getEntity(this.playerId);
    const ball = this.getEntity(this.ballId);

    const py = player?.transform.worldPosition.y ?? 0;
    const by = ball?.transform.worldPosition.y ?? 0;

    if (py < this.respawnY || by < this.respawnY) {
      this.lastRespawnMs = now;
      this.resetBallAndPlayer();
    }
  }

  private updatePlayerControls(dtMs: number): void {
    if (!this.physicsSystem?.applyImpulse) return;

    const player = this.getEntity(this.playerId);
    if (!player) return;

    const cam = this.getEntity(this.cameraId);
    if (!cam) return;

    let forward = 0;
    let strafe = 0;
    let jump = false;

    try {
      const input = getInputServices();
      const kb = input.keyboard;
      forward += kb.isKeyPressed("w") ? 1 : 0;
      forward -= kb.isKeyPressed("s") ? 1 : 0;
      strafe += kb.isKeyPressed("d") ? 1 : 0;
      strafe -= kb.isKeyPressed("a") ? 1 : 0;

      jump = this.jumpRequested;
      this.jumpRequested = false;
    } catch {
      // no input services
      this.jumpRequested = false;
    }

    const dt = Math.max(0, dtMs) / 1000;
    if (dt <= 0) return;

    // Movement direction from camera yaw only (ignore pitch).
    const yaw = cam.transform.worldRotation.y;
    const qYaw = quatFromEulerYXZ({ x: 0, y: yaw, z: 0 });
    const fwd = applyQuatToVec({ x: 0, y: 0, z: -1 }, qYaw);
    const right = applyQuatToVec({ x: 1, y: 0, z: 0 }, qYaw);

    let dx = fwd.x * forward + right.x * strafe;
    let dz = fwd.z * forward + right.z * strafe;

    const len = Math.sqrt(dx * dx + dz * dz);

    // Target-velocity controller (smooth + framerate-friendly).
    const curVel = this.physicsSystem.getLinearVelocity?.(this.playerId) ?? { x: 0, y: 0, z: 0 };
    const moveSpeed = 6.5;
    const maxAccel = 28; // m/s^2
    const brakeDecel = 36; // m/s^2

    const clampDeltaV = (v: { x: number; y: number; z: number }, maxLen: number) => {
      const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      if (l <= 1e-6) return { x: 0, y: 0, z: 0 };
      if (l <= maxLen) return v;
      const s = maxLen / l;
      return { x: v.x * s, y: v.y * s, z: v.z * s };
    };

    if (len > 1e-6) {
      dx /= len;
      dz /= len;

      const desiredVel = { x: dx * moveSpeed, y: curVel.y, z: dz * moveSpeed };
      const velErr = { x: desiredVel.x - curVel.x, y: 0, z: desiredVel.z - curVel.z };
      const maxDeltaV = maxAccel * dt;
      const deltaV = clampDeltaV(velErr, maxDeltaV);
      this.physicsSystem.applyImpulse(this.playerId, deltaV);
    } else {
      // No input: brake horizontal velocity.
      const brakeTarget = { x: -curVel.x, y: 0, z: -curVel.z };
      const maxBrakeDeltaV = brakeDecel * dt;
      const brakeDeltaV = clampDeltaV(brakeTarget, maxBrakeDeltaV);
      this.physicsSystem.applyImpulse(this.playerId, brakeDeltaV);
    }

    // Jump when grounded.
    const grounded = this.groundedContacts.size > 0;
    if (jump && grounded) {
      this.physicsSystem.applyImpulse(this.playerId, { x: 0, y: 4.5, z: 0 });
    }

    // Ball kick: apply a small impulse if close and moving.
    if (len > 1e-6) {
      const ball = this.getEntity(this.ballId);
      if (ball) {
        const pp = player.transform.worldPosition;
        const bp = ball.transform.worldPosition;
        const rx = bp.x - pp.x;
        const rz = bp.z - pp.z;
        const dist2 = rx * rx + rz * rz;
        if (dist2 < 1.0 * 1.0) {
          this.physicsSystem.applyImpulse(this.ballId, { x: dx * 1.2, y: 0.2, z: dz * 1.2 });
        }
      }
    }
  }

  private updateCameraFollow(): void {
    const player = this.getEntity(this.playerId);
    const cam = this.getEntity(this.cameraId);
    if (!player || !cam) return;

    const p = player.transform.worldPosition;
    // Keep camera above player; rotation is handled by MouseLookComponent.
    cam.transform.setPosition(p.x, p.y + 0.6, p.z);
  }

  private onGoalScored(): void {
    const now = Date.now();
    if (now - this.lastScoreLogMs > 250) {
      this.lastScoreLogMs = now;
      console.log(`[SoccerFpsScene] GOAL! Left ${this.scoreLeft} - ${this.scoreRight} Right`);
    }
    this.resetBallAndPlayer();
  }

  private resetBallAndPlayer(): void {
    const ball = this.getEntity(this.ballId);
    const player = this.getEntity(this.playerId);

    if (ball) {
      try {
        this.physicsSystem?.removeEntity(this.ballId);
      } catch {}
      ball.transform.setPosition(0, 1.0, 0);
      try {
        this.physicsSystem?.addEntity(ball);
      } catch {}
    }

    if (player) {
      try {
        this.physicsSystem?.removeEntity(this.playerId);
      } catch {}
      player.transform.setPosition(0, 0.9, 8);
      try {
        this.physicsSystem?.addEntity(player);
      } catch {}
    }

    // Clear grounding state to avoid immediate jump.
    this.groundedContacts.clear();
    this.jumpRequested = false;
  }
}

export default SoccerFpsScene;
