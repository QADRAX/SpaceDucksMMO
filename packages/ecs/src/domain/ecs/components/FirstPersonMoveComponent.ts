import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";
import { getCurrentEcsWorld } from "../core/EcsWorldContext";
import { getInputServices } from "../core/InputContext";

export class FirstPersonMoveComponent extends Component {
  readonly type = "firstPersonMove";
  readonly metadata: ComponentMetadata = {
    type: "firstPersonMove",
    label: "First Person Movement",
    description: "Enables first-person movement controls for an entity with a camera view. Supports walking, sprinting, and optional fly mode.",
    category: "Movement & Controls",
    icon: "Gamepad2",
    unique: true,
    requires: ["cameraView"],
    conflicts: [],
    inspector: {
      fields: [
        {
          key: "moveSpeed",
          label: "Move Speed",
          description: "The base movement speed in units per second.",
          type: "number",
          min: 0,
          step: 0.1,
          get: (c: FirstPersonMoveComponent) => c.moveSpeed,
          set: (c, v) => {
            c.moveSpeed = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "sprintMultiplier",
          label: "Sprint Multiplier",
          description: "Multiplier applied to movement speed when sprinting.",
          type: "number",
          min: 1,
          step: 0.1,
          get: (c: FirstPersonMoveComponent) => c.sprintMultiplier,
          set: (c, v) => {
            c.sprintMultiplier = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "flyMode",
          label: "Fly Mode",
          description: "When enabled, allows vertical movement with space and control keys.",
          type: "boolean",
          get: (c: FirstPersonMoveComponent) => c.flyMode,
          set: (c, v) => {
            c.flyMode = Boolean(v);
            c.notifyChanged();
          },
        },
      ],
    },
  };

  moveSpeed = 5;
  sprintMultiplier = 2;
  flyMode = false;

  constructor(params?: any) {
    super();
    if (params) {
      if (params.moveSpeed !== undefined)
        this.moveSpeed = Number(params.moveSpeed);
      if (params.sprintMultiplier !== undefined)
        this.sprintMultiplier = Number(params.sprintMultiplier);
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

    // All keys are now normalized: 'w', 'a', 's', 'd', 'space', 'c', 'shift'
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

    const secs = dt / 1000;
    let speed = this.moveSpeed * (shift ? this.sprintMultiplier : 1);

    if (this.flyMode) {
      if (upKey) mv.y += 1;
      if (downKey) mv.y -= 1;
    }

    const len = Math.sqrt(mv.x * mv.x + mv.y * mv.y + mv.z * mv.z);
    if (len <= 0) return;
    mv.x /= len;
    mv.y /= len;
    mv.z /= len;

    const forward = self.transform.getForward();
    const right = self.transform.getRight();
    // For fly mode, vertical movement should use world Y (strict up/down),
    // so use a constant worldUp vector. This ensures Space/C move vertically
    // regardless of camera roll/pitch. When not in fly mode we keep y=0 on
    // the forward vector to stay grounded.
    const worldUp = { x: 0, y: 1, z: 0 };

    if (!this.flyMode) {
      forward.y = 0;
      const flen =
        Math.sqrt(forward.x * forward.x + forward.z * forward.z) || 1;
      forward.x /= flen;
      forward.z /= flen;
    }

    const moveWorld = {
      x:
        forward.x * mv.z +
        right.x * mv.x +
        (this.flyMode ? worldUp.x * mv.y : 0),
      y:
        forward.y * mv.z +
        right.y * mv.x +
        (this.flyMode ? worldUp.y * mv.y : 0),
      z:
        forward.z * mv.z +
        right.z * mv.x +
        (this.flyMode ? worldUp.z * mv.y : 0),
    };

    const mlen =
      Math.sqrt(
        moveWorld.x * moveWorld.x +
          moveWorld.y * moveWorld.y +
          moveWorld.z * moveWorld.z
      ) || 1;
    moveWorld.x /= mlen;
    moveWorld.y /= mlen;
    moveWorld.z /= mlen;

    const delta = {
      x: moveWorld.x * speed * secs,
      y: moveWorld.y * speed * secs,
      z: moveWorld.z * speed * secs,
    };

    const cur = self.transform.worldPosition;
    self.transform.setPosition(
      cur.x + delta.x,
      cur.y + delta.y,
      cur.z + delta.z
    );
  }
}

export default FirstPersonMoveComponent;
