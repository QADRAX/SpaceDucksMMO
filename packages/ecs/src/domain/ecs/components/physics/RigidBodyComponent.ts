import type { ComponentMetadata } from "../../core/ComponentMetadata";
import { Component } from "../../core/Component";

export type RigidBodyType = "static" | "dynamic" | "kinematic";

export interface RigidBodyParams {
  bodyType?: RigidBodyType;
  /** Mass in kg (used by some backends); when undefined backend defaults apply. */
  mass?: number;
  linearDamping?: number;
  angularDamping?: number;
  gravityScale?: number;
  /** If true, body starts asleep (backend permitting). */
  startSleeping?: boolean;
}

export class RigidBodyComponent extends Component {
  readonly type = "rigidBody";
  readonly metadata: ComponentMetadata<RigidBodyComponent> = {
    type: "rigidBody",
    unique: true,
    inspector: {
      fields: [
        {
          key: "bodyType",
          label: "Body Type",
          type: "enum",
          options: [
            { value: "static", label: "Static" },
            { value: "dynamic", label: "Dynamic" },
            { value: "kinematic", label: "Kinematic" },
          ],
          get: (c) => c.bodyType,
          set: (c, v) => {
            c.bodyType = String(v) as RigidBodyType;
            c.notifyChanged();
          },
        },
        {
          key: "mass",
          label: "Mass",
          type: "number",
          nullable: true,
          default: 1,
          min: 0,
          max: 100000,
          step: 0.01,
          get: (c) => c.mass,
          set: (c, v) => {
            c.mass = v === null || v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "linearDamping",
          label: "Linear Damping",
          type: "number",
          nullable: true,
          default: 0,
          min: 0,
          max: 100,
          step: 0.01,
          get: (c) => c.linearDamping,
          set: (c, v) => {
            c.linearDamping = v === null || v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "angularDamping",
          label: "Angular Damping",
          type: "number",
          nullable: true,
          default: 0,
          min: 0,
          max: 100,
          step: 0.01,
          get: (c) => c.angularDamping,
          set: (c, v) => {
            c.angularDamping = v === null || v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "gravityScale",
          label: "Gravity Scale",
          type: "number",
          nullable: true,
          default: 1,
          min: -10,
          max: 10,
          step: 0.01,
          get: (c) => c.gravityScale,
          set: (c, v) => {
            c.gravityScale = v === null || v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "startSleeping",
          label: "Start Sleeping",
          type: "boolean",
          default: false,
          get: (c) => !!c.startSleeping,
          set: (c, v) => {
            c.startSleeping = !!v;
            c.notifyChanged();
          },
        },
      ],
    },
    description: "Physics rigid body. Attach colliders on this entity and/or its child entities.",
  };

  bodyType: RigidBodyType;
  mass?: number;
  linearDamping?: number;
  angularDamping?: number;
  gravityScale?: number;
  startSleeping?: boolean;

  constructor(params?: RigidBodyParams) {
    super();
    this.bodyType = params?.bodyType ?? "dynamic";
    this.mass = params?.mass;
    this.linearDamping = params?.linearDamping;
    this.angularDamping = params?.angularDamping;
    this.gravityScale = params?.gravityScale;
    this.startSleeping = params?.startSleeping;
  }

  validate(): string[] {
    const errors: string[] = [];
    if (this.mass !== undefined && this.mass < 0) errors.push("Mass must be >= 0");
    if (this.linearDamping !== undefined && this.linearDamping < 0)
      errors.push("Linear damping must be >= 0");
    if (this.angularDamping !== undefined && this.angularDamping < 0)
      errors.push("Angular damping must be >= 0");
    return errors;
  }
}

export default RigidBodyComponent;
