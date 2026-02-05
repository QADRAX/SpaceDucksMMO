/**
 * Asset version utilities
 * Helpers for selecting the appropriate version to display
 */

export interface AssetVersion {
  id: string;
  version: string;
  status: string; // "draft" | "published" | "deprecated"
  isDefault: boolean;
  files?: Array<{
    fileName: string;
    mapType: string | null;
  }>;
}

/**
 * Selects the best version to use for preview
 * Priority:
 * 1. Default version (if published or draft)
 * 2. Latest published version
 * 3. Latest draft version
 * 4. Any version
 */
export function selectPreviewVersion(versions: AssetVersion[]): AssetVersion | null {
  if (versions.length === 0) return null;

  // Try to find default version
  const defaultVersion = versions.find(v => v.isDefault);
  if (defaultVersion && (defaultVersion.status === 'published' || defaultVersion.status === 'draft')) {
    return defaultVersion;
  }

  // Find latest published version
  const publishedVersions = versions.filter(v => v.status === 'published');
  if (publishedVersions.length > 0) {
    return publishedVersions[publishedVersions.length - 1];
  }

  // Find latest draft version
  const draftVersions = versions.filter(v => v.status === 'draft');
  if (draftVersions.length > 0) {
    return draftVersions[draftVersions.length - 1];
  }

  // Return first available version
  return versions[0];
}
