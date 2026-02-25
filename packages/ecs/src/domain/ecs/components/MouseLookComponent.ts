import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";
import { getCurrentEcsWorld } from "../core/EcsWorldContext";
import { getInputServices } from "../core/InputContext";

/**
 * @deprecated Use ScriptComponent with 'builtin://mouse_look.lua' instead.
 * Automatically migrated during snapshot deserialization.
 */
export class MouseLookComponent extends Component {
  readonly type = "mouseLook";
  readonly metadata: ComponentMetadata = {
    type: "mouseLook",
    label: "Mouse Look",
    description: "Controls camera rotation based on mouse movement, enabling first-person camera controls.",
    category: "Movement & Controls",
    icon: "MousePointer",
    unique: true,
    requires: ["cameraView"],
    conflicts: [],
    inspector: {
      fields: [
        {
          key: "sensitivityX",
          label: "Sensitivity X",
          description: "Horizontal mouse sensitivity for camera rotation.",
          type: "number",
          min: 0.0001,
          max: 0.02,
          step: 0.0001,
          get: (c: MouseLookComponent) => c.sensitivityX,
          set: (c, v) => { c.sensitivityX = Number(v); c.notifyChanged(); }
        },
        {
          key: "sensitivityY",
          label: "Sensitivity Y",
          description: "Vertical mouse sensitivity for camera rotation.",
          type: "number",
          min: 0.0001,
          max: 0.02,
          step: 0.0001,
          get: (c: MouseLookComponent) => c.sensitivityY,
          set: (c, v) => { c.sensitivityY = Number(v); c.notifyChanged(); }
        },
        {
          key: "invertY",
          label: "Invert Y",
          description: "Invert vertical mouse movement direction.",
          type: "boolean",
          get: (c: MouseLookComponent) => c.invertY,
          set: (c, v) => { c.invertY = Boolean(v); c.notifyChanged(); }
        }
      ]
    }
  };

  sensitivityX = 0.002;
  sensitivityY = 0.002;
  invertY = false;

  private yaw = 0;
  private pitch = 0;

  constructor(params?: any) {
    super();
    if (params) {
      if (params.sensitivityX !== undefined) this.sensitivityX = Number(params.sensitivityX);
      if (params.sensitivityY !== undefined) this.sensitivityY = Number(params.sensitivityY);
      if (params.invertY !== undefined) this.invertY = !!params.invertY;
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
    const mouse = input.mouse;
    // mark that this component wants pointer lock this frame
    mouse.setPointerLockWanted(true);
    const st = mouse.getState();
    if (!st.locked) return;
    const dx = st.deltaX;
    const dy = st.deltaY;
    this.yaw -= dx * this.sensitivityX;
    const inv = this.invertY ? 1 : -1;
    this.pitch += inv * dy * this.sensitivityY;
    const limit = Math.PI / 2 - 0.01;
    if (this.pitch > limit) this.pitch = limit;
    if (this.pitch < -limit) this.pitch = -limit;
    self.transform.setRotation(this.pitch, this.yaw, 0);
  }
}

export default MouseLookComponent;
