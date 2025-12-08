import type { Asset, AssetVersion, AssetFile } from '@prisma/client';

/**
 * Type definitions for API responses and queries
 */

// Asset type enum
export type AssetType = 'material' | 'texture';

// Version status enum
export type VersionStatus = 'draft' | 'published' | 'deprecated';

// Asset with version count
export type AssetWithVersionCount = Asset & {
  _count: {
    versions: number;
  };
};

// Asset with full version details
export type AssetWithVersions = Asset & {
  versions: (AssetVersion & {
    _count: {
      files: number;
    };
  })[];
};

// Version with files
export type VersionWithFiles = AssetVersion & {
  files: AssetFile[];
};

// Version with files and asset
export type VersionWithFilesAndAsset = AssetVersion & {
  files: AssetFile[];
  asset: Asset;
};

// Asset with published versions and files
export type AssetWithPublishedVersions = Asset & {
  versions: (AssetVersion & {
    files: AssetFile[];
  })[];
};

// Parsed asset (with tags as array)
export type ParsedAsset = Omit<Asset, 'tags'> & {
  tags: string[];
};

// Parsed asset with version count
export type ParsedAssetWithVersionCount = ParsedAsset & {
  versionCount: number;
};

// Parsed asset with versions
export type ParsedAssetWithVersions = ParsedAsset & {
  versions: (AssetVersion & {
    fileCount: number;
    files?: AssetFile[];
  })[];
};

// Parsed version with files (for UI)
export type ParsedVersionWithFiles = AssetVersion & {
  fileCount: number;
  files: AssetFile[];
};

// Manifest entry
export interface ManifestEntry {
  assetKey: string;
  displayName: string;
  type: AssetType;
  category: string;
  tags: string[];
  version: string;
  files: ManifestFile[];
}

// Manifest file
export interface ManifestFile {
  fileName: string;
  url: string;
  size: number;
  hash: string;
  contentType: string;
  mapType?: string | null; // For material assets: PBR map type
}

// API Response types
export interface AssetListResponse {
  data: ParsedAssetWithVersionCount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VersionListResponse {
  data: VersionWithFiles[];
}

export interface ManifestResponse {
  data: ManifestEntry[];
  count: number;
}

export interface CategoryListResponse {
  data: string[];
}

export interface TagListResponse {
  data: string[];
}

// Helper function to parse tags
export function parseTags(tagsJson: string): string[] {
  try {
    const tags = JSON.parse(tagsJson);
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

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

// Helper function to parse asset
export function parseAsset<T extends Asset>(asset: T): Omit<T, 'tags'> & { tags: string[] } {
  return {
    ...asset,
    tags: parseTags(asset.tags),
  };
}
