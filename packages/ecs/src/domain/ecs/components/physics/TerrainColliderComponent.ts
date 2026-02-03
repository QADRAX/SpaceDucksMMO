import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseColliderComponent, { type ColliderCommonParams } from "./BaseColliderComponent";

export type TerrainHeightfield = {
  /** Number of samples along X axis */
  columns: number;
  /** Number of samples along Z axis */
  rows: number;
  /** Row-major heights array, length = columns * rows */
  heights: number[];
  /** Total size in world units (before entity worldScale), centered at origin */
  size: { x: number; z: number };
};

export type TerrainColliderParams = {
  heightfield?: Partial<TerrainHeightfield>;
} & ColliderCommonParams;

export class TerrainColliderComponent extends BaseColliderComponent {
  readonly type = "terrainCollider";
  readonly metadata: ComponentMetadata<TerrainColliderComponent> = {
    type: "terrainCollider",
    unique: true,
    requiresInHierarchy: ["rigidBody"],
    conflicts: [
      "sphereCollider",
      "boxCollider",
      "capsuleCollider",
      "cylinderCollider",
      "coneCollider",
    ],
    inspector: {
      fields: [
        {
          key: "columns",
          label: "Columns",
          type: "number",
          default: 2,
          min: 2,
          max: 2048,
          step: 1,
          description: "Number of height samples along the X axis.",
          get: (c) => c.heightfield.columns,
          set: (c, v: number) => {
            c.heightfield.columns = Math.floor(Number(v));
            c.notifyChanged();
          },
        },
        {
          key: "rows",
          label: "Rows",
          type: "number",
          default: 2,
          min: 2,
          max: 2048,
          step: 1,
          description: "Number of height samples along the Z axis.",
          get: (c) => c.heightfield.rows,
          set: (c, v: number) => {
            c.heightfield.rows = Math.floor(Number(v));
            c.notifyChanged();
          },
        },
        {
          key: "size.x",
          label: "Size X",
          type: "number",
          default: 10,
          min: 0.01,
          max: 1000,
          step: 0.01,
          description: "Total terrain size along X in world units (before entity worldScale).",
          get: (c) => c.heightfield.size.x,
          set: (c, v: number) => {
            c.heightfield.size.x = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "size.z",
          label: "Size Z",
          type: "number",
          default: 10,
          min: 0.01,
          max: 1000,
          step: 0.01,
          description: "Total terrain size along Z in world units (before entity worldScale).",
          get: (c) => c.heightfield.size.z,
          set: (c, v: number) => {
            c.heightfield.size.z = Number(v);
            c.notifyChanged();
          },
        },
        ...this.getCommonInspectorFields(),
      ],
    },
    description:
      "Terrain collider using a heightfield grid. Requires a RigidBody on this entity or an ancestor (compound). Colliders without a RigidBody owner are ignored by physics.",
  };

  heightfield: TerrainHeightfield;
  friction?: number;
  restitution?: number;
  isSensor?: boolean;

  constructor(params?: TerrainColliderParams) {
    super();

    const columns = Math.floor(params?.heightfield?.columns ?? 2);
    const rows = Math.floor(params?.heightfield?.rows ?? 2);
    const heights = params?.heightfield?.heights ?? new Array(columns * rows).fill(0);

    this.heightfield = {
      columns,
      rows,
      heights,
      size: {
        x: params?.heightfield?.size?.x ?? 10,
        z: params?.heightfield?.size?.z ?? 10,
      },
    };

    this.initCommon(params);
  }

  validate(): string[] {
    const errors: string[] = [];
    const hf = this.heightfield;
    if (!(hf.columns >= 2 && hf.rows >= 2)) errors.push("Terrain columns/rows must be >= 2");
    if (hf.heights.length !== hf.columns * hf.rows)
      errors.push(`Terrain heights length must be columns*rows (${hf.columns * hf.rows})`);
    if (!(hf.size.x > 0 && hf.size.z > 0)) errors.push("Terrain size must be > 0");
    return errors;
  }
}

export default TerrainColliderComponent;
