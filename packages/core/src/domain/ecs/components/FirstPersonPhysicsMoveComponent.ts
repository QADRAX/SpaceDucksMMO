import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";
import { getCurrentEcsWorld } from "../core/EcsWorldContext";
import { getInputServices } from "../core/InputContext";
import { getPhysicsServices } from "../core/PhysicsContext";

function clampMagnitude(v: { x: number; y: number; z: number }, maxLen: number) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len <= 0) return { x: 0, y: 0, z: 0 };
  if (len <= maxLen) return v;
  const s = maxLen / len;
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/**
 * @deprecated Use ScriptComponent with 'builtin://first_person_physics_move.lua' instead.
 * Automatically migrated during snapshot deserialization.
 */
export class FirstPersonPhysicsMoveComponent extends Component {
  readonly type = "firstPersonPhysicsMove";
  readonly metadata: ComponentMetadata = {
    type: "firstPersonPhysicsMove",
    unique: true,
    requires: ["cameraView", "rigidBody"],
    conflicts: ["firstPersonMove"],
    inspector: {
      fields: [
        {
          key: "moveSpeed",
          label: "Move Speed",
          type: "number",
          min: 0,
          step: 0.1,
          get: (c: FirstPersonPhysicsMoveComponent) => c.moveSpeed,
          set: (c, v) => {
            c.moveSpeed = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "sprintMultiplier",
          label: "Sprint Multiplier",
          type: "number",
          min: 1,
          step: 0.1,
          get: (c: FirstPersonPhysicsMoveComponent) => c.sprintMultiplier,
          set: (c, v) => {
            c.sprintMultiplier = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "maxAcceleration",
          label: "Max Acceleration (m/s²)",
          type: "number",
          min: 0,
          step: 0.1,
          get: (c: FirstPersonPhysicsMoveComponent) => c.maxAcceleration,
          set: (c, v) => {
            c.maxAcceleration = Math.max(0, Number(v));
            c.notifyChanged();
          },
        },
        {
          key: "brakeDeceleration",
          label: "Brake Deceleration (m/s²)",
          type: "number",
          min: 0,
          step: 0.1,
          get: (c: FirstPersonPhysicsMoveComponent) => c.brakeDeceleration,
          set: (c, v) => {
            c.brakeDeceleration = Math.max(0, Number(v));
            c.notifyChanged();
          },
        },
        {
          key: "flyMode",
          label: "Fly Mode",
          type: "boolean",
          get: (c: FirstPersonPhysicsMoveComponent) => c.flyMode,
          set: (c, v) => {
            c.flyMode = Boolean(v);
            c.notifyChanged();
          },
        },
      ],
    },
  };

  moveSpeed = 6;
  sprintMultiplier = 1.75;

  /** Caps how fast velocity can change when input is held (in m/s²). */
  maxAcceleration = 30;
  /** How quickly to slow down when no input (in m/s²). */
  brakeDeceleration = 40;

  flyMode = false;

  constructor(params?: any) {
    super();
    if (params) {
      if (params.moveSpeed !== undefined) this.moveSpeed = Number(params.moveSpeed);
      if (params.sprintMultiplier !== undefined) this.sprintMultiplier = Number(params.sprintMultiplier);
      if (params.maxAcceleration !== undefined) this.maxAcceleration = Math.max(0, Number(params.maxAcceleration));
      if (params.brakeDeceleration !== undefined) this.brakeDeceleration = Math.max(0, Number(params.brakeDeceleration));
      if (params.flyMode !== undefined) this.flyMode = !!params.flyMode;
    }
  }

  update(dt: number): void {
    if (!this.enabled) return;
    const world = getCurrentEcsWorld();
    if (!world) return;
    const selfId = this.getEntityId();
    if (!selfId) return;
    const self = world.getEntity(selfId);
    if (!self) return;

    const input = getInputServices();
    const keyboard = input.keyboard;

    const forwardKey = keyboard.isKeyPressed("w");
    const backKey = keyboard.isKeyPressed("s");
    const leftKey = keyboard.isKeyPressed("a");
    const rightKey = keyboard.isKeyPressed("d");
    const upKey = keyboard.isKeyPressed("space");
    const downKey = keyboard.isKeyPressed("control");
    const shift = keyboard.isKeyPressed("shift");

    let mv = { x: 0, y: 0, z: 0 };
    if (forwardKey) mv.z += 1;
    if (backKey) mv.z -= 1;
    if (leftKey) mv.x -= 1;
    if (rightKey) mv.x += 1;
    if (this.flyMode) {
      if (upKey) mv.y += 1;
      if (downKey) mv.y -= 1;
    }

    const secs = Math.max(0, dt) / 1000;
    if (secs <= 0) return;

    const speed = this.moveSpeed * (shift ? this.sprintMultiplier : 1);

    const forward = self.transform.getForward();
    const right = self.transform.getRight();
    const worldUp = { x: 0, y: 1, z: 0 };

    if (!this.flyMode) {
      forward.y = 0;
      const flen = Math.sqrt(forward.x * forward.x + forward.z * forward.z) || 1;
      forward.x /= flen;
      forward.z /= flen;
    }

    const moveWorld = {
      x: forward.x * mv.z + right.x * mv.x + (this.flyMode ? worldUp.x * mv.y : 0),
      y: forward.y * mv.z + right.y * mv.x + (this.flyMode ? worldUp.y * mv.y : 0),
      z: forward.z * mv.z + right.z * mv.x + (this.flyMode ? worldUp.z * mv.y : 0),
    };

    const mlen = Math.sqrt(moveWorld.x * moveWorld.x + moveWorld.y * moveWorld.y + moveWorld.z * moveWorld.z);
    const physics = getPhysicsServices();
    const curVel = physics.getLinearVelocity(selfId) ?? { x: 0, y: 0, z: 0 };

    if (mlen > 1e-6) {
      moveWorld.x /= mlen;
      moveWorld.y /= mlen;
      moveWorld.z /= mlen;

      const desiredVel = {
        x: moveWorld.x * speed,
        y: this.flyMode ? moveWorld.y * speed : curVel.y,
        z: moveWorld.z * speed,
      };

      const velErr = {
        x: desiredVel.x - curVel.x,
        y: this.flyMode ? desiredVel.y - curVel.y : 0,
        z: desiredVel.z - curVel.z,
      };

      const maxDeltaV = this.maxAcceleration * secs;
      const deltaV = clampMagnitude(velErr, maxDeltaV);
      physics.applyImpulse(selfId, deltaV);
      return;
    }

    // No input: brake horizontal velocity.
    const brakeTarget = {
      x: -curVel.x,
      y: this.flyMode ? -curVel.y : 0,
      z: -curVel.z,
    };
    const maxBrakeDeltaV = this.brakeDeceleration * secs;
    const brakeDeltaV = clampMagnitude(brakeTarget, maxBrakeDeltaV);
    physics.applyImpulse(selfId, brakeDeltaV);
  }
}

export default FirstPersonPhysicsMoveComponent;
