import { z } from 'zod';
import type { AssetType, VersionStatus } from './types';

// Asset type validation
export const AssetTypeSchema = z.enum(['material', 'texture']) as z.ZodType<AssetType>;

export const VersionStatusSchema = z.enum(['draft', 'published', 'deprecated']) as z.ZodType<VersionStatus>;

// Create Asset Schema
export const CreateAssetSchema = z.object({
  key: z.string().min(1).max(255).regex(/^[a-zA-Z0-9\/_-]+$/, {
    message: 'Key must contain only alphanumeric characters, slashes, hyphens, and underscores',
  }),
  displayName: z.string().min(1).max(255),
  type: AssetTypeSchema,
  category: z.string().min(1).max(255),
  tags: z.array(z.string()).default([]),
});

// Update Asset Schema
export const UpdateAssetSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  category: z.string().min(1).max(255).optional(),
  tags: z.array(z.string()).optional(),
  isArchived: z.boolean().optional(),
});

// Create Version Schema
export const CreateVersionSchema = z.object({
  version: z.string().optional(),
  status: VersionStatusSchema.optional().default('draft'),
  notes: z.string().nullable().optional(),
});

// Update Version Schema
export const UpdateVersionSchema = z.object({
  status: VersionStatusSchema.optional(),
  isDefault: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

// Query params for asset listing
export const AssetQuerySchema = z.object({
  type: AssetTypeSchema.optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  query: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Query params for manifest
export const ManifestQuerySchema = z.object({
  type: AssetTypeSchema.optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
});
