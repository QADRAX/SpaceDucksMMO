/** Version selector for asset resolution. */
export type ResourceVersionSelector = 'active' | 'latest' | number;

/** A resolved file within a resource, including its download URL. */
export interface ResolvedFile {
  id?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
  sha256?: string;
  /** Download URL for the file content. */
  url: string;
}

/** A fully resolved resource with its component data and associated files. */
export interface ResolvedResource {
  key: string;
  resourceId: string;
  version: number;
  componentType: string;
  componentData: Record<string, unknown>;
  files: Record<string, ResolvedFile>;
}