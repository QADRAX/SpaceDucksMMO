import { z } from 'zod';

import type {
  BasicMaterialComponent,
  LambertMaterialComponent,
  PhongMaterialComponent,
  StandardMaterialComponent,
} from '@duckengine/ecs';

// Resource kinds
// For now, each Three material component type is treated as a distinct resource kind.
// This lets the API expand kinds without multiplying endpoints.
export const MATERIAL_RESOURCE_KINDS = [
  'basicMaterial',
  'lambertMaterial',
  'phongMaterial',
  'standardMaterial',
] as const;

export type MaterialResourceKind = (typeof MATERIAL_RESOURCE_KINDS)[number];

export const ResourceKindSchema = z.enum(MATERIAL_RESOURCE_KINDS);
export type ResourceKind = z.infer<typeof ResourceKindSchema>;

// Legacy compatibility (assets UI/API are being retired).
export type AssetType = 'material' | 'texture';

export type MaterialComponentType =
  | BasicMaterialComponent['type']
  | LambertMaterialComponent['type']
  | PhongMaterialComponent['type']
  | StandardMaterialComponent['type'];

export const MaterialComponentTypeSchema = z.enum(MATERIAL_RESOURCE_KINDS);

const ColorSchema = z.union([z.string(), z.number()]);

export type BasicMaterialComponentData = Partial<
  Pick<
    BasicMaterialComponent,
    'color' | 'transparent' | 'opacity' | 'wireframe' | 'texture' | 'normalMap' | 'envMap'
  >
>;

export type LambertMaterialComponentData = Partial<
  Pick<
    LambertMaterialComponent,
    'color' | 'emissive' | 'transparent' | 'opacity' | 'texture' | 'normalMap' | 'aoMap' | 'bumpMap' | 'envMap'
  >
>;

export type PhongMaterialComponentData = Partial<
  Pick<
    PhongMaterialComponent,
    | 'color'
    | 'specular'
    | 'shininess'
    | 'emissive'
    | 'transparent'
    | 'opacity'
    | 'texture'
    | 'normalMap'
    | 'specularMap'
    | 'aoMap'
    | 'bumpMap'
    | 'envMap'
  >
>;

export type StandardMaterialComponentData = Partial<
  Pick<
    StandardMaterialComponent,
    | 'color'
    | 'metalness'
    | 'roughness'
    | 'emissive'
    | 'emissiveIntensity'
    | 'transparent'
    | 'opacity'
    | 'texture'
    | 'normalMap'
    | 'envMap'
    | 'aoMap'
    | 'roughnessMap'
    | 'metalnessMap'
  >
>;

export type MaterialComponentDataByType = {
  basicMaterial: BasicMaterialComponentData;
  lambertMaterial: LambertMaterialComponentData;
  phongMaterial: PhongMaterialComponentData;
  standardMaterial: StandardMaterialComponentData;
};

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

export type MaterialComponentPayload = z.infer<typeof MaterialComponentSchema>;

export const CreateMaterialResourceSchema = z
  .object({
    key: z.string().min(1),
    displayName: z.string().min(1),
  })
  .strict();

export type CreateMaterialResourceInput = z.infer<typeof CreateMaterialResourceSchema>;

export const CreateMaterialVersionSchema = z
  .object({
    version: z.number().int().positive().optional(),
    // Deprecated (ignored). Kept for backwards compatibility with older clients/manifests.
    status: z.string().optional(),
    // Deprecated (ignored). Kept for backwards compatibility with older clients/manifests.
    isDefault: z.boolean().optional(),
    componentType: MaterialComponentTypeSchema,
    componentData: z.unknown().optional(),
  })
  .strict();

export type CreateMaterialVersionInput = z.infer<typeof CreateMaterialVersionSchema>;

// Generic resource API payloads

export const CreateResourceSchema = z
  .object({
    kind: ResourceKindSchema,
    key: z.string().min(1),
    displayName: z.string().min(1),
  })
  .strict();

export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;

export const PatchResourceSchema = z
  .object({
    displayName: z.string().min(1).optional(),
    key: z.string().min(1).optional(),
    activeVersion: z.number().int().positive().optional(),
  })
  .strict();

export type PatchResourceInput = z.infer<typeof PatchResourceSchema>;

export const PatchResourceVersionSchema = z
  .object({
    componentData: z.unknown().optional(),
  })
  .strict();

export type PatchResourceVersionInput = z.infer<typeof PatchResourceVersionSchema>;

export const CreateResourceVersionSchema = z
  .object({
    version: z.number().int().positive().optional(),
    // Deprecated (ignored). Kept for backwards compatibility with older clients/manifests.
    status: z.string().optional(),
    // Deprecated (ignored). Kept for backwards compatibility with older clients/manifests.
    isDefault: z.boolean().optional(),
    // Resource-kind-specific payload. For materials, this is the Three component data.
    componentData: z.unknown().optional(),
    // Optional legacy field: if provided, must match the resource kind.
    componentType: z.string().optional(),
    // Optional ZIP helper: explicit mapping from zip filenames to binding slots.
    // When provided, zip uploads do not require files to be named after slots.
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

export type CreateResourceVersionInput = z.infer<typeof CreateResourceVersionSchema>;

/**
 * ZIP upload manifests
 *
 * - Creating a new resource: include `resource.json` with metadata + initial `version` payload.
 * - Creating a new version: include `version.json` with the version payload.
 */

export const ResourceZipManifestSchema = z
  .object({
    kind: ResourceKindSchema,
    key: z.string().min(1),
    displayName: z.string().min(1),
    tags: z.array(z.string().min(1)).optional(),
    version: CreateResourceVersionSchema,
  })
  .strict();

export type ResourceZipManifest = z.infer<typeof ResourceZipManifestSchema>;

export const ResourceVersionZipManifestSchema = CreateResourceVersionSchema;
export type ResourceVersionZipManifest = z.infer<typeof ResourceVersionZipManifestSchema>;

export type ResolvedFile = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  sha256: string;
  url: string;
};

export type ResolvedResource = {
  key: string;
  resourceId: string;
  version: number;
  componentType: MaterialComponentType;
  componentData: Record<string, unknown>;
  files: Record<string, ResolvedFile>;
};

// Material metadata types
export type MaterialMapType = 
  | 'albedo'
  | 'normal' 
  | 'roughness'
  | 'metallic'
  | 'ao'
  | 'height'
  | 'emission';

export interface MaterialMetadata {
  materialType: 'pbr';
  maps: Partial<Record<MaterialMapType, string>>; // filename mapping
  tiling?: [number, number];
  properties?: {
    roughnessScale?: number;
    metallicScale?: number;
    normalStrength?: number;
  };
}

// Helper to detect map type from filename
export function detectMapType(filename: string): MaterialMapType | null {
  const lower = filename.toLowerCase();
  
  if (lower.includes('albedo') || lower.includes('diffuse') || lower.includes('color') || lower.includes('basecolor')) {
    return 'albedo';
  }
  if (lower.includes('normal')) {
    return 'normal';
  }
  if (lower.includes('rough')) {
    return 'roughness';
  }
  if (lower.includes('metal')) {
    return 'metallic';
  }
  if (lower.includes('ao') || lower.includes('occlusion')) {
    return 'ao';
  }
  if (lower.includes('height') || lower.includes('displacement')) {
    return 'height';
  }
  if (lower.includes('emission') || lower.includes('emissive')) {
    return 'emission';
  }
  
  return null;
}
