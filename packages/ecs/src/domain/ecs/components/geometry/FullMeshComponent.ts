import BaseGeometryComponent, { Vector3Like } from "./BaseGeometryComponent";
import type { ComponentMetadata } from "../../core/ComponentMetadata";

export class FullMeshComponent extends BaseGeometryComponent {
  readonly type = "fullMesh";
  readonly metadata: ComponentMetadata = {
    type: "fullMesh",
    label: "Full Mesh",
    description:
      "Loads a full GLB asset (scene graph, materials, textures, animations). Use to attach complex meshes with animations.",
    category: "Rendering",
    icon: "FullMesh",
    unique: true,
    requires: [],
    conflicts: [
      "skybox",
      // Full mesh is a geometry source; keep it mutually-exclusive with other geometry components.
      "boxGeometry",
      "sphereGeometry",
      "planeGeometry",
      "cylinderGeometry",
      "coneGeometry",
      "torusGeometry",
      "customGeometry",
      // FullMesh should use embedded GLB materials; do not allow overrides.
      "standardMaterial",
      "basicMaterial",
      "phongMaterial",
      "lambertMaterial",
      "shaderMaterial",
      "textureTiling",
    ],
    inspector: {
      fields: [
        {
          key: "key",
          label: "Mesh Key",
          type: "string",
          description: "Resource key for a GLB resource (web-core resource key).",
          default: "",
          get: (c: FullMeshComponent) => c.key,
          set: (c, v) => {
            c.key = String(v ?? "");
            c.notifyChanged();
          },
        },
        {
          key: "boundingRadius",
          label: "Bounding Radius",
          type: "number",
          nullable: true,
          description:
            "Optional override used by ECS-only features. When omitted a safe fallback is used until mesh bounds are known.",
          min: 0.0001,
          step: 0.01,
          get: (c: FullMeshComponent) => c.boundingRadius,
          set: (c, v) => {
            const n = v === null || v === undefined || v === "" ? undefined : Number(v);
            c.boundingRadius = Number.isFinite(n as number) ? (n as number) : undefined;
            c.notifyChanged();
          },
        },
        {
          key: "castShadow",
          label: "Cast Shadow",
          type: "boolean",
          default: false,
          get: (c: FullMeshComponent) => c.castShadow,
          set: (c, v) => {
            c.castShadow = Boolean(v);
            c.notifyChanged();
          },
        },
        {
          key: "receiveShadow",
          label: "Receive Shadow",
          type: "boolean",
          default: true,
          get: (c: FullMeshComponent) => c.receiveShadow,
          set: (c, v) => {
            c.receiveShadow = Boolean(v);
            c.notifyChanged();
          },
        },
        {
          key: "animation.clipName",
          label: "Animation Clip",
          type: "string",
          description: "Optional name of the animation clip to play by default (if present in GLB).",
          default: "",
          get: (c: FullMeshComponent) => c.animation?.clipName ?? "",
          set: (c, v) => {
            c.animation = c.animation || {};
            c.animation.clipName = String(v ?? "");
            c.notifyChanged();
          },
        },
        {
          key: "animation.loop",
          label: "Loop Animation",
          type: "boolean",
          default: true,
          get: (c: FullMeshComponent) => Boolean(c.animation?.loop ?? true),
          set: (c, v) => {
            c.animation = c.animation || {};
            c.animation.loop = Boolean(v);
            c.notifyChanged();
          },
        },
        {
          key: "animation.playing",
          label: "Playing",
          type: "boolean",
          default: true,
          get: (c: FullMeshComponent) => Boolean(c.animation?.playing ?? true),
          set: (c, v) => {
            c.animation = c.animation || {};
            c.animation.playing = Boolean(v);
            c.notifyChanged();
          },
        },
      ],
    },
  };

  key: string;
  boundingRadius?: number;
  castShadow: boolean;
  receiveShadow: boolean;

  /** Animation settings */
  animation?: { clipName?: string; loop?: boolean; time?: number; playing?: boolean };

  constructor(params?: {
    key?: string;
    boundingRadius?: number;
    castShadow?: boolean;
    receiveShadow?: boolean;
    animation?: { clipName?: string; loop?: boolean; time?: number; playing?: boolean };
  }) {
    super();
    this.key = params?.key ?? "";
    this.boundingRadius = params?.boundingRadius;
    this.castShadow = params?.castShadow ?? false;
    this.receiveShadow = params?.receiveShadow ?? true;
    this.animation = params?.animation;
  }

  getBoundingRadius(worldScale: Vector3Like): number {
    const scale = worldScale?.x ?? 1;
    if (typeof this.boundingRadius === "number" && Number.isFinite(this.boundingRadius)) {
      return Math.max(0, this.boundingRadius) * scale;
    }
    return 1 * scale;
  }
}

export default FullMeshComponent;
