import { z } from 'zod';

import {
  MATERIAL_RESOURCE_KINDS,
  RESOURCE_KINDS,
  type MaterialResourceKind,
  type ResourceKind,
} from '../kinds';

const ColorSchema = z.union([z.string(), z.number()]);

export const ResourceKindSchema = z.enum(
  RESOURCE_KINDS as unknown as [ResourceKind, ...ResourceKind[]]
);

export const MaterialComponentTypeSchema = z.enum(
  MATERIAL_RESOURCE_KINDS as unknown as [MaterialResourceKind, ...MaterialResourceKind[]]
);

export const BasicMaterialComponentDataSchema = z
  .object({
    color: ColorSchema.optional(),
    transparent: z.boolean().optional(),
    opacity: z.number().optional(),
    wireframe: z.boolean().optional(),
    texture: z.string().optional(),
    normalMap: z.string().optional(),
    envMap: z.string().optional(),
  })
  .strict();

export const LambertMaterialComponentDataSchema = z
  .object({
    color: ColorSchema.optional(),
    emissive: ColorSchema.optional(),
    transparent: z.boolean().optional(),
    opacity: z.number().optional(),
    texture: z.string().optional(),
    normalMap: z.string().optional(),
    aoMap: z.string().optional(),
    bumpMap: z.string().optional(),
    envMap: z.string().optional(),
  })
  .strict();

export const PhongMaterialComponentDataSchema = z
  .object({
    color: ColorSchema.optional(),
    specular: ColorSchema.optional(),
    shininess: z.number().optional(),
    emissive: ColorSchema.optional(),
    transparent: z.boolean().optional(),
    opacity: z.number().optional(),
    texture: z.string().optional(),
    normalMap: z.string().optional(),
    specularMap: z.string().optional(),
    aoMap: z.string().optional(),
    bumpMap: z.string().optional(),
    envMap: z.string().optional(),
  })
  .strict();

export const StandardMaterialComponentDataSchema = z
  .object({
    color: ColorSchema.optional(),
    metalness: z.number().optional(),
    roughness: z.number().optional(),
    emissive: ColorSchema.optional(),
    emissiveIntensity: z.number().optional(),
    transparent: z.boolean().optional(),
    opacity: z.number().optional(),
    texture: z.string().optional(),
    normalMap: z.string().optional(),
    envMap: z.string().optional(),
    aoMap: z.string().optional(),
    roughnessMap: z.string().optional(),
    metalnessMap: z.string().optional(),
  })
  .strict();

export const MaterialComponentSchema = z.discriminatedUnion('componentType', [
  z.object({ componentType: z.literal('basicMaterial'), componentData: BasicMaterialComponentDataSchema }),
  z.object({ componentType: z.literal('lambertMaterial'), componentData: LambertMaterialComponentDataSchema }),
  z.object({ componentType: z.literal('phongMaterial'), componentData: PhongMaterialComponentDataSchema }),
  z.object({ componentType: z.literal('standardMaterial'), componentData: StandardMaterialComponentDataSchema }),
]);

/** Aligns with `MeshData` in core-v2 (no scalar fields; geometry lives in file slots). */
export const MeshComponentDataSchema = z.object({}).strict();

/** Aligns with `AnimationClipData` in core-v2. */
export const AnimationClipComponentDataSchema = z
  .object({
    name: z.string().optional(),
  })
  .strict();

/** `SkyboxData`, `ScriptData`, `TextureData` — no scalar fields. */
export const EmptyStrictComponentDataSchema = z.object({}).strict();

/** Loose object validation for shader material `componentData` (uniforms + engine-specific fields). */
export const ShaderMaterialComponentDataSchema = z.record(z.string(), z.unknown());

export const CreateResourceSchema = z
  .object({
    kind: ResourceKindSchema,
    key: z.string().min(1),
    displayName: z.string().min(1),
  })
  .strict();

export const PatchResourceSchema = z
  .object({
    displayName: z.string().min(1).optional(),
    key: z.string().min(1).optional(),
    activeVersion: z.number().int().positive().optional(),
  })
  .strict();

export const CreateResourceVersionSchema = z
  .object({
    version: z.number().int().positive().optional(),
    /** Legacy optional; must match resource kind when provided. */
    componentType: z.string().optional(),
    componentData: z.unknown().optional(),
    files: z
      .array(
        z
          .object({
            slot: z.string().min(1),
            file: z.string().min(1),
          })
          .strict()
      )
      .optional(),
  })
  .strict();

export const ResourceZipManifestSchema = z
  .object({
    kind: ResourceKindSchema,
    key: z.string().min(1),
    displayName: z.string().min(1),
    tags: z.array(z.string().min(1)).optional(),
    version: CreateResourceVersionSchema,
  })
  .strict();

export const ResourceVersionZipManifestSchema = CreateResourceVersionSchema;
